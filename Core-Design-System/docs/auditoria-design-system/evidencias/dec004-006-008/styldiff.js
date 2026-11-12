// Para cada elemento que difirió: compara estilos computados de todo su subárbol entre base (8001) y nuevo (8000).
const { chromium } = require('playwright');
const THEMES = { light: 'Claro', dark: 'Oscuro', 'high-contrast': 'Alto contraste' };
const TARGETS = [['light', 'seleccion', '.mp-choice, .mp-switch', [0, 1, 2, 3, 4, 5]], ['light', 'paginacion', '.mp-pagination', [0, 1, 2, 3]], ['light', 'stepper', '.mp-stepper', [0, 1, 2]], ['high-contrast', 'alertas', '.mp-alert', [0, 1, 2, 3]], ['dark', 'tabs', '#tab-preview-area', [0]]];
const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderTopLeftRadius', 'fontSize', 'fontWeight', 'width', 'height', 'outlineStyle', 'boxShadow', 'opacity', 'borderTopWidth', 'paddingTop'];
(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  for (const [theme, hash, sel, idxs] of TARGETS) {
    const R = {};
    for (const [name, base] of [['base', 'http://localhost:8001'], ['nuevo', 'http://localhost:8000']]) {
      const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
      await p.goto(`${base}/drupal.html#${hash}`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(1500);
      if (theme !== 'light') { await p.evaluate(t => { const x = [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); x && x.click(); }, THEMES[theme]); await p.waitForTimeout(300); }
      R[name] = await p.evaluate(({ sel, idxs, PROPS }) => idxs.map(i => { const root = document.querySelectorAll(sel)[i]; if (!root) return null; const out = []; [root, ...root.querySelectorAll('*')].forEach((e, k) => { const c = getComputedStyle(e); out.push({ k, tag: e.tagName.toLowerCase() + '.' + (e.className && e.className.toString ? e.className.toString().split(' ')[0] : ''), p: Object.fromEntries(PROPS.map(x => [x, c[x]])) }); }); return out; }), { sel, idxs, PROPS });
      await p.close();
    }
    console.log(`=== ${theme} · ${hash}`);
    idxs.forEach((i, n) => {
      const a = R.base[n], c = R.nuevo[n]; if (!a || !c) return; const d = new Map();
      a.forEach((x, k) => { const y = c[k]; if (!y) return; PROPS.forEach(pr => { if (x.p[pr] !== y.p[pr]) { const key = `${x.tag} ${pr}`; if (!d.has(key)) d.set(key, `${x.p[pr]} → ${y.p[pr]}`); } }); });
      console.log(`  #${i}: ${d.size ? '' : 'sin diferencias de estilo computado'}`); [...d].slice(0, 5).forEach(([k, v]) => console.log(`      ${k.padEnd(48)} ${v.slice(0, 60)}`));
    });
  }
  await b.close();
})();
