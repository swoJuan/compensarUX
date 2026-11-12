#!/usr/bin/env node
/**
 * ds-sync.mjs — Sincronización VERSIONADA del sistema de diseño hacia los prototipos.
 *
 * Copia los archivos del sistema de diseño a los prototipos SOLO desde un tag
 * (o un commit, si se autoriza explícitamente), nunca desde la carpeta de
 * trabajo. Registra la versión usada en shared/vendor/ds-version.json.
 *
 *   node ds-sync.mjs --ref v2.2.0                 Plan: qué cambiaría (no escribe nada)
 *   node ds-sync.mjs --ref v2.2.0 --aplicar       Copia los archivos y escribe ds-version.json
 *   node ds-sync.mjs --verificar                  Comprueba que nadie editó a mano la copia
 *
 * Opciones: --ds <ruta>  --flujos <ruta>  (por defecto, carpetas hermanas de Compensar/)
 *           --permitir-sin-tag  acepta un commit sin tag (solo para pruebas)
 *
 * No hace commit: al terminar muestra los comandos para que UX revise y confirme.
 * Sin dependencias. Lee el sistema de diseño con `git show`/`git ls-tree` (solo lectura).
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, def) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : def; };
const flag = (n) => process.argv.includes(n);
const COMPENSAR = path.resolve(AQUI, '..', '..', '..');
const DS = path.resolve(arg('--ds', path.join(COMPENSAR, 'Core-Design-System')));
const FLUJOS = path.resolve(arg('--flujos', path.join(COMPENSAR, 'Flujos', 'prototipos')));
const REF = arg('--ref');
const REGISTRO = 'shared/vendor/ds-version.json';

// Archivos que los prototipos consumen del sistema de diseño (lo mismo que copia sync-flows.mjs)
const MAPA = [
  { ds: 'css/core.css', flujos: 'shared/vendor/core.css' },
  { ds: 'css/portal.css', flujos: 'shared/vendor/portal.css' },
  { ds: 'icons/icons.css', flujos: 'shared/icons/icons.css' },
  { ds: 'js/mp-tabs.js', flujos: 'shared/vendor/mp-tabs.js' },
  { dsDir: 'icons/fonts', flujos: 'shared/icons/fonts' },
];

const git = (repo, args, enc = 'utf8') => execFileSync('git', ['-C', repo, '--no-optional-locks', ...args], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] }).toString(enc);
const gitBuf = (repo, args) => execFileSync('git', ['-C', repo, '--no-optional-locks', ...args], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });
// El sistema de diseño es una carpeta dentro del repositorio único. En "<ref>:<ruta>" git
// espera la ruta desde la raíz del repositorio, así que se antepone esa subcarpeta.
const PREFIJO = (() => { try { return git(DS, ['rev-parse', '--show-prefix']).trim().replace(/\/?$/, ''); } catch { return ''; } })();
const enRepo = (f) => (PREFIJO ? `${PREFIJO}/${f}` : f);
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const leer = (p) => { try { return fs.readFileSync(p); } catch { return null; } };

function archivosDeRef(ref) {
  const lista = [];
  for (const m of MAPA) {
    if (m.dsDir) {
      const nombres = git(DS, ['ls-tree', '-r', '--name-only', ref, '--', m.dsDir]).split('\n').filter(Boolean);
      for (const n of nombres) lista.push({ ds: n, flujos: path.posix.join(m.flujos, path.posix.relative(m.dsDir, n)) });
    } else lista.push({ ds: m.ds, flujos: m.flujos });
  }
  return lista.map((f) => { const buf = gitBuf(DS, ['show', `${ref}:${enRepo(f.ds)}`]); return { ...f, buf, sha256: sha(buf) }; });
}

/* ---------- Verificar ---------- */
if (flag('--verificar')) {
  const reg = leer(path.join(FLUJOS, REGISTRO));
  if (!reg) { console.log(`✗ No existe ${REGISTRO}: los prototipos todavía no usan una versión registrada del sistema de diseño.`); process.exit(2); }
  const r = JSON.parse(reg);
  const alterados = r.archivos.filter((a) => { const b = leer(path.join(FLUJOS, a.destino)); return !b || sha(b) !== a.sha256; });
  console.log(`Prototipos registrados con el sistema de diseño ${r.ds.tag || r.ds.commit} (${r.ds.fecha.slice(0, 10)}), sincronizado el ${r.sincronizado.slice(0, 10)}.`);
  if (alterados.length) { console.log(`✗ ${alterados.length} archivos no coinciden con el registro (editados a mano o incompletos):`); alterados.forEach((a) => console.log('   ' + a.destino)); process.exit(1); }
  console.log(`✓ Los ${r.archivos.length} archivos coinciden con la versión registrada.`);
  process.exit(0);
}

