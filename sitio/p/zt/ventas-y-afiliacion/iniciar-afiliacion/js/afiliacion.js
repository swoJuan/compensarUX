/* ============================================================
 * afiliacion.js — Comportamiento del flujo "Iniciar afiliación" (ZT)
 * ------------------------------------------------------------
 * Responsabilidades (sin backend real — prototipo):
 *   - Pantalla única "Iniciar afiliación" (se retiraron los tabs
 *     Afiliación / Consultar viabilidad): la viabilidad se consulta
 *     internamente al presionar "Continuar".
 *   - Campo "Número de documento": acepta SOLO dígitos (sanitiza en input).
 *   - Botón SIEMPRE habilitado: al enviar se validan tipo y número y los
 *     errores se muestran inline por campo (patrón Form Error), con foco al
 *     primer campo inválido.
 *   - Consulta de viabilidad simulada con estado de carga.
 *   - VIABLE   → SIN mensaje de éxito: avanza directo al Paso 1. Si ese
 *     documento tiene una afiliación en curso, retoma en su paso. Si hay otra
 *     en curso (otra persona), pide confirmar antes de descartarla.
 *   - AFILIACIÓN EN CURSO: al entrar, si hay un borrador guardado se muestra
 *     arriba "Retomar" / "Descartar" (el borrador no se pierde al cerrar la pestaña).
 *   - NO VIABLE → alerta warning contextual inline (componente transversal
 *     Alert, .mp-alert--warning) DENTRO de la card, entre la descripción y los
 *     campos. NO hay modal, overlay, navegación ni bloqueo: los campos siguen
 *     editables y se permite reconsultar. La alerta se limpia al cambiar
 *     tipo/número de documento (no se arrastra un resultado viejo a datos nuevos).
 *
 * ⚠️  MOCK DE PROTOTIPO — REEMPLAZAR POR SERVICIO REAL:
 *     La viabilidad se decide por el número de documento: solo el 0 es
 *     documento (número 0 = no viable; cualquier otro = viable). Esta regla vive
 *     aislada en consultarViabilidadMock() y NO se mezcla con la
 *     presentación. Sustituir esa función por la llamada al backend.
 * ============================================================ */
