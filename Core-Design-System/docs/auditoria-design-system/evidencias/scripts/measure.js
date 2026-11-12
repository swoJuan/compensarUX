const {chromium}=require('playwright');const {routes}=require('./common');const fs=require('fs');
const W='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad';
(async()=>{const b=await chromium.launch();const out={};
for(const theme of ['light','dark','high-contrast']){
 const ctx=await b.newContext({viewport:{width:1440,height:1400},deviceScaleFactor:1});await routes(ctx);const p=await ctx.newPage();
 await p.goto('http://localhost:8765/audit-harness.html');await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 out[theme]=await p.evaluate(()=>{
  const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}};
  const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
  const cr=(x,y)=>{const a=lum(x),b=lum(y);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  const over=(top,bot)=>({r:top.r*top.a+bot.r*(1-top.a),g:top.g*top.a+bot.g*(1-top.a),b:top.b*top.a+bot.b*(1-top.a),a:1});
  const gradColors=s=>(s.match(/rgba?\([^)]+\)/g)||[]).map(parse);
  function bgStack(el){const layers=[];let e=el;let op=1;while(e){const cs=getComputedStyle(e);op*=parseFloat(cs.opacity);
    const g=gradColors(cs.backgroundImage); if(g.length){layers.push({grad:g});break;}
    const c=parse(cs.backgroundColor); if(c&&c.a>0){layers.push({c}); if(c.a>=1)break;} e=e.parentElement;}
   return {layers,op};}
  function effBgs(el){const {layers}=bgStack(el);let base={r:255,g:255,b:255,a:1};
   const last=layers[layers.length-1]; let bases=[base];
   if(last&&last.grad) bases=last.grad.map(g=>over(g,base)); else if(last&&last.c&&last.c.a>=1) bases=[last.c];
   const tops=layers.slice(0,-1).reverse().map(l=>l.c).filter(Boolean);
   return bases.map(b0=>tops.reduce((acc,t)=>over(t,acc),b0));}
  const hex=c=>'#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const res={};
  document.querySelectorAll('[data-k]').forEach(el=>{const cs=getComputedStyle(el);const k=el.dataset.k;
   let fg=parse(cs.color);const bgs=effBgs(el);
   // opacity of ancestors
   let op=1,e=el;while(e){op*=parseFloat(getComputedStyle(e).opacity);e=e.parentElement;}
   const fgEff=fg?bgs.map(bg=>over({...fg,a:fg.a*op},bg)):[];
   const r=el.getBoundingClientRect();
   res[k]={fs:cs.fontSize,fw:cs.fontWeight,ls:cs.letterSpacing,lh:cs.lineHeight,color:fg&&hex(fg),bg:bgs.map(hex),
     contrast:fgEff.map((f,i)=>+cr(f,bgs[i]).toFixed(2)),radius:cs.borderTopLeftRadius,h:Math.round(r.height),w:Math.round(r.width),
     border:cs.borderTopWidth+' '+cs.borderTopStyle+' '+cs.borderTopColor,opacity:op,bgImg:cs.backgroundImage.slice(0,90),
     outline:cs.outlineWidth+' '+cs.outlineStyle+' '+cs.outlineColor,anim:cs.animationDuration};
  });
  // pseudo controls
  const ctrl=document.querySelector('[data-k=chk-control]');const pc=getComputedStyle(ctrl,'::before');const pa=getComputedStyle(ctrl,'::after');
  res['chk-before']={bg:pc.backgroundColor,border:pc.borderTopColor};res['chk-after']={bg:pa.backgroundColor,bl:pa.borderLeftColor,w:pa.width,h:pa.height};
  const knob=getComputedStyle(document.querySelector('[data-k=sw-track]'),'::after');res['sw-knob']={bg:knob.backgroundColor};
  return res;});
 await p.screenshot({path:`${W}/shots/harness-${theme}.png`,fullPage:true});
 await ctx.close();}
fs.writeFileSync(W+'/measure.json',JSON.stringify(out,null,1));await b.close();})();
