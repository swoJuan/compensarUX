/* ============================================================
 * portal.js — Comportamiento del Portal UX Compensar.
 * JavaScript nativo, sin dependencias. Lee catalogo.json (generado
 * por scripts/build.mjs) y pinta el catálogo, el detalle, los
 * entregables y los datos de publicación.
 * No se carga dentro de los prototipos: solo en las páginas del portal.
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  /* Separador del breadcrumb del sistema de diseño. */
  var SEP_RUTA = '<i class="icon icon-caret-right mp-breadcrumb__separator" aria-hidden="true"></i>';

  var ESTADOS = {
    'borrador':    { label: 'Borrador',    tag: 'neutral' },
    'en-revision': { label: 'En revisión', tag: 'warning' },
    'refinado':    { label: 'Refinado',    tag: 'info' },
    'aprobado':    { label: 'Aprobado UX', tag: 'success' },
    'obsoleto':    { label: 'Obsoleto',    tag: 'error' }
  };
  var PLATAFORMA_TAG = { drupal: 'info', zt: 'orange', app: 'violet' };
  var ORDEN_PLATAFORMAS = ['drupal', 'zt', 'app'];
  var TONO_PLATAFORMA = { drupal: 'cyan', zt: 'orange', app: 'green' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }
  function fecha(iso) {
    if (!iso) return 'Sin fecha';
    // "AAAA-MM-DD" (sin hora) es una fecha de calendario: se lee en hora local.
    // new Date('2026-11-12') la toma como UTC y en Colombia mostraría el día anterior.
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
    if (isNaN(d)) return 'Sin fecha';
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function tag(texto, variante) {
    return '<span class="mp-tag mp-tag--' + variante + ' mp-tag--sm"><span class="mp-tag__label">' + esc(texto) + '</span></span>';
  }
  function tagEstado(estado) {
    var e = ESTADOS[estado] || { label: estado || 'Sin estado', tag: 'neutral' };
    return tag(e.label, e.tag);
  }
  /* «Badges: cuando debes comunicar estado, prioridad o conteo» — documentación del
     sistema de diseño. El estado de un flujo es exactamente eso. */
  function badgeEstado(estado) {
    var e = ESTADOS[estado] || { label: estado || 'Sin estado', tag: 'neutral' };
    return '<span class="mp-badge mp-badge--' + e.tag + '" role="img" aria-label="Estado: ' + esc(e.label) + '">' +
      '<span class="mp-badge-dot" aria-hidden="true"></span>' +
      '<span class="mp-badge__label">' + esc(e.label) + '</span></span>';
  }
  function tagPlataforma(id, cat) {
    var p = cat.plataformas[id] || {};
    return tag(p.nombreCorto || id, PLATAFORMA_TAG[id] || 'neutral');
  }
  function params() { return new URLSearchParams(window.location.search); }

  /* ---------- sistema de diseño: versión legible ---------- */
  function dsDe(cat) { return (cat && cat.fuentes && cat.fuentes.designSystem) || {}; }
  /** Versión publicada en el portal ("v2.4.0"); si el repositorio no tiene tags, el commit. */
  function dsVersion(cat) { var d = dsDe(cat); return d.version || d.commit || '—'; }
  /** "v2.4.0" → "2.4.0", para no escribir "Versión v2.4.0". */
  function sinV(v) { return String(v || '').replace(/^v(?=\d)/, ''); }
  /** Versión que consumen hoy los prototipos, según shared/vendor/ds-version.json. */
  function dsEnPrototipos(cat) { var p = dsDe(cat).prototipos; return (p && p.tag) || null; }
  function versionActual(ds) {
    var vs = ds.versiones || [];
    for (var i = 0; i < vs.length; i++) { if (vs[i].tag === ds.version) return vs[i]; }
    return null;
  }
  /** El mensaje del tag sin el prefijo repetido ("Core Design System v2.4.0 — "). */
  function tituloVersion(v) {
    var t = (v.titulo || '').trim();
    t = t.replace(/^(core\s+)?design\s+system\s+/i, '');
    t = t.replace(/^v?\d+\.\d+\.\d+\s*[—–:-]*\s*/, '').trim();
    if (!t) return v.titulo || v.tag;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function vacio(titulo, texto, accion) {
    return '<div class="mp-empty-state mp-empty-state--bordered pux-empty">' +
      '<div class="mp-empty-state__icon"><i class="icon icon-magnifying-glass" aria-hidden="true"></i></div>' +
      '<h3 class="mp-h5 mp-empty-state__title">' + esc(titulo) + '</h3>' +
      '<p class="mp-body-m mp-empty-state__desc">' + esc(texto) + '</p>' +
      (accion ? '<div class="mp-empty-state__action">' + accion + '</div>' : '') +
      '</div>';
  }
  function errorCarga(cont) {
    cont.innerHTML = vacio('No se pudo cargar el catálogo',
      'Abre el portal desde un servidor (npm run serve). Si el problema sigue, avisa a UX.');
  }

  /* ---------- tema (mismo almacenamiento que el sistema de diseño) ---------- */
  var TEMAS = ['light', 'dark', 'high-contrast'];
  var TEMA_LABEL = { 'light': 'Claro', 'dark': 'Oscuro', 'high-contrast': 'Alto contraste' };
  function aplicarTema(t) {
    if (TEMAS.indexOf(t) < 0) t = 'light';
    document.documentElement.setAttribute('data-theme', t);
    var btn = $('[data-theme-toggle]');
    if (btn) {
      $('[data-theme-label]', btn).textContent = TEMA_LABEL[t];
      btn.setAttribute('aria-label', 'Cambiar tema (actual: ' + TEMA_LABEL[t].toLowerCase() + ')');
    }
  }
  function initTema() {
    aplicarTema(store('ds-theme') || document.documentElement.getAttribute('data-theme'));
    var btn = $('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var actual = document.documentElement.getAttribute('data-theme');
      var sig = TEMAS[(TEMAS.indexOf(actual) + 1) % TEMAS.length];
      aplicarTema(sig);
      store('ds-theme', sig);
    });
  }

  /* ---------- menú lateral (cajón en móvil) ---------- */
  function initSidebar() {
    var btn = $('[data-sidebar-toggle]');
    var side = $('#pux-sidebar');
    var fondo = $('[data-sidebar-backdrop]');
    if (!btn || !side) return;
    var label = $('[data-sidebar-toggle-label]', btn);
    var mq = window.matchMedia('(min-width: 1024px)');
    function set(abierto) {
      btn.setAttribute('aria-expanded', String(abierto));
      document.body.classList.toggle('pux-side-open', abierto);
      if (fondo) fondo.hidden = !abierto;
      if (label) label.textContent = abierto ? 'Cerrar navegación' : 'Abrir navegación';
      if (abierto) { var first = $('a, summary', side); if (first) first.focus(); }
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    if (fondo) fondo.addEventListener('click', function () { set(false); btn.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    mq.addEventListener('change', function (m) { if (m.matches) set(false); });
  }

  /* Atajo "/" para buscar, como en Storybook */
  function initBuscar() {
    var input = $('#pux-buscar');
    if (!input) return;
    var q = params().get('q');
    if (q && $('body').getAttribute('data-page') === 'prototipos') input.value = q;
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !escribiendo) { e.preventDefault(); input.focus(); }
    });
  }

  /* Marca en el menú lateral la página actual */
  /* Página activa del menú lateral. En el catálogo cuenta el filtro de plataforma;
     en la ficha de un flujo se marca la plataforma a la que pertenece. */
  var plataformaActual = '';
  function marcarActivo() {
    var archivo = window.location.pathname.split('/').pop() || 'index.html';
    var p = params();
    var actual = archivo;
    var pl = '';
    if (archivo === 'flujo.html') pl = plataformaActual;
    if (pl) actual = pl + '.html';
    $all('.pux-side a').forEach(function (a) {
      var on = a.getAttribute('href') === actual;
      // En la ficha de un flujo la plataforma es la sección, no la página exacta.
      if (on) a.setAttribute('aria-current', archivo === 'flujo.html' ? 'true' : 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* Menú lateral de prototipos: un enlace por plataforma con su número de flujos.
     No lista cada flujo: el catálogo crece y para eso está la página de prototipos. */
  function sidebarFlujos(cat) {
    var cont = $('[data-side-flujos]');
    if (!cont) return;
    var idActual = params().get('id');
    var f = idActual && cat.flujos.filter(function (x) { return x.id === idActual; })[0];
    plataformaActual = f ? f.plataforma : '';
    cont.innerHTML = ORDEN_PLATAFORMAS.map(function (pid) {
      var n = cat.flujos.filter(function (x) { return x.plataforma === pid; }).length;
      var pl = cat.plataformas[pid] || {};
      return '<a class="pux-side__link" href="' + pid + '.html" data-tone="' + (TONO_PLATAFORMA[pid] || 'orange') + '">' +
        '<i class="icon ' + (ICONO_PLATAFORMA[pid] || 'icon-stack') + ' icon-20" aria-hidden="true"></i>' +
        '<span>' + esc(pl.nombreCorto || pid) + '</span>' +
        '<span class="pux-side__count" aria-hidden="true">' + n + '</span>' +
        '<span class="visually-hidden">, ' + n + (n === 1 ? ' flujo' : ' flujos') + '</span>' +
      '</a>';
    }).join('');
    marcarActivo();
  }

  /* ---------- visor del sistema de diseño ---------- */
  var VISTAS = {
    drupal:  { src: 'ds/drupal.html', titulo: 'Drupal · ZT' },
    app:     { src: 'ds/app.html',    titulo: 'APP' }
  };
  function initVisor() {
    var visor = $('[data-viewer]');
    if (!visor) return;
    var frame = $('[data-viewer-frame]', visor);
    var canvas = $('.pux-viewer__canvas', visor);
    var abrir = $('[data-viewer-open]', visor);
    var vista = VISTAS[params().get('vista')] ? params().get('vista') : 'drupal';
    function setVista(v, actualizarUrl) {
      vista = v;
      var conf = VISTAS[v];
      if (frame.getAttribute('src') !== conf.src) frame.setAttribute('src', conf.src);
      frame.setAttribute('title', 'Sistema de diseño · ' + conf.titulo);
      abrir.setAttribute('href', conf.src);
      $all('[data-vista]', visor).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vista') === v)); });
      if (actualizarUrl) history.replaceState(null, '', '?vista=' + v);
      marcarActivo();
    }
    $all('[data-vista]', visor).forEach(function (b) {
      b.addEventListener('click', function () { setVista(b.getAttribute('data-vista'), true); });
    });
    $all('[data-ancho]', visor).forEach(function (b) {
      b.addEventListener('click', function () {
        canvas.setAttribute('data-ancho-actual', b.getAttribute('data-ancho'));
        $all('[data-ancho]', visor).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    setVista(vista, false);
  }

  /* ---------- datos ---------- */
  var promesa = null;
  function catalogo() {
    if (!promesa) {
      promesa = fetch('catalogo.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    return promesa;
  }

  /* ---------- piezas ---------- */
  /* Historias de usuario de referencia (Azure DevOps). Un flujo puede tener varias.
     Solo se enlazan URLs https. */
  function textoHu(h) {
    return [h.codigo, h.id].filter(Boolean).join(' · ') + (h.titulo ? ' — ' + h.titulo : '');
  }
  function listaHu(f) {
    var hus = f.hu || [];
    if (!hus.length) return '<span class="pux-muted">Sin HU registrada</span>';
    return '<ul class="pux-hu" role="list">' + hus.map(function (h) {
      var t = esc(textoHu(h));
      return '<li>' + (/^https:\/\//.test(h.url || '')
        ? '<a class="pux-link" href="' + esc(h.url) + '" target="_blank" rel="noopener">' + t + '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>'
        : t) + '</li>';
    }).join('') + '</ul>';
  }
  /* HU en la ficha del flujo: una fila por HU con código, título, número y enlace. */
  function huDetalle(f) {
    var hus = f.hu || [];
    if (!hus.length) {
      return '<p class="pux-muted pux-hu-vacio">Este flujo aún no tiene historias de usuario asociadas.</p>';
    }
    return '<ul class="pux-hu-lista" role="list">' + hus.map(function (h) {
      var enlace = /^https:\/\//.test(h.url || '')
        ? '<a class="mp-btn mp-btn--terciario mp-btn--icon-right pux-hu-item__accion" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
            'Abrir en Azure DevOps<span class="visually-hidden"> ' + esc(h.codigo || h.id) + ' (se abre en una pestaña nueva)</span>' +
            ' <i class="icon icon-arrow-square-out icon-20" aria-hidden="true"></i></a>'
        : '';
      return '<li class="pux-hu-item">' +
        (h.codigo ? '<span class="pux-hu-item__codigo">' + tag(h.codigo, 'info') + '</span>' : '') +
        '<div class="pux-hu-item__texto">' +
          '<p class="pux-hu-item__titulo">' + esc(h.titulo || h.codigo || h.id) + '</p>' +
          (h.id ? '<p class="pux-hu-item__meta">Work item #' + esc(h.id) + ' · Azure DevOps</p>' : '') +
        '</div>' +
        enlace +
      '</li>';
    }).join('') + '</ul>';
  }

  /* Texto de búsqueda de un flujo: nombre, descripción e HU (código, número y título). */
  function textoBusqueda(f) {
    return [f.nombre, f.descripcion].concat((f.hu || []).map(textoHu)).join(' ');
  }
  function normalizar(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  /* El prototipo siempre se abre en una pestaña nueva, para no perder el portal. */
  function botonVisualizar(f, texto, clase) {
    return '<a class="mp-btn ' + (clase || 'mp-btn--secundario') + ' mp-btn--icon-right" href="' + esc(f.url) + '" target="_blank" rel="noopener">' +
      esc(texto) + '<span class="visually-hidden"> ' + esc(f.nombre) + ' (se abre en una pestaña nueva)</span>' +
      ' <i class="icon icon-arrow-square-out icon-20" aria-hidden="true"></i></a>';
  }
  function noPublicado() {
    return '<span class="pux-muted pux-unpublished"><i class="icon icon-eye-slash icon-16" aria-hidden="true"></i> No publicado</span>';
  }

  function acciones(f) {
    var detalle = '<a class="mp-btn mp-btn--terciario" href="flujo.html?id=' + encodeURIComponent(f.id) + '">Ver detalle<span class="visually-hidden"> de ' + esc(f.nombre) + '</span></a>';
    var abrir = f.publicado
      ? botonVisualizar(f, 'Abrir prototipo')
      : noPublicado();
    return detalle + abrir;
  }
  var ICONO_PLATAFORMA = { drupal: 'icon-globe', zt: 'icon-desktop', app: 'icon-device-mobile' };
  /* ---------- Inicio: la pantalla que centraliza todo ---------- */
  /** Resumen del sistema de diseño: versión desplegada, qué trajo y las anteriores. */
  function resumenDS(cat) {
    var cont = $('[data-ds-resumen]');
    if (!cont) return;
    var ds = dsDe(cat);
    var vs = ds.versiones || [];
    var actual = versionActual(ds) || vs[0];
    if (!actual) {
      cont.innerHTML = '<div class="pux-panel">' + vacio('Todavía no hay versiones', 'El sistema de diseño aún no tiene versiones publicadas con una etiqueta.') + '</div>';
      return;
    }
    var enProto = dsEnPrototipos(cat);
    var marca = enProto === actual.tag ? tag('Los prototipos la usan', 'success')
      : (enProto ? tag('Los prototipos usan ' + enProto, 'warning') : '');
    var previas = vs.filter(function (v) { return v.tag !== actual.tag; }).slice(0, 3);

    cont.innerHTML = '<div class="pux-panel pux-dsres">' +
      '<div class="pux-dsres__main">' +
        '<div class="pux-dsres__cab">' +
          '<span class="pux-dsres__tag">' + esc(actual.tag) + '</span>' + marca +
        '</div>' +
        '<p class="pux-dsres__fecha">Último despliegue el <strong>' + esc(fecha(actual.fecha)) + '</strong></p>' +
        '<p class="pux-dsres__titulo">' + esc(tituloVersion(actual)) + '</p>' +
        (actual.revisar
          ? '<p class="pux-version__revisar"><i class="icon icon-eye icon-20" aria-hidden="true"></i>' +
            '<span><strong>Qué revisar:</strong> ' + esc(actual.revisar) + '</span></p>'
          : '') +
        '<div class="pux-actions">' +
          '<a class="mp-btn mp-btn--primario" href="sistema-de-diseno.html">Ver todas las versiones</a>' +
        '</div>' +
        '<div class="pux-dsres__docs">' +
          '<h3 class="pux-dsres__docs-tit">Consultar los componentes</h3>' +
          '<ul class="pux-dsres__docs-lista" role="list">' +
            '<li><a href="ds/drupal.html" target="_blank" rel="noopener">' +
              '<i class="icon icon-globe icon-20" aria-hidden="true"></i>' +
              '<span>Web <span class="pux-muted">· Drupal y Zona Transaccional</span></span>' +
              '<i class="icon icon-arrow-square-out icon-16" aria-hidden="true"></i>' +
              '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></li>' +
            '<li><a href="ds/app.html" target="_blank" rel="noopener">' +
              '<i class="icon icon-device-mobile icon-20" aria-hidden="true"></i>' +
              '<span>Aplicación móvil</span>' +
              '<i class="icon icon-arrow-square-out icon-16" aria-hidden="true"></i>' +
              '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      (previas.length
        ? '<div class="pux-dsres__previas">' +
            '<h3 class="pux-dsres__previas-tit">Versiones anteriores</h3>' +
            '<ul class="pux-dsres__lista" role="list">' + previas.map(function (v) {
              return '<li><span class="pux-dsres__previas-tag">' + esc(v.tag) + '</span>' +
                '<span class="pux-dsres__previas-txt">' + esc(tituloVersion(v)) + '</span>' +
                '<time class="pux-dsres__previas-fecha" datetime="' + esc(v.fecha) + '">' + esc(fecha(v.fecha)) + '</time></li>';
            }).join('') + '</ul>' +
          '</div>'
        : '') +
      '</div>';
  }

  /* Los mensajes de git traen prefijos de convención (feat, fix, chore, wip…) que no
     le dicen nada a quien revisa: se quitan para mostrarlos, y los de mantenimiento
     ceden el turno a los que describen un cambio real. */
  var MANTENIMIENTO = /^(chore|wip|docs|style|refactor|test|ci|build)\b/i;
  function mensajeCambio(msg) {
    var t = String(msg || '').replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '').trim();
    if (!t) return String(msg || '');
    if (/^v\d/.test(t)) return t;   // "v2.4.0" no se capitaliza
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function cambiosRelevantes(cambios, n) {
    var todos = cambios || [];
    var reales = todos.filter(function (c) { return !MANTENIMIENTO.test(String(c.mensaje || '')); });
    return (reales.length ? reales : todos).slice(0, n);
  }

  /** Una fila por flujo: qué es, en qué estado está, cuándo cambió y qué cambió.
   *  La misma en el inicio y en el catálogo; solo cambia el nivel del encabezado,
   *  que depende de los títulos que tenga la página encima. */
  function filaFlujo(f, cat, nivelTitulo) {
    var h = nivelTitulo || 'h4';
    var cambios = cambiosRelevantes(f.cambios, 2);
    var historial = cambios.length
      ? '<ul class="pux-cambios" role="list">' + cambios.map(function (c) {
          return '<li><span class="pux-cambios__msg">' + esc(mensajeCambio(c.mensaje)) + '</span>' +
            '<time class="pux-cambios__fecha" datetime="' + esc(c.fecha) + '">' + esc(fecha(c.fecha)) + '</time></li>';
        }).join('') + '</ul>'
      : '<p class="pux-muted pux-cambios__vacio">Sin cambios registrados.</p>';
    return '<li><article class="pux-row' + (f.publicado ? '' : ' is-unpublished') + '">' +
      '<span class="pux-row__icon" data-tone="' + (TONO_PLATAFORMA[f.plataforma] || 'orange') + '" aria-hidden="true">' +
        '<i class="icon ' + (ICONO_PLATAFORMA[f.plataforma] || 'icon-stack') + ' icon-32"></i></span>' +
      '<div class="pux-row__main">' +
        '<div class="pux-row__cab">' +
          '<' + h + ' class="mp-h6 pux-row__title"><a href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a></' + h + '>' +
          badgeEstado(f.estado) +
        '</div>' +
        '<p class="pux-row__desc">' + esc(f.descripcion) + '</p>' +
        '<p class="pux-row__meta">Versión ' + esc(f.version) + ' · actualizado el ' + esc(fecha(f.actualizado)) + '</p>' +
        historial +
      '</div>' +
      '<div class="pux-row__actions">' + acciones(f) + '</div>' +
      '</article></li>';
  }

  /** Los flujos, con pestañas por plataforma. */
  function flujosInicio(cat) {
    var cont = $('[data-flujos-inicio]');
    if (!cont) return;
    if (!cat.flujos.length) { cont.innerHTML = vacio('Aún no hay flujos', 'Cuando UX agregue un flujo al catálogo aparecerá aquí.'); return; }

    var plataformas = ORDEN_PLATAFORMAS.filter(function (p) {
      return cat.flujos.some(function (f) { return f.plataforma === p; });
    });
    var opciones = [{ id: '', nombre: 'Todos' }].concat(plataformas.map(function (p) {
      return { id: p, nombre: (cat.plataformas[p] || {}).nombre || p };
    }));
    var actual = '';

    cont.innerHTML =
      '<nav class="mp-tabs pux-plataformas" aria-label="Filtrar por plataforma" data-plataformas>' +
        opciones.map(function (o, i) {
          return '<button class="mp-tab' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
            'data-pl="' + esc(o.id) + '" aria-pressed="' + (i === 0) + '">' + esc(o.nombre) + '</button>';
        }).join('') +
      '</nav>' +
      '<div data-flujos-lista aria-live="polite"></div>';

    var lista = $('[data-flujos-lista]', cont);
    function pintar() {
      var grupos = actual ? [actual] : plataformas;
      lista.innerHTML = grupos.map(function (p) {
        var pl = cat.plataformas[p] || {};
        var flujos = cat.flujos.filter(function (f) { return f.plataforma === p; });
        var pub = flujos.filter(function (f) { return f.publicado; }).length;
        return '<section class="pux-grupo" aria-labelledby="grupo-' + esc(p) + '">' +
          '<div class="pux-grupo__cab">' +
            '<h3 class="pux-grupo__tit" id="grupo-' + esc(p) + '">' + esc(pl.nombre || p) + '</h3>' +
            '<span class="pux-muted">' + pub + ' de ' + flujos.length + ' publicados' + (pl.tecnologia ? ' · ' + esc(pl.tecnologia) : '') + '</span>' +
          '</div>' +
          '<ul class="pux-rows" role="list">' + flujos.map(function (f) { return filaFlujo(f, cat, 'h4'); }).join('') + '</ul>' +
          '</section>';
      }).join('');
    }
    $all('[data-pl]', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        actual = b.getAttribute('data-pl');
        $all('[data-pl]', cont).forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        pintar();
      });
    });
    pintar();
  }

  function initInicio(cat) {
    if (!$('[data-stat], [data-ds-resumen], [data-flujos-inicio]')) return;
    var stats = {
      publicados: cat.flujos.filter(function (f) { return f.publicado; }).length,
      revision: cat.flujos.filter(function (f) { return f.estado === 'en-revision'; }).length,
      total: cat.flujos.length,
      ds: dsVersion(cat)
    };
    $all('[data-stat]').forEach(function (el) { el.textContent = stats[el.getAttribute('data-stat')]; });
    resumenDS(cat);
    flujosInicio(cat);
  }

  /* ---------- Prototipos ---------- */
  function initPrototipos(cat) {
    var cont = $('[data-catalogo]');
    if (!cont) return;
    var q = $('[data-filtro-q]');
    var est = $('[data-filtro-estado]');
    var pub = $('[data-filtro-publicados]');
    var tabs = $all('[data-filtro-plataforma] [data-plataforma]');
    var res = $('[data-resultados]');
    var p = params();
    // Las páginas de Drupal, ZT y APP fijan su plataforma; el catálogo general no.
    var fija = cont.getAttribute('data-plataforma-fija') || '';
    var estado = {
      plataforma: fija || (ORDEN_PLATAFORMAS.indexOf(p.get('plataforma')) >= 0 ? p.get('plataforma') : ''),
      q: p.get('q') || '',
      estado: ESTADOS[p.get('estado')] ? p.get('estado') : '',
      publicados: p.get('publicados') === '1'
    };
    q.value = estado.q; est.value = estado.estado; pub.checked = estado.publicados;

    tabs.forEach(function (t) {
      var id = t.getAttribute('data-plataforma');
      var n = cat.flujos.filter(function (f) { return !id || f.plataforma === id; }).length;
      t.insertAdjacentHTML('beforeend', ' <span class="pux-count" aria-hidden="true">' + n + '</span>');
      t.addEventListener('click', function () { estado.plataforma = id; pintar(true); });
    });
    q.addEventListener('input', function () { estado.q = q.value; pintar(true); });
    est.addEventListener('change', function () { estado.estado = est.value; pintar(true); });
    pub.addEventListener('change', function () { estado.publicados = pub.checked; pintar(true); });

    function coincide(f) {
      if (estado.plataforma && f.plataforma !== estado.plataforma) return false;
      if (estado.estado && f.estado !== estado.estado) return false;
      if (estado.publicados && !f.publicado) return false;
      if (estado.q) {
        // Cada palabra debe aparecer en nombre, descripción o alguna HU
        // (ej. "256", "HU-256", "293917", "menu responsive").
        var t = normalizar(textoBusqueda(f));
        var palabras = normalizar(estado.q).trim().split(/\s+/).filter(Boolean);
        if (palabras.some(function (w) { return t.indexOf(w) < 0; })) return false;
      }
      return true;
    }

    function pintar(actualizarUrl) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-plataforma') === estado.plataforma;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      if (actualizarUrl) {
        var u = new URLSearchParams();
        if (estado.plataforma && !fija) u.set('plataforma', estado.plataforma);
        if (estado.q) u.set('q', estado.q);
        if (estado.estado) u.set('estado', estado.estado);
        if (estado.publicados) u.set('publicados', '1');
        var s = u.toString();
        history.replaceState(null, '', s ? '?' + s : window.location.pathname);
        marcarActivo();
      }
      var lista = cat.flujos.filter(coincide);
      res.textContent = lista.length + (lista.length === 1 ? ' flujo' : ' flujos');
      if (!lista.length) {
        cont.innerHTML = vacio('Sin resultados', 'Prueba con otra búsqueda u otro filtro.');
        return;
      }
      if (fija) {
        cont.innerHTML = tarjetasFlujos(lista, (cat.plataformas[fija] || {}).nombre || fija);
      } else {
        var grupos = estado.plataforma ? [estado.plataforma] : ORDEN_PLATAFORMAS;
        cont.innerHTML = grupos.map(function (pid) {
          var items = lista.filter(function (f) { return f.plataforma === pid; });
          if (!items.length) return '';
          var pl = cat.plataformas[pid] || {};
          return '<section class="pux-platform" aria-labelledby="pl-' + pid + '">' +
            '<div class="pux-platform__head">' +
              '<h2 class="mp-h6 pux-section__title" id="pl-' + pid + '">' + esc(pl.nombre || pid) + '</h2>' +
              '<p class="pux-muted">' + esc(pl.descripcion || '') + ' ' + esc(pl.tecnologia || '') + '.</p>' +
              '<a class="pux-link pux-platform__ver" href="' + pid + '.html">Ver solo ' + esc(pl.nombreCorto || pid) + '</a>' +
            '</div>' +
            tarjetasFlujos(items, pl.nombre || pid) +
            '</section>';
        }).join('');
      }
      initMiniaturas(cont);
    }
    pintar(false);
  }

  /* Acciones del catálogo: "Ver detalle" (botón terciario con texto) y, al lado, el
     menú de tres puntos con "Visualizar" (abre el prototipo en una pestaña nueva).
     El menú es un disclosure (botón + lista de enlaces), no role="menu": se recorre
     con Tab y se cierra con Esc o al hacer clic fuera. */
  function accionesCatalogo(f) {
    var detalle = '<a class="mp-btn mp-btn--terciario pux-acc__detalle" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' +
      'Ver detalle<span class="visually-hidden"> de ' + esc(f.nombre) + '</span></a>';
    if (!f.publicado) return '<div class="pux-acc">' + detalle + noPublicado() + '</div>';
    var menuId = 'acciones-' + f.id;
    var menu =
      '<div class="pux-menu">' +
        '<button type="button" class="mp-btn mp-btn--terciario pux-acc__btn pux-acc__btn--neutral pux-menu__trigger" aria-expanded="false" aria-controls="' + esc(menuId) + '">' +
          '<i class="icon icon-dots-three-vertical icon-20" aria-hidden="true"></i>' +
          '<span class="visually-hidden">Más acciones de ' + esc(f.nombre) + '</span>' +
          '<span class="pux-tip" aria-hidden="true">Más acciones</span>' +
        '</button>' +
        '<ul class="pux-menu__panel" id="' + esc(menuId) + '" role="list" hidden>' +
          '<li><a class="pux-menu__item" href="' + esc(f.url) + '" target="_blank" rel="noopener">' +
            '<i class="icon icon-eye icon-20" aria-hidden="true"></i>' +
            '<span class="pux-menu__label">Visualizar<span class="visually-hidden"> ' + esc(f.nombre) + ' (se abre en una pestaña nueva)</span></span>' +
            '<i class="icon icon-arrow-square-out icon-16 pux-menu__ext" aria-hidden="true"></i>' +
          '</a></li>' +
        '</ul>' +
      '</div>';
    return '<div class="pux-acc">' + detalle + menu + '</div>';
  }

  /* Menú de acciones: apertura, posición (fixed, para que el scroll de la tabla no lo
     recorte), cierre con Esc / clic fuera / Tab fuera, y foco al abrir y al cerrar. */
  function cerrarMenus(excepto, devolverFoco) {
    $all('.pux-menu.is-open').forEach(function (m) {
      if (m === excepto) return;
      m.classList.remove('is-open');
      var t = $('.pux-menu__trigger', m);
      t.setAttribute('aria-expanded', 'false');
      $('.pux-menu__panel', m).hidden = true;
      if (devolverFoco) t.focus({ preventScroll: true });
    });
  }
  function posicionarMenu(m) {
    var t = $('.pux-menu__trigger', m).getBoundingClientRect();
    var p = $('.pux-menu__panel', m);
    p.style.right = Math.max(8, window.innerWidth - t.right) + 'px';
    p.style.top = ''; p.style.bottom = '';
    var alto = p.offsetHeight;
    if (t.bottom + 4 + alto > window.innerHeight - 8 && t.top - 4 - alto > 8) {
      p.style.bottom = (window.innerHeight - t.top + 4) + 'px';
    } else {
      p.style.top = (t.bottom + 4) + 'px';
    }
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('.pux-menu__trigger');
    if (trigger) {
      var m = trigger.closest('.pux-menu');
      var abrir = !m.classList.contains('is-open');
      cerrarMenus(m, false);
      m.classList.toggle('is-open', abrir);
      trigger.setAttribute('aria-expanded', String(abrir));
      var panel = $('.pux-menu__panel', m);
      panel.hidden = !abrir;
      if (abrir) { posicionarMenu(m); var primero = $('.pux-menu__item', panel); if (primero) primero.focus({ preventScroll: true }); }
      return;
    }
    if (e.target.closest && e.target.closest('.pux-menu__item')) { cerrarMenus(null, false); return; }
    if (!(e.target.closest && e.target.closest('.pux-menu__panel'))) cerrarMenus(null, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('.pux-menu.is-open')) cerrarMenus(null, true);
  });
  document.addEventListener('focusout', function (e) {
    var m = e.target.closest && e.target.closest('.pux-menu.is-open');
    if (m && e.relatedTarget && !m.contains(e.relatedTarget)) cerrarMenus(null, false);
  });
  window.addEventListener('resize', function () { cerrarMenus(null, false); });
  window.addEventListener('scroll', function () { cerrarMenus(null, false); }, true);

  /** Catálogo: una fila por flujo con nombre, estado, HU de referencia y acciones. */
  /* Una tarjeta por flujo. Lo primero es el prototipo mismo, renderizado a escala:
     quien revisa reconoce la pantalla antes de abrirla. El marco mide 1280x800 y
     se escala al ancho de la tarjeta (initMiniaturas calcula --pux-escala). */
  function tarjetaFlujo(f) {
    var detalle = 'flujo.html?id=' + encodeURIComponent(f.id);
    var vista = f.publicado
      ? '<a class="pux-fcard__shot pux-fcard__shot--live" href="' + detalle + '" tabindex="-1" aria-hidden="true">' +
          '<iframe src="' + esc(f.url) + '" title="" loading="lazy" scrolling="no" tabindex="-1"></iframe>' +
        '</a>'
      : '<div class="pux-fcard__shot pux-fcard__shot--vacio">' +
          '<i class="icon icon-eye-slash icon-32" aria-hidden="true"></i>' +
          '<span>Todavía no tiene pantallas</span>' +
        '</div>';
    var hu = (f.hu || []).length ? '<div class="pux-fcard__hu">' + listaHu(f) + '</div>' : '';
    return '<li class="pux-fcard' + (f.publicado ? '' : ' is-unpublished') + '" data-tone="' +
        (TONO_PLATAFORMA[f.plataforma] || 'orange') + '">' +
      vista +
      '<div class="pux-fcard__body">' +
        '<div class="pux-fcard__cab">' +
          '<h3 class="pux-fcard__title"><a href="' + detalle + '">' + esc(f.nombre) + '</a></h3>' +
          badgeEstado(f.estado) +
        '</div>' +
        '<p class="pux-fcard__desc">' + esc(f.descripcion) + '</p>' + hu +
      '</div>' +
      '<div class="pux-fcard__pie">' +
        '<span class="pux-fcard__meta">Versión ' + esc(f.version) + ' · ' + esc(fecha(f.actualizado)) + '</span>' +
        '<span class="pux-fcard__acciones">' +
          (f.publicado ? botonVisualizar(f, 'Abrir prototipo', 'mp-btn--terciario') : noPublicado()) +
        '</span>' +
      '</div>' +
    '</li>';
  }
  function tarjetasFlujos(items, plataforma) {
    return '<ul class="pux-fcards" role="list" aria-label="Flujos de ' + esc(plataforma) + '">' +
      items.map(tarjetaFlujo).join('') + '</ul>';
  }

  /* El iframe se renderiza a 1280 px y se encoge al ancho real de la tarjeta. */
  var miniaturasObs = null;
  function initMiniaturas(root) {
    var shots = $all('.pux-fcard__shot--live', root);
    if (!shots.length) return;
    function ajustar(el) {
      var w = el.clientWidth;
      if (w) el.style.setProperty('--pux-escala', (w / 1280).toFixed(4));
    }
    shots.forEach(ajustar);
    if (window.ResizeObserver) {
      if (!miniaturasObs) {
        miniaturasObs = new ResizeObserver(function (entradas) {
          entradas.forEach(function (e) { ajustar(e.target); });
        });
      }
      shots.forEach(function (el) { miniaturasObs.observe(el); });
    }
  }

  function tablaFlujos(items, plataforma) {
    return '<div class="mp-table-wrap pux-table pux-catalogo"><table class="mp-table mp-table--hover">' +
      '<caption class="visually-hidden">Flujos de ' + esc(plataforma) + '</caption>' +
      '<thead><tr><th scope="col">Flujo</th><th scope="col">Estado</th><th scope="col">HU de referencia</th>' +
      '<th scope="col" class="mp-table__actions"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>' +
      items.map(function (f) {
        return '<tr' + (f.publicado ? '' : ' class="is-unpublished"') + '>' +
          '<th scope="row"><a class="pux-catalogo__nombre" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a>' +
            '<span class="pux-catalogo__desc">' + esc(f.descripcion) + '</span></th>' +
          '<td data-label="Estado">' + badgeEstado(f.estado) + '</td>' +
          '<td data-label="HU de referencia">' + listaHu(f) + '</td>' +
          '<td class="mp-table__actions">' + accionesCatalogo(f) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- Detalle ---------- */
  function initDetalle(cat) {
    var cont = $('[data-detalle]');
    if (!cont) return;
    var id = params().get('id');
    var f = cat.flujos.filter(function (x) { return x.id === id; })[0];
    if (!f) {
      cont.innerHTML = '<div class="pux-container pux-section">' +
        vacio('Flujo no encontrado', 'El enlace no corresponde a ningún flujo del catálogo.',
          '<a class="mp-btn mp-btn--primario" href="prototipos.html">Ir al catálogo</a>') + '</div>';
      return;
    }
    document.title = f.nombre + ' · Portal UX Compensar';
    var pl = cat.plataformas[f.plataforma] || {};
    var figma = /^https:\/\//.test(f.figma || '')
      ? '<a class="mp-btn mp-btn--secundario mp-btn--icon-left" href="' + esc(f.figma) + '" target="_blank" rel="noopener"><i class="icon icon-figma-logo icon-20" aria-hidden="true"></i> Ver en Figma<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>'
      : '<span class="pux-muted">Diseño en Figma no registrado</span>';
    var abrir = f.publicado ? botonVisualizar(f, 'Abrir prototipo completo', 'mp-btn--primario') : '';
    var ap = f.aprobacionUX || {};
    var aprob = ap.aprobado
      ? '<span class="pux-ok"><i class="icon icon-check-circle icon-20" aria-hidden="true"></i> Aprobado por ' + esc(ap.por || 'UX') + '</span>' +
        '<span class="pux-datos__sub">' + esc(fecha(ap.fecha)) + '</span>'
      : 'Pendiente';
    var dato = function (etiqueta, valor) { return '<div><dt>' + esc(etiqueta) + '</dt><dd>' + valor + '</dd></div>'; };
    var ficha =
      '<div class="pux-ficha">' +
        '<section class="pux-ficha__bloque pux-ficha__bloque--hu" aria-labelledby="ficha-hu">' +
          '<h2 class="mp-h6 pux-ficha__titulo" id="ficha-hu">Historias de usuario' +
            ((f.hu || []).length ? ' <span class="pux-count">' + f.hu.length + '</span>' : '') + '</h2>' +
          huDetalle(f) +
        '</section>' +
        '<section class="pux-ficha__bloque" aria-labelledby="ficha-estado">' +
          '<h2 class="mp-h6 pux-ficha__titulo" id="ficha-estado">Aprobación y versión</h2>' +
          '<dl class="pux-datos">' +
            dato('Aprobación UX', aprob) +
            dato('Versión', esc(f.version)) +
            dato('Última actualización', esc(fecha(f.actualizado))) +
          '</dl>' +
        '</section>' +
        '<section class="pux-ficha__bloque" aria-labelledby="ficha-tecnica">' +
          '<h2 class="mp-h6 pux-ficha__titulo" id="ficha-tecnica">Información técnica</h2>' +
          '<dl class="pux-datos">' +
            dato('Plataforma', esc(pl.nombre || f.plataforma)) +
            dato('Tecnología de destino', esc(pl.tecnologia || '—')) +
            dato('Sistema de diseño', esc(dsEnPrototipos(cat) || '—')) +
            dato('Identificador', '<code>' + esc(f.id) + '</code>') +
          '</dl>' +
        '</section>' +
      '</div>';

    var vista = f.publicado
      ? '<section class="pux-section pux-section--tight" aria-labelledby="vista-titulo"><div class="pux-container">' +
          '<div class="pux-preview__head">' +
            '<h2 class="mp-h6 pux-section__title" id="vista-titulo">Vista previa</h2>' +
            '<div class="mp-tabs" role="group" aria-label="Tamaño de la vista previa">' +
              '<button class="mp-tab is-active" type="button" aria-pressed="true" data-viewport="desktop">Escritorio</button>' +
              '<button class="mp-tab" type="button" aria-pressed="false" data-viewport="mobile">Móvil</button>' +
            '</div>' +
          '</div>' +
          '<p class="pux-muted">La vista previa es solo para explorar. Para comentar, abre el prototipo completo.</p>' +
          '<div class="pux-preview" data-preview data-viewport-actual="desktop">' +
            '<div class="pux-preview__frame"><iframe src="' + esc(f.url) + '" title="Vista previa: ' + esc(f.nombre) + '" loading="lazy"></iframe></div>' +
          '</div>' +
        '</div></section>'
      : '<section class="pux-section pux-section--tight"><div class="pux-container">' +
          vacio('Este flujo aún no está publicado', 'Existe en el repositorio de UX, pero no forma parte de esta publicación.') +
        '</div></section>';

    cont.innerHTML =
      '<section class="pux-page-head"><div class="pux-container">' +
        '<nav class="mp-breadcrumb" aria-label="Ruta de navegación"><ol class="mp-breadcrumb__list">' +
          '<li class="mp-breadcrumb__item"><a class="mp-breadcrumb__link" href="index.html">Inicio</a></li>' +
          '<li class="mp-breadcrumb__item">' + SEP_RUTA + '<a class="mp-breadcrumb__link" href="' + esc(f.plataforma) + '.html">Prototipos · ' + esc(pl.nombreCorto || f.plataforma) + '</a></li>' +
          '<li class="mp-breadcrumb__item">' + SEP_RUTA + '<span class="mp-breadcrumb__current" aria-current="page">' + esc(f.nombre) + '</span></li>' +
        '</ol></nav>' +
        '<div class="pux-tags">' + tagPlataforma(f.plataforma, cat) + badgeEstado(f.estado) + '</div>' +
        '<h1 class="pux-page-head__title">' + esc(f.nombre) + '</h1>' +
        '<p class="mp-body-xl pux-page-head__lead">' + esc(f.descripcion) + '</p>' +
        '<div class="pux-hero__actions">' + abrir + figma + '</div>' +
      '</div></section>' +
      '<section class="pux-section" aria-label="Ficha del flujo"><div class="pux-container">' + ficha + '</div></section>' +
      vista +
      '<section class="pux-section pux-section--tight" aria-labelledby="cambios-flujo"><div class="pux-container"><div class="pux-panel">' +
        '<h2 class="mp-h6 pux-section__title" id="cambios-flujo">Últimos cambios en este flujo</h2>' + timeline(f.cambios, false) +
      '</div></div></section>';

    var prev = $('[data-preview]', cont);
    if (prev) initPreview(prev);
  }

  function initPreview(prev) {
    var frame = $('.pux-preview__frame', prev);
    var iframe = $('iframe', prev);
    var DESKTOP_W = 1280;
    var DESKTOP_H = 800;
    function ajustar() {
      if (prev.getAttribute('data-viewport-actual') !== 'desktop') {
        iframe.style.transform = ''; iframe.style.width = ''; iframe.style.height = ''; frame.style.height = '';
        return;
      }
      var escala = Math.min(1, prev.clientWidth / DESKTOP_W);
      iframe.style.width = DESKTOP_W + 'px';
      iframe.style.height = DESKTOP_H + 'px';
      iframe.style.transform = 'scale(' + escala + ')';
      frame.style.height = Math.round(DESKTOP_H * escala) + 'px';
    }
    $all('[data-viewport]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-viewport');
        prev.setAttribute('data-viewport-actual', v);
        $all('[data-viewport]').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        ajustar();
      });
    });
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(prev);
    else window.addEventListener('resize', ajustar);
    ajustar();
  }

  function timeline(cambios, marcarPrimero) {
    if (!cambios || !cambios.length) return vacio('Sin historial', 'No se encontraron cambios registrados.');
    return '<ol class="pux-timeline" role="list">' + cambios.map(function (c, i) {
      var primero = marcarPrimero && i === 0;
      return '<li class="pux-timeline__item' + (primero ? ' is-latest' : '') + '">' +
        '<span class="pux-timeline__dot" aria-hidden="true"></span>' +
        '<div class="pux-timeline__body">' +
          '<p class="pux-timeline__msg">' + esc(mensajeCambio(c.mensaje)) + (primero ? ' <span class="mp-tag mp-tag--orange mp-tag--sm"><span class="mp-tag__label">Publicada</span></span>' : '') + '</p>' +
          '<p class="pux-timeline__meta"><time datetime="' + esc(c.fecha) + '">' + esc(fecha(c.fecha)) + '</time> · ' +
            (c.archivos === 1 ? '1 archivo' : c.archivos + ' archivos') + ' · <code>' + esc(c.commit) + '</code></p>' +
        '</div></li>';
    }).join('') + '</ol>';
  }

  /* ---------- Sistema de diseño: changelog por versión ---------- */
  /**
   * Una entrada por versión publicada (tag del repositorio), no por commit:
   * qué cambió, si el portal la publica, si los prototipos ya la usan y qué debe revisarse.
   * Los commits que incluye quedan plegados, para quien necesite el detalle técnico.
   */
  function listaVersiones(ds) {
    var vs = ds.versiones || [];
    if (!vs.length) {
      return vacio('Todavía no hay versiones', 'El sistema de diseño aún no tiene versiones publicadas con una etiqueta.');
    }
    return '<ol class="pux-versions" role="list">' + vs.map(function (v) {
      var etiquetas = '';
      if (v.publicada) etiquetas += tag('En el portal', 'success');
      if (v.enPrototipos) etiquetas += tag('En los prototipos', 'orange');

      var detalle = '';
      if (v.cambios && v.cambios.length) {
        var resumen = v.primera
          ? 'Primera versión etiquetada · ' + v.totalCambios + ' commits'
          : (v.totalCambios === 1 ? '1 cambio' : v.totalCambios + ' cambios');
        detalle = '<details class="pux-version__det"><summary>' + esc(resumen) + '</summary>' +
          '<ul class="pux-version__commits" role="list">' + v.cambios.map(function (c) {
            return '<li><span>' + esc(mensajeCambio(c.mensaje)) + '</span> <code>' + esc(c.commit) + '</code></li>';
          }).join('') + '</ul>' +
          (v.totalCambios > v.cambios.length
            ? '<p class="pux-muted pux-note">y ' + (v.totalCambios - v.cambios.length) + ' más</p>'
            : '') +
          '</details>';
      }

      return '<li class="pux-version' + (v.publicada ? ' is-publicada' : '') + '">' +
        '<span class="pux-version__dot" aria-hidden="true"></span>' +
        '<div class="pux-version__body">' +
          '<div class="pux-version__head">' +
            '<h3 class="pux-version__tag">' + esc(v.tag) + '</h3>' +
            (etiquetas ? '<span class="pux-tags">' + etiquetas + '</span>' : '') +
            '<time class="pux-version__fecha" datetime="' + esc(v.fecha) + '">' + esc(fecha(v.fecha)) + '</time>' +
          '</div>' +
          '<p class="pux-version__titulo">' + esc(tituloVersion(v)) + '</p>' +
          (v.cuerpo ? '<p class="pux-version__cuerpo">' + esc(v.cuerpo) + '</p>' : '') +
          (v.revisar
            ? '<p class="pux-version__revisar"><i class="icon icon-eye icon-20" aria-hidden="true"></i>' +
              '<span><strong>Qué revisar:</strong> ' + esc(v.revisar) + '</span></p>'
            : '') +
          detalle +
        '</div></li>';
    }).join('') + '</ol>';
  }

  /* ---------- Repositorios y sincronización ---------- */
  var estadoPromesa = null;
  function estado() {
    if (!estadoPromesa) {
      estadoPromesa = fetch('estado.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    return estadoPromesa;
  }
  var TONO_REPO = { portal: 'orange', designSystem: 'violet', flujos: 'cyan' };
  var ICONO_REPO = { portal: 'icon-squares-four', designSystem: 'icon-palette', flujos: 'icon-stack' };
  function filaDato(etiqueta, valor, extra) {
    return '<div class="pux-kv' + (extra ? ' ' + extra : '') + '"><dt>' + esc(etiqueta) + '</dt><dd>' + valor + '</dd></div>';
  }
  function initEstado(est) {
    var alerta = $('[data-sync-alert]');
    if (alerta) alerta.hidden = est.sincronizacion.estado === 'al-dia';

    var comp = $('[data-estado-componentes]');
    if (comp) {
      var c = est.componentes;
      var dup = c.locales.filter(function (l) { return l.tipo === 'existe-en-ds'; });
      var cand = c.locales.filter(function (l) { return l.tipo !== 'existe-en-ds'; });
      function filaLocal(l) {
        return '<tr><td><strong>' + esc(l.nombre) + '</strong></td><td>' + tag(({ drupal: 'Drupal', zt: 'ZT', app: 'APP' })[l.plataforma] || l.plataforma, PLATAFORMA_TAG[l.plataforma] || 'neutral') + '</td>' +
          '<td>' + (l.equivalenteDs ? '<code>' + esc(l.equivalenteDs) + '</code>' : '—') + '</td>' +
          '<td class="pux-num">' + l.paginas + '</td></tr>';
      }
      comp.innerHTML =
        '<dl class="pux-stats pux-stats--3">' +
          '<div class="pux-stat"><div><dt>Componentes documentados en el sistema de diseño</dt><dd>' + c.ds.length + '</dd></div></div>' +
          '<div class="pux-stat"><div><dt>Propios que duplican uno del sistema</dt><dd>' + dup.length + '</dd></div></div>' +
          '<div class="pux-stat"><div><dt>Candidatos a transversal</dt><dd>' + cand.length + '</dd></div></div>' +
        '</dl>' +
        '<div class="pux-split pux-split--even">' +
          '<section class="pux-panel"><h3 class="mp-h6 pux-panel__title">Componentes propios de las plataformas</h3>' +
            '<div class="mp-table-wrap pux-table"><table class="mp-table"><caption class="visually-hidden">Componentes propios</caption>' +
            '<thead><tr><th scope="col">Componente</th><th scope="col">Plataforma</th><th scope="col">Equivalente en el sistema</th><th scope="col" class="pux-num">Páginas</th></tr></thead><tbody>' +
            dup.concat(cand).map(filaLocal).join('') + '</tbody></table></div>' +
            '<p class="pux-muted pux-note">Los duplicados deberían usar el componente del sistema de diseño. Los candidatos se pueden llevar al sistema para reutilizarlos en Drupal, ZT y APP.</p>' +
          '</section>' +
          '<section class="pux-panel"><h3 class="mp-h6 pux-panel__title">Uso del sistema de diseño en los prototipos</h3>' +
            '<ul class="pux-bars" role="list">' + c.usoDs.slice(0, 14).map(function (u) {
              var max = c.usoDs[0].archivos || 1;
              return '<li class="pux-bars__item"><span class="pux-bars__label"><code>' + esc(u.bloque) + '</code></span>' +
                '<span class="pux-bars__track" aria-hidden="true"><span class="pux-bars__fill" style="width:' + Math.max(4, Math.round(u.archivos / max * 100)) + '%"></span></span>' +
                '<span class="pux-bars__val">' + u.archivos + ' archivos</span></li>';
            }).join('') + '</ul>' +
          '</section>' +
        '</div>';
    }
  }

  /* ---------- Página del sistema de diseño ----------
     Se entra aquí para dos cosas: abrir la documentación y saber en qué versión
     está. Los cambios viven en Historial. */

  /** La versión, en grande. */
  function versionDSBloque(cat) {
    var cont = $('[data-ds-version]');
    if (!cont) return;
    var ds = dsDe(cat);
    var va = versionActual(ds);
    var enProto = dsEnPrototipos(cat);
    cont.innerHTML = '<div class="pux-panel pux-version-hero">' +
      '<div>' +
        '<p class="mp-eyebrow pux-eyebrow">Versión publicada</p>' +
        '<p class="pux-version-hero__tag">' + esc(dsVersion(cat)) + '</p>' +
        '<p class="pux-version-hero__fecha">' + (va ? 'Publicada el ' + esc(fecha(va.fecha)) : '') + '</p>' +
      '</div>' +
      '<div class="pux-version-hero__lado">' +
        (enProto
          ? '<p class="pux-version-hero__proto">' +
              (enProto === ds.version
                ? '<i class="icon icon-check-circle icon-20" aria-hidden="true"></i> Los prototipos usan esta versión'
                : '<i class="icon icon-warning icon-20" aria-hidden="true"></i> Los prototipos usan ' + esc(enProto)) +
            '</p>'
          : '') +
        '<a class="mp-btn mp-btn--terciario" href="historial.html">Ver qué ha cambiado</a>' +
      '</div>' +
      '</div>';
  }

  /** Las dos puertas, grandes: es a lo que se viene. */
  function accesosDS(cat, est) {
    var cont = $('[data-ds-accesos]');
    if (!cont) return;
    var porAmbito = (((est || {}).componentes || {}).ds || []).reduce(function (a, x) {
      a[x.ambito] = (a[x.ambito] || 0) + 1; return a;
    }, {});
    var tr = porAmbito.transversales || 0;
    var puertas = [
      { href: 'ds/drupal.html', icono: 'icon-globe', tono: 'violet', nombre: 'Web', sub: 'Drupal y Zona Transaccional',
        n: (porAmbito.web || 0) + tr },
      { href: 'ds/app.html', icono: 'icon-device-mobile', tono: 'green', nombre: 'Aplicación móvil', sub: 'Referencia para .NET MAUI',
        n: (porAmbito.app || 0) + tr }
    ];
    cont.innerHTML = '<ul class="pux-grid pux-grid--2" role="list">' + puertas.map(function (p) {
      return '<li><a class="mp-card mp-card--raised pux-puerta" href="' + p.href + '" target="_blank" rel="noopener">' +
        '<span class="pux-puerta__icono" data-tone="' + p.tono + '" aria-hidden="true"><i class="icon ' + p.icono + ' icon-48"></i></span>' +
        '<span class="pux-puerta__tit">' + esc(p.nombre) + '</span>' +
        '<span class="pux-puerta__sub">' + esc(p.sub) + '</span>' +
        (p.n ? '<span class="pux-puerta__n">' + p.n + ' componentes</span>' : '') +
        '<span class="pux-puerta__ir">Abrir la documentación <i class="icon icon-arrow-square-out icon-20" aria-hidden="true"></i>' +
          '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></span>' +
        '</a></li>';
    }).join('') + '</ul>';
  }

  /** Un aviso solo cuando de verdad hay algo que mirar. */
  function avisoDS(cat, est) {
    var cont = $('[data-ds-aviso]');
    if (!cont) return;
    var ds = dsDe(cat);
    var avisos = [];
    if (ds.cambiosDesdeVersion > 0) {
      avisos.push('El portal publica ' + ds.cambiosDesdeVersion + ' cambios posteriores a ' + esc(ds.version) +
        ': lo que ves aquí no está en ninguna versión etiquetada todavía.');
    }
    if (est && est.sincronizacion && est.sincronizacion.estado !== 'al-dia') {
      avisos.push('Los prototipos usan una versión anterior. <a class="pux-link" href="historial.html">Ver qué falta sincronizar</a>.');
    }
    if (ds.pendientesSinPublicar > 0) {
      avisos.push(ds.pendientesSinPublicar + ' archivos del sistema de diseño están sin commit, así que no entran en lo publicado.');
    }
    if (!avisos.length) { cont.innerHTML = ''; cont.hidden = true; return; }
    cont.hidden = false;
    cont.innerHTML = '<div class="mp-alert mp-alert--warning" role="status">' +
      '<i class="icon icon-warning icon-32 mp-alert__icon" aria-hidden="true"></i>' +
      '<div class="mp-alert__content"><p class="mp-alert__title">Conviene saberlo</p>' +
      '<ul class="mp-alert__body pux-avisos">' + avisos.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>' +
      '</div></div>';
  }

  function initDSPagina(cat, est) {
    if (!$('[data-ds-accesos]')) return;
    versionDSBloque(cat);
    avisoDS(cat, est);
    accesosDS(cat, est);
  }

  /* ---------- Historial: sistema de diseño y plataformas ---------- */
  /** El estado de la copia que los prototipos tienen del sistema de diseño. */
  function bloqueSincronizacion(est) {
    var s = est.sincronizacion;
    var ok = s.estado === 'al-dia';
    var usada = (s.archivos.filter(function (a) { return a.versionUsada; })[0] || {}).versionUsada;
    return '<div class="mp-alert ' + (ok ? 'mp-alert--success' : 'mp-alert--warning') + '" role="status">' +
        '<i class="icon ' + (ok ? 'icon-check-circle' : 'icon-warning') + ' icon-32 mp-alert__icon" aria-hidden="true"></i>' +
        '<div class="mp-alert__content">' +
          '<p class="mp-alert__title">' + (ok ? 'Los prototipos usan la versión actual del sistema de diseño' : 'Los prototipos usan una versión anterior del sistema de diseño') + '</p>' +
          '<p class="mp-alert__body">' + (ok
            ? 'Tienen la versión ' + esc(s.version || s.dsCommit) + '. No hay nada que sincronizar.'
            : 'El sistema de diseño está en ' + esc(s.version || s.dsCommit) + (usada ? ' y los prototipos usan la copia del ' + esc(fecha(usada.fecha)) : ', pero los prototipos tienen una copia que no coincide con ninguna versión guardada') +
              '. La actualización es controlada: no ocurre sola. Desde la carpeta del portal ejecuta <code>' + esc(s.comando) + '</code>, revisa los prototipos y haz commit si todo se ve bien.') + '</p>' +
        '</div></div>' +
      '<div class="mp-table-wrap pux-table"><table class="mp-table">' +
        '<caption class="visually-hidden">Archivos que los prototipos copian del sistema de diseño</caption>' +
        '<thead><tr><th scope="col">Archivo en los prototipos</th><th scope="col">Origen en el sistema de diseño</th><th scope="col">Estado</th></tr></thead><tbody>' +
        s.archivos.map(function (a) {
          var t = a.estado === 'al-dia' ? tag('Al día', 'success') : (a.estado === 'faltante' ? tag('Falta', 'error') : tag('Desactualizado', 'warning'));
          return '<tr><td><code>' + esc(a.flujos) + '</code></td><td><code>' + esc(a.ds) + '</code></td><td>' + t + '</td></tr>';
        }).join('') + '</tbody></table></div>';
  }

  /** El historial de una plataforma: cada flujo con su estado y todos sus cambios. */
  function historialPlataforma(cat, pid) {
    var pl = cat.plataformas[pid] || {};
    var flujos = cat.flujos.filter(function (f) { return f.plataforma === pid; });
    if (!flujos.length) return vacio('Sin flujos', 'Esta plataforma todavía no tiene flujos en el catálogo.');
    return flujos.map(function (f) {
      return '<section class="pux-hist" aria-labelledby="h-' + esc(f.id) + '">' +
        '<div class="pux-hist__cab">' +
          '<h2 class="mp-h6 pux-hist__tit" id="h-' + esc(f.id) + '"><a href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a></h2>' +
          badgeEstado(f.estado) +
          '<span class="pux-muted pux-hist__meta">Versión ' + esc(f.version) + ' · ' +
            (f.publicado ? 'publicado' : 'no publicado') + '</span>' +
        '</div>' +
        timeline(f.cambios, false) +
      '</section>';
    }).join('');
  }

  function initHistorial(cat, est) {
    var cont = $('[data-historial]');
    var tabs = $('[data-historial-tabs]');
    if (!cont || !tabs) return;
    var opciones = [{ id: 'ds', nombre: 'Sistema de diseño' }].concat(
      ORDEN_PLATAFORMAS.filter(function (p) {
        return cat.flujos.some(function (f) { return f.plataforma === p; });
      }).map(function (p) { return { id: p, nombre: (cat.plataformas[p] || {}).nombre || p }; })
    );
    var actual = params().get('ver') && opciones.some(function (o) { return o.id === params().get('ver'); })
      ? params().get('ver') : 'ds';

    tabs.innerHTML = opciones.map(function (o) {
      return '<button class="mp-tab' + (o.id === actual ? ' is-active' : '') + '" type="button" ' +
        'data-ver="' + esc(o.id) + '" aria-pressed="' + (o.id === actual) + '">' + esc(o.nombre) + '</button>';
    }).join('');

    function pintar() {
      if (actual === 'ds') {
        var ds = dsDe(cat);
        cont.innerHTML =
          '<section aria-labelledby="hist-sync"><h2 class="mp-h6 pux-section__title" id="hist-sync">Qué versión usan los prototipos</h2>' +
            (est ? bloqueSincronizacion(est) : '<p class="pux-muted">No se pudo leer el estado de sincronización.</p>') +
          '</section>' +
          '<section class="pux-block" aria-labelledby="hist-vers"><h2 class="mp-h6 pux-section__title" id="hist-vers">Versiones publicadas</h2>' +
            listaVersiones(ds) +
          '</section>';
      } else {
        cont.innerHTML = historialPlataforma(cat, actual);
      }
    }
    $all('[data-ver]', tabs).forEach(function (b) {
      b.addEventListener('click', function () {
        actual = b.getAttribute('data-ver');
        $all('[data-ver]', tabs).forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        var u = new URL(window.location.href);
        if (actual === 'ds') u.searchParams.delete('ver'); else u.searchParams.set('ver', actual);
        window.history.replaceState({}, '', u);
        pintar();
      });
    });
    pintar();
  }

  /* ---------- Entregables ---------- */
  function initEntregables(cat) {
    var cont = $('[data-entregables]');
    if (!cont) return;
    var ap = cat.flujos.filter(function (f) { return f.aprobacionUX && f.aprobacionUX.aprobado; });
    if (!ap.length) {
      cont.innerHTML = vacio('Aún no hay flujos aprobados', 'Cuando UX apruebe un flujo, aparecerá aquí con su versión y su paquete de referencia.',
        '<a class="mp-btn mp-btn--secundario" href="prototipos.html">Ver prototipos</a>');
      return;
    }
    cont.innerHTML = '<div class="mp-table-wrap"><table class="mp-table mp-table--hover">' +
      '<caption class="visually-hidden">Flujos aprobados por UX</caption>' +
      '<thead><tr><th scope="col">Flujo</th><th scope="col">Plataforma</th><th scope="col">Versión</th><th scope="col">Aprobado</th><th scope="col">Paquete</th></tr></thead><tbody>' +
      ap.map(function (f) {
        return '<tr><td><a href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a></td>' +
          '<td>' + tagPlataforma(f.plataforma, cat) + '</td><td>' + esc(f.version) + '</td>' +
          '<td>' + esc(f.aprobacionUX.por || 'UX') + ' · ' + esc(fecha(f.aprobacionUX.fecha)) + '</td>' +
          '<td><span class="pux-muted">Disponible en una fase posterior</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- Datos de publicación ---------- */
  function initBuild(cat) {
    var f = cat.fuentes || {};
    var ds = f.designSystem || {};
    var fl = f.flujos || {};
    $all('[data-build-info]').forEach(function (el) {
      el.textContent = 'Publicado ' + fecha(cat.generado) + ' · DS ' + (ds.version || ds.commit || '—') + ' · Flujos ' + (fl.commit || '—');
    });
    $all('[data-ds-info]').forEach(function (el) {
      el.textContent = 'Versión ' + (ds.version || ds.commit || '—') + ' · ' + fecha(ds.fecha);
    });
  }

  /* ---------- arranque ---------- */
  /* Tooltips de acciones: Esc los oculta sin mover el foco ni el puntero (WCAG 1.4.13). */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $all('.pux-acc__btn:hover, .pux-acc__btn:focus-visible').forEach(function (b) { b.classList.add('is-tip-off'); });
  });
  ['mouseleave', 'blur'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('pux-acc__btn')) e.target.classList.remove('is-tip-off');
    }, true);
  });

  document.addEventListener('DOMContentLoaded', function () {
    initTema();
    initSidebar();
    initBuscar();
    initVisor();
    marcarActivo();
    estado().then(initEstado).catch(function () {
      $all('[data-estado-componentes]').forEach(function (el) { errorCarga(el); });
    });
    var necesita = $('[data-historial], [data-ds-accesos], [data-flujos-inicio], [data-ds-resumen], [data-count], [data-catalogo], [data-detalle], [data-entregables], [data-build-info], [data-ds-info], [data-side-flujos]');
    if (!necesita) return;
    catalogo().then(function (cat) {
      sidebarFlujos(cat);
      initBuild(cat);
      initInicio(cat);
      initPrototipos(cat);
      initDetalle(cat);
      initEntregables(cat);
      if ($('[data-historial]')) {
        estado().then(function (est) { initHistorial(cat, est); })
          .catch(function () { initHistorial(cat, null); });
      }
      if ($('[data-ds-accesos]')) {
        estado().then(function (est) { initDSPagina(cat, est); })
          .catch(function () { initDSPagina(cat, null); });
      }
    }).catch(function () {
      $all('[data-flujos-inicio], [data-ds-resumen], [data-catalogo], [data-detalle], [data-entregables]').forEach(function (el) {
        var inner = el.matches('[data-detalle]') ? document.createElement('div') : el;
        if (inner !== el) { inner.className = 'pux-container pux-section'; el.innerHTML = ''; el.appendChild(inner); }
        errorCarga(inner);
      });
    });
  });
})();
