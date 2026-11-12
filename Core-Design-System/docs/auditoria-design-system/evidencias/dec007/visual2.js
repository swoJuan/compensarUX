// Comparación pixel a pixel con cada tarjeta anclada a la misma posición entera (elimina el desplazamiento fraccionario de la maqueta)
const { chromium } = require('playwright'); const crypto=require('crypto');
const THEMES={light:'Claro',dark:'Oscuro','high-contrast':'Alto contraste'};
const SETS=[['dropdown','.drp-state-card',6],['dropdown','#drp-live-preview',1],['tabs','#tab-preview-area',1],['tabs','.tab-doc-sample',4]];
(async()=>{const b=await chromium.launch({channel:'chromium'});let same=0,diff=0;
 for(const [theme,txt] of Object.entries(THEMES)){
  const H={};
  for(const [name,base] of [['base','http://localhost:8001'],['nuevo','http://localhost:8000']]){
   for(const hash of ['dropdown','tabs']){
    const p=await b.newPage({viewport:{width:1280,height:1000}});await p.goto(`${base}/drupal.html#${hash}`);await p.waitForTimeout(1800);
    if(theme!=='light'){await p.evaluate(t=>{const x=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim().endsWith(t));x&&x.click()},txt);await p.waitForTimeout(400);}
    await p.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
    for(const [h,sel,max] of SETS.filter(s=>s[0]===hash)){
     const n=Math.min(await p.locator(sel).count(),max);
     for(let i=0;i<n;i++){
      await p.evaluate(({sel,i})=>{const e=document.querySelectorAll(sel)[i];e.style.cssText+=';position:fixed!important;top:20px!important;left:20px!important;margin:0!important;z-index:99999!important;transform:none!important';window.scrollTo(0,0)},{sel,i});
      await p.waitForTimeout(60);
      const bb=await p.evaluate(({sel,i})=>{const r=document.querySelectorAll(sel)[i].getBoundingClientRect();return {x:r.x,y:r.y,width:Math.ceil(r.width),height:Math.ceil(r.height)}},{sel,i});
      const buf=await p.screenshot({clip:bb});
      const k=`${hash}|${sel}|${i}`;(H[k]=H[k]||{})[name]=crypto.createHash('md5').update(buf).digest('hex');
      await p.reload({waitUntil:'load'});await p.waitForTimeout(1500);
      if(theme!=='light'){await p.evaluate(t=>{const x=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim().endsWith(t));x&&x.click()},txt);await p.waitForTimeout(300);}
      await p.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
     }}
    await p.close();}}
  let d=[];for(const [k,v] of Object.entries(H)){ if(v.base===v.nuevo) same++; else {diff++;d.push(k);} }
  console.log(theme.padEnd(14),'idénticas acumuladas:',same,'distintas acumuladas:',diff, d.length?('→ '+d.join(' ; ')):'');
 }
 await b.close();})();
