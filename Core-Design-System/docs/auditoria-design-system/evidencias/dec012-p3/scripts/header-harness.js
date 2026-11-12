const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const URL = 'http://localhost:8000/_dec012-p3/header-harness.html';
const BASELINE_CSS = fs.readFileSync('/tmp/core.p3.before.css', 'utf8');

const PROPS = ['width','height','minWidth','maxWidth','minHeight','maxHeight',
  'paddingTop','paddingRight','paddingBottom','paddingLeft',
  'marginTop','marginRight','marginBottom','marginLeft','columnGap','rowGap',
  'fontSize','lineHeight','top','right','bottom','left',
  'borderTopLeftRadius','borderBottomRightRadius','borderTopWidth',
  'gridTemplateColumns','flexBasis','transform'];

const SNAP = (PROPS) => {
  const out = [];
  document.body.querySelectorAll('*').forEach((el, i) => {
    const t = el.tagName;
    if (['SCRIPT','STYLE','LINK','META','NOSCRIPT'].includes(t)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    let s = `${i}|${t}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''}|${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)}`;
    for (const p of PROPS) s += '|' + cs[p];
    out.push(s);
  });
  const doc = document.documentElement;
  const clipped = [...document.querySelectorAll('.mp-web-header, .mp-web-header *')]
    .filter(el => { const cs = getComputedStyle(el); return cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1; })
    .map(el => el.tagName + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''));
  return { dom: out, nHeader: document.querySelectorAll('.mp-web-header').length,
           nHeaderEls: document.querySelectorAll('[class*="mp-web-header"]').length,
           overflow: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth,
           clipped: [...new Set(clipped)].sort() };
};

const STATES = [['1280-light',1280,'light'],['1280-dark',1280,'dark'],['1280-hc',1280,'high-contrast'],
  ['320-light',320,'light'],['768-light',768,'light'],['1440-light',1440,'light']];

async function suite(useBaseline) {
  const b = await chromium.launch(); const res = {};
  const mk = async (opts) => {
    const ctx = await b.newContext(opts);
    if (useBaseline) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: BASELINE_CSS }));
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
    return p;
  };
  const th = (p, t) => p.evaluate(x => document.documentElement.setAttribute('data-theme', x), t);

  let p = await mk({ viewport: { width: 1280, height: 900 } });
  for (const [n, w, t] of STATES) { await p.setViewportSize({ width: w, height: 900 }); await th(p, t); await p.waitForTimeout(250); res[n] = await p.evaluate(SNAP, PROPS); }
  await p.context().close();

  p = await mk({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 });
  for (const t of ['light','dark','high-contrast']) { await th(p, t); await p.waitForTimeout(250); res['zoom200-' + t] = await p.evaluate(SNAP, PROPS); }
  await p.context().close();

  p = await mk({ viewport: { width: 1280, height: 900 } });
  for (const pct of [150, 200]) {
    await p.evaluate(x => { document.documentElement.style.fontSize = x + '%'; }, pct); await p.waitForTimeout(400);
    const r = await p.evaluate(SNAP, PROPS); r.noequiv = true; res['rootfont' + pct] = r;
  }
  await b.close(); return res;
}

function diffState(a, b) {
  if (a.dom.length !== b.dom.length) return { lengthMismatch: [a.dom.length, b.dom.length] };
  const names = ['idx','el','rect',...PROPS]; const diffs = [];
  for (let i = 0; i < a.dom.length; i++) if (a.dom[i] !== b.dom[i]) {
    const A = a.dom[i].split('|'), B = b.dom[i].split('|'); const f = [];
    for (let k = 2; k < A.length; k++) if (A[k] !== B[k]) f.push(`${names[k]}: ${A[k]} -> ${B[k]}`);
    diffs.push(`${A[1]} :: ${f.join(' ; ')}`);
  }
  return { count: diffs.length, sample: diffs.slice(0, 8), total: a.dom.length };
}

