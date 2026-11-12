const { chromium } = require('playwright'); const fs=require('fs');
const html=`<!doctype html><html data-theme="high-contrast"><head><link rel="stylesheet" href="/css/core.css"></head><body style="padding:20px">
<input class="mp-input-field" id="n" value="n" style="width:320px">
<input class="mp-input-field error" id="e" aria-invalid="true" value="e" style="width:320px">
<input class="mp-input-field" id="r" readonly value="ro" style="width:320px"></body></html>`;
(async()=>{const b=await chromium.launch({channel:'chromium'});const ctx=await b.newContext({forcedColors:'active'});const p=await ctx.newPage();
 await p.route('**/__f.html',r=>r.fulfill({contentType:'text/html',body:html}));
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css','utf8')}));
 await p.goto('http://localhost:8000/__f.html');
 for(const id of ['n','e','r']){await p.focus('#'+id);const r=await p.evaluate(i=>{const cs=getComputedStyle(document.querySelector('#'+i));return {border:cs.borderTopStyle,outline:cs.outlineStyle+' '+cs.outlineWidth}},id);console.log('forced-colors',id,JSON.stringify(r));}
 await b.close();})();
