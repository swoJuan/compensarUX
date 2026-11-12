/* ============================================================
 * otp-input.js — API del componente transversal ZT "OTP Input / Verification Code"
 * ------------------------------------------------------------
 * Grupo de N inputs de un dígito para códigos de verificación. Componente
 * GENERAL (no acoplado a un flujo). Estilos en otp-input.css.
 *
 * Comportamiento:
 *   - Solo dígitos 0-9 (inputmode numeric); ignora letras/símbolos.
 *   - Autoavance al siguiente campo al escribir; Backspace vacío → campo anterior.
 *   - Paste distribuye el código pegado entre las celdas (ignora no-numéricos).
 *   - Autocomplete "one-time-code" en el primer campo.
 *   - onChange(value) en cada cambio; onComplete(value) al reunir los N dígitos.
 *   - setState('default'|'success'|'error'|'disabled'), getValue(), clear(), focusFirst().
 *
 * Accesibilidad: cada input aria-label "Dígito i de N"; en error aria-invalid.
 * El host declara aria-live donde corresponda (lo gestiona la pantalla).
 *
 * API:
 *   ZTOtpInput.create(container, {
 *     length: 6,
 *     value: '',                       // valor inicial opcional
 *     onChange: function (value) {},   // en cada cambio
 *     onComplete: function (value) {}  // al completar los N dígitos
 *   }) -> instancia { getValue, setValue, clear, setState, focusFirst, destroy }
 * ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function onlyDigits(s) { return String(s || '').replace(/\D+/g, ''); }

  function OTP(container, opts) {
    opts = opts || {};
    this.container = container;
    this.length = opts.length || 6;
    this.onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
    this.onComplete = typeof opts.onComplete === 'function' ? opts.onComplete : null;
    this.cells = [];
    this.build();
    if (opts.value) this.setValue(opts.value);
  }

  OTP.prototype.build = function () {
    var self = this;
    this.container.classList.add('zt-otp');
    this.container.style.setProperty('--zt-otp-len', this.length);
    this.container.setAttribute('role', 'group');
    if (!this.container.getAttribute('aria-label')) {
      this.container.setAttribute('aria-label', 'Código de verificación de ' + this.length + ' dígitos');
    }
    this.container.innerHTML = '';

    for (var i = 0; i < this.length; i++) {
      var input = el('input', 'zt-otp__cell');
      input.type = 'text';                 // text + inputmode numeric = mejor control
      input.inputMode = 'numeric';
      input.setAttribute('maxlength', '1');
      input.setAttribute('aria-label', 'Dígito ' + (i + 1) + ' de ' + this.length);
      input.autocomplete = (i === 0) ? 'one-time-code' : 'off';
      input.setAttribute('data-index', i);
      this.cells.push(input);
      this.container.appendChild(input);
    }
    this.wire();
  };

  OTP.prototype.wire = function () {
    var self = this;
    this.cells.forEach(function (input, i) {
      // Entrada: quedarse con el último dígito escrito y autoavanzar.
      input.addEventListener('input', function () {
        var d = onlyDigits(input.value);
        input.value = d ? d.charAt(d.length - 1) : '';
        self.markFilled(input);
        if (input.value && i < self.length - 1) self.cells[i + 1].focus();
        self.emitChange();
      });

      // Teclado: Backspace, flechas.
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
          if (input.value) {
            // borra el propio valor (el evento input emitirá el cambio)
            return;
          }
          // vacío → ir al anterior y borrarlo
          if (i > 0) {
            e.preventDefault();
            var prev = self.cells[i - 1];
            prev.value = '';
            self.markFilled(prev);
            prev.focus();
            self.emitChange();
          }
        } else if (e.key === 'ArrowLeft' && i > 0) {
          e.preventDefault(); self.cells[i - 1].focus();
        } else if (e.key === 'ArrowRight' && i < self.length - 1) {
          e.preventDefault(); self.cells[i + 1].focus();
        }
      });

      // Pegar: distribuir el código (desde cualquier celda).
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text');
        var digits = onlyDigits(text).slice(0, self.length - i);
        if (!digits) return;
        for (var k = 0; k < digits.length; k++) {
          self.cells[i + k].value = digits.charAt(k);
          self.markFilled(self.cells[i + k]);
        }
        var next = Math.min(i + digits.length, self.length - 1);
        self.cells[next].focus();
        self.emitChange();
      });

      // Seleccionar el contenido al enfocar (reemplazo cómodo).
      input.addEventListener('focus', function () { input.select && input.select(); });
    });
  };

  OTP.prototype.markFilled = function (input) {
    if (input.value) input.setAttribute('data-filled', '');
    else input.removeAttribute('data-filled');
  };

  OTP.prototype.getValue = function () {
    return this.cells.map(function (c) { return c.value || ''; }).join('');
  };

  OTP.prototype.setValue = function (value) {
    var digits = onlyDigits(value).slice(0, this.length);
    for (var i = 0; i < this.length; i++) {
      this.cells[i].value = digits.charAt(i) || '';
      this.markFilled(this.cells[i]);
    }
    this.emitChange();
  };

  OTP.prototype.clear = function () {
    this.cells.forEach(function (c) { c.value = ''; c.removeAttribute('data-filled'); });
    this.emitChange();
  };

  OTP.prototype.focusFirst = function () {
    if (this.cells[0]) this.cells[0].focus();
  };

  // Estados globales del grupo: default | success | error | disabled.
  OTP.prototype.setState = function (state) {
    this.container.classList.remove('is-success', 'is-error');
    var invalid = state === 'error';
    this.cells.forEach(function (c) {
      c.disabled = state === 'disabled';
      if (invalid) c.setAttribute('aria-invalid', 'true');
      else c.removeAttribute('aria-invalid');
    });
    if (state === 'success') this.container.classList.add('is-success');
    else if (state === 'error') this.container.classList.add('is-error');
  };

  OTP.prototype.emitChange = function () {
    var v = this.getValue();
    if (this.onChange) this.onChange(v);
    if (v.length === this.length && this.onComplete) this.onComplete(v);
  };

  OTP.prototype.destroy = function () {
    this.container.innerHTML = '';
    this.container.classList.remove('zt-otp', 'is-success', 'is-error');
  };

  function create(container, opts) {
    if (!container) return null;
    return new OTP(container, opts || {});
  }

  global.ZTOtpInput = { create: create };
})(window);
