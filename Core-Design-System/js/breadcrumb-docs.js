const breadcrumbDocs = (() => {
  const exportCss = mpDocsCss('breadcrumb');

  const exportSass = mpDocsScss('breadcrumb');

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function iconMarkup(name, className, hidden = true) {
    return `<i class="icon icon-${name} ${className}"${hidden ? ' aria-hidden="true"' : ''}></i>`;
  }

  function buildItems(config = {}) {
    const levels = Math.max(2, Math.min(Number(config.levels) || 3, 4));
    const parent = config.parent || 'Trámites';
    const current = config.current || 'Pagos';
    if (levels === 2) return ['Inicio', current];
    if (levels === 3) return ['Inicio', parent, current];
    return ['Inicio', 'Afiliados', parent, current];
  }

  function buildBreadcrumbHtml(config = {}) {
    const items = buildItems(config);
    const showHome = config.home !== false;
    const compact = config.compact === true;
    const block = config.block === true;
    const focusIndex = Number.isInteger(config.focusIndex) ? config.focusIndex : -1;
    const previousMode = config.previousMode === true;
    const classes = ['mp-breadcrumb'];
    if (compact) classes.push('mp-breadcrumb--compact');
    if (block) classes.push('mp-breadcrumb--block');

    const children = [];
    if (showHome) {
      children.push(`<li class="mp-breadcrumb__item"><a class="mp-breadcrumb__link${focusIndex === 0 ? ' mp-breadcrumb__link--is-focus' : ''}" href="#">
  ${iconMarkup('house', 'mp-breadcrumb__home')}
  <span class="visually-hidden">Inicio</span>
</a></li>`);
    }

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const safe = escapeHtml(item);
      const hasSeparator = index > 0;
      const separator = hasSeparator ? `${iconMarkup('caret-right', 'mp-breadcrumb__separator')}` : '';
      if (isLast) {
        children.push(`<li class="mp-breadcrumb__item">${separator}<span class="mp-breadcrumb__current" aria-current="page">${safe}</span></li>`);
        return;
      }
      const linkClasses = ['mp-breadcrumb__link'];
      if (previousMode && index === items.length - 2) linkClasses.push('mp-breadcrumb__link--previous');
      if (focusIndex === index + (showHome ? 1 : 0)) linkClasses.push('mp-breadcrumb__link--is-focus');
      children.push(`<li class="mp-breadcrumb__item">${separator}<a class="${linkClasses.join(' ')}" href="#">${safe}</a></li>`);
    });

    return `<nav class="${classes.join(' ')}" aria-label="Breadcrumb">
  <ol class="mp-breadcrumb__list">
    ${children.join('\n    ')}
  </ol>
</nav>`;
  }

  function stateFromPage(page) {
    return {
      levels: page.querySelector('[data-breadcrumb-control="levels"]')?.value || '3',
      theme: page.querySelector('[data-breadcrumb-control="theme"]')?.value || 'light',
      current: page.querySelector('[data-breadcrumb-control="current"]')?.value || 'Pagos',
      parent: page.querySelector('[data-breadcrumb-control="parent"]')?.value || 'Trámites',
      home: page.querySelector('[data-breadcrumb-control="home"]')?.checked !== false,
      compact: page.querySelector('[data-breadcrumb-control="compact"]')?.checked === true,
      block: page.querySelector('[data-breadcrumb-control="block"]')?.checked === true
    };
  }

  function findPage(node) {
    return node?.closest?.('[data-component-doc="breadcrumb"]') || document.querySelector('[data-component-doc="breadcrumb"]');
  }

  function renderBreadcrumb(container, config = {}) {
    if (!container) return;
    container.innerHTML = buildBreadcrumbHtml(config);
  }

  function renderAnatomy(page, state) {
    if (!page) return;
    const current = state || page.dataset.breadcrumbAnatomy || 'default';
    page.dataset.breadcrumbAnatomy = current;
    page.querySelectorAll('[data-breadcrumb-anatomy]').forEach((button) => {
      const active = button.dataset.breadcrumbAnatomy === current;
      button.setAttribute('aria-pressed', String(active));
    });
    const block = page.querySelector('[data-breadcrumb-anatomy-toggle="block"]')?.checked === true;
    renderBreadcrumb(page.querySelector('#breadcrumb-anatomy-preview'), {
      levels: 3,
      current: 'Pagos',
      parent: 'Trámites',
      previousMode: current === 'previous',
      focusIndex: current === 'focus' ? 2 : -1,
      block
    });
    const showMeasures = page.querySelector('[data-breadcrumb-anatomy-toggle="measures"]')?.checked !== false;
    const showLabels = page.querySelector('[data-breadcrumb-anatomy-toggle="labels"]')?.checked !== false;
    page.querySelectorAll('[data-breadcrumb-measure]').forEach((item) => { item.hidden = !showMeasures; });
    page.querySelectorAll('.breadcrumb-doc-callout').forEach((item) => { item.hidden = !showLabels; });
  }

  function renderPlayground(page) {
    if (!page) return;
    const state = stateFromPage(page);
    const preview = page.querySelector('#breadcrumb-preview-area');
    if (preview) {
      preview.dataset.theme = state.theme;
      renderBreadcrumb(preview, state);
    }
    const html = buildBreadcrumbHtml(state);
    const playgroundCode = page.querySelector('#breadcrumb-playground-code');
    if (playgroundCode) playgroundCode.textContent = html;
    renderStaticCode(page, html);
  }

  function renderStaticCode(page, htmlOverride) {
    if (!page) return;
    const html = htmlOverride || buildBreadcrumbHtml({ levels: 3, parent: 'Trámites', current: 'Pagos' });
    const slots = { html, css: exportCss, sass: exportSass };
    Object.entries(slots).forEach(([key, value]) => {
      const pre = page.querySelector(`#breadcrumb-code-${key}`);
      if (pre) pre.textContent = value;
    });
  }

  function setCodeTab(page, tabName = 'html') {
    if (!page) return;
    page.querySelectorAll('[data-breadcrumb-code-tab]').forEach((item) => {
      const active = item.dataset.breadcrumbCodeTab === tabName;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#breadcrumb-code-html, #breadcrumb-code-css, #breadcrumb-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `breadcrumb-code-${tabName}`);
    });
  }

  function renderStaticDemos(page) {
    if (!page) return;
    const stateDemos = {
      default: { levels: 2, home: false, current: 'Pagos' },
      active: { levels: 2, home: false, current: 'Pagos' },
      previous: { levels: 3, home: false, current: 'Pagos', parent: 'Trámites', previousMode: true },
      focus: { levels: 3, home: false, current: 'Pagos', parent: 'Trámites', focusIndex: 1 }
    };
    page.querySelectorAll('[data-breadcrumb-state-demo]').forEach((demo) => {
      renderBreadcrumb(demo, stateDemos[demo.dataset.breadcrumbStateDemo]);
    });
    page.querySelectorAll('[data-breadcrumb-mode-demo]').forEach((demo) => {
      renderBreadcrumb(demo, { levels: 3, parent: 'Trámites', current: 'Pagos' });
    });
  }

  function copyText(text, trigger) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => flashButton(trigger, 'Copiado'));
  }

  function flashButton(trigger, label) {
    if (!trigger) return;
    const original = trigger.innerHTML;
    trigger.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">check</span>${label}`;
    window.setTimeout(() => { trigger.innerHTML = original; }, 1400);
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadFromButton(button) {
    if (!button) return;
    const type = button.dataset.breadcrumbDownload;
    if (type === 'html') downloadFile('mp-breadcrumb.html', downloadableHtml(), 'text/html');
    if (type === 'css') downloadFile('mp-breadcrumb.css', exportCss, 'text/css');
    if (type === 'sass') downloadFile('mp-breadcrumb.scss', exportSass, 'text/x-scss');
    flashButton(button, 'Descargado');
  }

  function setCodeTabFromButton(button) {
    if (!button) return;
    setCodeTab(findPage(button), button.dataset.breadcrumbCodeTab);
  }

  function downloadableHtml() {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Breadcrumb - Compensar Design System</title>
  <style>
${exportCss}
  </style>
</head>
<body>
${buildBreadcrumbHtml({ levels: 3, parent: 'Trámites', current: 'Pagos' })}
</body>
</html>`;
  }

  function bindBreadcrumbDelegated() {
    if (document.documentElement.dataset.breadcrumbDocsDelegated === 'true') return;
    document.documentElement.dataset.breadcrumbDocsDelegated = 'true';

    document.addEventListener('click', (event) => {
      const anatomy = event.target.closest('[data-breadcrumb-anatomy]');
      if (anatomy) {
        renderAnatomy(findPage(anatomy), anatomy.dataset.breadcrumbAnatomy);
        return;
      }

      const tab = event.target.closest('[data-breadcrumb-code-tab]');
      if (tab) {
        setCodeTab(findPage(tab), tab.dataset.breadcrumbCodeTab);
        return;
      }

      const copyPlayground = event.target.closest('[data-breadcrumb-copy-playground]');
      if (copyPlayground) {
        copyText(findPage(copyPlayground).querySelector('#breadcrumb-playground-code')?.textContent || '', copyPlayground);
        return;
      }

      const copyCode = event.target.closest('[data-breadcrumb-copy-code]');
      if (copyCode) {
        copyText(findPage(copyCode).querySelector('#breadcrumb-code-html.active, #breadcrumb-code-css.active, #breadcrumb-code-sass.active')?.textContent || '', copyCode);
        return;
      }

      const download = event.target.closest('[data-breadcrumb-download]');
      if (download) {
        downloadFromButton(download);
      }
    });

    document.addEventListener('input', (event) => {
      if (!event.target.matches('[data-breadcrumb-control]')) return;
      renderPlayground(findPage(event.target));
    });

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-breadcrumb-control]')) renderPlayground(findPage(event.target));
      if (event.target.matches('[data-breadcrumb-anatomy-toggle]')) renderAnatomy(findPage(event.target));
    });
  }

  function initBreadcrumbDocs(root = document) {
    const page = root.querySelector('[data-component-doc="breadcrumb"]');
    if (!page || page.dataset.breadcrumbInitialized === 'true') return;
    renderStaticCode(page);
    setCodeTab(page, 'html');
    renderStaticDemos(page);
    renderAnatomy(page, 'default');
    renderPlayground(page);
    page.dataset.breadcrumbInitialized = 'true';
  }

  function syncTheme(theme) {
    const page = document.querySelector('[data-component-doc="breadcrumb"]');
    if (!page) return;
    const themeControl = page.querySelector('[data-breadcrumb-control="theme"]');
    if (themeControl) themeControl.value = theme || 'light';
    renderPlayground(page);
  }

  return { initBreadcrumbDocs, bindBreadcrumbDelegated, syncTheme, setCodeTabFromButton, downloadFromButton };
})();

window.breadcrumbDocs = breadcrumbDocs;

function bootBreadcrumbDocs() {
  breadcrumbDocs.bindBreadcrumbDelegated();
  breadcrumbDocs.initBreadcrumbDocs(document);
}

document.addEventListener('component-docs:init', () => {
  window.requestAnimationFrame(() => breadcrumbDocs.initBreadcrumbDocs(document));
});

document.addEventListener('ds:theme-change', (event) => {
  const theme = event?.detail?.theme || document.documentElement.getAttribute('data-theme') || 'light';
  breadcrumbDocs.syncTheme(theme);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootBreadcrumbDocs);
} else {
  bootBreadcrumbDocs();
}
