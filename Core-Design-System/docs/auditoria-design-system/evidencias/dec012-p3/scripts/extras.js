const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = __dirname; const BASE = 'http://localhost:8000/drupal.html';
async function nav(p, h) { await p.evaluate(x => { location.hash = '#' + x; }, h); await p.waitForTimeout(300);
  await p.waitForFunction(() => !document.querySelector('#content .fragment-loading') && document.querySelector('#content').children.length > 0, null, { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900); }
const th = (p, t) => p.evaluate(x => window.setTheme ? window.setTheme(x) : document.documentElement.setAttribute('data-theme', x), t);
(async () => {
  const b = await chromium.launch(); const rep = { shots: [], zoom200P2: [], width320P2: [] };
  // capturas P3
  let ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); let p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  for (const s of ['avatar', 'badges', 'iconos-intro', 'sidebar']) { await nav(p, s);
    for (const t of ['light', 'dark', 'high-contrast']) { await th(p, t); await p.waitForTimeout(250);
      const f = `p3-${s}-${t}.png`; await p.screenshot({ path: path.join(OUT, f) }); rep.shots.push(f); } }
  await ctx.close();
  // re-check P2 con zoom 200% REAL (viewport 640 @ DSF2) y 320
  for (const [label, opts] of [['zoom200', { viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 }], ['w320', { viewport: { width: 320, height: 800 } }]]) {
    ctx = await b.newContext(opts); p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    for (const s of ['alertas', 'toast', 'seleccion', 'modales', 'tabs', 'paginacion']) { await nav(p, s);
      for (const t of ['light', 'dark', 'high-contrast']) { await th(p, t); await p.waitForTimeout(200);
        const o = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        (label === 'zoom200' ? rep.zoom200P2 : rep.width320P2).push({ s, t, ...o }); } }
    await ctx.close();
  }
  await b.close(); fs.writeFileSync(path.join(OUT, 'extras.json'), JSON.stringify(rep, null, 2));
  for (const k of ['zoom200P2', 'width320P2']) { const bad = rep[k].filter(x => x.ov); console.log(`${k}: ${rep[k].length} checks, con overflow: ${bad.length}`); bad.forEach(x => console.log('   ', JSON.stringify(x))); }
  console.log('capturas:', rep.shots.length);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
