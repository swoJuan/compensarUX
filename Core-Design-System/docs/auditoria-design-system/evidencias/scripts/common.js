const fs=require('fs'),path=require('path');
const F='/tmp/claude-0/-home-claude/1c86b832-e340-5303-a9ae-c92148250a06/scratchpad/fonts/node_modules';
function robotoCss(){let s='';for(const w of [100,300,400,500,700,900]){s+=`@font-face{font-family:'Roboto';font-style:normal;font-weight:${w};src:url(https://fonts.gstatic.com/roboto-${w}.woff2) format('woff2');}`;}
 s+=`@font-face{font-family:'Roboto Mono';font-weight:400;src:url(https://fonts.gstatic.com/roboto-400.woff2)}`;return s;}
function symCss(){return `@font-face{font-family:'Material Symbols Rounded';font-style:normal;font-weight:100 700;src:url(https://fonts.gstatic.com/msr.woff2) format('woff2');}.material-symbols-rounded{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased;}`;}
async function routes(ctx){
 await ctx.route('https://fonts.googleapis.com/**',r=>{const u=r.request().url();r.fulfill({contentType:'text/css',body:u.includes('Material')?symCss():robotoCss()});});
 await ctx.route('https://fonts.gstatic.com/**',r=>{const u=r.request().url();let f;
  if(u.includes('msr'))f=F+'/material-symbols/material-symbols-rounded.woff2';else{const w=u.match(/roboto-(\d+)/)[1];f=F+`/@fontsource/roboto/files/roboto-latin-${w}-normal.woff2`;}
  r.fulfill({contentType:'font/woff2',body:fs.readFileSync(f)});});
 await ctx.route(/^https?:\/\/(?!localhost)/,r=>{const u=r.request().url(); if(u.includes('fonts.g'))return r.fallback(); r.abort();});
}
module.exports={routes};
