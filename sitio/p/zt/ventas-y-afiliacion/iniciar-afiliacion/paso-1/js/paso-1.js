/* ============================================================
 * paso-1.js — PASO 1 "Datos generales" del Proceso de afiliación (ZT)
 * ------------------------------------------------------------
 * Responsabilidades (prototipo, sin backend real):
 *   - CONTROL DE ACCESO: la pantalla solo es válida si existe un candidato
 *     VIABLE persistido (sessionStorage vía ZTAfiliacion). Si no, redirige
 *     a "Iniciar afiliación". Esto es control de prototipo, no seguridad.
 *   - Hidratar el resumen del contratante (tipo/número de documento) desde la
 *     consulta previa. NO se vuelven a pedir esos datos (Figma: sin campos de documento).
 *   - Renderizar el stepper transversal (8 pasos, activo = Paso 1).
 *   - Precalcular la fecha de inicio de vigencia = primer día del mes siguiente
 *     y mostrarla en la barra informativa ("01 Agosto 2026").
 *   - Lógica condicional: el campo "Novedades" solo aparece (y es obligatorio)
 *     cuando Tipo de transacción / vinculación = Novedades; al cambiar a otra
 *     transacción se oculta, se limpia su valor y se quita su required.
 *   - "¿Cómo se afilia el contratante?" (obligatorio): "Como independiente" o
 *     "A través de una empresa". Solo en el segundo caso aparece el bloque
 *     "Datos de la empresa" (Nit + Nombre de empresa, obligatorios). Al volver a
 *     independiente el bloque se oculta y sus valores se limpian.
 *   - Validar los campos editables obligatorios y guardar el Paso 1
 *     (sessionStorage, separado de los datos del candidato) antes de avanzar.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO ───────────
   * Sin candidato viable → no renderizar el formulario; volver al inicio. */
  if (!Z || !Z.isViable()) {
    window.location.replace('../index.html');
    return;
  }

  var candidate = Z.getCandidate();

  /* ─────────── Referencias al DOM ─────────── */
  var form        = document.getElementById('pa-form');
  var candSummary = document.getElementById('pa-cand-summary');
  var stepperEl   = document.getElementById('pa-stepper');
  var empresaEl  = document.getElementById('pa-empresa');
  var nitEl      = document.getElementById('pa-nit');
  var companyBlk = document.getElementById('pa-company-block');
  var channelErr = document.getElementById('pa-channel-error');
  var noveltyGrp = document.getElementById('pa-novelty-group');
  var noveltyEl  = document.getElementById('pa-novedad');
  var planEl     = document.getElementById('pa-plan');
  var vigenciaEl = document.getElementById('pa-vigencia');
  var vigenciaLbl = document.getElementById('pa-start-label');
  var backBtn    = document.getElementById('pa-back');
  var nextBtn    = document.getElementById('pa-next');
  var txHint     = document.getElementById('pa-tx-hint');
  var channelFld = document.getElementById('pa-channel-field');
  var planRow    = document.getElementById('pa-plan-row');

  /* ─────────── Resumen del candidato (Person Summary compact) ───────────
   * Mismo componente y MISMO objeto candidato que usa el Paso 2. El componente
   * formatea el documento (C.C. 1.234.567); el valor limpio queda en candidate. */
  // Figma (Paso 1): eyebrow "Contratante" + solo el documento ("CC 1234567890"); sin nombre.
  // El componente exige `name`, así que se le pasa la línea de documento como texto principal.
  ZTPersonSummary.render(candSummary, {
    eyebrow: 'Contratante',
    variant: 'compact',
    icon: 'icon-user-plus',
    name: (candidate.documentType || '') + ' ' + (candidate.documentNumber || '')
  });

  /* ─────────── Stepper transversal ─────────── */
  // Pasos completados clicables (config compartida en ZTAfiliacion).
  ZTStepper.render(stepperEl, Z.stepperConfig(1));

  /* ─────────── Fecha de vigencia = primer día del mes siguiente ─────────── */
  function primerDiaMesSiguiente() {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    return y + '-' + m + '-01';   // formato input[type=date]
  }
  // Presentación Figma: "01 Agosto 2026" (el valor real queda en el input oculto, AAAA-MM-DD).
  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  function mostrarVigencia() {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(vigenciaEl.value || '');
    vigenciaLbl.textContent = m ? m[3] + ' ' + MESES[parseInt(m[2], 10) - 1] + ' ' + m[1] : '';
  }
  vigenciaEl.value = primerDiaMesSiguiente();
  mostrarVigencia();

  /* ─────────── Selección actual de cada grupo ─────────── */
  function modalidadActual() {
    var checked = form.querySelector('input[name="modality"]:checked');
    return checked ? checked.value : 'individual';
  }
  function transaccionActual() {
    var checked = form.querySelector('input[name="transactionType"]:checked');
    return checked ? checked.value : 'new';
  }

  function canalActual() {
    var checked = form.querySelector('input[name="affiliationChannel"]:checked');
    return checked ? checked.value : '';
  }

  /* ─────────── Datos de la empresa condicionales ───────────
   * Visibles/obligatorios solo si el contratante se afilia a través de una
   * empresa. Independiente → ocultar, limpiar valores y errores. */
  function aplicarEmpresa(fromUser) {
    var canal = canalActual();
    var esEmpresa = canal === 'company';
    companyBlk.hidden = !esEmpresa;
    [empresaEl, nitEl].forEach(function (el) {
      el.required = esEmpresa;
      el.setAttribute('aria-required', esEmpresa ? 'true' : 'false');
    });
    if (canal) channelErr.hidden = true;
    if (!esEmpresa) {
      empresaEl.value = ''; nitEl.value = '';
      clearError(empresaEl); clearError(nitEl);
    } else if (fromUser) {
      // Al revelar el bloque, llevar el foco al primer campo (Nit).
      try { nitEl.focus({ preventScroll: true }); } catch (e) { nitEl.focus(); }
    }
  }
  form.querySelectorAll('input[name="affiliationChannel"]').forEach(function (r) {
    r.addEventListener('change', function () { aplicarEmpresa(true); });
  });

  /* ─────────── Campo NOVEDADES condicional ───────────
   * Solo visible/obligatorio cuando la transacción = "novelty".
   * Al cambiar a otra transacción: ocultar, limpiar el valor y quitar required
   * (no dejar datos ocultos activos en el formulario). */
  function aplicarNovedades() {
    var esNovedad = transaccionActual() === 'novelty';
    noveltyGrp.hidden = !esNovedad;
    noveltyEl.required = esNovedad;
    noveltyEl.setAttribute('aria-required', esNovedad ? 'true' : 'false');
    if (!esNovedad) {
      noveltyEl.value = '';
      // Notificar al dropdown transversal para que refleje el placeholder.
      noveltyEl.dispatchEvent(new Event('change', { bubbles: true }));
      clearError(noveltyEl);
    }
  }
  form.querySelectorAll('input[name="transactionType"]').forEach(function (r) {
    r.addEventListener('change', aplicarNovedades);
  });
  noveltyEl.addEventListener('change', function () { clearError(noveltyEl); });

  /* ─────────── Reglas del flujo según la Transacción ───────────
   * (La Modalidad no cambia el formulario ni los pasos siguientes.)
   *   Inclusión   → contrato vigente: solo se procesan los beneficiarios nuevos.
   *   Novedades   → no recorre el proceso: se registra aquí mismo. */
  var TX_HINT = {
    new:       '',
    inclusion: 'Contrato vigente: el contratante no se vuelve a declarar, liquidar ni cargar soportes. Solo se procesan los beneficiarios nuevos.',
    novelty:   'Las novedades no recorren el proceso de afiliación: se registran aquí y las gestiona el equipo de novedades sobre el contrato vigente.'
  };
  function hintHTML(text, warn) {
    return text ? '<span class="icon ' + (warn ? 'icon-warning' : 'icon-info') + ' icon-16 gs-inherit" aria-hidden="true"></span><span>' + text + '</span>' : '';
  }

  function aplicarFlujo(fromUser) {
    var tx = transaccionActual();
    var esNovedad = tx === 'novelty';
    txHint.className = 'pa-choice-hint' + (esNovedad ? ' is-warning' : '');
    txHint.innerHTML = hintHTML(TX_HINT[tx], esNovedad);
    // Novedades: se ocultan los datos de afiliación que no aplican.
    [channelFld, planRow].forEach(function (el) { el.hidden = esNovedad; });
    if (esNovedad) companyBlk.hidden = true;
    else companyBlk.hidden = canalActual() !== 'company';
    nextBtn.textContent = esNovedad ? 'Registrar novedad' : 'Guardar y continuar';
  }
  form.querySelectorAll('input[name="modality"], input[name="transactionType"]').forEach(function (r) {
    r.addEventListener('change', function () {
      aplicarFlujo(true);
    });
  });

  /* ─────────── Restaurar Paso 1 si el usuario ya lo diligenció ───────────
   * Al volver desde el Paso 2 (botón Atrás) no se deben perder los datos.
   * Se aplica ANTES de aplicarNovedades() para que la visibilidad del campo
   * condicional se calcule con la transacción restaurada. */
  var prev = Z.getStep1();
  if (prev) {
    function checkRadio(name, value) {
      var r = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (r) r.checked = true;
    }
    if (prev.modality) checkRadio('modality', prev.modality);
    // En esta versión de pruebas solo está habilitada la Nueva afiliación.
    if (prev.transactionType && prev.transactionType !== 'new') { prev.transactionType = 'new'; prev.noveltyType = null; }
    if (prev.transactionType) checkRadio('transactionType', prev.transactionType);
    // Canal: si viene de una versión previa sin canal pero con empresa → "company".
    var prevChannel = prev.affiliationChannel || (prev.companyName ? 'company' : '');
    if (prevChannel) checkRadio('affiliationChannel', prevChannel);
    if (typeof prev.companyName === 'string') empresaEl.value = prev.companyName;
    if (typeof prev.nit === 'string') nitEl.value = prev.nit;
    if (prev.plan) { planEl.value = prev.plan; planEl.dispatchEvent(new Event('change', { bubbles: true })); }
    if (prev.startDate) {
      vigenciaEl.value = prev.startDate;
      mostrarVigencia();
    }
    if (prev.noveltyType) {
      noveltyEl.value = prev.noveltyType;
      noveltyEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  aplicarNovedades();
  // Restaurar visibilidad del bloque de empresa SIN limpiar lo restaurado.
  (function () {
    var esEmpresa = canalActual() === 'company';
    companyBlk.hidden = !esEmpresa;
    [empresaEl, nitEl].forEach(function (el) { el.required = esEmpresa; el.setAttribute('aria-required', esEmpresa ? 'true' : 'false'); });
  })();
  aplicarFlujo(false);

  /* ─────────── NIT: solo dígitos (siempre activo) ─────────── */
  nitEl.addEventListener('input', function () {
    var clean = nitEl.value.replace(/\D+/g, '');
    if (clean !== nitEl.value) nitEl.value = clean;
    clearError(nitEl);
  });
  empresaEl.addEventListener('input', function () { clearError(empresaEl); });
  // Limpiar el error conforme el usuario corrige el plan.
  planEl.addEventListener('change', function () { clearError(planEl); });

  /* ─────────── Validación de campos editables obligatorios ───────────
   * Cada error se muestra INLINE, asociado a su campo (patrón transversal
   * Form Error). Para un <select> mejorado por el Dropdown List, el estado de
   * error se refleja en su contenedor `.zt-dropdown` (el <select> está oculto). */

  // Muestra/oculta el error de un campo: marca `.error` en el campo (o en el
  // contenedor .zt-dropdown si es un select mejorado), y revela su mensaje.
  function setError(el, on, msg) {
    if (!el) return;
    // Contenedor del componente transversal: .zt-dropdown (select) o .zt-datefield (fecha).
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

  function validar() {
    var firstInvalid = null;
    function fail(el, msg) {
      setError(el, true, msg);
      if (!firstInvalid) firstInvalid = el;
    }
    // Novedades: solo se valida el tipo de novedad (el resto no aplica).
    if (transaccionActual() === 'novelty') {
      if (!noveltyEl.value) { fail(noveltyEl, 'Selecciona una opción.'); } else clearError(noveltyEl);
      return firstInvalid;
    }
    // ¿Cómo se afilia? obligatorio
    var canal = canalActual();
    if (!canal) {
      channelErr.hidden = false;
      if (!firstInvalid) firstInvalid = form.querySelector('input[name="affiliationChannel"]');
    } else channelErr.hidden = true;
    // Nombre de empresa y NIT: obligatorios SOLO si se afilia a través de una empresa
    if (canal === 'company') {
      if (!empresaEl.value.trim()) fail(empresaEl, 'Este campo es obligatorio.'); else clearError(empresaEl);
      if (!/^\d{6,15}$/.test(nitEl.value.trim())) fail(nitEl, nitEl.value.trim() ? 'Ingresa un NIT válido.' : 'Este campo es obligatorio.'); else clearError(nitEl);
    } else { clearError(empresaEl); clearError(nitEl); }
    // Plan: siempre obligatorio (tiene default, pero validamos por robustez)
    if (!planEl.value) fail(planEl, 'Selecciona una opción.'); else clearError(planEl);
    // Fecha de vigencia: siempre obligatoria
    if (!vigenciaEl.value) fail(vigenciaEl, 'Este campo es obligatorio.'); else clearError(vigenciaEl);
    // Novedades: obligatorio solo si la transacción es "novelty"
    if (transaccionActual() === 'novelty' && !noveltyEl.value) fail(noveltyEl, 'Selecciona una opción.');
    else clearError(noveltyEl);
    return firstInvalid;   // null si todo válido; si no, primer campo inválido
  }

  // Lleva el foco (y el scroll) al primer campo inválido. Si es un select
  // mejorado, enfoca el trigger del Dropdown List (el <select> está oculto).
  function focusInvalid(el) {
    if (!el) return;
    var ddHost = el.closest ? el.closest('.zt-dropdown') : null;
    var dfHost = el.closest ? el.closest('.zt-datefield') : null;
    var target = (ddHost && ddHost.querySelector('.zt-dropdown__trigger'))
              || (dfHost && dfHost.querySelector('.zt-datefield__trigger'))
              || el;
    if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  /* ─────────── Guardar Paso 1 (separado del candidato) ─────────── */
  function datosPaso1() {
    var esNovedad = transaccionActual() === 'novelty';
    return {
      modality: modalidadActual(),
      transactionType: transaccionActual(),
      // noveltyType solo aplica en transacción "novelty"; en otra → null.
      noveltyType: esNovedad ? (noveltyEl.value || null) : null,
      affiliationChannel: canalActual(),                 // 'independent' | 'company'
      // Datos de empresa solo si aplica; independiente → null.
      companyName: canalActual() === 'company' ? empresaEl.value.trim() : null,
      nit: canalActual() === 'company' ? nitEl.value.trim() : null,
      plan: planEl.value,
      startDate: vigenciaEl.value
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = validar();
    if (firstInvalid) {
      // Hay campos obligatorios vacíos/ inválidos → NO navegar; foco al primero.
      focusInvalid(firstInvalid);
      return;
    }
    // Novedad → se registra aquí (no recorre el proceso de afiliación).
    if (transaccionActual() === 'novelty') { registrarNovedad(); return; }
    // Formulario válido → guardar Paso 1, marcarlo completado y avanzar al Paso 2.
    var data = datosPaso1();
    data.completed = true;
    guardarPaso1(data);
    window.location.href = '../paso-2/index.html';
  });

  /* Si cambia la modalidad o la transacción, el Paso 3 (y lo que depende de él)
   * debe revisarse de nuevo: se marca pendiente para que el panel de pasos no
   * permita saltarlo. */
  function guardarPaso1(data) {
    var antes = Z.getStep1() || {};
    Z.saveStep1(data);
    if ((antes.modality && antes.modality !== data.modality) || (antes.transactionType && antes.transactionType !== data.transactionType)) {
      var s3 = Z.getStep3();
      if (s3) {
        s3.completed = false;
        // Individual → solo el contratante: se descartan los beneficiarios.
        if (data.modality === 'individual') { s3.beneficiaries = []; s3.contractorIsBeneficiary = true; }
        Z.saveStep3(s3);
      }
    }
  }

  /* ─────────── Registrar novedad (MOCK) ───────────
   * ⚠️ Prototipo: en producción se crea el caso en el sistema de novedades. */
  function registrarNovedad() {
    var tipo = noveltyEl.options[noveltyEl.selectedIndex] ? noveltyEl.options[noveltyEl.selectedIndex].text : 'Novedad';
    var d = new Date(), hoy = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    // Queda en "Mis radicados" como Novedad en trámite.
    var id = Z.saveRadicado({
      type: 'Novedad', name: candidate.name, doc: candidate.documentType + ' ' + candidate.documentNumber,
      createdAt: hoy, updatedAt: hoy, status: 'en_tramite', plan: '', persons: 1, note: tipo + '.', source: 'flujo'
    }).id;
    ZTModal.open({
      type: 'success',
      title: 'Novedad registrada',
      body: [
        tipo + ' · ' + (candidate.name || '') + ' · ' + Z.tipoLabel(candidate.documentType) + ' ' + Z.formatDoc(candidate.documentNumber),
        'Radicado ' + id + '. El equipo de novedades la gestionará sobre el contrato vigente.'
      ],
      primaryAction: { label: 'Ver en Mis radicados', onClick: function () { Z.clearAll(); window.location.href = '../../mis-radicados/index.html?q=' + encodeURIComponent(id); } },
      secondaryAction: { label: 'Consultar otro documento', onClick: function () { Z.clearAll(); window.location.href = '../index.html'; } }
    });
  }

  /* ─────────── Panel de pasos: guardar antes de cambiar de paso ───────────
   * Si el formulario es válido se guarda (sigue completo); si no, se marcan los
   * errores y no se sale (evita perder cambios o dejar el paso inconsistente). */
  Z.setLeaveGuard(function () {
    if (transaccionActual() === 'novelty') return false;
    var firstInvalid = validar();
    if (firstInvalid) { focusInvalid(firstInvalid); return false; }
    var data = datosPaso1(); data.completed = true; guardarPaso1(data);
    return true;
  });

  /* ─────────── Atrás: volver a la consulta sin perder el candidato ─────────── */
  backBtn.addEventListener('click', function () {
    window.location.href = '../index.html';
  });
})();
