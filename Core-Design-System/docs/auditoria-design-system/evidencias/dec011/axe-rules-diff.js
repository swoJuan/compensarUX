// axe por regla: HEAD (:8001) vs árbol actual (:8000) en las rutas tocadas por la estabilización v2.3.0.
// Uso: node axe-rules-diff.js [rutas,separadas,por,coma]   Combinaciones: Light 1280 y Dark 375.
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const AXE = fs.readFileSync('/tmp/qa/node_modules/axe-core/axe.min.js', 'utf8');
const ROUTES = (process.argv[2] || 'accordion,breadcrumb,cards,empty-state,inputs,loading,sidebar,stepper,header,badges,tables,modales,avatar,guidelines/form-patterns').split(',');
const BASES = { head: 'http://localhost:8001', nuevo: 'http://localhost:8000' };
const COMBOS = [['light', 1280], ['dark', 375]];
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  const res = {};
  for (const [name, base] of Object.entries(BASES)) for (const route of ROUTES) for (const [theme, w] of COMBOS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    try {
      await p.goto(`${base}/drupal.html#${route}`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
      await p.evaluate(t => document.getElementById({ light: 'btn-light', dark: 'btn-dark' }[t]).click(), theme); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; })); await p.waitForTimeout(250);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run('#content', { resultTypes: ['violations'] })).violations.map(x => [x.id, x.nodes.length]));
      (res[`${route}|${theme}${w}`] = res[`${route}|${theme}${w}`] || {})[name] = Object.fromEntries(v);
    } catch (e) { (res[`${route}|${theme}${w}`] = res[`${route}|${theme}${w}`] || {})[name] = { ERROR: String(e).slice(0, 60) }; }
    await p.close();
  }
  await b.close();
  let fixed = 0, regress = 0, same = 0;
  for (const [k, v] of Object.entries(res)) {
    const ids = new Set([...Object.keys(v.head || {}), ...Object.keys(v.nuevo || {})]);
    for (const id of ids) {
      const a = (v.head || {})[id] || 0, n = (v.nuevo || {})[id] || 0;
      if (a === n) { same++; continue; }
      if (n < a) { fixed++; console.log(`MEJORA   ${k.padEnd(34)} ${id.padEnd(30)} ${a} -> ${n}`); } else { regress++; console.log(`REGRESIÓN ${k.padEnd(33)} ${id.padEnd(30)} ${a} -> ${n}`); }
    }
  }
  console.log(`\nrutas×combos: ${Object.keys(res).length} | reglas sin cambio: ${same} | mejoran: ${fixed} | empeoran: ${regress}`);
  fs.writeFileSync('/tmp/qa/axe-rules-diff.json', JSON.stringify(res));
  process.exit(regress ? 1 : 0);
})();
