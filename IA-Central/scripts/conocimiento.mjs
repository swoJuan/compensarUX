#!/usr/bin/env node
// Gestor de conocimiento Compensar. Sin dependencias.
//   sincronizar [--aplicar]   Reconstruye registro/catálogo desde fuentes reales (simulación por defecto)
//   consultar <tipo> [id]     tipo: flujo|componente|decision|pendiente|resumen  (salida acotada)
//   revisar-cierre            Lista documentación a actualizar según git status (solo lectura)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const P=(...a)=>path.join(root,...a);
const rj=(p)=>JSON.parse(fs.readFileSync(P(p),'utf8'));
const [cmd,...rest]=process.argv.slice(2);
const hoy=new Date().toISOString().slice(0,10);
const REG='IA-Central/seguimiento/registro.json', CAT='IA-Central/componentes/catalogo.json';

function construir(){
  const prev=rj(REG);
  const manual=(k)=>(prev[k]||[]).filter(x=>x.origen==='manual');
  const portal=rj('Flujos/portal/catalogo.json');
  const flujos=portal.flujos.map(f=>({id:f.id,nombre:f.nombre,plataforma:f.plataforma,ruta:'Flujos/prototipos/'+f.ruta,version:f.version,
    estado:f.estado,aprobadoUX:!!(f.aprobacionUX&&f.aprobacionUX.aprobado),figma:f.figma||null,
    hu:(f.hu||[]).map(h=>h.codigo+' '+h.titulo),publicar:!!f.publicar,verificadoEn:hoy,fuente:'Flujos/portal/catalogo.json'}));
  // componentes: desde documentación real del DS
  const comp=[];const ds=JSON.parse(fs.readFileSync(P('Core-Design-System/package.json'),'utf8')).version;
  for(const [ambito,dir] of [['web','Core-Design-System/docs/web/components'],['app','Core-Design-System/docs/app/components'],['transversales','Core-Design-System/docs/transversales/components']]){
    if(!fs.existsSync(P(dir)))continue;
    for(const n of fs.readdirSync(P(dir))){ if(!n.endsWith('.html'))continue;
      comp.push({id:ambito+'/'+n.replace('.html',''),ambito,docs:dir+'/'+n,versionDS:ds,figma:null,estado:'documentado_en_ds',verificadoEn:hoy,fuente:dir}); }}
  // decisiones: tabla de DECISIONES.md
  const dec=[];for(const l of fs.readFileSync(P('IA-Central/decisiones/DECISIONES.md'),'utf8').split('\n')){
    const m=l.match(/^\|\s*(\d{3})\s*\|\s*(.+?)\s*\|\s*$/); if(m)dec.push({id:'DEC-'+m[1],resumen:m[2],estado:'por_verificar',nota:'Decisión histórica reportada; verificar contra Core-Design-System/docs/auditoria-design-system y Figma',verificadoEn:hoy,fuente:'IA-Central/decisiones/DECISIONES.md'});}
  // pendientes: PI-xx de los informes 13 y 14 + aprobación UX de flujos
  const pend=[];const D='Core-Design-System/docs/auditoria-design-system/';
  for(const f of ['13-Pendientes-Independientes.md','14-Pendientes-Cierre-DEC-012.md']){
    for(const l of fs.readFileSync(P(D+f),'utf8').split('\n')){const m=l.match(/^## (PI-\d+)\s*[·-]\s*(.+)$/); if(!m)continue;
      const res=/RESUELTO/.test(m[2]);const id=m[1]+(f.startsWith('14')?'-cierre':'');
      if(!pend.find(p=>p.id===id))pend.push({id,descripcion:m[2].replace(/\*|`/g,'').slice(0,140),estado:res?'resuelto_reportado':'por_verificar',fuente:D+f,verificadoEn:hoy});}}
  for(const f of flujos)if(!f.aprobadoUX)pend.push({id:'APR-'+f.id,descripcion:'Aprobación UX pendiente: '+f.nombre,flujo:f.id,estado:'pendiente_aprobacion',responsable:'Juan Carlos Soto',fuente:'Flujos/portal/catalogo.json',verificadoEn:hoy});
  const ev={id:'EV-'+hoy+'-sync',fecha:hoy,tipo:'sincronizacion',descripcion:`Registro reconstruido desde fuentes: ${flujos.length} flujos, ${comp.length} componentes, ${dec.length} decisiones, ${pend.length} pendientes`,origen:'conocimiento.mjs'};
  const reg={schemaVersion:'1.1',ultimaVerificacion:{fecha:hoy,alcance:'parcial: derivado de archivos locales; sin verificación contra Figma ni QA'},estado:'auditado_parcial',
    flujos,componentes:comp.map(c=>({id:c.id,estado:c.estado,versionDS:c.versionDS})),decisiones:dec,pendientes:[...pend,...manual('pendientes')],
    entregas:prev.entregas||[],eventos:[...(prev.eventos||[]).filter(e=>e.id!==ev.id),ev]};
  const cat={schemaVersion:'1.1',ultimaVerificacion:{fecha:hoy,alcance:'inventario de documentación en Core-Design-System/docs; Figma sin verificar'},versionDS:ds,componentes:comp,nota:'Generado por conocimiento.mjs. No editar a mano.'};
  return {reg,cat};
}
function sincronizar(){
  const {reg,cat}=construir();
  console.log(`Flujos ${reg.flujos.length} | Componentes ${cat.componentes.length} | Decisiones ${reg.decisiones.length} | Pendientes ${reg.pendientes.length}`);
  if(!rest.includes('--aplicar')){console.log('SIMULACIÓN: no se escribió nada. Usa --aplicar tras revisar.');return;}
  fs.writeFileSync(P(REG),JSON.stringify(reg,null,2)+'\n');fs.writeFileSync(P(CAT),JSON.stringify(cat,null,2)+'\n');console.log('Escrito:',REG,'y',CAT);
}
function consultar(){
  const [tipo,id]=rest;const r=rj(REG);
  const pick=(arr)=>id?arr.filter(x=>x.id===id||x.id.includes(id)):arr;
  if(tipo==='resumen'||!tipo){console.log(JSON.stringify({ultimaVerificacion:r.ultimaVerificacion,estado:r.estado,flujos:r.flujos.length,componentes:r.componentes.length,decisiones:r.decisiones.length,pendientes:r.pendientes.length},null,1));return;}
  const k={flujo:'flujos',componente:'componentes',decision:'decisiones',pendiente:'pendientes'}[tipo];if(!k){console.error('tipo inválido');process.exit(2);}
  const out=pick(r[k]);console.log(JSON.stringify(out,null,1));
  if(k==='flujos'&&id)for(const f of out){const rel=r.pendientes.filter(p=>p.flujo===f.id);console.log('PENDIENTES ligados a '+f.id+':',JSON.stringify(rel,null,1));}
}
function revisarCierre(){
  const g=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout.split('\n').filter(Boolean).map(l=>l.slice(3));
  const reglas=[[/^Flujos\/prototipos\//,'Actualizar flujo en registro.json (estado, QA) y ficha del flujo'],[/^Flujos\/portal\/catalogo\.json/,'Re-sincronizar registro: conocimiento.mjs sincronizar'],[/^Core-Design-System\//,'Revisar catálogo de componentes, versión DS y decisiones DEC'],[/^IA-Central\/decisiones\//,'Confirmar aprobación del usuario para cambios de decisión'],[/^IA-Central\/agentes\//,'Regenerar adaptadores: generar-adaptadores.mjs --aplicar y validar.mjs'],[/^Flujos\/entregables\//,'Registrar entrega en registro.json (entregas)']];
  const need=new Map();for(const f of g)for(const [re,msg] of reglas)if(re.test(f)){(need.get(msg)||need.set(msg,[]).get(msg)).push(f);}
  if(!need.size){console.log('Sin cambios que exijan actualizar documentación.');return;}
  for(const [m,fs_] of need)console.log('- '+m+'\n    ('+fs_.length+' archivos, ej.: '+fs_.slice(0,2).join(', ')+')');
  console.log('\nSolo informativo: no se escribe ningún registro.');
}
({sincronizar,consultar,'revisar-cierre':revisarCierre}[cmd]||(()=>{console.log('Uso: conocimiento.mjs sincronizar [--aplicar] | consultar <flujo|componente|decision|pendiente|resumen> [id] | revisar-cierre');process.exit(2);}))();
