/* ============================================================
 * dropdown.js — API del componente transversal ZT "Dropdown List"
 * ------------------------------------------------------------
 * Mejora ("enhance") un <select> nativo: mantiene la semántica de
 * selección de datos pero con la apariencia del Dropdown Menu del DS.
 *
 * VISUAL   = Dropdown Menu (DS)      SEMÁNTICA = combobox + listbox
 *
 * El <select> original permanece en el DOM (oculto) como fuente de
 * verdad: su `value`, su estado `disabled` y su evento `change` siguen
 * funcionando igual, por lo que la lógica del flujo no cambia.
 *
 * USO (declarativo):
 *   <div class="mp-input-group">
 *     <label class="mp-input-label" for="afi-tipo">Tipo de documento</label>
 *     <select id="afi-tipo" class="mp-input-field mp-select" data-zt-dropdown>
 *       <option value="" disabled selected>Seleccionar</option>
 *       <option value="CC">Cédula de ciudadanía</option>
 *       ...
 *     </select>
 *   </div>
 *   → ZTDropdown.enhanceAll() (auto en DOMContentLoaded)
 *
 * USO (programático):
 *   ZTDropdown.enhance(selectEl, { search: false });
 *
 * Opciones:
 *   search  (bool)  buscador; por defecto AUTO: true si >= 8 opciones.
 *   triggerClass    clases del trigger (por defecto usa las del <select>).
 *
 * Accesibilidad: trigger con role=combobox + aria-haspopup=listbox +
 * aria-expanded; lista role=listbox; opciones role=option + aria-selected;
 * navegación por teclado con aria-activedescendant.
 * ============================================================ */
