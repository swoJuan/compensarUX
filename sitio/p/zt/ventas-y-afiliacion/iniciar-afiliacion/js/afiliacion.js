/* ============================================================
 * afiliacion.js — Comportamiento del flujo "Iniciar afiliación" (ZT)
 * ------------------------------------------------------------
 * Responsabilidades (sin backend real — prototipo):
 *   - Pantalla única "Iniciar afiliación" (se retiraron los tabs
 *     Afiliación / Consultar viabilidad): la viabilidad se consulta
 *     internamente al presionar "Continuar".
 *   - Campo "Número de documento": acepta SOLO dígitos (sanitiza en input).
 *   - Botón deshabilitado hasta que haya tipo + número válido.
 *   - Consulta de viabilidad simulada con estado de carga.
 *   - VIABLE   → resultado INLINE en la misma card (sin modal: un clic menos):
 *     persona + "Comenzar afiliación". Si ese documento tiene una afiliación
 *     en curso guardada, la acción es "Retomar en el Paso N".
 *   - AFILIACIÓN EN CURSO: al entrar, si hay un borrador guardado se muestra
 *     arriba "Retomar" / "Descartar" (el borrador no se pierde al cerrar la pestaña).
 *   - NO VIABLE → alerta warning contextual inline (componente transversal
 *     Alert, .zt-alert--warning) DENTRO de la card, entre la descripción y los
 *     campos. NO hay modal, overlay, navegación ni bloqueo: los campos siguen
 *     editables y se permite reconsultar. La alerta se limpia al cambiar
 *     tipo/número de documento (no se arrastra un resultado viejo a datos nuevos).
 *
 * ⚠️  MOCK DE PROTOTIPO — REEMPLAZAR POR SERVICIO REAL:
 *     La viabilidad se decide por la paridad del último dígito del
 *     documento (par = viable, impar = no viable). Esta regla vive
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
  var viableEl  = document.getElementById('afi-viable');   // resultado VIABLE inline
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

  function refreshSubmit() {
    submitEl.disabled = !isValid();
  }

  /* ─────────── Desenlaces de la consulta ─────────── */

  // Limpia el resultado previo (al cambiar datos o al reconsultar).
  function clearResult() {
    if (alertEl) ZTAlert.clear(alertEl);
    form.classList.remove('is-viable');
    viableEl.hidden = true; viableEl.innerHTML = '';
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


  // VIABLE → resultado inline (sin modal). Si el documento tiene una afiliación
  // en curso, se ofrece retomarla; si hay otra en curso (otra persona), se avisa
  // que se descartará al comenzar.
  function renderViable(tipo, numero) {
    var nombre = candidatoNombre(numero);
    var draft = Z && Z.draftSummary();
    var mismo = draft && draft.documentType === tipo && String(draft.documentNumber) === String(numero);
    var otro = draft && !mismo;

    function guardarCandidato(limpiar) {
      if (!Z) return;
      if (limpiar) Z.clearAll();     // persona nueva → no arrastrar pasos de otra afiliación
      var persona = Z.personaMock(numero);
      Z.saveCandidate({
        documentType: tipo,
        documentNumber: numero,      // valor limpio (sin puntos)
        name: nombre,
        firstName: persona.firstName,
        secondName: persona.secondName,
        firstSurname: persona.firstSurname,
        secondSurname: persona.secondSurname,
        viable: true
      });
    }

    ZTAlert.render(alertEl, {
      type: 'success',
      title: 'La afiliación puede continuar',
      description: 'No encontramos condiciones que impidan continuar con la afiliación a Medicina Prepagada.'
    });
    form.classList.add('is-viable');
    viableEl.hidden = false;
    viableEl.innerHTML =
      '<div class="afi-viable__person">' +
        '<span class="icon icon-user icon-24 gs-inherit" aria-hidden="true"></span>' +
        '<span><span class="afi-viable__name">' + esc(nombre) + '</span><span class="afi-viable__doc">' + esc(personaLinea(tipo, numero)) + '</span></span>' +
      '</div>' +
      (otro ? '<p class="afi-viable__note">Al comenzar se descarta la afiliación en curso de ' + esc(draft.name) + '.</p>' : '') +
      '<div class="afi-viable__actions">' +
        (mismo
          ? '<a class="mp-btn mp-btn--primario" id="afi-go" href="' + draft.href + '">Retomar en el Paso ' + draft.step + ' · ' + esc(draft.stepLabel) + '</a>' +
            '<button type="button" class="afi-link" data-act="restart">Empezar de nuevo</button>'
          : '<button type="button" class="mp-btn mp-btn--primario" id="afi-go" data-act="start">Comenzar afiliación</button>') +
        '<button type="button" class="afi-link" data-act="other">Consultar otro documento</button>' +
      '</div>';

    viableEl.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'start' || act === 'restart') { guardarCandidato(true); continuarAfiliacion(); }
      else if (act === 'other') { clearResult(); numeroEl.value = ''; refreshSubmit(); numeroEl.focus(); }
    };
    var go = document.getElementById('afi-go');
    if (go) go.focus();
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
    submitEl.disabled = on ? true : !isValid();
    if (on) {
      submitLbl.textContent = 'Consultando...';
    } else {
      submitLbl.textContent = BUTTON_LABEL;
    }
  }

  /* ─────────── MOCK de viabilidad (reemplazar por servicio real) ─────────── */
  // Regla de prototipo: último dígito par → viable; impar → no viable.
  // Devuelve una promesa para simular latencia de red.
  function consultarViabilidadMock(numero) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        var ultimo = parseInt(numero.charAt(numero.length - 1), 10);
        resolve({ viable: ultimo % 2 === 0 });
      }, 700);
    });
  }

  /* ─────────── Envío del formulario ─────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!isValid()) return;

    var tipo = tipoEl.value;
    var numero = numeroEl.value;

    clearResult();
    setLoading(true);

    consultarViabilidadMock(numero).then(function (res) {
      setLoading(false);
      if (res.viable) {
        renderViable(tipo, numero);      // resultado inline: Comenzar o Retomar
      } else {
        renderNoViable(tipo, numero);    // alerta warning inline (dentro de la card), permanece en pantalla
      }
    });
  });

  /* ─────────── Listeners de campos ─────────── */
  numeroEl.addEventListener('input', function () {
    sanitizeNumero();
    clearResult();     // modificar el documento limpia el resultado previo
    refreshSubmit();
  });
  // Bloquea el pegado de contenido no numérico
  numeroEl.addEventListener('paste', function () {
    window.setTimeout(function () { sanitizeNumero(); refreshSubmit(); }, 0);
  });
  tipoEl.addEventListener('change', function () {
    clearResult();     // cambiar el tipo limpia el resultado previo
    refreshSubmit();
  });

  /* ─────────── Init ─────────── */
  refreshSubmit();
  renderResume();
})();
