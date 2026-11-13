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
// Integración Figma MCP: fuente central en IA-Central/agentes/figma-mcp.json
const figmaCfg=JSON.parse(fs.readFileSync(path.join(core,'agentes/figma-mcp.json'),'utf8'));
const FIGMA_PREFIX=process.env.COMPENSAR_FIGMA_MCP_PREFIX||figmaCfg.claude.prefijo;
if(!/^mcp__[A-Za-z0-9_-]+__$/.test(FIGMA_PREFIX)){console.error('Prefijo Figma MCP inválido: '+FIGMA_PREFIX);process.exit(1);}
const KIRO_FIGMA=figmaCfg.kiro.servidor;
const lecturaF=figmaCfg.lectura, escrituraF=figmaCfg.escritura_con_aprobacion, bloqueadaF=figmaCfg.escritura_bloqueada;
{const all=[...lecturaF,...escrituraF,...bloqueadaF];const dup=all.filter((t,i)=>all.indexOf(t)!==i);if(dup.length){console.error('Herramienta Figma clasificada dos veces: '+dup.join(', '));process.exit(1);}}
const cn=(t)=>FIGMA_PREFIX+t;
const FIGMA_R=lecturaF.map(cn), FIGMA_W=escrituraF.map(cn), FIGMA_BLOCK=bloqueadaF.map(cn);
const leeFigma=(p)=>p.figma==='lectura'||p.figma==='escritura_con_aprobacion';
const escribeFigma=(p)=>p.figma==='escritura_con_aprobacion';
// ToolSearch: necesario para cargar herramientas MCP diferidas; solo expone las del propio allowlist.
// Skill: solo para agentes que declaran skills_claude (habilidades/plugins de Claude Code). Kiro no las recibe.
const skillsClaude=(p)=>Array.isArray(p.skills_claude)?p.skills_claude:[];
const claudeTools=(p)=>[...p.tools,...(skillsClaude(p).length?['Skill']:[]),...(leeFigma(p)?['ToolSearch',...FIGMA_R]:[]),...(escribeFigma(p)?FIGMA_W:[])];
// Kiro: herramientas integradas según las herramientas Claude declaradas en el manifest
const kiroBuiltins=(p)=>['read',...(p.tools.some(t=>t==='Write'||t==='Edit')&&p.escritura.length?['write']:[]),...(p.tools.includes('Bash')?['shell']:[]),'web'];
const kiroFigmaTools=(p)=>[...(leeFigma(p)?lecturaF:[]),...(escribeFigma(p)?escrituraF:[])].map(t=>'@'+KIRO_FIGMA+'/'+t);
const kiroRules=(p)=>[
 {capability:'fs_write',match:['*'],effect:'ask'},
 {capability:'shell',match:['*'],effect:'ask'},
 ...(leeFigma(p)?[{capability:'mcp',match:lecturaF.map(t=>KIRO_FIGMA+'/'+t),effect:'allow'}]:[]),
 ...(escribeFigma(p)?[{capability:'mcp',match:escrituraF.map(t=>KIRO_FIGMA+'/'+t),effect:'ask'}]:[]),
 {capability:'mcp',match:['*'],effect:'ask'}
];
const permisosTexto=(p)=>'## Permisos de este agente (generado desde manifest.json)\n- Rol: '+p.rol+'. Figma: '+p.figma+'.\n- Escritura local autorizada: '+(p.escritura.length?p.escritura.join(', '):'ninguna')+'. Fuera de esas rutas no modifiques archivos; propón el cambio al orquestador.\n'+(leeFigma(p)?'- Figma MCP: antes de leer un archivo llama a create_session (fileKey + descripción) y reutiliza el sessionId en cada consulta. '+(escribeFigma(p)?'Las herramientas de escritura piden aprobación del usuario.':'Solo consultas; no tienes herramientas de escritura en Figma.')+'\n':'')+(skillsClaude(p).length?'- Habilidades Claude Code habilitadas (herramienta Skill): '+skillsClaude(p).join(', ')+'. Invócalas con Skill solo cuando la tarea lo justifique; si la invocación falla o no aparece en la lista de skills, continúa sin ella e informa la limitación. Las figma:* (p. ej. figma-use antes de use_figma) siguen siendo obligatorias cuando aplique.\n':'')+'- Commits, push, despliegues, borrados y cambios en Figma requieren aprobación expresa del usuario.\n\n';
function compare(output,text){
 checked++;
 if(fs.existsSync(output) && sourceText(output)===text)return;
 if(!apply){errors.push('Desactualizado o ausente: '+path.relative(root,output));return;}
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,text,'utf8');modified++;
}
for(const agent of manifest){
 const content=sourceText(path.join(core,'agentes',agent.slug+'.md')).trim()+'\n';
 const cl= '---\nname: '+agent.slug+'\ndescription: '+JSON.stringify(agent.description)+'\ntools: '+claudeTools(agent.permisos).join(', ')+'\nmodel: sonnet\n---\n\n<!-- Generado desde IA-Central/agentes; no editar aquí. -->\n\n'+permisosTexto(agent.permisos)+content;
 compare(path.join(root,'.claude/agents',agent.slug+'.md'),cl);
 const isOrq=agent.slug==='compensar-orquestador';
 const allAgents=manifest.filter(x=>x.slug!==agent.slug).map(x=>'subagent/'+x.slug);
 const kiro={name:agent.slug,description:agent.description,prompt:'file://../../IA-Central/agentes/'+agent.slug+'.md',tools:[...kiroBuiltins(agent.permisos),...kiroFigmaTools(agent.permisos),...(isOrq?allAgents:[])],includeMcpJson:true,resources:['file://AGENTS.md','file://IA-Central/contexto/CONTEXTO-BASE.md','file://IA-Central/decisiones/DECISIONES.md','file://IA-Central/seguimiento/README.md','skill://.kiro/skills/*/SKILL.md'],permissions:{rules:kiroRules(agent.permisos)}};
 compare(path.join(root,'.kiro/agents',agent.slug+'.json'),JSON.stringify(kiro,null,2)+'\n');
}
// Permisos de proyecto Claude Code: protege con nombres reales todas las herramientas Figma que escriben.
{
 const sp=path.join(root,'.claude/settings.json');
 const cur=fs.existsSync(sp)?JSON.parse(sourceText(sp)):{};
 const perms=cur.permissions||{};
 const esFigma=(r)=>/^mcp__Figma__/.test(r)||r.startsWith(FIGMA_PREFIX)||/^mcp__[^_]*figma/i.test(r);
 const keep=(arr)=>(arr||[]).filter(r=>!esFigma(r));
 const next={...cur,permissions:{...perms,deny:[...keep(perms.deny),...FIGMA_BLOCK],ask:[...keep(perms.ask),...FIGMA_W]}};
 compare(sp,JSON.stringify(next,null,2)+'\n');
}
for(const name of skillNames){
 const source=sourceText(path.join(core,'skills',name,'SKILL.md'));
 compare(path.join(root,'.claude/skills',name,'SKILL.md'),source);
 compare(path.join(root,'.kiro/skills',name,'SKILL.md'),source);
}
if(errors.length){console.error(errors.join('\n')); console.error('Ejecuta: node IA-Central/scripts/generar-adaptadores.mjs --aplicar (solo tras revisar cambios).');process.exitCode=1;}
else console.log(`Adaptadores y skills: ${checked} comprobados, ${modified} generados/actualizados (${apply?'aplicar':'verificar'}).`);
