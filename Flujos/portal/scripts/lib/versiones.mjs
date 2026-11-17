/**
 * lib/versiones.mjs — Almacén de versiones publicadas de cada flujo.
 *
 * Diseño (carpeta Flujos/versiones/, en el mismo repositorio, FUERA de sitio/ y de dist/):
 *
 *   _recursos/<hash>/archivos/…       Recursos comunes (shared/, vendor del sistema de diseño,
 *                                     recursos de la plataforma) tal como los usó la versión.
 *                                     <hash> = huella del contenido: dos versiones con los mismos
 *                                     recursos comparten una sola carpeta.
 *   _recursos/<hash>/recursos.json    Huella de cada archivo.
 *   <flujo>/v<x.y.z>/archivos/…       Solo los archivos propios del flujo en esa versión.
 *   <flujo>/v<x.y.z>/manifest.json    Commit, sistema de diseño usado, notas, huellas y hash de recursos.
 *
 * Las versiones son inmutables: el build las VERIFICA contra sus huellas y se detiene si
 * alguna cambió. El build solo LEE este almacén; nunca lo escribe ni lo borra.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, git } from './fuentes.mjs';

export const ALMACEN = process.env.PORTAL_VERSIONES
  ? path.resolve(process.env.PORTAL_VERSIONES)
  : path.resolve(ROOT, '..', 'versiones');
export const RECURSOS = '_recursos';
export const SEMVER = /^\d+\.\d+\.\d+$/;
const RE_VERSION = /^v(\d+\.\d+\.\d+)$/;
const IGNORADOS = new Set(['.DS_Store']);

export const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
export const cmpSemver = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/** Huella de un conjunto de archivos { ruta: sha256 }. */
export function hashConjunto(mapa) {
  const h = crypto.createHash('sha256');
  for (const rel of Object.keys(mapa).sort()) h.update(`${rel}\0${mapa[rel]}\n`);
  return h.digest('hex').slice(0, 12);
}

function recorrer(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORADOS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/** { ruta: sha256 } de todo lo que hay en una carpeta. */
export function huellas(dir) {
  const mapa = {};
  for (const rel of recorrer(dir).sort()) mapa[rel] = sha256(fs.readFileSync(path.join(dir, rel)));
  return mapa;
}

export function idsAlmacen() {
  if (!fs.existsSync(ALMACEN)) return [];
  return fs.readdirSync(ALMACEN, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name).sort();
}

/** Manifiestos de un flujo, de la versión más reciente a la más antigua. */
export function listarVersiones(id) {
  const dir = path.join(ALMACEN, id);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && RE_VERSION.test(e.name))
    .map((e) => JSON.parse(fs.readFileSync(path.join(dir, e.name, 'manifest.json'), 'utf8')))
    .sort((a, b) => cmpSemver(b.version, a.version));
}

export const dirVersion = (id, version) => path.join(ALMACEN, id, `v${version}`);
export const dirRecursos = (hash) => path.join(ALMACEN, RECURSOS, hash);

const igual = (a, b) => {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
};

/** Comprueba que ninguna versión publicada haya cambiado. Devuelve la lista de errores. */
export function verificarAlmacen() {
  const errores = [];
  for (const id of idsAlmacen()) {
    const base = path.join(ALMACEN, id);
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      const donde = `${id}/${e.name}`;
      if (!RE_VERSION.test(e.name)) { errores.push(`${donde}: nombre de versión inválido (se espera v<x.y.z>)`); continue; }
      let m;
      try { m = JSON.parse(fs.readFileSync(path.join(base, e.name, 'manifest.json'), 'utf8')); }
      catch { errores.push(`${donde}: falta manifest.json o no es válido`); continue; }
      if (m.id !== id || `v${m.version}` !== e.name) errores.push(`${donde}: el manifiesto no corresponde a su carpeta`);
      if (!igual(huellas(path.join(base, e.name, 'archivos')), m.archivos || {})) errores.push(`${donde}: los archivos del flujo no coinciden con su manifiesto (una versión publicada no se edita)`);
      const rdir = dirRecursos(m.recursos?.hash || '_sin_hash');
      let rj;
      try { rj = JSON.parse(fs.readFileSync(path.join(rdir, 'recursos.json'), 'utf8')); }
      catch { errores.push(`${donde}: faltan los recursos ${m.recursos?.hash}`); continue; }
      if (!igual(huellas(path.join(rdir, 'archivos')), rj.archivos || {})) errores.push(`${donde}: los recursos ${m.recursos.hash} fueron alterados`);
      if (hashConjunto(rj.archivos || {}) !== m.recursos.hash) errores.push(`${donde}: la huella de recursos no coincide con ${m.recursos.hash}`);
    }
  }
  return errores;
}

/** Consistencia catálogo ↔ manifiestos: si un flujo tiene versiones publicadas, la versión
 *  declarada en catalogo.json es exactamente la última publicada. */
export function verificarCatalogo(catalogo) {
  const errores = [];
  const ids = new Set(catalogo.flujos.map((f) => f.id));
  for (const f of catalogo.flujos) {
    const lista = listarVersiones(f.id);
    if (!lista.length) continue;
    const ultima = lista[0];
    if (f.version !== ultima.version) {
      errores.push(`${f.id}: catalogo.json declara ${f.version}, pero la última versión publicada es la v${ultima.version}. Publícala con "npm run version-flujo" o corrige el catálogo.`);
    }
    for (const m of lista) {
      if (m.plataforma !== f.plataforma) errores.push(`${f.id} v${m.version}: el manifiesto dice plataforma "${m.plataforma}" y el catálogo "${f.plataforma}"`);
      if (m.id !== f.id) errores.push(`${f.id} v${m.version}: el manifiesto pertenece a "${m.id}"`);
    }
  }
  for (const id of idsAlmacen()) if (!ids.has(id)) errores.push(`${id}: hay versiones en el almacén, pero el flujo no está en catalogo.json`);
  return errores;
}

/** Arma una versión navegable: recursos exactos + archivos propios, con la estructura original. */
export function materializar(m, destino) {
  fs.mkdirSync(destino, { recursive: true });
  fs.cpSync(path.join(dirRecursos(m.recursos.hash), 'archivos'), destino, { recursive: true });
  fs.cpSync(path.join(dirVersion(m.id, m.version), 'archivos'), destino, { recursive: true });
}

/** Commits que tocaron el flujo después de la versión publicada (desarrollo sin publicar como versión). */
export function commitsDesde(fl, commit, rutas) {
  try {
    return Number(git(fl.repo, ['rev-list', '--count', `${commit}..HEAD`, '--', ...rutas]).toString().trim()) || 0;
  } catch { return null; }
}
