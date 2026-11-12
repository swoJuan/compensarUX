const { chromium } = require('playwright'); const fs = require('fs');
const URL = 'http://localhost:8000/_dec012-p3/header-harness.html';
const BASELINE_CSS = fs.readFileSync('/tmp/core.p3.before.css', 'utf8');
async function run(useBaseline, pct, width) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width, height: 900 } });
  if (useBaseline) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: BASELINE_CSS }));
  const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  await p.evaluate(x => { document.documentElement.style.fontSize = x + '%'; }, pct); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  await b.close(); return r.s > r.c + 1 ? `desborda +${r.s - r.c}px` : 'ok';
}
(async () => {
  console.log('ancho | texto | ANTES de P3 | DESPUES de P3');
  for (const w of [769, 900, 1024, 1280]) for (const pct of [100, 150, 200]) {
    const a = await run(true, pct, w), c = await run(false, pct, w);
    console.log(`${String(w).padStart(5)} | ${String(pct).padStart(4)}% | ${a.padEnd(16)}| ${c}${a !== c ? '   <-- cambia' : ''}`);
  }
})();
