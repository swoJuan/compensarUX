const fs=require('fs');
function parse(css, ctx='') { const out=new Map(); let i=0; css=css.replace(/\/\*[\s\S]*?\*\//g,'');
  while(i<css.length){ const o=css.indexOf('{',i); if(o<0)break; const pre=css.slice(i,o).trim(); let d=1,j=o+1; while(d&&j<css.length){const c=css[j++]; if(c==='{')d++; else if(c==='}')d--;} const body=css.slice(o+1,j-1);
    if(pre.startsWith('@media')||pre.startsWith('@supports')||pre.startsWith('@layer')){ for(const [k,v] of parse(body,ctx+pre+' | ')) out.set(k,v); }
    else if(pre.startsWith('@')){ out.set(ctx+pre,body); }
    else { const key=ctx+pre; out.set(key,(out.get(key)||'')+body); }
    i=j; } return out; }
const norm=b=>b.split(';').map(s=>s.trim()).filter(Boolean).sort().join(';');
const A=parse(fs.readFileSync(process.argv[2],'utf8')), B=parse(fs.readFileSync(process.argv[3],'utf8'));
const changed=[];
for(const k of new Set([...A.keys(),...B.keys()])){ const a=A.get(k),b=B.get(k); if(a===undefined)changed.push(['+',k]); else if(b===undefined)changed.push(['-',k]); else if(norm(a)!==norm(b))changed.push(['~',k]); }
const group=k=>{ const s=k.replace(/^.*\| /,''); const m=s.match(/\.(mp-[a-z]+|app-[a-z]+|btn|form-control|row|alert|modal|table)/); return (/^(:root|\[data-theme)/.test(s)&&!m)?'tokens/tema (:root, [data-theme])':(m?m[1]:'otros'); };
const g={}; changed.forEach(([t,k])=>{(g[group(k)]=g[group(k)]||[]).push(t+' '+k)});
console.log('reglas cambiadas:',changed.length); for(const [k,v] of Object.entries(g).sort()) console.log(`  ${k.padEnd(34)} ${v.length}`);
fs.writeFileSync('/tmp/qa/cssdiff.txt',changed.map(c=>c.join(' ')).join('\n'));
