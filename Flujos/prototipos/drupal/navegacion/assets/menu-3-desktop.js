/**
 * ============================================================
 *  MENU-3-DESKTOP.JS — Mega-menú de 3 columnas (≥992px)
 *
 *  Propuesta exclusiva de escritorio para menu-3: en vez de un
 *  dropdown angosto por ítem (eso es lo que ya prueban menu-1 y
 *  menu-2 vía nav-flyout.js), un solo panel ancho con tres columnas
 *  relacionadas — Nivel 1 / Nivel 2 / Nivel 3 — que se actualizan
 *  en cascada al seleccionar. Nunca se cierra el menú ni se navega
 *  de página al elegir una categoría; solo las opciones finales
 *  (hojas del árbol) son enlaces reales.
 *
 *  Aislamiento: reemplaza a nav-flyout.js SOLO en menu-3.html (ese
 *  script ya no se carga ahí — ver menu-3.html). No se toca
 *  nav-flyout.js, así que menu-1 y menu-2 siguen usándolo tal cual.
 *  Todo el markup nuevo usa clases exclusivas .menu3-mega__*
 *  (ver assets/menu-3.css, bloque agregado en @media (min-width:992px),
 *  sin tocar el bloque mobile @media (max-width:991.98px) de ese
 *  mismo archivo).
 *
 *  Requiere: nav-data.js (NAV_TREE)
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

  function findNode(nodes, id) {
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].id === id) return nodes[i];
    }
    return null;
  }

  // Misma página "actual" simulada que usan las otras propuestas de
  // esta prueba (Planes → Plan Ideal → Individual), solo para poder
  // mostrar cómo se ve un destino final activo. Constante local,
  // no depende de nav-data.js.
  var CURRENT_NODE_ID = 'plan-ideal-individual';

  function rootNodes() {
    return NAV_TREE.filter(function (node) { return node.id !== 'inicio'; });
  }

  var panel = null;
  var l1List = null;
  var l2Label = null;
  var l2List = null;
  var l3Label = null;
  var l3List = null;

  var selectedL1 = null;
  var selectedL2 = null;
  var closeTimer = null;
  var triggers = [];

  function buildPanel() {
    var el = document.createElement('div');
    el.className = 'menu3-mega';
    el.id = 'menu3-mega';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="menu3-mega__inner">' +
        '<nav class="menu3-mega__col menu3-mega__col--l1" aria-label="Categorías principales">' +
          '<p class="menu3-mega__col-label">Menú</p>' +
          '<ul class="menu3-mega__list" id="menu3-mega-l1" role="list"></ul>' +
        '</nav>' +
        '<div class="menu3-mega__col menu3-mega__col--l2">' +
          '<p class="menu3-mega__col-label" id="menu3-mega-l2-label"></p>' +
          '<ul class="menu3-mega__list" id="menu3-mega-l2" role="list"></ul>' +
        '</div>' +
        '<div class="menu3-mega__col menu3-mega__col--l3">' +
          '<p class="menu3-mega__col-label" id="menu3-mega-l3-label"></p>' +
          '<ul class="menu3-mega__list" id="menu3-mega-l3" role="list"></ul>' +
        '</div>' +
      '</div>';
    return el;
  }

  // ── Nivel 1: todas las categorías, siempre visibles y explorables
  // aunque el panel se haya abierto desde un ítem distinto. ────────
  function renderL1() {
    var items = rootNodes().filter(hasChildren);
    l1List.innerHTML = items.map(function (node) {
      var active = node.id === selectedL1;
      return (
        '<li>' +
          '<button type="button" class="menu3-mega__l1-item' + (active ? ' is-active' : '') + '" ' +
            'data-l1="' + node.id + '" aria-current="' + (active ? 'true' : 'false') + '">' +
            '<span class="menu3-mega__item-label">' + esc(node.label) + '</span>' +
            '<i class="icon icon-caret-right icon-16 menu3-mega__item-chevron" aria-hidden="true"></i>' +
          '</button>' +
        '</li>'
      );
    }).join('');
  }

  // ── Nivel 2: hijos directos de la categoría de Nivel 1 elegida.
  // Ramas (con hijos) son <button> y actualizan Nivel 3; hojas son
  // <a> reales — clicarlas navega, no "seleccionan" nada más. ──────
  function renderL2() {
    var l1Node = findNode(rootNodes(), selectedL1);
    var children = (l1Node && l1Node.children) || [];
    l2Label.textContent = l1Node ? l1Node.label : '';

    if (!children.length) {
      l2List.innerHTML = '<li class="menu3-mega__empty">Esta sección no tiene subcategorías.</li>';
      selectedL2 = null;
      renderL3();
      return;
    }

    if (!selectedL2 || !findNode(children, selectedL2)) {
      selectedL2 = children[0].id;
    }

    l2List.innerHTML = children.map(function (node) {
      var active = node.id === selectedL2;
      var branch = hasChildren(node);
      var classes = 'menu3-mega__l2-item' + (active ? ' is-active' : '');
      var label = '<span class="menu3-mega__item-label">' + esc(node.label) + '</span>';

      if (!branch) {
        var href = node.href || '#';
        var isCurrent = node.id === CURRENT_NODE_ID;
        return (
          '<li>' +
            '<a class="' + classes + (isCurrent ? ' is-current' : '') + '" href="' + href + '"' +
              (isCurrent ? ' aria-current="page"' : '') + '>' +
              (isCurrent ? '<i class="icon icon-check icon-16 menu3-mega__item-check" aria-hidden="true"></i>' : '') +
              label +
            '</a>' +
          '</li>'
        );
      }

      return (
        '<li>' +
          '<button type="button" class="' + classes + '" data-l2="' + node.id + '" aria-current="' + (active ? 'true' : 'false') + '">' +
            label +
            '<i class="icon icon-caret-right icon-16 menu3-mega__item-chevron" aria-hidden="true"></i>' +
          '</button>' +
        '</li>'
      );
    }).join('');

    renderL3();
  }

  // ── Nivel 3: hijos de la opción de Nivel 2 elegida (si tiene). Son
  // siempre destinos finales — enlaces reales, sin más niveles. ────
  function renderL3() {
    var l1Node = findNode(rootNodes(), selectedL1);
    var l2Siblings = (l1Node && l1Node.children) || [];
    var l2Node = selectedL2 ? findNode(l2Siblings, selectedL2) : null;
    var children = (l2Node && l2Node.children) || [];

    l3Label.textContent = l2Node ? l2Node.label : '';

    if (!l2Node) {
      l3List.innerHTML = '<li class="menu3-mega__empty">Elige una opción del nivel anterior.</li>';
      return;
    }

    if (!children.length) {
      l3List.innerHTML = '<li class="menu3-mega__empty">“' + esc(l2Node.label) + '” es un destino final — no tiene más opciones debajo.</li>';
      return;
    }

    l3List.innerHTML = children.map(function (node) {
      var href = node.href || '#';
      var isCurrent = node.id === CURRENT_NODE_ID;
      return (
        '<li>' +
          '<a class="menu3-mega__l3-item' + (isCurrent ? ' is-current' : '') + '" href="' + href + '"' +
            (isCurrent ? ' aria-current="page"' : '') + '>' +
            (isCurrent ? '<i class="icon icon-check icon-16 menu3-mega__item-check" aria-hidden="true"></i>' : '') +
            '<span class="menu3-mega__item-label">' + esc(node.label) + '</span>' +
          '</a>' +
        '</li>'
      );
    }).join('');
  }

  function syncTriggers() {
    triggers.forEach(function (trigger) {
      trigger.button.setAttribute('aria-expanded', String(panel.classList.contains('is-open') && trigger.id === selectedL1));
    });
  }

  function open(l1Id) {
    clearTimeout(closeTimer);
    if (l1Id) {
      if (l1Id !== selectedL1) selectedL2 = null;
      selectedL1 = l1Id;
    } else if (!selectedL1) {
      var first = rootNodes().filter(hasChildren)[0];
      selectedL1 = first ? first.id : null;
    }
    renderL1();
    renderL2();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    syncTriggers();
  }

  function close() {
    clearTimeout(closeTimer);
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    syncTriggers();
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, 220);
  }

  function selectL1(id) {
    if (id === selectedL1) return;
    selectedL1 = id;
    selectedL2 = null;
    renderL1();
    renderL2();
    syncTriggers();
  }

  function selectL2(id) {
    if (id === selectedL2) return;
    selectedL2 = id;
    renderL2();
  }

  function init() {
    if (typeof NAV_TREE === 'undefined') return;
    var navEl = document.querySelector('.proto-header .mp-web-header__nav');
    if (!navEl) return;

    panel = buildPanel();
    // Se ancla a <nav> (position:relative de core), no al ítem ni al
    // contenedor con scroll horizontal — mismo criterio que
    // nav-flyout.js para que el panel nunca quede recortado.
    navEl.appendChild(panel);

    l1List = panel.querySelector('#menu3-mega-l1');
    l2Label = panel.querySelector('#menu3-mega-l2-label');
    l2List = panel.querySelector('#menu3-mega-l2');
    l3Label = panel.querySelector('#menu3-mega-l3-label');
    l3List = panel.querySelector('#menu3-mega-l3');

    var buttons = document.querySelectorAll('.mp-web-header__nav-link[data-nav-id]');
    buttons.forEach(function (button) {
      var navId = button.getAttribute('data-nav-id');
      var node = findNode(rootNodes(), navId);
      if (!node || !hasChildren(node)) return;

      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      triggers.push({ id: navId, button: button });

      var wrapper = button.closest('.mp-web-header__nav-item');

      function show() { open(navId); }

      button.addEventListener('mouseenter', show);
      button.addEventListener('focus', show);
      button.addEventListener('click', function (event) {
        event.preventDefault();
        if (panel.classList.contains('is-open') && selectedL1 === navId) {
          close();
        } else {
          open(navId);
        }
      });

      if (wrapper) {
        wrapper.addEventListener('mouseleave', scheduleClose);
        wrapper.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
      }
    });

    panel.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
    panel.addEventListener('mouseleave', scheduleClose);

    panel.addEventListener('click', function (event) {
      var l1Btn = event.target.closest('[data-l1]');
      if (l1Btn) return selectL1(l1Btn.getAttribute('data-l1'));

      var l2Btn = event.target.closest('[data-l2]');
      if (l2Btn) return selectL2(l2Btn.getAttribute('data-l2'));
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !panel.classList.contains('is-open')) return;
      var trigger = triggers.find(function (t) { return t.id === selectedL1; });
      close();
      if (trigger) trigger.button.focus();
    });

    document.addEventListener('click', function (event) {
      if (!panel.classList.contains('is-open')) return;
      var insidePanel = panel.contains(event.target);
      var onTrigger = triggers.some(function (t) { return t.button.contains(event.target); });
      if (!insidePanel && !onTrigger) close();
    });

    // El mega-menú es exclusivo de escritorio; si la ventana se
    // achica a la barra compacta (mismo corte que menu-3.css,
    // 991.98px) mientras está abierto, se cierra en vez de quedar
    // flotando detrás del panel móvil.
    var desktopQuery = window.matchMedia('(min-width: 992px)');
    function handleViewportChange(event) {
      if (!event.matches) close();
    }
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', handleViewportChange);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(handleViewportChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
