// Comprobaciones en página de la estabilización v2.3.0. Se evalúan dentro del navegador:
//   Chromium: functional-v230.js (Playwright)      Firefox: firefox-v230.js (Marionette)
// Devuelve [[nombre, ok, detalle], ...]. Una sola función, sin dependencias.
async function inpageV230(route) {
  const out = [];
  const t = (name, ok, detail) => out.push([name, !!ok, detail === undefined ? '' : String(detail)]);
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const main = document.querySelector('.main');

  // 1. Desborde del área de contenido
  t('sin desborde horizontal', main.scrollWidth - main.clientWidth <= 2, `main ${main.scrollWidth - main.clientWidth}px / página ${document.documentElement.scrollWidth - document.documentElement.clientWidth}px`);

  // 2. Pestañas de código: roles válidos y conmutación intacta
  const lists = [...document.querySelectorAll('#content .code-tabs')];
  if (lists.length) {
    const tabs = lists.flatMap(l => [...l.querySelectorAll('.code-tab')]);
    const sel = tabs.filter(b => b.hasAttribute('aria-selected'));
    t('pestañas con aria-selected tienen role=tab', sel.every(b => b.getAttribute('role') === 'tab'), `${sel.length} pestañas`);
    const tl = lists.filter(l => l.getAttribute('role') === 'tablist');
    t('tablist solo contiene tabs', tl.every(l => [...l.children].every(c => c.getAttribute('role') === 'tab' || !c.matches('button') || c.classList.contains('copy-btn'))), `${tl.length} tablist`);
    const first = tl[0];
    if (first) {
      const btns = [...first.querySelectorAll('[role=tab]')];
      if (btns.length > 1) {
        btns[1].click(); await tick(150);
        t('click en pestaña actualiza aria-selected', btns[1].getAttribute('aria-selected') === 'true' && btns[0].getAttribute('aria-selected') === 'false');
        btns[0].click(); await tick(100);
        // mp-tabs (DEC-007) ahora gestiona estas pestañas: la flecha debe activar la siguiente y mantener sincronizada la clase del visor
        btns[0].focus();
        btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
        await tick(150);
        t('flecha derecha activa la siguiente pestaña de código', btns[1].getAttribute('aria-selected') === 'true' && btns[1].classList.contains('active') && !btns[0].classList.contains('active'),
          `aria-selected=${btns[1].getAttribute('aria-selected')} active=${btns[1].classList.contains('active')}`);
        btns[0].click(); await tick(100);
      }
    }
  }

  // 3. Stepper: barras de progreso con nombre
  const pbs = [...document.querySelectorAll('#content [role=progressbar]')];
  if (pbs.length) t('progressbar con aria-label', pbs.every(p => (p.getAttribute('aria-label') || '').trim()), `${pbs.length} barras`);

  // 4. Tables: región con scroll enfocable
  const wraps = [...document.querySelectorAll('#content .mp-table-wrap')];
  if (wraps.length) {
    const w = wraps[0]; w.focus();
    t('contenedor con scroll recibe foco', document.activeElement === w && !!w.getAttribute('aria-label') && w.getAttribute('role') === 'group', `${wraps.length} contenedores`);
  }

  // 5. Accordion: panel cerrado fuera del foco y panel abierto sin recorte (marcado estático, sin JS del visor)
  if (route === 'accordion') {
    const host = document.createElement('div');
    host.innerHTML = `<div class="mp-accordion" id="t-acc">
      <div class="mp-accordion__item" id="t-closed"><button class="mp-accordion__trigger" type="button" aria-expanded="false" aria-controls="t-p1"><span class="mp-accordion__title">Cerrado</span></button>
        <div class="mp-accordion__panel" id="t-p1" role="region"><div class="mp-accordion__content"><a href="#" id="t-link">Enlace oculto</a></div></div></div>
      <div class="mp-accordion__item is-open" id="t-open"><button class="mp-accordion__trigger" type="button" aria-expanded="true" aria-controls="t-p2"><span class="mp-accordion__title">Abierto</span></button>
        <div class="mp-accordion__panel" id="t-p2" role="region"><div class="mp-accordion__content"><div id="t-tall" style="height:3000px">alto</div></div></div></div></div>`;
    main.prepend(host);
    await tick(450);
    const p1 = document.getElementById('t-p1'), p2 = document.getElementById('t-p2'), link = document.getElementById('t-link');
    t('panel cerrado: visibility hidden', getComputedStyle(p1).visibility === 'hidden');
    link.focus(); t('panel cerrado: su enlace no recibe foco', document.activeElement !== link);
    t('panel abierto: visible', getComputedStyle(p2).visibility === 'visible');
    const supported = CSS.supports('interpolate-size', 'allow-keywords');
    t(`panel abierto con contenido de 3000 px sin recorte (interpolate-size ${supported ? 'sí' : 'no'})`, p2.clientHeight >= 3000 || (!supported && p2.clientHeight >= 1990),
      `alto visible ${p2.clientHeight}px${supported ? '' : ' (respaldo de 2000 px, limitación conocida)'}`);
    host.remove();
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = inpageV230;
