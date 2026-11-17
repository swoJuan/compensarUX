#!/usr/bin/env node
/** Verifica la integridad del almacén de versiones y su coherencia con catalogo.json. Solo lee. */
import { readJson } from './lib/fuentes.mjs';
import { ALMACEN, idsAlmacen, listarVersiones, verificarAlmacen, verificarCatalogo } from './lib/versiones.mjs';
const errores = [...verificarAlmacen(), ...verificarCatalogo(readJson('catalogo.json'))];
const ids = idsAlmacen();
console.log(`Almacén: ${ALMACEN}`);
for (const id of ids) console.log(`  ${id}: ${listarVersiones(id).map((v) => 'v' + v.version).join(', ') || '—'}`);
if (!ids.length) console.log('  (sin versiones publicadas todavía)');
if (errores.length) { console.error('\n✗ Problemas:\n  ' + errores.join('\n  ')); process.exit(1); }
console.log('✓ Versiones íntegras e inmutables.');
