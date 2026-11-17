#!/usr/bin/env node
/**
 * version-flujo.mjs — Publica una versión de un flujo como instantánea inmutable.
 *
 * Uso:
 *   node scripts/version-flujo.mjs <id-flujo> <x.y.z> --notas "Qué cambió" --aprobado-por "Nombre"
 *        [--actualizar-catalogo] [--ref <commit>] [--simular]
 *
 * - Solo se guarda una versión APROBADA: --aprobado-por es obligatorio (queda en el manifiesto).
 * - Congela el flujo desde un COMMIT (por defecto HEAD), nunca desde la carpeta en disco, y
 *   rechaza si hay cambios sin confirmar en Flujos/prototipos/.
 * - Un commit de desarrollo NO crea versión: esta orden es la única que lo hace.
 * - No sobrescribe versiones existentes. Con --actualizar-catalogo sube `version` del flujo en
 *   catalogo.json (el build exige que coincida con la última publicada).
 * - No hace commit, push ni tags: deja los archivos nuevos para revisar (ver guardar.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './lib/fuentes.mjs';
import { SEMVER, cmpSemver, huellas, listarVersiones, dirRecursos, dirVersion } from './lib/versiones.mjs';
import { prepararSnapshot, ErrorUso } from './lib/snapshot.mjs';

const fallar = (msg) => { console.error('✗ ' + msg); process.exit(1); };
const pos = [];
const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--simular' || argv[i] === '--actualizar-catalogo') opt[argv[i].slice(2)] = true;
  else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i];
  else pos.push(argv[i]);
}
const [id, version] = pos;
if (!id || !version) fallar('Uso: node scripts/version-flujo.mjs <id-flujo> <x.y.z> --notas "Qué cambió" --aprobado-por "Nombre" [--actualizar-catalogo] [--ref <commit>] [--simular]');
if (!SEMVER.test(version)) fallar(`La versión debe ser x.y.z (recibí "${version}").`);
if (!opt.notas || !String(opt.notas).trim()) fallar('Indica --notas "Qué cambió en esta versión": queda en el manifiesto.');
if (!opt.simular && (!opt['aprobado-por'] || !String(opt['aprobado-por']).trim())) fallar('Solo se publican versiones aprobadas: indica --aprobado-por "Nombre" (quién autorizó la publicación).');

const previas = listarVersiones(id);
if (previas.some((v) => v.version === version)) fallar(`La v${version} de ${id} ya está publicada. Las versiones son inmutables: usa un número nuevo.`);
if (previas.length && cmpSemver(version, previas[0].version) <= 0) fallar(`La versión debe ser mayor que la última publicada (v${previas[0].version}).`);

let s;
try { s = prepararSnapshot(id, opt.ref || 'HEAD'); }
catch (e) { if (e instanceof ErrorUso) fallar(e.message); throw e; }

try {
  const { f, commitInfo, ds, propios, comunes, enlacesExternos, hash, reutiliza, mapaComun, mapaPropio, tmp } = s;
  const manifest = {
    id, version,
    nombre: f.nombre,
    plataforma: f.plataforma,
    publicadaEl: new Date().toISOString(),
    ...(opt['aprobado-por'] ? { aprobacionPublicacion: { por: String(opt['aprobado-por']).trim(), fecha: new Date().toISOString().slice(0, 10) } } : {}),
    commit: commitInfo,
    entrada: s.entrada,
    notas: String(opt.notas).trim(),
    estadoUX: { estado: f.estado, aprobacionUX: f.aprobacionUX || null },
    ds,
    paquetesCdn: s.paquetesCdn,
    recursos: { hash, archivos: Object.keys(mapaComun).length },
    enlacesExternos,
    archivos: mapaPropio,
  };
  const rdir = dirRecursos(hash);

  console.log(`${f.nombre} → v${version}`);
  console.log(`  commit congelado : ${commitInfo.corto} (${commitInfo.fecha.slice(0, 10)})`);
  console.log(`  sistema de diseño: ${ds ? `${ds.tag || 'commit ' + ds.commit}` : 'sin registro'}`);
  console.log(`  archivos propios : ${propios.length}`);
  if (enlacesExternos.length) console.log(`  enlaces a otros flujos (no incluidos): ${[...new Set(enlacesExternos.map((e) => e.hacia))].join(', ')}`);
  console.log(`  recursos comunes : ${comunes.length} archivos · huella ${hash} · ${reutiliza ? 'REUTILIZADOS (sin duplicar)' : 'nuevos'}`);
  if (reutiliza && JSON.stringify(huellas(path.join(rdir, 'archivos'))) !== JSON.stringify(Object.fromEntries(Object.keys(mapaComun).sort().map((k) => [k, mapaComun[k]])))) {
    fallar(`La carpeta de recursos ${hash} existe pero su contenido no coincide: no se toca.`);
  }
  if (opt.simular) { console.log('\n(simulación: no se escribió nada)'); process.exit(0); }

  if (!reutiliza) {
    const t = rdir + '.tmp';
    fs.rmSync(t, { recursive: true, force: true });
    for (const rel of comunes) { fs.mkdirSync(path.dirname(path.join(t, 'archivos', rel)), { recursive: true }); fs.copyFileSync(path.join(tmp, rel), path.join(t, 'archivos', rel)); }
    fs.writeFileSync(path.join(t, 'recursos.json'), JSON.stringify({ hash, archivos: mapaComun }, null, 2) + '\n');
    fs.renameSync(t, rdir);
  }
  const destino = dirVersion(id, version);
  const t = destino + '.tmp';
  fs.rmSync(t, { recursive: true, force: true });
  for (const rel of propios) { fs.mkdirSync(path.dirname(path.join(t, 'archivos', rel)), { recursive: true }); fs.copyFileSync(path.join(tmp, rel), path.join(t, 'archivos', rel)); }
  fs.writeFileSync(path.join(t, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.renameSync(t, destino);
  console.log(`\n✓ Versión guardada en ${path.relative(process.cwd(), destino)}`);

  if (opt['actualizar-catalogo']) {
    const ruta = path.join(ROOT, 'catalogo.json');
    const cat = readJson('catalogo.json');
    cat.flujos.find((x) => x.id === id).version = version;
    fs.writeFileSync(ruta, JSON.stringify(cat, null, 2) + '\n');
    console.log(`✓ catalogo.json: ${id} → version ${version}`);
  } else {
    console.log(`  Recuerda subir "version" a ${version} en catalogo.json (el build exige que coincida con la última publicada).`);
  }
  console.log('  Siguiente paso: confirma con "node scripts/guardar.mjs commit-version ' + id + '" y regenera el portal con "npm run publicar".');
} finally {
  s.liberar();
}
