const { chromium } = require('/tmp/qa/node_modules/playwright');
const fs = require('fs');const { EXE } = require('/tmp/qa/fixture.js');
const AXE = fs.readFileSync('/tmp/qa/node_modules/axe-core/axe.min.js','utf8');
const route=process.argv[2], theme=process.argv[3]||'light', w=+(process.argv[4]||1280), base=process.argv[5]||'http://localhost:8000';
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
const p=await b.newPage({viewport:{width:w,height:900}});
await p.goto(`${base}/drupal.html#${route}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
await p.evaluate(t=>document.getElementById({light:'btn-light',dark:'btn-dark','high-contrast':'btn-hc'}[t]).click(),theme);await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>{i.loading='eager'}));await p.waitForTimeout(300);
await p.addScriptTag({content:AXE});
const r=await p.evaluate(async()=>{const o=await axe.run('#content',{resultTypes:['violations']});return o.violations.map(v=>({id:v.id,n:v.nodes.length,nodes:v.nodes.slice(0,40).map(n=>({t:n.target.join(' ').slice(0,100),msg:(n.any[0]||n.all[0]||n.none[0]||{}).message?.slice(0,150)}))}))});
for(const v of r){console.log(`## ${v.id} (${v.n})`);v.nodes.slice(0,+process.argv[6]||4).forEach(n=>console.log('   ',n.t,'|',n.msg))}
await b.close();})();
