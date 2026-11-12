/*!
 * mp-dropdown · comportamiento REUTILIZABLE del Dropdown (DEC-007 / DS-03)
 *
 * No es código de documentación: se puede cargar solo, sin dependencias, en cualquier
 * página que use el marcado `.mp-dropdown`. Los scripts `*-docs.js` del portal solo lo consumen.
 *
 * Patrón: WAI-ARIA APG "Collapsible Dropdown Listbox" (botón que despliega un listbox).
 * No se impone `role="combobox"` al contenedor ni a un <button>: el botón conserva su semántica.
 *
 * Marcado esperado
 *   <div class="mp-dropdown">
 *     <button class="mp-dropdown__trigger" type="button" aria-haspopup="listbox"
 *             aria-expanded="false" aria-controls="ID-lista">…</button>
 *     <div class="mp-dropdown__panel">
 *       [<div class="mp-dropdown__search"><input class="mp-dropdown__search-input"></div>]
 *       <div class="mp-dropdown__options" id="ID-lista" role="listbox" [aria-multiselectable="true"]>
 *         <div class="mp-dropdown__option" role="option" aria-selected="false" data-value="…">…</div>
 *       </div>
 *     </div>
 *   </div>
 * Lo que falte (ids, aria-controls, aria-haspopup, aria-selected, nombre del listbox) se completa solo.
 *
 * Teclado
 *   Botón cerrado ... Enter / Espacio / Flecha abajo / Flecha arriba: abre y activa la opción seleccionada (o la 1.ª).
 *   Lista abierta ... Flecha abajo/arriba: mueve la opción activa · Inicio/Fin: primera/última ·
 *                     Enter o Espacio: selecciona (selección única: cierra y devuelve el foco al botón;
 *                     múltiple: alterna y mantiene abierto) · Escape: cierra y devuelve el foco ·
 *                     Tab: cierra y sigue el orden natural · letras: salto por prefijo (typeahead).
 *   Con búsqueda .... el foco va al campo; escribir filtra; Flechas/Enter/Escape actúan sobre las opciones.
 * Evento: `mp-dropdown:change` (bubbles) con detail { root, value, label, selected }.
 */
