// DEC-003 diagnóstico: estados del input (mp-input-field) por variante de CSS x tema, estados reales del navegador.
// Uso: node inputs-states.js [--out=archivo.json]
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8000';
const VARIANTS = { v220: '/tmp/dec003/core.v220.css', v221: '/tmp/dec003/core.v221.css' };
const THEMES = ['light', 'dark', 'high-contrast'];
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');

// Un grupo por estado. 'act' = acción real a aplicar antes de medir.
const STATES = [
  { id: 'normal',        attrs: '', placeholder: true },
  { id: 'filled',        attrs: 'class-extra="filled" value="Valor"' },
  { id: 'hover',         attrs: '', act: 'hover' },
  { id: 'active',        attrs: '', act: 'active' },
  { id: 'focus',         attrs: '', act: 'focus' },
  { id: 'error',         attrs: 'class-extra="error" aria-invalid="true" aria-describedby="H" value="Valor" ', helper: 'error' },
  { id: 'error-focus',   attrs: 'class-extra="error" aria-invalid="true" aria-describedby="H" value="Valor" ', helper: 'error', act: 'focus' },
  { id: 'error-hover',   attrs: 'class-extra="error" aria-invalid="true" aria-describedby="H" value="Valor" ', helper: 'error', act: 'hover' },
  { id: 'disabled',      attrs: 'disabled value="Valor"' },
  { id: 'disabled-vacio',attrs: 'disabled', placeholder: true },
  { id: 'readonly',      attrs: 'readonly value="Solo lectura"' },
  { id: 'readonly-hover',attrs: 'readonly value="Solo lectura"', act: 'hover' },
  { id: 'readonly-focus',attrs: 'readonly value="Solo lectura"', act: 'focus' },
  { id: 'success',       attrs: 'class-extra="success filled" value="valor@compensar.com"', helper: 'success' },
];

const html = (theme) => {
  const groups = STATES.map(s => {
    const cls = (s.attrs.match(/class-extra="([^"]*)"/) || [])[1] || '';
    const attrs = s.attrs.replace(/class-extra="[^"]*"/, '').replace(/aria-describedby="H"/, `aria-describedby="h-${s.id}"`);
    const helperCls = s.helper ? ' ' + s.helper : '';
    const helperTxt = s.helper === 'error' ? 'Campo obligatorio' : s.helper === 'success' ? 'Valor confirmado' : 'Texto de apoyo';
    return `<div class="mp-input-group g" id="g-${s.id}" style="width:320px">
  <label class="mp-input-label" for="i-${s.id}" id="l-${s.id}">Label <span class="mp-input-required" aria-hidden="true">*</span></label>
  <div class="mp-input-wrapper"><input id="i-${s.id}" class="mp-input-field ${cls}" ${s.placeholder || !/value=/.test(s.attrs) ? 'placeholder="Placeholder"' : ''} ${attrs}></div>
  <p class="mp-input-helper${helperCls}" id="h-${s.id}">${helperTxt}</p>
</div>`;
  }).join('\n');
  return `<!doctype html><html lang="es" data-theme="${theme}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/core.css"></head>
<body style="margin:0;padding:24px;background:var(--use-background-page,#fff);display:grid;grid-template-columns:repeat(3,340px);gap:24px;align-items:start">${groups}</body></html>`;
};

(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  const R = [];
  for (const v of Object.keys(VARIANTS)) for (const theme of THEMES) {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 1100 } });
    const p = await ctx.newPage();
    await p.route('**/__t.html', r => r.fulfill({ contentType: 'text/html', body: html(theme) }));
    await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(VARIANTS[v], 'utf8') }));
    await p.goto(BASE + '/__t.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    for (const s of STATES) {
      const sel = '#i-' + s.id;
      // captura base (sin acción) del grupo para comparar visibilidad del foco/hover
      await p.mouse.move(1190, 1090); await p.evaluate(() => document.activeElement && document.activeElement.blur());
      await p.waitForTimeout(220);
      const before = await p.locator('#g-' + s.id).screenshot({ animations: 'disabled' });
      if (s.act === 'hover') await p.hover(sel);
      if (s.act === 'active') { await p.hover(sel); await p.mouse.down(); }
      if (s.act === 'focus') { await p.keyboard.press('Tab'); await p.evaluate(id => document.querySelector(id).focus(), sel); }
      await p.waitForTimeout(260);
      const after = await p.locator('#g-' + s.id).screenshot({ animations: 'disabled' });
      const m = await p.evaluate(({ id, sid }) => {
        const el = document.querySelector(id), cs = getComputedStyle(el), pcs = getComputedStyle(el, '::placeholder');
        const lab = getComputedStyle(document.getElementById('l-' + sid)), help = getComputedStyle(document.getElementById('h-' + sid));
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
        const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
        const over = (t, bt) => ({ r: t.r * t.a + bt.r * (1 - t.a), g: t.g * t.a + bt.g * (1 - t.a), b: t.b * t.a + bt.b * (1 - t.a), a: 1 });
        const cr = (x, y) => { const a = lum(x), b = lum(y); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
        const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
        const page = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
        let op = 1, e = el; while (e) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
        const bg = over(parse(cs.backgroundColor), page);
        const bw = parseFloat(cs.borderTopWidth);
        const bcol = over(parse(cs.borderTopColor), page);
        // sombra: primer color con alpha, mezclado sobre fondo de página
        const shm = cs.boxShadow === 'none' ? null : (cs.boxShadow.match(/rgba?\([^)]+\)/g) || []); const sh = shm && shm.length ? shm.map(c => parse(c)) : null;
        const shC = sh ? over(sh[0], page) : null;
        // texto efectivo con opacidad acumulada
        const txt = over({ ...parse(cs.color), a: parse(cs.color).a * op }, bg);
        const hl = over({ ...parse(help.color), a: parse(help.color).a }, page);
        const lb = over({ ...parse(lab.color), a: parse(lab.color).a }, page);
        const ph = over({ ...parse(pcs.color), a: parse(pcs.color).a * op }, bg);
        return {
          borderW: cs.borderTopWidth, border: hex(bcol), borderVsPage: cr(bcol, page),
          bg: hex(bg), color: hex(txt), colorContrast: cr(txt, bg),
          placeholder: hex(ph), placeholderContrast: cr(ph, bg),
          shadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.replace(/\s+/g, ' ').slice(0, 90), shadowColorOnPage: shC && hex(shC), shadowVsPage: shC && cr(shC, page),
          outline: cs.outlineStyle === 'none' ? 'none' : `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
          opacity: +op.toFixed(2), cursor: cs.cursor, pointerEvents: cs.pointerEvents, caret: cs.caretColor,
          label: hex(lb), labelContrast: cr(lb, page), helper: hex(hl), helperContrast: cr(hl, page),
          helperWeight: help.fontWeight, page: hex(page), focused: document.activeElement === el
        };
      }, { id: sel, sid: s.id });
      m.pixelsChangedByAction = s.act ? !before.equals(after) : null;
      R.push({ v, theme, state: s.id, ...m });
      if (s.act === 'active') await p.mouse.up();
    }
    await ctx.close();
  }
  await b.close();
  if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(R, null, 1));
  console.log('ok', R.length);
})();
