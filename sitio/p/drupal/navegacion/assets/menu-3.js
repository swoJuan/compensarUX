/**
 * ============================================================
 *  MENU-3.JS — Navegación progresiva mobile por niveles
 *  Independiente de menu-1/menu-2. No usa acordeones.
 *  Requiere: nav-data.js (NAV_TREE), nav-shell.js
 * ============================================================
 */

(function () {
  var body = null;
  var stack = [];
  var activeId = window.location.hash ? window.location.hash.slice(1) : '';

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

  function rootNodes() {
    return NAV_TREE.filter(function (node) { return node.id !== 'inicio'; });
  }

  function findPath(nodes, id, trail) {
    var currentTrail = trail || [];
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var nextTrail = currentTrail.concat(node);
      if (node.id === id) return nextTrail;
      if (hasChildren(node)) {
        var childPath = findPath(node.children, id, nextTrail);
        if (childPath) return childPath;
      }
    }
    return null;
  }

  function resetStack() {
    var activePath = activeId ? findPath(rootNodes(), activeId) : null;
    stack = [{ title: 'Menú', nodes: rootNodes() }];
    if (activePath && activePath.length > 1) {
      var parentPath = activePath.slice(0, -1);
      stack = stack.concat(parentPath.map(function (node) {
        return { title: node.label, nodes: node.children || [] };
      }));
    }
  }

  function renderRow(node) {
    var isActive = activeId && node.id === activeId;
    var tag = hasChildren(node) ? 'button' : 'a';
    var attrs = hasChildren(node)
      ? 'type="button" data-menu-mobile-v3-into="' + esc(node.id) + '"'
      : 'href="' + esc(node.href || ('#' + node.id)) + '"';
    return (
      '<li class="menu-mobile-v3__item">' +
        '<' + tag + ' class="menu-mobile-v3__item-control' + (isActive ? ' menu-mobile-v3__item-control--active' : '') + '" ' + attrs + '>' +
          '<span class="menu-mobile-v3__item-label">' + esc(node.label) + '</span>' +
          (hasChildren(node)
            ? '<i class="icon icon-caret-right icon-20 menu-mobile-v3__item-icon" aria-hidden="true"></i>'
            : (isActive ? '<i class="icon icon-check icon-20 menu-mobile-v3__item-icon" aria-hidden="true"></i>' : '')) +
        '</' + tag + '>' +
      '</li>'
    );
  }

  function render(direction) {
    var current = stack[stack.length - 1];
    var isRoot = stack.length === 1 && current.title === 'Menú';
    var html = '<div class="menu-mobile-v3__level menu-mobile-v3__level--' + esc(direction || 'forward') + '">';

    if (!isRoot) {
      html +=
        '<button type="button" class="menu-mobile-v3__back" data-menu-mobile-v3-back>' +
          '<i class="icon icon-arrow-left icon-20" aria-hidden="true"></i>' +
          '<span>' + esc(current.title) + '</span>' +
        '</button>';
    }

    html += '<ul class="menu-mobile-v3__list" role="list">' +
      current.nodes.map(renderRow).join('') +
      '</ul></div>';

    body.innerHTML = html;
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

  function renderDesktopLeaf(node) {
    var isActive = activeId && node.id === activeId;
    return (
      '<li class="menu-desktop-v3__item">' +
        '<a class="menu-desktop-v3__leaf' + (isActive ? ' menu-desktop-v3__leaf--active' : '') + '" href="' + esc(node.href || ('#' + node.id)) + '">' +
          '<span>' + esc(node.label) + '</span>' +
          (isActive ? '<i class="icon icon-check icon-16" aria-hidden="true"></i>' : '') +
        '</a>' +
      '</li>'
    );
  }

  function renderDesktopLevelThree(nodes) {
    if (!nodes || !nodes.length) {
      return '<p class="menu-desktop-v3__empty">No hay opciones adicionales.</p>';
    }
    return '<ul class="menu-desktop-v3__list" role="list">' + nodes.map(renderDesktopLeaf).join('') + '</ul>';
  }

  function initDesktopMega() {
    var buttons = document.querySelectorAll('.proto-page-menu3 .mp-web-header__nav-link[data-nav-id]');
    if (!buttons.length || typeof NAV_TREE === 'undefined') return;

    var entries = [];

    buttons.forEach(function (button) {
      var navId = button.getAttribute('data-nav-id');
      var node = NAV_TREE.find(function (item) { return item.id === navId; });
      if (!node || !hasChildren(node)) return;

      var wrapper = button.closest('.mp-web-header__nav-item');
      var navEl = button.closest('.mp-web-header__nav');
      if (!wrapper || !navEl) return;

      var firstBranch = node.children.find(hasChildren) || node.children[0];
      var selectedId = firstBranch ? firstBranch.id : '';

      var mega = document.createElement('div');
      mega.className = 'menu-desktop-v3';
      mega.id = 'menu-desktop-v3-' + navId;
      navEl.appendChild(mega);

      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', mega.id);

      function findLevelTwo(id) {
        return node.children.find(function (item) { return item.id === id; }) || node.children[0];
      }

      function renderMega() {
        var selected = findLevelTwo(selectedId);
        var levelTwo = node.children.map(function (child) {
          var selectedClass = child.id === selectedId ? ' menu-desktop-v3__branch--active' : '';
          var tag = hasChildren(child) ? 'button' : 'a';
          var attrs = hasChildren(child)
            ? 'type="button" data-menu-desktop-v3-select="' + esc(child.id) + '"'
            : 'href="' + esc(child.href || ('#' + child.id)) + '"';
          return (
            '<li class="menu-desktop-v3__item">' +
              '<' + tag + ' class="menu-desktop-v3__branch' + selectedClass + '" ' + attrs + '>' +
                '<span>' + esc(child.label) + '</span>' +
                (hasChildren(child) ? '<i class="icon icon-caret-right icon-16" aria-hidden="true"></i>' : '') +
              '</' + tag + '>' +
            '</li>'
          );
        }).join('');

        mega.innerHTML =
          '<section class="menu-desktop-v3__col menu-desktop-v3__col--level2">' +
            '<h2 class="menu-desktop-v3__title">' + esc(node.label.toUpperCase()) + '</h2>' +
            '<ul class="menu-desktop-v3__list" role="list">' + levelTwo + '</ul>' +
          '</section>' +
          '<section class="menu-desktop-v3__col menu-desktop-v3__col--level3">' +
            '<h2 class="menu-desktop-v3__title">' + esc(selected ? selected.label.toUpperCase() : '') + '</h2>' +
            renderDesktopLevelThree(selected && hasChildren(selected) ? selected.children : []) +
          '</section>';
      }

      function positionMega() {
        var navRect = navEl.getBoundingClientRect();
        var btnRect = button.getBoundingClientRect();
        mega.style.top = (btnRect.bottom - navRect.top) + 'px';
        mega.style.left = (btnRect.left - navRect.left) + 'px';
        mega.style.right = '';

        var rect = mega.getBoundingClientRect();
        if (rect.right > window.innerWidth - 16) {
          mega.style.left = '';
          mega.style.right = Math.max(16, navRect.right - btnRect.right) + 'px';
        }
      }

      function hide(target) {
        var item = target || entry;
        clearTimeout(item.closeTimer);
        item.mega.classList.remove('is-open');
        item.button.setAttribute('aria-expanded', 'false');
        item.button.classList.remove('mp-web-header__nav-link--is-hover');
      }

      function show() {
        clearTimeout(entry.closeTimer);
        entries.forEach(function (other) {
          if (other !== entry) hide(other);
        });
        renderMega();
        positionMega();
        mega.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('mp-web-header__nav-link--is-hover');
      }

      function scheduleHide() {
        clearTimeout(entry.closeTimer);
        entry.closeTimer = setTimeout(function () { hide(entry); }, 160);
      }

      function isInside(el) {
        return !!el && (wrapper.contains(el) || mega.contains(el));
      }

      var entry = { button: button, mega: mega, closeTimer: null };
      entries.push(entry);
      renderMega();

      wrapper.addEventListener('mouseenter', show);
      wrapper.addEventListener('mouseleave', scheduleHide);
      mega.addEventListener('mouseenter', function () { clearTimeout(entry.closeTimer); });
      mega.addEventListener('mouseleave', scheduleHide);
      button.addEventListener('focus', show);
      button.addEventListener('click', function (event) {
        if (!window.matchMedia('(min-width: 992px)').matches) return;
        event.preventDefault();
        if (mega.classList.contains('is-open')) hide(entry); else show();
      });
      mega.addEventListener('click', function (event) {
        var selector = event.target.closest('[data-menu-desktop-v3-select]');
        if (!selector) return;
        event.preventDefault();
        selectedId = selector.getAttribute('data-menu-desktop-v3-select');
        renderMega();
        positionMega();
      });
      wrapper.addEventListener('focusout', function (event) {
        if (!isInside(event.relatedTarget)) hide(entry);
      });
      mega.addEventListener('focusout', function (event) {
        if (!isInside(event.relatedTarget)) hide(entry);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      entries.forEach(function (entry) {
        if (entry.mega.classList.contains('is-open')) hide(entry);
      });
    });
  }

  function init() {
    body = document.getElementById('nav-sidebar-body');
    if (!body || typeof NAV_TREE === 'undefined') return;
    var sidebar = document.getElementById('nav-sidebar');
    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var mobileQuery = window.matchMedia('(max-width: 991.98px)');

    document.querySelectorAll('.menu3-mega').forEach(function (oldMega) {
      oldMega.remove();
    });

    function renderMobileMenu() {
      if (!mobileQuery.matches) {
        body.innerHTML = '';
        return;
      }
      resetStack();
      render('forward');
    }

    function syncSidebarVisibility() {
      var isDesktop = desktopQuery.matches;
      if (sidebar) {
        sidebar.hidden = isDesktop;
        sidebar.setAttribute('aria-hidden', String(isDesktop));
        if (isDesktop) sidebar.classList.remove('is-open');
      }
      if (isDesktop) {
        body.innerHTML = '';
      } else {
        renderMobileMenu();
      }
    }

    syncSidebarVisibility();
    renderMobileMenu();

    body.addEventListener('click', function (event) {
      if (!mobileQuery.matches) return;
      var into = event.target.closest('[data-menu-mobile-v3-into]');
      if (into) return goInto(into.getAttribute('data-menu-mobile-v3-into'));

      var back = event.target.closest('[data-menu-mobile-v3-back]');
      if (back) return goBack();
    });

    document.addEventListener('navshell:open', function () {
      activeId = window.location.hash ? window.location.hash.slice(1) : activeId;
      renderMobileMenu();
    });

    function closeOnDesktop(event) {
      syncSidebarVisibility();
      if (event.matches && window.NavShell) window.NavShell.close();
    }
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', closeOnDesktop);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(closeOnDesktop);
    }

    initDesktopMega();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
