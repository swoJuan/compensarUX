// Arnés de consumidor: SOLO css/core.css (sin tokens inyectados por el portal). Mide contraste de texto de los componentes afectados por DS-02.
// Uso: node comp.js --css=/ruta/core.css --out=/tmp/dec008/comp-X.json
const { chromium } = require('playwright'); const fs = require('fs');
const axeSrc = fs.readFileSync('/tmp/dec008/node_modules/axe-core/axe.min.js', 'utf8');
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || d;
const CSS = fs.readFileSync(arg('css', '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css'), 'utf8'), OUT = arg('out', '');
const badges = ['green', 'orange', 'violet', 'warning', 'success', 'error', 'info', 'blue', 'neutral'].map(c => `<span class="mp-badge mp-badge--${c}">${c}</span>`).join(' ');
const alerts = ['info', 'success', 'warning', 'error'].map(c => `<div class="mp-alert mp-alert--${c}" role="status"><div class="mp-alert__content"><p class="mp-alert__title">Título ${c}</p><p class="mp-alert__text">Texto del mensaje de alerta.</p></div></div>`).join('');
const toasts = ['info', 'success', 'warning', 'error'].map(c => `<div class="mp-toast mp-toast--${c}" role="status"><div class="mp-toast__content"><p class="mp-toast__title">Toast ${c}</p><p class="mp-toast__message">Mensaje.</p></div></div>`).join('');
const tabs = `<div class="mp-tabs" role="tablist" aria-label="t"><button class="mp-tab is-active" role="tab" aria-selected="true">Activa</button><button class="mp-tab" role="tab" aria-selected="false" tabindex="-1">Otra</button></div>`;
const chips = ['', ' is-selected'].map(s => `<button class="mp-chip${s}" type="button">Chip${s}</button>`).join(' ');
const avatars = ['brand', 'teal', 'violet', 'green', 'orange'].map(c => `<span class="mp-avatar mp-avatar--${c}"><span class="mp-avatar__initials">AS</span></span>`).join(' ');
const userchip = `<button class="mp-user-chip" type="button"><span class="mp-avatar mp-avatar--brand"><span class="mp-avatar__initials">AS</span></span><span class="mp-user-chip__body"><span class="mp-user-chip__name">Ana Soto</span><span class="mp-user-chip__meta">Afiliada</span></span></button> <button class="mp-user-chip mp-user-chip--is-hover" type="button"><span class="mp-user-chip__body"><span class="mp-user-chip__name">Hover</span></span></button>`;
const checks = `<label class="mp-choice mp-checkbox"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" type="checkbox" checked><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__label">Marcado</span></label> <label class="mp-switch"><span class="mp-switch__field"><input class="form-check-input mp-switch__input" type="checkbox" role="switch" checked><span class="mp-switch__track" aria-hidden="true"></span></span><span class="mp-switch__label">Switch</span></label>`;
const helpers = `<div class="mp-input-group"><label class="mp-input-label" for="x">Campo</label><input id="x" class="mp-input-field" value="v"><p class="mp-input-helper">Texto de apoyo</p></div>`;
const html = t => `<!doctype html><html lang="es" data-theme="${t}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/core.css"></head><body style="margin:0;padding:16px;background:var(--use-background-page);color:var(--use-text-primary)"><main>
<section id="badges">${badges}</section><section id="chips">${chips}</section><section id="alerts">${alerts}</section><section id="toasts">${toasts}</section>
<section id="tabs">${tabs}</section><section id="avatars">${avatars}</section><section id="userchip">${userchip}</section><section id="checks">${checks}</section><section id="helpers">${helpers}</section></main></body></html>`;
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); const R = {};
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const p = await b.newPage({ viewport: { width: 1000, height: 1400 } });
    await p.route('**/__c.html', r => r.fulfill({ contentType: 'text/html', body: html(theme) }));
    await p.route(/\/css\/core\.css/, r => r.fulfill({ contentType: 'text/css', body: CSS }));
    await p.goto('http://localhost:8000/__c.html'); await p.waitForTimeout(250); await p.addScriptTag({ content: axeSrc });
    R[theme] = await p.evaluate(async () => { const a = await axe.run(document, { runOnly: ['color-contrast'] }); return a.violations.flatMap(v => v.nodes.map(n => { const d = (n.any[0] || {}).data || {}; return { sec: (n.target[0] || '').split(' ')[0].replace('#', ''), t: n.target.join(' ').slice(0, 70), ratio: d.contrastRatio, fg: d.fgColor, bg: d.bgColor }; })); });
    await p.screenshot({ path: `/tmp/dec008/comp-${theme}-${arg('tag', 'x')}.png` }); await p.close();
  }
  await b.close(); if (OUT) fs.writeFileSync(OUT, JSON.stringify(R));
  for (const th of Object.keys(R)) { const by = {}; R[th].forEach(x => by[x.sec] = (by[x.sec] || 0) + 1); console.log(th.padEnd(14), `${R[th].length} nodos`, JSON.stringify(by)); }
})();
