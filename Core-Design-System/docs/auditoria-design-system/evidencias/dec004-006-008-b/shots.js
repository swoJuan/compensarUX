const { chromium } = require('/tmp/qa/node_modules/playwright');
const { page, read, ROOT, EXE, choice, sw, tab } = require('/tmp/qa/fixture.js');
const css = read(ROOT + '/css/core.css');
const badges = ['orange','violet','green-3','error','success','warning','info'].map(v=>`<span class="mp-badge mp-badge--${v}">${v}</span>`).join(' ');
const chips = `<button class="mp-chip mp-chip--violet" type="button">Chip normal</button> <button class="mp-chip mp-chip--violet is-selected" aria-pressed="true" type="button">Chip activo</button>`;
const alerts = ['info','success','warning','error'].map(k=>`<div class="mp-alert mp-alert--${k}" style="margin:6px 0"><span class="mp-alert__icon material-symbols-rounded">${k==='warning'?'warning':k==='error'?'error':k==='success'?'check_circle':'info'}</span><div class="mp-alert__content"><p class="mp-alert__title">Título ${k}</p><p class="mp-alert__body">Mensaje de la alerta ${k}.</p></div></div>`).join('');
const tabs = `<div class="mp-tabs" role="tablist" aria-label="x">${tab('t1','General',{active:true})}${tab('t2','Datos')}${tab('t3','Pagos',{disabled:true})}</div>`;
const sws = `<div style="display:flex;gap:16px">${sw('s1',{checked:true})}${sw('s2')}</div>`;
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
for(const theme of ['light','dark','high-contrast']){
 const p=await b.newPage({viewport:{width:760,height:760}});
 await p.setContent(`<!doctype html><html data-theme="${theme}"><head><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"><style>${css}</style></head><body style="margin:0;padding:20px;background:var(--use-background-page);color:var(--use-text-primary);font-family:Roboto,Arial,sans-serif"><div>${badges}</div><div style="margin:10px 0">${chips}</div>${alerts}<div style="margin:8px 0">${tabs}</div>${sws}${choice('checkbox','c1',{checked:true})}<nav class="mp-pagination"><ul class="mp-pagination__list"><li class="mp-pagination__item"><a class="mp-pagination__link" href="#">1</a></li><li class="mp-pagination__item"><a class="mp-pagination__link is-active" href="#">2</a></li></ul></nav></body></html>`,{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);
 await p.focus('#t2'); await p.waitForTimeout(100);
 await p.screenshot({path:`/tmp/qa/shot-${theme}.png`});await p.close();}
await b.close();})();
