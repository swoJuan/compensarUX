const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8000/drupal.html';
const BASELINE_CSS = fs.readFileSync('/tmp/core.p3.before.css', 'utf8');
async function probe(useBaseline) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  if (useBaseline) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: BASELINE_CSS }));
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  const out = {};
  for (const sec of ['header', 'sidebar']) {
    await p.evaluate(h => { location.hash = '#' + h; }, sec);
    await p.waitForTimeout(1800);
    out[sec] = await p.evaluate(() => {
      const core = [...document.styleSheets].find(s => s.href && s.href.includes('core.css'));
      let rules = {};
      for (const r of core.cssRules) {
        if (r.selectorText === '.mp-web-header__logo') rules.logoRule = r.style.width;
        if (r.selectorText === '.mp-sidebar') rules.sidebarWidthVar = r.style.getPropertyValue('--mp-sidebar-width');
        if (r.selectorText === '.icon-24') rules.icon24 = r.style.fontSize;
      }
      return { ...rules,
        nHeader: document.querySelectorAll('[class*="mp-web-header"]').length,
        nSidebar: document.querySelectorAll('[class*="mp-sidebar"]').length,
        nAll: document.body.querySelectorAll('*').length };
    });
  }
  await b.close();
  return out;
}
(async () => {
  console.log('BASELINE:', JSON.stringify(await probe(true)));
  console.log('NUEVO   :', JSON.stringify(await probe(false)));
})();
