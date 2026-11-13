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
test('Restricciones Figma MCP (nombres reales)',()=>{
 const f=read('IA-Central/agentes/figma-mcp.json');const pre=process.env.COMPENSAR_FIGMA_MCP_PREFIX||f.claude.prefijo;
 const W=[...f.escritura_con_aprobacion,...f.escritura_bloqueada];
 const st=read('.claude/settings.json').permissions;
 for(const t of f.escritura_bloqueada)if(!st.deny.includes(pre+t))throw Error('settings.json no bloquea '+pre+t);
 for(const t of f.escritura_con_aprobacion)if(!st.ask.includes(pre+t))throw Error('settings.json no pide aprobación para '+pre+t);
 if([...st.deny,...st.ask,...(st.allow||[])].some(r=>r.startsWith('mcp__Figma__')))throw Error('quedan reglas con el prefijo obsoleto mcp__Figma__');
 for(const a of m){
  const md=fs.readFileSync(path.join(root,'.claude/agents',a.slug+'.md'),'utf8');const tools=(md.match(/^tools: (.*)$/m)||[,''])[1].split(', ');
  const ws=tools.filter(t=>W.some(w=>t===pre+w));
  if(a.permisos.figma!=='escritura_con_aprobacion'&&ws.length)throw Error(a.slug+' tiene escritura Figma: '+ws.join(', '));
  if(tools.some(t=>f.escritura_bloqueada.some(w=>t===pre+w)))throw Error(a.slug+' tiene una herramienta Figma bloqueada');
  const k=read('.kiro/agents/'+a.slug+'.json');
  if(k.tools.includes('@mcp'))throw Error(a.slug+' (Kiro) aún usa @mcp');
  const kw=k.tools.filter(t=>W.some(w=>t==='@'+f.kiro.servidor+'/'+w));
  if(a.permisos.figma!=='escritura_con_aprobacion'&&kw.length)throw Error(a.slug+' (Kiro) tiene escritura Figma');
  if(kw.length&&!k.permissions.rules.some(r=>r.capability==='mcp'&&r.effect==='ask'&&kw.every(t=>r.match.includes(t.slice(1)))))throw Error(a.slug+' (Kiro) escritura Figma sin ask');
 }
 const fb=fs.readFileSync(path.join(root,'.claude/agents/compensar-figma-bridge.md'),'utf8');
 if(/^tools:.*\b(Bash|Write|Edit|Agent)\b/m.test(fb))throw Error('compensar-figma-bridge debe ser solo consulta');
});
console.log(`\n${failures?'FALLÓ':'APROBADO'}: ${failures} validaciones fallidas`);
process.exitCode=failures?1:0;
