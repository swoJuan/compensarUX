// DEC-011 · Los visores y las descargas de CSS/Sass de las páginas muestran exactamente el CSS generado desde core/
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const HOST = process.env.HOST || 'http://localhost:8000';
const PAGES = [
  ['drupal.html', 'alertas', 'alert'], ['drupal.html', 'toast', 'toast'], ['drupal.html', 'modales', 'modal'], ['drupal.html', 'seleccion', 'selection'],
  ['drupal.html', 'badges', 'badges'], ['drupal.html', 'avatar', 'avatar'], ['drupal.html', 'header', 'web-header'], ['drupal.html', 'sidebar', 'sidebar'],
  ['drupal.html', 'stepper', 'stepper'], ['drupal.html', 'paginacion', 'pagination'], ['drupal.html', 'dropdown', 'dropdown'], ['drupal.html', 'cards', 'cards'], ['drupal.html', 'tables', 'tables'], ['drupal.html', 'loading', 'loading'], ['drupal.html', 'breadcrumb', 'breadcrumb'], ['drupal.html', 'accordion', 'accordion'],
];
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const fails = []; const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
  const pa = await b.newPage(); await pa.goto(`${HOST}/app.html`, { waitUntil: 'domcontentloaded' }); await pa.waitForTimeout(1500);
  const appRoutes = await pa.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)))].filter(h => /bottom|sheet/i.test(h))); await pa.close();
  appRoutes.slice(0, 1).forEach(r => PAGES.push(['app.html', r, 'app-bottom-sheet']));
  for (const [shell, route, key] of PAGES) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 100)));
    await p.goto(`${HOST}/${shell}#${route}`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600);
    const expCss = await p.evaluate(k => window.mpDocsCss(k), key), expScss = await p.evaluate(k => window.mpDocsScss(k), key);
    const T = `${shell}#${route}`;
    ok(/Generado por scripts\/generate-docs-css\.mjs/.test(expCss) && expCss.length > 1500, `${T}: mpDocsCss('${key}') vacío o sin firma`);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#content button')].map(bt => { const a = [...bt.attributes].find(x => /^data-.*tab$/.test(x.name) && /^(css|sass|scss)$/i.test(x.value)); return a ? { attr: a.name, val: a.value } : null; }).filter(Boolean));
    ok(tabs.length > 0, `${T}: no se encontraron pestañas CSS/Sass`);
    let sawCss = false, sawSass = false;
    for (const t of tabs) {
      await p.evaluate(({ attr, val }) => { const bt = [...document.querySelectorAll('#content button')].find(x => x.getAttribute(attr) === val); bt && bt.click(); }, t);
      await p.waitForTimeout(120);
      const pres = await p.evaluate(() => [...document.querySelectorAll('#content pre, #content code')].map(e => e.textContent));
      if (/^css$/i.test(t.val)) sawCss = sawCss || pres.some(x => x === expCss); else sawSass = sawSass || pres.some(x => x === expScss);
    }
    ok(tabs.length === 0 || sawCss, `${T}: la pestaña CSS no muestra el CSS generado`);
    ok(tabs.length === 0 || sawSass, `${T}: la pestaña Sass no muestra el Sass generado`);
    const dls = await p.evaluate(() => [...document.querySelectorAll('#content button')].map(bt => { const a = [...bt.attributes].find(x => /^data-.*download$/.test(x.name) && /^(css|sass|scss)$/i.test(x.value)); return a ? { attr: a.name, val: a.value } : null; }).filter(Boolean));
    ok(dls.length > 0 || ['cards', 'tables'].includes(key), `${T}: no se encontraron botones de descarga CSS/Sass`);
    for (const d of dls) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.evaluate(({ attr, val }) => [...document.querySelectorAll('#content button')].find(x => x.getAttribute(attr) === val).click(), d)]);
      if (!dl) { ok(false, `${T}: descarga ${d.val} no se inició`); continue; }
      const txt = fs.readFileSync(await dl.path(), 'utf8');
      const isCss = /^css$/i.test(d.val);
      ok(isCss ? txt === expCss : txt.includes(expCss.trim().slice(0, 400)), `${T}: descarga ${d.val} (${dl.suggestedFilename()}) no coincide con lo generado`);
    }
    ok(/rem/.test(expCss), `${T}: el CSS generado no contiene rem`);
    ok(errs.length === 0, `${T}: errores JS ${errs.join(' | ')}`);
    await p.close();
  }
  await b.close();
  console.log(`exports: PASS ${pass}  FAIL ${fail}  (${PAGES.length} páginas)`); fails.forEach(f => console.log(' ✗', f));
})();
