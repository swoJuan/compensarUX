/* ============================================================
 * nueva-solicitud.js — Pantalla "Nueva solicitud" (ZT · Historia clínica)
 * ------------------------------------------------------------
 * - Selector múltiple de servicios (buscador + "Seleccionar todos" tri-estado).
 * - Periodo: por mes (dropdown ZT) · por rango (datepicker ZT) · año anterior.
 * - "Continuar" se habilita solo con servicios + periodo válido.
 * - Drawer de confirmación (mp-sidebar del DS) → radica la solicitud → radicada.html.
 * Requiere: hc-mock.js, confirm-drawer.js, mensajes.js, ZTDropdown y ZTDatePicker (cargados antes).
 * ============================================================ */
(function () {
  'use strict';

  var MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                      'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  var $ = function (id) { return document.getElementById(id); };
  var form = $('hc-form');
  var btnContinuar = $('hc-continuar');

  var now = new Date();
  var thisYear = now.getFullYear();
  var prevYear = thisYear - 1;
  var today = HC.todayIso();

  /* ───────────────────────── Servicios (multi-select) ───────────────────────── */
  var multi = $('hc-multi');
  var trigger = $('hc-serv-trigger');
  var panel = $('hc-serv-panel');
  var valueEl = $('hc-serv-value');
  var listEl = $('hc-serv-list');
  var allEl = $('hc-serv-all');
  var searchEl = $('hc-serv-search');
  var emptyEl = $('hc-serv-empty');
  var selected = [];   // etiquetas seleccionadas, en el orden del catálogo

  function buildServices() {
    HC.SERVICIOS.forEach(function (name, i) {
      var label = document.createElement('label');
      label.className = 'mp-choice mp-checkbox hc-multi__opt';
      label.setAttribute('data-name', name.toLowerCase());
      label.innerHTML =
        '<span class="mp-choice__field">' +
          '<input class="mp-choice__input" type="checkbox" id="hc-serv-' + i + '" value="' + name + '">' +
          '<span class="mp-choice__control"></span>' +
        '</span>' +
        '<span class="mp-choice__text"><span class="mp-choice__label"></span></span>';
      label.querySelector('.mp-choice__label').textContent = name;
      listEl.appendChild(label);
    });
  }

  function options() { return Array.prototype.slice.call(listEl.querySelectorAll('.hc-multi__opt')); }
  function visibleBoxes() {
    return options().filter(function (o) { return !o.hidden; })
      .map(function (o) { return o.querySelector('input'); });
  }

  function syncServices() {
    selected = options().map(function (o) { return o.querySelector('input'); })
      .filter(function (i) { return i.checked; })
      .map(function (i) { return i.value; });

    // Texto del trigger
    var text;
    if (!selected.length) text = 'Selecciona uno o varios servicios';
    else if (selected.length <= 2) text = selected.join(', ');
    else text = selected.length + ' servicios seleccionados';
    valueEl.textContent = text;
    valueEl.classList.toggle('is-placeholder', !selected.length);

    // Estado de "Seleccionar todos" sobre lo visible
    var vis = visibleBoxes();
    var checked = vis.filter(function (i) { return i.checked; }).length;
    allEl.checked = vis.length > 0 && checked === vis.length;
    allEl.indeterminate = checked > 0 && checked < vis.length;
    allEl.disabled = vis.length === 0;

    validate();
  }

  function filterServices() {
    var q = searchEl.value.toLowerCase().trim();
    var shown = 0;
    options().forEach(function (o) {
      var match = q === '' || o.getAttribute('data-name').indexOf(q) !== -1;
      o.hidden = !match;
      if (match) shown++;
    });
    emptyEl.hidden = shown !== 0;
    syncServices();
  }

  function openPanel() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    searchEl.focus();
  }
  function closePanel(returnFocus) {
    if (panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panel.hidden) openPanel(); else closePanel(false);
  });
  trigger.addEventListener('keydown', function (e) {
    if ((e.key === 'ArrowDown') && panel.hidden) { e.preventDefault(); openPanel(); }
  });
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePanel(true); }
  });
  document.addEventListener('click', function (e) {
    if (!multi.contains(e.target)) closePanel(false);
  });
  // Cerrar al salir del panel con Tab
  multi.addEventListener('focusout', function (e) {
    if (e.relatedTarget && !multi.contains(e.relatedTarget)) closePanel(false);
  });

  allEl.addEventListener('change', function () {
    var on = allEl.checked;
    visibleBoxes().forEach(function (i) { i.checked = on; });
    syncServices();
  });
  listEl.addEventListener('change', syncServices);
  searchEl.addEventListener('input', filterServices);
  searchEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') e.preventDefault();   // no enviar el formulario desde el buscador
  });

  /* ───────────────────────── Periodo ───────────────────────── */
  var panels = { mes: $('hc-panel-mes'), rango: $('hc-panel-rango'), anio: $('hc-panel-anio') };
  var mesSel = $('hc-mes');
  var desde = $('hc-desde');
  var hasta = $('hc-hasta');
  var rangoError = $('hc-rango-error');

  function currentPeriodType() {
    return form.querySelector('input[name="periodo"]:checked').value;
  }

  // Últimos 12 meses (el actual primero). value = "YYYY-MM".
  function buildMonths() {
    for (var k = 0; k < 12; k++) {
      var d = new Date(thisYear, now.getMonth() - k, 1);
      var opt = document.createElement('option');
      opt.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      opt.textContent = MESES_LARGOS[d.getMonth()] + ' ' + d.getFullYear();
      mesSel.appendChild(opt);
    }
  }

  function lastDay(y, m) { return new Date(y, m, 0).getDate(); }   // m = 1..12

  // Devuelve { tipo, desde, hasta, texto } o null si el periodo es incompleto/inválido.
  function readPeriod() {
    var tipo = currentPeriodType();
    if (tipo === 'mes') {
      if (!mesSel.value) return null;
      var p = mesSel.value.split('-');
      var y = parseInt(p[0], 10), m = parseInt(p[1], 10);
      var fin = (y === thisYear && m === now.getMonth() + 1) ? today
        : mesSel.value + '-' + String(lastDay(y, m)).padStart(2, '0');
      return { tipo: tipo, desde: mesSel.value + '-01', hasta: fin,
               texto: 'Por mes · ' + MESES_LARGOS[m - 1] + ' ' + y };
    }
    if (tipo === 'rango') {
      if (!desde.value || !hasta.value || desde.value > hasta.value) return null;
      return { tipo: tipo, desde: desde.value, hasta: hasta.value, texto: 'Por rango de fechas' };
    }
    return { tipo: tipo, desde: prevYear + '-01-01', hasta: prevYear + '-12-31',
             texto: 'Año anterior (' + prevYear + ')' };
  }

  function showPanel(tipo) {
    Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== tipo; });
  }

  function validateRange() {
    var invalid = !!(desde.value && hasta.value && desde.value > hasta.value);
    rangoError.hidden = !invalid;
    [desde, hasta].forEach(function (i) {
      i.classList.toggle('error', invalid);
      i.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    });
    // Los campos de fecha mejorados por ZTDatePicker muestran el error en su trigger
    document.querySelectorAll('#hc-panel-rango .zt-datefield__trigger').forEach(function (t) {
      t.classList.toggle('error', invalid);
    });
  }

  function validate() {
    if (currentPeriodType() === 'rango') validateRange();
    btnContinuar.disabled = !(selected.length > 0 && readPeriod());
  }

  form.querySelectorAll('input[name="periodo"]').forEach(function (r) {
    r.addEventListener('change', function () { showPanel(r.value); validate(); });
  });
  mesSel.addEventListener('change', validate);
  desde.addEventListener('change', function () {
    hasta.min = desde.value || '';        // el calendario lee min/max al abrir
    validate();
  });
  hasta.addEventListener('change', validate);

  /* ───────────────────────── Confirmación (drawer del DS) ───────────────────────── */
  // auto = true cuando viene de "Intentar de nuevo": reabre el drawer y confirma de una vez
  function openConfirm(auto) {
    var period = readPeriod();
    if (!selected.length || !period) return;

    HCConfirmDrawer.open({
      title: 'Confirma tu selección',
      intro: 'Revisa la información antes de continuar.',
      paciente: HC.PACIENTE,
      servicios: selected.slice(),
      periodo: { rango: HC.fmt(period.desde) + ' – ' + HC.fmt(period.hasta), texto: period.texto },
      onConfirm: function (btn) {
        btn.disabled = true;
        btn.textContent = 'Radicando…';
        // Prototipo: simula el envío; el resultado lo define el simulador flotante (HC.sim)
        window.setTimeout(function () {
          var result = HC.sim().result;
          if (result === 'ok') {
            HC.add({ servicios: selected.slice(), desde: period.desde, hasta: period.hasta });
            window.location.href = 'radicada.html';
            return;
          }
          HCConfirmDrawer.close({ immediate: true });
          HCMensajes.show(result, { onRetry: function () { openConfirm(true); } });
        }, 600);
      }
    });

    if (auto) {
      window.setTimeout(function () {
        var ok = document.querySelector('.hc-drawer .mp-btn--primario');
        if (ok) ok.click();
      }, 450);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    openConfirm(false);
  });

  /* ───────────────────────── Init ───────────────────────── */
  $('hc-anio-label').textContent = 'Año anterior (' + prevYear + ')';
  $('hc-anio-note').textContent =
    'Incluye la información del 1 de enero al 31 de diciembre de ' + prevYear + '.';

  desde.max = today;
  hasta.max = today;
  buildServices();
  buildMonths();
  syncServices();
  showPanel(currentPeriodType());
  validate();
})();
