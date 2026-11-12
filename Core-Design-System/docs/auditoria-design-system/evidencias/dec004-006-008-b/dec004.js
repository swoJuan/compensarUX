// DEC-004 · Focus real por teclado: grosor, color, offset y contraste en Light/Dark/HC; disabled; protegidos intactos
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { page, read, ROOT, EXE } = require('/tmp/qa/fixture.js');
const NEWCSS = read(ROOT + '/css/core.css'), OLDCSS = read('/tmp/qa/base/core.css');
const STRONG = { light: '#666666', dark: '#e0e0e0', 'high-contrast': '#ffffff' };

const measure = () => {
  const hexOf = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/); if (!m) return c; if (m[4] !== undefined && +m[4] === 0) return 'transparent'; return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); };
  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => { if (!/^#/.test(a) || !/^#/.test(b)) return null; const x = lum(a), y = lum(b); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
  const bgBehind = el => { let n = el; while (n) { const c = hexOf(getComputedStyle(n).backgroundColor); if (c !== 'transparent') return c; n = n.parentElement; } return '#ffffff'; };
  const a = document.activeElement; if (!a) return null;
  // el contorno se dibuja en el elemento visual: control/track para checkbox, radio y switch
  let target = a;
  if (a.matches('.mp-choice__input')) target = a.nextElementSibling;
  else if (a.matches('.mp-switch__input')) target = a.nextElementSibling;
  const cs = a.matches('.mp-tab') && a.matches(':focus-visible') && getComputedStyle(a, '::before').outlineStyle !== 'none' ? getComputedStyle(a, '::before') : getComputedStyle(target);
  const out = { id: a.id || a.className, outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: hexOf(cs.outlineColor), outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow, borderColor: hexOf(cs.borderTopColor) };
  // fondo contra el que se lee el contorno: el del propio elemento (offset negativo/0) o el de la página (offset >0)
  const ownBg = hexOf(cs.backgroundColor);
  const off = parseFloat(cs.outlineOffset);
  out.bgOutside = bgBehind(target.parentElement || target);
  out.bgInside = ownBg === 'transparent' ? bgBehind(target) : ownBg;
  out.crOutside = cr(out.outlineColor, out.bgOutside);
  out.crInside = cr(out.outlineColor, out.bgInside);
  out.crRelevant = off < 0 ? out.crInside : out.crOutside;
  return out;
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const fails = []; const table = [];
  const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const run = async css => {
      const p = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      await p.setContent(page(css));
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await p.addScriptTag({ path: ROOT + '/js/mp-dropdown.js' }); await p.addScriptTag({ path: ROOT + '/js/mp-tabs.js' });
      const seq = {}; seq.__order = [];
      await p.keyboard.press('Tab');
      const ids = ['btn-first', 'btn-sec', 'btn-ter', 'inp', 'cb-off', 'cb-on', 'cb-err', 'rd-a', 'sw-off', 'sw-on', 'dd-trigger'];
      for (const id of ids) {
        const cur = await p.evaluate(() => document.activeElement.id); seq.__order.push(cur);
        if (cur !== id) { seq[id] = { error: `foco esperado ${id}, obtenido ${cur}` }; }
        else seq[id] = await p.evaluate(measure);
        await p.keyboard.press('Tab');
      }
      // radio: Tab salta al grupo; rd-a está checked así que ya fue el ítem tabulable. Abrir dropdown y mover con flechas
      await p.focus('#dd-trigger'); await p.keyboard.press('Enter'); await p.keyboard.press('ArrowDown');
      const act = await p.evaluate(() => { const el = document.querySelector('.mp-dropdown__option--active'); if (!el) return null; const hexOf = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/); if (!m) return c; return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); }; const cs = getComputedStyle(el); return { text: el.textContent, outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: hexOf(cs.outlineColor), outlineOffset: cs.outlineOffset, bg: cs.backgroundColor, color: hexOf(cs.color) }; });
      seq['dd-option'] = act;
      await p.keyboard.press('Escape');
      // tabs
      await p.focus('#tab-1'); const t1 = await p.evaluate(measure); seq['tab-active'] = t1;
      await p.keyboard.press('ArrowRight'); const t2 = await p.evaluate(measure); seq['tab-inactive->activated'] = t2;
      // switch disabled: no recibe foco
      const dis = await p.evaluate(() => { const i = document.getElementById('sw-dis'); i.focus(); return document.activeElement === i; });
      seq['sw-dis-focusable'] = dis;
      await p.close(); return seq;
    };
    const n = await run(NEWCSS), o = await run(OLDCSS); if (theme==='light') console.log('orden:', n.__order.join(' > '));
    // --- esperados A2
    for (const id of ['cb-off', 'cb-on', 'cb-err', 'rd-a', 'sw-off', 'sw-on']) {
      const m = n[id]; ok(m && !m.error, `${theme} ${id}: ${JSON.stringify(m)}`); if (!m || m.error) continue;
      ok(m.outlineWidth === '3px' && m.outlineStyle === 'solid', `${theme} ${id} outline ${m.outlineWidth} ${m.outlineStyle} (esperado 3px solid)`);
      ok(m.outlineColor === STRONG[theme], `${theme} ${id} color ${m.outlineColor} (esperado ${STRONG[theme]})`);
      ok(m.crRelevant === null || m.crRelevant >= 3, `${theme} ${id} contraste del indicador ${m.crRelevant} < 3 (${m.outlineColor} sobre ${m.bgOutside})`);
    }
    const d = n['dd-option'];
    ok(d && d.outlineWidth === '2px' && d.outlineColor === STRONG[theme] && parseFloat(d.outlineOffset) === -2 * 1, `${theme} dropdown opción: ${JSON.stringify(d)} (esperado 2px interior ${STRONG[theme]})`);
    for (const id of ['tab-active', 'tab-inactive->activated']) {
      const m = n[id]; ok(m && m.outlineWidth === '3px' && m.outlineColor === STRONG[theme] && parseFloat(m.outlineOffset) === 0, `${theme} ${id}: ${JSON.stringify(m)} (esperado 3px exterior offset 0 ${STRONG[theme]})`);
      ok(m && m.crOutside >= 3, `${theme} ${id} contraste ${m && m.crOutside}`);
    }
    ok(n['sw-dis-focusable'] === false, `${theme} switch disabled recibió foco`);
    // --- protegidos: botones e input idénticos a la base
    for (const id of ['btn-first', 'btn-sec', 'btn-ter', 'inp', 'dd-trigger']) { const a = JSON.stringify(n[id]), b = JSON.stringify(o[id]); ok(a === b, `${theme} PROTEGIDO ${id} cambió:\n   antes ${b}\n   ahora ${a}`); }
    // contraste del dropdown option vs su fondo (medido aparte)
    table.push({ theme, cb: n['cb-off'], sw: n['sw-on'], dd: d, tab: n['tab-active'] });
  }
  await browser.close();
  require('fs').writeFileSync('/tmp/qa/dec004-rows.json', JSON.stringify(table, null, 1));
  console.log(`PASS ${pass}  FAIL ${fail}`); fails.forEach(f => console.log(' ✗', f));
})();
