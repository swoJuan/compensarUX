/* ============================================================
 * simulador.js — Ventanita flotante de simulación (ZT · Historia clínica)
 * ------------------------------------------------------------
 * Solo para validar el prototipo; no es parte del producto. Permite:
 *   - abrir cada mensaje modal (duplicada, error, ya gestionada) sin llenar el formulario
 *   - elegir qué pasa al confirmar la solicitud
 *   - ver "Mis solicitudes" con y sin solicitudes
 *   - probar un escenario aleatorio
 * Se puede arrastrar desde el encabezado (queda abajo a la izquierda por defecto para no
 * tapar el botón "Confirmar" del drawer, que vive a la derecha).
 * El escenario se guarda en sessionStorage (HC.sim) y aplica a las tres pantallas.
 *
 * Requiere: hc-mock.js (HC) y mensajes.js (HCMensajes). Todo el texto con textContent.
 * ============================================================ */
(function () {
  'use strict';

  var KEY_OPEN = 'zt-hc-sim-open';
  var KEY_POS = 'zt-hc-sim-pos';
  var RESULTADOS = [
    ['ok', 'Solicitud radicada'],
    ['dup', 'Solicitud duplicada'],
    ['error', 'Error del servicio'],
    ['gestionada', 'Ya gestionada']
  ];
  var LISTAS = [['datos', 'Con solicitudes'], ['vacio', 'Sin solicitudes']];
  var MENSAJES = [
    ['dup', 'Solicitud duplicada'],
    ['error', 'No fue posible realizar la solicitud'],
    ['gestionada', 'Solicitud ya gestionada']
  ];

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(name, size) {
    var s = el('span', 'icon ' + name + ' icon-' + size + ' gs-inherit');
    s.setAttribute('aria-hidden', 'true');
    return s;
  }
  function label(list, key) {
    for (var i = 0; i < list.length; i++) if (list[i][0] === key) return list[i][1];
    return key;
  }
  // Cerrado por defecto: el panel tapaba el menú (escritorio) y el formulario (móvil).
  // Solo se abre si el usuario lo abrió antes en esta sesión.
  function readOpen() { try { return sessionStorage.getItem(KEY_OPEN) === '1'; } catch (e) { return false; } }
  function writeOpen(v) { try { sessionStorage.setItem(KEY_OPEN, v ? '1' : '0'); } catch (e) {} }

  var onMisPage = /mis-solicitudes\.html$/.test(window.location.pathname);

  /* ── Estructura ── */
  var root = el('div', 'hc-sim');
  root.setAttribute('role', 'complementary');
  root.setAttribute('aria-label', 'Simulación del prototipo');

  var toggle = el('button', 'hc-sim__toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'hc-sim-panel');
  toggle.appendChild(icon('icon-gear', 20));
  toggle.appendChild(document.createTextNode(' Simulación'));

  var panel = el('div', 'hc-sim__panel');
  panel.id = 'hc-sim-panel';

  var head = el('div', 'hc-sim__head');
  head.appendChild(el('h2', 'hc-sim__title', 'Simulación'));
  var min = el('button', 'hc-sim__min');
  min.type = 'button';
  min.setAttribute('aria-label', 'Minimizar simulación');
  min.appendChild(icon('icon-caret-down', 20));
  head.appendChild(min);
  panel.appendChild(head);

  panel.appendChild(el('p', 'hc-sim__hint',
    'Solo para validar el prototipo. Abre los mensajes directamente o cambia lo que pasa al confirmar.'));

  // Ver mensajes
  var fMsg = el('fieldset', 'hc-sim__group');
  fMsg.appendChild(el('legend', null, 'Ver mensajes'));
  MENSAJES.forEach(function (m) {
    var b = el('button', 'hc-sim__btn', m[1]);
    b.type = 'button';
    b.addEventListener('click', function () { HCMensajes.show(m[0]); });
    fMsg.appendChild(b);
  });
  panel.appendChild(fMsg);

  // Radios (resultado / lista)
  function radioGroup(legend, name, options, current, onChange) {
    var f = el('fieldset', 'hc-sim__group');
    f.appendChild(el('legend', null, legend));
    options.forEach(function (o) {
      var l = el('label', 'hc-sim__radio');
      var i = el('input');
      i.type = 'radio'; i.name = name; i.value = o[0]; i.checked = o[0] === current;
      i.addEventListener('change', function () { onChange(o[0]); });
      l.appendChild(i);
      l.appendChild(el('span', null, o[1]));
      f.appendChild(l);
    });
    return f;
  }

  var state = HC.sim();
  var status = el('p', 'hc-sim__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function sayScenario(prefix) {
    var s = HC.sim();
    status.textContent = (prefix ? prefix + ' ' : '') + 'Al confirmar: ' + label(RESULTADOS, s.result).toLowerCase() +
      ' · Mis solicitudes: ' + label(LISTAS, s.lista).toLowerCase() + '.';
  }

  var gRes = radioGroup('Resultado al confirmar', 'hc-sim-result', RESULTADOS, state.result, function (v) {
    HC.setSim({ result: v }); sayScenario('');
  });
  var gLista = radioGroup('Mis solicitudes', 'hc-sim-lista', LISTAS, state.lista, function (v) {
    HC.setSim({ lista: v }); sayScenario('');
  });
  panel.appendChild(gRes);
  panel.appendChild(gLista);

  if (!onMisPage) {
    var go = el('a', 'hc-sim__link', 'Ver Mis solicitudes');
    go.href = 'mis-solicitudes.html';
    go.appendChild(document.createTextNode(' '));
    go.appendChild(icon('icon-arrow-right', 16));
    gLista.appendChild(go);
  }

  // Escenario aleatorio
  var rnd = el('button', 'hc-sim__random', 'Escenario aleatorio');
  rnd.type = 'button';
  rnd.addEventListener('click', function () {
    var cur = HC.sim(), next, tries = 0;
    do {
      next = {
        result: RESULTADOS[Math.floor(Math.random() * RESULTADOS.length)][0],
        lista: LISTAS[Math.floor(Math.random() * LISTAS.length)][0]
      };
      tries++;
    } while (tries < 10 && next.result === cur.result && next.lista === cur.lista);
    HC.setSim(next);
    Array.prototype.forEach.call(panel.querySelectorAll('input[name="hc-sim-result"]'), function (i) { i.checked = i.value === next.result; });
    Array.prototype.forEach.call(panel.querySelectorAll('input[name="hc-sim-lista"]'), function (i) { i.checked = i.value === next.lista; });
    sayScenario('Escenario nuevo.');
  });
  panel.appendChild(rnd);
  panel.appendChild(status);

  var reset = el('button', 'hc-sim__reset', 'Reiniciar prototipo');
  reset.type = 'button';
  reset.addEventListener('click', function () { HC.reset(); window.location.reload(); });
  panel.appendChild(reset);

  root.appendChild(toggle);
  root.appendChild(panel);
  document.body.appendChild(root);

  /* ── Abrir / minimizar ── */
  function setOpen(open, focusIt) {
    panel.hidden = !open;
    toggle.hidden = open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    writeOpen(open);
    if (focusIt) (open ? min : toggle).focus();
  }
  toggle.addEventListener('click', function () { setOpen(true, true); });
  min.addEventListener('click', function () { setOpen(false, true); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false, true); }
  });
  setOpen(readOpen(), false);
  sayScenario('');

  /* ── Arrastrar desde el encabezado (posición = left / bottom, se recuerda en la sesión) ── */
  function clampPos(left, bottom) {
    var r = root.getBoundingClientRect();
    return {
      left: Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - r.width - 8)),
      bottom: Math.min(Math.max(bottom, 8), Math.max(8, window.innerHeight - r.height - 8))
    };
  }
  function applyPos(pos) {
    root.style.left = pos.left + 'px';
    root.style.bottom = pos.bottom + 'px';
  }
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY_POS));
    if (saved) applyPos(clampPos(saved.left, saved.bottom));
  } catch (e) { /* sin posición guardada */ }

  var drag = null;
  head.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button')) return;
    var r = root.getBoundingClientRect();
    drag = { x: e.clientX, y: e.clientY, left: r.left, bottom: window.innerHeight - r.bottom, id: e.pointerId };
    head.setPointerCapture(e.pointerId);
    root.classList.add('is-dragging');
  });
  head.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    applyPos(clampPos(drag.left + (e.clientX - drag.x), drag.bottom - (e.clientY - drag.y)));
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    root.classList.remove('is-dragging');
    var r = root.getBoundingClientRect();
    try { sessionStorage.setItem(KEY_POS, JSON.stringify({ left: r.left, bottom: window.innerHeight - r.bottom })); } catch (err) {}
  }
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', function () {
    var r = root.getBoundingClientRect();
    applyPos(clampPos(r.left, window.innerHeight - r.bottom));
  });
})();
