#!/usr/bin/env node
/**
 * despliegue-registrar.mjs — Anota en despliegues.json una publicación que YA ocurrió.
 * No publica nada ni toca ningún entorno: solo deja constancia verificable.
 *
 *   node scripts/despliegue-registrar.mjs --flujo <id> --entorno <id> --commit <hash> --estado publicado|en-proceso|fallido|revertido
 *        --evidencia "<URL del proceso o identificador verificable>" [--version x.y.z] [--url https://…]
 *        [--fecha ISO] [--responsable "…"] [--id <id>] [--simular]
 * El commit debe existir, la versión debe estar publicada para el flujo y la evidencia es obligatoria.
 */
import { spawnSync } from 'node:child_process';
import { readJson, Fuente } from './lib/fuentes.mjs';
import { contexto, leerCatalogo, validarDespliegue, agregarDespliegue, ErrTraz } from './lib/trazabilidad.mjs';
import { listarVersiones } from './lib/versiones.mjs';
const opt = {}; const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--simular') opt.simular = true; else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i]; }
const fallar = (m) => { console.error('✗ ' + m); process.exit(1); };
if (!opt.flujo || !opt.entorno || !opt.commit || !opt.estado || !opt.evidencia) fallar('Uso: --flujo <id> --entorno <id> --commit <hash> --estado <estado> --evidencia "<referencia verificable>" [--version x.y.z] [--url https://…] [--fecha ISO] [--responsable "…"] [--simular]');
const ctx = contexto(); const cat = leerCatalogo(ctx);
const fl = new Fuente('flujos', readJson('fuentes.json').flujos);
const r = spawnSync('git', ['-C', fl.repo, 'rev-parse', '--verify', `${opt.commit}^{commit}`], { encoding: 'utf8' });
if (r.status !== 0) fallar(`El commit ${opt.commit} no existe en el repositorio.`);
const completo = r.stdout.trim();
const fecha = opt.fecha || new Date().toISOString();
const d = {
  id: opt.id || `dep-${fecha.slice(0, 10).replace(/-/g, '')}-${opt.flujo}-${opt.entorno}-${completo.slice(0, 7)}`,
  flujo: opt.flujo, version: opt.version || null, entorno: opt.entorno, commit: completo, fecha, estado: opt.estado,
  urlPublicada: opt.url || null, evidencia: opt.evidencia,
  ...(opt.responsable ? { responsable: opt.responsable } : {}),
};
const errores = validarDespliegue(d, ctx, fl, cat, listarVersiones);
if (errores.length) fallar(errores.join('\n✗ '));
console.log(`Despliegue: ${d.id}\n  ${d.flujo}${d.version ? ' v' + d.version : ''} · ${d.entorno} · ${d.estado} · commit ${completo.slice(0, 7)}`);
if (opt.simular) { console.log('(simulación: no se escribió nada)'); process.exit(0); }
try { agregarDespliegue(d, ctx); } catch (e) { if (e instanceof ErrTraz) fallar(e.message); throw e; }
console.log('✓ Registrado en despliegues.json. Revisa el cambio y confírmalo con guardar.mjs; no se hizo commit.');
