/* ============================================================
 * confirm-drawer.js — Drawer de confirmación (ZT · Historia clínica)
 * ------------------------------------------------------------
 * Shell `.mp-sidebar` del Design System (panel lateral + backdrop + transición),
 * con el contenido del Figma 15678:148601: header violeta con icono, X flotante,
 * filas con separador punteado y botones "Regresar" / "Confirmar" centrados.
 * El CSS del shell viene de shared/vendor/core.css; el del contenido, de
 * css/custom.css (.hc-drawer__*). Aquí va el comportamiento (el DS no trae JS):
 *   - abre con transición, foco al botón cerrar, focus trap con Tab
 *   - cierra con Escape, clic en el backdrop, X o "Regresar"
 *   - bloquea el scroll del fondo y restaura el foco al cerrar
 *   - respeta prefers-reduced-motion
 * En ≤768px el DS lo convierte en bottom sheet.
 *
 * API:
 *   HCConfirmDrawer.open({
 *     title, intro,
 *     paciente:  'Nombre',
 *     servicios: ['A', 'B'],
 *     periodo:   { rango: '1 ene 2025 – 31 dic 2025', texto: 'Año anterior (2025)' },
 *     onConfirm: function (btn) {}
 *   })
 *   HCConfirmDrawer.close({ immediate: true })   // opcional: sin animación y sin devolver el foco
 * Todo el texto se inserta con textContent.
 * ============================================================ */
(function (global) {
  'use strict';

  var current = null;   // { root, prevFocus, keyHandler, prevOverflow }
  var TRANSITION_MS = 280;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function icon(name, size) {
    var i = el('i', 'icon ' + name + ' icon-' + (size || 16));
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  // Fila del diseño (Figma 15678:148601): círculo violeta con icono + etiqueta + valor(es)
  function row(iconName, label, valueNodes) {
    var r = el('div', 'hc-drawer__item');
    var ic = el('div', 'hc-drawer__item-icon');
    ic.setAttribute('aria-hidden', 'true');
    var i = icon(iconName, 20);
    i.classList.add('gs-violet');
    ic.appendChild(i);
    var content = el('div', 'hc-drawer__item-body');
    content.appendChild(el('p', 'hc-drawer__item-label', label));
    valueNodes.forEach(function (n) { content.appendChild(n); });
    r.appendChild(ic);
    r.appendChild(content);
    return r;
  }

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function open(cfg) {
    cfg = cfg || {};
    if (current) closeNow();

    var titleId = 'hc-drawer-title';
    var root = el('div', 'mp-sidebar hc-drawer');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', titleId);

    var backdrop = el('div', 'mp-sidebar__backdrop');
    var panel = el('div', 'mp-sidebar__panel');

    // Header violeta: icono, título, subtítulo (+ botón cerrar flotante)
    var header = el('div', 'hc-drawer__header');
    var hIcon = el('div', 'hc-drawer__header-icon');
    hIcon.setAttribute('aria-hidden', 'true');
    var hi = icon('icon-calendar-check', 32);
    hi.classList.add('gs-violet');
    hIcon.appendChild(hi);
    var title = el('h2', 'hc-drawer__title', cfg.title || 'Confirma tu selección');
    title.id = titleId;
    header.appendChild(hIcon);
    header.appendChild(title);
    if (cfg.intro) header.appendChild(el('p', 'hc-drawer__intro', cfg.intro));

    var closeBtn = el('button', 'hc-drawer__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar panel');
    closeBtn.appendChild(icon('icon-x', 24));

    // Lista de datos
    var body = el('div', 'hc-drawer__list-wrap');
    body.appendChild(row('icon-user', 'Paciente', [el('p', 'hc-drawer__value', cfg.paciente)]));

    var servicios = cfg.servicios || [];
    body.appendChild(row('icon-heartbeat', 'Servicios seleccionados · ' + servicios.length,
      servicios.map(function (s) { return el('p', 'hc-drawer__value hc-drawer__bullet', s); })));

    var per = cfg.periodo || {};
    var periodoValues = [el('p', 'hc-drawer__value', per.rango)];
    if (per.texto) periodoValues.push(el('p', 'hc-drawer__value', per.texto));
    body.appendChild(row('icon-calendar-blank', 'Periodo', periodoValues));

    // Acciones: centradas justo debajo de la lista (no es un footer fijo)
    var footer = el('div', 'hc-drawer__actions');
    var back = el('button', 'mp-btn mp-btn--secundario', 'Regresar');
    back.type = 'button';
    var ok = el('button', 'mp-btn mp-btn--primario', 'Confirmar');
    ok.type = 'button';
    footer.appendChild(back);
    footer.appendChild(ok);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    panel.appendChild(closeBtn);
    root.appendChild(backdrop);
    root.appendChild(panel);
    document.body.appendChild(root);

    // Eventos
    closeBtn.addEventListener('click', function () { close(); });
    back.addEventListener('click', function () { close(); });
    backdrop.addEventListener('click', function () { close(); });
    ok.addEventListener('click', function () {
      if (typeof cfg.onConfirm === 'function') cfg.onConfirm(ok);
    });

    function keyHandler(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(panel);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === root) { e.preventDefault(); first.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keyHandler);

    current = {
      root: root,
      prevFocus: document.activeElement,
      keyHandler: keyHandler,
      prevOverflow: document.body.style.overflow
    };
    document.body.style.overflow = 'hidden';

    // Doble rAF: el panel debe pintarse fuera de pantalla antes de animar
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add('is-open');
        closeBtn.focus();
      });
    });

    return { close: close, el: root };
  }

  function closeNow() {
    if (!current) return;
    var c = current;
    current = null;
    document.removeEventListener('keydown', c.keyHandler);
    document.body.style.overflow = c.prevOverflow || '';
    if (c.root.parentNode) c.root.parentNode.removeChild(c.root);
  }

  function close(opts) {
    if (opts && opts.immediate) { closeNow(); return; }   // sin animación ni devolver el foco (p. ej. al abrir un mensaje)
    if (!current) return;
    var c = current;
    current = null;
    document.removeEventListener('keydown', c.keyHandler);
    document.body.style.overflow = c.prevOverflow || '';
    c.root.classList.remove('is-open');
    var done = function () {
      if (c.root.parentNode) c.root.parentNode.removeChild(c.root);
      if (c.prevFocus && typeof c.prevFocus.focus === 'function') c.prevFocus.focus();
    };
    if (reducedMotion()) done(); else window.setTimeout(done, TRANSITION_MS);
  }

  global.HCConfirmDrawer = { open: open, close: close };
})(window);
