/* ============================================================
 * ficha-flujo.js — Ficha de un flujo: Resumen, Pantallas y HU, Versiones y Despliegues.
 * Lo invoca portal.js (initDetalle) con los helpers del portal. JavaScript nativo.
 *
 * Los datos salen de catalogo.json (generado por el build). La edición de pantallas y HU usa la
 * API local (npm run dev); en el sitio publicado, que es estático, la ficha es de solo lectura.
 * Las reglas de pertenencia de URLs se validan en el servidor, no aquí.
 * ============================================================ */
(function () {
  'use strict';
  var U; var F; var CAT; var RAIZ;
  var api = { escritura: false };
  var TABS = [
    { id: 'resumen', nombre: 'Resumen' },
    { id: 'pantallas', nombre: 'Pantallas y HU' },
    { id: 'versiones', nombre: 'Versiones' },
    { id: 'despliegues', nombre: 'Despliegues' }
  ];
  var ESTADO_DESPLIEGUE = {
    'publicado': { label: 'Publicado', tag: 'success' },
    'en-proceso': { label: 'En proceso', tag: 'info' },
    'fallido': { label: 'Fallido', tag: 'error' },
    'revertido': { label: 'Revertido', tag: 'warning' }
  };
  function esc(s) { return U.esc(s); }
  function $(s, r) { return U.$(s, r); }
  function $all(s, r) { return U.$all(s, r); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function enlaceExterno(href, texto, extra) {
    return '<a class="pux-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + texto +
      '<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>' + (extra || '');
  }
  function sinDato(t) { return '<span class="pux-muted">' + esc(t || 'Sin registro') + '</span>'; }
  function urlPantalla(rel) { return F.publicado && rel ? 'p/' + rel.split('/').map(encodeURIComponent).join('/') : null; }
  function urlPantallaVersion(v, rel) { return 'versiones/' + encodeURIComponent(F.id) + '/v' + encodeURIComponent(v.version) + '/' + rel.split('/').map(encodeURIComponent).join('/'); }
  function dsTexto() { return U.dsEnPrototipos(CAT); }
  function huPorCodigo(c) { return (F.hu || []).filter(function (h) { return h.codigo === c; })[0] || null; }
  function pantallaPorId(id) { return (F.pantallas || []).filter(function (p) { return p.id === id; })[0] || null; }
  function anunciar(msg) {
    var v = $('[data-ficha-vivo]'); if (!v) return;
    v.textContent = ''; setTimeout(function () { v.textContent = msg; }, 30);
  }

  /* ---------- cabecera ---------- */
  function cabecera() {
    var pl = CAT.plataformas[F.plataforma] || {};
    var ds = dsTexto();
    var meta = '<li><span class="pux-ficha-meta__k">Versión</span> <strong>v' + esc(U.sinV(F.version)) + '</strong></li>' +
      '<li><span class="pux-ficha-meta__k">Sistema de diseño</span> <strong>' + (ds ? esc(ds) : '—') + '</strong></li>' +
      '<li><span class="pux-ficha-meta__k">Actualizado</span> ' + (F.actualizado ? '<time datetime="' + esc(F.actualizado) + '">' + esc(U.fecha(F.actualizado)) + '</time>' : 'Sin fecha') + '</li>';
    var abrir = F.publicado ? U.botonVisualizar(F, 'Abrir prototipo', 'mp-btn--primario') : '';
    var figma = /^https:\/\//.test(F.figma || '')
      ? '<a class="mp-btn mp-btn--secundario mp-btn--icon-left" href="' + esc(F.figma) + '" target="_blank" rel="noopener"><i class="icon icon-figma-logo icon-20" aria-hidden="true"></i> Ver en Figma<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>'
      : '';
    var tabs = '<div class="pux-tabs pux-ficha-tabs" role="tablist" aria-label="Secciones de ' + esc(F.nombre) + '">' + TABS.map(function (t) {
      return '<button class="pux-tab" type="button" role="tab" id="ft-' + t.id + '" aria-controls="fp-' + t.id + '" data-ftab="' + t.id + '">' + esc(t.nombre) + '</button>';
    }).join('') + '</div>';
    return '<section class="pux-page-head pux-ficha-head"><div class="pux-container">' +
      '<nav class="mp-breadcrumb" aria-label="Ruta de navegación"><ol class="mp-breadcrumb__list">' +
        '<li class="mp-breadcrumb__item"><a class="mp-breadcrumb__link" href="index.html">Inicio</a></li>' +
        '<li class="mp-breadcrumb__item">' + U.SEP_RUTA + '<a class="mp-breadcrumb__link" href="' + esc(F.plataforma) + '.html">Prototipos · ' + esc(pl.nombreCorto || F.plataforma) + '</a></li>' +
        '<li class="mp-breadcrumb__item">' + U.SEP_RUTA + '<span class="mp-breadcrumb__current" aria-current="page">' + esc(F.nombre) + '</span></li>' +
      '</ol></nav>' +
      '<div class="pux-ficha-head__fila">' +
        '<div class="pux-ficha-head__texto">' +
          '<div class="pux-tags">' + U.tagPlataforma(F.plataforma, CAT) + U.badgeEstado(F.estado) + U.tagsCategorias(F) + U.tagsEntrega(F) + '</div>' +
          '<h1 class="pux-page-head__title">' + esc(F.nombre) + '</h1>' +
          '<ul class="pux-ficha-meta" role="list">' + meta + '</ul>' +
        '</div>' +
        '<div class="pux-ficha-head__acciones">' + abrir + figma + '</div>' +
      '</div>' + tabs +
    '</div></section>';
  }

  /* ---------- Resumen ---------- */
  function ultimoDespliegue() {
    return (F.despliegues || []).filter(function (d) { return d.estado === 'publicado'; })[0] || null;
  }
  /* Entrega a Desarrollo (campo `entrega` del catálogo) y publicación: tres hechos distintos, cada uno con su propia fuente. */
  function entregaTexto(f) {
    var e = f.entrega || {};
    if (e.estado === 'entregado') return U.tag('Entregado a dev', 'success') + '<span class="pux-datos__sub">' + esc(U.fecha(e.fecha)) + (e.por ? ' · ' + esc(e.por) : '') + '</span>' + (e.nota ? '<span class="pux-datos__sub">' + esc(e.nota) + '</span>' : '');
    if (e.estado === 'pendiente') return U.tag('Entrega a dev pendiente', 'warning') + (e.nota ? '<span class="pux-datos__sub">' + esc(e.nota) + '</span>' : '');
    return sinDato('Sin entrega registrada');
  }
  function publicacionTexto(f) {
    var dep = ultimoDespliegue();
    return (f.publicado ? U.tag('Publicado en el portal', 'info') : sinDato('No publicado en el portal')) +
      (dep ? ' ' + U.tag('Desplegado', 'success') : '') +
      '<span class="pux-datos__sub">' + (dep ? 'Despliegue registrado: ' + esc(dep.entorno || '') : 'Sin despliegue registrado: «Publicado en el portal» no implica producción.') + '</span>';
  }
  function resumenPartes() {
    var ap = F.aprobacionUX || {};
    var aprob = ap.aprobado
      ? '<span class="pux-ok"><i class="icon icon-check-circle icon-20" aria-hidden="true"></i> Aprobado por ' + esc(ap.por || 'UX') + '</span><span class="pux-datos__sub">' + esc(U.fecha(ap.fecha)) + '</span>'
      : 'Pendiente de aprobación';
    var pl = CAT.plataformas[F.plataforma] || {};
    var enlaces = [];
    if (F.publicado) enlaces.push('<a class="pux-link" href="' + esc(F.url) + '" target="_blank" rel="noopener">Prototipo<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>');
    if (/^https:\/\//.test(F.figma || '')) enlaces.push(enlaceExterno(F.figma, 'Figma'));
    if (F.descarga && F.descarga.url) enlaces.push('<a class="pux-link" href="' + esc(F.descarga.url) + '" download>Descargar ZIP</a>');
    var d = function (k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    var ds = dsTexto();
    var info = '<section class="pux-panel pux-ficha-card" aria-labelledby="fr-info"><h2 class="mp-h6 pux-ficha__titulo" id="fr-info">Información general</h2>' +
      '<dl class="pux-datos">' +
        d('Nombre', esc(F.nombre)) +
        d('Plataforma', esc(pl.nombre || F.plataforma)) +
        d('Descripción', F.descripcion ? esc(F.descripcion) : sinDato('Sin descripción')) +
        d('Versión del flujo', 'v' + esc(U.sinV(F.version))) +
        d('Estado UX', U.badgeEstado(F.estado) + '<span class="pux-datos__sub">' + aprob + '</span>') +
        d('Entrega a Desarrollo', entregaTexto(F)) +
        d('Publicación', publicacionTexto(F)) +
        d('Última actualización', F.actualizado ? esc(U.fecha(F.actualizado)) : sinDato('Sin fecha')) +
        d('Sistema de diseño', ds ? esc(ds) : sinDato('Sin registro')) +
        d('Enlaces', enlaces.length ? '<span class="pux-ficha-enlaces">' + enlaces.join('') + '</span>' : sinDato('Sin enlaces')) +
        d('Identificador', '<code>' + esc(F.id) + '</code>') +
      '</dl></section>';
    var vinc = (F.hu || []).filter(function (h) { return (h.pantallas || []).length; }).length;
    var ud = ultimoDespliegue();
    var kpi = function (k, v, sub, tab) {
      return '<div class="pux-kpi"><dt>' + esc(k) + '</dt><dd><a class="pux-kpi__valor" href="#' + tab + '" data-ir-ftab="' + tab + '">' + v + '</a>' + (sub ? '<span class="pux-datos__sub">' + sub + '</span>' : '') + '</dd></div>';
    };
    var trazab = '<section class="pux-panel pux-ficha-card" aria-labelledby="fr-traz"><h2 class="mp-h6 pux-ficha__titulo" id="fr-traz">Trazabilidad</h2>' +
      '<dl class="pux-kpis">' +
        kpi('Pantallas registradas', (F.pantallas || []).length, (F.pantallasDetectadas || []).length ? plural(F.pantallasDetectadas.length, 'detectada sin registrar', 'detectadas sin registrar') : '', 'pantallas') +
        kpi('HU asociadas', (F.hu || []).length, vinc + ' vinculadas a pantallas', 'pantallas') +
        kpi('Versiones publicadas', (F.versiones || []).length, (F.versiones || []).length ? '' : 'Ninguna versión congelada', 'versiones') +
        (ud ? kpi('Último despliegue confirmado', esc(U.fecha(ud.fecha)), esc(ud.entorno) + (ud.version ? ' · v' + esc(ud.version) : ''), 'despliegues') : '') +
      '</dl></section>';
    var vista = F.publicado
      ? '<section class="pux-ficha-vista" aria-labelledby="vista-titulo">' +
          '<div class="pux-preview__head"><h2 class="mp-h6 pux-section__title" id="vista-titulo">Vista previa</h2>' +
            (F.plataforma === 'app' ? '' : '<div class="mp-tabs" role="group" aria-label="Tamaño de la vista previa">' +
              '<button class="mp-tab is-active" type="button" aria-pressed="true" data-viewport="desktop">Escritorio</button>' +
              '<button class="mp-tab" type="button" aria-pressed="false" data-viewport="mobile">Móvil</button>' +
            '</div>') + '</div>' +
          '<p class="pux-muted">La vista previa es solo para explorar. Para comentar, abre el prototipo completo.</p>' +
          '<div class="pux-preview" data-preview data-viewport-actual="' + (F.plataforma === 'app' ? 'mobile' : 'desktop') + '"><div class="pux-preview__frame"><iframe src="' + esc(F.url) + '" title="Vista previa: ' + esc(F.nombre) + '" loading="lazy"></iframe></div></div>' +
        '</section>'
      : U.vacio('Este flujo aún no está publicado', 'Existe en el repositorio de UX, pero no forma parte de esta publicación.');
    return { grid: info + trazab, vista: vista };
  }
  function panelResumen() { var r = resumenPartes(); return '<div class="pux-ficha-grid" data-ficha-grid>' + r.grid + '</div>' + r.vista; }

  /* ---------- Pantallas y HU ---------- */
  function chipHu(codigo) { return U.tag(codigo, 'info'); }
  function huDePantalla(p) {
    var rels = (F.relaciones || []).filter(function (r) { return r.pantalla === p.id; });
    if (!rels.length) return '<span class="pux-muted">Sin historias</span>';
    return '<details class="pux-ficha-det"><summary>Ver historias <span class="pux-count">' + rels.length + '</span></summary><ul class="pux-ficha-rel" role="list">' +
      rels.map(function (r) {
        var h = huPorCodigo(r.hu) || { codigo: r.hu };
        return '<li><span>' + chipHu(r.hu) + '</span><span class="pux-ficha-rel__t">' + esc(h.titulo || '') + (r.nota ? '<span class="pux-datos__sub">' + esc(r.nota) + '</span>' : '') + '</span>' +
          (api.escritura ? '<button class="mp-btn mp-btn--terciario" type="button" data-relacion="' + esc(r.hu) + '|' + esc(p.id) + '">Editar<span class="visually-hidden"> la relación de ' + esc(r.hu) + ' con ' + esc(p.nombre) + '</span></button>' : '') + '</li>';
      }).join('') + '</ul></details>';
  }
  function filaPantalla(p) {
    var u = urlPantalla(p.ruta);
    var abrir = u && p.existe
      ? '<a class="mp-btn mp-btn--terciario" href="' + esc(u) + '" target="_blank" rel="noopener">Abrir pantalla<span class="visually-hidden"> ' + esc(p.nombre) + ' (se abre en una pestaña nueva)</span></a>'
      : '<span class="pux-muted">' + (p.existe ? 'No publicada' : 'Archivo no encontrado') + '</span>';
    var vincular = api.escritura
      ? '<button class="mp-btn mp-btn--terciario" type="button" data-vincular-pantalla="' + esc(p.id) + '">Vincular HU<span class="visually-hidden"> a ' + esc(p.nombre) + '</span></button>' : '';
    var busca = [p.nombre, p.ruta, p.descripcion].concat(p.hu || []).join(' ');
    return '<tr data-fila-pantalla data-busca="' + esc(busca.toLowerCase()) + '">' +
      '<th scope="row">' + esc(p.nombre) + (p.descripcion ? '<span class="pux-catalogo__desc">' + esc(p.descripcion) + '</span>' : '') + '</th>' +
      '<td data-label="Ruta"><code>' + esc(p.ruta) + '</code></td>' +
      '<td data-label="Historias">' + huDePantalla(p) + '</td>' +
      '<td class="mp-table__actions" data-label="Acciones"><span class="pux-ficha-acc">' + abrir + vincular + '</span></td></tr>';
  }
  function tablaPantallas() {
    var ps = F.pantallas || [];
    if (!ps.length) {
      return U.vacio('Este flujo aún no tiene pantallas registradas',
        (F.pantallasDetectadas || []).length
          ? 'Se detectaron ' + F.pantallasDetectadas.length + ' pantallas en el prototipo. Regístralas abajo para poder vincularles historias de usuario.'
          : 'No se encontraron pantallas HTML en la carpeta del flujo.');
    }
    var buscador = ps.length > 6
      ? '<div class="mp-input-group pux-ficha-buscar"><label class="mp-input-label" for="fp-q">Buscar pantalla o HU</label><div class="mp-input-wrapper">' +
        '<i class="icon icon-magnifying-glass icon-20 mp-input-icon mp-input-icon--left" aria-hidden="true"></i>' +
        '<input class="mp-input-field has-icon-left" type="search" id="fp-q" placeholder="Nombre, ruta o HU-000" autocomplete="off" data-ficha-q></div></div>' : '';
    return buscador + '<div class="mp-table-wrap pux-table"><table class="mp-table mp-table--hover pux-ficha-tabla"><caption class="visually-hidden">Pantallas registradas de ' + esc(F.nombre) + '</caption>' +
      '<thead><tr><th scope="col">Pantalla</th><th scope="col">Ruta</th><th scope="col">Historias</th><th scope="col" class="mp-table__actions"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>' +
      ps.map(filaPantalla).join('') + '</tbody></table></div>' +
      '<p class="pux-muted pux-note" data-ficha-sin-resultados hidden>Ninguna pantalla coincide con la búsqueda.</p>';
  }
  function detectadas() {
    var ds = F.pantallasDetectadas || [];
    if (!ds.length) return '';
    return '<details class="pux-ficha-det pux-ficha-detectadas"' + ((F.pantallas || []).length ? '' : ' open') + '><summary>Pantallas detectadas sin registrar <span class="pux-count">' + ds.length + '</span></summary>' +
      '<p class="pux-muted pux-note">Son archivos HTML que existen en la carpeta del flujo. Ninguna se registra sola: confirma cada una.</p>' +
      '<ul class="pux-ficha-rel" role="list">' + ds.map(function (r) {
        return '<li><code>' + esc(r) + '</code>' + (api.escritura ? '<button class="mp-btn mp-btn--terciario" type="button" data-registrar-ruta="' + esc(r) + '">Registrar<span class="visually-hidden"> ' + esc(r) + '</span></button>' : '') + '</li>';
      }).join('') + '</ul></details>';
  }
  function listaHu() {
    var hus = F.hu || [];
    if (!hus.length) return '<p class="pux-muted pux-hu-vacio">Este flujo aún no tiene historias de usuario asociadas.</p>';
    return '<ul class="pux-hu-lista" role="list">' + hus.map(function (h) {
      var azure = /^https:\/\//.test(h.url || '')
        ? '<a class="mp-btn mp-btn--terciario mp-btn--icon-right pux-hu-item__accion" href="' + esc(h.url) + '" target="_blank" rel="noopener">Abrir en Azure DevOps<span class="visually-hidden"> ' + esc(h.codigo || h.id) + ' (se abre en una pestaña nueva)</span> <i class="icon icon-arrow-square-out icon-20" aria-hidden="true"></i></a>' : '';
      var ps = (h.pantallas || []).map(pantallaPorId).filter(Boolean);
      var chips = ps.length
        ? '<ul class="pux-ficha-chips" role="list">' + ps.map(function (p) { return '<li><span class="pux-chip">' + esc(p.nombre) + '</span></li>'; }).join('') + '</ul>'
        : '<p class="pux-hu-item__meta">Sin pantallas vinculadas</p>';
      return '<li class="pux-hu-item">' +
        '<span class="pux-hu-item__codigo">' + chipHu(h.codigo) + '</span>' +
        '<div class="pux-hu-item__texto"><p class="pux-hu-item__titulo">' + esc(h.titulo || h.codigo) + '</p>' +
          (h.id ? '<p class="pux-hu-item__meta">Work item #' + esc(h.id) + ' · Azure DevOps</p>' : '') +
          (h.descripcion ? '<p class="pux-hu-item__meta">' + esc(h.descripcion) + '</p>' : '') + chips + '</div>' + azure + '</li>';
    }).join('') + '</ul>';
  }
  function panelPantallas() {
    var aviso = api.escritura ? '' : '<div class="mp-alert mp-alert--info" role="status"><i class="icon icon-info icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content"><p class="mp-alert__title">Solo lectura</p><p class="mp-alert__body">Para registrar pantallas o vincular historias abre el portal local (<code>npm run dev</code>). Los cambios quedan en archivos del repositorio.</p></div></div>';
    return aviso +
      '<section class="pux-panel pux-ficha-card" aria-labelledby="fp-pant"><div class="pux-ficha-barra">' +
        '<h2 class="mp-h6 pux-ficha__titulo" id="fp-pant">Pantallas' + ((F.pantallas || []).length ? ' <span class="pux-count">' + F.pantallas.length + '</span>' : '') + '</h2>' +
        '<button class="mp-btn mp-btn--primario" type="button" data-abrir-vincular' + (api.escritura ? '' : ' disabled aria-disabled="true"') + '>+ Vincular historia de usuario</button></div>' +
        '<p class="pux-muted">Una historia puede estar en varias pantallas y una pantalla puede tener varias historias. Solo se aceptan pantallas de este flujo.</p>' +
        tablaPantallas() + detectadas() + '</section>' +
      '<section class="pux-panel pux-ficha-card" aria-labelledby="fp-hu"><h2 class="mp-h6 pux-ficha__titulo" id="fp-hu">Historias de usuario' + ((F.hu || []).length ? ' <span class="pux-count">' + F.hu.length + '</span>' : '') + '</h2>' + listaHu() + '</section>';
  }

  /* ---------- Versiones ---------- */
  function mapaPantallas(v) { var m = {}; (v.pantallas || []).forEach(function (p) { m[p.ruta] = p.huella; }); return m; }
  function comparar(a, b) {
    var ma = mapaPantallas(a); var mb = mapaPantallas(b); var r = { agregadas: [], eliminadas: [], modificadas: [] };
    Object.keys(mb).forEach(function (k) { if (!(k in ma)) r.agregadas.push(k); else if (ma[k] !== mb[k]) r.modificadas.push(k); });
    Object.keys(ma).forEach(function (k) { if (!(k in mb)) r.eliminadas.push(k); });
    return r;
  }
  function huDeRuta(ruta) {
    var p = (F.pantallas || []).filter(function (x) { return x.ruta === ruta; })[0];
    return p ? (p.hu || []) : [];
  }
  function resultadoComparacion(a, b) {
    var c = comparar(a, b);
    var grupo = function (titulo, lista) {
      return '<div class="pux-cmp__grupo"><h4 class="pux-cmp__t">' + esc(titulo) + ' <span class="pux-count">' + lista.length + '</span></h4>' +
        (lista.length ? '<ul class="pux-ficha-rel" role="list">' + lista.map(function (r) {
          var hu = huDeRuta(r);
          return '<li><code>' + esc(r) + '</code>' + (hu.length ? '<span class="pux-datos__sub">HU vinculadas en el registro actual: ' + esc(hu.join(', ')) + '</span>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="pux-muted pux-note">Ninguna</p>') + '</div>';
    };
    if (!(a.pantallas || []).length || !(b.pantallas || []).length) return '<p class="pux-muted">No hay pantallas registradas en una de las versiones: no se puede comparar.</p>';
    return '<p class="pux-muted pux-note">Comparación por huella SHA-256 de las pantallas HTML publicadas en cada versión. No evalúa cambios en CSS, JavaScript ni imágenes.</p>' +
      grupo('Pantallas añadidas', c.agregadas) + grupo('Pantallas modificadas', c.modificadas) + grupo('Pantallas eliminadas', c.eliminadas) +
      '<div class="pux-cmp__grupo"><h4 class="pux-cmp__t">Cambios documentados en v' + esc(b.version) + '</h4><p>' + (b.notas ? esc(b.notas) : sinDato('Sin notas')) + '</p></div>';
  }
  function itemVersion(v) {
    var ds = v.ds ? (v.ds.tag || ('commit ' + v.ds.commit)) : null;
    var est = ((v.estadoUX || {}).estado);
    var commit = '<code>' + esc(v.commit) + '</code>' + (v.commitEnlace && v.commitEnlace.url ? ' ' + enlaceExterno(v.commitEnlace.url, 'Ver commit') : (v.commitEnlace && v.commitEnlace.subido === false ? ' ' + U.tag('Solo local', 'neutral') : ''));
    var pant = (v.pantallas || []).length
      ? '<details class="pux-ficha-det"><summary>Pantallas de esta versión <span class="pux-count">' + v.pantallas.length + '</span></summary><ul class="pux-ficha-rel" role="list">' +
        v.pantallas.map(function (p) { return '<li><a class="pux-link" href="' + esc(urlPantallaVersion(v, p.ruta)) + '" target="_blank" rel="noopener"><code>' + esc(p.ruta) + '</code><span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></li>'; }).join('') + '</ul></details>' : '';
    return '<li class="pux-version' + (v.vigente ? ' is-publicada' : '') + '"><span class="pux-version__dot" aria-hidden="true"></span><div class="pux-version__body">' +
      '<div class="pux-version__head"><h3 class="pux-version__tag">v' + esc(v.version) + '</h3>' + (v.vigente ? '<span class="pux-tags">' + U.tag('Versión actual', 'success') + '</span>' : '') +
        '<time class="pux-version__fecha" datetime="' + esc(v.publicadaEl) + '">Publicada el ' + esc(U.fecha(v.publicadaEl)) + '</time></div>' +
      '<p class="pux-version__titulo">' + esc(v.notas || 'Sin resumen de cambios') + '</p>' +
      '<dl class="pux-datos pux-datos--linea">' +
        '<div><dt>Estado UX</dt><dd>' + esc((U.ESTADOS[est] || {}).label || '—') + '</dd></div>' +
        '<div><dt>Sistema de diseño</dt><dd>' + (ds ? esc(ds) : sinDato('Sin registro')) + '</dd></div>' +
        '<div><dt>Commit</dt><dd>' + commit + '</dd></div>' +
        '<div><dt>Artefacto</dt><dd><code>' + esc(v.artefacto || '—') + '</code></dd></div></dl>' +
      (v.cambiosSinVersion > 0 ? '<p class="pux-muted pux-note">Desde esta versión hay ' + plural(v.cambiosSinVersion, 'cambio', 'cambios') + ' en desarrollo que aún no se publicaron como versión.</p>' : '') + pant +
      '<div class="pux-version__acciones">' + (v.url
        ? '<a class="mp-btn mp-btn--secundario" href="' + esc(v.url) + '" target="_blank" rel="noopener">Ver versión ' + esc(v.version) + '<span class="visually-hidden"> de ' + esc(F.nombre) + ' (se abre en una pestaña nueva)</span></a>'
        : '<p class="pux-muted">Esta versión está registrada, pero no hay una copia publicada disponible para visualizar.</p>') + '</div>' +
    '</div></li>';
  }
  function panelVersiones() {
    var vs = F.versiones || [];
    var hayActual = vs.some(function (v) { return v.vigente; });
    var actualSinCopia = '';
    if (!hayActual) {
      actualSinCopia = '<li class="pux-version is-publicada"><span class="pux-version__dot" aria-hidden="true"></span><div class="pux-version__body">' +
        '<div class="pux-version__head"><h3 class="pux-version__tag">v' + esc(U.sinV(F.version)) + '</h3><span class="pux-tags">' + U.tag('Versión actual', 'success') + '</span></div>' +
        '<p class="pux-version__titulo">Versión registrada en el catálogo. Aún no tiene una copia congelada.</p>' +
        '<p class="pux-muted">Esta versión está registrada, pero no hay una copia publicada disponible para visualizar.</p>' +
        (F.publicado ? '<div class="pux-version__acciones"><a class="mp-btn mp-btn--secundario" href="' + esc(F.url) + '" target="_blank" rel="noopener">Abrir el prototipo vigente<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a>' +
          '<span class="pux-muted pux-note">El prototipo vigente sigue cambiando; no es una copia histórica.</span></div>' : '') + '</div></li>';
    }
    var cmp = '';
    if (vs.length >= 2) {
      var op = function (sel) { return vs.map(function (v, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>v' + esc(v.version) + '</option>'; }).join(''); };
      cmp = '<section class="pux-panel pux-ficha-card" aria-labelledby="fv-cmp"><h2 class="mp-h6 pux-ficha__titulo" id="fv-cmp">Comparar versiones</h2>' +
        '<div class="pux-ficha-cmp"><div class="mp-input-group"><label class="mp-input-label" for="cmp-a">Versión base</label><div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="cmp-a" data-cmp="a">' + op(1) + '</select></div></div>' +
        '<div class="mp-input-group"><label class="mp-input-label" for="cmp-b">Comparar con</label><div class="mp-input-wrapper"><select class="mp-input-field mp-select" id="cmp-b" data-cmp="b">' + op(0) + '</select></div></div></div>' +
        '<div data-cmp-res aria-live="polite"></div></section>';
    }
    return '<section class="pux-panel pux-ficha-card" aria-labelledby="fv-lista"><h2 class="mp-h6 pux-ficha__titulo" id="fv-lista">Versiones' + (vs.length ? ' <span class="pux-count">' + vs.length + '</span>' : '') + '</h2>' +
      '<p class="pux-muted">Cada versión publicada conserva sus archivos y el sistema de diseño que usó. Abrirla no cambia el prototipo vigente.</p>' +
      '<ol class="pux-versions" role="list">' + actualSinCopia + vs.map(itemVersion).join('') + '</ol>' +
      (vs.length ? '' : '<p class="pux-muted pux-note">Las versiones se publican de forma explícita, con aprobación. Los commits de desarrollo no crean versiones.</p>') + '</section>' + cmp;
  }

  /* ---------- Despliegues ---------- */
  function badgeDespliegue(estado) {
    var e = ESTADO_DESPLIEGUE[estado] || { label: estado, tag: 'neutral' };
    return '<span class="mp-badge mp-badge--' + e.tag + '" role="img" aria-label="Estado: ' + esc(e.label) + '"><span class="mp-badge-dot" aria-hidden="true"></span><span class="mp-badge__label">' + esc(e.label) + '</span></span>';
  }
  function commitHtml(c) {
    var hash = c.url ? enlaceExterno(c.url, '<code>' + esc(c.corto) + '</code>') : '<code>' + esc(c.corto) + '</code>' + (c.subido === false ? ' ' + U.tag('Solo local', 'neutral') : '');
    var arch = (c.archivos || []).length
      ? '<details class="pux-ficha-det"><summary>' + plural(c.totalArchivos, 'archivo', 'archivos') + (c.alcance === 'transversal' ? ' que usa este flujo' : '') + '</summary><ul class="pux-ficha-rel" role="list">' +
        c.archivos.map(function (a) { return '<li><code>' + esc(a) + '</code></li>'; }).join('') + (c.totalArchivos > c.archivos.length ? '<li class="pux-muted">… y ' + (c.totalArchivos - c.archivos.length) + ' más</li>' : '') + '</ul></details>' : '';
    return '<li class="pux-commit"><p class="pux-commit__msg">' + esc(c.mensaje) + '</p>' +
      '<p class="pux-commit__meta">' + hash + ' · ' + esc(c.autor || 'Autor no registrado') + ' · <time datetime="' + esc(c.fecha) + '">' + esc(U.fechaHora(c.fecha) || U.fecha(c.fecha)) + '</time></p>' + arch + '</li>';
  }
  function filaDespliegue(d, i) {
    var url = /^https:\/\//.test(d.urlPublicada || '') ? '<a class="mp-btn mp-btn--terciario" href="' + esc(d.urlPublicada) + '" target="_blank" rel="noopener">Abrir prototipo publicado<span class="visually-hidden"> (' + esc(d.entorno) + ', se abre en una pestaña nueva)</span></a>' : '';
    var ci = d.commitInfo;
    return '<tr><th scope="row"><time datetime="' + esc(d.fecha) + '">' + esc(U.fechaHora(d.fecha) || U.fecha(d.fecha)) + '</time></th>' +
      '<td data-label="Entorno">' + esc(d.entorno) + '</td><td data-label="Estado">' + badgeDespliegue(d.estado) + '</td>' +
      '<td data-label="Versión">' + (d.version ? 'v' + esc(d.version) : sinDato('Sin versión')) + '</td>' +
      '<td data-label="Commit"><code>' + esc((ci && ci.corto) || String(d.commit).slice(0, 7)) + '</code></td>' +
      '<td data-label="Responsable">' + (d.responsable ? esc(d.responsable) : sinDato('Sin registro')) + '</td>' +
      '<td class="mp-table__actions" data-label="Acciones"><span class="pux-ficha-acc">' + url + '<button class="mp-btn mp-btn--terciario" type="button" data-despliegue="' + i + '">Ver detalle<span class="visually-hidden"> del despliegue ' + esc(d.id) + '</span></button></span></td></tr>';
  }
  function panelDespliegues() {
    var ds = F.despliegues || [];
    var cm = F.commits || { propios: [], transversales: [] };
    var conceptos = '<details class="pux-ficha-det pux-ficha-conceptos"><summary>Versión, commit y despliegue: qué es cada uno</summary><dl class="pux-datos">' +
      '<div><dt>Versión</dt><dd>Identifica una versión funcional del flujo (por ejemplo v0.1.0).</dd></div>' +
      '<div><dt>Commit</dt><dd>Un cambio registrado en Git. Un commit no significa que esté publicado.</dd></div>' +
      '<div><dt>Despliegue</dt><dd>Publicación efectiva de archivos en un entorno, con evidencia.</dd></div></dl></details>';
    var hist = ds.length
      ? '<div class="mp-table-wrap pux-table"><table class="mp-table mp-table--hover"><caption class="visually-hidden">Historial de despliegues de ' + esc(F.nombre) + '</caption><thead><tr><th scope="col">Fecha y hora</th><th scope="col">Entorno</th><th scope="col">Estado</th><th scope="col">Versión</th><th scope="col">Commit</th><th scope="col">Responsable</th><th scope="col" class="mp-table__actions"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>' + ds.map(filaDespliegue).join('') + '</tbody></table></div>'
      : U.vacio('No hay despliegues verificados para este flujo',
          'Un despliegue se registra solo cuando existe evidencia de que se publicó en un entorno. Los commits de abajo son cambios en Git; no implican publicación.');
    var lista = function (arr, vacioTxt) { return arr.length ? '<ol class="pux-commits" role="list">' + arr.map(commitHtml).join('') + '</ol>' : '<p class="pux-muted">' + esc(vacioTxt) + '</p>'; };
    return conceptos +
      '<section class="pux-panel pux-ficha-card" aria-labelledby="fd-hist"><h2 class="mp-h6 pux-ficha__titulo" id="fd-hist">Historial de despliegues' + (ds.length ? ' <span class="pux-count">' + ds.length + '</span>' : '') + '</h2>' + hist + '</section>' +
      '<section class="pux-panel pux-ficha-card" aria-labelledby="fd-prop"><h2 class="mp-h6 pux-ficha__titulo" id="fd-prop">Commits propios del flujo' + (cm.propios.length ? ' <span class="pux-count">' + cm.propios.length + '</span>' : '') + '</h2>' +
        '<p class="pux-muted">Cambios en los archivos de este flujo. Muestran el desarrollo, no lo publicado.</p>' + lista(cm.propios, 'No se encontraron commits que toquen los archivos de este flujo.') + '</section>' +
      '<section class="pux-panel pux-ficha-card" aria-labelledby="fd-trans"><h2 class="mp-h6 pux-ficha__titulo" id="fd-trans">Cambios transversales que usa este flujo' + (cm.transversales.length ? ' <span class="pux-count">' + cm.transversales.length + '</span>' : '') + '</h2>' +
        '<p class="pux-muted">Cambios en recursos compartidos (<code>shared/</code>) que las pantallas de este flujo referencian. No son cambios propios del flujo.</p>' +
        lista(cm.transversales, 'Ningún commit reciente cambió recursos compartidos que este flujo use.') + '</section>';
  }
  function detalleDespliegue(d, disparador) {
    var ci = d.commitInfo; var f = function (k, v) { return '<div class="pux-det__fila"><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    var arch = d.archivos && d.archivos.length ? '<ul class="pux-ficha-rel" role="list">' + d.archivos.map(function (a) { return '<li><code>' + esc(a) + '</code></li>'; }).join('') + '</ul>' : sinDato('Sin información de archivos publicados');
    var ev = /^https:\/\//.test(d.evidencia || '') ? enlaceExterno(d.evidencia, 'Abrir registro del proceso') : esc(d.evidencia);
    U.abrirDrawer({
      sup: F.nombre, titulo: 'Despliegue ' + d.id,
      html: '<dl class="pux-det">' +
        f('Estado', badgeDespliegue(d.estado)) + f('Entorno', esc(d.entorno)) + f('Fecha y hora', esc(U.fechaHora(d.fecha) || U.fecha(d.fecha))) +
        f('Versión del flujo', d.version ? 'v' + esc(d.version) : sinDato('Sin versión')) +
        f('Commit', '<code>' + esc(d.commit.slice(0, 7)) + '</code>' + (ci ? '<span class="pux-datos__sub">' + esc(ci.mensaje) + ' · ' + esc(ci.autor) + ' · ' + esc(U.fecha(ci.fecha)) + '</span>' : '')) +
        f('URL publicada', /^https:\/\//.test(d.urlPublicada || '') ? enlaceExterno(d.urlPublicada, esc(d.urlPublicada)) : sinDato('Sin URL')) +
        f('Responsable', d.responsable ? esc(d.responsable) : sinDato('Sin registro')) +
        f('Evidencia', ev) + f('Archivos publicados', arch) + '</dl>'
    }, disparador);
  }

  /* ---------- Drawer: vincular historia de usuario ---------- */
  function campo(id, etiqueta, control, ayuda, obligatorio) {
    return '<div class="mp-input-group" data-campo="' + id + '"><label class="mp-input-label" for="vh-' + id + '">' + esc(etiqueta) + (obligatorio ? '' : ' <span class="pux-muted">(opcional)</span>') + '</label>' +
      '<div class="mp-input-wrapper">' + control + '</div><span class="mp-input-helper" id="vh-' + id + '-ayuda">' + (ayuda || '') + '</span></div>';
  }
  function formVincular(pre) {
    pre = pre || {};
    var opciones = '<option value="">Elige una pantalla registrada…</option>' + (F.pantallas || []).map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (pre.pantalla === p.id ? ' selected' : '') + '>' + esc(p.nombre) + ' — ' + esc(p.ruta) + '</option>'; }).join('');
    return '<form class="pux-form" data-form-vincular novalidate>' +
      '<div class="mp-alert mp-alert--error" role="alert" data-form-error hidden><i class="icon icon-warning-circle icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content"><p class="mp-alert__title">No se pudo vincular</p><p class="mp-alert__body" data-form-error-txt></p></div></div>' +
      campo('flujo', 'Flujo', '<input class="mp-input-field" id="vh-flujo" type="text" value="' + esc(F.nombre) + '" readonly aria-readonly="true">', 'Las historias solo se vinculan a pantallas de este flujo.', true) +
      '<fieldset class="pux-form__grupo"><legend class="mp-input-label">Pantalla</legend>' +
        campo('pantalla', 'Pantalla registrada', '<select class="mp-input-field mp-select" id="vh-pantalla" aria-describedby="vh-pantalla-ayuda">' + opciones + '</select>', (F.pantallas || []).length ? '' : 'Aún no hay pantallas registradas: pega una URL para registrar la primera.', true) +
        campo('url', 'O pega la URL de la pantalla', '<input class="mp-input-field" id="vh-url" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="http://localhost:4173/p/zt/…/pantalla.html" aria-describedby="vh-url-ayuda">', 'Se valida que pertenezca a este flujo.', false) +
        '<div class="pux-form__estado" id="vh-estado" role="status" aria-live="polite"></div>' +
        '<div class="pux-form__registrar" data-registrar hidden>' +
          campo('pnombre', 'Nombre de la pantalla', '<input class="mp-input-field" id="vh-pnombre" type="text" maxlength="120" aria-describedby="vh-pnombre-ayuda">', 'Pertenece a este flujo y todavía no está registrada.', true) +
          '<label class="pux-form__check"><input type="checkbox" id="vh-confirmar"> Confirmo que quiero registrar esta pantalla en el flujo</label></div>' +
      '</fieldset>' +
      campo('codigo', 'Identificador HU', '<input class="mp-input-field" id="vh-codigo" type="text" autocomplete="off" placeholder="HU-297" aria-describedby="vh-codigo-ayuda">', 'Ejemplo: HU-297. Si ya existe en este flujo se reutiliza.', true) +
      campo('titulo', 'Nombre de la historia', '<input class="mp-input-field" id="vh-titulo" type="text" maxlength="200" aria-describedby="vh-titulo-ayuda">', '', true) +
      campo('azure', 'URL de Azure DevOps', '<input class="mp-input-field" id="vh-azure" type="url" autocomplete="off" placeholder="https://dev.azure.com/…/_workitems/edit/000000" aria-describedby="vh-azure-ayuda">', 'Es el enlace del work item, no de la pantalla.', false) +
      campo('descripcion', 'Descripción', '<textarea class="mp-input-field mp-textarea" id="vh-descripcion" rows="3" maxlength="2000" aria-describedby="vh-descripcion-ayuda"></textarea>', '', false) +
      campo('nota', 'Nota de la relación', '<input class="mp-input-field" id="vh-nota" type="text" maxlength="600" aria-describedby="vh-nota-ayuda">', 'Qué parte de la historia cubre esta pantalla.', false) +
      '<div class="pux-form__acciones"><button class="mp-btn mp-btn--primario" type="submit">Vincular historia</button><button class="mp-btn mp-btn--secundario" type="button" data-drawer-cerrar>Cancelar</button></div></form>';
  }
  function abrirVincular(pre, disparador) {
    U.abrirDrawer({ sup: F.nombre, titulo: 'Vincular historia de usuario', html: formVincular(pre) }, disparador);
    guardarAyudas($('[data-form-vincular]'));
  }
  function normalizaCodigo(s) { var m = /^\s*hu[\s_-]*(\d{1,6})\s*$/i.exec(s || ''); return m ? 'HU-' + ('000' + Number(m[1])).slice(-Math.max(3, String(Number(m[1])).length)) : null; }
  function marcarError(form, campoId, msg) {
    var wrap = $('[data-campo="' + campoId + '"]', form); if (!wrap) return false;
    var inp = $('input, select, textarea', wrap); var ay = $('.mp-input-helper', wrap);
    if (inp) { inp.classList.add('error'); inp.setAttribute('aria-invalid', 'true'); }
    if (ay) { ay.classList.add('error'); ay.innerHTML = '<i class="icon icon-warning-circle icon-16" aria-hidden="true"></i> ' + esc(msg); ay.setAttribute('role', 'alert'); }
    return true;
  }
  function limpiarErrores(form) {
    $all('.mp-input-field.error', form).forEach(function (i) { i.classList.remove('error'); i.removeAttribute('aria-invalid'); });
    $all('.mp-input-helper.error', form).forEach(function (a) { a.classList.remove('error'); a.removeAttribute('role'); a.innerHTML = a.getAttribute('data-original') || ''; });
    var e = $('[data-form-error]', form); if (e) e.hidden = true;
  }
  var MAPA_CAMPO = { hu_invalida: 'codigo', hu_conflicto: 'codigo', titulo_invalido: 'titulo', azure_invalida: 'azure', descripcion_larga: 'descripcion', nota_larga: 'nota', nombre_invalido: 'pnombre',
    otro_flujo: 'url', url_invalida: 'url', url_vacia: 'url', protocolo_no_permitido: 'url', origen_no_permitido: 'url', ruta_ambigua: 'url', ruta_no_prototipo: 'url', no_es_pantalla: 'url', sin_flujo: 'url', pantalla_inexistente: 'url', pantalla_duplicada: 'url', relacion_duplicada: 'pantalla' };
  function mostrarError(form, err) {
    limpiarErrores(form);
    var campoId = MAPA_CAMPO[err.codigo];
    if (err.codigo === 'pantalla_no_registrada') { var r = $('[data-registrar]', form); r.hidden = false; $('#vh-pnombre', form).focus(); }
    var enCampo = campoId && !(campoId === 'url' && !$('#vh-url', form).value.trim()) ? marcarError(form, campoId, err.mensaje) : false;
    var caja = $('[data-form-error]', form); $('[data-form-error-txt]', form).textContent = err.mensaje; caja.hidden = false;
    if (enCampo) { var inp = $('#vh-' + (campoId === 'pantalla' ? 'pantalla' : campoId), form); if (inp) inp.focus(); } else caja.scrollIntoView({ block: 'nearest' });
  }
  function llamar(accion, cuerpo) {
    return fetch(RAIZ + encodeURIComponent(F.id) + '/' + accion, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-UX': '1' }, body: JSON.stringify(cuerpo)
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = j.error || {}; e.mensaje = e.mensaje || 'No se pudo completar la operación.'; throw e; } return j; }); });
  }
  function aplicarProyeccion(p) {
    F.hu = p.hu; F.pantallas = p.pantallas; F.relaciones = p.relaciones; F.pantallasDetectadas = p.pantallasDetectadas;
    var g = $('[data-ficha-grid]'); if (g) g.innerHTML = resumenPartes().grid;
    pintarPanel('pantallas');
  }
  function resolverUrl(form) {
    var estado = $('#vh-estado', form); var url = $('#vh-url', form).value.trim(); var reg = $('[data-registrar]', form);
    limpiarErrores(form); reg.hidden = true; estado.textContent = '';
    if (!url) return Promise.resolve();
    $('#vh-pantalla', form).value = '';
    estado.textContent = 'Comprobando la URL…';
    return llamar('resolver', { url: url }).then(function (r) {
      if (r.registrada) estado.innerHTML = '<span class="pux-ok"><i class="icon icon-check-circle icon-20" aria-hidden="true"></i> Pantalla identificada: «' + esc(r.registrada.nombre) + '»</span> <code>' + esc(r.ruta) + '</code>';
      else { estado.innerHTML = '<i class="icon icon-info icon-20" aria-hidden="true"></i> La pantalla <code>' + esc(r.ruta) + '</code> es de este flujo, pero todavía no está registrada.'; reg.hidden = false; }
    }).catch(function (e) { estado.textContent = ''; mostrarError(form, e); });
  }
  function enviarVincular(form) {
    limpiarErrores(form);
    var url = $('#vh-url', form).value.trim(); var sel = $('#vh-pantalla', form).value;
    if (!url && !sel) { mostrarError(form, { codigo: 'pantalla_vacia', mensaje: 'Elige una pantalla registrada o pega su URL.' }); marcarError(form, 'pantalla', 'Elige una pantalla registrada o pega su URL.'); $('#vh-pantalla', form).focus(); return; }
    var cuerpo = {
      pantalla: url ? { url: url } : { id: sel },
      hu: { codigo: $('#vh-codigo', form).value, titulo: $('#vh-titulo', form).value, url: $('#vh-azure', form).value, descripcion: $('#vh-descripcion', form).value },
      nota: $('#vh-nota', form).value
    };
    var reg = $('[data-registrar]', form);
    if (!reg.hidden) cuerpo.registrarPantalla = { nombre: $('#vh-pnombre', form).value, confirmar: $('#vh-confirmar', form).checked };
    var btn = $('button[type="submit"]', form); btn.disabled = true;
    llamar('vincular', cuerpo).then(function (r) {
      aplicarProyeccion(r.proyeccion); U.cerrarDrawer();
      anunciar(r.relacion.hu + ' vinculada a la pantalla.' + (r.pantallaRegistrada ? ' La pantalla se registró.' : ''));
      var b = $('[data-abrir-vincular]'); if (b) b.focus();
    }).catch(function (e) {
      if (e.codigo === 'pantalla_no_registrada') { reg.hidden = false; $('#vh-estado', form).innerHTML = '<i class="icon icon-info icon-20" aria-hidden="true"></i> La pantalla <code>' + esc((e.propuesta || {}).ruta || '') + '</code> es de este flujo, pero no está registrada. Nómbrala y confirma para registrarla.'; }
      mostrarError(form, e);
    }).then(function () { btn.disabled = false; });
  }
  function prellenarHu(form) {
    var codigo = normalizaCodigo($('#vh-codigo', form).value); var h = codigo && huPorCodigo(codigo); var ay = $('[data-campo="codigo"] .mp-input-helper', form);
    var campos = ['titulo', 'azure', 'descripcion'].map(function (c) { return $('#vh-' + c, form); });
    if (h) {
      campos[0].value = h.titulo || ''; campos[1].value = h.url || ''; campos[2].value = h.descripcion || '';
      campos.forEach(function (c) { c.readOnly = true; });
      ay.innerHTML = '<i class="icon icon-info icon-16" aria-hidden="true"></i> ' + esc(codigo) + ' ya existe en este flujo: se reutiliza, no se duplica.';
    } else {
      campos.forEach(function (c) { c.readOnly = false; });
      ay.textContent = ay.getAttribute('data-original') || '';
    }
  }

  /* ---------- Drawers: registrar pantalla y editar relación ---------- */
  function abrirRegistrar(ruta, disparador) {
    var sug = ruta.split('/').pop().replace(/\.html$/, '').replace(/[-_]+/g, ' '); sug = sug.charAt(0).toUpperCase() + sug.slice(1);
    U.abrirDrawer({ sup: F.nombre, titulo: 'Registrar pantalla', html:
      '<form class="pux-form" data-form-registrar novalidate><div class="mp-alert mp-alert--error" role="alert" data-form-error hidden><i class="icon icon-warning-circle icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content"><p class="mp-alert__title">No se pudo registrar</p><p class="mp-alert__body" data-form-error-txt></p></div></div>' +
      campo('pruta', 'Ruta', '<input class="mp-input-field" id="vh-pruta" type="text" value="' + esc(ruta) + '" readonly aria-readonly="true">', 'Archivo del prototipo, dentro de este flujo.', true) +
      campo('pnombre', 'Nombre de la pantalla', '<input class="mp-input-field" id="vh-pnombre" type="text" maxlength="120" value="' + esc(sug) + '" aria-describedby="vh-pnombre-ayuda">', '', true) +
      campo('pdesc', 'Descripción', '<textarea class="mp-input-field mp-textarea" id="vh-pdesc" rows="2" maxlength="600"></textarea>', '', false) +
      '<div class="pux-form__acciones"><button class="mp-btn mp-btn--primario" type="submit">Registrar pantalla</button><button class="mp-btn mp-btn--secundario" type="button" data-drawer-cerrar>Cancelar</button></div></form>' }, disparador);
    var f = $('[data-form-registrar]'); if (f) { f.setAttribute('data-ruta', ruta); guardarAyudas(f); }
  }
  function abrirRelacion(codigo, pid, disparador) {
    var r = (F.relaciones || []).filter(function (x) { return x.hu === codigo && x.pantalla === pid; })[0]; var p = pantallaPorId(pid); var h = huPorCodigo(codigo);
    if (!r || !p) return;
    U.abrirDrawer({ sup: F.nombre, titulo: 'Relación ' + codigo, html:
      '<form class="pux-form" data-form-relacion data-hu="' + esc(codigo) + '" data-pantalla="' + esc(pid) + '" novalidate>' +
      '<div class="mp-alert mp-alert--error" role="alert" data-form-error hidden><i class="icon icon-warning-circle icon-32 mp-alert__icon" aria-hidden="true"></i><div class="mp-alert__content"><p class="mp-alert__title">No se pudo guardar</p><p class="mp-alert__body" data-form-error-txt></p></div></div>' +
      '<dl class="pux-det"><div class="pux-det__fila"><dt>Historia</dt><dd>' + esc(codigo) + ' · ' + esc((h && h.titulo) || '') + '</dd></div><div class="pux-det__fila"><dt>Pantalla</dt><dd>' + esc(p.nombre) + '<span class="pux-datos__sub"><code>' + esc(p.ruta) + '</code></span></dd></div></dl>' +
      campo('nota', 'Nota de la relación', '<input class="mp-input-field" id="vh-nota" type="text" maxlength="600" value="' + esc(r.nota || '') + '" aria-describedby="vh-nota-ayuda">', 'Qué parte de la historia cubre esta pantalla.', false) +
      '<div class="pux-form__acciones"><button class="mp-btn mp-btn--primario" type="submit">Guardar nota</button>' +
      '<button class="mp-btn mp-btn--secundario" type="button" data-desvincular>Desvincular</button><button class="mp-btn mp-btn--terciario" type="button" data-drawer-cerrar>Cancelar</button></div>' +
      '<p class="pux-muted pux-note">Desvincular quita la relación; la historia y la pantalla se conservan.</p></form>' }, disparador);
    guardarAyudas($('[data-form-relacion]'));
  }

  /* ---------- pintado y eventos ---------- */
  function pintarPanel(id) {
    var el = $('#fp-' + id); if (!el) return;
    var abiertos = $all('details[open]', el).map(function (d) { return $('summary', d).textContent; });
    el.innerHTML = { resumen: panelResumen, pantallas: panelPantallas, versiones: panelVersiones, despliegues: panelDespliegues }[id]();
    $all('details', el).forEach(function (d) { if (abiertos.indexOf($('summary', d).textContent) >= 0) d.open = true; });
    if (id === 'resumen') { var prev = $('[data-preview]', el); if (prev) U.initPreview(prev); }
    if (id === 'versiones') comparacion();
  }
  function comparacion() {
    var a = $('[data-cmp="a"]'); var b = $('[data-cmp="b"]'); var res = $('[data-cmp-res]'); if (!a || !b) return;
    function pintar() {
      var va = F.versiones[Number(a.value)]; var vb = F.versiones[Number(b.value)];
      res.innerHTML = va === vb ? '<p class="pux-muted">Elige dos versiones distintas.</p>' : resultadoComparacion(va, vb);
    }
    a.onchange = pintar; b.onchange = pintar; pintar();
  }
  function mostrarTab(id, enfocar, sinUrl) {
    if (!TABS.some(function (t) { return t.id === id; })) id = 'resumen';
    $all('.pux-ficha-tabs .pux-tab').forEach(function (b) {
      var on = b.getAttribute('data-ftab') === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      $('#fp-' + b.getAttribute('data-ftab')).hidden = !on;
      if (on && enfocar) b.focus();
    });
    if (!sinUrl) { try { history.replaceState(null, '', window.location.pathname + window.location.search + '#' + id); } catch (e) { /* file:// */ } }
  }
  function filtrarPantallas(q) {
    var t = q.toLowerCase().trim(); var n = 0;
    $all('[data-fila-pantalla]').forEach(function (tr) { var ok = !t || tr.getAttribute('data-busca').indexOf(t) >= 0; tr.hidden = !ok; if (ok) n++; });
    var s = $('[data-ficha-sin-resultados]'); if (s) s.hidden = n > 0;
  }
  function eventos(cont) {
    cont.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('button, a[data-ir-ftab]'); if (!t) return;
      if (t.hasAttribute('data-ftab')) { mostrarTab(t.getAttribute('data-ftab')); return; }
      if (t.hasAttribute('data-ir-ftab')) { e.preventDefault(); mostrarTab(t.getAttribute('data-ir-ftab'), true); return; }
      if (t.hasAttribute('data-abrir-vincular')) { abrirVincular({}, t); return; }
      if (t.hasAttribute('data-vincular-pantalla')) { abrirVincular({ pantalla: t.getAttribute('data-vincular-pantalla') }, t); return; }
      if (t.hasAttribute('data-registrar-ruta')) { abrirRegistrar(t.getAttribute('data-registrar-ruta'), t); return; }
      if (t.hasAttribute('data-relacion')) { var p = t.getAttribute('data-relacion').split('|'); abrirRelacion(p[0], p[1], t); return; }
      if (t.hasAttribute('data-despliegue')) { detalleDespliegue(F.despliegues[Number(t.getAttribute('data-despliegue'))], t); }
    });
    cont.addEventListener('keydown', function (e) {
      var b = e.target.closest && e.target.closest('.pux-ficha-tabs .pux-tab'); if (!b) return;
      var ids = TABS.map(function (t) { return t.id; }); var i = ids.indexOf(b.getAttribute('data-ftab'));
      var ni = { ArrowRight: (i + 1) % ids.length, ArrowLeft: (i + ids.length - 1) % ids.length, Home: 0, End: ids.length - 1 }[e.key];
      if (ni === undefined) return; e.preventDefault(); mostrarTab(ids[ni], true);
    });
    cont.addEventListener('input', function (e) { if (e.target.matches('[data-ficha-q]')) filtrarPantallas(e.target.value); });
    window.addEventListener('hashchange', function () { mostrarTab(location.hash.slice(1), false, true); });
    /* Formularios dentro del drawer (se crean al abrirlo): delegación en el documento. */
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (form.matches('[data-form-vincular]')) { e.preventDefault(); enviarVincular(form); }
      else if (form.matches('[data-form-registrar]')) {
        e.preventDefault(); limpiarErrores(form);
        llamar('pantalla', { url: form.getAttribute('data-ruta'), nombre: $('#vh-pnombre', form).value, descripcion: $('#vh-pdesc', form).value })
          .then(function (r) { aplicarProyeccion(r.proyeccion); U.cerrarDrawer(); anunciar('Pantalla «' + r.pantalla.nombre + '» registrada.'); var b = $('[data-abrir-vincular]'); if (b) b.focus(); })
          .catch(function (er) { mostrarError(form, er); });
      } else if (form.matches('[data-form-relacion]')) {
        e.preventDefault(); limpiarErrores(form);
        llamar('relacion-editar', { hu: form.getAttribute('data-hu'), pantalla: form.getAttribute('data-pantalla'), nota: $('#vh-nota', form).value })
          .then(function (r) { aplicarProyeccion(r.proyeccion); U.cerrarDrawer(); anunciar('Relación actualizada.'); var b = $('[data-abrir-vincular]'); if (b) b.focus(); })
          .catch(function (er) { mostrarError(form, er); });
      }
    });
    document.addEventListener('change', function (e) {
      var form = e.target.closest && e.target.closest('[data-form-vincular]'); if (!form) return;
      if (e.target.id === 'vh-url') resolverUrl(form);
      else if (e.target.id === 'vh-pantalla' && e.target.value) { $('#vh-url', form).value = ''; $('#vh-estado', form).textContent = ''; $('[data-registrar]', form).hidden = true; }
      else if (e.target.id === 'vh-codigo') prellenarHu(form);
    });
    document.addEventListener('paste', function (e) {
      if (!e.target.matches || !e.target.matches('#vh-url')) return;
      var form = e.target.closest('[data-form-vincular]'); setTimeout(function () { resolverUrl(form); }, 0);
    });
    document.addEventListener('click', function (e) {
      var d = e.target.closest && e.target.closest('[data-desvincular]'); if (!d) return;
      var form = d.closest('[data-form-relacion]');
      if (d.getAttribute('data-confirmar') !== '1') { d.setAttribute('data-confirmar', '1'); d.textContent = 'Confirmar desvinculación'; return; }
      llamar('desvincular', { hu: form.getAttribute('data-hu'), pantalla: form.getAttribute('data-pantalla') })
        .then(function (r) { aplicarProyeccion(r.proyeccion); U.cerrarDrawer(); anunciar('Historia desvinculada. La historia y la pantalla se conservan.'); var b = $('[data-abrir-vincular]'); if (b) b.focus(); })
        .catch(function (er) { mostrarError(form, er); });
    });
  }
  function guardarAyudas(form) { $all('.mp-input-helper', form).forEach(function (a) { a.setAttribute('data-original', a.textContent); }); }

  window.PortalFicha = {
    render: function (cont, f, cat, helpers) {
      U = helpers; F = f; CAT = cat; RAIZ = 'api/trazabilidad/';
      cont.innerHTML = cabecera() +
        '<section class="pux-section pux-section--tight" aria-label="Contenido de la ficha"><div class="pux-container">' +
          '<div class="visually-hidden" aria-live="polite" data-ficha-vivo></div>' +
          TABS.map(function (t) { return '<section class="pux-tabpanel pux-ficha-panel" role="tabpanel" id="fp-' + t.id + '" aria-labelledby="ft-' + t.id + '" tabindex="0" hidden></section>'; }).join('') +
        '</div></section>';
      eventos(cont);
      var inicial = (location.hash || '#resumen').slice(1);
      ['resumen', 'pantallas', 'versiones', 'despliegues'].forEach(pintarPanel);
      mostrarTab(inicial, false, true);
      fetch(RAIZ + 'estado', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { escritura: false }; }).catch(function () { return { escritura: false }; })
        .then(function (j) { api.escritura = !!j.escritura; pintarPanel('pantallas'); });
    }
  };
})();
