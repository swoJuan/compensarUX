// DEC-007 · Integración en las páginas REALES del portal: línea base v2.2.1 (8001) frente a árbol nuevo (8000).
const { chromium } = require('playwright');
const fs = require('fs');
const axeSrc = fs.readFileSync('/tmp/dec007/node_modules/axe-core/axe.min.js', 'utf8');
const BASES = { 'base v2.2.1': 'http://localhost:8001', 'nuevo': 'http://localhost:8000' };
const THEMES = { light: 'Claro', dark: 'Oscuro', 'high-contrast': 'Alto contraste' };
const only = process.argv.find(a => a.startsWith('--theme='))?.split('=')[1];

async function open(b, base, page, hash, theme, w = 1280) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message.slice(0, 90)));
  await p.goto(`${base}/${page}#${hash}`, { waitUntil: 'load' }); await p.waitForTimeout(1800);
  if (theme !== 'light') { await p.evaluate(t => { const x = [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); x && x.click(); }, THEMES[theme]); await p.waitForTimeout(400); }
  return p;
}
const R = {}; const rec = (k, v) => { (R[k] = R[k] || []).push(v); };

(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  for (const theme of only ? [only] : Object.keys(THEMES)) {
    for (const [name, base] of Object.entries(BASES)) {
      if (name === 'base v2.2.1' && theme !== 'light') continue;   // la línea base solo hace falta en Light
      const tag = `${name} · ${theme}`;

      // ───────── Dropdown (Web) ─────────
      let p = await open(b, base, 'drupal.html', 'dropdown', theme);
      const dd = await p.evaluate(() => {
        const page = document.querySelector('[data-component-doc="dropdown"]');
        const roots = [...page.querySelectorAll('.mp-dropdown')];
        const t = page.querySelector('#drp-live-preview .mp-dropdown__trigger');
        return { roots: roots.length, wrapperExpanded: roots.filter(r => r.hasAttribute('aria-expanded')).length, comboWrapper: roots.filter(r => r.getAttribute('role') === 'combobox').length,
          controlsOk: [...page.querySelectorAll('.mp-dropdown__trigger[aria-controls]')].filter(x => !document.getElementById(x.getAttribute('aria-controls'))).length,
          hasTrigger: !!t };
      });
      rec('Web · wrappers con aria-expanded (debe ser 0)', [tag, dd.wrapperExpanded]);
      rec('Web · wrappers con role=combobox (debe ser 0)', [tag, dd.comboWrapper]);
      rec('Web · triggers con aria-controls roto (debe ser 0)', [tag, dd.controlsOk]);
      await p.focus('#drp-live-preview .mp-dropdown__trigger');
      await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
      let s = await p.evaluate(() => { const t = document.querySelector('#drp-live-preview .mp-dropdown__trigger'); const pan = document.querySelector('#drp-live-preview .mp-dropdown__panel');
        return { exp: t.getAttribute('aria-expanded'), shown: getComputedStyle(pan).display !== 'none', focusInPanel: pan.contains(document.activeElement) }; });
      rec('Web · playground: ↓ abre el panel y mueve el foco', [tag, s.exp === 'true' && s.shown && s.focusInPanel]);
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
      s = await p.evaluate(() => { const t = document.querySelector('#drp-live-preview .mp-dropdown__trigger'); return { exp: t.getAttribute('aria-expanded'), val: t.querySelector('.mp-dropdown__value')?.textContent.trim(), focus: document.activeElement === t, sel: document.querySelectorAll('#drp-live-preview [role=option][aria-selected=true]').length }; });
      rec('Web · playground: ↓ + Enter selecciona, cierra y devuelve el foco', [tag, s.exp === 'false' && s.val && s.val !== 'Seleccionar' && s.focus && s.sel === 1]);
      // regenerar el playground (tipo=búsqueda) y volver a operar con teclado
      await p.selectOption('#drp-ctrl-tipo', 'search'); await p.waitForTimeout(250);
      await p.focus('#drp-live-preview .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
      s = await p.evaluate(() => ({ onSearch: document.activeElement.classList.contains('mp-dropdown__search-input'), role: document.activeElement.getAttribute('role') }));
      await p.keyboard.type('med'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
      const v = await p.evaluate(() => document.querySelector('#drp-live-preview .mp-dropdown__value')?.textContent.trim());
      rec('Web · tras regenerar (búsqueda): foco al campo, filtra y selecciona', [tag, s.onSearch && s.role === 'combobox' && /Medell/.test(v)]);
      await p.selectOption('#drp-ctrl-tipo', 'multiple'); await p.waitForTimeout(250);
      await p.focus('#drp-live-preview .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); await p.keyboard.press(' '); await p.keyboard.press('ArrowDown'); await p.keyboard.press(' '); await p.waitForTimeout(100);
      s = await p.evaluate(() => ({ exp: document.querySelector('#drp-live-preview .mp-dropdown__trigger').getAttribute('aria-expanded'), n: document.querySelectorAll('#drp-live-preview [role=option][aria-selected=true]').length, chips: document.querySelectorAll('#drp-live-preview .mp-dropdown__chip').length }));
      rec('Web · multi-selección: Espacio alterna (2 marcadas, 2 chips, sigue abierto)', [tag, s.exp === 'true' && s.n === 2 && s.chips === 2]);
      await p.keyboard.press('Escape');
      // tarjetas de estado estáticas
      await p.focus('#drp-state-default'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
      s = await p.evaluate(() => document.querySelector('#drp-state-default').getAttribute('aria-expanded'));
      rec('Web · tarjeta de estado estática: ↓ abre', [tag, s === 'true']);
      // anatomía (diagrama): no interactivo
      const an = await p.evaluate(() => { const r = document.querySelector('[data-drp-anatomy-render] .mp-dropdown'); return r ? { static: r.hasAttribute('data-mp-static'), noIds: ![...r.querySelectorAll('[role=option]')].some(o => o.id) } : null; });
      rec('Web · diagrama de anatomía marcado data-mp-static y sin enhance', [tag, !!an && an.static && an.noIds]);
      // axe (reglas ARIA/estructura) acotado al contenido de la documentación del componente
      await p.addScriptTag({ content: axeSrc });
      const ax = await p.evaluate(() => axe.run({ include: [['[data-component-doc="dropdown"]']] }, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }));
      rec('Web · axe (sin contraste) en la página de Dropdown', [tag, ax.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'sin violaciones']);
      rec('Web · errores JS', [tag, p.__errs.length ? p.__errs.join('|') : 'ninguno']);
      await p.close();

      // ───────── Tabs (Web) ─────────
      p = await open(b, base, 'drupal.html', 'tabs', theme);
      const before = await p.evaluate(() => ({ code: document.querySelector('#tab-playground-code')?.textContent.length, panel: document.querySelector('#tab-preview-panel')?.textContent }));
      await p.focus('#tab-preview-area [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
      s = await p.evaluate(() => { const a = document.activeElement; const tabs = [...document.querySelectorAll('#tab-preview-area [role=tab]')];
        return { idx: tabs.indexOf(a), sel: tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'), tab: tabs.map(t => t.tabIndex).join(), panel: document.querySelector('#tab-preview-panel')?.textContent, pageIdx: document.querySelector('[data-component-doc=tabs]').dataset.tabActiveIndex }; });
      rec('Web · tabs playground: → mueve foco, activa y conserva el foco tras renderizar', [tag, s.idx === 1 && s.sel === 1 && s.panel !== before.panel && s.pageIdx === '1']);
      await p.keyboard.press('End'); await p.waitForTimeout(200);
      s = await p.evaluate(() => { const tabs = [...document.querySelectorAll('#tab-preview-area [role=tab]')]; return { idx: tabs.indexOf(document.activeElement), n: tabs.length }; });
      rec('Web · tabs playground: Fin va a la última y conserva el foco', [tag, s.idx === s.n - 1]);
      await p.keyboard.press('Home'); await p.waitForTimeout(200);
      s = await p.evaluate(() => { const tabs = [...document.querySelectorAll('#tab-preview-area [role=tab]')]; return tabs.indexOf(document.activeElement); });
      rec('Web · tabs playground: Inicio va a la primera', [tag, s === 0]);
      // tira estática de ejemplo ("Tabs solo texto")
      const sid = await p.evaluate(() => { const l = [...document.querySelectorAll('[role=tablist]')].find(x => x.getAttribute('aria-label') === 'Tabs solo texto'); if (!l) return null; const t = l.querySelectorAll('[role=tab]'); t[0].setAttribute('data-probe', '0'); return true; });
      if (sid) {
        await p.focus('[role=tablist][aria-label="Tabs solo texto"] [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
        s = await p.evaluate(() => { const l = [...document.querySelectorAll('[role=tablist]')].find(x => x.getAttribute('aria-label') === 'Tabs solo texto'); const t = [...l.querySelectorAll('[role=tab]')]; return { idx: t.indexOf(document.activeElement), sel: t.findIndex(x => x.getAttribute('aria-selected') === 'true'), tab: t.map(x => x.tabIndex).join() }; });
        rec('Web · tira estática "Tabs solo texto": → activa la siguiente', [tag, s.idx === 1 && s.sel === 1 && s.tab === '-1,0,-1']);
      }
      await p.addScriptTag({ content: axeSrc });
      const ax2 = await p.evaluate(() => axe.run({ include: [['[data-component-doc="tabs"]']] }, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }));
      rec('Web · axe (sin contraste) en la página de Tabs', [tag, ax2.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'sin violaciones']);
      rec('Web · errores JS (tabs)', [tag, p.__errs.length ? p.__errs.join('|') : 'ninguno']);
      await p.close();

      // ───────── App: Dropdown y Tabs ─────────
      p = await open(b, base, 'app.html', 'dropdown', theme);
      const hasApp = await p.evaluate(() => !!document.querySelector('#drp-live-preview .mp-dropdown__trigger'));
      if (hasApp) {
        await p.focus('#drp-live-preview .mp-dropdown__trigger'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
        s = await p.evaluate(() => { const t = document.querySelector('#drp-live-preview .mp-dropdown__trigger'); return t.getAttribute('aria-expanded') === 'false' && t.querySelector('.mp-dropdown__value').textContent.trim() !== 'Seleccionar' && document.activeElement === t; });
        rec('App · dropdown playground: ↓ + Enter selecciona y devuelve el foco', [tag, s]);
      } else rec('App · dropdown playground: ↓ + Enter selecciona y devuelve el foco', [tag, 'no existe en app.html#dropdown']);
      await p.close();
      p = await open(b, base, 'app.html', 'tabs', theme);
      const appTabs = await p.evaluate(() => !!document.querySelector('#app-tabs-preview [role=tab]'));
      if (appTabs) {
        await p.focus('#app-tabs-preview [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
        s = await p.evaluate(() => { const t = [...document.querySelectorAll('#app-tabs-preview [role=tab]')]; return { idx: t.indexOf(document.activeElement), sel: t.findIndex(x => x.getAttribute('aria-selected') === 'true'), tab: t.map(x => x.tabIndex).join() }; });
        rec('App · tabs: → activa la siguiente y conserva el foco tras renderizar', [tag, s.idx === 1 && s.sel === 1]);
        rec('App · tabs: tabindex móvil tras renderizar', [tag, s.tab]);
      } else rec('App · tabs', [tag, 'no existe en app.html#tabs']);
      await p.close();
    }
  }
  await b.close();
  for (const [k, v] of Object.entries(R)) { console.log('\n' + k); v.forEach(([t, r]) => console.log('   ' + t.padEnd(26) + ' ' + (r === true ? 'OK' : r === false ? 'FALLA' : r))); }
})();
