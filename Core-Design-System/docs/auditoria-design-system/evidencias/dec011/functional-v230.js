// Regresión focalizada v2.3.0 en Chromium: comprobaciones de inpage-v230.js en las páginas tocadas, 1280 / 375 / 320 px.
// Uso: node functional-v230.js   (servidor en :8000; requiere /tmp/qa)
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const src = require('fs').readFileSync(__dirname + '/inpage-v230.js', 'utf8').replace(/if \(typeof module[\s\S]*$/, '');
const ROUTES = (process.argv[2] || ['accordion', 'breadcrumb', 'cards', 'empty-state', 'inputs', 'loading', 'sidebar', 'stepper', 'header', 'badges', 'avatar', 'tables', 'guidelines/form-patterns'].join(',')).split(',');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let ok = 0, bad = 0;
  for (const w of [1280, 375, 320]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const r of ROUTES) {
      await p.goto(`http://localhost:8000/drupal.html#${r}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(1500);
      const res = await p.evaluate(`(${src.trim()})('${r.split('/').pop() === 'form-patterns' ? 'form' : r}')`);
      for (const [name, pass, detail] of res) { pass ? ok++ : bad++; if (!pass) console.log(`FALLA ${w} ${r}: ${name} ${detail}`); }
    }
    await p.close();
  }
  await b.close();
  console.log(`Chromium: ${ok} correctas, ${bad} con fallo`);
  process.exit(bad ? 1 : 0);
})();
