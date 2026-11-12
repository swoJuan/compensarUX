#!/usr/bin/env node
/**
 * sync-flows.mjs
 * ------------------------------------------------------------------
 * Copia SOLO los recursos del Design System necesarios para ejecutar
 * los prototipos de este repo (flujos/). NO copia todo el Design System.
 *
 * Este repo (flujos/) y el Design System son repositorios SEPARADOS.
 * El Design System es la fuente de verdad y vive fuera de este repo.
 *
 * Origen por defecto (repo del Design System):
 *   ../../../Core-Design-System   (relativo a flujos/scripts/)
 *   es decir:  Compensar/Core-Design-System
 *
 * Puedes sobreescribir la ubicación del Design System con la variable
 * de entorno DS_PATH:
 *   DS_PATH=/ruta/al/Core-Design-System npm run sync-flows
 *
 * Copia (lista blanca):
 *   <DS>/css/core.css     ->  shared/vendor/core.css
 *   <DS>/css/portal.css   ->  shared/vendor/portal.css
 *   <DS>/icons/icons.css  ->  shared/icons/icons.css
 *   <DS>/js/mp-tabs.js    ->  shared/vendor/mp-tabs.js
 *   <DS>/icons/fonts/     ->  shared/icons/fonts/
 *
 * Los archivos en shared/vendor y shared/icons son una copia de
 * distribución. NO se editan a mano: se regeneran con este script.
 * La fuente de verdad siempre es el repo del Design System.
 *
 * Uso:  npm run sync-flows        (desde flujos/)
 * ------------------------------------------------------------------
 */
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLOWS = resolve(__dirname, '..');            // flujos/
const SHARED = join(FLOWS, 'shared');

// Origen del Design System: env DS_PATH o el default relativo.
const DS = process.env.DS_PATH
  ? resolve(process.env.DS_PATH)
  : resolve(FLOWS, '..', '..', 'Core-Design-System'); // Compensar/Core-Design-System

// Lista blanca: SOLO lo que un prototipo necesita en tiempo de ejecución.
// De icons/ se copian únicamente icons.css + fonts/ (no la librería fuente de SVG).
const JOBS = [
  { from: join(DS, 'css', 'core.css'),    to: join(SHARED, 'vendor', 'core.css'),   type: 'file' },
  { from: join(DS, 'css', 'portal.css'),  to: join(SHARED, 'vendor', 'portal.css'), type: 'file' },
  { from: join(DS, 'icons', 'icons.css'), to: join(SHARED, 'icons', 'icons.css'),   type: 'file' },
  { from: join(DS, 'js', 'mp-tabs.js'),   to: join(SHARED, 'vendor', 'mp-tabs.js'), type: 'file' },
  { from: join(DS, 'icons', 'fonts'),     to: join(SHARED, 'icons', 'fonts'),       type: 'dir'  },
];

const ensureDir = (p) => mkdirSync(p, { recursive: true });
const rel = (p) => p.replace(FLOWS + '/', '').replace(resolve(DS) + '/', 'Core-Design-System/');

console.log('sync-flows: Design System -> flujos/shared');
console.log(`  origen (DS): ${DS}\n`);

if (!existsSync(DS)) {
  console.error(`ERROR: no se encontró el Design System en:\n  ${DS}`);
  console.error('Corre el script con DS_PATH apuntando al repo Core-Design-System, por ejemplo:');
  console.error('  DS_PATH=/ruta/al/Core-Design-System npm run sync-flows');
  process.exit(1);
}

let copied = 0;
let missing = 0;

for (const job of JOBS) {
  if (!existsSync(job.from)) {
    console.warn(`  ⚠  FALTA en el Design System: ${job.from}`);
    missing++;
    continue;
  }
  if (job.type === 'file') {
    ensureDir(dirname(job.to));
    cpSync(job.from, job.to);
    console.log(`  ✓  ${rel(job.from)}  ->  ${rel(job.to)}`);
  } else {
    if (existsSync(job.to)) rmSync(job.to, { recursive: true, force: true });
    ensureDir(dirname(job.to));
    cpSync(job.from, job.to, { recursive: true });
    console.log(`  ✓  ${rel(job.from)}/  ->  ${rel(job.to)}/`);
  }
  copied++;
}

console.log(`\nsync-flows: listo. ${copied} recurso(s) sincronizado(s)${missing ? `, ${missing} faltante(s)` : ''}.`);
if (missing) {
  console.log('Sugerencia: si falta core.css/portal.css, corre `npm run build` dentro del repo Core-Design-System primero.');
  process.exit(1);
}
