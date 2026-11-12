// Línea base/medición de contraste (axe color-contrast) en TODAS las rutas del portal, por tema.
// Uso: node contrast.js --base=http://localhost:8001 --out=/tmp/dec008/c-base.json
const { chromium } = require('playwright'); const fs = require('fs');
const axeSrc = fs.readFileSync('/tmp/dec008/node_modules/axe-core/axe.min.js', 'utf8');
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || d;
const BASE = arg('base', 'http://localhost:8000'), OUT = arg('out', '/tmp/dec008/c.json');
const THEMES = { light: 'Claro', dark: 'Oscuro', 'high-contrast': 'Alto contraste' };
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const res = {};
  for (const shell of ['drupal.html', 'app.html']) {
    const p0 = await b.newPage({ viewport: { width: 1280, height: 900 } }); await p0.goto(`${BASE}/${shell}`, { waitUntil: 'domcontentloaded' }); await p0.waitForTimeout(1500);
    const routes = await p0.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(h => h && !h.includes(' ')))]); await p0.close();
    for (const [theme, txt] of Object.entries(THEMES)) {
      const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
      for (const r of routes) {
        await p.goto(`${BASE}/${shell}#${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(500);
        if (theme !== 'light') { await p.evaluate(t => { const x = [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); x && x.click(); }, txt); await p.waitForTimeout(250); }
        await p.addScriptTag({ content: axeSrc }).catch(() => {});
        const v = await p.evaluate(async () => { try { const a = await axe.run({ include: [['#content, main, [data-component-doc]']] }, { runOnly: ['color-contrast'] }); return a.violations.flatMap(x => x.nodes.map(n => { const d = (n.any[0] || {}).data || {}; return { t: n.target.join(' ').slice(0, 90), r: d.contrastRatio, fg: d.fgColor, bg: d.bgColor, fs: d.fontSize, cls: (document.querySelector(n.target[0]) || {}).className || '' }; })); } catch (e) { return [{ err: String(e).slice(0, 60) }]; } });
        (res[`${shell}#${r}`] = res[`${shell}#${r}`] || {})[theme] = v;
      }
      await p.close(); console.log(shell, theme, 'ok');
    }
  }
  await b.close(); fs.writeFileSync(OUT, JSON.stringify(res));
  for (const th of Object.keys(THEMES)) { const n = Object.values(res).reduce((a, v) => a + (v[th] || []).filter(x => !x.err).length, 0), pg = Object.values(res).filter(v => (v[th] || []).some(x => !x.err)).length; console.log(`${th.padEnd(14)} nodos con contraste insuficiente: ${n} · rutas afectadas: ${pg}`); }
})();
