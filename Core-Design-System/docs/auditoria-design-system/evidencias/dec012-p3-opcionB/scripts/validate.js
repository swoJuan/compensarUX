const { chromium } = require('/tmp/pw/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const URL = 'http://localhost:8000/_dec012-p3b/header-harness.html';
const CSS = { pre: fs.readFileSync('/tmp/core.preP3.css', 'utf8'),            // anterior a P3 (hash verificado)
              before: fs.readFileSync('/tmp/core.p3final.before.css', 'utf8') };  // P3 sin la opción B
// variante 'after' = CSS vivo del repo (P3 con la opción B)

const TEXT = [[100, 16], [150, 24], [200, 32]];      // [% , tamaño de fuente por defecto del navegador en px]
const WIDTHS = [320, 768, 900, 1024, 1440];
const THEMES = ['light', 'dark', 'high-contrast'];
const CASES = ['v-public', 'v-dropdown', 'v-dropdown-late', 'v-mobile', 'v-zt', 's-hover', 's-focus'];

const PROPS = ['width','height','minWidth','maxWidth','minHeight','maxHeight','paddingTop','paddingRight','paddingBottom','paddingLeft',
  'marginTop','marginRight','marginBottom','marginLeft','columnGap','rowGap','fontSize','lineHeight','top','right','bottom','left',
  'borderTopLeftRadius','borderBottomRightRadius','borderTopWidth','gridTemplateColumns','flexBasis','transform'];

const SNAP = (PROPS) => {            // DOM completo (excluye el caso de mejora marcado data-skip-equiv)
  const out = [];
  document.body.querySelectorAll('*').forEach((el, i) => {
    if (['SCRIPT','STYLE','LINK','META','NOSCRIPT'].includes(el.tagName) || el.closest('[data-skip-equiv]')) return;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    let s = `${i}|${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''}|${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)}`;
    for (const p of PROPS) s += '|' + cs[p];
    out.push(s);
  });
  return out;
};

const METRICS = (CASES) => {
  const doc = document.documentElement, rd = (n) => Math.round(n * 10) / 10;
  const res = { doc: { over: doc.scrollWidth - doc.clientWidth, sw: doc.scrollWidth, cw: doc.clientWidth, rootFont: getComputedStyle(doc).fontSize }, cases: {} };
  for (const id of CASES) {
    const root = document.getElementById(id), hdr = root && root.querySelector('.mp-web-header');
    if (!hdr) { res.cases[id] = { missing: true }; continue; }
    const cs = (e) => getComputedStyle(e), hr = hdr.getBoundingClientRect();
    const nav = hdr.querySelector('.mp-web-header__nav'), tg = hdr.querySelector('.mp-web-header__mobile-toggle');
    const mode = nav ? (cs(nav).display !== 'none' ? 'desktop' : 'mobile') : 'zt';
    const vis = (sel) => [...hdr.querySelectorAll(sel)].filter(e => cs(e).display !== 'none' && e.getBoundingClientRect().width > 0);
    let overlaps = 0;
    for (const g of ['.mp-web-header__main > *', '.mp-web-header__utility > *', '.mp-web-header__nav .mp-web-header__nav-link', '.mp-web-header__drawer > *']) {
      const els = vis(g);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
        const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlaps++;
      }
    }
    const beyond = vis('.mp-web-header__main > *, .mp-web-header__nav .mp-web-header__nav-link, .mp-web-header__utility > *').filter(e => e.getBoundingClientRect().right > hr.right + 0.5).length;
    const dd = hdr.querySelector('.mp-web-header__dropdown'); let ddm = null;
    if (dd && !dd.hidden && cs(dd).display !== 'none') { const d = dd.getBoundingClientRect();
      ddm = { left: rd(d.left), right: rd(d.right), width: rd(d.width), beyondViewport: d.right > window.innerWidth + 0.5, beyondHeader: d.right > hr.right + 0.5, overBy: rd(Math.max(0, d.right - window.innerWidth)) }; }
    res.cases[id] = { mode, headerOverflow: hdr.scrollWidth > hdr.clientWidth + 1, overlaps, beyond, dropdown: ddm, toggleDisplayed: tg ? cs(tg).display !== 'none' : null };
  }
  return res;
};

