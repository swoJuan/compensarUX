/* ============================================================
 * demo-nav.js — "Modo prototipo" del flujo Iniciar afiliación (ZT)
 * ------------------------------------------------------------
 * ⚠️ SOLO PROTOTIPO. Botón flotante que permite saltar a cualquier paso SIN
 * validar campos (para revisiones de diseño, pruebas con usuarios, demos).
 *
 * Cómo funciona:
 *   - Al elegir un paso, completa con DATOS DE EJEMPLO solo los pasos
 *     anteriores que falten (lo ya diligenciado se conserva) y los marca como
 *     completos, para que el control de acceso de cada paso no redirija.
 *   - "Siguiente paso sin validar" = atajo al paso inmediatamente posterior.
 *   - "Reiniciar proceso" borra todos los datos del flujo (sessionStorage).
 *
 * Uso: una sola línea al final de cada página del flujo (carga su propio CSS):
 *   <script src="<ruta>/iniciar-afiliacion/js/demo-nav.js"></script>
 * Para ocultarlo en una sesión: ?demo=0 en la URL (se recuerda en la sesión);
 * ?demo=1 lo vuelve a mostrar.
 * Para publicar a producción: quitar esa línea de las páginas.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;
  if (!Z) return;

  /* ─── Visibilidad (?demo=0 / ?demo=1, recordado en la sesión) ─── */
  var HIDE_KEY = 'zt-afiliacion-demo-hidden';
  var q = location.search.match(/[?&]demo=([01])/);
  try {
    if (q) sessionStorage.setItem(HIDE_KEY, q[1] === '0' ? '1' : '0');
    if (sessionStorage.getItem(HIDE_KEY) === '1') return;
  } catch (e) {}

  /* ─── Rutas relativas a la carpeta del flujo (desde la ubicación de este script) ─── */
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var FLOW = new URL('../', scriptSrc || location.href);   // …/iniciar-afiliacion/

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('css/demo-nav.css', FLOW).href;
  document.head.appendChild(link);

  var STEPS = [
    { n: 0,   label: 'Consulta de viabilidad', path: 'index.html' },
    { n: 1,   label: 'Datos generales', path: 'paso-1/index.html' },
    { n: 2,   label: 'Datos del contratante', path: 'paso-2/index.html' },
    { n: 2.5, label: 'Validación OTP', path: 'paso-2/validacion-informacion/index.html', sub: true },
    { n: 3,   label: 'Beneficiarios', path: 'paso-3/index.html' },
    { n: 4,   label: 'Estados de salud', path: 'paso-4/index.html' },
    { n: 5,   label: 'LVI', path: 'paso-5/index.html' },
    { n: 6,   label: 'Sarlaft', path: 'paso-6/index.html' },
    { n: 7,   label: 'Liquidación', path: 'paso-7/index.html' },
    { n: 8,   label: 'Soportes', path: 'paso-8/index.html' }
  ];

  function currentStep() {
    var p = location.pathname;
    if (/validacion-informacion/.test(p)) return 2.5;
    var m = p.match(/paso-(\d)/);
    return m ? +m[1] : 0;
  }

  /* ═══════════ Datos de ejemplo (solo para lo que falte) ═══════════ */
  var NUM = '222';
  function ensureUpTo(n) {
    if (n >= 1 && !Z.isViable()) {
      var p = Z.personaMock(NUM);
      Z.saveCandidate({ documentType: 'CC', documentNumber: NUM, name: Z.nombreMock(NUM),
        firstName: p.firstName, secondName: p.secondName, firstSurname: p.firstSurname,
        secondSurname: p.secondSurname, viable: true });
    }
    var cand = Z.getCandidate() || {};
    if (n >= 2) {
      Z.saveStep1(Object.assign({ modality: 'individual', transactionType: 'new', noveltyType: null,
        affiliationChannel: 'independent', companyName: null, nit: null, plan: 'ideal',
        startDate: nextMonthISO() }, Z.getStep1() || {}, { completed: true }));
    }
    if (n >= 2.5) {
      var d = Z.datosDocumentoMock ? Z.datosDocumentoMock(cand.documentNumber || NUM) : {};
      var base = Object.assign({ birthDate: d.birthDate, age: edad(d.birthDate), gender: d.gender, sex: d.sex,
        maritalStatus: d.maritalStatus, nationality: d.nationality, eps: 'compensar', ethnicGroup: 'ninguno',
        birthCountry: 'colombia', phone: '3001234567', email: 'cliente@ejemplo.co',
        address: 'Calle 10 # 20-30', department: 'valle', city: 'cali' }, Z.getStep2() || {});
      if (n >= 3) { base.completed = true; base.otpVerified = true; }
      Z.saveStep2(base);
    }
    if (n >= 4) Z.saveStep3(Object.assign({ contractorIsBeneficiary: true, beneficiaries: [] }, Z.getStep3() || {}, { completed: true }));
    if (n >= 5) {
      // Declaración completa (datos de ejemplo) para cada persona del Paso 3.
      var s3 = Z.getStep3() || {}, s4 = Z.getStep4() || {}, decl = s4.declarations || {};
      var ids = (s3.contractorIsBeneficiary ? ['contratante'] : []).concat((s3.beneficiaries || []).map(function (b) { return b.id; }));
      ids.forEach(function (id) { if (!decl[id] || decl[id].status !== 'complete') decl[id] = Object.assign({ weight: '68', height: '165' }, decl[id] || {}, { status: 'complete' }); });
      Z.saveStep4(Object.assign({ currentPersonId: ids[0] || 'contratante' }, s4, { declarations: decl, completed: true }));
    }
    if (n >= 6) {
      var s5 = Z.getStep5() || {};
      var checked = s5.checked || {};
      ['plan', 'regimen', 'preexistencias', 'carencia', 'antiguedad', 'maternidad', 'coberturas',
       'inclusion', 'tarifas', 'mora', 'pago'].forEach(function (k) { checked[k] = true; });
      Z.saveStep5({ checked: checked, completed: true });
    }
    if (n >= 7 && Z.saveStep6) {
      Z.saveStep6(Object.assign({ personType: 'natural', values: { activity: 'independiente' }, partners: [] },
        Z.getStep6() || {}, { completed: true }));
    }
  }
  function ensureStep7(n) {
    if (n >= 8 && Z.saveStep7) {
      Z.saveStep7(Object.assign({ modality: 'mensual', payMode: 'same', same: null, per: {},
        accepted: { veracidad: true, crediticia: true },
        totals: { pleno: 412500, neto: 412500, modality: 412500, enrollment: 150000, iva: 0, total: 562500 } },
        Z.getStep7() || {}, { completed: true }));
    }
  }
  function nextMonthISO() {
    var h = new Date(); var d = new Date(h.getFullYear(), h.getMonth() + 1, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  }
  function edad(iso) {
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00'), h = new Date();
    var e = h.getFullYear() - b.getFullYear();
    if (h.getMonth() < b.getMonth() || (h.getMonth() === b.getMonth() && h.getDate() < b.getDate())) e--;
    return e;
  }
  function goTo(step) {
    ensureUpTo(step.n);
    ensureStep7(step.n);
    location.href = new URL(step.path, FLOW).href;
  }
  function resetAll() {
    if (typeof Z.clearAll === 'function') Z.clearAll();
    location.href = new URL('index.html', FLOW).href;
  }

  /* ═══════════ UI ═══════════ */
  var cur = currentStep();
  var idxCur = STEPS.map(function (s) { return s.n; }).indexOf(cur);
  var next = STEPS.slice(idxCur + 1).filter(function (s) { return !s.soon; })[0] || null;

  var root = document.createElement('div');
  root.className = 'zt-demo';
  var panelId = 'zt-demo-panel';
  root.innerHTML =
    '<div class="zt-demo__panel" id="' + panelId + '" role="dialog" aria-label="Modo prototipo" hidden>' +
      '<div class="zt-demo__head">' +
        '<p class="zt-demo__title">Modo prototipo</p>' +
        '<p class="zt-demo__desc">Salta entre pasos sin validar. Los pasos anteriores que falten se completan con datos de ejemplo.</p>' +
      '</div>' +
      (next ? '<button type="button" class="zt-demo__next" data-go="' + next.n + '">Siguiente paso sin validar<span class="zt-demo__next-to">' + next.label + ' →</span></button>' : '') +
      '<ol class="zt-demo__list">' +
        STEPS.map(function (s) {
          var isCur = s.n === cur;
          var num = s.n === 0 ? '·' : (s.sub ? '2b' : String(s.n));
          return '<li><button type="button" class="zt-demo__item' + (isCur ? ' is-current' : '') + (s.sub ? ' is-sub' : '') + '"' +
            (s.soon || isCur ? ' disabled' : '') + ' data-go="' + s.n + '"' + (isCur ? ' aria-current="step"' : '') + '>' +
            '<span class="zt-demo__num">' + num + '</span>' +
            '<span class="zt-demo__label">' + s.label + '</span>' +
            (s.soon ? '<span class="zt-demo__tag">Próximamente</span>' : isCur ? '<span class="zt-demo__tag">Aquí</span>' : '') +
          '</button></li>';
        }).join('') +
      '</ol>' +
      '<button type="button" class="zt-demo__reset" data-reset>Reiniciar proceso</button>' +
    '</div>' +
    '<button type="button" class="zt-demo__toggle" aria-expanded="false" aria-controls="' + panelId + '">' +
      '<span class="icon icon-lightning icon-16 gs-inherit" aria-hidden="true"></span>' +
      '<span>Modo prototipo</span>' +
    '</button>';
  document.body.appendChild(root);

  var toggle = root.querySelector('.zt-demo__toggle');
  var panel = root.querySelector('.zt-demo__panel');
  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    if (open) { var f = panel.querySelector('button:not([disabled])'); if (f) f.focus(); }
  }
  toggle.addEventListener('click', function () { setOpen(panel.hidden); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) { if (!root.contains(e.target) && !panel.hidden) setOpen(false); });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b && !b.disabled) {
      var n = parseFloat(b.getAttribute('data-go'));
      goTo(STEPS.filter(function (s) { return s.n === n; })[0]);
      return;
    }
    if (e.target.closest('[data-reset]')) resetAll();
  });
})();
