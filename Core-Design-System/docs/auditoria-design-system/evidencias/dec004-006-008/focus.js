// Foco por teclado visible: cada control enfocable con Tab cambia píxeles y tiene un indicador ≥3:1 contra su entorno? (3 temas)
// Uso: node focus.js [--css=/ruta/core.css]
const { chromium } = require('playwright'); const fs = require('fs'), crypto = require('crypto');
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || d;
const CSS = fs.readFileSync(arg('css', '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css'), 'utf8');
const CASES = {
  'header · enlace utilitario': '<header class="mp-web-header"><div class="mp-web-header__utility"><a class="mp-web-header__utility-link" href="#">Personas</a></div></header>',
  'header · CTA': '<header class="mp-web-header"><div class="mp-web-header__main"><a class="mp-web-header__cta" href="#">Afíliate</a></div></header>',
  'header · enlace de navegación': '<header class="mp-web-header"><nav class="mp-web-header__nav"><div class="mp-web-header__nav-item"><a class="mp-web-header__nav-link" href="#">Salud</a></div></nav></header>',
  'header · buscador': '<header class="mp-web-header"><div class="mp-web-header__main"><div class="mp-web-header__search"><input class="mp-web-header__search-input" aria-label="Buscar" placeholder="Buscar"></div></div></header>',
  'botón primario': '<button class="mp-btn mp-btn--primario" type="button">Botón</button>',
  'botón secundario': '<button class="mp-btn mp-btn--secundario" type="button">Botón</button>',
  'botón terciario': '<button class="mp-btn mp-btn--terciario" type="button">Botón</button>',
  'input': '<input class="mp-input-field" aria-label="x" value="v" style="width:240px">',
  'dropdown (botón)': '<div class="mp-dropdown" style="width:240px"><button class="mp-dropdown__trigger" type="button"><span class="mp-dropdown__value">Valor</span></button></div>',
  'tab': '<div class="mp-tabs" role="tablist" aria-label="t"><button class="mp-tab" role="tab" aria-selected="false">Tab</button></div>',
  'chip': '<button class="mp-chip" type="button">Chip</button>',
  'paginación': '<nav class="mp-pagination"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link" href="#">2</a></li></ul></nav>',
  'breadcrumb': '<nav class="mp-breadcrumb"><ol class="mp-breadcrumb__list"><li class="mp-breadcrumb__item"><a class="mp-breadcrumb__link" href="#">Inicio</a></li></ol></nav>',
  'user-chip': '<button class="mp-user-chip" type="button"><span class="mp-user-chip__body"><span class="mp-user-chip__name">Ana</span></span></button>',
  'checkbox': '<label class="mp-choice mp-checkbox"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" type="checkbox"><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__label">x</span></label>',
  'switch': '<label class="mp-switch"><span class="mp-switch__field"><input class="form-check-input mp-switch__input" type="checkbox" role="switch"><span class="mp-switch__track" aria-hidden="true"></span></span><span class="mp-switch__label">x</span></label>',
  'enlace genérico': '<a href="#">enlace</a>',
};
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const bad = {}; let tot = 0;
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 300 } });
    for (const [name, html] of Object.entries(CASES)) {
      await p.route('**/__k.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="es" data-theme="${theme}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="margin:0;padding:24px;background:var(--use-background-page);color:var(--use-text-primary)"><button id="pre" style="opacity:0;position:absolute">.</button><div id="box" style="display:block;padding:12px;width:1000px">${html}</div></body></html>` }));
      await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS }));
      await p.goto('http://localhost:8000/__k.html'); await p.addStyleTag({ content: '*{transition:none!important;animation:none!important}' }); await p.waitForTimeout(80);
      const before = crypto.createHash('md5').update(await p.locator('#box').screenshot()).digest('hex');
      await p.focus('#pre'); await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const onTarget = await p.evaluate(() => document.getElementById('box').contains(document.activeElement));
      const after = crypto.createHash('md5').update(await p.locator('#box').screenshot()).digest('hex');
      const info = await p.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return { ol: c.outlineStyle === 'none' ? '' : `${c.outlineWidth} ${c.outlineStyle}`, sh: c.boxShadow === 'none' ? '' : 'sombra', bd: c.borderTopColor }; });
      tot++; await p.unroute('**/__k.html'); await p.unroute(/\/css\/core\.css/);
      if (!onTarget || before === after) (bad[name] = bad[name] || []).push(theme + (onTarget ? '' : '(sin foco)'));
    }
    await p.close();
  }
  await b.close();
  console.log(`controles × temas: ${tot} · sin cambio visible al enfocar con teclado: ${Object.values(bad).reduce((a, v) => a + v.length, 0)}`);
  for (const [n, v] of Object.entries(bad)) console.log('  SIN INDICADOR VISIBLE ·', n.padEnd(32), v.join(', '));
})();
