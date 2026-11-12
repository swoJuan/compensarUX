const { chromium } = require('/tmp/pw/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const URL = 'http://localhost:8000/_dec012-pi01/header-harness.html';
const CSS = { pre: fs.readFileSync('/tmp/core.preP3.css', 'utf8'), cur: fs.readFileSync('/tmp/core.curB.css', 'utf8') };   // original / P3+B (sin PI-04)
const THR = process.env.THR || '16em';
const LIVE = process.argv.includes('--live');           // 'cand' = CSS vivo del repo (ya con la regla aplicada), sin inyeccion
const CAND = `@media (max-width:${THR}){.mp-web-header__brand-service{display:none}}`;
const ALTS = {
  'A compactar espacios (padding/gap) y quitar la 3.a columna vacia': CAND + `@media (max-width:${THR}){.mp-web-header__main{padding-inline:var(--space-8);column-gap:var(--space-8);grid-template-columns:auto 1fr}}`,
  'C el boton de menu pasa a una 2.a fila (wrap)': CAND + `@media (max-width:${THR}){.mp-web-header__main{grid-template-columns:auto;justify-items:start}}`,
  'D nombre con elipsis (se trunca)': CAND + `@media (max-width:${THR}){.mp-web-header__brand{min-width:0}.mp-web-header__brand-text{min-width:0}.mp-web-header__brand-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}`,
  'E tope de logo y boton: min(2.75rem, 12vw)': CAND + `@media (max-width:${THR}){.mp-web-header__logo{width:min(2.75rem,12vw);height:min(2.75rem,12vw)}.mp-web-header__mobile-toggle{min-width:min(2.75rem,12vw);min-height:min(2.75rem,12vw)}}`,
};
ALTS['F A + E'] = ALTS['A compactar espacios (padding/gap) y quitar la 3.a columna vacia'] + `@media (max-width:${THR}){.mp-web-header__logo{width:min(2.75rem,12vw);height:min(2.75rem,12vw)}.mp-web-header__mobile-toggle{min-width:min(2.75rem,12vw);min-height:min(2.75rem,12vw)}}`;

const TEXT = [[100, 16], [150, 24], [200, 32]], WIDTHS = [320, 375, 768, 900, 1024, 1440], THEMES = ['light', 'dark', 'high-contrast'];
const CASES = ['v-public', 'v-dropdown', 'v-dropdown-late', 'v-mobile', 's-hover', 's-focus', 'v-zt'];   // v-zt aparte (PI-01)
const PROPS = ['width','height','minWidth','maxWidth','minHeight','maxHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','columnGap','rowGap','fontSize','lineHeight','top','right','bottom','left','borderTopLeftRadius','borderBottomRightRadius','borderTopWidth','gridTemplateColumns','flexBasis','transform'];
const NAMES = ['idx', 'el', 'rect', ...PROPS];

const SNAP = (PROPS) => { const out = [];
  document.body.querySelectorAll('*').forEach((el, i) => { if (['SCRIPT','STYLE','LINK','META','NOSCRIPT'].includes(el.tagName) || el.closest('[data-skip-equiv]')) return;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    let s = `${i}|${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''}|${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)}`;
    for (const p of PROPS) s += '|' + cs[p]; out.push(s); });
  return out; };

const METRICS = (CASES) => {
  const W = document.documentElement.clientWidth, cs = e => getComputedStyle(e), rd = n => Math.round(n * 10) / 10, res = { W, cases: {} };
  for (const id of CASES) {
    const root = document.getElementById(id), hdr = root && root.querySelector('.mp-web-header'); if (!hdr) { res.cases[id] = { missing: true }; continue; }
    const vis = e => { const c = cs(e); return c.display !== 'none' && c.visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
    const hr = hdr.getBoundingClientRect(); let mr = hr.right; hdr.querySelectorAll('*').forEach(e => { if (vis(e)) mr = Math.max(mr, e.getBoundingClientRect().right); });
    const q = s => hdr.querySelector(s), nav = q('.mp-web-header__nav');
    const mode = nav ? (cs(nav).display !== 'none' ? 'desktop' : 'mobile') : 'zt';
    const R = s => { const e = q(s); if (!e || !vis(e)) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, h: r.height }; };
    const logo = R('.mp-web-header__logo'), name = R('.mp-web-header__brand-name'), svc = R('.mp-web-header__brand-service'), tg = R('.mp-web-header__mobile-toggle');
    const nameEl = q('.mp-web-header__brand-name'), lh = nameEl ? parseFloat(cs(nameEl).lineHeight) : 0;
    let overlaps = 0;
    for (const g of ['.mp-web-header__main > *', '.mp-web-header__utility > *', '.mp-web-header__nav .mp-web-header__nav-link', '.mp-web-header__drawer > *']) {
      const els = [...hdr.querySelectorAll(g)].filter(vis);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlaps++; } }
    res.cases[id] = { mode, over: rd(Math.max(0, mr - W)), overlaps, logo: !!logo, name: !!name, svc: !!svc, nameLines: name && lh ? rd(name.h / lh) : null,
                      tog: !!tg, togIn: tg ? (tg.l >= -1 && tg.r <= W + 1) : null, togW: tg ? Math.round(tg.r - tg.l) : null, logoW: logo ? Math.round(logo.r - logo.l) : null, headerH: Math.round(hr.height) };
  }
  return res; };

