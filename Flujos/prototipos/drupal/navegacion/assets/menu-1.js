/**
 * ============================================================
 *  MENU-1.JS — Navegación jerárquica tipo acordeón
 *  Reutiliza el componente productivo .mp-accordion (core).
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

  function renderLevel(nodes, depth) {
    return nodes
      .map(function (node) {
        var indent = 24 + depth * 24;

        // Hoja sin hijos: fila tipo link, sin chevron, sin toggle.
        // Figma (Page 4) no usa íconos de categoría en las filas del
        // flyout — solo texto y, si aplica, el chevron de expandir.
        if (!hasChildren(node)) {
          var href = node.href || '#';
          return (
            '<div class="mp-accordion__item mp-accordion__item--link">' +
              '<a class="mp-accordion__trigger mp-accordion__trigger--link" href="' + href + '" style="padding-left:' + indent + 'px">' +
                '<span class="mp-accordion__title">' + esc(node.label) + '</span>' +
              '</a>' +
            '</div>'
          );
        }

        // Nivel con hijos: trigger + panel colapsable (acordeón real).
        var triggerId = 'acc-trigger-' + node.id;
        var panelId = 'acc-panel-' + node.id;
        return (
          '<div class="mp-accordion__item">' +
            '<button class="mp-accordion__trigger" type="button" id="' + triggerId + '" ' +
              'aria-expanded="false" aria-controls="' + panelId + '" style="padding-left:' + indent + 'px">' +
              '<span class="mp-accordion__title">' + esc(node.label) + '</span>' +
              '<i class="mp-accordion__icon icon icon-caret-right icon-20" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="mp-accordion__panel" id="' + panelId + '" role="region" aria-labelledby="' + triggerId + '">' +
              '<div class="mp-accordion__content mp-accordion__content--nav">' +
                '<div class="mp-accordion mp-accordion--nested">' + renderLevel(node.children, depth + 1) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function closeAll(body) {
    body.querySelectorAll('.mp-accordion__item.is-open').forEach(function (item) {
      item.classList.remove('is-open');
    });
    body.querySelectorAll('.mp-accordion__trigger[aria-expanded="true"]').forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function init() {
    var body = document.getElementById('nav-sidebar-body');
    if (!body || typeof NAV_TREE === 'undefined') return;
    var navItems = NAV_TREE.filter(function (node) { return node.id !== 'inicio'; });

    body.innerHTML =
      '<div class="mp-accordion mp-accordion--flush proto-menu1__accordion">' +
        renderLevel(navItems, 0) +
      '</div>';

    body.addEventListener('click', function (event) {
      var trigger = event.target.closest('.mp-accordion__trigger');
      if (!trigger || trigger.classList.contains('mp-accordion__trigger--link')) return;

      var item = trigger.closest('.mp-accordion__item');
      var isOpen = item.classList.contains('is-open');

      // Solo un ítem abierto por nivel: cerramos los hermanos directos.
      var level = item.parentElement;
      Array.prototype.forEach.call(level.children, function (sibling) {
        if (sibling === item) return;
        sibling.classList.remove('is-open');
        var siblingTrigger = sibling.querySelector(':scope > .mp-accordion__trigger');
        if (siblingTrigger) siblingTrigger.setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });

    // Al cerrar el panel, el menú vuelve a su estado inicial (todo colapsado).
    document.addEventListener('navshell:close', function () {
      closeAll(body);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
