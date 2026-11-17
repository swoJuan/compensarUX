#!/usr/bin/env node
/**
 * watch.mjs — Portal en local, siempre sincronizado.
 * Construye el portal, levanta el servidor y vuelve a construir solo cuando
 * cambia algo: un commit o un cambio de archivos en el sistema de diseño o en
 * los prototipos, o un cambio en el propio portal (plantilla, catálogo, fuentes).
 *
 * Construye en una carpeta temporal y la intercambia al terminar, para que el
 * servidor nunca muestre un sitio a medias.
 *
 * Uso: npm run dev        (Ctrl+C para detener)
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson, Fuente, walk as recorrer } from './lib/fuentes.mjs';
const walk = (d) => (fs.existsSync(d) ? recorrer(d) : []);

const DIST = process.env.PORTAL_DIST ? path.resolve(process.env.PORTAL_DIST) : path.join(ROOT, 'dist');
const NEXT = DIST + '.next';
const INTERVALO = Number(process.env.PORTAL_WATCH_MS || 4000);

function firmaPortal() {
  const rutas = ['fuentes.json', 'catalogo.json', 'despliegues.json', ...walk(path.join(ROOT, 'trazabilidad')).map((f) => 'trazabilidad/' + f), ...walk(path.join(ROOT, 'portal')).map((f) => 'portal/' + f), ...walk(path.join(ROOT, 'scripts')).map((f) => 'scripts/' + f)];
  return rutas.map((r) => { try { return fs.statSync(path.join(ROOT, r)).mtimeMs; } catch { return 0; } }).join(',');
}
function firma() {
  try {
    const cfg = readJson('fuentes.json');
    const ds = new Fuente('designSystem', cfg.designSystem);
    const fl = new Fuente('flujos', cfg.flujos);
    return [ds.firma(), fl.firma(), firmaPortal()].join('#');
  } catch (e) { return 'error:' + e.message; }
}

function construir(motivo) {
  const hora = new Date().toLocaleTimeString('es-CO');
  console.log(`\n[${hora}] ${motivo} → reconstruyendo…`);
  fs.rmSync(NEXT, { recursive: true, force: true });
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], {
    cwd: ROOT, stdio: 'inherit', env: { ...process.env, PORTAL_DIST: NEXT },
  });
  if (r.status !== 0) { console.log('✗ El build falló: el portal sigue mostrando la versión anterior.'); return false; }
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.renameSync(NEXT, DIST);
  console.log('✓ Portal actualizado. Recarga el navegador.');
  return true;
}

let ultima = firma();
if (!construir('Inicio')) process.exit(1);

const servidor = spawn(process.execPath, [path.join(ROOT, 'scripts/serve.mjs')], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, PORTAL_DIST: DIST },
});
servidor.on('exit', (code) => process.exit(code ?? 0));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { servidor.kill(); process.exit(0); });

console.log(`Vigilando cambios cada ${INTERVALO / 1000} s en el sistema de diseño, los prototipos y el portal.`);
setInterval(() => {
  const actual = firma();
  if (actual === ultima) return;
  ultima = actual;
  construir('Cambio detectado');
}, INTERVALO);
