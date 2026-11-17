#!/usr/bin/env node
/**
 * registrar-flujo.mjs — Da de alta un flujo NUEVO en catalogo.json (nada más).
 * No crea archivos del flujo, no crea versiones y no publica: el flujo queda en «borrador»,
 * sin publicar. Su historial de versiones (Flujos/versiones/<id>/) nace con la primera
 * publicación aprobada.
 *
 *   node scripts/registrar-flujo.mjs --id <kebab-case> --nombre "…" --plataforma zt|drupal|app
 *        --ruta zt/mi-flujo/ [--entrada index.html] [--descripcion "…"] [--simular]
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './lib/fuentes.mjs';

const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--simular') opt.simular = true; else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i]; }
const fallar = (m) => { console.error('✗ ' + m); process.exit(1); };
const cfg = readJson('fuentes.json');
const cat = readJson('catalogo.json');
const { id, nombre, plataforma } = opt;
if (!id || !nombre || !plataforma || !opt.ruta) fallar('Uso: registrar-flujo.mjs --id <kebab-case> --nombre "…" --plataforma zt|drupal|app --ruta zt/mi-flujo/ [--entrada index.html] [--descripcion "…"]');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fallar('El id debe estar en kebab-case (minúsculas, números y guiones).');
if (!cfg.plataformas[plataforma]) fallar(`Plataforma desconocida: ${plataforma}. Disponibles: ${Object.keys(cfg.plataformas).join(', ')}`);
const ruta = opt.ruta.replace(/\/?$/, '/');
if (!ruta.startsWith(plataforma + '/') && !(plataforma === 'app' && ruta === 'app/')) fallar(`La ruta debe empezar por ${plataforma}/ (recibí ${ruta}).`);
if (cat.flujos.some((f) => f.id === id)) fallar(`Ya existe un flujo con id "${id}".`);
if (cat.flujos.some((f) => f.ruta.replace(/\/?$/, '/') === ruta)) fallar(`Ya existe un flujo con la ruta ${ruta}.`);

const entrada = {
  id, nombre,
  descripcion: opt.descripcion || '',
  plataforma, ruta,
  entrada: opt.entrada || 'index.html',
  version: '0.1.0',
  estado: 'borrador',
  figma: null,
  hu: [],
  publicar: false,
  aprobacionUX: { aprobado: false, por: null, fecha: null },
};
console.log(`Flujo nuevo: ${nombre} (${id}) · ${plataforma} · ${ruta} · borrador, sin publicar, sin versiones.`);
if (opt.simular) { console.log('(simulación: no se escribió nada)'); process.exit(0); }
cat.flujos.push(entrada);
fs.writeFileSync(path.join(ROOT, 'catalogo.json'), JSON.stringify(cat, null, 2) + '\n');
console.log('✓ Registrado en catalogo.json. Siguiente: crear los archivos del flujo y confirmarlos con guardar.mjs (sin versión hasta que lo apruebes).');
