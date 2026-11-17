/**
 * Escenarios del flujo «guardar cambios / publicar versión» de extremo a extremo, sobre un CLON
 * temporal del repositorio (sin remoto: no hay forma de hacer push). Usa el código actual de
 * Flujos/portal/scripts e IA-Central superpuesto al clon. No toca el repositorio real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'escenarios-'));
const C = path.join(TMP, 'clon');
const PORTAL = path.join(C, 'Flujos', 'portal');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('PORTAL_')));
const sh = (cmd, args, cwd = C) => spawnSync(cmd, args, { cwd, env, encoding: 'utf8' });
const git = (...a) => sh('git', a);
const nodo = (script, ...a) => sh('node', [path.join('scripts', script), ...a], PORTAL);
const rama = spawnSync('git', ['-C', REPO, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const ID = 'flujo-prueba';
const dirFlujo = path.join(C, 'Flujos/prototipos/zt', ID);
const versiones = path.join(C, 'Flujos/versiones', ID);

test.before(() => {
  const r = spawnSync('git', ['clone', '-q', '--local', '--no-hardlinks', '--branch', rama === 'HEAD' ? 'main' : rama, REPO, C], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  git('remote', 'remove', 'origin'); // sin remoto: imposible hacer push desde la prueba
  git('config', 'user.name', 'Prueba'); git('config', 'user.email', 'prueba@example.com');
  // El clon trae lo confirmado; se superpone el código actual de las herramientas y de los agentes.
  fs.cpSync(path.join(REPO, 'Flujos/portal/scripts'), path.join(PORTAL, 'scripts'), { recursive: true });
  fs.cpSync(path.join(REPO, 'Flujos/portal/package.json'), path.join(PORTAL, 'package.json'));
  // Los cambios de las herramientas no forman parte de la prueba: se confirman para dejar el clon limpio.
  git('add', '-A', '--', 'Flujos/portal'); git('commit', '-q', '-m', 'base de prueba', '--allow-empty');
});
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const escribirFlujo = (extra = '') => {
  fs.mkdirSync(path.join(dirFlujo, 'css'), { recursive: true });
  fs.writeFileSync(path.join(dirFlujo, 'index.html'), `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Flujo de prueba</title>
<link rel="stylesheet" href="../../shared/vendor/core.css">
<link rel="stylesheet" href="../shared/zt.css">
<link rel="stylesheet" href="css/custom.css"></head>
<body><img src="../../shared/assets/logo.svg" alt="Compensar"><h1>Flujo de prueba</h1>${extra}</body></html>
`);
  fs.writeFileSync(path.join(dirFlujo, 'css/custom.css'), 'h1 { margin: 0; }\n');
};
const ultimoCommit = () => git('show', '--name-only', '--format=%s', 'HEAD').stdout.trim().split('\n');
const nRecursos = () => fs.readdirSync(path.join(C, 'Flujos/versiones/_recursos')).filter((d) => !d.startsWith('.')).length;
const huellas = (dir) => spawnSync('sh', ['-c', `find "${dir}" -type f | sort | xargs shasum`], { encoding: 'utf8' }).stdout;

test('1. Crear un flujo nuevo: queda registrado, sin versiones ni publicación', () => {
  const r = nodo('registrar-flujo.mjs', '--id', ID, '--nombre', 'Flujo de prueba', '--plataforma', 'zt', '--ruta', `zt/${ID}/`, '--descripcion', 'Prueba automatizada');
  assert.equal(r.status, 0, r.stderr);
  const cat = JSON.parse(fs.readFileSync(path.join(PORTAL, 'catalogo.json'), 'utf8'));
  const f = cat.flujos.find((x) => x.id === ID);
  assert.deepEqual([f.version, f.estado, f.publicar], ['0.1.0', 'borrador', false]);
  assert.ok(!fs.existsSync(versiones), 'no se crea historial hasta la primera publicación aprobada');
  assert.notEqual(nodo('registrar-flujo.mjs', '--id', ID, '--nombre', 'x', '--plataforma', 'zt', '--ruta', 'zt/otro/').status, 0, 'no se duplica el id');
  escribirFlujo();
  // Otro trabajo pendiente en un flujo distinto: no debe mezclarse.
  fs.appendFileSync(path.join(C, 'Flujos/prototipos/zt/historia-clinica/css/custom.css'), '\n/* ajuste ajeno */\n');
  const e = JSON.parse(nodo('guardar.mjs', 'estado', '--json').stdout);
  assert.ok(e[ID].some((x) => x.endsWith('catalogo.json')) && e[ID].some((x) => x.endsWith('index.html')));
  assert.ok(e['zt-historia-clinica'], 'el cambio ajeno está en su propio ámbito');
});

