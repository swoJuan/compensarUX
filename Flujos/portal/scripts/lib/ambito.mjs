/**
 * lib/ambito.mjs — Clasifica los cambios pendientes de Git por ÁMBITO, para que cada commit
 * contenga solo lo que corresponde a un trabajo y nunca mezcle flujos.
 *
 * Ámbitos:
 *   <id-flujo>            archivos propios de un flujo (y su entrada en catalogo.json)
 *   version:<id-flujo>    versión publicada de un flujo (Flujos/versiones/<id>/, recursos y su `version` en el catálogo)
 *   compartido-<plat>     shared/ de una plataforma (afecta a varios flujos)  ·  compartido (shared/ global)
 *   sin-registrar:<ruta>  carpeta de flujo nueva que aún no está en catalogo.json
 *   portal · sitio · design-system · agentes · versiones · prototipos-otros · otros
 *   nara                  BLOQUEADO: nunca se confirma desde aquí
 *   ambiguo               coincide con varios flujos: confirmar a mano
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson, matcher, Fuente, git } from './fuentes.mjs';

const txt = (cwd, args) => git(cwd, args).toString('utf8');

export function contexto() {
  const cfg = readJson('fuentes.json');
  const cat = readJson('catalogo.json');
  const raiz = new Fuente('portal', { repo: '.' }).raiz;
  const posix = (p) => p.split(path.sep).join('/');
  const protos = posix(path.relative(raiz, path.resolve(ROOT, cfg.flujos.repo)));
  const catalogoRel = posix(path.relative(raiz, path.join(ROOT, 'catalogo.json')));
  const versionesRel = posix(path.relative(raiz, path.resolve(ROOT, '..', 'versiones')));
  const plataformas = Object.keys(cfg.plataformas);
  const comunGlobal = matcher(cfg.flujos.comun || []);
  const comunPlat = Object.fromEntries(plataformas.map((p) => [p, matcher(cfg.plataformas[p].comun || [])]));
  const flujos = cat.flujos.map((f) => ({
    f,
    ruta: f.ruta.replace(/\/?$/, '/'),
    propio: matcher(f.incluir || [f.ruta.replace(/\/?$/, '/') + '**']),
  }));
  return { cfg, cat, raiz, protos, catalogoRel, versionesRel, plataformas, comunGlobal, comunPlat, flujos };
}

/** Qué flujos cambiaron en el catálogo (working vs HEAD) y si el cambio es solo de `version`. */
export function cambiosCatalogo(ctx) {
  let previo = null;
  try { previo = JSON.parse(txt(ctx.raiz, ['show', `HEAD:${ctx.catalogoRel}`])); } catch { /* catálogo nuevo */ }
  const actual = ctx.cat;
  if (!previo) return { ids: new Set(actual.flujos.map((f) => f.id)), meta: true, soloVersion: {} };
  const ids = new Set();
  const soloVersion = {};
  const porId = Object.fromEntries(previo.flujos.map((f) => [f.id, f]));
  for (const f of actual.flujos) {
    const p = porId[f.id];
    if (!p) { ids.add(f.id); continue; }
    if (JSON.stringify(p) !== JSON.stringify(f)) {
      ids.add(f.id);
      soloVersion[f.id] = JSON.stringify({ ...p, version: 0 }) === JSON.stringify({ ...f, version: 0 });
    }
  }
  for (const f of previo.flujos) if (!actual.flujos.some((x) => x.id === f.id)) ids.add(f.id);
  const resto = (c) => JSON.stringify({ ...c, flujos: undefined });
  return { ids, meta: resto(previo) !== resto(actual), soloVersion };
}

/** Archivos con cambios pendientes (modificados, nuevos o borrados), rutas desde la raíz del repo. */
export function pendientes(ctx) {
  const out = txt(ctx.raiz, ['status', '--porcelain=v1', '-z', '-uall', '--no-renames']);
  return out.split('\0').filter(Boolean).map((l) => ({ estado: l.slice(0, 2), ruta: l.slice(3) }));
}

