#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
let failures=0;
function test(label,fn){try{fn();console.log('OK',label);}catch(e){failures++;console.error('ERROR',label,':',e.message);}}
const m=read('IA-Central/agentes/manifest.json');
test('11 agentes únicos',()=>{if(m.length!==11 || new Set(m.map(x=>x.slug)).size!==11)throw Error('Requiere exactamente 11 agentes diferentes');});
for(const a of m){test('Fuente '+a.slug,()=>{const f=path.join(root,'IA-Central/agentes',a.slug+'.md');if(!fs.existsSync(f)||fs.statSync(f).size<100)throw Error('inexistente o vacía');});}
const reg=read('IA-Central/seguimiento/registro.json');
test('Registro central',()=>{for(const k of ['flujos','componentes','decisiones','pendientes','entregas','eventos'])if(!Array.isArray(reg[k]))throw Error(k+' no es lista');if(!reg.schemaVersion)throw Error('sin schemaVersion');});
test('Catálogo DS',()=>{const c=read('IA-Central/componentes/catalogo.json');if(!Array.isArray(c.componentes))throw Error('falta lista');});
const s=spawnSync(process.execPath,[path.join(root,'IA-Central/scripts/generar-adaptadores.mjs')],{cwd:root,encoding:'utf8'});
test('Adaptadores Claude + Kiro y skills',()=>{if(s.status!==0)throw Error((s.stderr||s.stdout).trim());});
console.log(`\n${failures?'FALLÓ':'APROBADO'}: ${failures} validaciones fallidas`);
process.exitCode=failures?1:0;
