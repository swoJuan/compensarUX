const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const routes=process.argv[2].split(','), w=+(process.argv[3]||320);
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
for (const r of routes) { const p=await b.newPage({viewport:{width:w,height:900}});
 await p.goto(`http://localhost:8000/drupal.html#${r}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 const res=await p.evaluate(()=>{const mn=document.querySelector('.main');const lim=mn.getBoundingClientRect().right;
  const sig=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+String(e.className).split(/\s+/).slice(0,2).join('.');
  // elementos cuyo borde derecho excede .main y que NO están dentro de un contenedor con scroll propio ni oculto
  const out=[];for(const e of document.querySelectorAll('#content *')){const b=e.getBoundingClientRect();if(b.width===0||b.right<=lim+2)continue;
    let a=e.parentElement,clipped=false;while(a&&a!==mn){const cs=getComputedStyle(a);if(/(auto|scroll|hidden|clip)/.test(cs.overflowX)){clipped=true;break}a=a.parentElement}
    if(!clipped)out.push({s:sig(e),r:Math.round(b.right-lim),w:Math.round(b.width)})}
  // solo los más internos (los que no contienen a otro de la lista)
  const set=new Set(out.map(x=>x.s));return out.sort((a,b)=>b.r-a.r).slice(0,6);});
 console.log(r.padEnd(12),JSON.stringify(res));await p.close();}
await b.close();})();
