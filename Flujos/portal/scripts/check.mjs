#!/usr/bin/env node
/**
 * check.mjs — Verifica dist/ sin navegador.
 *  - Errores: referencias locales rotas en HTML (src/href) y CSS (url(), @import).
 *  - Avisos:  rutas en scripts en línea que no existen (pueden ser falsos positivos,
 *             porque se resuelven en tiempo de ejecución).
 *  - Informa los dominios externos usados.
 * Sale con código 1 si hay errores.
 * Uso: npm run check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.PORTAL_DIST ? path.resolve(process.env.PORTAL_DIST) : path.join(ROOT, 'dist');
if (!fs.existsSync(DIST)) { console.error('No existe dist/. Ejecuta primero: npm run build'); process.exit(1); }

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
};

const SKIP = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/|\$\{|\{\{)/i;
const errores = [];
const avisos = [];
const externos = new Map();

function anotarExterno(ref, origen) {
  const m = ref.match(/^(?:https?:)?\/\/([^/]+)/i);
  if (m) externos.set(m[1], (externos.get(m[1]) || 0) + 1);
}

function existe(ref, desdeArchivo) {
  const limpio = ref.split('#')[0].split('?')[0];
  if (!limpio) return true;
  let destino = limpio.startsWith('/') ? path.join(DIST, limpio) : path.resolve(path.dirname(desdeArchivo), limpio);
  try { destino = decodeURIComponent(destino); } catch {}
  if (!destino.startsWith(DIST)) return false;
  if (fs.existsSync(destino) && fs.statSync(destino).isDirectory()) destino = path.join(destino, 'index.html');
  return fs.existsSync(destino);
}

const rel = (f) => path.relative(DIST, f);

// Los documentos del sistema de diseño (ds/docs/**) son fragmentos que
// ds/drupal.html y ds/app.html cargan con fetch: sus rutas relativas se
// resuelven contra ds/, no contra la carpeta del fragmento.
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'fuentes.json'), 'utf8'));
const DS_DIR = path.join(DIST, cfg.designSystem.destino);
const FRAG_DIR = path.join(DS_DIR, 'docs') + path.sep;
const existeRef = (ref, f) => existe(ref, f) || (f.startsWith(FRAG_DIR) && existe(ref, path.join(DS_DIR, 'index.html')));
// Una versión publicada contiene solo su flujo: un enlace hacia otro flujo (que sí existe en p/)
// es un aviso, no una referencia rota.
function rota(f, ref, texto) {
  const r = rel(f);
  const m = /^(versiones\/[^/]+\/v\d+\.\d+\.\d+)\//.exec(r);
  if (m) {
    const limpio = ref.split('#')[0].split('?')[0];
    const relRaiz = path.relative(path.join(DIST, m[1]), path.resolve(path.dirname(f), limpio));
    const equiv = path.join(DIST, 'p', relRaiz);
    if (!relRaiz.startsWith('..') && fs.existsSync(equiv)) { avisos.push(`${r} (enlace a otro flujo, fuera de esta versión) → ${ref}`); return; }
  }
  errores.push(texto);
}
const archivos = walk(DIST);
let refs = 0;

for (const f of archivos) {
  const ext = path.extname(f);
  if (ext !== '.html' && ext !== '.css') continue;
  const txt = fs.readFileSync(f, 'utf8');

  if (ext === '.html') {
    const sinScripts = txt.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.replace(/>[\s\S]*<\/script>/i, '></script>'));
    const sinComentarios = sinScripts
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(pre|code|textarea|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    for (const m of sinComentarios.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
      const ref = m[1].trim();
      if (/^(?:https?:)?\/\//i.test(ref)) { anotarExterno(ref); continue; }
      if (SKIP.test(ref)) continue;
      refs++;
      if (!existeRef(ref, f)) rota(f, ref, `${rel(f)} → ${ref}`);
    }
    for (const s of txt.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      for (const m of s[1].matchAll(/fetch\(\s*['"]([^'"\s]+)['"]/g)) {
        const ref = m[1];
        if (SKIP.test(ref)) continue;
        if (!existeRef(ref, f)) avisos.push(`${rel(f)} (fetch en script) → ${ref}`);
      }
    }
    for (const m of txt.matchAll(/https?:\/\/[^\s"'<>)]+/g)) anotarExterno(m[0]);
  } else {
    for (const m of txt.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) {
      const ref = (m[1] || m[2]).trim();
      if (/^(?:https?:)?\/\//i.test(ref)) { anotarExterno(ref); continue; }
      if (SKIP.test(ref) || ref.startsWith('data:')) continue;
      refs++;
      if (!existeRef(ref, f)) errores.push(`${rel(f)} → ${ref}`);
    }
  }
}

// Versiones publicadas: cada URL del catálogo debe existir en la salida.
try {
  const cat = JSON.parse(fs.readFileSync(path.join(DIST, 'catalogo.json'), 'utf8'));
  let nv = 0;
  for (const fl of cat.flujos) for (const v of fl.versiones || []) {
    nv++;
    if (!fs.existsSync(path.join(DIST, v.url))) errores.push(`catalogo.json → ${fl.id} v${v.version}: no existe ${v.url}`);
  }
  console.log(`Versiones publicadas verificadas: ${nv}.`);
} catch { /* sin catálogo */ }
console.log(`Revisión de ${path.basename(DIST)}/: ${archivos.length} archivos, ${refs} referencias locales.`);
if (externos.size) {
  console.log('Dominios externos:');
  for (const [d, n] of [...externos].sort((a, b) => b[1] - a[1])) console.log(`  ${d} (${n})`);
}
if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}) — rutas en scripts, verificar en navegador:`);
  for (const a of [...new Set(avisos)]) console.log('  ' + a);
}
if (errores.length) {
  console.log(`\n✗ ${errores.length} referencias rotas:`);
  for (const e of [...new Set(errores)]) console.log('  ' + e);
  process.exit(1);
}
console.log('\n✓ Sin referencias rotas.');
