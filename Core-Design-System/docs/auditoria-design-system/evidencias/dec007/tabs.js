// DEC-007 · Tabs reutilizable (mp-tabs.js) en harness AISLADO (core.css + módulo). Uso: node tabs.js [--text=100|200] [--w=1280]
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const BASE = 'http://localhost:8000';
const arg = (k, d) => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1]) || d;
const PCT = +arg('text', 100), W = +arg('w', 1280);
const strip = (id, orient, disabledIdx) => `<div class="mp-tabs" role="tablist" aria-label="Lista ${id}"${orient ? ` aria-orientation="${orient}"` : ''} id="${id}">
 ${['Servicios', 'Beneficios', 'Historial', 'Ayuda'].map((l, i) => `<button class="mp-tab${i === 0 ? ' is-active' : ''}" role="tab" id="${id}-t${i}" aria-selected="${i === 0}" aria-controls="${id}-p${i}"${i === disabledIdx ? ' disabled' : ''}>${l}</button>`).join('')}</div>
 ${[0, 1, 2, 3].map(i => `<div role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? ' hidden' : ''}>Contenido ${id} ${i}</div>`).join('')}`;
const html = theme => `<!doctype html><html lang="es" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/core.css">
<style>#before,#after{color:var(--use-text-primary);background:var(--use-surface-white)}</style></head><body style="margin:0;padding:16px;background:var(--use-background-page);color:var(--use-text-primary)"><main>
<button id="before" type="button">antes</button>
${strip('a')}
${strip('b', null, 2)}
${strip('v', 'vertical')}
<button id="after" type="button">después</button></main></body></html>`;

async function ctxFor(px) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwprof-')); fs.mkdirSync(dir + '/Default');
  fs.writeFileSync(dir + '/Default/Preferences', JSON.stringify({ webkit: { webprefs: { default_font_size: px } } }));
  return chromium.launchPersistentContext(dir, { channel: 'chromium', headless: true });
}
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };

