const sidebarDocs = (() => {

  /* ── Export strings ───────────────────────────────────── */
  const exportCss = mpDocsCss('sidebar');

  const exportSass = mpDocsScss('sidebar');

  /* ── Builder ──────────────────────────────────────────── */
  function buildSidebarHtml(config = {}) {
    const variant = config.variant || 'detail';        // 'detail' | 'confirm'
    const hasImage = config.hasImage !== false;

    if (variant === 'confirm') {
      return `<div class="mp-sidebar is-open" role="dialog" aria-modal="true" aria-label="Confirmar cita">
  <div class="mp-sidebar__backdrop"></div>
  <div class="mp-sidebar__panel">
    <div class="mp-sidebar__header">
      <span class="mp-sidebar__title">Confirma tu cita</span>
      <button class="mp-sidebar__close" type="button" aria-label="Cerrar panel">
        <i class="icon icon-x icon-20" aria-hidden="true"></i>
      </button>
    </div>
    <div class="mp-sidebar__body">
      <p class="mp-body-m" style="color:var(--use-text-secondary)">Revisa que la información sea correcta y si estás de acuerdo, presiona confirmar.</p>
      <div class="mp-sidebar__section">
        <p class="mp-sidebar__section-title">Doctor</p>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-user icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-value" style="font-weight:700">Dra. Mariana Zapata</p>
            <p class="mp-sidebar__row-value" style="font-size:14px;color:var(--use-text-secondary)">Medicina General</p>
          </div>
        </div>
      </div>
      <div class="mp-sidebar__section">
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-calendar icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-label">Fecha y hora</p>
            <p class="mp-sidebar__row-value">Jueves, 01 de Enero 2026 — 8:00 am</p>
          </div>
        </div>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-map-pin icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-label">Ubicación</p>
            <p class="mp-sidebar__row-value">San Roque — Cajicá</p>
          </div>
        </div>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-tag icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-label">Modalidad</p>
            <p class="mp-sidebar__row-value">Cita presencial</p>
          </div>
        </div>
      </div>
    </div>
    <div class="mp-sidebar__footer mp-sidebar__footer--space-between">
      <button class="mp-btn mp-btn--secundario" type="button">Regresar</button>
      <button class="mp-btn mp-btn--primario" type="button">Confirmar</button>
    </div>
  </div>
</div>`;
    }

    // default: detail variant (centros médicos)
    const imageHtml = hasImage ? `    <div class="mp-sidebar__image">
      <button class="mp-sidebar__image-nav mp-sidebar__image-nav--prev" type="button" aria-label="Anterior"><i class="icon icon-caret-left icon-20"></i></button>
      <button class="mp-sidebar__image-nav mp-sidebar__image-nav--next" type="button" aria-label="Siguiente"><i class="icon icon-caret-right icon-20"></i></button>
      <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&q=80" alt="Centro médico Calle 94">
    </div>
` : '';

    return `<div class="mp-sidebar is-open" role="dialog" aria-modal="true" aria-label="Detalle del centro médico">
  <div class="mp-sidebar__backdrop"></div>
  <div class="mp-sidebar__panel">
    <div class="mp-sidebar__header">
      <span class="mp-sidebar__title">Calle 94</span>
      <button class="mp-sidebar__close" type="button" aria-label="Cerrar panel">
        <i class="icon icon-x icon-20" aria-hidden="true"></i>
      </button>
    </div>
${imageHtml}    <div class="mp-sidebar__body">
      <div class="mp-sidebar__section">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="mp-badge mp-badge--success">Abierto</span>
          <span class="mp-badge mp-badge--info">24 horas</span>
        </div>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-clock icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-value">Cierra a las 7:00 pm</p>
          </div>
        </div>
      </div>
      <div class="mp-sidebar__section">
        <p class="mp-sidebar__section-title">Ubicación y contacto</p>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-map-pin icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-value">Transversal Pereira # 23-45, Piso 2</p>
          </div>
        </div>
        <div class="mp-sidebar__row">
          <div class="mp-sidebar__row-icon"><i class="icon icon-phone icon-16" aria-hidden="true"></i></div>
          <div class="mp-sidebar__row-content">
            <p class="mp-sidebar__row-value">321 123 4578</p>
          </div>
        </div>
      </div>
      <div class="mp-sidebar__section">
        <p class="mp-sidebar__section-title">Horarios de atención</p>
        <div class="mp-sidebar__schedule">
          <div class="mp-sidebar__schedule-row"><span>Lunes a Viernes</span><span>6:00 am – 10:30 pm</span></div>
          <div class="mp-sidebar__schedule-row"><span>Sábados</span><span>6:00 am – 10:30 am</span></div>
          <div class="mp-sidebar__schedule-row mp-sidebar__schedule-row--closed"><span>Domingos y Festivos</span><span>No hay atención</span></div>
        </div>
      </div>
    </div>
    <div class="mp-sidebar__footer">
      <button class="mp-btn mp-btn--primario" type="button">Agendar cita</button>
    </div>
  </div>
</div>`;
  }

  /* ── Code tabs ────────────────────────────────────────── */
  function setCodeTab(page, tab) {
    const html  = buildSidebarHtml({ variant: 'detail', hasImage: false });
    const slots = { html, css: exportCss, sass: exportSass };
    page.querySelectorAll('[data-sidebar-code-tab]').forEach(btn => {
      const active = btn.dataset.sidebarCodeTab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    Object.keys(slots).forEach(key => {
      const pre = page.querySelector(`#sidebar-code-${key}`);
      if (!pre) return;
      pre.classList.toggle('active', key === tab);
      pre.textContent = slots[key];
    });
  }

  function copyText(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  /* ── Anatomy ──────────────────────────────────────────── */
  function renderAnatomy(page, state) {
    const preview = page.querySelector('#sidebar-anatomy-preview');
    if (!preview) return;
    const cfg = {
      detail:  { variant: 'detail',  hasImage: false },
      image:   { variant: 'detail',  hasImage: true  },
      confirm: { variant: 'confirm', hasImage: false  }
    }[state] || { variant: 'detail', hasImage: false };
    preview.innerHTML = buildSidebarHtml(cfg);
  }

  /* ── Init ─────────────────────────────────────────────── */
  function initSidebarDocs(scope = document) {
    const page = scope.querySelector('[data-component-doc="sidebar"]');
    if (!page) return;

    /* anatomy segmented control */
    page.querySelectorAll('[data-sidebar-anatomy]').forEach(btn => {
      btn.addEventListener('click', () => {
        page.querySelectorAll('[data-sidebar-anatomy]').forEach(b => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        renderAnatomy(page, btn.dataset.sidebarAnatomy);
      });
    });

    /* label toggle */
    page.querySelectorAll('[data-sidebar-toggle]').forEach(toggle => {
      toggle.addEventListener('change', () => {
        page.classList.toggle('sidebar-doc--hide-' + toggle.dataset.sidebarToggle, !toggle.checked);
      });
    });

    /* demo trigger — buscar paneles en scope (document) porque están fuera del <article> */
    page.querySelectorAll('[data-sidebar-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = scope.querySelector('#' + btn.dataset.sidebarOpen);
        if (target) {
          target.classList.add('is-open');
          target.querySelector('.mp-sidebar__close')?.focus();
        }
      });
    });
    scope.querySelectorAll('.mp-sidebar__close, .mp-sidebar__backdrop').forEach(el => {
      el.addEventListener('click', () => el.closest('.mp-sidebar')?.classList.remove('is-open'));
    });
    scope.querySelectorAll('.mp-sidebar').forEach(sb => {
      sb.addEventListener('keydown', e => {
        if (e.key === 'Escape') sb.classList.remove('is-open');
      });
    });

    /* code tabs */
    page.querySelectorAll('[data-sidebar-code-tab]').forEach(btn => {
      btn.addEventListener('click', () => setCodeTab(page, btn.dataset.sidebarCodeTab));
    });
    page.querySelector('[data-sidebar-copy-code]')?.addEventListener('click', () => {
      const active = page.querySelector('.code-tab.active')?.dataset.sidebarCodeTab || 'html';
      copyText(page.querySelector(`#sidebar-code-${active}`)?.textContent || '');
    });
    page.querySelectorAll('[data-sidebar-download]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.sidebarDownload;
        if (t === 'html') downloadFile('mp-sidebar.html', buildSidebarHtml({ variant: 'detail', hasImage: false }), 'text/html');
        if (t === 'css')  downloadFile('mp-sidebar.css',  exportCss, 'text/css');
        if (t === 'sass') downloadFile('mp-sidebar.scss', exportSass, 'text/x-scss');
      });
    });

    /* initial state */
    renderAnatomy(page, 'detail');
    setCodeTab(page, 'html');
  }

  return { initSidebarDocs, buildSidebarHtml };
})();

window.sidebarDocs = sidebarDocs;
