// Responsive residual de las 8 páginas: desborde de .main (con fuentes cargadas) y elementos culpables.
// Uso: node responsive-8.js [tag]   (servidor en :8000; requiere /tmp/qa)
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const ROUTES = ['accordion', 'breadcrumb', 'cards', 'empty-state', 'inputs', 'loading', 'sidebar', 'stepper'];
const WIDTHS = [1280, 768, 375, 320];
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let bad = 0, total = 0;
  for (const w of WIDTHS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const r of ROUTES) {
      await p.goto(`http://localhost:8000/drupal.html#${r}`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(900);
      await p.evaluate(() => document.fonts.ready);
      const m = await p.evaluate(() => {
        const mn = document.querySelector('.main'); const lim = mn.getBoundingClientRect().right;
        const sig = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(/\s+/).slice(0, 2).join('.');
        const out = [];
        for (const e of document.querySelectorAll('#content *')) {
          const bb = e.getBoundingClientRect(); if (!bb.width || bb.right <= lim + 2) continue;
          let a = e.parentElement, clipped = false;
          while (a && a !== mn) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) { clipped = true; break; } a = a.parentElement; }
          if (!clipped) out.push(sig(e) + '+' + Math.round(bb.right - lim));
        }
        return { over: mn.scrollWidth - mn.clientWidth, page: document.documentElement.scrollWidth - document.documentElement.clientWidth, icons: document.fonts.check('24px "Material Symbols Rounded"'), who: out.slice(0, 4) };
      });
      total++;
      const fail = m.over > 2 || m.page > 2;
      if (fail) bad++;
      console.log(`${fail ? 'FALLA' : 'ok   '} ${String(w).padEnd(5)} ${r.padEnd(12)} main:${m.over} page:${m.page} iconFont:${m.icons}${fail ? ' ' + m.who.join(' | ') : ''}`);
    }
    await p.close();
  }
  await b.close();
  console.log(`\n${total - bad}/${total} sin desborde`);
  process.exit(bad ? 1 : 0);
})();
