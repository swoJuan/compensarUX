const { chromium } = require('playwright'); const fs=require('fs');
const V={v220:'/tmp/dec003/core.v220.css',v221:'/tmp/dec003/core.v221.css'};
const html=t=>`<!doctype html><html data-theme="${t}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="background:var(--use-background-page)"><input class="mp-input-field" id="i" value="x" style="width:320px"><button id="b">x</button></body></html>`;
(async()=>{const b=await chromium.launch({channel:'chromium'});
for(const t of ['light','dark','high-contrast']){const o={};
 for(const v of Object.keys(V)){const ctx=await b.newContext();const p=await ctx.newPage();
  await p.route('**/__a.html',r=>r.fulfill({contentType:'text/html',body:html(t)}));
  await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(V[v],'utf8')}));
  await p.goto('http://localhost:8000/__a.html');
  // active SIN foco previo: mousedown manteniendo, pero primero enfocar el boton para que el input no tenga focus
  await p.click('#b');
  const box=await p.locator('#i').boundingBox(); await p.mouse.move(box.x+10,box.y+10); await p.mouse.down();
  await p.waitForTimeout(150);
  o[v]=await p.evaluate(()=>{const cs=getComputedStyle(document.querySelector('#i'));return {border:cs.borderTopColor,shadow:cs.boxShadow.slice(0,40),focus:document.activeElement.id}});
  await p.mouse.up(); await ctx.close();}
 console.log(t,'v220',JSON.stringify(o.v220)); console.log(t,'v221',JSON.stringify(o.v221));}
await b.close();})();
