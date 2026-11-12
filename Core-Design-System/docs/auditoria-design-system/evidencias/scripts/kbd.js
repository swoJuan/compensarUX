const {chromium}=require('playwright');const {routes}=require('./common');const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
const go=async(p,h)=>{await p.goto('http://localhost:8765/drupal.html'+h);await p.waitForTimeout(1500);};
const ae=p=>p.evaluate(()=>{const e=document.activeElement;return e?(e.tagName+'.'+String(e.className).slice(0,50)+' '+(e.getAttribute('aria-selected')||'')+' '+(e.textContent||'').trim().slice(0,20)):null});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});await routes(ctx);const p=await ctx.newPage();const R={};
// TABS
await go(p,'#tabs');
R.tabs=await (async()=>{const t=p.locator('#content [role=tab]').first(); if(!await t.count())return 'sin role=tab en preview';
 await t.focus(); const a=await ae(p); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); const b2=await ae(p);
 const sel=await p.evaluate(()=>[...document.querySelectorAll('#content [role=tab]')].slice(0,4).map(x=>x.getAttribute('aria-selected')+'/'+x.tabIndex));
 return {antes:a,despuesArrowRight:b2,selTab:sel};})();
// DROPDOWN
await go(p,'#dropdown');
R.dropdown=await (async()=>{const t=p.locator('#content .mp-dropdown__trigger').first(); if(!await t.count())return 'no trigger';
 await t.focus();await p.keyboard.press('Enter');await p.waitForTimeout(250);
 const s1=await p.evaluate(()=>{const tr=document.activeElement;const dd=tr.closest('.mp-dropdown');const pn=dd&&dd.querySelector('.mp-dropdown__panel');return {trigExp:tr.getAttribute('aria-expanded'),wrapExp:dd&&dd.getAttribute('aria-expanded'),panelVisible:pn?getComputedStyle(pn).display:null,role:dd&&dd.getAttribute('role'),trigName:tr.textContent.trim().slice(0,30)}});
 await p.keyboard.press('ArrowDown');await p.waitForTimeout(200);const s2=await ae(p);
 await p.keyboard.press('Escape');await p.waitForTimeout(200);
 const s3=await p.evaluate(()=>{const dd=document.querySelector('#content .mp-dropdown');return {wrapExp:dd.getAttribute('aria-expanded'),panel:getComputedStyle(dd.querySelector('.mp-dropdown__panel')).display}});
 // label association
 const lab=await p.evaluate(()=>{const l=document.querySelector('#content label.mp-dropdown-label[for]');if(!l)return 'sin label[for]';const tgt=document.getElementById(l.htmlFor);return l.htmlFor+' -> '+(tgt?tgt.tagName+(tgt.labels?'(labelable)':'(no labelable)'):'no existe')});
 return {trasEnter:s1,trasArrowDown:s2,trasEscape:s3,label:lab};})();
// MODAL
await go(p,'#modales');
R.modal=await (async()=>{const btn=p.locator('#content [data-modal-demo] button, #content button[data-modal-demo]').first();
 const any=await p.evaluate(()=>[...document.querySelectorAll('#content button')].filter(b=>/abrir|ver modal|open|probar|demo/i.test(b.textContent)).map(b=>b.textContent.trim()).slice(0,5));
 let target=btn; if(!await btn.count()){const n=any[0]; if(!n)return {botones:any}; target=p.locator('#content button',{hasText:n}).first();}
 await target.focus();await p.keyboard.press('Enter');await p.waitForTimeout(500);
 const open=await p.evaluate(()=>{const m=document.querySelector('.mp-modal--open,[role=dialog].show,.modal.show');return m?{role:m.getAttribute('role'),modal:m.getAttribute('aria-modal'),focusInside:m.contains(document.activeElement),active:document.activeElement.className.slice(0,40)}:null});
 const seq=[];for(let i=0;i<6;i++){await p.keyboard.press('Tab');seq.push(await p.evaluate(()=>{const m=document.querySelector('.mp-modal--open,.modal.show');return m?m.contains(document.activeElement):'cerrado'}));}
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 const after=await p.evaluate(()=>({abierto:!!document.querySelector('.mp-modal--open,.modal.show'),foco:document.activeElement.textContent.trim().slice(0,30)}));
 return {botones:any,abierto:open,focoDentroTrasTabs:seq,trasEscape:after};})();
// ACCORDION
await go(p,'#accordion');
R.accordion=await p.evaluate(()=>{const it=[...document.querySelectorAll('#content .mp-accordion__item')];const closed=it.filter(i=>!i.classList.contains('is-open'));
 const focusablesInClosed=closed.flatMap(i=>[...i.querySelectorAll('.mp-accordion__panel a,.mp-accordion__panel button,.mp-accordion__panel input')]).length;
 return {items:it.length,cerrados:closed.length,panelHiddenAttr:closed.map(i=>i.querySelector('.mp-accordion__panel')?.hasAttribute('hidden')).slice(0,3),focusablesEnPanelesCerrados:focusablesInClosed,triggers:[...document.querySelectorAll('#content .mp-accordion__trigger')].slice(0,3).map(t=>t.tagName+' exp='+t.getAttribute('aria-expanded'))}});
// SELECTION / TOAST
await go(p,'#seleccion');R.switch=await p.evaluate(()=>[...document.querySelectorAll('#content .mp-switch__input')].slice(0,3).map(i=>i.getAttribute('role')));
await go(p,'#toast');R.toast=await p.evaluate(()=>[...document.querySelectorAll('#content .mp-toast')].slice(0,4).map(t=>(t.getAttribute('role')||'-')+'/'+(t.closest('[aria-live]')?.getAttribute('aria-live')||'sin-live')));
// TABLE scroll region
await go(p,'#tables');R.tables=await p.evaluate(()=>[...document.querySelectorAll('#content .mp-table-wrap,#content .table-wrap')].slice(0,3).map(w=>({tabindex:w.getAttribute('tabindex'),role:w.getAttribute('role'),label:w.getAttribute('aria-label'),scroll:w.scrollWidth>w.clientWidth,caption:!!w.querySelector('caption')})));
// INPUTS markup
await go(p,'#inputs');R.inputs=await p.evaluate(()=>[...document.querySelectorAll('#content .mp-input-field')].slice(0,6).map(i=>({id:i.id,labelled:i.labels?i.labels.length:0,descby:i.getAttribute('aria-describedby'),req:i.required||i.getAttribute('aria-required'),inv:i.getAttribute('aria-invalid')})));
console.log(JSON.stringify(R,null,1));
// REDUCED MOTION
const c2=await b.newContext({reducedMotion:'reduce'});await routes(c2);const p2=await c2.newPage();await p2.goto('http://localhost:8765/audit-harness.html');await p2.waitForTimeout(300);
console.log('reducedMotion spinner:',await p2.evaluate(()=>{const s=getComputedStyle(document.querySelector('.mp-loading__spinner'));return s.animationDuration+' x'+s.animationIterationCount}));
const c3=await b.newContext();await routes(c3);const p3=await c3.newPage();await p3.goto('http://localhost:8765/audit-harness.html');
console.log('normal spinner:',await p3.evaluate(()=>{const s=getComputedStyle(document.querySelector('.mp-loading__spinner'));return s.animationDuration+' x'+s.animationIterationCount}));
await b.close();})();
