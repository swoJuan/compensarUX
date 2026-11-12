const {chromium}=require('playwright');const {routes}=require('./common');const fs=require('fs');
const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
const AXE=fs.readFileSync(W+'/fonts/node_modules/axe-core/axe.min.js','utf8');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});await routes(ctx);const p=await ctx.newPage();
await p.goto('http://localhost:8765/drupal.html#introduccion');await p.waitForTimeout(2000);
const links=await p.evaluate(()=>[...document.querySelectorAll('#drupal-sidebar a[href]')].map(a=>({h:a.getAttribute('href'),t:a.textContent.trim()})));
const comp=links.filter(l=>/^#/.test(l.h));console.log(JSON.stringify(comp.map(l=>l.h)));
const out={};
for(const l of comp){ if(/color|tipograf|espaciado|radius|layout|sombras|icono|token|princip|introd|guideline|demo/.test(l.h))continue;
 for(const t of ['light','dark','high-contrast']){
  await p.goto('http://localhost:8765/drupal.html'+l.h);await p.waitForTimeout(1500);
  await p.click({light:'#btn-light',dark:'#btn-dark','high-contrast':'#btn-hc'}[t]);
  await p.waitForTimeout(500);
  await p.evaluate(AXE);
  const r=await p.evaluate(async()=>{const res=await axe.run('#content',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},resultTypes:['violations']});
   return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,mp:v.nodes.filter(n=>/mp-/.test(n.html)).length,ex:v.nodes.filter(n=>/mp-/.test(n.html)).slice(0,40).map(n=>n.html.slice(0,120)+' :: '+(n.any[0]?.message||n.all[0]?.message||'').slice(0,140))}))});
  out[l.h+'|'+t]=r;}}
fs.writeFileSync(W+'/axe2.json',JSON.stringify(out,null,1));await b.close();})();