const KEYS = async (page, rootId) => {
  const info = await page.evaluate(id => { const cl = e => (e.className || e.tagName).toString().split(' ')[0];
    const els = [...document.querySelectorAll('#' + id + ' a[href], #' + id + ' button, #' + id + ' input')].filter(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; });
    if (document.activeElement) document.activeElement.blur(); if (els[0]) els[0].focus(); return { names: els.map(cl) }; }, rootId);
  const snap = () => page.evaluate(id => { const a = document.activeElement, r = a.getBoundingClientRect(); return { cl: (a.className || a.tagName).toString().split(' ')[0], inRoot: !!a.closest('#' + id), visible: r.width > 0 && r.height > 0, inX: r.left >= -1 && r.right <= innerWidth + 1 }; }, rootId);
  const geo = [await snap()]; for (let i = 1; i < info.names.length; i++) { await page.keyboard.press('Tab'); geo.push(await snap()); }
  return { expected: info.names.length, same: JSON.stringify(info.names) === JSON.stringify(geo.map(g => g.cl)), allOK: geo.every(g => g.inRoot && g.visible && g.inX) }; };

async function open(px, variant, injected, w = 1280) {
  const dir = fs.mkdtempSync('/tmp/pwprof-'); fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: px, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', viewport: { width: w, height: 900 } });
  if (CSS[variant]) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS[variant] }));
  const p = ctx.pages()[0]; await p.goto(URL, { waitUntil: 'networkidle' });
  if (injected) await p.addStyleTag({ content: injected });
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); return { ctx, p }; }

async function matrix(variant, injected, pct, px, wantDom, shots, keys) {
  const { ctx, p } = await open(px, variant, injected); const out = { states: {}, keys: {} };
  for (const w of WIDTHS) for (const t of THEMES) {
    await p.setViewportSize({ width: w, height: 900 }); await p.evaluate(x => document.documentElement.setAttribute('data-theme', x), t); await p.waitForTimeout(160);
    await p.evaluate(() => window.scrollTo(0, 0)); const k = `${w}|${t}`; out.states[k] = await p.evaluate(METRICS, CASES); if (wantDom) out.states[k].dom = await p.evaluate(SNAP, PROPS);
    if (shots && (w === 320 || w === 375) && (t === 'light' || (t === 'high-contrast' && w === 320))) {
      await p.locator('#v-public').screenshot({ path: path.join(OUT, `shot-${pct}-${w}-${t}-publico.png`) });
      await p.locator('#v-mobile').screenshot({ path: path.join(OUT, `shot-${pct}-${w}-${t}-drawer.png`) }); } }
  if (keys) { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    for (const w of WIDTHS) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(160); out.keys[w] = { pub: await KEYS(p, 'v-public'), mob: await KEYS(p, 'v-mobile') }; } }
  await ctx.close(); return out; }

const exempt = (el, n, hidden) => (el === 'DIV.mp-web-header__nav-item' && ['top','right','bottom','left'].includes(n)) || (el === 'DIV.mp-web-header__dropdown' && (['left','right'].includes(n) || (hidden && ['width','gridTemplateColumns'].includes(n))));
const diffDom = (a, b) => { if (a.length !== b.length) return { len: [a.length, b.length] }; const d = [];
  for (let i = 0; i < a.length; i++) { if (a[i] === b[i]) continue; const A = a[i].split('|'), B = b[i].split('|'), f = [];
    for (let k = 2; k < A.length; k++) { if (A[k] !== B[k] && !exempt(A[1], NAMES[k], A[2] === '0.00,0.00,0.00,0.00')) f.push(`${NAMES[k]}: ${A[k]} -> ${B[k]}`); }
    if (f.length) d.push(`${A[1]} :: ${f.join('; ')}`); } return { count: d.length, sample: d.slice(0, 4) }; };

