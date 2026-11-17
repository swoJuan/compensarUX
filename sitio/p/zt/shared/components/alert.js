/* ============================================================
 * alert.js — API del componente transversal ZT "Alert"
 * ------------------------------------------------------------
 * Alerta contextual inline (no modal, no overlay). Genera el marcado OFICIAL del
 * Design System (.mp-alert, definido en core.css): este archivo ya no trae estilos propios.
 *
 * Componente GENERAL: no está acoplado a "viabilidad" ni a ningún flujo.
 *
 * API:
 *   ZTAlert.create({
 *     type:        "warning" | "success" | "info" | "error",  // def. "warning"
 *     title:       "No es posible continuar con la afiliación", // obligatorio
 *     description: "Texto de apoyo"                             // opcional
 *   }) -> HTMLElement
 *
 *   ZTAlert.render(container, cfg)  // crea e inserta (reemplaza contenido previo)
 *   ZTAlert.clear(container)        // vacía el contenedor host
 *
 * Accesibilidad:
 *   - Igual que en el DS: error → role="alert"; el resto → role="status"
 *     (anuncio educado, SIN mover el foco; el usuario sigue trabajando).
 *   - Si el contenedor host ya declara aria-live, el atributo en la raíz es
 *     redundante pero inofensivo; render()/clear() reemplazan el contenido.
 *
 * Mapa de iconos de estado (mismos que la documentación del Design System):
 *   warning → icon-warning        success → icon-check-circle
 *   info    → icon-info           error   → icon-warning-circle
 * ============================================================ */
(function (global) {
  'use strict';

  var ICON = {
    warning: 'icon-warning',
    success: 'icon-check-circle',
    info: 'icon-info',
    error: 'icon-warning-circle'
  };

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function create(cfg) {
    cfg = cfg || {};
    var type = cfg.type || 'warning';
    if (!cfg.title && !cfg.description) {
      throw new Error('ZTAlert: se requiere "title" y/o "description"');
    }

    var root = el('div', 'mp-alert mp-alert--' + type);
    // Región anunciable, no intrusiva: no mueve el foco (error = alert, resto = status).
    root.setAttribute('role', type === 'error' ? 'alert' : 'status');
    // Icono de estado (32×32) — mismo marcado que el DS: <i class="icon icon-X icon-32 mp-alert__icon">.
    var icon = el('i', 'icon ' + (ICON[type] || ICON.warning) + ' icon-32 mp-alert__icon');
    icon.setAttribute('aria-hidden', 'true');
    root.appendChild(icon);

    // Contenido: título (opcional) + descripción (opcional).
    // Solo-descripción → alerta compacta (p. ej. variante info sin encabezado).
    var content = el('div', 'mp-alert__content');

    if (cfg.title) {
      var title = el('p', 'mp-alert__title');
      title.textContent = cfg.title;
      content.appendChild(title);
    }

    if (cfg.description) {
      var desc = el('p', 'mp-alert__body');
      desc.textContent = cfg.description;
      content.appendChild(desc);
    }

    root.appendChild(content);
    return root;
  }

  // Inserta en el contenedor reemplazando su contenido previo.
  function render(container, cfg) {
    if (!container) return null;
    container.innerHTML = '';
    var node = create(cfg);
    container.appendChild(node);
    return node;
  }

  // Vacía el contenedor host (oculta la alerta).
  function clear(container) {
    if (container) container.innerHTML = '';
  }

  global.ZTAlert = { create: create, render: render, clear: clear };
})(window);
