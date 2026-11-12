const {chromium}=require('playwright');const {routes}=require('./common');const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:800},forcedColors:'active',colorScheme:'dark'});await routes(ctx);const p=await ctx.newPage();
await p.goto('http://localhost:8765/audit-harness.html');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>matchMedia('(forced-colors: active)').matches));
await p.screenshot({path:W+'/shots/forced-colors.png',clip:{x:0,y:0,width:1440,height:560}});
const r=await p.evaluate(()=>{const c=document.querySelector('[data-k=chk-control]');const t=document.querySelector('[data-k=sw-track-on]');const t0=document.querySelector('[data-k=sw-track]');return {chkBefore:getComputedStyle(c,'::before').backgroundColor,chkBorder:getComputedStyle(c,'::before').borderTopColor,swOn:getComputedStyle(t).backgroundColor,swOff:getComputedStyle(t0).backgroundColor,knob:getComputedStyle(t,'::after').backgroundColor}});
console.log(r);await b.close();})();