/* ---------- Plan / Aplicar ---------- */
if (!REF) { console.error('Indica la versión: --ref <tag>   (por ejemplo --ref v2.2.0)'); process.exit(1); }
let commit;
try { commit = git(DS, ['rev-parse', '--verify', `${REF}^{commit}`]).trim(); } catch { console.error(`✗ No existe la versión "${REF}" en el sistema de diseño.`); process.exit(1); }
let esTag = true;
try { git(DS, ['rev-parse', '--verify', `refs/tags/${REF}`]); } catch { esTag = false; }
if (!esTag && !flag('--permitir-sin-tag')) {
  console.error(`✗ "${REF}" no es un tag. La sincronización solo acepta versiones publicadas con tag.`);
  console.error('  Para una prueba con un commit sin tag, agrega --permitir-sin-tag.');
  process.exit(1);
}
const fecha = git(DS, ['log', '-1', '--format=%cI', commit]).trim();
const corto = commit.slice(0, 7);
const candidatos = archivosDeRef(commit);

console.log(`\nSistema de diseño ${REF}${esTag ? '' : ' (sin tag)'} → ${corto} del ${fecha.slice(0, 10)}`);
const regActual = leer(path.join(FLUJOS, REGISTRO));
if (regActual) { const r = JSON.parse(regActual); console.log(`Versión registrada hoy en los prototipos: ${r.ds.tag || r.ds.commit}`); }
else console.log('Versión registrada hoy en los prototipos: ninguna (no existe ds-version.json)');

let cambian = 0;
for (const c of candidatos) {
  const actual = leer(path.join(FLUJOS, c.flujos));
  const estado = !actual ? 'nuevo' : (sha(actual) === c.sha256 ? 'igual' : 'cambia');
  if (estado !== 'igual') cambian++;
  if (estado !== 'igual' || !c.flujos.includes('/fonts/')) console.log(`  ${estado === 'igual' ? '=' : (estado === 'nuevo' ? '+' : '~')} ${c.flujos}${estado === 'igual' ? '' : `  (${estado})`}`);
}
if (!cambian) console.log('\n✓ Los prototipos ya tienen exactamente esta versión. Nada que hacer.');

if (!flag('--aplicar')) {
  if (cambian) {
    console.log(`\n${cambian} archivo(s) cambiarían. Antes de aplicar, ejecuta la prueba de regresión:`);
    console.log(`  node regresion.mjs --ref ${REF}${esTag ? '' : ' --permitir-sin-tag'}`);
    console.log(`Después, para aplicar:\n  node ds-sync.mjs --ref ${REF} --aplicar${esTag ? '' : ' --permitir-sin-tag'}\n`);
  }
  process.exit(0);
}

// Aplicar: exige que la copia actual no tenga cambios sin commit (para poder revertir con git)
const sucios = git(FLUJOS, ['status', '--porcelain', '--', 'shared/vendor', 'shared/icons']).trim();
if (sucios && !flag('--forzar')) {
  console.error('\n✗ Los prototipos tienen cambios sin commit en shared/vendor o shared/icons:');
  console.error(sucios.split('\n').map((l) => '   ' + l).join('\n'));
  console.error('  Confírmalos o descártalos primero (o usa --forzar).');
  process.exit(1);
}
for (const c of candidatos) {
  const destino = path.join(FLUJOS, c.flujos);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, c.buf);
}
const registro = {
  $comentario: 'Generado por ds-sync.mjs. No editar a mano: indica qué versión del sistema de diseño usan los prototipos.',
  ds: { tag: esTag ? REF : null, ref: REF, commit, fecha },
  sincronizado: new Date().toISOString(),
  archivos: candidatos.map((c) => ({ origen: c.ds, destino: c.flujos, sha256: c.sha256 })),
};
fs.writeFileSync(path.join(FLUJOS, REGISTRO), JSON.stringify(registro, null, 2) + '\n');
console.log(`\n✓ Prototipos actualizados con el sistema de diseño ${REF} y registrado en ${REGISTRO} (sin commit).`);
console.log('  Revisa los prototipos y, si todo está bien, confirma:');
console.log(`  git -C "${FLUJOS}" add shared/vendor shared/icons`);
console.log(`  git -C "${FLUJOS}" commit -m "DS · Sincronizar con el sistema de diseño ${REF}"`);
console.log('  Para deshacer antes del commit:');
console.log(`  git -C "${FLUJOS}" restore shared/vendor shared/icons && git -C "${FLUJOS}" clean -f shared/vendor/ds-version.json\n`);
