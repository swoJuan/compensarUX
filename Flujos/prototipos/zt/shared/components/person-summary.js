/* ============================================================
 * person-summary.js — API del componente transversal ZT "Person Summary"
 * ------------------------------------------------------------
 * Resumen de identidad de una persona (avatar + eyebrow opcional + nombre +
 * documento). Informativo, NO interactivo (no button/link si no hay acción).
 * Estilos en person-summary.css. Componente GENERAL (no acoplado a un flujo).
 *
 * API:
 *   ZTPersonSummary.create({
 *     name:           "Laura Fernanda Rodríguez Duarte",  // obligatorio
 *     documentType:   "CC",         // código (CC, TI, CE, PA, PPT) — opcional
 *     documentNumber: "222",        // valor limpio — opcional
 *     document:       "C.C. 222",   // alternativa: documento ya formateado
 *     eyebrow:        "Persona a afiliar",   // opcional (contexto)
 *     variant:        "default" | "compact", // def. "default"
 *     icon:           "icon-user-plus"       // clase de font-icon (def. icon-user)
 *   }) -> HTMLElement
 *
 *   ZTPersonSummary.render(container, cfg)  // crea e inserta (reemplaza contenido)
 *
 * Formateo del documento: si se pasa `document` se usa tal cual; si no, se
 * arma con la etiqueta corta del tipo (C.C., T.I., …) + el número con separador
 * de miles. El valor limpio original NO se muta (solo presentación).
 *
 * Accesibilidad: nodo raíz sin rol interactivo; el avatar es decorativo
 * (aria-hidden). El nombre y el documento son texto.
 * ============================================================ */
(function (global) {
  'use strict';

  // Etiquetas cortas del tipo de documento (código → presentación).
  var SHORT_TIPO = { CC: 'C.C.', TI: 'T.I.', CE: 'C.E.', PA: 'Pasaporte', PPT: 'PPT' };

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // Número con separador de miles (solo presentación).
  function formatNumero(numero) {
    return String(numero == null ? '' : numero)
      .replace(/\D+/g, '')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Línea de documento: usa `document` si viene; si no, arma "C.C. 1.234.567".
  function docLine(cfg) {
    if (cfg.document) return cfg.document;
    var etq = SHORT_TIPO[cfg.documentType] || cfg.documentType || '';
    var num = formatNumero(cfg.documentNumber);
    return (etq ? etq + ' ' : '') + num;
  }

  function create(cfg) {
    cfg = cfg || {};
    if (!cfg.name) throw new Error('ZTPersonSummary: se requiere "name"');
    var variant = cfg.variant === 'compact' ? 'compact' : 'default';

    var root = el('div', 'zt-person zt-person--' + variant);

    // Avatar decorativo (icono de persona del sistema).
    var avatar = el('span', 'zt-person__avatar');
    avatar.setAttribute('aria-hidden', 'true');
    var iconName = cfg.icon || 'icon-user';
    var iconSize = variant === 'compact' ? 'icon-20' : 'icon-24';
    var icon = el('span', 'icon ' + iconName + ' ' + iconSize + ' gs-violet');
    avatar.appendChild(icon);
    root.appendChild(avatar);

    // Texto: eyebrow (opcional) + nombre + documento.
    var text = el('div', 'zt-person__text');

    if (cfg.eyebrow) {
      var eyebrow = el('p', 'zt-person__eyebrow');
      eyebrow.textContent = cfg.eyebrow;
      text.appendChild(eyebrow);
    }

    var name = el('p', 'zt-person__name');
    name.textContent = cfg.name;
    text.appendChild(name);

    var doc = docLine(cfg);
    if (doc) {
      var docEl = el('p', 'zt-person__doc');
      docEl.textContent = doc;
      text.appendChild(docEl);
    }

    root.appendChild(text);
    return root;
  }

  function render(container, cfg) {
    if (!container) return null;
    container.innerHTML = '';
    var node = create(cfg);
    container.appendChild(node);
    return node;
  }

  global.ZTPersonSummary = { create: create, render: render };
})(window);
