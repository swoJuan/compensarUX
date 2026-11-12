/* ============================================================
 * paso-8.js — PASO 8 "Soportes" (ZT) · paso final del proceso
 * ------------------------------------------------------------
 * Figma 258:28007. Mejoras UX sobre el diseño:
 *   - Documentos AGRUPADOS POR PERSONA (acordeón, una abierta a la vez) con
 *     estado "Completo" / "Faltan N" — el Figma listaba un solo bloque aunque
 *     el texto pide los soportes "de cada persona afiliada".
 *   - Barra global "N de M documentos obligatorios cargados".
 *   - Documentos por persona:
 *       · Identificación *      → hasta 2 archivos (ambas caras). Menores:
 *                                 registro civil o tarjeta de identidad.
 *       · Certificado EPS *
 *       · Certificado de antigüedad y preexistencias * → SOLO si en el Paso 3
 *         la persona convalida antigüedad con otra prepagada (se dice por qué).
 *       · Pólizas (opcional)
 *     Contratante que NO es beneficiario → solo Identificación.
 *   - Los soportes NO bloquean el cierre (alerta del Figma: "pueden
 *     completarse antes o después del pago"). Si faltan, un modal lista lo
 *     pendiente y permite "Finalizar de todos modos" o "Seguir cargando".
 *   - Al finalizar: confirmación en la misma card (N.º de solicitud, resumen,
 *     siguiente paso = pago, pendientes). Volver a entrar muestra la
 *     confirmación con opción de cargar los pendientes.
 *
 * Carga de archivos: componente transversal ZTFileUpload (solo metadatos).
 * Persistencia: step8 (sessionStorage).
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ─────────── */
  if (!Z || !Z.isViable()) { window.location.replace('../index.html'); return; }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) { window.location.replace('../paso-1/index.html'); return; }
  var step2 = Z.getStep2();
  if (!step2 || step2.completed !== true || step2.otpVerified !== true) { window.location.replace('../paso-2/index.html'); return; }
  var step3 = Z.getStep3();
  if (!step3 || step3.completed !== true) { window.location.replace('../paso-3/index.html'); return; }
  if (!(Z.getStep4() || {}).completed) { window.location.replace('../paso-4/index.html'); return; }
  if (!(Z.getStep5() || {}).completed) { window.location.replace('../paso-5/index.html'); return; }
  if (!(Z.getStep6() || {}).completed) { window.location.replace('../paso-6/index.html'); return; }
  var step7 = Z.getStep7() || {};
  if (!step7.completed) { window.location.replace('../paso-7/index.html'); return; }

  var candidate = Z.getCandidate();
  var ACCEPT = '.pdf,.jpg,.jpeg';
  var PLAN_LABEL = { ideal: 'Plan Ideal', optimo: 'Plan Óptimo' };

  /* ─────────── Panel lateral ─────────── */
  ZTPersonSummary.render(document.getElementById('pa-cand-summary'), {
    eyebrow: 'Persona a afiliar', variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '', documentType: candidate.documentType, documentNumber: candidate.documentNumber
  });
  var STEPS = [
    { label: 'Iniciar afiliación' }, { label: 'Datos del contratante' },
    { label: 'Beneficiarios' },      { label: 'Estados de salud' },
    { label: 'LVI' }, { label: 'Sarlaft' }, { label: 'Liquidación' }, { label: 'Soportes' }
  ];
  function renderStepper(done) {
    // Terminado: todos los pasos en verde (sin navegación). En curso: pasos completados clicables.
    ZTStepper.render(document.getElementById('pa-stepper'), done ? { current: 9, steps: STEPS } : Z.stepperConfig(8));
  }

  /* ═══════════════ PERSONAS Y DOCUMENTOS ═══════════════ */
  function edad(iso) {
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00'), h = new Date();
    if (isNaN(b.getTime())) return null;
    var e = h.getFullYear() - b.getFullYear();
    if (h.getMonth() < b.getMonth() || (h.getMonth() === b.getMonth() && h.getDate() < b.getDate())) e--;
    return e;
  }
  function relLabel(rel, sex) {
    var f = sex === 'femenino';
    return { conyuge: 'Cónyuge', hijo: f ? 'Hija' : 'Hijo', padre: 'Padre', madre: 'Madre', hermano: f ? 'Hermana' : 'Hermano', otro: 'Otro' }[rel] || 'Beneficiario';
  }
  function docsFor(o) {
    var minor = o.age != null && o.age < 18;
    var list = [{ id: 'id', title: 'Identificación', required: true, max: 2,
      hint: minor ? 'Registro civil o tarjeta de identidad.' : 'Ambas caras del documento (máximo 2 archivos).' }];
    if (o.onlyId) return list;
    list.push({ id: 'eps', title: 'Certificado EPS', required: true, max: 1, hint: 'Certificado de afiliación vigente al régimen contributivo o de excepción.' });
    if (o.seniority) list.push({ id: 'antiguedad', title: 'Certificado de antigüedad y preexistencias', required: true, max: 1,
      hint: 'Porque convalida antigüedad' + (o.seniorityEntity ? ' con ' + o.seniorityEntity : ' con otra entidad') + '. Expedido por la entidad anterior.' });
    list.push({ id: 'polizas', title: 'Pólizas', required: false, max: 3, hint: 'Pólizas vigentes de salud, si las tiene.' });
    return list;
  }
  var F = Z.flow();
  var persons = [];
  var cAge = step2.age != null ? step2.age : edad(step2.birthDate);
  // Inclusión en contrato vigente: los soportes del contratante ya están en el contrato.
  if (F.contractorInProcess) persons.push({ id: 'contratante', name: candidate.name || 'Contratante',
    role: step3.contractorIsBeneficiary ? 'Contratante' : 'Contratante (no beneficiario)', age: cAge,
    onlyId: !step3.contractorIsBeneficiary,
    seniority: step3.contractorValidatesSeniority === true, seniorityEntity: entityLabel(step3.contractorPreviousEntity) });
  (step3.beneficiaries || []).forEach(function (b, i) {
    var age = edad(b.birthDate); if (age == null) age = b.age;
    persons.push({ id: b.id,
      name: [b.firstName, b.secondName, b.firstSurname, b.secondSurname].filter(Boolean).join(' ') || ('Beneficiario ' + (i + 1)),
      role: relLabel(b.relationship, b.identificationSex) + (age != null && age < 18 ? ' (' + age + (age === 1 ? ' año' : ' años') + ')' : ''),
      age: age, seniority: b.validatesOtherPrepaidSeniority === true, seniorityEntity: entityLabel(b.previousPrepaidEntity) });
  });
  persons.forEach(function (p) { p.docs = docsFor(p); });
  function entityLabel(v) {
    if (!v) return '';
    var ENTITY = { colsanitas: 'Colsanitas', colmedica: 'Colmédica', medplus: 'MedPlus', coomeva: 'Coomeva Medicina Prepagada', sura: 'Sura', otra: '' };
    if (ENTITY.hasOwnProperty(v)) return ENTITY[v];
    return String(v).replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ═══════════════ ESTADO ═══════════════ */
  var saved = Z.getStep8() || {};
  var state = {
    completed: !!saved.completed,
    requestId: saved.requestId || null,
    finishedAt: saved.finishedAt || null,
    docs: saved.docs || {},
    open: null,
    editing: false,     // UI: volver a cargar pendientes después de finalizar
    err: {}             // UI: último archivo rechazado por campo
  };
  persons.forEach(function (p) {
    state.docs[p.id] = state.docs[p.id] || {};
    p.docs.forEach(function (d) { if (!Array.isArray(state.docs[p.id][d.id])) state.docs[p.id][d.id] = []; });
  });
  function persist() {
    Z.saveStep8({ completed: state.completed, requestId: state.requestId, finishedAt: state.finishedAt, docs: state.docs });
  }
  function files(pid, did) { return state.docs[pid][did]; }
  function pendingOf(p) { return p.docs.filter(function (d) { return d.required && !files(p.id, d.id).length; }); }
  function counts() {
    var total = 0, done = 0;
    persons.forEach(function (p) { p.docs.forEach(function (d) { if (d.required) { total++; if (files(p.id, d.id).length) done++; } }); });
    return { total: total, done: done };
  }
  var firstPending = persons.filter(function (p) { return pendingOf(p).length; })[0];
  state.open = (firstPending || persons[0]).id;

  /* ═══════════════ HELPERS ═══════════════ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Math.round(n || 0).toLocaleString('es-CO'); }
  function fecha(iso) {
    if (!iso) return '';
    var d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  var liveRegion = document.createElement('div');
  liveRegion.className = 'visually-hidden';
  liveRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(liveRegion);
  function announce(msg) { liveRegion.textContent = ''; window.setTimeout(function () { liveRegion.textContent = msg; }, 30); }
  function infoAlert(title, desc, type) {
    var a = ZTAlert.create({ type: type || 'info', title: title, description: desc });
    a.removeAttribute('role'); a.removeAttribute('aria-live');
    return a.outerHTML;
  }

  /* ═══════════════ RENDER — LISTADO ═══════════════ */
  var body = document.getElementById('p8-body');
  var cta = document.getElementById('p8-cta');

  function progressHTML() {
    var c = counts(), pct = c.total ? Math.round(c.done / c.total * 100) : 100, ok = c.done === c.total;
    return '<div class="p8-progress' + (ok ? ' is-ok' : '') + '" id="p8-progress">' +
      '<div class="p8-progress__row"><span class="p8-progress__title">Listado de documentos</span>' +
      '<span class="p8-progress__label">' + (ok ? '✓ Todos los obligatorios cargados' : c.done + ' de ' + c.total + ' obligatorios cargados') + '</span></div>' +
      '<div class="p8-progress__bar" role="progressbar" aria-label="Documentos obligatorios cargados" aria-valuemin="0" aria-valuemax="' + c.total + '" aria-valuenow="' + c.done + '">' +
      '<span class="p8-progress__fill" style="width:' + pct + '%"></span></div></div>';
  }

  function docHTML(p, d) {
    var list = files(p.id, d.id);
    var base = 'p8-' + p.id + '-' + d.id;
    var err = state.err[base];
    var html = '<div class="p8-doc" data-doc="' + d.id + '">' +
      '<div class="p8-doc__head">' +
        '<span class="p8-doc__title">' + (d.required ? '<span class="mp-input-required" aria-hidden="true">*</span> ' : '') + esc(d.title) +
          (d.required ? '' : ' <em>(opcional)</em>') + '</span>' +
        (list.length ? '<span class="p8-doc__ok">✓ Cargado</span>' : '') +
      '</div>' +
      (d.hint ? '<p class="p8-doc__hint">' + esc(d.hint) + '</p>' : '') +
      '<div class="p8-doc__files">';
    list.forEach(function (f, i) {
      html += ZTFileUpload.html({ id: base + '-' + i, value: f, accept: ACCEPT, attrs: 'data-person="' + p.id + '" data-doc-id="' + d.id + '" data-index="' + i + '"' });
    });
    if (list.length < d.max) {
      var addLabel = list.length ? '<p class="p8-doc__more">Puedes agregar ' + (d.max - list.length === 1 ? 'un archivo más' : 'hasta ' + (d.max - list.length) + ' archivos más') + '.</p>' : '';
      html += addLabel + ZTFileUpload.html({ id: base + '-new', value: null, accept: ACCEPT, attrs: 'data-person="' + p.id + '" data-doc-id="' + d.id + '" data-index="new" aria-label="Adjuntar ' + esc(d.title.toLowerCase()) + ' de ' + esc(p.name) + '"' })
        .replace('class="zt-upload"', 'class="zt-upload' + (err ? ' is-error' : '') + (list.length ? ' is-compact' : '') + '"');
    }
    html += '</div>' + (err ? '<p class="mp-input-error p8-doc__err" role="alert">' + esc(err) + '</p>' : '') + '</div>';
    return html;
  }

  function personHTML(p) {
    var open = state.open === p.id, pend = pendingOf(p).length;
    var status = pend ? '<span class="p8-chip is-pending">' + (pend === 1 ? 'Falta 1' : 'Faltan ' + pend) + '</span>'
      : '<span class="p8-chip is-ok">✓ Completo</span>';
    return '<div class="p8-person' + (open ? ' is-open' : '') + (pend ? '' : ' is-done') + '" data-person-card="' + p.id + '">' +
      '<button type="button" class="p8-person__head" data-act="toggle" aria-expanded="' + open + '" aria-controls="p8-body-' + p.id + '">' +
        '<span class="p8-person__avatar" aria-hidden="true"><span class="icon ' + (pend ? 'icon-user' : 'icon-check') + ' icon-20 gs-inherit"></span></span>' +
        '<span class="p8-person__who"><span class="p8-person__name">' + esc(p.name) + '</span><span class="p8-person__role">' + esc(p.role) + '</span></span>' +
        status +
        '<span class="icon icon-caret-down icon-20 gs-inherit p8-person__caret" aria-hidden="true"></span>' +
      '</button>' +
      (open ? '<div class="p8-person__body" id="p8-body-' + p.id + '">' + p.docs.map(function (d) { return docHTML(p, d); }).join('') + '</div>' : '') +
    '</div>';
  }

  var head = document.querySelector('.pa-card__head');
  function renderList(focusSel) {
    cta.hidden = false; head.hidden = false;
    body.innerHTML =
      infoAlert('Tener en cuenta', 'Los soportes pueden completarse antes o después del pago.') +
      progressHTML() +
      '<div class="p8-people">' + persons.map(personHTML).join('') + '</div>';
    if (focusSel) {
      var el = body.querySelector(focusSel);
      if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  /* ═══════════════ EVENTOS — LISTADO ═══════════════ */
  ZTFileUpload.bind(body, function (input, meta, err) {
    var pid = input.getAttribute('data-person'), did = input.getAttribute('data-doc-id'), idx = input.getAttribute('data-index');
    var base = 'p8-' + pid + '-' + did, list = files(pid, did);
    var d = persons.filter(function (p) { return p.id === pid; })[0].docs.filter(function (x) { return x.id === did; })[0];
    if (err) { state.err[base] = err; renderList('#' + base + '-new'); announce(err); return; }
    delete state.err[base];
    if (meta) {
      list.push(meta);
      announce(d.title + ': ' + meta.name + ' cargado.');
    } else if (idx !== 'new') {
      var gone = list.splice(+idx, 1)[0];
      announce(d.title + ': ' + (gone ? gone.name : 'archivo') + ' eliminado.');
    }
    state.completed = false; persist();
    renderList();
    // Foco: tras cargar → acción "Eliminar" del archivo nuevo; tras eliminar → zona de carga.
    var target = meta ? document.getElementById(base + '-' + (list.length - 1)) : document.getElementById(base + '-new');
    if (target) {
      var g = target.closest('[data-zt-upload]');
      var f = meta ? g.querySelector('[data-zt-upload-remove]') : target;
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    }
  });
  body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="toggle"]');
    if (!b) return;
    var pid = b.closest('[data-person-card]').getAttribute('data-person-card');
    state.open = state.open === pid ? null : pid;
    renderList('[data-person-card="' + pid + '"] [data-act="toggle"]');
    var card = body.querySelector('[data-person-card="' + pid + '"]');
    if (card && state.open) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ═══════════════ FINALIZAR ═══════════════ */
  function pendingList() {
    return persons.map(function (p) { return { p: p, docs: pendingOf(p) }; }).filter(function (x) { return x.docs.length; });
  }
  function finish() {
    state.completed = true;
    state.editing = false;
    state.finishedAt = new Date().toISOString();
    // Radicar (o actualizar el radicado si se vuelven a cargar soportes): queda
    // visible en "Mis radicados" con su estado.
    var pend = pendingList();
    var n = pend.reduce(function (acc, x) { return acc + x.docs.length; }, 0);
    var d = new Date(), hoy = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var rad = {
      type: F.isInclusion ? 'Inclusión de beneficiario' : 'Afiliación cotizante',
      name: candidate.name, doc: candidate.documentType + ' ' + candidate.documentNumber,
      updatedAt: hoy,
      status: n ? 'pend_doc' : 'pend_pago',
      plan: PLAN_LABEL[step1.plan] || 'Plan',
      persons: persons.filter(function (p) { return !p.onlyId; }).length,
      total: (step7.totals || {}).total || 0,
      note: n ? (n === 1 ? 'Falta 1 soporte obligatorio.' : 'Faltan ' + n + ' soportes obligatorios.') : 'Enlace de pago enviado al contratante.',
      source: 'flujo'
    };
    if (state.requestId) rad.id = state.requestId; else rad.createdAt = hoy;
    state.requestId = Z.saveRadicado(rad).id;
    persist();
    renderDone();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.getElementById('p8-next').addEventListener('click', function () {
    var pend = pendingList();
    if (!pend.length) { finish(); return; }
    var n = pend.reduce(function (s, x) { return s + x.docs.length; }, 0);
    var content = document.createElement('div');
    var p1 = document.createElement('p');
    p1.textContent = 'Puedes finalizar la afiliación ahora y cargarlos después del pago. Estos son los pendientes:';
    content.appendChild(p1);
    var ul = document.createElement('ul');
    pend.forEach(function (x) {
      var li = document.createElement('li');
      li.innerHTML = '<strong>' + esc(x.p.name) + ':</strong> ' + x.docs.map(function (d) { return esc(d.title); }).join(', ');
      ul.appendChild(li);
    });
    content.appendChild(ul);
    ZTModal.open({
      type: 'warning', align: 'left',
      title: n === 1 ? 'Falta 1 soporte obligatorio' : 'Faltan ' + n + ' soportes obligatorios',
      content: content,
      primaryAction: { label: 'Finalizar de todos modos', onClick: function () { ZTModal.close(); finish(); } },
      secondaryAction: { label: 'Seguir cargando', onClick: function () {
        ZTModal.close();
        state.open = pend[0].p.id; renderList();
        var first = body.querySelector('[data-person-card="' + state.open + '"] .zt-upload:not(.is-filled) .zt-upload__input');
        var card = body.querySelector('[data-person-card="' + state.open + '"]');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      } }
    });
  });
  document.getElementById('p8-back').addEventListener('click', function () {
    if (state.editing) { state.editing = false; renderDone(); return; }
    persist(); window.location.href = '../paso-7/index.html';
  });

  /* ═══════════════ RENDER — CONFIRMACIÓN ═══════════════ */
  function renderDone() {
    renderStepper(true);
    cta.hidden = true; head.hidden = true;   // la confirmación trae su propio título
    var pend = pendingList();
    var n = pend.reduce(function (s, x) { return s + x.docs.length; }, 0);
    var t = step7.totals || {};
    var anual = step7.modality === 'anual';
    body.innerHTML = '';
    var result = ZTStatusResult.create({
      type: 'success',
      title: 'Afiliación registrada',
      description: 'La solicitud quedó creada. El siguiente paso es el pago de la primera cuota.',
      status: n ? 'Pendiente de pago y soportes' : 'Pendiente de pago'
    });
    body.appendChild(result);

    var wrap = document.createElement('div');
    wrap.className = 'p8-done';
    wrap.innerHTML =
      '<dl class="p8-done__grid">' +
        item('N.º de radicado', '<strong class="p8-done__id">' + esc(state.requestId) + '</strong>') +
        item('Plan', esc(PLAN_LABEL[step1.plan] || 'Plan')) +
        item('Personas afiliadas', String(persons.filter(function (p) { return !p.onlyId; }).length)) +
        item('Inicio de vigencia', esc(fecha(step1.startDate))) +
        item('Modalidad de pago', anual ? 'Anual' : 'Mensual') +
        item('Total primera cuota', '<strong class="p8-done__total">' + money(t.total) + '</strong>') +
      '</dl>' +
      '<div class="p8-next-steps">' +
        '<p class="p8-next-steps__title">Siguientes pasos</p>' +
        '<ol>' +
          '<li><strong>Pago:</strong> el cliente recibirá el enlace de pago' + (step2.email ? ' en <strong>' + esc(step2.email) + '</strong>' : '') + '.</li>' +
          (n ? '<li><strong>Soportes pendientes (' + n + '):</strong> ' + pend.map(function (x) { return esc(x.p.name.split(' ')[0]) + ' — ' + x.docs.map(function (d) { return esc(d.title); }).join(', '); }).join('; ') + '.</li>' : '') +
          '<li><strong>Activación:</strong> la cobertura inicia el ' + esc(fecha(step1.startDate)) + ', una vez se confirme el pago.</li>' +
        '</ol>' +
      '</div>' +
      '<div class="p8-done__actions">' +
        (n ? '<button type="button" class="mp-btn mp-btn--secundario" id="p8-upload-pending">Cargar soportes pendientes</button>' : '') +
        '<a class="mp-btn mp-btn--secundario" href="../../mis-radicados/index.html?q=' + encodeURIComponent(state.requestId) + '">Ver en Mis radicados</a>' +
        '<button type="button" class="mp-btn mp-btn--primario" id="p8-new">Nueva afiliación</button>' +
      '</div>';
    body.appendChild(wrap);
    function item(k, v) { return '<div class="p8-done__item"><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

    var up = document.getElementById('p8-upload-pending');
    if (up) up.addEventListener('click', function () {
      state.editing = true;
      var fp = pendingList()[0]; state.open = fp ? fp.p.id : persons[0].id;
      renderStepper(false); renderList('[data-person-card="' + state.open + '"] [data-act="toggle"]');
      document.getElementById('p8-next').textContent = 'Guardar soportes';
    });
    document.getElementById('p8-new').addEventListener('click', function () {
      Z.clearAll();
      window.location.href = '../index.html';
    });
    var h = result.querySelector('.zt-status-result__title');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  /* ═══════════════ INICIO ═══════════════ */
  if (state.completed) renderDone();
  else { renderStepper(false); renderList(); }
})();
