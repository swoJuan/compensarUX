/* ============================================================
 * modal.js — API del componente transversal ZT "Modal"
 * ------------------------------------------------------------
 * Diálogo modal sobre overlay oscuro (bloqueante). Estilos en modal.css.
 * Usa el markup del Design System (.mp-modal / .mp-modal__*), variantes
 * success | warning | info | error.
 *
 * API:
 *   ZTModal.open({
 *     type:        "success" | "warning" | "info" | "error",  // def. "info"
 *     icon:        "icon-check",         // clase de icono del sistema (opcional; def. por type)
 *     title:       "La afiliación puede continuar",            // obligatorio
 *     body:        "Texto de apoyo" | ["línea 1", "línea 2"],  // opcional (string o array)
 *     content:     HTMLElement,          // opcional: cuerpo con formato (listas, negritas…).
 *                                        // Se inserta tal cual; construirlo con textContent
 *                                        // para datos del usuario (sin innerHTML con datos).
 *     size:        "md" | "lg",          // def. "md" (479px). "lg" = 774px + cuerpo con scroll
 *     align:       "center" | "left",    // alineación del texto del cuerpo (def. "center")
 *     dismissible: true,                 // muestra botón cerrar + cierra con overlay/Escape (def. true)
 *     primaryAction:   { label, onClick },   // opcional (botón .mp-btn--primario)
 *     secondaryAction: { label, onClick },   // opcional (botón .mp-btn--secundario)
 *     onClose:     function () { ... }   // callback al cerrar (opcional)
 *   }) -> { close: fn, el: HTMLElement }
 *
 *   ZTModal.close()   // cierra el modal abierto
 *
 * Accesibilidad:
 *   - role="dialog" + aria-modal="true" + aria-labelledby (título).
 *   - Al abrir mueve el foco al modal; al cerrar restaura el foco previo.
 *   - Focus trap básico (Tab cicla dentro del modal). Escape cierra si dismissible.
 *
 * Icono por variante (font-icon del Design System):
 *   success → icon-check   warning → icon-warning
 *   info    → icon-info     error  → icon-x-circle
 * ============================================================ */
(function (global) {
  'use strict';

  var ICON = { success: 'icon-check', warning: 'icon-warning', info: 'icon-info', error: 'icon-x-circle' };

  var current = null;          // { overlay, onClose, prevFocus, keyHandler }

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function open(cfg) {
    cfg = cfg || {};
    if (!cfg.title) throw new Error('ZTModal: "title" es obligatorio');
    if (current) close();      // solo un modal a la vez

    var type = cfg.type || 'info';
    var dismissible = cfg.dismissible !== false;

    var overlay = el('div', 'zt-modal');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var modal = el('div', 'mp-modal mp-modal--' + type + ' mp-modal--open' + (cfg.size === 'lg' ? ' zt-modal--lg' : ''));
    var dialog = el('div', 'mp-modal__dialog');
    var content = el('div', 'mp-modal__content');

    // Botón cerrar (solo si dismissible)
    if (dismissible) {
      var closeBtn = el('button', 'mp-modal__close');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Cerrar');
      var xicon = el('span', 'icon icon-x icon-24 gs-inherit');
      xicon.setAttribute('aria-hidden', 'true');
      closeBtn.appendChild(xicon);
      closeBtn.addEventListener('click', close);
      content.appendChild(closeBtn);
    }

    // Icono de estado (64px círculo — estilo del DS)
    var iconWrap = el('span', 'mp-modal__icon');
    iconWrap.setAttribute('aria-hidden', 'true');
    var iconGlyph = el('span', 'icon ' + (cfg.icon || ICON[type] || ICON.info) + ' icon-32 gs-inherit');
    iconWrap.appendChild(iconGlyph);
    content.appendChild(iconWrap);

    // Título
    var titleId = 'zt-modal-title-' + Date.now();
    var title = el('h2', 'mp-modal__title');
    title.id = titleId;
    title.textContent = cfg.title;
    content.appendChild(title);
    overlay.setAttribute('aria-labelledby', titleId);

    // Cuerpo (string o array de líneas)
    if (cfg.body) {
      var lines = Array.isArray(cfg.body) ? cfg.body : [cfg.body];
      lines.forEach(function (txt) {
        var p = el('p', 'mp-modal__body');
        p.textContent = txt;
        content.appendChild(p);
      });
    }

    // Cuerpo con formato (nodo), con scroll propio en tamaño grande.
    if (cfg.content) {
      var rich = el('div', 'zt-modal__rich' + (cfg.align === 'left' ? ' zt-modal__rich--left' : ''));
      rich.setAttribute('tabindex', '0');   // desplazable con teclado
      rich.appendChild(cfg.content);
      content.appendChild(rich);
    }

    // Acciones (secundaria + primaria)
    if (cfg.primaryAction || cfg.secondaryAction) {
      var actions = el('div', 'mp-modal__actions');
      if (cfg.secondaryAction && cfg.secondaryAction.label) {
        actions.appendChild(makeBtn('mp-btn mp-btn--secundario', cfg.secondaryAction));
      }
      if (cfg.primaryAction && cfg.primaryAction.label) {
        actions.appendChild(makeBtn('mp-btn mp-btn--primario', cfg.primaryAction));
      }
      content.appendChild(actions);
    }

    dialog.appendChild(content);
    modal.appendChild(dialog);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cerrar al hacer clic en el overlay (fuera del diálogo), si dismissible
    if (dismissible) {
      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) close();
      });
    }

    // Teclado: Escape cierra (si dismissible) + focus trap con Tab
    function keyHandler(e) {
      if (e.key === 'Escape' && dismissible) { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = focusables(modal);
        if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keyHandler);

    // Bloquea el scroll del fondo mientras el modal está abierto
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    current = {
      overlay: overlay,
      onClose: cfg.onClose,
      prevFocus: document.activeElement,
      keyHandler: keyHandler,
      prevOverflow: prevOverflow
    };

    // Abre y mueve el foco al primer control (o al diálogo)
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      var f = focusables(modal);
      (f[0] || modal).focus();
    });

    return { close: close, el: overlay };

    function makeBtn(cls, action) {
      var b = el('button', cls);
      b.type = 'button';
      b.textContent = action.label;
      b.addEventListener('click', function () {
        if (typeof action.onClick === 'function') action.onClick();
      });
      return b;
    }
  }

  function close() {
    if (!current) return;
    var c = current;
    current = null;
    document.removeEventListener('keydown', c.keyHandler);
    document.body.style.overflow = c.prevOverflow || '';
    if (c.overlay && c.overlay.parentNode) c.overlay.parentNode.removeChild(c.overlay);
    if (c.prevFocus && typeof c.prevFocus.focus === 'function') c.prevFocus.focus();
    if (typeof c.onClose === 'function') c.onClose();
  }

  global.ZTModal = { open: open, close: close };
})(window);
