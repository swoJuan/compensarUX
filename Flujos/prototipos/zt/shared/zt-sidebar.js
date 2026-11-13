/* ============================================================
 * zt-sidebar.js — Menú lateral transversal de ZT (fuente única)
 * ------------------------------------------------------------
 * Inyecta el markup del sidebar de ZT dentro de <nav class="sidebar">.
 * El markup vive SOLO aquí; ningún flujo lo duplica.
 *
 * Uso en cada pantalla ZT:
 *   <nav class="sidebar" data-active="agendamiento"></nav>
 *   ...
 *   <script src="../shared/zt-sidebar.js"></script>
 *
 * La opción activa se define por flujo con el atributo data-active,
 * usando el "id" de cada opción (ver ZT_MENU abajo).
 *   - Agendamiento de citas   -> data-active="agendamiento"
 *   - Agendamiento laboratorio -> data-active="agendamiento" (por ahora)
 *
 * Menú propio por pantalla (opcional): definir window.ZT_MENU_LOCAL antes de
 * cargar este script, con el mismo formato que ZT_MENU. Lo usa zt/inicio/.
 *
 * Los estilos (.sidebar, .nav-item, .active, .nav-icon, etc.) viven en
 * ../shared/zt.css. Este archivo solo genera el HTML.
 * ============================================================ */
