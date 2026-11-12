/* ============================================================
 * mis-radicados.js — "Mis radicados" (ZT · Ventas y afiliación)
 * ------------------------------------------------------------
 * Figma 266:28582 (05A — Mis radicados / Listado / Desktop).
 *
 * Mejoras UX sobre el diseño:
 *   - Los indicadores (Total / En gestión / Pendientes / Finalizados) también
 *     FILTRAN el listado al hacer clic (quedan resaltados).
 *   - Búsqueda en vivo por número de radicado, documento o nombre.
 *   - Cada fila muestra la persona (nombre + documento): el buscador acepta
 *     documento, así que el listado también lo muestra.
 *   - Pendientes con la acción que falta ("Falta el certificado EPS…").
 *   - "Limpiar filtros" + estado vacío con salida clara.
 *   - Paginación de 5 con anterior/siguiente; en celular cada radicado es una tarjeta.
 *   - "Ver detalle" abre el resumen del radicado (modal) con su historial.
 *
 * Datos: ZTAfiliacion.getRadicados() (MOCK + radicados creados en este
 * navegador al finalizar el Paso 8 o registrar una novedad en el Paso 1).
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;
  var PAGE_SIZE = 5;

  var STATUS = {
    en_tramite: { label: 'En trámite',              badge: 'info',    group: 'gestion' },
    pend_doc:   { label: 'Pendiente documentación', badge: 'warning', group: 'pendientes' },
    pend_pago:  { label: 'Pendiente de pago',       badge: 'warning', group: 'pendientes' },
    aprobado:   { label: 'Aprobado',                badge: 'success', group: 'finalizados' },
    rechazado:  { label: 'Rechazado',               badge: 'error',   group: 'finalizados' },
    finalizado: { label: 'Finalizado',              badge: 'violet',  group: 'finalizados' }
  };
  var GROUPS = [
    { id: '',            label: 'Total de radicados' },
    { id: 'gestion',     label: 'En gestión' },
    { id: 'pendientes',  label: 'Pendientes' },
    { id: 'finalizados', label: 'Finalizados' }
  ];

  var all = Z.getRadicados();
  var state = { q: '', status: '', type: '', from: '', group: '', page: 1 };

  /* ─────────── DOM ─────────── */
  var kpisEl  = document.getElementById('rad-kpis');
  var qEl     = document.getElementById('rad-q');
  var estEl   = document.getElementById('rad-estado');
  var tipoEl  = document.getElementById('rad-tipo');
  var fechaEl = document.getElementById('rad-fecha');
  var countEl = document.getElementById('rad-count');
  var clearEl = document.getElementById('rad-clear');
  var listEl  = document.getElementById('rad-list');
  var pagerEl = document.getElementById('rad-pager');

  /* ─────────── Helpers ─────────── */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function fmtDate(iso) { var p = String(iso).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fmtDoc(doc) {
    var m = String(doc || '').match(/^([A-Z]+)\s*(\d+)$/);
    return m ? m[1].replace(/^CC$/, 'C.C.').replace(/^TI$/, 'T.I.').replace(/^CE$/, 'C.E.').replace(/^RC$/, 'R.C.') + ' ' + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.') : doc;
  }
  function relative(iso) {
    var d = new Date(String(iso).slice(0, 10) + 'T12:00:00'), now = new Date();
    var days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12) - d) / 86400000);
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Hace 1 día';
    if (days < 7) return 'Hace ' + days + ' días';
    if (days < 14) return 'Hace 1 semana';
    if (days < 30) return 'Hace ' + Math.floor(days / 7) + ' semanas';
    if (days < 60) return 'Hace 1 mes';
    return 'Hace ' + Math.floor(days / 30) + ' meses';
  }
  function badge(status) {
    var s = STATUS[status] || { label: status, badge: 'info' };
    return '<span class="rad-badge rad-badge--' + s.badge + '">' + esc(s.label) + '</span>';
  }

  /* ─────────── Filtro ─────────── */
  function matches(r, ignoreGroup) {
    if (state.q) {
      var q = norm(state.q), digits = state.q.replace(/\D+/g, '');
      var hay = norm(r.id + ' ' + r.name + ' ' + r.type);
      var docDigits = String(r.doc || '').replace(/\D+/g, '');
      if (hay.indexOf(q) === -1 && !(digits.length >= 3 && (docDigits.indexOf(digits) !== -1 || r.id.replace(/\D+/g, '').indexOf(digits) !== -1))) return false;
    }
    if (state.status && r.status !== state.status) return false;
    if (state.type && r.type !== state.type) return false;
    if (state.from && r.createdAt < state.from) return false;
    if (!ignoreGroup && state.group && (STATUS[r.status] || {}).group !== state.group) return false;
    return true;
  }
  function filtered() { return all.filter(function (r) { return matches(r, false); }); }
  function anyFilter() { return !!(state.q || state.status || state.type || state.from || state.group); }

  /* ─────────── Render ─────────── */
  function renderKpis() {
    // Los indicadores cuentan sobre los demás filtros (no sobre el propio grupo).
    var base = all.filter(function (r) { return matches(r, true); });
    kpisEl.innerHTML = GROUPS.map(function (g) {
      var n = g.id ? base.filter(function (r) { return (STATUS[r.status] || {}).group === g.id; }).length : base.length;
      var on = state.group === g.id;               // "Total" = sin filtro (no se resalta)
      return '<button type="button" class="rad-kpi rad-kpi--' + (g.id || 'total') + (on && g.id ? ' is-active' : '') + '" data-group="' + g.id + '" aria-pressed="' + on + '">' +
        '<span class="rad-kpi__label">' + g.label + '</span>' +
        '<span class="rad-kpi__value">' + n + '</span></button>';
    }).join('');
  }

  function rowHTML(r) {
    var s = STATUS[r.status] || {};
    var pending = s.group === 'pendientes' && r.note;
    return '<article class="rad-row" aria-labelledby="rad-' + r.id + '">' +
      '<div class="rad-row__main">' +
        '<h3 class="rad-row__id" id="rad-' + r.id + '">' + esc(r.id) + (r.source === 'flujo' ? ' <span class="rad-new-tag">Nuevo</span>' : '') + '</h3>' +
        '<p class="rad-row__type">' + esc(r.type) + '</p>' +
        '<p class="rad-row__who"><span class="icon icon-user icon-16 gs-inherit" aria-hidden="true"></span>' + esc(r.name) + ' · ' + esc(fmtDoc(r.doc)) + '</p>' +
      '</div>' +
      '<div class="rad-row__fact"><span class="rad-row__label">Fecha de radicación</span><span class="rad-row__value">' + fmtDate(r.createdAt) + '</span></div>' +
      '<div class="rad-row__fact"><span class="rad-row__label">Última actualización</span><span class="rad-row__value">' + relative(r.updatedAt) + '</span></div>' +
      '<div class="rad-row__status">' + badge(r.status) + (pending ? '<span class="rad-row__note">' + esc(r.note) + '</span>' : '') + '</div>' +
      '<button type="button" class="rad-link" data-detail="' + esc(r.id) + '" aria-label="Ver detalle del radicado ' + esc(r.id) + '">Ver detalle<span class="icon icon-caret-right icon-20 gs-inherit" aria-hidden="true"></span></button>' +
    '</article>';
  }

  function render() {
    var rows = filtered();
    var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE_SIZE, slice = rows.slice(start, start + PAGE_SIZE);

    renderKpis();
    countEl.textContent = rows.length
      ? 'Mostrando ' + (start + 1) + '–' + (start + slice.length) + ' de ' + rows.length + (rows.length === 1 ? ' radicado' : ' radicados')
      : 'Sin resultados';
    clearEl.hidden = !anyFilter();

    listEl.innerHTML = slice.length
      ? slice.map(rowHTML).join('')
      : '<div class="rad-empty"><span class="icon icon-magnifying-glass icon-40 gs-inherit" aria-hidden="true"></span>' +
          '<p class="rad-empty__title">No encontramos radicados con esos criterios</p>' +
          '<p class="rad-empty__text">Revisa el número o el documento, o quita algún filtro.</p>' +
          (anyFilter() ? '<button type="button" class="mp-btn mp-btn--secundario" data-act="clear">Limpiar filtros</button>' : '') +
        '</div>';

    // Paginación: anterior · números · siguiente (solo si hay más de una página)
    if (pages <= 1) { pagerEl.innerHTML = ''; return; }
    var html = '<button type="button" class="rad-pg rad-pg--nav" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? ' disabled' : '') + ' aria-label="Página anterior"><span class="icon icon-caret-left icon-20 gs-inherit" aria-hidden="true"></span></button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" class="rad-pg' + (i === state.page ? ' is-active' : '') + '" data-page="' + i + '"' + (i === state.page ? ' aria-current="page"' : '') + ' aria-label="Página ' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="rad-pg rad-pg--nav" data-page="' + (state.page + 1) + '"' + (state.page === pages ? ' disabled' : '') + ' aria-label="Página siguiente"><span class="icon icon-caret-right icon-20 gs-inherit" aria-hidden="true"></span></button>';
    pagerEl.innerHTML = html;
  }

  /* ─────────── Detalle (modal) ─────────── */
  function openDetail(id) {
    var r = all.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var s = STATUS[r.status] || {};
    var c = document.createElement('div');
    c.className = 'rad-detail';
    var steps = [
      { t: 'Radicado', d: r.createdAt, done: true },
      { t: 'En trámite', d: r.status === 'en_tramite' ? r.updatedAt : null, done: true },
      { t: s.label, d: r.updatedAt, done: r.status !== 'en_tramite', current: true }
    ];
    if (r.status === 'en_tramite') steps.pop();
    c.innerHTML =
      '<div class="rad-detail__head">' + badge(r.status) + '<span class="rad-detail__upd">Actualizado ' + relative(r.updatedAt).toLowerCase() + '</span></div>' +
      (r.note ? '<p class="rad-detail__note' + (s.group === 'pendientes' ? ' is-pending' : r.status === 'rechazado' ? ' is-error' : '') + '">' + esc(r.note) + '</p>' : '') +
      '<dl class="rad-detail__grid">' +
        '<div><dt>Tipo de solicitud</dt><dd>' + esc(r.type) + '</dd></div>' +
        '<div><dt>Persona</dt><dd>' + esc(r.name) + '<br><small>' + esc(fmtDoc(r.doc)) + '</small></dd></div>' +
        '<div><dt>Plan</dt><dd>' + esc(r.plan || '—') + '</dd></div>' +
        '<div><dt>Personas en la solicitud</dt><dd>' + (r.persons || 1) + '</dd></div>' +
        '<div><dt>Fecha de radicación</dt><dd>' + fmtDate(r.createdAt) + '</dd></div>' +
        (r.total ? '<div><dt>Total primera cuota</dt><dd>$' + Math.round(r.total).toLocaleString('es-CO') + '</dd></div>' : '') +
      '</dl>' +
      '<p class="rad-detail__subtitle">Historial</p>' +
      '<ol class="rad-timeline">' + steps.map(function (st) {
        return '<li class="' + (st.current ? 'is-current' : 'is-done') + '"><span class="rad-timeline__dot" aria-hidden="true"></span>' +
          '<span class="rad-timeline__t">' + esc(st.t) + '</span>' + (st.d ? '<span class="rad-timeline__d">' + fmtDate(st.d) + '</span>' : '') + '</li>';
      }).join('') + '</ol>';
    // Radicado creado en este navegador con soportes pendientes → retomar la carga.
    var canUpload = r.source === 'flujo' && r.status === 'pend_doc' && Z.getStep8 && (Z.getStep8() || {}).requestId === r.id;
    ZTModal.open({
      type: 'info', icon: 'icon-receipt', size: 'lg', align: 'left',
      title: 'Radicado ' + r.id,
      content: c,
      primaryAction: canUpload
        ? { label: 'Cargar soportes pendientes', onClick: function () { location.href = '../iniciar-afiliacion/paso-8/index.html'; } }
        : { label: 'Cerrar', onClick: function () { ZTModal.close(); } },
      secondaryAction: canUpload ? { label: 'Cerrar', onClick: function () { ZTModal.close(); } } : undefined
    });
  }

  /* ─────────── Eventos ─────────── */
  var qTimer = null;
  qEl.addEventListener('input', function () {
    window.clearTimeout(qTimer);
    qTimer = window.setTimeout(function () { state.q = qEl.value.trim(); state.page = 1; render(); }, 150);
  });
  var silent = false;   // cambios programáticos del select (no reinician el grupo)
  estEl.addEventListener('change', function () {
    if (silent) return;
    state.status = estEl.value; state.group = ''; state.page = 1; render();
  });
  tipoEl.addEventListener('change', function () { state.type = tipoEl.value; state.page = 1; render(); });
  fechaEl.addEventListener('change', function () { state.from = fechaEl.value || ''; state.page = 1; render(); });

  kpisEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-group]'); if (!b) return;
    var g = b.getAttribute('data-group');
    state.group = state.group === g ? '' : g;      // clic de nuevo = quitar filtro
    state.status = ''; setSelect(estEl, '');         // grupo y estado puntual no se combinan
    state.page = 1; render();
    var again = kpisEl.querySelector('[data-group="' + state.group + '"]') || kpisEl.querySelector('[data-group=""]');
    if (again) again.focus();
  });
  pagerEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
    state.page = +b.getAttribute('data-page'); render();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var cur = pagerEl.querySelector('[aria-current="page"]'); if (cur) cur.focus({ preventScroll: true });
  });
  listEl.addEventListener('click', function (e) {
    var d = e.target.closest('[data-detail]'); if (d) { openDetail(d.getAttribute('data-detail')); return; }
    if (e.target.closest('[data-act="clear"]')) clearAll();
  });
  clearEl.addEventListener('click', clearAll);

  function setSelect(el, v) { silent = true; el.value = v; el.dispatchEvent(new Event('change')); silent = false; }
  function clearAll() {
    state = { q: '', status: '', type: '', from: '', group: '', page: 1 };
    qEl.value = '';
    [estEl, tipoEl].forEach(function (el) { el.value = ''; el.dispatchEvent(new Event('change')); });
    fechaEl.value = ''; fechaEl.dispatchEvent(new Event('change'));
    render();
    qEl.focus();
  }

  // ?q=RAD-... (p. ej. desde la confirmación del Paso 8) → búsqueda precargada.
  var qp = new URLSearchParams(location.search).get('q');
  if (qp) { qEl.value = qp; state.q = qp; }

  render();
})();
