// Barrido del portal real: base (core.css anterior, interceptado) vs nuevo. Errores JS, peticiones fallidas locales y desborde, a 1280 y 375 px.
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const BASE_CSS = fs.readFileSync('/tmp/qa/base/core.css', 'utf8');
const HOSTS = { base: 'http://localhost:8001', nuevo: 'http://localhost:8000' };
const HOST = HOSTS.nuevo;
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  const res = {};
  for (const shell of ['drupal.html', 'app.html']) {
    const p0 = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p0.goto(`${HOST}/${shell}`, { waitUntil: 'domcontentloaded' }); await p0.waitForTimeout(1800);
    const routes = await p0.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(h => h && !h.includes(' ')))]);
    await p0.close();
    for (const w of [1280, 375]) for (const variant of ['base', 'nuevo']) for (const r of routes) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } }); const errs = [], bad = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 80)));
      p.on('requestfailed', rq => { if (rq.url().startsWith(HOSTS[variant])) bad.push(rq.url().slice(-50)); });
      p.on('response', rs => { if (rs.url().startsWith(HOSTS[variant]) && rs.status() >= 400) bad.push(rs.status() + ' ' + rs.url().slice(-50)); });
      await p.goto(`${HOSTS[variant]}/${shell}#${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(600);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const k = `${shell}#${r} @${w}`; (res[k] = res[k] || {})[variant] = { errs: errs.length, bad: bad.length, over };
      await p.close();
    }
  }
  await b.close();
  let n = 0, jsNew = 0, ovNew = 0, badNew = 0; const diffs = [];
  for (const [k, v] of Object.entries(res)) { n++; if (v.nuevo.errs > v.base.errs) { jsNew++; diffs.push(`JS ${k}`); } if (v.nuevo.over > Math.max(v.base.over, 0)) { ovNew++; diffs.push(`OVERFLOW ${k} base ${v.base.over} nuevo ${v.nuevo.over}`); } if (v.nuevo.bad > v.base.bad) { badNew++; diffs.push(`RED ${k}`); } }
  console.log(`rutas×anchos: ${n} | errores JS nuevos: ${jsNew} | desbordes nuevos: ${ovNew} | peticiones fallidas nuevas: ${badNew}`);
  diffs.slice(0, 30).forEach(d => console.log(' -', d));
  fs.writeFileSync('/tmp/qa/sweep2.json', JSON.stringify(res));
})();
