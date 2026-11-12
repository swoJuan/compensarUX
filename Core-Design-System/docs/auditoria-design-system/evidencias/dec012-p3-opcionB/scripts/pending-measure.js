const { chromium } = require('/tmp/pw/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('http://localhost:8000/_dec012-p3b/header-harness.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const zt = await p.evaluate(() => { const main = document.querySelector('#v-zt .mp-web-header__main'), cs = getComputedStyle(main);
    return { declaredCols: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => r.selectorText === '.mp-web-header--zt .mp-web-header__main').map(r => r.style.gridTemplateColumns),
      resolvedCols: cs.gridTemplateColumns,
      children: [...main.children].map(e => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return `${(e.className || e.tagName).toString().split(' ')[0].replace('mp-web-header__', '')}: display=${c.display} w=${Math.round(r.width)}`; }) }; });
  console.log('ZT (1280px, texto 100%):', JSON.stringify(zt, null, 1));
  await p.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<span class="mp-chip mp-chip--sm" id="c-sm">S</span><span class="mp-chip" id="c-md">M</span><span class="mp-chip mp-chip--lg" id="c-lg">L</span>'));
  const ch = await p.evaluate(() => ['c-sm', 'c-md', 'c-lg'].map(id => { const c = getComputedStyle(document.getElementById(id)); return `${id}: font-size=${c.fontSize} min-height=${c.minHeight}`; }));
  console.log('Chips:', ch.join(' | '));
  const defs = await p.evaluate(() => ({ fsMd: getComputedStyle(document.documentElement).getPropertyValue('--font-size-md').trim(), fsSm: getComputedStyle(document.documentElement).getPropertyValue('--font-size-sm').trim(), bodyL: getComputedStyle(document.documentElement).getPropertyValue('--body---l').trim() }));
  console.log('Aliases:', JSON.stringify(defs));
  await b.close();
})();
