const { chromium } = require('playwright'); const fs=require('fs'); const C=fs.readFileSync('/tmp/dec003b/core.css','utf8');
const mk=(cls,attr)=>`<input id="e" class="mp-input-field ${cls}" ${attr} value="x" style="width:320px">`;
const cases={'normal-focus':['','', 'focus'],'error-focus-real':['error','aria-invalid=true','focus'],'error-focus-demo':['error is-focus-demo','aria-invalid=true',''],'readonly-focus':['','readonly','focus'],'disabled':['','disabled','']};
(async()=>{const b=await chromium.launch({channel:'chromium'});
for(const t of ['light','dark','high-contrast']){for(const [name,[cls,attr,act]] of Object.entries(cases)){
 const ctx=await b.newContext();const p=await ctx.newPage();
 await p.route('**/__c.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html data-theme="${t}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="padding:20px">${mk(cls,attr)}</body></html>`}));
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:C}));
 await p.goto('http://localhost:8000/__c.html'); if(act==='focus')await p.focus('#e');
 const r=await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('#e'));return 'borde '+c.borderTopColor+' | outline '+c.outlineStyle+(c.outlineStyle!=='none'?' '+c.outlineColor:'')+' | anillo '+(/px/.test(c.boxShadow)&&c.boxShadow!=='none'?'si':'no')});
 console.log(t.padEnd(14),name.padEnd(18),r); await ctx.close();}}
await b.close();})();
