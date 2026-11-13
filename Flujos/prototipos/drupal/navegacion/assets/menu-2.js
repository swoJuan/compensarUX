/**
 * ============================================================
 *  MENU-2.JS — Navegación progresiva por vistas ("menu-mobile-v2")
 *
 *  Prueba: entre Nivel 1 → Nivel 2 → Nivel 3, cada categoría con
 *  hijos avanza a una vista nueva dentro del mismo panel .mp-sidebar
 *  (core), en vez de expandir un acordeón
 *  in-place. Nunca se ven dos niveles abiertos a la vez.
 *
 *  Aislamiento: todo el markup que arma este script usa clases
 *  exclusivas .menu-mobile-v2__* (ver nav-prototype.css, bloque
 *  "menu-2 mobile: menu-mobile-v2" al final del archivo). No toca
 *  .mp-accordion. Este archivo solo se carga en menu-2.html.
 *
 *  Requiere: nav-data.js (NAV_TREE), nav-shell.js
 * ============================================================
 */

(function () {
  function esc(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function hasChildren(node) {
    return Array.isArray(node.children) && node.children.length > 0;
  }

  // Pila de pantallas visitadas. Cada entrada = { title, nodes }.
  var stack = [];
  var body = null;
  var titleEl = null;
  var backEl = null;

  function rootLevel() {
    // "Inicio" no aparece en la lista del panel móvil.
    return {
      title: 'Menú',
      nodes: NAV_TREE.filter(function (node) { return node.id !== 'inicio'; })
    };
  }

  function resetStack() {
    stack = [rootLevel()];
  }

  // Cada fila es de un solo tipo (según el diseño de Figma):
  //  - con hijos  → <button> + chevron: avanza a la siguiente vista.
  //  - sin hijos  → <a> normal: destino final, sin chevron.
  // No hay marca de "página actual" (check ni punto): el diseño no la incluye.
  function renderRow(node) {
    var label = '<span class="menu-mobile-v2__row-label">' + esc(node.label) + '</span>';

    if (hasChildren(node)) {
      return (
        '<li>' +
          '<button type="button" class="menu-mobile-v2__row" data-drill-into="' + node.id + '">' +
            label +
            '<i class="icon icon-caret-right icon-16 menu-mobile-v2__row-chevron" aria-hidden="true"></i>' +
          '</button>' +
        '</li>'
      );
    }

    return (
      '<li>' +
        '<a class="menu-mobile-v2__row" href="' + esc(node.href || '#') + '">' +
          label +
        '</a>' +
      '</li>'
    );
  }

  // El botón de regreso vive en el header fijo del panel (junto al
  // título y la X), no como fila aparte dentro de la lista — evita
  // repetir "Planes" dos veces y no consume alto disponible.
  function render(direction) {
    var current = stack[stack.length - 1];
    var isRoot = stack.length === 1;

    var html = '<div class="menu-mobile-v2 ' +
      (direction === 'back' ? 'menu-mobile-v2--enter-back' : 'menu-mobile-v2--enter-forward') +
      '">';

    html += '<ul class="menu-mobile-v2__list" role="list">' +
      current.nodes.map(renderRow).join('') +
    '</ul>';

    html += '</div>';
    body.innerHTML = html;

    // El título del header refleja el nivel actual (Menú / Planes /
    // Plan Ideal...) y, junto con la flecha, es exclusivo de
    // menu-2.html.
    if (titleEl) titleEl.textContent = current.title;

    // Buscar / Oficina virtual / Afíliate solo van en el primer nivel (Figma).
    var actions = document.querySelector('#nav-sidebar .proto-sidebar-actions');
    if (actions) actions.hidden = !isRoot;

    if (backEl) {
      if (isRoot) {
        backEl.hidden = true;
      } else {
        var parentTitle = stack[stack.length - 2].title;
        backEl.hidden = false;
        backEl.setAttribute('aria-label', 'Volver a ' + parentTitle);
      }
    }

    // Foco: al avanzar o retroceder entre niveles, el foco va a la
    // flecha del header (el teclado/lector de pantalla aterriza en
    // la acción de regreso); en la raíz, no hay flecha, así que el
    // foco va al título del panel.
    if (!isRoot && backEl) {
      backEl.focus({ preventScroll: true });
    } else if (titleEl) {
      titleEl.focus({ preventScroll: true });
    }
  }

  function goInto(nodeId) {
    var current = stack[stack.length - 1];
    var node = current.nodes.find(function (item) { return item.id === nodeId; });
    if (!node || !hasChildren(node)) return;
    stack.push({ title: node.label, nodes: node.children });
    render('forward');
  }

  function goBack() {
    if (stack.length <= 1) return;
    stack.pop();
    render('back');
  }

  function init() {
    body = document.getElementById('nav-sidebar-body');
    titleEl = document.getElementById('nav-sidebar-title');
    backEl = document.getElementById('nav-sidebar-back');
    if (!body || typeof NAV_TREE === 'undefined') return;

    resetStack();
    render('forward');

    body.addEventListener('click', function (event) {
      var into = event.target.closest('[data-drill-into]');
      if (into) return goInto(into.getAttribute('data-drill-into'));

      // Enlace final: feedback visible de "presionado" (naranja).
      var link = event.target.closest('a.menu-mobile-v2__row');
      if (link) {
        link.classList.add('is-pressed');
        setTimeout(function () { link.classList.remove('is-pressed'); }, 300);
      }
    });

    // iOS Safari solo aplica :active si hay un listener táctil.
    body.addEventListener('touchstart', function () {}, { passive: true });

    // La flecha de regreso vive en el header (.mp-sidebar__header),
    // fuera de #nav-sidebar-body, así que se conecta aparte.
    if (backEl) backEl.addEventListener('click', goBack);

    // Cada vez que se abre el menú, empieza desde el nivel raíz:
    // predecible y sin arrastrar contexto de una visita anterior.
    document.addEventListener('navshell:open', function () {
      resetStack();
      render('forward');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
