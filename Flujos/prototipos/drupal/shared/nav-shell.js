/**
 * ============================================================
 *  NAV-SHELL.JS — Apertura/cierre del panel de navegación
 *  Reutiliza el componente productivo .mp-sidebar (core) como
 *  contenedor del menú en ambas variantes. Este script solo
 *  orquesta abrir/cerrar/foco — el contenido del menú lo arma
 *  menu-1.js o menu-2.js según la página.
 * ============================================================
 */

(function () {
  var trigger = document.getElementById('nav-trigger');
  var sidebar = document.getElementById('nav-sidebar');
  if (!trigger || !sidebar) return;

  var panel = sidebar.querySelector('.mp-sidebar__panel');
  var closeTargets = sidebar.querySelectorAll('[data-nav-close]');
  var lastFocused = null;

  function ensureSidebarActions() {
    if (panel.querySelector('.proto-sidebar-actions')) return;
    var actions = document.createElement('div');
    actions.className = 'proto-sidebar-actions';
    actions.innerHTML =
      '<div class="proto-sidebar-search">' +
        '<label class="visually-hidden" for="nav-sidebar-search">Buscar en Compensar</label>' +
        '<input class="proto-sidebar-search__input" id="nav-sidebar-search" type="search" placeholder="Buscar">' +
        '<i class="icon icon-magnifying-glass proto-sidebar-search__icon" aria-hidden="true"></i>' +
      '</div>' +
      '<a class="mp-btn mp-btn--secundario proto-sidebar-actions__btn proto-sidebar-actions__btn--office" href="#">Oficina virtual</a>' +
      '<a class="mp-btn mp-btn--especial proto-sidebar-actions__btn proto-sidebar-actions__btn--join" href="#">Afíliate</a>';
    panel.appendChild(actions);
  }

  ensureSidebarActions();

  function getFocusable() {
    return panel.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
  }

  function open() {
    lastFocused = document.activeElement;
    sidebar.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('navshell:open'));

    var focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function close() {
    sidebar.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.dispatchEvent(new CustomEvent('navshell:close'));

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    } else {
      trigger.focus();
    }
  }

  trigger.addEventListener('click', function () {
    if (sidebar.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  });

  closeTargets.forEach(function (el) {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !sidebar.classList.contains('is-open')) return;
    close();
  });

  // Focus trap simple dentro del panel mientras está abierto
  sidebar.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab' || !sidebar.classList.contains('is-open')) return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // El panel .mp-sidebar es solo para la barra compacta (hamburger),
  // que en este prototipo llega hasta 1024px (ver nav-prototype.css).
  // Si el panel quedó abierto y la ventana se agranda a escritorio
  // real (resize, no reload), lo cerramos igual que con Escape:
  // limpia aria-expanded, el overflow:hidden del body y devuelve el foco.
  var desktopQuery = window.matchMedia('(min-width: 1025px)');
  function handleViewportChange(event) {
    if (event.matches && sidebar.classList.contains('is-open')) close();
  }
  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', handleViewportChange);
  } else if (typeof desktopQuery.addListener === 'function') {
    desktopQuery.addListener(handleViewportChange);
  }

  window.NavShell = { open: open, close: close };
})();
