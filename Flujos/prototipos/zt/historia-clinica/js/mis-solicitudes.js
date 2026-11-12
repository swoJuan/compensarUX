/* ============================================================
 * mis-solicitudes.js — Pantalla "Mis solicitudes" (ZT · Historia clínica)
 * ------------------------------------------------------------
 * Estados: En proceso (listado) · Sin solicitudes (?vacio=1 o desde el simulador flotante).
 * Cada solicitud: Radicado (en proceso) · Gestionado (descargable) · Rechazado (con motivo).
 * Todo el texto se inserta con textContent (sin innerHTML con datos).
 * ============================================================ */
(function () {
  'use strict';

  var wrap = document.getElementById('hc-list-wrap');
  var params = new URLSearchParams(window.location.search);

  var ESTADOS = {
    radicado:   { label: 'Radicado',   cls: 'mp-badge--warning' },
    gestionado: { label: 'Gestionado', cls: 'mp-badge--success' },
    rechazado:  { label: 'Rechazado',  cls: 'mp-badge--error' }
  };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(name, size, color) {
    var s = el('span', 'icon ' + name + ' icon-' + (size || 20) + ' ' + (color || 'gs-inherit'));
    s.setAttribute('aria-hidden', 'true');
    return s;
  }
  function fact(label, value) {
    var d = el('div', 'hc-req__fact');
    d.appendChild(el('dt', 'hc-req__label', label));
    d.appendChild(el('dd', 'hc-req__value', value));
    return d;
  }

  /* ── Aviso de vigencia ── */
  function buildNotice() {
    var a = el('div', 'zt-alert zt-alert--info');
    a.setAttribute('role', 'note');
    var ai = icon('icon-info', 32);
    ai.classList.add('zt-alert__icon');
    a.appendChild(ai);
    var c = el('div', 'zt-alert__content');
    var p = el('p', 'zt-alert__desc');
    p.appendChild(document.createTextNode('Las historias clínicas del listado solo estarán visibles durante '));
    p.appendChild(el('strong', null, '30 días'));
    p.appendChild(document.createTextNode(' desde tu solicitud.'));
    c.appendChild(p);
    a.appendChild(c);
    return a;
  }

  /* ── Tarjeta de solicitud ── */
  function buildCard(s) {
    var st = ESTADOS[s.estado] || ESTADOS.radicado;
    var art = el('article', 'hc-req hc-req--' + s.estado);
    art.setAttribute('aria-label', 'Solicitud ' + s.id + ', ' + st.label);

    var head = el('div', 'hc-req__head');
    var idBox = el('div');
    idBox.appendChild(el('p', 'hc-req__label', 'NÚMERO DE RADICADO'));
    idBox.appendChild(el('p', 'hc-req__id', s.id));
    var badge = el('span', 'mp-badge ' + st.cls);
    badge.appendChild(el('span', 'mp-badge__label', st.label));
    head.appendChild(idBox);
    head.appendChild(badge);
    art.appendChild(head);

    var dl = el('dl', 'hc-req__facts');
    dl.appendChild(fact('FECHA DE RADICACIÓN', HC.fmt(s.fecha)));
    dl.appendChild(fact('SERVICIOS', s.servicios.join(', ')));
    dl.appendChild(fact('PERIODO SOLICITADO', HC.fmt(s.desde) + ' – ' + HC.fmt(s.hasta)));
    art.appendChild(dl);

    if (s.estado === 'gestionado') {
      var act = el('div', 'hc-req__actions');
      var btn = el('button', 'mp-btn mp-btn--secundario');
      btn.type = 'button';
      btn.appendChild(icon('icon-download-simple', 20));
      btn.appendChild(document.createTextNode(' Descargar historia clínica'));
      btn.addEventListener('click', function () {
        // Prototipo: no se genera archivo real
        ZTModal.open({
          type: 'success',
          title: 'Descarga iniciada',
          body: 'Tu historia clínica de la solicitud ' + s.id + ' se está descargando.',
          primaryAction: { label: 'Entendido', onClick: function () { ZTModal.close(); } }
        });
      });
      act.appendChild(btn);
      art.appendChild(act);
    }

    if (s.estado === 'rechazado') {
      var note = el('div', 'hc-req__reason');
      note.appendChild(el('strong', null, 'Motivo del rechazo: '));
      note.appendChild(document.createTextNode(s.motivo || 'No disponible.'));
      art.appendChild(note);
    }
    return art;
  }

  /* ── Ayuda ── */
  function buildHelp() {
    var a = el('aside', 'hc-help');
    a.setAttribute('aria-label', 'Ayuda');
    var q = icon('icon-question', 24, 'gs-violet');
    q.classList.add('hc-help__icon');
    a.appendChild(q);
    var t = el('div', 'hc-help__text');
    t.appendChild(el('p', 'hc-help__title', '¿Necesitas ayuda con tu historia clínica?'));
    t.appendChild(el('p', 'hc-help__desc', 'Conoce quién puede solicitarla, qué documentos necesitas y otros canales.'));
    a.appendChild(t);
    // [PENDIENTE] Destino de "Más información" no definido en Figma
    var b = el('button', 'hc-help__link');
    b.type = 'button';
    b.setAttribute('aria-disabled', 'true');
    b.appendChild(document.createTextNode('Más información '));
    b.appendChild(icon('icon-arrow-right', 16));
    a.appendChild(b);
    return a;
  }

  /* ── Estado vacío ── */
  function buildEmpty() {
    var s = el('section', 'hc-card hc-card--empty');
    s.setAttribute('aria-labelledby', 'hc-empty-title');
    var ic = el('span', 'hc-card__icon');
    ic.setAttribute('aria-hidden', 'true');
    ic.appendChild(icon('icon-medical-file', 32, 'gs-violet'));
    s.appendChild(ic);
    var h = el('h2', 'hc-card__title', 'Aún no tienes solicitudes de historia clínica');
    h.id = 'hc-empty-title';
    s.appendChild(h);
    s.appendChild(el('p', 'hc-card__desc',
      'Cuando realices una solicitud, podrás consultar aquí su estado y descargarla cuando esté disponible.'));
    var a = el('a', 'mp-btn mp-btn--primario', 'Nueva solicitud');
    a.href = 'index.html';
    s.appendChild(a);
    return s;
  }

  /* ── Título del listado + cantidad ── */
  function buildListHead(n) {
    var head = el('div', 'hc-list-head');
    var h = el('h2', 'hc-list-head__title', 'Listado de solicitudes');
    h.id = 'hc-list-title';
    head.appendChild(h);
    head.appendChild(el('p', 'hc-list-head__count', n + (n === 1 ? ' solicitud' : ' solicitudes')));
    return head;
  }

  /* ── Render ── (se repite cuando el simulador cambia el escenario) */
  function render() {
    wrap.textContent = '';
    var empty = params.get('vacio') === '1' || HC.sim().lista === 'vacio';
    var items = empty ? [] : HC.list();
    if (!items.length) {
      wrap.appendChild(buildEmpty());
      return;
    }
    wrap.appendChild(buildNotice());
    wrap.appendChild(buildListHead(items.length));
    var list = el('div', 'hc-req-list');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-labelledby', 'hc-list-title');
    items.forEach(function (s) { list.appendChild(buildCard(s)); });
    wrap.appendChild(list);
    wrap.appendChild(buildHelp());
  }
  render();
  document.addEventListener('hc:sim-change', render);
})();
