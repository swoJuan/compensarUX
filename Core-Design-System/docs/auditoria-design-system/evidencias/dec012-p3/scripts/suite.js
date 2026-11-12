const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const OUT = __dirname;
const BASE = 'http://localhost:8000/drupal.html';
const BASELINE_CSS = fs.readFileSync('/tmp/core.p3.before.css', 'utf8'); // compilado ANTES de P3 (incluye DEC-005 y P2)

const SECTIONS = ['header', 'sidebar', 'avatar', 'badges', 'iconos-intro', 'iconos-libreria'];
// estados: [nombre, ancho, tema, equiv?]   (equiv=false => solo overflow/clipping, no se espera igualdad)
const STATES = [
  ['1280-light', 1280, 'light', true],
  ['1280-dark', 1280, 'dark', true],
  ['1280-hc', 1280, 'high-contrast', true],
  ['320-light', 320, 'light', true],
  ['768-light', 768, 'light', true],
  ['1440-light', 1440, 'light', true],
];

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
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    let s = `${i}|${t}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''}|${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)}`;
    for (const p of PROPS) s += '|' + cs[p];
    out.push(s);
  });
  const doc = document.documentElement;
  const clipped = [...document.querySelectorAll('.mp-web-header, .mp-web-header *, .mp-sidebar__panel, .mp-sidebar__panel *')]
    .filter(el => { const cs = getComputedStyle(el); return cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1; })
    .map(el => el.tagName + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''));
  return { dom: out, overflow: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth,
           clipped: [...new Set(clipped)].sort() };
};

async function openSection(page, hash) {
  await page.evaluate(h => { location.hash = '#' + h; }, hash);
  await page.waitForTimeout(300);
  await page.waitForFunction(() => !document.querySelector('#content .fragment-loading') && document.querySelector('#content').children.length > 0, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}
async function setTheme(page, t) {
  await page.evaluate(x => { if (window.setTheme) window.setTheme(x); else document.documentElement.setAttribute('data-theme', x); }, t);
  await page.waitForTimeout(250);
}

async function runSuite(label, useBaseline) {
  const browser = await chromium.launch();
  const res = {};
  const mk = async (opts) => {
    const ctx = await browser.newContext(opts);
    if (useBaseline) await ctx.route(/\/css\/core\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: BASELINE_CSS }));
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    return page;
  };

  // --- contexto normal ---
  let page = await mk({ viewport: { width: 1280, height: 900 } });
  for (const sec of SECTIONS) {
    res[sec] = {};
    await openSection(page, sec);
    for (const [name, w, theme] of STATES) {
      await page.setViewportSize({ width: w, height: 900 });
      await setTheme(page, theme);
      await page.waitForTimeout(250);
      res[sec][name] = await page.evaluate(SNAP, PROPS);
    }
    // variantes interactivas del header (dropdown abierto + drawer abierto, y variante ZT)
    if (sec === 'header') {
      for (const w of [1280, 320]) {
        await page.setViewportSize({ width: w, height: 900 });
        await setTheme(page, 'light');
        const dd = page.locator('[data-web-header-control="dropdown"]');
        const op = page.locator('[data-web-header-control="open"]');
        const vr = page.locator('[data-web-header-control="variant"]');
        try {
          if (await dd.count()) await dd.first().check({ timeout: 3000 });
          if (await op.count()) await op.first().check({ timeout: 3000 });
          await page.waitForTimeout(400);
          res[sec][`${w}-dropdown+open`] = await page.evaluate(SNAP, PROPS);
          if (await vr.count()) { await vr.first().selectOption('zt', { timeout: 3000 }); await page.waitForTimeout(400);
            res[sec][`${w}-zt`] = await page.evaluate(SNAP, PROPS); await vr.first().selectOption('public'); }
          if (await dd.count()) await dd.first().uncheck({ timeout: 3000 });
          if (await op.count()) await op.first().uncheck({ timeout: 3000 });
        } catch (e) { res[sec][`${w}-controls`] = { error: String(e).slice(0, 160) }; }
      }
    }
  }
  await page.context().close();

  // --- zoom 200% (viewport 640 CSS px a DSF 2 = ventana de 1280 con zoom 200%) ---
  page = await mk({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 });
  for (const sec of SECTIONS) {
    await openSection(page, sec);
    for (const theme of ['light', 'dark', 'high-contrast']) {
      await setTheme(page, theme);
      await page.waitForTimeout(250);
      res[sec][`zoom200-${theme}`] = await page.evaluate(SNAP, PROPS);
    }
  }
  await page.context().close();

  // --- INFORMATIVO: tamaño de texto del usuario (rem escala) ---
  page = await mk({ viewport: { width: 1280, height: 900 } });
  for (const sec of ['header', 'sidebar']) {
    await openSection(page, sec);
    await setTheme(page, 'light');
    for (const pct of [150, 200]) {
      await page.evaluate(p => { document.documentElement.style.fontSize = p + '%'; }, pct);
      await page.waitForTimeout(400);
      const r = await page.evaluate(SNAP, PROPS);
      r.noequiv = true;
      res[sec][`rootfont${pct}`] = r;
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  }
  await browser.close();
  return res;
}

