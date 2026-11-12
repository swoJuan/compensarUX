const appBottomSheetDocs = (() => {
  const listItems = ['Dermatología', 'Endocrinología', 'Gastroenterología', 'Neurología', 'Oftalmología', 'Oncología', 'Pediatra', 'Psiquiatra', 'Traumatólogo'];

  const exportCss = mpDocsCss('app-bottom-sheet');

  const exportSass = mpDocsScss('app-bottom-sheet');

  function findPage(node) {
    return node?.closest?.('[data-component-doc="app-bottom-sheet"]') || document.querySelector('[data-component-doc="app-bottom-sheet"]');
  }

  function escapeHtml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function listSheet(config = {}) {
    const placeholder = escapeHtml(config.query || 'Buscar');
    const state = config.state || '';
    const options = listItems.slice(0, config.compact ? 4 : 9).map((item, index) => {
      const stateClass = (state === 'hover' && index === 1) ? ' is-hover' : (state === 'focus' && index === 1) ? ' is-focus' : (state === 'selected' && index === 1) ? ' is-selected' : '';
      return `<button class="mp-bottom-sheet__option${stateClass}" type="button">${item}</button>`;
    }).join('');
    return `<div class="mp-bottom-sheet mp-bottom-sheet--list" role="dialog" aria-modal="true" aria-label="Seleccionar especialidad">
  <button class="mp-bottom-sheet__header" type="button" aria-label="Arrastrar o cerrar">
    <span class="mp-bottom-sheet__handle" aria-hidden="true"></span>
  </button>
  <div class="mp-bottom-sheet__content">
    <label class="mp-bottom-sheet__search">
      <input type="search" placeholder="${placeholder}" aria-label="Buscar">
      <i class="icon icon-magnifying-glass" aria-hidden="true"></i>
    </label>
    <div class="mp-bottom-sheet__list">
      ${options}
      <span class="mp-bottom-sheet__scroll" aria-hidden="true"></span>
    </div>
  </div>
</div>`;
  }

  function chip(label, selected = false) {
    return `<button class="mp-bottom-sheet__chip${selected ? ' is-selected' : ''}" type="button" aria-pressed="${selected ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
  }

  function filtersSheet(config = {}) {
    const title = escapeHtml(config.title || 'Filtrar por');
    return `<div class="mp-bottom-sheet mp-bottom-sheet--filters" role="dialog" aria-modal="true" aria-labelledby="bottom-sheet-filter-title">
  <button class="mp-bottom-sheet__header" type="button" aria-label="Arrastrar o cerrar">
    <span class="mp-bottom-sheet__handle" aria-hidden="true"></span>
  </button>
  <div class="mp-bottom-sheet__content">
    <h2 class="mp-bottom-sheet__title" id="bottom-sheet-filter-title">${title}</h2>
    <section class="mp-bottom-sheet__section" aria-labelledby="filter-attention-title">
      <h3 class="mp-bottom-sheet__section-title" id="filter-attention-title">Tipo de atención</h3>
      <div class="mp-bottom-sheet__chips">${chip('Presencial', true)}${chip('Virtual')}</div>
    </section>
    <section class="mp-bottom-sheet__section" aria-labelledby="filter-status-title">
      <h3 class="mp-bottom-sheet__section-title" id="filter-status-title">Estado de la cita</h3>
      <div class="mp-bottom-sheet__chips">${chip('Próximas', true)}${chip('Pasadas', true)}${chip('Canceladas', true)}${chip('Reprogramadas', true)}</div>
    </section>
    <section class="mp-bottom-sheet__section" aria-labelledby="filter-sort-title">
      <h3 class="mp-bottom-sheet__section-title" id="filter-sort-title">Ordenar</h3>
      <div class="mp-bottom-sheet__chips">${chip('Cita más cercana', true)}${chip('Centro médico')}</div>
    </section>
  </div>
  <div class="mp-bottom-sheet__actions">
    <button class="mp-bottom-sheet__primary" type="button">Aplicar</button>
    <button class="mp-bottom-sheet__secondary" type="button">Limpiar</button>
  </div>
</div>`;
  }

  function stateFromPage(page) {
    return {
      variant: page.querySelector('[data-app-bottom-sheet-control="variant"]')?.value || 'list',
      title: page.querySelector('[data-app-bottom-sheet-control="title"]')?.value || 'Filtrar por',
      query: page.querySelector('[data-app-bottom-sheet-control="query"]')?.value || 'Buscar',
      theme: page.querySelector('[data-app-bottom-sheet-control="theme"]')?.value || 'light'
    };
  }

  function buildSheet(config = {}) {
    return config.variant === 'filters' ? filtersSheet(config) : listSheet(config);
  }

  function renderInto(container, config = {}) {
    if (container) container.innerHTML = buildSheet(config);
  }

  function renderAnatomy(page, variant = 'list') {
    if (!page) return;
    page.querySelectorAll('[data-app-bottom-sheet-anatomy]').forEach((button) => {
      const active = button.dataset.appBottomSheetAnatomy === variant;
      button.setAttribute('aria-pressed', String(active));
    });
    renderInto(page.querySelector('#app-bottom-sheet-anatomy-preview'), { variant });
  }

  function renderPlayground(page) {
    if (!page) return;
    const state = stateFromPage(page);
    const shell = page.querySelector('#app-bottom-sheet-preview-shell');
    if (shell) shell.dataset.theme = state.theme;
    renderInto(page.querySelector('#app-bottom-sheet-preview'), state);
    renderCode(page);
  }

  function renderDemos(page) {
    page.querySelectorAll('[data-app-bottom-sheet-demo]').forEach((node) => renderInto(node, { variant: node.dataset.appBottomSheetDemo, compact: true }));
    page.querySelectorAll('[data-app-bottom-sheet-state]').forEach((node) => renderInto(node, { variant: 'list', compact: true, state: node.dataset.appBottomSheetState }));
    page.querySelectorAll('[data-app-bottom-sheet-mode]').forEach((node) => renderInto(node, { variant: 'filters', title: 'Filtrar por' }));
  }

  function activeCodeTab(page) {
    return page.querySelector('[data-app-bottom-sheet-code-tab].active')?.dataset.appBottomSheetCodeTab || 'html';
  }

  function codeFor(tab, page) {
    if (tab === 'css') return exportCss;
    if (tab === 'sass') return exportSass;
    return buildSheet(stateFromPage(page));
  }

  function renderCode(page) {
    if (!page) return;
    ['html', 'css', 'sass'].forEach((tab) => {
      const pre = page.querySelector(`#app-bottom-sheet-code-${tab}`);
      if (pre) pre.textContent = codeFor(tab, page);
    });
  }

  function switchCodeTab(page, tab = 'html') {
    if (!page) return;
    page.querySelectorAll('[data-app-bottom-sheet-code-tab]').forEach((button) => {
      const active = button.dataset.appBottomSheetCodeTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#app-bottom-sheet-code-html, #app-bottom-sheet-code-css, #app-bottom-sheet-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `app-bottom-sheet-code-${tab}`);
    });
    renderCode(page);
  }

  function downloadFile(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function copyText(text, button) {
    if (!button || !text) return;
    navigator.clipboard?.writeText(text).then(() => {
      const original = button.innerHTML;
      button.innerHTML = '<i class="icon icon-check icon-16" aria-hidden="true"></i> Copiado';
      window.setTimeout(() => { button.innerHTML = original; }, 1500);
    });
  }

  function bindDelegatedEvents() {
    if (document.documentElement.dataset.appBottomSheetDocsDelegated === 'true') return;
    document.documentElement.dataset.appBottomSheetDocsDelegated = 'true';

    document.addEventListener('click', (event) => {
      const anatomy = event.target.closest('[data-app-bottom-sheet-anatomy]');
      if (anatomy) {
        renderAnatomy(findPage(anatomy), anatomy.dataset.appBottomSheetAnatomy);
        return;
      }
      const tab = event.target.closest('[data-app-bottom-sheet-code-tab]');
      if (tab) {
        switchCodeTab(findPage(tab), tab.dataset.appBottomSheetCodeTab);
        return;
      }
      const copy = event.target.closest('[data-app-bottom-sheet-copy-code]');
      if (copy) {
        const page = findPage(copy);
        const active = activeCodeTab(page);
        copyText(codeFor(active, page), copy);
        return;
      }
      const download = event.target.closest('[data-app-bottom-sheet-download]');
      if (download) {
        const page = findPage(download);
        const type = download.dataset.appBottomSheetDownload;
        if (type === 'html') downloadFile('mp-bottom-sheet.html', codeFor('html', page), 'text/html');
        if (type === 'css') downloadFile('mp-bottom-sheet.css', exportCss, 'text/css');
        if (type === 'sass') downloadFile('mp-bottom-sheet.scss', exportSass, 'text/x-scss');
      }
    });

    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-app-bottom-sheet-control]')) renderPlayground(findPage(event.target));
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-app-bottom-sheet-control]')) renderPlayground(findPage(event.target));
    });
  }

  function initAppBottomSheetDoc(root = document) {
    const page = root.querySelector('[data-component-doc="app-bottom-sheet"]');
    if (!page || page.dataset.appBottomSheetInitialized === 'true') return;
    renderAnatomy(page, 'list');
    renderPlayground(page);
    renderDemos(page);
    switchCodeTab(page, 'html');
    page.dataset.appBottomSheetInitialized = 'true';
  }

  return { initAppBottomSheetDoc, bindDelegatedEvents };
})();

window.appBottomSheetDocs = appBottomSheetDocs;

function bootAppBottomSheetDocs() {
  appBottomSheetDocs.bindDelegatedEvents();
  appBottomSheetDocs.initAppBottomSheetDoc(document);
}

document.addEventListener('component-docs:init', () => {
  window.requestAnimationFrame(() => appBottomSheetDocs.initAppBottomSheetDoc(document));
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAppBottomSheetDocs);
} else {
  bootAppBottomSheetDocs();
}
