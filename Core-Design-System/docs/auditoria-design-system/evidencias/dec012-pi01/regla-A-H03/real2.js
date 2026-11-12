const { chromium } = require('playwright'); const fs=require('fs'),os=require('os'),path=require('path');
const SH='/tmp/pw/shots-real'; fs.mkdirSync(SH,{recursive:true});
const ONE=process.argv[2]==='one';
const THEME_TXT={light:'Claro',dark:'Oscuro','high-contrast':'Alto contraste'};
async function prof(px){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pwprof-')); fs.mkdirSync(dir+'/Default');
  fs.writeFileSync(dir+'/Default/Preferences',JSON.stringify({webkit:{webprefs:{default_font_size:px}}}));
  return chromium.launchPersistentContext(dir,{channel:'chromium',headless:true});}
(async()=>{
 // markup real (build() de web-header-docs.js) tomado de la pagina harness
 let MK={};
 { const c=await prof(16); const p=await c.newPage(); p.setDefaultTimeout(8000); await p.goto('http://localhost:8000/_dec012-pi01b/header-harness.html'); await p.waitForTimeout(800);
   MK=await p.evaluate(()=>({pub:document.querySelector('#v-public').innerHTML, zt:''})); await p.goto('http://localhost:8000/_dec012-pi01b/harness-zt.html'); await p.waitForTimeout(800); MK.zt=await p.evaluate(()=>document.querySelector('#v-zt').innerHTML); await c.close(); }
 const rows=[];
 for (const [pct,px] of (ONE?[[200,32]]:[[100,16],[150,24],[200,32]])) { const ctx=await prof(px);
  for (const w of (ONE?[320]:[320,375,1440])) for (const theme of (ONE?['light']:['light','dark','high-contrast'])) {
   const page=await ctx.newPage(); page.setDefaultTimeout(8000); await page.setViewportSize({width:w,height:900});
   await page.goto('http://localhost:8000/drupal.html#header',{waitUntil:'load'}); await page.waitForTimeout(1200);
   await page.evaluate(t=>{const b=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim().endsWith(t)); b&&b.click();},THEME_TXT[theme]);
   await page.evaluate(m=>{const o=document.createElement('div'); o.id='__t'; o.style.cssText='position:fixed;inset:0;overflow:auto;z-index:99999;background:var(--use-surface-white,#fff)';
     o.innerHTML='<div id="__pub">'+m.pub+'</div><div id="__zt" style="margin-top:40px">'+m.zt+'</div>'; document.body.appendChild(o);},MK);
   await page.waitForTimeout(600);
   for (const id of ['__pub','__zt']) {
     const r=await page.evaluate(async id=>{ await document.fonts.ready; const o=document.getElementById('__t'), root=document.getElementById(id), hdr=root.querySelector('.mp-web-header');
       const vis=e=>{const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&e.getBoundingClientRect().width>0};
       const icons=[...root.querySelectorAll('.icon')].filter(vis).map(e=>{const cs=getComputedStyle(e,'::before');return {c:cs.content,ff:cs.fontFamily.split(',')[0].replace(/"/g,'')}});
       const ctrls=[...root.querySelectorAll('a[href],button,input')].filter(vis);
       const out=ctrls.filter(e=>{const b=e.getBoundingClientRect();return b.left<-0.5||b.right>innerWidth+0.5}).length;
       const hb=hdr.getBoundingClientRect();
       return {theme:document.documentElement.getAttribute('data-bs-theme')||document.documentElement.getAttribute('data-theme'),overlayOver:o.scrollWidth-o.clientWidth,hdrOver:Math.max(0,Math.round((hdr.scrollWidth-hdr.clientWidth)*10)/10),mainOver:(()=>{const m=hdr.querySelector('.mp-web-header__main');return Math.max(0,Math.round((m.scrollWidth-m.clientWidth)*10)/10)})(),mainRight:Math.round(hdr.querySelector('.mp-web-header__main').getBoundingClientRect().right),vw:innerWidth,ctrls:ctrls.length,out,hdrH:Math.round(hb.height),icons:icons.length,iconBad:icons.filter(i=>!i.c||i.c==='none'||i.c==='normal'||!/CompensarIcons/i.test(i.ff)).length,fam:[...new Set(icons.map(i=>i.ff))]};},id);
     // tab: todos los enfocables alcanzados en orden y a la vista
     const t=await page.evaluate(id=>{const root=document.getElementById(id);document.activeElement&&document.activeElement.blur();return [...root.querySelectorAll('a[href],button,input')].filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.getAttribute('aria-label')||e.className.split(' ')[0])},id);
     await page.evaluate(id=>[...document.getElementById(id).querySelectorAll('a[href],button,input')].find(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).focus(),id);
     let ok=true,seq=[]; for(let i=0;i<t.length;i++){const s=await page.evaluate(id=>{const a=document.activeElement,b=a.getBoundingClientRect();return {n:a.getAttribute('aria-label')||a.className.split(' ')[0],inR:!!a.closest('#'+id),inV:b.left>=-0.5&&b.right<=innerWidth+0.5&&b.width>0}},id); seq.push(s.n); if(!s.inR||!s.inV)ok=false; if(i<t.length-1) await page.keyboard.press('Tab');}
     const sameOrder=JSON.stringify(seq)===JSON.stringify(t);
     // icono pintado: captura del boton de menu con y sin glifo
     let ink=null; const tg=page.locator('#'+id+' .mp-web-header__mobile-toggle').first();
     if(await tg.isVisible()){ await page.evaluate(()=>document.activeElement&&document.activeElement.blur()); const a=await tg.screenshot(); await page.evaluate(id=>document.querySelectorAll('#'+id+' .mp-web-header__mobile-toggle .icon').forEach(e=>e.style.visibility='hidden'),id); const b=await tg.screenshot(); await page.evaluate(id=>document.querySelectorAll('#'+id+' .mp-web-header__mobile-toggle .icon').forEach(e=>e.style.visibility=''),id); ink=!a.equals(b); }
     r.tabOK=ok&&sameOrder; if(!r.tabOK) console.log('TABDBG',id,JSON.stringify(t),JSON.stringify(seq),ok); r.glyphPainted=ink;
     rows.push({pct,w,theme,id:id==='__pub'?'publico':'zt',...r});
     if(theme==='light') await page.locator('#'+id+' .mp-web-header').first().screenshot({path:`${SH}/real-${id==='__pub'?'publico':'zt'}-${pct}-${w}.png`});
   }
   await page.close(); }
  await ctx.close(); }
 fs.writeFileSync('/tmp/pw/real2.json',JSON.stringify(rows,null,1));
 for(const r of rows) console.log(`${String(r.pct).padStart(3)}% ${String(r.w).padStart(4)}px ${r.theme.padEnd(13)} ${r.id.padEnd(7)} tema=${r.theme===null?'?':''} over(ov/main)=${r.overlayOver}/${r.mainOver} ctrl=${r.ctrls} fuera=${r.out} H=${r.hdrH} iconos=${r.icons} malos=${r.iconBad} fam=${r.fam} tab=${r.tabOK} glifo=${r.glyphPainted}`);
})();
