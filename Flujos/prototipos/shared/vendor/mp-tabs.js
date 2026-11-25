/*!
 * mp-tabs · comportamiento REUTILIZABLE de Tabs (DEC-007 / DS-04)
 *
 * No es código de documentación: funciona solo, sin dependencias, sobre cualquier
 * `[role="tablist"]` con `[role="tab"]` (web `.mp-tab` y app `.app-tab`).
 *
 * Patrón: WAI-ARIA APG "Tabs", ACTIVACIÓN AUTOMÁTICA (el panel cambia al mover el foco;
 * los paneles de este sistema son contenido inmediato, no cargas costosas).
 *
 * Compatible con Tabs v2: .mp-tab-xl (pill) y .mp-tab-card (tarjeta) con role="tab" dentro de <div class="mp-tabs mp-tabs--v2" role="tablist">.
 *
 * Marcado esperado
 *   <div class="mp-tabs" role="tablist" aria-label="…" [aria-orientation="vertical"]>
 *     <button class="mp-tab is-active" role="tab" id="t1" aria-selected="true"  aria-controls="p1">…</button>
 *     <button class="mp-tab"           role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">…</button>
 *   </div>
 *   <div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
 *   <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
 *
 * Teclado
 *   Tab / Shift+Tab ... entra y sale de la lista (solo la pestaña seleccionada es tabulable: tabindex móvil).
 *   Flecha derecha/izquierda (vertical: abajo/arriba) ... siguiente/anterior, con vuelta circular, y activa.
 *   Inicio / Fin ... primera / última. Las pestañas deshabilitadas se omiten.
 *
 * Responsive (DS «Tabs · 6. Responsive»)
 *   Por debajo de 768 px la tira se presenta como MENÚ DESPLEGABLE: se oculta
 *   (.mp-tabs--collapsed) y a su lado se inserta un <select> con las mismas opciones, que
 *   conserva la selección. Al elegir una opción se activa la pestaña, o se navega si la
 *   pestaña es un enlace (<a href>). Al volver a 768 px o más, el desplegable se retira.
 *   Funciona también sobre tiras de navegación (`<nav class="mp-tabs">` con enlaces `.mp-tab`),
 *   que no son un tablist ARIA. Para dejar una tira fuera: data-mp-tabs-responsive="off".
 */
