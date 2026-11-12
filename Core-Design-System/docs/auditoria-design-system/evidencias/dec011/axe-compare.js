// axe en las páginas afectadas: HEAD (:8001) vs árbol actual (:8000), Light / Dark / HC, 1280 y 375
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const AXE = fs.readFileSync('/tmp/qa/node_modules/axe-core/axe.min.js', 'utf8');
const ROUTES = (process.argv[2] || 'alertas,toast,modales,header,seleccion,badges,tabs,dropdown').split(',');
const BASES = { head: 'http://localhost:8001', nuevo: 'http://localhost:8000' };
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  const res = {};
  for (const [name, base] of Object.entries(BASES)) for (const route of ROUTES) for (const theme of ['light', 'dark', 'high-contrast']) for (const w of [1280, 375]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(`${base}/drupal.html#${route}`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1300);
    await p.evaluate(t => document.getElementById({ light: 'btn-light', dark: 'btn-dark', 'high-contrast': 'btn-hc' }[t]).click(), theme); await p.waitForTimeout(350);
    await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; })); await p.waitForTimeout(300);
    await p.addScriptTag({ content: AXE });
    const r = await p.evaluate(async () => { const out = await axe.run('#content', { resultTypes: ['violations'] }); return out.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(' ').slice(0, 90) })); });
    (res[`${route}|${theme}|${w}`] = res[`${route}|${theme}|${w}`] || {})[name] = r;
    await p.close();
  }
  await b.close();
  fs.writeFileSync('/tmp/qa/axe-compare.json', JSON.stringify(res));
  let worse = 0, better = 0, same = 0; const lines = [];
  for (const [k, v] of Object.entries(res)) {
    const sum = a => Object.fromEntries(a.map(x => [x.id, x.n]));
    const A = sum(v.head), B = sum(v.nuevo);
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const a = A[id] || 0, c = B[id] || 0;
      if (c > a) { worse++; lines.push(`PEOR   ${k} ${id}: ${a} → ${c}  ej: ${(v.nuevo.find(x => x.id === id) || {}).sample}`); } else if (c < a) better++; else same++;
    }
  }
  console.log(`combinaciones (ruta×tema×ancho): ${Object.keys(res).length} | reglas peor: ${worse} | mejor: ${better} | igual: ${same}`);
  lines.slice(0, 30).forEach(l => console.log(' ', l));
})();
