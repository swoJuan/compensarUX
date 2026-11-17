/* ============================================================
 * afiliacion-mock.js — Estado MOCK del candidato de afiliación (ZT)
 * ------------------------------------------------------------
 * ⚠️  LÓGICA MOCK DE PROTOTIPO — REEMPLAZAR POR SERVICIOS REALES.
 *
 * Fuente única para:
 *   - Nombre mock DETERMINÍSTICO derivado del número de documento
 *     (mismo documento → mismo nombre; documento distinto → puede cambiar).
 *   - Persistencia temporal del candidato viable en sessionStorage
 *     (sobrevive la navegación entre páginas del flujo; se limpia al
 *     cerrar la pestaña/sesión; sin persistencia permanente).
 *   - Etiquetas legibles del tipo de documento y formateo del número.
 *
 * Este módulo NO pinta UI: solo provee datos/estado. Lo consumen tanto la
 * pantalla de viabilidad (al obtener VIABLE) como el Paso 1 (al cargar).
 *
 * API (global ZTAfiliacion):
 *   personaMock(numero)                    -> { firstName, secondName, firstSurname, secondSurname }
 *   datosDocumentoMock(numero, tipo?)      -> { birthDate, gender, sex, maritalStatus, nationality }
 *                                             (tipo TI → 7–17 años; RC → 1–6 años; resto → adulto)
 *                                             (datos NO editables del Paso 2, "traídos" de la consulta)
 *   nombreMock(numero)                     -> "Carlos Andrés Gómez López"
 *   tipoLabel(codigo)                      -> "Cédula de ciudadanía"
 *   formatDoc(numero)                      -> "1.234.567.890"
 *   saveCandidate({documentType, documentNumber, name, firstName, secondName,
 *                  firstSurname, secondSurname, viable})
 *   getCandidate()                         -> objeto | null
 *   clearCandidate()
 *   isViable()                             -> boolean
 *   saveStep1(data) / getStep1() / clearStep1()
 *   saveStep2(data) / getStep2() / clearStep2()
 *   saveStep3(data) / getStep3() / clearStep3()   // { completed, contractorIsBeneficiary, beneficiaries[] }
 *   saveStep7(data) / getStep7() / clearStep7()   // Liquidación { completed, modality, payMode, same{}, per{}, accepted{} }
 *   saveStep8(data) / getStep8() / clearStep8()   // Soportes { completed, docs{ personId: { docId: [ {name,size} ] } }, requestId, finishedAt }
 *   saveStep6(data) / getStep6() / clearStep6()   // Sarlaft { completed, personType, values{}, partners[] }
 *   saveStep5(data) / getStep5() / clearStep5()   // { completed, checked{ itemId: true } }
 *   saveStep4(data) / getStep4() / clearStep4()   // { completed, currentPersonId, declarations{ personId: {...} } }
 * ============================================================ */
