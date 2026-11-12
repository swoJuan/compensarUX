/* ============================================================
 * datepicker.js — API del componente transversal ZT "Date Picker / Calendar"
 * ------------------------------------------------------------
 * Mejora ("enhance") un <input type="date"> nativo: conserva el input como
 * FUENTE DE VERDAD (su `value` en formato YYYY-MM-DD, sus atributos min/max,
 * su `disabled` y su evento `change` siguen funcionando) y renderiza:
 *   1) un trigger con apariencia de campo del DS (.mp-input-field) que muestra
 *      la fecha en presentación dd/mm/aaaa, y
 *   2) un calendario (popover en desktop / modal en mobile) idéntico al Figma.
 *
 * VISUAL   = Figma mp_modal (node 199:10483)   SEMÁNTICA = date picker accesible
 *
 * PATRÓN "Aplicar": el usuario navega y selecciona una fecha PROVISIONAL; el
 * <input> (campo real) NO se actualiza hasta pulsar "Aplicar". Cerrar con X /
 * Escape / clic fuera descarta la selección provisional.
 *
 * USO (declarativo — recomendado):
 *   <div class="mp-input-wrapper">
 *     <input class="mp-input-field" id="pa-nacimiento" name="birthDate"
 *            type="date" required aria-required="true"
 *            data-zt-datepicker aria-describedby="pa-nacimiento-error">
 *   </div>
 *   → ZTDatePicker.enhanceAll() (auto en DOMContentLoaded)
 *
 * USO (programático):
 *   ZTDatePicker.enhance(inputEl, {
 *     minDate: '2000-01-01', maxDate: '2026-12-31',
 *     disabledDates: ['2026-01-01'],           // ISO o función (iso) => bool
 *     onApply: function (iso) { ... }, onClose: function () { ... }
 *   });
 *
 * Opciones:
 *   minDate/maxDate  ISO (YYYY-MM-DD). Por defecto lee input.min / input.max.
 *   disabledDates    Array de ISO | function(iso) => true si está bloqueada.
 *   title            Título del diálogo (def. "Seleccione una fecha").
 *   onApply(iso)     Callback tras Aplicar (además del evento change del input).
 *   onClose()        Callback al cerrar sin aplicar.
 *
 * Accesibilidad: role=dialog + aria-modal + aria-labelledby; grid de fechas con
 * role=grid / rowgroup / row / gridcell; navegación con flechas, Enter/Space
 * selecciona, Escape cierra; focus trap y foco gestionado.
 * ============================================================ */
