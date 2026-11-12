/* ============================================================
 * file-upload.js — Componente transversal ZT "File upload"
 * ------------------------------------------------------------
 * Zona para arrastrar o seleccionar un archivo (ref. Figma "mp upload file").
 * Estilos en file-upload.css.
 *
 * Estados: vacío (zona punteada) · arrastrando (is-drag) · cargado (campo gris
 * con nombre y tamaño + "Eliminar") · error (is-error + mensaje).
 *
 * API (pensada para pantallas que se re-renderizan con innerHTML):
 *   ZTFileUpload.html({
 *     id:     'p7-cert',                 // obligatorio (id del <input type=file>)
 *     value:  { name, size } | null,     // archivo ya cargado (metadatos)
 *     accept: '.pdf,.jpg,.png',          // def. PDF / JPG / PNG
 *     maxMB:  5,                         // def. 5
 *     attrs:  'data-cfg="cert"'          // atributos extra para el <input>
 *   }) -> string HTML
 *
 *   ZTFileUpload.bind(root, onChange)
 *     Delegación de eventos (click, teclado, drag & drop, quitar) dentro de
 *     root. onChange(inputEl, meta|null, error|null) se llama al cargar,
 *     quitar o rechazar un archivo. meta = { name, size, type }.
 *
 * Prototipo: solo se guardan METADATOS del archivo (no el contenido).
 * ============================================================ */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function size(b) {
    if (!b) return '';
    return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  function extOk(name, accept) {
    if (!accept) return true;
    var ext = '.' + String(name).split('.').pop().toLowerCase();
    return accept.split(',').map(function (a) { return a.trim().toLowerCase(); }).indexOf(ext) !== -1;
  }
  function fmtList(accept) {
    return accept.split(',').map(function (a) { return a.trim().replace('.', '').toUpperCase(); }).join(', ');
  }

  function html(cfg) {
    var id = cfg.id, v = cfg.value;
    var accept = cfg.accept || '.pdf,.jpg,.jpeg,.png';
    var maxMB = cfg.maxMB || 5;
    var input = '<input class="zt-upload__input" type="file" id="' + id + '" accept="' + accept + '" data-max-mb="' + maxMB + '"' + (cfg.attrs ? ' ' + cfg.attrs : '') + '>';
    if (v && v.name) {
      // Cargado (Figma "text field" + "Eliminar"): campo gris con el nombre y acción a la derecha.
      return '<div class="zt-upload is-filled" data-zt-upload>' + input +
        '<div class="zt-upload__file">' +
          '<span class="zt-upload__file-box">' +
            '<span class="icon icon-check-circle icon-20 gs-inherit zt-upload__file-icon" aria-hidden="true"></span>' +
            '<span class="zt-upload__file-name" title="' + esc(v.name) + '">' + esc(v.name) + '</span>' +
            '<span class="zt-upload__file-size">' + size(v.size) + '</span>' +
          '</span>' +
          '<button type="button" class="zt-upload__remove" data-zt-upload-remove aria-label="Eliminar ' + esc(v.name) + '">' +
            '<span class="icon icon-delete icon-20 gs-inherit" aria-hidden="true"></span>Eliminar</button>' +
        '</div></div>';
    }
    return '<div class="zt-upload" data-zt-upload>' + input +
      '<label class="zt-upload__drop" for="' + id + '">' +
        '<span class="icon icon-cloud-arrow-up icon-32 gs-inherit zt-upload__icon" aria-hidden="true"></span>' +
        '<span class="zt-upload__text">Arrastra el archivo o <span class="zt-upload__link">selecciónalo desde tu equipo</span></span>' +
        '<span class="zt-upload__hint">' + fmtList(accept.replace(',.jpeg', '')) + ' · máximo ' + maxMB + ' MB</span>' +
      '</label></div>';
  }

  function take(input, file, onChange) {
    var max = (+input.getAttribute('data-max-mb') || 5) * 1048576;
    var accept = input.getAttribute('accept');
    if (!extOk(file.name, accept)) return onChange(input, null, 'Formato no permitido. Usa ' + fmtList(accept.replace(',.jpeg', '')) + '.');
    if (file.size > max) return onChange(input, null, 'El archivo supera el tamaño máximo (' + input.getAttribute('data-max-mb') + ' MB).');
    onChange(input, { name: file.name, size: file.size, type: file.type }, null);
  }

  function bind(root, onChange) {
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('zt-upload__input')) return;
      e.stopPropagation();
      if (t.files && t.files[0]) take(t, t.files[0], onChange);
    }, true);
    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-zt-upload-remove]');
      if (!rm) return;
      var input = rm.closest('[data-zt-upload]').querySelector('.zt-upload__input');
      onChange(input, null, null);
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      root.addEventListener(ev, function (e) {
        var z = e.target.closest && e.target.closest('[data-zt-upload]:not(.is-filled)');
        if (!z) return;
        e.preventDefault(); z.classList.add('is-drag');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      root.addEventListener(ev, function (e) {
        var z = e.target.closest && e.target.closest('[data-zt-upload]');
        if (!z) return;
        e.preventDefault(); z.classList.remove('is-drag');
        if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files[0] && !z.classList.contains('is-filled')) {
          take(z.querySelector('.zt-upload__input'), e.dataTransfer.files[0], onChange);
        }
      });
    });
  }

  global.ZTFileUpload = { html: html, bind: bind };
})(window);
