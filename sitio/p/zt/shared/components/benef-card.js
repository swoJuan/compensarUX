/* ============================================================
 * benef-card.js — API del componente transversal ZT "Beneficiary / Expandable Person Card"
 * ------------------------------------------------------------
 * Renderiza UNA persona de una lista editable. El MISMO componente sirve para el
 * estado colapsado y el expandido/edición (según `expanded`). Estilos en benef-card.css.
 * No crear cards por índice: parametrizar `number`, `name`, `relationship`, `status`.
 *
 * Accesibilidad:
 *   - El título es un heading (`<h4>`) con id → la lista es navegable por encabezados.
 *   - El botón de alternar (Editar/Cerrar) es el control de expansión: lleva
 *     `aria-expanded` y `aria-controls` apuntando al id del cuerpo (formulario).
 *   - Cada acción tiene nombre accesible ÚNICO (incluye "Beneficiario N — Nombre"),
 *     para que un lector de pantalla distinga a quién afecta.
 *   - Los botones exponen accesores para gestionar el foco desde el flujo.
 *
 * API:
 *   ZTBenefCard.create({
 *     number, name, relationship,
 *     status:   "pending" | "complete",
 *     expanded: true|false,
 *     missing:  ["Fecha de nacimiento", ...],  // resumen de faltantes (colapsada, pending)
 *     body:     HTMLElement,                    // formulario (slot expandido)
 *     onEdit, onClose, onDelete
 *   }) -> {
 *     el, bodyId,
 *     setStatus(s), setExpanded(b), setHeader({number,name,relationship}),
 *     setMissing(arr), getBody(), getToggleBtn(), getDeleteBtn()
 *   }
 *
 * Estado: chip con icono + texto (nunca solo color). pending → reloj / tokens warning;
 * complete → check / tokens success. La card refleja el estado (.is-pending/.is-complete).
 * ============================================================ */
