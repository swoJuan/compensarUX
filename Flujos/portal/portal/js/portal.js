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

  /* Cuatro estados, en orden. Los valores antiguos (versiones congeladas, enlaces guardados) se traducen. */
  var ESTADOS = {
    'borrador':      { label: 'Borrador',      tag: 'neutral', desc: 'Recién creado' },
    'construccion':  { label: 'Construcción',  tag: 'info',    desc: 'En diseño y prototipado' },
    'validacion-ux': { label: 'Validación UX', tag: 'warning', desc: 'UX lo está revisando' },
    'entregado':     { label: 'Entregado',     tag: 'success', desc: 'UX terminó: aprobado y entregado, sin más revisiones' }
  };
  var ESTADOS_LEGADO = { 'en-revision': 'validacion-ux', 'refinado': 'validacion-ux', 'aprobado': 'entregado' };
  function estadoNormal(e) { return ESTADOS[e] ? e : (ESTADOS_LEGADO[e] || e); }
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
    var e = ESTADOS[estadoNormal(estado)] || { label: estado || 'Sin estado', tag: 'neutral' };
    return tag(e.label, e.tag);
  }
  /* «Badges: cuando debes comunicar estado, prioridad o conteo» — documentación del
     sistema de diseño. El estado de un flujo es exactamente eso. */
  function badgeEstado(estado) {
    var e = ESTADOS[estadoNormal(estado)] || { label: estado || 'Sin estado', tag: 'neutral' };
    return '<span class="mp-badge mp-badge--' + e.tag + '" role="img" aria-label="Estado: ' + esc(e.label) + '">' +
      '<span class="mp-badge-dot" aria-hidden="true"></span>' +
      '<span class="mp-badge__label">' + esc(e.label) + '</span></span>';
  }
  function tagPlataforma(id, cat) {
    var p = cat.plataformas[id] || {};
    return tag(p.nombreCorto || id, PLATAFORMA_TAG[id] || 'neutral');
  }
  /* Categorías transversales (p. ej. «swap»): etiquetas neutras; el filtro del catálogo las usa. */
  function tagsCategorias(f) {
    return (f.categorias || []).map(function (c) { return tag(c, 'neutral'); }).join('');
  }
  /* Sin etiquetas extra junto al estado: publicado, aprobado y entregado ya los dice el estado.
     Se mantiene la función para no tocar las llamadas existentes. */
  function tagsEntrega() { return ''; }
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
    var mq = window.matchMedia('(min-width: 768px)');
    function set(abierto) {
      btn.setAttribute('aria-expanded', String(abierto));
      document.body.classList.toggle('pux-side-open', abierto);
      if (fondo) fondo.hidden = !abierto;
      if (label) label.textContent = abierto ? 'Cerrar navegación' : 'Abrir navegación';
      if (abierto) setTimeout(function () { var first = $('a[aria-current], a', side); if (first) first.focus(); }, 30);
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    if (fondo) fondo.addEventListener('click', function () { set(false); btn.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    mq.addEventListener('change', function (m) { if (m.matches) set(false); });
  }

  /* Atajo "/" para buscar, como en Storybook. Hay un buscador en la barra superior y,
     en el inicio, otro en el encabezado de la página: se enfoca el primero que se ve. */
  function buscadorVisible() {
    return $all('[data-buscar]').filter(function (i) { return i.offsetParent !== null; })[0] || null;
  }
  function initBuscar() {
    var q = params().get('q');
    if (q && $('body').getAttribute('data-page') === 'prototipos') {
      $all('[data-buscar]').forEach(function (i) { i.value = q; });
    }
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      var input = buscadorVisible();
      if (e.key === '/' && !escribiendo && input) { e.preventDefault(); input.focus(); }
    });
  }

  /* ---------- Navegación lateral ----------
     Una sola barra lateral: secciones con submenús anidados.
     La sección sale de la ruta, así que funciona igual al entrar por URL directa. */
  var SECCIONES = {
    inicio: ['index.html'],
    prototipos: ['prototipos.html', 'drupal.html', 'zt.html', 'app.html', 'flujo.html'],
    ds: ['sistema-de-diseno.html', 'centro-de-recursos.html', 'historial.html', 'changelog.html', 'componentes.html'],
    doc: ['documentacion.html', 'entregables.html']
  };
  /* Página activa. En el catálogo cuenta el filtro de plataforma; en la ficha de un
     flujo se marca la plataforma a la que pertenece. */
  var plataformaActual = '';
  function seccionDe(archivo) {
    if (/^instalar(?:-|\.)/.test(archivo)) return 'ds';
    return Object.keys(SECCIONES).filter(function (k) { return SECCIONES[k].indexOf(archivo) >= 0; })[0] || 'inicio';
  }
  function marcarActivo() {
    var archivo = window.location.pathname.split('/').pop() || 'index.html';
    var actual = archivo;
    if (archivo === 'flujo.html' && plataformaActual) actual = plataformaActual + '.html';
    // Las páginas antiguas de Instalar redirigen al Centro de recursos; changelog, a Versiones.
    if (/^instalar(?:-|\.)/.test(archivo)) actual = 'centro-de-recursos.html';
    if (archivo === 'changelog.html') actual = 'historial.html';
    var sec = seccionDe(archivo);
    var nav = $('[data-nav]');
    if (nav) nav.setAttribute('data-seccion', sec);
    var hijoActivo = false;
    $all('.pux-nv__sub').forEach(function (a) {
      var on = a.getAttribute('href') === actual;
      if (on) hijoActivo = true;
      // En la ficha de un flujo la plataforma es la sección, no la página exacta.
      if (on) a.setAttribute('aria-current', archivo === 'flujo.html' ? 'true' : 'page'); else a.removeAttribute('aria-current');
    });
    $all('.pux-nv__item').forEach(function (it) {
      var propia = it.getAttribute('data-seccion') === sec;
      var link = $('.pux-nv__link', it);
      if (propia && !hijoActivo) link.setAttribute('aria-current', 'page');
      else if (propia) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
      if (propia && !it.hasAttribute('data-abierto-manual')) fijarSub(it, true);
    });
    ajustarPanel();
  }
  /* Submenú dentro de la misma barra: se anima con grid-template-rows (0fr -> 1fr). */
  function fijarSub(item, abierto) {
    var btn = $('[data-sub-toggle]', item);
    if (!btn) return;
    item.classList.toggle('is-open', abierto);
    btn.setAttribute('aria-expanded', String(abierto));
    var sub = $('[data-sub]', item);
    if (sub) { if ('inert' in sub) sub.inert = !abierto; }
  }
  function initSubmenus() {
    $all('.pux-nv__item').forEach(function (it) {
      var btn = $('[data-sub-toggle]', it);
      if (!btn) return;
      fijarSub(it, false);
      btn.addEventListener('click', function () {
        it.setAttribute('data-abierto-manual', '');
        fijarSub(it, !it.classList.contains('is-open'));
      });
    });
  }
  /* Panel contextual: expandido (texto completo) o compacto (textos cortos). En escritorio
     nunca se oculta y la elección se recuerda. En tableta nace compacto y, al expandirlo,
     flota sobre el contenido. En móvil es un cajón y siempre muestra el texto completo. */
  var mqEscritorio = window.matchMedia('(min-width: 1024px)');
  var mqMovil = window.matchMedia('(max-width: 767.98px)');
  function modoPanel() { return document.documentElement.getAttribute('data-pn') === 'compacto' ? 'compacto' : 'expandido'; }
  function fijarModo(modo) {
    document.documentElement.setAttribute('data-pn', modo);
    var btn = $('[data-panel-toggle]');
    if (!btn) return;
    var exp = modo === 'expandido';
    btn.setAttribute('aria-expanded', String(exp));
    btn.setAttribute('aria-label', (exp ? 'Contraer' : 'Expandir') + ' navegación');
    btn.setAttribute('data-tip', exp ? 'Contraer navegación' : 'Expandir navegación');
  }
  function modoInicial() {
    if (mqMovil.matches) return 'expandido';
    if (mqEscritorio.matches) return store('pux-panel') === 'compacto' ? 'compacto' : 'expandido';
    return 'compacto';
  }
  function ajustarPanel() { fijarModo(modoPanel()); }
  function initNav() {
    var nav = $('[data-nav]');
    var btn = $('[data-panel-toggle]');
    if (!nav || !btn) return;
    fijarModo(modoInicial());
    initSubmenus();
    marcarActivo();
    btn.addEventListener('click', function () {
      var nuevo = modoPanel() === 'expandido' ? 'compacto' : 'expandido';
      if (mqEscritorio.matches) store('pux-panel', nuevo);
      fijarModo(nuevo);
    });
    // Tableta: el panel expandido flota; Esc o un clic fuera lo devuelven a compacto.
    function replegar(foco) {
      if (mqEscritorio.matches || mqMovil.matches || modoPanel() !== 'expandido') return;
      fijarModo('compacto');
      if (foco) btn.focus();
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') replegar(true); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) replegar(false); });
    [mqEscritorio, mqMovil].forEach(function (m) { m.addEventListener('change', function () { fijarModo(modoInicial()); }); });
    initTips();
  }

  /* Tooltips de la navegación. Un solo elemento fijo, fuera dla barra (que hace scroll y
     recortaría un tooltip propio). Aparece con puntero y con foco de teclado, se puede pasar
     el puntero por encima y Esc lo descarta (WCAG 1.4.13). Solo se muestra con la barra colapsada, donde no hay texto. */
  function initTips() {
    var tip = document.createElement('div');
    tip.className = 'pux-tip';
    tip.setAttribute('aria-hidden', 'true');
    tip.hidden = true;
    document.body.appendChild(tip);
    var tmr = null, descartado = null;
    function aplica(el) {
      if (mqMovil.matches || !el.getAttribute('data-tip')) return false;
      return modoPanel() === 'compacto';
    }
    function mostrar(el) {
      if (!aplica(el) || descartado === el) return;
      clearTimeout(tmr);
      var r = el.getBoundingClientRect();
      tip.textContent = el.getAttribute('data-tip');
      tip.style.left = Math.round(r.right + 8) + 'px';
      tip.style.top = Math.round(r.top + r.height / 2) + 'px';
      tip.hidden = false;
    }
    function ocultar(demora) { clearTimeout(tmr); tmr = setTimeout(function () { tip.hidden = true; }, demora || 0); }
    var sel = '.pux-nv__link, .pux-nv__collapse';
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest && e.target.closest(sel);
      if (el) mostrar(el); else if (e.target.closest && e.target.closest('.pux-tip')) clearTimeout(tmr);
    });
    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest && e.target.closest(sel);
      if (el) { descartado = null; ocultar(120); }
    });
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest && e.target.closest(sel);
      if (el && el.matches(':focus-visible')) mostrar(el);
    });
    document.addEventListener('focusout', function (e) { if (e.target.closest && e.target.closest(sel)) { descartado = null; ocultar(0); } });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || tip.hidden) return;
      descartado = document.activeElement.closest ? document.activeElement.closest(sel) : null;
      tip.hidden = true;
    });
    window.addEventListener('scroll', function () { tip.hidden = true; }, true);
  }

  /* Menú lateral: cuántos prototipos hay en cada plataforma. No lista cada uno:
     el catálogo crece y para eso están la página de prototipos y su búsqueda. */
  function sidebarFlujos(cat) {
    var idActual = params().get('id');
    var f = idActual && cat.flujos.filter(function (x) { return x.id === idActual; })[0];
    plataformaActual = f ? f.plataforma : '';
    $all('[data-side-count]').forEach(function (el) {
      var id = el.getAttribute('data-side-count');
      var n = cat.flujos.filter(function (x) { return id === 'todos' || x.plataforma === id; }).length;
      el.textContent = n;
      var oculto = document.createElement('span');
      oculto.className = 'visually-hidden';
      oculto.textContent = ', ' + n + (n === 1 ? ' prototipo' : ' prototipos');
      el.setAttribute('aria-hidden', 'true');
      el.parentNode.appendChild(oculto);
    });
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

  /* Texto de búsqueda de un prototipo: nombre, descripción, plataforma, estado e HU (código, número y título). */
  function textoBusqueda(f, cat) {
    var pl = (cat && cat.plataformas && cat.plataformas[f.plataforma]) || {};
    var est = ((ESTADOS[f.estado] || {}).label || '') + (f.estado === 'entregado' ? ' aprobado' : '');
    return [f.nombre, f.descripcion, pl.nombre, pl.nombreCorto, f.plataforma, est].concat(f.categorias || []).concat((f.hu || []).map(textoHu)).join(' ');
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
          '<a class="mp-btn mp-btn--primario" href="historial.html">Ver todas las versiones</a>' +
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
     le dicen nada a quien revisa: se quitan para mostrarlos. */
  function mensajeCambio(msg) {
    var t = String(msg || '').replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '').trim();
    if (!t) return String(msg || '');
    if (/^v\d/.test(t)) return t;   // "v2.4.0" no se capitaliza
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  /* ---------- Datos compartidos: inicio y catálogo ----------
     Una sola fuente (catalogo.json) y un solo cálculo, para que los indicadores del
     inicio y los resultados filtrados del catálogo nunca discrepen. Cada flujo del
     catálogo es UN prototipo; sus versiones publicadas (f.versiones) no se cuentan. */
  var ESTADO_REVISION = 'validacion-ux';
  var ESTADO_ENTREGADO = 'entregado';
  function marcaTiempo(f) {
    var t = f.actualizado ? Date.parse(f.actualizado) : NaN;
    return isNaN(t) ? -Infinity : t;
  }
  /** Más reciente primero; sin fecha al final; a igual fecha, por nombre. */
  function porActualizacion(a, b) {
    var ta = marcaTiempo(a), tb = marcaTiempo(b);
    if (ta === tb) return String(a.nombre).localeCompare(String(b.nombre), 'es');
    return tb > ta ? 1 : -1;
  }
  function resumenCatalogo(cat) {
    var flujos = cat.flujos || [];
    var r = { total: flujos.length, porEstado: {}, porPlataforma: {}, ordenados: flujos.slice().sort(porActualizacion) };
    flujos.forEach(function (f) {
      var est = estadoNormal(f.estado); r.porEstado[est] = (r.porEstado[est] || 0) + 1;
      r.porPlataforma[f.plataforma] = (r.porPlataforma[f.plataforma] || 0) + 1;
    });
    r.pendientes = r.ordenados.filter(function (f) { return estadoNormal(f.estado) === ESTADO_REVISION; });
    r.recientes = r.ordenados.slice(0, 5);
    return r;
  }
  function nombrePlataforma(id, cat) { var p = (cat.plataformas || {})[id] || {}; return p.nombre || id; }

  /* ---------- Inicio: panel de estado y accesos ---------- */
  /** Una fila compacta: nombre, plataforma, fecha, estado y acceso directo al prototipo. */
  function filaResumen(f, cat) {
    return '<li class="pux-item' + (f.publicado ? '' : ' is-unpublished') + '">' +
      '<span class="pux-item__icon" data-tone="' + (TONO_PLATAFORMA[f.plataforma] || 'orange') + '" aria-hidden="true">' +
        '<i class="icon ' + (ICONO_PLATAFORMA[f.plataforma] || 'icon-stack') + ' icon-20"></i></span>' +
      '<div class="pux-item__main">' +
        '<a class="pux-item__nombre" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a>' +
        '<p class="pux-item__meta">' + esc(nombrePlataforma(f.plataforma, cat)) + ' · ' +
          (f.actualizado ? 'Actualizado el <time datetime="' + esc(f.actualizado) + '">' + esc(fecha(f.actualizado)) + '</time>' : 'Sin fecha de actualización') + '</p>' +
      '</div>' +
      '<div class="pux-item__estado">' + badgeEstado(f.estado) + '</div>' +
      '<div class="pux-item__accion">' + (f.publicado ? botonVisualizar(f, 'Abrir', 'mp-btn--terciario') : noPublicado()) + '</div>' +
    '</li>';
  }
  function listaResumen(cont, items, cat, vacioTitulo, vacioTexto) {
    cont.removeAttribute('aria-busy');
    cont.innerHTML = items.length
      ? '<ul class="pux-items" role="list">' + items.map(function (f) { return filaResumen(f, cat); }).join('') + '</ul>'
      : vacio(vacioTitulo, vacioTexto);
  }

  /** Tarjeta compacta del sistema de diseño. La versión sale del catálogo generado
   *  (etiqueta de git o, mientras el repositorio no tenga etiquetas, versiones.json). */
  function tarjetaDS(cat) {
    var cont = $('[data-ds-card]');
    if (!cont) return;
    var ds = dsDe(cat);
    var actual = versionActual(ds) || (ds.versiones || [])[0] || null;
    var version = ds.version || (actual && actual.tag) || '';
    var fechaDs = actual && actual.fecha ? { txt: 'Publicada el ', v: actual.fecha } : (ds.fecha ? { txt: 'Actualizado el ', v: ds.fecha } : null);
    var hayCambios = (ds.versiones || []).length > 0;
    cont.removeAttribute('aria-busy');
    cont.innerHTML =
      '<span class="pux-ds__icon" data-tone="violet" aria-hidden="true"><i class="icon icon-palette icon-24"></i></span>' +
      '<div class="pux-ds__main">' +
        '<h2 class="pux-ds__titulo" id="ds-titulo">Sistema de diseño de Compensar</h2>' +
        '<p class="pux-ds__version">' +
          (version
            ? '<span class="pux-ds__tag"><span class="visually-hidden">Última versión: </span>' + esc(version) + '</span>'
            : '<span class="pux-muted">Versión no identificada</span>') +
          (fechaDs ? '<span class="pux-muted">' + fechaDs.txt + '<time datetime="' + esc(fechaDs.v) + '">' + esc(fecha(fechaDs.v)) + '</time></span>' : '') +
        '</p>' +
        '<p class="pux-ds__desc">Colores, tipografía, iconos y componentes que usan todos los prototipos.</p>' +
      '</div>' +
      '<div class="pux-ds__acciones">' +
        '<a class="mp-btn mp-btn--primario" href="sistema-de-diseno.html">Consultar sistema de diseño</a>' +
        (hayCambios ? '<a class="pux-link" href="historial.html">Ver cambios</a>' : '') +
      '</div>';
  }

  /** Prototipos por plataforma: cifras reales y barras horizontales simples (sin gráficos). */
  function distribucion(cat, r) {
    var cont = $('[data-distribucion]');
    if (!cont) return;
    cont.removeAttribute('aria-busy');
    if (!r.total) { cont.innerHTML = '<p class="pux-muted">Todavía no hay prototipos registrados.</p>'; return; }
    cont.innerHTML = '<ul class="pux-dist" role="list">' + ORDEN_PLATAFORMAS.map(function (id) {
      var n = r.porPlataforma[id] || 0;
      return '<li><a class="pux-dist__fila" href="' + id + '.html">' +
        '<span class="pux-dist__nombre">' + esc(nombrePlataforma(id, cat)) + '</span>' +
        '<span class="pux-dist__n">' + n + '<span class="visually-hidden">' + (n === 1 ? ' prototipo' : ' prototipos') + '</span></span>' +
        '<span class="pux-dist__barra" aria-hidden="true"><span class="pux-dist__relleno" data-pct="' + (n / r.total * 100).toFixed(1) + '"></span></span>' +
      '</a></li>';
    }).join('') + '</ul>';
    // El ancho se asigna por CSSOM (no con style="" en el HTML) para respetar una CSP estricta.
    $all('[data-pct]', cont).forEach(function (el) { el.style.width = el.getAttribute('data-pct') + '%'; });
  }

  function initInicio(cat) {
    if (!$('[data-dash]')) return;
    var r = resumenCatalogo(cat);
    var valores = { total: r.total, revision: r.porEstado[ESTADO_REVISION] || 0, entregados: r.porEstado[ESTADO_ENTREGADO] || 0 };
    $all('[data-kpi]').forEach(function (el) { el.textContent = valores[el.getAttribute('data-kpi')]; });
    $all('[data-kpis]').forEach(function (el) { el.removeAttribute('aria-busy'); });
    var pend = $('[data-pendientes]');
    if (pend) listaResumen(pend, r.pendientes.slice(0, 5), cat, 'No hay prototipos pendientes',
      'Todos los prototipos registrados ya pasaron por revisión de UX.');
    var rec = $('[data-recientes]');
    if (rec) listaResumen(rec, r.recientes, cat, 'Aún no hay prototipos', 'Cuando UX registre un prototipo aparecerá aquí.');
    var verPend = $('[data-ver-pendientes]');
    if (verPend) verPend.hidden = !r.pendientes.length;
    tarjetaDS(cat);
    distribucion(cat, r);
  }

  /* ---------- Prototipos: catálogo con búsqueda, filtros, orden, vistas y paginación ---------- */
  var TAM_PAGINA = { lista: 20, tarjetas: 12 };
  var ORDENES = {
    recientes: { label: 'Más recientes', fn: porActualizacion },
    antiguos:  { label: 'Más antiguos', fn: function (a, b) {
      var ta = marcaTiempo(a), tb = marcaTiempo(b);
      if (ta === tb) return String(a.nombre).localeCompare(String(b.nombre), 'es');
      if (ta === -Infinity) return 1;
      if (tb === -Infinity) return -1;
      return ta - tb;
    } },
    nombre:    { label: 'Nombre (A–Z)', fn: function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es'); } }
  };
  /** Páginas a mostrar: primera, última y las vecinas a la actual, con «…» entre huecos. */
  function numerosPagina(actual, total) {
    var set = {};
    [1, total, actual - 1, actual, actual + 1].forEach(function (n) { if (n >= 1 && n <= total) set[n] = true; });
    var nums = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    var out = [];
    nums.forEach(function (n, i) { if (i && n - nums[i - 1] > 1) out.push(0); out.push(n); });
    return out;
  }
  function htmlPaginacion(actual, total, href, etiqueta) {
    if (total <= 1) return '';
    function enlace(n, contenido, extra) {
      return '<li class="mp-pagination__item"><a class="mp-pagination__link' + (n === actual ? ' is-active' : '') + '" href="' + esc(href(n)) + '" data-pagina="' + n + '"' +
        (n === actual ? ' aria-current="page"' : '') + (extra || '') + '>' + contenido + '</a></li>';
    }
    var items = [];
    if (actual > 1) items.push(enlace(actual - 1, '<i class="icon icon-caret-left mp-pagination__icon" aria-hidden="true"></i>', ' aria-label="Página anterior"'));
    numerosPagina(actual, total).forEach(function (n) {
      items.push(n === 0
        ? '<li class="mp-pagination__item"><span class="mp-pagination__ellipsis" aria-hidden="true">…</span></li>'
        : enlace(n, String(n), ' aria-label="Página ' + n + (n === actual ? ', página actual' : '') + '"'));
    });
    if (actual < total) items.push(enlace(actual + 1, '<i class="icon icon-caret-right mp-pagination__icon" aria-hidden="true"></i>', ' aria-label="Página siguiente"'));
    return '<nav class="mp-pagination mp-pagination--center" aria-label="' + esc(etiqueta || 'Paginación del catálogo') + '"><ul class="mp-pagination__list">' + items.join('') + '</ul></nav>';
  }

  function initPrototipos(cat) {
    var cont = $('[data-catalogo]');
    if (!cont) return;
    var q = $('[data-filtro-q]');
    var est = $('[data-filtro-estado]');
    var ord = $('[data-filtro-orden]');
    var pub = $('[data-filtro-publicados]');
    var catSel = $('[data-filtro-categoria]');
    var tabs = $all('[data-filtro-plataforma] [data-plataforma]');
    var botonesVista = $all('[data-vista-cat]');
    var res = $('[data-resultados]');
    var pag = $('[data-paginacion]');
    var p = params();
    // Las páginas de Drupal, ZT y APP fijan su plataforma; el catálogo general no.
    var fija = cont.getAttribute('data-plataforma-fija') || '';
    var vistaGuardada = store('pux-vista');
    var estado = {
      plataforma: fija || (ORDEN_PLATAFORMAS.indexOf(p.get('plataforma')) >= 0 ? p.get('plataforma') : ''),
      q: p.get('q') || '',
      estado: ESTADOS[estadoNormal(p.get('estado'))] ? estadoNormal(p.get('estado')) : '',
      publicados: p.get('publicados') === '1',
      categoria: p.get('categoria') || '',
      orden: ORDENES[p.get('orden')] ? p.get('orden') : 'recientes',
      vista: TAM_PAGINA[p.get('vista')] ? p.get('vista') : (TAM_PAGINA[vistaGuardada] ? vistaGuardada : 'lista'),
      pagina: Math.max(1, parseInt(p.get('pagina'), 10) || 1)
    };
    q.value = estado.q; est.value = estado.estado; pub.checked = estado.publicados;
    if (ord) ord.value = estado.orden;
    if (catSel) {
      var todasCat = [];
      cat.flujos.forEach(function (f) { (f.categorias || []).forEach(function (c) { if (todasCat.indexOf(c) < 0) todasCat.push(c); }); });
      if (!todasCat.length) { var grupoCat = catSel.closest('.mp-input-group'); if (grupoCat) grupoCat.hidden = true; estado.categoria = ''; }
      else {
        todasCat.sort().forEach(function (c) { catSel.insertAdjacentHTML('beforeend', '<option value="' + esc(c) + '">' + esc(c) + '</option>'); });
        if (todasCat.indexOf(estado.categoria) < 0) estado.categoria = '';
        catSel.value = estado.categoria;
        catSel.addEventListener('change', function () { estado.categoria = catSel.value; estado.pagina = 1; pintar(true); });
      }
    }

    tabs.forEach(function (t) {
      var id = t.getAttribute('data-plataforma');
      var n = cat.flujos.filter(function (f) { return !id || f.plataforma === id; }).length;
      t.insertAdjacentHTML('beforeend', ' <span class="pux-count" aria-hidden="true">' + n + '</span>');
      t.addEventListener('click', function () { estado.plataforma = id; estado.pagina = 1; pintar(true); });
    });
    q.addEventListener('input', function () { estado.q = q.value; estado.pagina = 1; pintar(true); });
    est.addEventListener('change', function () { estado.estado = est.value; estado.pagina = 1; pintar(true); });
    if (ord) ord.addEventListener('change', function () { estado.orden = ord.value; estado.pagina = 1; pintar(true); });
    pub.addEventListener('change', function () { estado.publicados = pub.checked; estado.pagina = 1; pintar(true); });
    botonesVista.forEach(function (b) {
      b.addEventListener('click', function () {
        estado.vista = b.getAttribute('data-vista-cat'); estado.pagina = 1;
        store('pux-vista', estado.vista);
        pintar(true);
      });
    });

    function coincide(f) {
      if (estado.plataforma && f.plataforma !== estado.plataforma) return false;
      if (estado.estado && f.estado !== estado.estado) return false;
      if (estado.publicados && !f.publicado) return false;
      if (estado.categoria && (f.categorias || []).indexOf(estado.categoria) < 0) return false;
      if (estado.q) {
        // Cada palabra debe aparecer en nombre, descripción, plataforma, estado o alguna HU
        // (ej. "256", "HU-256", "293917", "menu responsive", "drupal", "aprobado").
        var t = normalizar(textoBusqueda(f, cat));
        var palabras = normalizar(estado.q).trim().split(/\s+/).filter(Boolean);
        if (palabras.some(function (w) { return t.indexOf(w) < 0; })) return false;
      }
      return true;
    }
    function urlConPagina(n) {
      var u = new URLSearchParams();
      if (estado.plataforma && !fija) u.set('plataforma', estado.plataforma);
      if (estado.q) u.set('q', estado.q);
      if (estado.estado) u.set('estado', estado.estado);
      if (estado.publicados) u.set('publicados', '1');
      if (estado.categoria) u.set('categoria', estado.categoria);
      if (estado.orden !== 'recientes') u.set('orden', estado.orden);
      if (estado.vista !== 'lista') u.set('vista', estado.vista);
      if (n > 1) u.set('pagina', n);
      var s = u.toString();
      return s ? '?' + s : window.location.pathname.split('/').pop() || 'prototipos.html';
    }
    function limpiar() {
      estado.q = ''; estado.estado = ''; estado.publicados = false; estado.categoria = ''; estado.pagina = 1;
      if (catSel) catSel.value = '';
      if (!fija) estado.plataforma = '';
      q.value = ''; est.value = ''; pub.checked = false;
      pintar(true);
    }

    function pintar(actualizarUrl, moverFoco) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-plataforma') === estado.plataforma;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      botonesVista.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vista-cat') === estado.vista)); });
      var lista = cat.flujos.filter(coincide).sort(ORDENES[estado.orden].fn);
      var tam = TAM_PAGINA[estado.vista];
      var paginas = Math.max(1, Math.ceil(lista.length / tam));
      estado.pagina = Math.min(estado.pagina, paginas);
      if (actualizarUrl) {
        history.replaceState(null, '', urlConPagina(estado.pagina));
        marcarActivo();
      }
      var desde = (estado.pagina - 1) * tam;
      var visibles = lista.slice(desde, desde + tam);
      res.textContent = !lista.length ? '0 prototipos'
        : (paginas > 1
            ? 'Mostrando ' + (desde + 1) + '–' + (desde + visibles.length) + ' de ' + lista.length + ' prototipos'
            : lista.length + (lista.length === 1 ? ' prototipo' : ' prototipos'));
      if (!lista.length) {
        cont.innerHTML = vacio('Sin resultados', 'Ningún prototipo coincide con la búsqueda o los filtros. Prueba con otra palabra o quita algún filtro.',
          '<button type="button" class="mp-btn mp-btn--secundario" data-limpiar>Limpiar filtros</button>');
        var b = $('[data-limpiar]', cont);
        if (b) b.addEventListener('click', limpiar);
        if (pag) pag.innerHTML = '';
        return;
      }
      var etiqueta = fija ? nombrePlataforma(fija, cat) : 'todas las plataformas';
      cont.innerHTML = estado.vista === 'tarjetas' ? tarjetasFlujos(visibles, etiqueta, cat) : tablaFlujos(visibles, etiqueta, cat);
      if (pag) {
        pag.innerHTML = htmlPaginacion(estado.pagina, paginas, urlConPagina);
        $all('[data-pagina]', pag).forEach(function (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();
            estado.pagina = parseInt(a.getAttribute('data-pagina'), 10);
            pintar(true, true);
          });
        });
      }
      if (estado.vista === 'tarjetas') initMiniaturas(cont);
      if (moverFoco) { res.focus({ preventScroll: true }); res.scrollIntoView({ block: 'start' }); }
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
  function tarjetaFlujo(f, cat) {
    var detalle = 'flujo.html?id=' + encodeURIComponent(f.id);
    var vista = f.publicado
      ? '<a class="pux-fcard__shot pux-fcard__shot--live" href="' + detalle + '" tabindex="-1" aria-hidden="true">' +
          '<iframe src="' + esc(f.url) + '" title="" loading="lazy" scrolling="no" tabindex="-1"></iframe>' +
        '</a>'
      : '<div class="pux-fcard__shot pux-fcard__shot--vacio">' +
          '<i class="icon icon-eye-slash icon-32" aria-hidden="true"></i>' +
          '<span>Todavía no tiene pantallas</span>' +
        '</div>';
    var hu = huFila(f);
    return '<li class="mp-card mp-card--flat pux-fcard' + (f.publicado ? '' : ' is-unpublished') + '" data-tone="' +
        (TONO_PLATAFORMA[f.plataforma] || 'orange') + '">' +
      vista +
      '<div class="pux-fcard__body">' +
        '<h3 class="pux-fcard__title"><a href="' + detalle + '">' + esc(f.nombre) + '</a></h3>' +
        '<p class="pux-fcard__desc">' + esc(f.descripcion) + '</p>' +
        '<div class="pux-tags">' + tagsCategorias(f) + tagsEntrega(f) + '</div>' + hu +
        '<p class="pux-fcard__meta">' + esc(nombrePlataforma(f.plataforma, cat)) + ' · Versión ' + esc(f.version) + ' · actualizado el ' + esc(fecha(f.actualizado)) + '</p>' +
      '</div>' +
      '<div class="pux-fcard__lado">' +
        '<div class="pux-fcard__estado">' + badgeEstado(f.estado) + '</div>' +
        '<div class="pux-fcard__pie">' +
          (f.publicado ? '' : noPublicado()) + menuFila(f, detalle) +
        '</div>' +
      '</div>' +
    '</li>';
  }
  /* HU en la fila: la primera siempre visible; las demás, en un desplegable nativo
     (<details>) para que la fila no crezca. Accesible por teclado sin JS. */
  function itemHu(h) {
    var t = esc(textoHu(h));
    return '<li>' + (/^https:\/\//.test(h.url || '')
      ? '<a class="pux-link" href="' + esc(h.url) + '" target="_blank" rel="noopener">' + t + '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>'
      : t) + '</li>';
  }
  function huFila(f) {
    var hus = f.hu || [];
    if (!hus.length) return '';
    var resto = hus.slice(1);
    return '<div class="pux-fcard__hu">' +
      '<ul class="pux-hu" role="list">' + itemHu(hus[0]) + '</ul>' +
      (resto.length
        ? '<details class="pux-hu-mas">' +
            '<summary><span class="pux-hu-mas__abrir">Ver ' + resto.length + ' HU más</span>' +
              '<span class="pux-hu-mas__cerrar">Ocultar HU</span>' +
              '<i class="icon icon-caret-down icon-16" aria-hidden="true"></i></summary>' +
            '<ul class="pux-hu" role="list">' + resto.map(itemHu).join('') + '</ul>' +
          '</details>'
        : '') +
    '</div>';
  }
  /* Acciones de la fila en un menú ⋮ (mismo disclosure que el catálogo en tabla):
     Visualizar, Ver detalle y Descargar para desarrollo. Las que no aplican
     (flujo no publicado, sin paquete) no aparecen. */
  function itemMenu(href, icono, texto, oculto, extra, fin) {
    return '<li><a class="pux-menu__item" href="' + esc(href) + '"' + (extra || '') + '>' +
      '<i class="icon ' + icono + ' icon-20" aria-hidden="true"></i>' +
      '<span class="pux-menu__label">' + texto + (oculto ? '<span class="visually-hidden"> ' + oculto + '</span>' : '') + '</span>' +
      (fin || '') +
    '</a></li>';
  }
  function menuFila(f, detalle) {
    var menuId = 'acciones-' + f.id;
    var items = [];
    if (f.publicado) {
      items.push(itemMenu(f.url, 'icon-eye', 'Visualizar', esc(f.nombre) + ' (se abre en una pestaña nueva)', ' target="_blank" rel="noopener"',
        '<i class="icon icon-arrow-square-out icon-16 pux-menu__ext" aria-hidden="true"></i>'));
    }
    items.push(itemMenu(detalle, 'icon-info', 'Ver detalle', 'de ' + esc(f.nombre)));
    if (f.descarga && f.descarga.url) {
      items.push(itemMenu(f.descarga.url, 'icon-download-simple',
        'Descargar para desarrollo <span class="pux-menu__peso">' + esc(peso(f.descarga.bytes)) + '</span>',
        esc(f.nombre) + ', archivo ZIP', ' download="' + esc(f.descarga.archivo) + '"'));
    }
    return '<div class="pux-menu">' +
      '<button type="button" class="mp-btn mp-btn--terciario pux-acc__btn pux-acc__btn--neutral pux-menu__trigger" aria-expanded="false" aria-controls="' + esc(menuId) + '">' +
        '<i class="icon icon-dots-three-vertical icon-20" aria-hidden="true"></i>' +
        '<span class="visually-hidden">Acciones de ' + esc(f.nombre) + '</span>' +
        '<span class="pux-tip" aria-hidden="true">Acciones</span>' +
      '</button>' +
      '<ul class="pux-menu__panel" id="' + esc(menuId) + '" role="list" hidden>' + items.join('') + '</ul>' +
    '</div>';
  }
  function tarjetasFlujos(items, plataforma, cat) {
    return '<ul class="pux-fcards" role="list" aria-label="Prototipos de ' + esc(plataforma) + '">' +
      items.map(function (f) { return tarjetaFlujo(f, cat); }).join('') + '</ul>';
  }

  /* El iframe se renderiza a 1280 px y se encoge al ancho real de la tarjeta. */
  var miniaturasObs = null;
  function initMiniaturas(root) {
    var shots = $all('.pux-fcard__shot--live', root);
    if (!shots.length) return;
    function ajustar(el) {
      // Cubre el marco (como object-fit: cover): en la fila la miniatura puede ser
      // más alta que 16:10, y así no queda franja vacía debajo.
      var w = el.clientWidth, h = el.clientHeight;
      if (w) el.style.setProperty('--pux-escala', Math.max(w / 1280, h / 800).toFixed(4));
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

  /* Vista de lista (predeterminada): una fila por prototipo con lo necesario para decidir. */
  function tablaFlujos(items, plataforma, cat) {
    return '<div class="mp-table-wrap pux-table pux-catalogo"><table class="mp-table mp-table--hover">' +
      '<caption class="visually-hidden">Prototipos de ' + esc(plataforma) + '</caption>' +
      '<thead><tr><th scope="col">Prototipo</th><th scope="col">Plataforma</th><th scope="col">Estado</th><th scope="col">Actualizado</th>' +
      '<th scope="col" class="mp-table__actions"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>' +
      items.map(function (f) {
        return '<tr' + (f.publicado ? '' : ' class="is-unpublished"') + '>' +
          '<th scope="row"><a class="pux-catalogo__nombre" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a>' +
            '<span class="pux-catalogo__desc">' + esc(f.descripcion) + '</span>' +
            '<span class="pux-tags">' + tagsEntrega(f) + '</span></th>' +
          '<td data-label="Plataforma">' + tagPlataforma(f.plataforma, cat) + '</td>' +
          '<td data-label="Estado">' + badgeEstado(f.estado) + '</td>' +
          '<td data-label="Actualizado" class="pux-catalogo__fecha">' + (f.actualizado ? '<time datetime="' + esc(f.actualizado) + '">' + esc(fecha(f.actualizado)) + '</time>' : 'Sin fecha') + '</td>' +
          '<td class="mp-table__actions">' + accionesCatalogo(f) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- Detalle ---------- */
  /** Versiones publicadas de un flujo: instantáneas inmutables que se abren sin tocar la vigente. */
  function versionesFlujo(f) {
    var vs = f.versiones || [];
    var cuerpo;
    if (!vs.length) {
      cuerpo = vacio('Aún no hay versiones publicadas de este flujo',
        'Los cambios de desarrollo aparecen en «Últimos cambios». Una versión se publica de forma explícita y queda guardada tal como se veía y funcionaba ese día.');
    } else {
      cuerpo = '<ol class="pux-versions" role="list">' + vs.map(function (v) {
        var etiquetas = (v.vigente ? tag('Versión vigente', 'success') : '');
        var dsTxt = v.ds ? (v.ds.tag || ('commit ' + v.ds.commit)) : null;
        var cambios = v.cambiosSinVersion > 0
          ? '<p class="pux-muted pux-note">Desde esta versión hay ' + v.cambiosSinVersion + (v.cambiosSinVersion === 1 ? ' cambio' : ' cambios') + ' en desarrollo que aún no se publicaron como versión.</p>'
          : '';
        return '<li class="pux-version' + (v.vigente ? ' is-publicada' : '') + '">' +
          '<span class="pux-version__dot" aria-hidden="true"></span>' +
          '<div class="pux-version__body">' +
            '<div class="pux-version__head">' +
              '<h3 class="pux-version__tag">v' + esc(v.version) + '</h3>' +
              (etiquetas ? '<span class="pux-tags">' + etiquetas + '</span>' : '') +
              '<time class="pux-version__fecha" datetime="' + esc(v.publicadaEl) + '">Publicada el ' + esc(fecha(v.publicadaEl)) + '</time>' +
            '</div>' +
            '<p class="pux-version__titulo">' + esc(v.notas) + '</p>' +
            '<p class="pux-muted pux-note">Estado: ' + esc((ESTADOS[estadoNormal((v.estadoUX || {}).estado)] || {}).label || '—') +
              ' · Sistema de diseño: ' + esc(dsTxt || 'sin registro') + ' · commit <code>' + esc(v.commit) + '</code></p>' +
            cambios +
            '<div class="pux-version__acciones">' +
              '<a class="mp-btn mp-btn--secundario" href="' + esc(v.url) + '" target="_blank" rel="noopener">Abrir la versión ' + esc(v.version) +
                '<span class="visually-hidden"> de ' + esc(f.nombre) + ' (se abre en una pestaña nueva)</span></a>' +
            '</div>' +
          '</div></li>';
      }).join('') + '</ol>';
    }
    return '<section class="pux-section pux-section--tight" aria-labelledby="versiones-flujo"><div class="pux-container"><div class="pux-panel">' +
      '<h2 class="mp-h6 pux-section__title" id="versiones-flujo">Versiones publicadas' +
        (vs.length ? ' <span class="pux-count">' + vs.length + '</span>' : '') + '</h2>' +
      '<p class="pux-muted">Cada versión conserva sus archivos y el sistema de diseño exacto que usó. Abrirla no cambia el prototipo vigente.</p>' +
      cuerpo +
    '</div></div></section>';
  }
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
    /* Ficha completa (resumen, pantallas y HU, versiones, despliegues): js/ficha-flujo.js. */
    if (window.PortalFicha) {
      window.PortalFicha.render(cont, f, cat, {
        esc: esc, $: $, $all: $all, estadoNormal: estadoNormal, fecha: fecha, fechaHora: fechaHora, tag: tag, vacio: vacio, badgeEstado: badgeEstado,
        tagPlataforma: tagPlataforma, tagsCategorias: tagsCategorias, tagsEntrega: tagsEntrega, botonVisualizar: botonVisualizar, abrirDrawer: abrirDrawer, cerrarDrawer: cerrarDrawer,
        initPreview: initPreview, dsEnPrototipos: dsEnPrototipos, sinV: sinV, ESTADOS: ESTADOS, SEP_RUTA: SEP_RUTA, params: params
      });
      return;
    }
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
            (f.plataforma === 'app' ? '' : '<div class="mp-tabs" role="group" aria-label="Tamaño de la vista previa">' +
              '<button class="mp-tab is-active" type="button" aria-pressed="true" data-viewport="desktop">Escritorio</button>' +
              '<button class="mp-tab" type="button" aria-pressed="false" data-viewport="mobile">Móvil</button>' +
            '</div>') +
          '</div>' +
          '<p class="pux-muted">La vista previa es solo para explorar. Para comentar, abre el prototipo completo.</p>' +
          '<div class="pux-preview" data-preview data-viewport-actual="' + (f.plataforma === 'app' ? 'mobile' : 'desktop') + '">' +
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
        '<div class="pux-tags">' + tagPlataforma(f.plataforma, cat) + badgeEstado(f.estado) + tagsCategorias(f) + tagsEntrega(f) + '</div>' +
        '<h1 class="pux-page-head__title">' + esc(f.nombre) + '</h1>' +
        '<p class="mp-body-xl pux-page-head__lead">' + esc(f.descripcion) + '</p>' +
        '<div class="pux-hero__actions">' + abrir + figma + '</div>' +
      '</div></section>' +
      '<section class="pux-section" aria-label="Ficha del flujo"><div class="pux-container">' + ficha + '</div></section>' +
      versionesFlujo(f) +
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

  /* ---------- Versiones del sistema de diseño (una sola fuente) ----------
     El Centro de recursos y «Versiones del sistema de diseño» pintan esta misma lista:
     las etiquetas (tags) del repositorio unidas a lo que está publicado en el CDN.
     Cada página solo decide qué acciones muestra en cada versión. */
  function entradasVersiones(cat) {
    var ds = dsDe(cat);
    var paq = paqueteCdn(cat, 'compensar');
    var cdn = (paq && paq.versiones) || [];
    var vistos = {};
    var todas = (ds.versiones || []).map(function (t) { vistos[sinV(t.tag)] = 1; return { ver: sinV(t.tag), t: t }; });
    cdn.forEach(function (c) { if (!vistos[c.version]) todas.push({ ver: c.version, t: null }); });
    todas.forEach(function (e) { e.cdn = cdn.filter(function (c) { return c.version === e.ver; })[0] || null; });
    todas.sort(function (a, b) {
      var x = a.ver.split('.').map(Number), y = b.ver.split('.').map(Number);
      for (var i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i];
      return 0;
    });
    return todas;
  }
  function htmlVersiones(cat, acciones) {
    var todas = entradasVersiones(cat);
    if (!todas.length) return vacio('Todavía no hay versiones', 'El sistema de diseño aún no tiene versiones publicadas con una etiqueta.');
    var ia = cat.ia || null;
    return '<ol class="pux-versions" role="list">' + todas.map(function (e, i) {
      var v = e.t || {};
      var cdnV = e.cdn;
      var anterior = todas[i + 1];
      var etq = (i === 0 ? tag('Más reciente', 'info') : tag('Anterior', 'neutral')) +
        (cdnV ? ' ' + tag('En el CDN', 'success') : ' ' + tag('Sin paquete publicado', 'neutral')) +
        (v.enPrototipos ? ' ' + tag('En los prototipos', 'orange') : '');
      var compat = '';
      if (cdnV) {
        var iguales = ORDEN_PLATAFORMAS.map(function (p) {
          var pq = paqueteCdn(cat, 'compensar-' + p);
          return pq && pq.versiones[0].commit && pq.versiones[0].commit === cdnV.commit ? nombrePlataforma(p, cat) + ' v' + pq.versiones[0].version : null;
        }).filter(Boolean);
        compat = '<p class="pux-version__cuerpo"><strong>Compatibilidad:</strong> ' + (iguales.length ? 'paquetes generados con el mismo commit: ' + esc(iguales.join(', ')) + '.' : 'no hay paquetes de plataforma generados con el mismo commit.') + '</p>';
      }
      var cambios = v.cambios && v.cambios.length
        ? '<ul class="pux-version__commits" role="list">' + v.cambios.map(function (c) { return '<li><span>' + esc(mensajeCambio(c.mensaje)) + '</span> <code>' + esc(c.commit) + '</code></li>'; }).join('') + '</ul>'
        : '<p class="pux-muted pux-note">' + (anterior ? 'No hay commits registrados entre v' + esc(anterior.ver) + ' y v' + esc(e.ver) + '.' : 'Es la primera versión registrada.') + '</p>';
      var acc = acciones ? acciones(e, ia) : '';
      var f = v.fecha || (cdnV && cdnV.fecha);
      return '<li class="pux-version' + (cdnV ? ' is-publicada' : '') + '"><span class="pux-version__dot" aria-hidden="true"></span><div class="pux-version__body">' +
        '<div class="pux-version__head"><h3 class="pux-version__tag">v' + esc(e.ver) + '</h3><span class="pux-tags">' + etq + '</span>' +
          (f ? '<time class="pux-version__fecha" datetime="' + esc(f) + '">' + esc(fecha(f)) + '</time>' : '') + '</div>' +
        (v.titulo ? '<p class="pux-version__titulo">' + esc(tituloVersion(v)) + '</p>' : '') +
        (v.revisar ? '<p class="pux-version__revisar"><i class="icon icon-eye icon-20" aria-hidden="true"></i><span><strong>Qué revisar:</strong> ' + esc(v.revisar) + '</span></p>' : '') +
        '<details class="pux-version__det"><summary>Ver detalles<span class="visually-hidden"> de la versión ' + esc(e.ver) + '</span></summary>' + compat +
          '<p class="pux-version__cuerpo"><strong>Cambios respecto a ' + (anterior ? 'v' + esc(anterior.ver) : 'la versión anterior') + ':</strong></p>' + cambios + '</details>' +
        (acc ? '<div class="pux-version__acciones">' + acc + '</div>' : '') +
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
    $all('[data-sync-alert]').forEach(function (a) { a.hidden = est.sincronizacion.estado === 'al-dia'; });

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
    var f = fecha((va && va.fecha) || ds.fecha);
    cont.innerHTML = '<p class="pux-dsver">Versión <strong>' + esc(dsVersion(cat)) + '</strong>' +
      (f ? ', publicada el ' + esc(f) : '') + '</p>';
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

  /** 1024 bytes → "1 kB"; en español el separador decimal es la coma. */
  function peso(bytes) {
    var b = Number(bytes) || 0;
    return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' kB';
  }
  /** Paquetes que el build arma con la versión publicada del sistema de diseño. */
  function descargasDS(cat) {
    var cont = $('[data-ds-descargas]');
    if (!cont) return;
    var lista = dsDe(cat).descargas || [];
    if (!lista.length) {
      cont.innerHTML = vacio('Todavía no hay paquetes', 'Se generan al publicar el portal.');
      return;
    }
    cont.innerHTML = '<ul class="pux-descargas" role="list">' + lista.map(function (d) {
      return '<li class="pux-panel pux-descarga">' +
        '<div class="pux-descarga__txt">' +
          '<h3 class="mp-body-x-l pux-descarga__tit">' + esc(d.nombre) + '</h3>' +
          '<p class="pux-descarga__desc">' + esc(d.descripcion) + '</p>' +
          '<p class="pux-descarga__meta">' + esc(d.archivo) + ' · ' + esc(peso(d.bytes)) +
            ' · ' + d.contenido + ' archivos</p>' +
        '</div>' +
        '<a class="mp-btn mp-btn--primario mp-btn--icon-right pux-descarga__btn" href="' + esc(d.url) + '" download>' +
          'Descargar<span class="visually-hidden"> ' + esc(d.nombre) + ' (' + esc(d.version) + ')</span>' +
          ' <i class="icon icon-download-simple icon-20" aria-hidden="true"></i></a>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function initDSPagina(cat, est) {
    if (!$('[data-ds-accesos]')) return;
    versionDSBloque(cat);
    avisoDS(cat, est);
    descargasDS(cat);
    accesosDS(cat, est);
  }

  /* ---------- Centro de recursos: CDN, descargas, documentación para IA y versiones ---------- */
  /** URL pública de los paquetes: la configurada en fuentes.json o, si no hay, la del propio portal. */
  function baseCdn(cat) {
    var c = cat.cdn || {};
    if (c.base) return c.base;
    return new URL((c.ruta || 'cdn') + '/', window.location.href).href.replace(/\/$/, '');
  }
  function paqueteCdn(cat, id) {
    return ((cat.cdn && cat.cdn.paquetes) || []).filter(function (p) { return p.id === id; })[0] || null;
  }
  function versionDe(paq, v) {
    return paq ? (paq.versiones.filter(function (x) { return x.version === v; })[0] || paq.versiones[0]) : null;
  }
  /* integrity + crossorigin solo si se pide: sin CORS en el servidor, el navegador
     bloquea el archivo completo. El sitio estático de Azure hoy no envía CORS. */
  function etiquetaLink(url, a, sri) {
    return '<link rel="stylesheet" href="' + url + '/' + a.nombre + '"' +
      (sri ? '\n      integrity="' + a.integrity + '" crossorigin="anonymous"' : '') + '>';
  }
  function etiquetaScript(url, a, sri) {
    return '<script src="' + url + '/' + a.nombre + '"' +
      (sri ? '\n        integrity="' + a.integrity + '" crossorigin="anonymous"' : '') + ' defer></' + 'script>';
  }
  function bloqueCodigo(id, titulo, codigo, etiquetaBoton) {
    return '<div class="pux-code">' +
      '<div class="pux-code__cab"><span class="pux-code__tit" id="' + id + '-t">' + esc(titulo) + '</span>' +
        '<button class="mp-btn mp-btn--terciario mp-btn--sm pux-code__copiar" type="button" data-copiar="' + id + '" data-etiqueta="' + esc(etiquetaBoton || 'Copiar') + '" aria-describedby="' + id + '-t">' + esc(etiquetaBoton || 'Copiar') + '</button></div>' +
      '<pre class="pux-code__pre" id="' + id + '" tabindex="0"><code>' + esc(codigo) + '</code></pre>' +
    '</div>';
  }
  function opcionesVersion(paq, actual) {
    return paq.versiones.map(function (v, i) {
      return '<option value="' + esc(v.version) + '"' + (v.version === actual ? ' selected' : '') + '>v' + esc(v.version) + (i === 0 ? ' — Más reciente' : '') + '</option>';
    }).join('');
  }

  var CENTRO_TABS = [
    { id: 'cdn', nombre: 'CDN' },
    { id: 'descargas', nombre: 'Descargas' },
    { id: 'ia', nombre: 'Documentación para IA' },
    { id: 'versiones', nombre: 'Versiones' }
  ];
  var CENTRO_PLATS = { drupal: 'Drupal', zt: 'Zona Transaccional (ZT)', app: 'App' };
  var ICONO_DL = { core: 'icon-package', drupal: 'icon-globe', zt: 'icon-desktop', app: 'icon-device-mobile' };

  function listaArchivos(arch) {
    return '<ul class="pux-dl__lista" role="list">' + arch.map(function (a) { return '<li><code>' + esc(a[0]) + '</code>' + (a[1] ? ' <span class="pux-muted">' + esc(a[1]) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
  }
  function datoDl(titulo, html) { return '<div class="pux-dl__dato"><dt>' + esc(titulo) + '</dt><dd>' + html + '</dd></div>'; }
  function botonDescarga(url, texto, nombre, secundario) {
    return '<a class="mp-btn mp-btn--' + (secundario ? 'secundario' : 'primario') + ' mp-btn--icon-right" href="' + esc(url) + '" download data-descarga="' + esc(nombre) + '">' +
      esc(texto) + ' <i class="icon icon-download-simple icon-20" aria-hidden="true"></i></a>';
  }
  function tarjetaDl(o) {
    return '<li class="pux-panel pux-dl" data-dl="' + esc(o.id) + '">' +
      '<div class="pux-dl__cab"><span class="pux-kit__icono" aria-hidden="true"><i class="icon ' + (ICONO_DL[o.id] || 'icon-package') + ' icon-32"></i></span>' +
        '<div><h3 class="pux-dl__tit">' + esc(o.titulo) + '</h3>' + (o.version ? '<p class="pux-dl__ver">' + esc(o.version) + '</p>' : '') + '</div></div>' +
      '<p class="pux-descarga__desc">' + esc(o.desc) + '</p>' +
      '<dl class="pux-dl__datos">' + o.datos.join('') + '</dl>' +
      (o.instrucciones ? '<details class="pux-dl__det"><summary>Instrucciones de integración</summary><ol>' + o.instrucciones.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol></details>' : '') +
      '<div class="pux-dl__acciones">' + (o.acciones || '') + '</div>' +
    '</li>';
  }
  /** Compatibilidad solo si está registrada: paquete de plataforma y Core salen del mismo commit. */
  function compatibilidad(vP, vD) {
    if (vP && vD && vP.commit && vD.commit && vP.commit === vD.commit) return 'Generado junto con el Core v' + esc(vD.version) + ' (mismo commit <code>' + esc(vP.commit) + '</code>).';
    return 'Sin compatibilidad registrada con el Core v' + esc(vD ? vD.version : '—') + '.';
  }

  function initCentro(cat) {
    var root = $('[data-centro]');
    if (!root) return;
    var ds = paqueteCdn(cat, 'compensar');
    if (!ds) {
      root.innerHTML = vacio('Todavía no hay paquetes publicados', 'Se generan con node scripts/build-dist.mjs en el sistema de diseño y se publican con el portal.');
      return;
    }
    var dsi = dsDe(cat);
    var base = baseCdn(cat);
    var ia = cat.ia || null;
    var q = params();
    var hashTab = (window.location.hash || '').replace('#', '');
    var st = {
      tab: CENTRO_TABS.some(function (t) { return t.id === hashTab; }) ? hashTab : 'cdn',
      v: ds.versiones.some(function (x) { return x.version === q.get('v'); }) ? q.get('v') : ds.versiones[0].version,
      plat: CENTRO_PLATS[q.get('p')] ? q.get('p') : '',
      sri: false
    };
    var ultima = ds.versiones[0];
    var tagUltima = ((dsi.versiones || []).filter(function (x) { return sinV(x.tag) === ultima.version; })[0]) || null;

    /* Cabecera: la última versión sale del catálogo, no está escrita a mano. */
    var cab = $('[data-centro-cab]');
    if (cab) {
      var fechaPub = ultima.fecha || (tagUltima && tagUltima.fecha) || null;
      cab.innerHTML =
        '<p class="pux-centro__ver"><span class="pux-centro__etq">Última versión</span> <strong class="pux-centro__num">v' + esc(ultima.version) + '</strong></p>' +
        '<ul class="pux-centro__meta" role="list">' +
          '<li>' + tag('Más reciente', 'info') + ' ' + tag('Publicada', 'success') + (dsEnPrototipos(cat) && sinV(dsEnPrototipos(cat)) === ultima.version ? ' ' + tag('En los prototipos', 'orange') : '') + '</li>' +
          '<li>' + (fechaPub ? 'Publicada el <time datetime="' + esc(fechaPub) + '">' + esc(fecha(fechaPub)) + '</time>' : 'Fecha de publicación no registrada') + '</li>' +
          '<li><a class="pux-link" href="#versiones" data-ir="versiones">Historial de cambios</a></li>' +
        '</ul>';
    }

    var plats = ORDEN_PLATAFORMAS;
    function nombrePlat(p) { return CENTRO_PLATS[p] || (cat.plataformas[p] || {}).nombre || p; }

    var tabsHtml = '<div class="pux-tabs" role="tablist" aria-label="Secciones del Centro de recursos">' + CENTRO_TABS.map(function (t) {
      return '<button class="pux-tab" type="button" role="tab" id="tab-' + t.id + '" aria-controls="panel-' + t.id + '" data-tab="' + t.id + '">' + esc(t.nombre) + '</button>';
    }).join('') + '</div>';

    var selVersion = function (id) {
      return '<div class="pux-inst-campo"><label for="' + id + '">Versión del sistema de diseño</label>' +
        '<select id="' + id + '" class="pux-select" data-centro-v>' + opcionesVersion(ds, st.v) + '</select></div>';
    };

    root.innerHTML = tabsHtml +
      '<div class="pux-centro__vivo visually-hidden" role="status" aria-live="polite" data-centro-vivo></div>' +
      /* CDN */
      '<section class="pux-tabpanel" role="tabpanel" id="panel-cdn" aria-labelledby="tab-cdn" tabindex="0" hidden>' +
        (cat.cdn && cat.cdn.base ? '' :
          '<div class="mp-alert mp-alert--warning pux-inst-aviso" role="note"><i class="icon icon-info icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content">' +
          '<p class="mp-alert__title">URL pública provisional</p><p class="mp-alert__body">Mientras no se configure la URL definitiva (<code>cdn.base</code> en <code>fuentes.json</code>), los enlaces apuntan a este mismo portal. Funcionan, pero cambiarán cuando exista la URL pública.</p></div></div>') +
        '<div class="pux-panel pux-inst-form">' + selVersion('cdn-v') +
          '<fieldset class="pux-inst-campo pux-plat"><legend>Plataforma</legend><div class="pux-plat__op">' +
            [''].concat(plats).map(function (p) {
              return '<label class="pux-plat__item"><input type="radio" name="cdn-plat" value="' + p + '" data-centro-plat' + (p === st.plat ? ' checked' : '') + '><span>' + esc(p ? nombrePlat(p) : 'Solo Core') + '</span></label>';
            }).join('') +
          '</div></fieldset>' +
          '<div class="pux-inst-campo pux-inst-check"><label><input type="checkbox" data-centro-sri> Verificación de integridad (SRI)</label>' +
            '<span class="pux-muted" data-sri-msg></span></div>' +
        '</div>' +
        '<div data-cdn-res></div>' +
      '</section>' +
      /* Descargas */
      '<section class="pux-tabpanel" role="tabpanel" id="panel-descargas" aria-labelledby="tab-descargas" tabindex="0" hidden>' +
        '<div class="pux-panel pux-inst-form">' + selVersion('dl-v') +
          '<p class="pux-muted pux-inst-nota">La versión elegida se aplica a las cuatro descargas. Los paquetes de plataforma se publican con su propia versión.</p></div>' +
        '<ul class="pux-descargas pux-dls" role="list" data-dl-res></ul>' +
      '</section>' +
      /* IA */
      '<section class="pux-tabpanel" role="tabpanel" id="panel-ia" aria-labelledby="tab-ia" tabindex="0" hidden><div data-ia-res></div></section>' +
      /* Versiones */
      '<section class="pux-tabpanel" role="tabpanel" id="panel-versiones" aria-labelledby="tab-versiones" tabindex="0" hidden><div data-ver-res></div></section>';

    var vivo = $('[data-centro-vivo]', root);
    function anunciar(msg) { vivo.textContent = ''; setTimeout(function () { vivo.textContent = msg; }, 30); }

    /* ---- CDN ---- */
    function pintarCdn() {
      var vDs = versionDe(ds, st.v);
      var urlDs = base + '/compensar/v' + vDs.version;
      var paqP = st.plat ? paqueteCdn(cat, 'compensar-' + st.plat) : null;
      var vP = paqP ? paqP.versiones[0] : null;
      var urlP = vP ? base + '/' + paqP.id + '/v' + vP.version : null;
      var archivosSri = [vDs.css, vDs.js].concat(vP ? [vP.css, (vP.js && vP.js.bytes > 0) ? vP.js : null] : []).filter(Boolean);
      var hashes = archivosSri.every(function (a) { return !!a.integrity; });
      var mismoOrigen = !(cat.cdn && cat.cdn.base);
      var sriPosible = hashes && (mismoOrigen || (cat.cdn && cat.cdn.cors === true));
      var cb = $('[data-centro-sri]', root);
      var msg = $('[data-sri-msg]', root);
      if (!sriPosible) st.sri = false;
      cb.disabled = !sriPosible;
      cb.checked = st.sri;
      msg.textContent = !hashes ? 'No disponible: algún archivo no tiene hash registrado.'
        : (!sriPosible ? 'No disponible: el servidor público actual no envía CORS y el navegador bloquearía los archivos.' : 'Añade integrity y crossorigin a cada etiqueta.');

      var sri = st.sri;
      var filas = { css: [], js: [] };
      function fila(tipo, grupo, url, a) {
        var etiqueta = tipo === 'css' ? etiquetaLink(url, a, sri) : etiquetaScript(url, a, sri);
        filas[tipo].push({ grupo: grupo, nombre: a.nombre, bytes: a.bytes, url: url + '/' + a.nombre, etiqueta: etiqueta });
      }
      fila('css', 'Core v' + vDs.version, urlDs, vDs.css);
      fila('js', 'Core v' + vDs.version, urlDs, vDs.js);
      var avisos = [];
      if (st.plat && !paqP) avisos.push('No hay un paquete web publicado para ' + nombrePlat(st.plat) + '.');
      if (vP) {
        var gP = 'Paquete ' + nombrePlat(st.plat) + ' v' + vP.version;
        if (vP.css) fila('css', gP, urlP, vP.css); else avisos.push('El paquete ' + nombrePlat(st.plat) + ' no incluye CSS en esta versión.');
        if (vP.js && vP.js.bytes > 0) fila('js', gP, urlP, vP.js); else avisos.push('El paquete ' + nombrePlat(st.plat) + ' no incluye JavaScript en esta versión.');
      }
      function lista(tipo, titulo) {
        return '<section class="pux-recursos" aria-labelledby="rec-' + tipo + '"><h3 class="mp-h6 pux-section__title" id="rec-' + tipo + '">' + titulo + '</h3>' +
          '<ul class="pux-recursos__lista" role="list">' + filas[tipo].map(function (f) {
            return '<li class="pux-recurso"><div class="pux-recurso__info"><span class="pux-recurso__nombre">' + esc(f.nombre) + '</span>' +
              '<span class="pux-recurso__grupo">' + esc(f.grupo) + ' · ' + esc(peso(f.bytes)) + '</span>' +
              '<code class="pux-recurso__url">' + esc(f.url) + '</code></div>' +
              '<div class="pux-recurso__acciones">' +
                '<button class="mp-btn mp-btn--secundario mp-btn--sm" type="button" data-copiar-valor="' + esc(f.url) + '" data-etiqueta="Copiar enlace" aria-label="Copiar enlace de ' + esc(f.nombre) + '">Copiar enlace</button>' +
                '<button class="mp-btn mp-btn--terciario mp-btn--sm" type="button" data-copiar-valor="' + esc(f.etiqueta) + '" data-etiqueta="Copiar etiqueta" aria-label="Copiar etiqueta HTML de ' + esc(f.nombre) + '">Copiar etiqueta</button>' +
              '</div></li>';
          }).join('') + '</ul></section>';
      }
      var cssTxt = filas.css.map(function (f, i) {
        return '<!-- ' + (i + 1) + '. ' + f.grupo + ' -->\n' + f.etiqueta;
      }).concat(['<!-- ' + (filas.css.length + 1) + '. CSS propio del flujo o aplicación -->\n<link rel="stylesheet" href="css/mi-pantalla.css">']).join('\n');
      var jsTxt = filas.js.map(function (f) { return f.etiqueta; }).join('\n');
      var integracion = '<!-- Dentro de <head> -->\n' + cssTxt + '\n\n<!-- Antes de </body> -->\n' + jsTxt;
      var pasos = [
        'Pega los enlaces CSS dentro de <code>&lt;head&gt;</code>, en este orden: Core' + (vP ? ', paquete ' + esc(nombrePlat(st.plat)) : '') + ' y, al final, el CSS propio del flujo.',
        'Pega los scripts antes de cerrar <code>&lt;/body&gt;</code>, con <code>defer</code>.',
        'El tema se elige con <code>data-theme</code> en <code>&lt;html&gt;</code>: <code>light</code>, <code>dark</code> o <code>high-contrast</code>. La letra Roboto se carga desde Google Fonts y los iconos van incluidos en el CSS.'
      ];
      if (st.plat === 'zt') pasos.push('Menú lateral de ZT: declara la ruta a la raíz con <code>data-zt-root</code>, por ejemplo <code>&lt;nav class="sidebar" data-zt-root="../../"&gt;</code>.');
      if (st.plat === 'app') pasos.push('Este paquete es la representación web de la App. La aplicación nativa (.NET MAUI) no usa CSS ni JavaScript: usa los recursos XAML de la pestaña <a class="pux-link" href="#descargas" data-ir="descargas">Descargas</a>.');
      var metaDs = '<p class="pux-muted pux-inst-meta">Core v' + esc(vDs.version) + (vDs.commit ? ' · commit ' + esc(vDs.commit) : '') + (vP ? ' · Paquete ' + esc(nombrePlat(st.plat)) + ' v' + esc(vP.version) + ' (' + compatibilidad(vP, vDs) + ')' : '') + '</p>';
      $('[data-cdn-res]', root).innerHTML =
        avisos.map(function (a) { return '<div class="mp-alert mp-alert--warning pux-inst-aviso" role="note"><i class="icon icon-warning icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content"><p class="mp-alert__body">' + esc(a) + '</p></div></div>'; }).join('') +
        lista('css', 'CSS') + lista('js', 'JavaScript') +
        '<section class="pux-recursos" aria-labelledby="rec-int"><h3 class="mp-h6 pux-section__title" id="rec-int">Integración completa</h3>' +
          bloqueCodigo('cdn-integracion', 'HTML con todas las dependencias', integracion, 'Copiar integración completa') +
          '<ol class="pux-pasos">' + pasos.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>' + metaDs +
        '</section>';
    }

    /* ---- Descargas ---- */
    function pintarDescargas() {
      var vDs = versionDe(ds, st.v);
      var kits = cat.cdn.kits || [];
      var tarjetas = [];
      var instrWeb = function (n) { return ['Descomprime el .zip y copia la carpeta en tu proyecto, conservando su estructura.', 'Enlaza el CSS en <code>&lt;head&gt;</code> y el JS antes de <code>&lt;/body&gt;</code>' + (n ? ', después del Core' : '') + '.', 'O usa el enlace público desde la pestaña <a class="pux-link" href="#cdn" data-ir="cdn">CDN</a>.']; };
      var fuentes = (dsi.descargas || []).filter(function (d) { return d.id === 'core'; })[0];
      var coreArchivos = (vDs.archivos || []).map(function (a) { return [a.nombre, peso(a.bytes)]; }).concat([['manifest.json', ''], ['LEEME.txt', '']]);
      tarjetas.push(tarjetaDl({
        id: 'core', titulo: 'Core del sistema de diseño', version: 'v' + vDs.version,
        desc: 'Estilos, componentes, temas e iconos del sistema de diseño, ya compilados. Es la base de Drupal, ZT y la representación web de la App.',
        datos: [datoDl('Archivos incluidos', listaArchivos(coreArchivos)), datoDl('Tamaño del paquete', esc(peso(vDs.zip.bytes))), datoDl('Dependencias', 'Ninguna.')],
        instrucciones: instrWeb(false),
        acciones: botonDescarga(vDs.zip.url, 'Descargar Core', vDs.zip.archivo) +
          (fuentes && sinV(fuentes.version) === vDs.version ? '<a class="pux-link" href="' + esc(fuentes.url) + '" download data-descarga="' + esc(fuentes.archivo) + '">Fuentes sin compilar (' + esc(peso(fuentes.bytes)) + ')</a>' : '')
      }));
      ['drupal', 'zt'].forEach(function (p) {
        var paq = paqueteCdn(cat, 'compensar-' + p);
        var kit = kits.filter(function (k) { return k.id === p; })[0];
        var kitV = kit && kit.versiones.filter(function (x) { return x.version === vDs.version; })[0];
        var nom = nombrePlat(p);
        if (!paq) {
          tarjetas.push(tarjetaDl({ id: p, titulo: nom, desc: 'Todavía no hay recursos publicados para esta plataforma.', datos: [], acciones: '<p class="pux-muted">No disponible.</p>' }));
          return;
        }
        var vP = paq.versiones[0];
        tarjetas.push(tarjetaDl({
          id: p, titulo: nom, version: 'Paquete v' + vP.version,
          desc: (p === 'zt' ? 'Modal, stepper, dropdown, alert y demás componentes de la oficina virtual.' : 'Navegación y estilos del portal web.') + ' No incluye el Core.',
          datos: [
            datoDl('Versión compatible', compatibilidad(vP, vDs)),
            datoDl('Dependencias', 'Core del sistema de diseño v' + esc(vDs.version) + ', cargado antes.'),
            datoDl('Recursos específicos', listaArchivos((vP.archivos || []).map(function (a) { return [a.nombre, peso(a.bytes)]; }))),
            datoDl('Tamaño del paquete', esc(peso(vP.zip.bytes)))
          ],
          instrucciones: instrWeb(true).concat(p === 'zt' ? ['Menú lateral: declara <code>data-zt-root</code> en <code>&lt;nav class="sidebar"&gt;</code>.'] : []),
          acciones: botonDescarga(vP.zip.url, 'Descargar recursos ' + (p === 'zt' ? 'ZT' : nom), vP.zip.archivo) +
            (kitV ? '<a class="pux-link" href="' + esc(kitV.zip.url) + '" download data-descarga="' + esc(kitV.zip.archivo) + '">Core v' + esc(vDs.version) + ' + ' + esc(p === 'zt' ? 'ZT' : nom) + ' en un solo .zip (' + esc(peso(kitV.zip.bytes)) + ')</a>' : '')
        }));
      });
      var pApp = paqueteCdn(cat, 'compensar-app');
      var vApp = pApp && pApp.versiones[0];
      var maui = (dsi.descargas || []).filter(function (d) { return d.id === 'maui'; })[0];
      var mauiOk = maui && sinV(maui.version) === vDs.version;
      var appDatos = [
        datoDl('Tecnología', esc((cat.plataformas.app || {}).tecnologia || 'No definida') + '. La app nativa no usa CSS ni JavaScript.'),
        datoDl('Recursos nativos (.NET MAUI)', mauiOk ? listaArchivos([['Resources/Styles/Compensar.Colors.xaml', 'Colores, claro y oscuro'], ['Resources/Styles/Compensar.Sizes.xaml', 'Espaciados y medidas'], ['LEEME.txt', '']]) + '<span class="pux-muted">' + esc(maui.archivo) + ' · ' + esc(peso(maui.bytes)) + '</span>'
          : '<span class="pux-muted">No hay recursos XAML publicados para Core v' + esc(vDs.version) + (maui ? ' (solo para ' + esc(maui.version) + ')' : '') + '.</span>')
      ];
      if (vApp) appDatos.push(datoDl('Estilos web de la App', listaArchivos((vApp.archivos || []).map(function (a) { return [a.nombre, peso(a.bytes)]; })) + '<span class="pux-muted">Solo para ver la App en el navegador. ' + compatibilidad(vApp, vDs) + '</span>'));
      appDatos.push(datoDl('Dependencias', mauiOk ? 'Tokens del sistema de diseño v' + esc(vDs.version) + '. El paquete web requiere el Core.' : 'El paquete web requiere el Core v' + esc(vDs.version) + '.'));
      tarjetas.push(tarjetaDl({
        id: 'app', titulo: 'App', version: mauiOk ? 'Recursos MAUI ' + maui.version : (vApp ? 'Paquete web v' + vApp.version : ''),
        desc: 'Colores y medidas para la aplicación móvil y, aparte, los estilos de su representación web.',
        datos: appDatos,
        instrucciones: mauiOk ? ['Copia los dos archivos .xaml en <code>Resources/Styles/</code> de tu proyecto MAUI.', 'Agrégalos en <code>App.xaml</code> dentro de <code>ResourceDictionary.MergedDictionaries</code>.', 'Cada color tiene una clave normal (modo claro) y otra terminada en <code>_Dark</code>; úsalas con <code>AppThemeBinding</code>.'] : (vApp ? instrWeb(true) : null),
        acciones: (mauiOk ? botonDescarga(maui.url, 'Descargar recursos App', maui.archivo) : '') +
          (vApp ? botonDescarga(vApp.zip.url, mauiOk ? 'Estilos web de la App' : 'Descargar recursos App', vApp.zip.archivo, mauiOk) : '') +
          (!mauiOk && !vApp ? '<p class="pux-muted">No disponible.</p>' : '')
      }));
      $('[data-dl-res]', root).innerHTML = tarjetas.join('');
    }

    /* ---- Documentación para IA ---- */
    function pintarIA() {
      var cont = $('[data-ia-res]', root);
      if (!ia) {
        cont.innerHTML = vacio('La documentación para IA no está disponible', 'No se generó en la última publicación del portal. Revisa los avisos «docs IA» del build.');
        return;
      }
      var carpetas = {};
      ia.arbol.forEach(function (r) { var k = r.indexOf('/') > 0 ? r.split('/')[0] + '/' : ''; (carpetas[k] = carpetas[k] || []).push(r); });
      var resumen = Object.keys(carpetas).sort().map(function (k) {
        return '<li><code>' + esc(k || 'raíz') + '</code> <span class="pux-muted">' + (k ? carpetas[k].length + ' archivos' : carpetas[k].map(esc).join(', ')) + '</span></li>';
      }).join('');
      cont.innerHTML =
        '<p class="pux-section__intro">Documentación del sistema de diseño en Markdown y JSON, generada de las fuentes oficiales. Dásela a Claude, Kiro u otro agente para que construya interfaces coherentes sin explicarle el sistema cada vez.</p>' +
        '<p class="pux-muted pux-inst-meta">Corresponde al sistema de diseño <strong>v' + esc(ia.version) + '</strong> · generada el ' + esc(fecha(ia.generado)) + ' · commit ' + esc(ia.commit) + ' · ' + ia.componentes + ' componentes · ' + ia.tokens + ' tokens. Solo existe para la versión más reciente.</p>' +
        '<ul class="pux-descargas pux-ia" role="list">' +
          '<li class="pux-panel pux-dl"><div><h3 class="pux-dl__tit">Documentación completa</h3><p class="pux-descarga__desc">Un solo archivo .md con tokens, componentes, patrones, accesibilidad y plataformas.</p></div>' +
            '<div class="pux-dl__acciones">' + botonDescarga(ia.completo.url, 'Descargar documentación completa (.md)', ia.completo.archivo) + '</div><p class="pux-descarga__meta">' + esc(ia.completo.archivo) + ' · ' + esc(peso(ia.completo.bytes)) + '</p></li>' +
          '<li class="pux-panel pux-dl"><div><h3 class="pux-dl__tit">Paquete para IA</h3><p class="pux-descarga__desc">Estructura modular de archivos Markdown y JSON, con README y manifest.json.</p></div>' +
            '<div class="pux-dl__acciones">' + botonDescarga(ia.paquete.url, 'Descargar paquete para IA (.zip)', ia.paquete.archivo) + '</div><p class="pux-descarga__meta">' + esc(ia.paquete.archivo) + ' · ' + esc(peso(ia.paquete.bytes)) + '</p></li>' +
        '</ul>' +
        '<section class="pux-recursos" aria-labelledby="ia-ins"><h3 class="mp-h6 pux-section__title" id="ia-ins">Instrucciones para la IA</h3>' +
          bloqueCodigo('ia-instrucciones', 'Pégalas como instrucciones del proyecto o del agente', ia.instrucciones, 'Copiar instrucciones para IA') + '</section>' +
        '<details class="pux-inst-plantilla"><summary>Qué contiene el paquete</summary><ul class="pux-dl__lista" role="list">' + resumen + '</ul>' +
          (ia.pendientes && ia.pendientes.length ? '<p class="pux-muted">Pendiente de documentación: ' + ia.pendientes.map(esc).join('; ') + '.</p>' : '') +
          (ia.avisos && ia.avisos.length ? '<ul class="pux-dl__lista" role="list">' + ia.avisos.map(function (a) { return '<li class="pux-muted">' + esc(a) + '</li>'; }).join('') + '</ul>' : '') + '</details>';
    }

    /* ---- Versiones ---- */
    function pintarVersiones() {
      var items = htmlVersiones(cat, function (e, iaDoc) {
        return (e.cdn ? '<button class="mp-btn mp-btn--secundario mp-btn--sm" type="button" data-ir="cdn" data-ir-v="' + esc(e.ver) + '">Ver CDN</button>' +
          '<button class="mp-btn mp-btn--secundario mp-btn--sm" type="button" data-ir="descargas" data-ir-v="' + esc(e.ver) + '">Descargar recursos</button>' : '') +
          (iaDoc && iaDoc.version === e.ver ? '<button class="mp-btn mp-btn--secundario mp-btn--sm" type="button" data-ir="ia">Documentación para IA</button>' : '');
      });
      var paquetes = (cat.cdn.paquetes || []).filter(function (p) { return p.id !== 'compensar'; }).map(function (p) {
        return p.versiones.map(function (v) {
          return '<tr><th scope="row">' + esc(nombrePlat(p.plataforma)) + '</th><td>v' + esc(v.version) + '</td><td>' + (v.fecha ? esc(fecha(v.fecha)) : 'Sin fecha') + '</td><td>' + (v.commit ? '<code>' + esc(v.commit) + '</code>' : '—') + '</td>' +
            '<td><a class="pux-link" href="' + esc(v.zip.url) + '" download data-descarga="' + esc(v.zip.archivo) + '">Descargar<span class="visually-hidden"> paquete ' + esc(nombrePlat(p.plataforma)) + ' v' + esc(v.version) + '</span></a></td></tr>';
        }).join('');
      }).join('');
      $('[data-ver-res]', root).innerHTML =
        '<h3 class="mp-h6 pux-section__title">Sistema de diseño</h3>' + items +
        '<p class="pux-muted pux-note">La misma lista aparece, con el estado de sincronización de los prototipos, en <a class="pux-link" href="historial.html">Versiones del sistema de diseño</a>.</p>' +
        '<section class="pux-block" aria-labelledby="ver-plat"><h3 class="mp-h6 pux-section__title" id="ver-plat">Paquetes de plataforma</h3>' +
          (paquetes ? '<div class="mp-table-wrap pux-table"><table class="mp-table"><caption class="visually-hidden">Versiones publicadas de los paquetes de plataforma</caption><thead><tr><th scope="col">Plataforma</th><th scope="col">Versión</th><th scope="col">Fecha</th><th scope="col">Commit</th><th scope="col">Descarga</th></tr></thead><tbody>' + paquetes + '</tbody></table></div>' : vacio('Sin paquetes de plataforma', 'Todavía no se han publicado.')) +
        '</section>' +
        '<section class="pux-block" aria-labelledby="ver-flujos"><h3 class="mp-h6 pux-section__title" id="ver-flujos">Qué versión usa cada flujo</h3>' +
          '<p class="pux-muted">«Copia local»: el flujo carga los archivos desde <code>shared/</code> del repositorio de prototipos. «Enlace público»: ya usa los paquetes versionados.</p>' + tablaVersionesFlujos(cat) + '</section>' +
        '<section class="pux-block" id="politica" aria-labelledby="ver-pol"><h3 class="mp-h6 pux-section__title" id="ver-pol">Política de versiones</h3><div class="pux-panel pux-inst-politica"><ul>' +
          '<li><strong>Versiones fijas.</strong> Cada versión vive en su propia carpeta (<code>cdn/compensar/v' + esc(ultima.version) + '/</code>) y nunca se sobrescribe. Un enlace a una versión siempre entrega lo mismo.</li>' +
          '<li><strong>Numeración semántica.</strong> <code>MAYOR.MENOR.PARCHE</code>: el parche corrige, la menor agrega sin romper y la mayor puede pedir cambios en el HTML.</li>' +
          '<li><strong>Adopción controlada.</strong> Una versión nueva se publica junto a las anteriores. UX la valida flujo por flujo y solo entonces cambia el enlace de ese flujo.</li>' +
          '<li><strong>Integridad.</strong> Cada archivo trae su hash <code>integrity</code> (SRI) en <code>manifest.json</code>. Úsalo solo cuando el servidor envíe CORS.</li>' +
          '<li><strong>Sin «latest».</strong> No hay enlace a «la última versión»: apunta siempre a una versión exacta.</li></ul></div></section>';
    }

    /* ---- estado, pestañas y URL ---- */
    function sincronizarUrl() {
      var p = new URLSearchParams();
      if (st.v !== ds.versiones[0].version) p.set('v', st.v);
      if (st.plat) p.set('p', st.plat);
      var qs = p.toString();
      try { history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + '#' + st.tab); } catch (e) { /* file:// */ }
    }
    function mostrarTab(id, enfocar) {
      st.tab = id;
      $all('.pux-tab', root).forEach(function (b) {
        var on = b.getAttribute('data-tab') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        $('#panel-' + b.getAttribute('data-tab'), root).hidden = !on;
        if (on && enfocar) b.focus();
      });
      sincronizarUrl();
    }
    function fijarVersion(v) {
      st.v = v;
      $all('[data-centro-v]', root).forEach(function (s) { s.value = v; });
      pintarCdn(); pintarDescargas(); sincronizarUrl();
    }
    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-centro-v]')) fijarVersion(e.target.value);
      else if (e.target.matches('[data-centro-plat]')) { st.plat = e.target.value; pintarCdn(); sincronizarUrl(); }
      else if (e.target.matches('[data-centro-sri]')) { st.sri = e.target.checked; pintarCdn(); }
    });
    root.addEventListener('keydown', function (e) {
      var b = e.target.closest && e.target.closest('.pux-tab');
      if (!b) return;
      var ids = CENTRO_TABS.map(function (t) { return t.id; });
      var i = ids.indexOf(b.getAttribute('data-tab'));
      var ni = { ArrowRight: (i + 1) % ids.length, ArrowLeft: (i + ids.length - 1) % ids.length, Home: 0, End: ids.length - 1 }[e.key];
      if (ni === undefined) return;
      e.preventDefault();
      mostrarTab(ids[ni], true);
    });
    function copiarTexto(texto, boton, aviso) {
      function listo() {
        var e = boton.getAttribute('data-etiqueta') || boton.textContent;
        boton.textContent = 'Copiado';
        anunciar(aviso);
        setTimeout(function () { boton.textContent = e; }, 1600);
      }
      function respaldo() {
        var ta = document.createElement('textarea');
        ta.value = texto; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (er) { ok = false; }
        document.body.removeChild(ta);
        if (ok) listo(); else anunciar('No se pudo copiar. Selecciona el texto y cópialo manualmente.');
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(listo, respaldo); else respaldo();
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-copiar], [data-copiar-valor], [data-ir], [data-descarga], .pux-tab');
      if (!t) return;
      if (t.matches('.pux-tab')) { mostrarTab(t.getAttribute('data-tab')); return; }
      if (t.hasAttribute('data-copiar')) {
        var pre = document.getElementById(t.getAttribute('data-copiar'));
        copiarTexto(pre.textContent, t, 'Copiado: ' + (t.getAttribute('data-etiqueta') || 'código').toLowerCase().replace(/^copiar /, ''));
      } else if (t.hasAttribute('data-copiar-valor')) {
        copiarTexto(t.getAttribute('data-copiar-valor'), t, 'Copiado al portapapeles');
      } else if (t.hasAttribute('data-ir')) {
        e.preventDefault();
        if (t.getAttribute('data-ir-v')) fijarVersion(t.getAttribute('data-ir-v'));
        mostrarTab(t.getAttribute('data-ir'), true);
        window.scrollTo(0, 0);
      } else if (t.hasAttribute('data-descarga')) {
        anunciar('Descarga iniciada: ' + t.getAttribute('data-descarga'));
      }
    });
    window.addEventListener('hashchange', function () {
      var h = (window.location.hash || '').replace('#', '');
      if (CENTRO_TABS.some(function (x) { return x.id === h; }) && h !== st.tab) mostrarTab(h);
    });

    pintarCdn(); pintarDescargas(); pintarIA(); pintarVersiones();
    mostrarTab(st.tab);
  }

  /** Tabla de la versión del sistema de diseño y del paquete de plataforma que usa cada flujo. */
  function tablaVersionesFlujos(cat) {
    var local = dsEnPrototipos(cat);
    var ultimo = (paqueteCdn(cat, 'compensar') || { versiones: [{}] }).versiones[0].version;
    var filas = ORDEN_PLATAFORMAS.map(function (pid) {
      return cat.flujos.filter(function (f) { return f.plataforma === pid; });
    }).reduce(function (a, b) { return a.concat(b); }, []).map(function (f) {
      var c = f.consumo || { modo: 'local', ds: [], plataforma: [] };
      var carga = c.modo === 'local' ? tag('Copia local', 'neutral') : (c.modo === 'cdn' ? tag('Enlace público', 'success') : tag('Mixto', 'warning'));
      var vds = c.ds.length ? c.ds.map(function (v) { return 'v' + esc(v); }).join(', ') : (local ? esc(local) + ' <span class="pux-muted">(copia)</span>' : '—');
      var vpl = c.plataforma.length ? c.plataforma.map(function (v) { return 'v' + esc(v); }).join(', ') : '<span class="pux-muted">shared/ local</span>';
      var alDia = c.ds.length && ultimo && c.ds.indexOf(ultimo) < 0 ? ' ' + tag('Hay v' + ultimo, 'info') : '';
      return '<tr>' +
        '<th scope="row"><a class="pux-link" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a></th>' +
        '<td>' + tagPlataforma(f.plataforma, cat) + '</td>' +
        '<td>' + badgeEstado(f.estado) + '</td>' +
        '<td>' + carga + '</td>' +
        '<td>' + vds + alDia + '</td>' +
        '<td>' + vpl + '</td>' +
      '</tr>';
    });
    return '<div class="mp-table-wrap pux-table"><table class="mp-table">' +
      '<caption class="visually-hidden">Versión del sistema de diseño y del paquete de plataforma que usa cada flujo</caption>' +
      '<thead><tr><th scope="col">Flujo</th><th scope="col">Plataforma</th><th scope="col">Estado</th><th scope="col">Cómo carga</th><th scope="col">Sistema de diseño</th><th scope="col">Paquete de plataforma</th></tr></thead>' +
      '<tbody>' + filas.join('') + '</tbody></table></div>';
  }

  /* ---------- Historial: sistema de diseño y plataformas ---------- */
  /** Estado de la copia que los prototipos tienen del sistema de diseño. Sale de una comparación real (estado.json). */
  var SYNC = {
    'al-dia':         { titulo: 'Al día', tag: 'success', icono: 'icon-check-circle' },
    'desactualizado': { titulo: 'Desactualizado', tag: 'warning', icono: 'icon-warning' },
    'no-verificado':  { titulo: 'No verificado', tag: 'neutral', icono: 'icon-question' },
    'error':          { titulo: 'Error de verificación', tag: 'error', icono: 'icon-x-circle' }
  };
  function fechaHora(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return null;
    return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  /** Resumen compacto: versión vigente y estado de los archivos de referencia (no el de cada flujo). */
  function resumenSincronizacion(cat, est) {
    var s = est && est.sincronizacion;
    var clave = !s ? 'error' : (SYNC[s.estado] ? s.estado : 'no-verificado');
    var m = SYNC[clave];
    var archivos = (s && s.archivos) || [];
    var msg;
    if (clave === 'al-dia') {
      msg = 'Los ' + archivos.length + ' archivos de referencia de los prototipos coinciden con el sistema de diseño. La versión que usa cada flujo se ve en la tabla de más abajo.';
    } else if (clave === 'desactualizado') {
      var usada = (archivos.filter(function (a) { return a.versionUsada; })[0] || {}).versionUsada;
      msg = 'Al menos un archivo de referencia de los prototipos no coincide con el sistema de diseño' +
        (usada ? ' (la copia de los prototipos corresponde al ' + fecha(usada.fecha) + ')' : '') +
        '. La actualización es controlada: no ocurre sola. Desde la carpeta del portal ejecuta <code>' + esc(s.comando || 'npm run ds:sincronizar') + '</code>, revisa los prototipos y haz commit si todo se ve bien.';
    } else if (clave === 'no-verificado') {
      msg = 'No hay archivos de referencia para comparar, así que no se puede afirmar que los prototipos estén al día.';
    } else {
      msg = !s ? 'No se pudo leer el resultado de la verificación (estado.json). Vuelve a construir el portal.'
        : 'La comparación no pudo completarse' + (s.mensajeError ? ': ' + s.mensajeError : '') + '. No se puede afirmar que los prototipos estén al día.';
    }
    var vProto = s && s.versionPrototipos;
    var vDs = dsVersion(cat);
    var nota = (clave === 'al-dia' && vProto && vDs && vProto !== vDs)
      ? '<p class="pux-resumen__nota"><i class="icon icon-warning icon-16" aria-hidden="true"></i> Los archivos coinciden, pero la versión registrada en los prototipos (' + esc(vProto) + ') no es la vigente (' + esc(vDs) + ').</p>' : '';
    var verif = fechaHora(s && (s.verificado || (est && est.generado)));
    var datos = '<dl class="pux-resumen__datos">' +
      filaDato('Versión actual', '<strong class="pux-resumen__ver">' + esc(vDs) + '</strong>') +
      filaDato('Archivos de referencia', '<span class="pux-resumen__estado"><i class="icon ' + m.icono + ' icon-16" aria-hidden="true"></i>' + tag(m.titulo, m.tag) + '</span>') +
      filaDato('Última verificación', verif ? esc(verif) : 'Sin fecha') +
      filaDato('Referencia técnica', s && s.dsCommit ? '<code>' + esc(s.dsCommit) + '</code>' : '—') +
    '</dl>';
    var tabla = '';
    if (archivos.length) {
      tabla = '<details class="pux-acordeon"><summary>Ver archivos comparados <span class="pux-count" aria-hidden="true">' + archivos.length + '</span><span class="visually-hidden"> (' + archivos.length + ')</span></summary>' +
        '<div class="mp-table-wrap pux-table pux-tabla-resp"><table class="mp-table">' +
        '<caption class="visually-hidden">Archivos que los prototipos copian del sistema de diseño</caption>' +
        '<thead><tr><th scope="col">Archivo del prototipo</th><th scope="col">Archivo de origen</th><th scope="col">Versión o referencia comprobada</th><th scope="col">Resultado</th></tr></thead><tbody>' +
        archivos.map(function (a) {
          var t = a.estado === 'al-dia' ? tag('Al día', 'success') : (a.estado === 'faltante' ? tag('Falta', 'error') : tag('Desactualizado', 'warning'));
          var ref = a.estado === 'al-dia' ? (a.refFlujos ? 'Ref. <code>' + esc(a.refFlujos) + '</code>' : '—')
            : (a.estado === 'faltante' ? '—' : 'Prototipo <code>' + esc(a.refFlujos || '—') + '</code> · origen <code>' + esc(a.refDs || '—') + '</code>' +
              (a.versionUsada ? ' <span class="pux-muted">(copia del ' + esc(fecha(a.versionUsada.fecha)) + ')</span>' : ''));
          return '<tr><td data-label="Archivo del prototipo"><code>' + esc(a.flujos) + '</code></td><td data-label="Archivo de origen"><code>' + esc(a.ds) + '</code></td>' +
            '<td data-label="Referencia comprobada">' + ref + '</td><td data-label="Resultado">' + t + '</td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }
    return '<section class="pux-resumen" data-sync="' + clave + '" aria-labelledby="resumen-tit">' +
      '<h2 class="visually-hidden" id="resumen-tit">Resumen del estado actual</h2>' +
      datos + '<p class="pux-resumen__msg" role="status">' + msg + '</p>' + nota + tabla +
    '</section>';
  }

  /** Validación UX de una versión: solo lo que está registrado en el repositorio (campo «revisar»). */
  function validacionUX(v, actual) {
    if (!v.revisar) return '';
    return '<div class="pux-valid"><p class="pux-valid__tit"><i class="icon icon-eye icon-20" aria-hidden="true"></i>Validación UX requerida</p>' +
      '<dl class="pux-valid__lista">' +
        (v.titulo ? '<div><dt>Cambio a evaluar</dt><dd>' + esc(tituloVersion(v)) + '</dd></div>' : '') +
        '<div><dt>Flujo o componente y comportamiento esperado</dt><dd>' + esc(v.revisar) + '</dd></div>' +
      '</dl></div>';
  }

  /** Historial cronológico: la versión actual abierta, las anteriores contraídas. */
  function historialVersiones(cat, acciones) {
    var todas = entradasVersiones(cat);
    if (!todas.length) return vacio('Todavía no hay versiones', 'El sistema de diseño aún no tiene versiones publicadas con una etiqueta.');
    var ia = cat.ia || null;
    var vigente = sinV(dsDe(cat).version);
    var hayVigente = todas.some(function (e) { return e.ver === vigente; });
    return '<ol class="pux-versions pux-hv" role="list">' + todas.map(function (e, i) {
      var v = e.t || {};
      var cdnV = e.cdn;
      var anterior = todas[i + 1];
      var actual = hayVigente ? e.ver === vigente : i === 0;
      var f = v.fecha || (cdnV && cdnV.fecha);
      var compat = '';
      if (cdnV) {
        var iguales = ORDEN_PLATAFORMAS.map(function (p) {
          var pq = paqueteCdn(cat, 'compensar-' + p);
          return pq && pq.versiones[0].commit && pq.versiones[0].commit === cdnV.commit ? nombrePlataforma(p, cat) + ' v' + pq.versiones[0].version : null;
        }).filter(Boolean);
        compat = '<p class="pux-version__cuerpo"><strong>Compatibilidad:</strong> ' + (iguales.length ? 'paquetes generados con el mismo commit: ' + esc(iguales.join(', ')) + '.' : 'no hay paquetes de plataforma generados con el mismo commit.') + '</p>';
      }
      var cambios = v.cambios && v.cambios.length
        ? '<ul class="pux-version__commits" role="list">' + v.cambios.map(function (c) { return '<li><span>' + esc(mensajeCambio(c.mensaje)) + '</span> <code>' + esc(c.commit) + '</code></li>'; }).join('') + '</ul>'
        : '<p class="pux-muted pux-note">' + (anterior ? 'No hay commits registrados entre v' + esc(anterior.ver) + ' y v' + esc(e.ver) + '.' : 'Es la primera versión registrada.') + '</p>';
      var estados = [cdnV ? 'Publicada en el CDN' : 'Sin paquete publicado en el CDN'];
      if (v.enPrototipos) estados.push('copia registrada en los prototipos');
      var acc = acciones ? acciones(e, ia) : '';
      return '<li class="pux-version' + (actual ? ' is-actual' : '') + (cdnV ? ' is-publicada' : '') + '"><span class="pux-version__dot" aria-hidden="true"></span>' +
        '<details class="pux-vh"' + (actual ? ' open' : '') + '>' +
          '<summary class="pux-vh__sum"><span class="pux-vh__cab">' +
            '<span class="pux-vh__tag">v' + esc(e.ver) + '</span>' +
            (actual ? tag('Actual', 'orange') : '') +
            (f ? '<time class="pux-vh__fecha" datetime="' + esc(f) + '">' + esc(fecha(f)) + '</time>' : '') +
          '</span>' +
          (v.titulo ? '<span class="pux-vh__resumen">' + esc(tituloVersion(v)) + '</span>' : '') +
          '<span class="visually-hidden">' + (actual ? ' Versión actual.' : '') + ' Mostrar u ocultar los detalles de la versión ' + esc(e.ver) + '.</span>' +
        '</summary>' +
        '<div class="pux-vh__cuerpo">' +
          validacionUX(v, actual) +
          '<p class="pux-version__cuerpo pux-vh__estado">' + esc(estados.join(' · ')) + '.</p>' +
          compat +
          '<p class="pux-version__cuerpo"><strong>Cambios respecto a ' + (anterior ? 'v' + esc(anterior.ver) : 'la versión anterior') + ':</strong></p>' + cambios +
          (acc ? '<div class="pux-version__acciones">' + acc + '</div>' : '') +
        '</div></details></li>';
    }).join('') + '</ol>';
  }

  /** Una sola tabla con todos los flujos; los datos técnicos viven en el detalle de cada fila. */
  function tablaPrototipos(cat, est) {
    var local = dsEnPrototipos(cat);
    var ultimo = (paqueteCdn(cat, 'compensar') || { versiones: [{}] }).versiones[0].version;
    var flujos = ORDEN_PLATAFORMAS.map(function (pid) {
      return cat.flujos.filter(function (f) { return f.plataforma === pid; });
    }).reduce(function (a, b) { return a.concat(b); }, []);
    if (!flujos.length) return vacio('Sin flujos', 'Todavía no hay flujos en el catálogo.');
    var plats = ORDEN_PLATAFORMAS.filter(function (p) { return flujos.some(function (f) { return f.plataforma === p; }); });
    var ests = Object.keys(ESTADOS).filter(function (k) { return flujos.some(function (f) { return f.estado === k; }); });
    var filtros =
      '<form class="pux-filters" role="search" aria-label="Filtrar flujos" onsubmit="return false"><div class="pux-filters__fields">' +
        '<div class="mp-input-group pux-filters__search"><label class="mp-input-label" for="pv-q">Buscar flujo</label>' +
          '<div class="mp-input-wrapper"><i class="icon icon-magnifying-glass icon-20 mp-input-icon mp-input-icon--left" aria-hidden="true"></i>' +
          '<input class="mp-input-field has-icon-left" type="search" id="pv-q" placeholder="Nombre del flujo" autocomplete="off" data-pv-q></div></div>' +
        '<div class="mp-input-group pux-filters__orden"><label class="mp-input-label" for="pv-plat">Plataforma</label>' +
          '<div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="pv-plat" data-pv-plat><option value="">Todas</option>' +
            plats.map(function (p) { return '<option value="' + esc(p) + '">' + esc(nombrePlataforma(p, cat)) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="mp-input-group pux-filters__estado"><label class="mp-input-label" for="pv-est">Estado</label>' +
          '<div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="pv-est" data-pv-est><option value="">Todos</option>' +
            ests.map(function (k) { return '<option value="' + esc(k) + '">' + esc(ESTADOS[k].label) + '</option>'; }).join('') + '</select></div></div>' +
      '</div></form>' +
      '<p class="pux-results" aria-live="polite" data-pv-res></p>';
    var filas = flujos.map(function (f) {
      var c = f.consumo || { modo: 'local', ds: [], plataforma: [] };
      var carga = c.modo === 'local' ? tag('Copia local', 'neutral') : (c.modo === 'cdn' ? tag('Enlace público', 'success') : tag('Mixto', 'warning'));
      var vds = c.ds.length ? c.ds.map(function (v) { return 'v' + esc(v); }).join(', ') : (local ? esc(local) + ' <span class="pux-muted">(copia)</span>' : '—');
      var vpl = c.plataforma.length ? c.plataforma.map(function (v) { return 'v' + esc(v); }).join(', ') : '<span class="pux-muted">shared/ local</span>';
      var alDia = c.ds.length && ultimo && c.ds.indexOf(ultimo) < 0 ? ' ' + tag('Disponible v' + ultimo, 'info') : '';
      var did = 'pv-det-' + f.id;
      var url = 'flujo.html?id=' + encodeURIComponent(f.id);
      var detalle = '<dl class="pux-pv__det">' +
        filaDato('Cómo carga', carga) +
        filaDato('Paquete de plataforma', vpl) +
        filaDato('Versión del flujo', esc(f.version || '—') + ' · ' + (f.publicado ? 'publicado' : 'no publicado')) +
      '</dl>' +
      (f.cambios && f.cambios.length
        ? '<details class="pux-acordeon pux-pv__cambios"><summary>Cambios del flujo <span class="pux-count" aria-hidden="true">' + f.cambios.length + '</span><span class="visually-hidden"> (' + f.cambios.length + ')</span></summary>' + timeline(f.cambios, false) + '</details>'
        : '');
      return '<tr data-pv-fila data-plat="' + esc(f.plataforma) + '" data-est="' + esc(f.estado) + '" data-q="' + esc((f.nombre || '').toLowerCase()) + '">' +
        '<th scope="row" data-label="Flujo"><a class="pux-link" href="' + url + '">' + esc(f.nombre) + '</a></th>' +
        '<td data-label="Plataforma">' + tagPlataforma(f.plataforma, cat) + '</td>' +
        '<td data-label="Versión del sistema de diseño">' + vds + alDia + '</td>' +
        '<td data-label="Estado">' + badgeEstado(f.estado) + '</td>' +
        '<td data-label="Acciones"><div class="pux-acciones-fila">' +
          '<button class="mp-btn mp-btn--secundario mp-btn--sm" type="button" aria-expanded="false" aria-controls="' + esc(did) + '" data-pv-toggle>Detalles<span class="visually-hidden"> de ' + esc(f.nombre) + '</span></button>' +
          '<a class="mp-btn mp-btn--terciario mp-btn--sm" href="' + url + '">Abrir<span class="visually-hidden"> ' + esc(f.nombre) + '</span></a>' +
        '</div></td></tr>' +
        '<tr class="pux-pv__fila-det" id="' + esc(did) + '" hidden><td class="pux-detrow" colspan="5">' + detalle + '</td></tr>';
    });
    return filtros +
      '<div class="mp-table-wrap pux-table pux-tabla-resp"><table class="mp-table" data-pv-tabla>' +
      '<caption class="visually-hidden">Versión del sistema de diseño y estado UX de cada flujo</caption>' +
      '<thead><tr><th scope="col">Flujo</th><th scope="col">Plataforma</th><th scope="col">Versión del sistema de diseño</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>' +
      '<tbody>' + filas.join('') + '</tbody></table></div>' +
      '<div data-pv-vacio hidden>' + vacio('Sin resultados', 'Ningún flujo coincide con los filtros. Cambia la búsqueda o quita un filtro.') + '</div>';
  }
  function activarTablaPrototipos(cont) {
    var q = $('[data-pv-q]', cont), plat = $('[data-pv-plat]', cont), est = $('[data-pv-est]', cont);
    var res = $('[data-pv-res]', cont), vacioEl = $('[data-pv-vacio]', cont), tabla = $('[data-pv-tabla]', cont);
    if (!q || !tabla) return;
    var filas = $all('[data-pv-fila]', cont);
    function aplicar() {
      var t = q.value.trim().toLowerCase(), n = 0;
      filas.forEach(function (tr) {
        var ok = (!t || tr.getAttribute('data-q').indexOf(t) >= 0) &&
          (!plat.value || tr.getAttribute('data-plat') === plat.value) &&
          (!est.value || tr.getAttribute('data-est') === est.value);
        var det = tr.nextElementSibling;
        var abierto = tr.querySelector('[data-pv-toggle]').getAttribute('aria-expanded') === 'true';
        tr.hidden = !ok;
        det.hidden = !(ok && abierto);
        if (ok) n++;
      });
      res.textContent = n === filas.length ? filas.length + (filas.length === 1 ? ' flujo' : ' flujos') : n + ' de ' + filas.length + ' flujos';
      tabla.parentNode.hidden = n === 0;
      vacioEl.hidden = n !== 0;
    }
    [q, plat, est].forEach(function (el) { el.addEventListener('input', aplicar); el.addEventListener('change', aplicar); });
    cont.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pv-toggle]');
      if (!b) return;
      var abre = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(abre));
      document.getElementById(b.getAttribute('aria-controls')).hidden = !abre;
    });
    aplicar();
  }

  /** Versiones del sistema de diseño: una sola vista con resumen, historial y uso en los prototipos. */
  function initHistorial(cat, est) {
    var cont = $('[data-historial]');
    if (!cont) return;
    function accionesPagina(e, ia) {
      var q = '?v=' + encodeURIComponent(e.ver);
      return (e.cdn ? '<a class="mp-btn mp-btn--secundario mp-btn--sm" href="centro-de-recursos.html' + q + '#cdn">Ver CDN<span class="visually-hidden"> de la versión ' + esc(e.ver) + '</span></a>' +
        '<a class="mp-btn mp-btn--secundario mp-btn--sm" href="centro-de-recursos.html' + q + '#descargas">Descargar recursos<span class="visually-hidden"> de la versión ' + esc(e.ver) + '</span></a>' : '') +
        (ia && ia.version === e.ver ? '<a class="mp-btn mp-btn--secundario mp-btn--sm" href="centro-de-recursos.html#ia">Documentación para IA</a>' : '');
    }
    cont.innerHTML =
      resumenSincronizacion(cat, est) +
      '<section class="pux-block" id="versiones" aria-labelledby="hist-vers"><h2 class="mp-h6 pux-section__title" id="hist-vers">Historial de versiones</h2>' +
        historialVersiones(cat, accionesPagina) +
      '</section>' +
      '<section class="pux-block" id="prototipos" aria-labelledby="hist-flujos"><h2 class="mp-h6 pux-section__title" id="hist-flujos">Versiones utilizadas por los prototipos</h2>' +
        '<p class="pux-muted pux-note">El estado UX indica la revisión del flujo; es independiente de la versión del sistema de diseño que usa. «Copia local»: el flujo carga los archivos desde <code>shared/</code>. «Enlace público»: usa los paquetes versionados.</p>' +
        tablaPrototipos(cat, est) + '</section>';
    activarTablaPrototipos(cont);
  }

  /* ---------- Detalle lateral (drawer) ----------
     Un solo panel reutilizable para el detalle de un componente y de un entregable.
     Diálogo modal: atrapa el foco, se cierra con Esc, con el fondo o con el botón,
     y devuelve el foco al control que lo abrió. */
  var drawerEl = null;
  var drawerDisparador = null;
  function enfocables(raiz) {
    return $all('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])', raiz)
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function cerrarDrawer() {
    if (!drawerEl || drawerEl.hidden) return;
    drawerEl.hidden = true;
    document.body.classList.remove('pux-drawer-abierto');
    if (drawerDisparador && document.contains(drawerDisparador)) drawerDisparador.focus();
    drawerDisparador = null;
  }
  function abrirDrawer(o, disparador) {
    if (!drawerEl) {
      drawerEl = document.createElement('div');
      drawerEl.className = 'pux-drawer';
      drawerEl.hidden = true;
      drawerEl.innerHTML = '<div class="pux-drawer__fondo" data-drawer-cerrar></div>' +
        '<section class="pux-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="pux-drawer-tit" tabindex="-1">' +
          '<header class="pux-drawer__cab"><div class="pux-drawer__titulos"><p class="pux-drawer__sup" data-drawer-sup></p>' +
            '<h2 class="pux-drawer__tit" id="pux-drawer-tit" data-drawer-tit></h2></div>' +
            '<button class="pux-icon-btn" type="button" data-drawer-cerrar aria-label="Cerrar detalle"><i class="icon icon-x icon-20" aria-hidden="true"></i></button></header>' +
          '<div class="pux-drawer__cuerpo" data-drawer-cuerpo></div></section>';
      document.body.appendChild(drawerEl);
      drawerEl.addEventListener('click', function (e) { if (e.target.closest('[data-drawer-cerrar]')) cerrarDrawer(); });
      document.addEventListener('keydown', function (e) {
        if (!drawerEl || drawerEl.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); cerrarDrawer(); return; }
        if (e.key !== 'Tab') return;
        var panel = $('.pux-drawer__panel', drawerEl);
        var f = enfocables(panel);
        if (!f.length) { e.preventDefault(); panel.focus(); return; }
        var primero = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === primero || document.activeElement === panel)) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      });
    }
    drawerDisparador = disparador || document.activeElement;
    $('[data-drawer-sup]', drawerEl).textContent = o.sup || '';
    $('[data-drawer-tit]', drawerEl).textContent = o.titulo;
    $('[data-drawer-cuerpo]', drawerEl).innerHTML = o.html;
    $('.pux-drawer__cuerpo', drawerEl).scrollTop = 0;
    drawerEl.hidden = false;
    document.body.classList.add('pux-drawer-abierto');
    $('.pux-drawer__panel', drawerEl).focus();
  }
  /** Fila de un detalle: término y valor. El valor ya viene escapado. */
  function filaDet(titulo, valor) {
    return '<div class="pux-det__fila"><dt>' + esc(titulo) + '</dt><dd>' + valor + '</dd></div>';
  }
  function pendiente() { return '<span class="pux-muted">Pendiente de evaluación</span>'; }

  /* ---------- Uso de componentes ---------- */
  /* Estados de evaluación. «Por validar» es el valor por omisión: ningún componente se
     clasifica por parecerse en el nombre a uno del sistema; la decisión la registra UX en
     evaluacion-componentes.json. */
  var EVAL = {
    'por-validar': { label: 'Por validar', tag: 'warning' },
    'reutilizar':  { label: 'Reutilizar componente existente', tag: 'success' },
    'candidato':   { label: 'Candidato para el sistema de diseño', tag: 'info' },
    'especifico':  { label: 'Mantener como componente específico', tag: 'neutral' }
  };
  var PLAT_CORTO = { drupal: 'Drupal', zt: 'ZT', app: 'App' };
  function estadoEval(l) { return l.evaluacion && EVAL[l.evaluacion.estado] ? l.evaluacion.estado : 'por-validar'; }
  function equivalente(l) { return (l.evaluacion && l.evaluacion.equivalenteDs) || l.equivalenteDs || null; }
  /** El flujo del catálogo al que pertenece una pantalla, por su carpeta en p/. */
  function flujoDePagina(cat, ruta) {
    var mejor = null, puntos = 0;
    cat.flujos.forEach(function (f) {
      if (!f.url) return;
      var dir = f.url.replace(/^p\//, '').replace(/\/[^/]*$/, '');
      var p = 0;
      if (ruta.indexOf(dir + '/') === 0) p = dir.length + 10;
      else if (dir.split('/').length >= 2 && ruta.split('/').slice(0, 2).join('/') === dir.split('/').slice(0, 2).join('/')) p = 1;
      if (p > puntos) { puntos = p; mejor = f; }
    });
    return mejor;
  }
  function detalleComponente(l, cat) {
    var ev = l.evaluacion;
    var clave = estadoEval(l);
    var grupos = [], idx = {};
    (l.usadoEn || []).forEach(function (ruta) {
      var f = flujoDePagina(cat, ruta);
      var k = f ? f.id : '—';
      if (!(k in idx)) { idx[k] = grupos.length; grupos.push({ f: f, rutas: [] }); }
      grupos[idx[k]].rutas.push(ruta);
    });
    var pantallas = grupos.length ? '<ul class="pux-det__lista" role="list">' + grupos.map(function (g) {
      return '<li><strong>' + (g.f ? '<a class="pux-link" href="flujo.html?id=' + encodeURIComponent(g.f.id) + '">' + esc(g.f.nombre) + '</a>' : 'Sin flujo asociado en el catálogo') + '</strong>' +
        '<ul role="list">' + g.rutas.map(function (r) {
          return '<li>' + (g.f && g.f.publicado ? '<a class="pux-link" href="p/' + esc(r) + '" target="_blank" rel="noopener"><code>' + esc(r) + '</code><span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>' : '<code>' + esc(r) + '</code>') + '</li>';
        }).join('') + '</ul></li>';
    }).join('') + '</ul>' : '<span class="pux-muted">Ninguna pantalla enlaza este componente.</span>';
    var eq = equivalente(l);
    var eqHtml = eq
      ? '<code>' + esc(eq) + '</code>' + (ev && ev.equivalenteDs ? '' : '<br><span class="pux-muted">Sugerido por coincidencia de nombre. No está validado.</span>')
      : '<span class="pux-muted">Sin equivalente por nombre.</span> ' + pendiente();
    var decision = ev && ev.decision
      ? esc(ev.decision) + ((ev.por || ev.fecha) ? '<br><span class="pux-muted">' + esc([ev.por, ev.fecha ? fecha(ev.fecha) : ''].filter(Boolean).join(' · ')) + '</span>' : '')
      : pendiente();
    return '<dl class="pux-det">' +
      filaDet('Plataforma', esc(PLAT_CORTO[l.plataforma] || l.plataforma)) +
      filaDet('Estado de evaluación', tag(EVAL[clave].label, EVAL[clave].tag)) +
      filaDet('Prototipos y pantallas donde aparece', pantallas) +
      filaDet('Equivalente en el sistema de diseño', eqHtml) +
      filaDet('Diferencias identificadas', ev && ev.diferencias ? esc(ev.diferencias) : pendiente()) +
      filaDet('Archivos', '<ul class="pux-det__lista" role="list">' + (l.rutas || l.archivos).map(function (r) { return '<li><code>' + esc(r) + '</code></li>'; }).join('') + '</ul>' +
        '<span class="pux-muted">Rutas dentro de Flujos/prototipos/.</span>') +
      filaDet('Recomendación o decisión documentada', decision) +
    '</dl>';
  }

  function initComponentes(est, cat) {
    var cont = $('[data-estado-componentes]');
    if (!cont) return;
    var c = est.componentes;
    var locales = c.locales || [];
    var dup = locales.filter(function (l) { return l.tipo === 'existe-en-ds'; }).length;
    var cand = locales.filter(function (l) { return l.tipo !== 'existe-en-ds'; }).length;
    cont.innerHTML =
      '<dl class="pux-stats pux-stats--3 pux-stats--compacto">' +
        '<div class="pux-stat"><div><dt>Componentes documentados en el sistema de diseño</dt><dd>' + c.ds.length + '</dd></div></div>' +
        '<div class="pux-stat"><div><dt>Posibles duplicaciones <span class="pux-stat__nota">Equivalente sugerido por nombre, sin validar</span></dt><dd>' + dup + '</dd></div></div>' +
        '<div class="pux-stat"><div><dt>Candidatos a evaluación <span class="pux-stat__nota">Sin equivalente por nombre</span></dt><dd>' + cand + '</dd></div></div>' +
      '</dl>' +
      '<section class="pux-panel pux-panel--tabla" aria-labelledby="comp-tabla-tit">' +
        '<h2 class="mp-h6 pux-panel__title" id="comp-tabla-tit">Componentes identificados en los prototipos</h2>' +
        '<form class="pux-filters" role="search" aria-label="Filtrar componentes" onsubmit="return false">' +
          '<div class="pux-filters__fields">' +
            '<div class="mp-input-group pux-filters__search"><label class="mp-input-label" for="comp-q">Buscar por nombre</label>' +
              '<div class="mp-input-wrapper"><i class="icon icon-magnifying-glass icon-20 mp-input-icon mp-input-icon--left" aria-hidden="true"></i>' +
              '<input class="mp-input-field has-icon-left" type="search" id="comp-q" placeholder="Nombre del componente" autocomplete="off" data-comp-q></div></div>' +
            '<div class="mp-input-group pux-filters__orden"><label class="mp-input-label" for="comp-plat">Plataforma</label>' +
              '<div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="comp-plat" data-comp-plat>' +
                '<option value="">Todas</option><option value="drupal">Drupal</option><option value="zt">ZT</option><option value="app">App</option></select></div></div>' +
            '<div class="mp-input-group pux-filters__estado"><label class="mp-input-label" for="comp-estado">Estado de evaluación</label>' +
              '<div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="comp-estado" data-comp-estado><option value="">Todos</option>' +
                Object.keys(EVAL).map(function (k) { return '<option value="' + k + '">' + esc(EVAL[k].label) + '</option>'; }).join('') + '</select></div></div>' +
          '</div>' +
        '</form>' +
        '<p class="pux-results" aria-live="polite" data-comp-res></p>' +
        '<div data-comp-tabla></div>' +
      '</section>';

    var q = $('[data-comp-q]', cont), plat = $('[data-comp-plat]', cont), estSel = $('[data-comp-estado]', cont);
    var res = $('[data-comp-res]', cont), tabla = $('[data-comp-tabla]', cont);
    var p = params();
    q.value = p.get('q') || '';
    if (PLAT_CORTO[p.get('plataforma')]) plat.value = p.get('plataforma');
    if (EVAL[p.get('estado')]) estSel.value = p.get('estado');

    function filtradas() {
      var palabras = normalizar(q.value).trim().split(/\s+/).filter(Boolean);
      return locales.filter(function (l) {
        if (plat.value && l.plataforma !== plat.value) return false;
        if (estSel.value && estadoEval(l) !== estSel.value) return false;
        var t = normalizar(l.nombre + ' ' + (equivalente(l) || ''));
        return palabras.every(function (w) { return t.indexOf(w) >= 0; });
      });
    }
    function pintar(url) {
      var lista = filtradas();
      if (url) {
        var u = new URLSearchParams();
        if (q.value.trim()) u.set('q', q.value.trim());
        if (plat.value) u.set('plataforma', plat.value);
        if (estSel.value) u.set('estado', estSel.value);
        try { history.replaceState(null, '', window.location.pathname + (u.toString() ? '?' + u : '')); } catch (e) { /* file:// */ }
      }
      res.textContent = lista.length === locales.length ? locales.length + (locales.length === 1 ? ' componente' : ' componentes')
        : lista.length + ' de ' + locales.length + ' componentes';
      if (!lista.length) {
        tabla.innerHTML = vacio(locales.length ? 'Sin resultados' : 'Sin componentes propios', locales.length
          ? 'Ningún componente coincide con la búsqueda o los filtros. Prueba con otro nombre o quita algún filtro.'
          : 'Los prototipos no tienen componentes propios en shared/components.',
          locales.length ? '<button type="button" class="mp-btn mp-btn--secundario" data-comp-limpiar>Limpiar filtros</button>' : '');
        return;
      }
      tabla.innerHTML = '<div class="mp-table-wrap pux-table pux-tabla-resp"><table class="mp-table">' +
        '<caption class="visually-hidden">Componentes propios de las plataformas, con su equivalente sugerido y su estado de evaluación</caption>' +
        '<thead><tr><th scope="col">Componente</th><th scope="col">Plataforma</th><th scope="col">Equivalente en el sistema de diseño</th><th scope="col">Estado de evaluación</th><th scope="col">Acción</th></tr></thead><tbody>' +
        lista.map(function (l) {
          var k = estadoEval(l), eq = equivalente(l);
          return '<tr><th scope="row" data-label="Componente"><strong>' + esc(l.nombre) + '</strong></th>' +
            '<td data-label="Plataforma">' + tag(PLAT_CORTO[l.plataforma] || l.plataforma, PLATAFORMA_TAG[l.plataforma] || 'neutral') + '</td>' +
            '<td data-label="Equivalente">' + (eq ? '<code>' + esc(eq) + '</code>' + (l.evaluacion && l.evaluacion.equivalenteDs ? '' : '<span class="pux-sub">Sugerido por nombre</span>') : '<span class="pux-muted">Sin equivalente por nombre</span>') + '</td>' +
            '<td data-label="Estado">' + tag(EVAL[k].label, EVAL[k].tag) + '</td>' +
            '<td data-label="Acción"><button class="mp-btn mp-btn--terciario mp-btn--sm" type="button" data-comp-detalle="' + esc(l.plataforma + '/' + l.nombre) + '">Ver detalle<span class="visually-hidden"> de ' + esc(l.nombre) + ' (' + esc(PLAT_CORTO[l.plataforma] || l.plataforma) + ')</span></button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    q.addEventListener('input', function () { pintar(true); });
    plat.addEventListener('change', function () { pintar(true); });
    estSel.addEventListener('change', function () { pintar(true); });
    cont.addEventListener('click', function (e) {
      if (e.target.closest('[data-comp-limpiar]')) { q.value = ''; plat.value = ''; estSel.value = ''; pintar(true); q.focus(); return; }
      var b = e.target.closest('[data-comp-detalle]');
      if (!b) return;
      var l = locales.filter(function (x) { return x.plataforma + '/' + x.nombre === b.getAttribute('data-comp-detalle'); })[0];
      if (l) abrirDrawer({ sup: 'Componente · ' + (PLAT_CORTO[l.plataforma] || l.plataforma), titulo: l.nombre, html: detalleComponente(l, cat) }, b);
    });
    pintar(false);
  }

  /* ---------- Entregables ---------- */
  var TAM_ENTREGABLES = 10;
  var ORDEN_ENTREGABLES = {
    'aprobacion-desc': function (a, b) { return String(b.aprobacionUX.fecha || '').localeCompare(String(a.aprobacionUX.fecha || '')) || String(a.nombre).localeCompare(String(b.nombre), 'es'); },
    'aprobacion-asc':  function (a, b) { return String(a.aprobacionUX.fecha || '9999').localeCompare(String(b.aprobacionUX.fecha || '9999')) || String(a.nombre).localeCompare(String(b.nombre), 'es'); },
    'nombre':          function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es'); }
  };
  /** Versión del sistema de diseño de un flujo, solo si está registrada; si no, null. Nunca se supone la más reciente. */
  function dsDeFlujo(f) {
    var vig = (f.versiones || []).filter(function (v) { return v.vigente; })[0];
    if (vig && vig.ds && (vig.ds.tag || vig.ds.commit)) return vig.ds.tag || ('commit ' + vig.ds.commit);
    if (f.consumo && f.consumo.ds && f.consumo.ds.length) return f.consumo.ds.map(function (v) { return 'v' + v; }).join(', ');
    return null;
  }
  function detalleEntregable(f, cat) {
    var ap = f.aprobacionUX || {};
    var dsv = dsDeFlujo(f);
    var enlaces = [];
    if (f.publicado && f.url) enlaces.push('<a class="pux-link" href="' + esc(f.url) + '" target="_blank" rel="noopener">Prototipo aprobado<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>');
    if (f.figma) enlaces.push('<a class="pux-link" href="' + esc(f.figma) + '" target="_blank" rel="noopener">Diseño en Figma<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>');
    enlaces.push('<a class="pux-link" href="flujo.html?id=' + encodeURIComponent(f.id) + '">Ficha del flujo en el portal</a>');
    var hus = (f.hu || []).filter(function (h) { return /^https:\/\//.test(h.url || ''); });
    var docs = (hus.length ? hus.map(function (h) {
      return '<li><a class="pux-link" href="' + esc(h.url) + '" target="_blank" rel="noopener">' + esc(h.codigo || h.id) + (h.titulo ? ' · ' + esc(h.titulo) : '') + '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></li>';
    }).join('') : '');
    var paquete = f.descarga && f.descarga.url
      ? '<a class="mp-btn mp-btn--primario mp-btn--sm mp-btn--icon-right" href="' + esc(f.descarga.url) + '" download="' + esc(f.descarga.archivo) + '">Descargar paquete <i class="icon icon-download-simple icon-20" aria-hidden="true"></i></a>' +
        '<br><span class="pux-muted">' + esc(f.descarga.archivo) + ' · ' + esc(peso(f.descarga.bytes)) + '</span>'
      : '<span class="pux-muted">Disponible en una fase posterior</span>';
    return '<dl class="pux-det">' +
      (f.descripcion ? filaDet('Descripción', esc(f.descripcion)) : '') +
      filaDet('Plataforma', esc(nombrePlataforma(f.plataforma, cat))) +
      filaDet('Versión del flujo', esc(f.version)) +
      filaDet('Estado', badgeEstado(f.estado)) +
      filaDet('Fecha de aprobación', ap.fecha ? '<time datetime="' + esc(ap.fecha) + '">' + esc(fecha(ap.fecha)) + '</time>' : 'Sin fecha') +
      filaDet('Aprobado por', ap.por ? esc(ap.por) : '<span class="pux-muted">No registrado</span>') +
      filaDet('Versión del sistema de diseño', dsv ? esc(dsv) : '<span class="pux-muted">No registrada</span>') +
      filaDet('Enlaces', '<ul class="pux-det__lista" role="list"><li>' + enlaces.join('</li><li>') + '</li></ul>') +
      filaDet('Documentación asociada', docs ? '<ul class="pux-det__lista" role="list">' + docs + '</ul>' : '<span class="pux-muted">Sin historias de usuario registradas</span>') +
      filaDet('Paquete para desarrollo', paquete) +
    '</dl>';
  }
  function initEntregables(cat) {
    var cont = $('[data-entregables]');
    if (!cont) return;
    var barra = $('[data-entregables-filtros]');
    var res = $('[data-entregables-res]');
    var pag = $('[data-entregables-pag]');
    var ap = cat.flujos.filter(function (f) { return f.aprobacionUX && f.aprobacionUX.aprobado; });
    if (!ap.length) {
      if (barra) barra.hidden = true;
      cont.innerHTML = vacio('Aún no hay flujos aprobados', 'Cuando UX apruebe un flujo, aparecerá aquí con su versión y sus recursos para desarrollo.',
        '<a class="mp-btn mp-btn--secundario" href="prototipos.html">Ver prototipos</a>');
      return;
    }
    var q = $('[data-ent-q]'), plat = $('[data-ent-plat]'), ord = $('[data-ent-orden]');
    var p = params();
    var st = { pagina: Math.max(1, parseInt(p.get('pagina'), 10) || 1) };
    q.value = p.get('q') || '';
    if (PLAT_CORTO[p.get('plataforma')]) plat.value = p.get('plataforma');
    if (ORDEN_ENTREGABLES[p.get('orden')]) ord.value = p.get('orden');

    function filtrados() {
      var palabras = normalizar(q.value).trim().split(/\s+/).filter(Boolean);
      return ap.filter(function (f) {
        if (plat.value && f.plataforma !== plat.value) return false;
        var t = normalizar(f.nombre + ' ' + f.id);
        return palabras.every(function (w) { return t.indexOf(w) >= 0; });
      }).sort(ORDEN_ENTREGABLES[ord.value]);
    }
    function url(n) {
      var u = new URLSearchParams();
      if (q.value.trim()) u.set('q', q.value.trim());
      if (plat.value) u.set('plataforma', plat.value);
      if (ord.value !== 'aprobacion-desc') u.set('orden', ord.value);
      if (n > 1) u.set('pagina', n);
      return window.location.pathname.split('/').pop() + (u.toString() ? '?' + u : '');
    }
    function recursos(f) {
      var r = [];
      if (f.publicado) r.push('Prototipo');
      if (f.figma) r.push('Figma');
      if ((f.hu || []).length) r.push('HU (' + f.hu.length + ')');
      var lista = r.length ? '<ul class="pux-chips" role="list">' + r.map(function (t) { return '<li>' + tag(t, 'neutral') + '</li>'; }).join('') + '</ul>' : '';
      var paquete = f.descarga && f.descarga.url
        ? '<a class="pux-link pux-paquete" href="' + esc(f.descarga.url) + '" download="' + esc(f.descarga.archivo) + '">Descargar paquete<span class="visually-hidden"> de ' + esc(f.nombre) + '</span> <span class="pux-muted">(ZIP, ' + esc(peso(f.descarga.bytes)) + ')</span></a>'
        : '<span class="pux-muted pux-paquete">Paquete: disponible en una fase posterior</span>';
      return lista + paquete;
    }
    function pintar(actualizarUrl, moverFoco) {
      var lista = filtrados();
      var paginas = Math.max(1, Math.ceil(lista.length / TAM_ENTREGABLES));
      st.pagina = Math.min(st.pagina, paginas);
      if (actualizarUrl) { try { history.replaceState(null, '', url(st.pagina)); } catch (e) { /* file:// */ } }
      var desde = (st.pagina - 1) * TAM_ENTREGABLES;
      var visibles = lista.slice(desde, desde + TAM_ENTREGABLES);
      res.textContent = !lista.length ? '0 entregables'
        : (paginas > 1 ? 'Mostrando ' + (desde + 1) + '–' + (desde + visibles.length) + ' de ' + lista.length + ' entregables'
          : lista.length + (lista.length === 1 ? ' entregable' : ' entregables'));
      if (!lista.length) {
        cont.innerHTML = vacio('Sin resultados', 'Ningún entregable coincide con la búsqueda o el filtro. Prueba con otro nombre o quita el filtro.',
          '<button type="button" class="mp-btn mp-btn--secundario" data-ent-limpiar>Limpiar filtros</button>');
        pag.innerHTML = '';
        return;
      }
      cont.innerHTML = '<div class="mp-table-wrap pux-table pux-tabla-resp"><table class="mp-table">' +
        '<caption class="visually-hidden">Flujos aprobados por UX y recursos disponibles para desarrollo</caption>' +
        '<thead><tr><th scope="col">Flujo</th><th scope="col">Plataforma</th><th scope="col">Versión del flujo</th><th scope="col">Fecha de aprobación</th><th scope="col">Recursos disponibles</th><th scope="col">Acción</th></tr></thead><tbody>' +
        visibles.map(function (f) {
          var a = f.aprobacionUX;
          return '<tr><th scope="row" data-label="Flujo"><a class="pux-link" href="flujo.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.nombre) + '</a></th>' +
            '<td data-label="Plataforma">' + tagPlataforma(f.plataforma, cat) + '</td>' +
            '<td data-label="Versión del flujo" class="pux-nowrap">' + esc(f.version) + '</td>' +
            '<td data-label="Fecha de aprobación" class="pux-nowrap">' + (a.fecha ? '<time datetime="' + esc(a.fecha) + '">' + esc(fecha(a.fecha)) + '</time>' : 'Sin fecha') + '</td>' +
            '<td data-label="Recursos">' + recursos(f) + '</td>' +
            '<td data-label="Acción"><div class="pux-acciones-fila">' +
              (f.publicado && f.url ? '<a class="mp-btn mp-btn--terciario mp-btn--sm" href="' + esc(f.url) + '" target="_blank" rel="noopener">Ver prototipo<span class="visually-hidden"> de ' + esc(f.nombre) + ' (se abre en una pestaña nueva)</span></a>' : '<span class="pux-muted">No publicado</span>') +
              '<button class="mp-btn mp-btn--terciario mp-btn--sm" type="button" data-ent-detalle="' + esc(f.id) + '">Ver detalle<span class="visually-hidden"> de ' + esc(f.nombre) + '</span></button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>';
      pag.innerHTML = htmlPaginacion(st.pagina, paginas, url, 'Paginación de entregables');
      $all('[data-pagina]', pag).forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          st.pagina = parseInt(a.getAttribute('data-pagina'), 10);
          pintar(true, true);
        });
      });
      if (moverFoco) { res.focus({ preventScroll: true }); res.scrollIntoView({ block: 'start' }); }
    }
    q.addEventListener('input', function () { st.pagina = 1; pintar(true); });
    plat.addEventListener('change', function () { st.pagina = 1; pintar(true); });
    ord.addEventListener('change', function () { st.pagina = 1; pintar(true); });
    cont.addEventListener('click', function (e) {
      if (e.target.closest('[data-ent-limpiar]')) { q.value = ''; plat.value = ''; st.pagina = 1; pintar(true); q.focus(); return; }
      var b = e.target.closest('[data-ent-detalle]');
      if (!b) return;
      var f = ap.filter(function (x) { return x.id === b.getAttribute('data-ent-detalle'); })[0];
      if (f) abrirDrawer({ sup: 'Entregable UX', titulo: f.nombre, html: detalleEntregable(f, cat) }, b);
    });
    pintar(false);
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
    initNav();
    initBuscar();
    initVisor();
    marcarActivo();
    estado().then(initEstado).catch(function () { /* sin estado no hay aviso en el menú */ });
    if ($('[data-estado-componentes]')) {
      Promise.all([estado(), catalogo()]).then(function (r) { initComponentes(r[0], r[1]); }).catch(function () {
        $all('[data-estado-componentes]').forEach(function (el) { errorCarga(el); });
      });
    }
    var necesita = $('[data-historial], [data-ds-accesos], [data-dash], [data-ds-resumen], [data-count], [data-catalogo], [data-detalle], [data-entregables], [data-build-info], [data-ds-info], [data-side-count], [data-centro]');
    if (!necesita) return;
    catalogo().then(function (cat) {
      sidebarFlujos(cat);
      initBuild(cat);
      initInicio(cat);
      resumenDS(cat);
      initPrototipos(cat);
      initDetalle(cat);
      initEntregables(cat);
      initCentro(cat);
      if ($('[data-historial]')) {
        estado().then(function (est) { initHistorial(cat, est); })
          .catch(function () { initHistorial(cat, null); });
      }
      if ($('[data-ds-accesos]')) {
        estado().then(function (est) { initDSPagina(cat, est); })
          .catch(function () { initDSPagina(cat, null); });
      }
    }).catch(function () {
      $all('[data-pendientes], [data-recientes], [data-ds-card], [data-distribucion], [data-ds-resumen], [data-catalogo], [data-detalle], [data-entregables], [data-centro]').forEach(function (el) {
        var inner = el.matches('[data-detalle]') ? document.createElement('div') : el;
        if (inner !== el) { inner.className = 'pux-container pux-section'; el.innerHTML = ''; el.appendChild(inner); }
        errorCarga(inner);
      });
    });
  });
})();
