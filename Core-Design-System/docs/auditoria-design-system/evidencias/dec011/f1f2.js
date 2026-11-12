// F-1 y F-2 · contraste medido contra el fondo real, con el CSS compilado
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const CORE = fs.readFileSync(process.env.CSS || ROOT + '/css/core.css', 'utf8');
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const hex = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)/); return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); };
const GLYPH = { info: 'icon-info', warning: 'icon-warning', error: 'icon-warning-circle', success: 'icon-check-circle' };
const EXP_ICON = { // color esperado del icono por tipo/tema = el token del componente
  light: { info: '#2d4a67', warning: '#967229', error: '#d14434', success: '#0d3d1f' },
  dark: { info: '#f5f5f5', warning: '#fcbf44', error: '#f5f5f5', success: '#f5f5f5' },
  'high-contrast': { info: '#ffffff', warning: '#fcbf44', error: '#ffffff', success: '#ffffff' } };
const mk = (comp, kind, struct) => {
  const g = `icon ${GLYPH[kind]} icon-32`;
  const icon = struct === 'same' ? `<i class="${g} mp-${comp}__icon" id="i"></i>` : struct === 'nested' ? `<span class="mp-${comp}__icon"><i class="${g}" id="i"></i></span>` : `<span class="mp-${comp}__icon"><span class="material-symbols-rounded" id="i">info</span></span>`;
  return `<div class="mp-${comp} mp-${comp}--${kind}" id="root">${icon}<div class="mp-${comp}__content"><p class="mp-${comp}__title">Título</p><p class="mp-${comp}__body">Mensaje</p></div></div>`;
};
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const fails = []; const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
  // ── F-1 ──
  for (const comp of ['alert', 'toast']) for (const struct of ['same', 'nested', 'material']) for (const theme of ['light', 'dark', 'high-contrast']) for (const kind of ['info', 'warning', 'success', 'error']) {
    const p = await b.newPage(); await p.setContent(`<!doctype html><html data-theme="${theme}"><head><meta charset=utf-8><style>${CORE}</style></head><body>${mk(comp, kind, struct)}</body></html>`);
    const r = await p.evaluate(() => { const i = document.getElementById('i'); const root = document.getElementById('root'); return { icon: getComputedStyle(i).color, bg: getComputedStyle(root).backgroundColor, tvar: getComputedStyle(root).getPropertyValue('--mp-' + root.className.split(' ')[0].replace('mp-', '') + '-icon').trim() }; });
    await p.close();
    const T = `F-1 ${comp}/${struct}/${theme}/${kind}`; const ic = hex(r.icon), bg = hex(r.bg);
    ok(ic === EXP_ICON[theme][kind], `${T}: icono ${ic} (esperado ${EXP_ICON[theme][kind]})`);
    ok(cr(ic, bg) >= 3, `${T}: contraste del icono ${cr(ic, bg).toFixed(2)} sobre ${bg}`);
  }
  // ── F-2 ──
  const cta = async (theme, state) => { const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.setContent(`<!doctype html><html data-theme="${theme}"><head><meta charset=utf-8><style>${CORE}*{transition:none!important}</style></head><body><header class="mp-web-header mp-web-header--public"><div class="mp-web-header__main"><a class="mp-web-header__cta" id="c" href="#">Afíliate</a></div></header></body></html>`);
    if (state === 'hover') await p.hover('#c'); if (state === 'focus') await p.focus('#c');
    const r = await p.evaluate(() => { const c = document.getElementById('c'); const cs = getComputedStyle(c); return { fg: cs.color, bg: cs.backgroundColor, bd: cs.borderTopColor, ol: cs.outlineStyle, grad: cs.backgroundImage }; }); await p.close(); return r; };
  const EXP_CTA = { light: '#ffffff', dark: '#111111', 'high-contrast': '#000000' };
  const rows = [];
  for (const theme of ['light', 'dark', 'high-contrast']) for (const st of ['normal', 'hover', 'focus']) {
    const r = await cta(theme, st); const fg = hex(r.fg), bg = hex(r.bg); const c = cr(fg, bg);
    rows.push(`${theme.padEnd(13)} ${st.padEnd(6)} texto ${fg} sobre ${bg} = ${c.toFixed(2)}:1`);
    ok(fg === EXP_CTA[theme], `F-2 ${theme}/${st}: texto ${fg} (esperado ${EXP_CTA[theme]})`);
    if (theme !== 'light') ok(c >= 4.5, `F-2 ${theme}/${st}: contraste ${c.toFixed(2)} < 4,5`);
    ok(r.grad === 'none', `F-2 ${theme}/${st}: el CTA no debe tener gradiente (${r.grad})`);
  }
  await b.close();
  console.log(`f1f2: PASS ${pass}  FAIL ${fail}`); console.log(rows.join('\n')); fails.forEach(f => console.log(' ✗', f));
})();
