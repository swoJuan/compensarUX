/* ============================================================
 * paso-6.js — PASO 6 "Sarlaft — Conocimiento del cliente" (ZT)
 * ------------------------------------------------------------
 * Tres escenarios del Figma en UNA pantalla que se adapta:
 *   · Persona natural – Empleado        (252:22332) → + datos laborales
 *   · Persona natural – Independiente   (252:22528) → solo actividad + CIIU
 *   · Persona jurídica                  (252:22714) → empresa, representante
 *                                                     legal, socios, otros detalles
 *
 * Reducción de carga visual (vs. Figma):
 *   - Tipo de persona como 2 tarjetas grandes (decisión principal del paso).
 *   - "Información personal": lo que ya conocemos (Pasos 1–2) se muestra como
 *     INFORMACIÓN no editable (etiqueta/valor); solo se piden lugar y fecha de
 *     expedición del documento.
 *   - Revelado progresivo: datos laborales solo si es Empleado; CIIU solo para
 *     actividades productivas; "¿Cuál?" solo si elige "Otra"; tipo de operación
 *     solo si realiza operaciones en moneda extranjera.
 *   - Residencia y empresa PRELLENADAS desde los Pasos 1–2 (editables).
 *   - Preguntas Sí/No (PEP, recursos públicos, etc.) en filas compactas con
 *     "No" por defecto; "Sí" se resalta (mismo patrón del Paso 4).
 *   - Socios: Sí/No en lugar de selects; máx. MAX_PARTNERS filas; total de %.
 *
 * Al continuar (formulario válido) se abre el modal "Declaración voluntaria de
 * origen de fondos" (Figma 253:25302) con los datos reales del cliente en lugar
 * de los marcadores del Figma. El ASESOR la lee en voz alta al cliente (indicación
 * arriba) y marca "Leí la declaración al cliente y la aceptó", que habilita
 * "Aceptar". "Aceptar" registra la aceptación y avanza;
 * cerrar (X / Esc) vuelve al formulario sin completar el paso.
 *
 * Persistencia: step6 = { completed, personType, values{}, partners[],
 *                         originFundsAcceptedAt }.
 * ⚠️ Catálogos (CIIU, ciudades, actividades) son MOCK de prototipo.
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
  var step5 = Z.getStep5();
  if (!step5 || step5.completed !== true) { window.location.replace('../paso-5/index.html'); return; }

  var candidate = Z.getCandidate();
  var MAX_PARTNERS = 5;

  /* ═══════════════ CATÁLOGOS (MOCK) ═══════════════ */
  function opts(list) { return list.map(function (x) { return typeof x === 'string' ? { value: slug(x), label: x } : x; }); }
  function slug(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  var CIUDADES = opts(['Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena', 'Pereira',
    'Manizales', 'Ibagué', 'Villavicencio', 'Soacha', 'Chía', 'Palmira', 'Envigado']);
  var ACTIVIDADES = [
    { value: 'empleado', label: 'Empleado' },
    { value: 'independiente', label: 'Independiente' },
    { value: 'pensionado', label: 'Pensionado' },
    { value: 'rentista', label: 'Rentista de capital' },
    { value: 'estudiante', label: 'Estudiante' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'otra', label: 'Otra' }
  ];
  var CON_CIIU = { empleado: 1, independiente: 1, rentista: 1, otra: 1 };
  var ACTIVIDADES_EMPRESA = opts(['Comercial', 'Industrial', 'Servicios', 'Financiera', 'Agropecuaria', { value: 'otra', label: 'Otra' }]);
  var TIPOS_EMPRESA = opts(['Privada', 'Pública', 'Mixta', 'Sin ánimo de lucro']);
  var CIIU = [
    { value: '0111', label: '0111 · Cultivo de cereales' },
    { value: '4711', label: '4711 · Comercio al por menor en establecimientos no especializados' },
    { value: '4921', label: '4921 · Transporte de pasajeros' },
    { value: '5611', label: '5611 · Expendio a la mesa de comidas preparadas' },
    { value: '6201', label: '6201 · Desarrollo de sistemas informáticos' },
    { value: '6910', label: '6910 · Actividades jurídicas' },
    { value: '7020', label: '7020 · Actividades de consultoría de gestión' },
    { value: '8511', label: '8511 · Educación de la primera infancia' },
    { value: '8621', label: '8621 · Actividades de la práctica médica' },
    { value: '8299', label: '8299 · Otras actividades de servicio de apoyo a las empresas' }
  ];
  var TIPOS_DOC = [
    { value: 'CC', label: 'Cédula de ciudadanía' }, { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'PA', label: 'Pasaporte' }, { value: 'PPT', label: 'Permiso por Protección Temporal' },
    { value: 'NIT', label: 'NIT' }
  ];
  var OPERACIONES = [
    { value: 'importacion', label: 'Importación' }, { value: 'exportacion', label: 'Exportación' },
    { value: 'inversiones', label: 'Inversiones' }, { value: 'prestamos', label: 'Préstamos' },
    { value: 'pago-servicio', label: 'Pago de servicio' }, { value: 'otra', label: 'Otra' }
  ];
  var PEP_NATURAL = [
    { key: 'pep.publicServant',     label: '¿Es funcionario público?' },
    { key: 'pep.publicResources',   label: '¿Administra recursos públicos?' },
    { key: 'pep.publicRecognition', label: '¿Es reconocido públicamente?' },
    { key: 'pep.foreignOps',        label: '¿Realiza operaciones en moneda extranjera?' },
    { key: 'pep.foreignAccounts',   label: '¿Posee cuentas en el exterior?' }
  ];
  var PEP_EMPRESA = [
    { key: 'co.foreignOps',      label: '¿La empresa realiza operaciones en moneda extranjera?' },
    { key: 'co.foreignAccounts', label: '¿La empresa posee cuentas en el exterior?' }
  ];
  var PEP_SOCIO = [
    { key: 'publicServant',     label: '¿Es funcionario público?' },
    { key: 'publicResources',   label: '¿Administra recursos públicos?' },
    { key: 'publicRecognition', label: '¿Es reconocido públicamente?' }
  ];

  /* ─────────── Panel lateral ─────────── */
  ZTPersonSummary.render(document.getElementById('pa-cand-summary'), {
    eyebrow: 'Persona a afiliar', variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '', documentType: candidate.documentType, documentNumber: candidate.documentNumber
  });
  ZTStepper.render(document.getElementById('pa-stepper'), Z.stepperConfig(6));   // pasos completados clicables

  /* ═══════════════ ESTADO (con prellenado desde Pasos 1–2) ═══════════════ */
  var saved = Z.getStep6() || {};
  var ciudadP2 = (step2.city || '').replace(/-d-c$/, '');   // 'bogota-d-c' → 'bogota'
  var state = {
    completed: saved.completed === true,
    originFundsAcceptedAt: saved.originFundsAcceptedAt || null,
    // Persona jurídica solo cuando el contrato es de una empresa (Colectivo). Quien
    // se afilia "a través de una empresa" es su empleado → persona natural.
    personType: saved.personType || (Z.flow().isColectivo ? 'juridica' : 'natural'),
    values: Object.assign(step1.affiliationChannel === 'company' && !Z.flow().isColectivo ? {
      // Empleado de la empresa del Paso 1: se prellena la actividad y el empleador.
      activity: 'empleado',
      'emp.name': step1.companyName || ''
    } : {}, {
      'res.address': step2.address || '',
      'res.city': CIUDADES.some(function (c) { return c.value === step2.city; }) ? step2.city : (ciudadP2 === 'bogota' ? 'bogota-d-c' : ''),
      'res.phone': step2.phone || '',
      'co.name': step1.companyName || '',
      'co.nit': step1.nit || ''
    }, saved.values || {}),
    partners: Array.isArray(saved.partners) && saved.partners.length ? saved.partners : [{}]
  };
  // Sí/No: por defecto "No".
  PEP_NATURAL.concat(PEP_EMPRESA).forEach(function (q) { if (!state.values[q.key]) state.values[q.key] = 'no'; });
  state.partners.forEach(function (p) { PEP_SOCIO.forEach(function (q) { if (!p[q.key]) p[q.key] = 'no'; }); });

  function persist() {
    Z.saveStep6({ completed: state.completed, personType: state.personType, values: state.values,
      partners: state.partners, originFundsAcceptedAt: state.originFundsAcceptedAt || null });
  }
  var V = state.values;

  /* ═══════════════ HELPERS DE PLANTILLA ═══════════════ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayISO() {
    var h = new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  }
  function fid(key, idx) { return 'p6-' + key.replace(/\./g, '-') + (idx != null ? '-' + idx : ''); }
  function dataAttr(key, idx) { return idx != null ? ' data-pkey="' + key + '" data-pidx="' + idx + '"' : ' data-key="' + key + '"'; }
  function getVal(key, idx) { return idx != null ? (state.partners[idx][key] || '') : (V[key] || ''); }

  /* Campo de formulario (componentes del DS). spec: {key,label,type,options,opt,full,ph,inputmode,max,help} */
  function field(spec, idx) {
    var id = fid(spec.key, idx), val = getVal(spec.key, idx);
    var req = !spec.opt;
    var label = '<label class="mp-input-label" for="' + id + '">' +
      (req ? '<span class="mp-input-required" aria-hidden="true">*</span> ' : '') + esc(spec.label) +
      (spec.opt ? ' <span class="p6-opt">(opcional)</span>' : '') + '</label>';
    var ctrl;
    var common = ' id="' + id + '"' + dataAttr(spec.key, idx) + (req ? ' data-req="1" aria-required="true"' : '') +
      ' aria-describedby="' + id + '-error' + (spec.help ? ' ' + id + '-help' : '') + '"';
    if (spec.type === 'select') {
      ctrl = '<select class="mp-input-field mp-select"' + common + ' data-zt-dropdown' +
        (spec.options.length >= 8 ? '' : ' data-zt-dropdown-search="false"') + '>' +
        '<option value="" disabled' + (val ? '' : ' selected') + '>Seleccionar</option>' +
        spec.options.map(function (o) {
          return '<option value="' + esc(o.value) + '"' + (o.value === val ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select>';
    } else if (spec.type === 'date') {
      ctrl = '<input class="mp-input-field" type="date"' + common + ' data-zt-datepicker max="' + todayISO() + '" placeholder="dd/mm/aaaa" value="' + esc(val) + '">';
    } else {
      ctrl = '<input class="mp-input-field" type="text"' + common + ' autocomplete="off" placeholder="' + esc(spec.ph || 'Escribir') + '"' +
        (spec.inputmode ? ' inputmode="' + spec.inputmode + '"' : '') + (spec.max ? ' maxlength="' + spec.max + '"' : '') +
        ' value="' + esc(val) + '">';
    }
    return '<div class="mp-input-group' + (spec.full ? ' p6-full' : '') + '">' + label +
      '<div class="mp-input-wrapper">' + ctrl + '</div>' +
      (spec.help ? '<p class="mp-hint" id="' + id + '-help">' + esc(spec.help) + '</p>' : '') +
      '<p class="mp-input-error" id="' + id + '-error" role="alert" hidden>' + (spec.type === 'select' ? 'Selecciona una opción.' : 'Este campo es obligatorio.') + '</p>' +
    '</div>';
  }
  function grid(fields, idx) { return '<div class="p6-grid">' + fields.map(function (f) { return field(f, idx); }).join('') + '</div>'; }

  function radioHTML(name, value, label, checked, extra) {
    return '<label class="mp-choice mp-radio">' +
      '<span class="mp-choice__field">' +
        '<input class="mp-choice__input" type="radio" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + (extra || '') + '>' +
        '<span class="mp-choice__control"></span>' +
      '</span>' +
      '<span class="mp-choice__text"><span class="mp-choice__label">' + label + '</span></span>' +
    '</label>';
  }
  /* Fila Sí/No compacta; "Sí" se resalta. */
  function yesNo(q, idx) {
    var val = getVal(q.key, idx) === 'si' ? 'si' : 'no';
    var name = fid(q.key, idx), labelId = name + '-label';
    var attr = dataAttr(q.key, idx);
    return '<div class="p6-q' + (val === 'si' ? ' is-yes' : '') + '">' +
      '<p class="p6-q__text" id="' + labelId + '">' + esc(q.label) + '</p>' +
      '<div class="p6-q__opts" role="radiogroup" aria-labelledby="' + labelId + '">' +
        radioHTML(name, 'si', 'Sí', val === 'si', attr) +
        radioHTML(name, 'no', 'No', val !== 'si', attr) +
      '</div>' +
    '</div>';
  }

  function section(key, icon, title, body, hint) {
    return '<section class="p6-section" data-section="' + key + '" aria-labelledby="p6-sec-' + key + '">' +
      '<div class="p6-section__head">' +
        '<span class="icon ' + icon + ' icon-24 gs-inherit" aria-hidden="true"></span>' +
        '<div><h3 class="p6-section__title" id="p6-sec-' + key + '">' + title + '</h3>' +
        (hint ? '<p class="p6-section__hint">' + hint + '</p>' : '') + '</div>' +
      '</div>' +
      '<div class="p6-section__body">' + body + '</div>' +
    '</section>';
  }
  function subTitle(t) { return '<p class="p6-sub">' + t + '</p>'; }

  /* ═══════════════ BLOQUES ═══════════════ */
  function personTypeHTML() {
    function card(value, icon, title, desc) {
      var on = state.personType === value;
      return '<label class="p6-type' + (on ? ' is-active' : '') + '">' +
        '<input class="p6-type__input" type="radio" name="personType" value="' + value + '"' + (on ? ' checked' : '') + ' data-key="personType">' +
        '<span class="p6-type__icon icon ' + icon + ' icon-24 gs-inherit" aria-hidden="true"></span>' +
        '<span class="p6-type__text"><span class="p6-type__title">' + title + '</span><span class="p6-type__desc">' + desc + '</span></span>' +
        '<span class="p6-type__check icon icon-check-circle icon-20 gs-inherit" aria-hidden="true"></span>' +
      '</label>';
    }
    return '<fieldset class="p6-types"><legend class="p6-types__legend">¿Quién es el cliente?</legend>' +
      '<div class="p6-types__grid">' +
        card('natural', 'icon-user', 'Persona natural', 'Empleado, independiente, pensionado…') +
        card('juridica', 'icon-building', 'Persona jurídica', 'Empresa: representante legal y socios') +
      '</div></fieldset>';
  }

  function factsHTML() {
    var tipoLabel = { CC: 'C.C.', TI: 'T.I.', CE: 'C.E.', PA: 'Pasaporte', PPT: 'PPT' };
    var p = String(step2.birthDate || '').split('-');
    var TX = { 'new': 'Vinculación inicial', inclusion: 'Inclusión de beneficiario', novelty: 'Novedad' };
    var items = [
      ['Nombre completo', candidate.name || '—', true],
      ['Documento', (tipoLabel[candidate.documentType] || candidate.documentType) + ' ' + Z.formatDoc(candidate.documentNumber)],
      ['Fecha de nacimiento', p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'],
      ['Edad', step2.age != null ? step2.age + ' años' : '—'],
      ['Clase de vinculación', 'Cliente'],
      ['Producto / servicio', 'Medicina Prepagada'],
      ['Información de vinculación', TX[step1.transactionType] || 'Vinculación inicial']
    ];
    return '<div class="p6-facts">' +
      '<p class="p6-facts__title"><span class="icon icon-lock-simple icon-16 gs-inherit" aria-hidden="true"></span>Datos registrados · no editables</p>' +
      '<dl class="p6-facts__list">' + items.map(function (it) {
        return '<div class="p6-facts__item' + (it[2] ? ' is-wide' : '') + '"><dt>' + it[0] + '</dt><dd>' + esc(it[1]) + '</dd></div>';
      }).join('') + '</dl>' +
    '</div>';
  }

  function operationHTML(visibleKey) {
    if (V[visibleKey] !== 'si') return '';
    var name = 'p6-opType';
    return '<fieldset class="p6-ops">' +
      '<legend class="mp-input-label"><span class="mp-input-required" aria-hidden="true">*</span> Tipo de operación en moneda extranjera</legend>' +
      '<div class="p6-ops__list" role="radiogroup" data-req-radio="opType">' +
        OPERACIONES.map(function (o) {
          return '<label class="p6-chip' + (V.opType === o.value ? ' is-active' : '') + '">' +
            '<input type="radio" name="' + name + '" value="' + o.value + '" data-key="opType"' + (V.opType === o.value ? ' checked' : '') + '>' +
            '<span>' + o.label + '</span></label>';
        }).join('') +
      '</div>' +
      (V.opType === 'otra' ? '<div class="p6-grid p6-ops__other">' + field({ key: 'opOther', label: '¿Cuál operación?', type: 'text', full: true }) + '</div>' : '') +
      '<p class="mp-input-error" id="p6-opType-error" role="alert" hidden>Selecciona el tipo de operación.</p>' +
    '</fieldset>';
  }

  function naturalHTML() {
    var act = V.activity;
    var actFields = [{ key: 'activity', label: 'Actividad económica', type: 'select', options: ACTIVIDADES }];
    if (act === 'otra') actFields.push({ key: 'activityOther', label: '¿Cuál?', type: 'text' });
    if (CON_CIIU[act]) actFields.push({ key: 'ciiu', label: 'Código CIIU', type: 'select', options: CIIU, full: act !== 'otra' ? false : true });
    var body = grid(actFields);
    if (act === 'empleado') {
      body += subTitle('Datos laborales') + grid([
        { key: 'emp.name', label: 'Nombre de la empresa donde trabaja', type: 'text', full: true },
        { key: 'emp.area', label: 'Área o proceso', type: 'text' },
        { key: 'emp.role', label: 'Cargo', type: 'text' },
        { key: 'emp.city', label: 'Ciudad de la empresa', type: 'select', options: CIUDADES },
        { key: 'emp.address', label: 'Dirección de la empresa', type: 'text' },
        { key: 'emp.phone', label: 'Teléfono de la empresa', type: 'text', inputmode: 'numeric', max: 10 }
      ]);
    }
    body += subTitle('Residencia') +
      '<p class="p6-note"><span class="icon icon-info icon-16 gs-inherit" aria-hidden="true"></span>Tomados de "Datos del contratante". Ajusta solo si cambiaron.</p>' +
      grid([
        { key: 'res.address', label: 'Dirección de residencia', type: 'text', full: true },
        { key: 'res.city', label: 'Ciudad de residencia', type: 'select', options: CIUDADES },
        { key: 'res.phone', label: 'Teléfono / celular de residencia', type: 'text', inputmode: 'numeric', max: 10 }
      ]);
    var html = section('activity', 'icon-chart-bar', 'Actividad económica', body,
      act ? '' : 'Elige la actividad para ver los campos que aplican.');
    html += section('pep', 'icon-shield-check', 'Preguntas adicionales',
      '<div class="p6-qs">' + PEP_NATURAL.map(function (q) { return yesNo(q); }).join('') + '</div>' + operationHTML('pep.foreignOps'),
      'Todas inician en <strong>No</strong>. Marca <strong>Sí</strong> solo si el cliente lo confirma.');
    return html;
  }

  function partnerHTML(p, i) {
    return '<div class="p6-partner" data-partner="' + i + '">' +
      '<div class="p6-partner__head">' +
        '<p class="p6-partner__title">Socio o accionista ' + (i + 1) + '</p>' +
        (state.partners.length > 1 ? '<button type="button" class="p6-link-btn p6-link-btn--danger" data-action="del-partner" data-idx="' + i + '">Eliminar</button>' : '') +
      '</div>' +
      grid([
        { key: 'docType', label: 'Tipo de ID', type: 'select', options: TIPOS_DOC },
        { key: 'docNumber', label: 'Número de ID', type: 'text', inputmode: 'numeric', max: 15 },
        { key: 'name', label: 'Nombre o razón social', type: 'text' },
        { key: 'share', label: '% de participación', type: 'text', inputmode: 'decimal', max: 5, ph: 'Ej. 50' }
      ], i) +
      '<div class="p6-qs p6-qs--compact">' + PEP_SOCIO.map(function (q) { return yesNo(q, i); }).join('') + '</div>' +
    '</div>';
  }
  function totalShare() {
    return state.partners.reduce(function (s, p) { var n = parseFloat(String(p.share || '').replace(',', '.')); return s + (isNaN(n) ? 0 : n); }, 0);
  }
  function shareSummaryHTML() {
    var t = totalShare();
    var over = t > 100;
    return '<p class="p6-total' + (over ? ' is-error' : '') + '" id="p6-total">' +
      'Participación registrada: <strong>' + (Math.round(t * 100) / 100) + '%</strong>' +
      (over ? ' · no puede superar el 100%' : '') + '</p>';
  }

  function juridicaHTML() {
    var html = section('company', 'icon-building', 'Información de la empresa', grid([
      { key: 'co.name', label: 'Razón o denominación social', type: 'text' },
      { key: 'co.nit', label: 'NIT', type: 'text', inputmode: 'numeric', max: 15, help: 'Sin puntos, guiones ni dígito de verificación' }
    ]), step1.affiliationChannel === 'company' ? 'Prellenado con los datos del Paso 1.' : '');
    html += section('rep', 'icon-user', 'Representante legal', grid([
      { key: 'rep.names', label: 'Nombres', type: 'text', full: true },
      { key: 'rep.surname1', label: 'Primer apellido', type: 'text' },
      { key: 'rep.surname2', label: 'Segundo apellido', type: 'text', opt: true },
      { key: 'rep.docType', label: 'Tipo de documento', type: 'select', options: TIPOS_DOC.filter(function (d) { return d.value !== 'NIT'; }) },
      { key: 'rep.docNumber', label: 'Número de documento', type: 'text', inputmode: 'numeric', max: 15 },
      { key: 'rep.expPlace', label: 'Lugar de expedición', type: 'select', options: CIUDADES },
      { key: 'rep.expDate', label: 'Fecha de expedición', type: 'date' },
      { key: 'rep.address', label: 'Dirección de residencia', type: 'text', full: true },
      { key: 'rep.city', label: 'Ciudad', type: 'select', options: CIUDADES },
      { key: 'rep.phone', label: 'Teléfono', type: 'text', inputmode: 'numeric', max: 10 }
    ]));
    var full = state.partners.length >= MAX_PARTNERS;
    html += section('partners', 'icon-users-three', 'Socios y accionistas',
      state.partners.map(partnerHTML).join('') +
      shareSummaryHTML() +
      (full
        ? '<p class="p6-note"><span class="icon icon-info icon-16 gs-inherit" aria-hidden="true"></span>Si hay más de ' + MAX_PARTNERS + ' socios, adjunta el listado completo en el paso Soportes.</p>'
        : '<div class="p6-add"><button type="button" class="mp-btn mp-btn--secundario p6-add__btn" data-action="add-partner">+ Agregar socio o accionista</button></div>'),
      'Quienes tengan participación en la empresa. Si un socio es persona jurídica, adjunta su composición accionaria hasta llegar a personas naturales.');
    var coAct = [
      { key: 'co.type', label: 'Tipo de empresa', type: 'select', options: TIPOS_EMPRESA },
      { key: 'co.activity', label: 'Actividad económica', type: 'select', options: ACTIVIDADES_EMPRESA }
    ];
    if (V['co.activity'] === 'otra') coAct.push({ key: 'co.activityOther', label: '¿Cuál?', type: 'text' });
    coAct.push({ key: 'co.ciiu', label: 'Código CIIU', type: 'select', options: CIIU, full: V['co.activity'] !== 'otra' });
    html += section('codetails', 'icon-user-list', 'Otros detalles',
      grid(coAct) + '<div class="p6-qs">' + PEP_EMPRESA.map(function (q) { return yesNo(q); }).join('') + '</div>' + operationHTML('co.foreignOps'));
    return html;
  }

  /* ═══════════════ RENDER ═══════════════ */
  var formEl = document.getElementById('p6-form');
  function render(focusId) {
    var html = personTypeHTML();
    html += section('personal', 'icon-identification-card', 'Información personal',
      factsHTML() + grid([
        { key: 'expPlace', label: 'Lugar de expedición del documento', type: 'select', options: CIUDADES },
        { key: 'expDate', label: 'Fecha de expedición del documento', type: 'date' }
      ]));
    html += state.personType === 'juridica' ? juridicaHTML() : naturalHTML();
    formEl.innerHTML = html;
    ZTDropdown.enhanceAll(formEl);
    ZTDatePicker.enhanceAll(formEl);
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) {
        var dd = el.closest('.zt-dropdown');
        var target = (dd && dd.querySelector('.zt-dropdown__trigger')) || el;
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      }
    }
  }

  /* ═══════════════ EVENTOS ═══════════════ */
  // Cambios que alteran la estructura (qué campos se ven) → re-render.
  var STRUCTURAL = { personType: 1, activity: 1, 'co.activity': 1, 'pep.foreignOps': 1, 'co.foreignOps': 1, opType: 1 };

  function setError(el, on) {
    if (!el) return;
    var host = el.closest('.zt-dropdown') || el.closest('.zt-datefield');
    (host || el).classList.toggle('error', !!on);
    var g = el.closest('.mp-input-group');
    var m = g && g.querySelector('.mp-input-error');
    if (m) m.hidden = !on;
  }

  function onValue(e) {
    var t = e.target;
    var key = t.getAttribute('data-key'), pkey = t.getAttribute('data-pkey');
    if (!key && !pkey) return;
    if (t.getAttribute('inputmode') === 'numeric') { var c = t.value.replace(/\D+/g, ''); if (c !== t.value) t.value = c; }
    if (t.getAttribute('inputmode') === 'decimal') { var d = t.value.replace(/[^\d.,]/g, ''); if (d !== t.value) t.value = d; }
    if (t.type === 'radio' && !t.checked) return;
    state.completed = false;
    if (pkey) {
      var idx = +t.getAttribute('data-pidx');
      state.partners[idx][pkey] = t.value;
      if (t.type === 'radio') t.closest('.p6-q').classList.toggle('is-yes', t.value === 'si');
      if (pkey === 'share') { var tot = document.getElementById('p6-total'); if (tot) tot.outerHTML = shareSummaryHTML(); }
      setError(t, false);
      persist(); return;
    }
    if (key === 'personType') { state.personType = t.value; persist(); render(); ZTAlert.clear(alertEl); return; }
    var prev = V[key];
    V[key] = t.value;
    if (t.type === 'radio' && t.closest('.p6-q')) t.closest('.p6-q').classList.toggle('is-yes', t.value === 'si');
    setError(t, false);
    // Limpiezas al ocultar campos dependientes
    if (key === 'activity' && t.value !== 'empleado') ['emp.name', 'emp.area', 'emp.role', 'emp.city', 'emp.address', 'emp.phone'].forEach(function (k) { delete V[k]; });
    if (key === 'activity' && !CON_CIIU[t.value]) delete V.ciiu;
    if (key === 'activity' && t.value !== 'otra') delete V.activityOther;
    if (key === 'co.activity' && t.value !== 'otra') delete V['co.activityOther'];
    if ((key === 'pep.foreignOps' || key === 'co.foreignOps') && t.value === 'no') { delete V.opType; delete V.opOther; }
    if (key === 'opType' && t.value !== 'otra') delete V.opOther;
    persist();
    if (STRUCTURAL[key] && prev !== t.value) {
      var focusNext = null;
      if (key === 'opType' && t.value === 'otra') focusNext = 'p6-opOther';
      else if (key === 'activity' && t.value === 'otra') focusNext = 'p6-activityOther';
      else if (key === 'activity' && t.value === 'empleado') focusNext = 'p6-ciiu';
      render(focusNext || t.id || null);
      if (!focusNext && t.type === 'radio') {
        var again = formEl.querySelector('input[name="' + t.name + '"][value="' + t.value + '"]');
        if (again) again.focus({ preventScroll: true });
      }
    }
  }
  formEl.addEventListener('input', onValue);
  formEl.addEventListener('change', onValue);

  formEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.getAttribute('data-action') === 'add-partner' && state.partners.length < MAX_PARTNERS) {
      var np = {}; PEP_SOCIO.forEach(function (q) { np[q.key] = 'no'; });
      state.partners.push(np);
      persist();
      render(fid('docType', state.partners.length - 1));
      var card = formEl.querySelector('[data-partner="' + (state.partners.length - 1) + '"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (btn.getAttribute('data-action') === 'del-partner') {
      state.partners.splice(+btn.getAttribute('data-idx'), 1);
      persist();
      render();
    }
  });

  /* ═══════════════ VALIDACIÓN (sobre lo visible) ═══════════════ */
  var alertEl = document.getElementById('p6-alert');
  function validate() {
    var first = null, count = 0;
    formEl.querySelectorAll('[data-req="1"]').forEach(function (el) {
      var v = String(el.value || '').trim();
      var bad = !v;
      if (!bad && el.getAttribute('inputmode') === 'numeric' && /phone/.test(el.id) && v.length < 7) bad = true;
      if (!bad && /share/.test(el.id)) { var n = parseFloat(v.replace(',', '.')); bad = !(n > 0 && n <= 100); }
      setError(el, bad);
      if (bad) { count++; if (!first) first = el; }
    });
    var ops = formEl.querySelector('[data-req-radio="opType"]');
    if (ops) {
      var ok = !!V.opType;
      document.getElementById('p6-opType-error').hidden = ok;
      if (!ok) { count++; if (!first) first = ops.querySelector('input'); }
    }
    if (state.personType === 'juridica' && totalShare() > 100) {
      count++; if (!first) first = formEl.querySelector('[data-pkey="share"]');
    }
    return { count: count, first: first };
  }

  document.getElementById('p6-next').addEventListener('click', function () {
    var r = validate();
    if (!r.count) { openOriginFunds(); return; }
    ZTAlert.render(alertEl, {
      type: 'warning',
      title: r.count === 1 ? 'Falta 1 dato por completar' : 'Faltan ' + r.count + ' datos por completar',
      description: 'Revisa los campos marcados en rojo.'
    });
    var dd = r.first.closest('.zt-dropdown') || r.first.closest('.zt-datefield');
    var target = (dd && dd.querySelector('.zt-dropdown__trigger, .zt-datefield__trigger')) || r.first;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  });
  /* ═══════════════ DECLARACIÓN DE ORIGEN DE FONDOS (modal) ═══════════════
   * Texto del Figma con los marcadores reemplazados por datos del proceso.
   * Se construye con nodos + textContent (sin innerHTML con datos). */
  function labelOf(list, v) { var o = list.filter(function (x) { return x.value === v; })[0]; return o ? o.label : ''; }
  function fuentesTexto() {
    if (state.personType === 'juridica') {
      var a = V['co.activity'] === 'otra' ? V['co.activityOther'] : labelOf(ACTIVIDADES_EMPRESA, V['co.activity']);
      return 'Actividad ' + String(a || '').toLowerCase() + ' de ' + (V['co.name'] || 'la empresa') +
        (V['co.ciiu'] ? ' (CIIU ' + V['co.ciiu'] + ')' : '') + '.';
    }
    var act = V.activity === 'otra' ? V.activityOther : labelOf(ACTIVIDADES, V.activity);
    var txt = act || '';
    if (V.activity === 'empleado') txt += (V['emp.role'] ? ' — ' + V['emp.role'] : '') + (V['emp.name'] ? ' en ' + V['emp.name'] : '');
    if (V.ciiu) txt += ' (CIIU ' + V.ciiu + ')';
    return txt + '.';
  }
  function originFundsContent() {
    var root = document.createElement('div');
    function t(tag, text, cls) { var e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; }
    // Indicación para el ASESOR: la declaración se lee en voz alta al cliente.
    var cue = document.createElement('div');
    cue.className = 'p6-read-cue';
    var cueIcon = document.createElement('span');
    cueIcon.className = 'icon icon-megaphone icon-20 gs-inherit';
    cueIcon.setAttribute('aria-hidden', 'true');
    cue.appendChild(cueIcon);
    cue.appendChild(t('span', 'Lee esta declaración en voz alta al cliente. Al terminar, confirma que la aceptó.'));
    root.appendChild(cue);
    var juridica = state.personType === 'juridica';
    var nombre = juridica ? [V['rep.names'], V['rep.surname1'], V['rep.surname2']].filter(Boolean).join(' ') : candidate.name;
    var doc = juridica ? Z.formatDoc(V['rep.docNumber']) : Z.formatDoc(candidate.documentNumber);
    var ciudad = labelOf(CIUDADES, juridica ? V['rep.expPlace'] : V.expPlace);
    var p = document.createElement('p');
    p.appendChild(document.createTextNode('Yo, '));
    p.appendChild(t('strong', nombre || '—'));
    p.appendChild(document.createTextNode(', identificado(a) con el documento de identidad No. '));
    p.appendChild(t('strong', doc || '—'));
    p.appendChild(document.createTextNode(', expedido en '));
    p.appendChild(t('strong', ciudad || '—'));
    if (juridica) {
      p.appendChild(document.createTextNode(', obrando en representación legal de '));
      p.appendChild(t('strong', V['co.name'] || '—'));
      p.appendChild(document.createTextNode(' con NIT '));
      p.appendChild(t('strong', Z.formatDoc(V['co.nit']) || '—'));
    } else {
      p.appendChild(document.createTextNode(', obrando en nombre propio'));
    }
    p.appendChild(document.createTextNode(', de manera voluntaria y dando certeza de que todo lo aquí consignado es cierto, realizo la siguiente Declaración de Origen de mis Fondos a Compensar con el propósito de contribuir en la prevención y control del Lavado de Activos y Financiación del Terrorismo, declaro que:'));
    root.appendChild(p);
    var ul = document.createElement('ul');
    var li1 = document.createElement('li');
    li1.appendChild(document.createTextNode('Los recursos que manejo o mis recursos propios provienen de las siguientes fuentes: '));
    li1.appendChild(t('strong', fuentesTexto()));
    ul.appendChild(li1);
    [
      'Declaro que los recursos que manejo no provienen de actividad ilícita contemplada en el Código Penal Colombiano o en cualquier norma que lo modifique, adicione o sustituya.',
      'No admitiré que terceros efectúen depósitos a mis cuentas con fondos provenientes de actividades ilícitas contempladas en el Código Penal Colombiano o en cualquier norma que lo modifique, adicione o sustituya, ni efectuaré transacciones relacionadas con tales actividades ilícitas o a favor de personas relacionadas con las mismas.',
      'Eximo a Compensar de toda responsabilidad que se derive por información errónea, falsa o inexacta que yo hubiere proporcionado y que cualquier falsedad, inexactitud o error en la información suministrada dará derecho a Compensar a terminar unilateralmente, y sin que haya lugar a indemnización alguna a mi favor, todos los contratos que haya celebrado con dicha entidad.',
      'Acepto la verificación de SARLAFT realizada por Compensar, de manera que velaré por su cumplimiento manteniendo los controles para evitar que Compensar sea utilizado en actividades ilícitas.',
      'Acepto que Compensar, en caso de incumplimiento a lo anterior, dé por terminados unilateralmente y sin que haya lugar a indemnización alguna a mi favor, todos los contratos que haya celebrado con dicha entidad.',
      'Informaré inmediatamente cualquier circunstancia que modifique la presente declaración.',
      'Toda la información suministrada en este documento es cierta.'
    ].forEach(function (x) { ul.appendChild(t('li', x)); });
    root.appendChild(ul);
    // Constancia del ASESOR (habilita "Aceptar").
    var confirm = document.createElement('label');
    confirm.className = 'p6-read-confirm mp-choice mp-checkbox';
    confirm.innerHTML = '<span class="mp-choice__field"><input class="mp-choice__input" type="checkbox" id="p6-read-ok">' +
      '<span class="mp-choice__control"></span></span>' +
      '<span class="mp-choice__text"><span class="mp-choice__label">Leí la declaración al cliente y la aceptó</span></span>';
    root.appendChild(confirm);
    return root;
  }
  function openOriginFunds() {
    ZTAlert.clear(alertEl);
    var m = ZTModal.open({
      type: 'info',
      size: 'lg',
      align: 'left',
      title: 'Declaración voluntaria de origen de fondos',
      content: originFundsContent(),
      primaryAction: { label: 'Aceptar', onClick: function () {
        state.completed = true;
        state.originFundsAcceptedAt = new Date().toISOString();
        persist();
        ZTModal.close();
        // Paso 7 (Liquidación) aún no está construido: destino documentado.
        window.location.href = '../paso-7/index.html';
      } }
    });
    // "Aceptar" solo se habilita con la constancia de lectura del asesor.
    var btn = m.el.querySelector('.mp-modal__actions .mp-btn--primario');
    var chk = m.el.querySelector('#p6-read-ok');
    btn.disabled = true;
    chk.addEventListener('change', function () { btn.disabled = !chk.checked; });
  }

  document.getElementById('p6-back').addEventListener('click', function () {
    persist();
    window.location.href = '../paso-5/index.html';
  });

  render();
})();