(function (global) {
  'use strict';

  var CANDIDATE_KEY = 'zt-afiliacion-candidato';
  var STEP1_KEY     = 'zt-afiliacion-paso1';
  var STEP2_KEY     = 'zt-afiliacion-paso2';
  var STEP3_KEY     = 'zt-afiliacion-paso3';
  var STEP4_KEY     = 'zt-afiliacion-paso4';
  var STEP5_KEY     = 'zt-afiliacion-paso5';
  var STEP6_KEY     = 'zt-afiliacion-paso6';
  var STEP7_KEY     = 'zt-afiliacion-paso7';
  var STEP8_KEY     = 'zt-afiliacion-paso8';
  var OTP_RESEND_KEY = 'zt-afiliacion-otp-resend-at';   // timestamp (ms) fin countdown
  var UPDATED_KEY    = 'zt-afiliacion-actualizado';     // última vez que se guardó algo

  /* Almacenamiento: localStorage para que la afiliación en curso NO se pierda al
   * cerrar la pestaña (se ofrece "Retomar" en el Paso 0). Si no está disponible
   * (modo privado estricto), cae a sessionStorage. ⚠️ Prototipo: en producción
   * el borrador vive en el backend, asociado al asesor y al documento. */
  var STORE = (function () {
    try { localStorage.setItem('__zt', '1'); localStorage.removeItem('__zt'); return localStorage; }
    catch (e) { return sessionStorage; }
  })();

  /* ⚠️  MOCK OTP — REEMPLAZAR POR VALIDACIÓN DE SERVICIO.
   * En producción la generación, el envío, la expiración, el número de intentos
   * y la validación del código DEBEN controlarse en el backend. Aquí es solo una
   * simulación visual de prototipo. Fuente ÚNICA del código y de la vigencia. */
  var OTP_CONFIG = {
    code: '123456',      // código correcto del prototipo (MOCK)
    length: 6,           // número de dígitos
    resendSeconds: 120   // countdown de reenvío / vigencia del código: 2:00
  };

  /* Bancos de nombres mock del prototipo (no representan personas reales).
   * Se combinan de forma DETERMINÍSTICA según el número de documento para que
   * el mismo documento devuelva siempre exactamente la misma persona. Algunos
   * segundos nombres/apellidos quedan vacíos a propósito ("Ninguno" en la UI). */
  var FIRST_NAMES    = ['María', 'Carlos', 'Laura', 'Andrés', 'Daniela', 'Juan', 'Sofía', 'Diego'];
  var SECOND_NAMES_F = ['Fernanda', 'Marcela', 'Isabel', ''];
  var SECOND_NAMES_M = ['Felipe', 'Sebastián', 'Alejandro', ''];
  var FIRST_SURNAMES = ['Ríos', 'Gómez', 'Torres', 'Ramírez', 'Rodríguez', 'López', 'Vargas', 'Castro'];
  var SECOND_SURNAMES= ['López', 'Arenas', '', 'Mejía', 'Cárdenas', '', 'Peña', 'Duarte'];

  /* Etiquetas legibles del tipo de documento (código → texto completo). */
  var TIPO_LABEL_FULL = {
    CC:  'Cédula de ciudadanía',
    TI:  'Tarjeta de identidad',
    RC:  'Registro civil',
    CE:  'Cédula de extranjería',
    PA:  'Pasaporte',
    PPT: 'Permiso por Protección Temporal'
  };

  /* Hash determinístico simple (sin dependencias) sobre los dígitos del
   * documento. Devuelve un entero >= 0; el mismo documento → mismo hash. */
  function hashDoc(numero) {
    var digits = String(numero || '').replace(/\D+/g, '');
    var h = 0;
    for (var i = 0; i < digits.length; i++) {
      h = (h * 31 + (digits.charCodeAt(i) - 48)) >>> 0;
    }
    return h;
  }

  /* Persona MOCK determinística a partir del número de documento.
   * Cada componente del nombre se elige con un desplazamiento distinto del hash
   * para que el mismo documento produzca siempre la misma persona completa y
   * documentos distintos varíen. Segundo nombre/apellido pueden ser "" (opcional). */
  function personaMock(numero) {
    var h = hashDoc(numero);
    return {
      firstName:     FIRST_NAMES[h % FIRST_NAMES.length],
      // Segundo nombre coherente con el primero (índices pares de FIRST_NAMES = mujer).
      secondName:    ((h % FIRST_NAMES.length) % 2 === 0 ? SECOND_NAMES_F : SECOND_NAMES_M)[(h >>> 2) % 4],
      firstSurname:  FIRST_SURNAMES[(h >>> 4) % FIRST_SURNAMES.length],
      secondSurname: SECOND_SURNAMES[(h >>> 6) % SECOND_SURNAMES.length]
    };
  }

  /* Datos del documento MOCK determinísticos (Paso 2, no editables).
   * ⚠️ En producción vienen del servicio de consulta del documento.
   * El sexo/género es coherente con el primer nombre mock (índices pares = mujer). */
  var MARITAL = ['soltero', 'casado', 'union-libre', 'casado', 'divorciado', 'soltero'];
  function datosDocumentoMock(numero, tipo) {
    var h = hashDoc(numero);
    var mujer = (h % FIRST_NAMES.length) % 2 === 0;
    var thisYear = new Date().getFullYear();
    var year = tipo === 'TI' ? thisYear - 7 - (h >>> 3) % 11      // Tarjeta de identidad: 7–17 años
             : tipo === 'RC' ? thisYear - 1 - (h >>> 3) % 6       // Registro civil: 1–6 años
             : 1960 + (h >>> 3) % 41;                              // Adultos: 1960–2000
    var month = 1 + (h >>> 5) % 12;
    var day = 1 + (h >>> 7) % 28;
    return {
      birthDate: year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
      gender: mujer ? 'mujer' : 'hombre',
      sex: mujer ? 'femenino' : 'masculino',
      maritalStatus: (tipo === 'TI' || tipo === 'RC') ? 'soltero' : MARITAL[(h >>> 9) % MARITAL.length],
      nationality: 'colombiana'
    };
  }

  /* Nombre completo MOCK determinístico (concatena las partes no vacías).
   * El mismo documento siempre devuelve el mismo nombre. */
  function nombreMock(numero) {
    var p = personaMock(numero);
    return [p.firstName, p.secondName, p.firstSurname, p.secondSurname]
      .filter(function (x) { return x; })
      .join(' ');
  }

  function tipoLabel(codigo) {
    return TIPO_LABEL_FULL[codigo] || codigo || '';
  }

  /* Formatea un número con separador de miles (solo presentación). */
  function formatDoc(numero) {
    return String(numero || '').replace(/\D+/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* ── Persistencia del candidato (sessionStorage) ── */
  function saveCandidate(cand) {
    try { STORE.setItem(CANDIDATE_KEY, JSON.stringify(cand)); } catch (e) {}
    touch();
  }
  function getCandidate() {
    try {
      var raw = STORE.getItem(CANDIDATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearCandidate() {
    try { STORE.removeItem(CANDIDATE_KEY); } catch (e) {}
  }
  function isViable() {
    var c = getCandidate();
    return !!(c && c.viable === true && c.documentType && c.documentNumber);
  }

  /* ── Persistencia de los datos editables del Paso 1 (separada del candidato) ── */
  function saveStep1(data) {
    try { STORE.setItem(STEP1_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep1() {
    try {
      var raw = STORE.getItem(STEP1_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep1() {
    try { STORE.removeItem(STEP1_KEY); } catch (e) {}
  }

  /* ── Persistencia de los datos del Paso 2 (separada de candidato y Paso 1) ── */
  function saveStep2(data) {
    try { STORE.setItem(STEP2_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep2() {
    try {
      var raw = STORE.getItem(STEP2_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep2() {
    try { STORE.removeItem(STEP2_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 3 (Beneficiarios) — modelo ÚNICO del paso ──
   * Guarda un solo objeto step3 = { completed, contractorIsBeneficiary, beneficiaries[] }.
   * NO se guarda una clave por beneficiario: la colección vive dentro de step3. */
  function saveStep3(data) {
    try { STORE.setItem(STEP3_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep3() {
    try {
      var raw = STORE.getItem(STEP3_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep3() {
    try { STORE.removeItem(STEP3_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 4 (Estados de salud) — modelo ÚNICO del paso ──
   * step4 = { completed, currentPersonId, declarations: { <personId>: {...} } }.
   * Una declaración de asegurabilidad por persona afiliada (contratante si es
   * beneficiario + cada beneficiario del Paso 3), todas dentro de step4. */
  function saveStep4(data) {
    try { STORE.setItem(STEP4_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep4() {
    try {
      var raw = STORE.getItem(STEP4_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep4() {
    try { STORE.removeItem(STEP4_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 5 (LVI) ── */
  function saveStep5(data) {
    try { STORE.setItem(STEP5_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep5() {
    try {
      var raw = STORE.getItem(STEP5_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep5() {
    try { STORE.removeItem(STEP5_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 6 (Sarlaft) ── */
  function saveStep6(data) {
    try { STORE.setItem(STEP6_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep6() {
    try {
      var raw = STORE.getItem(STEP6_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep6() {
    try { STORE.removeItem(STEP6_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 7 (Liquidación) ── */
  function saveStep7(data) {
    try { STORE.setItem(STEP7_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep7() {
    try {
      var raw = STORE.getItem(STEP7_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep7() {
    try { STORE.removeItem(STEP7_KEY); } catch (e) {}
  }

  /* ── Persistencia del Paso 8 (Soportes) — solo METADATOS de archivos ── */
  function saveStep8(data) {
    try { STORE.setItem(STEP8_KEY, JSON.stringify(data)); } catch (e) {}
    touch();
  }
  function getStep8() {
    try {
      var raw = STORE.getItem(STEP8_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearStep8() {
    try { STORE.removeItem(STEP8_KEY); } catch (e) {}
  }

  /* ── OTP (MOCK) ──
   * getOtpConfig(): configuración única del prototipo (código, longitud, segundos).
   * verifyOtp(code): compara con el código mock. En producción → llamada al backend.
   * saveOtpResendAt/getOtpResendAt/clearOtpResend: persistencia del fin del countdown
   *   (timestamp) para que refrescar la página no reinicie el contador. */
  function getOtpConfig() {
    return { code: OTP_CONFIG.code, length: OTP_CONFIG.length, resendSeconds: OTP_CONFIG.resendSeconds };
  }
  function verifyOtp(code) {
    return String(code) === OTP_CONFIG.code;   // MOCK — reemplazar por servicio
  }
  function saveOtpResendAt(ts) {
    try { STORE.setItem(OTP_RESEND_KEY, String(ts)); } catch (e) {}
  }
  function getOtpResendAt() {
    try {
      var raw = STORE.getItem(OTP_RESEND_KEY);
      return raw ? parseInt(raw, 10) : null;
    } catch (e) { return null; }
  }
  function clearOtpResend() {
    try { STORE.removeItem(OTP_RESEND_KEY); } catch (e) {}
  }

  /* ═══════════════ FLUJO, BORRADOR Y NAVEGACIÓN ═══════════════ */
  function touch() { try { STORE.setItem(UPDATED_KEY, String(Date.now())); } catch (e) {} }

  /* Reglas del flujo según el Paso 1 (fuente ÚNICA para todos los pasos):
   *   individual → solo el contratante (sin beneficiarios)
   *   familiar   → contratante + al menos un beneficiario
   *   colectivo  → no cambia el formulario (beneficiarios opcionales); Sarlaft jurídica
   *   inclusion  → contrato vigente: el contratante NO se declara, NO se liquida
   *                ni carga soportes; solo los beneficiarios nuevos
   *   novelty    → no recorre el proceso de afiliación (se registra en el Paso 1) */
  function flow() {
    var s1 = getStep1() || {};
    var m = s1.modality || 'individual', t = s1.transactionType || 'new';
    return {
      modality: m, transactionType: t,
      isIndividual: m === 'individual', isFamiliar: m === 'familiar', isColectivo: m === 'colectivo',
      isInclusion: t === 'inclusion', isNovelty: t === 'novelty',
      // ¿El contratante se declara/liquida en este proceso?
      contractorInProcess: t !== 'inclusion'
    };
  }

  /* Pasos del proceso (etiquetas + rutas relativas a /iniciar-afiliacion/). */
  var STEPS = [
    { n: 1, label: 'Iniciar afiliación',    path: 'paso-1/index.html' },
    { n: 2, label: 'Datos del contratante', path: 'paso-2/index.html' },
    { n: 3, label: 'Beneficiarios',         path: 'paso-3/index.html' },
    { n: 4, label: 'Estados de salud',      path: 'paso-4/index.html' },
    { n: 5, label: 'LVI',                   path: 'paso-5/index.html' },
    { n: 6, label: 'Sarlaft',               path: 'paso-6/index.html' },
    { n: 7, label: 'Liquidación',           path: 'paso-7/index.html' },
    { n: 8, label: 'Soportes',              path: 'paso-8/index.html' }
  ];
  var GETTERS = { 1: getStep1, 2: getStep2, 3: getStep3, 4: getStep4, 5: getStep5, 6: getStep6, 7: getStep7, 8: getStep8 };
  function stepDone(n) {
    var d = GETTERS[n] && GETTERS[n]();
    if (!d || d.completed !== true) return false;
    return n === 2 ? d.otpVerified === true : true;
  }
  function flowRoot() {
    var p = location.pathname, i = p.indexOf('/iniciar-afiliacion/');
    return i === -1 ? '' : p.slice(0, i + '/iniciar-afiliacion/'.length);
  }
  function stepHref(n) {
    var s = STEPS.filter(function (x) { return x.n === n; })[0];
    return flowRoot() + (s ? s.path : 'index.html');
  }
  /* Primer paso sin completar (dónde retomar). 9 = todo completo. */
  function resumeStep() {
    for (var n = 1; n <= 8; n++) if (!stepDone(n)) return n;
    return 9;
  }

  /* Guardia al salir por el panel de pasos: la pantalla puede registrar una
   * función fn({ forward, target }) que guarda lo diligenciado y devuelve false
   * si no se debe salir (p. ej. errores al avanzar). */
  var leaveGuard = null;
  function setLeaveGuard(fn) { leaveGuard = typeof fn === 'function' ? fn : null; }

  /* Config lista para ZTStepper.render: pasos completados (antes o después del
   * actual) son clicables; el resto queda deshabilitado. */
  function stepperConfig(current) {
    return {
      current: current,
      steps: STEPS.map(function (s) {
        var st = { label: s.label };
        if (s.n !== current && s.n > current && stepDone(s.n)) st.state = 'completed';
        return st;
      }),
      onSelect: function (n) {
        if (n === current) return;
        if (n > current && !stepDone(n)) return;
        // La pantalla guarda lo diligenciado (Pasos 1–3). Hacia adelante además
        // valida: si hay errores no se sale. Hacia atrás siempre se puede ir.
        if (leaveGuard) { if (leaveGuard({ forward: n > current, target: n }) === false) return; }
        // Avanzar con el paso actual sin completar (se editó y no se guardó):
        // pedir "Guardar y continuar" para no saltarse su validación.
        else if (n > current && !stepDone(current)) {
          var label = STEPS[current - 1] ? STEPS[current - 1].label : 'este paso';
          var next = document.querySelector('.pa-next');
          if (global.ZTModal) {
            ZTModal.open({
              type: 'info',
              title: 'Primero guarda este paso',
              body: ['Hay cambios en «' + label + '» sin validar. Usa «Guardar y continuar» para revisarlos antes de avanzar a «' + STEPS[n - 1].label + '».'],
              primaryAction: { label: 'Guardar y continuar', onClick: function () { ZTModal.close(); if (next) next.click(); } },
              secondaryAction: { label: 'Seguir editando', onClick: function () { ZTModal.close(); } }
            });
          } else if (next) next.click();
          return;
        }
        location.href = stepHref(n);
      }
    };
  }

  /* Afiliación en curso (para "Retomar" en el Paso 0). null si no hay. */
  function draftSummary() {
    var c = getCandidate();
    if (!c || !c.viable || !getStep1()) return null;
    var s8 = getStep8();
    if (s8 && s8.completed) return null;
    var n = resumeStep();
    var st = STEPS.filter(function (x) { return x.n === Math.min(n, 8); })[0];
    var ts = null; try { ts = +STORE.getItem(UPDATED_KEY) || null; } catch (e) {}
    return { name: c.name, documentType: c.documentType, documentNumber: c.documentNumber,
      step: Math.min(n, 8), stepLabel: st.label, href: stepHref(Math.min(n, 8)), updatedAt: ts };
  }
  function clearAll() {
    [CANDIDATE_KEY, STEP1_KEY, STEP2_KEY, STEP3_KEY, STEP4_KEY, STEP5_KEY, STEP6_KEY, STEP7_KEY, STEP8_KEY, OTP_RESEND_KEY, UPDATED_KEY]
      .forEach(function (k) { try { STORE.removeItem(k); } catch (e) {} });
  }

  /* ═══════════════ RADICADOS (Mis radicados) ═══════════════
   * ⚠️ MOCK: 12 radicados de ejemplo + los que se crean en este navegador al
   * finalizar el Paso 8 o registrar una novedad en el Paso 1.
   * status: en_tramite | pend_doc | pend_pago | aprobado | rechazado | finalizado */
  var RADICADOS_KEY = 'zt-radicados';
  var RADICADOS_MOCK = [
    { id: 'RAD-2026-000123', type: 'Afiliación beneficiario',  name: 'Juan Ríos',              doc: 'CC 1020334556', createdAt: '2026-09-27', updatedAt: '2026-09-28', status: 'en_tramite', plan: 'Plan Ideal',    persons: 1 },
    { id: 'RAD-2026-000121', type: 'Afiliación cotizante',     name: 'Paula Andrea Gómez',     doc: 'CC 52884120',   createdAt: '2026-09-25', updatedAt: '2026-09-28', status: 'en_tramite', plan: 'Plan Óptimo', persons: 3 },
    { id: 'RAD-2026-000118', type: 'Afiliación cotizante',     name: 'Carlos Mejía Arenas',    doc: 'CC 80456221',   createdAt: '2026-09-22', updatedAt: '2026-09-28', status: 'pend_doc',   plan: 'Plan Ideal',    persons: 2, note: 'Falta el certificado EPS de 1 beneficiario.' },
    { id: 'RAD-2026-000115', type: 'Estudio de asegurabilidad', name: 'Daniela Torres',        doc: 'CC 1032455870', createdAt: '2026-09-19', updatedAt: '2026-09-26', status: 'en_tramite', plan: 'Plan Ideal', persons: 1, note: 'En revisión por auditoría médica.' },
    { id: 'RAD-2026-000112', type: 'Inclusión de beneficiario', name: 'Sofía Castro Ríos',     doc: 'TI 1098765432', createdAt: '2026-09-17', updatedAt: '2026-09-25', status: 'pend_pago',  plan: 'Plan Ideal',    persons: 1, note: 'Enlace de pago enviado al contratante.' },
    { id: 'RAD-2026-000109', type: 'Estudio de asegurabilidad', name: 'Andrés Felipe Vargas',  doc: 'CC 79112334',   createdAt: '2026-09-15', updatedAt: '2026-09-24', status: 'aprobado',   plan: 'Plan Ideal',    persons: 1 },
    { id: 'RAD-2026-000104', type: 'Afiliación beneficiario',  name: 'Diego Ramírez Peña',     doc: 'CC 1015667788', createdAt: '2026-09-10', updatedAt: '2026-09-23', status: 'en_tramite', plan: 'Plan Óptimo', persons: 2 },
    { id: 'RAD-2026-000101', type: 'Novedad',                  name: 'María Isabel López',     doc: 'CC 39776512',   createdAt: '2026-09-08', updatedAt: '2026-09-21', status: 'en_tramite', plan: 'Plan Ideal',    persons: 1, note: 'Cambio de plan a Plan Óptimo.' },
    { id: 'RAD-2026-000097', type: 'Inclusión de beneficiario', name: 'Laura Peña Cárdenas',   doc: 'RC 1101223344', createdAt: '2026-09-02', updatedAt: '2026-09-15', status: 'rechazado',  plan: 'Plan Ideal', persons: 1, note: 'No cumple la condición de parentesco para el plan.' },
    { id: 'RAD-2026-000092', type: 'Afiliación cotizante',     name: 'Juan Sebastián Cárdenas', doc: 'CC 1019887766', createdAt: '2026-08-27', updatedAt: '2026-09-10', status: 'aprobado',  plan: 'Plan Ideal',    persons: 4 },
    { id: 'RAD-2026-000084', type: 'Afiliación beneficiario',  name: 'Valentina Rodríguez',    doc: 'CC 1000223456', createdAt: '2026-08-20', updatedAt: '2026-08-29', status: 'finalizado', plan: 'Plan Ideal',    persons: 1 },
    { id: 'RAD-2026-000079', type: 'Afiliación cotizante',     name: 'Sebastián Duarte Gómez', doc: 'CC 80998877',   createdAt: '2026-08-14', updatedAt: '2026-08-25', status: 'finalizado', plan: 'Plan Óptimo', persons: 2 }
  ];
  function savedRadicados() {
    try { var raw = STORE.getItem(RADICADOS_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  /* Todos los radicados, del más reciente al más antiguo. */
  function getRadicados() {
    return savedRadicados().concat(RADICADOS_MOCK).sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : (a.id < b.id ? 1 : -1);
    });
  }
  /* Crea (o actualiza, si ya existe el id) un radicado. Devuelve el radicado. */
  function saveRadicado(r) {
    var list = savedRadicados();
    if (!r.id) {
      var max = getRadicados().reduce(function (m, x) { var n = +String(x.id).split('-').pop() || 0; return Math.max(m, n); }, 0);
      r.id = 'RAD-' + new Date().getFullYear() + '-' + String(max + 1).padStart(6, '0');
    }
    var i = -1; list.forEach(function (x, k) { if (x.id === r.id) i = k; });
    if (i >= 0) list[i] = Object.assign({}, list[i], r); else list.unshift(r);
    try { STORE.setItem(RADICADOS_KEY, JSON.stringify(list)); } catch (e) {}
    return r;
  }

  global.ZTAfiliacion = {
    personaMock: personaMock,
    datosDocumentoMock: datosDocumentoMock,
    nombreMock: nombreMock,
    tipoLabel: tipoLabel,
    formatDoc: formatDoc,
    saveCandidate: saveCandidate,
    getCandidate: getCandidate,
    clearCandidate: clearCandidate,
    isViable: isViable,
    saveStep1: saveStep1,
    getStep1: getStep1,
    clearStep1: clearStep1,
    saveStep2: saveStep2,
    getStep2: getStep2,
    clearStep2: clearStep2,
    saveStep3: saveStep3,
    getStep3: getStep3,
    clearStep3: clearStep3,
    saveStep4: saveStep4,
    getStep4: getStep4,
    clearStep4: clearStep4,
    saveStep5: saveStep5,
    getStep5: getStep5,
    clearStep5: clearStep5,
    saveStep6: saveStep6,
    getStep6: getStep6,
    clearStep6: clearStep6,
    saveStep7: saveStep7,
    getStep7: getStep7,
    clearStep7: clearStep7,
    saveStep8: saveStep8,
    getStep8: getStep8,
    clearStep8: clearStep8,
    getOtpConfig: getOtpConfig,
    verifyOtp: verifyOtp,
    saveOtpResendAt: saveOtpResendAt,
    getOtpResendAt: getOtpResendAt,
    clearOtpResend: clearOtpResend,
    flow: flow,
    steps: STEPS,
    stepDone: stepDone,
    stepHref: stepHref,
    resumeStep: resumeStep,
    stepperConfig: stepperConfig,
    setLeaveGuard: setLeaveGuard,
    draftSummary: draftSummary,
    clearAll: clearAll,
    getRadicados: getRadicados,
    saveRadicado: saveRadicado
  };
})(window);