(function () {
  'use strict';
  if (window.mpTabs) return;

  var LIST = '[role="tablist"]';
  var TAB = '[role="tab"]';

  function tabsOf(list) {
    return Array.prototype.filter.call(list.querySelectorAll(TAB), function (t) {
      return t.closest(LIST) === list;
    });
  }

  function enabled(t) {
    return !t.disabled && t.getAttribute('aria-disabled') !== 'true';
  }

  function panelOf(t) {
    var id = t.getAttribute('aria-controls');
    var panel = id && document.getElementById(id);
    return panel && panel.getAttribute('role') === 'tabpanel' ? panel : null;
  }

  /* Garantiza tabindex móvil: exactamente una pestaña tabulable (la seleccionada, o la 1.ª habilitada). */
  function normalize(list) {
    var tabs = tabsOf(list);
    if (!tabs.length) return;
    var current = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true' && enabled(t); })[0] ||
      tabs.filter(enabled)[0];
    tabs.forEach(function (t) {
      if (!enabled(t)) { t.removeAttribute('tabindex'); return; }
      t.setAttribute('tabindex', t === current ? '0' : '-1');
      if (!t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', 'false');
    });
  }

  function activate(tab) {
    var list = tab.closest(LIST);
    if (!list || !enabled(tab)) return;
    var tabs = tabsOf(list);
    var usesClass = tabs.some(function (t) { return t.classList.contains('is-active'); });
    var shown = [];
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      if (enabled(t)) t.setAttribute('tabindex', on ? '0' : '-1');
      if (usesClass) t.classList.toggle('is-active', on);
      var panel = panelOf(t);
      if (panel && on && shown.indexOf(panel) < 0) shown.push(panel);
    });
    // Un panel se oculta solo si ninguna pestaña seleccionada lo controla (admite un panel compartido).
    tabs.forEach(function (t) {
      var panel = panelOf(t);
      if (panel) panel.hidden = shown.indexOf(panel) < 0;
    });
    var sel = selectOf(list);
    if (sel) sel.value = String(currentIndex(list));
  }

  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest(TAB);
    if (tab && tab.closest(LIST)) activate(tab);
  });

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    var tab = e.target.closest && e.target.closest(TAB);
    var list = tab && tab.closest(LIST);
    if (!list || e.target !== tab) return;
    var tabs = tabsOf(list).filter(enabled);
    var i = tabs.indexOf(tab);
    if (i < 0) return;
    var vertical = list.getAttribute('aria-orientation') === 'vertical';
    var target;
    switch (e.key) {
      case vertical ? 'ArrowDown' : 'ArrowRight': target = tabs[(i + 1) % tabs.length]; break;
      case vertical ? 'ArrowUp' : 'ArrowLeft': target = tabs[(i - 1 + tabs.length) % tabs.length]; break;
      case 'Home': target = tabs[0]; break;
      case 'End': target = tabs[tabs.length - 1]; break;
      default: return;
    }
    e.preventDefault();

    // Si quien posee la lista la vuelve a renderizar al activar, el foco se restituye a la misma posición:
    // primero dentro del mismo contenedor (que persiste), y si no, por etiqueta dentro del mismo componente.
    var holder = list.parentElement;
    var scope = list.closest('[data-component-doc]') || document;
    var label = list.getAttribute('aria-label');
    var index = tabsOf(list).indexOf(target);

    target.focus();
    target.click(); // activación automática: una única ruta (la del clic)

    if (!target.isConnected) {
      var again = holder && holder.isConnected ? holder.querySelector(LIST) : null;
      if (!again) {
        again = Array.prototype.filter.call(scope.querySelectorAll(LIST), function (l) {
          return l.getAttribute('aria-label') === label;
        })[0];
      }
      var next = again && tabsOf(again)[index];
      if (next) next.focus();
    }
  });

  /* ── Responsive: la tira como menú desplegable por debajo de 768 px ──────────────
   * El punto de quiebre es el mismo de la hoja de estilos (mixin md-down). El <select>
   * es nativo: en móvil abre el selector del sistema y no depende de otros módulos.
   */
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 767.98px)') : null;
  var COLLAPSED = 'mp-tabs--collapsed';
  var WRAP = 'mp-tabs__select';

  /* Tiras candidatas: cualquier .mp-tabs que no se haya excluido. */
  function strips() {
    return Array.prototype.filter.call(document.querySelectorAll('.mp-tabs'), function (list) {
      return list.getAttribute('data-mp-tabs-responsive') !== 'off' && !list.closest('[data-mp-static]');
    });
  }

  /* Pestañas de la tira: las del patrón ARIA o, si no es un tablist, los enlaces .mp-tab. */
  function items(list) {
    var aria = tabsOf(list);
    if (aria.length) return aria;
    return Array.prototype.filter.call(list.querySelectorAll('.mp-tab'), function (t) {
      return t.closest('.mp-tabs') === list;
    });
  }

  function currentIndex(list) {
    var all = items(list);
    for (var i = 0; i < all.length; i++) {
      if (all[i].getAttribute('aria-selected') === 'true' ||
        all[i].getAttribute('aria-current') === 'page' ||
        all[i].classList.contains('is-active')) return i;
    }
    return 0;
  }

  /* Texto de la opción del desplegable. En Tabs v2 la tarjeta tiene título y descripción: solo el título es la etiqueta. */
  function labelOf(tab) {
    var main = tab.querySelector('.mp-tab-card__title, .mp-tab-xl__label');
    return ((main || tab).textContent || '').replace(/\s+/g, ' ').trim();
  }

  function selectOf(list) {
    var wrap = list.nextElementSibling;
    return wrap && wrap.classList && wrap.classList.contains(WRAP) ? wrap.querySelector('select') : null;
  }

  function buildSelect(list) {
    if (items(list).length < 2) return null;
    var wrap = document.createElement('div');
    wrap.className = WRAP;
    var sel = document.createElement('select');
    sel.className = 'mp-input-field mp-select';
    sel.setAttribute('aria-label', list.getAttribute('aria-label') || 'Secciones');
    sel.addEventListener('change', function () {
      var tab = items(list)[Number(sel.value)];
      if (!tab || !enabled(tab)) return;
      var href = tab.tagName === 'A' ? tab.getAttribute('href') : null;
      if (href) { window.location.href = href; return; }  // tira de navegación: la opción navega
      activate(tab);
    });
    wrap.appendChild(sel);
    list.parentNode.insertBefore(wrap, list.nextSibling);
    return sel;
  }

  /* Rellena el desplegable solo si cambiaron las pestañas (evita reescribir el DOM en cada pasada). */
  function fillSelect(list, sel) {
    var all = items(list);
    var firma = all.map(function (t) { return labelOf(t) + (enabled(t) ? '' : '·off'); }).join('\u0000');
    if (sel.getAttribute('data-firma') !== firma) {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      all.forEach(function (t, i) {
        var o = document.createElement('option');
        o.value = String(i);
        o.textContent = labelOf(t);
        if (!enabled(t)) o.disabled = true;
        sel.appendChild(o);
      });
      sel.setAttribute('data-firma', firma);
    }
    sel.value = String(currentIndex(list));
  }

  function responsive() {
    var chico = MQ ? MQ.matches : false;
    strips().forEach(function (list) {
      var sel = selectOf(list);
      if (chico) {
        if (!sel) sel = buildSelect(list);
        if (!sel) return;
        fillSelect(list, sel);
        list.classList.add(COLLAPSED);
      } else if (sel) {
        list.classList.remove(COLLAPSED);
        sel.parentNode.parentNode.removeChild(sel.parentNode);
      }
    });
  }

  if (MQ) {
    if (MQ.addEventListener) MQ.addEventListener('change', responsive);
    else if (MQ.addListener) MQ.addListener(responsive);
  }

  function normalizeAll() {
    document.querySelectorAll(LIST).forEach(normalize);
    responsive();
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; normalizeAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeAll);
  else normalizeAll();
  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.mpTabs = { activate: activate, normalize: normalize, normalizeAll: normalizeAll, responsive: responsive };
})();
