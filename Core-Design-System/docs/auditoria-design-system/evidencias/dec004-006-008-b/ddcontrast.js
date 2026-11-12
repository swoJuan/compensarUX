const { chromium } = require('/tmp/qa/node_modules/playwright');
const { page, read, ROOT, EXE } = require('/tmp/qa/fixture.js');
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
for (const theme of ['light','dark','high-contrast']) for (const sel of [false,true]) {
 const p=await b.newPage();await p.setContent(page(read(ROOT+'/css/core.css')));
 await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
 await p.addStyleTag({content:'*,*::before,*::after{transition:none!important}'});
 await p.addScriptTag({path:ROOT+'/js/mp-dropdown.js'});
 await p.focus('#dd-trigger');await p.keyboard.press('Enter');
 if(!sel){await p.keyboard.press('ArrowUp');}   // activa A (no seleccionada); con sel=true queda en C (seleccionada)
 const r=await p.evaluate(()=>{
  const parse=c=>{const m=c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
  const over=(f,b)=>[0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3]));
  let base=[255,255,255];const chain=[];let n=document.querySelector('.mp-dropdown__option--active');while(n){chain.unshift(n);n=n.parentElement}
  chain.forEach(e=>{const c=parse(getComputedStyle(e).backgroundColor);if(c&&c[3]>0)base=over(c,base)});
  const el=document.querySelector('.mp-dropdown__option--active');const cs=getComputedStyle(el);const o=parse(cs.outlineColor);
  const lum=a=>{const [r,g,b]=a.map(v=>v/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b};
  const cr=(a,b)=>{const x=lum(a),y=lum(b);return +((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2)};
  const txt=parse(cs.color).slice(0,3);
  return {text:el.textContent.trim(),selected:el.classList.contains('mp-dropdown__option--selected'),bg:base.map(Math.round),outline:o.slice(0,3),crIndicator:cr(o.slice(0,3),base),crText:cr(txt,base)};
 });
 console.log(theme.padEnd(14),r.selected?'seleccionada ':'no selecc.   ',JSON.stringify(r));await p.close();}
await b.close();})();
