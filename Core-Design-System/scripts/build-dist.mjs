#!/usr/bin/env node
/**
 * build-dist.mjs — Paquete único y versionado del Design System (estilo Bootstrap)
 * ------------------------------------------------------------------
 * Genera dist/compensar/v<version>/ con:
 *   compensar.min.css   core.css (incluye temas) + icons.css (clases de iconos),
 *                       con la fuente de iconos woff2 incrustada (funciona sin CORS)
 *   compensar.min.js    JS reutilizable de componentes (mp-tabs, mp-dropdown)
 *   fonts/              fuentes de iconos (woff2, woff, ttf)
 *   manifest.json       versión, commit, fecha, sha256 y SRI sha384 por archivo
 *
 * Fuera del paquete (a propósito):
 *   css/portal.css      estilos del portal de documentación, no de producto
 *   css/themes.css      sus tokens ya vienen compilados dentro de core.css
 *   js/*-docs.js, app.js, loader.js, tokens.js, ds-bundle.js, theme.js
 *                       código del portal de documentación
 *
 * Versiones INMUTABLES: si dist/compensar/v<version>/ ya existe con contenido
 * distinto, el build falla. Para cambiar algo, sube la versión en package.json.
 *
 * Uso:  npm run dist                 (versión de package.json)
 *       node scripts/build-dist.mjs 2.5.0
 * Requiere que css/ esté compilado (npm run sass:build).
 * ------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const version = (process.argv[2] || pkg.version).replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`versión inválida: ${version}`);

const OUT = join(ROOT, 'dist', 'compensar', `v${version}`);
const FONTS = ['compensar-icons.woff2', 'compensar-icons.woff', 'compensar-icons.ttf'];
const JS = ['js/mp-tabs.js', 'js/mp-dropdown.js'];

function fail(msg) { console.error(`build-dist: ERROR — ${msg}`); process.exit(1); }
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const git = (cmd) => { try { return execSync(`git ${cmd}`, { cwd: ROOT }).toString().trim(); } catch { return null; } };

/* ---------- CSS ---------- */
let core = read('css/core.css');
if (!core.includes('[data-theme=dark]') && !core.includes('[data-theme="dark"]')) {
  fail('core.css no incluye los temas; revisa si themes.css debe entrar al paquete');
}
const coreRefs = core.match(/\.\.\/icons\/fonts\//g) || [];
if (!coreRefs.length) fail('core.css no referencia ../icons/fonts/ (¿cambió la ruta de las fuentes?)');
core = core.replace(/\.\.\/icons\/fonts\//g, 'fonts/');
// La woff2 va incrustada (base64) en el CSS: los navegadores bloquean fuentes de otro
// dominio si el servidor no envía CORS, y el sitio estático de Azure no lo envía.
// woff y ttf quedan como respaldo por URL relativa (navegadores antiguos o copia local).
const woff2Ref = 'url("fonts/compensar-icons.woff2")';
if (!core.includes(woff2Ref)) fail(`core.css no contiene ${woff2Ref}; revisa el @font-face de CompensarIcons`);
const woff2B64 = readFileSync(join(ROOT, 'icons', 'fonts', 'compensar-icons.woff2')).toString('base64');
core = core.split(woff2Ref).join(`url("data:font/woff2;base64,${woff2B64}")`);

let icons = read('icons/icons.css');
// core.css ya declara @font-face de CompensarIcons: se quita el duplicado de icons.css.
icons = minifyCss(icons).replace(/@font-face\{[^}]*CompensarIcons[^}]*\}/g, '');
if (/@font-face/.test(icons)) fail('icons.css trae un @font-face distinto de CompensarIcons; revísalo');

function minifyCss(css) {
  return css
    .replace(/\/\*(?!!)[\s\S]*?\*\//g, '')       // comentarios (conserva /*! */)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

const commit = git('rev-parse HEAD') || 'desconocido';
const dirty = !!git('status --porcelain -- css icons js');
// Sin commit ni fecha en el banner: el contenido solo depende de las fuentes (el commit va en manifest.json).
const banner = `/*! Compensar Design System v${version} | no editar: generado por scripts/build-dist.mjs */\n`;
const css = banner + core.trim() + '\n' + icons + '\n';

/* ---------- JS ---------- */
const js = banner + JS.map((p) => `/* ${p} */\n${read(p).trim()}\n`).join('\n');
try { new vm.Script(js, { filename: 'compensar.min.js' }); } catch (e) { fail(`JS con error de sintaxis: ${e.message}`); }

/* ---------- Escribir en carpeta temporal y comparar ---------- */
const files = { 'compensar.min.css': Buffer.from(css), 'compensar.min.js': Buffer.from(js) };
for (const f of FONTS) files[`fonts/${f}`] = readFileSync(join(ROOT, 'icons', 'fonts', f));

// Toda url() del CSS debe ser data: o un archivo del paquete.
for (const [, , u] of css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
  if (u.startsWith('data:')) continue;
  const clean = u.split(/[?#]/)[0];
  if (!files[clean]) fail(`url() sin resolver en el CSS: ${u}`);
}

const hash = (buf, alg, enc) => createHash(alg).update(buf).digest(enc);
const manifest = {
  paquete: 'compensar',
  version,
  ds: { commit, arbolSucio: dirty },
  generado: new Date().toISOString(),
  incluye: { css: ['css/core.css', 'icons/icons.css'], js: JS, fonts: FONTS.map((f) => `icons/fonts/${f}`) },
  excluye: ['css/portal.css (portal de documentación)', 'css/themes.css (ya compilado dentro de core.css)', 'js de documentación'],
  archivos: Object.fromEntries(Object.entries(files).map(([name, buf]) => [name, {
    bytes: buf.length,
    sha256: hash(buf, 'sha256', 'hex'),
    integrity: `sha384-${hash(buf, 'sha384', 'base64')}`,
  }])),
};

if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
  const same = (a, b) => JSON.stringify(Object.entries(a).map(([k, v]) => [k, v.sha256]).sort()) ===
                         JSON.stringify(Object.entries(b).map(([k, v]) => [k, v.sha256]).sort());
  if (same(prev.archivos, manifest.archivos)) {
    console.log(`build-dist: v${version} ya existe y es idéntica — sin cambios.`);
    process.exit(0);
  }
  fail(`dist/compensar/v${version}/ ya existe con contenido distinto. Las versiones son inmutables: sube la versión en package.json.`);
}

const TMP = `${OUT}.tmp`;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(join(TMP, 'fonts'), { recursive: true });
for (const [name, buf] of Object.entries(files)) writeFileSync(join(TMP, name), buf);
writeFileSync(join(TMP, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
renameSync(TMP, OUT);

console.log(`build-dist: dist/compensar/v${version}/${dirty ? '  (AVISO: css/icons/js con cambios sin commit)' : ''}`);
for (const [name, m] of Object.entries(manifest.archivos)) {
  console.log(`  ${name.padEnd(30)} ${(m.bytes / 1024).toFixed(1).padStart(8)} KB  ${m.integrity.slice(0, 22)}…`);
}
console.log(`  versiones en dist: ${readdirSync(join(ROOT, 'dist', 'compensar')).join(', ')}`);