test('2. Guardar un commit sin publicar versión', () => {
  fs.writeFileSync(path.join(dirFlujo, '.env'), 'X=1\n');
  assert.notEqual(nodo('guardar.mjs', 'commit', ID, '-m', 'feat(zt): flujo de prueba').status, 0, 'archivos sensibles no se confirman');
  fs.rmSync(path.join(dirFlujo, '.env'));
  git('add', 'Flujos/prototipos/zt/historia-clinica');
  assert.notEqual(nodo('guardar.mjs', 'commit', ID, '-m', 'feat(zt): flujo de prueba').status, 0, 'no confirma con otros archivos preparados');
  git('reset', '-q');
  const r = nodo('guardar.mjs', 'commit', ID, '-m', 'feat(zt): flujo de prueba');
  assert.equal(r.status, 0, r.stderr);
  const archivos = ultimoCommit().slice(1).filter(Boolean);
  assert.ok(archivos.every((a) => a.includes(`zt/${ID}/`) || a.endsWith('portal/catalogo.json')), archivos.join(', '));
  assert.ok(!archivos.some((a) => a.includes('historia-clinica')), 'no mezcla otro flujo');
  assert.ok(git('status', '--short').stdout.includes('historia-clinica'), 'el cambio ajeno sigue pendiente');
  assert.ok(!fs.existsSync(versiones), 'un commit NO crea versión ni snapshot');
  assert.equal(git('remote').stdout.trim(), '', 'sin remoto');
  assert.equal(nodo('guardar.mjs', 'commit', 'zt-historia-clinica', '-m', 'fix(zt): ajuste').status, 0);
});

test('3. Solicitar una publicación y recibir una propuesta (solo lectura)', () => {
  fs.appendFileSync(path.join(dirFlujo, 'css/custom.css'), '/* sin confirmar */\n');
  const bloq = nodo('version-propuesta.mjs', ID, '--json');
  assert.equal(bloq.status, 2);
  assert.equal(JSON.parse(bloq.stdout).bloqueada, true, 'con cambios sin confirmar no se puede proponer publicar');
  git('checkout', '--', 'Flujos/prototipos');
  const antes = git('status', '--short').stdout;
  const r = nodo('version-propuesta.mjs', ID, '--json');
  assert.equal(r.status, 0, r.stderr);
  const p = JSON.parse(r.stdout);
  assert.equal(p.bloqueada, false);
  assert.equal(p.propuesta, '0.1.0');
  assert.match(p.notas, /Primera versión publicada/);
  assert.ok(p.almacenamiento.nuevoBytes > 0 && typeof p.almacenamiento.alerta === 'boolean');
  assert.match(p.comando, /--aprobado-por/);
  assert.equal(git('status', '--short').stdout, antes, 'la propuesta no escribe nada');
  assert.ok(!fs.existsSync(versiones));
});

test('4. Rechazar la propuesta: no se publica nada', () => {
  const sinAprobacion = nodo('version-flujo.mjs', ID, '0.1.0', '--notas', 'x');
  assert.notEqual(sinAprobacion.status, 0, 'sin aprobación explícita no se publica');
  assert.ok(!fs.existsSync(versiones));
  assert.equal(git('status', '--short', 'Flujos/versiones').stdout.trim(), '');
  const listado = JSON.parse(nodo('guardar.mjs', 'estado', '--json').stdout);
  assert.deepEqual(Object.keys(listado).filter((k) => k.startsWith('version:')), []);
});

test('5. Aprobar la publicación y abrir la versión desde el portal', { timeout: 240000 }, () => {
  const r = nodo('version-flujo.mjs', ID, '0.1.0', '--notas', 'Primera versión de prueba.', '--aprobado-por', 'Director UX (prueba)', '--actualizar-catalogo');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const m = JSON.parse(fs.readFileSync(path.join(versiones, 'v0.1.0/manifest.json'), 'utf8'));
  assert.equal(m.aprobacionPublicacion.por, 'Director UX (prueba)');
  const c = nodo('guardar.mjs', 'commit-version', ID);
  assert.equal(c.status, 0, c.stderr);
  const archivos = ultimoCommit().slice(1).filter(Boolean);
  assert.ok(archivos.every((a) => a.startsWith('Flujos/versiones/')), archivos.join(', '));
  const v = nodo('verificar-version.mjs', ID, '0.1.0');
  assert.equal(v.status, 0, v.stdout + v.stderr);
  assert.match(v.stdout, /la versión abre/);
});

test('6. Segunda versión: propone el siguiente número y no toca la anterior', { timeout: 240000 }, () => {
  const antes = huellas(versiones);
  const recursosAntes = nRecursos();
  escribirFlujo('<p>Cambio nuevo</p>');
  assert.equal(nodo('guardar.mjs', 'commit', ID, '-m', 'feat(zt): agrega un párrafo al flujo de prueba').status, 0);
  const p = JSON.parse(nodo('version-propuesta.mjs', ID, '--json').stdout);
  assert.equal(p.propuesta, '0.2.0', 'feat → minor');
  assert.match(p.notas, /Cambios desde la v0\.1\.0/);
  const r = nodo('version-flujo.mjs', ID, p.propuesta, '--notas', p.notas, '--aprobado-por', 'Director UX (prueba)', '--actualizar-catalogo');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const cat = JSON.parse(fs.readFileSync(path.join(PORTAL, 'catalogo.json'), 'utf8'));
  assert.equal(cat.flujos.find((x) => x.id === ID).version, '0.2.0');
  assert.equal(nodo('guardar.mjs', 'commit-version', ID).status, 0);
  const despues = huellas(versiones);
  for (const linea of antes.split('\n').filter(Boolean)) assert.ok(despues.includes(linea), 'una versión anterior cambió: ' + linea);
  assert.equal(nRecursos(), recursosAntes, 'recursos idénticos se reutilizan: no se duplican por versión');
  const sinCambios = nodo('version-propuesta.mjs', ID, '--json');
  assert.equal(sinCambios.status, 2, 'sin cambios no hay nada que publicar');
  const v = nodo('verificar-version.mjs', ID, '0.2.0');
  assert.equal(v.status, 0, v.stdout + v.stderr);
});
