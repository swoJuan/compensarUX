/* ============================================================
 * stepper.js — API del componente transversal ZT "Process Stepper"
 * ------------------------------------------------------------
 * Indicador de progreso por pasos. Estilos en stepper.css.
 * Componente GENERAL (no acoplado a ningún proceso).
 *
 * API:
 *   ZTStepper.render(container, {
 *     current: 1,                       // número del paso activo (1-based)
 *     steps: [                          // lista de pasos
 *       { label: "Iniciar afiliación" },
 *       { label: "Datos del contratante" },
 *       ...
 *     ],
 *     onSelect: function (index, step) { ... }  // opcional: navegación a un paso
 *     allowFuture: false,               // si false, los pasos futuros no son clicables
 *     showProgress: true                // cabecera "Tu progreso · Paso N de M" + barra
 *   }) -> HTMLElement (div.zt-stepper-wrap)
 *
 *   ZTStepper.create(cfg) -> HTMLElement
 *
 * Estado por paso (derivado de `current`):
 *   index <  current → completed
 *   index === current → active
 *   index >  current → future (disabled salvo allowFuture + onSelect)
 * Un paso puede forzar estado con step.state = "completed|active|disabled".
 *
 * Presentación: línea de tiempo vertical (conector entre pasos, verde en los
 * tramos completados). El paso activo muestra la ayuda "En curso".
 *
 * Accesibilidad: <ol> con role="list"; el paso activo lleva aria-current="step".
 * La barra de progreso es role="progressbar" con aria-valuenow/max y texto visible.
 * Los pasos clicables son <button>; los no clicables, <li> estáticos.
 * ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function create(cfg) {
    cfg = cfg || {};
    var steps = cfg.steps || [];
    var current = cfg.current || 1;
    var allowFuture = cfg.allowFuture === true;

    var wrap = el('div', 'zt-stepper-wrap');

    // Cabecera de progreso: da contexto inmediato ("¿cuánto me falta?").
    if (cfg.showProgress !== false && steps.length) {
      var done = Math.min(Math.max(current - 1, 0), steps.length);
      var prog = el('div', 'zt-stepper__progress');
      var row = el('div', 'zt-stepper__progress-row');
      var t1 = el('span', 'zt-stepper__progress-title'); t1.textContent = 'Tu progreso';
      var t2 = el('span', 'zt-stepper__progress-count');
      t2.textContent = 'Paso ' + Math.min(current, steps.length) + ' de ' + steps.length;
      row.appendChild(t1); row.appendChild(t2);
      var bar = el('div', 'zt-stepper__bar');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Pasos completados');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(steps.length));
      bar.setAttribute('aria-valuenow', String(done));
      bar.setAttribute('aria-valuetext', done + ' de ' + steps.length + ' pasos completados');
      var fill = el('span', 'zt-stepper__bar-fill');
      fill.style.width = Math.round((done / steps.length) * 100) + '%';
      bar.appendChild(fill);
      prog.appendChild(row); prog.appendChild(bar);
      wrap.appendChild(prog);
    }

    var root = el('ol', 'zt-stepper');
    root.setAttribute('role', 'list');

    steps.forEach(function (step, i) {
      var index = i + 1;
      var state = step.state || (
        index < current ? 'completed' :
        index === current ? 'active' : 'future'
      );

      var isActive = state === 'active';
      var isCompleted = state === 'completed';
      var isFuture = state === 'future' || state === 'disabled';
      var clickable = typeof cfg.onSelect === 'function' && (!isFuture || allowFuture) && !isActive;

      var tag = clickable ? 'button' : 'li';
      var item = el(tag, 'zt-step'
        + (isActive ? ' zt-step--active' : '')
        + (isCompleted ? ' zt-step--completed' : '')
        + (isFuture ? ' zt-step--disabled' : '')
        + (clickable ? ' zt-step--clickable' : ''));

      if (clickable) {
        item.type = 'button';
        item.addEventListener('click', function () { cfg.onSelect(index, step); });
      } else {
        item.setAttribute('role', 'listitem');
      }
      if (isActive) item.setAttribute('aria-current', 'step');

      // Badge: número o check si completado
      var badge = el('span', 'zt-step__badge');
      badge.setAttribute('aria-hidden', 'true');
      if (isCompleted) {
        var check = el('span', 'icon icon-check icon-16 gs-inherit');
        badge.appendChild(check);
      } else {
        badge.textContent = String(index);
      }
      item.appendChild(badge);

      // Label (+ ayuda "En curso" en el paso activo)
      var text = el('span', 'zt-step__text');
      var label = el('span', 'zt-step__label');
      label.textContent = step.label || ('Paso ' + index);
      text.appendChild(label);
      if (isActive) {
        var hint = el('span', 'zt-step__hint');
        hint.textContent = step.hint || 'En curso';
        text.appendChild(hint);
      }
      item.appendChild(text);

      root.appendChild(item);
    });

    wrap.appendChild(root);
    return wrap;
  }

  function render(container, cfg) {
    if (!container) return null;
    container.innerHTML = '';
    var node = create(cfg);
    container.appendChild(node);
    return node;
  }

  global.ZTStepper = { create: create, render: render };
})(window);
