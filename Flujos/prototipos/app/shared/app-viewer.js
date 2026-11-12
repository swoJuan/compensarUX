/* ============================================================
 * app-viewer.js — Visor de teléfono de la APP (prototipos móviles)
 * ------------------------------------------------------------
 * Ajusta la escala del marco del dispositivo para que quepa completo en la
 * altura de la ventana (en escritorio). En pantallas ≤480px el CSS quita el
 * marco y la app ocupa toda la pantalla, así que no hace falta escalar.
 *
 * Uso: <div class="app-stage" data-app-stage> … </div> + este script.
 * ============================================================ */
(function () {
  'use strict';
  var stage = document.querySelector('[data-app-stage]');
  if (!stage) return;

  var DEVICE_H = 844 + 2 * 10;   // pantalla + bisel (ver --app-h / --app-bezel en app.css)
  var MARGIN = 32;

  function fit() {
    var scale = 1;
    if (window.innerWidth > 480) {
      scale = Math.min(1, (window.innerHeight - MARGIN) / DEVICE_H);
    }
    stage.style.setProperty('--app-scale', String(Math.max(scale, 0.5)));
  }

  window.addEventListener('resize', fit);
  fit();
})();