const KEYS = async (page, rootId) => {
  // Enfocables VISIBLES del header (orden DOM = orden de tabulacion; no hay tabindex>0) vs lo que alcanza Tab, empezando por el primero visible.
  const info = await page.evaluate(id => {
    const cl = (e) => (e.className || e.tagName).toString().split(' ')[0];
    const els = [...document.querySelectorAll('#' + id + ' a[href], #' + id + ' button, #' + id + ' input')]
      .filter(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; });
    if (document.activeElement) document.activeElement.blur();
    if (els[0]) els[0].focus();
    return { names: els.map(cl) };
  }, rootId);
  const snap = () => page.evaluate(id => { const a = document.activeElement, r = a.getBoundingClientRect();
    return { cl: (a.className || a.tagName).toString().split(' ')[0], inRoot: !!a.closest('#' + id), visible: r.width > 0 && r.height > 0, inX: r.left >= -1 && r.right <= innerWidth + 1 }; }, rootId);
  const geo = [await snap()];
  for (let i = 1; i < info.names.length; i++) { await page.keyboard.press('Tab'); geo.push(await snap()); }
  const reached = geo.map(g => g.cl);
  return { expected: info.names.length, same: JSON.stringify(info.names) === JSON.stringify(reached),
           allInRootVisibleInX: geo.every(g => g.inRoot && g.visible && g.inX), kinds: [...new Set(reached)] };
};

async function run(variant, pct, px, wantDom, shots) {
  const dir = fs.mkdtempSync('/tmp/pwprof-'); fs.mkdirSync(path.join(dir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px, default_fixed_font_size: px, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', viewport: { width: 1280, height: 900 } });
  if (CSS[variant]) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS[variant] }));
  const p = ctx.pages()[0] || await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const bp = 48 * px;                                    // breakpoint (em) en px para este tamaño de texto
  const states = []; for (const w of WIDTHS) for (const t of THEMES) states.push([w, t]); states.push([bp, 'light'], [bp + 1, 'light']);
  const out = { rootFont: await p.evaluate(() => getComputedStyle(document.documentElement).fontSize), bp, states: {} };
  for (const [w, t] of states) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.evaluate(x => document.documentElement.setAttribute('data-theme', x), t); await p.waitForTimeout(220);
    const key = `${w}|${t}`; out.states[key] = await p.evaluate(METRICS, CASES);
    if (wantDom) out.states[key].dom = await p.evaluate(SNAP, PROPS);
    if (shots && (t === 'light') && [320, 1024, bp, bp + 1].includes(w)) await p.screenshot({ path: path.join(OUT, `shot-${pct}-${w}.png`), fullPage: true });
  }
  if (variant === 'after') {              // navegación por teclado (solo CSS nuevo)
    out.keys = {};
    for (const w of [320, 900, 1024, 1440, bp, bp + 1]) {
      await p.setViewportSize({ width: w, height: 900 }); await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await p.waitForTimeout(200);
      out.keys[w] = { pub: await KEYS(p, 'v-public'), mob: await KEYS(p, 'v-mobile') };
    }
  }
  await ctx.close(); return out;
}

async function runZoom(variant) {   // zoom 200 % real a texto normal: viewport 640 @ DSF 2
  const ctx = await (await chromium.launch()).newContext({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 });
  if (CSS[variant]) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS[variant] }));
  const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const o = {}; for (const t of THEMES) { await p.evaluate(x => document.documentElement.setAttribute('data-theme', x), t); await p.waitForTimeout(220);
    o[t] = await p.evaluate(METRICS, CASES); o[t].dom = await p.evaluate(SNAP, PROPS); }
  await ctx.browser().close(); return o;
}

