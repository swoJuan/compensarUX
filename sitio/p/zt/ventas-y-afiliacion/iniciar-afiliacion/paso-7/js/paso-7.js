/* ============================================================
 * paso-7.js — PASO 7 "Liquidación de la afiliación" (ZT)
 * ------------------------------------------------------------
 * Escenarios del Figma en UNA pantalla:
 *   · Mismo pago para todos, sin configurar     (254:25725)
 *   · Mismo pago para todos, con formas de pago (254:25568)
 *   · Pago diferente por persona                (254:25882)
 *
 * Secciones (renumeradas en orden; el Figma saltaba de D/E a G/H):
 *   A. Modalidad de pago (Mensual / Anual)
 *   B. ¿Cómo quieres configurar el pago? (mismo para todos / por persona)
 *   C. Configuración general | por persona — formas de pago con % (suman 100),
 *      "Configurar" abre los datos de cada forma (débito, libranza, factura) y
 *      cupón de descuento opcional.
 *   D. Liquidación total (se recalcula en vivo)
 *   E. Tratamiento de datos personales (Habeas Data) + detalle en modal
 *   F. Declaraciones y autorizaciones (obligatorias; las lee el asesor)
 *
 * UX:
 *   - Al marcar una forma de pago se le asigna automáticamente el % que falta.
 *   - Barra "Total asignado" en verde (100%), naranja (<100) o rojo (>100).
 *   - Cada forma muestra "Configurado ✓" o "Falta configurar".
 *   - Por persona: acordeón (una abierta a la vez) con estado y valor neto.
 *
 * ⚠️ MOCK de prototipo: tarifas por edad, descuento familiar, descuento anual,
 *    cupones y cuota de inscripción (PRICING). Reemplazar por el servicio.
 * Persistencia: step7 (sessionStorage).
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
  if (!(Z.getStep4() || {}).completed) { window.location.replace('../paso-4/index.html'); return; }
  if (!(Z.getStep5() || {}).completed) { window.location.replace('../paso-5/index.html'); return; }
  if (!(Z.getStep6() || {}).completed) { window.location.replace('../paso-6/index.html'); return; }

  var candidate = Z.getCandidate();

  /* ═══════════════ PRICING (MOCK) ═══════════════ */
  var PRICING = {
    tarifa: function (age) {                       // tarifa plena mensual por edad
      if (age == null) return 298000;
      if (age < 18) return 210000;
      if (age < 40) return 298000;
      if (age < 60) return 412500;
      return 620000;
    },
    familyDiscount: 0.05,                          // 5% si hay 2 o más personas
    annualDiscount: 0.05,                          // 5% adicional pagando anual
    enrollment: 150000,                            // cuota de inscripción (única)
    coupons: { BIENVENIDA10: 0.10, COMPENSAR5: 0.05 }
  };

  // Campos por forma de pago (Figma 256:28006). type 'file' = soporte adjunto.
  var METHODS = [
    { id: 'directo',  title: 'Directo',           desc: 'El titular paga directamente.' },
    { id: 'debito',   title: 'Débito automático', desc: 'Se cobra desde una cuenta bancaria.', cfg: [
      { key: 'bank', label: 'Banco', type: 'select', options: ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'Scotiabank Colpatria', 'Banco AV Villas', 'Banco Caja Social', 'Nequi'] },
      { key: 'debitDay', label: 'Día del débito automático', type: 'select', options: ['Día 5', 'Día 10', 'Día 15', 'Día 20', 'Día 25', 'Día 30'] },
      { key: 'accountType', label: 'Tipo de cuenta', type: 'select', options: ['Ahorros', 'Corriente'] },
      { key: 'accountNumber', label: 'Número de la cuenta bancaria', type: 'text', inputmode: 'numeric', max: 20 },
      { key: 'cert', label: 'Certificado bancario', type: 'file', hint: 'Con una vigencia máxima de 3 meses.' }
    ]},
    { id: 'libranza', title: 'Libranza',          desc: 'Se descuenta por nómina.', cfg: [
      { key: 'company', label: 'Nombre de la empresa', type: 'text' },
      { key: 'nit', label: 'NIT', type: 'text', inputmode: 'numeric', max: 15 },
      { key: 'format', label: 'Formato de libranza', type: 'file', hint: 'Firmado por el afiliado y la empresa.' }
    ]},
    // Factura empresa: si hay empresa en el Paso 1 se usa esa (razón social y NIT no
    // se piden de nuevo); si no, se piden aquí. Admite porcentaje O valor fijo mensual.
    { id: 'factura',  title: 'Factura empresa',   desc: 'La empresa del contratante recibe y paga la factura.', cfg: [
      { key: 'approval', label: 'Soporte de aprobación de la empresa', type: 'file',
        note: 'Para usar esta forma de pago, la empresa debe haberla aprobado previamente.' }
    ]}
  ];
  var companyAvailable = step1.affiliationChannel === 'company' && !!step1.companyName;
  // Factura empresa siempre disponible. Si el contratante no se afilió a través
  // de una empresa (Paso 1), se piden aquí el nombre y el NIT de la empresa.
  if (!companyAvailable) {
    METHODS.filter(function (m) { return m.id === 'factura'; })[0].cfg.unshift(
      { key: 'company', label: 'Nombre de la empresa', type: 'text' },
      { key: 'nit', label: 'NIT', type: 'text', inputmode: 'numeric', max: 15 }
    );
  }

  /* ─────────── Panel lateral ─────────── */
  ZTPersonSummary.render(document.getElementById('pa-cand-summary'), {
    eyebrow: 'Persona a afiliar', variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '', documentType: candidate.documentType, documentNumber: candidate.documentNumber
  });
  ZTStepper.render(document.getElementById('pa-stepper'), Z.stepperConfig(7));   // pasos completados clicables

  /* ═══════════════ PERSONAS ═══════════════ */
  function edad(iso) {
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00'), h = new Date();
    if (isNaN(b.getTime())) return null;
    var e = h.getFullYear() - b.getFullYear();
    if (h.getMonth() < b.getMonth() || (h.getMonth() === b.getMonth() && h.getDate() < b.getDate())) e--;
    return e;
  }
  function relLabel(rel, sex) {
    var f = sex === 'femenino';
    return { conyuge: 'Cónyuge', hijo: f ? 'Hija' : 'Hijo', padre: 'Padre', madre: 'Madre', hermano: f ? 'Hermana' : 'Hermano', otro: 'Otro' }[rel] || 'Beneficiario';
  }
  var persons = [];
  if (step3.contractorIsBeneficiary) {
    persons.push({ id: 'contratante', name: candidate.name || 'Contratante', role: 'Contratante',
      age: step2.age != null ? step2.age : edad(step2.birthDate) });
  }
  (step3.beneficiaries || []).forEach(function (b, i) {
    var name = [b.firstName, b.secondName, b.firstSurname, b.secondSurname].filter(Boolean).join(' ') || ('Beneficiario ' + (i + 1));
    var age = edad(b.birthDate); if (age == null) age = b.age;
    var rl = relLabel(b.relationship, b.identificationSex);
    persons.push({ id: b.id, name: name, prefix: 'Beneficiario ' + (i + 1) + ' — ',
      role: rl + (age != null && age < 18 ? ' (' + age + (age === 1 ? ' año' : ' años') + ')' : ''), age: age });
  });

  /* ═══════════════ ESTADO ═══════════════ */
  function emptyScope() {
    var m = {};
    METHODS.forEach(function (x) { m[x.id] = { on: false, pct: 0, cfg: {} }; });
    m.factura.amountType = 'pct';   // 'pct' | 'fixed'
    m.factura.fixed = 0;            // valor fijo mensual (COP)
    return { methods: m, coupons: [] };   // coupons: [{ pid, code, pct }]
  }
  function companyPrefill(scope) {
    if (!Array.isArray(scope.coupons)) scope.coupons = [];   // estructura anterior (coupon único)
    delete scope.coupon;
    var f = scope.methods.factura;
    if (!f.amountType) f.amountType = 'pct';
    if (f.fixed == null) f.fixed = 0;
    if (step1.affiliationChannel !== 'company') return;
    var c = scope.methods.libranza.cfg;
    if (!c.company) c.company = step1.companyName || '';
    if (!c.nit) c.nit = step1.nit || '';
  }
  var saved = Z.getStep7() || {};
  var state = {
    completed: saved.completed === true,
    modality: saved.modality || '',
    payMode: saved.payMode || 'same',
    same: saved.same || emptyScope(),
    per: saved.per || {},
    accepted: saved.accepted || { veracidad: false, crediticia: false },
    openPerson: persons[0] && persons[0].id,
    openCfg: {},            // UI: formularios "Configurar" abiertos (no se persiste)
    couponOpen: {},         // UI
    fileErr: {}             // UI: error del último archivo rechazado, por id de campo
  };
  companyPrefill(state.same);
  persons.forEach(function (p) { if (!state.per[p.id]) state.per[p.id] = emptyScope(); companyPrefill(state.per[p.id]); });
  Object.keys(state.per).forEach(function (k) { if (!persons.some(function (p) { return p.id === k; })) delete state.per[k]; });

  function persist() {
    Z.saveStep7({ completed: state.completed, modality: state.modality, payMode: state.payMode,
      same: state.same, per: state.per, accepted: state.accepted, totals: totals() });
  }
  function scopeOf(key) { return key === 'same' ? state.same : state.per[key]; }

  /* ═══════════════ CÁLCULOS ═══════════════ */
  // Un cupón por persona (no acumulables). En "mismo pago" cada fila elige la persona.
  function couponFor(p) {
    var list = state.payMode === 'same' ? state.same.coupons : (state.per[p.id] || {}).coupons || [];
    var c = list.filter(function (x) { return (state.payMode === 'per' || x.pid === p.id) && x.pct; })[0];
    return c ? c.pct : 0;
  }
  function pleno(p) { return PRICING.tarifa(p.age); }
  function neto(p) {
    var fam = persons.length >= 2 ? PRICING.familyDiscount : 0;
    return Math.round(pleno(p) * (1 - fam) * (1 - couponFor(p)));
  }
  function totals() {
    var tp = 0, tn = 0;
    persons.forEach(function (p) { tp += pleno(p); tn += neto(p); });
    var modal = state.modality === 'anual' ? Math.round(tn * 12 * (1 - PRICING.annualDiscount)) : tn;
    return { pleno: tp, neto: tn, modality: modal, enrollment: PRICING.enrollment, iva: 0, total: modal + PRICING.enrollment };
  }
  function money(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function scopeBase(scopeKey) {                   // valor neto mensual que cubre este bloque
    if (scopeKey === 'same') return persons.reduce(function (s, p) { return s + neto(p); }, 0);
    var p = persons.filter(function (x) { return x.id === scopeKey; })[0];
    return p ? neto(p) : 0;
  }
  function isFixed(scope) { var f = scope.methods.factura; return f.on && f.amountType === 'fixed'; }
  // Suma de % de las formas que reparten por porcentaje (con valor fijo, la
  // empresa queda por fuera y el % se calcula sobre el saldo).
  function pctSum(scope) {
    var fixed = isFixed(scope);
    return METHODS.reduce(function (s, m) {
      var x = scope.methods[m.id];
      if (!x.on || (fixed && m.id === 'factura')) return s;
      return s + (+x.pct || 0);
    }, 0);
  }
  function cfgComplete(m, data) {
    if (!m.cfg) return true;
    return m.cfg.every(function (f) {
      if (f.type === 'file') return !!(data[f.key] && data[f.key].name);
      var v = String(data[f.key] || '').trim();
      if (!v) return false;
      if (f.inputmode === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return true;
    });
  }
  /* Estado completo de un bloque (general o persona): cobertura, saldo y el
   * primer problema a resolver (msg vacío = listo). */
  function calc(scopeKey) {
    var scope = scopeOf(scopeKey), base = scopeBase(scopeKey), f = scope.methods.factura;
    var fixed = isFixed(scope);
    var companyAmt = fixed ? Math.min(+f.fixed || 0, base) : (f.on ? Math.round(base * (+f.pct || 0) / 100) : 0);
    var remainder = fixed ? base - companyAmt : 0;
    var sum = pctSum(scope);
    var others = METHODS.filter(function (m) { return m.id !== 'factura' && scope.methods[m.id].on; });
    var needsPct = !fixed || remainder > 0;
    var coverage = fixed
      ? (base ? Math.round((companyAmt + remainder * Math.min(sum, 100) / 100) / base * 100) : 0)
      : sum;
    var msg = '';
    if (!METHODS.some(function (m) { return scope.methods[m.id].on; })) msg = 'Selecciona al menos una forma de pago.';
    else if (fixed && !(+f.fixed > 0)) msg = 'Ingresa el valor fijo mensual que paga la empresa.';
    else if (fixed && remainder > 0 && !others.length) msg = 'Agrega otra forma de pago para cubrir el saldo de ' + money(remainder) + ' al mes.';
    else if (needsPct && sum !== 100) msg = fixed
      ? 'Las demás formas de pago deben sumar 100% del saldo de ' + money(remainder) + ' (hoy suman ' + sum + '%).'
      : 'Las formas de pago deben sumar 100% (hoy suman ' + sum + '%).';
    else if (METHODS.some(function (m) { var x = scope.methods[m.id]; return x.on && !(fixed && m.id === 'factura') && needsPct && !(+x.pct > 0); }))
      msg = 'Cada forma de pago marcada debe tener un porcentaje mayor a 0.';
    else if (!METHODS.every(function (m) { var x = scope.methods[m.id]; return !x.on || cfgComplete(m, x.cfg); }))
      msg = 'Completa los datos de las formas de pago marcadas.';
    return { base: base, fixed: fixed, companyAmt: companyAmt, remainder: remainder, sum: sum,
      coverage: coverage, needsPct: needsPct, msg: msg };
  }
  function scopeOk(scopeKey) { return !calc(scopeKey).msg; }

  /* ═══════════════ PLANTILLAS ═══════════════ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'); }
  function secHead(letter, title, sub) {
    return '<div class="p7-sec__head"><h3 class="p7-sec__title">' + letter + '. ' + title + '</h3>' +
      (sub ? '<p class="p7-sec__sub">' + sub + '</p>' : '') + '</div>';
  }

  function modalityHTML() {
    function opt(v, title, hint) {
      var on = state.modality === v;
      return '<label class="p7-pill' + (on ? ' is-active' : '') + '">' +
        '<input type="radio" name="p7-modality" value="' + v + '"' + (on ? ' checked' : '') + ' data-act="modality">' +
        '<span class="p7-pill__dot" aria-hidden="true"></span><span class="p7-pill__text">' + title +
        (hint ? '<span class="p7-pill__hint">' + hint + '</span>' : '') + '</span></label>';
    }
    return '<section class="p7-sec p7-sec--row" id="p7-sec-a">' +
      secHead('A', 'Modalidad de pago', 'Selecciona la periodicidad del plan') +
      '<div class="p7-pills" role="radiogroup" aria-label="Modalidad de pago">' +
        opt('mensual', 'Mensual') + opt('anual', 'Anual', '−' + Math.round(PRICING.annualDiscount * 100) + '%') +
      '</div>' +
      '<p class="mp-input-error p7-err" id="p7-modality-error" role="alert" hidden>Selecciona la modalidad de pago.</p>' +
    '</section>';
  }

  function payModeHTML() {
    function card(v, title, desc) {
      var on = state.payMode === v;
      return '<label class="p7-card' + (on ? ' is-active' : '') + '">' +
        '<input type="radio" name="p7-paymode" value="' + v + '"' + (on ? ' checked' : '') + ' data-act="paymode">' +
        '<span class="p7-pill__dot" aria-hidden="true"></span>' +
        '<span class="p7-card__text"><span class="p7-card__title">' + title + '</span><span class="p7-card__desc">' + desc + '</span></span></label>';
    }
    return '<section class="p7-sec">' + secHead('B', '¿Cómo quieres configurar el pago?') +
      '<div class="p7-cards" role="radiogroup" aria-label="Configuración del pago">' +
        card('same', 'Mismo pago para todos', 'Usa la misma configuración de pago para todas las personas.') +
        card('per', 'Pago diferente por persona', 'Configura cada persona de forma independiente.') +
      '</div></section>';
  }

  function progressHTML(scopeKey) {
    var r = calc(scopeKey), a = r.sum, label, cls, bar;
    if (r.fixed) {
      bar = r.coverage;
      var over = r.needsPct && a > 100;
      cls = over ? 'is-over' : (!r.needsPct || a === 100) && r.companyAmt > 0 ? 'is-ok' : 'is-partial';
      label = !r.needsPct && r.companyAmt > 0 ? '✓ La empresa cubre el 100% (' + money(r.companyAmt) + '/mes)'
        : 'Empresa: ' + money(r.companyAmt) + '/mes · saldo ' + money(r.remainder) + ': ' +
          (a === 100 ? '✓ 100% asignado' : over ? a + '% · supera el 100%' : a + '% asignado · falta ' + (100 - a) + '%');
    } else {
      bar = a;
      cls = a === 100 ? 'is-ok' : a > 100 ? 'is-over' : 'is-partial';
      label = a === 100 ? '✓ 100% asignado' : a > 100 ? a + '% asignado · supera el 100%' : a + '% asignado · falta ' + (100 - a) + '%';
    }
    return '<div class="p7-progress ' + cls + '" data-progress="' + scopeKey + '">' +
      '<div class="p7-progress__row"><span class="p7-progress__title">Formas de pago</span>' +
      '<span class="p7-progress__label">' + label + '</span></div>' +
      '<div class="p7-progress__bar" role="progressbar" aria-label="Valor cubierto por las formas de pago" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.min(bar, 100) + '">' +
        '<span class="p7-progress__fill" style="width:' + Math.min(bar, 100) + '%"></span></div>' +
    '</div>';
  }

  function infoAlert(title, desc) {
    var a = ZTAlert.create({ type: 'info', title: title, description: desc });
    a.removeAttribute('role'); a.removeAttribute('aria-live');   // estático: no anunciar en cada render
    return a.outerHTML;
  }
  function cfgFieldHTML(scopeKey, m, f, data) {
    var id = 'p7-' + scopeKey + '-' + m.id + '-' + f.key;
    var v = data[f.key] || '';
    var ctrl;
    if (f.type === 'file') {
      var ferr = state.fileErr[id];
      return (f.note ? '<div class="p7-cfg__full">' + infoAlert('Tener en cuenta', f.note) + '</div>' : '') +
        '<div class="mp-input-group p7-cfg__full p7-file' + (ferr ? ' is-error' : '') + '">' +
        '<label class="mp-input-label" for="' + id + '"><span class="mp-input-required" aria-hidden="true">*</span> Adjuntar ' + f.label.charAt(0).toLowerCase() + f.label.slice(1) + '</label>' +
        (f.hint ? '<p class="p7-file__hint">' + f.hint + '</p>' : '') +
        ZTFileUpload.html({ id: id, value: v || null, attrs: 'data-cfg="' + f.key + '"' }).replace('class="zt-upload', 'class="zt-upload' + (ferr ? ' is-error' : '')) +
        '<p class="mp-input-error" role="alert"' + (ferr ? '' : ' hidden') + '>' + esc(ferr || 'Adjunta el documento.') + '</p></div>';
    }
    if (f.type === 'select') {
      ctrl = '<select class="mp-input-field mp-select" id="' + id + '" data-cfg="' + f.key + '" data-zt-dropdown data-zt-dropdown-search="' + (f.options.length >= 8) + '">' +
        '<option value="" disabled' + (v ? '' : ' selected') + '>Seleccionar</option>' +
        f.options.map(function (o) { var s = slug(o); return '<option value="' + s + '"' + (s === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
        '</select>';
    } else {
      ctrl = '<input class="mp-input-field" id="' + id + '" data-cfg="' + f.key + '" type="' + (f.inputmode === 'email' ? 'email' : 'text') + '" autocomplete="off" placeholder="Escribir"' +
        (f.inputmode && f.inputmode !== 'email' ? ' inputmode="' + f.inputmode + '"' : '') + (f.max ? ' maxlength="' + f.max + '"' : '') + ' value="' + esc(v) + '">';
    }
    return '<div class="mp-input-group"><label class="mp-input-label" for="' + id + '"><span class="mp-input-required" aria-hidden="true">*</span> ' + f.label + '</label>' +
      '<div class="mp-input-wrapper">' + ctrl + '</div>' +
      '<p class="mp-input-error" role="alert" hidden>' + (f.type === 'select' ? 'Selecciona una opción.' : f.inputmode === 'email' ? 'Ingresa un correo válido.' : 'Este campo es obligatorio.') + '</p></div>';
  }

  function companyNoteText(scopeKey) {
    var r = calc(scopeKey), f = scopeOf(scopeKey).methods.factura;
    if (!r.fixed) return (+f.pct > 0) ? 'Equivale a ' + money(r.companyAmt) + ' al mes.' : '';
    if (!(+f.fixed > 0)) return 'Escribe cuánto paga la empresa cada mes. El saldo se reparte entre las demás formas de pago.';
    if (+f.fixed >= r.base) return 'Cubre el total del valor mensual (' + money(r.base) + ').' + (+f.fixed > r.base ? ' Se factura máximo ese valor.' : '');
    return 'La empresa paga ' + money(r.companyAmt) + ' al mes. El saldo de ' + money(r.remainder) + ' se reparte entre las demás formas de pago.';
  }
  function fmtThousands(n) { return n ? Number(n).toLocaleString('es-CO') : ''; }

  function methodHTML(scopeKey, m) {
    var scope = scopeOf(scopeKey), x = scope.methods[m.id];
    var id = 'p7-' + scopeKey + '-' + m.id;
    var isCompany = m.id === 'factura';
    var open = x.on && m.cfg && state.openCfg[scopeKey + ':' + m.id];
    var done = cfgComplete(m, x.cfg);
    var fixed = isCompany && x.on && x.amountType === 'fixed';
    // En valor fijo, el % de las demás formas se calcula sobre el saldo.
    var ofRest = !isCompany && x.on && isFixed(scope);

    var amountCtrl = fixed
      ? '<div class="p7-pct p7-pct--money">' +
          '<span class="p7-pct__pre" aria-hidden="true">$</span>' +
          '<input class="mp-input-field p7-pct__input" type="text" inputmode="numeric" maxlength="11" id="' + id + '-fixed" data-act="fixed"' +
          ' aria-label="Valor fijo mensual que paga la empresa" aria-describedby="' + id + '-note" placeholder="0" value="' + fmtThousands(x.fixed) + '">' +
        '</div>'
      : '<div class="p7-pct">' +
          '<input class="mp-input-field p7-pct__input" type="text" inputmode="numeric" maxlength="3" id="' + id + '-pct" data-act="pct"' +
          ' aria-label="Porcentaje ' + m.title + (ofRest ? ' sobre el saldo' : '') + '" value="' + (x.on ? (x.pct || 0) : 0) + '"' + (x.on ? '' : ' disabled') + '>' +
          '<span class="p7-pct__sym" aria-hidden="true">%</span>' +
        '</div>';

    var companyBlock = '';
    if (isCompany && x.on) {
      var seg = function (v, label) {
        var on = x.amountType === v;
        return '<label class="p7-seg__opt' + (on ? ' is-active' : '') + '"><input type="radio" name="' + id + '-type" value="' + v + '" data-act="amount-type"' + (on ? ' checked' : '') + '>' + label + '</label>';
      };
      companyBlock = '<div class="p7-company">' +
        (companyAvailable ? '<div class="p7-company__facts">' +
          '<span><small>Empresa</small>' + esc(step1.companyName) + '</span>' +
          '<span><small>NIT</small>' + esc(Z.formatDoc ? Z.formatDoc(step1.nit) : step1.nit) + '</span>' +
          '<span class="p7-company__src">Del Paso 1</span>' +
        '</div>' : '') +
        '<div class="p7-company__amount">' +
          '<span class="p7-company__q" id="' + id + '-type-lbl">¿Cómo paga la empresa?</span>' +
          '<div class="p7-seg" role="radiogroup" aria-labelledby="' + id + '-type-lbl">' + seg('pct', 'Porcentaje') + seg('fixed', 'Valor fijo mensual') + '</div>' +
        '</div>' +
        '<p class="p7-company__note" id="' + id + '-note" data-company-note="' + scopeKey + '">' + companyNoteText(scopeKey) + '</p>' +
      '</div>';
    }

    return '<div class="p7-method' + (x.on ? ' is-on' : '') + '" data-scope="' + scopeKey + '" data-method="' + m.id + '">' +
      '<div class="p7-method__row">' +
        '<label class="mp-choice mp-checkbox p7-method__check">' +
          '<span class="mp-choice__field"><input class="mp-choice__input" type="checkbox" id="' + id + '" data-act="toggle-method"' + (x.on ? ' checked' : '') + ' aria-describedby="' + id + '-desc">' +
          '<span class="mp-choice__control"></span></span>' +
        '</label>' +
        '<div class="p7-method__text">' +
          '<label class="p7-method__title" for="' + id + '">' + m.title + '</label>' +
          '<span class="p7-method__desc" id="' + id + '-desc">' +
            (isCompany && !companyAvailable ? 'La empresa recibe y paga la factura.' : m.desc) + (ofRest ? ' <em>% sobre el saldo.</em>' : '') +
          '</span>' +
          (x.on && m.cfg
            ? '<span class="p7-method__cfg">' +
                '<button type="button" class="p7-link" data-act="toggle-cfg" aria-expanded="' + !!open + '">' + (open ? 'Cerrar' : 'Configurar') + '</button>' +
                '<span class="p7-status ' + (done ? 'is-ok' : 'is-pending') + '">' + (done ? '✓ Configurado' : 'Falta configurar') + '</span>' +
              '</span>'
            : '') +
        '</div>' +
        amountCtrl +
      '</div>' +
      companyBlock +
      (open ? '<div class="p7-cfg">' + m.cfg.map(function (f) { return cfgFieldHTML(scopeKey, m, f, x.cfg); }).join('') + '</div>' : '') +
    '</div>';
  }

  /* Cupones (Figma 256:27816): encabezado violeta; al abrir, aviso + filas
   * [persona][código]. En "mismo pago" se elige la persona y se pueden agregar
   * más filas (una por persona); en "por persona" aplica solo a esa persona. */
  function couponHTML(scopeKey) {
    var scope = scopeOf(scopeKey), same = scopeKey === 'same';
    if (!scope.coupons.length) scope.coupons.push({ pid: same ? '' : scopeKey, code: '', pct: 0 });
    var open = state.couponOpen[scopeKey];
    var applied = scope.coupons.filter(function (c) { return c.pct; });
    var summary = applied.length
      ? applied.map(function (c) { return esc(c.code) + ' · ' + Math.round(c.pct * 100) + '%' + (same ? ' (' + esc(firstName(c.pid)) + ')' : ''); }).join(' · ')
      : 'Máximo 1 cupón por afiliación (no son acumulables).';
    var head = '<div class="p7-coupon__head">' +
      '<span class="icon icon-ticket icon-32 gs-inherit" aria-hidden="true"></span>' +
      '<div class="p7-coupon__text"><span class="p7-coupon__title">Cupón de descuento <em>(opcional)</em></span>' +
      '<span class="p7-coupon__desc' + (applied.length ? ' is-ok' : '') + '">' + (applied.length ? '✓ ' : '') + summary + '</span></div>' +
      '<button type="button" class="p7-link" data-act="coupon-toggle" aria-expanded="' + !!open + '">' + (open ? 'Cerrar' : applied.length ? 'Editar' : 'Agregar cupón') + '</button>' +
    '</div>';
    if (!open) return '<div class="p7-coupon" data-scope="' + scopeKey + '">' + head + '</div>';
    var used = scope.coupons.map(function (c) { return c.pid; });
    var rows = scope.coupons.map(function (c, i) {
      var rid = 'p7-coupon-' + scopeKey + '-' + i;
      var sel = same
        ? '<div class="p7-coupon__who"><select class="mp-input-field mp-select" id="' + rid + '-who" data-act="coupon-who" aria-label="Persona del cupón ' + (i + 1) + '" data-zt-dropdown>' +
            '<option value="" disabled' + (c.pid ? '' : ' selected') + '>Selecciona persona</option>' +
            persons.map(function (p) {
              var taken = p.id !== c.pid && used.indexOf(p.id) !== -1;
              return taken ? '' : '<option value="' + p.id + '"' + (p.id === c.pid ? ' selected' : '') + '>' + esc(p.name) + '</option>';
            }).join('') + '</select></div>'
        : '';
      var status = c.pct ? '<span class="p7-status is-ok">✓ ' + Math.round(c.pct * 100) + '% de descuento</span>'
        : c.err ? '<span class="mp-input-error" role="alert">' + esc(c.err) + '</span>' : '';
      return '<div class="p7-coupon__row" data-coupon="' + i + '">' + sel +
        '<div class="p7-coupon__code"><input class="mp-input-field' + (c.err ? ' error' : '') + '" id="' + rid + '" type="text" autocomplete="off" placeholder="Escribir cupón" aria-label="Código del cupón ' + (i + 1) + '" data-act="coupon-code" value="' + esc(c.code) + '"></div>' +
        (scope.coupons.length > 1 || c.code || c.pid && same ? '<button type="button" class="p7-coupon__del" data-act="coupon-del" aria-label="Quitar cupón ' + (i + 1) + '"><span class="icon icon-x icon-20 gs-inherit" aria-hidden="true"></span></button>' : '') +
        (status ? '<div class="p7-coupon__status">' + status + '</div>' : '') +
      '</div>';
    }).join('');
    var canAdd = false;   // Cupones no acumulables: máximo 1 por afiliación
    return '<div class="p7-coupon is-open" data-scope="' + scopeKey + '">' + head +
      '<div class="p7-coupon__body">' +
        infoAlert('', 'Los descuentos otorgados por Compensar Medicina Prepagada se aplican mientras el contrato esté vigente. Los descuentos no son acumulables.') +
        rows +
        (canAdd ? '<button type="button" class="p7-coupon__add" data-act="coupon-add">+ Agregar otro cupón</button>' : '') +
      '</div></div>';
  }
  function firstName(pid) {
    var p = persons.filter(function (x) { return x.id === pid; })[0];
    return p ? p.name.split(' ')[0] : '';
  }
  // Valida el código de una fila (al salir del campo o con Enter).
  function applyCoupon(scopeKey, i) {
    var c = scopeOf(scopeKey).coupons[i];
    var code = String(c.code || '').trim().toUpperCase();
    c.code = code; c.pct = 0; c.err = '';
    if (!code) return;
    if (scopeKey === 'same' && !c.pid) { c.err = 'Selecciona la persona a la que aplica el cupón.'; return; }
    var pct = PRICING.coupons[code];
    if (!pct) { c.err = 'Cupón no válido o vencido.'; return; }
    // No acumulables: si ya hay otro cupón aplicado en la afiliación, no se permite.
    var otro = appliedCoupons().filter(function (x) { return x.c !== c; })[0];
    if (otro) { c.err = 'Ya hay un cupón aplicado (' + otro.c.code + ' · ' + firstName(otro.pid) + '). Los cupones no son acumulables: máximo 1 por afiliación.'; return; }
    c.pct = pct;
  }
  // Cupones aplicados en la configuración de pago actual.
  function appliedCoupons() {
    var out = [];
    if (state.payMode === 'same') state.same.coupons.forEach(function (c) { if (c.pct) out.push({ c: c, pid: c.pid }); });
    else persons.forEach(function (p) { (state.per[p.id].coupons || []).forEach(function (c) { if (c.pct) out.push({ c: c, pid: p.id }); }); });
    return out;
  }
  // Datos guardados con más de un cupón (versión anterior): se conserva solo el primero.
  (function soloUnCupon() {
    if (state.same.coupons.length > 1) {
      var first = state.same.coupons.filter(function (c) { return c.pct; })[0] || state.same.coupons[0];
      state.same.coupons = [first];
    }
    var ya = false;
    persons.forEach(function (p) {
      (state.per[p.id].coupons || []).forEach(function (c) {
        if (!c.pct) return;
        if (ya) { c.pct = 0; c.code = ''; } else ya = true;
      });
    });
  })();

  function methodsBlock(scopeKey) {
    return progressHTML(scopeKey) +
      '<p class="mp-input-error p7-err" id="p7-methods-' + scopeKey + '-error" role="alert" hidden></p>' +
      '<div class="p7-methods">' + METHODS.map(function (m) { return methodHTML(scopeKey, m); }).join('') + '</div>' +
      couponHTML(scopeKey);
  }

  function configHTML() {
    if (state.payMode === 'same') {
      return '<section class="p7-sec">' + secHead('C', 'Configuración general', 'Esta configuración se aplica a todas las personas.') +
        '<div class="p7-general">' + methodsBlock('same') + '</div></section>';
    }
    return '<section class="p7-sec">' + secHead('C', 'Configuración por persona', 'Cada persona debe sumar 100% entre sus formas de pago.') +
      '<div class="p7-people">' + persons.map(function (p) {
        var open = state.openPerson === p.id;
        var ok = scopeOk(p.id);
        return '<div class="p7-person' + (open ? ' is-open' : '') + '" data-person="' + p.id + '">' +
          '<div class="p7-person__head">' +
            '<div class="p7-person__who"><span class="p7-person__name">' + esc((p.prefix || '') + p.name) + '</span>' +
            '<span class="p7-person__role">' + esc(p.role) + ' · <span class="p7-status ' + (ok ? 'is-ok' : 'is-pending') + '">' + (ok ? '✓ Listo' : 'Pendiente') + '</span></span></div>' +
            '<div class="p7-person__val"><span>Valor neto / mes</span><strong data-neto="' + p.id + '">' + money(neto(p)) + '</strong></div>' +
            '<button type="button" class="p7-link" data-act="toggle-person" aria-expanded="' + open + '">' + (open ? 'Cerrar' : 'Configurar') + '</button>' +
          '</div>' +
          (open ? '<div class="p7-person__body">' + methodsBlock(p.id) + '</div>' : '') +
        '</div>';
      }).join('') + '</div></section>';
  }

  /* Liquidación tipo "recibo": tarifa por persona → descuentos (en verde) →
   * valor mensual → modalidad → inscripción → total. Los descuentos se
   * muestran explícitos para que el cliente entienda de dónde sale el valor. */
  function breakdown() {
    var fam = persons.length >= 2 ? PRICING.familyDiscount : 0;
    var famTotal = 0, coupons = [];
    persons.forEach(function (p) {
      var afterFam = Math.round(pleno(p) * (1 - fam));
      famTotal += pleno(p) - afterFam;
      var cd = afterFam - neto(p);
      if (cd > 0) {
        var list = state.payMode === 'same' ? state.same.coupons.filter(function (x) { return x.pid === p.id; }) : state.per[p.id].coupons;
        var code = (list.filter(function (x) { return x.pct; })[0] || {}).code || '';
        coupons.push({ label: 'Cupón ' + code + ' · ' + p.name.split(' ')[0], amount: cd });
      }
    });
    return { fam: fam, famTotal: famTotal, coupons: coupons };
  }
  function totalsHTML() {
    var t = totals(), bd = breakdown(), anual = state.modality === 'anual';
    function row(l, v, cls, note) {
      return '<div class="p7-totals__row' + (cls ? ' ' + cls : '') + '"><span>' + l + (note ? '<small>' + note + '</small>' : '') + '</span><span>' + v + '</span></div>';
    }
    return '<section class="p7-sec">' + secHead('D', 'Liquidación total') +
      '<div class="p7-totals" id="p7-totals">' +
        '<p class="p7-totals__label">Tarifa mensual por persona</p>' +
        persons.map(function (p) { return row(esc(p.name), money(pleno(p)), 'is-person', esc(p.role)); }).join('') +
        (bd.famTotal ? row('Descuento familiar (' + Math.round(bd.fam * 100) + '%)', '−' + money(bd.famTotal), 'is-discount') : '') +
        bd.coupons.map(function (c) { return row(esc(c.label), '−' + money(c.amount), 'is-discount'); }).join('') +
        row('Valor mensual', money(t.neto), 'is-sub') +
        (anual ? row('Pago anual', money(t.modality), '', '12 meses con ' + Math.round(PRICING.annualDiscount * 100) + '% de descuento') : '') +
        row('Cuota de inscripción', money(t.enrollment), '', 'Pago único') +
        row('IVA', '$0', 'is-muted', 'Servicio de salud excluido') +
        '<div class="p7-totals__total"><span>Total a pagar<small>Primera cuota' + (anual ? ' (año completo)' : '') + '</small></span><strong>' + money(t.total) + '</strong></div>' +
      '</div></section>';
  }
  function ctaTotal() {
    var el = document.getElementById('p7-cta-total');
    if (el) el.innerHTML = '<span>Total primera cuota</span><strong>' + money(totals().total) + '</strong>';
  }

  /* E. Autorizaciones: Habeas Data (informativo, detalle en modal) + las dos
   * declaraciones obligatorias que lee el asesor. */
  function declHTML() {
    var items = [
      { key: 'veracidad', title: 'Declaración de veracidad', desc: 'El cliente declara que toda la información suministrada durante el proceso de afiliación es veraz, completa y exacta, y que conoce las consecuencias legales de declarar información falsa.' },
      { key: 'crediticia', title: 'Autorización de información financiera y crediticia', desc: 'El cliente autoriza a Compensar a consultar, reportar y procesar su información financiera y crediticia ante centrales de riesgo, conforme a la Ley 1266 de 2012, para efectos de facturación y cobro de las cuotas del plan.' }
    ];
    var done = items.filter(function (it) { return state.accepted[it.key]; }).length;
    return '<section class="p7-sec">' +
      '<div class="p7-sec__head p7-sec__head--row"><div><h3 class="p7-sec__title">E. Autorizaciones y declaraciones</h3>' +
      '<p class="p7-sec__sub">Léelas al cliente y marca cada una cuando la acepte.</p></div>' +
      '<span class="p7-count' + (done === items.length ? ' is-done' : '') + '" id="p7-decl-count">' + done + '/' + items.length + '</span></div>' +
      '<div class="p7-habeas"><span class="icon icon-shield-check icon-24 gs-inherit" aria-hidden="true"></span>' +
        '<div><p class="p7-habeas__title">Tratamiento de datos personales (Habeas Data)</p>' +
        '<p>Compensar tratará los datos del titular y sus beneficiarios conforme a la Ley 1581 de 2012 para la afiliación, la prestación del servicio, la facturación y comunicaciones comerciales.</p>' +
        '<button type="button" class="p7-link" data-act="habeas">Ver detalle completo</button></div></div>' +
      items.map(function (it) {
        var on = state.accepted[it.key];
        return '<label class="p7-decl' + (on ? ' is-checked' : '') + '" data-decl="' + it.key + '">' +
          '<span class="mp-choice mp-checkbox"><span class="mp-choice__field"><input class="mp-choice__input" type="checkbox" data-act="decl"' + (on ? ' checked' : '') + '>' +
          '<span class="mp-choice__control"></span></span></span>' +
          '<span class="p7-decl__text"><span class="p7-decl__title"><span class="mp-input-required" aria-hidden="true">*</span> ' + it.title + '</span>' +
          '<span class="p7-decl__desc">' + it.desc + '</span></span></label>';
      }).join('') + '</section>';
  }

  /* ═══════════════ RENDER ═══════════════ */
  var root = document.getElementById('p7-form');
  var alertEl = document.getElementById('p7-alert');
  ZTFileUpload.bind(root, function (input, meta, err) {
    var c = ctx(input), key = input.getAttribute('data-cfg');
    var x = scopeOf(c.scopeKey).methods[c.methodId];
    if (err) state.fileErr[input.id] = err; else { delete state.fileErr[input.id]; x.cfg[key] = meta; }
    state.completed = false; persist(); render();
    var g = document.getElementById(input.id); g = g && g.closest('.mp-input-group');
    var f = g && (g.querySelector('[data-zt-upload-remove]') || g.querySelector('.zt-upload__drop'));
    if (f) { if (!f.hasAttribute('tabindex') && f.tagName === 'LABEL') f = document.getElementById(input.id); try { f.focus({ preventScroll: true }); } catch (e2) { f.focus(); } }
  });
  function render(focusSel) {
    root.innerHTML = modalityHTML() + payModeHTML() + configHTML() + totalsHTML() + declHTML();
    ctaTotal();
    ZTDropdown.enhanceAll(root);
    if (focusSel) {
      var el = root.querySelector(focusSel);
      if (el) {
        var dd = el.closest('.zt-dropdown');
        var t = (dd && dd.querySelector('.zt-dropdown__trigger')) || el;
        try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
      }
    }
  }
  // Actualización ligera (sin re-render) al escribir porcentajes o datos.
  function refreshLive(scopeKey) {
    var pr = root.querySelector('[data-progress="' + scopeKey + '"]');
    if (pr) pr.outerHTML = progressHTML(scopeKey);
    var note = root.querySelector('[data-company-note="' + scopeKey + '"]');
    if (note) note.textContent = companyNoteText(scopeKey);
    root.querySelectorAll('[data-neto]').forEach(function (el) {
      var p = persons.filter(function (x) { return x.id === el.getAttribute('data-neto'); })[0];
      if (p) el.textContent = money(neto(p));
    });
    var tt = document.getElementById('p7-totals');
    if (tt) tt.parentNode.outerHTML = totalsHTML();
    ctaTotal();
  }

  /* ═══════════════ EVENTOS ═══════════════ */
  function ctx(el) {
    var mEl = el.closest('[data-method]');
    var sEl = el.closest('[data-scope]');
    return { scopeKey: sEl && sEl.getAttribute('data-scope'), methodId: mEl && mEl.getAttribute('data-method') };
  }
  function methodDef(id) { return METHODS.filter(function (m) { return m.id === id; })[0]; }

  root.addEventListener('change', function (e) {
    var t = e.target, act = t.getAttribute('data-act');
    state.completed = false;
    if (act === 'modality') { state.modality = t.value; persist(); render('input[name="p7-modality"][value="' + t.value + '"]'); return; }
    if (act === 'paymode') { state.payMode = t.value; persist(); render('input[name="p7-paymode"][value="' + t.value + '"]'); ZTAlert.clear(alertEl); return; }
    if (act === 'toggle-method') {
      var c = ctx(t), scope = scopeOf(c.scopeKey), x = scope.methods[c.methodId];
      x.on = t.checked;
      if (x.on) {
        var rest = 100 - pctSum(scope) + (+x.pct || 0);   // asigna automáticamente lo que falta
        if (c.methodId === 'factura') x.amountType = x.amountType || 'pct';
        x.pct = rest > 0 ? rest : 0;
        if (methodDef(c.methodId).cfg && !cfgComplete(methodDef(c.methodId), x.cfg)) state.openCfg[c.scopeKey + ':' + c.methodId] = true;
      } else {
        x.pct = 0; delete state.openCfg[c.scopeKey + ':' + c.methodId];
      }
      persist(); render('#' + t.id); return;
    }
    if (act === 'amount-type') {
      var cc = ctx(t), sc = scopeOf(cc.scopeKey), fx = sc.methods.factura;
      fx.amountType = t.value;
      if (t.value === 'pct') {                          // vuelve a %: toma lo que falte
        var r2 = 100 - pctSum(sc) + (+fx.pct || 0);
        fx.pct = r2 > 0 ? r2 : 0;
      } else {                                          // valor fijo: si hay una sola forma más, cubre todo el saldo
        var rest1 = METHODS.filter(function (m) { return m.id !== 'factura' && sc.methods[m.id].on; });
        if (rest1.length === 1) sc.methods[rest1[0].id].pct = 100;
      }
      persist(); render(t.value === 'fixed' ? '#p7-' + cc.scopeKey + '-factura-fixed' : 'input[name="p7-' + cc.scopeKey + '-factura-type"][value="pct"]');
      return;
    }
    if (act === 'coupon-who' || act === 'coupon-code') {
      var cs = t.closest('[data-scope]').getAttribute('data-scope'), ci = +t.closest('[data-coupon]').getAttribute('data-coupon');
      var row = scopeOf(cs).coupons[ci];
      if (act === 'coupon-who') row.pid = t.value; else row.code = t.value;
      applyCoupon(cs, ci);
      persist(); render('#p7-coupon-' + cs + '-' + ci + (act === 'coupon-who' ? '' : ''));
      if (act === 'coupon-who' && !row.code) { var ci2 = document.getElementById('p7-coupon-' + cs + '-' + ci); if (ci2) ci2.focus(); }
      return;
    }
    if (act === 'decl') {
      var k = t.closest('[data-decl]').getAttribute('data-decl');
      state.accepted[k] = t.checked;
      t.closest('.p7-decl').classList.toggle('is-checked', t.checked);
      t.closest('.p7-decl').classList.remove('is-missing');
      var cnt = document.getElementById('p7-decl-count');
      if (cnt) { var dn = ['veracidad', 'crediticia'].filter(function (x) { return state.accepted[x]; }).length; cnt.textContent = dn + '/2'; cnt.classList.toggle('is-done', dn === 2); }
      persist(); return;
    }
    var key = t.getAttribute('data-cfg');
    if (key) onCfg(t, key);
  });
  root.addEventListener('input', function (e) {
    var t = e.target, act = t.getAttribute('data-act');
    if (act === 'pct') {
      var v = t.value.replace(/\D+/g, ''); if (v !== t.value) t.value = v;
      var c = ctx(t);
      scopeOf(c.scopeKey).methods[c.methodId].pct = Math.min(+v || 0, 100);
      state.completed = false; persist(); refreshLive(c.scopeKey); return;
    }
    if (act === 'fixed') {
      var d = t.value.replace(/\D+/g, '').replace(/^0+/, '').slice(0, 9);
      t.value = fmtThousands(d);
      var c2 = ctx(t);
      scopeOf(c2.scopeKey).methods.factura.fixed = +d || 0;
      state.completed = false; persist(); refreshLive(c2.scopeKey); return;
    }
    var key = t.getAttribute('data-cfg');
    if (key) onCfg(t, key);
  });
  function onCfg(t, key) {
    if (t.type === 'file') return;                      // lo maneja ZTFileUpload
    if (t.getAttribute('inputmode') === 'numeric') { var v = t.value.replace(/\D+/g, ''); if (v !== t.value) t.value = v; }
    var c = ctx(t), m = methodDef(c.methodId), x = scopeOf(c.scopeKey).methods[c.methodId];
    x.cfg[key] = t.value;
    var g = t.closest('.mp-input-group'); if (g) { (t.closest('.zt-dropdown') || t).classList.remove('error'); var er = g.querySelector('.mp-input-error'); if (er) er.hidden = true; }
    var st = t.closest('.p7-method').querySelector('.p7-status');
    if (st) { var ok = cfgComplete(m, x.cfg); st.className = 'p7-status ' + (ok ? 'is-ok' : 'is-pending'); st.textContent = ok ? '✓ Configurado' : 'Falta configurar'; }
    state.completed = false; persist();
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT') return;
    var act = b.getAttribute('data-act'), c = ctx(b);
    if (act === 'toggle-cfg') {
      var k = c.scopeKey + ':' + c.methodId;
      state.openCfg[k] = !state.openCfg[k];
      render(state.openCfg[k] ? '#p7-' + c.scopeKey + '-' + c.methodId + '-' + methodDef(c.methodId).cfg[0].key : '#p7-' + c.scopeKey + '-' + c.methodId);
      return;
    }
    if (act === 'toggle-person') {
      var pid = b.closest('[data-person]').getAttribute('data-person');
      state.openPerson = state.openPerson === pid ? null : pid;
      render('[data-person="' + pid + '"] [data-act="toggle-person"]');
      var el = root.querySelector('[data-person="' + pid + '"]');
      if (el && state.openPerson) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (act === 'coupon-toggle') {
      state.couponOpen[c.scopeKey] = !state.couponOpen[c.scopeKey];
      render('.p7-coupon[data-scope="' + c.scopeKey + '"] ' + (state.couponOpen[c.scopeKey] ? '.p7-coupon__row input, .p7-coupon__row select' : '[data-act="coupon-toggle"]'));
      return;
    }
    if (act === 'coupon-add') {
      var sc = scopeOf(c.scopeKey); sc.coupons.push({ pid: '', code: '', pct: 0 });
      persist(); render('#p7-coupon-' + c.scopeKey + '-' + (sc.coupons.length - 1) + '-who'); return;
    }
    if (act === 'coupon-del') {
      var sd = scopeOf(c.scopeKey), di = +b.closest('[data-coupon]').getAttribute('data-coupon');
      sd.coupons.splice(di, 1);
      persist(); render('.p7-coupon[data-scope="' + c.scopeKey + '"] [data-act="coupon-toggle"]'); return;
    }
    if (act === 'habeas') { openHabeas(); }
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.getAttribute('data-act') === 'coupon-code') {
      e.preventDefault();
      e.target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* ═══════════════ HABEAS DATA (modal) ═══════════════ */
  function openHabeas() {
    var c = document.createElement('div');
    [
      ['p', 'En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Compensar, como responsable del tratamiento, informa que los datos personales del titular y de sus beneficiarios serán tratados para:'],
      ['li', 'Gestionar la afiliación, la prestación y la auditoría del servicio de Medicina Prepagada.'],
      ['li', 'Facturar, recaudar y gestionar la cartera de las cuotas del plan.'],
      ['li', 'Enviar información sobre el plan, novedades del servicio y comunicaciones comerciales de Compensar.'],
      ['li', 'Tratar datos sensibles (salud) únicamente para la evaluación de asegurabilidad y la prestación del servicio.'],
      ['p', 'El titular tiene derecho a conocer, actualizar, rectificar y suprimir sus datos, y a revocar la autorización, a través de los canales de atención de Compensar.']
    ].reduce(function (acc, it) {
      if (it[0] === 'li') {
        var ul = acc.lastChild && acc.lastChild.tagName === 'UL' ? acc.lastChild : acc.appendChild(document.createElement('ul'));
        var li = document.createElement('li'); li.textContent = it[1]; ul.appendChild(li);
      } else { var p = document.createElement('p'); p.textContent = it[1]; acc.appendChild(p); }
      return acc;
    }, c);
    ZTModal.open({ type: 'info', size: 'lg', align: 'left', title: 'Tratamiento de datos personales', content: c,
      primaryAction: { label: 'Entendido', onClick: function () { ZTModal.close(); } } });
  }

  /* ═══════════════ VALIDACIÓN + CONTINUAR ═══════════════ */
  function validate() {
    var first = null, n = 0;
    function mark(el) { n++; if (!first) first = el; }
    var me = document.getElementById('p7-modality-error');
    if (!state.modality) { me.hidden = false; mark(root.querySelector('input[name="p7-modality"]')); } else me.hidden = true;

    var scopes = state.payMode === 'same' ? ['same'] : persons.map(function (p) { return p.id; });
    var badPerson = null;
    scopes.forEach(function (k) {
      var ok = scopeOk(k);
      if (!ok) {
        n++;
        if (state.payMode === 'per' && !badPerson) badPerson = k;
      }
    });
    if (badPerson && state.openPerson !== badPerson) { state.openPerson = badPerson; render(); }
    // Marcar errores del bloque visible
    scopes.forEach(function (k) {
      var err = document.getElementById('p7-methods-' + k + '-error');
      if (!err) return;
      var scope = scopeOf(k);
      var msg = calc(k).msg;
      err.textContent = msg; err.hidden = !msg;
      if (msg && !first) first = err.closest('.p7-sec').querySelector('.p7-method input') || err;
      // Abrir configuraciones incompletas y marcar sus campos
      METHODS.forEach(function (m) {
        var x = scope.methods[m.id];
        if (x.on && m.cfg && !cfgComplete(m, x.cfg) && !state.openCfg[k + ':' + m.id]) { state.openCfg[k + ':' + m.id] = true; render(); }
      });
    });
    root.querySelectorAll('.p7-cfg [data-cfg]').forEach(function (el) {
      var c = ctx(el), m = methodDef(c.methodId), f = m.cfg.filter(function (x) { return x.key === el.getAttribute('data-cfg'); })[0];
      if (f.type === 'file') {
        var fv = scopeOf(c.scopeKey).methods[c.methodId].cfg[f.key];
        var fbad = !(fv && fv.name);
        var grp = el.closest('.mp-input-group'); grp.classList.toggle('is-error', fbad);
        var up = grp.querySelector('.zt-upload'); if (up) up.classList.toggle('is-error', fbad);
        var fe = grp.querySelector('.mp-input-error'); if (fe) { if (fbad) fe.textContent = 'Adjunta el documento.'; fe.hidden = !fbad; }
        if (fbad && !first) first = el;
        return;
      }
      var v = String(el.value || '').trim();
      var bad = !v || (f.inputmode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      (el.closest('.zt-dropdown') || el).classList.toggle('error', bad);
      var er = el.closest('.mp-input-group').querySelector('.mp-input-error'); if (er) er.hidden = !bad;
      if (bad && !first) first = el;
    });
    scopes.forEach(function (k) {
      var bad = scopeOf(k).coupons.some(function (cp) { return (cp.code || (k === 'same' && cp.pid && cp.code)) && !cp.pct; });
      if (bad) {
        n++; state.couponOpen[k] = true;
        var ce = root.querySelector('.p7-coupon[data-scope="' + k + '"]');
        if (!ce) { render(); ce = root.querySelector('.p7-coupon[data-scope="' + k + '"]'); }
        if (ce && !first) first = ce.querySelector('.p7-coupon__code input.error') || ce.querySelector('.p7-coupon__code input');
      }
    });
    ['veracidad', 'crediticia'].forEach(function (k) {
      var row = root.querySelector('[data-decl="' + k + '"]');
      if (!state.accepted[k]) { row.classList.add('is-missing'); mark(row.querySelector('input')); }
    });
    return { n: n, first: first };
  }

  document.getElementById('p7-next').addEventListener('click', function () {
    var r = validate();
    if (!r.n) {
      state.completed = true; persist();
      window.location.href = '../paso-8/index.html';
      return;
    }
    // Re-validar tras posibles re-render (para pintar errores sobre el DOM actual).
    r = validate();
    ZTAlert.render(alertEl, { type: 'warning', title: 'Faltan datos para liquidar', description: 'Revisa los puntos marcados en rojo.' });
    var f = r.first;
    if (f) {
      var dd = f.closest && f.closest('.zt-dropdown');
      var t = (dd && dd.querySelector('.zt-dropdown__trigger')) || f;
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { t.focus({ preventScroll: true }); } catch (e) { t.focus && t.focus(); }
    }
  });
  document.getElementById('p7-back').addEventListener('click', function () { persist(); window.location.href = '../paso-6/index.html'; });

  if (!persons.length) { window.location.replace('../paso-3/index.html'); return; }
  render();
})();
