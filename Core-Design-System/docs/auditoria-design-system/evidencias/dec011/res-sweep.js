// Recursos rotos, imágenes caídas y contenedores de preview/playground vacíos en todas las rutas del portal
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const HOST = 'http://localhost:8000';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  const report = [];
  for (const shell of ['drupal.html', 'app.html']) {
    const p0 = await b.newPage(); await p0.goto(`${HOST}/${shell}`, { waitUntil: 'domcontentloaded' }); await p0.waitForTimeout(1500);
    const routes = await p0.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(h => h && !h.includes(' ')))]); await p0.close();
    for (const r of routes) {
      const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const bad = [], errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 90)));
      p.on('requestfailed', rq => { const u = rq.url(); if (!/fonts\.g/.test(u)) bad.push('FAIL ' + u.slice(0, 110)); });
      p.on('response', rs => { if (rs.status() >= 400) bad.push(rs.status() + ' ' + rs.url().slice(0, 110)); });
      await p.goto(`${HOST}/${shell}#${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const imgs = [...document.querySelectorAll('#content img')].filter(i => i.complete && i.naturalWidth === 0).map(i => (i.getAttribute('src') || '').slice(0, 100));
        const ext = [...document.querySelectorAll('#content img, #content source, #content link[href], #content script[src]')].map(e => e.getAttribute('src') || e.getAttribute('href') || '').filter(u => /^https?:/.test(u) && !/fonts\.g/.test(u)).map(u => u.slice(0, 100));
        const empties = [...document.querySelectorAll('#content [id*="preview"], #content [id*="playground"], #content [data-preview], #content [data-playground]')].filter(e => !e.children.length && !e.textContent.trim()).map(e => '#' + (e.id || e.className));
        return { imgs, ext, empties, hasContent: document.getElementById('content').children.length };
      });
      report.push({ shell, r, errs, bad, ...m }); await p.close();
    }
  }
  await b.close();
  const issue = x => x.imgs.length || x.bad.length || x.empties.length || x.errs.length || x.ext.length;
  const bad = report.filter(issue);
  console.log(`rutas: ${report.length} | con hallazgos: ${bad.length}`);
  bad.forEach(x => console.log(`- ${x.shell}#${x.r}`, JSON.stringify({ imgs: x.imgs, bad: x.bad.slice(0, 3), empties: x.empties, errs: x.errs, ext: x.ext })));
  require('fs').writeFileSync('/tmp/qa/res-sweep.json', JSON.stringify(report, null, 1));
})();
