const avatarDocs = (() => {
  const photoUrl = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80';

  const exportCss = mpDocsCss('avatar');

  const exportSass = mpDocsScss('avatar');

  function findPage(node) {
    return node?.closest?.('[data-component-doc="avatar"]') || document.querySelector('[data-component-doc="avatar"]');
  }

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function avatarMarkup(config = {}) {
    const size = config.size || 'md';
    const content = config.content || 'photo';
    const tone = content === 'initials' ? ' mp-avatar--teal' : '';
    const sizeClass = size !== 'md' ? ` mp-avatar--${size}` : '';
    if (content === 'photo') {
      return `<span class="mp-avatar${sizeClass}"><img class="mp-avatar__image" src="${photoUrl}" alt=""></span>`;
    }
    if (content === 'icon') {
      return `<span class="mp-avatar${sizeClass}"><i class="icon icon-user mp-avatar__icon" aria-hidden="true"></i></span>`;
    }
    return `<span class="mp-avatar${sizeClass}${tone}"><span class="mp-avatar__initials">AR</span></span>`;
  }

  function userChipMarkup(config = {}) {
    const state = config.state || 'default';
    const stateClass = state === 'hover' ? ' mp-user-chip--is-hover' : state === 'focus' ? ' mp-user-chip--is-focus' : '';
    const name = escapeHtml(config.name || 'Dra. Ana Ruiz');
    const meta = escapeHtml(config.meta || 'Medicina general');
    return `<button class="mp-user-chip${stateClass}" type="button" aria-label="Abrir menú de ${name}">
  ${avatarMarkup(config)}
  <span class="mp-user-chip__body">
    <span class="mp-user-chip__name">${name}</span>
    <span class="mp-user-chip__meta">${meta}</span>
  </span>
  <i class="icon icon-caret-down mp-user-chip__chevron" aria-hidden="true"></i>
</button>`;
  }

  function groupMarkup() {
    return `<div class="mp-avatar-group" aria-label="3 usuarios">
  <span class="mp-avatar"><img class="mp-avatar__image" src="${photoUrl}" alt=""></span>
  <span class="mp-avatar mp-avatar--violet"><span class="mp-avatar__initials">MR</span></span>
  <span class="mp-avatar mp-avatar--brand"><span class="mp-avatar__initials">+2</span></span>
</div>`;
  }

  function stateFromPage(page) {
    return {
      kind: page.querySelector('[data-avatar-control="kind"]')?.value || 'chip',
      content: page.querySelector('[data-avatar-control="content"]')?.value || 'photo',
      size: page.querySelector('[data-avatar-control="size"]')?.value || 'md',
      state: page.querySelector('[data-avatar-control="state"]')?.value || 'default',
      name: page.querySelector('[data-avatar-control="name"]')?.value || 'Dra. Ana Ruiz',
      meta: page.querySelector('[data-avatar-control="meta"]')?.value || 'Medicina general'
    };
  }

  function build(config = {}) {
    if (config.kind === 'avatar') return avatarMarkup(config);
    if (config.kind === 'group') return groupMarkup();
    return userChipMarkup(config);
  }

  function renderPlayground(page) {
    const preview = page.querySelector('#avatar-playground-preview');
    if (preview) preview.innerHTML = build(stateFromPage(page));
    renderCode(page);
  }

  function renderAnatomy(page, kind = 'chip') {
    page.querySelectorAll('[data-avatar-anatomy]').forEach((button) => {
      const active = button.dataset.avatarAnatomy === kind;
      button.setAttribute('aria-pressed', String(active));
    });
    const preview = page.querySelector('#avatar-anatomy-preview');
    if (preview) preview.innerHTML = build({ kind, content: kind === 'group' ? 'initials' : 'photo' });
  }

  function renderStates(page) {
    page.querySelectorAll('[data-avatar-state-demo]').forEach((node) => {
      node.innerHTML = userChipMarkup({ state: node.dataset.avatarStateDemo, content: 'initials', name: 'Ana Ruiz', meta: 'Afiliada' });
    });
  }

  function activeCodeTab(page) {
    return page.querySelector('[data-avatar-code-tab].active')?.dataset.avatarCodeTab || 'html';
  }

  function codeFor(tab, page) {
    if (tab === 'css') return exportCss;
    if (tab === 'sass') return exportSass;
    return build(stateFromPage(page));
  }

  function renderCode(page) {
    ['html', 'css', 'sass'].forEach((tab) => {
      const pre = page.querySelector(`#avatar-code-${tab}`);
      if (pre) pre.textContent = codeFor(tab, page);
    });
  }

  function switchCodeTab(page, tab = 'html') {
    page.querySelectorAll('[data-avatar-code-tab]').forEach((button) => {
      const active = button.dataset.avatarCodeTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#avatar-code-html, #avatar-code-css, #avatar-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `avatar-code-${tab}`);
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

  function bindDelegatedEvents() {
    if (document.documentElement.dataset.avatarDocsDelegated === 'true') return;
    document.documentElement.dataset.avatarDocsDelegated = 'true';
    document.addEventListener('click', (event) => {
      const anatomy = event.target.closest('[data-avatar-anatomy]');
      if (anatomy) return renderAnatomy(findPage(anatomy), anatomy.dataset.avatarAnatomy);
      const tab = event.target.closest('[data-avatar-code-tab]');
      if (tab) return switchCodeTab(findPage(tab), tab.dataset.avatarCodeTab);
      const copy = event.target.closest('[data-avatar-copy-code]');
      if (copy) navigator.clipboard?.writeText(codeFor(activeCodeTab(findPage(copy)), findPage(copy)));
      const download = event.target.closest('[data-avatar-download]');
      if (download) {
        const page = findPage(download);
        const type = download.dataset.avatarDownload;
        if (type === 'html') downloadFile('mp-avatar.html', codeFor('html', page), 'text/html');
        if (type === 'css') downloadFile('mp-avatar.css', exportCss, 'text/css');
        if (type === 'sass') downloadFile('mp-avatar.scss', exportSass, 'text/x-scss');
      }
    });
    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-avatar-control]')) renderPlayground(findPage(event.target));
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-avatar-control]')) renderPlayground(findPage(event.target));
    });
  }

  function initAvatarDocs(root = document) {
    const page = root.querySelector('[data-component-doc="avatar"]');
    if (!page || page.dataset.avatarInitialized === 'true') return;
    bindDelegatedEvents();
    renderAnatomy(page, 'chip');
    renderPlayground(page);
    renderStates(page);
    switchCodeTab(page, 'html');
    page.dataset.avatarInitialized = 'true';
  }

  return { initAvatarDocs, bindDelegatedEvents };
})();

window.avatarDocs = avatarDocs;
