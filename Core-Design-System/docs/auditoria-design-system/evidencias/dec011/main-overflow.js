// Desborde del área de contenido (.main) en todas las rutas con data-component-doc, a 1280 / 375 / 320 px
const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const tag=process.argv[2]||'run';
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
const p0=await b.newPage();await p0.goto('http://localhost:8000/drupal.html',{waitUntil:'domcontentloaded'});await p0.waitForTimeout(1500);
const routes=await p0.evaluate(()=>[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(h=>h&&!h.includes(' ')))]);await p0.close();
const res={};
for (const w of [1280,375,320]) { const p=await b.newPage({viewport:{width:w,height:900}});
 for (const r of routes) { await p.goto(`http://localhost:8000/drupal.html#${r}`,{waitUntil:'domcontentloaded'}).catch(()=>{});await p.waitForTimeout(450);
  const m=await p.evaluate(()=>{const mn=document.querySelector('.main');const art=document.querySelector('[data-component-doc]');return {doc:!!art,over:mn?mn.scrollWidth-mn.clientWidth:0,page:document.documentElement.scrollWidth-document.documentElement.clientWidth}});
  if(m.doc) (res[r]=res[r]||{})[w]=m; }
 await p.close(); }
await b.close();
const bad=Object.entries(res).filter(([r,v])=>Object.values(v).some(x=>x.over>2||x.page>2));
console.log(tag,'páginas de componente:',Object.keys(res).length,'| con desborde:',bad.length);
bad.forEach(([r,v])=>console.log('  ',r.padEnd(22),Object.entries(v).map(([w,x])=>`${w}:${x.over}/${x.page}`).join('  ')));
require('fs').writeFileSync(`/tmp/qa/main-overflow-${tag}.json`,JSON.stringify(res));})();
