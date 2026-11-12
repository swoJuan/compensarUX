const {chromium}=require('playwright');const {routes}=require('./common');const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
const WIP=`.mp-input-field[readonly]:hover,.mp-input-field[readonly]:focus,.mp-input-field[readonly]:active{--mp-inp-border: var(--use-border-default);border-color:var(--mp-inp-border);background:var(--use-surface-surface);box-shadow:none;outline:none}.mp-input-field:disabled,.mp-input-field[readonly]{background:var(--use-surface-surface);color:var(--use-text-tertiary);--mp-inp-border: var(--use-border-default);border-color:var(--mp-inp-border);cursor:not-allowed;box-shadow:none}`;
(async()=>{const b=await chromium.launch();
for(const wip of [false,true]) for(const t of ['light','dark','high-contrast']){
 const ctx=await b.newContext({viewport:{width:1440,height:1400}});await routes(ctx);const p=await ctx.newPage();
 await p.goto('http://localhost:8765/audit-harness.html');await p.evaluate(t=>document.documentElement.dataset.theme=t,t);
 if(wip) await p.addStyleTag({content:WIP});
 await p.evaluate(()=>document.fonts.ready);
 const rows=[];
 for(let i=0;i<30;i++){await p.keyboard.press('Tab');await p.waitForTimeout(350);
  const info=await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;
   const k=e.dataset.k||e.className;const cs=getComputedStyle(e);
   // indicator may be on sibling control for choice/switch
   let ind=e; if(e.classList.contains('mp-choice__input')||e.classList.contains('mp-switch__input')) ind=e.nextElementSibling;
   const ics=getComputedStyle(ind);const r=ind.getBoundingClientRect();
   return {k,outline:ics.outlineStyle!=='none'?ics.outlineWidth+' '+ics.outlineColor+' off '+ics.outlineOffset:'none',shadow:ics.boxShadow,border:ics.borderTopWidth+' '+ics.borderTopColor,box:[r.x,r.y,r.width,r.height].map(Math.round)}});
  if(!info)break; if(rows.find(r=>r.k===info.k))continue; rows.push(info);
  if(!wip||String(info.k).includes('readonly')){const [x,y,w,h]=info.box;const pad=10;
   await p.screenshot({path:`${W}/shots/focus-${wip?'wip-':''}${t}-${String(info.k).replace(/[^a-z0-9-]/gi,'_').slice(0,40)}.png`,clip:{x:Math.max(0,x-pad),y:Math.max(0,y-pad),width:w+2*pad,height:h+2*pad}});}
 }
 console.log('=== '+(wip?'WIP ':'')+t);rows.forEach(r=>{if(!wip||String(r.k).includes('readonly'))console.log(r.k,'|',r.outline,'|',r.shadow.slice(0,70),'|',r.border)});
 await ctx.close();}
await b.close();})();
