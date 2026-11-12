const {chromium}=require('playwright');const {routes}=require('./common');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await routes(ctx);const p=await ctx.newPage();
await p.goto('http://localhost:8765/audit-harness.html');
const vars=['info','success','warning','error','orange','green','violet','neutral'];
await p.evaluate(v=>{const s=document.getElementById('misc');v.forEach(x=>{for(const c of ['mp-badge','mp-tag']){const e=document.createElement('span');e.className=`${c} ${c}--${x}`;e.textContent=x;e.dataset.b=c+'--'+x;s.appendChild(e);}})},vars);
for(const t of ['light','dark','high-contrast']){await p.evaluate(t=>document.documentElement.dataset.theme=t,t);
 const r=await p.evaluate(()=>{const P=c=>c.match(/[\d.]+/g).map(Number);const L=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 return [...document.querySelectorAll('[data-b]')].map(e=>{const cs=getComputedStyle(e);const a=L(P(cs.color)),bb=L(P(cs.backgroundColor));return e.dataset.b+':'+((Math.max(a,bb)+.05)/(Math.min(a,bb)+.05)).toFixed(2)})});
 console.log(t,r.join('  '));}
await b.close();})();
