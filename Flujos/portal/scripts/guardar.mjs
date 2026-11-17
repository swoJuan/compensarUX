#!/usr/bin/env node
/**
 * guardar.mjs — Commits por ámbito (flujo, versión, portal…) sin mezclar trabajos.
 *
 *   node scripts/guardar.mjs estado [--json]
 *   node scripts/guardar.mjs commit <ámbito|id-flujo> -m "feat(zt): …"
 *   node scripts/guardar.mjs commit-version <id-flujo> [-m "…"]
 *
 * Solo hace commits LOCALES. Nunca hace push, tag, despliegue ni usa --no-verify.
 * Un commit de desarrollo no publica ninguna versión (eso es version-flujo.mjs).
 */
import { contexto, clasificarTodo, confirmar } from './lib/ambito.mjs';
import { listarVersiones } from './lib/versiones.mjs';

const [cmd, ...resto] = process.argv.slice(2);
const opt = {};
const pos = [];
for (let i = 0; i < resto.length; i++) {
  if (resto[i] === '--json') opt.json = true;
  else if (resto[i] === '-m') opt.m = resto[++i];
  else pos.push(resto[i]);
}
const fallar = (m) => { console.error('✗ ' + m); process.exit(1); };
const ctx = contexto();

if (cmd === 'estado') {
  const { grupos } = clasificarTodo(ctx);
  if (opt.json) { console.log(JSON.stringify(Object.fromEntries(Object.entries(grupos).map(([k, v]) => [k, v.map((x) => x.ruta)])), null, 2)); process.exit(0); }
  const claves = Object.keys(grupos).sort();
  if (!claves.length) { console.log('Sin cambios pendientes.'); process.exit(0); }
  for (const k of claves) {
    const nota = k === 'nara' ? '  (BLOQUEADO)' : k.startsWith('sin-registrar:') ? '  (carpeta nueva: regístrala con registrar-flujo.mjs)' : '';
    console.log(`${k}  ${grupos[k].length} archivo(s)${nota}`);
    for (const x of grupos[k].slice(0, 6)) console.log(`    ${x.estado.trim() || '?'} ${x.ruta}`);
    if (grupos[k].length > 6) console.log(`    … y ${grupos[k].length - 6} más`);
  }
  process.exit(0);
}

if (cmd === 'commit' || cmd === 'commit-version') {
  const id = pos[0];
  if (!id) fallar(`Uso: node scripts/guardar.mjs ${cmd} <${cmd === 'commit' ? 'ámbito' : 'id-flujo'}> -m "mensaje"`);
  let ambito = id;
  let mensaje = opt.m;
  if (cmd === 'commit-version') {
    ambito = `version:${id}`;
    const f = ctx.cat.flujos.find((x) => x.id === id);
    const ultima = listarVersiones(id)[0];
    if (!f || !ultima) fallar(`El flujo ${id} no tiene versiones publicadas pendientes de confirmar.`);
    mensaje ||= `feat(${f.plataforma}): publicar v${ultima.version} de ${f.nombre}`;
  }
  try {
    const r = confirmar(ctx, ambito, mensaje);
    console.log(`✓ Commit ${r.hash} en el ámbito "${ambito}" (${r.archivos.length} archivo(s)). No se hizo push.`);
    const otros = Object.entries(r.restantes);
    if (otros.length) console.log('  Sin tocar (otros ámbitos pendientes): ' + otros.map(([k, n]) => `${k} (${n})`).join(', '));
  } catch (e) { fallar(e.message); }
  process.exit(0);
}
fallar('Uso: guardar.mjs estado [--json] | commit <ámbito> -m "…" | commit-version <id-flujo> [-m "…"]');
