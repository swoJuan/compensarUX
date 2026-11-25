// ============================================================
//  tabs-v2-docs.js
//  Playground y copia de código para Tabs v2 (mp-tab-xl / mp-tab-card).
//  La activación y el teclado los gestiona js/mp-tabs.js; este archivo solo arma la muestra.
//  Expone: window.tabsV2Docs · { initTabsV2Doc }
// ============================================================
const tabsV2Docs = (() => {
  const ITEMS = [
    { title: 'Paga tu plan',  desc: 'Cuota mensual y saldo',   icon: 'folder' },
    { title: 'Mis servicios', desc: 'Citas y autorizaciones',  icon: 'favorite' },
    { title: 'Documentos',    desc: 'Certificados y facturas', icon: 'description' },
    { title: 'Historial',     desc: 'Movimientos anteriores',  icon: 'history' },
    { title: 'Contacto',      desc: 'Canales de atención',     icon: 'call' }
  ];
  function findPage(target) {
    return target?.closest('[data-component-doc="tabs-v2"]') || document.querySelector('[data-component-doc="tabs-v2"]');
  }
  function stateFromPage(page) {
    const v = (name, def) => page.querySelector(`[data-tabsv2-control="${name}"]`)?.value || def;
    return { format: v('format', 'xl'), color: v('color', 'orange'), count: parseInt(v('count', '3'), 10), disabled: v('disabled', 'none') };
  }
  function tabClass(state) {
    const base = state.format === 'card' ? 'mp-tab-card' : 'mp-tab-xl';
    return state.color === 'violet' ? `${base} ${base}--violet` : base;
  }
  function buildPreview(page, state, active) {
    const stage = page.querySelector('#tabsv2-preview-area');
    const panel = page.querySelector('#tabsv2-preview-panel');
    if (!stage || !panel) return;
    const strip = document.createElement('div');
    strip.className = 'mp-tabs mp-tabs--v2';
    strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', 'Playground Tabs v2');
    strip.setAttribute('data-mp-tabs-responsive', 'off'); // el playground muestra la tira a cualquier ancho
    for (let i = 0; i < state.count; i++) {
      const item = ITEMS[i];
      const on = i === active;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = tabClass(state) + (on ? ' is-active' : '');
      btn.id = `tabsv2-pg-${i}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(on));
      btn.setAttribute('aria-controls', 'tabsv2-preview-panel');
      btn.setAttribute('data-tabsv2-index', String(i));
      btn.setAttribute('tabindex', on ? '0' : '-1');
      if (state.disabled === 'last' && i === state.count - 1) { btn.disabled = true; btn.removeAttribute('tabindex'); }
      const icon = document.createElement('span');
      icon.className = `material-symbols-rounded ${state.format === 'card' ? 'mp-tab-card__icon' : 'mp-tab-xl__icon'}`;
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;
      if (state.format === 'card') {
        const badge = document.createElement('span');
        badge.className = 'mp-tab-card__badge';
        badge.appendChild(icon);
        const title = document.createElement('span');
        title.className = 'mp-tab-card__title';
        title.textContent = item.title;
        const desc = document.createElement('span');
        desc.className = 'mp-tab-card__desc';
        desc.textContent = item.desc;
        btn.append(badge, title, desc);
      } else {
        const label = document.createElement('span');
        label.className = 'mp-tab-xl__label';
        label.textContent = item.title;
        btn.append(icon, label);
      }
      strip.appendChild(btn);
    }
    stage.replaceChildren(strip);
    panel.textContent = `Contenido de ${ITEMS[active].title}.`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tabsv2-pg-${active}`);
  }
  function buildCode(state) {
    const cls = tabClass(state);
    const lines = ['<div class="mp-tabs mp-tabs--v2" role="tablist" aria-label="…">'];
    for (let i = 0; i < state.count; i++) {
      const item = ITEMS[i];
      const first = i === 0;
      const attrs = [
        `class="${cls}${first ? ' is-active' : ''}"`, 'role="tab"', `id="tab-${i}"`,
        `aria-selected="${first}"`, `aria-controls="panel-${i}"`,
        ...(first ? [] : ['tabindex="-1"']),
        ...(state.disabled === 'last' && i === state.count - 1 ? ['disabled'] : [])
      ].join(' ');
      lines.push(`  <button type="button" ${attrs}>`);
      if (state.format === 'card') {
        lines.push('    <span class="mp-tab-card__badge">');
        lines.push(`      <span class="material-symbols-rounded mp-tab-card__icon" aria-hidden="true">${item.icon}</span>`);
        lines.push('    </span>');
        lines.push(`    <span class="mp-tab-card__title">${item.title}</span>`);
        lines.push(`    <span class="mp-tab-card__desc">${item.desc}</span>`);
      } else {
        lines.push(`    <span class="material-symbols-rounded mp-tab-xl__icon" aria-hidden="true">${item.icon}</span>`);
        lines.push(`    <span class="mp-tab-xl__label">${item.title}</span>`);
      }
      lines.push('  </button>');
    }
    lines.push('</div>');
    for (let i = 0; i < state.count; i++) {
      lines.push(`<div class="mp-tab-panel" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}"${i === 0 ? '' : ' hidden'}>Contenido de ${ITEMS[i].title}...</div>`);
    }
    return lines.join('\n');
  }
  function renderPlayground(page, active) {
    if (!page) return;
    const state = stateFromPage(page);
    const max = state.disabled === 'last' ? state.count - 2 : state.count - 1;
    const idx = Math.min(active ?? 0, Math.max(0, max));
    buildPreview(page, state, idx);
    const code = page.querySelector('#tabsv2-playground-code');
    if (code) code.textContent = buildCode(state);
    page.dataset.tabsv2Active = String(idx);
  }
  function switchCode(page, id) {
    page.querySelectorAll('[data-tabsv2-code-tab]').forEach((b) => {
      const on = b.dataset.tabsv2CodeTab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    page.querySelectorAll('[id^="tabsv2-code-"]').forEach((pre) => pre.classList.toggle('active', pre.id === `tabsv2-code-${id}`));
  }
  function copyText(text, btn) {
    const write = () => {
      if (navigator.clipboard) return navigator.clipboard.writeText(text);
      const ta = document.createElement('textarea');
      ta.value = text;
      Object.assign(ta.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return Promise.resolve();
    };
    write().then(() => {
      const prev = btn.innerHTML;
      btn.textContent = 'Copiado';
      window.setTimeout(() => { btn.innerHTML = prev; }, 1400);
    }).catch(() => {});
  }
  /* Selector de formato de la página única de Tabs: Texto (mp-tab) · Pill XL · Tarjeta con ícono (v2). */
  function setFormat(root, format) {
    const text = root.querySelector('[data-tabs-format-panel="text"]');
    const v2 = root.querySelector('[data-tabs-format-panel="v2"]');
    if (!text || !v2) return;
    const isV2 = format === 'xl' || format === 'card';
    text.hidden = isV2;
    v2.hidden = !isV2;
    root.querySelectorAll('[data-tabs-format]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tabsFormat === format)));
    if (!isV2) return;
    v2.querySelectorAll('[data-tabsv2-only]').forEach((el) => { el.hidden = el.dataset.tabsv2Only !== format; });
    const sel = v2.querySelector('[data-tabsv2-control="format"]');
    if (sel) sel.value = format;
    renderPlayground(v2, parseInt(v2.dataset.tabsv2Active || '0', 10));
    if (window.mpTabs) window.mpTabs.normalizeAll();
  }
  /* Anatomía interactiva: estado y color de la muestra, etiquetas y medidas. */
  function renderAnatomy(page, patch) {
    if (!page) return;
    const st = Object.assign({ state: page.dataset.tabsv2AnState || 'default', color: page.dataset.tabsv2AnColor || 'orange' }, patch || {});
    page.dataset.tabsv2AnState = st.state;
    page.dataset.tabsv2AnColor = st.color;
    page.querySelectorAll('[data-tabsv2-anatomy-state]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tabsv2AnatomyState === st.state)));
    page.querySelectorAll('[data-tabsv2-anatomy-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tabsv2AnatomyColor === st.color)));
    page.querySelectorAll('#tabsv2-anatomy-xl > button, #tabsv2-anatomy-card > button').forEach((btn) => {
      const base = btn.classList.contains('mp-tab-card') ? 'mp-tab-card' : 'mp-tab-xl';
      btn.classList.remove('is-active', 'is-hover', 'is-focus', `${base}--violet`);
      btn.disabled = st.state === 'disabled';
      if (st.state === 'active' || st.state === 'hover' || st.state === 'focus') btn.classList.add(`is-${st.state}`);
      if (st.color === 'violet') btn.classList.add(`${base}--violet`);
    });
    const labels = page.querySelector('[data-tabsv2-anatomy-toggle="labels"]')?.checked ?? true;
    const measures = page.querySelector('[data-tabsv2-anatomy-toggle="measures"]')?.checked ?? true;
    page.querySelectorAll('.tabv2-callout').forEach((el) => { el.hidden = !labels; });
    page.querySelectorAll('.tabv2-measure').forEach((el) => { el.hidden = !measures; });
  }
  function bindDelegated() {
    if (document.documentElement.dataset.tabsv2Delegated === 'true') return;
    document.documentElement.dataset.tabsv2Delegated = 'true';
    document.addEventListener('click', (e) => {
      const fmt = e.target.closest('[data-tabs-format]');
      if (fmt) { setFormat(fmt.closest('[data-component-doc="tabs"]') || document, fmt.dataset.tabsFormat); return; }
      const anS = e.target.closest('[data-tabsv2-anatomy-state]');
      if (anS) { renderAnatomy(findPage(anS), { state: anS.dataset.tabsv2AnatomyState }); return; }
      const anC = e.target.closest('[data-tabsv2-anatomy-color]');
      if (anC) { renderAnatomy(findPage(anC), { color: anC.dataset.tabsv2AnatomyColor }); return; }
      const pg = e.target.closest('[data-tabsv2-index]');
      if (pg) { renderPlayground(findPage(pg), parseInt(pg.dataset.tabsv2Index || '0', 10)); const again = document.getElementById(pg.id); if (again) again.focus(); return; }
      const code = e.target.closest('[data-tabsv2-code-tab]');
      if (code) { switchCode(findPage(code), code.dataset.tabsv2CodeTab); return; }
      const copyPg = e.target.closest('[data-tabsv2-copy-playground]');
      if (copyPg) { copyText(findPage(copyPg)?.querySelector('#tabsv2-playground-code')?.textContent || '', copyPg); return; }
      const copyCode = e.target.closest('[data-tabsv2-copy-code]');
      if (copyCode) { copyText(findPage(copyCode)?.querySelector('[id^="tabsv2-code-"].active')?.textContent || '', copyCode); }
    });
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-tabsv2-anatomy-toggle]')) { renderAnatomy(findPage(e.target)); return; }
      if (!e.target.matches('[data-tabsv2-control]')) return;
      const page = findPage(e.target);
      renderPlayground(page, parseInt(page?.dataset?.tabsv2Active || '0', 10));
    });
  }
  function initTabsV2Doc(root = document) {
    const page = root.querySelector('[data-component-doc="tabs-v2"]');
    if (!page || page.dataset.tabsv2Initialized === 'true') return;
    renderPlayground(page, 0);
    renderAnatomy(page);
    switchCode(page, 'xl');
    if (window.mpTabs) window.mpTabs.normalizeAll();
    page.dataset.tabsv2Initialized = 'true';
  }
  return { initTabsV2Doc, bindDelegated };
})();
window.tabsV2Docs = tabsV2Docs;
(function bootTabsV2Docs() {
  tabsV2Docs.bindDelegated();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => tabsV2Docs.initTabsV2Doc(document));
  else tabsV2Docs.initTabsV2Doc(document);
  if (typeof router !== 'undefined') router.on('navigate', () => window.requestAnimationFrame(() => tabsV2Docs.initTabsV2Doc(document)));
})();
document.addEventListener('component-docs:init', () => window.requestAnimationFrame(() => tabsV2Docs.initTabsV2Doc(document)));
