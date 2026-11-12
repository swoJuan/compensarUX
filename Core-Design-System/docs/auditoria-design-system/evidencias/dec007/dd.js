// DEC-007 · Dropdown reutilizable (mp-dropdown.js) en harness AISLADO: solo core.css + el módulo, sin scripts de documentación.
// Uso: node dd.js [--text=100|150|200] [--w=1280]
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const BASE = 'http://localhost:8000';
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1]) || d;
const PCT = +arg('text', 100), W = +arg('w', 1280);
const opts = (id, extra = '') => ['bog:Bogotá D.C.', 'med:Medellín', 'cal:Cali', 'buc:Bucaramanga:dis', 'baq:Barranquilla'].map(o => {
  const [v, l, d] = o.split(':'); return `<div class="mp-dropdown__option" role="option" aria-selected="false" data-value="${v}"${d ? ' aria-disabled="true"' : ''}>${extra}${l}</div>`;
}).join('');
const html = theme => `<!doctype html><html lang="es" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/css/core.css"><link rel="stylesheet" href="/icons/icons.css"></head><style>#before,#after{color:var(--use-text-primary);background:var(--use-surface-white)}</style><body style="margin:0;padding:16px;background:var(--use-background-page);color:var(--use-text-primary)"><main>
<button id="before" type="button">antes</button>
<div class="mp-dropdown-group"><label class="mp-dropdown-label">Ciudad <span aria-hidden="true">*</span></label>
 <div class="mp-dropdown" id="d1"><button class="mp-dropdown__trigger" type="button"><span class="mp-dropdown__value is-placeholder">Seleccionar</span><span class="mp-dropdown__caret material-symbols-rounded" aria-hidden="true"></span></button>
 <div class="mp-dropdown__panel"><div class="mp-dropdown__options">${opts('d1')}</div></div></div></div>
<div class="mp-dropdown-group"><label class="mp-dropdown-label">Ciudades</label>
 <div class="mp-dropdown" id="d2"><button class="mp-dropdown__trigger" type="button"><div class="mp-dropdown__chips"></div><span class="mp-dropdown__caret material-symbols-rounded" aria-hidden="true"></span></button>
 <div class="mp-dropdown__panel"><div class="mp-dropdown__options" aria-multiselectable="true">${opts('d2', '<span class="mp-dropdown__option-check"></span>')}</div></div></div></div>
<div class="mp-dropdown-group"><label class="mp-dropdown-label">Con búsqueda</label>
 <div class="mp-dropdown" id="d3"><button class="mp-dropdown__trigger" type="button"><span class="mp-dropdown__value is-placeholder">Seleccionar</span><span class="mp-dropdown__caret material-symbols-rounded" aria-hidden="true"></span></button>
 <div class="mp-dropdown__panel"><div class="mp-dropdown__search"><input class="mp-dropdown__search-input" type="text" aria-label="Buscar ciudad" autocomplete="off"></div>
 <div class="mp-dropdown__options">${opts('d3')}</div><div class="mp-dropdown__empty" role="status" hidden>Sin resultados</div></div></div></div>
<div class="mp-dropdown-group"><label class="mp-dropdown-label">Deshabilitado</label>
 <div class="mp-dropdown" id="d4"><button class="mp-dropdown__trigger" type="button" disabled><span class="mp-dropdown__value is-placeholder">No disponible</span></button>
 <div class="mp-dropdown__panel"><div class="mp-dropdown__options">${opts('d4')}</div></div></div></div>
<button id="after" type="button">después</button></main></body></html>`;

async function ctxFor(px) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwprof-')); fs.mkdirSync(dir + '/Default');
  fs.writeFileSync(dir + '/Default/Preferences', JSON.stringify({ webkit: { webprefs: { default_font_size: px } } }));
  return chromium.launchPersistentContext(dir, { channel: 'chromium', headless: true });
}
let pass = 0, fail = 0; const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg); } };

