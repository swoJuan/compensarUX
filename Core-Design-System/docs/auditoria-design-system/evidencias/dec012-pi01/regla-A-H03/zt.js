// Medicion de la variante ZT del Header. Uso: node zt.js [--inject=<archivo css>] [--out=<json>]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const BASE = 'http://localhost:8000';
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const INJECT = arg('inject') ? fs.readFileSync(arg('inject'), 'utf8') : '';
const VARIANTS = { pre: '/tmp/core.preP3.css', prev: '/tmp/core.curB.css', cur: ROOT + '/css/core.css' };
const WIDTHS = (arg('widths') || '320,375,768,900,1024,1440').split(',').map(Number);
const TEXT = [[100, 16], [150, 24], [200, 32]];
const THEMES = (arg('themes') || 'light').split(',');
const SHOTS = arg('shots');
let ZTMK='';
const html = (theme) => `<!doctype html><html lang="es" data-bs-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/css/core.css"><link rel="stylesheet" href="/css/themes.css"></head><body style="margin:0">
${ZTMK}</body></html>`;

async function ctxFor(px) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwprof-'));
  fs.mkdirSync(dir + '/Default', { recursive: true });
  fs.writeFileSync(dir + '/Default/Preferences', JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: 13 } } }));
  return chromium.launchPersistentContext(dir, { channel: 'chromium', headless: true });
}
(async () => {
  const R = [];
  { const c = await ctxFor(16); const p = await c.newPage(); await p.goto(BASE + '/_dec012-pi01b/harness-zt.html'); await p.waitForTimeout(800); ZTMK = await p.evaluate(() => document.querySelector('#v-zt').innerHTML); await c.close(); if (!ZTMK.includes('mp-web-header--zt')) throw new Error('markup ZT vacio'); }
  for (const [pct, px] of TEXT) {
    const ctx = await ctxFor(px);
    for (const v of Object.keys(VARIANTS)) for (const theme of THEMES) for (const w of WIDTHS) {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      await page.route('**/__zt.html', r => r.fulfill({ contentType: 'text/html', body: html(theme) }));
      await page.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(VARIANTS[v], 'utf8') + '' }));
      await page.goto(BASE + '/__zt.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
      const m = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display === 'none' ? { hidden: true } : { x: +b.x.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), r: +b.right.toFixed(1) }; };
        const main = q('.mp-web-header__main');
        const vis = [...document.querySelectorAll('.mp-web-header--zt a, .mp-web-header--zt button, .mp-web-header--zt input')].filter(e => getComputedStyle(e).display !== 'none');
        const out = vis.filter(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 0.5 || b.left < -0.5; }).map(e => e.getAttribute('aria-label') || e.className);
        return {
          docOver: +(document.documentElement.scrollWidth - innerWidth).toFixed(1),
          sectionScroll: +(q('.mp-web-header--zt').scrollWidth - q('.mp-web-header--zt').clientWidth).toFixed(1),
          mainScroll: +(main.scrollWidth - main.clientWidth).toFixed(1),
          cols: getComputedStyle(main).gridTemplateColumns, mainH: +main.getBoundingClientRect().height.toFixed(1),
          toggle: r(q('.mp-web-header__mobile-toggle')), brand: r(q('.mp-web-header__brand')), logo: r(q('.mp-web-header__logo')),
          service: r(q('.mp-web-header__brand-service')), search: r(q('.mp-web-header__search')), input: r(q('.mp-web-header__search-input')), chip: r(q('.mp-user-chip')),
          chipLabel: q('.mp-user-chip').getAttribute('aria-label'), chipVisible: q('.mp-user-chip__name').textContent.trim(), outside: out
        };
      });
      const tabs = []; await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); });
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); const t = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const b = e.getBoundingClientRect(); return { n: (e.getAttribute('aria-label') || e.className.split(' ').pop() || e.tagName), inView: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.width > 0 }; }); if (t) tabs.push(t); }
      m.tabs = tabs; m.tabBad = tabs.filter(t => !t.inView).map(t => t.n);
      R.push({ v, pct, w, theme, ...m });
      if (SHOTS && theme === 'light' && v === 'cur') await page.screenshot({ path: `${SHOTS}/zt-${arg('tag') || 'cur'}-${pct}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 330 }, fullPage: false });
      await page.close();
    }
    await ctx.close();
  }
  if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(R, null, 1));
  const f = x => x ? (x.hidden ? 'oculto' : `${x.x}..${x.r}(${x.w})`) : '-';
  for (const e of R) console.log(`${e.v.padEnd(3)} ${e.theme.padEnd(5)} ${String(e.pct).padStart(3)}% ${String(e.w).padStart(4)}px | docOver ${String(e.docOver).padStart(6)} secScroll ${String(e.sectionScroll).padStart(6)} mainScroll ${String(e.mainScroll).padStart(6)} H ${e.mainH} | tog ${f(e.toggle)} brand ${f(e.brand)} search ${f(e.search)} chip ${f(e.chip)} | fuera: ${e.outside.length || '-'} | tab-fuera: ${e.tabBad.length || '-'}`);
})();