(function () {
  'use strict';

  /* ─────────── Copy de la pantalla ─────────── */
  var BUTTON_LABEL = 'Continuar';

  /* Etiquetas legibles del tipo de documento (para presentar los datos) */
  var TIPO_LABEL = {
    CC: 'C.C.', TI: 'T.I.', CE: 'C.E.', PA: 'Pasaporte', PPT: 'PPT'
  };

  /* ─────────── Referencias al DOM ─────────── */
  var form      = document.getElementById('afi-form');
  if (!form) return;
  var tipoEl    = document.getElementById('afi-tipo');
  var numeroEl  = document.getElementById('afi-numero');
  var submitEl  = document.getElementById('afi-submit');
  var submitLbl = document.getElementById('afi-submit-label');
  var alertEl   = document.getElementById('afi-alert');    // host de la alerta warning (NO VIABLE)
  var tipoErrEl   = document.getElementById('afi-tipo-error');
  var numeroErrEl = document.getElementById('afi-numero-error');
  var resumeEl  = document.getElementById('afi-resume');   // afiliación en curso
  var Z = window.ZTAfiliacion;

  /* ─────────── Utilidades de presentación ─────────── */

  // Formatea el número con separadores de miles solo para PRESENTACIÓN.
  // (El input siempre se captura/consulta sin puntos.)
  function formatDoc(digits) {
    return String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function personaLinea(tipo, numero) {
    var etq = TIPO_LABEL[tipo] || tipo || '';
    return (etq ? etq + ' ' : '') + formatDoc(numero);
  }

  // Nombre del candidato — MOCK determinístico según el documento (fuente única
  // en ZTAfiliacion). El mismo documento produce siempre el mismo nombre.
  function candidatoNombre(numero) {
    return (window.ZTAfiliacion && ZTAfiliacion.nombreMock(numero)) || 'María Fernanda Ríos';
  }

  /* ─────────── Sanitización + validación ─────────── */

  // Deja solo dígitos (bloquea puntos, comas, espacios, guiones, letras…)
  function sanitizeNumero() {
    var clean = numeroEl.value.replace(/\D+/g, '');
    if (clean !== numeroEl.value) numeroEl.value = clean;
  }

  function isValid() {
    return tipoEl.value !== '' && /^\d+$/.test(numeroEl.value);
  }

  /* Error inline por campo (patrón transversal Form Error): marca `.error` en el
   * campo (o en `.zt-dropdown` si el <select> está mejorado) y revela su mensaje. */
  function setError(el, errEl, on, msg) {
    var host = el.closest('.zt-dropdown');
    (host || el).classList.toggle('error', !!on);
    el.setAttribute('aria-invalid', on ? 'true' : 'false');
    if (errEl) { if (msg) errEl.textContent = msg; errEl.hidden = !on; }
  }
  function clearErrors() {
    setError(tipoEl, tipoErrEl, false);
    setError(numeroEl, numeroErrEl, false);
  }
  // Devuelve el primer campo inválido (o null si todo está bien).
  function validar() {
    var first = null;
    if (!tipoEl.value) { setError(tipoEl, tipoErrEl, true, 'Selecciona el tipo de documento.'); first = tipoEl; }
    else setError(tipoEl, tipoErrEl, false);
    if (!numeroEl.value) { setError(numeroEl, numeroErrEl, true, 'Ingresa el número de documento.'); first = first || numeroEl; }
    else setError(numeroEl, numeroErrEl, false);
    return first;
  }
  function focusInvalid(el) {
    var dd = el.closest('.zt-dropdown');
    var target = (dd && dd.querySelector('.zt-dropdown__trigger')) || el;
    try { target.focus(); } catch (e) {}
  }

  /* ─────────── Desenlaces de la consulta ─────────── */

  // Limpia el resultado previo (al cambiar datos o al reconsultar).
  function clearResult() {
    if (alertEl) ZTAlert.clear(alertEl);
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function haceCuanto(ts) {
    if (!ts) return '';
    var min = Math.round((Date.now() - ts) / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
    var d = Math.round(h / 24);
    return 'hace ' + d + (d === 1 ? ' día' : ' días');
  }

  /* ─────────── Afiliación en curso (borrador) ─────────── */
  function renderResume() {
    var d = Z && Z.draftSummary();
    if (!d) { resumeEl.hidden = true; resumeEl.innerHTML = ''; return; }
    resumeEl.hidden = false;
    resumeEl.innerHTML =
      '<span class="icon icon-clock-counter-clockwise icon-24 gs-inherit afi-resume__icon" aria-hidden="true"></span>' +
      '<div class="afi-resume__body">' +
        '<p class="afi-resume__title">Tienes una afiliación en curso</p>' +
        '<p class="afi-resume__text"><strong>' + esc(d.name) + '</strong> · ' + esc(personaLinea(d.documentType, d.documentNumber)) +
          '<br>Va en el Paso ' + d.step + ' de 8: ' + esc(d.stepLabel) + (d.updatedAt ? ' · guardada ' + haceCuanto(d.updatedAt) : '') + '.</p>' +
        '<div class="afi-resume__actions">' +
          '<a class="mp-btn mp-btn--primario" href="' + d.href + '">Retomar afiliación</a>' +
          '<button type="button" class="afi-link" data-act="discard">Descartar</button>' +
        '</div>' +
      '</div>';
  }
  resumeEl.addEventListener('click', function (e) {
    if (!e.target.closest('[data-act="discard"]')) return;
    var d = Z.draftSummary();
    ZTModal.open({
      type: 'warning',
      title: '¿Descartar la afiliación en curso?',
      body: ['Se borrará lo diligenciado para ' + (d ? d.name : 'esta persona') + '. Esta acción no se puede deshacer.'],
      primaryAction: { label: 'Descartar', onClick: function () { ZTModal.close(); Z.clearAll(); renderResume(); clearResult(); } },
      secondaryAction: { label: 'Cancelar', onClick: function () { ZTModal.close(); } }
    });
  });


  // VIABLE → sin mensaje de éxito: se avanza directo. Si el documento tiene una
  // afiliación en curso se retoma en su paso; si hay otra en curso (otra persona)
  // se pide confirmar antes de descartarla (no se pierde trabajo en silencio).
  function continuarConViable(tipo, numero) {
    var nombre = candidatoNombre(numero);
    var draft = Z && Z.draftSummary();
    var mismo = draft && draft.documentType === tipo && String(draft.documentNumber) === String(numero);
    var otro = draft && !mismo;

    function guardarYContinuar() {
      if (Z) {
        Z.clearAll();                // persona nueva → no arrastrar pasos de otra afiliación
        var persona = Z.personaMock(numero);
        Z.saveCandidate({
          documentType: tipo,
          documentNumber: numero,    // valor limpio (sin puntos)
          name: nombre,
          firstName: persona.firstName,
          secondName: persona.secondName,
          firstSurname: persona.firstSurname,
          secondSurname: persona.secondSurname,
          viable: true
        });
      }
      continuarAfiliacion();
    }

    if (mismo) { window.location.href = draft.href; return; }
    if (otro) {
      ZTModal.open({
        type: 'warning',
        title: '¿Descartar la afiliación en curso?',
        body: ['Tienes una afiliación en curso de ' + draft.name + '. Si continúas, se descartará y comenzarás una nueva.'],
        primaryAction: { label: 'Continuar', onClick: function () { ZTModal.close(); guardarYContinuar(); } },
        secondaryAction: { label: 'Cancelar', onClick: function () { ZTModal.close(); } }
      });
      return;
    }
    guardarYContinuar();
  }

  // NO VIABLE → alerta warning contextual inline (componente transversal Alert),
  // dentro de la card, entre la descripción y los campos. Sin CTA, sin datos de
  // persona, sin badge, sin botón "Cerrar": en este estado inline no son necesarios.
  // No hay modal ni overlay; los campos siguen editables y se permite reconsultar.
  function renderNoViable(tipo, numero) {
    // NO VIABLE nunca debe habilitar el proceso para ESTE documento. Si había una
    // afiliación en curso de este mismo documento, se descarta; la de otra persona
    // se conserva (no se pierde trabajo por una consulta).
    var c = Z && Z.getCandidate();
    if (c && c.documentType === tipo && String(c.documentNumber) === String(numero)) { Z.clearAll(); renderResume(); }
    ZTAlert.render(alertEl, {
      type: 'warning',
      title: 'No es posible continuar con la afiliación',
      description: 'La persona no cumple con las condiciones requeridas para continuar con la afiliación a Medicina Prepagada.'
    });
  }

  // CTA del resultado viable: avanzar al Paso 1 del proceso de afiliación.
  // El candidato ya quedó persistido en sessionStorage (control de acceso del Paso 1).
  function continuarAfiliacion() {
    window.location.href = 'paso-1/index.html';
  }

  /* ─────────── Estado de carga ─────────── */
  function setLoading(on) {
    submitEl.classList.toggle('is-loading', on);
    // Deshabilita el formulario completo durante la consulta
    tipoEl.disabled = on;
    numeroEl.disabled = on;
    submitEl.disabled = on;
    if (on) {
      submitLbl.textContent = 'Consultando...';
    } else {
      submitLbl.textContent = BUTTON_LABEL;
    }
  }

  /* ─────────── MOCK de viabilidad (reemplazar por servicio real) ─────────── */
  // Regla de prototipo: documento 0 (solo ceros) → no viable; cualquier otro → viable.
  // Devuelve una promesa para simular latencia de red.
  function consultarViabilidadMock(numero) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve({ viable: !/^0+$/.test(numero) });
      }, 700);
    });
  }

  /* ─────────── Envío del formulario ─────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearResult();
    var invalido = validar();
    if (invalido) { focusInvalid(invalido); return; }

    var tipo = tipoEl.value;
    var numero = numeroEl.value;

    setLoading(true);

    consultarViabilidadMock(numero).then(function (res) {
      setLoading(false);
      if (res.viable) {
        continuarConViable(tipo, numero);   // sin mensaje de éxito: avanza al Paso 1
      } else {
        renderNoViable(tipo, numero);    // alerta warning inline (dentro de la card), permanece en pantalla
      }
    });
  });

  /* ─────────── Listeners de campos ─────────── */
  numeroEl.addEventListener('input', function () {
    sanitizeNumero();
    clearResult();     // modificar el documento limpia el resultado previo
    setError(numeroEl, numeroErrEl, false);
  });
  // Bloquea el pegado de contenido no numérico
  numeroEl.addEventListener('paste', function () {
    window.setTimeout(function () { sanitizeNumero(); setError(numeroEl, numeroErrEl, false); }, 0);
  });
  tipoEl.addEventListener('change', function () {
    clearResult();     // cambiar el tipo limpia el resultado previo
    setError(tipoEl, tipoErrEl, false);
  });

  /* ─────────── Init ─────────── */
  renderResume();
})();
