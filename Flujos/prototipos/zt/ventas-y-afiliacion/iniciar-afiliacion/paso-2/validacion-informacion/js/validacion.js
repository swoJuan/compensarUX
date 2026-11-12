/* ============================================================
 * validacion.js — Pantalla "Validación de información" (OTP) del Paso 2 (ZT)
 * ------------------------------------------------------------
 * ⚠️  SIMULACIÓN VISUAL DE PROTOTIPO. En producción, la generación, el envío, la
 * expiración, el número de intentos y la validación del OTP DEBEN ser controlados
 * por el backend. sessionStorage y el código mock (514566) NO son seguridad real.
 *
 * Responsabilidades:
 *   - CONTROL DE ACCESO: requiere candidato viable + Paso 1 completado + datos del
 *     Paso 2 guardados (step2). Si no, redirige al último paso válido.
 *   - Hidratar el resumen del candidato (Person Summary compact) y el stepper con
 *     Paso 2 ACTIVE (esta pantalla NO es un paso nuevo del stepper).
 *   - OTP de 6 dígitos (componente transversal): valida AUTOMÁTICAMENTE al completar.
 *       correcto (514566) → estado success + alerta success + Continuar habilitado.
 *       incorrecto        → estado error + alerta error; al reeditar se limpia.
 *   - Countdown de reenvío (2:00) persistente en sessionStorage (no se reinicia al
 *     refrescar); al expirar habilita "Reenviar código".
 *   - Continuar (solo si otpVerified): marca Paso 2 completed, guarda otpVerified,
 *     y navega al Paso 3 (Beneficiarios).
 *   - Atrás: vuelve a Datos del contratante sin borrar step2.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ─────────── */
  if (!Z || !Z.isViable()) { window.location.replace('../../index.html'); return; }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) { window.location.replace('../../paso-1/index.html'); return; }
  var step2 = Z.getStep2();
  if (!step2) { window.location.replace('../index.html'); return; }   // sin datos del Paso 2

  var candidate = Z.getCandidate();
  var otp = Z.getOtpConfig();   // { code, length, resendSeconds } — MOCK

  /* ─────────── Referencias al DOM ─────────── */
  var candSummary = document.getElementById('pa-cand-summary');
  var stepperEl   = document.getElementById('pa-stepper');
  var otpHost     = document.getElementById('ov-otp');
  var alertEl     = document.getElementById('ov-alert');
  var resendEl    = document.getElementById('ov-resend');
  var resendTail  = document.getElementById('ov-resend-tail');
  var continueBtn = document.getElementById('ov-continue');
  var backBtn     = document.getElementById('ov-back');

  /* ─────────── Resumen del candidato (Person Summary compact) ─────────── */
  ZTPersonSummary.render(candSummary, {
    eyebrow: 'Persona a afiliar',
    variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '',
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber
  });

  /* ─────────── Stepper: Paso 2 ACTIVE (esta pantalla sigue en el Paso 2) ─────────── */
  ZTStepper.render(stepperEl, Z.stepperConfig(2));   // pasos completados clicables

  /* ═══════════════ ESTADO DE VERIFICACIÓN ═══════════════ */
  var verified = step2.otpVerified === true;

  function setContinueEnabled(on) {
    continueBtn.disabled = !on;
  }

  function showSuccess() {
    ZTAlert.render(alertEl, {
      type: 'success',
      title: 'Código correcto',
      description: 'Da clic en continuar para avanzar al siguiente paso.'
    });
    otpInstance.setState('success');
    setContinueEnabled(true);
  }
  function showError() {
    ZTAlert.render(alertEl, {
      type: 'error',
      title: 'Código incorrecto',
      description: 'Verifica el código e inténtalo nuevamente.'
    });
    otpInstance.setState('error');
    setContinueEnabled(false);
  }
  function clearResult() {
    ZTAlert.clear(alertEl);
    otpInstance.setState('default');
    setContinueEnabled(false);
  }

  /* ═══════════════ OTP (componente transversal) ═══════════════ */
  var otpInstance = ZTOtpInput.create(otpHost, {
    length: otp.length,
    onChange: function () {
      // Al reeditar tras un resultado, limpiar estado (error/success) y revalidar
      // cuando vuelva a haber 6 dígitos. No revalida hasta completar.
      if (!verified && alertEl.innerHTML !== '') clearResult();
    },
    onComplete: function (value) {
      if (verified) return;   // ya verificado; no re-evaluar
      if (Z.verifyOtp(value)) {
        verified = true;
        // Persistir la verificación en step2 (aún NO marcamos completed: eso ocurre
        // al pulsar Continuar, según el flujo).
        var s2 = Z.getStep2() || {};
        s2.otpVerified = true;
        Z.saveStep2(s2);
        showSuccess();
      } else {
        showError();
      }
    }
  });

  // Si el usuario ya verificó antes de avanzar y vuelve a esta pantalla,
  // restaurar el estado success + Continuar habilitado (punto 24).
  if (verified) {
    otpInstance.setValue(otp.code);   // mostrar el código verificado (mock)
    showSuccess();
  } else {
    otpInstance.focusFirst();
  }

  /* ═══════════════ COUNTDOWN DE REENVÍO (persistente) ═══════════════ */
  var timer = null;

  function fmt(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function ensureResendAt() {
    // Si no hay timestamp o ya expiró y aún no se generó uno nuevo al entrar,
    // arrancamos el countdown la primera vez que se llega a la pantalla.
    var at = Z.getOtpResendAt();
    if (!at) {
      at = Date.now() + otp.resendSeconds * 1000;
      Z.saveOtpResendAt(at);
    }
    return at;
  }

  function remainingSecs() {
    var at = Z.getOtpResendAt();
    if (!at) return 0;
    return Math.max(0, Math.round((at - Date.now()) / 1000));
  }

  function renderResend() {
    var secs = remainingSecs();
    if (secs > 0) {
      resendEl.textContent = 'Reenvía el código en ' + fmt(secs);
      resendEl.classList.remove('is-active');
      resendEl.removeAttribute('role');
      resendEl.removeAttribute('tabindex');
      if (resendTail) resendTail.hidden = false;
    } else {
      resendEl.textContent = 'Reenviar código';
      resendEl.classList.add('is-active');
      resendEl.setAttribute('role', 'button');
      resendEl.setAttribute('tabindex', '0');
      if (resendTail) resendTail.hidden = true;
    }
  }

  function startTimer() {
    ensureResendAt();
    renderResend();
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      renderResend();
      if (remainingSecs() <= 0) { clearInterval(timer); timer = null; }
    }, 1000);
  }

  function doResend() {
    if (remainingSecs() > 0) return;   // aún no disponible
    // Simular reenvío: nuevo código (mismo mock), reiniciar contador y limpiar OTP.
    Z.saveOtpResendAt(Date.now() + otp.resendSeconds * 1000);
    verified = false;
    var s2 = Z.getStep2() || {}; delete s2.otpVerified; Z.saveStep2(s2);
    otpInstance.clear();
    clearResult();
    otpInstance.focusFirst();
    // Feedback accesible breve (info) que se auto-limpia.
    ZTAlert.render(alertEl, { type: 'info', description: 'Código reenviado. Revisa tu celular o correo.' });
    window.setTimeout(function () { if (!verified) ZTAlert.clear(alertEl); }, 2500);
    startTimer();
  }

  resendEl.addEventListener('click', function () {
    if (resendEl.classList.contains('is-active')) doResend();
  });
  resendEl.addEventListener('keydown', function (e) {
    if (resendEl.classList.contains('is-active') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); doResend();
    }
  });

  startTimer();

  /* ═══════════════ CONTINUAR → marcar Paso 2 completed + Paso 3 ═══════════════ */
  continueBtn.addEventListener('click', function () {
    // Doble verificación: no avanzar solo por tener 6 números.
    if (!(Z.getStep2() && Z.getStep2().otpVerified === true)) return;
    var s2 = Z.getStep2();
    s2.completed = true;          // el Paso 2 SOLO queda completo tras validar el OTP
    s2.otpVerified = true;
    Z.saveStep2(s2);
    Z.clearOtpResend();           // el countdown ya no aplica una vez avanzado
    // Stepper: Paso 1 y 2 completed, Paso 3 active. Paso 3 aún no existe:
    // destino preparado/documentado.
    // TODO: cuando exista → '../../paso-3/index.html'
    window.location.href = '../../paso-3/index.html';
  });

  /* ═══════════════ ATRÁS → Datos del contratante (sin borrar step2) ═══════════════ */
  backBtn.addEventListener('click', function () {
    window.location.href = '../index.html';
  });
})();
