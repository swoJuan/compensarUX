// Modal de la documentación (DS-28): apertura, rol/aria, foco inicial, trampa de foco, Escape y retorno de foco. Solo lectura, teclado real.
// Uso: node modal-check.js   (servidor en :8000; requiere /tmp/qa)
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('http://localhost:8000/drupal.html#modales', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('[data-modal-demo]', { timeout: 60000 }); await p.waitForTimeout(1500);
  const res = []; const t = (n, ok, d = '') => { res.push(ok); console.log(`${ok ? 'ok   ' : 'FALLA'} ${n} ${d}`); };
  const trigger = p.locator('[data-modal-demo]').first();
  await trigger.scrollIntoViewIfNeeded(); await trigger.focus();
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const dlg = p.locator('.modal-live-layer [role=dialog]');
  t('abre con Enter', await dlg.count() === 1);
  t('role=dialog y aria-modal', await dlg.getAttribute('aria-modal') === 'true' && !!(await dlg.getAttribute('aria-labelledby')));
  const inside = () => p.evaluate(() => !!document.activeElement.closest('.modal-live-layer'));
  t('foco inicial dentro', await inside());
  let stay = true, seen = new Set();
  for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); stay = stay && await inside(); seen.add(await p.evaluate(() => document.activeElement.textContent.trim().slice(0, 20) + '|' + document.activeElement.className.slice(0, 20))); }
  t('Tab x12 nunca sale del diálogo', stay, `${seen.size} elementos distintos`);
  let back = true; for (let i = 0; i < 12; i++) { await p.keyboard.press('Shift+Tab'); back = back && await inside(); }
  t('Shift+Tab x12 nunca sale del diálogo', back);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  t('Escape cierra', await dlg.count() === 0);
  t('el foco vuelve al disparador', await p.evaluate(() => document.activeElement.hasAttribute('data-modal-demo')));
  await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
})();