function diffState(a, b) {
  if (!a || !b || a.error || b.error) return { error: (a && a.error) || (b && b.error) || 'faltante' };
  const diffs = [];
  if (a.dom.length !== b.dom.length) return { lengthMismatch: [a.dom.length, b.dom.length] };
  for (let i = 0; i < a.dom.length; i++) {
    if (a.dom[i] !== b.dom[i]) {
      const A = a.dom[i].split('|'), B = b.dom[i].split('|');
      const names = ['idx', 'el', 'rect', ...PROPS];
      const fields = [];
      for (let k = 2; k < A.length; k++) if (A[k] !== B[k]) fields.push(`${names[k]}: ${A[k]} -> ${B[k]}`);
      diffs.push(`${A[1]} :: ${fields.join(' ; ')}`);
    }
  }
  return { count: diffs.length, sample: diffs.slice(0, 8), total: a.dom.length };
}

(async () => {
  console.log('Midiendo CSS ANTERIOR a P3 (linea base)...');
  const base = await runSuite('base', true);
  console.log('Midiendo CSS NUEVO (P3)...');
  const now = await runSuite('now', false);

  const report = { equivalence: {}, overflow: {}, clipped: {} };
  let totalStates = 0, equalStates = 0;
  for (const sec of Object.keys(now)) {
    report.equivalence[sec] = {}; report.overflow[sec] = {}; report.clipped[sec] = {};
    for (const st of Object.keys(now[sec])) {
      const a = base[sec][st], b = now[sec][st];
      if (!a || !b || a.error || b.error) { report.equivalence[sec][st] = { error: (a && a.error) || (b && b.error) || 'faltante' }; continue; }
      report.overflow[sec][st] = { base: a.overflow, now: b.overflow, scrollW: `${a.scrollW}->${b.scrollW}`, clientW: b.clientW };
      report.clipped[sec][st] = { base: a.clipped, now: b.clipped, same: JSON.stringify(a.clipped) === JSON.stringify(b.clipped) };
      if (b.noequiv) { report.equivalence[sec][st] = { skipped: 'informativo (rem escala con el tamaño de texto)' }; continue; }
      const d = diffState(a, b);
      report.equivalence[sec][st] = d;
      totalStates++;
      if (d.count === 0) equalStates++;
    }
  }
  fs.writeFileSync(path.join(OUT, 'suite-report.json'), JSON.stringify(report, null, 2));

  console.log(`\n=== EQUIVALENCIA (DOM completo, base vs nuevo): ${equalStates}/${totalStates} estados IDENTICOS ===`);
  for (const sec of Object.keys(report.equivalence)) for (const st of Object.keys(report.equivalence[sec])) {
    const d = report.equivalence[sec][st];
    if (d.skipped) continue;
    if (d.count !== 0) { console.log(`DIFF  ${sec} / ${st}:`, JSON.stringify(d).slice(0, 700)); }
  }
  console.log('\n=== OVERFLOW HORIZONTAL (documento) ===');
  for (const sec of Object.keys(report.overflow)) for (const st of Object.keys(report.overflow[sec])) {
    const o = report.overflow[sec][st];
    if (o.base || o.now) console.log(`${sec} / ${st}: base=${o.base} now=${o.now} (scrollW ${o.scrollW}, client ${o.clientW})`);
  }
  console.log('\n=== CLIPPING dentro de header/sidebar: cambios base vs nuevo ===');
  let clipChanges = 0;
  for (const sec of Object.keys(report.clipped)) for (const st of Object.keys(report.clipped[sec])) {
    const c = report.clipped[sec][st];
    if (!c.same) { clipChanges++; console.log(`${sec} / ${st}: base=${JSON.stringify(c.base)} now=${JSON.stringify(c.now)}`); }
  }
  if (!clipChanges) console.log('sin cambios de clipping.');
})().catch(e => { console.error('ERROR SUITE', e); process.exit(1); });
