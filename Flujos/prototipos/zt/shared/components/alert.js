/* ============================================================
 * alert.js — API del componente transversal ZT "Alert"
 * ------------------------------------------------------------
 * Alerta contextual inline (no modal, no overlay). Estilos en alert.css.
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
 *   - El nodo raíz declara role="status" + aria-live="polite" por defecto,
 *     de modo que la alerta se anuncia al aparecer SIN mover el foco de forma
 *     agresiva (el usuario puede seguir trabajando con el formulario).
 *   - Si el contenedor host ya declara aria-live, el atributo en la raíz es
 *     redundante pero inofensivo; render()/clear() reemplazan el contenido.
 *
 * Mapa de iconos de estado (font-icon del Design System):
 *   warning → icon-warning   success → icon-check
 *   info    → icon-info      error   → icon-x-circle
 * ============================================================ */
(function (global) {
  'use strict';

  var ICON = {
    warning: 'icon-warning',
    success: 'icon-check',
    info: 'icon-info',
    error: 'icon-x-circle'
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

    var root = el('div', 'zt-alert zt-alert--' + type);
    // Región anunciable, no intrusiva: no mueve el foco.
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');

    // Icono de estado (32×32) — icono exacto del sistema, no emoji ni SVG manual.
    var icon = el('span', 'zt-alert__icon icon ' + (ICON[type] || ICON.warning) + ' icon-32 gs-inherit');
    icon.setAttribute('aria-hidden', 'true');
    root.appendChild(icon);

    // Contenido: título (opcional) + descripción (opcional).
    // Solo-descripción → alerta compacta (p. ej. variante info sin encabezado).
    var content = el('div', 'zt-alert__content');

    if (cfg.title) {
      var title = el('p', 'zt-alert__title');
      title.textContent = cfg.title;
      content.appendChild(title);
    }

    if (cfg.description) {
      var desc = el('p', 'zt-alert__desc');
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
