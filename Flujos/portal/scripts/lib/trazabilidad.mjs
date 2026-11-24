/**
 * lib/trazabilidad.mjs — Pantallas, historias de usuario (HU), commits y despliegues de cada flujo.
 *
 * Fuentes (nada se inventa; lo que no existe se muestra vacío):
 *   catalogo.json                    Flujos y sus HU (se reutiliza: una HU vive una sola vez por flujo).
 *   trazabilidad/<flujo>.json        Pantallas registradas del flujo y relaciones HU ↔ pantalla.
 *   despliegues.json                 Publicaciones efectivas, con evidencia. Vacío hasta que se registre una.
 *   ../versiones/<flujo>/v<x>/       Versiones publicadas (manifiestos inmutables).
 *   git (solo lectura)               Commits del flujo y commits transversales.
 *
 * Toda regla de pertenencia vive aquí (servidor/build), no en la interfaz. El navegador solo
 * muestra el resultado. Las operaciones lanzan ErrTraz con un código estable y un mensaje para la persona.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, git, matcher, walk } from './fuentes.mjs';

export class ErrTraz extends Error {
  constructor(codigo, mensaje, extra = {}, estado = 422) { super(mensaje); this.codigo = codigo; this.estado = estado; this.extra = extra; }
}
const fallo = (codigo, mensaje, extra, estado) => { throw new ErrTraz(codigo, mensaje, extra, estado); };

export const ESTADOS_DESPLIEGUE = ['publicado', 'en-proceso', 'fallido', 'revertido'];
const RE_ID_FLUJO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RE_HU = /^HU-\d{1,6}$/;
const RE_VERSION = /^\d+\.\d+\.\d+$/;
const RE_HASH = /^[0-9a-f]{7,40}$/;
const ENTORNOS_POR_DEFECTO = [{ id: 'local', nombre: 'Local', hosts: ['localhost', '127.0.0.1'], protocolos: ['http:'], base: '/' }];

/* ---------- contexto ---------- */
export function contexto(o = {}) {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'fuentes.json'), 'utf8')); } catch { /* sin config */ }
  return {
    catalogoPath: o.catalogoPath || process.env.PORTAL_CATALOGO || path.join(ROOT, 'catalogo.json'),
    trazDir: o.trazDir || process.env.PORTAL_TRAZABILIDAD || path.join(ROOT, 'trazabilidad'),
    desplieguesPath: o.desplieguesPath || process.env.PORTAL_DESPLIEGUES || path.join(ROOT, 'despliegues.json'),
    protoRoot: o.protoRoot || path.resolve(ROOT, cfg.flujos?.repo || '../prototipos'),
    plataformas: o.plataformas || Object.keys(cfg.plataformas || { zt: 1, drupal: 1, app: 1 }),
    entornos: o.entornos || cfg.trazabilidad?.entornos || ENTORNOS_POR_DEFECTO,
    hostsAzure: o.hostsAzure || cfg.trazabilidad?.hostsAzure || ['dev.azure.com'],
    versiones: o.versiones || null, // función (id) → manifiestos; por defecto, el almacén real
  };
}
const leerJson = (p, defecto) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return defecto; throw e; } };
function escribirJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(tmp, p);
}
export const leerCatalogo = (ctx) => JSON.parse(fs.readFileSync(ctx.catalogoPath, 'utf8'));
function flujoDe(cat, id) {
  if (typeof id !== 'string' || !RE_ID_FLUJO.test(id)) fallo('flujo_invalido', 'Identificador de flujo no válido.', {}, 400);
  const f = cat.flujos.find((x) => x.id === id);
  if (!f) fallo('flujo_inexistente', 'El flujo no existe en el catálogo.', {}, 404);
  return f;
}
const archivoRegistro = (ctx, id) => path.join(ctx.trazDir, `${id}.json`);
export function leerRegistro(ctx, id) {
  const r = leerJson(archivoRegistro(ctx, id), null);
  return r || { schemaVersion: 1, flujo: id, pantallas: [], relaciones: [] };
}
const ahora = () => new Date().toISOString();
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

/* ---------- pertenencia de rutas ---------- */
const segmentos = (p) => p.split('/').filter(Boolean);
const empiezaPorSegmentos = (rel, base) => { const a = segmentos(rel), b = segmentos(base); return b.length <= a.length && b.every((s, i) => a[i] === s); };
/** ¿Esta ruta (relativa a Flujos/prototipos/) es del flujo? Segmento a segmento, nunca por prefijo de texto. */
export function perteneceAlFlujo(f, rel) {
  if (empiezaPorSegmentos(rel, f.ruta)) return true;
  return Array.isArray(f.incluir) && f.incluir.length > 0 && matcher(f.incluir)(rel);
}
export const flujosDeRuta = (cat, rel) => cat.flujos.filter((f) => perteneceAlFlujo(f, rel));