(async () => {
  const ctx = await ctxFor(Math.round(16 * PCT / 100));
  for (const theme of ['light', 'dark', 'high-contrast']) {
    const T = `[${theme}${PCT !== 100 ? ' ' + PCT + '%' : ''}${W !== 1280 ? ' ' + W + 'px' : ''}] `;
    const p = await ctx.newPage(); await p.setViewportSize({ width: W, height: 900 });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route('**/__t.html', r => r.fulfill({ contentType: 'text/html', body: html(theme) }));
    await p.goto(BASE + '/__t.html'); await p.addScriptTag({ url: BASE + '/js/mp-tabs.js' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    const st = id => p.evaluate(id => {
      const tabs = [...document.querySelectorAll('#' + id + ' [role=tab]')];
      return { sel: tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'), tabbable: tabs.map(t => t.tabIndex).join(), cls: tabs.findIndex(t => t.classList.contains('is-active')),
        shown: [0, 1, 2, 3].filter(i => !document.getElementById(id + '-p' + i).hidden).join(), focus: tabs.findIndex(t => t === document.activeElement), focusOutside: document.activeElement.id || document.activeElement.tagName };
    }, id);

    let s = await st('a'); ok(s.tabbable === '0,-1,-1,-1', T + 'tabindex móvil inicial (' + s.tabbable + ')');
    // Entrada con Tab: solo la pestaña seleccionada es tabulable
    await p.focus('#before'); await p.keyboard.press('Tab'); s = await st('a'); ok(s.focus === 0, T + 'Tab entra en la lista por la pestaña seleccionada');
    await p.keyboard.press('ArrowRight'); s = await st('a'); ok(s.focus === 1 && s.sel === 1 && s.cls === 1 && s.shown === '1' && s.tabbable === '-1,0,-1,-1', T + 'ArrowRight: foco + activación automática + panel + tabindex (' + JSON.stringify(s) + ')');
    await p.keyboard.press('End'); s = await st('a'); ok(s.focus === 3 && s.sel === 3 && s.shown === '3', T + 'End');
    await p.keyboard.press('ArrowRight'); s = await st('a'); ok(s.focus === 0 && s.sel === 0 && s.shown === '0', T + 'ArrowRight desde la última vuelve a la primera');
    await p.keyboard.press('ArrowLeft'); s = await st('a'); ok(s.focus === 3, T + 'ArrowLeft desde la primera va a la última');
    await p.keyboard.press('Home'); s = await st('a'); ok(s.focus === 0 && s.sel === 0, T + 'Home');
    await p.keyboard.press('Tab'); s = await st('a'); ok(s.focus === -1 && s.focusOutside === 'b-t0', T + 'Tab sale de la lista (siguiente lista: ' + s.focusOutside + ')');
    await p.keyboard.press('Shift+Tab'); s = await st('a'); ok(s.focus === 0, T + 'Shift+Tab vuelve a la pestaña seleccionada');

    // Pestaña deshabilitada: se omite
    s = await st('b'); ok(s.tabbable === '0,-1,,-1' || /0,-1,.*,-1/.test(s.tabbable), T + 'deshabilitada sin tabindex (' + s.tabbable + ')');
    await p.focus('#b-t1'); await p.keyboard.press('ArrowRight'); s = await st('b'); ok(s.focus === 3, T + 'las flechas omiten la pestaña deshabilitada');

    // Vertical: Arriba/Abajo
    await p.focus('#v-t0'); await p.keyboard.press('ArrowRight'); s = await st('v'); ok(s.sel === 0, T + 'vertical: ArrowRight no hace nada');
    await p.keyboard.press('ArrowDown'); s = await st('v'); ok(s.sel === 1 && s.focus === 1, T + 'vertical: ArrowDown avanza');
    await p.keyboard.press('ArrowUp'); s = await st('v'); ok(s.sel === 0, T + 'vertical: ArrowUp retrocede');

    // Ratón y estado coherente
    await p.click('#a-t2'); s = await st('a'); ok(s.sel === 2 && s.cls === 2 && s.shown === '2' && s.tabbable === '-1,-1,0,-1', T + 'clic activa y sincroniza aria-selected/clase/panel/tabindex');
    // Una sola pestaña activa por lista y paneles asociados
    const rel = await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].every(t => { const pn = document.getElementById(t.getAttribute('aria-controls')); return pn && pn.getAttribute('aria-labelledby') === t.id; }));
    ok(rel, T + 'aria-controls ↔ aria-labelledby consistentes');

    // Foco visible
    await p.focus('#before'); await p.keyboard.press('Tab');
    const ring = await p.evaluate(() => { const a = document.activeElement; let c = getComputedStyle(a); if (c.outlineStyle === 'none') c = getComputedStyle(a, '::before'); /* DEC-004/008: el contorno del tab va en ::before (superficie de 35px) */ return c.outlineStyle + ' ' + c.outlineWidth; }); ok(/solid/.test(ring), T + 'foco visible en la pestaña (' + ring + ')');

    // Layout + axe
    const lay = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth }));
    ok(lay.over <= 0, T + 'sin desborde horizontal (' + lay.over + ')');
    await p.addScriptTag({ content: fs.readFileSync('/tmp/dec007/node_modules/axe-core/axe.min.js', 'utf8') });
    const ax = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'page-has-heading-one': { enabled: false }, 'document-title': { enabled: false }, 'landmark-one-main': { enabled: false } } }));
    ok(ax.violations.length === 0, T + 'axe: ' + (ax.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'sin violaciones'));
    const cc = await p.evaluate(() => axe.run({ include: [['main']], exclude: [['.mp-tab.is-active']] }, { runOnly: ['color-contrast'] }));
    ok(cc.violations.length === 0, T + 'axe color-contrast (excluye la pestaña activa en naranja de marca, DS-01/DEC-001): ' + (cc.violations.length ? cc.violations[0].nodes.map(n => n.target.join(' ') + ' ' + (n.any[0] && n.any[0].message || '').slice(0, 90)).join(' ; ') : 'sin violaciones'));
    ok(errs.length === 0, T + 'sin errores de JS ' + errs.join('|'));
    await p.close();
  }
  await ctx.close();
  console.log(`tabs ${PCT}% ${W}px: ${pass} OK, ${fail} fallos`); fails.forEach(f => console.log('  FALLA', f));
  process.exit(fail ? 1 : 0);
})();
