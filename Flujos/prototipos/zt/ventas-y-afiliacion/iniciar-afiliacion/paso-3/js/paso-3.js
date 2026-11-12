/* ============================================================
 * paso-3.js — PASO 3 "Beneficiarios" del Proceso de afiliación (ZT)
 * ------------------------------------------------------------
 * Responsabilidades (prototipo, sin backend real):
 *   - CONTROL DE ACCESO por etapas: candidato viable + Paso 1 completo +
 *     Paso 2 completo + OTP verificado. Si falta algo, redirige al paso válido.
 *   - Stepper transversal (8 pasos, current = 3 → Pasos 1 y 2 completed).
 *   - Switch transversal: "¿El contratante es beneficiario del plan?"
 *       (contractorIsBeneficiary). Si ON, el contratante se considera incluido
 *       para el Paso 4 usando los datos del Step 2 (NO se crea card duplicada).
 *   - Lista de beneficiarios (colección con id único). Un ÚNICO componente
 *       transversal (Beneficiary Card) renderiza cualquier ítem, colapsado o
 *       expandido/edición. Solo UNA card expandida a la vez.
 *   - DOCUMENTO PRIMERO: en A. Identificación el asesor elige tipo + número y
 *       presiona "Consultar". Nombres, fecha de nacimiento, edad, género y sexo
 *       llegan de la consulta (MOCK datosDocumentoMock/personaMock) y se muestran
 *       como información NO editable. B–E aparecen solo tras consultar.
 *       "Cambiar documento" vuelve a la entrada del documento.
 *   - Formulario por beneficiario (secciones A–E) clonado desde <template>:
 *       · Edad readonly calculada desde fecha de nacimiento (no futura).
 *       · Ciudad dependiente del Departamento.
 *       · Dirección: si "Sí" copia del Step 2; si "No" pide bloque residencia.
 *       · Plan complementario Compensar: si "Sí" muestra semanas (mock 120).
 *       · Convalida antigüedad: si "Sí" pide entidad + fechas; semanas calculadas
 *         entre fechas; fecha fin >= fecha inicio (error inline si no).
 *   - Estado pendiente/completo por beneficiario según campos obligatorios
 *     dinámicos. Cerrar conserva datos (no marca completo). Editar reabre.
 *   - Eliminar con confirmación (Modal transversal).
 *   - Bloqueo de avance: no continuar con beneficiarios pendientes ni sin al
 *     menos un beneficiario cuando el contratante no es beneficiario.
 *   - Persistencia en un ÚNICO modelo step3 (sessionStorage) + restauración.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ─────────── */
  if (!Z || !Z.isViable()) { window.location.replace('../index.html'); return; }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) { window.location.replace('../paso-1/index.html'); return; }
  var step2 = Z.getStep2();
  if (!step2 || step2.completed !== true || step2.otpVerified !== true) {
    // Paso 2 / OTP no completos → volver a Datos del contratante.
    window.location.replace('../paso-2/index.html');
    return;
  }

  var candidate = Z.getCandidate();

  /* ─────────── Catálogo mock Ciudad por Departamento (igual que Paso 2) ─────────── */
  var CIUDADES = {
    valle:        ['Cali', 'Palmira', 'Jamundí', 'Candelaria', 'Yumbo'],
    cundinamarca: ['Bogotá D.C.', 'Soacha', 'Chía', 'Zipaquirá'],
    antioquia:    ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro'],
    atlantico:    ['Barranquilla', 'Soledad', 'Malambo'],
    santander:    ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
    bolivar:      ['Cartagena', 'Magangué', 'Turbaco']
  };

  var PLAN_MOCK_WEEKS = 120;   // semanas mock del plan complementario (readonly)

  /* ─────────── Referencias al DOM ─────────── */
  var candSummary = document.getElementById('pa-cand-summary');
  var stepperEl   = document.getElementById('pa-stepper');
  var switchHost  = document.getElementById('p3-contractor-switch');
  var listEl      = document.getElementById('p3-list');
  var addBtn      = document.getElementById('p3-add-btn');
  var alertEl     = document.getElementById('p3-alert');
  var backBtn     = document.getElementById('p3-back');
  var nextBtn     = document.getElementById('p3-next');
  var formTpl     = document.getElementById('benef-form-tpl');
  var flowNoteEl  = document.getElementById('p3-flow-note');
  var seniorHost  = document.getElementById('p3-contractor-seniority');

  /* ─────────── Resumen del candidato (Person Summary compact) ─────────── */
  ZTPersonSummary.render(candSummary, {
    eyebrow: 'Persona a afiliar',
    variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '',
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber
  });

  /* ─────────── Stepper transversal (current = 3) ─────────── */
  ZTStepper.render(stepperEl, Z.stepperConfig(3));

  /* Regla del flujo decidida en el Paso 1 (Inclusión en contrato vigente). */
  var F = Z.flow();

  /* ═══════════════ MODELO DE ESTADO (Step 3) ═══════════════
   * beneficiaries: [{ id, status, ...campos }]. contractorIsBeneficiary: bool.
   * Se hidrata desde step3 persistido; por defecto el contratante es beneficiario. */
  var saved = Z.getStep3() || {};
  var state = {
    completed: saved.completed === true,   // volver a un paso completo (panel de pasos) no lo "descompleta"
    contractorIsBeneficiary: (typeof saved.contractorIsBeneficiary === 'boolean') ? saved.contractorIsBeneficiary : true,
    beneficiaries: Array.isArray(saved.beneficiaries) ? saved.beneficiaries.slice() : [],
    // Antigüedad del CONTRATANTE (solo aplica si es beneficiario). Por defecto No.
    contractorValidatesSeniority: saved.contractorValidatesSeniority === true,
    contractorPreviousEntity: saved.contractorPreviousEntity || '',
    contractorSeniorityStart: saved.contractorSeniorityStart || '',
    contractorSeniorityEnd: saved.contractorSeniorityEnd || '',
    contractorSeniorityWeeks: saved.contractorSeniorityWeeks == null ? null : saved.contractorSeniorityWeeks
  };
  // Inclusión → el contratante ya está en un contrato vigente (no se procesa).
  if (F.isInclusion) state.contractorIsBeneficiary = false;
  // Individual → solo el contratante (es el único beneficiario del plan).
  if (F.isIndividual && !F.isInclusion) { state.contractorIsBeneficiary = true; state.beneficiaries = []; }
  // Compat "documento primero": beneficiarios guardados antes del cambio (con
  // nombre y fecha diligenciados a mano) se consideran ya consultados.
  state.beneficiaries.forEach(function (b) {
    if (b.documentConsulted == null && b.firstName && b.birthDate) b.documentConsulted = true;
  });

  // Mapa runtime id → { card (instancia ZTBenefCard), form (nodo), enhanced }
  var views = {};
  var expandedId = null;   // solo UNA card expandida a la vez

  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function findBenef(id) { return state.beneficiaries.filter(function (b) { return b.id === id; })[0] || null; }
  function indexOfBenef(id) {
    for (var i = 0; i < state.beneficiaries.length; i++) if (state.beneficiaries[i].id === id) return i;
    return -1;
  }

  /* ═══════════════ SWITCH DEL CONTRATANTE ═══════════════ */
  var contractorSwitch = ZTSwitch.renderRow(switchHost, {
    label: '¿El contratante es beneficiario del plan?',
    checked: state.contractorIsBeneficiary,
    ariaLabel: '¿El contratante es beneficiario del plan?',
    onChange: function (checked) {
      state.contractorIsBeneficiary = checked;
      persist();
      ZTAlert.clear(alertEl);
      renderSeniority();
    }
  });
  // Inclusión: el contratante ya está afiliado → la pregunta no aplica.
  if (F.isInclusion || F.isIndividual) switchHost.hidden = true;
  // Individual: no se agregan beneficiarios.
  if (F.isIndividual && !F.isInclusion) addBtn.closest('.p3-add').hidden = true;

  /* ─────────── Nota de la regla del flujo + botón "Agregar" ─────────── */
  (function renderFlowNote() {
    var intro = document.getElementById('p3-intro');
    if (intro && F.isIndividual && !F.isInclusion) intro.textContent = 'En la afiliación individual el contratante es el único beneficiario del plan.';
    var msg = '';
    if (F.isInclusion) msg = '<strong>Inclusión en contrato vigente</strong>: el contratante ya está afiliado. Agrega los beneficiarios que se van a incluir; solo ellos pasan por estados de salud, liquidación y soportes.';
    else if (F.isIndividual) msg = '<strong>Afiliación individual</strong>: solo el contratante hace parte del plan. Para agregar beneficiarios, cambia la modalidad a <a href="../paso-1/index.html">Familiar en el Paso 1</a>.';
    else if (F.isFamiliar) msg = '<strong>Afiliación familiar</strong>: agrega al menos un beneficiario.';
    flowNoteEl.innerHTML = msg ? '<span class="icon icon-info icon-16 gs-inherit" aria-hidden="true"></span><span>' + msg + '</span>' : '';
  })();

  /* ═══════════════ ANTIGÜEDAD DEL CONTRATANTE ═══════════════
   * Misma pregunta que se hace a cada beneficiario (sección E), para que el
   * Paso 8 pueda pedir el certificado de antigüedad también al contratante. */
  function renderSeniority() {
    if (!state.contractorIsBeneficiary || F.isInclusion) { seniorHost.innerHTML = ''; return; }
    var on = state.contractorValidatesSeniority;
    function radio(v, label) {
      return '<label class="mp-choice mp-radio"><span class="mp-choice__field">' +
        '<input class="mp-choice__input" type="radio" name="cSeniority" value="' + v + '"' + ((v === 'si') === on ? ' checked' : '') + '>' +
        '<span class="mp-choice__control"></span></span><span class="mp-choice__text"><span class="mp-choice__label">' + label + '</span></span></label>';
    }
    function opt(v, t) { return '<option value="' + v + '"' + (state.contractorPreviousEntity === v ? ' selected' : '') + '>' + t + '</option>'; }
    seniorHost.innerHTML =
      '<div class="p3-cs">' +
        '<fieldset class="p3-fieldset p3-cs__row">' +
          '<legend class="p3-cs__q">¿El contratante convalida antigüedad de otra medicina prepagada?</legend>' +
          '<div class="p3-radios" role="radiogroup" aria-label="¿El contratante convalida antigüedad de otra medicina prepagada?">' + radio('si', 'Sí') + radio('no', 'No') + '</div>' +
        '</fieldset>' +
        (on ?
        '<div class="p3-context">' +
          '<div class="pa-row mb-3"><div class="mp-input-group p3-col-full">' +
            '<label class="mp-input-label" for="c-entidad"><span class="mp-input-required" aria-hidden="true">*</span> Entidad anterior de Medicina Prepagada</label>' +
            '<div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="c-entidad" data-zt-dropdown aria-describedby="c-entidad-error">' +
              '<option value="" disabled' + (state.contractorPreviousEntity ? '' : ' selected') + '>Seleccionar</option>' +
              opt('colsanitas', 'Colsanitas') + opt('colmedica', 'Colmédica') + opt('medplus', 'MedPlus') + opt('coomeva', 'Coomeva Medicina Prepagada') + opt('sura', 'Sura') + opt('otra', 'Otra') +
            '</select></div><p class="mp-input-error" id="c-entidad-error" role="alert" hidden>Selecciona una opción.</p></div></div>' +
          '<div class="pa-row mb-3">' +
            '<div class="mp-input-group"><label class="mp-input-label" for="c-fecha-inicio"><span class="mp-input-required" aria-hidden="true">*</span> Fecha inicio</label>' +
              '<div class="mp-input-wrapper"><input class="mp-input-field" id="c-fecha-inicio" type="date" placeholder="dd/mm/aaaa" data-zt-datepicker value="' + state.contractorSeniorityStart + '" aria-describedby="c-fecha-inicio-error"></div>' +
              '<p class="mp-input-error" id="c-fecha-inicio-error" role="alert" hidden>Este campo es obligatorio.</p></div>' +
            '<div class="mp-input-group"><label class="mp-input-label" for="c-fecha-fin"><span class="mp-input-required" aria-hidden="true">*</span> Fecha fin</label>' +
              '<div class="mp-input-wrapper"><input class="mp-input-field" id="c-fecha-fin" type="date" placeholder="dd/mm/aaaa" data-zt-datepicker value="' + state.contractorSeniorityEnd + '" aria-describedby="c-fecha-fin-error"></div>' +
              '<p class="mp-input-error" id="c-fecha-fin-error" role="alert" hidden>Este campo es obligatorio.</p></div>' +
          '</div>' +
          '<div class="pa-row"><div class="mp-input-group p3-col-full"><label class="mp-input-label" for="c-semanas">Cantidad de semanas</label>' +
            '<div class="mp-input-wrapper"><input class="mp-input-field pa-readonly" id="c-semanas" type="text" readonly aria-readonly="true" tabindex="-1" value="' + (state.contractorSeniorityWeeks == null ? '' : state.contractorSeniorityWeeks) + '"></div></div></div>' +
        '</div>' : '') +
      '</div>';
    if (on) { ZTDropdown.enhanceAll(seniorHost); ZTDatePicker.enhanceAll(seniorHost); }
  }
  function csField(id) { return document.getElementById(id); }
  function csSetError(id, on, msg) {
    var el = csField(id); if (!el) return;
    var host = el.closest('.zt-dropdown') || el.closest('.zt-datefield') || el;
    host.classList.toggle('error', !!on);
    var er = document.getElementById(id + '-error'); if (er) { if (msg) er.textContent = msg; er.hidden = !on; }
  }
  function csSync() {
    var e = csField('c-entidad'), a = csField('c-fecha-inicio'), b = csField('c-fecha-fin');
    if (e) state.contractorPreviousEntity = e.value || '';
    if (a) state.contractorSeniorityStart = a.value || '';
    if (b) state.contractorSeniorityEnd = b.value || '';
    state.contractorSeniorityWeeks = semanasEntre(state.contractorSeniorityStart, state.contractorSeniorityEnd);
    var w = csField('c-semanas'); if (w) w.value = state.contractorSeniorityWeeks == null ? '' : state.contractorSeniorityWeeks;
  }
  // Valida la antigüedad del contratante; marca errores si `mark`. Devuelve el primer campo inválido.
  function csValidate(mark) {
    if (!state.contractorIsBeneficiary || F.isInclusion || !state.contractorValidatesSeniority) return null;
    csSync();
    var first = null;
    function bad(id, cond, msg) { if (mark) csSetError(id, cond, msg); if (cond && !first) first = csField(id); }
    bad('c-entidad', !state.contractorPreviousEntity, 'Selecciona una opción.');
    bad('c-fecha-inicio', !state.contractorSeniorityStart, 'Este campo es obligatorio.');
    var finBad = !state.contractorSeniorityEnd || state.contractorSeniorityWeeks == null;
    bad('c-fecha-fin', finBad, state.contractorSeniorityEnd ? 'La fecha fin debe ser igual o posterior a la fecha inicio.' : 'Este campo es obligatorio.');
    return first;
  }
  seniorHost.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'cSeniority') {
      state.contractorValidatesSeniority = t.value === 'si';
      persist(); renderSeniority();
      if (state.contractorValidatesSeniority) { var tr = seniorHost.querySelector('.zt-dropdown__trigger'); if (tr) tr.focus(); }
      else { var r = seniorHost.querySelector('input[name="cSeniority"][value="no"]'); if (r) r.focus(); }
      return;
    }
    csSync();
    if (t.id) csSetError(t.id, false);
    persist();
  });
  seniorHost.addEventListener('input', function () { csSync(); persist(); });

  /* ═══════════════ HELPERS DE FECHA / EDAD / SEMANAS ═══════════════ */
  function calcularEdad(iso) {
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    var hoy = new Date();
    var edad = hoy.getFullYear() - b.getFullYear();
    var m = hoy.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < b.getDate())) edad--;
    return edad;
  }
  function todayISO() {
    var h = new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  }
  // Semanas completas entre dos fechas ISO (fin - inicio). null si inválido/negativo.
  function semanasEntre(iniISO, finISO) {
    if (!iniISO || !finISO) return null;
    var a = new Date(iniISO + 'T00:00:00'), b = new Date(finISO + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    var diff = b.getTime() - a.getTime();
    if (diff < 0) return null;
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }
  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function slug(nombre) {
    return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  /* ═══════════════ ERRORES INLINE (patrón Form Error, igual que Paso 2) ═══════════════ */
  function setError(el, on, msg) {
    if (!el) return;
    var host = el.closest ? (el.closest('.zt-dropdown') || el.closest('.zt-datefield')) : null;
    (host || el).classList.toggle('error', !!on);
    var group = el.closest ? el.closest('.mp-input-group') : null;
    var errEl = group && group.querySelector('.mp-input-error');
    if (errEl) { if (msg) errEl.textContent = msg; errEl.hidden = !on; }
  }
  function clearError(el) { setError(el, false); }

  /* ═══════════════ PARENTESCO legible (para la card colapsada) ═══════════════ */
  var REL_LABEL = {
    conyuge: 'Cónyuge', hijo: 'Hijo(a)', padre: 'Padre',
    madre: 'Madre', hermano: 'Hermano(a)', otro: 'Otro'
  };
  function nombreCompleto(b) {
    return [b.firstName, b.secondName, b.firstSurname, b.secondSurname]
      .filter(function (x) { return x && String(x).trim(); }).join(' ');
  }
  function tituloBenef(benef) {
    var n = state.beneficiaries.indexOf(benef);
    var num = (n >= 0 ? n + 1 : '');
    var nombre = nombreCompleto(benef);
    return 'Beneficiario ' + num + (nombre ? (' — ' + nombre) : '');
  }

  /* ═══════════════ REGIÓN VIVA (anuncios para lector de pantalla) ═══════════════
   * Anuncia altas/bajas de beneficiarios y cambios de contexto sin mover el foco. */
  var liveRegion = document.createElement('div');
  liveRegion.className = 'visually-hidden';   // utilidad del Design System (Bootstrap)
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('role', 'status');
  document.body.appendChild(liveRegion);
  function announce(msg) {
    // Reasignar fuerza el reanuncio aunque el texto se repita.
    liveRegion.textContent = '';
    window.setTimeout(function () { liveRegion.textContent = msg; }, 30);
  }

  /* ═══════════════ MOVIMIENTO REDUCIDO ═══════════════ */
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scrollBehavior() { return prefersReducedMotion ? 'auto' : 'smooth'; }

  /* Enfoca un elemento de forma segura (sin scroll brusco); devuelve true si pudo. */
  function focusEl(el, opts) {
    if (!el || typeof el.focus !== 'function') return false;
    try { el.focus(opts || { preventScroll: true }); } catch (e) { el.focus(); }
    return document.activeElement === el;
  }

  /* Enfoca el primer campo con error dentro de un formulario (al trigger del
   * dropdown/date field si aplica), para que el usuario vea qué corregir. */
  function focusPrimerError(refs) {
    var group = refs.form.querySelector('.mp-input-group .mp-input-error:not([hidden])');
    if (!group) return;
    var box = group.closest('.mp-input-group');
    var target = box.querySelector('.zt-dropdown__trigger, .zt-datefield__trigger, input, select, textarea');
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    focusEl(target);
  }

  /* ═══════════════ CAMPOS FALTANTES (microcopy de la card colapsada) ═══════════════
   * Lista legible de obligatorios pendientes de un beneficiario, evaluada sobre el
   * MODELO (sirve para cards colapsadas sin DOM). Máx. mostrado por la card. */
  function faltantesDe(benef) {
    var faltan = [];
    if (benef.documentConsulted !== true) { faltan.push('Consultar el documento'); return faltan; }
    if (!benef.relationship) faltan.push('Parentesco');
    if (!benef.eps) faltan.push('EPS');
    if (!benef.phone || !/^\d{10}$/.test(benef.phone)) faltan.push('Número de celular');
    if (!benef.email || !emailValido(benef.email)) faltan.push('Correo electrónico');
    if (benef.sameAddressAsContractor == null) faltan.push('Dirección');
    else if (benef.sameAddressAsContractor === false) {
      if (!benef.address) faltan.push('Dirección');
      if (!benef.department) faltan.push('Departamento');
      if (!benef.city) faltan.push('Ciudad');
    }
    if (benef.comesFromComplementaryPlan == null) faltan.push('Plan complementario');
    if (benef.validatesOtherPrepaidSeniority == null) faltan.push('Convalidación de antigüedad');
    else if (benef.validatesOtherPrepaidSeniority === true) {
      if (!benef.previousPrepaidEntity) faltan.push('Entidad anterior');
      if (!benef.seniorityStartDate) faltan.push('Fecha inicio');
      if (!benef.seniorityEndDate || semanasEntre(benef.seniorityStartDate, benef.seniorityEndDate) == null) faltan.push('Fecha fin');
    }
    return faltan;
  }

  /* ═══════════════ CONSTRUIR EL FORMULARIO DE UN BENEFICIARIO ═══════════════
   * Clona el <template>, sustituye "__ID__" por el id del beneficiario (ids
   * únicos), mejora dropdowns/datepickers y cablea la lógica dinámica. */
  function buildForm(benef) {
    var frag = formTpl.content.cloneNode(true);
    // Sustituir __ID__ en todos los atributos relevantes.
    var walker = frag.querySelectorAll('*');
    Array.prototype.forEach.call(walker, function (node) {
      ['id', 'for', 'name', 'aria-describedby', 'aria-labelledby'].forEach(function (attr) {
        var v = node.getAttribute && node.getAttribute(attr);
        if (v && v.indexOf('__ID__') !== -1) node.setAttribute(attr, v.replace(/__ID__/g, benef.id));
      });
    });
    var formEl = frag.querySelector('.benef-form');

    // Referencias
    var q = function (sel) { return formEl.querySelector(sel); };
    var refs = {
      form: formEl,
      tipoDoc:   q('[name="documentType"]'),
      numDoc:    q('[name="documentNumber"]'),
      nombre1:   q('[name="firstName"]'),
      nombre2:   q('[name="secondName"]'),
      apellido1: q('[name="firstSurname"]'),
      apellido2: q('[name="secondSurname"]'),
      nacimiento:q('[name="birthDate"]'),
      edad:      q('[name="age"]'),
      genero:    q('[name="gender"]'),
      sexo:      q('[name="identificationSex"]'),
      parentesco:q('[name="relationship"]'),
      eps:       q('[name="eps"]'),
      celular:   q('[name="phone"]'),
      correo:    q('[name="email"]'),
      sameAddrRadios: formEl.querySelectorAll('[name="sameAddress' + benef.id + '"]'),
      addrBlock: formEl.querySelector('[data-block="address"]'),
      direccion: q('[name="address"]'),
      departamento: q('[name="department"]'),
      ciudad:    q('[name="city"]'),
      fromPlanRadios: formEl.querySelectorAll('[name="fromPlan' + benef.id + '"]'),
      planBlock: formEl.querySelector('[data-block="plan"]'),
      planSemanas: q('[name="complementaryPlanWeeks"]'),
      seniorityRadios: formEl.querySelectorAll('[name="seniority' + benef.id + '"]'),
      seniorityBlock: formEl.querySelector('[data-block="seniority"]'),
      entidad:   q('[name="previousPrepaidEntity"]'),
      fechaInicio: q('[name="seniorityStartDate"]'),
      fechaFin:  q('[name="seniorityEndDate"]'),
      senioritySemanas: q('[name="seniorityWeeks"]'),
      // Documento primero
      docEntry:     formEl.querySelector('[data-block="doc-entry"]'),
      docFacts:     formEl.querySelector('[data-block="doc-facts"]'),
      factsList:    formEl.querySelector('[data-facts]'),
      afterConsult: formEl.querySelector('[data-block="after-consult"]'),
      consultBtn:   formEl.querySelector('[data-action="consult"]'),
      changeDocBtn: formEl.querySelector('[data-action="change-doc"]')
    };

    // Límite: fecha de nacimiento no futura.
    refs.nacimiento.max = todayISO();

    // Poblar ciudades del departamento (referencia viva ciudad se reemplaza).
    function poblarCiudades(deptoValue, preselect) {
      var ciudades = CIUDADES[deptoValue] || [];
      var fresco = document.createElement('select');
      fresco.className = 'mp-input-field mp-select';
      fresco.id = 'b' + benef.id + '-ciudad';
      fresco.name = 'city';
      fresco.setAttribute('data-zt-dropdown', '');
      fresco.setAttribute('data-zt-dropdown-search', 'false');
      fresco.setAttribute('aria-describedby', 'b' + benef.id + '-ciudad-error');
      var ph = document.createElement('option');
      ph.value = ''; ph.textContent = 'Seleccionar'; ph.disabled = true; ph.selected = true;
      fresco.appendChild(ph);
      ciudades.forEach(function (nombre) {
        var s = slug(nombre);
        var opt = document.createElement('option');
        opt.value = s; opt.textContent = nombre;
        if (preselect && s === preselect) opt.selected = true;
        fresco.appendChild(opt);
      });
      var actual = refs.ciudad;
      var contenedor = (actual.closest && actual.closest('.zt-dropdown')) || actual;
      contenedor.parentNode.replaceChild(fresco, contenedor);
      fresco.disabled = !deptoValue;
      ZTDropdown.enhance(fresco, { search: false });
      refs.ciudad = fresco;
      fresco.addEventListener('change', function () {
        clearError(fresco);
        if (typeof refs._recalc === 'function') refs._recalc();
      });
    }
    refs.poblarCiudades = poblarCiudades;

    return refs;
  }

  /* ═══════════════ CABLEAR LÓGICA DINÁMICA DE UN FORMULARIO ═══════════════ */
  function wireForm(benef, refs) {
    function recalc() {
      // Mientras se rehidrata (enhanceForm), los `change`/`input` que dispara la
      // restauración de valores NO deben sincronizar el modelo: el DOM está a medio
      // poblar y sobrescribiría campos aún no restaurados. Se hace un único sync al
      // final de enhanceForm.
      if (refs._rehydrating) {
        // Solo refrescar los derivados visibles (edad/semanas) sin tocar el modelo.
        var edadR = calcularEdad(refs.nacimiento.value);
        refs.edad.value = (edadR != null && edadR >= 0) ? (edadR + ' años') : '';
        var semR = semanasEntre(refs.fechaInicio.value, refs.fechaFin.value);
        refs.senioritySemanas.value = (semR != null) ? (semR + ' semanas') : '';
        return;
      }
      // Edad
      var edad = calcularEdad(refs.nacimiento.value);
      refs.edad.value = (edad != null && edad >= 0) ? (edad + ' años') : '';
      // Semanas antigüedad
      var sem = semanasEntre(refs.fechaInicio.value, refs.fechaFin.value);
      refs.senioritySemanas.value = (sem != null) ? (sem + ' semanas') : '';
      syncFromDOM(benef, refs);
      updateStatus(benef, refs);
      persist();
    }
    refs._recalc = recalc;

    // Edad + fecha de nacimiento
    ['input', 'change'].forEach(function (ev) {
      refs.nacimiento.addEventListener(ev, function () { clearError(refs.nacimiento); recalc(); });
    });

    // Sanitización numérica (documento y celular): sin puntos/espacios.
    [refs.numDoc, refs.celular].forEach(function (el) {
      el.addEventListener('input', function () {
        var clean = el.value.replace(/\D+/g, '');
        if (clean !== el.value) el.value = clean;
        clearError(el); recalc();
      });
    });
    // Textos e email limpian error al escribir.
    [refs.nombre1, refs.nombre2, refs.apellido1, refs.apellido2, refs.correo, refs.direccion].forEach(function (el) {
      el.addEventListener('input', function () { clearError(el); recalc(); });
    });
    // Selects base
    [refs.tipoDoc, refs.genero, refs.sexo, refs.parentesco, refs.eps, refs.entidad].forEach(function (el) {
      el.addEventListener('change', function () { clearError(el); recalc(); });
    });

    // ── Dirección: misma que el contratante (Sí/No) ──
    Array.prototype.forEach.call(refs.sameAddrRadios, function (r) {
      r.addEventListener('change', function () {
        var mismo = obtenerRadio(refs.sameAddrRadios) === 'si';
        refs.addrBlock.hidden = mismo;
        if (mismo) {
          // Copiar del Step 2; limpiar errores del bloque.
          clearError(refs.direccion); clearError(refs.departamento); clearError(refs.ciudad);
        } else if (!refs._rehydrating) {
          // Al revelar el bloque, llevar foco al primer campo y anunciarlo.
          focusEl(refs.direccion);
          announce('Agrega la dirección de residencia del beneficiario.');
        }
        recalc();
      });
    });

    // Departamento → ciudad dependiente
    refs.departamento.addEventListener('change', function () {
      clearError(refs.departamento);
      refs.poblarCiudades(refs.departamento.value, null);
      recalc();
    });

    // ── Plan complementario Compensar (Sí/No) ──
    Array.prototype.forEach.call(refs.fromPlanRadios, function (r) {
      r.addEventListener('change', function () {
        var si = obtenerRadio(refs.fromPlanRadios) === 'si';
        refs.planBlock.hidden = !si;
        refs.planSemanas.value = si ? (PLAN_MOCK_WEEKS + ' semanas') : '';
        recalc();
      });
    });

    // ── Convalida antigüedad (Sí/No) ──
    Array.prototype.forEach.call(refs.seniorityRadios, function (r) {
      r.addEventListener('change', function () {
        var si = obtenerRadio(refs.seniorityRadios) === 'si';
        refs.seniorityBlock.hidden = !si;
        if (!si) {
          // Ocultar y limpiar campos relacionados.
          clearError(refs.entidad); clearError(refs.fechaInicio); clearError(refs.fechaFin);
        } else if (!refs._rehydrating) {
          // Al revelar el bloque, llevar foco a la entidad (a su trigger si el
          // dropdown ya está mejorado) y anunciarlo.
          var ddHost = refs.entidad.closest('.zt-dropdown');
          var entTrigger = ddHost && ddHost.querySelector('.zt-dropdown__trigger');
          focusEl(entTrigger || refs.entidad);
          announce('Agrega la entidad y las fechas de la antigüedad a convalidar.');
        }
        recalc();
      });
    });

    // Fechas de antigüedad: recalcular semanas + validar orden.
    ['input', 'change'].forEach(function (ev) {
      refs.fechaInicio.addEventListener(ev, function () { clearError(refs.fechaInicio); validarFechasAntiguedad(refs); recalc(); });
      refs.fechaFin.addEventListener(ev, function () { clearError(refs.fechaFin); validarFechasAntiguedad(refs); recalc(); });
    });

    /* ── DOCUMENTO PRIMERO: Consultar / Cambiar documento ── */
    refs.consultBtn.addEventListener('click', function () { consultarDocumento(benef, refs); });
    refs.numDoc.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); consultarDocumento(benef, refs); }
    });
    refs.changeDocBtn.addEventListener('click', function () {
      benef.documentConsulted = false;
      aplicarVistaDocumento(benef, refs);
      recalc();
      var dd = refs.tipoDoc.closest('.zt-dropdown');
      focusEl((dd && dd.querySelector('.zt-dropdown__trigger')) || refs.tipoDoc);
      announce('Ingresa el nuevo documento y presiona Consultar.');
    });

    /* ── VALIDACIÓN ON-BLUR (feedback temprano por campo) ──
     * Al salir de un campo obligatorio se marca su error si está incompleto/incorrecto,
     * sin esperar a "Guardar y continuar". No valida durante la rehidratación. */
    function blurValida(el, fn) {
      el.addEventListener('blur', function () {
        if (refs._rehydrating) return;
        var msg = fn(el.value);
        if (msg) setError(el, true, msg); else clearError(el);
      });
    }
    var req = function (v) { return String(v || '').trim() ? null : 'Este campo es obligatorio.'; };
    var reqSel = function (v) { return v ? null : 'Selecciona una opción.'; };
    blurValida(refs.numDoc, function (v) {
      if (!String(v || '').trim()) return 'Este campo es obligatorio.';
      var dup = documentoDuplicado(benef);
      if (dup === 'contratante') return 'Este documento es el del contratante. Usa el switch de arriba para incluirlo.';
      if (dup === 'beneficiario') return 'Ya existe un beneficiario con este número de documento.';
      return null;
    });
    blurValida(refs.nombre1, req);
    blurValida(refs.apellido1, req);
    blurValida(refs.celular, function (v) {
      if (!String(v || '').trim()) return 'Este campo es obligatorio.';
      return /^\d{10}$/.test(v) ? null : 'Ingresa un número de celular válido (10 dígitos).';
    });
    blurValida(refs.correo, function (v) {
      if (!String(v || '').trim()) return 'Este campo es obligatorio.';
      return emailValido(String(v).trim()) ? null : 'Ingresa un correo electrónico válido.';
    });
    blurValida(refs.nacimiento, function (v) {
      if (!v) return 'Este campo es obligatorio.';
      if (calcularEdad(v) == null) return 'Ingresa una fecha válida.';
      if (new Date(v + 'T00:00:00') > new Date()) return 'La fecha no puede ser futura.';
      return null;
    });
    blurValida(refs.direccion, function (v) {
      // Solo obligatorio cuando NO usa la misma dirección del contratante.
      if (obtenerRadio(refs.sameAddrRadios) !== 'no') return null;
      return req(v);
    });
  }

  /* ═══════════════ DOCUMENTO PRIMERO ═══════════════ */
  var SHORT_TIPO = { CC: 'C.C.', TI: 'T.I.', RC: 'R.C.', CE: 'C.E.', PA: 'Pasaporte', PPT: 'PPT' };
  var FACT_LABELS = {
    gender: { mujer: 'Mujer', hombre: 'Hombre', 'no-binario': 'No binario', 'prefiere-no-responder': 'Prefiere no responder' },
    sex: { femenino: 'Femenino', masculino: 'Masculino', intersexual: 'Intersexual', otro: 'Otro' }
  };
  function fechaCorta(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : '—';
  }
  // Muestra entrada del documento o resultado de la consulta según el modelo.
  function aplicarVistaDocumento(benef, refs) {
    var ok = benef.documentConsulted === true;
    refs.docEntry.hidden = ok;
    refs.docFacts.hidden = !ok;
    refs.afterConsult.hidden = !ok;
    if (!ok) { refs.factsList.innerHTML = ''; return; }
    var edad = calcularEdad(refs.nacimiento.value);
    var items = [
      ['Nombre completo', nombreCompleto({
        firstName: refs.nombre1.value, secondName: refs.nombre2.value,
        firstSurname: refs.apellido1.value, secondSurname: refs.apellido2.value })],
      ['Documento', (SHORT_TIPO[refs.tipoDoc.value] || refs.tipoDoc.value) + ' ' + Z.formatDoc(refs.numDoc.value)],
      ['Fecha de nacimiento', fechaCorta(refs.nacimiento.value)],
      ['Edad', edad != null ? (edad + (edad === 1 ? ' año' : ' años')) : '—'],
      ['Género', FACT_LABELS.gender[refs.genero.value] || '—'],
      ['Sexo de identificación', FACT_LABELS.sex[refs.sexo.value] || '—']
    ];
    refs.factsList.innerHTML = items.map(function (it) {
      var full = it[0] === 'Nombre completo' ? ' p3-facts__item--wide'
               : it[0] === 'Documento' ? ' p3-facts__item--doc' : '';
      return '<div class="p3-facts__item' + full + '"><dt>' + it[0] + '</dt><dd></dd></div>';
    }).join('');
    // Valores como texto (no HTML) para evitar inyección.
    var dds = refs.factsList.querySelectorAll('dd');
    items.forEach(function (it, i) { dds[i].textContent = it[1]; });
  }
  // "Consultar": valida tipo + número (y duplicados), trae los datos (MOCK) y
  // revela el resto del formulario.
  function consultarDocumento(benef, refs) {
    var ok = true;
    if (!refs.tipoDoc.value) { setError(refs.tipoDoc, true, 'Selecciona una opción.'); ok = false; }
    var num = refs.numDoc.value.trim();
    if (!num) { setError(refs.numDoc, true, 'Este campo es obligatorio.'); ok = false; }
    else if (num.length < 5) { setError(refs.numDoc, true, 'Ingresa un número de documento válido.'); ok = false; }
    if (!ok) return;
    benef.documentNumber = num;
    var dup = documentoDuplicado(benef);
    if (dup === 'contratante') { setError(refs.numDoc, true, 'Este documento es el del contratante. Usa el switch de arriba para incluirlo.'); return; }
    if (dup === 'beneficiario') { setError(refs.numDoc, true, 'Ya existe un beneficiario con este número de documento.'); return; }
    clearError(refs.numDoc); clearError(refs.tipoDoc);

    // Estado de carga breve (simula el servicio).
    refs.consultBtn.classList.add('is-loading');
    refs.consultBtn.disabled = true;
    window.setTimeout(function () {
      refs.consultBtn.classList.remove('is-loading');
      refs.consultBtn.disabled = false;
      // ⚠️ MOCK — reemplazar por el servicio de consulta del documento.
      var persona = Z.personaMock(num);
      var datos = Z.datosDocumentoMock(num, refs.tipoDoc.value);
      refs.nombre1.value = persona.firstName;
      refs.nombre2.value = persona.secondName;
      refs.apellido1.value = persona.firstSurname;
      refs.apellido2.value = persona.secondSurname;
      refs.nacimiento.value = datos.birthDate;
      refs.genero.value = datos.gender;
      refs.sexo.value = datos.sex;
      benef.documentConsulted = true;
      aplicarVistaDocumento(benef, refs);
      refs._recalc();
      // Foco al primer campo a diligenciar (Parentesco).
      var dd = refs.parentesco.closest('.zt-dropdown');
      focusEl((dd && dd.querySelector('.zt-dropdown__trigger')) || refs.parentesco);
      announce('Datos del documento cargados: ' + nombreCompleto(persona) + '. Completa la información del beneficiario.');
    }, 500);
  }

  function obtenerRadio(nodeList) {
    for (var i = 0; i < nodeList.length; i++) if (nodeList[i].checked) return nodeList[i].value;
    return '';
  }
  function setRadio(nodeList, value) {
    Array.prototype.forEach.call(nodeList, function (r) { r.checked = (r.value === value); });
  }

  // ¿El número de documento choca con el contratante u otro beneficiario?
  // Solo compara documentos no vacíos y del mismo tipo o número igual.
  function documentoDuplicado(benef) {
    var num = String(benef.documentNumber || '').trim();
    if (!num) return null;
    // Contra el contratante (candidato del Step 2 / candidato).
    var contractorNum = String((candidate && candidate.documentNumber) || '').trim();
    if (contractorNum && num === contractorNum) return 'contratante';
    // Contra otros beneficiarios.
    for (var i = 0; i < state.beneficiaries.length; i++) {
      var other = state.beneficiaries[i];
      if (other.id === benef.id) continue;
      if (String(other.documentNumber || '').trim() === num) return 'beneficiario';
    }
    return null;
  }

  // Fecha fin >= fecha inicio (error inline si no).
  function validarFechasAntiguedad(refs) {
    var ini = refs.fechaInicio.value, fin = refs.fechaFin.value;
    if (ini && fin && semanasEntre(ini, fin) == null) {
      setError(refs.fechaFin, true, 'La fecha fin debe ser posterior a la fecha de inicio.');
      return false;
    }
    return true;
  }

  /* ═══════════════ SINCRONIZAR DOM → MODELO ═══════════════ */
  function syncFromDOM(benef, refs) {
    benef.documentType   = refs.tipoDoc.value;
    benef.documentNumber = refs.numDoc.value.trim();
    benef.firstName  = refs.nombre1.value.trim();
    benef.secondName = refs.nombre2.value.trim();
    benef.firstSurname  = refs.apellido1.value.trim();
    benef.secondSurname = refs.apellido2.value.trim();
    benef.birthDate = refs.nacimiento.value;
    benef.age = calcularEdad(refs.nacimiento.value);
    benef.gender = refs.genero.value;
    benef.identificationSex = refs.sexo.value;
    benef.relationship = refs.parentesco.value;
    benef.eps = refs.eps.value;
    benef.phone = refs.celular.value.trim();
    benef.email = refs.correo.value.trim();

    var sameAddr = obtenerRadio(refs.sameAddrRadios);
    benef.sameAddressAsContractor = (sameAddr === 'si') ? true : (sameAddr === 'no' ? false : null);
    if (benef.sameAddressAsContractor === true) {
      // Copiar internamente del Step 2 (no se piden campos).
      benef.address = step2.address || '';
      benef.department = step2.department || '';
      benef.city = step2.city || '';
    } else {
      benef.address = refs.direccion.value.trim();
      benef.department = refs.departamento.value;
      benef.city = refs.ciudad.value;
    }

    var fromPlan = obtenerRadio(refs.fromPlanRadios);
    benef.comesFromComplementaryPlan = (fromPlan === 'si') ? true : (fromPlan === 'no' ? false : null);
    benef.complementaryPlanWeeks = (benef.comesFromComplementaryPlan === true) ? PLAN_MOCK_WEEKS : null;

    var seniority = obtenerRadio(refs.seniorityRadios);
    benef.validatesOtherPrepaidSeniority = (seniority === 'si') ? true : (seniority === 'no' ? false : null);
    if (benef.validatesOtherPrepaidSeniority === true) {
      benef.previousPrepaidEntity = refs.entidad.value;
      benef.seniorityStartDate = refs.fechaInicio.value;
      benef.seniorityEndDate = refs.fechaFin.value;
      benef.seniorityWeeks = semanasEntre(refs.fechaInicio.value, refs.fechaFin.value);
    } else {
      benef.previousPrepaidEntity = '';
      benef.seniorityStartDate = '';
      benef.seniorityEndDate = '';
      benef.seniorityWeeks = null;
    }
  }

  /* ═══════════════ VALIDACIÓN DE UN BENEFICIARIO (obligatorios dinámicos) ═══════════════
   * Devuelve true si TODOS los obligatorios aplicables son válidos. `mark`=true
   * pinta errores inline (para "Guardar y continuar"); false solo evalúa (para status). */
  function validarBeneficiario(benef, refs, mark) {
    var ok = true;
    function fail(el, msg) { ok = false; if (mark) setError(el, true, msg); }
    function okField(el) { if (mark) clearError(el); }

    // A — Identificación: el documento debe estar CONSULTADO
    if (benef.documentConsulted !== true) {
      ok = false;
      if (mark) {
        if (!refs.tipoDoc.value) setError(refs.tipoDoc, true, 'Selecciona una opción.');
        setError(refs.numDoc, true, refs.numDoc.value.trim() ? 'Presiona "Consultar" para traer los datos del documento.' : 'Este campo es obligatorio.');
      }
      return false;
    }
    if (!refs.tipoDoc.value) fail(refs.tipoDoc, 'Selecciona una opción.'); else okField(refs.tipoDoc);
    if (!refs.numDoc.value.trim()) {
      fail(refs.numDoc, 'Este campo es obligatorio.');
    } else {
      var dup = documentoDuplicado(benef);
      if (dup === 'contratante') fail(refs.numDoc, 'Este documento es el del contratante. Usa el switch de arriba para incluirlo.');
      else if (dup === 'beneficiario') fail(refs.numDoc, 'Ya existe un beneficiario con este número de documento.');
      else okField(refs.numDoc);
    }
    if (!refs.nombre1.value.trim()) fail(refs.nombre1, 'Este campo es obligatorio.'); else okField(refs.nombre1);
    if (!refs.apellido1.value.trim()) fail(refs.apellido1, 'Este campo es obligatorio.'); else okField(refs.apellido1);

    // B — Datos personales
    if (!refs.nacimiento.value) fail(refs.nacimiento, 'Este campo es obligatorio.');
    else if (calcularEdad(refs.nacimiento.value) == null) fail(refs.nacimiento, 'Ingresa una fecha válida.');
    else if (new Date(refs.nacimiento.value + 'T00:00:00') > new Date()) fail(refs.nacimiento, 'La fecha no puede ser futura.');
    else okField(refs.nacimiento);
    if (!refs.genero.value) fail(refs.genero, 'Selecciona una opción.'); else okField(refs.genero);
    if (!refs.sexo.value) fail(refs.sexo, 'Selecciona una opción.'); else okField(refs.sexo);
    if (!refs.parentesco.value) fail(refs.parentesco, 'Selecciona una opción.'); else okField(refs.parentesco);
    if (!refs.eps.value) fail(refs.eps, 'Selecciona una opción.'); else okField(refs.eps);

    // C — Contacto
    if (!refs.celular.value.trim()) fail(refs.celular, 'Este campo es obligatorio.');
    else if (!/^\d{10}$/.test(refs.celular.value)) fail(refs.celular, 'Ingresa un número de celular válido (10 dígitos).');
    else okField(refs.celular);
    if (!refs.correo.value.trim()) fail(refs.correo, 'Este campo es obligatorio.');
    else if (!emailValido(refs.correo.value.trim())) fail(refs.correo, 'Ingresa un correo electrónico válido.');
    else okField(refs.correo);

    // D — Residencia (radio obligatorio; si "No", bloque obligatorio)
    var sameAddr = obtenerRadio(refs.sameAddrRadios);
    if (!sameAddr) { ok = false; }
    if (sameAddr === 'no') {
      if (!refs.direccion.value.trim()) fail(refs.direccion, 'Este campo es obligatorio.'); else okField(refs.direccion);
      if (!refs.departamento.value) fail(refs.departamento, 'Selecciona una opción.'); else okField(refs.departamento);
      if (!refs.ciudad.value) fail(refs.ciudad, 'Selecciona una opción.'); else okField(refs.ciudad);
    }

    // E — Condiciones adicionales (radios obligatorios)
    var fromPlan = obtenerRadio(refs.fromPlanRadios);
    if (!fromPlan) { ok = false; }
    var seniority = obtenerRadio(refs.seniorityRadios);
    if (!seniority) { ok = false; }
    if (seniority === 'si') {
      if (!refs.entidad.value) fail(refs.entidad, 'Selecciona una opción.'); else okField(refs.entidad);
      if (!refs.fechaInicio.value) fail(refs.fechaInicio, 'Este campo es obligatorio.'); else okField(refs.fechaInicio);
      if (!refs.fechaFin.value) fail(refs.fechaFin, 'Este campo es obligatorio.');
      else if (semanasEntre(refs.fechaInicio.value, refs.fechaFin.value) == null) fail(refs.fechaFin, 'La fecha fin debe ser posterior a la fecha de inicio.');
      else okField(refs.fechaFin);
    }

    return ok;
  }

  /* ═══════════════ ACTUALIZAR ESTADO (pending/complete) DE UNA CARD ═══════════════ */
  function updateStatus(benef, refs) {
    var completo = validarBeneficiario(benef, refs, false);
    benef.status = completo ? 'complete' : 'pending';
    var view = views[benef.id];
    if (view && view.card) {
      view.card.setStatus(benef.status);
      view.card.setHeader({
        name: nombreCompleto(benef),
        relationship: REL_LABEL[benef.relationship] || ''
      });
      // Microcopy de faltantes (solo se muestra colapsada + pendiente).
      view.card.setMissing(faltantesDe(benef));
    }
  }

  /* ═══════════════ RENDER DE LA LISTA COMPLETA ═══════════════ */
  function renderList() {
    listEl.innerHTML = '';
    views = {};
    state.beneficiaries.forEach(function (benef, i) {
      renderCard(benef, i + 1);
    });
    renumber();
  }

  // Renumera los títulos (Beneficiario 1..N) tras add/delete.
  function renumber() {
    state.beneficiaries.forEach(function (benef, i) {
      var view = views[benef.id];
      if (view && view.card) view.card.setHeader({ number: i + 1 });
    });
  }

  function renderCard(benef, number) {
    var refs = buildForm(benef);
    var expanded = (benef.id === expandedId);

    var card = ZTBenefCard.create({
      number: number,
      name: nombreCompleto(benef),
      relationship: REL_LABEL[benef.relationship] || '',
      status: benef.status || 'pending',
      expanded: expanded,
      missing: faltantesDe(benef),
      body: refs.form,
      onEdit: function () { openForEdit(benef.id); },
      onClose: function () { closeCard(benef.id); },
      onDelete: function () { confirmDelete(benef.id); }
    });

    listEl.appendChild(card.el);
    views[benef.id] = { card: card, refs: refs, enhanced: false };

    // Cablear lógica del formulario y (si expandida) mejorar componentes.
    wireForm(benef, refs);
    if (expanded) enhanceForm(benef);
  }

  /* Mejorar dropdowns/datepickers del formulario (solo al expandir para evitar
   * mejorar componentes ocultos). Restaura valores desde el modelo. */
  function enhanceForm(benef) {
    var view = views[benef.id];
    if (!view || view.enhanced) return;
    var refs = view.refs;

    // Guard: durante la restauración de valores, los eventos change/input que se
    // disparan NO deben sincronizar el modelo (evita que un campo aún no restaurado
    // sobrescriba con vacío otro ya restaurado). Se sincroniza una sola vez al final.
    refs._rehydrating = true;

    // Restaurar radios primero (afectan visibilidad de bloques).
    if (benef.sameAddressAsContractor === true) setRadio(refs.sameAddrRadios, 'si');
    else if (benef.sameAddressAsContractor === false) setRadio(refs.sameAddrRadios, 'no');
    refs.addrBlock.hidden = (benef.sameAddressAsContractor !== false);

    if (benef.comesFromComplementaryPlan === true) setRadio(refs.fromPlanRadios, 'si');
    else if (benef.comesFromComplementaryPlan === false) setRadio(refs.fromPlanRadios, 'no');
    refs.planBlock.hidden = (benef.comesFromComplementaryPlan !== true);

    if (benef.validatesOtherPrepaidSeniority === true) setRadio(refs.seniorityRadios, 'si');
    else if (benef.validatesOtherPrepaidSeniority === false) setRadio(refs.seniorityRadios, 'no');
    refs.seniorityBlock.hidden = (benef.validatesOtherPrepaidSeniority !== true);

    // Restaurar el departamento en el <select> nativo ANTES de poblar ciudades,
    // para que el trigger del dropdown muestre el valor correcto al mejorarse.
    if (benef.sameAddressAsContractor === false && benef.department) {
      refs.departamento.value = benef.department;
    }

    // Poblar ciudades del departamento guardado (mejora #ciudad con la ciudad previa).
    refs.poblarCiudades(
      (benef.sameAddressAsContractor === false ? benef.department : '') || '',
      (benef.sameAddressAsContractor === false ? benef.city : null) || null
    );

    // Mejorar los selects base y datepickers restantes (salta los ya mejorados).
    ZTDropdown.enhanceAll(refs.form);
    ZTDatePicker.enhanceAll(refs.form);

    // Restaurar valores de texto/select en el DOM.
    setVal(refs.tipoDoc, benef.documentType);
    refs.numDoc.value = benef.documentNumber || '';
    refs.nombre1.value = benef.firstName || '';
    refs.nombre2.value = benef.secondName || '';
    refs.apellido1.value = benef.firstSurname || '';
    refs.apellido2.value = benef.secondSurname || '';
    if (benef.birthDate) { refs.nacimiento.value = benef.birthDate; refs.nacimiento.dispatchEvent(new Event('change', { bubbles: true })); }
    setVal(refs.genero, benef.gender);
    setVal(refs.sexo, benef.identificationSex);
    setVal(refs.parentesco, benef.relationship);
    setVal(refs.eps, benef.eps);
    refs.celular.value = benef.phone || '';
    refs.correo.value = benef.email || '';
    if (benef.sameAddressAsContractor === false) refs.direccion.value = benef.address || '';
    setVal(refs.entidad, benef.previousPrepaidEntity);
    if (benef.seniorityStartDate) { refs.fechaInicio.value = benef.seniorityStartDate; refs.fechaInicio.dispatchEvent(new Event('change', { bubbles: true })); }
    if (benef.seniorityEndDate) { refs.fechaFin.value = benef.seniorityEndDate; refs.fechaFin.dispatchEvent(new Event('change', { bubbles: true })); }
    if (benef.comesFromComplementaryPlan === true) refs.planSemanas.value = PLAN_MOCK_WEEKS + ' semanas';

    // Documento primero: compat con beneficiarios guardados antes del cambio
    // (tenían nombre y fecha diligenciados a mano → se consideran consultados).
    if (benef.documentConsulted == null && benef.firstName && benef.birthDate) benef.documentConsulted = true;
    aplicarVistaDocumento(benef, refs);

    view.enhanced = true;
    // Fin de la rehidratación: ahora sí se permite sincronizar el modelo.
    refs._rehydrating = false;
    // Un único recálculo real: derivados (edad, semanas), sync y estado.
    refs._recalc();
  }
  function setVal(sel, val) {
    if (!val) return;
    sel.value = val;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Primer control visible y enfocable (trigger del dropdown si está mejorado).
  function primerCampoVisible(form) {
    var list = form.querySelectorAll('.zt-dropdown__trigger, .zt-datefield__trigger, input:not([type=hidden]), select, textarea, button');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.offsetParent !== null && !el.disabled) return el;
    }
    return null;
  }

  /* ═══════════════ ABRIR/CERRAR/AGREGAR/ELIMINAR ═══════════════ */
  // Solo UNA card expandida: al abrir una, colapsar las demás (re-render).
  function openForEdit(id) {
    if (expandedId && expandedId !== id) {
      // guardar/sincronizar lo que había antes de colapsar
      var prevView = views[expandedId];
      if (prevView) { syncFromDOM(findBenef(expandedId), prevView.refs); updateStatus(findBenef(expandedId), prevView.refs); }
    }
    expandedId = id;
    persist();
    renderList();
    scrollToCard(id, 'start');
    // Foco al primer campo del formulario para editar sin buscar con el mouse.
    var view = views[id];
    if (view && view.refs) {
      var firstField = primerCampoVisible(view.refs.form);
      focusEl(firstField);
    }
  }
  function closeCard(id) {
    var view = views[id];
    if (view) { syncFromDOM(findBenef(id), view.refs); updateStatus(findBenef(id), view.refs); }
    if (expandedId === id) expandedId = null;
    persist();
    renderList();
    scrollToCard(id, 'nearest');
    // Devolver el foco al botón "Editar" de la card que se acaba de colapsar.
    var v2 = views[id];
    if (v2 && v2.card) focusEl(v2.card.getToggleBtn());
    var benef = findBenef(id);
    announce(tituloBenef(benef) + (benef && benef.status === 'complete' ? ' guardado como completo.' : ' guardado como pendiente.'));
  }
  function addBeneficiary() {
    // Sincronizar el que estaba abierto antes de colapsarlo.
    if (expandedId) {
      var prevView = views[expandedId];
      if (prevView) { syncFromDOM(findBenef(expandedId), prevView.refs); updateStatus(findBenef(expandedId), prevView.refs); }
    }
    var benef = { id: uid(), status: 'pending' };
    state.beneficiaries.push(benef);
    expandedId = benef.id;
    persist();
    renderList();
    scrollToCard(benef.id, 'start');
    ZTAlert.clear(alertEl);
    // Foco al primer campo del nuevo beneficiario + anuncio.
    var view = views[benef.id];
    if (view && view.refs) {
      var firstField = primerCampoVisible(view.refs.form);
      focusEl(firstField);
    }
    announce('Beneficiario ' + state.beneficiaries.length + ' agregado. Completa su información.');
  }
  function confirmDelete(id) {
    var benef = findBenef(id);
    ZTModal.open({
      type: 'warning',
      title: '¿Eliminar a ' + tituloBenef(benef) + '?',
      body: 'Esta acción eliminará la información registrada para esta persona.',
      secondaryAction: { label: 'Cancelar', onClick: function () {
        ZTModal.close();
        // Devolver foco al botón que abrió el diálogo (Eliminar de esa card).
        var v = views[id]; if (v && v.card) focusEl(v.card.getDeleteBtn());
      } },
      primaryAction: { label: 'Eliminar', onClick: function () { ZTModal.close(); doDelete(id); } }
    });
  }
  function doDelete(id) {
    var idx = indexOfBenef(id);
    if (idx === -1) return;
    var eliminado = tituloBenef(state.beneficiaries[idx]);
    state.beneficiaries.splice(idx, 1);
    if (expandedId === id) expandedId = null;
    persist();
    renderList();
    ZTAlert.clear(alertEl);
    announce(eliminado + ' eliminado.');
    // Reubicar el foco tras borrar (el botón desapareció): a la siguiente card,
    // o al botón "Agregar beneficiario" si la lista quedó vacía.
    var next = state.beneficiaries[idx] || state.beneficiaries[idx - 1];
    if (next && views[next.id] && views[next.id].card) {
      focusEl(views[next.id].card.getToggleBtn());
    } else {
      focusEl(addBtn);
    }
  }
  function scrollToCard(id, block) {
    var view = views[id];
    if (view && view.card && view.card.el.scrollIntoView) {
      view.card.el.scrollIntoView({ behavior: scrollBehavior(), block: block || 'nearest' });
    }
  }

  addBtn.addEventListener('click', addBeneficiary);

  /* ═══════════════ PERSISTENCIA (modelo ÚNICO Step 3) ═══════════════ */
  function persist() {
    Z.saveStep3({
      completed: state.completed,
      contractorIsBeneficiary: state.contractorIsBeneficiary,
      beneficiaries: state.beneficiaries,
      contractorValidatesSeniority: state.contractorIsBeneficiary && !F.isInclusion && state.contractorValidatesSeniority,
      contractorPreviousEntity: state.contractorPreviousEntity,
      contractorSeniorityStart: state.contractorSeniorityStart,
      contractorSeniorityEnd: state.contractorSeniorityEnd,
      contractorSeniorityWeeks: state.contractorSeniorityWeeks
    });
  }

  /* ═══════════════ CONTINUAR (bloqueo por pendientes / sin beneficiarios) ═══════════════ */
  nextBtn.addEventListener('click', function () {
    if (tryComplete()) window.location.href = '../paso-4/index.html';
  });
  // Panel de pasos: solo se cambia de paso si el Paso 3 queda completo.
  Z.setLeaveGuard(function (nav) {
    if (nav.forward) return tryComplete();
    // Hacia atrás: guardar lo diligenciado sin exigir que el paso esté completo.
    if (expandedId) { var v = views[expandedId]; if (v) { syncFromDOM(findBenef(expandedId), v.refs); updateStatus(findBenef(expandedId), v.refs); } }
    csSync(); persist();
    return true;
  });

  /* Valida todo el paso (reglas del flujo, antigüedad del contratante y
   * beneficiarios). Si está bien lo marca completo y devuelve true. */
  function tryComplete() {
    // Sincronizar la card abierta y validar TODOS los beneficiarios (marcando errores).
    if (expandedId) {
      var v = views[expandedId];
      if (v) { syncFromDOM(findBenef(expandedId), v.refs); }
    }

    // Recalcular estado de cada beneficiario. Para los expandidos se marcan errores.
    var primerPendiente = null;
    state.beneficiaries.forEach(function (benef) {
      var view = views[benef.id];
      var refs = view && view.refs;
      var completo;
      if (refs && view.enhanced) {
        completo = validarBeneficiario(benef, refs, benef.id === expandedId);
      } else {
        // Card colapsada: revalidar contra el modelo (sin DOM) recreando refs no es
        // necesario; usamos el status ya calculado al cerrarla.
        completo = benef.status === 'complete';
      }
      benef.status = completo ? 'complete' : 'pending';
      if (view && view.card) view.card.setStatus(benef.status);
      if (!completo && !primerPendiente) primerPendiente = benef.id;
    });

    // Inclusión / contratante no beneficiario → al menos un beneficiario.
    if (state.beneficiaries.length === 0 && (F.isInclusion || F.isFamiliar || !state.contractorIsBeneficiary)) {
      ZTAlert.render(alertEl, {
        type: 'warning',
        title: 'Agrega al menos un beneficiario',
        description: F.isInclusion ? 'En una inclusión debes agregar al menos un beneficiario nuevo.'
          : F.isFamiliar ? 'La afiliación familiar requiere al menos un beneficiario. Si solo se afilia el contratante, cambia la modalidad a Individual en el Paso 1.'
          : 'Debes agregar al menos un beneficiario al plan.'
      });
      focusEl(addBtn);
      return false;
    }
    // Antigüedad del contratante (si respondió Sí).
    var csFirst = csValidate(true);
    if (csFirst) {
      ZTAlert.render(alertEl, { type: 'warning', title: 'Falta la antigüedad del contratante', description: 'Completa la entidad anterior y las fechas de la antigüedad a convalidar.' });
      var h = csFirst.closest('.zt-dropdown') || csFirst.closest('.zt-datefield');
      var tgt = (h && h.querySelector('.zt-dropdown__trigger, .zt-datefield__trigger')) || csFirst;
      tgt.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
      try { tgt.focus({ preventScroll: true }); } catch (e) { tgt.focus(); }
      return false;
    }

    // Beneficiarios pendientes → no continuar; enfocar el primero.
    if (primerPendiente) {
      ZTAlert.render(alertEl, {
        type: 'warning',
        title: 'Hay beneficiarios sin completar',
        description: 'Completa la información de todos los beneficiarios antes de continuar.'
      });
      // Asegurar que el pendiente esté expandido; marcar sus errores y enfocar el
      // primer campo inválido para que el usuario sepa exactamente qué corregir.
      if (expandedId !== primerPendiente) { openForEdit(primerPendiente); }
      else { scrollToCard(primerPendiente, 'start'); }
      var pv = views[primerPendiente];
      if (pv && pv.enhanced) {
        validarBeneficiario(findBenef(primerPendiente), pv.refs, true);
        focusPrimerError(pv.refs);
      }
      return false;
    }

    // Todo válido → marcar Paso 3 completo.
    state.completed = true;
    persist();
    return true;
  }

  /* ═══════════════ ATRÁS (volver al OTP / cierre del Paso 2, sin perder datos) ═══════════════ */
  backBtn.addEventListener('click', function () {
    if (expandedId) {
      var v = views[expandedId];
      if (v) { syncFromDOM(findBenef(expandedId), v.refs); updateStatus(findBenef(expandedId), v.refs); }
    }
    persist();   // conservar beneficiarios y switch
    window.location.href = '../paso-2/validacion-informacion/index.html';
  });

  /* ═══════════════ RENDER INICIAL ═══════════════ */
  renderSeniority();
  renderList();
})();