const NAMES = ['idx', 'el', 'rect', ...PROPS];
const diffDom = (a, b) => { if (a.length !== b.length) return { lengthMismatch: [a.length, b.length] }; const d = [];
  for (let i = 0; i < a.length; i++) { if (a[i] === b[i]) continue;
    const A = a[i].split('|'), B = b[i].split('|'), el = A[1], hidden = A[2] === '0.00,0.00,0.00,0.00', f = [];
    for (let k = 2; k < A.length; k++) { if (A[k] === B[k]) continue; const n = NAMES[k];
      // EXENCIONES (no cambian lo que se ve, solo el valor "computado" reportado):
      if (el === 'DIV.mp-web-header__nav-item' && ['top', 'right', 'bottom', 'left'].includes(n)) continue;       // position: relative -> static
      if (el === 'DIV.mp-web-header__dropdown' && hidden && ['width', 'gridTemplateColumns'].includes(n)) continue; // elemento oculto: se reporta lo declarado
      if (el === 'DIV.mp-web-header__dropdown' && ['left', 'right'].includes(n)) continue;                            // offsets computados respecto de OTRO bloque contenedor (nav, no item); el rect SI se compara
      f.push(`${n}: ${A[k]} -> ${B[k]}`); }
    if (f.length) d.push(`${el} [${A[2]}] :: ${f.join(' ; ')}`); }
  return { count: d.length, sample: d.slice(0, 6), total: a.length }; };

