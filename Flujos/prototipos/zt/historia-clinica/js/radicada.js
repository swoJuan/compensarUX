/* radicada.js — Muestra el radicado recién generado en "Solicitud radicada".
 * Si se llega directo a la pantalla (sin pasar por el formulario) queda el
 * número de ejemplo del Figma que trae el HTML. */
(function () {
  'use strict';
  var last = HC.last();
  var el = document.getElementById('hc-radicado-num');
  if (last && el) el.textContent = last.id;
})();
