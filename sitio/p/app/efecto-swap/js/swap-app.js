/* ============================================================
 * swap-app.js — Flujo "Efecto Swap" (APP · Mis solicitudes)
 * ------------------------------------------------------------
 * Lista de 18 solicitudes ficticias que se muestran por tandas: 7 → 14 → 18.
 * Cada tanda se AGREGA debajo de las anteriores (scroll infinito, no reemplaza).
 * Disparadores: swipe hacia arriba estando al final (táctil, mouse, rueda) o el botón
 * "Cargar más solicitudes" (Figma; alternativa accesible al swipe y reintento tras error).
 * Estados: reposo, cargando, error (mp-alert; el reintento es el mismo botón) y fin (propuesta).
 * ============================================================ */
(function () {
  'use strict';
  var D = window.SwapData;
  var PAGE = 7;            // solicitudes por tanda (Figma: 7)
  var DELAY = 700;         // ms de espera simulada de red
  var ESTADOS = {
    radicado:   { label: 'Radicado',   cls: 'mp-badge--warning' },
    gestionado: { label: 'Gestionado', cls: 'mp-badge--green-1' },   // Figma: Mp Badges "green 1"
    rechazado:  { label: 'Rechazado',  cls: 'mp-badge--error' }
  };
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var all = D.list();
  var total = all.length;
  var shown = 0, loading = false, failed = false;
  var scroller = $('sw-scroller'), list = $('sw-list'), live = $('sw-live');
  var rest = $('sw-rest'), loader = $('sw-loading'), errBox = $('sw-error'), end = $('sw-end'), count = $('sw-count');
  var moreBtn = $('sw-more');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Simulación: la próxima carga falla una vez (panel lateral o ?error=1)
  var failNext = /[?&]error=1\b/.test(window.location.search);
  if (failNext) document.querySelector('input[name="sim-carga"][value="error"]').checked = true;
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { t.classList.remove('is-visible'); }, 2400);
  }
  function row(label, value) {
    var r = el('div', 'sw-req__row');
    r.appendChild(el('dt', null, label));
    r.appendChild(el('dd', null, value));
    return r;
  }
  function buildCard(s, isNew) {
    var st = ESTADOS[s.estado];
    var li = el('li', 'sw-req' + (isNew ? ' is-new' : ''));
    li.setAttribute('aria-label', 'Solicitud ' + s.id + ', ' + st.label);
    var head = el('div', 'sw-req__head');
    var box = el('div');
    box.appendChild(el('p', 'sw-req__label', 'N.º de radicado'));
    box.appendChild(el('p', 'sw-req__id', s.id));
    var badge = el('span', 'mp-badge ' + st.cls);
    badge.appendChild(el('span', 'mp-badge__label', st.label));
    head.appendChild(box);
    head.appendChild(badge);
    li.appendChild(head);
    li.appendChild(el('div', 'sw-req__sep'));
    var dl = el('dl', 'sw-req__rows');
    dl.appendChild(row('Fecha de radicación', D.fmtDate(s.fecha)));
    dl.appendChild(row('Servicios', s.servicios));
    dl.appendChild(row('Periodo solicitado', D.fmtRange(s.desde, s.hasta)));
    li.appendChild(dl);
    if (s.estado === 'gestionado') {
      var b = el('button', 'mp-btn mp-btn--secundario', 'Descargar historia clínica');
      b.type = 'button';
      b.addEventListener('click', function () { toast('Descarga simulada: este prototipo no genera archivos.'); });
      li.appendChild(b);
    }
    if (s.estado === 'rechazado') li.appendChild(el('p', 'sw-req__reason', s.motivo));
    return li;
  }
  /* Un solo estado visible a la vez en el pie: reposo | cargando | error | fin */
  function renderFoot() {
    var done = shown >= total;
    rest.hidden = loading || failed || done;
    loader.hidden = !loading;
    errBox.hidden = !failed;
    end.hidden = !done;
    count.hidden = failed;                    // Figma (error): solo alerta + botón
    moreBtn.hidden = done;                    // sin nada más que cargar el botón se oculta
    moreBtn.classList.toggle('is-busy', loading);   // visible e inactivo mientras carga (Figma 8657:139); loadMore ignora el clic. No se usa aria-disabled: el DS lo pinta gris
    count.textContent = 'Mostrando ' + shown + ' de ' + total + ' solicitudes';
  }
  function appendNext() {
    var next = all.slice(shown, shown + PAGE), first = null;
    next.forEach(function (s) {
      var c = buildCard(s, shown > 0 && !reduced);
      if (!first) first = c;
      list.appendChild(c);
    });
    shown += next.length;
    return { first: first, added: next.length };
  }
  // fromButton: el foco pasa a la primera tarjeta nueva tras cargar con éxito; si falla, el foco vuelve al botón (reintento)
  function loadMore(fromButton) {
    if (loading || shown >= total) return;
    var hadFocus = document.activeElement === moreBtn;
    loading = true; failed = false;
    renderFoot();
    live.textContent = 'Cargando más solicitudes…';
    window.setTimeout(function () {
      loading = false;
      if (failNext) {
        failNext = false;
        document.querySelector('input[name="sim-carga"][value="ok"]').checked = true;
        failed = true;
        renderFoot();
        live.textContent = 'No pudimos cargar más solicitudes. Revisa tu conexión e inténtalo más tarde. Puedes volver a intentarlo con el botón Cargar más solicitudes.';
        if (hadFocus) moreBtn.focus();
        return;
      }
      var r = appendNext();
      renderFoot();
      live.textContent = (shown >= total
        ? 'Se cargaron ' + r.added + ' solicitudes más. Mostrando ' + shown + ' de ' + total + ' solicitudes. No hay más solicitudes para mostrar.'
        : 'Se cargaron ' + r.added + ' solicitudes más. Mostrando ' + shown + ' de ' + total + ' solicitudes.');
      if (fromButton && r.first) { r.first.tabIndex = -1; r.first.focus(); }
    }, DELAY);
  }
  moreBtn.addEventListener('click', function () { loadMore(true); });   // durante la carga, loadMore ignora el clic

  /* ── Swipe hacia arriba al final del listado ──
     Solo cuenta si el contenido ya está en su final y el arrastre supera SWIPE_MIN px. */
  var SWIPE_MIN = 48, WHEEL_MIN = 80, WHEEL_SETTLE = 700;
  function atEnd() { return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4; }
  function canSwipe() { return !loading && !failed && shown < total; }   // con error, el usuario decide con «Cargar más solicitudes»
  function fireSwipe() { if (canSwipe()) loadMore(false); }
  var touchY = null, touchPull = 0;
  scroller.addEventListener('touchstart', function () { touchY = null; touchPull = 0; }, { passive: true });
  scroller.addEventListener('touchmove', function (e) {
    var y = e.touches[0].clientY;
    if (touchY === null) { if (atEnd()) touchY = y; return; }
    touchPull = touchY - y;
  }, { passive: true });
  scroller.addEventListener('touchend', function () {
    if (touchY !== null && touchPull >= SWIPE_MIN) fireSwipe();
    touchY = null; touchPull = 0;
  }, { passive: true });
  var mDown = false, mY = null, mPull = 0;
  scroller.addEventListener('mousedown', function () { mDown = true; mY = null; mPull = 0; });
  document.addEventListener('mousemove', function (e) {
    if (!mDown) return;
    if (mY === null) { if (atEnd()) mY = e.clientY; return; }
    mPull = mY - e.clientY;
  });
  document.addEventListener('mouseup', function () {
    if (mDown && mY !== null && mPull >= SWIPE_MIN) fireSwipe();
    mDown = false; mY = null; mPull = 0;
  });
  var endSince = null, wheelAcc = 0, wheelTimer = null;
  scroller.addEventListener('scroll', function () {
    if (atEnd()) { if (endSince === null) endSince = Date.now(); } else { endSince = null; wheelAcc = 0; }
  }, { passive: true });
  scroller.addEventListener('wheel', function (e) {
    if (e.deltaY <= 0 || !atEnd()) { wheelAcc = 0; return; }
    if (endSince === null) endSince = Date.now();
    if (Date.now() - endSince < WHEEL_SETTLE) { wheelAcc = 0; return; }   // evita la inercia al llegar
    wheelAcc += e.deltaY;
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(function () { wheelAcc = 0; }, 300);
    if (wheelAcc >= WHEEL_MIN) { wheelAcc = 0; fireSwipe(); }
  }, { passive: true });

  /* ── Panel de simulación ── */
  Array.prototype.forEach.call(document.querySelectorAll('input[name="sim-carga"]'), function (r) {
    r.addEventListener('change', function () { failNext = r.value === 'error'; });
  });
  $('sim-reset').addEventListener('click', function () { window.location.href = window.location.pathname; });

  /* ── Init: primera carga ──
     Skeleton unos instantes (Figma 8954:26839) y luego la primera tanda (7) o el vacío (Figma 8954:26680, ?vacio=1). */
  var SKEL_DELAY = 900;
  var skel = $('sw-skel'), emptyBox = $('sw-empty'), foot = $('sw-foot');
  var wantEmpty = /[?&]vacio=1\b/.test(window.location.search);
  if (wantEmpty) document.querySelector('input[name="sim-inicio"][value="vacio"]').checked = true;
  Array.prototype.forEach.call(document.querySelectorAll('input[name="sim-inicio"]'), function (r) {
    r.addEventListener('change', function () { window.location.href = window.location.pathname + (r.value === 'vacio' ? '?vacio=1' : ''); });
  });
  var content = $('sw-content');
  list.hidden = true; foot.hidden = true; skel.hidden = false;
  content.setAttribute('aria-busy', 'true');
  live.textContent = 'Cargando solicitudes…';
  window.setTimeout(function () {
    skel.hidden = true;
    content.removeAttribute('aria-busy');
    if (wantEmpty) {
      emptyBox.hidden = false;
      live.textContent = 'Aún no tienes solicitudes.';
      return;
    }
    list.hidden = false; foot.hidden = false;
    appendNext();
    renderFoot();
    live.textContent = 'Se cargaron ' + Math.min(PAGE, total) + ' solicitudes. Mostrando ' + shown + ' de ' + total + ' solicitudes.';
  }, SKEL_DELAY);
})();