(function () {
  'use strict';
  if (window.mpDropdown) return;

  var ROOT = '.mp-dropdown';
  var TRIGGER = '.mp-dropdown__trigger';
  var PANEL = '.mp-dropdown__panel';
  var OPTION = '[role="option"], .mp-dropdown__option';
  var SEARCH = '.mp-dropdown__search-input';
  var ACTIVE = 'mp-dropdown__option--active';
  var SELECTED = 'mp-dropdown__option--selected';
  var seq = 0;
  var typed = '';
  var typedAt = 0;

  function uid(el, prefix) {
    if (!el.id) el.id = prefix + '-' + (++seq);
    return el.id;
  }

  function parts(root) {
    if (root.closest('[data-mp-static]')) return null; // diagramas de documentación: no interactivos
    var trigger = root.querySelector(TRIGGER);
    var panel = root.querySelector(PANEL);
    if (!trigger || !panel) return null;
    var list = panel.querySelector('[role="listbox"]') ||
      (panel.getAttribute('role') === 'listbox' ? panel : null) ||
      panel.querySelector('.mp-dropdown__options') || panel;
    return { root: root, trigger: trigger, panel: panel, list: list, search: panel.querySelector(SEARCH) };
  }

  function isDisabled(opt) {
    return opt.getAttribute('aria-disabled') === 'true' || opt.classList.contains('mp-dropdown__option--disabled');
  }

  function allOptions(p) {
    return Array.prototype.slice.call(p.list.querySelectorAll(OPTION));
  }

  function enabledOptions(p) {
    return allOptions(p).filter(function (o) { return !o.hidden && !isDisabled(o); });
  }

  function isMulti(p) {
    return p.list.getAttribute('aria-multiselectable') === 'true';
  }

  function isOpen(p) {
    return p.trigger.getAttribute('aria-expanded') === 'true';
  }

  function textOf(opt) {
    return opt.textContent.replace(/\s+/g, ' ').trim();
  }

  /* Completa lo que falte en el marcado (idempotente). */
  function enhance(root) {
    var p = parts(root);
    if (!p) return null;
    var t = p.trigger;
    if (!p.list.getAttribute('role')) p.list.setAttribute('role', 'listbox');
    uid(p.list, 'mp-dd-list');
    if (!p.search) p.list.setAttribute('tabindex', '-1');
    if (!t.hasAttribute('aria-haspopup')) t.setAttribute('aria-haspopup', 'listbox');
    t.setAttribute('aria-controls', p.list.id);
    if (!t.hasAttribute('aria-expanded')) t.setAttribute('aria-expanded', 'false');

    allOptions(p).forEach(function (o) {
      o.setAttribute('role', 'option');
      uid(o, 'mp-dd-opt');
      if (!o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', String(o.classList.contains(SELECTED)));
    });
    // Encabezados de grupo y mensaje vacío no son opciones: no deben contar como hijos del listbox.
    p.list.querySelectorAll('.mp-dropdown__group-header, .mp-dropdown__empty').forEach(function (n) {
      if (!n.hasAttribute('role')) n.setAttribute('role', 'presentation');
    });

    var group = root.closest('.mp-dropdown-group');
    var label = group && group.querySelector('.mp-dropdown-label');
    var value = t.querySelector('.mp-dropdown__value, .mp-dropdown__chips');
    if (label) {
      uid(label, 'mp-dd-label');
      if (!p.list.hasAttribute('aria-label') && !p.list.hasAttribute('aria-labelledby')) {
        p.list.setAttribute('aria-labelledby', label.id);
      }
      if (value && !t.hasAttribute('aria-label') && !t.hasAttribute('aria-labelledby')) {
        uid(value, 'mp-dd-value');
        t.setAttribute('aria-labelledby', label.id + ' ' + value.id);
      }
    }
    if (p.search) {
      p.search.setAttribute('role', 'combobox');
      p.search.setAttribute('aria-autocomplete', 'list');
      p.search.setAttribute('aria-controls', p.list.id);
      if (!p.search.hasAttribute('aria-expanded')) p.search.setAttribute('aria-expanded', 'false');
    }
    return p;
  }

  function owner(p) {
    return p.search || p.list;
  }

  function setActive(p, opt) {
    allOptions(p).forEach(function (o) { o.classList.remove(ACTIVE); });
    var host = owner(p);
    if (!opt) { host.removeAttribute('aria-activedescendant'); return; }
    opt.classList.add(ACTIVE);
    host.setAttribute('aria-activedescendant', opt.id);
    if (opt.scrollIntoView) opt.scrollIntoView({ block: 'nearest' });
  }

  function activeOption(p) {
    return p.list.querySelector('.' + ACTIVE);
  }

  function closeRoot(root, returnFocus) {
    var p = parts(root);
    if (!p || !isOpen(p)) return;
    p.trigger.setAttribute('aria-expanded', 'false');
    setActive(p, null);
    if (p.search) {
      p.search.setAttribute('aria-expanded', 'false');
      p.search.value = '';
      filter(p, '');
    }
    if (returnFocus) p.trigger.focus();
  }

  function closeAll(except) {
    document.querySelectorAll(ROOT).forEach(function (r) {
      if (r !== except) closeRoot(r, false);
    });
  }

  function openRoot(root) {
    var p = enhance(root);
    if (!p || p.trigger.disabled || p.trigger.getAttribute('aria-disabled') === 'true') return;
    closeAll(root);
    p.trigger.setAttribute('aria-expanded', 'true');
    var opts = enabledOptions(p);
    var start = opts.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0] || opts[0] || null;
    if (p.search) p.search.setAttribute('aria-expanded', 'true');
    setActive(p, start);
    owner(p).focus({ preventScroll: true });
  }

  function move(p, to) {
    var opts = enabledOptions(p);
    if (!opts.length) return;
    var i = opts.indexOf(activeOption(p));
    var next;
    if (to === 'first') next = opts[0];
    else if (to === 'last') next = opts[opts.length - 1];
    else if (to === 'next') next = opts[Math.min(i + 1, opts.length - 1)];
    else next = opts[i < 0 ? opts.length - 1 : Math.max(i - 1, 0)];
    setActive(p, next);
  }

  function renderValue(p, selected) {
    var chips = p.trigger.querySelector('.mp-dropdown__chips');
    var val = p.trigger.querySelector('.mp-dropdown__value');
    var labels = selected.map(textOf);
    if (chips) {
      chips.textContent = '';
      labels.forEach(function (l) {
        var chip = document.createElement('span');
        chip.className = 'mp-dropdown__chip';
        chip.textContent = l;
        chips.appendChild(chip);
      });
    } else if (val) {
      if (val.dataset.mpPlaceholder === undefined) {
        val.dataset.mpPlaceholder = val.classList.contains('is-placeholder') ? val.textContent : '';
      }
      val.textContent = labels.length ? labels.join(', ') : val.dataset.mpPlaceholder;
      val.classList.toggle('is-placeholder', !labels.length);
    }
  }

  function choose(p, opt) {
    if (!opt || isDisabled(opt) || p.trigger.disabled) return;
    var multi = isMulti(p);
    if (multi) {
      var on = opt.getAttribute('aria-selected') !== 'true';
      opt.setAttribute('aria-selected', String(on));
      opt.classList.toggle(SELECTED, on);
    } else {
      allOptions(p).forEach(function (o) {
        o.classList.remove(SELECTED);
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add(SELECTED);
      opt.setAttribute('aria-selected', 'true');
    }
    var selected = allOptions(p).filter(function (o) { return o.getAttribute('aria-selected') === 'true'; });
    renderValue(p, selected);
    p.root.dispatchEvent(new CustomEvent('mp-dropdown:change', {
      bubbles: true,
      detail: {
        root: p.root,
        value: opt.getAttribute('data-value'),
        label: textOf(opt),
        selected: selected.map(function (o) { return o.getAttribute('data-value'); })
      }
    }));
    if (!multi) closeRoot(p.root, true);
  }

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filter(p, query) {
    var q = norm(query.trim());
    var shown = 0;
    allOptions(p).forEach(function (o) {
      var hit = !q || norm(textOf(o)).indexOf(q) !== -1;
      o.hidden = !hit;
      if (hit) shown++;
    });
    var empty = p.panel.querySelector('.mp-dropdown__empty');
    if (empty) empty.hidden = shown > 0;
    setActive(p, enabledOptions(p)[0] || null);
  }

  function typeahead(p, ch) {
    var now = Date.now();
    typed = (now - typedAt > 500 ? '' : typed) + ch.toLowerCase();
    typedAt = now;
    var opts = enabledOptions(p);
    var i = opts.indexOf(activeOption(p));
    var ordered = opts.slice(i + 1).concat(opts.slice(0, i + 1));
    var hit = ordered.filter(function (o) { return norm(textOf(o)).indexOf(norm(typed)) === 0; })[0];
    if (hit) setActive(p, hit);
  }

  /* ───────── Eventos delegados ───────── */

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest(TRIGGER);
    if (trigger) {
      var root = trigger.closest(ROOT);
      if (!root) return;
      var p = enhance(root);
      if (!p || trigger.disabled) return;
      if (isOpen(p)) closeRoot(root, true); else openRoot(root);
      return;
    }
    var opt = e.target.closest && e.target.closest(OPTION);
    var holder = opt && opt.closest(ROOT);
    if (holder) {
      var pp = enhance(holder);
      if (pp && isOpen(pp)) { choose(pp, opt); return; }
    }
    if (!e.target.closest || !e.target.closest(ROOT)) closeAll(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var root = e.target.closest && e.target.closest(ROOT);
    if (!root) return;
    var p = enhance(root);
    if (!p) return;
    var inTrigger = !!e.target.closest(TRIGGER);
    var open = isOpen(p);

    if (inTrigger) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openRoot(root); }
      else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); closeRoot(root, true); }
      return;
    }
    if (!open || !p.panel.contains(e.target)) return;

    var inSearch = e.target === p.search;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(p, 'next'); break;
      case 'ArrowUp': e.preventDefault(); move(p, 'prev'); break;
      case 'Home': if (!inSearch) { e.preventDefault(); move(p, 'first'); } break;
      case 'End': if (!inSearch) { e.preventDefault(); move(p, 'last'); } break;
      case 'Enter': e.preventDefault(); choose(p, activeOption(p)); break;
      case ' ': if (!inSearch) { e.preventDefault(); choose(p, activeOption(p)); } break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); closeRoot(root, true); break;
      case 'Tab': closeRoot(root, false); break;
      default:
        if (!inSearch && e.key.length === 1) typeahead(p, e.key);
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target.matches || !e.target.matches(SEARCH)) return;
    var root = e.target.closest(ROOT);
    var p = root && enhance(root);
    if (p && isOpen(p)) filter(p, e.target.value);
  });

  document.addEventListener('focusout', function (e) {
    var root = e.target.closest && e.target.closest(ROOT);
    if (!root || !e.relatedTarget) return;
    if (!root.contains(e.relatedTarget)) closeRoot(root, false);
  });

  /* ───────── Inicialización y contenido dinámico ───────── */

  function enhanceAll() {
    document.querySelectorAll(ROOT).forEach(enhance);
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; enhanceAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAll);
  else enhanceAll();
  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.mpDropdown = { enhance: enhance, open: openRoot, close: closeRoot, enhanceAll: enhanceAll };
})();
