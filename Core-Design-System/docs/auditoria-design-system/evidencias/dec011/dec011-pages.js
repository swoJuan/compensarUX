// DEC-011 · Portal real: Alert sin sobrescrituras de color, Toast y Modal, y página Header (imágenes, componente, ids, teclado)
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const HOST = process.env.HOST || 'http://localhost:8000';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  let pass = 0, fail = 0; const fails = []; const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
  const lum = h => { const [r, g, bl] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * bl; };
  const cr = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hexOf = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)/); return m ? '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('') : c; };

  // ── Alert y Toast: en cada tema, color de título/cuerpo/icono contra el fondo real ──────────────────────────────────────────────────
  for (const [route, base] of [['alertas', 'mp-alert'], ['toast', 'mp-toast']]) {
    for (const theme of ['light', 'dark', 'high-contrast']) {
      const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(`${HOST}/drupal.html#${route}`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1400);
      await p.evaluate(t => document.getElementById({ light: 'btn-light', dark: 'btn-dark', 'high-contrast': 'btn-hc' }[t]).click(), theme); await p.waitForTimeout(400);
      // forzar el tema también en los contenedores de demo (data-theme local) para ver el caso peor
      const data = await p.evaluate(({ base, theme }) => {
        const out = [];
        document.querySelectorAll(`#content .${base}`).forEach(el => {
          if (el.closest('pre,.code-block')) return;
          const kind = ['info', 'success', 'warning', 'error'].find(k => el.classList.contains(`${base}--${k}`)); if (!kind) return;
          const th = el.closest('[data-theme]'); const eff = th ? th.getAttribute('data-theme') : document.documentElement.getAttribute('data-theme');
          const g = s => { const e = el.querySelector(s); return e ? getComputedStyle(e) : null; };
          const t = g(`.${base}__title`), bo = g(`.${base}__body`), ic = g(`.${base}__icon`), cs = getComputedStyle(el);
          out.push({ kind, eff, bg: cs.backgroundColor, title: t && t.color, body: bo && bo.color, icon: ic && ic.color, bodyFs: bo && bo.fontSize });
        });
        return out;
      }, { base, theme });
      ok(data.length >= 4, `${route}/${theme}: pocas instancias (${data.length})`);
      const seen = new Set();
      for (const d of data) {
        const key = `${d.kind}/${d.eff}`; if (seen.has(key)) continue; seen.add(key);
        const bg = hexOf(d.bg);
        if (d.title) ok(cr(hexOf(d.title), bg) >= 4.5, `${route}/${theme} ${key}: título ${hexOf(d.title)} sobre ${bg} = ${cr(hexOf(d.title), bg).toFixed(2)}`);
        if (d.body) ok(cr(hexOf(d.body), bg) >= 4.5, `${route}/${theme} ${key}: cuerpo ${hexOf(d.body)} sobre ${bg} = ${cr(hexOf(d.body), bg).toFixed(2)}`);
        if (d.icon) ok(cr(hexOf(d.icon), bg) >= 3, `${route}/${theme} ${key}: icono ${hexOf(d.icon)} sobre ${bg} = ${cr(hexOf(d.icon), bg).toFixed(2)}`);
        if (d.bodyFs) ok(parseFloat(d.bodyFs) === 16, `${route}/${theme} ${key}: cuerpo ${d.bodyFs} (esperado 16px)`);
      }
      ok(errs.length === 0, `${route}/${theme}: errores JS ${errs.join('|')}`);
      await p.close();
    }
  }

  // ── Header ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => bad.push(r.url())); p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await p.goto(`${HOST}/drupal.html#header`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600);
  await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; })); await p.waitForTimeout(900);
  const H = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('#content img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, w: i.getBoundingClientRect().width }));
    const ids = {}; document.querySelectorAll('#content [id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1);
    const labels = [...document.querySelectorAll('#content label[for]')].filter(l => !document.getElementById(l.getAttribute('for'))).map(l => l.getAttribute('for'));
    return { imgs, dup: Object.entries(ids).filter(([k, v]) => v > 1).map(([k]) => k), orphanLabels: labels, headers: document.querySelectorAll('#content .mp-web-header').length, figma: document.documentElement.outerHTML.includes('figma.com/api/mcp'),
      over: (() => { const m = document.querySelector('.main'); return m.scrollWidth - m.clientWidth; })() };
  });
  ok(H.imgs.length === 8 && H.imgs.every(i => i.ok), `header: imágenes ${JSON.stringify(H.imgs.filter(i => !i.ok))}`);
  ok(H.imgs.every(i => /^docs\/web\/components\/assets\/header\//.test(i.src)), 'header: alguna imagen no es local');
  ok(!H.figma, 'header: quedan URLs temporales de Figma'); ok(H.headers >= 6, `header: componentes renderizados ${H.headers}`);
  ok(H.dup.length === 0, `header: ids duplicados ${H.dup}`); ok(H.orphanLabels.length === 0, `header: <label for> huérfanos ${H.orphanLabels}`);
  ok(H.over <= 0, `header: desborde horizontal ${H.over}px`); ok(bad.length === 0, `header: peticiones fallidas ${bad.slice(0, 3)}`); ok(errs.length === 0, `header: errores JS ${errs}`);
  // playground: controles
  await p.selectOption('#web-header-variant', 'zt'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !!document.querySelector('#web-header-playground-preview .mp-web-header--zt')), 'header: la variante ZT del playground no se renderiza');
  await p.selectOption('#web-header-variant', 'public');
  await p.fill('#web-header-cta', 'Únete ya'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelector('#web-header-playground-preview .mp-web-header__cta').textContent.trim() === 'Únete ya'), 'header: el texto del CTA no se actualiza');
  await p.uncheck('[data-web-header-control="search"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !document.querySelector('#web-header-playground-preview .mp-web-header__search')), 'header: ocultar buscador no funciona');
  // móvil: botón de menú, aria-expanded, Escape devuelve el foco
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); const merrs = [];
  m.on('pageerror', e => merrs.push(e.message));
  await m.goto(`${HOST}/drupal.html#header`, { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(1600);
  const tg = m.locator('#web-header-playground-preview .mp-web-header__mobile-toggle'); await tg.scrollIntoViewIfNeeded();
  ok(await tg.isVisible(), 'header móvil: el botón de menú no es visible a 375px');
  ok(await tg.getAttribute('aria-expanded') === 'false', 'header móvil: aria-expanded inicial');
  await tg.click(); ok(await tg.getAttribute('aria-expanded') === 'true' && await tg.getAttribute('aria-label') === 'Cerrar menú', 'header móvil: no abre el drawer');
  ok(await m.evaluate(() => getComputedStyle(document.querySelector('#web-header-playground-preview .mp-web-header__drawer')).display !== 'none'), 'header móvil: el drawer no se muestra');
  await m.keyboard.press('Escape');
  ok(await tg.getAttribute('aria-expanded') === 'false', 'header móvil: Escape no cierra');
  ok(await m.evaluate(() => document.activeElement && document.activeElement.classList.contains('mp-web-header__mobile-toggle')), 'header móvil: el foco no vuelve al botón');
  ok(await m.evaluate(() => { const mn = document.querySelector('.main'); return mn.scrollWidth - mn.clientWidth <= 0; }), 'header móvil: desborde horizontal a 375px');
  ok(merrs.length === 0, 'header móvil: errores JS ' + merrs);
  await b.close();
  console.log(`dec011-pages: PASS ${pass}  FAIL ${fail}`); fails.forEach(f => console.log(' ✗', f));
})();
