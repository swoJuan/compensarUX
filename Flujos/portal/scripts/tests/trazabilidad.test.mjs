/**
 * Pruebas de trazabilidad: pertenencia de URLs, HU, relaciones HU↔pantalla y despliegues.
 * Usan un árbol temporal de prototipos y un catálogo propio; no tocan datos reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from '../lib/trazabilidad.mjs';

function montar() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traz-'));
  const proto = path.join(dir, 'prototipos');
  for (const r of ['zt/historia-clinica/index.html', 'zt/historia-clinica/mis-solicitudes.html', 'zt/historia-clinica-2/index.html',
    'zt/agendamiento/index.html', 'zt/agendamiento/agenda-1.html', 'zt/inicio/index.html', 'zt/index.html', 'zt/shared/zt.css', 'zt/historia-clinica/css/x.css']) {
    fs.mkdirSync(path.dirname(path.join(proto, r)), { recursive: true });
    fs.writeFileSync(path.join(proto, r), '<html></html>');
  }
  const cat = {
    flujos: [
      { id: 'zt-historia-clinica', nombre: 'Solicitud de historia clínica', plataforma: 'zt', ruta: 'zt/historia-clinica/', version: '0.1.0', hu: [{ id: '305878', codigo: 'HU-297', titulo: 'Mis solicitudes', url: 'https://dev.azure.com/Org/Proy/_workitems/edit/305878' }] },
      { id: 'zt-historia-clinica-2', nombre: 'Historia clínica 2', plataforma: 'zt', ruta: 'zt/historia-clinica-2/', version: '0.1.0', hu: [] },
      { id: 'zt-agendamiento', nombre: 'Agendamiento de citas', plataforma: 'zt', ruta: 'zt/agendamiento/', version: '0.1.0', hu: [{ id: '261050', codigo: 'HU-097', titulo: 'Consultar agenda' }] },
      { id: 'zt-oficina', nombre: 'Oficina virtual', plataforma: 'zt', ruta: 'zt/inicio/', incluir: ['zt/inicio/**', 'zt/index.html'], version: '0.1.0', hu: [] },
    ],
  };
  fs.writeFileSync(path.join(dir, 'catalogo.json'), JSON.stringify(cat, null, 2));
  const ctx = T.contexto({ catalogoPath: path.join(dir, 'catalogo.json'), trazDir: path.join(dir, 'traz'), desplieguesPath: path.join(dir, 'despliegues.json'), protoRoot: proto, plataformas: ['zt', 'drupal', 'app'] });
  return { dir, ctx, limpiar: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
const rechaza = (fn, codigo) => assert.throws(fn, (e) => e instanceof T.ErrTraz && e.codigo === codigo, `se esperaba ${codigo}`);
const HC = 'zt-historia-clinica';
const URL_L = 'http://localhost:4173/p/zt/';

test('resolverPantalla acepta rutas del portal y normaliza', () => {
  const { ctx, limpiar } = montar();
  try {
    assert.deepEqual(T.resolverPantalla(`${URL_L}historia-clinica/mis-solicitudes.html?x=1#a`, ctx).rel, 'zt/historia-clinica/mis-solicitudes.html');
    assert.equal(T.resolverPantalla('/p/zt/historia-clinica/', ctx).rel, 'zt/historia-clinica/index.html');
    assert.equal(T.resolverPantalla('zt/historia-clinica/index.html', ctx).flujoId, HC);
    assert.equal(T.resolverPantalla('http://127.0.0.1:9/versiones/zt-historia-clinica/v0.1.0/zt/historia-clinica/index.html', ctx).version, '0.1.0');
    // «incluir» del flujo: zt/index.html pertenece a Oficina virtual
    assert.equal(T.resolverPantalla('/p/zt/index.html', ctx).flujoId, 'zt-oficina');
    // el prefijo de texto no basta: historia-clinica-2 es otro flujo
    assert.equal(T.resolverPantalla('/p/zt/historia-clinica-2/index.html', ctx).flujoId, 'zt-historia-clinica-2');
  } finally { limpiar(); }
});

test('resolverPantalla rechaza protocolos, orígenes, rutas ambiguas y archivos que no son pantallas', () => {
  const { ctx, limpiar } = montar();
  try {
    rechaza(() => T.resolverPantalla('javascript:alert(1)', ctx), 'protocolo_no_permitido');
    rechaza(() => T.resolverPantalla('data:text/html,hola', ctx), 'protocolo_no_permitido');
    rechaza(() => T.resolverPantalla('file:///etc/passwd', ctx), 'protocolo_no_permitido');
    rechaza(() => T.resolverPantalla('ftp://localhost/p/zt/historia-clinica/index.html', ctx), 'protocolo_no_permitido');
    rechaza(() => T.resolverPantalla('https://evil.example/p/zt/historia-clinica/index.html', ctx), 'origen_no_permitido');
    rechaza(() => T.resolverPantalla('http://localhost.evil.example/p/zt/historia-clinica/index.html', ctx), 'origen_no_permitido');
    rechaza(() => T.resolverPantalla('http://user:pw@localhost/p/zt/historia-clinica/index.html', ctx), 'url_invalida');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica/../agendamiento/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica/%2e%2e/agendamiento/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica%2f..%2fagendamiento/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('/p/zt//historia-clinica/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('//evil.example/p/zt/historia-clinica/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica/%252e/index.html', ctx), 'ruta_ambigua');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica/css/x.css', ctx), 'no_es_pantalla');
    rechaza(() => T.resolverPantalla('/otra/cosa/index.html', ctx), 'ruta_no_prototipo');
    rechaza(() => T.resolverPantalla('/p/zt/nada/index.html', ctx), 'sin_flujo');
    rechaza(() => T.resolverPantalla('', ctx), 'url_vacia');
    rechaza(() => T.resolverPantalla('/p/zt/historia-clinica/\nindex.html', ctx), 'url_invalida');
  } finally { limpiar(); }
});

test('una URL de otro flujo se rechaza con el mensaje oficial', () => {
  const { ctx, limpiar } = montar();
  try {
    assert.throws(
      () => T.vincular(HC, { pantalla: { url: `${URL_L}agendamiento/agenda-1.html` }, hu: { codigo: 'HU-297' } }, ctx),
      (e) => e.codigo === 'otro_flujo' && e.message === 'Esta pantalla pertenece a otro flujo. Solo puedes vincular historias de usuario a pantallas de Solicitud de historia clínica.',
    );
    assert.equal(T.leerRegistro(ctx, HC).relaciones.length, 0);
  } finally { limpiar(); }
});

test('una pantalla del flujo no registrada exige confirmación y nunca se crea sola', () => {
  const { ctx, limpiar } = montar();
  try {
    assert.throws(() => T.vincular(HC, { pantalla: { url: `${URL_L}historia-clinica/index.html` }, hu: { codigo: 'HU-297' } }, ctx),
      (e) => e.codigo === 'pantalla_no_registrada' && e.extra.propuesta.ruta === 'zt/historia-clinica/index.html');
    assert.equal(T.leerRegistro(ctx, HC).pantallas.length, 0);
    const r = T.vincular(HC, { pantalla: { url: `${URL_L}historia-clinica/index.html` }, hu: { codigo: 'hu 297' }, registrarPantalla: { nombre: 'Inicio', confirmar: true } }, ctx);
    assert.equal(r.pantallaRegistrada, true);
    assert.equal(r.huNueva, false); // HU-297 ya existía: se reutiliza
    assert.equal(r.proyeccion.pantallas.length, 1);
  } finally { limpiar(); }
});

test('relaciones: varias HU por pantalla, varias pantallas por HU, sin duplicados, editar y desvincular', () => {
  const { ctx, limpiar } = montar();
  try {
    const p1 = T.registrarPantalla(HC, { url: `${URL_L}historia-clinica/index.html`, nombre: 'Inicio' }, ctx).pantalla;
    const p2 = T.registrarPantalla(HC, { url: `${URL_L}historia-clinica/mis-solicitudes.html`, nombre: 'Mis solicitudes' }, ctx).pantalla;
    rechaza(() => T.registrarPantalla(HC, { url: `${URL_L}historia-clinica/index.html`, nombre: 'Otra' }, ctx), 'pantalla_duplicada');
    T.vincular(HC, { pantalla: { id: p1.id }, hu: { codigo: 'HU-297' } }, ctx);
    T.vincular(HC, { pantalla: { id: p2.id }, hu: { codigo: 'HU-297' }, nota: 'Listado' }, ctx); // una HU, dos pantallas
    const nueva = T.vincular(HC, { pantalla: { id: p1.id }, hu: { codigo: 'HU-300', titulo: 'Radicado', url: 'https://dev.azure.com/Org/Proy/_workitems/edit/900/' } }, ctx); // dos HU, una pantalla
    assert.equal(nueva.huNueva, true);
    rechaza(() => T.vincular(HC, { pantalla: { id: p1.id }, hu: { codigo: 'HU-297' } }, ctx), 'relacion_duplicada');
    // Reutilizar una HU existente no revalida la URL que reenvía el formulario (p. ej. una URL heredada de búsqueda).
    const reuso = T.vincular(HC, { pantalla: { id: p2.id }, hu: { codigo: 'HU-300', url: 'https://dev.azure.com/Org/_search?text=x' } }, ctx);
    assert.equal(reuso.huNueva, false);
    T.desvincular(HC, { hu: 'HU-300', pantalla: p2.id }, ctx);
    // Punto de inicio: se toma del «?…#…» de la URL pegada, el campo explícito manda y se puede editar o quitar.
    const conUrl = T.vincular(HC, { pantalla: { url: `${URL_L}historia-clinica/mis-solicitudes.html?estado=error#lista` }, hu: { codigo: 'HU-300' } }, ctx);
    assert.equal(conUrl.relacion.inicio, '?estado=error#lista');
    T.editarRelacion(HC, { hu: 'HU-300', pantalla: p2.id, nota: '', inicio: 'https://x/a.html#paso-2' }, ctx);
    assert.equal(T.proyeccion(HC, ctx).relaciones.find((r) => r.hu === 'HU-300' && r.pantalla === p2.id).inicio, '#paso-2');
    rechaza(() => T.editarRelacion(HC, { hu: 'HU-300', pantalla: p2.id, inicio: 'estado=error' }, ctx), 'inicio_invalido');
    rechaza(() => T.editarRelacion(HC, { hu: 'HU-300', pantalla: p2.id, inicio: '#a"onload=x' }, ctx), 'inicio_invalido');
    T.editarRelacion(HC, { hu: 'HU-300', pantalla: p2.id, inicio: '' }, ctx);
    assert.equal(T.proyeccion(HC, ctx).relaciones.find((r) => r.hu === 'HU-300' && r.pantalla === p2.id).inicio, undefined);
    T.desvincular(HC, { hu: 'HU-300', pantalla: p2.id }, ctx);
    const explicito = T.vincular(HC, { pantalla: { url: `${URL_L}historia-clinica/mis-solicitudes.html?a=1` }, hu: { codigo: 'HU-300' }, inicio: '#b' }, ctx);
    assert.equal(explicito.relacion.inicio, '#b');
    T.desvincular(HC, { hu: 'HU-300', pantalla: p2.id }, ctx);
    const cat = T.leerCatalogo(ctx);
    assert.equal(cat.flujos[0].hu.filter((h) => h.codigo === 'HU-297').length, 1, 'la HU no se duplica');
    assert.equal(cat.flujos[0].hu.find((h) => h.codigo === 'HU-300').id, '900');
    let p = T.proyeccion(HC, ctx);
    assert.deepEqual(p.hu.find((h) => h.codigo === 'HU-297').pantallas.sort(), [p1.id, p2.id].sort());
    assert.deepEqual(p.pantallas.find((x) => x.id === p1.id).hu.sort(), ['HU-297', 'HU-300']);
    T.editarRelacion(HC, { hu: 'HU-297', pantalla: p2.id, nota: 'Listado y filtros' }, ctx);
    assert.equal(T.leerRegistro(ctx, HC).relaciones.find((r) => r.pantalla === p2.id).nota, 'Listado y filtros');
    const d = T.desvincular(HC, { hu: 'HU-297', pantalla: p1.id }, ctx);
    assert.equal(d.proyeccion.relaciones.length, 2);
    assert.ok(T.leerCatalogo(ctx).flujos[0].hu.some((h) => h.codigo === 'HU-297'), 'desvincular no elimina la HU');
    rechaza(() => T.desvincular(HC, { hu: 'HU-297', pantalla: p1.id }, ctx), 'relacion_inexistente');
    assert.deepEqual(T.validarRegistro(HC, ctx), []);
  } finally { limpiar(); }
});

test('el identificador de pantalla es estable aunque cambie nombre o ruta', () => {
  const { ctx, limpiar } = montar();
  try {
    const p = T.registrarPantalla(HC, { url: `${URL_L}historia-clinica/index.html`, nombre: 'Inicio' }, ctx).pantalla;
    T.vincular(HC, { pantalla: { id: p.id }, hu: { codigo: 'HU-297' } }, ctx);
    T.editarPantalla(HC, { id: p.id, nombre: 'Solicitar', url: `${URL_L}historia-clinica/mis-solicitudes.html` }, ctx);
    const reg = T.leerRegistro(ctx, HC);
    assert.equal(reg.pantallas[0].id, p.id);
    assert.equal(reg.pantallas[0].ruta, 'zt/historia-clinica/mis-solicitudes.html');
    assert.equal(reg.relaciones[0].pantalla, p.id);
    rechaza(() => T.editarPantalla(HC, { id: p.id, url: `${URL_L}agendamiento/index.html` }, ctx), 'otro_flujo');
  } finally { limpiar(); }
});

test('HU: formato, Azure DevOps y conflictos de identidad entre flujos', () => {
  const { ctx, limpiar } = montar();
  try {
    const p = T.registrarPantalla('zt-agendamiento', { url: `${URL_L}agendamiento/index.html`, nombre: 'Agenda' }, ctx).pantalla;
    rechaza(() => T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'abc', titulo: 'x y z' } }, ctx), 'hu_invalida');
    rechaza(() => T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'HU-5', titulo: 'ab' } }, ctx), 'titulo_invalido');
    for (const url of ['http://dev.azure.com/o/p/_workitems/edit/1', 'https://evil.example/o/p/_workitems/edit/1', 'https://dev.azure.com/o/p/_git/repo', 'javascript:alert(1)']) {
      rechaza(() => T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'HU-5', titulo: 'Titulo', url } }, ctx), 'azure_invalida');
    }
    // HU-297 existe en Historia clínica con otro título y otro work item → no se duplica en silencio
    rechaza(() => T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'HU-297', titulo: 'Algo distinto' } }, ctx), 'hu_conflicto');
    rechaza(() => T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'HU-297', titulo: 'Mis solicitudes', url: 'https://dev.azure.com/Org/Proy/_workitems/edit/777' } }, ctx), 'hu_conflicto');
    // mismo work item o mismo título → es la misma HU y puede usarse en el segundo flujo
    const ok = T.vincular('zt-agendamiento', { pantalla: { id: p.id }, hu: { codigo: 'HU-297', titulo: 'Mis solicitudes', url: 'https://dev.azure.com/Org/Proy/_workitems/edit/305878' } }, ctx);
    assert.equal(ok.huNueva, true);
    assert.equal(T.leerRegistro(ctx, HC).relaciones.length, 0, 'no se mezclan relaciones entre flujos');
    // las rechazadas no escriben nada
    assert.equal(T.leerCatalogo(ctx).flujos.find((f) => f.id === 'zt-agendamiento').hu.some((h) => h.codigo === 'HU-5'), false);
  } finally { limpiar(); }
});

test('validarRegistro detecta relaciones huérfanas y rutas ajenas', () => {
  const { ctx, limpiar } = montar();
  try {
    fs.mkdirSync(ctx.trazDir, { recursive: true });
    fs.writeFileSync(path.join(ctx.trazDir, `${HC}.json`), JSON.stringify({
      flujo: HC,
      pantallas: [{ id: 'scr-1', flujo: HC, nombre: 'A', ruta: 'zt/agendamiento/index.html' }],
      relaciones: [{ hu: 'HU-999', pantalla: 'scr-1', flujo: HC }, { hu: 'HU-297', pantalla: 'scr-x', flujo: HC }],
    }));
    const e = T.validarRegistro(HC, ctx).join('\n');
    assert.match(e, /no pertenece al flujo/);
    assert.match(e, /HU-999, que no está entre las HU/);
    assert.match(e, /scr-x, que no está registrada/);
  } finally { limpiar(); }
});

test('versiones: las pantallas salen del manifiesto y la comparación usa huellas', () => {
  const f = { ruta: 'zt/agendamiento/' };
  const v = T.pantallasDeVersion({ archivos: { 'zt/agendamiento/a.html': 'a'.repeat(64), 'zt/agendamiento/x.css': 'b'.repeat(64), 'zt/otro/b.html': 'c'.repeat(64) } }, f);
  assert.deepEqual(v, [{ ruta: 'zt/agendamiento/a.html', huella: 'a'.repeat(12) }]);
});

test('despliegues: exigen evidencia, commit, versión y estado reales', () => {
  const { ctx, limpiar } = montar();
  try {
    const fl = { repo: process.cwd() };
    const commit = (() => { try { return execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(); } catch { return null; } })();
    const base = { id: 'dep-1', flujo: HC, version: null, entorno: 'produccion', commit: commit || 'abcdef1', fecha: '2026-11-17T10:00:00Z', estado: 'publicado', urlPublicada: 'https://portal.example/p/', evidencia: 'https://ci.example/run/1' };
    const errs = (d) => T.validarDespliegue({ ...base, ...d }, ctx, fl, T.leerCatalogo(ctx), () => []).join('|');
    if (commit) assert.equal(errs({}), '');
    assert.match(errs({ evidencia: '' }), /falta la evidencia/);
    assert.match(errs({ estado: 'aprobado' }), /estado «aprobado»/);
    assert.match(errs({ version: '9.9.9' }), /no está publicada/);
    assert.match(errs({ flujo: 'nada' }), /no existe/);
    assert.match(errs({ urlPublicada: 'http://x' }), /https/);
    assert.match(errs({ commit: '0000000000000000000000000000000000000000' }), /no existe en el repositorio/);
  } finally { limpiar(); }
});
