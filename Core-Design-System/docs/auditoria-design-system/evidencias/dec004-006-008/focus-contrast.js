// Contraste del indicador de foco: color del contorno/borde/sombra al enfocar frente al fondo del entorno (1.4.11 → ≥3:1). 3 temas.
const { chromium } = require('playwright'); const fs = require('fs');
const CSS = fs.readFileSync('/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css', 'utf8');
const src = fs.readFileSync('/tmp/dec008/focus.js', 'utf8'); eval(src.slice(src.indexOf('const CASES'), src.indexOf('(async () =>')).replace(/^const /m, 'var '));
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const rows = [];
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 300 } });
    for (const [name, html] of Object.entries(CASES)) {
      await p.route('**/__k.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="es" data-theme="${theme}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="margin:0;padding:24px;background:var(--use-background-page);color:var(--use-text-primary)"><button id="pre" style="opacity:0;position:absolute">.</button><div id="box" style="display:block;padding:12px;width:1000px">${html}</div></body></html>` }));
      await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS }));
      await p.goto('http://localhost:8000/__k.html'); await p.addStyleTag({ content: '*{transition:none!important}' });
      const base = await p.evaluate(() => { const tgt = document.querySelector('#box').querySelector('a,button,input,[tabindex]'); return null; });
      await p.focus('#pre'); await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const m = await p.evaluate(() => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
        const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
        const over = (t, bt) => ({ r: t.r * t.a + bt.r * (1 - t.a), g: t.g * t.a + bt.g * (1 - t.a), b: t.b * t.a + bt.b * (1 - t.a), a: 1 });
        const cr = (x, y) => { const a = lum(x), b = lum(y); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
        const page = parse(getComputedStyle(document.body).backgroundColor);
        const a = document.activeElement, c = getComputedStyle(a);
        let bg = page; for (let e = a; e; e = e.parentElement) { const x = parse(getComputedStyle(e).backgroundColor); if (x && x.a > 0) { bg = over(x, bg); break; } }
        const cands = [];
        if (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) cands.push(['contorno', parse(c.outlineColor)]);
        if (c.boxShadow !== 'none') { const sh = (c.boxShadow.match(/rgba?\([^)]+\)|color\([^)]+\)/g) || [])[0]; const sc = sh && parse(sh); if (sc) cands.push(['sombra', over(sc, page)]); }
        const bc = parse(c.borderTopColor); if (bc && parseFloat(c.borderTopWidth) > 0) cands.push(['borde', over(bc, page)]);
        const best = cands.map(([k, col]) => [k, cr(col, page)]).sort((x, y) => y[1] - x[1])[0];
        return { tipo: best ? best[0] : '—', ratio: best ? best[1] : 0, ow: c.outlineWidth };
      });
      rows.push({ theme, name, ...m }); await p.unroute('**/__k.html'); await p.unroute(/\/css\/core\.css/);
    }
    await p.close();
  }
  await b.close();
  const low = rows.filter(r => r.ratio < 3);
  console.log(`indicador con contraste < 3:1 frente al fondo: ${low.length} de ${rows.length}`);
  low.forEach(r => console.log(`  ${r.theme.padEnd(14)} ${r.name.padEnd(32)} ${r.tipo.padEnd(9)} ${r.ratio}:1`));
})();
