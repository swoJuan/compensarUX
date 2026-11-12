// DEC-006 · valores computados de tokens, Badge/Chip, Alert, Toast y modal en Light/Dark/HC, con y sin inyección de tokens del portal
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const CSSFILE = process.argv[2] || ROOT + '/css/core.css';
const CSS = fs.readFileSync(CSSFILE, 'utf8');
const tokSrc = fs.readFileSync(ROOT + '/js/tokens.js', 'utf8').match(/export const TOKENS = (\{[\s\S]*?\n\});/)[1];
const TOKENS = JSON.parse(tokSrc);
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const html = `<!doctype html><html><head><meta charset=utf-8><style>${CSS}</style></head><body style="margin:0;padding:16px">
<div id=b>
<span class="mp-badge mp-badge--orange" id=b-orange>Naranja</span>
<span class="mp-badge mp-badge--violet" id=b-violet>Violeta</span>
<span class="mp-badge mp-badge--green-3" id=b-green3>Green 3</span>
<span class="mp-badge mp-badge--error" id=b-error>Error</span>
<span class="mp-badge mp-badge--success" id=b-success>Success</span>
<span class="mp-badge mp-badge--warning" id=b-warning>Warning</span>
<span class="mp-badge mp-badge--info" id=b-info>Info</span>
<button class="mp-chip mp-chip--violet" id=c-normal type=button>Chip</button>
<button class="mp-chip mp-chip--violet is-selected" id=c-active type=button aria-pressed=true>Chip</button>
</div>
${['info','success','warning','error'].map(k => `
<div class="mp-alert mp-alert--${k}" id=a-${k} role=status><span class=mp-alert__icon id=ai-${k}>●</span><div class=mp-alert__content><p class=mp-alert__title id=at-${k}>Título</p><p class=mp-alert__body id=ab-${k}>Mensaje</p></div></div>
<div class="mp-toast mp-toast--${k}" id=t-${k} role=status><span class=mp-toast__icon id=ti-${k}>●</span><div class=mp-toast__content><p class=mp-toast__title id=tt-${k}>Título</p><p class=mp-toast__body id=tb-${k}>Mensaje</p></div></div>`).join('')}
<div class="mp-modal mp-modal--warning" id=m-warning><span class=mp-modal__icon id=mi>!</span></div>
<div id=probe></div>
</body></html>`;