(function (global) {
  'use strict';

  var openInstance = null;   // solo un calendario abierto a la vez
  var uid = 0;

  var MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];   // Domingo primero (Figma)

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function pad2(n) { return String(n).padStart(2, '0'); }

  /* ── Utilidades de fecha (trabajan sobre componentes Y-M-D, sin husos) ── */
  function isoOf(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); } // m 0-based
  function parseISO(iso) {
    if (!iso) return null;
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!p) return null;
    var y = +p[1], m = +p[2] - 1, d = +p[3];
    var dt = new Date(y, m, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
    return { y: y, m: m, d: d };
  }
  // dd/mm/aaaa para presentación
  function formatDMY(iso) {
    var p = parseISO(iso);
    return p ? (pad2(p.d) + '/' + pad2(p.m + 1) + '/' + p.y) : '';
  }

  function ZTDatePicker(input, opts) {
    opts = opts || {};
    this.input = input;
    this.id = 'ztdp-' + (++uid);
    this.title = opts.title || 'Seleccione una fecha';
    this.onApply = typeof opts.onApply === 'function' ? opts.onApply : null;
    this.onClose = typeof opts.onClose === 'function' ? opts.onClose : null;
    // Readonly: Date Field con la apariencia del sistema pero SIN abrir calendario
    // (p. ej. Fecha de vigencia, calculada por regla de negocio).
    this.readonly = !!opts.readonly || input.hasAttribute('readonly')
      || input.getAttribute('data-zt-datepicker-readonly') === 'true';

    // min/max: por opción explícita (fija) o leídos del atributo del input (vivos).
    this._minFixed = !!opts.minDate;
    this._maxFixed = !!opts.maxDate;
    this.minISO = opts.minDate || input.getAttribute('min') || null;
    this.maxISO = opts.maxDate || input.getAttribute('max') || null;
    this.disabledDates = opts.disabledDates || null;   // array | function

    // Selección "confirmada" (la del input) y "provisional" (la del calendario).
    this.selectedISO = input.value || null;
    this.draftISO = this.selectedISO;

    // Mes visible inicial: el de la fecha seleccionada, o hoy (acotado a min/max).
    var base = parseISO(this.selectedISO) || this._todayParts();
    this.viewY = base.y;
    this.viewM = base.m;

    this.build(opts);
    this.wire();
    this.syncFromInput();
  }

  ZTDatePicker.prototype._todayParts = function () {
    var t = new Date();
    return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
  };

  /* ─────────── Reglas de habilitación de una fecha ─────────── */
  ZTDatePicker.prototype.isDisabledISO = function (iso) {
    if (this.minISO && iso < this.minISO) return true;
    if (this.maxISO && iso > this.maxISO) return true;
    var dd = this.disabledDates;
    if (typeof dd === 'function') { try { return !!dd(iso); } catch (e) { return false; } }
    if (Array.isArray(dd)) return dd.indexOf(iso) !== -1;
    return false;
  };

  /* ─────────── Construcción del DOM ─────────── */
  ZTDatePicker.prototype.build = function (opts) {
    var input = this.input;

    // Contenedor posicionador
    var root = el('div', 'zt-datefield');
    if (opts.rootClass) root.className += ' ' + opts.rootClass;
    if (this.readonly) root.classList.add('zt-datefield--readonly');
    input.parentNode.insertBefore(root, input);

    // El <input type=date> se conserva oculto como fuente de verdad + fallback.
    input.hidden = true;
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');
    root.appendChild(input);

    // Trigger — reutiliza el look del campo (.mp-input-field).
    var triggerClass = opts.triggerClass ||
      (input.className.trim() || 'mp-input-field');
    var trigger = el('button', 'zt-datefield__trigger ' + triggerClass);
    trigger.type = 'button';
    trigger.id = this.id + '-trigger';
    if (this.readonly) {
      // Campo de solo lectura: no abre calendario, no es foco de tabulación.
      trigger.setAttribute('aria-readonly', 'true');
      trigger.setAttribute('tabindex', '-1');
    } else {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
    }
    var label = input.id && document.querySelector('label[for="' + input.id + '"]');
    if (label) {
      if (!label.id) label.id = this.id + '-label';
      trigger.setAttribute('aria-labelledby', label.id + ' ' + this.id + '-trigger');
    }
    if (input.disabled) trigger.disabled = true;

    var value = el('span', 'zt-datefield__value');
    var icon = el('span', 'zt-datefield__icon icon icon-calendar-blank icon-20 gs-inherit');
    icon.setAttribute('aria-hidden', 'true');
    trigger.appendChild(value);
    trigger.appendChild(icon);
    root.appendChild(trigger);

    this.root = root;
    this.trigger = trigger;
    this.valueEl = value;

    // Readonly: no se construye calendario ni overlay (solo el campo con estilo).
    if (this.readonly) return;

    // Overlay (solo visible en modo modal / mobile)
    var overlay = el('div', 'zt-datepicker-overlay');
    root.appendChild(overlay);

    // Calendario (dialog)
    var cal = el('div', 'zt-datepicker');
    cal.id = this.id + '-cal';
    cal.setAttribute('role', 'dialog');
    cal.setAttribute('aria-modal', 'true');
    cal.setAttribute('aria-labelledby', this.id + '-title');
    cal.hidden = true;

    // Cabecera
    var head = el('div', 'zt-datepicker__head');
    var title = el('h2', 'zt-datepicker__title');
    title.id = this.id + '-title';
    title.textContent = this.title;
    var close = el('button', 'zt-datepicker__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar');
    var closeIcon = el('span', 'icon icon-x icon-20 gs-inherit');
    closeIcon.setAttribute('aria-hidden', 'true');
    close.appendChild(closeIcon);
    head.appendChild(title);
    head.appendChild(close);
    cal.appendChild(head);

    // Cuerpo (nav + weekdays + grid)
    var body = el('div', 'zt-datepicker__body');

    // Navegación de mes
    var nav = el('div', 'zt-datepicker__nav');
    var prev = el('button', 'zt-datepicker__navbtn');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Mes anterior');
    var prevIcon = el('span', 'icon icon-caret-left icon-20 gs-inherit');
    prevIcon.setAttribute('aria-hidden', 'true');
    prev.appendChild(prevIcon);
    var month = el('div', 'zt-datepicker__month');
    month.id = this.id + '-month';
    month.setAttribute('aria-live', 'polite');
    var next = el('button', 'zt-datepicker__navbtn');
    next.type = 'button';
    next.setAttribute('aria-label', 'Mes siguiente');
    var nextIcon = el('span', 'icon icon-caret-right icon-20 gs-inherit');
    nextIcon.setAttribute('aria-hidden', 'true');
    next.appendChild(nextIcon);
    nav.appendChild(prev);
    nav.appendChild(month);
    nav.appendChild(next);
    body.appendChild(nav);

    // Días de la semana
    var wk = el('div', 'zt-datepicker__weekdays');
    WEEKDAYS.forEach(function (w) {
      var c = el('span', 'zt-datepicker__weekday');
      c.setAttribute('aria-hidden', 'true');
      c.textContent = w;
      wk.appendChild(c);
    });
    body.appendChild(wk);

    // Grid de fechas (role=grid)
    var grid = el('div', 'zt-datepicker__grid');
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-labelledby', this.id + '-month');
    body.appendChild(grid);
    cal.appendChild(body);

    // Pie: botón Aplicar (DS .mp-btn--primario). No se crea un botón exclusivo.
    var footer = el('div', 'zt-datepicker__footer');
    var apply = el('button', 'mp-btn mp-btn--primario zt-datepicker__apply');
    apply.type = 'button';
    apply.textContent = 'Aplicar';
    footer.appendChild(apply);
    cal.appendChild(footer);

    root.appendChild(cal);

    this.root = root;
    this.trigger = trigger;
    this.valueEl = value;
    this.overlay = overlay;
    this.cal = cal;
    this.monthEl = month;
    this.gridEl = grid;
    this.prevBtn = prev;
    this.nextBtn = next;
    this.closeBtn = close;
    this.applyBtn = apply;
  };

  /* Refleja el valor del <input> en el trigger (presentación dd/mm/aaaa). */
  ZTDatePicker.prototype.syncFromInput = function () {
    var iso = this.input.value || null;
    this.selectedISO = iso;
    if (iso) {
      this.valueEl.textContent = formatDMY(iso);
      this.valueEl.classList.remove('is-placeholder');
    } else {
      this.valueEl.textContent = this.input.getAttribute('placeholder') || 'dd/mm/aaaa';
      this.valueEl.classList.add('is-placeholder');
    }
    this.trigger.disabled = this.input.disabled;
  };

  /* ─────────── Render del mes visible ─────────── */
  ZTDatePicker.prototype.render = function () {
    var self = this;
    var y = this.viewY, m = this.viewM;
    this.monthEl.textContent = MONTHS[m] + ' ' + y;

    // Limpiar grid
    this.gridEl.innerHTML = '';
    this.dayEls = [];

    var first = new Date(y, m, 1);
    var startDow = first.getDay();                 // 0 = domingo
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var daysPrev = new Date(y, m, 0).getDate();

    // Se rellenan solo las filas necesarias (como el Figma): días del mes
    // anterior (inicio), días del mes, y días del siguiente hasta completar la
    // última fila de 7. Entre 4 y 6 filas según el mes.
    var cells = [];
    // Días del mes anterior (relleno inicial hasta el domingo)
    for (var i = startDow - 1; i >= 0; i--) {
      cells.push({ d: daysPrev - i, outside: true, my: prevMonth(y, m) });
    }
    // Días del mes actual
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ d: d, outside: false, my: { y: y, m: m } });
    }
    // Días del mes siguiente (relleno final hasta completar la fila de 7)
    var nextD = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ d: nextD++, outside: true, my: nextMonth(y, m) });
    }
    this.rowCount = cells.length / 7;

    var todayISO = isoOf(this._todayParts().y, this._todayParts().m, this._todayParts().d);

    cells.forEach(function (c) {
      var iso = isoOf(c.my.y, c.my.m, c.d);
      var btn = el('button', 'zt-datepicker__day');
      btn.type = 'button';
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('data-iso', iso);
      btn.textContent = c.d;
      if (c.outside) btn.classList.add('zt-datepicker__day--outside');

      var disabled = self.isDisabledISO(iso);
      if (disabled) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }

      var isSel = self.draftISO === iso;
      if (isSel) { btn.classList.add('is-selected'); btn.setAttribute('aria-selected', 'true'); }
      else { btn.setAttribute('aria-selected', 'false'); }

      if (iso === todayISO) btn.setAttribute('aria-current', 'date');

      // Roving tabindex: solo una celda es tabbable (la draft o, si no hay, hoy/1º).
      btn.tabIndex = -1;

      self.gridEl.appendChild(btn);
      self.dayEls.push(btn);
    });

    // Actualizar disponibilidad de navegación (respeta min/max de mes).
    this.updateNavAvailability();
    // Definir la celda tabbable/foco.
    this.setActiveCell(this.findActiveIndex(), false);

    function prevMonth(yy, mm) { return mm === 0 ? { y: yy - 1, m: 11 } : { y: yy, m: mm - 1 }; }
    function nextMonth(yy, mm) { return mm === 11 ? { y: yy + 1, m: 0 } : { y: yy, m: mm + 1 }; }
  };

  // Índice de la celda que debe recibir foco: la draft del mes visible, o hoy, o el 1º del mes.
  ZTDatePicker.prototype.findActiveIndex = function () {
    var self = this;
    var idx = -1;
    if (this.draftISO) {
      idx = this.dayEls.findIndex(function (b) {
        return b.getAttribute('data-iso') === self.draftISO && !b.classList.contains('zt-datepicker__day--outside');
      });
    }
    if (idx < 0) {
      var todayISO = isoOf(this._todayParts().y, this._todayParts().m, this._todayParts().d);
      idx = this.dayEls.findIndex(function (b) {
        return b.getAttribute('data-iso') === todayISO && !b.classList.contains('zt-datepicker__day--outside');
      });
    }
    if (idx < 0) {
      idx = this.dayEls.findIndex(function (b) {
        return !b.classList.contains('zt-datepicker__day--outside');
      });
    }
    return idx < 0 ? 0 : idx;
  };

  ZTDatePicker.prototype.setActiveCell = function (idx, focus) {
    if (!this.dayEls || !this.dayEls.length) return;
    idx = Math.max(0, Math.min(idx, this.dayEls.length - 1));
    this.dayEls.forEach(function (b) { b.tabIndex = -1; });
    var cell = this.dayEls[idx];
    cell.tabIndex = 0;
    this.activeIndex = idx;
    if (focus) cell.focus();
  };

  // Deshabilita prev/next si el mes destino queda completamente fuera de min/max.
  ZTDatePicker.prototype.updateNavAvailability = function () {
    var y = this.viewY, m = this.viewM;
    // Prev disponible si el último día del mes anterior >= minISO
    var prevLast = isoOf(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, new Date(y, m, 0).getDate());
    this.prevBtn.disabled = !!(this.minISO && prevLast < this.minISO);
    // Next disponible si el primer día del mes siguiente <= maxISO
    var nextFirst = isoOf(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1, 1);
    this.nextBtn.disabled = !!(this.maxISO && nextFirst > this.maxISO);
  };

  /* ─────────── Navegación de mes ─────────── */
  ZTDatePicker.prototype.goMonth = function (delta) {
    var m = this.viewM + delta;
    var y = this.viewY;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    this.viewY = y; this.viewM = m;
    this.render();
  };

  /* ─────────── Selección provisional (no confirma hasta Aplicar) ─────────── */
  ZTDatePicker.prototype.selectDraft = function (iso, cellIdx) {
    if (this.isDisabledISO(iso)) return;
    this.draftISO = iso;
    // Repintar estado seleccionado sin reconstruir todo el grid.
    this.dayEls.forEach(function (b) {
      var sel = b.getAttribute('data-iso') === iso;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
    });
    if (typeof cellIdx === 'number') this.setActiveCell(cellIdx, false);
  };

  /* ─────────── Abrir / cerrar ─────────── */
  // Margen de seguridad al borde del viewport (px). Coherente con spacing 16.
  var SAFE_MARGIN = 16;

  // Modo modal en pantallas estrechas (mobile). El desktop usa popover salvo que
  // no quepa ni debajo ni arriba (se decide en position(), que puede caer a modal).
  ZTDatePicker.prototype.isModalViewport = function () {
    return window.matchMedia('(max-width: 600px)').matches;
  };

  ZTDatePicker.prototype.setModal = function (on) {
    this.cal.classList.toggle('is-modal', on);
    this.overlay.classList.toggle('is-modal', on);
  };

  ZTDatePicker.prototype.open = function () {
    if (this.readonly || this.trigger.disabled) return;
    if (openInstance && openInstance !== this) openInstance.close();
    openInstance = this;

    // Releer min/max VIVOS del input: el flujo puede fijarlos tras el enhance
    // (p. ej. paso-2 fija max = hoy). Solo se sobreescribe si no vino por opción.
    if (!this._minFixed) this.minISO = this.input.getAttribute('min') || this.minISO || null;
    if (!this._maxFixed) this.maxISO = this.input.getAttribute('max') || this.maxISO || null;

    // Reset del borrador a la selección confirmada y mes visible acorde.
    this.draftISO = this.selectedISO;
    var base = parseISO(this.selectedISO) || this._todayParts();
    this.viewY = base.y; this.viewM = base.m;

    this.cal.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');

    // Render primero (define la altura real) y luego posicionar.
    this.render();
    this.place();

    this._prevFocus = document.activeElement;
    this.setActiveCell(this.findActiveIndex(), true);
  };

  /* Decide modal vs popover y posiciona. En viewport estrecho → modal directo.
   * En desktop → popover debajo si cabe; si no, arriba; si tampoco → modal. */
  ZTDatePicker.prototype.place = function () {
    if (this.isModalViewport()) { this.setModal(true); return; }
    this.setModal(false);
    this.position();
  };

  ZTDatePicker.prototype.close = function (viaApply) {
    if (this.cal.hidden) return;
    this.cal.hidden = true;
    this.cal.classList.remove('is-modal');
    this.overlay.classList.remove('is-modal');
    // Limpiar posicionamiento inline para que la próxima apertura empiece limpia.
    this.cal.style.position = '';
    this.cal.style.top = this.cal.style.left = this.cal.style.right = '';
    this.cal.style.maxHeight = '';
    this.trigger.setAttribute('aria-expanded', 'false');
    if (openInstance === this) openInstance = null;
    // Restaurar foco al trigger.
    try { this.trigger.focus({ preventScroll: true }); } catch (e) { this.trigger.focus(); }
    if (!viaApply && this.onClose) this.onClose();
  };

  /* Posiciona el popover con posición FIXED respecto al viewport, decidiendo
   * arriba/abajo según el espacio disponible y evitando cualquier desborde.
   * Si no cabe ni arriba ni abajo (viewport bajo), cae a modal centrado. */
  ZTDatePicker.prototype.position = function () {
    var cal = this.cal;
    var gap = 8;

    // Limpiar posicionamiento previo para medir la altura natural del calendario.
    cal.style.position = 'fixed';
    cal.style.top = '0px';
    cal.style.left = '0px';
    cal.style.right = 'auto';
    cal.style.maxHeight = '';

    var tr = this.trigger.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var calW = cal.offsetWidth;
    var calH = cal.offsetHeight;

    // Espacio disponible arriba/abajo del campo (descontando margen seguro).
    var spaceBelow = vh - tr.bottom - gap - SAFE_MARGIN;
    var spaceAbove = tr.top - gap - SAFE_MARGIN;

    // Si no cabe ni arriba ni abajo → modal centrado (más usable que recortar).
    if (calH > spaceBelow && calH > spaceAbove) {
      cal.style.position = '';
      cal.style.top = cal.style.left = cal.style.right = cal.style.maxHeight = '';
      this.setModal(true);
      return;
    }

    // Horizontal: alinear al borde izquierdo del campo, clamp dentro del viewport.
    var left = tr.left;
    var maxLeft = vw - SAFE_MARGIN - calW;
    if (left > maxLeft) left = maxLeft;             // no salirse por la derecha
    if (left < SAFE_MARGIN) left = SAFE_MARGIN;     // ni por la izquierda

    // Vertical: preferir debajo; si no cabe pero sí arriba, abrir arriba.
    var top;
    if (calH <= spaceBelow) {
      top = tr.bottom + gap;
    } else {
      top = tr.top - gap - calH;
      if (top < SAFE_MARGIN) top = SAFE_MARGIN;     // clamp superior
    }

    cal.style.left = Math.round(left) + 'px';
    cal.style.top = Math.round(top) + 'px';
    // Techo de altura de seguridad (por si el mes fuerza 6 filas en un viewport justo).
    cal.style.maxHeight = (vh - 2 * SAFE_MARGIN) + 'px';
  };

  /* ─────────── Aplicar: confirma la fecha en el input real ─────────── */
  ZTDatePicker.prototype.apply = function () {
    if (!this.draftISO || this.isDisabledISO(this.draftISO)) return;
    this.input.value = this.draftISO;             // fuente de verdad (YYYY-MM-DD)
    this.selectedISO = this.draftISO;
    this.syncFromInput();
    // Notificar al flujo (validación / recálculo de edad, etc.).
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
    if (this.onApply) this.onApply(this.draftISO);
    this.close(true);
  };

  /* ─────────── Teclado dentro del grid ─────────── */
  ZTDatePicker.prototype.onGridKeydown = function (e) {
    var idx = this.activeIndex;
    if (idx == null || idx < 0) return;
    var handled = true;
    switch (e.key) {
      case 'ArrowLeft':  this.moveActive(idx - 1); break;
      case 'ArrowRight': this.moveActive(idx + 1); break;
      case 'ArrowUp':    this.moveActive(idx - 7); break;
      case 'ArrowDown':  this.moveActive(idx + 7); break;
      case 'Home':       this.moveActive(idx - (idx % 7)); break;
      case 'End':        this.moveActive(idx - (idx % 7) + 6); break;
      case 'PageUp':     this.goMonth(-1); this.setActiveCell(this.findActiveIndex(), true); break;
      case 'PageDown':   this.goMonth(1); this.setActiveCell(this.findActiveIndex(), true); break;
      case 'Enter':
      case ' ':
        var cell = this.dayEls[this.activeIndex];
        if (cell && !cell.disabled) this.selectDraft(cell.getAttribute('data-iso'), this.activeIndex);
        break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  };

  // Mueve el foco a otra celda; si sale del mes visible, cambia de mes y reubica.
  ZTDatePicker.prototype.moveActive = function (target) {
    if (target < 0) {
      this.goMonth(-1);
      // Reubicar: última semana. Buscar equivalente aproximado desde el final.
      var offset = (target + 7) % 7;
      this.setActiveCell(this.lastRowIndex(offset), true);
      return;
    }
    if (target >= this.dayEls.length) {
      this.goMonth(1);
      var col = target % 7;
      this.setActiveCell(this.firstRowIndex(col), true);
      return;
    }
    this.setActiveCell(target, true);
  };
  ZTDatePicker.prototype.firstRowIndex = function (col) { return col; };
  ZTDatePicker.prototype.lastRowIndex = function (col) {
    var rows = this.dayEls.length / 7;      // filas reales del mes visible
    return (rows - 1) * 7 + col;
  };

  /* ─────────── Cableado de eventos ─────────── */
  ZTDatePicker.prototype.wire = function () {
    var self = this;

    // Readonly: solo mantener el trigger sincronizado con el valor del input.
    if (this.readonly) {
      this.input.addEventListener('change', function () { self.syncFromInput(); });
      this._disabledObserver = new MutationObserver(function () {
        self.trigger.disabled = self.input.disabled;
      });
      this._disabledObserver.observe(this.input, { attributes: true, attributeFilter: ['disabled'] });
      return;
    }

    // Abrir: clic en el trigger (todo el área) + Enter/Space/flechas.
    this.trigger.addEventListener('click', function (e) { e.stopPropagation(); self.open(); });
    this.trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); self.open();
      }
    });

    // Cerrar sin aplicar.
    this.closeBtn.addEventListener('click', function () { self.close(); });
    this.overlay.addEventListener('click', function () { self.close(); });

    // Navegación de mes.
    this.prevBtn.addEventListener('click', function () { self.goMonth(-1); });
    this.nextBtn.addEventListener('click', function () { self.goMonth(1); });

    // Selección (delegada en el grid).
    this.gridEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.zt-datepicker__day');
      if (!btn || btn.disabled) return;
      var i = self.dayEls.indexOf(btn);
      self.selectDraft(btn.getAttribute('data-iso'), i);
    });
    this.gridEl.addEventListener('keydown', function (e) { self.onGridKeydown(e); });

    // Aplicar.
    this.applyBtn.addEventListener('click', function () { self.apply(); });

    // Teclado a nivel diálogo: Escape cierra; focus trap con Tab.
    this.cal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); self.close(); return; }
      if (e.key === 'Tab') self.trapTab(e);
    });

    // Cerrar el popover (desktop) al hacer clic fuera del campo/calendario.
    // En modo modal el cierre por fondo lo gestiona el overlay.
    document.addEventListener('click', function (e) {
      if (self.cal.hidden) return;
      if (self.cal.classList.contains('is-modal')) return;
      if (!self.root.contains(e.target)) self.close();
    });

    // Reposicionar en scroll/resize mientras está abierto. Re-evalúa modal vs
    // popover y arriba/abajo según el nuevo espacio disponible.
    this._onReflow = function () {
      if (self.cal.hidden) return;
      self.place();
    };
    window.addEventListener('resize', this._onReflow);
    window.addEventListener('scroll', this._onReflow, true);

    // Si el flujo cambia el input por su cuenta (reset/restauración), reflejarlo.
    this.input.addEventListener('change', function () { self.syncFromInput(); });
    this._disabledObserver = new MutationObserver(function () {
      self.trigger.disabled = self.input.disabled;
    });
    this._disabledObserver.observe(this.input, { attributes: true, attributeFilter: ['disabled', 'min', 'max'] });
  };

  // Focus trap: mantiene el Tab dentro del diálogo.
  ZTDatePicker.prototype.trapTab = function (e) {
    var focusables = this.cal.querySelectorAll(
      'button:not([disabled]), [tabindex="0"]'
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ─────────── API pública ─────────── */
  function enhance(input, opts) {
    if (!input || input.__ztDatePicker) return input && input.__ztDatePicker;
    var inst = new ZTDatePicker(input, opts || {});
    input.__ztDatePicker = inst;
    return inst;
  }
  function enhanceAll(rootEl) {
    var scope = rootEl || document;
    var list = scope.querySelectorAll('input[data-zt-datepicker]');
    Array.prototype.forEach.call(list, function (i) {
      var opts = {};
      var t = i.getAttribute('data-zt-datepicker-title');
      if (t) opts.title = t;
      enhance(i, opts);
    });
  }

  global.ZTDatePicker = { enhance: enhance, enhanceAll: enhanceAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhanceAll(); });
  } else {
    enhanceAll();
  }
})(window);
