const { chromium } = require('playwright'); const fs=require('fs');
const html=t=>`<!doctype html><html data-theme="${t}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="background:var(--use-background-page);padding:20px">
<div class="mp-input-group"><label class="mp-input-label" for="a">A</label><input id="a" class="mp-input-field" value="n"></div>
<div class="mp-input-group"><label class="mp-input-label" for="b">B</label><input id="b" class="mp-input-field" readonly value="ro"></div>
<div class="mp-input-group"><label class="mp-input-label" for="c">C</label><input id="c" class="mp-input-field error" aria-invalid="true" value="e"></div>
<div class="mp-input-group"><label class="mp-input-label" for="d">D</label><input id="d" class="mp-input-field" disabled value="dis"></div>
<div class="mp-input-group"><label class="mp-input-label" for="e">E</label><input id="e" class="mp-input-field" value="n2"></div></body></html>`;
(async()=>{const b=await chromium.launch({channel:'chromium'});let fail=0,tot=0;
for(const t of ['light','dark','high-contrast']){const ctx=await b.newContext();const p=await ctx.newPage();
 await p.route('**/__k.html',r=>r.fulfill({contentType:'text/html',body:html(t)}));
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css','utf8')}));
 await p.goto('http://localhost:8000/__k.html');
 const order=[]; await p.keyboard.press('Tab');
 for(let i=0;i<5;i++){const r=await p.evaluate(()=>{const a=document.activeElement;if(a.tagName!=='INPUT')return null;const cs=getComputedStyle(a);const vis=cs.outlineStyle!=='none'||cs.boxShadow!=='none';return {id:a.id,vis,ol:cs.outlineStyle,bs:cs.boxShadow!=='none'}});
   if(r){order.push(r.id); tot++; if(!r.vis){fail++;console.log('  SIN FOCO VISIBLE',t,r.id)}}
   await p.keyboard.press('Tab');}
 console.log(t,'orden Tab:',order.join(' '),'(disabled d se omite:',!order.includes('d')?'OK':'FALLA',')');
 await ctx.close();}
console.log('teclado: focos visibles',(tot-fail)+'/'+tot);await b.close();})();