(function (global) {
  'use strict';

  var openInstance = null;   // solo un dropdown abierto a la vez
  var uid = 0;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function ZTDropdown(select, opts) {
    opts = opts || {};
    this.select = select;
    this.id = 'ztdd-' + (++uid);

    // Opciones del <select> (se ignora la opción placeholder deshabilitada como item navegable)
    this.options = Array.prototype.map.call(select.options, function (o) {
      return { value: o.value, label: o.textContent.trim(), disabled: o.disabled, placeholder: (o.value === '' ) };
    });

    var realCount = this.options.filter(function (o) { return !o.placeholder; }).length;
    this.useSearch = (typeof opts.search === 'boolean') ? opts.search : (realCount >= 8);

    this.build(opts);
    this.wire();
  }

  ZTDropdown.prototype.placeholderText = function () {
    var ph = this.options.find(function (o) { return o.placeholder; });
    return ph ? ph.label : 'Seleccionar';
  };

  ZTDropdown.prototype.build = function (opts) {
    var self = this;
    var select = this.select;

    // Contenedor
    var root = el('div', 'zt-dropdown');
    if (opts.rootClass) root.className += ' ' + opts.rootClass;
    select.parentNode.insertBefore(root, select);

    // El <select> se conserva oculto (fuente de verdad + fallback accesible)
    select.hidden = true;
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');
    root.appendChild(select);

    // Trigger — reutiliza el look del campo (.mp-input-field). No rehace el campo.
    var triggerClass = opts.triggerClass ||
      (select.className.replace(/\bmp-select\b/, '').trim() || 'mp-input-field');
    var trigger = el('button', 'zt-dropdown__trigger ' + triggerClass);
    trigger.type = 'button';
    trigger.id = this.id + '-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', this.id + '-list');
    // Etiqueta asociada (si el label apunta al select por for=)
    var label = select.id && document.querySelector('label[for="' + select.id + '"]');
    if (label) {
      if (!label.id) label.id = this.id + '-label';
      trigger.setAttribute('aria-labelledby', label.id + ' ' + this.id + '-trigger');
    }
    if (select.disabled) { trigger.disabled = true; }

    var value = el('span', 'zt-dropdown__value');
    var caret = el('span', 'zt-dropdown__caret icon icon-caret-down icon-20 gs-inherit');
    caret.setAttribute('aria-hidden', 'true');
    trigger.appendChild(value);
    trigger.appendChild(caret);
    root.appendChild(trigger);

    // Lista (listbox)
    var list = el('div', 'zt-dropdown__list');
    list.id = this.id + '-list';
    list.setAttribute('role', 'listbox');
    if (label && label.id) list.setAttribute('aria-labelledby', label.id);
    list.hidden = true;

    // Buscador opcional
    if (this.useSearch) {
      var search = el('div', 'zt-dropdown__search');
      var sicon = el('span', 'zt-dropdown__search-icon icon icon-magnifying-glass icon-20 gs-inherit');
      sicon.setAttribute('aria-hidden', 'true');
      var sinput = el('input', 'zt-dropdown__search-input');
      sinput.type = 'text';
      sinput.setAttribute('placeholder', 'Buscar');
      sinput.setAttribute('aria-label', 'Buscar en la lista');
      search.appendChild(sinput);
      search.appendChild(sicon);
      list.appendChild(search);
      this.searchInput = sinput;
    }

    // Zona scrollable con las opciones
    var scroll = el('div', 'zt-dropdown__scroll');
    this.optionEls = [];
    this.options.forEach(function (o, i) {
      if (o.placeholder) return;  // el placeholder no es una opción navegable
      var opt = el('div', 'zt-dropdown__option');
      opt.id = self.id + '-opt-' + i;
      opt.setAttribute('role', 'option');
      opt.setAttribute('data-value', o.value);
      opt.setAttribute('aria-selected', 'false');
      if (o.disabled) opt.setAttribute('aria-disabled', 'true');

      var lbl = el('span', 'zt-dropdown__option-label');
      lbl.textContent = o.label;
      opt.appendChild(lbl);

      var check = el('span', 'zt-dropdown__option-check icon icon-check icon-20 gs-inherit');
      check.setAttribute('aria-hidden', 'true');
      opt.appendChild(check);

      scroll.appendChild(opt);
      self.optionEls.push(opt);
    });
    list.appendChild(scroll);
    root.appendChild(list);

    this.root = root;
    this.trigger = trigger;
    this.valueEl = value;
    this.list = list;
    this.scroll = scroll;
    this.focusIndex = -1;

    this.syncFromSelect();
  };

  // Refleja el valor actual del <select> en el trigger y en aria-selected.
  ZTDropdown.prototype.syncFromSelect = function () {
    var val = this.select.value;
    var self = this;
    var selectedLabel = null;
    this.optionEls.forEach(function (opt) {
      var sel = opt.getAttribute('data-value') === val && val !== '';
      opt.setAttribute('aria-selected', sel ? 'true' : 'false');
      if (sel) selectedLabel = opt.querySelector('.zt-dropdown__option-label').textContent;
    });
    if (selectedLabel) {
      this.valueEl.textContent = selectedLabel;
      this.valueEl.classList.remove('is-placeholder');
    } else {
      this.valueEl.textContent = this.placeholderText();
      this.valueEl.classList.add('is-placeholder');
    }
    // trigger disabled sigue al select
    this.trigger.disabled = this.select.disabled;
  };

  ZTDropdown.prototype.open = function () {
    if (this.trigger.disabled) return;
    if (openInstance && openInstance !== this) openInstance.close();
    openInstance = this;
    this.list.hidden = false;
    var self = this;
    requestAnimationFrame(function () { self.list.classList.add('is-open'); });
    this.trigger.setAttribute('aria-expanded', 'true');
    // foco inicial en la opción seleccionada (o la primera navegable)
    var selIdx = this.optionEls.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; });
    this.setFocus(selIdx >= 0 ? selIdx : this.firstEnabled());
    if (this.searchInput) { this.searchInput.value = ''; this.filter(''); this.searchInput.focus(); }
  };

  ZTDropdown.prototype.close = function () {
    this.list.classList.remove('is-open');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.removeAttribute('aria-activedescendant');
    var self = this;
    window.setTimeout(function () {
      if (!self.list.classList.contains('is-open')) self.list.hidden = true;
    }, 160);
    if (openInstance === this) openInstance = null;
    this.clearFocus();
  };

  ZTDropdown.prototype.toggle = function () {
    if (this.trigger.getAttribute('aria-expanded') === 'true') this.close(); else this.open();
  };

  ZTDropdown.prototype.firstEnabled = function () {
    for (var i = 0; i < this.optionEls.length; i++) {
      if (this.isSelectable(this.optionEls[i])) return i;
    }
    return -1;
  };
  ZTDropdown.prototype.isSelectable = function (opt) {
    return opt && opt.getAttribute('aria-disabled') !== 'true' && !opt.hidden;
  };

  ZTDropdown.prototype.clearFocus = function () {
    this.optionEls.forEach(function (o) { o.classList.remove('is-focus'); });
    this.focusIndex = -1;
  };

  ZTDropdown.prototype.setFocus = function (idx) {
    this.clearFocus();
    if (idx < 0 || idx >= this.optionEls.length) return;
    var opt = this.optionEls[idx];
    opt.classList.add('is-focus');
    this.focusIndex = idx;
    this.trigger.setAttribute('aria-activedescendant', opt.id);
    // asegurar visible en el scroll
    opt.scrollIntoView({ block: 'nearest' });
  };

  // Mueve el foco al siguiente/anterior seleccionable (dir = +1 / -1)
  ZTDropdown.prototype.move = function (dir) {
    var n = this.optionEls.length;
    var i = this.focusIndex;
    for (var step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (this.isSelectable(this.optionEls[i])) { this.setFocus(i); return; }
    }
  };

  ZTDropdown.prototype.selectOption = function (opt) {
    if (!this.isSelectable(opt)) return;
    var val = opt.getAttribute('data-value');
    // Escribe en el <select> (fuente de verdad) y notifica al flujo
    this.select.value = val;
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.syncFromSelect();
    this.close();
    this.trigger.focus();
  };

  ZTDropdown.prototype.filter = function (q) {
    q = (q || '').toLowerCase().trim();
    this.optionEls.forEach(function (opt) {
      var label = opt.querySelector('.zt-dropdown__option-label').textContent.toLowerCase();
      opt.hidden = q !== '' && label.indexOf(q) === -1;
    });
    // reposicionar foco al primer visible
    if (this.focusIndex < 0 || this.optionEls[this.focusIndex].hidden) this.setFocus(this.firstEnabled());
  };

  ZTDropdown.prototype.wire = function () {
    var self = this;

    this.trigger.addEventListener('click', function (e) { e.stopPropagation(); self.toggle(); });

    // Teclado en el trigger
    this.trigger.addEventListener('keydown', function (e) {
      var expanded = self.trigger.getAttribute('aria-expanded') === 'true';
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!expanded) self.open(); else self.move(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!expanded) self.open(); else self.move(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!expanded) { self.open(); }
          else if (self.focusIndex >= 0) { self.selectOption(self.optionEls[self.focusIndex]); }
          break;
        case 'Escape':
          if (expanded) { e.preventDefault(); self.close(); }
          break;
        case 'Tab':
          if (expanded) self.close();   // navegación natural, cierra al salir
          break;
      }
    });

    // Clic en una opción
    this.optionEls.forEach(function (opt) {
      opt.addEventListener('click', function () { self.selectOption(opt); });
      opt.addEventListener('mousemove', function () {
        var i = self.optionEls.indexOf(opt);
        if (self.isSelectable(opt) && i !== self.focusIndex) self.setFocus(i);
      });
    });

    // Buscador
    if (this.searchInput) {
      this.searchInput.addEventListener('input', function () { self.filter(self.searchInput.value); });
      this.searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); self.move(1); self.trigger.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); self.close(); self.trigger.focus(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (self.focusIndex >= 0) self.selectOption(self.optionEls[self.focusIndex]);
        }
      });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (self.list.hidden) return;
      if (!self.root.contains(e.target)) self.close();
    });
    // Cerrar con Escape a nivel documento (respaldo)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openInstance === self) self.close();
    });

    // Si el flujo cambia el <select> por su cuenta (p. ej. reset), reflejarlo
    this.select.addEventListener('change', function () { self.syncFromSelect(); });
    // Mantener trigger sincronizado con disabled del select (el flujo lo togglea en loading)
    this._disabledObserver = new MutationObserver(function () { self.trigger.disabled = self.select.disabled; });
    this._disabledObserver.observe(this.select, { attributes: true, attributeFilter: ['disabled'] });
  };

  /* ─────────── API pública ─────────── */
  function enhance(select, opts) {
    if (!select || select.__ztDropdown) return select && select.__ztDropdown;
    var inst = new ZTDropdown(select, opts || {});
    select.__ztDropdown = inst;
    return inst;
  }
  function enhanceAll(rootEl) {
    var scope = rootEl || document;
    var list = scope.querySelectorAll('select[data-zt-dropdown]');
    Array.prototype.forEach.call(list, function (s) {
      var opts = {};
      // data-zt-dropdown-search="true|false" fuerza el buscador (por defecto AUTO)
      var sattr = s.getAttribute('data-zt-dropdown-search');
      if (sattr === 'true') opts.search = true;
      else if (sattr === 'false') opts.search = false;
      enhance(s, opts);
    });
  }

  global.ZTDropdown = { enhance: enhance, enhanceAll: enhanceAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhanceAll(); });
  } else {
    enhanceAll();
  }
})(window);
