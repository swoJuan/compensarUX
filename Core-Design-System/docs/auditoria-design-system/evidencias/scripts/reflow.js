const {chromium}=require('playwright');const {routes}=require('./common');const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:320,height:800}});await routes(ctx);const p=await ctx.newPage();
await p.goto('http://localhost:8765/audit-harness.html');await p.addStyleTag({content:'body{padding:8px}'});await p.waitForTimeout(400);
console.log('harness scrollWidth',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-k]')].map(e=>[e.dataset.k,Math.round(e.getBoundingClientRect().right)]).filter(x=>x[1]>320)));
for(const h of ['#header','#tables','#modales','#cards','#breadcrumb','#paginacion','#tabs','#inputs']){
 await p.goto('http://localhost:8765/drupal.html'+h);await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{const over=[...document.querySelectorAll('#content [class*="mp-"]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>document.documentElement.clientWidth+1&&!e.closest('.mp-table-wrap,.table-responsive,pre')}).map(e=>e.className.split(' ')[0]);return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,over:[...new Set(over)].slice(0,8)}});
 console.log(h,JSON.stringify(r));}
await p.goto('http://localhost:8765/drupal.html#header');await p.waitForTimeout(1500);await p.screenshot({path:W+'/shots/reflow-320-header.png'});
await b.close();})();