(async () => {
  const VARS = ['pre', 'before', 'after'];
  let R = { pre: {}, before: {}, after: {}, zoom: {} };
  if (process.argv.includes('--offline')) R = JSON.parse(fs.readFileSync(path.join(OUT, 'validate-raw.json'), 'utf8'));
  else {
    for (const [pct, px] of TEXT) {
      console.log(`texto ${pct}% (preferencia del navegador ${px}px)...`);
      for (const v of VARS) R[v][pct] = await run(v, pct, px, pct === 100, v === 'after');
    }
    console.log('zoom 200% real (texto normal)...');
    for (const v of VARS) R.zoom[v] = await runZoom(v);
    fs.writeFileSync(path.join(OUT, 'validate-raw.json'), JSON.stringify(R));
  }

  const eq = (A, B) => { const r = { ok: 0, total: 0, diffs: [] };
    for (const k of Object.keys(B.states)) { const d = diffDom(A.states[k].dom, B.states[k].dom); r.total++; if (d.count === 0) r.ok++; else r.diffs.push({ state: k, ...d }); }
    return r; };
  const eqZ = (A, B) => { const r = { ok: 0, total: 0, diffs: [] };
    for (const t of THEMES) { const d = diffDom(A[t].dom, B[t].dom); r.total++; if (d.count === 0) r.ok++; else r.diffs.push({ theme: t, ...d }); } return r; };
  const out = {};
  console.log('\n=== EQUIVALENCIA a texto normal (DOM completo; exenciones documentadas en el script) ===');
  for (const [name, A] of [['P3 sin B (antes)', 'before'], ['ANTERIOR A P3 (original)', 'pre']]) {
    const e = eq(R[A][100], R.after[100]), z = eqZ(R.zoom[A], R.zoom.after); out[A] = { e, z };
    console.log(`ahora vs ${name}: viewport/tema ${e.ok}/${e.total} identicos | zoom200 real ${z.ok}/${z.total} identicos`);
    [...e.diffs, ...z.diffs].forEach(d => console.log('   DIFF', JSON.stringify(d).slice(0, 700))); }

  const cell = (S, k) => { const s = S.states[k]; const bad = [];
    if (s.doc.over > 1) bad.push(`doc+${Math.round(s.doc.over)}`);
    for (const id of CASES) { const c = s.cases[id]; if (!c || c.missing) { bad.push(id + ':FALTA'); continue; }
      if (c.headerOverflow) bad.push(id + ':hdrOver'); if (c.overlaps) bad.push(id + ':overlap' + c.overlaps); if (c.beyond) bad.push(id + ':beyond' + c.beyond);
      if (c.dropdown && (c.dropdown.beyondViewport || c.dropdown.beyondHeader)) bad.push(id + ':dd+' + c.dropdown.overBy); }
    return bad.join(',') || '-'; };
  console.log('\n=== PROBLEMAS (desborde/solape/fuera de viewport) por texto y ancho — ANTERIOR A P3 | P3 sin B | AHORA ===');
  console.log('(si los 3 temas coinciden se imprime una sola fila)');
  const rows = []; let nPre = 0, nBef = 0, nAft = 0, n = 0;
  for (const [pct] of TEXT) { const ks = Object.keys(R.after[pct].states);
    const byW = {}; ks.forEach(k => { const [w, t] = k.split('|'); (byW[w] = byW[w] || []).push(t); });
    for (const w of Object.keys(byW)) { const ts = byW[w], g = (v) => ts.map(t => cell(R[v][pct], `${w}|${t}`));
      for (const t of ts) { n++; if (cell(R.pre[pct], `${w}|${t}`) !== '-') nPre++; if (cell(R.before[pct], `${w}|${t}`) !== '-') nBef++; if (cell(R.after[pct], `${w}|${t}`) !== '-') nAft++; }
      const P = g('pre'), B = g('before'), A = g('after'), same = (x) => x.every(y => y === x[0]);
      if (P.every(x => x === '-') && B.every(x => x === '-') && A.every(x => x === '-')) continue;
      const lab = same(P) && same(B) && same(A) ? `${ts.length} temas` : ts.join('/');
      rows.push(`${String(pct).padStart(3)}% ${String(w).padStart(5)}px (${lab}):\n        anterior a P3: ${same(P) ? P[0] : P.join(' || ')}\n        P3 sin B     : ${same(B) ? B[0] : B.join(' || ')}\n        AHORA        : ${same(A) ? A[0] : A.join(' || ')}`); } }
  rows.forEach(r => console.log(r));
  console.log(`\ncombinaciones con algun problema (de ${n}): anterior a P3=${nPre} | P3 sin B=${nBef} | AHORA=${nAft}`);

  console.log('\n=== MODO alrededor del breakpoint (v-public) ===');
  for (const [pct, px] of TEXT) { const bp = 48 * px; for (const w of [bp, bp + 1]) { const kk = `${w}|light`, m = (v) => R[v][pct].states[kk].cases['v-public'].mode;
    console.log(`${pct}% w=${w}: anterior a P3=${m('pre')} | P3 sin B=${m('before')} | AHORA=${m('after')}`); } }

  console.log('\n=== DROPDOWN anclado al 3.er item: ancho y borde derecho (solo donde el header es de escritorio) ===');
  for (const [pct] of TEXT) for (const k of Object.keys(R.after[pct].states)) { if (!k.endsWith('|light') && !k.endsWith('|dark')) continue;
    const g = (v) => R[v][pct].states[k].cases['v-dropdown-late']; if (g('after').mode !== 'desktop' && g('before').mode !== 'desktop') continue;
    const f = (d) => d.dropdown ? `w=${d.dropdown.width} right=${d.dropdown.right}${d.dropdown.beyondViewport ? ' FUERA(+' + d.dropdown.overBy + ')' : ''}` : 'oculto';
    if (k.endsWith('|dark') && f(g('after')) === f(g('before'))) continue;
    console.log(`${String(pct).padStart(3)}% ${k.padEnd(14)} P3 sin B: ${f(g('before')).padEnd(34)} AHORA: ${f(g('after'))}`); }

  console.log('\n=== TECLADO (CSS nuevo): enfocables visibles vs alcanzados con Tab, mismo orden, todos en vista ===');
  let kOK = 0, kN = 0;
  for (const [pct] of TEXT) for (const [w, v] of Object.entries(R.after[pct].keys)) { const o = (x) => { kN++; if (x.same && x.allInRootVisibleInX) kOK++; return `${x.same ? 'OK' : 'DIFIERE'}(${x.expected})${x.allInRootVisibleInX ? '' : ' [alguno fuera de vista]'}`; };
    console.log(`${String(pct).padStart(3)}% w=${String(w).padEnd(5)} v-public: ${o(v.pub).padEnd(30)} v-mobile(drawer abierto): ${o(v.mob)}`); }
  console.log(`teclado: ${kOK}/${kN} combinaciones OK`);
  fs.writeFileSync(path.join(OUT, 'validate-summary.json'), JSON.stringify({ out, nPre, nBef, nAft, n }, null, 2));
})().catch(e => { console.error('ERROR', e); process.exit(1); });
