const { chromium } = require('/tmp/pw/node_modules/playwright');
const fs = require('fs'), path = require('path');
const URL = 'http://localhost:8000/_dec012-pi04/header-harness.html';
const CUR = fs.readFileSync('/tmp/core.curB.css', 'utf8');
const HIDE = '.mp-web-header__brand-service{display:none!important}';

async function ctxFor(px, w) {
  const dir = fs.mkdtempSync('/tmp/pwprof-'); fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: px, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', viewport: { width: w, height: 900 } });
  await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CUR }));
  return ctx;
}
// Mide el desborde horizontal del header PUBLICO en modo movil (v-public): borde derecho maximo de cualquier descendiente visible vs viewport
const MEAS = () => {
  const hdr = document.querySelector('#v-public .mp-web-header'), W = document.documentElement.clientWidth;
  const vis = e => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  let mr = hdr.getBoundingClientRect().right; hdr.querySelectorAll('*').forEach(e => { if (vis(e)) mr = Math.max(mr, e.getBoundingClientRect().right); });
  const tg = hdr.querySelector('.mp-web-header__mobile-toggle'), nav = hdr.querySelector('.mp-web-header__nav');
  return { over: Math.max(0, mr - W), mobile: getComputedStyle(nav).display === 'none', togIn: vis(tg) ? tg.getBoundingClientRect().right <= W + 1 : null };
};

(async () => {
  const out = {};
  for (const [pct, px] of [[100, 16], [150, 24], [200, 32]]) {
    out[pct] = {};
    for (const hide of [false, true]) {
      const ctx = await ctxFor(px, 600); const p = ctx.pages()[0];
      await p.goto(URL, { waitUntil: 'networkidle' }); if (hide) await p.addStyleTag({ content: HIDE });
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
      let minFit = null, lastBad = null;
      for (let w = 200; w <= Math.min(48 * px, 1600); w += 2) {            // solo modo movil (<= 48em)
        await p.setViewportSize({ width: w, height: 900 });
        const m = await p.evaluate(MEAS);
        if (m.mobile && m.over <= 0.5 && m.togIn !== false) { if (minFit === null) minFit = w; } else { if (m.mobile) { lastBad = w; minFit = null; } }
      }
      out[pct][hide ? 'sinSubtitulo' : 'conSubtitulo'] = { minFitPx: minFit, minFitEm: minFit ? +(minFit / px).toFixed(2) : null, lastOverflowPx: lastBad };
      await ctx.close();
    }
  }
  console.log('Ancho minimo de viewport en que el Header publico (modo movil) NO desborda y el boton de menu queda a la vista');
  console.log('texto | con subtitulo           | sin subtitulo (solo se oculta el subtitulo)');
  for (const pct of [100, 150, 200]) { const a = out[pct].conSubtitulo, b = out[pct].sinSubtitulo;
    const f = (x) => x.minFitPx ? `${x.minFitPx}px = ${x.minFitEm}em` : 'nunca cabe';
    console.log(`${String(pct).padStart(4)}% | ${f(a).padEnd(23)} | ${f(b)}`); }
  fs.writeFileSync(path.join(__dirname, 'sweep.json'), JSON.stringify(out, null, 2));
})().catch(e => { console.error('ERROR', e); process.exit(1); });
