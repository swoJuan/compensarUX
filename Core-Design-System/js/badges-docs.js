// ============================================================
//  badges-docs.js
//  Playground y visualizador para Chips / Tags / Badges.
// ============================================================

const badgeDocs = (() => {
  const TONES = [
    { key: 'warning', name: 'Warning', label: 'Pendiente', icon: 'schedule' },
    { key: 'orange', name: 'Orange', label: 'Promoción', icon: 'local_offer' },
    { key: 'info', name: 'Info', label: 'Información', icon: 'info' },
    { key: 'success', name: 'Green 1', label: 'Activo', icon: 'check_circle' },
    { key: 'green', name: 'Green 3', label: 'Disponible', icon: 'eco' },
    { key: 'error', name: 'Error', label: 'Vencido', icon: 'warning' },
    { key: 'neutral', name: 'Blanco', label: 'General', icon: 'circle' },
    { key: 'violet', name: 'Violet', label: 'Afiliado', icon: 'verified' }
  ];

  const KIND_LABELS = {
    badge: 'Activo',
    chip: 'Medicina',
    tag: 'Afiliado'
  };

  const ANATOMY_SPECS = {
    badge: {
      width: '74 px',
      height: '29 px',
      gap: 'Gap 8 px',
      container: 'Padding 4 x 12 px · radio 16 px',
      label: 'Roboto Regular 14 px',
      icon: 'Dot 6 px o ícono 14 px',
      state: 'Estado no interactivo'
    },
    chip: {
      width: '92 px',
      height: '44 px',
      gap: 'Gap 8 px',
      container: 'Área clicable mínima 44 px',
      label: 'Roboto Regular 14 px',
      icon: 'Ícono quitar/desplegar 14 px',
      state: 'Hover / focus / seleccionado'
    },
    tag: {
      width: '78 px',
      height: '29 px',
      gap: 'Gap 8 px',
      container: 'Padding 4 x 12 px · borde opcional',
      label: 'Roboto Regular 14 px',
      icon: 'Opcional · 14 px mínimo',
      state: 'Clasificación informativa'
    }
  };

  const exportCss = mpDocsCss('badges');

  const exportScss = mpDocsScss('badges');

  const exportHtml = `<span class="mp-badge mp-badge--success" role="img" aria-label="Estado: Activo">
  <span class="mp-badge-dot" aria-hidden="true"></span>
  <span class="mp-badge__label">Activo</span>
</span>

<button class="mp-chip mp-chip--info" type="button" aria-pressed="false">
  <span class="mp-chip__label">Medicina</span>
  <span class="material-symbols-rounded mp-chip__icon" aria-hidden="true">close</span>
</button>

<span class="mp-tag mp-tag--violet">
  <span class="mp-tag__label">Afiliado</span>
</span>`;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function toneMeta(tone) {
    return TONES.find((item) => item.key === tone) || TONES[2];
  }

  function stateFromPage(page) {
    return {
      kind: page.querySelector('[data-bdg-control="kind"]')?.value || 'badge',
      tone: page.querySelector('[data-bdg-control="tone"]')?.value || 'info',
      size: page.querySelector('[data-bdg-control="size"]')?.value || '',
      leading: page.querySelector('[data-bdg-control="leading"]')?.value || 'none',
      trailing: page.querySelector('[data-bdg-control="trailing"]')?.value || 'none',
      state: page.querySelector('[data-bdg-control="state"]')?.value || 'default',
      label: page.querySelector('[data-bdg-control="label"]')?.value || ''
    };
  }

  function classesFor(state) {
    const classes = [`mp-${state.kind}`, `mp-${state.kind}--${state.tone}`];
    if (state.size) classes.push(`mp-${state.kind}--${state.size}`);
    if (state.kind === 'chip' && state.state === 'hover') classes.push('mp-chip--is-hover');
    if (state.kind === 'chip' && state.state === 'focus') classes.push('mp-chip--is-focus');
    if (state.kind === 'chip' && state.state === 'selected') classes.push('is-selected');
    if (state.kind === 'chip' && state.state === 'disabled') classes.push('is-disabled');
    return classes;
  }

  function buildInner(state) {
    const tone = toneMeta(state.tone);
    const label = escapeHtml(state.label || KIND_LABELS[state.kind] || tone.label);
    const prefix = state.kind === 'badge' ? 'mp-badge' : state.kind === 'chip' ? 'mp-chip' : 'mp-tag';
    const parts = [];
    if (state.leading === 'dot') parts.push(`<span class="mp-badge-dot" aria-hidden="true"></span>`);
    if (state.leading === 'icon') parts.push(`<span class="material-symbols-rounded ${prefix}__icon" aria-hidden="true">${tone.icon}</span>`);
    parts.push(`<span class="${prefix}__label">${label}</span>`);
    if (state.trailing === 'close') parts.push(`<span class="material-symbols-rounded ${prefix}__icon" aria-hidden="true">close</span>`);
    if (state.trailing === 'chevron') parts.push(`<span class="material-symbols-rounded ${prefix}__icon" aria-hidden="true">expand_more</span>`);
    return parts.join('\n  ');
  }

  function buildCode(state) {
    const classes = classesFor(state).join(' ');
    const inner = buildInner(state);
    const label = escapeHtml(state.label || KIND_LABELS[state.kind] || toneMeta(state.tone).label);

    if (state.kind === 'chip') {
      const pressed = state.state === 'selected' ? 'true' : 'false';
      const disabled = state.state === 'disabled' ? ' disabled' : '';
      return `<button class="${classes}" type="button" aria-pressed="${pressed}"${disabled}>
  ${inner}
</button>`;
    }

    if (state.kind === 'badge') {
      return `<span class="${classes}" role="img" aria-label="Estado: ${label}">
  ${inner}
</span>`;
    }

    return `<span class="${classes}">
  ${inner}
</span>`;
  }

  function nodeFromHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  function renderPlayground(page) {
    if (!page) return;
    const state = stateFromPage(page);
    const kindCtrlState = state.kind;
    const code = buildCode(state);
    page.querySelector('#bdg-preview-area')?.replaceChildren(nodeFromHtml(code));
    const codeEl = page.querySelector('#bdg-playground-code');
    if (codeEl) codeEl.textContent = code;

    const stateCtrl = page.querySelector('[data-bdg-control="state"]');
    if (stateCtrl) stateCtrl.disabled = kindCtrlState !== 'chip';
  }

  function renderStaticCode(page) {
    const html = page.querySelector('#bdg-code-html');
    const css = page.querySelector('#bdg-code-css');
    const sass = page.querySelector('#bdg-code-sass');
    if (html) html.textContent = exportHtml;
    if (css) css.textContent = exportCss;
    if (sass) sass.textContent = exportScss;
  }

  function renderTokens(page) {
    const grid = page.querySelector('#bdg-token-grid');
    if (!grid || grid.dataset.rendered === 'true') return;
    grid.innerHTML = TONES.map((tone) => `
      <article class="bdg-token-card">
        <div class="bdg-token-card__demo">
          <span class="mp-badge mp-badge--${tone.key}">
            <span class="mp-badge__label">${tone.label}</span>
          </span>
          <button class="mp-chip mp-chip--${tone.key}" type="button">${tone.label}</button>
          <span class="mp-tag mp-tag--${tone.key}">${tone.name}</span>
        </div>
        <h3 class="mp-h3">${tone.name}</h3>
        <p class="mp-body-s">Clase: <code>--${tone.key}</code></p>
      </article>
    `).join('');
    grid.dataset.rendered = 'true';
  }

  function renderModeRows(page) {
    page.querySelectorAll('[data-bdg-mode-row]').forEach((row) => {
      if (row.dataset.rendered === 'true') return;
      row.innerHTML = `
        <span class="mp-badge mp-badge--info">Info</span>
        <span class="mp-badge mp-badge--success">Activo</span>
        <span class="mp-badge mp-badge--warning">Pendiente</span>
        <span class="mp-badge mp-badge--error">Error</span>
        <span class="mp-badge mp-badge--violet">Afiliado</span>
      `;
      row.dataset.rendered = 'true';
    });
  }

  function renderAnatomy(page, kind) {
    if (!page) return;
    const activeKind = kind || page.querySelector('[data-bdg-anatomy][aria-pressed="true"]')?.dataset.bdgAnatomy || 'badge';
    const spec = ANATOMY_SPECS[activeKind] || ANATOMY_SPECS.badge;
    const preview = page.querySelector('#bdg-anatomy-preview');
    const hitbox = page.querySelector('[data-bdg-hitbox]');
    const showMeasures = page.querySelector('[data-bdg-anatomy-toggle="measures"]')?.checked ?? true;
    const showHit = page.querySelector('[data-bdg-anatomy-toggle="hit"]')?.checked ?? true;
    const showIcon = page.querySelector('[data-bdg-anatomy-toggle="icon"]')?.checked ?? true;

    page.querySelectorAll('[data-bdg-anatomy]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.bdgAnatomy === activeKind));
    });
    page.querySelector('[data-bdg-measure="width"]').textContent = spec.width;
    page.querySelector('[data-bdg-measure="height"]').textContent = spec.height;
    page.querySelector('[data-bdg-measure="gap"]').textContent = spec.gap;
    page.querySelector('[data-bdg-callout="container"]').textContent = spec.container;
    page.querySelector('[data-bdg-callout="label"]').textContent = spec.label;
    page.querySelector('[data-bdg-callout="icon"]').textContent = spec.icon;
    page.querySelector('[data-bdg-callout="state"]').textContent = spec.state;
    page.querySelectorAll('.bdg-measure').forEach((item) => { item.hidden = !showMeasures; });
    if (hitbox) {
      hitbox.hidden = !showHit;
      hitbox.classList.toggle('bdg-hitbox--pill', activeKind === 'chip');
    }

    const state = {
      kind: activeKind,
      tone: activeKind === 'tag' ? 'violet' : activeKind === 'chip' ? 'info' : 'success',
      size: '',
      leading: showIcon ? (activeKind === 'badge' ? 'dot' : 'icon') : 'none',
      trailing: showIcon && activeKind === 'chip' ? 'close' : 'none',
      state: activeKind === 'chip' ? 'selected' : 'default',
      label: KIND_LABELS[activeKind]
    };
    preview?.replaceChildren(nodeFromHtml(buildCode(state)));
  }

  function switchCodeTab(page, tabId) {
    if (!page || !tabId) return;
    page.querySelectorAll('[data-bdg-code-tab]').forEach((btn) => {
      const active = btn.dataset.bdgCodeTab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#bdg-code-html, #bdg-code-css, #bdg-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `bdg-code-${tabId}`);
    });
  }

  function switchCodeTabFromButton(button) {
    switchCodeTab(findPage(button), button?.dataset.bdgCodeTab);
  }

  function copyText(text, btn) {
    const doWrite = () => navigator.clipboard
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('Clipboard unavailable'));
    doWrite().then(() => flashBtn(btn)).catch(() => {});
  }

  function flashBtn(btn) {
    if (!btn) return;
    const prev = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">check</span> Copiado';
    window.setTimeout(() => { btn.innerHTML = prev; }, 1400);
  }

  function downloadFile(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  function downloadableHtml() {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chips / Tags / Badges</title>
  <style>
${exportCss}
  </style>
</head>
<body>
  <main>
    <h1 class="mp-h1">Chips / Tags / Badges</h1>
    <p class="mp-body-l">Fragmentos productivos para usar en dummies o QA.</p>
${exportHtml.split('\n').map((line) => `    ${line}`).join('\n')}
  </main>
</body>
</html>`;
  }

  function findPage(target) {
    return target?.closest('[data-component-doc="badges"]') || document.querySelector('[data-component-doc="badges"]');
  }

  function downloadFromButton(button) {
    const type = button?.dataset.bdgDownload;
    if (type === 'html') downloadFile('mp-badges.html', downloadableHtml(), 'text/html');
    if (type === 'css') downloadFile('mp-badges.css', exportCss, 'text/css');
    if (type === 'sass') downloadFile('mp-badges.scss', exportScss, 'text/x-scss');
  }

  function bindBadgeDelegated() {
    if (document.documentElement.dataset.badgeDocsDelegated === 'true') return;
    document.documentElement.dataset.badgeDocsDelegated = 'true';

    document.addEventListener('click', (event) => {
      const codeTab = event.target.closest('[data-bdg-code-tab]');
      if (codeTab) return switchCodeTabFromButton(codeTab);

      const anatomy = event.target.closest('[data-bdg-anatomy]');
      if (anatomy) {
        renderAnatomy(findPage(anatomy), anatomy.dataset.bdgAnatomy);
        return;
      }

      const copyPlayground = event.target.closest('[data-bdg-copy-playground]');
      if (copyPlayground) {
        const page = findPage(copyPlayground);
        copyText(page.querySelector('#bdg-playground-code')?.textContent || '', copyPlayground);
        return;
      }

      const copyCode = event.target.closest('[data-bdg-copy-code]');
      if (copyCode) {
        const page = findPage(copyCode);
        copyText(page.querySelector('#bdg-code-html.active, #bdg-code-css.active, #bdg-code-sass.active')?.textContent || '', copyCode);
        return;
      }

      const download = event.target.closest('[data-bdg-download]');
      if (download) downloadFromButton(download);
    });

    document.addEventListener('change', (event) => {
      if (!event.target.matches('[data-bdg-control]')) return;
      const page = findPage(event.target);
      if (event.target.dataset.bdgControl === 'kind') {
        const label = page.querySelector('[data-bdg-control="label"]');
        if (label && !label.dataset.userEdited) label.value = KIND_LABELS[event.target.value] || '';
      }
      renderPlayground(page);
    });

    document.addEventListener('input', (event) => {
      if (!event.target.matches('[data-bdg-control="label"]')) return;
      event.target.dataset.userEdited = 'true';
      renderPlayground(findPage(event.target));
    });

    document.addEventListener('change', (event) => {
      if (!event.target.matches('[data-bdg-anatomy-toggle]')) return;
      renderAnatomy(findPage(event.target));
    });
  }

  function initBadgeDocs(root = document) {
    const page = root.querySelector('[data-component-doc="badges"]');
    if (!page || page.dataset.badgeInitialized === 'true') return;
    renderStaticCode(page);
    renderTokens(page);
    renderModeRows(page);
    renderAnatomy(page, 'badge');
    renderPlayground(page);
    switchCodeTab(page, 'html');
    page.dataset.badgeInitialized = 'true';
  }

  function syncTheme() {}

  return {
    initBadgeDocs,
    bindBadgeDelegated,
    syncTheme,
    switchCodeTabFromButton,
    downloadFromButton
  };
})();

window.badgeDocs = badgeDocs;

(function bootBadgeDocs() {
  badgeDocs.bindBadgeDelegated();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => badgeDocs.initBadgeDocs(document));
  } else {
    badgeDocs.initBadgeDocs(document);
  }
  if (typeof router !== 'undefined') {
    router.on('navigate', () => window.requestAnimationFrame(() => badgeDocs.initBadgeDocs(document)));
  }
})();

document.addEventListener('component-docs:init', () => {
  window.requestAnimationFrame(() => badgeDocs.initBadgeDocs(document));
});