const pass = (c) => c && !c.missing && c.over <= 0.5 && c.overlaps === 0 && c.logo && c.name && c.nameLines <= 1.5 && (c.mode !== 'mobile' || (c.tog && c.togIn));
const PUB = ['v-public', 'v-dropdown', 'v-dropdown-late', 'v-mobile', 's-hover', 's-focus'];

(async () => {
  const R = { pre: {}, cur: {}, cand: {} };
  for (const [pct, px] of TEXT) { console.log(`matriz: texto ${pct}%...`);
    R.pre[pct] = await matrix('pre', null, pct, px, pct === 100, false, false);
    R.cur[pct] = await matrix('cur', null, pct, px, pct === 100, false, false);
    R.cand[pct] = await matrix(LIVE ? null : 'cur', LIVE ? null : CAND, pct, px, pct === 100, true, true); }
  // ---- equivalencia a texto normal ----
  const eqs = {}; for (const [lab, A] of [['vs P3+B (sin PI-04)', 'cur'], ['vs ORIGINAL anterior a P3', 'pre']]) { let ok = 0, tot = 0; const bad = [];
    for (const k of Object.keys(R.cand[100].states)) { const d = diffDom(R[A][100].states[k].dom, R.cand[100].states[k].dom); tot++; if (d.count === 0) ok++; else bad.push({ k, ...d }); } eqs[lab] = { ok, tot, bad }; }
  console.log(`\n=== EQUIVALENCIA a texto 100% (DOM completo; ${WIDTHS.join('/')} px x 3 temas) ===`);
  for (const [lab, e] of Object.entries(eqs)) { console.log(`candidato ${lab}: ${e.ok}/${e.tot} identicos`); e.bad.slice(0, 3).forEach(b => console.log('   DIFF', JSON.stringify(b).slice(0, 400))); }
  // ---- criterio de aceptacion por celda (header publico; ZT aparte) ----
  console.log('\n=== ACEPTACION por texto x ancho (3 temas): sin overflow, sin solape, logo + nombre visibles, nombre en 1 linea, boton de menu a la vista ===');
  console.log('formato: celdas OK de 3 temas | detalle de lo que falla (peor tema)');
  const summ = {}; for (const [pct] of TEXT) for (const w of WIDTHS) { const row = {};
    for (const v of ['pre', 'cur', 'cand']) { let ok = 0, worst = 0, fail = []; for (const t of THEMES) { const s = R[v][pct].states[`${w}|${t}`]; const bad = PUB.filter(id => !pass(s.cases[id])); if (!bad.length) ok++; else { fail = bad; worst = Math.max(worst, ...bad.map(id => s.cases[id].over)); } }
      row[v] = { ok, worst, fail }; } summ[`${pct}|${w}`] = row;
    const f = (x) => `${x.ok}/3${x.ok < 3 ? ` (+${x.worst}px)` : ''}`;
    console.log(`${String(pct).padStart(3)}% ${String(w).padStart(4)}px: original ${f(row.pre).padEnd(14)} P3+B ${f(row.cur).padEnd(14)} CANDIDATO ${f(row.cand)}`); }
  console.log('\nCasos que fallan en el CANDIDATO (peor tema):'); for (const [pct] of TEXT) for (const w of WIDTHS) { const r = summ[`${pct}|${w}`].cand; if (r.ok < 3) console.log(`   ${pct}% ${w}px: ${r.fail.join(', ')}`); }
  console.log('\n=== SUBTITULO (v-public, tema claro): visible? original/P3+B -> candidato ===');
  for (const [pct] of TEXT) console.log(`${pct}%: ` + WIDTHS.map(w => `${w}:${R.cur[pct].states[`${w}|light`].cases['v-public'].svc ? 'si' : 'no'}->${R.cand[pct].states[`${w}|light`].cases['v-public'].svc ? 'si' : 'no'}`).join('  '));
  console.log('\n=== NOMBRE DE MARCA: lineas (debe ser 1) y ancho del boton, candidato, v-public claro ===');
  for (const [pct] of TEXT) console.log(`${pct}%: ` + WIDTHS.map(w => { const c = R.cand[pct].states[`${w}|light`].cases['v-public']; return `${w}:${c.nameLines}l/boton ${c.togW ?? '-'}px`; }).join('  '));
  console.log('\n=== TECLADO (candidato) ===');
  let kOK = 0, kN = 0; for (const [pct] of TEXT) for (const w of WIDTHS) { const v = R.cand[pct].keys[w]; for (const x of [v.pub, v.mob]) { kN++; if (x.same && x.allOK) kOK++; else console.log(`   ${pct}% ${w}px: ${x.same ? 'orden OK' : 'orden DIFIERE'}, ${x.allOK ? 'todos en vista' : 'algun enfocable FUERA de vista'}`); } }
  console.log(`teclado: ${kOK}/${kN} combinaciones OK`);
  console.log('\n=== ZT (PI-01, preexistente) a 320px: overflow px original / P3+B / candidato ===');
  for (const [pct] of TEXT) console.log(`${pct}%: ` + ['pre', 'cur', 'cand'].map(v => `${R[v][pct].states['320|light'].cases['v-zt'].over}`).join(' / '));
  fs.writeFileSync(path.join(OUT, 'pi04-matriz.json'), JSON.stringify({ eqs, summ }, null, 1));

  if (LIVE) return;
  // ---- ALTERNATIVAS (solo evidencia; inyectadas, el repo no se toca) ----
  console.log('\n\n##### ALTERNATIVAS (inyectadas; NO aplicadas) #####');
  console.log('Ancho minimo de viewport en que el Header publico cabe (modo movil), y apariencia a texto normal');
  const alts = { 'B solo subtitulo (candidato)': CAND, ...ALTS }; const altRes = {};
  const altIds = ['v-public', 's-hover'];
  const evalAlt = async (p) => { const m = await p.evaluate(METRICS, altIds), cs = altIds.map(id => m.cases[id]);
    return { mode: cs[0].mode, over: Math.max(...cs.map(c => c.over)), ok: cs.every(pass), togIn: cs.every(c => c.togIn !== false), overlaps: cs.reduce((x, c) => x + c.overlaps, 0),
             lines: Math.max(...cs.map(c => c.nameLines || 0)), H: cs.map(c => c.headerH), logoW: cs[0].logoW, togW: cs[0].togW, logoWs: cs[1].logoW, togWs: cs[1].togW }; };
  for (const [name, css] of Object.entries(alts)) { altRes[name] = {};
    for (const [pct, px] of [[150, 24], [200, 32]]) { const { ctx, p } = await open(px, 'cur', css); let minFit = null;
      for (let w = 180; w <= 48 * px; w += 2) { await p.setViewportSize({ width: w, height: 900 }); const m = await evalAlt(p);
        if (m.mode !== 'mobile') continue; if (m.over <= 0.5 && m.togIn && m.overlaps === 0) { if (minFit === null) minFit = w; } else minFit = null; }
      const at = {}; for (const w of [320, 375]) { await p.setViewportSize({ width: w, height: 900 }); await p.evaluate(() => window.scrollTo(0, 0)); at[w] = await evalAlt(p);
        if (pct === 200) { const tag = name.split(' ')[0]; await p.locator('#v-public').screenshot({ path: path.join(OUT, `alt-${tag}-${pct}-${w}-publico.png`) }); await p.locator('#s-hover').screenshot({ path: path.join(OUT, `alt-${tag}-${pct}-${w}-sinbuscador.png`) }); } }
      altRes[name][pct] = { minFit, minEm: minFit ? +(minFit / px).toFixed(2) : null, at }; await ctx.close(); }
    const { ctx, p } = await open(16, 'cur', css); const { ctx: c0, p: p0 } = await open(16, 'cur', null); let same = true;
    for (const w of [320, 375, 768]) { await p.setViewportSize({ width: w, height: 900 }); await p0.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(120);
      const d = diffDom(await p0.evaluate(SNAP, PROPS), await p.evaluate(SNAP, PROPS)); if (d.count) same = false; }
    altRes[name].normalIdentical = same; await ctx.close(); await c0.close(); }
  for (const [name, r] of Object.entries(altRes)) { const f = (x) => x.minFit ? `${x.minFit}px (${x.minEm}em)` : 'nunca';
    const st = (x) => x.ok ? 'OK' : '+' + x.over + 'px';
    console.log(`\n${name}\n   150%: minimo ${f(r[150]).padEnd(16)} 320:${st(r[150].at[320])} 375:${st(r[150].at[375])}`
      + `\n   200%: minimo ${f(r[200]).padEnd(16)} 320:${st(r[200].at[320])} 375:${st(r[200].at[375])}  | a 320/200%: alto header [con buscador, sin buscador]=${r[200].at[320].H.join(' / ')}px, logo ${r[200].at[320].logoW}px, boton ${r[200].at[320].togW}px, nombre ${r[200].at[320].lines} linea(s)`
      + `\n   texto normal 320/375/768 identico al actual: ${r.normalIdentical ? 'SI' : 'NO'}`); }
  fs.writeFileSync(path.join(OUT, 'pi04-alternativas.json'), JSON.stringify(altRes, null, 1));
})().catch(e => { console.error('ERROR', e); process.exit(1); });
