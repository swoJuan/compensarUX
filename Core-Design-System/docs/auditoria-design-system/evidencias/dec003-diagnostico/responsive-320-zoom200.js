// DEC-003: responsive 320/375 px y texto 100/150/200 % (tamaño de fuente real del navegador), 3 temas
const { chromium } = require('playwright'); const fs=require('fs'),os=require('os'),path=require('path');
const ROOT='/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const CSS=fs.readFileSync(ROOT+'/css/core.css','utf8');
const grp=(id,lab,cls,attr,help,err)=>`<div class="mp-input-group"><label class="mp-input-label" for="${id}"><span class="mp-input-required" aria-hidden="true">*</span> ${lab}</label><div class="mp-input-wrapper"><input id="${id}" class="mp-input-field ${cls}" ${attr} value="Valor de ejemplo largo para el campo" ${err?`aria-invalid="true" aria-describedby="${id}h"`:''}></div><p class="mp-input-helper ${err?'error':''}" id="${id}h">${err?'<i class="icon icon-warning-circle icon-16" aria-hidden="true"></i> ':''}${help}</p></div>`;
const html=t=>`<!doctype html><html lang="es" data-theme="${t}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/core.css"><link rel="stylesheet" href="/icons/icons.css"></head><body style="margin:0;padding:16px;background:var(--use-background-page)">
${grp('n','Nombre completo del afiliado','','','Texto de apoyo que puede ocupar varias líneas cuando el texto se amplía',false)}
${grp('e','Correo electrónico','error','','Formato inválido. Ejemplo: usuario@compensar.com',true)}
${grp('d','Campo deshabilitado','','disabled','No disponible para este tipo de afiliación',false)}
${grp('r','Campo de solo lectura','','readonly','Dato institucional',false)}
</body></html>`;
async function ctxFor(px){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pwprof-'));fs.mkdirSync(dir+'/Default');fs.writeFileSync(dir+'/Default/Preferences',JSON.stringify({webkit:{webprefs:{default_font_size:px}}}));return chromium.launchPersistentContext(dir,{channel:'chromium',headless:true});}
(async()=>{let fail=0,tot=0;
for(const [pct,px] of [[100,16],[150,24],[200,32]]){const ctx=await ctxFor(px);
 for(const w of [320,375]) for(const t of ['light','dark','high-contrast']){
  const p=await ctx.newPage();await p.setViewportSize({width:w,height:900});
  await p.route('**/__r.html',r=>r.fulfill({contentType:'text/html',body:html(t)}));
  await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:CSS}));
  await p.goto('http://localhost:8000/__r.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
  // foco por teclado en cada campo enfocable y medición
  const res=[];await p.keyboard.press('Tab');
  for(let i=0;i<4;i++){const m=await p.evaluate(()=>{const a=document.activeElement;if(a.tagName!=='INPUT')return null;const cs=getComputedStyle(a),b=a.getBoundingClientRect();const ring=cs.boxShadow!=='none'?parseFloat((cs.boxShadow.match(/(\d+(\.\d+)?)px\s*$/)||[0,0])[1]):0;const ol=cs.outlineStyle!=='none'?parseFloat(cs.outlineWidth)+parseFloat(cs.outlineOffset):0;const ext=Math.max(ring,ol);
    return {id:a.id,h:Math.round(b.height),left:b.left-ext,right:b.right+ext,vw:innerWidth,vis:cs.outlineStyle!=='none'||cs.boxShadow!=='none',fs:parseFloat(cs.fontSize)}});
   if(m)res.push(m);await p.keyboard.press('Tab');}
  const g=await p.evaluate(()=>{const lab=[...document.querySelectorAll('.mp-input-label,.mp-input-helper')];const clipped=lab.filter(e=>e.scrollWidth>e.clientWidth+1).length;
    const d=document.querySelector('#d');return {docOver:document.documentElement.scrollWidth-innerWidth,clipped,dis:getComputedStyle(d).opacity,hs:[...document.querySelectorAll('.mp-input-field')].map(e=>Math.round(e.getBoundingClientRect().height))}});
  const minH=Math.min(...g.hs), expH=Math.round(56*px/16);
  const checks={'sin overflow horizontal':g.docOver<=0,'textos sin recorte':g.clipped===0,['alto escala con rem']:minH>=expH-1,'disabled opacidad 1':g.dis==='1','foco visible en los 3 enfocables':res.length===3&&res.every(r=>r.vis),'anillo/outline dentro del viewport':res.every(r=>r.left>=-0.5&&r.right<=r.vw+0.5)};
  const bad=Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k);tot++;if(bad.length){fail++;console.log(`FALLA ${pct}% ${w}px ${t}:`,bad.join(' | '),JSON.stringify({docOver:g.docOver,clipped:g.clipped,minH,res:res.map(r=>[r.id,Math.round(r.left),Math.round(r.right)])}));}
  await p.close();}
 await ctx.close();}
console.log(`responsive: ${tot-fail}/${tot} combinaciones OK (320/375 px × 100/150/200 % × 3 temas)`);})();
