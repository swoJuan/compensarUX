#!/usr/bin/env node
// DEC-011 · Genera el CSS que muestran y descargan las páginas de documentación a partir de core/ (fuente única).
//
// Problema que resuelve (P-011-02): 13 archivos js/*-docs.js embebían a mano el CSS de su componente. Nadie los actualizaba cuando
// cambiaba core/, y quien copiaba o descargaba el CSS obtenía valores que ya no coincidían con el componente publicado.
//
// Cómo funciona
//   1. Compila cada parcial real (core/components/**/_x.scss) con la API de Sass en modo expandido: sale el mismo CSS que css/core.css,
//      con rem() ya resuelto y sin comentarios Sass.
//   2. Toma los tokens que ese CSS necesita (var(--x) que no define el propio componente), los resuelve con sus alias y los emite por
//      tema (Light / Dark / Alto contraste) desde core/base/_theme.scss. Así la descarga sigue siendo autocontenida.
//   3. Escribe js/docs-css.generated.js. Los *-docs.js solo lo leen con mpDocsCss('clave') y mpDocsScss('clave').
//
// Uso:  node scripts/generate-docs-css.mjs           regenera js/docs-css.generated.js
//       node scripts/generate-docs-css.mjs --check   no escribe; sale con 1 si el archivo está desfasado respecto a core/, o si algún
//                                                    *-docs.js volvió a embeber CSS a mano. Úsalo en CI o antes de cada release.
// No modifica Bootstrap, vendors ni core/. Idempotente y determinista (sin fechas).
import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';

const root = process.cwd();
const check = process.argv.includes('--check');
const OUT = path.join(root, 'js/docs-css.generated.js');

// clave del script de documentación → { parcial, título, script }
const COMPONENTS = {
  'alert':            { part: 'web/alerts',            title: 'Alert',                      script: 'alert-docs.js' },
  'modal':            { part: 'web/modals',            title: 'Modal',                      script: 'modal-docs.js' },
  'toast':            { part: 'web/toasts',            title: 'Toast',                      script: 'toast-docs.js' },
  'selection':        { part: 'web/selection-controls', title: 'Checkbox / Radio / Switch', script: 'selection-docs.js' },
  'badges':           { part: 'web/badges',            title: 'Badge / Chip / Tag',         script: 'badges-docs.js' },
  'avatar':           { part: 'web/avatar',            title: 'Avatar / User chip',         script: 'avatar-docs.js' },
  'web-header':       { part: 'web/header',            title: 'Header Web / Drupal',        script: 'web-header-docs.js' },
  'sidebar':          { part: 'web/sidebar',           title: 'Sidebar',                    script: 'sidebar-docs.js' },
  'stepper':          { part: 'web/stepper',           title: 'Stepper',                    script: 'stepper-docs.js' },
  'loading':          { part: 'web/loading',           title: 'Loading',                    script: 'loading-docs.js' },
  'breadcrumb':       { part: 'web/breadcrumb',        title: 'Breadcrumb',                 script: 'breadcrumb-docs.js' },
  'accordion':        { part: 'web/accordion',         title: 'Accordion',                  script: 'accordion-docs.js' },
  'app-bottom-sheet': { part: 'app/bottom-sheet',      title: 'Bottom Sheet (App)',         script: 'app-bottom-sheet-docs.js' },
  'pagination':       { part: 'web/pagination',       title: 'Pagination',                 script: 'pagination-docs.js' },
  'dropdown':         { part: 'web/dropdown',          title: 'Dropdown / Select',          script: 'dropdown-docs.js' },
  'cards':            { part: 'web/cards',             title: 'Cards',                      script: 'cards-docs.js' },
  'tables':           { part: 'web/tables',            title: 'Tables',                     script: 'tables-docs.js' },
};

const SASS_OPTS = {
  loadPaths: [root, path.join(root, 'node_modules')],
  style: 'expanded',
  quietDeps: true,
  silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
};
const compile = part => sass.compileString(`@use "core/${part.startsWith('web/') || part.startsWith('app/') ? 'components/' : ''}${part}";`, SASS_OPTS).css;

