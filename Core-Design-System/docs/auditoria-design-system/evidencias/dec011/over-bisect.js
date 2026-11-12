const { chromium } = require('/tmp/qa/node_modules/playwright');
const { EXE } = require('/tmp/qa/fixture.js');
const r=process.argv[2], w=+(process.argv[3]||320);
(async()=>{const b=await chromium.launch({executablePath:EXE,headless:true});
const p=await b.newPage({viewport:{width:w,height:900}});
await p.goto(`http://localhost:8000/drupal.html#${r}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
const over=()=>p.evaluate(()=>{const m=document.querySelector('.main');return m.scrollWidth-m.clientWidth});
console.log('total',await over());
// descender: en cada nivel, ocultar hijos uno a uno y ver cuál baja el desborde
let path=[];let node='[data-component-doc]';
for(let depth=0;depth<6;depth++){
 const kids=await p.evaluate(sel=>[...document.querySelector(sel).children].map((c,i)=>({i,t:c.tagName.toLowerCase()+'.'+String(c.className).split(' ').slice(0,2).join('.')+(c.id?'#'+c.id:'')})),node);
 let found=null;const base=await over();
 for(const k of kids){await p.evaluate(({sel,i})=>{document.querySelector(sel).children[i].style.display='none'},{sel:node,i:k.i});const o=await over();await p.evaluate(({sel,i})=>{document.querySelector(sel).children[i].style.display=''},{sel:node,i:k.i});if(o<base-2){found=k;break}}
 if(!found)break;path.push(found.t);node=`${node} > :nth-child(${found.i+1})`;}
console.log('camino:',path.join(' > '));await b.close();})();
