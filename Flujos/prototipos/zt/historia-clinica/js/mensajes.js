/* ============================================================
 * mensajes.js — Mensajes modales del flujo "Historia clínica" (ZT)
 * ------------------------------------------------------------
 * Errores y avisos de la solicitud, mostrados con el modal transversal ZTModal.
 *
 *   HCMensajes.show('dup' | 'error' | 'gestionada', { onRetry })
 *
 * [SUPUESTO] El Figma de ZT no trae estos mensajes; los textos y variantes salen del
 * Figma de la APP (App 09 · 09B · 09C) para que ambos canales hablen igual.
 * Requiere: modal.js (ZTModal).
 * ============================================================ */
(function (global) {
  'use strict';

  var MENSAJES = {
    dup: {
      type: 'error',
      title: 'Lo sentimos',
      body: 'No puedes hacer esta solicitud porque ya tienes otra registrada con la misma información.',
      primary: 'Ir a Mis solicitudes'
    },
    error: {
      type: 'error',
      title: 'Lo sentimos',
      body: 'No fue posible realizar la solicitud. Intenta de nuevo en unos minutos.',
      primary: 'Intentar de nuevo'
    },
    gestionada: {
      type: 'warning',
      title: 'Esta solicitud ya fue gestionada',
      body: 'Puedes consultar el resultado en Mis solicitudes.',
      primary: 'Ver resultado'
    }
  };

  function show(kind, opts) {
    var m = MENSAJES[kind];
    if (!m) return;
    opts = opts || {};
    ZTModal.open({
      type: m.type,
      title: m.title,
      body: m.body,
      primaryAction: {
        label: m.primary,
        onClick: function () {
          ZTModal.close();
          if (kind === 'error') {
            // Reintenta solo si quien lo abrió tiene una solicitud lista; si no, solo se cierra
            if (typeof opts.onRetry === 'function') opts.onRetry();
          } else {
            window.location.href = 'mis-solicitudes.html';
          }
        }
      },
      secondaryAction: { label: 'Cerrar', onClick: function () { ZTModal.close(); } }
    });
  }

  global.HCMensajes = { show: show };
})(window);
