// Brecha REAL: valor resuelto por Figma (cadena de alias dentro del export, por modo) frente al color computado de css/core.css
const { chromium } = require('playwright'); const fs = require('fs');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const tokens = JSON.parse(fs.readFileSync(ROOT + '/tokens/compensar.tokens.json', 'utf8'));
const CSS = fs.readFileSync(ROOT + '/css/core.css', 'utf8');
const byCss = {}; for (const [n, t] of Object.entries(tokens)) if (t.css) byCss[t.css] = { n, t };
function resolve(raw, mode, depth = 0) {
  if (depth > 12) return null; const m = /^var\((--[a-z0-9-()]+)\)$/i.exec(String(raw).trim());
  if (!m) return String(raw).trim(); const e = byCss[m[1]]; if (!e) return null;
  return resolve(e.t.modes[mode] || e.t.modes.light, mode, depth + 1);
}
const hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1; return a < 1 ? `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${+a.toFixed(3)})` : `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const rows = [];
  for (const [mode, theme] of [['light', 'light'], ['dark', 'dark'], ['highContrast', 'high-contrast']]) {
    const p = await b.newPage();
    await p.route('**/__g.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html data-theme="${theme}"><head><link rel="stylesheet" href="/css/core.css"></head><body><i id="probe"></i></body></html>` }));
    await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS }));
    await p.goto('http://localhost:8000/__g.html');
    const list = Object.entries(tokens).filter(([n, t]) => t.css && t.modes && t.type === 'color').map(([n, t]) => ({ n, css: t.css, fig: resolve(t.modes[mode] || t.modes.light, mode) }));
    const act = await p.evaluate(list => { const pr = document.getElementById('probe'); return list.map(x => { pr.style.color = ''; pr.style.color = `var(${x.css})`; const c = getComputedStyle(pr).color; pr.style.color = ''; return c; }); }, list);
    list.forEach((x, i) => rows.push({ mode, name: x.n, css: x.css, figma: x.fig && /^#/.test(x.fig) ? hexToRgb(x.fig) : x.fig, actual: act[i] }));
    await p.close();
  }
  await b.close(); fs.writeFileSync('/tmp/dec008/gap2.json', JSON.stringify(rows, null, 1));
  for (const mode of ['light', 'dark', 'highContrast']) { const m = rows.filter(r => r.mode === mode), d = m.filter(r => r.figma !== r.actual); console.log(`${mode.padEnd(13)} tokens ${m.length} · distintos de Figma (resuelto por modo): ${d.length}`); }
})();
