#!/usr/bin/env node
/**
 * version-propuesta.mjs — SOLO LECTURA. Prepara la propuesta que se muestra al director UX
 * antes de publicar una versión: último número, número propuesto, notas generadas desde los
 * commits del flujo, impacto en almacenamiento y bloqueos. No escribe nada.
 *
 *   node scripts/version-propuesta.mjs <id-flujo> [--tipo patch|minor|major] [--ref <commit>] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { readJson, git } from './lib/fuentes.mjs';
import { ALMACEN, SEMVER, listarVersiones } from './lib/versiones.mjs';
import { prepararSnapshot, ErrorUso } from './lib/snapshot.mjs';

const MANTENIMIENTO = /^(chore|wip|docs|style|refactor|test|ci|build)\b/i;
const UMBRAL_BYTES = 5 * 1024 * 1024;

const pos = []; const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--json') opt.json = true;
  else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i];
  else pos.push(argv[i]);
}
const id = pos[0];
if (!id) { console.error('Uso: node scripts/version-propuesta.mjs <id-flujo> [--tipo patch|minor|major] [--ref <commit>] [--json]'); process.exit(1); }
const salir = (obj, codigo = 0) => {
  if (opt.json) console.log(JSON.stringify(obj, null, 2));
  else imprimir(obj);
  process.exit(codigo);
};
const tamano = (dir) => { let n = 0; const rec = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? rec(p) : (n += fs.statSync(p).size); } }; rec(dir); return n; };
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
const mismo = (a, b) => { const ka = Object.keys(a || {}).sort(), kb = Object.keys(b || {}).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]); };
const sumar = (v, tipo) => { const [a, b, c] = v.split('.').map(Number); return tipo === 'major' ? `${a + 1}.0.0` : tipo === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`; };

function imprimir(r) {
  console.log(`Propuesta de versión · ${r.nombre || r.id}`);
  console.log(`  Última publicada : ${r.ultima ? 'v' + r.ultima.version + ' (' + r.ultima.publicadaEl.slice(0, 10) + ', commit ' + r.ultima.commit + ')' : 'ninguna (sería la primera)'}`);
  if (r.bloqueada) { console.log(`\n✗ NO SE PUEDE PUBLICAR AÚN: ${r.motivo}`); return; }
  console.log(`  Versión propuesta: v${r.propuesta}  (${r.criterio})`);
  console.log(`  Commit a congelar: ${r.commit}`);
  console.log(`  Sistema de diseño: ${r.ds || 'sin registro'}${r.cambioDs ? '  (cambió desde la última versión)' : ''}`);
  console.log(`\n  Notas propuestas:\n    ${r.notas}${r.notasRevisar ? '\n    (generadas con poca información: revísalas)' : ''}`);
  console.log(`\n  Cambios incluidos (${r.commits.length}):`);
  for (const c of r.commits.slice(0, 10)) console.log(`    ${c.commit}  ${c.mensaje}`);
  const a = r.almacenamiento;
  console.log(`\n  Almacenamiento   : +${mb(a.nuevoBytes)} (archivos del flujo ${mb(a.propios)}; recursos ${a.recursos === 'reutilizados' ? 'reutilizados, sin duplicar' : 'nuevos ' + mb(a.comunes)}). Almacén actual: ${mb(a.totalActual)}.`);
  if (a.alerta) console.log(`  ⚠ AUMENTO CONSIDERABLE: ${a.motivoAlerta}`);
  if (r.enlacesExternos.length) console.log(`  Enlaces a otros flujos (no incluidos): ${r.enlacesExternos.join(', ')}`);
  console.log('\n  Pendiente de tu aprobación. Si apruebas, se ejecuta:');
  console.log(`    ${r.comando}`);
}

const cat = readJson('catalogo.json');
const f = cat.flujos.find((x) => x.id === id);
if (!f) salir({ id, bloqueada: true, motivo: `El flujo "${id}" no está en catalogo.json (regístralo con registrar-flujo.mjs).`, ultima: null }, 1);
const previas = listarVersiones(id);
const ultima = previas[0] || null;
const base = { id, nombre: f.nombre, ultima: ultima && { version: ultima.version, publicadaEl: ultima.publicadaEl, commit: ultima.commit.corto } };

let s;
try { s = prepararSnapshot(id, opt.ref || 'HEAD'); }
catch (e) { if (e instanceof ErrorUso) salir({ ...base, bloqueada: true, motivo: e.message }, 2); throw e; }

try {
  const cambioPropios = ultima ? !mismo(s.mapaPropio, ultima.archivos) : true;
  const cambioRecursos = ultima ? s.hash !== ultima.recursos.hash : false;
  if (ultima && !cambioPropios && !cambioRecursos) salir({ ...base, bloqueada: true, motivo: `No hay cambios desde la v${ultima.version}: ni en el flujo ni en sus recursos. No hay nada nuevo que publicar.` }, 2);

  const rutas = f.incluir || [f.ruta];
  let lineas = '';
  try { lineas = git(s.fl.repo, ['log', ...(ultima ? [`${ultima.commit.completo}..${s.commit}`] : ['-n', '12', s.commit]), '--format=%h%x1f%cI%x1f%s', '--', ...rutas]).toString().trim(); } catch { /* historia reescrita */ }
  const commits = lineas ? lineas.split('\n').map((l) => { const [commit, fecha, mensaje] = l.split('\x1f'); return { commit, fecha, mensaje }; }) : [];
  const relevantes = commits.filter((c) => !MANTENIMIENTO.test(c.mensaje));
  const limpiar = (m) => m.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '').replace(/^./, (c) => c.toUpperCase()).replace(/[.\s]+$/, '');
  const frases = [...new Set(relevantes.map((c) => limpiar(c.mensaje)))];
  const cambioDs = !!(ultima && (ultima.ds?.tag || ultima.ds?.commit) !== (s.ds?.tag || s.ds?.commit));
  const extras = [];
  if (cambioDs) extras.push(`Sistema de diseño ${ultima.ds?.tag || ultima.ds?.commit || '—'} → ${s.ds?.tag || s.ds?.commit || '—'}`);
  else if (cambioRecursos) extras.push('Recursos compartidos actualizados');
  let notas;
  if (!ultima) notas = `Primera versión publicada de «${f.nombre}».` + (frases.length ? ` Incluye: ${frases.slice(0, 6).join('; ')}.` : '');
  else notas = `Cambios desde la v${ultima.version}: ${[...frases.slice(0, 8), ...extras].join('; ') || 'ajustes menores en el flujo'}.`;

  let propuesta; let criterio;
  const tipo = opt.tipo;
  if (tipo && !['patch', 'minor', 'major'].includes(tipo)) salir({ ...base, bloqueada: true, motivo: '--tipo debe ser patch, minor o major.' }, 1);
  if (!ultima) { propuesta = SEMVER.test(f.version) ? f.version : '0.1.0'; criterio = `primera versión; toma la declarada en catalogo.json (${propuesta})`; }
  else if (tipo) { propuesta = sumar(ultima.version, tipo); criterio = `tipo solicitado: ${tipo}`; }
  else if (relevantes.some((c) => /^feat/i.test(c.mensaje))) { propuesta = sumar(ultima.version, 'minor'); criterio = 'incluye funcionalidad nueva (feat) → minor'; }
  else { propuesta = sumar(ultima.version, 'patch'); criterio = 'solo correcciones o ajustes → patch'; }

  const totalActual = tamano(ALMACEN);
  const nuevoBytes = s.bytesPropios + (s.reutiliza ? 0 : s.bytesComunes);
  const alerta = nuevoBytes >= UMBRAL_BYTES || (totalActual > 0 && nuevoBytes > 1048576 && nuevoBytes > totalActual * 0.5);
  const comando = `npm run version-flujo -- ${id} ${propuesta} --notas ${JSON.stringify(notas)} --aprobado-por "<quién aprueba>" --actualizar-catalogo`;
  salir({
    ...base, bloqueada: false, propuesta, criterio, commit: s.commitInfo.corto, ds: s.ds ? (s.ds.tag || 'commit ' + s.ds.commit) : null, cambioDs,
    notas, notasRevisar: !frases.length && !extras.length, commits,
    almacenamiento: {
      nuevoBytes, propios: s.bytesPropios, comunes: s.bytesComunes, recursos: s.reutiliza ? 'reutilizados' : 'nuevos', totalActual, alerta,
      motivoAlerta: alerta ? `la versión agrega ${mb(nuevoBytes)} al almacén (umbral ${mb(UMBRAL_BYTES)} o más de la mitad de lo almacenado).` : null,
    },
    enlacesExternos: [...new Set(s.enlacesExternos.map((e) => e.hacia))], comando,
  });
} finally { s.liberar(); }
