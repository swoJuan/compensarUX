#!/usr/bin/env node
/**
 * regresion.mjs — Prueba de regresión visual y de estilos de los prototipos
 * ANTES de sincronizar una versión del sistema de diseño.
 *
 * Crea dos copias temporales de los prototipos (fuera del repositorio):
 *   A = como están hoy        B = con los archivos del sistema de diseño de --ref
 * y compara todas las páginas de Drupal, ZT y APP:
 *   1. Visual: capturas a 1440, 390 y 320 px y diferencia de píxeles.
 *   2. Estilos calculados de TODOS los elementos (incluye modales y menús ocultos).
 *   3. Errores de JavaScript y recursos 404 en B.
 * Fecha y Math.random fijos para que la comparación sea estable.
 *
 *   node regresion.mjs --ref v2.2.0 [--umbral 0.5] [--salida ./regresion]
 *   node regresion.mjs --css-candidato ruta/core.css      (probar un core.css suelto)
 *
 * Requiere Playwright:  npm i -D playwright@1.47.2 && npx playwright install chromium
 * Sale con código 1 si alguna página supera el umbral o hay errores nuevos.
 * No modifica los prototipos ni el sistema de diseño.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, def) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : def; };
const flag = (n) => process.argv.includes(n);
const COMPENSAR = path.resolve(AQUI, '..', '..', '..');
const DS = path.resolve(arg('--ds', path.join(COMPENSAR, 'Core-Design-System')));
const FLUJOS = path.resolve(arg('--flujos', path.join(COMPENSAR, 'Flujos', 'prototipos')));
const REF = arg('--ref');
const CSS_CAND = arg('--css-candidato');
const UMBRAL = Number(arg('--umbral', '0.5'));
const SALIDA = path.resolve(arg('--salida', path.join(AQUI, 'regresion', new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'))));
const VISTAS = { escritorio: { width: 1440, height: 900 }, movil: { width: 390, height: 844 }, 'movil-320': { width: 320, height: 640 } };
const PROPS = ['font-size', 'font-weight', 'line-height', 'color', 'background-color', 'border-top-color', 'border-top-width', 'border-top-style', 'border-radius', 'box-shadow', 'opacity', 'padding-top', 'padding-left', 'margin-top', 'gap', 'grid-template-columns', 'display', 'position', 'width', 'cursor', 'outline-style'];

let chromium, PNG, pixelmatch;
try {
  ({ chromium } = await import('playwright'));
  ({ PNG } = await import('pngjs'));
  pixelmatch = (await import('pixelmatch')).default;
} catch {
  console.error('Faltan dependencias: npm i -D playwright@1.47.2 pngjs@7.0.0 pixelmatch@5.3.0 && npx playwright install chromium');
  process.exit(1);
}
if (!REF && !CSS_CAND) { console.error('Indica --ref <tag> o --css-candidato <archivo>'); process.exit(1); }

/* ---------- copias temporales A y B ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'regresion-ds-'));
const A = path.join(TMP, 'A'), B = path.join(TMP, 'B');
fs.cpSync(FLUJOS, A, { recursive: true, filter: (s) => !s.includes(`${path.sep}.git`) });
fs.cpSync(A, B, { recursive: true });
const MAPA = [['css/core.css', 'shared/vendor/core.css'], ['css/portal.css', 'shared/vendor/portal.css'], ['icons/icons.css', 'shared/icons/icons.css'], ['js/mp-tabs.js', 'shared/vendor/mp-tabs.js']];
if (CSS_CAND) fs.copyFileSync(CSS_CAND, path.join(B, 'shared/vendor/core.css'));
else {
  // El sistema de diseño puede ser una carpeta dentro del repositorio único: en "<ref>:<ruta>"
  // git espera la ruta desde la raíz, así que se antepone esa subcarpeta.
  let prefijo = '';
  try { prefijo = execFileSync('git', ['-C', DS, '--no-optional-locks', 'rev-parse', '--show-prefix']).toString().trim().replace(/\/?$/, ''); } catch {}
  for (const [o, d] of MAPA) {
    const enRepo = prefijo ? `${prefijo}/${o}` : o;
    fs.writeFileSync(path.join(B, d), execFileSync('git', ['-C', DS, '--no-optional-locks', 'show', `${REF}:${enRepo}`], { maxBuffer: 1 << 30 }));
  }
}

const paginas = [];
(function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) { if (!['vendor', 'node_modules', 'scripts'].includes(e.name)) walk(f); } else if (e.name.endsWith('.html') && !e.name.startsWith('_')) paginas.push(path.relative(A, f).split(path.sep).join('/')); } })(A);
paginas.sort();

/* ---------- servidores estáticos ---------- */
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function servir(raiz) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let f = path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}
const sA = await servir(A), sB = await servir(B);
const urlA = `http://127.0.0.1:${sA.address().port}/`, urlB = `http://127.0.0.1:${sB.address().port}/`;

