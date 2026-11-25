/* Documentación APP · Carga infinita (efecto swap). Solo documentación: no hay componente nuevo en el core. */
const appInfiniteLoadDocs = (() => {
  const TOTAL = 18;
  const DELAY = 700;
  const SWIPE_MIN = 48;
  const WHEEL_MIN = 80;
  const WHEEL_SETTLE = 700;
  const STATUS = [
    { label: 'Radicado', cls: 'mp-badge--warning' },
    { label: 'Gestionado', cls: 'mp-badge--green-1' },
    { label: 'Rechazado', cls: 'mp-badge--error' }
  ];
  const SERVICES = ['Medicina general', 'Laboratorio clínico', 'Cardiología', 'Dermatología', 'Imágenes diagnósticas', 'Pediatría'];

  function findPage(node) {
    return node?.closest?.('[data-component-doc="app-infinite-load"]') || document.querySelector('[data-component-doc="app-infinite-load"]');
  }
  function pad(n) { return String(n).padStart(4, '0'); }
  /* Datos ficticios: nada de personas reales */
  function card(i, isNew) {
    const st = STATUS[i % 3];
    const id = 'HC-2026-' + pad(1000 + i);
    const day = String(1 + (i % 27)).padStart(2, '0');
    return `<li class="app-il-req${isNew ? ' is-new' : ''}" aria-label="Solicitud ${id}, ${st.label}">
  <div class="app-il-req__head">
    <div><p class="app-il-req__label">N.º de radicado</p><p class="app-il-req__id">${id}</p></div>
    <span class="mp-badge ${st.cls}"><span class="mp-badge__label">${st.label}</span></span>
  </div>
  <div class="app-il-req__sep"></div>
  <dl class="app-il-req__rows">
    <div class="app-il-req__row"><dt>Fecha de radicación</dt><dd>${day}/03/2026</dd></div>
    <div class="app-il-req__row"><dt>Servicios</dt><dd>${SERVICES[i % SERVICES.length]}</dd></div>
  </dl>
</li>`;
  }
  function cards(from, to, isNew) {
    let html = '';
    for (let i = from; i < to; i += 1) html += card(i, isNew);
    return html;
  }
  const SPINNER = '<span class="mp-loading__spinner" aria-hidden="true">' + '<span class="mp-loading__bar"></span>'.repeat(8) + '</span>';
  const MORE_BTN = (busy) => `<button type="button" class="mp-btn mp-btn--terciario app-il-more${busy ? ' is-busy' : ''}" data-app-il-more>Cargar más solicitudes</button>`;
  /* Pie del listado: un solo estado a la vez */
  function foot(state, shown, total) {
    const count = `<p class="app-il-count">Mostrando ${shown} de ${total} solicitudes</p>`;
    if (state === 'loading') {
      return `<section class="app-il-foot" aria-label="Carga de más solicitudes">
  <div class="app-il-loading"><div class="mp-loading mp-loading--sm mp-loading--inline">${SPINNER}<span class="mp-loading__text">Cargando más solicitudes…</span></div></div>
  ${count}${MORE_BTN(true)}
</section>`;
    }
    if (state === 'error') {
      return `<section class="app-il-foot" aria-label="Carga de más solicitudes">
  <div class="app-il-error mp-alert mp-alert--error">
    <i class="icon icon-x-circle icon-32 mp-alert__icon" aria-hidden="true"></i>
    <div class="mp-alert__content">
      <p class="mp-alert__title">No pudimos cargar más solicitudes</p>
      <p class="mp-alert__body">Revisa tu conexión e inténtalo más tarde</p>
    </div>
  </div>
  ${MORE_BTN(false)}
</section>`;
    }
    if (state === 'end') {
      return `<section class="app-il-foot" aria-label="Carga de más solicitudes">
  <p class="app-il-end">No hay más solicitudes para mostrar</p>
  ${count}
</section>`;
    }
    return `<section class="app-il-foot" aria-label="Carga de más solicitudes">
  <div class="app-il-rest"><span class="app-il-rest__bar" aria-hidden="true"></span><p class="app-il-rest__hint">Desliza hacia arriba para cargar más</p></div>
  ${count}${MORE_BTN(false)}
</section>`;
  }
  function header() {
    return `<header class="app-il-bar"><span class="icon icon-arrow-left icon-24" aria-hidden="true"></span><h2 class="app-il-bar__title">Mis solicitudes</h2><span class="icon icon-bell icon-24" aria-hidden="true"></span></header>`;
  }
  function skeleton() {
    const one = '<li class="app-il-req app-il-skel" aria-hidden="true"><span class="app-il-skel__line app-il-skel__line--lg"></span><span class="app-il-skel__line"></span><span class="app-il-skel__line app-il-skel__line--sm"></span></li>';
    return `<div class="app-il-content" aria-busy="true"><ul class="app-il-list" aria-label="Cargando solicitudes">${one.repeat(3)}</ul></div>`;
  }
  function empty() {
    return `<div class="app-il-content"><div class="mp-empty-state mp-empty-state--bordered">
  <i class="icon icon-article icon-48 mp-empty-state__icon" aria-hidden="true"></i>
  <h3 class="mp-empty-state__title">Aún no tienes solicitudes</h3>
  <p class="mp-empty-state__desc">Cuando radiques una solicitud de historia clínica la verás aquí.</p>
</div></div>`;
  }
  function node2(state) { return state === 'rest' ? 2 : 1; }
  function staticDevice(state, count) {
    let body;
    if (state === 'empty') body = empty();
    else if (state === 'skeleton') body = skeleton();
    else {
      const n = Number(count) || 0;
      body = `<div class="app-il-content"><ul class="app-il-list" aria-label="Listado de solicitudes">${cards(0, Math.min(n, node2(state)), false)}</ul>${foot(state, n, TOTAL)}</div>`;
    }
    return header() + body;
  }
  function renderStatics(page) {
    page.querySelectorAll('[data-app-il-static]').forEach((node) => {
      node.innerHTML = staticDevice(node.dataset.appIlStatic, node.dataset.appIlCount);
    });
  }
  /* ── Demo interactivo ── */
  function createLive(page) {
    const host = page.querySelector('#app-il-live');
    if (!host) return null;
    const live = { shown: 0, loading: false, failed: false, failNext: false, batch: 7, timer: null, endSince: null, wheelAcc: 0, wheelTimer: null };
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    host.innerHTML = `${header()}<div class="app-il-content app-il-scroller" data-app-il-scroller tabindex="0" aria-label="Solicitudes de historia clínica (ficticias)">
  <ul class="app-il-list" data-app-il-list aria-label="Listado de solicitudes"></ul>
  <div data-app-il-foot></div>
</div><p class="app-il-sr" role="status" aria-live="polite" aria-atomic="true" data-app-il-live></p>`;
    const scroller = host.querySelector('[data-app-il-scroller]');
    const list = host.querySelector('[data-app-il-list]');
    const footHost = host.querySelector('[data-app-il-foot]');
    const announce = host.querySelector('[data-app-il-live]');
    const state = () => (live.loading ? 'loading' : live.failed ? 'error' : live.shown >= TOTAL ? 'end' : 'rest');
    const renderFoot = () => { footHost.innerHTML = foot(state(), live.shown, TOTAL); };
    function append() {
      const to = Math.min(live.shown + live.batch, TOTAL);
      const first = live.shown;
      list.insertAdjacentHTML('beforeend', cards(live.shown, to, first > 0 && !reduced));
      const added = to - live.shown;
      live.shown = to;
      return { added, firstEl: list.children[first] };
    }
    function loadMore(fromButton) {
      if (live.loading || live.shown >= TOTAL) return;
      const hadFocus = fromButton;
      live.loading = true; live.failed = false;
      renderFoot();
      announce.textContent = 'Cargando más solicitudes…';
      window.clearTimeout(live.timer);
      live.timer = window.setTimeout(() => {
        live.loading = false;
        if (live.failNext) {
          live.failNext = false;
          const sel = page.querySelector('[data-app-il-control="next"]');
          if (sel) sel.value = 'ok';
          live.failed = true;
          renderFoot();
          announce.textContent = 'No pudimos cargar más solicitudes. Revisa tu conexión e inténtalo más tarde. Puedes volver a intentarlo con el botón Cargar más solicitudes.';
          if (hadFocus) footHost.querySelector('[data-app-il-more]')?.focus();
          return;
        }
        const r = append();
        renderFoot();
        announce.textContent = `Se cargaron ${r.added} solicitudes más. Mostrando ${live.shown} de ${TOTAL} solicitudes.` + (live.shown >= TOTAL ? ' No hay más solicitudes para mostrar.' : '');
        if (fromButton && r.firstEl) { r.firstEl.tabIndex = -1; r.firstEl.focus(); }
      }, DELAY);
    }
    const atEnd = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
    const fireSwipe = () => { if (!live.loading && !live.failed && live.shown < TOTAL) loadMore(false); };
    footHost.addEventListener('click', (e) => { if (e.target.closest('[data-app-il-more]')) loadMore(true); });
    let touchY = null; let touchPull = 0;
    scroller.addEventListener('touchstart', () => { touchY = null; touchPull = 0; }, { passive: true });
    scroller.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      if (touchY === null) { if (atEnd()) touchY = y; return; }
      touchPull = touchY - y;
    }, { passive: true });
    scroller.addEventListener('touchend', () => { if (touchY !== null && touchPull >= SWIPE_MIN) fireSwipe(); touchY = null; touchPull = 0; }, { passive: true });
    let mDown = false; let mY = null; let mPull = 0;
    scroller.addEventListener('mousedown', () => { mDown = true; mY = null; mPull = 0; });
    document.addEventListener('mousemove', (e) => {
      if (!mDown) return;
      if (mY === null) { if (atEnd()) mY = e.clientY; return; }
      mPull = mY - e.clientY;
    });
    document.addEventListener('mouseup', () => { if (mDown && mY !== null && mPull >= SWIPE_MIN) fireSwipe(); mDown = false; mY = null; mPull = 0; });
    scroller.addEventListener('scroll', () => {
      if (atEnd()) { if (live.endSince === null) live.endSince = Date.now(); } else { live.endSince = null; live.wheelAcc = 0; }
    }, { passive: true });
    scroller.addEventListener('wheel', (e) => {
      if (e.deltaY <= 0 || !atEnd()) { live.wheelAcc = 0; return; }
      if (live.endSince === null) live.endSince = Date.now();
      if (Date.now() - live.endSince < WHEEL_SETTLE) { live.wheelAcc = 0; return; }
      live.wheelAcc += e.deltaY;
      window.clearTimeout(live.wheelTimer);
      live.wheelTimer = window.setTimeout(() => { live.wheelAcc = 0; }, 300);
      if (live.wheelAcc >= WHEEL_MIN) { live.wheelAcc = 0; fireSwipe(); }
    }, { passive: true });
    live.reset = () => {
      window.clearTimeout(live.timer);
      live.shown = 0; live.loading = false; live.failed = false; live.endSince = null;
      list.innerHTML = '';
      scroller.scrollTop = 0;
      announce.textContent = '';
      append();
      renderFoot();
    };
    live.reset();
    return live;
  }
  const lives = new WeakMap();
  function initControls(page) {
    const live = lives.get(page);
    if (!live) return;
    const batch = page.querySelector('[data-app-il-control="batch"]');
    const next = page.querySelector('[data-app-il-control="next"]');
    const theme = page.querySelector('[data-app-il-control="theme"]');
    live.batch = Number(batch?.value) || 7;
    live.failNext = next?.value === 'error';
    const shell = page.querySelector('#app-il-preview-shell');
    if (shell && theme) shell.dataset.theme = theme.value;
  }
  function renderCode(page) {
    const pre = page.querySelector('#app-il-code-html');
    if (pre) pre.textContent = foot('rest', 7, TOTAL).trim() + '\n\n' + foot('error', 7, TOTAL).trim();
  }
  function copyText(text, button) {
    if (!button || !text) return;
    navigator.clipboard?.writeText(text).then(() => {
      const original = button.innerHTML;
      button.innerHTML = '<i class="icon icon-check icon-16" aria-hidden="true"></i> Copiado';
      window.setTimeout(() => { button.innerHTML = original; }, 1500);
    });
  }
  function bindDelegatedEvents() {
    if (document.documentElement.dataset.appIlDocsDelegated === 'true') return;
    document.documentElement.dataset.appIlDocsDelegated = 'true';
    document.addEventListener('click', (event) => {
      const reset = event.target.closest('[data-app-il-reset]');
      if (reset) {
        const page = findPage(reset);
        lives.get(page)?.reset();
        initControls(page);
        return;
      }
      const copy = event.target.closest('[data-app-il-copy-code]');
      if (copy) copyText(findPage(copy).querySelector('#app-il-code-html')?.textContent, copy);
    });
    document.addEventListener('change', (event) => {
      if (!event.target.matches('[data-app-il-control]')) return;
      const page = findPage(event.target);
      const live = lives.get(page);
      initControls(page);
      if (live && event.target.dataset.appIlControl === 'batch') live.reset();
    });
  }
  function initAppInfiniteLoadDoc(root = document) {
    const page = root.querySelector('[data-component-doc="app-infinite-load"]');
    if (!page || page.dataset.appIlInitialized === 'true') return;
    renderStatics(page);
    const live = createLive(page);
    if (live) { lives.set(page, live); initControls(page); }
    renderCode(page);
    page.dataset.appIlInitialized = 'true';
  }
  return { initAppInfiniteLoadDoc, bindDelegatedEvents };
})();
window.appInfiniteLoadDocs = appInfiniteLoadDocs;
function bootAppInfiniteLoadDocs() {
  appInfiniteLoadDocs.bindDelegatedEvents();
  appInfiniteLoadDocs.initAppInfiniteLoadDoc(document);
}
document.addEventListener('component-docs:init', () => {
  window.requestAnimationFrame(() => appInfiniteLoadDocs.initAppInfiniteLoadDoc(document));
});
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAppInfiniteLoadDocs);
} else {
  bootAppInfiniteLoadDocs();
}
