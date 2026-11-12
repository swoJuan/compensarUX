/* ============================================================
 * paso-5.js — PASO 5 "LVI — Libre y voluntaria información al cliente" (ZT)
 * ------------------------------------------------------------
 * Checklist que el asesor marca a medida que le explica cada punto al cliente
 * (Figma 251:21747).
 *
 * Responsabilidades (prototipo, sin backend real):
 *   - CONTROL DE ACCESO por etapas: candidato viable + Pasos 1–4 completos.
 *   - Stepper transversal (8 pasos, current = 5).
 *   - Catálogo LVI_ITEMS (2 secciones, 11 puntos, todos obligatorios).
 *   - Progreso visible: barra "N de 11 puntos explicados" + conteo por sección.
 *   - Punto marcado → fila con fondo (se distingue lo ya explicado).
 *   - "Plan contratado" muestra el plan elegido en el Paso 1.
 *   - Bloqueo de avance: todos marcados; si no, alerta + resalta pendientes y
 *     enfoca el primero.
 *   - Persistencia en step5 (sessionStorage) + restauración.
 *
 * Decisión UX: NO hay "Marcar todos". La LVI es constancia de que cada punto se
 * explicó; un atajo invitaría a marcar sin explicar.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ─────────── */
  if (!Z || !Z.isViable()) { window.location.replace('../index.html'); return; }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) { window.location.replace('../paso-1/index.html'); return; }
  var step2 = Z.getStep2();
  if (!step2 || step2.completed !== true || step2.otpVerified !== true) { window.location.replace('../paso-2/index.html'); return; }
  var step3 = Z.getStep3();
  if (!step3 || step3.completed !== true) { window.location.replace('../paso-3/index.html'); return; }
  var step4 = Z.getStep4();
  if (!step4 || step4.completed !== true) { window.location.replace('../paso-4/index.html'); return; }

  var candidate = Z.getCandidate();

  var PLAN_LABEL = { ideal: 'Plan Ideal', optimo: 'Plan Óptimo' };

  /* ═══════════════ CATÁLOGO LVI (texto del Figma) ═══════════════
   * Se completó la redacción de "Convalidación de antigüedad" (en el Figma la
   * frase quedó incompleta). */
  var LVI_SECTIONS = [
    { id: 'a', title: 'A. Información del plan', icon: 'icon-shield-check', items: [
      { id: 'plan', title: 'Plan contratado', desc: 'El cliente confirma que conoce el plan de Medicina Prepagada que está contratando y su cobertura.', tag: PLAN_LABEL[step1.plan] || '' },
      { id: 'regimen', title: 'Afiliación Régimen contributivo / Régimen de excepción', desc: 'Se indica que el usuario debe acreditar afiliación al régimen contributivo o régimen de excepción para poder estar afiliado a Medicina Prepagada.' },
      { id: 'preexistencias', title: 'Definición de preexistencias', desc: 'Se confirma que la definición de preexistencias es clara, así como la opción de cubrimiento de eventos amparados en planes anteriores.' },
      { id: 'carencia', title: 'Periodos de carencia', desc: 'Se informa que el plan puede tener periodos de carencia para algunos servicios.' },
      { id: 'antiguedad', title: 'Convalidación de antigüedad', desc: 'Se explica cómo se reconoce la antigüedad convalidada de planes anteriores.' },
      { id: 'maternidad', title: 'Cobertura de maternidad', desc: 'A partir del 1er día del mes 12 de afiliación, siempre y cuando se trate de embarazos iniciados después de dicho periodo.' },
      { id: 'coberturas', title: 'Otras coberturas', desc: 'Se informa al cliente los topes de coberturas y exclusiones.' }
    ]},
    { id: 'b', title: 'B. Gestión del contrato', icon: 'icon-file-text', items: [
      { id: 'inclusion', title: 'Inclusión y exclusión de beneficiarios', desc: 'Se informa el procedimiento y los tiempos para incluir o excluir beneficiarios durante la vigencia del contrato.' },
      { id: 'tarifas', title: 'Tarifas por género y edad', desc: 'Se explica que las tarifas del plan pueden variar según el género y la edad de cada afiliado.' },
      { id: 'mora', title: 'No pago oportuno', desc: 'Se informan las consecuencias de la mora en el pago de las cuotas, incluyendo suspensión o terminación del contrato.' },
      { id: 'pago', title: 'Modalidad de pago', desc: 'Se confirma con el cliente la modalidad de pago seleccionada y sus condiciones.' }
    ]}
  ];
  var ALL_ITEMS = [];
  LVI_SECTIONS.forEach(function (s) { s.items.forEach(function (it) { ALL_ITEMS.push(it); }); });

  /* ─────────── Referencias al DOM ─────────── */
  var sectionsEl = document.getElementById('p5-sections');
  var progressEl = document.getElementById('p5-progress');
  var alertEl    = document.getElementById('p5-alert');
  var backBtn    = document.getElementById('p5-back');
  var nextBtn    = document.getElementById('p5-next');

  /* ─────────── Panel lateral ─────────── */
  ZTPersonSummary.render(document.getElementById('pa-cand-summary'), {
    eyebrow: 'Persona a afiliar',
    variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '',
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber
  });
  ZTStepper.render(document.getElementById('pa-stepper'), Z.stepperConfig(5));   // pasos completados clicables

  /* ═══════════════ ESTADO ═══════════════ */
  var saved = Z.getStep5() || {};
  var state = { completed: saved.completed === true, checked: {} };
  ALL_ITEMS.forEach(function (it) { state.checked[it.id] = !!(saved.checked && saved.checked[it.id]); });
  function persist() { Z.saveStep5({ completed: state.completed, checked: state.checked }); }
  function countChecked(items) { return items.filter(function (it) { return state.checked[it.id]; }).length; }

  /* ═══════════════ HELPERS ═══════════════ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var liveRegion = document.createElement('div');
  liveRegion.className = 'visually-hidden';
  liveRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(liveRegion);
  function announce(msg) { liveRegion.textContent = ''; window.setTimeout(function () { liveRegion.textContent = msg; }, 30); }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════ RENDER ═══════════════ */
  function itemHTML(it) {
    var id = 'p5-' + it.id;
    var on = state.checked[it.id];
    return '<label class="p5-item' + (on ? ' is-checked' : '') + '" data-item="' + it.id + '" for="' + id + '">' +
      '<span class="mp-choice mp-checkbox p5-item__check">' +
        '<span class="mp-choice__field">' +
          '<input class="mp-choice__input" type="checkbox" id="' + id + '" name="' + it.id + '"' + (on ? ' checked' : '') +
          ' aria-describedby="' + id + '-desc" aria-required="true">' +
          '<span class="mp-choice__control"></span>' +
        '</span>' +
      '</span>' +
      '<span class="p5-item__text">' +
        '<span class="p5-item__title"><span class="mp-input-required" aria-hidden="true">*</span> ' + esc(it.title) +
          (it.tag ? ' <span class="p5-item__tag">' + esc(it.tag) + '</span>' : '') +
        '</span>' +
        '<span class="p5-item__desc" id="' + id + '-desc">' + esc(it.desc) + '</span>' +
      '</span>' +
    '</label>';
  }
  function sectionHTML(sec) {
    return '<section class="p5-section" data-section="' + sec.id + '" aria-labelledby="p5-sec-' + sec.id + '">' +
      '<div class="p5-section__head">' +
        '<h3 class="p5-section__title" id="p5-sec-' + sec.id + '">' + esc(sec.title) + '</h3>' +
        '<span class="p5-section__count" data-count="' + sec.id + '"></span>' +
      '</div>' +
      '<div class="p5-list">' + sec.items.map(itemHTML).join('') + '</div>' +
    '</section>';
  }
  function renderProgress() {
    var done = countChecked(ALL_ITEMS), total = ALL_ITEMS.length;
    var pct = Math.round(done / total * 100);
    progressEl.className = 'p5-progress' + (done === total ? ' is-done' : '');
    progressEl.innerHTML =
      '<div class="p5-progress__row">' +
        '<span class="p5-progress__label">' +
          (done === total
            ? '<span class="icon icon-check-circle icon-20 gs-inherit" aria-hidden="true"></span> Todos los puntos fueron explicados'
            : 'Puntos explicados') +
        '</span>' +
        '<span class="p5-progress__count">' + done + ' de ' + total + '</span>' +
      '</div>' +
      '<div class="p5-progress__bar" role="progressbar" aria-label="Puntos explicados" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '">' +
        '<span class="p5-progress__fill" style="width:' + pct + '%"></span>' +
      '</div>';
    LVI_SECTIONS.forEach(function (sec) {
      var el = sectionsEl.querySelector('[data-count="' + sec.id + '"]');
      var n = countChecked(sec.items);
      if (el) {
        el.textContent = n + '/' + sec.items.length;
        el.classList.toggle('is-done', n === sec.items.length);
      }
    });
  }
  sectionsEl.innerHTML = LVI_SECTIONS.map(sectionHTML).join('');
  renderProgress();

  /* ═══════════════ EVENTOS ═══════════════ */
  sectionsEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'checkbox') return;
    state.checked[t.name] = t.checked;
    var row = t.closest('[data-item]');
    row.classList.toggle('is-checked', t.checked);
    row.classList.remove('is-missing');
    state.completed = false;
    persist();
    renderProgress();
    var done = countChecked(ALL_ITEMS);
    if (done === ALL_ITEMS.length) { ZTAlert.clear(alertEl); announce('Todos los puntos fueron explicados.'); }
    else announce(done + ' de ' + ALL_ITEMS.length + ' puntos explicados.');
  });

  nextBtn.addEventListener('click', function () {
    var pend = ALL_ITEMS.filter(function (it) { return !state.checked[it.id]; });
    if (!pend.length) {
      state.completed = true;
      persist();
      // Paso 6 (Sarlaft) aún no está construido: destino documentado.
      window.location.href = '../paso-6/index.html';
      return;
    }
    pend.forEach(function (it) {
      var row = sectionsEl.querySelector('[data-item="' + it.id + '"]');
      if (row) row.classList.add('is-missing');
    });
    ZTAlert.render(alertEl, {
      type: 'warning',
      title: pend.length === 1 ? 'Falta 1 punto por explicar' : 'Faltan ' + pend.length + ' puntos por explicar',
      description: 'Marca cada punto después de explicarlo al cliente: ' + pend.map(function (it) { return it.title; }).join(', ') + '.'
    });
    var first = sectionsEl.querySelector('[data-item="' + pend[0].id + '"]');
    if (first) {
      first.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      var input = first.querySelector('input');
      try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
    }
  });

  backBtn.addEventListener('click', function () {
    persist();
    window.location.href = '../paso-4/index.html';
  });
})();
