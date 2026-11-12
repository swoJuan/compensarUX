// forced-colors: ¿se distingue el estado ON del OFF? Compara píxeles de cada par de estados con emulación forcedColors:'active'.
// Uso: node forced.js [--css=/ruta/core.css]
const { chromium } = require('playwright'); const fs = require('fs'), crypto = require('crypto');
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || d;
const CSS = fs.readFileSync(arg('css', '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css'), 'utf8');
const sw = on => `<label class="mp-switch"><span class="mp-switch__field"><input class="form-check-input mp-switch__input" type="checkbox" role="switch" ${on ? 'checked' : ''}><span class="mp-switch__track" aria-hidden="true"></span></span><span class="mp-switch__label">x</span></label>`;
const ch = (k, on) => `<label class="mp-choice mp-${k}"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" type="${k === 'radio' ? 'radio' : 'checkbox'}" ${on ? 'checked' : ''}><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__label">x</span></label>`;
const PAIRS = {
  'switch (on/off)': [sw(false), sw(true)],
  'checkbox (on/off)': [ch('checkbox', false), ch('checkbox', true)],
  'radio (on/off)': [ch('radio', false), ch('radio', true)],
  'tab (activa/inactiva)': ['<div class="mp-tabs" role="tablist"><button class="mp-tab" role="tab" aria-selected="false">Tab</button></div>', '<div class="mp-tabs" role="tablist"><button class="mp-tab is-active" role="tab" aria-selected="true">Tab</button></div>'],
  'chip (sel/no sel)': ['<button class="mp-chip" type="button">Chip</button>', '<button class="mp-chip is-selected" type="button" aria-pressed="true">Chip</button>'],
  'paginación (activa/no)': ['<nav class="mp-pagination"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link" href="#">2</a></li></ul></nav>', '<nav class="mp-pagination"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link is-active" aria-current="page" href="#">2</a></li></ul></nav>'],
  'stepper (pendiente/hecho)': ['<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar"></span></div></div>', '<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar is-done"></span></div></div>'],
  'stepper (pendiente/actual)': ['<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar"></span></div></div>', '<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar is-current"></span></div></div>'],
  'stepper (hecho/actual)': ['<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar is-done"></span></div></div>', '<div class="mp-stepper" style="width:240px"><div class="mp-stepper__track"><span class="mp-stepper__bar is-current"></span></div></div>'],
};
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const out = {};
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const ctx = await b.newContext({ forcedColors: 'active', viewport: { width: 400, height: 200 } }); const p = await ctx.newPage();
    for (const [name, [off, on]] of Object.entries(PAIRS)) {
      const hash = {};
      for (const [k, h] of [['off', off], ['on', on]]) {
        await p.route('**/__f.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="es" data-theme="${theme}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="margin:0;padding:16px"><div id="box" style="display:inline-block;padding:8px">${h}</div></body></html>` }));
        await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS }));
        await p.goto('http://localhost:8000/__f.html'); await p.addStyleTag({ content: '*{transition:none!important}' }); await p.waitForTimeout(120);
        hash[k] = crypto.createHash('md5').update(await p.locator('#box').screenshot()).digest('hex');
        await p.unroute('**/__f.html'); await p.unroute(/\/css\/core\.css/);
      }
      (out[name] = out[name] || {})[theme] = hash.off !== hash.on;
    }
    await ctx.close();
  }
  await b.close();
  console.log('¿se distingue el estado bajo forced-colors?  (true = sí)');
  for (const [n, v] of Object.entries(out)) console.log('  ' + n.padEnd(28), Object.entries(v).map(([t, d]) => `${t}:${d ? 'SÍ' : 'NO'}`).join('  '));
})();
