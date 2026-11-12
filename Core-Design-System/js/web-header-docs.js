const webHeaderDocs = (() => {
  const exportCss = mpDocsCss('web-header');

  const exportSass = mpDocsScss('web-header');

  function findPage(node) {
    return node?.closest?.('[data-component-doc="web-header"]') || document.querySelector('[data-component-doc="web-header"]');
  }

  function esc(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function stateFromPage(page) {
    return {
      variant: page.querySelector('[data-web-header-control="variant"]')?.value || 'public',
      cta: page.querySelector('[data-web-header-control="cta"]')?.value || 'Afíliate',
      search: page.querySelector('[data-web-header-control="search"]')?.checked !== false,
      dropdown: page.querySelector('[data-web-header-control="dropdown"]')?.checked || false,
      open: page.querySelector('[data-web-header-control="open"]')?.checked || false
    };
  }

  function brandMarkup() {
    return `<a class="mp-web-header__brand" href="#">
  <span class="mp-web-header__logo" aria-hidden="true">C</span>
  <span class="mp-web-header__brand-text">
    <span class="mp-web-header__brand-name">Compensar</span>
    <span class="mp-web-header__brand-service">Salud y bienestar</span>
  </span>
</a>`;
  }

  function searchMarkup() {
    return `<div class="mp-web-header__search">
  <label class="visually-hidden" for="mp-web-header-search">Buscar en Compensar</label>
  <input class="mp-web-header__search-input" id="mp-web-header-search" type="search" placeholder="Buscar trámites, servicios o sedes">
  <i class="icon icon-magnifying-glass mp-web-header__search-icon" aria-hidden="true"></i>
</div>`;
  }

  function dropdownMarkup(hidden = true) {
    return `<div class="mp-web-header__dropdown" ${hidden ? 'hidden' : ''}>
  <div>
    <h3 class="mp-web-header__dropdown-title">Servicios de salud</h3>
    <ul class="mp-web-header__dropdown-list">
      <li><a class="mp-web-header__dropdown-link mp-web-header__dropdown-link--is-hover" href="#">Medicina prepagada</a></li>
      <li><a class="mp-web-header__dropdown-link" href="#">Plan complementario</a></li>
      <li><a class="mp-web-header__dropdown-link" href="#">Directorio médico</a></li>
    </ul>
  </div>
  <div>
    <h3 class="mp-web-header__dropdown-title">Accesos rápidos</h3>
    <ul class="mp-web-header__dropdown-list">
      <li><a class="mp-web-header__dropdown-link" href="#">Pedir cita</a></li>
      <li><a class="mp-web-header__dropdown-link" href="#">Pagos y certificados</a></li>
      <li><a class="mp-web-header__dropdown-link" href="#">Oficinas y sedes</a></li>
    </ul>
  </div>
</div>`;
  }

  function publicHeader(config = {}) {
    const showSearch = config.search !== false;
    const showDropdown = config.dropdown || config.variant === 'dropdown';
    const open = config.open || config.variant === 'mobile';
    const cta = esc(config.cta || 'Afíliate');
    return `<header class="mp-web-header mp-web-header--public${open ? ' mp-web-header--is-open' : ''}" aria-label="Header principal">
  <div class="mp-web-header__utility">
    <a class="mp-web-header__utility-link" href="#">Personas</a>
    <a class="mp-web-header__utility-link" href="#">Empresas</a>
    <a class="mp-web-header__utility-link" href="#">Ayuda</a>
  </div>
  <div class="mp-web-header__main">
    ${brandMarkup()}
    ${showSearch ? searchMarkup() : '<span aria-hidden="true"></span>'}
    <a class="mp-web-header__cta" href="#">${cta}</a>
    <button class="mp-web-header__mobile-toggle" type="button" aria-label="Abrir menú" aria-expanded="${open ? 'true' : 'false'}"><i class="icon icon-hamburger icon-24" aria-hidden="true"></i></button>
  </div>
  <nav class="mp-web-header__nav" aria-label="Navegación principal">
    <div class="mp-web-header__nav-item">
      <a class="mp-web-header__nav-link mp-web-header__nav-link--active${config.state === 'hover' ? ' mp-web-header__nav-link--is-hover' : ''}" href="#" aria-current="page">Salud <i class="icon icon-caret-down icon-16" aria-hidden="true"></i></a>
      ${dropdownMarkup(!showDropdown)}
    </div>
    <div class="mp-web-header__nav-item"><a class="mp-web-header__nav-link${config.state === 'focus' ? ' mp-web-header__nav-link--is-focus' : ''}" href="#">Trámites</a></div>
    <div class="mp-web-header__nav-item"><a class="mp-web-header__nav-link" href="#">Sedes</a></div>
    <div class="mp-web-header__nav-item"><a class="mp-web-header__nav-link" href="#">Noticias</a></div>
  </nav>
  <nav class="mp-web-header__drawer" aria-label="Menú responsive">
    ${showSearch ? searchMarkup().replaceAll('mp-web-header-search', 'mp-web-header-search-mobile') : ''}
    <a class="mp-web-header__drawer-link" href="#">Salud <i class="icon icon-caret-right icon-16" aria-hidden="true"></i></a>
    <a class="mp-web-header__drawer-link" href="#">Trámites <i class="icon icon-caret-right icon-16" aria-hidden="true"></i></a>
    <a class="mp-web-header__drawer-link" href="#">Sedes <i class="icon icon-caret-right icon-16" aria-hidden="true"></i></a>
    <a class="mp-web-header__drawer-link" href="#">${cta}</a>
  </nav>
</header>`;
  }

  function ztHeader() {
    return `<section class="mp-web-header mp-web-header--zt" aria-label="Header zona transaccional">
  <div class="mp-web-header__main">
    <button class="mp-web-header__mobile-toggle" type="button" aria-label="Abrir navegación"><i class="icon icon-hamburger icon-24" aria-hidden="true"></i></button>
    ${brandMarkup()}
    ${searchMarkup()}
    <button class="mp-user-chip mp-user-chip--compact" type="button">
      <span class="mp-avatar mp-avatar--sm mp-avatar--brand" aria-hidden="true"><span class="mp-avatar__initials" aria-hidden="true">AS</span></span>
      <span class="mp-user-chip__body"><span class="mp-user-chip__name">Ana Soto</span><span class="visually-hidden">, abrir menú de usuario</span></span>
      <i class="icon icon-caret-down mp-user-chip__chevron" aria-hidden="true"></i>
    </button>
  </div>
  <aside class="mp-web-header__zt-menu" aria-label="Módulos">
    <ul class="mp-web-header__module-list">
      <li><a class="mp-web-header__module-link mp-web-header__module-link--active" href="#"><i class="icon icon-house icon-16" aria-hidden="true"></i> Inicio</a></li>
      <li><a class="mp-web-header__module-link" href="#"><i class="icon icon-calendar icon-16" aria-hidden="true"></i> Citas médicas</a></li>
      <li><a class="mp-web-header__module-link" href="#"><i class="icon icon-article icon-16" aria-hidden="true"></i> Certificados</a></li>
      <li><a class="mp-web-header__module-link" href="#"><i class="icon icon-credit-card icon-16" aria-hidden="true"></i> Pagos</a></li>
    </ul>
  </aside>
  <div class="mp-web-header__zt-content">
    <h3 class="mp-h3">Resumen de servicios</h3>
    <p class="mp-body-m">Contenido transaccional asociado al módulo seleccionado.</p>
  </div>
</section>`;
  }

  function build(config = {}) {
    if (config.variant === 'zt') return ztHeader();
    return publicHeader(config);
  }

  // Cada vista previa se pinta con build(), que usa ids fijos (mp-web-header-search...). Con varias vistas en la página los ids se
  // duplicaban y el <label for> apuntaba al campo equivocado. El HTML copiable (pestaña HTML) conserva los ids originales.
  let previewSeq = 0;
  function scopeIds(root) {
    if (!root) return;
    const n = ++previewSeq;
    if (root.dataset.whLabel || root.id || root.dataset.webHeaderVariantDemo || root.dataset.webHeaderStateDemo) {
      const tag = root.dataset.whLabel || root.dataset.webHeaderVariantDemo || root.dataset.webHeaderStateDemo || 'principal';
      root.querySelectorAll('header[aria-label], section[aria-label], nav[aria-label], aside[aria-label]').forEach((el) => {
        el.setAttribute('aria-label', `${el.getAttribute('aria-label')} (ejemplo ${tag}-${n})`);
      });
    }
    root.querySelectorAll('[id]').forEach((el) => {
      const old = el.id;
      const next = `${old}-${n}`;
      root.querySelectorAll(`[for="${old}"],[aria-controls="${old}"],[aria-labelledby="${old}"]`).forEach((ref) => {
        ['for', 'aria-controls', 'aria-labelledby'].forEach((attr) => { if (ref.getAttribute(attr) === old) ref.setAttribute(attr, next); });
      });
      el.id = next;
    });
  }

  function renderAnatomy(page, variant = 'public') {
    if (!page) return;
    page.querySelectorAll('[data-web-header-anatomy]').forEach((button) => {
      const active = button.dataset.webHeaderAnatomy === variant;
      button.setAttribute('aria-pressed', String(active));
    });
    const preview = page.querySelector('#web-header-anatomy-preview');
    if (preview) preview.innerHTML = build({
      variant,
      dropdown: variant === 'dropdown',
      open: variant === 'mobile',
      search: true,
      cta: variant === 'zt' ? 'Ir al inicio' : 'Afíliate'
    });
    scopeIds(preview);
  }

  function renderPlayground(page) {
    if (!page) return;
    const state = stateFromPage(page);
    const preview = page.querySelector('#web-header-playground-preview');
    if (preview) { preview.innerHTML = build(state); scopeIds(preview); }
    const code = page.querySelector('#web-header-playground-code');
    if (code) code.textContent = build(state);
    renderCode(page);
  }

  function renderVariants(page) {
    page.querySelectorAll('[data-web-header-variant-demo]').forEach((node) => {
      const variant = node.dataset.webHeaderVariantDemo;
      node.innerHTML = build({ variant, dropdown: variant === 'dropdown', open: variant === 'mobile', cta: variant === 'mobile' ? 'Afíliate' : 'Oficina virtual' });
      scopeIds(node);
    });
  }

  function renderStates(page) {
    page.querySelectorAll('[data-web-header-state-demo]').forEach((node) => {
      node.innerHTML = build({ variant: 'public', search: false, cta: 'Afíliate', state: node.dataset.webHeaderStateDemo });
      scopeIds(node);
    });
  }

  function activeCodeTab(page) {
    return page?.querySelector('[data-web-header-code-tab].active')?.dataset.webHeaderCodeTab || 'html';
  }

  function codeFor(tab, page) {
    if (tab === 'css') return exportCss;
    if (tab === 'sass') return exportSass;
    return build(stateFromPage(page));
  }

  function renderCode(page) {
    ['html', 'css', 'sass'].forEach((tab) => {
      const pre = page.querySelector(`#web-header-code-${tab}`);
      if (pre) pre.textContent = codeFor(tab, page);
    });
  }

  function switchCodeTab(page, tab = 'html') {
    if (!page) return;
    page.querySelectorAll('[data-web-header-code-tab]').forEach((button) => {
      const active = button.dataset.webHeaderCodeTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    page.querySelectorAll('#web-header-code-html, #web-header-code-css, #web-header-code-sass').forEach((pre) => {
      pre.classList.toggle('active', pre.id === `web-header-code-${tab}`);
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
    if (document.documentElement.dataset.webHeaderDocsDelegated === 'true') return;
    document.documentElement.dataset.webHeaderDocsDelegated = 'true';
    // Comportamiento del botón de menú descrito en esta página (aria-expanded, cerrar con Escape y devolver el foco).
    // Es solo de documentación: el Core entrega el marcado y los estilos; la lógica del drawer la implementa cada producto.
    const setDrawer = (header, open) => {
      const toggle = header.querySelector('.mp-web-header__mobile-toggle');
      header.classList.toggle('mp-web-header--is-open', open);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      }
      return toggle;
    };
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = event.target.closest?.('[data-component-doc="web-header"] .mp-web-header--is-open');
      if (open) setDrawer(open, false)?.focus();
    });
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-component-doc="web-header"] .mp-web-header__mobile-toggle');
      if (toggle) {
        const header = toggle.closest('.mp-web-header');
        return setDrawer(header, toggle.getAttribute('aria-expanded') !== 'true');
      }
      const anatomy = event.target.closest('[data-web-header-anatomy]');
      if (anatomy) return renderAnatomy(findPage(anatomy), anatomy.dataset.webHeaderAnatomy);
      const tab = event.target.closest('[data-web-header-code-tab]');
      if (tab) return switchCodeTab(findPage(tab), tab.dataset.webHeaderCodeTab);
      const copy = event.target.closest('[data-web-header-copy-code]');
      if (copy) return navigator.clipboard?.writeText(codeFor(activeCodeTab(findPage(copy)), findPage(copy)));
      const copyPlayground = event.target.closest('[data-web-header-copy-playground]');
      if (copyPlayground) return navigator.clipboard?.writeText(build(stateFromPage(findPage(copyPlayground))));
      const download = event.target.closest('[data-web-header-download]');
      if (download) {
        const page = findPage(download);
        const type = download.dataset.webHeaderDownload;
        if (type === 'html') downloadFile('mp-web-header.html', codeFor('html', page), 'text/html');
        if (type === 'css') downloadFile('mp-web-header.css', exportCss, 'text/css');
        if (type === 'sass') downloadFile('mp-web-header.scss', exportSass, 'text/x-scss');
      }
    });
    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-web-header-control]')) renderPlayground(findPage(event.target));
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-web-header-control]')) renderPlayground(findPage(event.target));
    });
  }

  function initWebHeaderDocs(root = document) {
    const page = root.querySelector('[data-component-doc="web-header"]');
    if (!page || page.dataset.webHeaderInitialized === 'true') return;
    bindDelegatedEvents();
    renderAnatomy(page, 'public');
    renderPlayground(page);
    renderVariants(page);
    renderStates(page);
    switchCodeTab(page, 'html');
    page.dataset.webHeaderInitialized = 'true';
  }

  return { initWebHeaderDocs, bindDelegatedEvents };
})();

window.webHeaderDocs = webHeaderDocs;

function bootWebHeaderDocs() {
  webHeaderDocs.bindDelegatedEvents();
  webHeaderDocs.initWebHeaderDocs(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWebHeaderDocs);
} else {
  bootWebHeaderDocs();
}
