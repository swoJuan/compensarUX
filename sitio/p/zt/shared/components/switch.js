/* ============================================================
 * switch.js — API del componente transversal ZT "Switch"
 * ------------------------------------------------------------
 * Crea un interruptor booleano accesible (role="switch"). Estilos en switch.css.
 * Es GENERAL: úsalo en cualquier flujo ZT que necesite un toggle on/off. No
 * crear switches exclusivos por pantalla.
 *
 * API:
 *   ZTSwitch.create({
 *     checked:   false,                 // estado inicial (def. false)
 *     disabled:  false,                 // no interactivo (def. false)
 *     ariaLabel: "Descripción del control",  // obligatorio si no hay label visible
 *     labelledBy: "id-del-label",       // alternativa: id del texto que lo describe
 *     onChange:  function (checked) {}  // se dispara al cambiar
 *   }) -> HTMLButtonElement (con .isChecked() / .setChecked(v) / .setDisabled(v))
 *
 *   ZTSwitch.renderRow(container, {
 *     label: "¿El contratante es beneficiario del plan?",  // texto visible a la izquierda
 *     ...opciones de create()
 *   }) -> { row, input, isChecked, setChecked, setDisabled }
 *
 * Accesibilidad:
 *   - <button role="switch" aria-checked>. Enter/Space alternan (nativo del button).
 *   - Requiere nombre accesible: `label` (renderRow), `ariaLabel` o `labelledBy`.
 * ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function create(cfg) {
    cfg = cfg || {};
    var btn = el('button', 'zt-switch');
    btn.type = 'button';
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', cfg.checked ? 'true' : 'false');
    if (cfg.ariaLabel) btn.setAttribute('aria-label', cfg.ariaLabel);
    if (cfg.labelledBy) btn.setAttribute('aria-labelledby', cfg.labelledBy);
    if (cfg.disabled) btn.disabled = true;

    var knob = el('span', 'zt-switch__knob');
    knob.setAttribute('aria-hidden', 'true');
    btn.appendChild(knob);

    function isChecked() { return btn.getAttribute('aria-checked') === 'true'; }
    function setChecked(v, silent) {
      btn.setAttribute('aria-checked', v ? 'true' : 'false');
      if (!silent && typeof cfg.onChange === 'function') cfg.onChange(!!v);
    }
    function setDisabled(v) { btn.disabled = !!v; }

    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      setChecked(!isChecked());   // dispara onChange
    });

    btn.isChecked = isChecked;
    btn.setChecked = setChecked;
    btn.setDisabled = setDisabled;
    return btn;
  }

  // Fila completa: label visible (izquierda) + switch (derecha).
  function renderRow(container, cfg) {
    cfg = cfg || {};
    container.innerHTML = '';
    var row = el('div', 'zt-switch-row');

    var labelId = 'zt-switch-lbl-' + Math.random().toString(36).slice(2, 8);
    var label = el('span', 'zt-switch-row__label');
    label.id = labelId;
    label.textContent = cfg.label || '';

    var input = create(Object.assign({}, cfg, { labelledBy: cfg.label ? labelId : cfg.labelledBy }));

    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);

    return {
      row: row,
      input: input,
      isChecked: input.isChecked,
      setChecked: input.setChecked,
      setDisabled: input.setDisabled
    };
  }

  global.ZTSwitch = { create: create, renderRow: renderRow };
})(window);
