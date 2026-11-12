const {chromium}=require('playwright');const {routes}=require('./common');const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});await routes(ctx);const p=await ctx.newPage();
for(const [h,btn] of [['#inputs','#btn-dark'],['#inputs','#btn-hc'],['#badges','#btn-dark']]){
await p.goto('http://localhost:8765/drupal.html'+h);await p.waitForTimeout(1500);await p.click(btn);await p.waitForTimeout(600);
const info=await p.evaluate(()=>{const lab=document.querySelector('#content .mp-input-label, #content .mp-badge');let e=lab,bg=null;while(e){const c=getComputedStyle(e).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'){bg=c+' @'+e.className.slice(0,40);break;}e=e.parentElement;}return {html:document.documentElement.dataset.theme,color:getComputedStyle(lab).color,bg}});
console.log(h,btn,JSON.stringify(info));
await p.screenshot({path:`${W}/shots/docs-${h.slice(1)}-${btn.slice(5)}.png`});}
await b.close();})();
