// DEC-008 · dimensiones reales del DOM y zonas clicables (eventos reales), 3 temas, texto 100/200 %, 1280/375/320 px
const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const { page, read, ROOT, EXE, choice, sw, tab } = require('/tmp/qa/fixture.js');
const NEWCSS = read(ROOT + '/css/core.css');

const btn = (cls, inner, id) => `<button type="button" id="${id}" class="mp-btn ${cls}">${inner}</button>`;
const ic = '<span class="material-symbols-rounded" aria-hidden="true">add</span>';
const buttons = ['primario', 'secundario', 'terciario', 'especial'].flatMap(v => [
  btn(`mp-btn--${v}`, 'Texto', `b-${v}-txt`),
  btn(`mp-btn--${v} mp-btn--icon-left`, ic + 'Texto', `b-${v}-l`),
  btn(`mp-btn--${v} mp-btn--icon-right`, 'Texto' + ic, `b-${v}-r`),
  btn(`mp-btn--${v} mp-btn--icon-both`, ic + 'Texto' + ic, `b-${v}-both`),
  btn(`mp-btn--${v} mp-btn--icon-only`, ic, `b-${v}-only`),
]).join(' ');
const pag = `<nav class="mp-pagination" id="pg"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link" href="#" id="pg-1">1</a></li><li class="mp-pagination__item"><a class="mp-pagination__link is-active" aria-current="page" href="#" id="pg-2">2</a></li><li class="mp-pagination__item"><span class="mp-pagination__ellipsis" id="pg-e">…</span></li><li class="mp-pagination__item"><a class="mp-pagination__link" href="#" id="pg-3" aria-disabled="true">3</a></li></ul></nav>`;
const longLabel = 'Acepto los términos y condiciones del servicio de afiliación de la medicina prepagada';

async function ctx(px) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pwprof-')); fs.mkdirSync(d + '/Default'); fs.writeFileSync(d + '/Default/Preferences', JSON.stringify({ webkit: { webprefs: { default_font_size: px } } })); return chromium.launchPersistentContext(d, { executablePath: EXE, headless: true }); }

const probe = () => {
  const R = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), x: b.x, y: b.y }; };
  const out = { rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
  out.buttons = {};
  document.querySelectorAll('[id^="b-"]').forEach(b => { const r = b.getBoundingClientRect(); const i = b.querySelector('.material-symbols-rounded'); const ir = i && i.getBoundingClientRect(); out.buttons[b.id] = { h: +r.height.toFixed(2), w: +r.width.toFixed(2), iconW: ir ? +ir.width.toFixed(2) : null, iconH: ir ? +ir.height.toFixed(2) : null, iconFs: i ? getComputedStyle(i).fontSize : null }; });
  const pl = document.getElementById('pg-1'), pa = document.getElementById('pg-2'), pe = document.getElementById('pg-e');
  out.pg = { link: getComputedStyle(pl).borderTopLeftRadius, active: getComputedStyle(pa).borderBottomRightRadius, ellipsis: getComputedStyle(pe).borderTopLeftRadius, disabled: getComputedStyle(document.getElementById('pg-3')).borderTopLeftRadius };
  // switch
  const field = document.querySelector('#sw-off-wrap .mp-switch__field'), inp = document.getElementById('sw-off'), track = document.querySelector('#sw-off-wrap .mp-switch__track'), knobCS = getComputedStyle(track, '::after');
  const tr = track.getBoundingClientRect(), ir = inp.getBoundingClientRect(), fr = field.getBoundingClientRect();
  out.sw = { input: { w: +ir.width.toFixed(2), h: +ir.height.toFixed(2) }, field: { w: +fr.width.toFixed(2), h: +fr.height.toFixed(2) }, track: { w: +tr.width.toFixed(2), h: +tr.height.toFixed(2) }, knob: { w: knobCS.width, h: knobCS.height }, trackOffsetTop: +(tr.y - ir.y).toFixed(2), trackBottomGap: +((ir.y + ir.height) - (tr.y + tr.height)).toFixed(2) };
  const lab = document.getElementById('sw-off-label'), lcs = getComputedStyle(lab); const lr = lab.getBoundingClientRect();
  out.sw.label = { fs: lcs.fontSize, lh: lcs.lineHeight, centerDelta: +((lr.y + lr.height / 2) - (ir.y + ir.height / 2)).toFixed(2) };
  out.labels = {}; ['cb-off-label', 'rd-a-label', 'sw-off-label'].forEach(id => { const cs = getComputedStyle(document.getElementById(id)); out.labels[id] = { fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, ls: cs.letterSpacing }; });
  // tabs
  out.tabs = {}; ['tab-1', 'tab-2', 'tab-3'].forEach(id => { const t = document.getElementById(id); const r = t.getBoundingClientRect(); const b = getComputedStyle(t, '::before'); out.tabs[id] = { w: +r.width.toFixed(2), h: +r.height.toFixed(2), surfaceH: b.height, surfaceTop: b.top, surfaceBg: b.backgroundColor, pe: b.pointerEvents }; });
  out.docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
};