/**
 * Analiza y normaliza una URL o ruta de pantalla. Devuelve { rel, flujoId, entorno, version, existe }.
 * Rechaza: protocolos no http(s), credenciales, orígenes no registrados, rutas con «.», «..», «//»,
 * barras invertidas, codificaciones de separadores, archivos que no son .html, rutas sin flujo o
 * que coinciden con más de un flujo. No consulta la red.
 */
/**
 * Punto de inicio de una HU dentro de su pantalla: la parte «?consulta#ancla» de la URL
 * (p. ej. «?estado=error#lista»). Acepta solo esa parte o una URL/ruta completa, de la que
 * se toma lo que va desde «?» o «#». Devuelve '' si no hay punto de inicio.
 */
export function normalizarInicio(entrada) {
  const s = String(entrada ?? '').trim();
  if (!s) return '';
  const i = s.search(/[?#]/);
  if (i < 0) fallo('inicio_invalido', 'El punto de inicio debe empezar por «?» o «#», por ejemplo ?estado=error o #paso-2.');
  const t = s.slice(i);
  if (t.length > 300) fallo('inicio_invalido', 'El punto de inicio admite hasta 300 caracteres.');
  if (/[\u0000-\u001f\u007f\\\s<>"'`]/.test(t)) fallo('inicio_invalido', 'El punto de inicio contiene caracteres no permitidos.');
  if (t === '?' || t === '#' || t === '?#') return '';
  return t;
}
export function resolverPantalla(entrada, ctx, cat = leerCatalogo(ctx)) {
  const s = String(entrada ?? '').trim();
  if (!s) fallo('url_vacia', 'Indica la URL o la ruta de la pantalla.');
  if (s.length > 2048) fallo('url_invalida', 'La URL es demasiado larga.');
  if (/[\u0000-\u001f\u007f\\\s]/.test(s)) fallo('url_invalida', 'La URL contiene caracteres no permitidos.');
  let crudo; let entorno = null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    let u; try { u = new URL(s); } catch { fallo('url_invalida', 'La URL no es válida.'); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') fallo('protocolo_no_permitido', 'Solo se aceptan enlaces http o https del portal.');
    if (u.username || u.password) fallo('url_invalida', 'La URL no puede incluir usuario ni contraseña.');
    entorno = ctx.entornos.find((e) => (e.protocolos || ['https:']).includes(u.protocol) && (e.hosts || []).includes(u.hostname)) || null;
    if (!entorno) fallo('origen_no_permitido', 'La URL no pertenece a un entorno registrado del portal. Solo se aceptan pantallas internas.');
    if (!/^https?:\/\//i.test(s)) fallo('url_invalida', 'La URL no es válida.');
    crudo = s.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i, '').split(/[?#]/)[0] || '/';
  } else {
    if (s.startsWith('//')) fallo('ruta_ambigua', 'La ruta es ambigua.');
    crudo = s.split(/[?#]/)[0];
    if (!crudo.startsWith('/')) crudo = '/' + crudo;
  }
  const partes = crudo.split('/').slice(1);
  const terminaEnBarra = partes.length > 1 && partes[partes.length - 1] === '';
  if (terminaEnBarra) partes.pop();
  const segs = partes.map((seg) => {
    if (seg === '' ) fallo('ruta_ambigua', 'La ruta contiene segmentos vacíos (//).');
    if (/%2f|%5c|%00/i.test(seg)) fallo('ruta_ambigua', 'La ruta contiene separadores codificados.');
    let d; try { d = decodeURIComponent(seg); } catch { fallo('url_invalida', 'La URL tiene codificación no válida.'); }
    if (d === '.' || d === '..' || /[\/\\\u0000-\u001f]/.test(d)) fallo('ruta_ambigua', 'La ruta contiene segmentos relativos (. o ..).');
    if (/%[0-9a-f]{2}/i.test(d)) fallo('ruta_ambigua', 'La ruta está codificada más de una vez.');
    return d;
  });
  let resto = segs;
  const base = segmentos(entorno?.base || '/');
  if (base.length) { if (!base.every((b, i) => segs[i] === b)) fallo('ruta_no_prototipo', 'La URL no apunta a un prototipo del portal.'); resto = segs.slice(base.length); }
  let flujoForzado = null; let version = null;
  if (resto[0] === 'p') resto = resto.slice(1);
  else if (resto[0] === 'versiones') {
    flujoForzado = resto[1]; version = (/^v(\d+\.\d+\.\d+)$/.exec(resto[2] || '') || [])[1] || null;
    if (!flujoForzado || !version || !cat.flujos.some((f) => f.id === flujoForzado)) fallo('ruta_no_prototipo', 'La ruta de versión no corresponde a un flujo y versión del portal.');
    resto = resto.slice(3);
  } else if (!ctx.plataformas.includes(resto[0])) fallo('ruta_no_prototipo', 'La URL no apunta a un prototipo del portal.');
  if (!resto.length) fallo('ruta_no_prototipo', 'La URL no apunta a una pantalla.');
  let rel = resto.join('/');
  if (terminaEnBarra || !/\.[a-z0-9]+$/i.test(resto[resto.length - 1])) rel += '/index.html';
  if (!/\.html$/i.test(rel)) fallo('no_es_pantalla', 'La ruta no corresponde a una pantalla HTML.');
  const dueños = flujosDeRuta(cat, rel);
  if (!dueños.length) fallo('sin_flujo', 'La ruta no pertenece a ningún flujo registrado en el catálogo.');
  if (dueños.length > 1) fallo('ruta_ambigua', `La ruta coincide con más de un flujo (${dueños.map((d) => d.nombre).join(', ')}).`);
  if (flujoForzado && dueños[0].id !== flujoForzado) fallo('ruta_ambigua', 'La ruta de la versión no corresponde al flujo indicado.');
  const completa = path.resolve(ctx.protoRoot, rel);
  const existe = completa.startsWith(path.resolve(ctx.protoRoot) + path.sep) && fs.existsSync(completa) && fs.statSync(completa).isFile();
  return { rel, flujoId: dueños[0].id, entorno: entorno?.id || null, version, existe, inicio: /[?#]/.test(s) ? normalizarInicio(s) : '' };
}
function exigirDelFlujo(res, f) {
  if (res.flujoId !== f.id) {
    fallo('otro_flujo', `Esta pantalla pertenece a otro flujo. Solo puedes vincular historias de usuario a pantallas de ${f.nombre}.`, { flujoDetectado: res.flujoId });
  }
}

/* ---------- Azure DevOps ---------- */
export function validarUrlAzure(s, ctx) {
  const t = String(s ?? '').trim();
  if (!t) return null;
  let u; try { u = new URL(t); } catch { fallo('azure_invalida', 'La URL de Azure DevOps no es válida.'); }
  if (u.protocol !== 'https:' || u.username || u.password || !ctx.hostsAzure.includes(u.hostname)) fallo('azure_invalida', 'La URL de Azure DevOps debe ser https y pertenecer a dev.azure.com.');
  const m = /^\/([^/]+)\/([^/]+)\/_workitems\/edit\/(\d+)\/?$/.exec(u.pathname);
  if (!m) fallo('azure_invalida', 'La URL debe apuntar a un work item: …/_workitems/edit/<número>.');
  return { url: `https://${u.hostname}/${m[1]}/${m[2]}/_workitems/edit/${m[3]}`, id: m[3] };
}
export function normalizarCodigoHu(s) {
  const m = /^\s*hu[\s_-]*(\d{1,6})\s*$/i.exec(String(s ?? ''));
  return m ? `HU-${Number(m[1]).toString().padStart(3, '0')}` : null;
}

/* ---------- HU ---------- */
/** Prepara (sin escribir) el alta o reutilización de una HU en el flujo. */
function prepararHu(cat, f, datos, ctx) {
  const codigo = normalizarCodigoHu(datos.codigo);
  if (!codigo || !RE_HU.test(codigo)) fallo('hu_invalida', 'El identificador debe tener el formato HU-297.');
  // Una HU ya registrada en el flujo se reutiliza tal cual: sus datos no se revalidan aquí
  // (se editan con hu-editar), así un dato heredado no bloquea nuevas vinculaciones.
  const existente = (f.hu || []).find((h) => normalizarCodigoHu(h.codigo) === codigo);
  if (existente) return { hu: existente, nueva: false };
  const azure = validarUrlAzure(datos.url, ctx);
  const titulo = String(datos.titulo ?? '').trim();
  if (titulo.length < 3 || titulo.length > 200) fallo('titulo_invalido', 'Escribe el nombre de la historia (entre 3 y 200 caracteres).');
  const descripcion = String(datos.descripcion ?? '').trim();
  if (descripcion.length > 2000) fallo('descripcion_larga', 'La descripción admite hasta 2000 caracteres.');
  // Identidad: el mismo código en otro flujo solo es la misma HU si coincide el work item o el título.
  for (const o of cat.flujos) {
    if (o.id === f.id) continue;
    const h = (o.hu || []).find((x) => normalizarCodigoHu(x.codigo) === codigo);
    if (!h) continue;
    const mismoItem = azure && h.id && azure.id === String(h.id);
    const mismoTitulo = norm(h.titulo) === norm(titulo);
    const itemsDistintos = azure && h.id && azure.id !== String(h.id);
    if (itemsDistintos || (!mismoItem && !mismoTitulo)) {
      fallo('hu_conflicto', `${codigo} ya existe en «${o.nombre}» como «${h.titulo}». Verifica que sea la misma historia (mismo work item o mismo nombre) antes de registrarla aquí.`, { flujo: o.id });
    }
  }
  const hu = { id: azure?.id || null, codigo, titulo };
  if (azure) hu.url = azure.url;
  if (descripcion) hu.descripcion = descripcion;
  if (!hu.id) delete hu.id;
  return { hu, nueva: true };
}

/* ---------- pantallas ---------- */
const nuevoIdPantalla = () => 'scr-' + crypto.randomBytes(4).toString('hex');
function prepararPantalla(reg, f, res, datos) {
  const nombre = String(datos.nombre ?? '').trim();
  if (nombre.length < 2 || nombre.length > 120) fallo('nombre_invalido', 'Escribe el nombre de la pantalla (entre 2 y 120 caracteres).');
  const descripcion = String(datos.descripcion ?? '').trim();
  if (descripcion.length > 600) fallo('descripcion_larga', 'La descripción de la pantalla admite hasta 600 caracteres.');
  if (!res.existe) fallo('pantalla_inexistente', 'La ruta no corresponde a un archivo existente del prototipo.');
  if (reg.pantallas.some((p) => p.ruta === res.rel)) fallo('pantalla_duplicada', 'Esa pantalla ya está registrada en este flujo.');
  const p = { id: nuevoIdPantalla(), flujo: f.id, nombre, ruta: res.rel, registradaEl: ahora() };
  if (descripcion) p.descripcion = descripcion;
  return p;
}
export function registrarPantalla(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); const f = flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const res = resolverPantalla(datos.url ?? datos.ruta, ctx, cat); exigirDelFlujo(res, f);
  const p = prepararPantalla(reg, f, res, datos);
  reg.pantallas.push(p); escribirJson(archivoRegistro(ctx, flujoId), reg);
  return { pantalla: p, proyeccion: proyeccion(flujoId, ctx) };
}
export function editarPantalla(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); const f = flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const p = reg.pantallas.find((x) => x.id === datos.id);
  if (!p) fallo('pantalla_inexistente', 'La pantalla no está registrada en este flujo.', {}, 404);
  if (datos.nombre !== undefined) {
    const n = String(datos.nombre).trim(); if (n.length < 2 || n.length > 120) fallo('nombre_invalido', 'Escribe el nombre de la pantalla (entre 2 y 120 caracteres).'); p.nombre = n;
  }
  if (datos.descripcion !== undefined) { const d = String(datos.descripcion).trim(); if (d.length > 600) fallo('descripcion_larga', 'La descripción de la pantalla admite hasta 600 caracteres.'); if (d) p.descripcion = d; else delete p.descripcion; }
  if (datos.ruta !== undefined || datos.url !== undefined) {
    const res = resolverPantalla(datos.url ?? datos.ruta, ctx, cat); exigirDelFlujo(res, f);
    if (!res.existe) fallo('pantalla_inexistente', 'La ruta no corresponde a un archivo existente del prototipo.');
    if (reg.pantallas.some((x) => x.id !== p.id && x.ruta === res.rel)) fallo('pantalla_duplicada', 'Esa ruta ya está registrada en otra pantalla.');
    p.ruta = res.rel; // el identificador no cambia: las relaciones se conservan
  }
  p.actualizadaEl = ahora();
  escribirJson(archivoRegistro(ctx, flujoId), reg);
  return { pantalla: p, proyeccion: proyeccion(flujoId, ctx) };
}

/* ---------- relaciones HU ↔ pantalla ---------- */
/**
 * Vincula una HU a una pantalla del flujo. `pantalla`: { id } de una registrada, o { url } (se valida).
 * Si la URL es del flujo pero la pantalla no está registrada, falla con `pantalla_no_registrada` y la
 * propuesta; solo se registra si llega `registrarPantalla: { nombre, confirmar: true }`.
 * La HU se reutiliza si ya existe; no se duplica.
 */
export function vincular(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); const f = flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const ps = datos.pantalla || {};
  let pantalla; let registrada = false; let inicioUrl = '';
  if (ps.id) {
    pantalla = reg.pantallas.find((p) => p.id === ps.id);
    if (!pantalla) fallo('pantalla_inexistente', 'La pantalla no está registrada en este flujo.', {}, 404);
  } else {
    const res = resolverPantalla(ps.url, ctx, cat); exigirDelFlujo(res, f); inicioUrl = res.inicio;
    pantalla = reg.pantallas.find((p) => p.ruta === res.rel);
    if (!pantalla) {
      const conf = datos.registrarPantalla;
      if (!conf || conf.confirmar !== true) fallo('pantalla_no_registrada', 'La pantalla pertenece a este flujo, pero todavía no está registrada. Confírmala para registrarla y vincularla.', { propuesta: { ruta: res.rel, existe: res.existe } });
      pantalla = prepararPantalla(reg, f, res, conf); reg.pantallas.push(pantalla); registrada = true;
    }
  }
  const { hu, nueva } = prepararHu(cat, f, datos.hu || {}, ctx);
  if (reg.relaciones.some((r) => r.hu === hu.codigo && r.pantalla === pantalla.id)) fallo('relacion_duplicada', `${hu.codigo} ya está vinculada a «${pantalla.nombre}».`);
  const nota = String(datos.nota ?? '').trim();
  if (nota.length > 600) fallo('nota_larga', 'La nota de la relación admite hasta 600 caracteres.');
  // El campo explícito manda; si no viene, se usa el «?…#…» de la URL pegada.
  const inicio = datos.inicio !== undefined && String(datos.inicio).trim() ? normalizarInicio(datos.inicio) : inicioUrl;
  const rel = { hu: hu.codigo, pantalla: pantalla.id, flujo: f.id, creadaEl: ahora() };
  if (nota) rel.nota = nota;
  if (inicio) rel.inicio = inicio;
  // Todo validado: ahora se escribe (HU primero; si falla la segunda escritura, la HU queda reutilizable).
  if (nueva) { f.hu = [...(f.hu || []), hu]; escribirJson(ctx.catalogoPath, cat); }
  reg.relaciones.push(rel); escribirJson(archivoRegistro(ctx, flujoId), reg);
  return { relacion: rel, huNueva: nueva, pantallaRegistrada: registrada, proyeccion: proyeccion(flujoId, ctx) };
}
export function editarRelacion(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const r = reg.relaciones.find((x) => x.hu === normalizarCodigoHu(datos.hu) && x.pantalla === datos.pantalla);
  if (!r) fallo('relacion_inexistente', 'La relación no existe.', {}, 404);
  const nota = String(datos.nota ?? '').trim();
  if (nota.length > 600) fallo('nota_larga', 'La nota de la relación admite hasta 600 caracteres.');
  if (nota) r.nota = nota; else delete r.nota;
  if (datos.inicio !== undefined) { const inicio = normalizarInicio(datos.inicio); if (inicio) r.inicio = inicio; else delete r.inicio; }
  r.actualizadaEl = ahora();
  escribirJson(archivoRegistro(ctx, flujoId), reg);
  return { relacion: r, proyeccion: proyeccion(flujoId, ctx) };
}
/** Quita la relación. La HU global y la pantalla se conservan. */
export function desvincular(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const codigo = normalizarCodigoHu(datos.hu);
  const antes = reg.relaciones.length;
  reg.relaciones = reg.relaciones.filter((x) => !(x.hu === codigo && x.pantalla === datos.pantalla));
  if (reg.relaciones.length === antes) fallo('relacion_inexistente', 'La relación no existe.', {}, 404);
  escribirJson(archivoRegistro(ctx, flujoId), reg);
  return { proyeccion: proyeccion(flujoId, ctx) };
}
export function editarHu(flujoId, datos, ctx) {
  const cat = leerCatalogo(ctx); const f = flujoDe(cat, flujoId);
  const codigo = normalizarCodigoHu(datos.codigo);
  const h = (f.hu || []).find((x) => normalizarCodigoHu(x.codigo) === codigo);
  if (!h) fallo('hu_inexistente', 'La HU no existe en este flujo.', {}, 404);
  if (datos.titulo !== undefined) { const t = String(datos.titulo).trim(); if (t.length < 3 || t.length > 200) fallo('titulo_invalido', 'Escribe el nombre de la historia (entre 3 y 200 caracteres).'); h.titulo = t; }
  if (datos.descripcion !== undefined) { const d = String(datos.descripcion).trim(); if (d.length > 2000) fallo('descripcion_larga', 'La descripción admite hasta 2000 caracteres.'); if (d) h.descripcion = d; else delete h.descripcion; }
  if (datos.url !== undefined) {
    const a = validarUrlAzure(datos.url, ctx);
    if (a) { h.url = a.url; h.id = a.id; } else { delete h.url; }
  }
  escribirJson(ctx.catalogoPath, cat);
  return { hu: h, proyeccion: proyeccion(flujoId, ctx) };
}

/* ---------- lectura: proyección por flujo (lo que consume la interfaz) ---------- */
function archivosDelFlujo(ctx, f) {
  const base = ctx.protoRoot;
  const dir = f.ruta.split('/')[0];
  if (!fs.existsSync(path.join(base, dir))) return [];
  return walk(path.join(base, dir)).map((r) => `${dir}/${r}`).filter((rel) => perteneceAlFlujo(f, rel));
}
const esCompartido = (rel) => /(^|\/)shared\//.test(rel);
export const pantallasDelFlujo = (ctx, f) => archivosDelFlujo(ctx, f).filter((rel) => rel.endsWith('.html') && !esCompartido(rel)).sort();
/** Archivos compartidos (shared/) que las pantallas, estilos y scripts del flujo referencian de forma directa. */
export function recursosCompartidosUsados(ctx, f) {
  const usados = new Set();
  const RE = /["'(]\s*((?:\.{1,2}\/)+[^"'()\s?#]*shared\/[^"'()\s?#]*)/g;
  for (const rel of archivosDelFlujo(ctx, f).filter((r) => /\.(html|css|js)$/.test(r) && !esCompartido(r))) {
    let txt; try { txt = fs.readFileSync(path.join(ctx.protoRoot, rel), 'utf8'); } catch { continue; }
    let m; RE.lastIndex = 0;
    while ((m = RE.exec(txt))) {
      const destino = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      if (!destino.startsWith('..') && esCompartido(destino) && fs.existsSync(path.join(ctx.protoRoot, destino))) usados.add(destino);
    }
  }
  return usados;
}
export function proyeccion(flujoId, ctx, cat = leerCatalogo(ctx)) {
  const f = flujoDe(cat, flujoId); const reg = leerRegistro(ctx, flujoId);
  const hus = (f.hu || []).map((h) => ({
    ...h,
    pantallas: reg.relaciones.filter((r) => r.hu === normalizarCodigoHu(h.codigo)).map((r) => r.pantalla),
  }));
  const pantallas = reg.pantallas.map((p) => ({
    ...p,
    existe: fs.existsSync(path.join(ctx.protoRoot, p.ruta)),
    hu: reg.relaciones.filter((r) => r.pantalla === p.id).map((r) => r.hu),
  }));
  const registradas = new Set(reg.pantallas.map((p) => p.ruta));
  return {
    pantallas, hu: hus,
    relaciones: reg.relaciones,
    pantallasDetectadas: pantallasDelFlujo(ctx, f).filter((r) => !registradas.has(r)),
  };
}

/** Integridad de un registro (el build falla si hay errores). */
export function validarRegistro(flujoId, ctx, cat = leerCatalogo(ctx)) {
  const errores = []; const f = cat.flujos.find((x) => x.id === flujoId);
  if (!f) return [`${flujoId}: el flujo no existe en el catálogo`];
  const reg = leerRegistro(ctx, flujoId);
  if (reg.flujo !== flujoId) errores.push(`${flujoId}: el registro declara el flujo «${reg.flujo}»`);
  const ids = new Set(); const rutas = new Set();
  for (const p of reg.pantallas) {
    if (!p.id || ids.has(p.id)) errores.push(`${flujoId}: identificador de pantalla repetido o vacío (${p.id})`);
    ids.add(p.id);
    if (p.flujo !== flujoId) errores.push(`${flujoId}: la pantalla ${p.id} declara el flujo «${p.flujo}»`);
    if (!perteneceAlFlujo(f, p.ruta)) errores.push(`${flujoId}: la ruta ${p.ruta} (${p.id}) no pertenece al flujo`);
    if (rutas.has(p.ruta)) errores.push(`${flujoId}: la ruta ${p.ruta} está registrada dos veces`);
    rutas.add(p.ruta);
  }
  const codigos = new Set((f.hu || []).map((h) => normalizarCodigoHu(h.codigo)).filter(Boolean));
  const pares = new Set();
  for (const r of reg.relaciones) {
    if (r.flujo !== flujoId) errores.push(`${flujoId}: la relación ${r.hu}↔${r.pantalla} declara el flujo «${r.flujo}»`);
    if (!codigos.has(r.hu)) errores.push(`${flujoId}: la relación apunta a ${r.hu}, que no está entre las HU del flujo`);
    if (!ids.has(r.pantalla)) errores.push(`${flujoId}: la relación apunta a la pantalla ${r.pantalla}, que no está registrada`);
    if (r.inicio !== undefined) { try { if (normalizarInicio(r.inicio) !== r.inicio) throw 0; } catch { errores.push(`${flujoId}: la relación ${r.hu}↔${r.pantalla} tiene un punto de inicio no válido`); } }
    const k = `${r.hu}|${r.pantalla}`; if (pares.has(k)) errores.push(`${flujoId}: relación duplicada ${r.hu}↔${r.pantalla}`); pares.add(k);
  }
  return errores;
}

/* ---------- versiones: pantallas de cada publicación y comparación verificable ---------- */
/** Pantallas HTML que formaban parte de una versión publicada: salen del manifiesto (huellas SHA-256). */
export function pantallasDeVersion(manifiesto, f) {
  return Object.entries(manifiesto.archivos || {})
    .filter(([rel]) => rel.endsWith('.html') && perteneceAlFlujo(f, rel))
    .map(([ruta, sha]) => ({ ruta, huella: sha.slice(0, 12) }))
    .sort((a, b) => a.ruta.localeCompare(b.ruta));
}

/* ---------- commits del flujo ---------- */
function remotoGithub(fl) {
  try {
    const u = git(fl.repo, ['remote', 'get-url', 'origin']).toString().trim();
    const m = /^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(u);
    return m ? `https://github.com/${m[1]}` : null;
  } catch { return null; }
}
const cacheRemoto = new Map();
/** Enlace al commit en el repositorio remoto, solo si el commit ya fue subido (si no, el enlace daría 404). */
export function enlaceCommit(fl, hash) {
  if (!cacheRemoto.has(fl.repo)) cacheRemoto.set(fl.repo, { remoto: remotoGithub(fl), subidos: hashesSubidos(fl) });
  const { remoto, subidos } = cacheRemoto.get(fl.repo);
  return { subido: subidos ? subidos.has(hash) : null, url: remoto && subidos && subidos.has(hash) ? `${remoto}/commit/${hash}` : null };
}
function hashesSubidos(fl) {
  try { return new Set(git(fl.repo, ['rev-list', 'origin/main']).toString().split('\n').filter(Boolean)); } catch { return null; }
}
function leerCommits(fl, rutas, n, extra) {
  let out = '';
  try { out = git(fl.repo, ['log', `-n${n}`, '--relative', '--name-only', '--format=%x1e%H%x1f%an%x1f%aI%x1f%s', fl.gitRef || 'HEAD', '--', ...rutas]).toString(); } catch { return []; }
  return out.split('\x1e').filter((b) => b.trim()).map((b) => {
    const [cab, ...arch] = b.split('\n');
    const [hash, autor, fecha, mensaje] = cab.split('\x1f');
    const archivos = arch.map((a) => a.trim()).filter(Boolean);
    return { hash, corto: hash.slice(0, 7), autor, fecha, mensaje, todos: archivos, ...extra };
  });
}
/**
 * Commits que tocaron el flujo (propios) y commits sobre recursos compartidos que el flujo usa (transversales).
 * Un commit transversal NO se atribuye al flujo: se muestra aparte y con su alcance.
 */
export function commitsDelFlujo(fl, f, ctx, n = 15) {
  const LIM = 40;
  const propios = leerCommits(fl, f.incluir || [f.ruta], n, { alcance: 'propio' });
  const hashes = new Set(propios.map((c) => c.hash));
  const usados = recursosCompartidosUsados(ctx, f);
  const sharedRutas = [`${f.plataforma}/shared`, 'shared'].filter((r) => fs.existsSync(path.join(ctx.protoRoot, r)));
  // Solo cuentan los commits que cambian un recurso compartido que este flujo referencia.
  const transversales = usados.size && sharedRutas.length
    ? leerCommits(fl, sharedRutas, 60, { alcance: 'transversal' })
      .map((c) => ({ ...c, todos: c.todos.filter((a) => usados.has(a)) }))
      .filter((c) => c.todos.length && !hashes.has(c.hash)).slice(0, n)
    : [];
  const remoto = remotoGithub(fl); const subidos = hashesSubidos(fl);
  const marcar = ({ todos, ...c }) => ({
    ...c, archivos: todos.slice(0, LIM), totalArchivos: todos.length,
    subido: subidos ? subidos.has(c.hash) : null,
    url: remoto && subidos && subidos.has(c.hash) ? `${remoto}/commit/${c.hash}` : null,
  });
  return { propios: propios.map(marcar), transversales: transversales.map(marcar), recursosCompartidosUsados: usados.size };
}

/* ---------- despliegues ---------- */
export function leerDespliegues(ctx) { return leerJson(ctx.desplieguesPath, { schemaVersion: 1, despliegues: [] }); }
/** Errores de un despliegue. Sin evidencia no es válido: no se asigna estado sin ella. */
export function validarDespliegue(d, ctx, fl, cat = leerCatalogo(ctx), manifiestos = () => []) {
  const errores = []; const q = `despliegue ${d.id || '(sin id)'}`;
  if (!d.id || !/^[a-z0-9][a-z0-9._-]*$/i.test(d.id)) errores.push(`${q}: identificador vacío o no válido`);
  if (!cat.flujos.some((f) => f.id === d.flujo)) errores.push(`${q}: el flujo «${d.flujo}» no existe`);
  if (!ESTADOS_DESPLIEGUE.includes(d.estado)) errores.push(`${q}: estado «${d.estado}» no válido (${ESTADOS_DESPLIEGUE.join(', ')})`);
  if (!d.entorno || !RE_ID_FLUJO.test(d.entorno)) errores.push(`${q}: entorno no válido (minúsculas, números y guiones)`);
  if (!d.fecha || isNaN(new Date(d.fecha))) errores.push(`${q}: fecha no válida`);
  if (!d.evidencia || !String(d.evidencia).trim()) errores.push(`${q}: falta la evidencia de la publicación`);
  if (d.version != null && (!RE_VERSION.test(d.version) || !manifiestos(d.flujo).some((m) => m.version === d.version))) errores.push(`${q}: la versión ${d.version} no está publicada para ese flujo`);
  if (!d.commit || !RE_HASH.test(d.commit)) errores.push(`${q}: commit no válido`);
  else { try { git(fl.repo, ['cat-file', '-e', `${d.commit}^{commit}`]); } catch { errores.push(`${q}: el commit ${d.commit} no existe en el repositorio`); } }
  if (d.urlPublicada != null && !/^https:\/\//.test(d.urlPublicada)) errores.push(`${q}: la URL publicada debe ser https`);
  if (d.estado === 'publicado' && !d.urlPublicada) errores.push(`${q}: un despliegue publicado necesita la URL publicada`);
  return errores;
}
export function validarDespliegues(ctx, fl, cat = leerCatalogo(ctx), manifiestos = () => []) {
  const errores = []; const ids = new Set();
  for (const d of leerDespliegues(ctx).despliegues || []) {
    if (d.id && ids.has(d.id)) errores.push(`despliegue ${d.id}: identificador repetido`);
    ids.add(d.id);
    errores.push(...validarDespliegue(d, ctx, fl, cat, manifiestos));
  }
  return errores;
}
export function agregarDespliegue(d, ctx) {
  const reg = leerDespliegues(ctx);
  if ((reg.despliegues || []).some((x) => x.id === d.id)) fallo('despliegue_duplicado', `Ya existe el despliegue ${d.id}.`);
  reg.despliegues = [...(reg.despliegues || []), d];
  escribirJson(ctx.desplieguesPath, reg);
}
export function desplieguesDelFlujo(ctx, flujoId, fl) {
  return (leerDespliegues(ctx).despliegues || []).filter((d) => d.flujo === flujoId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .map((d) => {
      let commit = null;
      try {
        const [hash, autor, fecha, mensaje] = git(fl.repo, ['log', '-1', '--format=%H%x1f%an%x1f%aI%x1f%s', d.commit]).toString().trim().split('\x1f');
        commit = { hash, corto: hash.slice(0, 7), autor, fecha, mensaje };
      } catch { commit = null; }
      return { ...d, commitInfo: commit };
    });
}
