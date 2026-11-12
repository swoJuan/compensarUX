// F-1 · prueba de cascada: ¿qué color obtiene <i class="icon icon-info"> en cada estructura de marcado y con cada candidato de arreglo?
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const CORE = fs.readFileSync(process.env.CSS || ROOT + '/css/core.css', 'utf8');
const CANDIDATES = {
  'sin arreglo': '',
  'A: currentColor !important en .icon descendiente': '.mp-alert__icon .icon,.mp-toast__icon .icon{color:currentColor !important}',
  'B: A + el propio elemento (.icon.mp-alert__icon)': '.mp-alert__icon .icon,.mp-alert__icon.icon,.mp-toast__icon .icon,.mp-toast__icon.icon{color:currentColor !important}',
  'C: var(--mp-alert-icon) !important en descendiente y en el propio': '.mp-alert__icon.icon,.mp-alert__icon .icon{color:var(--mp-alert-icon) !important}.mp-toast__icon.icon,.mp-toast__icon .icon{color:var(--mp-toast-icon) !important}',
};
const STRUCT = {
  'S1 docs: <i class="icon icon-info mp-alert__icon"> (mismo elemento)': k => `<div class="mp-alert mp-alert--${k}"><i class="icon icon-info icon-32 mp-alert__icon" id="i"></i><div class="mp-alert__content"><p class="mp-alert__title">T</p></div></div>`,
  'S2 anidado: <span class="mp-alert__icon"><i class="icon icon-info"></span>': k => `<div class="mp-alert mp-alert--${k}"><span class="mp-alert__icon"><i class="icon icon-info icon-32" id="i"></i></span><div class="mp-alert__content"><p class="mp-alert__title">T</p></div></div>`,
  'S3 anidado + Toast': k => `<div class="mp-toast mp-toast--${k}"><span class="mp-toast__icon"><i class="icon icon-info icon-32" id="i"></i></span><div class="mp-toast__content"><p class="mp-toast__title">T</p></div></div>`,
};
const hex = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)/); return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); };
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  for (const [cn, extra] of Object.entries({ 'CSS REAL compilado (sin candidatos)': '' })) {
    console.log('\n### ' + cn);
    for (const [sn, mk] of Object.entries(STRUCT)) {
      const row = [];
      for (const theme of ['light', 'dark', 'high-contrast']) {
        const p = await b.newPage();
        // variante warning/error además de info: el arreglo no debe tocar el icono propio de cada tipo
        const res = {};
        for (const kind of ['info', 'warning', 'error', 'success']) {
          await p.setContent(`<!doctype html><html data-theme="${theme}"><head><meta charset=utf-8><style>${CORE}${extra}</style></head><body>${mk(kind).replace(/icon-info/g, kind === 'info' ? 'icon-info' : kind === 'warning' ? 'icon-warning' : kind === 'error' ? 'icon-warning-circle' : 'icon-check-circle')}</body></html>`);
          res[kind] = await p.evaluate(() => { const i = document.getElementById('i'); const root = i.closest('.mp-alert,.mp-toast'); const cs = getComputedStyle(i); const bg = getComputedStyle(root).backgroundColor; const t = root.querySelector('[class$="__title"]'); return { icon: cs.color, bg, title: getComputedStyle(t).color, varIcon: getComputedStyle(root).getPropertyValue(root.classList.contains('mp-alert') ? '--mp-alert-icon' : '--mp-toast-icon') }; });
        }
        await p.close();
        row.push(`${theme}: ` + Object.entries(res).map(([k, v]) => `${k}=${hex(v.icon)}`).join(' '));
      }
      console.log('  ' + sn + '\n    ' + row.join('\n    '));
    }
  }
  await b.close();
})();