export function clasificarTodo(ctx) {
  const lista = pendientes(ctx);
  const cc = cambiosCatalogo(ctx);
  const idsConVersion = new Set();
  const conVersiones = lista.filter((x) => x.ruta.startsWith(ctx.versionesRel + '/'));
  for (const x of conVersiones) {
    const seg = x.ruta.slice(ctx.versionesRel.length + 1).split('/')[0];
    if (seg && !seg.startsWith('_')) idsConVersion.add(seg);
  }
  const unicaVersion = idsConVersion.size === 1 ? [...idsConVersion][0] : null;

  const clasificar = (rel) => {
    if (rel.startsWith('Nara/')) return 'nara';
    if (rel === ctx.catalogoRel) {
      if (cc.ids.size === 1 && !cc.meta) {
        const id = [...cc.ids][0];
        return cc.soloVersion[id] ? `version:${id}` : id;
      }
      return 'portal';
    }
    if (rel.startsWith(ctx.versionesRel + '/')) {
      const seg = rel.slice(ctx.versionesRel.length + 1).split('/')[0];
      if (seg.startsWith('_')) return unicaVersion ? `version:${unicaVersion}` : 'versiones';
      return `version:${seg}`;
    }
    if (rel.startsWith(ctx.protos + '/')) {
      const r = rel.slice(ctx.protos.length + 1);
      const plat = r.split('/')[0];
      if (ctx.plataformas.includes(plat) && ctx.comunPlat[plat](r)) return `compartido-${plat}`;
      if (ctx.comunGlobal(r)) return 'compartido';
      const candidatos = ctx.flujos.filter((x) => x.propio(r));
      if (candidatos.length) {
        const mejor = candidatos.reduce((a, b) => (b.ruta.length > a.ruta.length ? b : a));
        const empate = candidatos.filter((x) => x.ruta.length === mejor.ruta.length);
        return empate.length > 1 ? 'ambiguo' : mejor.f.id;
      }
      const partes = r.split('/');
      if (ctx.plataformas.includes(plat) && partes.length > 2) return `sin-registrar:${plat}/${partes[1]}`;
      return 'prototipos-otros';
    }
    if (rel.startsWith('sitio/')) return 'sitio';
    if (rel.startsWith('Flujos/portal/')) return 'portal';
    if (rel.startsWith('Core-Design-System/')) return 'design-system';
    if (/^(IA-Central|\.claude|\.kiro|agents)\//.test(rel) || /^(AGENTS|CLAUDE)\.md$/.test(rel)) return 'agentes';
    return 'otros';
  };
  const grupos = {};
  for (const x of lista) (grupos[clasificar(x.ruta)] ||= []).push(x);
  return { grupos, cc };
}

const SENSIBLE = /(^|\/)\.env(\.|$)|\.pem$|\.key$|\.p12$|id_rsa|credential|secret|(^|\/)token|settings\.local\.json/i;
export const esSensible = (rel) => SENSIBLE.test(rel);

/** Confirma SOLO los archivos de un ámbito. No hace push, no usa --no-verify, no toca el resto. */
export function confirmar(ctx, ambito, mensaje) {
  if (!mensaje || !mensaje.trim()) throw new Error('Indica el mensaje del commit con -m "tipo(ámbito): qué cambió".');
  if (ambito === 'nara') throw new Error('Nara no se confirma desde aquí.');
  if (ambito === 'ambiguo') throw new Error('Hay archivos que coinciden con varios flujos: confírmalos a mano.');
  if (txt(ctx.raiz, ['diff', '--cached', '--name-only']).trim()) throw new Error('Hay archivos ya preparados (staged) en Git. Despréndelos o confírmalos antes: el commit debe contener solo este ámbito.');
  const { grupos } = clasificarTodo(ctx);
  const archivos = (grupos[ambito] || []).map((x) => x.ruta);
  if (!archivos.length) throw new Error(`No hay cambios pendientes en el ámbito "${ambito}". Ámbitos con cambios: ${Object.keys(grupos).join(', ') || 'ninguno'}.`);
  const delicado = archivos.filter(esSensible);
  if (delicado.length) throw new Error(`Archivos que parecen sensibles, no se confirman: ${delicado.join(', ')}`);
  for (let i = 0; i < archivos.length; i += 200) git(ctx.raiz, ['add', '-A', '--', ...archivos.slice(i, i + 200)]);
  const preparados = txt(ctx.raiz, ['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean).sort();
  const esperados = [...archivos].sort();
  if (JSON.stringify(preparados) !== JSON.stringify(esperados)) {
    git(ctx.raiz, ['reset', '-q', '--', ...preparados]);
    throw new Error('Lo preparado no coincide con el ámbito: se canceló sin confirmar nada.');
  }
  git(ctx.raiz, ['commit', '-q', '-m', mensaje.trim()]);
  const hash = txt(ctx.raiz, ['rev-parse', '--short', 'HEAD']).trim();
  return { hash, archivos, restantes: Object.fromEntries(Object.entries(clasificarTodo(ctx).grupos).map(([k, v]) => [k, v.length])) };
}
