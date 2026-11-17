#!/usr/bin/env node
/**
 * verificar-version.mjs — Comprueba que una versión publicada aparece en el portal y se abre.
 * Construye el portal en una carpeta TEMPORAL (no toca sitio/ ni el almacén), lo sirve en local
 * y recorre: catálogo → historial del flujo → entrada de la versión y sus recursos.
 *
 *   node scripts/verificar-version.mjs <id-flujo> <x.y.z>
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, readJson } from './lib/fuentes.mjs';
import { listarVersiones, verificarAlmacen, verificarCatalogo } from './lib/versiones.mjs';

const [id, version] = process.argv.slice(2);
if (!id || !version) { console.error('Uso: node scripts/verificar-version.mjs <id-flujo> <x.y.z>'); process.exit(1); }
const resultados = [];
const ok = (c, msg) => { resultados.push({ c, msg }); console.log(`${c ? '✓' : '✗'} ${msg}`); };

const errAlm = [...verificarAlmacen(), ...verificarCatalogo(readJson('catalogo.json'))];
ok(!errAlm.length, 'almacén íntegro y catálogo coherente' + (errAlm.length ? ': ' + errAlm.join(' | ') : ''));
const m = listarVersiones(id).find((v) => v.version === version);
ok(!!m, `la v${version} existe en el almacén de ${id}`);
if (!m) process.exit(1);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verificar-version-'));
let server;
try {
  const env = { ...process.env, PORTAL_DIST: tmp };
  const b = spawnSync('node', ['scripts/build.mjs'], { cwd: ROOT, env, encoding: 'utf8' });
  ok(b.status === 0, 'build del portal' + (b.status ? ': ' + (b.stderr || b.stdout).split('\n').slice(0, 4).join(' ') : ''));
  if (b.status !== 0) process.exit(1);
  const c = spawnSync('node', ['scripts/check.mjs'], { cwd: ROOT, env, encoding: 'utf8' });
  ok(c.status === 0, 'check: sin referencias rotas');

  const cat = JSON.parse(fs.readFileSync(path.join(tmp, 'catalogo.json'), 'utf8'));
  const fl = cat.flujos.find((x) => x.id === id);
  const v = (fl?.versiones || []).find((x) => x.version === version);
  ok(!!v, `la v${version} figura en el historial del flujo (catalogo.json)`);
  if (!v) process.exit(1);
  const esUltima = fl.versiones[0].version === version;
  ok(!esUltima || v.vigente === (fl.version === version), 'marca de «vigente» coherente con el catálogo');

  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    let f = path.join(tmp, p);
    if (!f.startsWith(tmp)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200); res.end(d); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const get = async (u) => (await fetch(new URL(u, base))).status;
  ok(await get(`flujo.html`) === 200 && await get('catalogo.json') === 200, 'el portal responde (flujo.html y catalogo.json)');
  const urlEntrada = base + v.url;
  const st = await fetch(urlEntrada);
  ok(st.status === 200, `la versión abre: ${v.url}`);
  const html = await st.text();
  const refs = [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\b(?:src|href)\s*=\s*["']([^"'#?]+)/gi)].map((x) => x[1]).filter((r) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|javascript)/i.test(r));
  const rotos = [];
  for (const r of new Set(refs)) { const s = await get(new URL(r, urlEntrada).toString()); if (s !== 200) rotos.push(`${r} → ${s}`); }
  ok(!rotos.length, `recursos de la entrada (${new Set(refs).size}) responden 200` + (rotos.length ? ': ' + rotos.join(', ') : ''));
  const raizV = v.url.slice(0, v.url.indexOf(m.entrada));
  ok(await get(raizV + 'shared/vendor/core.css') === 200, 'conserva el sistema de diseño de esa versión (shared/vendor/core.css)');
  ok(await get(fl.url || '') === 200 || !fl.publicado, 'la versión vigente (p/) sigue disponible');
} finally {
  if (server) server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
const fallos = resultados.filter((r) => !r.c).length;
console.log(fallos ? `\n✗ ${fallos} comprobación(es) fallida(s).` : '\n✓ La versión aparece en el historial y se abre correctamente.');
process.exit(fallos ? 1 : 0);
