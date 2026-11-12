const loadingDocs = (() => {
  const exportCss = mpDocsCss('loading');

  const animationCss = `/* mp-loading animation - CSS */
.mp-loading__spinner {
  animation: mp-loading-rotate 0.9s linear infinite;
}

.mp-loading__bar {
  animation: mp-loading-fade 0.9s linear infinite;
}

.mp-loading__bar:nth-child(1) { animation-delay: -0.7875s; }
.mp-loading__bar:nth-child(2) { animation-delay: -0.675s; }
.mp-loading__bar:nth-child(3) { animation-delay: -0.5625s; }
.mp-loading__bar:nth-child(4) { animation-delay: -0.45s; }
.mp-loading__bar:nth-child(5) { animation-delay: -0.3375s; }
.mp-loading__bar:nth-child(6) { animation-delay: -0.225s; }
.mp-loading__bar:nth-child(7) { animation-delay: -0.1125s; }
.mp-loading__bar:nth-child(8) { animation-delay: 0s; }

@keyframes mp-loading-rotate {
  to { transform: rotate(360deg); }
}

@keyframes mp-loading-fade {
  0%, 100% { opacity: 1; }
  45% { opacity: 0.28; }
}

@media (prefers-reduced-motion: reduce) {
  .mp-loading__spinner,
  .mp-loading__bar {
    animation-duration: 2.4s;
  }
}`;

  const exportSass = mpDocsScss('loading');

  const animationSass = `// mp-loading animation - Sass
$mp-loading-duration: 0.9s;
$mp-loading-reduced-duration: 2.4s;

.mp-loading__spinner {
  animation: mp-loading-rotate $mp-loading-duration linear infinite;
}

.mp-loading__bar {
  animation: mp-loading-fade $mp-loading-duration linear infinite;
}

@for $i from 1 through 8 {
  .mp-loading__bar:nth-child(#{$i}) {
    animation-delay: -($mp-loading-duration - ($i * ($mp-loading-duration / 8)));
  }
}

@keyframes mp-loading-rotate {
  to { transform: rotate(360deg); }
}

@keyframes mp-loading-fade {
  0%, 100% { opacity: 1; }
  45% { opacity: 0.28; }
}

@media (prefers-reduced-motion: reduce) {
  .mp-loading__spinner,
  .mp-loading__bar {
    animation-duration: $mp-loading-reduced-duration;
  }
}`;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function spinnerMarkup() {
    return `<span class="mp-loading__spinner" aria-hidden="true">
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
    <span class="mp-loading__bar"></span>
  </span>`;
  }

  function buildLoadingHtml(config = {}) {
    const size = config.size || '';
    const layout = config.layout || 'default';
    const paused = config.paused || config.state === 'paused';
    const showText = config.showText !== false;
    const text = config.text || 'Estamos buscando opciones para ti...';
    const classes = ['mp-loading'];
    if (size) classes.push(`mp-loading--${size}`);
    if (layout === 'inline') classes.push('mp-loading--inline');
    if (layout === 'overlay') classes.push('mp-loading--overlay');
    if (config.inverse) classes.push('mp-loading--inverse');
    if (paused) classes.push('is-paused');
    const label = escapeHtml(text);
    return `<div class="${classes.join(' ')}" role="status" aria-live="polite" aria-busy="true"${showText ? '' : ` aria-label="${label}"`}>
  ${spinnerMarkup()}
  ${showText ? `<span class="mp-loading__text">${label}</span>` : ''}
</div>`;
  }

  function stateFromPage(page) {
    return {
      size: page.querySelector('[data-loading-control="size"]')?.value || '',
      layout: page.querySelector('[data-loading-control="layout"]')?.value || 'default',
      theme: page.querySelector('[data-loading-control="theme"]')?.value || 'light',
      state: page.querySelector('[data-loading-control="state"]')?.value || 'running',
      showText: page.querySelector('[data-loading-control="showText"]')?.checked !== false,
      text: page.querySelector('[data-loading-control="text"]')?.value || 'Estamos buscando opciones para ti...'
    };
  }

  function findPage(node) {
    return node?.closest?.('[data-component-doc="loading"]') || document.querySelector('[data-component-doc="loading"]');
  }

  function renderLoading(container, config = {}) {
    if (!container) return;
    container.innerHTML = buildLoadingHtml(config);
  }

  function renderAnatomy(page, variant) {
    if (!page) return;
    const current = variant || page.dataset.loadingAnatomy || 'default';
    page.dataset.loadingAnatomy = current;
    page.querySelectorAll('[data-loading-anatomy]').forEach((button) => {
      const active = button.dataset.loadingAnatomy === current;
      button.setAttribute('aria-pressed', String(active));
    });
    const paused = page.querySelector('[data-loading-anatomy-toggle="paused"]')?.checked;
    renderLoading(page.querySelector('#loading-anatomy-preview'), {
      layout: current,
      paused,
      text: 'Estamos buscando opciones para ti...'
    });
    const showMeasures = page.querySelector('[data-loading-anatomy-toggle="measures"]')?.checked !== false;
    const showLabels = page.querySelector('[data-loading-anatomy-toggle="labels"]')?.checked !== false;
    page.querySelectorAll('[data-loading-measure]').forEach((item) => { item.hidden = !showMeasures; });
    page.querySelectorAll('.loading-doc-callout').forEach((item) => { item.hidden = !showLabels; });
  }

  function renderPlayground(page) {
    if (!page) return;
    const state = stateFromPage(page);
    const preview = page.querySelector('#loading-preview-area');
    if (preview) {
      preview.dataset.theme = state.theme;
      renderLoading(preview, state);
    }
    const html = buildLoadingHtml(state);
    const activeTab = page.querySelector('[data-loading-code-tab].active')?.dataset.loadingCodeTab || 'html';
    const playgroundCode = page.querySelector('#loading-playground-code');
    if (playgroundCode) playgroundCode.textContent = html;
    const output = {
      html,
      css: exportCss,
      sass: exportSass
    };
    const activeOutput = page.querySelector(`#loading-code-${activeTab}`);
    if (activeOutput) activeOutput.textContent = output[activeTab];
  }

  function renderStaticCode(page) {
    if (!page) return;
    const html = buildLoadingHtml({ text: 'Estamos buscando opciones para ti...' });
    const slots = {
      html: html,
      css: exportCss,
      sass: exportSass
    };
    Object.entries(slots).forEach(([key, value]) => {
      const pre = page.querySelector(`#loading-code-${key}`);
      if (pre) pre.textContent = value;
    });
  }

  function setCodeTab(page, tabName = 'html') {
    if (!page) return;
    page.querySelectorAll('[data-loading-code-tab]').forEach((item) => {
      const active = item.dataset.loadingCodeTab === tabName;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#loading-code-html, #loading-code-css, #loading-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `loading-code-${tabName}`);
    });
  }

  function setCodeTabFromButton(button) {
    if (!button) return;
    setCodeTab(findPage(button), button.dataset.loadingCodeTab);
  }

  function renderStaticDemos(page) {
    if (!page) return;
    const demos = {
      default: { text: 'Estamos buscando opciones para ti...' },
      inline: { layout: 'inline', size: 'sm', text: 'Cargando resultados...' },
      overlay: { layout: 'overlay', text: 'Actualizando información...' },
      paused: { state: 'paused', size: 'sm', text: 'Animación reducida' }
    };
    page.querySelectorAll('[data-loading-state-demo]').forEach((demo) => {
      renderLoading(demo, demos[demo.dataset.loadingStateDemo]);
    });
    page.querySelectorAll('[data-loading-mode-demo]').forEach((demo) => {
      renderLoading(demo, { size: 'sm', text: 'Cargando...' });
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
    const type = button.dataset.loadingDownload;
    if (type === 'html') downloadFile('mp-loading.html', downloadableHtml(), 'text/html');
    if (type === 'css') downloadFile('mp-loading.css', exportCss, 'text/css');
    if (type === 'sass') downloadFile('mp-loading.scss', exportSass, 'text/x-scss');
    if (type === 'animation-css') downloadFile('mp-loading-animation.css', animationCss, 'text/css');
    if (type === 'animation-sass') downloadFile('mp-loading-animation.scss', animationSass, 'text/x-scss');
    flashButton(button, 'Descargado');
  }

  function downloadableHtml() {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loading - Compensar Design System</title>
  <style>
${exportCss}
  </style>
</head>
<body>
${buildLoadingHtml({ text: 'Estamos buscando opciones para ti...' })}
</body>
</html>`;
  }

  function bindLoadingDelegated() {
    if (document.documentElement.dataset.loadingDocsDelegated === 'true') return;
    document.documentElement.dataset.loadingDocsDelegated = 'true';

    document.addEventListener('click', (event) => {
      const anatomy = event.target.closest('[data-loading-anatomy]');
      if (anatomy) {
        renderAnatomy(findPage(anatomy), anatomy.dataset.loadingAnatomy);
        return;
      }

      const tab = event.target.closest('[data-loading-code-tab]');
      if (tab) {
        setCodeTabFromButton(tab);
        return;
      }

      const copyPlayground = event.target.closest('[data-loading-copy-playground]');
      if (copyPlayground) {
        copyText(findPage(copyPlayground).querySelector('#loading-playground-code')?.textContent || '', copyPlayground);
        return;
      }

      const copyCode = event.target.closest('[data-loading-copy-code]');
      if (copyCode) {
        copyText(findPage(copyCode).querySelector('#loading-code-html.active, #loading-code-css.active, #loading-code-sass.active')?.textContent || '', copyCode);
        return;
      }

      const download = event.target.closest('[data-loading-download]');
      if (download) {
        downloadFromButton(download);
      }
    });

    document.addEventListener('input', (event) => {
      if (!event.target.matches('[data-loading-control]')) return;
      renderPlayground(findPage(event.target));
    });

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-loading-control]')) renderPlayground(findPage(event.target));
      if (event.target.matches('[data-loading-anatomy-toggle]')) renderAnatomy(findPage(event.target));
    });
  }

  function initLoadingDocs(root = document) {
    const page = root.querySelector('[data-component-doc="loading"]');
    if (!page || page.dataset.loadingInitialized === 'true') return;
    renderStaticCode(page);
    setCodeTab(page, 'html');
    renderStaticDemos(page);
    renderAnatomy(page, 'default');
    renderPlayground(page);
    page.dataset.loadingInitialized = 'true';
  }

  function syncTheme(theme) {
    const page = document.querySelector('[data-component-doc="loading"]');
    if (!page) return;
    const themeControl = page.querySelector('[data-loading-control="theme"]');
    if (themeControl) themeControl.value = theme || 'light';
    renderPlayground(page);
  }

  return { initLoadingDocs, bindLoadingDelegated, syncTheme, setCodeTabFromButton, downloadFromButton };
})();

window.loadingDocs = loadingDocs;

function bootLoadingDocs() {
  loadingDocs.bindLoadingDelegated();
  loadingDocs.initLoadingDocs(document);
}

document.addEventListener('component-docs:init', () => {
  window.requestAnimationFrame(() => loadingDocs.initLoadingDocs(document));
});

document.addEventListener('ds:theme-change', (event) => {
  const theme = event?.detail?.theme || document.documentElement.getAttribute('data-theme') || 'light';
  loadingDocs.syncTheme(theme);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootLoadingDocs);
} else {
  bootLoadingDocs();
}