(function () {
  'use strict';

  // Fuente única de la arquitectura del menú ZT (orden = jerarquía).
  // `href` es RELATIVO A LA RAÍZ zt/. En runtime se le antepone el prefijo
  // que lleva desde la página actual hasta zt/ (ver ztRoot()), para que el
  // mismo menú funcione a cualquier profundidad de flujo.
  var ZT_MENU = [
    { id: 'inicio',       label: 'Inicio',                      icon: 'icon-house',                 href: 'inicio/index.html' },
    { id: 'agendamiento', label: 'Agendamiento',                icon: 'icon-calendar-plus',         href: 'agendamiento-de-citas/index.html' },
    { id: 'ventas',       label: 'Ventas y Afiliación',         icon: 'icon-user-plus',             href: 'ventas-y-afiliacion/index.html' },
    { id: 'resultados',   label: 'Resultados de exámenes',      icon: 'icon-medical-file' },
    { id: 'certificados', label: 'Certificados',                icon: 'icon-identification-badge' },
    { id: 'pago',         label: 'Paga tu plan',                icon: 'icon-credit-card' },
    { id: 'orientacion',  label: 'Orientación médica virtual',  icon: 'icon-headset' },
    { id: 'detalle',      label: 'Detalle del plan',            icon: 'icon-rows' },
    { id: 'red',          label: 'Red de atención',             icon: 'icon-map-pin' },
    { id: 'directorio',   label: 'Directorio médico',           icon: 'icon-users' },
    { id: 'historia',     label: 'Historia clínica',            icon: 'icon-medical-file',          href: 'historia-clinica/index.html' }
  ];

  // Prefijo relativo desde la página actual hasta la raíz zt/.
  // Se deduce del src del propio <script> (…/zt/shared/zt-sidebar.js):
  // el trozo antes de "shared/zt-sidebar.js" es la ruta a zt/.
  function ztRoot() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      var idx = src.indexOf('shared/zt-sidebar.js');
      if (idx !== -1) return src.slice(0, idx);   // p.ej. "../" o "../../" o ""
    }
    return '';
  }

  function buildSidebar(nav) {
    var active = nav.getAttribute('data-active') || '';
    var root = ztRoot();
    // Una pantalla puede declarar su propio menú (window.ZT_MENU_LOCAL, mismo
    // formato que ZT_MENU). Hoy solo lo usa zt/inicio/, que sigue su Figma.
    // Si no existe, se usa el menú transversal de siempre.
    var menu = Array.isArray(window.ZT_MENU_LOCAL) ? window.ZT_MENU_LOCAL : ZT_MENU;

    var html = '' +
      '<div class="sidebar-menu-label">' +
        '<span>Menú</span>' +
        '<button class="sidebar-toggle" type="button" aria-label="Contraer menú" aria-expanded="true">' +
          '<span class="icon icon-sidebar-simple icon-20 gs-inherit" aria-hidden="true"></span>' +
        '</button>' +
      '</div>';

    menu.forEach(function (item) {
      var isActive = item.id === active;
      var inner =
        '<span class="nav-icon icon ' + item.icon + ' icon-20 gs-inherit" aria-hidden="true"></span>' +
        '<span class="nav-item__label">' + item.label + '</span>';
      // Con href → enlace navegable (también el activo: lleva al inicio del
      // módulo, p. ej. desde un paso del proceso a "Ventas y afiliación").
      // Sin destino → button.
      if (item.href) {
        html += '<a class="nav-item' + (isActive ? ' active' : '') + '" href="' + root + item.href + '" data-nav="' + item.id + '"' +
          (isActive ? ' aria-current="page"' : '') + '>' + inner + '</a>';
      } else {
        html += '<button class="nav-item' + (isActive ? ' active' : '') + '" type="button"' +
          ' data-nav="' + item.id + '"' + (isActive ? ' aria-current="page"' : '') + '>' + inner + '</button>';
      }
    });

    nav.innerHTML = html;
  }

  var STORAGE_KEY = 'zt-sidebar-collapsed';

  function readCollapsed() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }
  function writeCollapsed(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }

  function applyCollapsed(nav, collapsed) {
    nav.classList.toggle('sidebar--collapsed', collapsed);
    var toggle = nav.querySelector('.sidebar-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      toggle.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
    }
  }

  function wireToggle(nav) {
    var toggle = nav.querySelector('.sidebar-toggle');
    if (!toggle) return;
    // Estado inicial persistido (misma preferencia entre pantallas ZT)
    applyCollapsed(nav, readCollapsed());
    toggle.addEventListener('click', function () {
      var collapsed = !nav.classList.contains('sidebar--collapsed');
      applyCollapsed(nav, collapsed);
      writeCollapsed(collapsed);
    });
  }

  // ── Drawer móvil: abrir/cerrar el sidebar con el botón de menú del header ──
  function wireMobileDrawer(nav) {
    var menuBtn = document.querySelector('.header-mobile .icon-btn');
    if (!menuBtn) return;

    // Backdrop (se crea una sola vez)
    var backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    function openDrawer() {
      nav.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('zt-menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      nav.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('zt-menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    function toggleDrawer() {
      if (nav.classList.contains('is-open')) closeDrawer(); else openDrawer();
    }

    menuBtn.setAttribute('aria-controls', 'zt-sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');
    nav.id = nav.id || 'zt-sidebar';

    menuBtn.addEventListener('click', toggleDrawer);
    backdrop.addEventListener('click', closeDrawer);
    // Cerrar al elegir una opción del menú (en móvil)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-item') && window.matchMedia('(max-width: 767.98px)').matches) {
        closeDrawer();
      }
    });
    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  // ── Selector de persona / afiliado en el header ──
  function wirePersonSelector() {
    var root = document.querySelector('[data-person-selector]');
    if (!root) return;
    var trigger = root.querySelector('.hd-person__trigger');
    var menu = root.querySelector('.person-menu');
    var nameLabel = root.querySelector('[data-person-name]');
    var planLabel = root.querySelector('[data-person-plan]');
    var opts = root.querySelectorAll('.person-opt');
    if (!trigger || !menu) return;

    function openMenu() {
      menu.hidden = false;
      // permitir transición: mostrar en el siguiente frame
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      trigger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      // ocultar tras la transición
      window.setTimeout(function () {
        if (!menu.classList.contains('is-open')) menu.hidden = true;
      }, 180);
    }
    function toggleMenu() {
      if (trigger.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
    }

    trigger.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });

    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        opts.forEach(function (o) {
          o.classList.remove('is-selected');
          o.setAttribute('aria-checked', 'false');
        });
        opt.classList.add('is-selected');
        opt.setAttribute('aria-checked', 'true');
        // Data-driven: cada opción lleva su nombre y su plan (fácil de cambiar a futuro)
        if (nameLabel) nameLabel.textContent = opt.getAttribute('data-person');
        if (planLabel && opt.getAttribute('data-plan')) {
          planLabel.textContent = opt.getAttribute('data-plan');
        }
        closeMenu();
        trigger.focus();
      });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) closeMenu();
    });
    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function init() {
    var navs = document.querySelectorAll('nav.sidebar[data-active]');
    navs.forEach(function (nav) {
      buildSidebar(nav);
      wireToggle(nav);
      wireMobileDrawer(nav);
    });
    wirePersonSelector();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
