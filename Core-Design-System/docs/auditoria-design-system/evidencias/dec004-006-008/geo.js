// DEC-008 · geometría real antes/después: etiqueta del checkbox y radio de la paginación (100 %/200 %, 320/1280 px)
const { chromium } = require('playwright'); const fs=require('fs'),os=require('os'),path=require('path');
const NEW=fs.readFileSync('/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System/css/core.css','utf8');
const OLD=fs.readFileSync('/tmp/dec008/core.base.css','utf8');
const body=`<div style="width:100%"><label class="mp-choice mp-checkbox" id="cb"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" type="checkbox"><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__text"><span class="mp-choice__label">Acepto los términos y condiciones del servicio de afiliación</span></span></label>
<label class="mp-choice mp-radio" id="rd"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" type="radio"><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__text"><span class="mp-choice__label">Opción de radio sin cambios</span></span></label>
<label class="mp-switch" id="sw"><span class="mp-switch__field"><input class="form-check-input mp-switch__input" type="checkbox" role="switch"><span class="mp-switch__track" aria-hidden="true"></span></span><span class="mp-switch__label">Switch sin cambios</span></label>
<nav class="mp-pagination" id="pg"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link is-active" href="#">1</a></li><li class="mp-pagination__item"><a class="mp-pagination__link" href="#">2</a></li></ul></nav></div>`;
async function ctx(px){const d=fs.mkdtempSync(path.join(os.tmpdir(),'pwprof-'));fs.mkdirSync(d+'/Default');fs.writeFileSync(d+'/Default/Preferences',JSON.stringify({webkit:{webprefs:{default_font_size:px}}}));return chromium.launchPersistentContext(d,{channel:'chromium',headless:true});}
(async()=>{
 for(const [pct,px] of [[100,16],[200,32]]) for(const w of [1280,320]){
  const c=await ctx(px);const res={};
  for(const [name,css] of [['antes',OLD],['después',NEW]]){
   const p=await c.newPage();await p.setViewportSize({width:w,height:700});
   await p.route('**/__g.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html data-theme="light"><head><link rel="stylesheet" href="/css/core.css"></head><body style="margin:0;padding:16px">${body}</body></html>`}));
   await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:css}));
   await p.goto('http://localhost:8000/__g.html');await p.waitForTimeout(150);
   res[name]=await p.evaluate(()=>{const r=id=>{const b=document.getElementById(id).getBoundingClientRect();return Math.round(b.width)+'x'+Math.round(b.height)};const lab=document.querySelector('#cb .mp-choice__label');
     const link=document.querySelector('#pg .mp-pagination__link');return {cb:r('cb'),cbFont:getComputedStyle(lab).fontSize,rd:r('rd'),sw:r('sw'),pg:r('pg'),pgRadius:getComputedStyle(link).borderTopLeftRadius,over:document.documentElement.scrollWidth-innerWidth}});
   await p.close();}
  const a=res['antes'],d=res['después'];
  const same=['rd','sw'].every(k=>a[k]===d[k]); if(!same) console.log('   detalle radio/switch:',JSON.stringify({rd:[a.rd,d.rd],sw:[a.sw,d.sw]}));
  console.log(`${String(pct).padStart(3)}% ${String(w).padStart(4)}px | checkbox ${a.cb} (${a.cbFont}) → ${d.cb} (${d.cbFont}) | paginación ${a.pg} r=${a.pgRadius} → ${d.pg} r=${d.pgRadius} | radio y switch sin cambio: ${same?'SÍ':'NO'} | desborde ${d.over}`);
  await c.close();}
})();