const EXPECT = {
  light: { '--use-text-badge-orange': '#333333', '--use-text-badge-green-3': '#516d0d', '--use-text-badge-error': '#9e3328', '--use-text-theme-green-2': '#6a8e11', '--use-text-theme-red': '#bb4945', '--use-border-strong': '#666666', '--use-state-warning-bg': '#fff2d9', '--use-state-success-bg': '#e6f7e8', '--use-state-warning-icon-bg': '#967229', '--use-state-info-text': '#2d4a67' },
  dark:  { '--use-text-badge-orange': '#111111', '--use-text-badge-green-3': '#ecf7c9', '--use-text-badge-error': '#f7eeed', '--use-text-theme-green-2': '#ecf7c9', '--use-text-theme-red': '#f7eeed', '--use-border-strong': '#e0e0e0', '--use-state-warning-bg': '#634a1a', '--use-state-success-bg': '#166936', '--use-state-warning-icon-bg': '#fcbf44', '--use-state-info-text': '#f5f5f5' },
  'high-contrast': { '--use-text-badge-orange': '#f5f5f5', '--use-text-badge-green-3': '#ffffff', '--use-text-badge-error': '#ffffff', '--use-text-theme-green-2': '#ffffff', '--use-text-theme-red': '#ffffff', '--use-border-strong': '#ffffff', '--use-state-warning-bg': '#634a1a', '--use-state-success-bg': '#0d3d1f', '--use-state-warning-icon-bg': '#fcbf44', '--use-state-info-text': '#ffffff' },
};
// bg/texto esperados (Figma) para variantes de componente; null = no verificado por valor
const EXP_COMP = {
  light: { 'b-orange': ['#333333', '#fff2e3'], 'b-violet': ['#111111', '#efecf9'], 'b-green3': ['#516d0d', '#ecf7c9'], 'b-error': ['#9e3328', '#f7eeed'], 'b-success': ['#0d3d1f', '#e6f7e8'], 'b-warning': ['#111111', '#fff2d9'], 'c-normal': ['#111111', '#efecf9'], 'c-active': ['#f5f5f5', '#4e3199'] },
  dark:  { 'b-orange': ['#111111', null], 'b-violet': ['#f5f5f5', null], 'b-green3': ['#ecf7c9', null], 'b-error': ['#f7eeed', null], 'b-success': ['#f5f5f5', '#166936'], 'b-warning': ['#f5f5f5', '#634a1a'] },
  'high-contrast': {},
};
const MIN = 4.5;
const hex = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/); if (!m) return c; return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); };

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const fails = [];
  const ok = (c, msg) => { if (c) pass++; else { fail++; fails.push(msg); } };
  const rows = [];
  for (const inject of [false, true]) for (const theme of ['light', 'dark', 'high-contrast']) {
    const p = await browser.newPage({ viewport: { width: 900, height: 900 } });
    await p.setContent(html);
    await p.evaluate(({ theme, inject, TOKENS }) => {
      document.documentElement.setAttribute('data-theme', theme);
      if (inject) { const mk = theme === 'high-contrast' ? 'highContrast' : theme; Object.values(TOKENS).forEach(t => { if (t.css && t.modes) { const v = t.modes[mk] || t.modes.light; if (v) document.documentElement.style.setProperty(t.css, v); } }); }
    }, { theme, inject, TOKENS });
    const data = await p.evaluate(() => {
      const hexOf = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)/); return m ? '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('') : c; };
      const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
      const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const root = getComputedStyle(document.documentElement);
      const probe = document.getElementById('probe');
      const resolveVar = n => { probe.style.color = `var(${n})`; return hexOf(getComputedStyle(probe).color); };
      const vars = {}; ['--use-text-badge-orange', '--use-text-badge-green-3', '--use-text-badge-error', '--use-text-theme-green-2', '--use-text-theme-red', '--use-border-strong', '--use-state-warning-bg', '--use-state-success-bg', '--use-state-warning-icon-bg', '--use-state-info-text'].forEach(n => vars[n] = resolveVar(n));
      const comp = {};
      ['b-orange', 'b-violet', 'b-green3', 'b-error', 'b-success', 'b-warning', 'b-info', 'c-normal', 'c-active'].forEach(id => { const cs = getComputedStyle(document.getElementById(id)); const fg = hexOf(cs.color), bg = hexOf(cs.backgroundColor); comp[id] = { fg, bg, cr: +cr(fg, bg).toFixed(2) }; });
      const msg = {};
      ['info', 'success', 'warning', 'error'].forEach(k => {
        for (const [pre, el] of [['a', 'a'], ['t', 't']]) {
          const box = getComputedStyle(document.getElementById(`${el}-${k}`));
          const bg = hexOf(box.backgroundColor), border = hexOf(box.borderTopColor);
          const title = hexOf(getComputedStyle(document.getElementById(`${pre}${pre === 'a' ? 't' : 't'}-${k}`)).color);
          const body = hexOf(getComputedStyle(document.getElementById(`${pre}${pre === 'a' ? 'b' : 'b'}-${k}`)).color);
          const icon = hexOf(getComputedStyle(document.getElementById(`${pre}i-${k}`)).color);
          msg[`${pre}-${k}`] = { bg, border, title, body, icon, crTitle: +cr(title, bg).toFixed(2), crBody: +cr(body, bg).toFixed(2), crIcon: +cr(icon, bg).toFixed(2) };
        }
      });
      const mi = getComputedStyle(document.getElementById('mi'));
      const modal = { bg: hexOf(mi.backgroundColor), fg: hexOf(mi.color) }; modal.cr = +cr(modal.fg, modal.bg).toFixed(2);
      return { vars, comp, msg, modal };
    });
    const tag = `${inject ? 'inyectado' : 'solo-CSS '} ${theme.padEnd(13)}`;
    // 1) tokens
    for (const [n, v] of Object.entries(EXPECT[theme])) ok(data.vars[n] === v, `${tag} ${n} = ${data.vars[n]} (esperado ${v})`);
    // 2) componentes (Figma)
    for (const [id, [fg, bg]] of Object.entries(EXP_COMP[theme])) { if (fg) ok(data.comp[id].fg === fg, `${tag} ${id} texto ${data.comp[id].fg} (esperado ${fg})`); if (bg) ok(data.comp[id].bg === bg, `${tag} ${id} fondo ${data.comp[id].bg} (esperado ${bg})`); }
    // 3) contraste de texto de badges/chips (no HC solo-CSS: pill negro/blanco por diseño)
    for (const [id, c] of Object.entries(data.comp)) ok(c.cr >= MIN, `${tag} ${id} contraste ${c.cr} < ${MIN} (${c.fg} sobre ${c.bg})`);
    // 4) alert/toast: título y cuerpo ≥4.5, icono ≥3
    for (const [id, m] of Object.entries(data.msg)) { ok(m.crTitle >= MIN && m.crBody >= MIN, `${tag} ${id} texto ${m.crTitle}/${m.crBody}`); ok(m.crIcon >= 3, `${tag} ${id} icono ${m.crIcon} < 3 (${m.icon} sobre ${m.bg})`); }
    // 5) pictograma Warning y Alert Info body
    const wi = data.msg['a-warning'];
    if (theme === 'light') ok(wi.icon === '#967229', `${tag} warning icono ${wi.icon}`); else ok(wi.icon === '#fcbf44', `${tag} warning icono ${wi.icon}`);
    ok(data.msg['a-info'].body === data.vars['--use-state-info-text'], `${tag} Alert Info cuerpo ${data.msg['a-info'].body} ≠ use/state/info/text`);
    ok(data.msg['t-info'].body === data.vars['--use-state-info-text'], `${tag} Toast Info cuerpo ${data.msg['t-info'].body}`);
    // 6) paridad con Figma de las alertas Dark/HC
    const FIG = { dark: { info: ['#18428f', '#296ff0', '#f5f5f5'], success: ['#166936', '#22a152', '#f5f5f5'], warning: ['#634a1a', '#fcbf44', '#f5f5f5'], error: ['#7d291f', '#d14434', '#f5f5f5'] }, 'high-contrast': { info: ['#102c5e', '#296ff0', '#ffffff'], success: ['#0d3d1f', '#22a152', '#ffffff'], warning: ['#634a1a', '#fcbf44', '#ffffff'], error: ['#521a14', '#d14434', '#ffffff'] } };
    if (FIG[theme]) for (const k of Object.keys(FIG[theme])) for (const pre of ['a', 't']) { const m = data.msg[`${pre}-${k}`], [bg, bd, tx] = FIG[theme][k]; ok(m.bg === bg && m.border === bd && m.title === tx && m.body === tx, `${tag} ${pre}-${k} vs Figma: ${JSON.stringify(m)} esperado ${bg}/${bd}/${tx}`); }
    ok(data.modal.cr >= 3, `${tag} modal icono warning contraste ${data.modal.cr}`);
    rows.push({ tag, orange: data.comp['b-orange'], violet: data.comp['b-violet'], g3: data.comp['b-green3'], err: data.comp['b-error'], succ: data.comp['b-success'], warn: data.comp['b-warning'], chipN: data.comp['c-normal'], chipA: data.comp['c-active'], warnIcon: wi, modal: data.modal });
    await p.close();
  }
  await browser.close();
  fs.writeFileSync('/tmp/qa/dec006-rows.json', JSON.stringify(rows, null, 1));
  console.log(`PASS ${pass}  FAIL ${fail}`);
  fails.forEach(f => console.log(' ✗', f));
})();
