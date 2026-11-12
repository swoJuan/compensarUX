import fs from 'node:fs';
const NEW = {
  'use/text/badge/orange':  { css:'--use-text-badge-orange',  sass:'$use-text-badge-orange',  type:'color', modes:{ light:'var(--use-text-secondary)', dark:'var(--use-text-inverse)', highContrast:'var(--use-text-secondary)' } },
  'use/text/badge/green-3': { css:'--use-text-badge-green-3', sass:'$use-text-badge-green-3', type:'color', modes:{ light:'var(--base-green-2-90)', dark:'var(--use-text-theme-green-2)', highContrast:'var(--use-text-theme-green-2)' } },
  'use/text/badge/error':   { css:'--use-text-badge-error',   sass:'$use-text-badge-error',   type:'color', modes:{ light:'var(--base-red-80)', dark:'var(--use-text-theme-red)', highContrast:'var(--use-text-theme-red)' } },
};
function patchTokens(obj){
  const out = {};
  for (const [k,v] of Object.entries(obj)) {
    if (k === 'use/text/on-dark/primary') for (const [nk,nv] of Object.entries(NEW)) out[nk] = nv;
    out[k] = v;
  }
  out['use/state/warning/bg'].modes.dark = 'var(--base-yellow-100)';
  out['use/state/success/bg'].modes.dark = 'var(--base-green-1-90)';
  out['use/state/warning/icon bg'].modes.light = 'var(--base-yellow-90)';
  return out;
}
const ser = (o, extra='') => JSON.stringify(o,null,2).replace(/\n/g,'\n'+extra);
// JSON
let p='tokens/compensar.tokens.json';
let j=JSON.parse(fs.readFileSync(p,'utf8')); fs.writeFileSync(p, JSON.stringify(patchTokens(j),null,2)+'\n');
// listas de documentación: [name, css, value(, "")]
function patchLists(src, indentOf){
  // 1) nuevas entradas tras use/text/theme/green-2 en cada lista
  const re=/( *)\[\n\1  "use\/text\/theme\/green-2",\n\1  "--use-text-theme-green-2",\n\1  "var\(--base-green-2-80\)"(,\n\1  "")?\n\1\],\n/g;
  let n=0;
  src=src.replace(re,(m,ind,four)=>{ n++;
    const ent=(name,css,val)=>`${ind}[\n${ind}  "${name}",\n${ind}  "${css}",\n${ind}  "${val}"${four?`,\n${ind}  ""`:''}\n${ind}],\n`;
    return m+ent('use/text/badge/orange','--use-text-badge-orange','var(--use-text-secondary)')
            +ent('use/text/badge/green-3','--use-text-badge-green-3','var(--base-green-2-90)')
            +ent('use/text/badge/error','--use-text-badge-error','var(--base-red-80)');
  });
  // 2) valor Light de warning icon bg
  const re2=/("use\/state\/warning\/icon bg",\n *"--use-state-warning-icon-bg",\n *)"var\(--base-yellow-70\)"/g;
  let n2=0; src=src.replace(re2,(m,a)=>{n2++;return a+'"var(--base-yellow-90)"';});
  return [src,n,n2];
}
// tokens.js
p='js/tokens.js'; let s=fs.readFileSync(p,'utf8');
let m=s.match(/export const TOKENS = (\{[\s\S]*?\n\});/);
s=s.replace(m[1], ()=>ser(patchTokens(JSON.parse(m[1]))));
let [s2,n,n2]=patchLists(s); console.log('tokens.js listas',n,'icon-bg',n2); fs.writeFileSync(p,s2);
// ds-bundle.js
p='js/ds-bundle.js'; s=fs.readFileSync(p,'utf8');
m=s.match(/var TOKENS = (\{[\s\S]*?\n  \});/);
s=s.replace(m[1], ()=>ser(patchTokens(JSON.parse(m[1].replace(/\n  /g,'\n'))),'  '));
[s2,n,n2]=patchLists(s); console.log('bundle listas',n,'icon-bg',n2); fs.writeFileSync(p,s2);
