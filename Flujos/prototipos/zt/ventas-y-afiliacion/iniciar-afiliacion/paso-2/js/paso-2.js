/* ============================================================
 * paso-2.js — PASO 2 "Datos del contratante" del Proceso de afiliación (ZT)
 * ------------------------------------------------------------
 * Responsabilidades (prototipo, sin backend real):
 *   - CONTROL DE ACCESO por etapas:
 *       · sin candidato viable            → volver a la consulta de viabilidad
 *       · candidato viable pero Paso 1 sin → volver al Paso 1
 *         completar/guardar
 *   - Hidratar el resumen del candidato (nombre + tipo/número doc) y los campos
 *     de identificación (readonly) desde el candidato persistido. Si un candidato
 *     antiguo no trae las partes del nombre, se derivan de personaMock (compat).
 *   - Stepper transversal (8 pasos, current = 2 → Paso 1 completado, Paso 2 activo).
 *   - Datos del documento NO editables (fecha de nacimiento, edad, género, sexo,
 *     estado civil, nacionalidad): vienen de la consulta del documento (mock
 *     datosDocumentoMock) y se muestran como información etiqueta/valor, no
 *     como campos deshabilitados. Solo EPS, grupo étnico y país se diligencian.
 *   - Ciudad dependiente del Departamento (se reconstruye al cambiar de depto).
 *   - Confirmaciones (celular, correo, dirección) validadas contra su campo base.
 *   - Validación de obligatorios con errores INLINE por campo (patrón Form Error),
 *     foco/scroll al primer inválido y limpieza del error al corregir.
 *   - Persistencia separada en step2 (sessionStorage) + restauración al volver.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ───────────
   * 1) Sin candidato viable → no hay proceso: volver a la consulta.
   * 2) Candidato viable pero Paso 1 no completado/guardado → volver al Paso 1.
   * Es control de prototipo (no seguridad); evita abrir el Paso 2 pegando la URL. */
  if (!Z || !Z.isViable()) {
    window.location.replace('../index.html');
    return;
  }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) {
    window.location.replace('../paso-1/index.html');
    return;
  }

  var candidate = Z.getCandidate();

  /* ─────────── Catálogo mock Ciudad por Departamento ───────────
   * Prototipo: la ciudad depende del departamento. Reemplazar por catálogo real. */
  var CIUDADES = {
    valle:        ['Cali', 'Palmira', 'Jamundí', 'Candelaria', 'Yumbo'],
    cundinamarca: ['Bogotá D.C.', 'Soacha', 'Chía', 'Zipaquirá'],
    antioquia:    ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro'],
    atlantico:    ['Barranquilla', 'Soledad', 'Malambo'],
    santander:    ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
    bolivar:      ['Cartagena', 'Magangué', 'Turbaco']
  };

  /* ─────────── Referencias al DOM ─────────── */
  var form        = document.getElementById('pa-form');
  var candSummary = document.getElementById('pa-cand-summary');  // sidebar (compact)
  var stepperEl   = document.getElementById('pa-stepper');
  var backBtn     = document.getElementById('pa-back');

  // Datos personales: solo los EDITABLES tienen campo; el resto es información.
  var factsEl        = document.getElementById('pa-facts');
  var epsEl          = document.getElementById('pa-eps');
  var etnicoEl       = document.getElementById('pa-etnico');
  var paisEl         = document.getElementById('pa-pais');

  // Contacto
  var celularEl   = document.getElementById('pa-celular');
  var correoEl    = document.getElementById('pa-correo');

  // Residencia
  var direccionEl  = document.getElementById('pa-direccion');
  var departamentoEl = document.getElementById('pa-departamento');
  var ciudadEl       = document.getElementById('pa-ciudad');  // referencia viva (se reemplaza al reconstruir)

  /* ─────────── Resumen de identidad del candidato (Person Summary) ───────────
   * Un ÚNICO objeto candidato alimenta ambos lugares: el resumen del formulario
   * (A. Identificación, variante default) y la cabecera del sidebar (compact).
   * Los datos de identificación siguen en el estado (candidate), solo cambia su
   * presentación: ya no se muestran como 6 campos editables. */
  var identidadData = {
    name: candidate.name || '',
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber   // valor limpio; el componente lo formatea
  };

  // (El resumen dentro de la card se retiró: lo muestra el panel izquierdo.)
  // Sidebar → variante compact (misma persona) con eyebrow de contexto del panel.
  ZTPersonSummary.render(candSummary, Object.assign({
    eyebrow: 'Persona a afiliar',
    variant: 'compact',
    icon: 'icon-user-plus'
  }, identidadData));

  /* ─────────── Stepper transversal (current = 2) ───────────
   * current:2 → Paso 1 completed, Paso 2 active, resto future. Mismo orden del
   * Figma más reciente. Sin onSelect → no se puede saltar a pasos futuros. */
  ZTStepper.render(stepperEl, Z.stepperConfig(2));   // pasos completados clicables

  /* ═══════════════ DATOS DEL DOCUMENTO (NO editables) ═══════════════
   * ⚠️ MOCK: en producción llegan del servicio de consulta del documento. */
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
  var doc = Z.datosDocumentoMock(candidate.documentNumber);
  var LABELS = {
    gender: { mujer: 'Mujer', hombre: 'Hombre', 'no-binario': 'No binario', 'prefiere-no-responder': 'Prefiere no responder' },
    sex: { femenino: 'Femenino', masculino: 'Masculino', intersexual: 'Intersexual', otro: 'Otro' },
    maritalStatus: { soltero: 'Soltero(a)', casado: 'Casado(a)', 'union-libre': 'Unión libre', divorciado: 'Divorciado(a)', viudo: 'Viudo(a)' },
    nationality: { colombiana: 'Colombiana', venezolana: 'Venezolana', ecuatoriana: 'Ecuatoriana', peruana: 'Peruana', estadounidense: 'Estadounidense', espanola: 'Española', otra: 'Otra' }
  };
  function fechaLarga(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : '—';
  }
  (function renderFacts() {
    var edad = calcularEdad(doc.birthDate);
    var items = [
      ['Fecha de nacimiento', fechaLarga(doc.birthDate)],
      ['Edad', edad != null ? edad + ' años' : '—'],
      ['Género', LABELS.gender[doc.gender] || '—'],
      ['Sexo de identificación', LABELS.sex[doc.sex] || '—'],
      ['Estado civil', LABELS.maritalStatus[doc.maritalStatus] || '—'],
      ['Nacionalidad', LABELS.nationality[doc.nationality] || '—']
    ];
    factsEl.innerHTML = items.map(function (it) {
      return '<div class="pa-facts__item"><dt>' + it[0] + '</dt><dd>' + it[1] + '</dd></div>';
    }).join('');
  })();

  /* ═══════════════ CIUDAD DEPENDIENTE DEL DEPARTAMENTO ═══════════════
   * El Dropdown List transversal construye su lista al mejorar el <select>.
   * Para cambiar las opciones tras un cambio de departamento, se reemplaza el
   * <select> por un clon con las nuevas <option> (lo que descarta la instancia
   * y el DOM del dropdown viejo) y se vuelve a mejorar (ZTDropdown.enhance). */
  function poblarCiudades(deptoValue, ciudadPreseleccionada) {
    var ciudades = CIUDADES[deptoValue] || [];

    // Clonar el <select> "en bruto" (sin la mejora previa) para regenerar opciones.
    var fresco = document.createElement('select');
    fresco.className = 'mp-input-field mp-select';
    fresco.id = 'pa-ciudad';
    fresco.name = 'city';
    fresco.required = true;
    fresco.setAttribute('aria-required', 'true');
    fresco.setAttribute('data-zt-dropdown', '');
    fresco.setAttribute('data-zt-dropdown-search', 'false');
    fresco.setAttribute('aria-describedby', 'pa-ciudad-error');

    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = 'Seleccionar';
    ph.disabled = true; ph.selected = true;
    fresco.appendChild(ph);

    ciudades.forEach(function (nombre) {
      var slug = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      var opt = document.createElement('option');
      opt.value = slug; opt.textContent = nombre;
      if (ciudadPreseleccionada && slug === ciudadPreseleccionada) opt.selected = true;
      fresco.appendChild(opt);
    });

    // Reemplazar el nodo actual (el que existe es el <select> oculto dentro de
    // .zt-dropdown, o el original). Se reemplaza el .zt-dropdown completo si ya
    // fue mejorado; si no, el propio <select>.
    var actual = document.getElementById('pa-ciudad');
    var contenedor = actual.closest('.zt-dropdown') || actual;
    contenedor.parentNode.replaceChild(fresco, contenedor);

    // Sin departamento → dejar el select deshabilitado (no hay ciudades).
    fresco.disabled = !deptoValue;

    ZTDropdown.enhance(fresco, { search: false });
    ciudadEl = fresco;   // actualizar referencia viva

    // Limpiar cualquier error de ciudad al reconstruir.
    clearError(ciudadEl);
    // Notificar cambio para reflejar valor/placeholder en el trigger.
    ciudadEl.addEventListener('change', function () { clearError(ciudadEl); });
  }

  departamentoEl.addEventListener('change', function () {
    clearError(departamentoEl);
    // Al cambiar de departamento se limpia la ciudad seleccionada (no conservar
    // una ciudad incompatible con el nuevo departamento).
    poblarCiudades(departamentoEl.value, null);
  });

  /* ═══════════════ SANITIZACIÓN DE ENTRADAS ═══════════════ */
  // Celular y su confirmación: solo dígitos (sin espacios, puntos, guiones).
  function soloDigitos(el) {
    el.addEventListener('input', function () {
      var clean = el.value.replace(/\D+/g, '');
      if (clean !== el.value) el.value = clean;
      clearError(el);
    });
  }
  soloDigitos(celularEl);
  // Los demás editables limpian su error al escribir/cambiar.
  [correoEl, direccionEl].forEach(function (el) {
    el.addEventListener('input', function () { clearError(el); });
  });
  [epsEl, etnicoEl, paisEl].forEach(function (el) {
    el.addEventListener('change', function () { clearError(el); });
  });

  /* ═══════════════ VALIDACIÓN (patrón Form Error) ═══════════════ */
  // Marca/limpia el error de un campo y revela su mensaje. Para selects
  // mejorados, el estado `.error` se aplica al contenedor .zt-dropdown.
  function setError(el, on, msg) {
    if (!el) return;
    // El estado .error se aplica al contenedor del componente transversal
    // correspondiente: .zt-dropdown (selects) o .zt-datefield (fechas).
    var host = el.closest ? (el.closest('.zt-dropdown') || el.closest('.zt-datefield')) : null;
    (host || el).classList.toggle('error', !!on);
    var group = el.closest ? el.closest('.mp-input-group') : null;
    var errEl = group && group.querySelector('.mp-input-error');
    if (errEl) {
      if (msg) errEl.textContent = msg;
      errEl.hidden = !on;
    }
  }
  function clearError(el) { setError(el, false); }

  function emailValido(v) {
    // Validación básica de formato (prototipo): algo@algo.dominio
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function norm(v) { return String(v == null ? '' : v).trim(); }

  function validar() {
    var firstInvalid = null;
    function fail(el, msg) {
      setError(el, true, msg);
      if (!firstInvalid) firstInvalid = el;
    }
    function requiredSelect(el) {
      if (!el.value) fail(el, 'Selecciona una opción.'); else clearError(el);
    }

    // A — Datos personales: solo los editables (los del documento no se validan aquí)
    requiredSelect(epsEl);
    requiredSelect(etnicoEl);
    requiredSelect(paisEl);

    // C — Datos de contacto
    if (!celularEl.value.trim()) fail(celularEl, 'Este campo es obligatorio.');
    else if (!/^\d{10}$/.test(celularEl.value)) fail(celularEl, 'Ingresa un número de celular válido (10 dígitos).');
    else clearError(celularEl);

    if (!correoEl.value.trim()) fail(correoEl, 'Este campo es obligatorio.');
    else if (!emailValido(correoEl.value.trim())) fail(correoEl, 'Ingresa un correo electrónico válido.');
    else clearError(correoEl);

    // D — Datos de residencia
    if (!direccionEl.value.trim()) fail(direccionEl, 'Este campo es obligatorio.');
    else clearError(direccionEl);

    requiredSelect(departamentoEl);
    // Ciudad: referencia viva (se reconstruye con el departamento).
    if (!ciudadEl.value) fail(ciudadEl, 'Selecciona una opción.'); else clearError(ciudadEl);

    return firstInvalid;
  }

  // Foco + scroll al primer campo inválido (al trigger si es un select mejorado).
  function focusInvalid(el) {
    if (!el) return;
    // Foco al trigger del componente transversal (dropdown o date field) si aplica.
    var ddHost = el.closest ? el.closest('.zt-dropdown') : null;
    var dfHost = el.closest ? el.closest('.zt-datefield') : null;
    var target = (ddHost && ddHost.querySelector('.zt-dropdown__trigger'))
              || (dfHost && dfHost.querySelector('.zt-datefield__trigger'))
              || el;
    if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  /* ═══════════════ RECOLECTAR + PERSISTIR PASO 2 ═══════════════ */
  function datosPaso2() {
    return {
      // Del documento (no editables)
      birthDate: doc.birthDate,
      age: calcularEdad(doc.birthDate),
      gender: doc.gender,
      sex: doc.sex,
      maritalStatus: doc.maritalStatus,
      nationality: doc.nationality,
      // Diligenciados
      eps: epsEl.value,
      ethnicGroup: etnicoEl.value,
      birthCountry: paisEl.value,
      phone: celularEl.value.trim(),
      email: correoEl.value.trim(),
      address: direccionEl.value.trim(),
      department: departamentoEl.value,
      city: ciudadEl.value
    };
  }

  /* ═══════════════ RESTAURAR PASO 2 (volver desde adelante) ═══════════════ */
  var prev = Z.getStep2();
  // Departamento primero → poblar ciudades (con la ciudad previa preseleccionada).
  if (prev && prev.department) {
    departamentoEl.value = prev.department;
    departamentoEl.dispatchEvent(new Event('change', { bubbles: true }));
    // change() reconstruye ciudades con null; volver a poblar con la ciudad previa.
    poblarCiudades(prev.department, prev.city || null);
  } else {
    // Sin departamento previo → ciudad deshabilitada hasta elegir depto.
    poblarCiudades('', null);
  }
  if (prev) {
    function setSelect(el, val) {
      if (!val) return;
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    setSelect(epsEl, prev.eps);
    setSelect(etnicoEl, prev.ethnicGroup);
    setSelect(paisEl, prev.birthCountry);
    if (prev.phone)   celularEl.value = prev.phone;
    if (prev.email)   correoEl.value = prev.email;
    if (prev.address) direccionEl.value = prev.address;
  }

  /* ═══════════════ SUBMIT ═══════════════ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = validar();
    if (firstInvalid) {
      focusInvalid(firstInvalid);   // NO avanzar; foco/scroll al primer error
      return;
    }
    // Guardar los datos del Paso 2. NO se marca `completed` todavía: el Paso 2
    // solo queda completo tras validar el OTP en la pantalla de Validación.
    // Si los datos cambian respecto a un OTP previo, se invalida esa verificación.
    var data = datosPaso2();
    var previo = Z.getStep2();
    var mismos = previo && JSON.stringify(datosSinEstado(previo)) === JSON.stringify(data);
    data.completed = false;
    data.otpVerified = mismos ? (previo.otpVerified === true) : false;
    Z.saveStep2(data);

    // Ir a la Validación de información (OTP). Sigue perteneciendo al Paso 2.
    window.location.href = 'validacion-informacion/index.html';
  });

  // Compara solo los datos del formulario (ignora flags de estado) para saber si
  // cambió algo respecto a una verificación OTP previa.
  function datosSinEstado(obj) {
    var o = {};
    Object.keys(obj).forEach(function (k) {
      if (k !== 'completed' && k !== 'otpVerified') o[k] = obj[k];
    });
    return o;
  }

  /* Guarda lo diligenciado sin validar. Conserva "completo" y la verificación
   * del código solo si los datos no cambiaron (si cambiaron, habrá que validar
   * de nuevo el celular/correo). */
  // ¿Hay campos obligatorios sin diligenciar/ inválidos? (sin marcar errores)
  function hayErrores() {
    return !epsEl.value || !etnicoEl.value || !paisEl.value ||
      !/^\d{10}$/.test(celularEl.value) || !emailValido(correoEl.value.trim()) ||
      !direccionEl.value.trim() || !departamentoEl.value || !ciudadEl.value;
  }
  // El código de validación verifica celular y correo: solo si cambian hay que
  // volver a validarlo.
  function mismoContacto(previo, data) {
    return !!previo && previo.phone === data.phone && String(previo.email || '').toLowerCase() === String(data.email || '').toLowerCase();
  }
  function guardarSinValidar() {
    var data = datosPaso2();
    var previo = Z.getStep2();
    var mismo = mismoContacto(previo, data);
    data.completed = mismo && previo.completed === true && !hayErrores();
    data.otpVerified = mismo && previo.otpVerified === true;
    Z.saveStep2(data);
  }

  /* ═══════════════ PANEL DE PASOS ═══════════════
   * Si el formulario es válido y no cambió respecto a la verificación previa, se
   * guarda y se permite cambiar de paso. Si cambió celular/correo/datos, hay que
   * volver a validar el código: se lleva a la Validación de información. */
  Z.setLeaveGuard(function (nav) {
    if (!nav.forward) {
      // Hacia atrás (Paso 1): guardar lo diligenciado, como el botón Atrás.
      guardarSinValidar();
      return true;
    }
    var firstInvalid = validar();
    if (firstInvalid) { focusInvalid(firstInvalid); return false; }
    var data = datosPaso2();
    var previo = Z.getStep2();
    if (mismoContacto(previo, data) && previo.otpVerified) {
      data.completed = true; data.otpVerified = true; Z.saveStep2(data);
      return true;
    }
    data.completed = false;
    data.otpVerified = false;
    Z.saveStep2(data);
    window.location.href = 'validacion-informacion/index.html';
    return false;
  });

  /* ═══════════════ ATRÁS (volver al Paso 1 sin perder datos) ═══════════════ */
  backBtn.addEventListener('click', function () {
    // Guardar lo diligenciado (aunque esté incompleto) para restaurarlo al volver.
    guardarSinValidar();
    window.location.href = '../paso-1/index.html';
  });
})();
