const { chromium } = require('/tmp/qa/node_modules/playwright');
const { page, read, ROOT, EXE } = require('/tmp/qa/fixture.js');
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
for (const [name,file] of [['base','/tmp/qa/base/core.css'],['nuevo',ROOT+'/css/core.css']]) for (const forced of ['active','none']) {
 const p=await b.newPage({viewport:{width:900,height:1000},forcedColors:forced});
 await p.setContent(page(read(file)));await p.addStyleTag({content:'*,*::before,*::after{transition:none!important}'});await p.addScriptTag({path:ROOT+'/js/mp-tabs.js'});
 const box=async()=>{const e=await p.$('#tabs');const bb=await e.boundingBox();return (await p.screenshot({clip:{x:bb.x-6,y:bb.y-6,width:bb.width+12,height:bb.height+12}})).toString('base64')};
 const before=await box();
 await p.focus('#dd-trigger'); await p.keyboard.press('Tab');           // llega a tab-1 por teclado
 const id=await p.evaluate(()=>document.activeElement.id);
 const focused=await box();
 console.log(name.padEnd(6),'forced-colors:',forced.padEnd(6),'foco en',id,'→ se ve diferente:',before!==focused);
 await p.close();}
await b.close();})();
