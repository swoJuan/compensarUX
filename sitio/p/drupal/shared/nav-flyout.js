/**
 * ============================================================
 *  NAV-FLYOUT.JS — Flyout de escritorio anclado a cada ítem del
 *  nav principal (≥768px). Se muestra al pasar el mouse (hover),
 *  al enfocar con teclado o al hacer clic.
 *
 *  Reutiliza el componente productivo .mp-web-header__dropdown
 *  (core/components/web/_header.scss) como contenedor — solo se
 *  fuerza a una columna, ya que el core lo trae en grid de 2
 *  columnas para listas planas. El contenido interno es un
 *  .mp-accordion (mismo componente y misma lógica de expandir/
 *  colapsar que menu-1.js) porque el core no incluye un acordeón
 *  dentro del dropdown.
 *
 *  Requiere: nav-data.js (NAV_TREE). Es compartido por menu-1.html
 *  y menu-2.html — el patrón de flyout de escritorio no forma
 *  parte de la variable que se está probando (eso vive en el
 *  panel móvil, ver menu-1.js / menu-2.js).
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

  // Misma estructura que renderLevel en menu-1.js: hoja = fila tipo
  // link; rama = trigger + panel colapsable con acordeón anidado.
  function renderLevel(nodes, depth, navId) {
    return nodes
      .map(function (node) {
        var indent = 16 + depth * 16;

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

        var triggerId = 'flyout-trigger-' + navId + '-' + node.id;
        var panelId = 'flyout-panel-' + navId + '-' + node.id;
        return (
          '<div class="mp-accordion__item">' +
            '<button class="mp-accordion__trigger" type="button" id="' + triggerId + '" ' +
              'aria-expanded="false" aria-controls="' + panelId + '" style="padding-left:' + indent + 'px">' +
              '<span class="mp-accordion__title">' + esc(node.label) + '</span>' +
              '<i class="mp-accordion__icon icon icon-caret-right icon-20" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="mp-accordion__panel" id="' + panelId + '" role="region" aria-labelledby="' + triggerId + '">' +
              '<div class="mp-accordion__content mp-accordion__content--nav">' +
                '<div class="mp-accordion mp-accordion--nested">' + renderLevel(node.children, depth + 1, navId) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function collapseInner(dropdown) {
    dropdown.querySelectorAll('.mp-accordion__item.is-open').forEach(function (item) {
      item.classList.remove('is-open');
    });
    dropdown.querySelectorAll('.mp-accordion__trigger[aria-expanded="true"]').forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function init() {
    if (typeof NAV_TREE === 'undefined') return;

    var buttons = document.querySelectorAll('.mp-web-header__nav-link[data-nav-id]');
    if (!buttons.length) return;

    var entries = [];

    buttons.forEach(function (button) {
      var navId = button.getAttribute('data-nav-id');
      var node = NAV_TREE.find(function (item) { return item.id === navId; });
      if (!node || !hasChildren(node)) return;

      var wrapper = button.closest('.mp-web-header__nav-item');
      if (!wrapper) return;

      // El renglón de ítems (.proto-header__nav-inner) hace scroll
      // horizontal en escritorio angosto para no partirse en dos
      // líneas — si el dropdown se anidara ahí adentro, ese mismo
      // overflow lo recortaría. Se ancla más arriba, en <nav>
      // (position:relative de core, sin overflow), y se posiciona
      // por JS con las coordenadas reales del botón.
      var navEl = wrapper.closest('.mp-web-header__nav');
      if (!navEl) return;

      var dropdown = document.createElement('div');
      dropdown.className = 'mp-web-header__dropdown proto-flyout';
      dropdown.id = 'flyout-' + navId;
      dropdown.innerHTML =
        '<div class="mp-accordion mp-accordion--flush proto-flyout__accordion">' +
          renderLevel(node.children, 0, navId) +
        '</div>';
      navEl.appendChild(dropdown);

      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', dropdown.id);

      var entry = { wrapper: wrapper, button: button, dropdown: dropdown, closeTimer: null };
      entries.push(entry);

      function isInside(el) {
        return !!el && (wrapper.contains(el) || dropdown.contains(el));
      }

      function positionDropdown() {
        var navRect = navEl.getBoundingClientRect();
        var btnRect = button.getBoundingClientRect();
        dropdown.classList.remove('proto-flyout--right');
        dropdown.style.right = '';
        dropdown.style.top = (btnRect.bottom - navRect.top) + 'px';
        dropdown.style.left = (btnRect.left - navRect.left) + 'px';

        var overflowRight = dropdown.getBoundingClientRect().right > window.innerWidth;
        if (overflowRight) {
          dropdown.style.left = '';
          dropdown.style.right = (navRect.right - btnRect.right) + 'px';
          dropdown.classList.add('proto-flyout--right');
        }
      }

      function show() {
        clearTimeout(entry.closeTimer);
        entries.forEach(function (other) {
          if (other !== entry) hide(other);
        });
        positionDropdown();
        dropdown.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('mp-web-header__nav-link--is-hover');
      }

      function hide(target) {
        var t = target || entry;
        clearTimeout(t.closeTimer);
        t.dropdown.classList.remove('is-open');
        t.button.setAttribute('aria-expanded', 'false');
        t.button.classList.remove('mp-web-header__nav-link--is-hover');
        collapseInner(t.dropdown);
      }

      function scheduleHide() {
        clearTimeout(entry.closeTimer);
        entry.closeTimer = setTimeout(function () { hide(entry); }, 180);
      }

      wrapper.addEventListener('mouseenter', show);
      wrapper.addEventListener('mouseleave', scheduleHide);
      dropdown.addEventListener('mouseenter', function () { clearTimeout(entry.closeTimer); });
      dropdown.addEventListener('mouseleave', scheduleHide);

      button.addEventListener('click', function (event) {
        event.preventDefault();
        if (dropdown.classList.contains('is-open')) hide(entry); else show();
      });

      button.addEventListener('focus', show);

      function handleFocusOut(event) {
        if (!isInside(event.relatedTarget)) hide(entry);
      }
      wrapper.addEventListener('focusout', handleFocusOut);
      dropdown.addEventListener('focusout', handleFocusOut);

      entry.hide = hide;
    });

    if (!entries.length) return;

    // Acordeón interno (niveles 2/3 dentro del flyout): un solo
    // ítem abierto por nivel, igual que en menu-1.js.
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('.proto-flyout .mp-accordion__trigger');
      if (!trigger || trigger.classList.contains('mp-accordion__trigger--link')) return;

      var item = trigger.closest('.mp-accordion__item');
      var isOpen = item.classList.contains('is-open');
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

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      entries.forEach(function (entry) {
        if (entry.dropdown.classList.contains('is-open')) entry.hide(entry);
      });
    });

    // La posición del dropdown se calcula al abrir (positionDropdown).
    // Si la fila de ítems hace scroll horizontal o la ventana cambia
    // de tamaño con un panel abierto, se cierra en vez de quedar
    // desalineado.
    function closeAllOpen() {
      entries.forEach(function (entry) {
        if (entry.dropdown.classList.contains('is-open')) entry.hide(entry);
      });
    }
    var navInner = document.querySelector('.proto-header__nav-inner');
    if (navInner) navInner.addEventListener('scroll', closeAllOpen, { passive: true });
    window.addEventListener('resize', closeAllOpen);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
