const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = __dirname;
const BASE = 'http://localhost:8000/drupal.html';

(async () => {
  const b = await chromium.launch(); const rep = { widths: {} };
  for (const w of [1440, 768, 320]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => { location.hash = '#sidebar'; });
    await p.waitForFunction(() => document.querySelector('[data-sidebar-open]'), null, { timeout: 20000 });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);

    const triggers = await p.$$eval('[data-sidebar-open]', els => els.map(e => ({ id: e.dataset.sidebarOpen, text: (e.textContent || '').trim().slice(0, 30) })));
    const r = { triggers: triggers.length, cases: [] };
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i]; const c = { id: t.id };
      const btn = p.locator('[data-sidebar-open]').nth(i);
      await btn.evaluate(el => el.click()); await p.waitForTimeout(500);
      Object.assign(c, await p.evaluate((id) => {
        const sb = document.getElementById(id); const panel = sb.querySelector('.mp-sidebar__panel'); const pr = panel.getBoundingClientRect();
        const close = sb.querySelector('.mp-sidebar__close'); const cr = close.getBoundingClientRect();
        const head = sb.querySelector('.mp-sidebar__header').getBoundingClientRect(); const foot = sb.querySelector('.mp-sidebar__footer');
        const body = sb.querySelector('.mp-sidebar__body');
        return {
          opened: sb.classList.contains('is-open'),
          panelRect: [Math.round(pr.left), Math.round(pr.top), Math.round(pr.right), Math.round(pr.bottom)], panelW: Math.round(pr.width),
          panelInsideViewport: pr.left >= -1 && pr.right <= window.innerWidth + 1 && pr.bottom <= window.innerHeight + 1,
          closeSize: [Math.round(cr.width), Math.round(cr.height)], closeVisible: cr.width > 0 && cr.right <= window.innerWidth + 1 && cr.left >= 0,
          headerH: Math.round(head.height), footerH: foot ? Math.round(foot.getBoundingClientRect().height) : null,
          bodyScrolls: body ? body.scrollHeight > body.clientHeight : null,
          focusOnClose: document.activeElement === close,
          docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      }, t.id));
      await p.screenshot({ path: path.join(OUT, `sidebar-open-${w}-${i}.png`) });
      await p.keyboard.press('Escape'); await p.waitForTimeout(350);
      c.closedByEscape = await p.evaluate(id => !document.getElementById(id).classList.contains('is-open'), t.id);
      // reabrir y cerrar con el botón X
      await btn.evaluate(el => el.click()); await p.waitForTimeout(300);
      await p.locator(`#${t.id} .mp-sidebar__close`).evaluate(el => el.click()); await p.waitForTimeout(350);
      c.closedByButton = await p.evaluate(id => !document.getElementById(id).classList.contains('is-open'), t.id);
      r.cases.push(c);
    }
    rep.widths[w] = r; await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, 'sidebar-func.json'), JSON.stringify(rep, null, 2));
  for (const w of Object.keys(rep.widths)) {
    const r = rep.widths[w]; console.log(`\n--- ancho ${w}: ${r.triggers} triggers ---`);
    r.cases.forEach(c => console.log(`  #${c.id}: abre=${c.opened} panel=${c.panelW}px dentro=${c.panelInsideViewport} close=${c.closeSize.join('x')} visible=${c.closeVisible} header=${c.headerH}px footer=${c.footerH}px foco=${c.focusOnClose} Esc=${c.closedByEscape} X=${c.closedByButton} overflowDoc=${c.docOverflow}`));
  }
})().catch(e => { console.error('ERROR', e); process.exit(1); });
