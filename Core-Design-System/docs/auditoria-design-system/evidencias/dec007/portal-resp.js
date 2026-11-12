// Portal real a 320 px con texto al 200 %: teclado operable y sin desborde nuevo (base v2.2.1 vs nuevo)
const { chromium } = require('playwright'); const fs=require('fs'),os=require('os'),path=require('path');
const BASES={'base v2.2.1':'http://localhost:8001','nuevo':'http://localhost:8000'};
(async()=>{
 for(const [pct,px] of [[100,16],[200,32]]) for(const [name,base] of Object.entries(BASES)){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pwprof-'));fs.mkdirSync(dir+'/Default');fs.writeFileSync(dir+'/Default/Preferences',JSON.stringify({webkit:{webprefs:{default_font_size:px}}}));
  const ctx=await chromium.launchPersistentContext(dir,{channel:'chromium',headless:true});
  const out={};
  for(const hash of ['dropdown','tabs']){
   const p=await ctx.newPage();await p.setViewportSize({width:320,height:900});
   await p.goto(`${base}/drupal.html#${hash}`);await p.waitForTimeout(2000);
   out[hash+' overflow']=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(hash==='dropdown'){
     await p.focus('#drp-live-preview .mp-dropdown__trigger');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(150);
     out['dropdown teclado']=await p.evaluate(()=>{const t=document.querySelector('#drp-live-preview .mp-dropdown__trigger');return t.getAttribute('aria-expanded')==='false'&&t.querySelector('.mp-dropdown__value').textContent.trim()!=='Seleccionar'&&document.activeElement===t});
     await p.keyboard.press('ArrowDown');await p.waitForTimeout(150);
     out['panel en viewport']=await p.evaluate(()=>{const r=document.querySelector('#drp-live-preview .mp-dropdown__panel').getBoundingClientRect();return r.left>=-0.5&&r.right<=innerWidth+0.5});
   } else {
     await p.focus('#tab-preview-area [role=tab][aria-selected=true]');await p.keyboard.press('ArrowRight');await p.waitForTimeout(250);
     out['tabs teclado']=await p.evaluate(()=>{const t=[...document.querySelectorAll('#tab-preview-area [role=tab]')];return t.indexOf(document.activeElement)===1&&t[1].getAttribute('aria-selected')==='true'});
     out['tab enfocada visible']=await p.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return r.width>0&&r.right>0&&r.left<innerWidth});
   }
   await p.close();}
  console.log(`${String(pct).padStart(3)}% 320px ${name.padEnd(12)}`,JSON.stringify(out));
  await ctx.close();}
})();
