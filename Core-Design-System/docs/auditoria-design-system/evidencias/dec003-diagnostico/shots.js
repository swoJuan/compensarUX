const { chromium } = require('playwright'); const fs=require('fs'); fs.mkdirSync('/tmp/dec003/shots',{recursive:true});
const html=t=>`<!doctype html><html data-theme="${t}"><head><link rel="stylesheet" href="/css/core.css"></head><body style="background:var(--use-background-page);padding:24px;display:grid;grid-template-columns:repeat(3,320px);gap:20px">
${['normal','error','disabled','readonly'].map(s=>`<div class="mp-input-group"><label class="mp-input-label"><span class="mp-input-required" aria-hidden="true">*</span> ${s}</label><div class="mp-input-wrapper"><input class="mp-input-field ${s==='error'?'error':''}" ${s==='disabled'?'disabled':''} ${s==='readonly'?'readonly':''} value="Valor" ${s==='error'?'aria-invalid=true aria-describedby=h'+s:''}></div><p class="mp-input-helper ${s==='error'?'error':''}" id="h${s}">${s==='error'?'<i class="icon icon-warning-circle icon-16"></i> Campo obligatorio':'Texto de apoyo'}</p></div>`).join('')}
</body></html>`;
(async()=>{const b=await chromium.launch({channel:'chromium'});for(const t of ['light','dark','high-contrast']){const ctx=await b.newContext({viewport:{width:1060,height:400}});const p=await ctx.newPage();
 await p.route('**/__s.html',r=>r.fulfill({contentType:'text/html',body:html(t)}));
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css','utf8')}));
 await p.goto('http://localhost:8000/__s.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
 await p.screenshot({path:`/tmp/dec003/shots/dec003-${t}.png`}); await ctx.close();}
await b.close();})();
