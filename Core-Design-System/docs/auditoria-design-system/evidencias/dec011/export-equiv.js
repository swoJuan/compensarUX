// DEC-011 · El CSS DESCARGABLE (solo el export, sin core.css) calcula los mismos valores que core.css en las propiedades que el propio export declara,
// en Light / Dark / Alto contraste. Se compara por elemento y por propiedad declarada en las reglas del export que le aplican.
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');
const { EXE } = require('/tmp/qa/fixture.js');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const HOST = 'http://localhost:8000';
const CORE = fs.readFileSync(ROOT + '/css/core.css', 'utf8');
const PAGES = [['alertas', 'alert', '.mp-alert'], ['toast', 'toast', '.mp-toast'], ['modales', 'modal', '.mp-modal'], ['seleccion', 'selection', '.mp-choice, .mp-switch'],
  ['badges', 'badges', '.mp-badge, .mp-chip, .mp-tag'], ['avatar', 'avatar', '.mp-avatar, .mp-user-chip'], ['sidebar', 'sidebar', '.mp-sidebar'], ['stepper', 'stepper', '.mp-stepper'], ['paginacion', 'pagination', '.mp-pagination'], ['dropdown', 'dropdown', '.mp-dropdown-group, .mp-dropdown'], ['cards', 'cards', '.mp-card'], ['tables', 'tables', '.mp-table'],
  ['loading', 'loading', '.mp-loader, .mp-spinner, .mp-skeleton, [class*="mp-loading"]'], ['breadcrumb', 'breadcrumb', '.mp-breadcrumb'], ['accordion', 'accordion', '.mp-accordion']];
const SKIP = 'i, .icon, [class*="icon-"], .material-symbols-rounded, svg, svg *, img';
// Propiedades que dependen del entorno y no del componente (se calculan con la fuente de iconos / reset que el export no incluye)
const IGNORE_PROPS = new Set(['width', 'height', 'inline-size', 'block-size', 'min-width', 'min-height', 'font-family']);
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const rows = []; const detail = [];
  for (const [route, key, sel] of PAGES) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await pg.goto(`${HOST}/drupal.html#${route}`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1500);
    const exp = await pg.evaluate(k => window.mpDocsCss(k), key);
    const frag = await pg.evaluate(s => { const els = [...document.querySelectorAll(s)].filter(e => !e.closest('pre,.code-block,.code-content,[hidden]')); const top = els.filter(e => !els.some(o => o !== e && o.contains(e))); return top.slice(0, 14).map(e => e.outerHTML).join('\n'); }, sel);
    await pg.close();
    let nCmp = 0, nBad = 0;
    for (const theme of ['light', 'dark', 'high-contrast']) {
      const open = async css => { const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
        await p.setContent(`<!doctype html><html data-theme="${theme}"><head><meta charset=utf-8><style>*,*::before,*::after{transition:none!important;animation:none!important}</style><style id="under-test">${css}</style></head><body style="margin:0;padding:16px">${frag}</body></html>`); return p; };
      // 1) con SOLO el export: qué propiedades declara cada elemento y cuánto valen
      const pe = await open(exp);
      const B = await pe.evaluate(({ skip, ignore }) => {
        const sheet = [...document.styleSheets].find(s => s.ownerNode && s.ownerNode.id === 'under-test');
        const rules = []; const walk = list => { for (const r of list) { if (r.type === 1) rules.push(r); else if (r.cssRules) walk(r.cssRules); } }; walk(sheet.cssRules);
        return [...document.body.querySelectorAll('*')].filter(e => !e.matches(skip)).map(e => {
          const props = new Set();
          for (const r of rules) { let m = false; try { m = e.matches(r.selectorText); } catch (x) {} if (m) for (let i = 0; i < r.style.length; i++) { const n = r.style[i]; if (!n.startsWith('--') && !ignore.includes(n)) props.add(n); } }
          const cs = getComputedStyle(e); return { cls: String(e.className).split(' ')[0] || e.tagName.toLowerCase(), vals: [...props].map(n => [n, cs.getPropertyValue(n)]) };
        });
      }, { skip: SKIP, ignore: [...IGNORE_PROPS] });
      await pe.close();
      // 2) con core.css: los mismos elementos y propiedades
      const pc = await open(CORE);
      const A = await pc.evaluate(({ skip, lists }) => [...document.body.querySelectorAll('*')].filter(e => !e.matches(skip)).map((e, i) => { const cs = getComputedStyle(e); return (lists[i] || []).map(([n]) => [n, cs.getPropertyValue(n)]); }), { skip: SKIP, lists: B.map(x => x.vals) });
      await pc.close();
      B.forEach((el, i) => el.vals.forEach(([n, v], k) => { nCmp++; const av = (A[i][k] || [])[1]; if (av !== v) { nBad++; detail.push(`${route}/${theme} .${el.cls} ${n}: core=${av}  export=${v}`); } }));
    }
    rows.push(`${route.padEnd(11)} ${String(nCmp).padStart(5)} valores comparados, ${nBad} diferentes`);
    pass += nCmp - nBad; fail += nBad;
  }
  await b.close();
  console.log(rows.join('\n')); console.log(`PASS ${pass}  FAIL ${fail}`);
  const own = detail.filter(d => !/\.(form-check-input|modal-dialog|modal-content|btn)\b/.test(d)); console.log('no Bootstrap:', own.length); [...new Set(own)].slice(0, 30).forEach(d => console.log(' ✗', d.slice(0, 220)));
})();
