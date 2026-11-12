const { chromium } = require('/tmp/pw/node_modules/playwright'); const fs = require('fs'), path = require('path');
const URL = 'http://localhost:8000/_dec012-p3b/header-harness.html';
const CSS = { pre: fs.readFileSync('/tmp/core.preP3.css', 'utf8'), before: fs.readFileSync('/tmp/core.p3final.before.css', 'utf8') };
async function run(variant, px) {
  const dir = fs.mkdtempSync('/tmp/pwprof-'); fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: px, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', viewport: { width: 320, height: 900 } });
  if (CSS[variant]) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS[variant] }));
  const p = ctx.pages()[0]; await p.goto(URL, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const hdr = document.querySelector('#v-public .mp-web-header'); const hr = hdr.getBoundingClientRect(); const out = [];
    hdr.querySelectorAll('.mp-web-header__main > *, .mp-web-header__main .mp-web-header__brand *').forEach(e => { const c = getComputedStyle(e), b = e.getBoundingClientRect();
      if (c.display !== 'none' && b.width > 0) out.push(`${(e.className||e.tagName).toString().split(' ')[0].replace('mp-web-header__','')}: x=${Math.round(b.left)}..${Math.round(b.right)} w=${Math.round(b.width)} font=${c.fontSize}${b.right > hr.right + 0.5 ? '  <-- pasa +' + Math.round(b.right - hr.right) : ''}`); });
    const main = hdr.querySelector('.mp-web-header__main'); const mc = getComputedStyle(main);
    return { headerW: Math.round(hr.width), mainCols: mc.gridTemplateColumns, mainPad: mc.paddingLeft, rows: out }; });
  await ctx.close(); return r;
}
(async () => { for (const px of [24, 32]) for (const v of ['pre', 'before', 'after']) { const r = await run(v, px);
  console.log(`\n--- 320px, texto ${px === 24 ? 150 : 200}% | ${({ pre: 'ANTERIOR A P3', before: 'P3 sin B', after: 'AHORA (B)' })[v]} | header=${r.headerW}px  columnas=[${r.mainCols}] padding-main=${r.mainPad}`); r.rows.forEach(x => console.log('   ' + x)); } })();
