/* ============================================================
 * action-card.js — API del componente transversal ZT "Action Card"
 * ------------------------------------------------------------
 * Permite crear la card por JS sin reconstruir su HTML interno en cada
 * pantalla. Estilos en action-card.css.
 *
 * API:
 *   ZTActionCard.create({
 *     title:       "Iniciar afiliación",   // obligatorio
 *     description: "Texto opcional",        // opcional (Body M)
 *     icon:        "assets/ic.svg",         // ruta a imagen  (o iconClass)
 *     iconClass:   "icon icon-user-plus icon-32 gs-violet", // alternativa: icono de fuente
 *     href:        "destino.html",          // si existe → <a>; si no → <button>
 *     disabled:    false                     // opcional
 *   }) -> HTMLElement
 *
 *   ZTActionCard.render(container, cardConfig)   // crea e inserta en un contenedor
 *
 * Semántica: con href → <a> (navegación); sin href → <button> (acción).
 * disabled → aria-disabled="true" (nunca href="#").
 * ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function create(cfg) {
    cfg = cfg || {};
    if (!cfg.title) throw new Error('ZTActionCard: "title" es obligatorio');

    var navigable = !!cfg.href && !cfg.disabled;
    var root = document.createElement(navigable ? 'a' : 'button');
    root.className = 'zt-action-card';
    if (navigable) {
      root.setAttribute('href', cfg.href);
    } else {
      root.setAttribute('type', 'button');
    }
    if (cfg.disabled) root.setAttribute('aria-disabled', 'true');

    // Ícono: imagen (icon) o icono de fuente (iconClass)
    if (cfg.iconClass) {
      var iSpan = el('span', 'zt-action-card__icon ' + cfg.iconClass);
      iSpan.setAttribute('aria-hidden', 'true');
      root.appendChild(iSpan);
    } else if (cfg.icon) {
      var img = el('img', 'zt-action-card__icon');
      img.setAttribute('src', cfg.icon);
      img.setAttribute('alt', '');
      img.setAttribute('aria-hidden', 'true');
      root.appendChild(img);
    }

    // Bloque de texto (título + descripción opcional)
    var text = el('span', 'zt-action-card__text');
    var title = el('span', 'zt-action-card__title');
    title.textContent = cfg.title;
    text.appendChild(title);
    if (cfg.description) {                 // solo si hay descripción real
      var desc = el('span', 'zt-action-card__desc');
      desc.textContent = cfg.description;
      text.appendChild(desc);
    }
    root.appendChild(text);

    // Caret (siempre)
    var caret = el('span', 'zt-action-card__caret icon icon-caret-right icon-24 gs-inherit');
    caret.setAttribute('aria-hidden', 'true');
    root.appendChild(caret);

    return root;
  }

  function render(container, cfg) {
    var node = create(cfg);
    if (container && container.appendChild) container.appendChild(node);
    return node;
  }

  global.ZTActionCard = { create: create, render: render };
})(window);
