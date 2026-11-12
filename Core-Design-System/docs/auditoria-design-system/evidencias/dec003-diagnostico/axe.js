const { chromium } = require('playwright'); const fs=require('fs'); const axeSrc=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
const src=fs.readFileSync('inputs-states.js','utf8'); const STATES_SRC=src.slice(src.indexOf('const STATES'), src.indexOf('(async () => {'));
eval(STATES_SRC.replace(/^const /gm,'var '));
const V={head:'/tmp/dec003/core.head.css',wip:'/tmp/dec003/core.wip.css'};
(async()=>{const b=await chromium.launch({channel:'chromium'});
for(const v of Object.keys(V)) for(const theme of ['light','dark','high-contrast']){
 const ctx=await b.newContext({viewport:{width:1200,height:1100}}); const p=await ctx.newPage();
 await p.route('**/__t.html',r=>r.fulfill({contentType:'text/html',body:html(theme)}));
 await p.route(/\/css\/core\.css/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(V[v],'utf8')}));
 await p.goto('http://localhost:8000/__t.html'); await p.evaluate(()=>document.fonts.ready); await p.addScriptTag({content:axeSrc});
 const res=await p.evaluate(()=>axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}));
 console.log(v.padEnd(5),theme.padEnd(14),'violaciones:',res.violations.map(x=>x.id+'('+x.nodes.length+')').join(', ')||'ninguna','| incompletas:',res.incomplete.map(x=>x.id+'('+x.nodes.length+')').join(', ')||'-');
 await ctx.close();}
await b.close();})();
