/* ============================================================
 * status-result.js — API del componente transversal ZT "Status Result"
 * ------------------------------------------------------------
 * Resultado contextual inline (no modal). Estilos en status-result.css.
 *
 * API:
 *   ZTStatusResult.create({
 *     type:        "success" | "warning",   // (preparado: "info" | "error")
 *     title:       "La afiliación puede continuar",   // obligatorio
 *     description: "Texto de apoyo",                    // opcional
 *     personName:  "María Fernanda Ríos",               // opcional
 *     document:    "C.C. 1.234.567.890",                // opcional (ya formateado)
 *     status:      "Viable",                            // opcional → badge "Estado: <status>"
 *     primaryAction: {                                   // opcional (solo success)
 *       label: "Continuar",
 *       onClick: function () { ... }
 *     }
 *   }) -> HTMLElement
 *
 *   ZTStatusResult.render(container, cfg)  // crea e inserta (reemplaza el contenido previo)
 *
 * Mapa de iconos de estado (fuente del Design System):
 *   success → icon-check    warning → icon-warning
 *   info    → icon-info      error  → icon-x-circle
 *
 * Mapa de badge (Design System .mp-badge):
 *   success → mp-badge--success   warning → mp-badge--warning
 * ============================================================ */
(function (global) {
  'use strict';

  var ICON = { success: 'icon-check', warning: 'icon-warning', info: 'icon-info', error: 'icon-x-circle' };
  var BADGE = { success: 'mp-badge--success', warning: 'mp-badge--warning', info: 'mp-badge--info', error: 'mp-badge--error' };

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function create(cfg) {
    cfg = cfg || {};
    var type = cfg.type || 'info';
    if (!cfg.title) throw new Error('ZTStatusResult: "title" es obligatorio');

    var root = el('div', 'zt-status-result zt-status-result--' + type);
    // Accesibilidad: región anunciable. warning/error = alert; success/info = status.
    root.setAttribute('role', (type === 'warning' || type === 'error') ? 'alert' : 'status');
    root.setAttribute('aria-live', 'polite');

    // Ícono de estado
    var icon = el('span', 'zt-status-result__icon icon ' + (ICON[type] || ICON.info) + ' icon-24 gs-inherit');
    icon.setAttribute('aria-hidden', 'true');
    root.appendChild(icon);

    // Título
    var title = el('h3', 'zt-status-result__title');
    title.textContent = cfg.title;
    root.appendChild(title);

    // Descripción (opcional)
    if (cfg.description) {
      var desc = el('p', 'zt-status-result__desc');
      desc.textContent = cfg.description;
      root.appendChild(desc);
    }

    // Datos de persona (opcional)
    if (cfg.personName || cfg.document) {
      var person = el('div', 'zt-status-result__person');
      if (cfg.personName) {
        var pn = el('p', 'zt-status-result__person-name');
        pn.textContent = cfg.personName;
        person.appendChild(pn);
      }
      if (cfg.document) {
        var pd = el('p', 'zt-status-result__person-doc');
        pd.textContent = cfg.document;
        person.appendChild(pd);
      }
      root.appendChild(person);
    }

    // Badge de estado (opcional) — DS .mp-badge
    if (cfg.status) {
      var badge = el('span', 'zt-status-result__badge mp-badge ' + (BADGE[type] || ''));
      var label = el('span', 'mp-badge__label');
      label.textContent = 'Estado: ' + cfg.status;
      badge.appendChild(label);
      root.appendChild(badge);
    }

    // Acción primaria (opcional) — DS .mp-btn--primario
    if (cfg.primaryAction && cfg.primaryAction.label) {
      var actions = el('div', 'zt-status-result__actions');
      var btn = el('button', 'mp-btn mp-btn--primario');
      btn.setAttribute('type', 'button');
      btn.textContent = cfg.primaryAction.label;
      if (typeof cfg.primaryAction.onClick === 'function') {
        btn.addEventListener('click', cfg.primaryAction.onClick);
      }
      actions.appendChild(btn);
      root.appendChild(actions);
    }

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

  global.ZTStatusResult = { create: create, render: render };
})(window);