(async () => {
  let pass = 0, fail = 0; const fails = []; const rows = [];
  const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
  for (const [pct, px] of [[100, 16], [200, 32]]) for (const w of [1280, 375, 320]) {
    const c = await ctx(px);
    for (const theme of ['light', 'dark', 'high-contrast']) {
      const p = await c.newPage(); await p.setViewportSize({ width: w, height: 1400 });
      const html = page(NEWCSS, `<div style="display:flex;flex-wrap:wrap;gap:12px">${buttons}</div>${pag}${choice('checkbox', 'cb-long', { label: longLabel })}${choice('radio', 'rd-long', { label: longLabel })}`);
      await p.setContent(html, { waitUntil: 'networkidle', timeout: 30000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await p.addScriptTag({ path: ROOT + '/js/mp-tabs.js' });
      const m = await p.evaluate(probe);
      const k = m.rem / 16, tag = `${pct}%/${w}px/${theme}`; const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;
      // Botones: alto 48 (rem), icono 24 (rem), terciario solo icono 48x48
      for (const [id, b] of Object.entries(m.buttons)) {
        ok(near(b.h, 48 * k), `${tag} ${id} alto ${b.h} (esperado ${48 * k})`);
        if (b.iconW !== null) ok(near(b.iconW, 24 * k) && near(b.iconH, 24 * k), `${tag} ${id} icono ${b.iconW}x${b.iconH} (esperado ${24 * k})`);
      }
      ['b-terciario-only'].forEach(id => ok(near(m.buttons[id].w, 48 * k) && near(m.buttons[id].h, 48 * k), `${tag} terciario solo icono ${m.buttons[id].w}x${m.buttons[id].h}`));
      // Paginación 16px (rem)
      for (const [n, v] of Object.entries(m.pg)) ok(near(parseFloat(v), 16 * k), `${tag} paginación ${n} radio ${v} (esperado ${16 * k}px)`);
      // Switch
      const s = m.sw;
      ok(near(s.input.w, 52 * k) && near(s.input.h, 44 * k), `${tag} switch área ${s.input.w}x${s.input.h} (esperado ${52 * k}x${44 * k})`);
      ok(near(s.track.w, 52 * k) && near(s.track.h, 32 * k), `${tag} switch track ${s.track.w}x${s.track.h}`);
      ok(near(parseFloat(s.knob.w), 28 * k) && near(parseFloat(s.knob.h), 28 * k), `${tag} switch knob ${s.knob.w}x${s.knob.h}`);
      ok(near(s.trackOffsetTop, s.trackBottomGap, 0.6), `${tag} switch track no centrado: arriba ${s.trackOffsetTop} abajo ${s.trackBottomGap}`);
      // Etiquetas 16 / 24
      for (const [id, l] of Object.entries(m.labels)) ok(near(parseFloat(l.fs), 16 * k) && near(parseFloat(l.lh), 24 * k), `${tag} etiqueta ${id} ${l.fs}/${l.lh} (esperado ${16 * k}/${24 * k})`);
      ok(Math.abs(s.label.centerDelta) <= 0.6 * k, `${tag} etiqueta switch desalineada ${s.label.centerDelta}`);
      // Tabs
      for (const id of ['tab-1', 'tab-2', 'tab-3']) { const t = m.tabs[id]; ok(t.h >= 44 * k - 0.6 && t.w >= 52 * k - 0.6, `${tag} ${id} área ${t.w}x${t.h} (mín ${52 * k}x${44 * k})`); ok(near(parseFloat(t.surfaceH), 35 * k), `${tag} ${id} superficie ${t.surfaceH} (esperado ${35 * k})`); ok(t.pe === 'none', `${tag} ${id}::before pointer-events ${t.pe}`); }
      ok(m.docOverflow <= 0, `${tag} desborde horizontal ${m.docOverflow}px`);
      // Zonas clicables reales (solo a 100 % en 1280 para eficiencia, pero todos los temas)
      if (pct === 100 && w === 1280) {
        const sw1 = await p.locator('#sw-off').boundingBox();
        const hits = [];
        for (const [fx, fy] of [[0.04, 0.04], [0.96, 0.04], [0.04, 0.96], [0.96, 0.96], [0.5, 0.5]]) { const el = await p.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? e.id || e.className : null; }, { x: sw1.x + sw1.width * fx, y: sw1.y + sw1.height * fy }); hits.push(el); }
        ok(hits.every(h => h === 'sw-off'), `${tag} switch: elementFromPoint en esquinas del área ${JSON.stringify(hits)}`);
        // clic real en esquina superior izquierda del área (fuera del track visible: track empieza a 6px)
        await p.mouse.click(sw1.x + 3, sw1.y + 2); ok(await p.evaluate(() => document.getElementById('sw-off').checked), `${tag} switch: clic en franja superior (fuera del track) no activó`);
        await p.mouse.click(sw1.x + 3, sw1.y + sw1.height - 2); ok(!(await p.evaluate(() => document.getElementById('sw-off').checked)), `${tag} switch: clic en franja inferior no desactivó`);
        // Tabs: clic en franja superior/inferior del área táctil (fuera de la superficie de 35px)
        const t2 = await p.locator('#tab-2').boundingBox();
        await p.mouse.click(t2.x + t2.width / 2, t2.y + 2);
        ok(await p.evaluate(() => document.getElementById('tab-2').getAttribute('aria-selected') === 'true'), `${tag} tab: clic en franja superior (4.5px sobre la superficie) no seleccionó`);
        const t1 = await p.locator('#tab-1').boundingBox();
        await p.mouse.click(t1.x + t1.width / 2, t1.y + t1.height - 2);
        ok(await p.evaluate(() => document.getElementById('tab-1').getAttribute('aria-selected') === 'true'), `${tag} tab: clic en franja inferior no seleccionó`);
        // checkbox/radio 44x44
        const cb = await p.locator('#cb-off').boundingBox(); ok(cb.width >= 43.5 && cb.height >= 43.5, `${tag} checkbox área ${cb.width}x${cb.height}`);
        await p.mouse.click(cb.x + 2, cb.y + 2); ok(await p.evaluate(() => document.getElementById('cb-off').checked), `${tag} checkbox: clic en esquina del área no activó`);
      }
      rows.push({ tag, tabs: m.tabs, sw: m.sw, pg: m.pg });
      await p.close();
    }
    await c.close();
  }
  fs.writeFileSync('/tmp/qa/dec008-rows.json', JSON.stringify(rows, null, 1));
  console.log(`PASS ${pass}  FAIL ${fail}`); fails.slice(0, 40).forEach(f => console.log(' ✗', f)); if (fails.length > 40) console.log(`   … ${fails.length - 40} más`);
})();
