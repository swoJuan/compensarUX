#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const r=JSON.parse(fs.readFileSync(path.join(root,'IA-Central/seguimiento/registro.json'),'utf8'));
console.log('COMPENSAR — Estado documentado');
console.log('Verificación general:',r.ultimaVerificacion||'NO AUDITADO');
console.log('Fase:',r.estado);
for (const key of ['flujos','componentes','decisiones','pendientes','entregas','eventos']){
 const arr=Array.isArray(r[key])?r[key]:[];
 console.log(`\n${key.toUpperCase()} (${arr.length})`);
 for(const item of arr){console.log(' -',item.id||'(sin id)','|',item.estado||'sin estado','|',item.nombre||item.descripcion||'',item.siguientePaso?('| SIGUIENTE: '+item.siguientePaso):'');}
}
if(!r.ultimaVerificacion)console.log('\nATENCIÓN: registro sin auditar. El conteo 0 no significa que el proyecto no tenga pendientes.');
