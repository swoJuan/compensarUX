/* ============================================================
 * hc-app.js — Flujo "Historia clínica" (APP · prototipo móvil)
 * ------------------------------------------------------------
 * Pantallas (Figma App 02…09): Nueva solicitud (por mes / rango / último año),
 * hojas inferiores (servicios, mes, calendario, confirmar), solicitud radicada,
 * Mis solicitudes (con datos y vacía) y diálogos de error/aviso.
 *
 * Todo el texto dinámico se inserta con textContent (sin innerHTML con datos).
 * Requiere: hc-data.js (HCData).
 * ============================================================ */
(function () {
  'use strict';

  var D = HCData;
  var $ = function (id) { return document.getElementById(id); };
  var now = new Date();
  var today = D.todayIso();
  var prevYear = now.getFullYear() - 1;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(name, size, color) {
    var i = el('span', 'icon ' + name + ' icon-' + (size || 20) + ' ' + (color || 'gs-inherit'));
    i.setAttribute('aria-hidden', 'true');
    return i;
  }
  function iso(y, m, d) { return y + '-' + D.pad(m + 1) + '-' + D.pad(d); }
  function monthLabel(value) {   // "2026-09" → "Septiembre 2026"
    var p = value.split('-');
    return D.MESES[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  /* ───────────────────────── Estado del formulario ───────────────────────── */
  var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var state = {
    servicios: [],
    tipo: 'mes',
    mes: prev.getFullYear() + '-' + D.pad(prev.getMonth() + 1),   // por defecto: mes anterior (Figma: "Septiembre 2026")
    desde: '',
    hasta: ''
  };

  var views = $('app-views');
  var btnContinuar = $('btn-continuar');

  /* ───────────────────────── Vistas y pestañas ───────────────────────── */
  function showView(name) {
    $('view-solicitud').hidden = name !== 'solicitud';
    $('view-radicada').hidden = name !== 'radicada';
    var v = $(name === 'solicitud' ? 'view-solicitud' : 'view-radicada');
    v.scrollTop = 0;
  }

  function selectTab(name, focusTab) {
    var isMis = name === 'mis';
    [['nueva', 'tab-nueva', 'panel-nueva'], ['mis', 'tab-mis', 'panel-mis']].forEach(function (t) {
      var on = t[0] === name;
      var tab = $(t[1]);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      $(t[2]).hidden = !on;
    });
    if (isMis) renderMis(); else moreCtx = null;
    $('view-solicitud').scrollTop = 0;
    if (focusTab) $(isMis ? 'tab-mis' : 'tab-nueva').focus();
  }

  $('tab-nueva').addEventListener('click', function () { selectTab('nueva'); });
  $('tab-mis').addEventListener('click', function () { selectTab('mis'); });
  document.querySelector('.app-tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    selectTab(e.key === 'ArrowRight' ? 'mis' : 'nueva', true);
  });

  /* ───────────────────────── Overlays (hojas y diálogos) ───────────────────────── */
  var active = null;   // { el, prevFocus, onKey }

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (n) { return n.offsetParent !== null; });
  }

  function openOverlay(node, focusEl) {
    if (active) closeOverlay(true, false);
    node.hidden = false;
    node.classList.remove('is-dragging');
    void node.offsetWidth;                       // fija el estado inicial (panel abajo) antes de animar
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { node.classList.add('is-open'); });   // el panel sube
    });
    views.inert = true;                          // el fondo no recibe foco ni toques
    var onKey = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(node);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    active = { el: node, prevFocus: document.activeElement, onKey: onKey };
    window.setTimeout(function () {
      var target = focusEl || focusables(node)[0];
      if (target) target.focus({ preventScroll: true });   // sin scroll: el panel aún está entrando y haría saltar la pantalla
    }, reduced ? 0 : 60);
  }

  function closeOverlay(immediate, restoreFocus) {
    if (!active) return;
    var a = active;
    active = null;
    document.removeEventListener('keydown', a.onKey);
    a.el.classList.remove('is-open');
    views.inert = false;
    var done = function () {
      a.el.hidden = true;
      if (restoreFocus !== false && a.prevFocus && a.prevFocus.focus) a.prevFocus.focus();
    };
    if (immediate || reduced) done(); else window.setTimeout(done, a.el.classList.contains('app-sheet') ? 380 : 240);
  }

  /* ── Arrastrar hacia abajo para cerrar (asa + encabezado de cada hoja) ── */
  function enableSwipeToClose(sheet) {
    var panel = sheet.querySelector('.app-sheet__panel');
    var backdrop = sheet.querySelector('.app-sheet__backdrop');
    var zones = sheet.querySelectorAll('.app-sheet__handle, .app-sheet__header, .app-sheet__drag');
    var drag = null;   // { startY, lastY, lastT, v, h }

    function onDown(e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest('button')) return;          // la X sigue siendo un botón normal
      drag = { startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, v: 0, h: panel.offsetHeight, id: e.pointerId, el: e.currentTarget };
      drag.el.setPointerCapture(e.pointerId);
      sheet.classList.add('is-dragging');
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = Math.max(0, e.clientY - drag.startY);
      var dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.v = (e.clientY - drag.lastY) / dt;     // px/ms, positivo = hacia abajo
      drag.lastY = e.clientY; drag.lastT = e.timeStamp;
      panel.style.transform = 'translateY(' + dy + 'px)';
      backdrop.style.opacity = String(Math.max(0, 1 - dy / drag.h));
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = Math.max(0, e.clientY - drag.startY);
      var dismiss = dy > drag.h * 0.3 || drag.v > 0.6;
      try { drag.el.releasePointerCapture(drag.id); } catch (err) {}
      drag = null;
      // Se devuelve el control al CSS: la transición continúa desde la posición actual
      sheet.classList.remove('is-dragging');
      panel.style.transform = '';
      backdrop.style.opacity = '';
      if (dismiss) closeOverlay();
    }
    Array.prototype.forEach.call(zones, function (z) {
      z.addEventListener('pointerdown', onDown);
      z.addEventListener('pointermove', onMove);
      z.addEventListener('pointerup', onUp);
      z.addEventListener('pointercancel', onUp);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.app-sheet'), enableSwipeToClose);

  // Cualquier [data-close] dentro del overlay activo lo cierra (X, fondo, "Regresar", "Cerrar")
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]');
    if (!c || !active || !active.el.contains(c)) return;
    closeOverlay();
  });

  /* ───────────────────────── Toast ───────────────────────── */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { t.classList.remove('is-visible'); }, 2400);
  }

  /* ───────────────────────── Diálogos ───────────────────────── */
  var dlgPrimaryHandler = null;
  function showDialog(cfg) {
    var ic = $('dlg-icon');
    ic.className = 'app-dialog__icon app-dialog__icon--' + cfg.type;
    ic.textContent = '';
    ic.appendChild(icon(cfg.type === 'error' ? 'icon-x' : 'icon-warning', 32));
    $('dlg-title').textContent = cfg.title;
    $('dlg-text').textContent = cfg.text;
    var p = $('dlg-primary');
    p.textContent = cfg.primary.label;
    if (dlgPrimaryHandler) p.removeEventListener('click', dlgPrimaryHandler);
    dlgPrimaryHandler = function () { closeOverlay(true, false); cfg.primary.action(); };
    p.addEventListener('click', dlgPrimaryHandler);
    openOverlay($('dialog'), p);
  }

  /* ───────────────────────── Servicios (hoja) ───────────────────────── */
  var servList = $('serv-list');
  var servAll = $('serv-all');
  var servSearch = $('serv-search');
  var servApply = $('serv-apply');

  D.SERVICIOS.forEach(function (name, i) {
    var label = el('label', 'mp-choice mp-checkbox');
    label.setAttribute('data-name', name.toLowerCase());
    var field = el('span', 'mp-choice__field');
    var input = el('input', 'mp-choice__input');
    input.type = 'checkbox';
    input.id = 'serv-' + i;
    input.value = name;
    field.appendChild(input);
    field.appendChild(el('span', 'mp-choice__control'));
    var text = el('span', 'mp-choice__text');
    text.appendChild(el('span', 'mp-choice__label', name));
    label.appendChild(field);
    label.appendChild(text);
    servList.appendChild(label);
  });

  function servBoxes() { return Array.prototype.slice.call(servList.querySelectorAll('input')); }
  function visibleBoxes() { return servBoxes().filter(function (i) { return !i.closest('label').hidden; }); }

  function syncDraft() {
    var checked = servBoxes().filter(function (i) { return i.checked; }).length;
    servApply.textContent = checked
      ? 'Aplicar (' + checked + (checked === 1 ? ' servicio)' : ' servicios)')
      : 'Aplicar';
    var vis = visibleBoxes();
    var vc = vis.filter(function (i) { return i.checked; }).length;
    servAll.checked = vis.length > 0 && vc === vis.length;
    servAll.indeterminate = vc > 0 && vc < vis.length;
    servAll.disabled = vis.length === 0;
  }

  function filterServices() {
    var q = servSearch.value.toLowerCase().trim();
    var shown = 0;
    servBoxes().forEach(function (i) {
      var lab = i.closest('label');
      var match = q === '' || lab.getAttribute('data-name').indexOf(q) !== -1;
      lab.hidden = !match;
      if (match) shown++;
    });
    $('serv-empty').hidden = shown !== 0;
    syncDraft();
  }

  $('fld-serv').addEventListener('click', function () {
    servBoxes().forEach(function (i) { i.checked = state.servicios.indexOf(i.value) !== -1; });
    servSearch.value = '';
    filterServices();
    openOverlay($('sheet-serv'), servSearch);
  });
  servAll.addEventListener('change', function () {
    var on = servAll.checked;
    visibleBoxes().forEach(function (i) { i.checked = on; });
    syncDraft();
  });
  servList.addEventListener('change', syncDraft);
  servSearch.addEventListener('input', filterServices);
  servSearch.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
  servApply.addEventListener('click', function () {
    state.servicios = servBoxes().filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
    renderServField();
    closeOverlay();
    validate();
  });

  function renderServField() {
    var v = $('fld-serv-val');
    var n = state.servicios.length;
    if (!n) { v.textContent = 'Selecciona uno o varios'; v.classList.add('is-placeholder'); return; }
    v.textContent = state.servicios.slice(0, 2).join(', ') + (n > 2 ? ' +' + (n - 2) : '');
    v.classList.remove('is-placeholder');
  }

  /* ───────────────────────── Periodo ───────────────────────── */
  var tipoRadios = document.querySelectorAll('input[name="periodo"]');
  Array.prototype.forEach.call(tipoRadios, function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      state.tipo = r.value;
      $('grp-mes').hidden = r.value !== 'mes';
      $('grp-rango').hidden = r.value !== 'rango';
      $('grp-anio').hidden = r.value !== 'anio';
      validate();
    });
  });

  $('anio-note').textContent = 'Incluye la información del 1 de enero al 31 de diciembre de ' + prevYear + '.';

  // ── Mes
  function renderMesField() { $('fld-mes-val').textContent = monthLabel(state.mes); }

  function buildMonthList() {
    var host = $('mes-list');
    host.textContent = '';
    for (var k = 0; k < 12; k++) {
      var d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      var value = d.getFullYear() + '-' + D.pad(d.getMonth() + 1);
      var label = el('label', 'mp-choice mp-radio');
      var field = el('span', 'mp-choice__field');
      var input = el('input', 'mp-choice__input');
      input.type = 'radio'; input.name = 'mes-opt'; input.value = value;
      input.checked = value === state.mes;
      field.appendChild(input);
      field.appendChild(el('span', 'mp-choice__control'));
      var text = el('span', 'mp-choice__text');
      text.appendChild(el('span', 'mp-choice__label', monthLabel(value)));
      label.appendChild(field);
      label.appendChild(text);
      host.appendChild(label);
    }
  }
  $('fld-mes').addEventListener('click', function () {
    buildMonthList();
    openOverlay($('sheet-mes'), $('mes-list').querySelector('input:checked'));
  });
  $('mes-list').addEventListener('change', function (e) {
    state.mes = e.target.value;
    renderMesField();
    validate();
    window.setTimeout(function () { closeOverlay(); }, reduced ? 0 : 160);
  });

  // ── Calendario (Desde / Hasta)
  var cal = { target: 'desde', y: now.getFullYear(), m: 0, sel: '' };
  // Reglas = las del calendario de ZT: sin otros bloqueos, solo
  //   · no se puede elegir una fecha futura (máx. = hoy)
  //   · "Hasta" no puede ser anterior a "Desde" (mín. = Desde)
  // "Desde" no se limita por "Hasta": si queda posterior se muestra el error del rango (como en ZT).
  function minIso() { return cal.target === 'hasta' && state.desde ? state.desde : null; }
  function dayEnabled(isoDate) {
    if (isoDate > today) return false;
    var mn = minIso();
    return !(mn && isoDate < mn);
  }
  function renderCal(focusIso) {
    $('cal-month').textContent = D.MESES[cal.m] + ' ' + cal.y;
    // Se deshabilita la flecha solo si el mes destino queda completamente fuera de rango (igual que ZT)
    var prevLast = iso(cal.m === 0 ? cal.y - 1 : cal.y, cal.m === 0 ? 11 : cal.m - 1, new Date(cal.y, cal.m, 0).getDate());
    var nextFirst = iso(cal.m === 11 ? cal.y + 1 : cal.y, cal.m === 11 ? 0 : cal.m + 1, 1);
    var mn = minIso();
    $('cal-prev').disabled = !!(mn && prevLast < mn);
    $('cal-next').disabled = nextFirst > today;
    var grid = $('cal-grid');
    grid.textContent = '';
    var blanks = new Date(cal.y, cal.m, 1).getDay();
    var days = new Date(cal.y, cal.m + 1, 0).getDate();
    for (var b = 0; b < blanks; b++) grid.appendChild(el('span'));
    for (var d = 1; d <= days; d++) {
      var value = iso(cal.y, cal.m, d);
      var btn = el('button', 'hc-cal__day', String(d));
      btn.type = 'button';
      btn.setAttribute('data-iso', value);
      btn.setAttribute('aria-label', d + ' de ' + D.MESES[cal.m].toLowerCase() + ' de ' + cal.y);
      if (value === today) btn.setAttribute('aria-current', 'date');
      if (dayEnabled(value)) {
        btn.classList.add('is-available');
        btn.setAttribute('aria-pressed', value === cal.sel ? 'true' : 'false');
      } else {
        btn.disabled = true;
      }
      grid.appendChild(btn);
    }
    $('cal-apply').disabled = !cal.sel;
    if (focusIso) {
      var f = grid.querySelector('[data-iso="' + focusIso + '"]');
      if (f) f.focus();
    }
  }

  function openCal(target) {
    cal.target = target;
    cal.sel = state[target] || '';
    if (cal.sel) { cal.y = parseInt(cal.sel.slice(0, 4), 10); cal.m = parseInt(cal.sel.slice(5, 7), 10) - 1; }
    else { cal.y = now.getFullYear(); cal.m = now.getMonth(); }
    $('cal-title').textContent = target === 'desde' ? 'Fecha desde' : 'Fecha hasta';
    renderCal();
    var grid = $('cal-grid');
    openOverlay($('sheet-cal'), grid.querySelector('[aria-pressed="true"]') || grid.querySelector('[aria-current="date"].is-available') ||
      grid.querySelector('.is-available') || $('cal-prev'));
  }

  $('fld-desde').addEventListener('click', function () { openCal('desde'); });
  $('fld-hasta').addEventListener('click', function () { openCal('hasta'); });
  $('cal-prev').addEventListener('click', function () {
    cal.m -= 1; if (cal.m < 0) { cal.m = 11; cal.y -= 1; }
    renderCal();
  });
  $('cal-next').addEventListener('click', function () {
    cal.m += 1; if (cal.m > 11) { cal.m = 0; cal.y += 1; }
    renderCal();
  });
  $('cal-grid').addEventListener('click', function (e) {
    var b = e.target.closest('.is-available');
    if (!b) return;
    cal.sel = b.getAttribute('data-iso');
    renderCal(cal.sel);
  });
  $('cal-apply').addEventListener('click', function () {
    if (!cal.sel) return;
    state[cal.target] = cal.sel;
    renderRangeFields();
    closeOverlay();
    validate();
  });

  function renderRangeFields() {
    [['desde', 'fld-desde-val'], ['hasta', 'fld-hasta-val']].forEach(function (p) {
      var v = $(p[1]);
      if (state[p[0]]) { v.textContent = D.fmtNum(state[p[0]]); v.classList.remove('is-placeholder'); }
      else { v.textContent = 'dd/mm/aaaa'; v.classList.add('is-placeholder'); }
    });
  }

  /* ───────────────────────── Validación y periodo ───────────────────────── */
  function period() {
    if (state.tipo === 'mes') {
      var p = state.mes.split('-');
      var y = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1;
      var isCurrent = y === now.getFullYear() && m === now.getMonth();
      var last = new Date(y, m + 1, 0).getDate();
      return { desde: iso(y, m, 1), hasta: isCurrent ? today : iso(y, m, last) };
    }
    if (state.tipo === 'rango') {
      if (!state.desde || !state.hasta || state.desde > state.hasta) return null;
      return { desde: state.desde, hasta: state.hasta };
    }
    return { desde: prevYear + '-01-01', hasta: prevYear + '-12-31' };
  }

  // Error de rango (mismo texto y criterio que ZT): "Hasta" anterior a "Desde"
  function renderRangeError() {
    var invalid = state.tipo === 'rango' && !!state.desde && !!state.hasta && state.desde > state.hasta;
    $('rango-error').hidden = !invalid;
    ['fld-desde', 'fld-hasta'].forEach(function (id) {
      $(id).classList.toggle('is-invalid', invalid);
      $(id).setAttribute('aria-invalid', invalid ? 'true' : 'false');
    });
  }

  function validate() {
    renderRangeError();
    btnContinuar.disabled = !(state.servicios.length > 0 && period());
  }

  /* ───────────────────────── Confirmación y envío ───────────────────────── */
  // Filas del resumen (Figma App 02 · Modal): íconos violeta en círculo; la primera (usuario)
  // lleva separador sólido y el valor en negrita; las demás, separador punteado.
  function summaryRow(iconName, label, value, isPatient) {
    var r = el('div', 'hc-confirm__row' + (isPatient ? ' hc-confirm__row--patient' : ''));
    var ic = el('span', 'hc-confirm__row-icon');
    ic.setAttribute('aria-hidden', 'true');
    ic.appendChild(icon(iconName, 20, 'gs-violet'));
    var b = el('div', 'hc-confirm__row-text');
    b.appendChild(el('p', 'hc-confirm__label', label));
    b.appendChild(el('p', 'hc-confirm__value', value));
    r.appendChild(ic);
    r.appendChild(b);
    return r;
  }

  function rangeText(desde, hasta) {
    return desde.slice(0, 4) === hasta.slice(0, 4)
      ? D.fmtShort(desde) + ' – ' + D.fmt(hasta)
      : D.fmt(desde) + ' – ' + D.fmt(hasta);
  }

  $('hc-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = period();
    if (btnContinuar.disabled || !p) return;
    var host = $('confirm-summary');
    host.textContent = '';
    host.appendChild(summaryRow('icon-user', 'Usuario', D.PACIENTE, true));
    host.appendChild(summaryRow('icon-heartbeat', 'Servicios', state.servicios.join(', ')));
    host.appendChild(summaryRow('icon-calendar-blank', 'Periodo', D.fmt(p.desde) + ' – ' + D.fmt(p.hasta)));
    setSending(false);
    openOverlay($('sheet-confirm'), $('btn-enviar'));
  });

  // Mensajes modales del Figma (App 09, 09B, 09C). Los usa el envío y el panel de simulación.
  function showMessage(kind) {
    if (kind === 'dup') {
      showDialog({ type: 'error', title: 'Lo sentimos',
        text: 'No puedes hacer esta solicitud porque ya tienes otra registrada con la misma información.',
        primary: { label: 'Ir a Mis solicitudes', action: function () { showView('solicitud'); selectTab('mis', true); } } });
    } else if (kind === 'error') {
      showDialog({ type: 'error', title: 'Lo sentimos',
        text: 'No fue posible realizar la solicitud. Intenta de nuevo en unos minutos.',
        primary: { label: 'Intentar de nuevo', action: function () {
          // Con una solicitud lista se reintenta el envío; si se abrió desde el simulador, solo se cierra.
          if (btnContinuar.disabled || $('view-solicitud').hidden) return;
          openOverlay($('sheet-confirm'), btnEnviar);
          send();
        } } });
    } else if (kind === 'gestionada') {
      showDialog({ type: 'warning', title: 'Esta solicitud ya fue gestionada',
        text: 'Puedes consultar el resultado en Mis solicitudes.',
        primary: { label: 'Ver resultado', action: function () { showView('solicitud'); selectTab('mis', true); } } });
    }
  }

  var btnEnviar = $('btn-enviar');
  function setSending(on) {
    btnEnviar.disabled = on;
    btnEnviar.textContent = on ? 'Enviando…' : 'Confirmar y enviar';
  }

  function send() {
    var p = period();
    if (!p) return;
    setSending(true);
    window.setTimeout(function () {
      var result = D.sim().result;
      if (result === 'ok') {
        var rec = D.add({ servicios: state.servicios.slice(), desde: p.desde, hasta: p.hasta });
        $('rad-num').textContent = rec.id;
        closeOverlay(true, false);
        showView('radicada');
        $('rad-title').tabIndex = -1;
        $('rad-title').focus();
        return;
      }
      closeOverlay(true, false);
      showMessage(result);
    }, reduced ? 0 : 700);
  }
  btnEnviar.addEventListener('click', send);

  /* ───────────────────────── Solicitud radicada ───────────────────────── */
  function resetForm() {
    state.servicios = []; state.desde = ''; state.hasta = ''; state.tipo = 'mes';
    state.mes = prev.getFullYear() + '-' + D.pad(prev.getMonth() + 1);
    document.querySelector('input[name="periodo"][value="mes"]').checked = true;
    $('grp-mes').hidden = false; $('grp-rango').hidden = true; $('grp-anio').hidden = true;
    renderServField(); renderMesField(); renderRangeFields(); validate();
  }
  $('btn-ir-mis').addEventListener('click', function () { showView('solicitud'); selectTab('mis', true); });
  $('btn-otra').addEventListener('click', function () { resetForm(); showView('solicitud'); selectTab('nueva', true); });

  /* ───────────────────────── Mis solicitudes ───────────────────────── */
  var ESTADOS = {
    radicado:   { label: 'Radicado',   cls: 'mp-badge--warning' },
    gestionado: { label: 'Gestionado', cls: 'mp-badge--success' },
    rechazado:  { label: 'Rechazado',  cls: 'mp-badge--error' }
  };

  function reqRow(label, value) {
    var r = el('div', 'hc-req__row');
    r.appendChild(el('dt', null, label));
    r.appendChild(el('dd', null, value));
    return r;
  }

  function buildCard(s) {
    var st = ESTADOS[s.estado] || ESTADOS.radicado;
    var art = el('article', 'hc-req');
    art.setAttribute('aria-label', 'Solicitud ' + s.id + ', ' + st.label);

    var head = el('div', 'hc-req__head');
    var idBox = el('div');
    idBox.appendChild(el('p', 'hc-req__label', 'N.º de radicado'));
    idBox.appendChild(el('p', 'hc-req__id', s.id));
    var badge = el('span', 'mp-badge ' + st.cls);
    badge.appendChild(el('span', 'mp-badge__label', st.label));
    head.appendChild(idBox);
    head.appendChild(badge);
    art.appendChild(head);

    var dl = el('dl', 'hc-req__rows');
    dl.appendChild(reqRow('Fecha de radicación', D.fmt(s.fecha)));
    dl.appendChild(reqRow('Servicios', s.servicios.join(', ')));
    dl.appendChild(reqRow('Periodo solicitado', rangeText(s.desde, s.hasta)));
    art.appendChild(dl);

    if (s.estado === 'gestionado') {
      var act = el('div', 'hc-req__actions');
      var btn = el('button', 'mp-btn mp-btn--secundario', 'Descargar historia clínica');
      btn.type = 'button';
      // Prototipo: no se genera un archivo real
      btn.addEventListener('click', function () { toast('Descargando tu historia clínica…'); });
      act.appendChild(btn);
      art.appendChild(act);
    }
    if (s.estado === 'rechazado') {
      var reason = el('div', 'hc-req__reason');
      reason.appendChild(el('strong', null, 'Motivo: '));
      reason.appendChild(document.createTextNode(s.motivo || 'No disponible.'));
      art.appendChild(reason);
    }
    return art;
  }

  function buildHelp() {
    var h = el('div', 'app-help');
    h.appendChild(icon('icon-question', 20, 'gs-violet'));
    h.appendChild(el('span', null, '¿Necesitas ayuda?'));
    var b = el('button', 'app-help__link', 'Más información');   // [PENDIENTE] destino no definido en Figma
    b.type = 'button';
    b.setAttribute('aria-disabled', 'true');
    h.appendChild(b);
    return h;
  }

  var MIS_PAGE = 7;                 // solicitudes por tanda
  var MIS_DELAY = 700;              // ms de "carga" simulada
  var moreCtx = null;               // { canLoad(), load() } de la lista activa; null si no hay lista paginada

  function renderMis() {
    var host = $('mis-content');
    moreCtx = null;
    host.textContent = '';
    if (D.sim().lista === 'vacio') {
      var empty = el('section', 'hc-empty');
      empty.setAttribute('aria-labelledby', 'empty-title');
      var ic = el('span', 'hc-empty__icon');
      ic.setAttribute('aria-hidden', 'true');
      ic.appendChild(icon('icon-medical-file', 32, 'gs-violet'));
      empty.appendChild(ic);
      var t = el('h2', 'hc-empty__title', 'Aún no tienes solicitudes');
      t.id = 'empty-title';
      empty.appendChild(t);
      empty.appendChild(el('p', 'hc-empty__text', 'Cuando realices una solicitud, podrás consultar aquí su estado y descargarla cuando esté disponible.'));
      var b = el('button', 'mp-btn mp-btn--primario', 'Nueva solicitud');
      b.type = 'button';
      b.addEventListener('click', function () { selectTab('nueva', true); });
      empty.appendChild(b);
      host.appendChild(empty);
      host.appendChild(buildHelp());
      return;
    }
    var notice = el('div', 'app-alert');
    notice.setAttribute('role', 'note');
    notice.appendChild(icon('icon-info', 20));
    var p = el('p');
    p.appendChild(document.createTextNode('Las historias clínicas estarán visibles durante '));
    p.appendChild(el('strong', null, '30 días'));
    p.appendChild(document.createTextNode(' desde tu solicitud.'));
    notice.appendChild(p);
    host.appendChild(notice);

    // Listado paginado: se muestran 7 y las siguientes 7 se cargan con un gesto de deslizar
    // hacia arriba al llegar al final (no se cargan solas).
    var all = D.list();
    var list = el('div', 'hc-list');

    // Pista de "deslizar para ver más" (también es un botón: toque / Enter como alternativa al gesto)
    var more = el('button', 'hc-more');
    more.type = 'button';
    more.appendChild(icon('icon-arrow-up', 20));
    more.appendChild(el('span', 'hc-more__text', 'Desliza hacia arriba para ver más'));
    var moreCount = el('span', 'hc-more__count');
    more.appendChild(moreCount);
    more.hidden = true;

    // Spinner del Design System (mp-loading): small + inline, con texto visible
    var loader = el('div', 'hc-loading');
    loader.hidden = true;
    var ml = el('div', 'mp-loading mp-loading--sm mp-loading--inline');
    ml.setAttribute('role', 'status');
    ml.setAttribute('aria-live', 'polite');
    ml.setAttribute('aria-busy', 'true');
    var spin = el('span', 'mp-loading__spinner');
    spin.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < 8; k++) spin.appendChild(el('span', 'mp-loading__bar'));
    ml.appendChild(spin);
    ml.appendChild(el('span', 'mp-loading__text', 'Cargando más solicitudes…'));
    loader.appendChild(ml);

    var end = el('p', 'hc-end');
    end.hidden = true;
    var live = el('p', 'app-sr');                        // anuncia a lectores de pantalla cuántas hay visibles
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');

    host.appendChild(list);
    host.appendChild(more);
    host.appendChild(loader);
    host.appendChild(end);
    host.appendChild(live);
    host.appendChild(buildHelp());

    var shown = 0;
    var loading = false;

    function appendNext() {
      var next = all.slice(shown, shown + MIS_PAGE);
      var firstNew = null;
      next.forEach(function (s) {
        var card = buildCard(s);
        if (!firstNew) firstNew = card;
        list.appendChild(card);
      });
      shown += next.length;
      live.textContent = 'Mostrando ' + shown + ' de ' + all.length + ' solicitudes.';
      return firstNew;
    }

    function refreshHint() {
      var remaining = all.length - shown;
      more.hidden = loading || remaining <= 0;
      moreCount.textContent = 'Mostrando ' + shown + ' de ' + all.length;
      if (remaining <= 0) {
        end.textContent = all.length > MIS_PAGE ? 'Ya viste todas tus solicitudes (' + all.length + ')' : '';
        end.hidden = !end.textContent;
      }
    }

    // fromKeyboard: si se activó con teclado/toque en la pista, el foco pasa a la primera tarjeta nueva
    function loadMore(fromButton) {
      if (loading || shown >= all.length) return;
      loading = true;
      loader.hidden = false;
      refreshHint();
      window.setTimeout(function () {                   // prototipo: simula la espera de la red
        var firstNew = appendNext();
        loader.hidden = true;
        loading = false;
        refreshHint();
        if (fromButton && firstNew) {
          firstNew.tabIndex = -1;
          firstNew.focus();
        }
      }, MIS_DELAY);
    }

    more.addEventListener('click', function () { loadMore(true); });
    moreCtx = { canLoad: function () { return !loading && shown < all.length; }, load: function () { loadMore(false); } };

    appendNext();                                       // primera tanda: 7
    refreshHint();
  }

  /* ── Gesto de "deslizar hacia arriba para ver más" ──
     Solo cuenta si el contenido ya está en su final; hay que arrastrar al menos SWIPE_MIN px. */
  var SWIPE_MIN = 48;       // px de arrastre (táctil o mouse)
  var WHEEL_MIN = 80;       // desplazamiento acumulado de rueda / trackpad
  var WHEEL_SETTLE = 700;   // ms quieto en el final antes de que la rueda cuente (evita la inercia al llegar)
  var scroller = $('view-solicitud');

  function atEnd() { return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4; }
  function fireSwipe() { if (moreCtx && moreCtx.canLoad()) moreCtx.load(); }

  // Táctil
  var touchStartY = null, touchPull = 0;
  scroller.addEventListener('touchstart', function () { touchStartY = null; touchPull = 0; }, { passive: true });
  scroller.addEventListener('touchmove', function (e) {
    if (!moreCtx) return;
    var y = e.touches[0].clientY;
    if (touchStartY === null) { if (atEnd()) touchStartY = y; return; }   // empieza a medir al estar en el final
    touchPull = touchStartY - y;
  }, { passive: true });
  scroller.addEventListener('touchend', function () {
    if (touchStartY !== null && touchPull >= SWIPE_MIN) fireSwipe();
    touchStartY = null; touchPull = 0;
  }, { passive: true });

  // Mouse (visor de escritorio): arrastrar hacia arriba
  var mouseDown = false, mouseStartY = null, mousePull = 0;
  scroller.addEventListener('mousedown', function () { mouseDown = true; mouseStartY = null; mousePull = 0; });
  document.addEventListener('mousemove', function (e) {
    if (!mouseDown || !moreCtx) return;
    if (mouseStartY === null) { if (atEnd()) mouseStartY = e.clientY; return; }
    mousePull = mouseStartY - e.clientY;
  });
  document.addEventListener('mouseup', function () {
    if (mouseDown && mouseStartY !== null && mousePull >= SWIPE_MIN) fireSwipe();
    mouseDown = false; mouseStartY = null; mousePull = 0;
  });

  // Rueda / trackpad: seguir desplazando hacia abajo cuando ya no hay más contenido
  var endSince = null, wheelAcc = 0, wheelTimer = null;
  scroller.addEventListener('scroll', function () {
    if (atEnd()) { if (endSince === null) endSince = Date.now(); } else { endSince = null; wheelAcc = 0; }
  }, { passive: true });
  scroller.addEventListener('wheel', function (e) {
    if (!moreCtx || e.deltaY <= 0 || !atEnd()) { wheelAcc = 0; return; }
    if (endSince === null) endSince = Date.now();
    if (Date.now() - endSince < WHEEL_SETTLE) { wheelAcc = 0; return; }
    wheelAcc += e.deltaY;
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(function () { wheelAcc = 0; }, 300);
    if (wheelAcc >= WHEEL_MIN) { wheelAcc = 0; fireSwipe(); }
  }, { passive: true });

  /* ───────────────────────── Panel de simulación ───────────────────────── */
  var sim = D.sim();
  document.querySelector('input[name="sim-result"][value="' + sim.result + '"]').checked = true;
  document.querySelector('input[name="sim-lista"][value="' + sim.lista + '"]').checked = true;
  Array.prototype.forEach.call(document.querySelectorAll('input[name="sim-result"]'), function (r) {
    r.addEventListener('change', function () { D.setSim({ result: r.value }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="sim-lista"]'), function (r) {
    r.addEventListener('change', function () {
      D.setSim({ lista: r.value });
      if ($('tab-mis').getAttribute('aria-selected') === 'true') renderMis();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-msg]'), function (b) {
    b.addEventListener('click', function () { showMessage(b.getAttribute('data-msg')); });
  });
  $('sim-reset').addEventListener('click', function () { D.reset(); window.location.reload(); });

  /* ───────────────────────── Init ───────────────────────── */
  renderServField();
  renderMesField();
  renderRangeFields();
  validate();
})();
