#!/usr/bin/env node
/**
 * version-flujo.mjs — Publica una versión de un flujo como instantánea inmutable.
 *
 * Uso:
 *   node scripts/version-flujo.mjs <id-flujo> <x.y.z> --notas "Qué cambió" [--ref <commit>] [--simular]
 *
 * - Congela el flujo desde un COMMIT (por defecto HEAD), nunca desde la carpeta en disco.
 * - Rechaza si hay cambios sin confirmar en Flujos/prototipos/.
 * - Un commit de desarrollo NO crea versión: esta orden es la única que lo hace.
 * - No sobrescribe versiones existentes ni cambia catalogo.json.
 * - No hace commit, push ni tags: deja los archivos nuevos en Flujos/versiones/ para revisar.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson, matcher, Fuente, git } from './lib/fuentes.mjs';
import {
  ALMACEN, SEMVER, cmpSemver, sha256, hashConjunto, huellas, listarVersiones, dirRecursos, dirVersion,
} from './lib/versiones.mjs';

const fallar = (msg) => { console.error('✗ ' + msg); process.exit(1); };
const pos = [];
const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--simular') opt.simular = true;
  else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i];
  else pos.push(argv[i]);
}
const [id, version] = pos;
if (!id || !version) fallar('Uso: node scripts/version-flujo.mjs <id-flujo> <x.y.z> --notas "Qué cambió" [--ref <commit>] [--simular]');
if (!SEMVER.test(version)) fallar(`La versión debe ser x.y.z (recibí "${version}").`);
if (!opt.notas || !opt.notas.trim()) fallar('Indica --notas "Qué cambió en esta versión": queda en el manifiesto.');

const cfg = readJson('fuentes.json');
const cat = readJson('catalogo.json');
const f = cat.flujos.find((x) => x.id === id);
if (!f) fallar(`El flujo "${id}" no está en catalogo.json. Disponibles: ${cat.flujos.map((x) => x.id).join(', ')}`);

const previas = listarVersiones(id);
if (previas.some((v) => v.version === version)) fallar(`La v${version} de ${id} ya está publicada. Las versiones son inmutables: usa un número nuevo.`);
if (previas.length && cmpSemver(version, previas[0].version) <= 0) fallar(`La versión debe ser mayor que la última publicada (v${previas[0].version}).`);

let commit;
try { commit = git(new Fuente('flujos', { ...cfg.flujos, ref: 'HEAD' }).repo, ['rev-parse', '--verify', `${opt.ref || 'HEAD'}^{commit}`]).toString().trim(); }
catch { fallar(`No existe la referencia ${opt.ref || 'HEAD'}.`); }

const fl = new Fuente('flujos', { ...cfg.flujos, ref: commit });
const pendientes = fl.pendientes();
if (pendientes) fallar(`Hay ${pendientes} cambios sin confirmar en Flujos/prototipos/. Confírmalos con un commit antes de publicar la versión (se congela desde el commit, no desde el disco).`);

const prohibido = matcher(cfg.prohibidos);
const excluir = matcher(cfg.flujos.excluir);
const esComun = matcher([...(cfg.flujos.comun || []), ...(cfg.plataformas[f.plataforma].comun || [])]);
const esPropio = matcher(f.incluir || [f.ruta.replace(/\/?$/, '/') + '**']);
const todos = fl.listar().filter((x) => !excluir(x) && !prohibido(x));
const comunes = todos.filter(esComun);
const propios = todos.filter((x) => esPropio(x) && !esComun(x));
const entrada = `${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}`;
if (!propios.includes(entrada)) fallar(`La entrada ${entrada} no existe en el commit ${commit.slice(0, 7)}.`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'version-flujo-'));
try {
  fl.copiar([...comunes, ...propios], tmp);
  const mapa = (lista) => Object.fromEntries(lista.sort().map((rel) => [rel, sha256(fs.readFileSync(path.join(tmp, rel)))]));
  const mapaComun = mapa(comunes);
  const mapaPropio = mapa(propios);
  const hash = hashConjunto(mapaComun);
  const rdir = dirRecursos(hash);
  const reutiliza = fs.existsSync(rdir);

  let ds = null;
  try { const r = JSON.parse(fs.readFileSync(path.join(tmp, 'shared/vendor/ds-version.json'), 'utf8')); ds = { tag: r.ds?.tag || null, commit: String(r.ds?.commit || '').slice(0, 7), fecha: r.ds?.fecha || null }; } catch { /* sin registro */ }
  const cdn = {};
  const reCdn = /\/(compensar(?:-[a-z]+)?)\/v(\d+\.\d+\.\d+)\/\1\.min\.(?:css|js)/g;
  for (const rel of propios.filter((x) => x.endsWith('.html'))) {
    const txt = fs.readFileSync(path.join(tmp, rel), 'utf8');
    for (const m of txt.matchAll(reCdn)) (cdn[m[1]] ||= new Set()).add(m[2]);
  }
  /* Enlaces del flujo hacia archivos de OTRO flujo o del nivel de plataforma: no forman parte
     de la versión (una versión es solo su flujo). Se dejan registrados en el manifiesto. */
  const enSet = new Set([...comunes, ...propios]);
  const existentes = new Set(todos);
  const enlacesExternos = [];
  for (const rel of propios.filter((x) => x.endsWith('.html'))) {
    const txt = fs.readFileSync(path.join(tmp, rel), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of txt.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      const ref = m[1].trim().split('#')[0].split('?')[0];
      if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\$|\{)/i.test(ref)) continue;
      let destino = path.posix.normalize(path.posix.join(path.posix.dirname(rel), ref));
      if (!existentes.has(destino) && existentes.has(path.posix.join(destino, 'index.html'))) destino = path.posix.join(destino, 'index.html');
      if (existentes.has(destino) && !enSet.has(destino)) enlacesExternos.push({ desde: rel, hacia: destino });
    }
  }
  const info = git(fl.raiz, ['log', '-1', '--format=%H%x1f%cI%x1f%s', commit]).toString().trim().split('\x1f');
  const manifest = {
    id, version,
    nombre: f.nombre,
    plataforma: f.plataforma,
    publicadaEl: new Date().toISOString(),
    commit: { completo: info[0], corto: info[0].slice(0, 7), fecha: info[1], mensaje: info[2] },
    entrada,
    notas: opt.notas.trim(),
    estadoUX: { estado: f.estado, aprobacionUX: f.aprobacionUX || null },
    ds,
    paquetesCdn: Object.fromEntries(Object.entries(cdn).map(([k, v]) => [k, [...v].sort()])),
    recursos: { hash, archivos: Object.keys(mapaComun).length },
    enlacesExternos,
    archivos: mapaPropio,
  };

  console.log(`${f.nombre} → v${version}`);
  console.log(`  commit congelado : ${manifest.commit.corto} (${manifest.commit.fecha.slice(0, 10)})`);
  console.log(`  sistema de diseño: ${ds ? `${ds.tag || 'commit ' + ds.commit}` : 'sin registro'}`);
  console.log(`  archivos propios : ${propios.length}`);
  if (enlacesExternos.length) console.log(`  enlaces a otros flujos (no incluidos): ${[...new Set(enlacesExternos.map((e) => e.hacia))].join(', ')}`);
  console.log(`  recursos comunes : ${comunes.length} archivos · huella ${hash} · ${reutiliza ? 'REUTILIZADOS (sin duplicar)' : 'nuevos'}`);
  if (reutiliza && !(JSON.stringify(huellas(path.join(rdir, 'archivos'))) === JSON.stringify(Object.fromEntries(Object.keys(mapaComun).sort().map((k) => [k, mapaComun[k]]))))) {
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
  console.log('  Siguiente paso: revisa, confirma con un commit (feat(<flujo>): publicar vX.Y.Z) y regenera el portal con "npm run publicar".');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
