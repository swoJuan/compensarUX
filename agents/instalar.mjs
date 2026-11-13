#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const src=path.join(root,'plantilla');
const argv=process.argv.slice(2);
const destinoArg=argv.find(x=>!x.startsWith('--'));
if(!destinoArg){console.error('Uso: node instalar.mjs "/ruta/Compensar" [--aplicar]');process.exit(2);}
const dst=path.resolve(destinoArg);const aplicar=argv.includes('--aplicar');
if(!fs.existsSync(dst)||!fs.statSync(dst).isDirectory()) {console.error('La carpeta de destino no existe:',dst);process.exit(2);}
const files=[];
function scan(directory){for(const d of fs.readdirSync(directory,{withFileTypes:true})){const p=path.join(directory,d.name);if(d.isDirectory())scan(p);else if(d.isFile())files.push(path.relative(src,p));}}
scan(src);let news=0,conflicts=0;
console.log('Destino:',dst,'| modo:', aplicar?'APLICAR SIN SOBRESCRIBIR':'SIMULACIÓN');
for(const rel of files){const target=path.join(dst,rel),origin=path.join(src,rel);
 if(fs.existsSync(target)){
  if(fs.readFileSync(target).equals(fs.readFileSync(origin)))continue;
  console.log('CONFLICTO, se conserva:',rel);conflicts++;continue;
 }
 console.log('NUEVO:',rel);news++;
 if(aplicar){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(origin,target,fs.constants.COPYFILE_EXCL);}
}
console.log(`Resultado: ${news} archivos nuevos ${aplicar?'copiados':'previstos'}, ${conflicts} conflictos NO sobrescritos.`);
if(!aplicar)console.log('Para instalar: agregue --aplicar y revise primero el destino.');
if(conflicts)console.log('Debe revisar/mezclar manualmente archivos existentes, especialmente CLAUDE.md y AGENTS.md.');
