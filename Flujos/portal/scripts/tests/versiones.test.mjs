/**
 * Pruebas del sistema de versiones. Usan una copia temporal del almacén y una salida
 * temporal: no tocan Flujos/versiones/ ni sitio/. Uso: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL = path.resolve(ROOT, '..', 'versiones');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'test-versiones-'));
const ALM = path.join(TMP, 'almacen');
const OUT = path.join(TMP, 'salida');
fs.cpSync(REAL, ALM, { recursive: true });
process.env.PORTAL_VERSIONES = ALM;
const env = { ...process.env, PORTAL_VERSIONES: ALM, PORTAL_DIST: OUT };
const node = (script, args = []) => spawnSync('node', [path.join('scripts', script), ...args], { cwd: ROOT, env, encoding: 'utf8' });
const V = await import('../lib/versiones.mjs');

function foto(dir) {
  const r = {};
  const rec = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); e.isDirectory() ? rec(f) : (r[path.relative(dir, f)] = V.sha256(fs.readFileSync(f))); } };
  rec(dir);
  return r;
}
const ID = 'zt-agendamiento-de-citas';

test('el almacén real está íntegro', () => {
  assert.deepEqual(V.verificarAlmacen(), []);
  assert.ok(V.listarVersiones(ID).length >= 1);
});

test('el catálogo debe coincidir con la última versión publicada', () => {
  const ultima = V.listarVersiones(ID)[0];
  const cat = (version) => ({ flujos: [{ id: ID, version, plataforma: 'zt' }] });
  assert.deepEqual(V.verificarCatalogo(cat(ultima.version)), []);
  assert.equal(V.verificarCatalogo(cat('9.9.9')).length, 1, 'una versión distinta (mayor) es discrepancia');
  assert.equal(V.verificarCatalogo(cat('0.0.1')).length, 1, 'una versión menor es discrepancia');
  assert.equal(V.verificarCatalogo({ flujos: [{ id: ID, version: ultima.version, plataforma: 'app' }] }).length, 1, 'plataforma distinta');
});

test('el build no modifica ni borra versiones y arma la versión navegable', () => {
  const antes = foto(ALM);
  for (let i = 0; i < 2; i++) {
    const r = node('build.mjs');
    assert.equal(r.status, 0, r.stderr);
  }
  assert.deepEqual(foto(ALM), antes, 'el almacén cambió tras el build');
  const ultima = V.listarVersiones(ID)[0];
  const raiz = path.join(OUT, 'versiones', ID, `v${ultima.version}`);
  assert.ok(fs.existsSync(path.join(OUT, 'p', 'zt', 'agendamiento-de-citas', 'index.html')), 'la vigente sigue publicada');
  assert.ok(fs.existsSync(path.join(raiz, ultima.entrada)), 'la entrada de la versión existe');
  assert.ok(fs.existsSync(path.join(raiz, 'shared/vendor/core.css')), 'conserva el sistema de diseño exacto');
  const cat = JSON.parse(fs.readFileSync(path.join(OUT, 'catalogo.json'), 'utf8'));
  const vs = cat.flujos.find((f) => f.id === ID).versiones;
  assert.equal(vs[0].version, ultima.version);
  assert.equal(vs[0].vigente, true);
});

test('«Inicio» de la versión regresa al portal y las demás salidas van a la vigente', () => {
  const ultima = V.listarVersiones(ID)[0];
  const raiz = path.join(OUT, 'versiones', ID, `v${ultima.version}`);
  for (const r of ['zt/index.html', 'zt/inicio/index.html']) {
    const t = fs.readFileSync(path.join(raiz, r), 'utf8');
    const m = /location\.replace\("([^"]+)"\)/.exec(t);
    assert.ok(m, `${r} redirige`);
    assert.equal(path.resolve(path.dirname(path.join(raiz, r)), m[1]), path.join(OUT, 'index.html'), `${r} → portal principal`);
  }
  const t = fs.readFileSync(path.join(raiz, 'zt/historia-clinica/index.html'), 'utf8');
  assert.match(t, /\/p\/zt\/historia-clinica\/index\.html|p\/zt\/historia-clinica\/index\.html/);
  // Los archivos propios de la versión no se reemplazan por redirecciones.
  const propio = fs.readFileSync(path.join(raiz, ultima.entrada), 'utf8');
  assert.doesNotMatch(propio, /Saliendo de la versión/);
});

test('npm run check: sin referencias rotas', () => {
  const r = node('check.mjs');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('una versión alterada cancela el build sin borrar la salida', () => {
  const ultima = V.listarVersiones(ID)[0];
  const f = path.join(ALM, ID, `v${ultima.version}`, 'archivos', ultima.entrada);
  const original = fs.readFileSync(f);
  fs.appendFileSync(f, '<!-- alterado -->');
  try {
    assert.ok(V.verificarAlmacen().length > 0);
    const r = node('build.mjs');
    assert.notEqual(r.status, 0);
    assert.ok(fs.existsSync(path.join(OUT, 'index.html')), 'la salida anterior sigue ahí');
  } finally { fs.writeFileSync(f, original); }
  assert.deepEqual(V.verificarAlmacen(), []);
});

test('el build rechaza una salida dentro del almacén', () => {
  const r = spawnSync('node', ['scripts/build.mjs'], { cwd: ROOT, env: { ...env, PORTAL_DIST: path.join(ALM, 'x') }, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.ok(fs.existsSync(path.join(ALM, ID)), 'el almacén sigue intacto');
});

test('publicar una versión nueva no altera las anteriores y respeta la inmutabilidad', (t) => {
  const pend = spawnSync('git', ['-C', path.join(ROOT, '..', 'prototipos'), 'status', '--porcelain', '--', '.'], { encoding: 'utf8' }).stdout.trim();
  if (pend) return t.skip('Flujos/prototipos tiene cambios sin confirmar: no se puede publicar desde un commit');
  const antes = foto(ALM);
  const ultima = V.listarVersiones(ID)[0];
  const [a, b, c] = ultima.version.split('.').map(Number);
  const nueva = `${a}.${b}.${c + 1}`;
  const ok = node('version-flujo.mjs', [ID, nueva, '--notas', 'prueba automatizada']);
  assert.equal(ok.status, 0, ok.stderr + ok.stdout);
  const despues = foto(ALM);
  for (const [k, h] of Object.entries(antes)) assert.equal(despues[k], h, `cambió ${k}`);
  assert.ok(Object.keys(despues).length > Object.keys(antes).length);
  const recursos = fs.readdirSync(path.join(ALM, '_recursos'));
  assert.equal(recursos.length, 1, 'recursos idénticos se reutilizan, no se duplican');
  assert.notEqual(node('version-flujo.mjs', [ID, nueva, '--notas', 'x']).status, 0, 'no se puede repetir');
  assert.notEqual(node('version-flujo.mjs', [ID, ultima.version, '--notas', 'x']).status, 0, 'no se puede reutilizar una anterior');
  assert.notEqual(node('version-flujo.mjs', [ID, `${a}.${b}.${c + 2}`]).status, 0, 'exige notas');
  // El catálogo (0.1.0) ya no coincide con la última publicada: el build debe avisarlo.
  assert.notEqual(node('build.mjs').status, 0, 'catálogo desfasado respecto a la última versión');
});

test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));