(async () => {
  const ctx = await ctxFor(Math.round(16 * PCT / 100));
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const T = `[${theme}${PCT !== 100 ? ' ' + PCT + '%' : ''}${W !== 1280 ? ' ' + W + 'px' : ''}] `;
    const p = await ctx.newPage(); await p.setViewportSize({ width: W, height: 900 });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route('**/__dd.html', r => r.fulfill({ contentType: 'text/html', body: html(theme) }));
    await p.goto(BASE + '/__dd.html');
    await p.addScriptTag({ url: BASE + '/js/mp-dropdown.js' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    const q = (sel, fn, ...a) => p.evaluate(({ sel, fn, a }) => { const el = document.querySelector(sel); return new Function('el', ...a.map((_, i) => 'a' + i), 'return (' + fn + ')')(el, ...a); }, { sel, fn, a });
    const state = async id => p.evaluate(id => {
      const r = document.getElementById(id), t = r.querySelector('.mp-dropdown__trigger'), l = r.querySelector('[role=listbox]'), s = r.querySelector('.mp-dropdown__search-input');
      const host = s || l, ad = host.getAttribute('aria-activedescendant'), act = ad && document.getElementById(ad);
      return { exp: t.getAttribute('aria-expanded'), focus: document.activeElement === t ? 'trigger' : document.activeElement === l ? 'list' : document.activeElement === s ? 'search' : (document.activeElement.id || document.activeElement.tagName),
        active: act ? act.textContent.trim() : null, activeCls: act ? act.classList.contains('mp-dropdown__option--active') : null, panelShown: getComputedStyle(r.querySelector('.mp-dropdown__panel')).display !== 'none',
        value: (r.querySelector('.mp-dropdown__value') || r.querySelector('.mp-dropdown__chips')).textContent.trim(),
        sel: [...r.querySelectorAll('[role=option][aria-selected=true]')].map(o => o.textContent.trim()) };
    }, id);

    // 1) ARIA inicial completada por el módulo
    const a0 = await p.evaluate(() => { const r = document.getElementById('d1'), t = r.querySelector('button'), l = r.querySelector('[role=listbox]');
      return { haspopup: t.getAttribute('aria-haspopup'), exp: t.getAttribute('aria-expanded'), ctrl: t.getAttribute('aria-controls') === l.id && !!l.id, name: t.getAttribute('aria-labelledby'),
        lbl: l.getAttribute('aria-labelledby'), opts: [...r.querySelectorAll('[role=option]')].every(o => o.id && o.hasAttribute('aria-selected')), wrapExp: r.hasAttribute('aria-expanded'), roleWrap: r.getAttribute('role') }; });
    ok(a0.haspopup === 'listbox' && a0.exp === 'false' && a0.ctrl, T + 'ARIA inicial del botón (haspopup/expanded/controls)');
    ok(a0.opts && !!a0.lbl && !!a0.name, T + 'opciones con id/aria-selected y listbox/botón con nombre accesible');
    ok(!a0.wrapExp && a0.roleWrap === null, T + 'el contenedor NO lleva aria-expanded ni role');
    ok(!(await state('d1')).panelShown, T + 'panel cerrado oculto');

    // 2) Teclado · selección única
    await p.focus('#d1 .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown');
    let s = await state('d1'); ok(s.exp === 'true' && s.focus === 'list' && s.panelShown, T + 'ArrowDown abre y mueve el foco al listbox'); ok(s.active === 'Bogotá D.C.' && s.activeCls, T + 'abre con la 1.ª opción activa');
    const outline = await q('#d1 .mp-dropdown__option--active', 'getComputedStyle(el).outlineStyle + " " + getComputedStyle(el).outlineWidth'); ok(/solid/.test(outline), T + 'la opción activa muestra contorno de foco (' + outline + ')');
    await p.keyboard.press('ArrowDown'); s = await state('d1'); ok(s.active === 'Medellín', T + 'ArrowDown mueve a la siguiente');
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); s = await state('d1'); ok(s.active === 'Barranquilla', T + 'omite la opción deshabilitada');
    await p.keyboard.press('Home'); s = await state('d1'); ok(s.active === 'Bogotá D.C.', T + 'Home');
    await p.keyboard.press('End'); s = await state('d1'); ok(s.active === 'Barranquilla', T + 'End');
    await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); s = await state('d1'); ok(s.active === 'Medellín', T + 'ArrowUp (saltando la deshabilitada)');
    await p.keyboard.press('Enter'); s = await state('d1'); ok(s.exp === 'false' && s.focus === 'trigger' && s.value === 'Medellín' && s.sel.join() === 'Medellín', T + 'Enter selecciona, cierra y devuelve el foco al botón');
    await p.keyboard.press('Enter'); s = await state('d1'); ok(s.exp === 'true' && s.active === 'Medellín', T + 'Enter en el botón abre con la opción seleccionada activa');
    await p.keyboard.press('Escape'); s = await state('d1'); ok(s.exp === 'false' && s.focus === 'trigger' && s.value === 'Medellín', T + 'Escape cierra, devuelve el foco y no cambia el valor');
    await p.keyboard.press('ArrowUp'); s = await state('d1'); ok(s.exp === 'true', T + 'ArrowUp también abre');
    await p.keyboard.type('c'); s = await state('d1'); ok(s.active === 'Cali', T + 'typeahead (c → Cali)');
    await p.keyboard.press(' '); s = await state('d1'); ok(s.value === 'Cali' && s.exp === 'false', T + 'Espacio selecciona');
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('Tab'); s = await state('d1'); const nextOk = await p.evaluate(() => document.activeElement === document.querySelector('#d2 .mp-dropdown__trigger')); ok(s.exp === 'false' && nextOk, T + 'Tab cierra y sigue el orden natural (foco en el siguiente control)');
    await p.keyboard.press('Shift+Tab');

    // 3) Deshabilitado
    await p.evaluate(() => document.querySelector('#d4 button').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    s = await state('d4'); ok(s.exp === 'false', T + 'botón deshabilitado no abre');

    // 4) Multi-selección
    await p.focus('#d2 .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); await p.keyboard.press(' '); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
    s = await state('d2'); ok(s.exp === 'true' && s.sel.join() === 'Bogotá D.C.,Medellín' && s.focus === 'list', T + 'multi: Espacio/Enter alternan y el panel sigue abierto');
    ok(/Bogotá D\.C\./.test(s.value) && /Medellín/.test(s.value), T + 'multi: el botón muestra la selección (' + s.value + ')');
    await p.keyboard.press(' '); s = await state('d2'); ok(s.sel.join() === 'Bogotá D.C.', T + 'multi: Espacio deselecciona');
    await p.keyboard.press('Escape'); s = await state('d2'); ok(s.exp === 'false' && s.focus === 'trigger', T + 'multi: Escape cierra y devuelve el foco');

    // 5) Búsqueda
    await p.focus('#d3 .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); s = await state('d3');
    ok(s.focus === 'search' && s.exp === 'true', T + 'búsqueda: el foco pasa al campo');
    const sr = await p.evaluate(() => { const i = document.querySelector('#d3 input'); return { role: i.getAttribute('role'), ctrl: !!i.getAttribute('aria-controls'), exp: i.getAttribute('aria-expanded'), ac: i.getAttribute('aria-autocomplete') }; });
    ok(sr.role === 'combobox' && sr.ctrl && sr.exp === 'true' && sr.ac === 'list', T + 'búsqueda: campo con role=combobox/aria-controls/aria-expanded/aria-autocomplete');
    await p.keyboard.type('med'); const vis = await p.evaluate(() => [...document.querySelectorAll('#d3 [role=option]')].filter(o => !o.hidden && getComputedStyle(o).display !== 'none').map(o => o.textContent.trim()));
    ok(vis.join() === 'Medellín', T + 'búsqueda: filtra (' + vis.join() + ')');
    s = await state('d3'); ok(s.active === 'Medellín', T + 'búsqueda: la opción filtrada queda activa');
    await p.keyboard.press('Enter'); s = await state('d3'); ok(s.value === 'Medellín' && s.exp === 'false' && s.focus === 'trigger', T + 'búsqueda: Enter selecciona y devuelve el foco');
    await p.keyboard.press('ArrowDown'); await p.keyboard.type('zzz');
    const empty = await p.evaluate(() => { const e = document.querySelector('#d3 .mp-dropdown__empty'); return !e.hidden && getComputedStyle(e).display !== 'none'; }); ok(empty, T + 'búsqueda: sin resultados muestra el mensaje');
    await p.keyboard.press('Escape'); const reset = await p.evaluate(() => document.querySelector('#d3 input').value === '' && [...document.querySelectorAll('#d3 [role=option]')].every(o => !o.hidden)); ok(reset, T + 'búsqueda: al cerrar se limpia el filtro');

    // 6) Ratón + exclusividad + clic fuera
    await p.click('#d1 .mp-dropdown__trigger'); s = await state('d1'); ok(s.exp === 'true', T + 'clic abre');
    await p.evaluate(() => document.querySelector('#d3 .mp-dropdown__trigger').click()); s = await state('d1'); const s3 = await state('d3'); ok(s.exp === 'false' && s3.exp === 'true', T + 'solo uno abierto a la vez');
    await p.click('#before'); s = await state('d3'); ok(s.exp === 'false', T + 'clic fuera cierra');
    await p.click('#d1 .mp-dropdown__trigger'); await p.click('#d1 [data-value=cal]'); s = await state('d1'); ok(s.value === 'Cali' && s.exp === 'false', T + 'clic en opción selecciona y cierra');

    // 7) Layout: sin desborde y panel dentro del viewport; atributos ARIA abiertos con axe
    await p.focus('#d1 .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('End');
    const lay = await p.evaluate(() => { const pa = document.querySelector('#d1 .mp-dropdown__panel').getBoundingClientRect(); return { docOver: document.documentElement.scrollWidth - innerWidth, right: pa.right, vw: innerWidth, left: pa.left }; });
    ok(lay.docOver <= 0 && lay.left >= 0 && lay.right <= lay.vw + 0.5, T + 'sin desborde horizontal y panel dentro del viewport (' + Math.round(lay.left) + '..' + Math.round(lay.right) + ' de ' + lay.vw + ')');
    await p.addScriptTag({ content: fs.readFileSync('/tmp/dec007/node_modules/axe-core/axe.min.js', 'utf8') });
    const ax = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'page-has-heading-one': { enabled: false }, 'document-title': { enabled: false }, 'landmark-one-main': { enabled: false } } }));
    const bad = await p.evaluate(ids => ids.map(i => { const e = document.querySelector(i); return i + '=' + (e ? e.textContent.trim() + (e.getAttribute('aria-disabled') ? ' (aria-disabled)' : '') + (e.classList.contains('mp-dropdown__option--selected') ? ' (selected)' : '') : '?'); }), ax.violations.flatMap(v => v.nodes.map(n => n.target[0]))); if (bad.length) console.log('   nodos axe', theme, bad.join(' ; '));
    ok(ax.violations.length === 0, T + 'axe (abierto): ' + (ax.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'sin violaciones') + ' ' + ax.violations.map(v => v.nodes.map(n => n.target.join(' ') + ' ' + (n.any[0] && n.any[0].message || '').slice(0, 110)).join(' ; ')).join(' | '));
    const cc = await p.evaluate(() => axe.run({ include: [['main']], exclude: [['.mp-dropdown__option--selected']] }, { runOnly: ['color-contrast'] }));
    ok(cc.violations.length === 0, T + 'axe color-contrast (excluye la opción seleccionada en naranja de marca, DS-01/DEC-001): ' + (cc.violations.length ? cc.violations[0].nodes.map(n => n.target.join(' ') + ' ' + (n.any[0] && n.any[0].message || '').slice(0, 100)).join(' ; ') : 'sin violaciones'));
    ok(errs.length === 0, T + 'sin errores de JS ' + errs.join('|'));
    await p.close();
  }
  await ctx.close();
  console.log(`dropdown ${PCT}% ${W}px: ${pass} OK, ${fail} fallos`); fails.forEach(f => console.log('  FALLA', f));
  process.exit(fail ? 1 : 0);
})();
