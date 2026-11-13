#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here, '../../');
const core=path.join(root,'IA-Central');
const manifest=JSON.parse(fs.readFileSync(path.join(core,'agentes/manifest.json'),'utf8'));
const apply=process.argv.includes('--aplicar');
const skillNames=fs.readdirSync(path.join(core,'skills')).filter(n=>fs.existsSync(path.join(core,'skills',n,'SKILL.md'))).sort();
const errors=[];let checked=0,modified=0;
const sourceText=(p)=>fs.readFileSync(p,'utf8');
function compare(output,text){
 checked++;
 if(fs.existsSync(output) && sourceText(output)===text)return;
 if(!apply){errors.push('Desactualizado o ausente: '+path.relative(root,output));return;}
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,text,'utf8');modified++;
}
for(const agent of manifest){
 const content=sourceText(path.join(core,'agentes',agent.slug+'.md')).trim()+'\n';
 const cl= '---\nname: '+agent.slug+'\ndescription: '+JSON.stringify(agent.description)+'\nmodel: sonnet\n---\n\n<!-- Generado desde IA-Central/agentes; no editar aquí. -->\n\n'+content;
 compare(path.join(root,'.claude/agents',agent.slug+'.md'),cl);
 const isOrq=agent.slug==='compensar-orquestador';
 const allAgents=manifest.filter(x=>x.slug!==agent.slug).map(x=>'subagent/'+x.slug);
 const kiro={name:agent.slug,description:agent.description,prompt:'file://../../IA-Central/agentes/'+agent.slug+'.md',tools:[...(['read','write','shell','web','@mcp']),...(isOrq?allAgents:[])],includeMcpJson:true,resources:['file://AGENTS.md','file://IA-Central/contexto/CONTEXTO-BASE.md','file://IA-Central/decisiones/DECISIONES.md','file://IA-Central/seguimiento/README.md','skill://.kiro/skills/*/SKILL.md'],permissions:{rules:[{capability:'fs_write',match:['*'],effect:'ask'},{capability:'shell',match:['*'],effect:'ask'},{capability:'mcp',match:['*'],effect:'ask'}]}};
 compare(path.join(root,'.kiro/agents',agent.slug+'.json'),JSON.stringify(kiro,null,2)+'\n');
}
for(const name of skillNames){
 const source=sourceText(path.join(core,'skills',name,'SKILL.md'));
 compare(path.join(root,'.claude/skills',name,'SKILL.md'),source);
 compare(path.join(root,'.kiro/skills',name,'SKILL.md'),source);
}
if(errors.length){console.error(errors.join('\n')); console.error('Ejecuta: node IA-Central/scripts/generar-adaptadores.mjs --aplicar (solo tras revisar cambios).');process.exitCode=1;}
else console.log(`Adaptadores y skills: ${checked} comprobados, ${modified} generados/actualizados (${apply?'aplicar':'verificar'}).`);
