#!/usr/bin/env node
/**
 * ds-sincronizar.mjs — Actualización CONTROLADA de los prototipos con el
 * sistema de diseño.
 *
 *   npm run ds:estado        Solo informa: qué versión del sistema de diseño
 *                            usan los prototipos y si están al día. No cambia nada.
 *   npm run ds:sincronizar   Además ejecuta el script propio de los prototipos
 *                            (flujos/scripts/sync-flows.mjs), que copia core.css,
 *                            portal.css e iconos a flujos/shared/. No hace commit:
 *                            revisas los prototipos y decides si confirmas.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readJson, Fuente, estadoSincronizacion, git } from './lib/fuentes.mjs';

const aplicar = process.argv.includes('--aplicar');
const cfg = readJson('fuentes.json');
const ds = new Fuente('designSystem', cfg.designSystem);
const fl = new Fuente('flujos', cfg.flujos);
const est = estadoSincronizacion(ds, fl, cfg.sincronizacion.archivos);
const corto = (iso) => (iso ? iso.slice(0, 10) : '—');

console.log(`\nSistema de diseño → Prototipos`);
console.log(`  Sistema de diseño publicado: ${est.dsCommit} (${cfg.designSystem.ref})`);
for (const a of est.archivos) {
  const marca = a.estado === 'al-dia' ? '✓ al día      ' : (a.estado === 'faltante' ? '✗ falta       ' : '• desactualizado');
  const usa = a.versionUsada ? `  (los prototipos usan la versión ${a.versionUsada.commit} del ${corto(a.versionUsada.fecha)})` : '';
  console.log(`  ${marca} ${a.flujos}${usa}`);
}

if (est.estado === 'al-dia') {
  console.log('\n✓ Los prototipos usan la misma versión del sistema de diseño. No hay nada que sincronizar.\n');
  process.exit(0);
}
if (!aplicar) {
  console.log('\nPara actualizar los prototipos con esta versión del sistema de diseño ejecuta:');
  console.log('  npm run ds:sincronizar\n');
  process.exit(0);
}

// --- Aplicar (controlado) ---
const script = path.join(fl.repo, 'scripts', 'sync-flows.mjs');
if (!fs.existsSync(script)) { console.error(`\n✗ No encuentro ${script}`); process.exit(1); }

const pendientesDs = git(ds.repo, ['status', '--porcelain', '--', 'css', 'icons']).toString().trim();
if (pendientesDs) {
  console.log('\n⚠ El sistema de diseño tiene cambios sin commit en css/ o icons/.');
  console.log('  sync-flows copia los archivos tal como están en la carpeta, no la versión con commit.');
  console.log('  Haz commit en el sistema de diseño primero, o vuelve a ejecutar con --forzar si estás seguro.');
  if (!process.argv.includes('--forzar')) process.exit(1);
}

console.log(`\nEjecutando el script de los prototipos: ${path.relative(process.cwd(), script)}`);
const r = spawnSync(process.execPath, [script], { cwd: fl.repo, stdio: 'inherit', env: { ...process.env, DS_PATH: ds.repo } });
if (r.status !== 0) { console.error('\n✗ sync-flows terminó con error.'); process.exit(r.status || 1); }

console.log('\n✓ Prototipos actualizados en la carpeta (sin commit).');
console.log('  1. Revisa los prototipos en el portal: se reconstruye solo si tienes `npm run dev` abierto');
console.log('     (si publicas con ref HEAD, el portal muestra el cambio cuando hagas commit en los prototipos).');
console.log('  2. Si todo se ve bien, confirma en el repositorio de prototipos:');
console.log(`     git -C "${fl.repo}" add shared/vendor shared/icons`);
console.log(`     git -C "${fl.repo}" commit -m "DS · Sincronizar con sistema de diseño ${est.dsCommit}"\n`);
