// Portal real: línea base (8001) vs nuevo (8000), pixel a pixel, elementos anclados a la misma posición. 3 temas.
const { chromium } = require('playwright'); const crypto = require('crypto');
const THEMES = { light: 'Claro', dark: 'Oscuro', 'high-contrast': 'Alto contraste' };
const SETS = [['badges', '.component-example-card, .bdg-state-card, [id^="bdg-"]'], ['avatar', '[id^="avatar-"] , .avt-preview'], ['tabs', '#tab-preview-area'], ['alertas', '.mp-alert'], ['seleccion', '.mp-choice, .mp-switch'], ['paginacion', '.mp-pagination'], ['stepper', '.mp-stepper'], ['header', '.mp-web-header']];
(async () => {
  const b = await chromium.launch({ channel: 'chromium' }); let same = 0, diff = 0; const dl = [];
  for (const [theme, txt] of Object.entries(THEMES)) {
    const H = {};
    for (const [name, base] of [['base', 'http://localhost:8001'], ['nuevo', 'http://localhost:8000']]) {
      for (const [hash, sel] of SETS) {
        const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
        await p.goto(`${base}/drupal.html#${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
        if (theme !== 'light') { await p.evaluate(t => { const x = [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); x && x.click(); }, txt); await p.waitForTimeout(300); }
        await p.addStyleTag({ content: '*{transition:none!important;animation:none!important;caret-color:transparent!important}' });
        const n = Math.min(await p.locator(sel).count(), 6);
        for (let i = 0; i < n; i++) {
          const ok = await p.evaluate(({ sel, i }) => { const e = document.querySelectorAll(sel)[i]; if (!e) return false; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.width > 1100) return false; e.style.cssText += ';position:fixed!important;top:20px!important;left:20px!important;margin:0!important;z-index:99999!important;transform:none!important;background:var(--use-background-page)'; window.scrollTo(0, 0); return true; }, { sel, i });
          if (!ok) continue; await p.waitForTimeout(40);
          const bb = await p.evaluate(({ sel, i }) => { const r = document.querySelectorAll(sel)[i].getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.ceil(r.width), height: Math.ceil(r.height) }; }, { sel, i });
          const buf = await p.screenshot({ clip: bb }).catch(() => null); if (!buf) continue;
          (H[`${hash}|${sel}|${i}`] = H[`${hash}|${sel}|${i}`] || {})[name] = crypto.createHash('md5').update(buf).digest('hex');
          await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
          if (theme !== 'light') { await p.evaluate(t => { const x = [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); x && x.click(); }, txt); await p.waitForTimeout(250); }
          await p.addStyleTag({ content: '*{transition:none!important;animation:none!important;caret-color:transparent!important}' });
        }
        await p.close();
      }
    }
    for (const [k, v] of Object.entries(H)) { if (!v.base || !v.nuevo) continue; if (v.base === v.nuevo) same++; else { diff++; dl.push(theme + ' ' + k.split('|').filter((x, i) => i !== 1).join('#')); } }
    console.log(theme.padEnd(14), 'acumulado idénticas', same, '· distintas', diff);
  }
  await b.close(); console.log('DIFERENCIAS:', dl.length ? '\n  ' + dl.join('\n  ') : 'ninguna');
})();
