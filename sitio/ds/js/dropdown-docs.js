// ============================================================
//  dropdown-docs.js
//  Lógica de documentación para el componente Dropdown / Select.
//  Patrón idéntico a selection-docs.js y component-docs.js.
//  Expone: window.dropdownDocs · { initDropdownDoc, bindDropdownDelegated }
// ============================================================

/* global router */
'use strict';

const dropdownDocs = (() => {

  // ──────────────────────────────────────────────────────────
  // Opciones de demo para el playground
  // ──────────────────────────────────────────────────────────
  const demoOptions = {
    simple: [
      { value: 'bog', label: 'Bogotá D.C.' },
      { value: 'med', label: 'Medellín' },
      { value: 'cal', label: 'Cali' },
      { value: 'bar', label: 'Barranquilla' },
      { value: 'car', label: 'Cartagena' },
      { value: 'buc', label: 'Bucaramanga' },
    ],
    grouped: [
      { group: 'Cundinamarca' },
      { value: 'bog', label: 'Bogotá D.C.' },
      { value: 'soa', label: 'Soacha' },
      { group: 'Antioquia' },
      { value: 'med', label: 'Medellín' },
      { value: 'env', label: 'Envigado' },
      { group: 'Valle del Cauca' },
      { value: 'cal', label: 'Cali' },
      { value: 'pal', label: 'Palmira' },
    ],
  };

  // ──────────────────────────────────────────────────────────
  // Código estático por tab
  // ──────────────────────────────────────────────────────────
  const staticCode = {
    html: `<!-- Dropdown simple
     Patrón: botón que despliega un listbox (WAI-ARIA APG "Collapsible Dropdown Listbox").
     Comportamiento y teclado: js/mp-dropdown.js (reutilizable, sin dependencias). -->
<div class="mp-dropdown-group">
  <label class="mp-dropdown-label" id="dd1-label">
    Ciudad
    <span class="mp-dropdown-required" aria-hidden="true">*</span>
  </label>
  <div class="mp-dropdown">
    <button class="mp-dropdown__trigger" type="button" id="dd1"
            aria-haspopup="listbox" aria-expanded="false"
            aria-controls="dd1-list" aria-labelledby="dd1-label dd1-value">
      <span class="mp-dropdown__value is-placeholder" id="dd1-value">Seleccionar</span>
      <span class="material-symbols-rounded mp-dropdown__caret"
            aria-hidden="true">expand_more</span>
    </button>
    <div class="mp-dropdown__panel">
      <div class="mp-dropdown__options" id="dd1-list" role="listbox"
           aria-labelledby="dd1-label" aria-required="true">
        <div class="mp-dropdown__option" role="option" id="dd1-bog"
             aria-selected="false" data-value="bog">Bogotá D.C.</div>
        <div class="mp-dropdown__option" role="option" id="dd1-med"
             aria-selected="false" data-value="med">Medellín</div>
        <div class="mp-dropdown__option mp-dropdown__option--selected"
             role="option" id="dd1-cal" aria-selected="true" data-value="cal">Cali</div>
        <div class="mp-dropdown__option mp-dropdown__option--disabled"
             role="option" id="dd1-buc" aria-disabled="true">Bucaramanga</div>
      </div>
    </div>
  </div>
  <span class="mp-dropdown-helper">Selecciona tu ciudad de residencia</span>
</div>

<!-- Teclado: Enter / Espacio / ↓ / ↑ abren · ↑ ↓ Inicio Fin mueven la opción activa ·
     Enter o Espacio seleccionan y devuelven el foco al botón · Escape cierra · Tab cierra y sigue. -->`,

    multiple: `<!-- Dropdown multi-select (aria-multiselectable) -->
<div class="mp-dropdown-group">
  <label class="mp-dropdown-label" id="dd2-label">Ciudades</label>
  <div class="mp-dropdown">
    <button class="mp-dropdown__trigger" type="button" id="dd2"
            aria-haspopup="listbox" aria-expanded="false"
            aria-controls="dd2-list" aria-labelledby="dd2-label dd2-value">
      <div class="mp-dropdown__chips" id="dd2-value">
        <span class="mp-dropdown__chip">Bogotá</span>
        <span class="mp-dropdown__chip">Cali</span>
      </div>
      <span class="material-symbols-rounded mp-dropdown__caret"
            aria-hidden="true">expand_more</span>
    </button>
    <div class="mp-dropdown__panel">
      <div class="mp-dropdown__options" id="dd2-list" role="listbox"
           aria-labelledby="dd2-label" aria-multiselectable="true">
        <div class="mp-dropdown__option mp-dropdown__option--selected"
             role="option" id="dd2-bog" aria-selected="true" data-value="bog">
          <span class="mp-dropdown__option-check"></span>
          Bogotá D.C.
        </div>
        <div class="mp-dropdown__option" role="option" id="dd2-med"
             aria-selected="false" data-value="med">
          <span class="mp-dropdown__option-check"></span>
          Medellín
        </div>
        <div class="mp-dropdown__option mp-dropdown__option--selected"
             role="option" id="dd2-cal" aria-selected="true" data-value="cal">
          <span class="mp-dropdown__option-check"></span>
          Cali
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Teclado: Espacio o Enter alternan la opción activa y el panel sigue abierto · Escape cierra.
     Nota: los chips son solo informativos; quitar un chip requiere un control fuera del botón (pendiente de UX). -->`,

    search: `<!-- Dropdown con búsqueda: el foco pasa al campo al abrir; escribir filtra las opciones -->
<div class="mp-dropdown-group">
  <label class="mp-dropdown-label" id="dd3-label">Ciudad</label>
  <div class="mp-dropdown">
    <button class="mp-dropdown__trigger" type="button" id="dd3"
            aria-haspopup="listbox" aria-expanded="false"
            aria-controls="dd3-list" aria-labelledby="dd3-label dd3-value">
      <span class="mp-dropdown__value is-placeholder" id="dd3-value">Seleccionar</span>
      <span class="material-symbols-rounded mp-dropdown__caret"
            aria-hidden="true">expand_more</span>
    </button>
    <div class="mp-dropdown__panel">
      <!-- Campo de búsqueda sticky: js/mp-dropdown.js le asigna role="combobox" y aria-activedescendant -->
      <div class="mp-dropdown__search">
        <span class="material-symbols-rounded" aria-hidden="true">search</span>
        <input class="mp-dropdown__search-input"
               type="text"
               placeholder="Buscar ciudad…"
               aria-label="Buscar ciudad"
               autocomplete="off">
      </div>
      <div class="mp-dropdown__options" id="dd3-list" role="listbox"
           aria-labelledby="dd3-label">
        <div class="mp-dropdown__option" role="option" id="dd3-bog"
             aria-selected="false" data-value="bog">Bogotá D.C.</div>
        <div class="mp-dropdown__option" role="option" id="dd3-med"
             aria-selected="false" data-value="med">Medellín</div>
      </div>
      <!-- Sin resultados (oculto por defecto); fuera del listbox para que no cuente como opción -->
      <div class="mp-dropdown__empty" role="status" hidden>Sin resultados</div>
    </div>
  </div>
</div>`,

    accessible: `<!-- Dropdown accesible completo con error -->
<div class="mp-dropdown-group">
  <label class="mp-dropdown-label" id="dd-city-label">
    Ciudad de residencia
    <span class="mp-dropdown-required" aria-hidden="true">*</span>
  </label>
  <div class="mp-dropdown">
    <button class="mp-dropdown__trigger error" type="button" id="dd-city"
            aria-haspopup="listbox" aria-expanded="false"
            aria-controls="dd-city-list"
            aria-labelledby="dd-city-label dd-city-value"
            aria-describedby="dd-city-helper">
      <span class="mp-dropdown__value is-placeholder" id="dd-city-value">Seleccionar</span>
      <span class="material-symbols-rounded mp-dropdown__caret"
            aria-hidden="true">expand_more</span>
    </button>
    <div class="mp-dropdown__panel">
      <div class="mp-dropdown__options" id="dd-city-list" role="listbox"
           aria-labelledby="dd-city-label" aria-required="true" aria-invalid="true">
        <div class="mp-dropdown__option" role="option" id="dd-city-bog"
             aria-selected="false" data-value="bog">Bogotá D.C.</div>
        <div class="mp-dropdown__option" role="option" id="dd-city-med"
             aria-selected="false" data-value="med">Medellín</div>
      </div>
    </div>
  </div>
  <span class="mp-dropdown-helper error" id="dd-city-helper" role="alert">
    <span class="material-symbols-rounded" aria-hidden="true"
          style="font-size:1rem">error</span>
    Debes seleccionar una ciudad de residencia
  </span>
</div>`,
  };

  // ──────────────────────────────────────────────────────────
  // Meta de exports (sección Código)
  // ──────────────────────────────────────────────────────────
  const exportMeta = {
    component: 'Dropdown / Select',
    cssPrefix: 'mp',
    source: 'Core + Figma Compensar v2',
    figmaNodes: ['4530:13900', '4531:19809'],
    updatedAt: '2026-05-04',
    figmaSpecs: {
      triggerHeight: '56px',
      borderRadius: '16px',
      border: '1px solid',
      fontSize: '16px',
      padding: '16px',
      gap: '10px',
      caretSize: '24px',
      panelRadius: '0 0 16px 16px',
      panelMaxHeight: '256px (pendiente validar)',
      optionHeight: '48px (pendiente validar)',
    },
    tokens: {
      borderDefault: '--use-border-subtle → #e0e0e0',
      borderHover: '--use-border-hover → #e63f0c',
      borderActive: '--use-border-strong → #666',
      borderFocus: '--use-primary-default → #ff6600',
      borderError: '--use-state-error-icon',
      background: '--use-surface-white',
      textValue: '--use-text-primary → #111',
      textPlaceholder: '--use-text-tertiary → #666',
      optionHover: '--use-surface-theme-gray-5 → #f5f5f5',
      chipBg: '--use-primary-default 12%',
      required: '--use-state-error-mandatory → #bb4945',
    },
    classes: [
      '.mp-dropdown-group',
      '.mp-dropdown-label',
      '.mp-dropdown-required',
      '.mp-dropdown-helper',
      '.mp-dropdown',
      '.mp-dropdown__trigger',
      '.mp-dropdown__trigger[aria-expanded="true"]',
      '.mp-dropdown__trigger.error',
      '.mp-dropdown__value',
      '.mp-dropdown__value.is-placeholder',
      '.mp-dropdown__caret',
      '.mp-dropdown__chips',
      '.mp-dropdown__chip',
      '.mp-dropdown__chip-remove',
      '.mp-dropdown__panel',
      '.mp-dropdown__search',
      '.mp-dropdown__search-input',
      '.mp-dropdown__options',
      '.mp-dropdown__option',
      '.mp-dropdown__option--selected',
      '.mp-dropdown__option--disabled',
      '.mp-dropdown__option-check',
      '.mp-dropdown__group-header',
      '.mp-dropdown__divider',
      '.mp-dropdown__empty',
    ],
  };

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function copyText(text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const icon = btn.querySelector('.material-symbols-rounded');
      if (icon) {
        const prev = icon.textContent;
        icon.textContent = 'check';
        setTimeout(() => { icon.textContent = prev; }, 1800);
      }
    }).catch(() => {});
  }

  // ──────────────────────────────────────────────────────────
  // Leer estado del playground
  // ──────────────────────────────────────────────────────────

  function getState(page) {
    const get = (attr, fallback = '') => {
      const el = page.querySelector(`[data-drp-control="${attr}"]`);
      if (!el) return fallback;
      if (el.type === 'checkbox') return el.checked;
      return el.value || fallback;
    };
    return {
      tipo:       get('tipo', 'simple'),
      state:      get('state', 'default'),
      theme:      get('theme', 'light'),
      label:      get('label', 'Seleccionar ciudad'),
      placeholder:get('placeholder', 'Seleccionar'),
      helperText: get('helperText', 'Elige una opción'),
      required:   get('required', false),
    };
  }

  // ──────────────────────────────────────────────────────────
  // Construir HTML del trigger según estado
  // ──────────────────────────────────────────────────────────

  function buildTriggerClass(state) {
    const cls = ['mp-dropdown__trigger'];
    if (state.state === 'error')   cls.push('error');
    return cls.join(' ');
  }

  function buildDropdownHtml(s) {
    const isOpen     = s.state === 'open';
    const isError    = s.state === 'error';
    const isDisabled = s.state === 'disabled';
    const id = 'drp-pg';
    const requiredHtml = s.required
      ? `<span class="mp-dropdown-required" aria-hidden="true">*</span>`
      : '';
    const helperClass = isError ? 'mp-dropdown-helper error' : 'mp-dropdown-helper';
    const helperContent = isError
      ? `<span class="material-symbols-rounded" aria-hidden="true" style="font-size:1rem">error</span> ${escHtml(s.helperText)}`
      : escHtml(s.helperText);

    let optionsHtml = '';
    if (s.tipo === 'multiple') {
      optionsHtml = demoOptions.simple.map(o =>
        `  <div class="mp-dropdown__option" role="option" id="${id}-${o.value}" aria-selected="false" data-value="${o.value}">
    <span class="mp-dropdown__option-check"></span>
    ${escHtml(o.label)}
  </div>`).join('\n');
    } else if (s.tipo === 'grouped') {
      optionsHtml = demoOptions.grouped.map(o =>
        o.group
          ? `  <div class="mp-dropdown__group-header" role="presentation">${escHtml(o.group)}</div>`
          : `  <div class="mp-dropdown__option" role="option" id="${id}-${o.value}" aria-selected="false" data-value="${o.value}">${escHtml(o.label)}</div>`
      ).join('\n');
    } else {
      optionsHtml = demoOptions.simple.map(o =>
        `  <div class="mp-dropdown__option" role="option" id="${id}-${o.value}" aria-selected="false" data-value="${o.value}">${escHtml(o.label)}</div>`
      ).join('\n');
    }

    const searchHtml = s.tipo === 'search'
      ? `<div class="mp-dropdown__search">
  <span class="material-symbols-rounded" aria-hidden="true">search</span>
  <input class="mp-dropdown__search-input" type="text" placeholder="Buscar…" aria-label="Buscar" autocomplete="off">
</div>
` : '';
    const emptyHtml = s.tipo === 'search'
      ? `\n<div class="mp-dropdown__empty" role="status" hidden>Sin resultados</div>` : '';

    const listAttrs = [
      `id="${id}-list"`,
      'role="listbox"',
      `aria-labelledby="${id}-label"`,
      s.tipo === 'multiple' ? 'aria-multiselectable="true"' : '',
      s.required ? 'aria-required="true"' : '',
      isError ? 'aria-invalid="true"' : ''
    ].filter(Boolean).join(' ');

    const panelHtml = `<div class="mp-dropdown__panel">
${searchHtml}<div class="mp-dropdown__options" ${listAttrs}>
${optionsHtml}
</div>${emptyHtml}
</div>`;

    const multipleInner = s.tipo === 'multiple'
      ? `<div class="mp-dropdown__chips" id="${id}-value"></div>`
      : `<span class="mp-dropdown__value is-placeholder" id="${id}-value">${escHtml(s.placeholder)}</span>`;

    return `<div class="mp-dropdown-group">
  <label class="mp-dropdown-label" id="${id}-label">${escHtml(s.label)} ${requiredHtml}</label>
  <div class="mp-dropdown">
    <button class="${buildTriggerClass(s)}" type="button" id="${id}"
            aria-expanded="${isOpen}"
            aria-haspopup="listbox"
            aria-controls="${id}-list"
            aria-labelledby="${id}-label ${id}-value"
            ${isError ? `aria-describedby="${id}-helper"` : ''}
            ${isDisabled ? 'disabled' : ''}>
      ${multipleInner}
      <span class="material-symbols-rounded mp-dropdown__caret" aria-hidden="true">expand_more</span>
    </button>
    ${panelHtml}
  </div>
  <span class="${helperClass}" id="${id}-helper">${helperContent}</span>
</div>`;
  }

  // ──────────────────────────────────────────────────────────
  // Código generado por tab
  // ──────────────────────────────────────────────────────────

  function buildCodeOutput(s, tab) {
    if (tab === 'css') {
      return dropdownCssExport();
    }

    if (tab === 'scss') {
      return dropdownScssExport();
    }

    return buildDropdownHtml(s);
  }

  function dropdownCssExport() {
    return mpDocsCss('dropdown');
  }

  function dropdownScssExport() {
    return mpDocsScss('dropdown');
  }

  // ──────────────────────────────────────────────────────────
  // Render playground
  // ──────────────────────────────────────────────────────────

  function renderPlayground(page) {
    const s = getState(page);

    // Preview
    const preview = page.querySelector('#drp-live-preview');
    if (preview) {
      const card = preview.closest('.drp-preview-card');
      if (card) card.dataset.theme = s.theme;
      preview.innerHTML = buildDropdownHtml(s);
    }

    // Código
    const activeTab = page.querySelector('[data-drp-code-tab][aria-selected="true"]');
    const tab = activeTab ? activeTab.dataset.drpCodeTab : 'html';
    const codeEl = page.querySelector('#drp-code-output');
    if (codeEl) codeEl.textContent = buildCodeOutput(s, tab);
  }

  // ──────────────────────────────────────────────────────────
  // Código estático
  // ──────────────────────────────────────────────────────────

  function renderStaticCode(page, key = 'html') {
    const codeEl = page.querySelector('#drp-static-code');
    if (codeEl) codeEl.textContent = staticCode[key] || staticCode.html;

    page.querySelectorAll('[data-drp-static-code-tab]').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.drpStaticCodeTab === key));
    });
  }

  // ──────────────────────────────────────────────────────────
  // Anatomía interactiva
  // ──────────────────────────────────────────────────────────

  const anatomyConfig = {
    simple: {
      height: '56 px', width: '320 px', panelH: 'max 256 px',
      description: 'Selección única · caret expand_more · padding 16 px',
      showPanel: true,
    },
    search: {
      height: '56 px', width: '320 px', panelH: 'max 256 px',
      description: 'Campo de búsqueda sticky en la parte superior del panel',
      showPanel: true,
    },
    multiple: {
      height: '56 px+', width: '320 px', panelH: 'max 256 px',
      description: 'Chips de selección dentro del trigger · panel permanece abierto',
      showPanel: true,
    },
    grouped: {
      height: '56 px', width: '320 px', panelH: 'max 256 px',
      description: 'Encabezados de grupo no seleccionables · 11 px uppercase',
      showPanel: true,
    },
  };

  function renderAnatomy(page, variant) {
    variant = variant || page.querySelector('[data-drp-anatomy-option][aria-selected="true"]')?.dataset.drpAnatomyOption || 'simple';

    // Actualizar botones
    page.querySelectorAll('[data-drp-anatomy-option]').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.drpAnatomyOption === variant));
    });

    const cfg = anatomyConfig[variant] || anatomyConfig.simple;
    const showLabels   = page.querySelector('[data-drp-anatomy-toggle="labels"]')?.checked !== false;
    const showMeasures = page.querySelector('[data-drp-anatomy-toggle="measures"]')?.checked !== false;

    // Badges de medida
    const hBadge = page.querySelector('[data-drp-anatomy-height]');
    const wBadge = page.querySelector('[data-drp-anatomy-width]');
    const pBadge = page.querySelector('[data-drp-anatomy-panel-h]');
    if (hBadge) hBadge.textContent = cfg.height;
    if (wBadge) wBadge.textContent = cfg.width;
    if (pBadge) pBadge.textContent = cfg.panelH;

    // Visibilidad
    page.querySelectorAll('.drp-doc-callout').forEach(c => {
      c.style.display = showLabels ? '' : 'none';
    });
    page.querySelectorAll('.drp-doc-measure').forEach(m => {
      m.style.display = showMeasures ? '' : 'none';
    });

    // Render del preview
    const render = page.querySelector('[data-drp-anatomy-render]');
    if (!render) return;

    let optionsHtml = '';
    if (variant === 'grouped') {
      optionsHtml = demoOptions.grouped.map(o =>
        o.group
          ? `<div class="mp-dropdown__group-header">${escHtml(o.group)}</div>`
          : `<div class="mp-dropdown__option${o.value === 'med' ? ' mp-dropdown__option--selected' : ''}" role="option" aria-selected="${o.value === 'med'}" data-value="${o.value}">${escHtml(o.label)}</div>`
      ).join('');
    } else {
      optionsHtml = demoOptions.simple.map(o =>
        `<div class="mp-dropdown__option${o.value === 'med' ? ' mp-dropdown__option--selected' : ''}" role="option" aria-selected="${o.value === 'med'}" data-value="${o.value}">${
          variant === 'multiple' ? '<span class="mp-dropdown__option-check"></span>' : ''
        }${escHtml(o.label)}</div>`
      ).join('');
    }

    const searchHtml = variant === 'search'
      ? `<div class="mp-dropdown__search">
          <span class="material-symbols-rounded" aria-hidden="true">search</span>
          <input class="mp-dropdown__search-input" type="text" placeholder="Buscar ciudad…" readonly>
        </div>` : '';

    // Anatomy usa <span> para el chip-remove (no <button>) porque el trigger
    // es un <button> y los navegadores no permiten <button> anidados — el parser
    // los mueve fuera del DOM rompiendo el layout.
    const triggerInner = variant === 'multiple'
      ? `<div class="mp-dropdown__chips">
           <span class="mp-dropdown__chip">Medellín <span class="mp-dropdown__chip-remove" aria-hidden="true"><span class="material-symbols-rounded">close</span></span></span>
         </div>`
      : `<span class="mp-dropdown__value">Medellín</span>`;

    const showPanel = cfg.showPanel;

    render.innerHTML = `
      <div class="mp-dropdown-group">
        <label class="mp-dropdown-label">Ciudad</label>
        <div class="mp-dropdown" data-mp-static>
          <button class="mp-dropdown__trigger" type="button" aria-expanded="${showPanel}" style="pointer-events:none">
            ${triggerInner}
            <span class="material-symbols-rounded mp-dropdown__caret" aria-hidden="true">expand_more</span>
          </button>
          ${showPanel ? `
          <div class="mp-dropdown__panel" style="display:block;position:relative;border:1px solid var(--use-primary-default);margin-top:0">
            ${searchHtml}
            <div class="mp-dropdown__options" role="listbox" aria-label="Ciudad"${variant === 'multiple' ? ' aria-multiselectable="true"' : ''}>${optionsHtml}</div>
          </div>` : ''}
        </div>
        <span class="mp-dropdown-helper">${escHtml(cfg.description)}</span>
      </div>`;
  }

  // ──────────────────────────────────────────────────────────
  // Descargas
  // ──────────────────────────────────────────────────────────

  function downloadAsset(type, btn) {
    let content = '', filename = '', mime = 'text/plain';

    if (type === 'css') {
      content = mpDocsCss('dropdown');
      filename = 'mp-dropdown.css';
      mime = 'text/css';
    } else if (type === 'scss') {
      content = mpDocsScss('dropdown');
      filename = 'mp-dropdown.scss';
    } else if (type === 'json') {
      content = JSON.stringify(exportMeta, null, 2);
      filename = 'mp-dropdown.tokens.json';
      mime = 'application/json';
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    if (btn) {
      const icon = btn.querySelector('.material-symbols-rounded');
      if (icon) {
        const prev = icon.textContent;
        icon.textContent = 'check';
        setTimeout(() => { icon.textContent = prev; }, 1800);
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Inicialización
  // ──────────────────────────────────────────────────────────

  function initDropdownDoc(root = document) {
    const page = root.querySelector('[data-component-doc="dropdown"]');
    if (!page || page.dataset.dropdownInitialized === 'true') return;

    try {
      // Anatomía
      page.querySelectorAll('[data-drp-anatomy-option]').forEach(btn => {
        btn.addEventListener('click', () => renderAnatomy(page, btn.dataset.drpAnatomyOption));
      });
      page.querySelectorAll('[data-drp-anatomy-toggle]').forEach(ctrl => {
        ctrl.addEventListener('change', () => renderAnatomy(page));
      });
      renderAnatomy(page, 'simple');

      // Playground controles
      page.querySelectorAll('[data-drp-control]').forEach(ctrl => {
        ctrl.addEventListener('input',  () => renderPlayground(page));
        ctrl.addEventListener('change', () => renderPlayground(page));
      });

      // Playground code tabs
      page.querySelectorAll('[data-drp-code-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
          page.querySelectorAll('[data-drp-code-tab]').forEach(t =>
            t.setAttribute('aria-selected', String(t === tab))
          );
          renderPlayground(page);
        });
      });

      // Copy playground
      const copyPG = page.querySelector('[data-drp-copy-playground]');
      if (copyPG) {
        copyPG.addEventListener('click', () => {
          copyText(page.querySelector('#drp-code-output')?.textContent || '', copyPG);
        });
      }

      renderPlayground(page);

      // Static code tabs
      page.querySelectorAll('[data-drp-static-code-tab]').forEach(tab => {
        tab.addEventListener('click', () => renderStaticCode(page, tab.dataset.drpStaticCodeTab));
      });

      // Copy static
      const copyStatic = page.querySelector('[data-drp-copy-static]');
      if (copyStatic) {
        copyStatic.addEventListener('click', () => {
          copyText(page.querySelector('#drp-static-code')?.textContent || '', copyStatic);
        });
      }

      renderStaticCode(page, 'html');

      // Apertura, selección y teclado: los gestiona el módulo reutilizable js/mp-dropdown.js
      // (delegado en document; funciona con el innerHTML que regenera el playground).

      page.dataset.dropdownInitialized = 'true';
    } catch (e) {
      console.error('No se pudo inicializar la documentación del dropdown.', e);
    }
  }

  // Delegación global para descargas
  function bindDropdownDelegated() {
    if (document.documentElement.dataset.dropdownDocsDelegated === 'true') return;
    document.documentElement.dataset.dropdownDocsDelegated = 'true';

    document.addEventListener('click', e => {
      const dl = e.target.closest('[data-drp-download]');
      if (dl) downloadAsset(dl.dataset.drpDownload, dl);
    });
  }

  return { initDropdownDoc, bindDropdownDelegated };
})();

window.dropdownDocs = dropdownDocs;

// Boot automático
(function bootDropdownDocs() {
  dropdownDocs.bindDropdownDelegated();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dropdownDocs.initDropdownDoc(document));
  } else {
    dropdownDocs.initDropdownDoc(document);
  }
  if (typeof router !== 'undefined') {
    router.on('navigate', () => {
      window.requestAnimationFrame(() => dropdownDocs.initDropdownDoc(document));
    });
  }
})();