// ── Parser mínimo del CSS expandido de Sass (una declaración por línea, sin comentarios) ──────────────────────────
function parseRules(css, atContext = '') {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth && j < css.length) { const c = css[j++]; if (c === '{') depth++; else if (c === '}') depth--; }
    const body = css.slice(open + 1, j - 1);
    if (/^@(media|supports)/.test(head)) rules.push(...parseRules(body, `${atContext}${head} | `));
    else if (!head.startsWith('@')) rules.push({ at: atContext, selector: head.replace(/\s+/g, ' '), body });
    i = j;
  }
  return rules;
}
const declsOf = body => {
  const out = new Map();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
};

// ── Mapas de tokens por tema (core/base/_theme.scss compilado) ────────────────────────────────────────────────────
const themeRules = parseRules(compile('base/theme')).filter(r => !r.at);
const light = new Map(), dark = new Map(), hc = new Map();
for (const r of themeRules) {
  const sels = r.selector.split(',').map(s => s.trim());
  const d = declsOf(r.body);
  const isLightBase = sels.includes(':root');
  const isDark = sels.length === 1 && /^\[data-theme=["']?dark["']?\]$/.test(sels[0]);
  const isHc = sels.length === 1 && /^\[data-theme=["']?high-contrast["']?\]$/.test(sels[0]);
  if (isLightBase) for (const [k, v] of d) light.set(k, v);
  if (isDark) for (const [k, v] of d) dark.set(k, v);
  if (isHc) for (const [k, v] of d) hc.set(k, v);
}
if (!light.size || !dark.size || !hc.size) {
  console.error(`✗ No se pudieron leer los tokens por tema de core/base/_theme.scss (light=${light.size}, dark=${dark.size}, high-contrast=${hc.size}). Revisa los selectores de _theme.scss.`);
  process.exit(2);
}
const refs = value => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);

// Tokens (y sus alias, de forma transitiva) que necesita un CSS y que no define él mismo
function neededTokens(css) {
  const own = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const need = new Set();
  const stack = [...new Set(refs(css))].filter(n => !own.has(n));
  while (stack.length) {
    const n = stack.pop();
    if (need.has(n)) continue;
    if (!light.has(n) && !dark.has(n) && !hc.has(n)) continue;           // p. ej. --bs-* o una propiedad inexistente: no se inventa
    need.add(n);
    for (const m of [light, dark, hc]) if (m.has(n)) for (const r of refs(m.get(n))) if (!own.has(r)) stack.push(r);
  }
  return [...need].sort();
}
function tokenBlock(names) {
  const L = [], D = [], H = [];
  for (const n of names) {
    const lv = light.get(n);
    if (lv !== undefined) L.push(`  ${n}: ${lv};`);
    const dv = dark.get(n); if (dv !== undefined && dv !== lv) D.push(`  ${n}: ${dv};`);
    const hv = hc.get(n);   if (hv !== undefined && hv !== lv) H.push(`  ${n}: ${hv};`);
  }
  let out = `/* Tokens que usa este componente (core/base/_theme.scss). Si ya cargas css/core.css puedes omitir este bloque. */\n:root,\n[data-theme="light"] {\n${L.join('\n')}\n}\n`;
  if (D.length) out += `[data-theme="dark"] {\n${D.join('\n')}\n}\n`;
  if (H.length) out += `[data-theme="high-contrast"] {\n${H.join('\n')}\n}\n`;
  return out;
}

// ── Construcción ─────────────────────────────────────────────────────────────────────────────────────────────────
const entries = {};
for (const [key, c] of Object.entries(COMPONENTS)) {
  const base = compile(c.part).trim() + '\n';
  const tokens = tokenBlock(neededTokens(base));
  const dir = c.part.split('/')[0];
  const source = `core/components/${dir}/_${c.part.split('/')[1]}.scss`;
  const head = `${c.title} - Compensar Design System\n   Fuente: ${source}\n   Generado por scripts/generate-docs-css.mjs: no editar a mano.`;
  entries[key] = { source, css: `/* ${head} */\n\n${tokens}\n${base}` };
}

const banner = `/* ============================================================
   CSS DE DOCUMENTACIÓN - GENERADO. NO EDITAR A MANO.
   Fuente: core/components/{web,app}/_<componente>.scss + core/base/_theme.scss
   Regenerar:  node scripts/generate-docs-css.mjs
   Verificar:  node scripts/generate-docs-css.mjs --check
   ============================================================ */
`;
const body = `${banner}(function (global) {
  'use strict';
  var DATA = ${JSON.stringify(entries, null, 2)};
  function pick(key, kind) {
    var e = DATA[key];
    if (!e) return '/* mpDocsCss: no hay CSS generado para "' + key + '". Ejecuta node scripts/generate-docs-css.mjs */';
    return e[kind];
  }
  global.mpDocsCss = function (key) { return pick(key, 'css'); };
  // El CSS plano es Sass válido: la descarga .scss lleva el mismo contenido con una nota de cabecera.
  global.mpDocsScss = function (key) {
    var css = pick(key, 'css');
    return '// Sass: el CSS plano de abajo es Sass válido (tokens incluidos, archivo autocontenido).\\n' + css;
  };
  global.mpDocsCssSource = function (key) { return DATA[key] ? DATA[key].source : ''; };
})(window);
`;

// ── Comprobaciones de higiene sobre los *-docs.js ────────────────────────────────────────────────────────────────
const problems = [];
for (const [key, c] of Object.entries(COMPONENTS)) {
  const file = path.join(root, 'js', c.script);
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!src) { problems.push(`${c.script}: no existe`); continue; }
  if (!new RegExp(`mpDocsCss\\(\\s*['"]${key}['"]\\s*\\)`).test(src)) problems.push(`${c.script}: no lee mpDocsCss('${key}')`);
  // CSS embebido a mano: una regla de componente (.mp-x { … }) dentro de una plantilla de texto
  if (new RegExp('`[^`]*\\.(?:mp|app)-[a-z0-9_-]+[^`]*\\{[^`]*--?[a-z-]+\\s*:[^`]*\\}[^`]*`').test(src.replace(/\$\{[^}]*\}/g, ''))) {
    const m = src.match(/(const|let|var)\s+(exportCss|exportSass|exportScss)\s*=\s*`/);
    if (m) problems.push(`${c.script}: ${m[2]} vuelve a embeber CSS a mano`);
  }
}
if (!fs.existsSync(path.join(root, 'drupal.html')) || !/docs-css\.generated\.js/.test(fs.readFileSync(path.join(root, 'drupal.html'), 'utf8'))) problems.push('drupal.html no carga js/docs-css.generated.js');
if (!/docs-css\.generated\.js/.test(fs.readFileSync(path.join(root, 'app.html'), 'utf8'))) problems.push('app.html no carga js/docs-css.generated.js');
for (const shell of ['drupal.html', 'app.html']) {
  const html = fs.readFileSync(path.join(root, shell), 'utf8');
  const i = html.indexOf('docs-css.generated.js'), j = html.indexOf('-docs.js');
  if (i > -1 && j > -1 && i > j) problems.push(`${shell} carga docs-css.generated.js DESPUÉS de un *-docs.js (debe ir antes)`);
}

const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
const stale = current !== body;
if (check) {
  if (stale) console.log('js/docs-css.generated.js está DESFASADO respecto a core/. Ejecuta: node scripts/generate-docs-css.mjs');
  problems.forEach(p => console.log('✗', p));
  if (!stale && !problems.length) console.log(`docs-css: sincronizado (${Object.keys(entries).length} componentes)`);
  process.exit(stale || problems.length ? 1 : 0);
}
if (stale) { fs.writeFileSync(OUT, body); console.log(`js/docs-css.generated.js actualizado (${Object.keys(entries).length} componentes, ${(body.length / 1024).toFixed(0)} KB)`); }
else console.log('js/docs-css.generated.js ya estaba sincronizado');
problems.forEach(p => console.log('! ', p));
