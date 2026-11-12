const { chromium } = require('/tmp/pw/node_modules/playwright'); const fs = require('fs'), path = require('path');
const URL = 'http://localhost:8000/_dec012-p3b/header-harness.html';
const FIX = '.mp-web-header__brand{min-width:0}.mp-web-header__brand-text{min-width:0;overflow-wrap:anywhere}';   // PRUEBA, no se aplica al repo
async function run(px, w, inject) {
  const dir = fs.mkdtempSync('/tmp/pwprof-'); fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: px, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', viewport: { width: w, height: 900 } });
  const p = ctx.pages()[0]; await p.goto(URL, { waitUntil: 'networkidle' }); if (inject) await p.addStyleTag({ content: FIX });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const d = document.documentElement; const hdr = document.querySelector('#v-public .mp-web-header'); const hr = hdr.getBoundingClientRect();
    const items = [...hdr.querySelectorAll('.mp-web-header__main > *')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
    return { docOver: Math.max(0, d.scrollWidth - d.clientWidth), beyond: items.filter(e => e.getBoundingClientRect().right > hr.right + 0.5).length,
             brandH: Math.round(hdr.querySelector('.mp-web-header__brand').getBoundingClientRect().height) }; });
  await ctx.close(); return r;
}
(async () => { console.log('ancho | texto | sin fix              | con fix (min-width:0 + overflow-wrap en la marca)');
  for (const w of [320, 360]) for (const px of [16, 24, 32]) { const a = await run(px, w, false), b = await run(px, w, true);
    const f = (x) => `overflow doc=${x.docOver}px, fuera=${x.beyond}, alto marca=${x.brandH}px`;
    console.log(`${String(w).padStart(4)} | ${String(px / 16 * 100).padStart(4)}% | ${f(a).padEnd(46)} | ${f(b)}`); } })();