/* ---------- comparación ---------- */
const FIJAR = () => { const t = new Date('2026-01-15T10:00:00-05:00').valueOf(); const D = Date; class F extends D { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } } window.Date = F; Math.random = () => 0.42; };
function pad(png, w, h) { if (png.width === w && png.height === h) return png; const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(png, o, 0, 0, Math.min(png.width, w), Math.min(png.height, h), 0, 0); return o; }
async function captura(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' }).catch(() => {});
  await page.waitForTimeout(400);
  const h = Math.min(5000, Math.max(page.viewportSize().height, await page.evaluate(() => document.documentElement.scrollHeight)));
  return PNG.sync.read(await page.screenshot({ clip: { x: 0, y: 0, width: page.viewportSize().width, height: h }, fullPage: true }));
}
async function estilos(page) {
  return page.evaluate((PROPS) => [...document.querySelectorAll('body *')].filter((e) => !['SCRIPT', 'STYLE', 'LINK'].includes(e.tagName)).map((e) => {
    const cs = getComputedStyle(e); const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return { k: (cls || e.tagName.toLowerCase()) + (e.hasAttribute('readonly') ? '[readonly]' : '') + (e.disabled ? '[disabled]' : ''), v: PROPS.map((p) => cs.getPropertyValue(p)) };
  }), PROPS);
}

fs.mkdirSync(SALIDA, { recursive: true });
const browser = await chromium.launch();
const filas = [];
const estilosCambiados = new Map();
for (const [vista, vp] of Object.entries(VISTAS)) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  await ctx.addInitScript(FIJAR);
  const pA = await ctx.newPage(), pB = await ctx.newPage();
  const errB = [];
  pB.on('pageerror', (e) => errB.push(e.message));
  pB.on('response', (r) => { if (r.url().startsWith(urlB) && r.status() >= 400) errB.push(`${r.status()} ${r.url().replace(urlB, '/')}`); });
  for (const pg of paginas) {
    errB.length = 0;
    const a = await captura(pA, urlA + pg), b = await captura(pB, urlB + pg);
    const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
    const dif = new PNG({ width: w, height: h });
    const n = pixelmatch(pad(a, w, h).data, pad(b, w, h).data, dif.data, w, h, { threshold: 0.1 });
    const pct = +(n / (w * h) * 100).toFixed(2);
    if (vista === 'escritorio') {
      const [eA, eB] = [await estilos(pA), await estilos(pB)];
      if (eA.length === eB.length) eA.forEach((x, i) => x.v.forEach((v, j) => { if (v !== eB[i].v[j]) { const c = `${x.k} · ${PROPS[j]}: ${v} → ${eB[i].v[j]}`; estilosCambiados.set(c, (estilosCambiados.get(c) || new Set()).add(pg)); } }));
    }
    const nombre = `${vista}__${pg.replace(/[/.]/g, '_')}`;
    if (pct > 0) fs.writeFileSync(path.join(SALIDA, nombre + '__dif.png'), PNG.sync.write(dif));
    filas.push({ vista, pagina: pg, pct, errores: [...errB], alto: [a.height, b.height] });
    console.log(`${vista.padEnd(10)} ${pct.toFixed(2).padStart(6)}%  ${pg}${errB.length ? '  ⚠ ' + errB.length + ' errores' : ''}`);
  }
  await ctx.close();
}
await browser.close(); sA.close(); sB.close();
fs.rmSync(TMP, { recursive: true, force: true });

const fallan = filas.filter((f) => f.pct > UMBRAL || f.errores.length);
const reporte = { fecha: new Date().toISOString(), candidato: REF || CSS_CAND, umbral: UMBRAL, paginas: paginas.length, resultado: fallan.length ? 'revisar' : 'ok', filas, estilos: [...estilosCambiados].map(([k, v]) => ({ cambio: k, paginas: [...v] })) };
fs.writeFileSync(path.join(SALIDA, 'reporte.json'), JSON.stringify(reporte, null, 2));
console.log(`\nPáginas: ${paginas.length} × ${Object.keys(VISTAS).length} vistas · cambios de estilo distintos: ${reporte.estilos.length}`);
reporte.estilos.slice(0, 30).forEach((e) => console.log(`  ${String(e.paginas.length).padStart(3)} págs · ${e.cambio}`));
console.log(fallan.length ? `\n⚠ ${fallan.length} casos superan ${UMBRAL}% o tienen errores. Revisa ${SALIDA}` : `\n✓ Sin diferencias por encima de ${UMBRAL}% ni errores. Reporte: ${SALIDA}`);
process.exit(fallan.length ? 1 : 0);
