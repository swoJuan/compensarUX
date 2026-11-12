// H-03: nombre accesible del chip del Header ZT (WCAG 2.5.3 Label in Name) + sin cambio visual
const { chromium } = require('playwright'); const fs=require('fs');
const ROOT='/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
(async()=>{
 const b=await chromium.launch({channel:'chromium'}); const p=await b.newPage({viewport:{width:1440,height:600}});
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'/css/core.css','utf8')}));
 await p.goto('http://localhost:8000/_dec012-pi01b/harness-zt.html'); await p.waitForTimeout(1000);
 const cdp=await p.context().newCDPSession(p);
 const nameOf=async sel=>{ const {root}=await cdp.send('DOM.getDocument'); const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:sel}); const {nodes}=await cdp.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false}); const n=nodes[0]; return {role:n.role.value,name:n.name&&n.name.value}; };
 const chip=await nameOf('.mp-user-chip'); const visible=await p.evaluate(()=>document.querySelector('.mp-user-chip').innerText.replace(/\s+/g,' ').trim());
 const visibleLabel=await p.evaluate(()=>document.querySelector('.mp-user-chip__name').textContent.trim());
 const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 console.log('chip (AX):',JSON.stringify(chip),'| texto visible del chip:',JSON.stringify(visible),'| etiqueta visible:',JSON.stringify(visibleLabel));
 console.log('2.5.3 (nombre contiene la etiqueta visible):',norm(chip.name).includes(norm(visibleLabel)),'| empieza por ella:',norm(chip.name).startsWith(norm(visibleLabel)));
 console.log('otros controles:',JSON.stringify({toggle:await nameOf('.mp-web-header__mobile-toggle'),brand:await nameOf('.mp-web-header__brand'),search:await nameOf('.mp-web-header__search-input')}));
 // sin cambio visual: markup anterior vs nuevo con el mismo CSS
 const shot=async()=>p.locator('.mp-user-chip').screenshot();
 const a=await shot();
 await p.evaluate(()=>{const c=document.querySelector('.mp-user-chip');c.setAttribute('aria-label','Abrir menú de usuario');c.querySelector('.mp-avatar').removeAttribute('aria-hidden')});
 const o=await shot(); const oldName=await nameOf('.mp-user-chip');
 console.log('markup anterior (AX):',JSON.stringify(oldName),'| 2.5.3 anterior:',norm(oldName.name).includes(norm(visibleLabel)));
 console.log('captura del chip identica byte a byte (nuevo vs anterior):',a.equals(o));
 await b.close();
})();