(function (global) {
  'use strict';

  var BADGE = {
    pending:  { icon: 'icon-clock',        label: 'Pendiente' },
    complete: { icon: 'icon-check-circle', label: 'Completo' }
  };

  var seq = 0;
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function create(cfg) {
    cfg = cfg || {};
    var status = cfg.status === 'complete' ? 'complete' : 'pending';
    var expanded = !!cfg.expanded;
    var uidn = 'ztbc-' + (++seq);
    var bodyId = uidn + '-body';
    var titleId = uidn + '-title';

    var card = el('div', 'zt-benef-card is-' + status + (expanded ? ' is-expanded' : ''));

    // ── Encabezado ──
    // [avatar]  Nombre (h4)            [chip estado]      [Eliminar] [Editar ✎ | Cerrar ^]
    //           Beneficiario N · Parentesco
    var head = el('div', 'zt-benef-card__head');

    var avatar = el('span', 'zt-benef-card__avatar');
    avatar.setAttribute('aria-hidden', 'true');
    var icon = el('span', 'icon icon-user icon-24 gs-inherit');
    avatar.appendChild(icon);

    var idBox = el('div', 'zt-benef-card__id');
    var titleRow = el('div', 'zt-benef-card__title-row');
    // Título como heading real (navegable por lectores de pantalla).
    var title = el('h4', 'zt-benef-card__title');
    title.id = titleId;
    var badge = el('span', 'zt-benef-card__status');
    var badgeIcon = el('span', 'icon icon-16 gs-inherit');
    badgeIcon.setAttribute('aria-hidden', 'true');
    var badgeText = el('span');
    badge.appendChild(badgeIcon);
    badge.appendChild(badgeText);
    titleRow.appendChild(title);
    titleRow.appendChild(badge);

    // Línea secundaria: "Beneficiario N · Parentesco".
    var meta = el('p', 'zt-benef-card__meta');

    function headerName() {
      var base = 'Beneficiario ' + (cfg.number || '');
      return cfg.name ? (base.trim() + ' — ' + cfg.name) : base.trim();
    }
    function renderTitle() {
      // Sin nombre aún → título neutro y la línea meta invita a completar.
      title.textContent = cfg.name || 'Nuevo beneficiario';
      title.classList.toggle('is-placeholder', !cfg.name);
      var parts = ['Beneficiario ' + (cfg.number || '')];
      if (cfg.relationship) parts.push(cfg.relationship);
      meta.textContent = parts.join(' · ');
      updateActionLabels();
    }
    function renderBadge() {
      var b = BADGE[status];
      card.classList.toggle('is-pending', status === 'pending');
      card.classList.toggle('is-complete', status === 'complete');
      badge.className = 'zt-benef-card__status zt-benef-card__status--' + status;
      badgeIcon.className = 'icon ' + b.icon + ' icon-16 gs-inherit';
      badgeText.textContent = b.label;
    }

    idBox.appendChild(titleRow);
    idBox.appendChild(meta);

    // ── Acciones ──
    // Eliminar: acción destructiva SECUNDARIA (texto discreto, rojo en hover).
    // Editar/Cerrar: acción principal de la card (botón con borde + icono).
    var actions = el('div', 'zt-benef-card__actions');

    var delBtn = el('button', 'zt-benef-card__action zt-benef-card__action--delete');
    delBtn.type = 'button';
    delBtn.textContent = 'Eliminar';
    delBtn.addEventListener('click', function () { if (cfg.onDelete) cfg.onDelete(); });

    // Editar (colapsada) / Cerrar (expandida). Es el control de expansión.
    var toggleBtn = el('button', 'zt-benef-card__action');
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-controls', bodyId);
    function renderToggle() {
      var isOpen = card.classList.contains('is-expanded');
      toggleBtn.className = 'zt-benef-card__action zt-benef-card__action--toggle ' +
        (isOpen ? 'zt-benef-card__action--close' : 'zt-benef-card__action--edit');
      toggleBtn.innerHTML = '';
      var lbl = el('span'); lbl.textContent = isOpen ? 'Cerrar' : 'Editar';
      var ic = el('span', 'icon ' + (isOpen ? 'icon-caret-up' : 'icon-pencil-simple') + ' icon-20 gs-inherit');
      ic.setAttribute('aria-hidden', 'true');
      toggleBtn.appendChild(lbl);
      toggleBtn.appendChild(ic);
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      updateActionLabels();
    }
    function updateActionLabels() {
      var who = headerName();
      delBtn.setAttribute('aria-label', 'Eliminar ' + who);
      var isOpen = card.classList.contains('is-expanded');
      toggleBtn.setAttribute('aria-label', (isOpen ? 'Cerrar ' : 'Editar ') + who);
    }
    toggleBtn.addEventListener('click', function () {
      if (card.classList.contains('is-expanded')) { if (cfg.onClose) cfg.onClose(); }
      else { if (cfg.onEdit) cfg.onEdit(); }
    });

    actions.appendChild(delBtn);
    actions.appendChild(toggleBtn);

    head.appendChild(avatar);
    head.appendChild(idBox);
    head.appendChild(actions);
    card.appendChild(head);

    // ── Microcopy de faltantes (solo colapsada + pending) ──
    var missingEl = el('p', 'zt-benef-card__missing');
    missingEl.hidden = true;
    card.appendChild(missingEl);
    function renderMissing() {
      var arr = cfg.missing || [];
      var showable = !card.classList.contains('is-expanded') && status === 'pending' && arr.length > 0;
      if (showable) {
        var label = (arr.length === 1) ? ('Falta: ' + arr[0]) : ('Faltan ' + arr.length + ' campos: ' + arr.join(', '));
        missingEl.innerHTML = '';
        var mi = el('span', 'icon icon-warning-circle icon-16 gs-inherit');
        mi.setAttribute('aria-hidden', 'true');
        var mt = el('span'); mt.textContent = label;
        missingEl.appendChild(mi); missingEl.appendChild(mt);
        missingEl.hidden = false;
      } else {
        missingEl.textContent = '';
        missingEl.hidden = true;
      }
    }

    // ── Cuerpo (formulario) de la vista expandida ──
    var body = el('div', 'zt-benef-card__body');
    body.id = bodyId;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-labelledby', titleId);
    if (cfg.body) body.appendChild(cfg.body);
    card.appendChild(body);

    // Render inicial
    renderTitle();
    renderBadge();
    renderToggle();
    renderMissing();

    // ── API de instancia ──
    function setStatus(s) { status = (s === 'complete' ? 'complete' : 'pending'); renderBadge(); renderMissing(); }
    function setExpanded(b) {
      card.classList.toggle('is-expanded', !!b);
      renderToggle();
      renderMissing();
    }
    function setHeader(h) {
      h = h || {};
      if (h.number != null) cfg.number = h.number;
      if (h.name != null) cfg.name = h.name;
      if (h.relationship != null) cfg.relationship = h.relationship;
      renderTitle();
    }
    function setMissing(arr) { cfg.missing = arr || []; renderMissing(); }

    return {
      el: card,
      bodyId: bodyId,
      setStatus: setStatus,
      setExpanded: setExpanded,
      setHeader: setHeader,
      setMissing: setMissing,
      getBody: function () { return body; },
      getToggleBtn: function () { return toggleBtn; },
      getDeleteBtn: function () { return delBtn; }
    };
  }

  global.ZTBenefCard = { create: create };
})(window);