async function functional() {
  const b = await chromium.launch(); const out = {};
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);

  // --- desktop 1280 ---
  out.desktop = await p.evaluate(() => {
    const q = (s) => document.querySelector(s); const cs = (e) => getComputedStyle(e);
    const dd = q('#v-dropdown .mp-web-header__dropdown'); const r = dd.getBoundingClientRect();
    const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const navLinks = [...document.querySelectorAll('#v-public .mp-web-header__nav-link')];
    return {
      dropdownVisible: !dd.hidden && cs(dd).display !== 'none', dropdownRect: [Math.round(r.left), Math.round(r.right), Math.round(r.width)],
      dropdownInsideViewport: r.left >= 0 && r.right <= window.innerWidth,
      dropdownNotCovered: dd.contains(mid),
      toggleHiddenOnDesktop: cs(q('#v-public .mp-web-header__mobile-toggle')).display === 'none',
      navLinksVisible: navLinks.length, navLinkMinH: Math.min(...navLinks.map(a => a.getBoundingClientRect().height)),
      ctaH: q('#v-public .mp-web-header__cta').getBoundingClientRect().height,
      logo: [q('#v-public .mp-web-header__logo').getBoundingClientRect().width, q('#v-public .mp-web-header__logo').getBoundingClientRect().height],
    };
  });
  // --- navegación por teclado: Tab recorre los enlaces de nav del header público ---
  await p.focus('#v-public .mp-web-header__brand');
  const seq = [];
  for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); seq.push(await p.evaluate(() => (document.activeElement.className || document.activeElement.tagName || '').toString().split(' ')[0])); }
  out.keyboardTabSequence = seq; out.keyboardReachesAllNavLinks = seq.filter(c => c === 'mp-web-header__nav-link').length >= 4;

  // --- móvil 320 ---
  await p.setViewportSize({ width: 320, height: 900 }); await p.waitForTimeout(300);
  out.mobile320 = await p.evaluate(() => {
    const q = (s) => document.querySelector(s); const cs = (e) => getComputedStyle(e);
    const tg = q('#v-mobile .mp-web-header__mobile-toggle'); const tr = tg.getBoundingClientRect();
    const dr = q('#v-mobile .mp-web-header__drawer'); const links = [...document.querySelectorAll('#v-mobile .mp-web-header__drawer-link')];
    const root = q('#v-mobile .mp-web-header');
    return {
      toggleDisplayed: cs(tg).display !== 'none', toggleSize: [Math.round(tr.width), Math.round(tr.height)],
      toggleTouchOK: tr.width >= 44 && tr.height >= 44,
      navHidden: cs(q('#v-mobile .mp-web-header__nav')).display === 'none',
      drawerShown: cs(dr).display !== 'none', drawerLinkMinH: Math.min(...links.map(a => a.getBoundingClientRect().height)),
      headerFitsViewport: root.scrollWidth <= root.clientWidth + 1, docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ctaHiddenOnMobile: cs(q('#v-public .mp-web-header__cta')).display === 'none',
    };
  });
  await b.close(); return out;
}

async function shots() {
  const b = await chromium.launch();
  for (const [w, label] of [[1280, 'd'], [320, 'm']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
    for (const t of ['light', 'dark', 'high-contrast']) {
      await p.evaluate(x => document.documentElement.setAttribute('data-theme', x), t); await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(OUT, `header-${label}-${t}.png`), fullPage: true });
    }
    await ctx.close();
  }
  await b.close();
}

(async () => {
  console.log('Header harness: medir CSS anterior (baseline)...'); const base = await suite(true);
  console.log('Header harness: medir CSS nuevo...'); const now = await suite(false);
  const rep = { equivalence: {}, overflow: {}, clipChanges: [] }; let tot = 0, eq = 0;
  for (const st of Object.keys(now)) {
    const a = base[st], c = now[st];
    rep.overflow[st] = { base: a.overflow, now: c.overflow, nHeaderRoots: c.nHeader, nHeaderEls: c.nHeaderEls, domNodes: c.dom.length, scrollW: `${a.scrollW}->${c.scrollW}`, clientW: c.clientW };
    if (JSON.stringify(a.clipped) !== JSON.stringify(c.clipped)) rep.clipChanges.push({ st, base: a.clipped, now: c.clipped });
    if (c.noequiv) { rep.equivalence[st] = { skipped: 'informativo' }; continue; }
    rep.equivalence[st] = diffState(a, c); tot++; if (rep.equivalence[st].count === 0) eq++;
  }
  console.log(`\n=== HEADER: equivalencia DOM completo base vs nuevo: ${eq}/${tot} estados IDENTICOS ===`);
  const s0 = rep.overflow['1280-light'];
  console.log(`cobertura: ${s0.nHeaderRoots} headers renderizados, ${s0.nHeaderEls} elementos mp-web-header*, ${s0.domNodes} nodos DOM medidos por estado`);
  for (const st of Object.keys(rep.equivalence)) { const d = rep.equivalence[st]; if (!d.skipped && d.count !== 0) console.log('DIFF', st, JSON.stringify(d).slice(0, 800)); }
  console.log('\n=== overflow documento ==='); for (const st of Object.keys(rep.overflow)) { const o = rep.overflow[st]; if (o.base || o.now) console.log(st, `base=${o.base} now=${o.now} scrollW ${o.scrollW} client ${o.clientW}`); }
  console.log('\n=== clipping dentro del header: cambios ==='); console.log(rep.clipChanges.length ? JSON.stringify(rep.clipChanges) : 'sin cambios');
  rep.functional = await functional();
  console.log('\n=== FUNCIONAL (CSS nuevo) ==='); console.log(JSON.stringify(rep.functional, null, 2));
  await shots();
  fs.writeFileSync(path.join(OUT, 'header-report.json'), JSON.stringify(rep, null, 2));
})().catch(e => { console.error('ERROR', e); process.exit(1); });
