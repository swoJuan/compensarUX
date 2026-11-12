// Regresión amplia: todas las rutas del portal, línea base vs nuevo. Errores JS, desborde, y estado de TODOS los tablist/listbox.
const { chromium } = require('playwright');
const BASES={'base':'http://localhost:8001','nuevo':'http://localhost:8000'};
(async()=>{const b=await chromium.launch({channel:'chromium'});
 const out={};
 for(const shell of ['drupal.html','app.html']){
  const p0=await b.newPage({viewport:{width:1280,height:900}});await p0.goto(`http://localhost:8001/${shell}`,{waitUntil:'domcontentloaded'});await p0.waitForTimeout(1800);
  const routes=await p0.evaluate(()=>[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(h=>h&&!h.includes(' ')))]);
  await p0.close();
  for(const [name,base] of Object.entries(BASES)){
   for(const r of routes){
    const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,70)));
    await p.goto(`${base}/${shell}#${r}`,{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{});await p.waitForTimeout(700);
    const m=await p.evaluate(()=>{const lists=[...document.querySelectorAll('[role=tablist]')];
      return {over:document.documentElement.scrollWidth-innerWidth,
        tablists:lists.length,
        multiSel:lists.filter(l=>[...l.querySelectorAll('[role=tab]')].filter(t=>t.getAttribute('aria-selected')==='true').length>1).length,
        stop:lists.filter(l=>{const t=[...l.querySelectorAll('[role=tab]')].filter(x=>!x.disabled);return t.length&&t.filter(x=>x.tabIndex===0).length!==1}).length,
        dd:document.querySelectorAll('.mp-dropdown').length,
        ddWrapExp:[...document.querySelectorAll('.mp-dropdown')].filter(x=>x.hasAttribute('aria-expanded')).length,
        open:[...document.querySelectorAll('.mp-dropdown__trigger[aria-expanded=true]')].length};});
    (out[`${shell}#${r}`]=out[`${shell}#${r}`]||{})[name]={...m,errs:errs.length};
    await p.close();}}}
 await b.close();
 let n=0,jsNew=0,ovNew=0,multi=0,stop=0,diffs=[];
 for(const [k,v] of Object.entries(out)){n++;
  if(v.nuevo.errs>v.base.errs){jsNew++;diffs.push(k+' errores JS '+v.base.errs+'→'+v.nuevo.errs);}
  if(v.nuevo.over>v.base.over){ovNew++;diffs.push(k+' desborde '+v.base.over+'→'+v.nuevo.over);}
  if(v.nuevo.multiSel>v.base.multiSel){multi++;diffs.push(k+' tablist con >1 seleccionada');}
  if(v.nuevo.stop>v.base.stop){stop++;diffs.push(k+' tablist sin exactamente 1 parada de Tab');}
  if(v.nuevo.open!==v.base.open) diffs.push(k+' dropdowns abiertos '+v.base.open+'→'+v.nuevo.open);
 }
 const tl=Object.values(out).reduce((a,v)=>a+v.nuevo.tablists,0), ddn=Object.values(out).reduce((a,v)=>a+v.nuevo.dd,0), stopBase=Object.values(out).reduce((a,v)=>a+v.base.stop,0), stopNew=Object.values(out).reduce((a,v)=>a+v.nuevo.stop,0);
 console.log(`rutas comparadas: ${n} · tablists (nuevo): ${tl} · dropdowns (nuevo): ${ddn}`);
 console.log(`errores JS nuevos: ${jsNew} · desbordes nuevos: ${ovNew} · tablists con >1 seleccionada nuevos: ${multi}`);
 console.log(`tablists sin exactamente una parada de Tab → base: ${stopBase} · nuevo: ${stopNew}`);
 console.log(diffs.length?'DIFERENCIAS:\n  '+diffs.join('\n  '):'sin diferencias adversas');
})();
