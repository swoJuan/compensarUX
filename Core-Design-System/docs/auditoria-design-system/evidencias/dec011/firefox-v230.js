// Firefox (Marionette, sin instalar nada): mismas comprobaciones que functional-v230.js.
// Firefox no deja ventanas de 320 px, así que cada ancho se emula con un iframe del mismo origen (las media queries usan el ancho del iframe).
// Uso: node firefox-v230.js   (servidor en :8000; Firefox en /Applications/Firefox.app)
const net = require('net'), fs = require('fs'), { spawn } = require('child_process');
const FF = '/Applications/Firefox.app/Contents/MacOS/firefox';
const src = fs.readFileSync(__dirname + '/inpage-v230.js', 'utf8').replace(/if \(typeof module[\s\S]*$/, '').trim();
const ROUTES = (process.argv[2] || ['accordion', 'breadcrumb', 'cards', 'empty-state', 'inputs', 'loading', 'sidebar', 'stepper', 'header', 'badges', 'avatar', 'tables', 'guidelines/form-patterns'].join(',')).split(',');
const profile = fs.mkdtempSync('/tmp/ff-prof-');
fs.writeFileSync(profile + '/user.js', 'user_pref("marionette.port",2828);user_pref("browser.shell.checkDefaultBrowser",false);user_pref("datareporting.policy.dataSubmissionEnabled",false);');
const ff = spawn(FF, ['--headless', '--marionette', '--no-remote', '--profile', profile], { stdio: 'ignore' });
let buf = '', id = 0; const waiters = new Map();
const sock = new net.Socket();
function onData(d) {
  buf += d.toString('utf8');
  for (;;) {
    const m = buf.match(/^(\d+):/); if (!m) return;
    const len = +m[1], start = m[0].length;
    if (Buffer.byteLength(buf.slice(start)) < len) return;
    const body = Buffer.from(buf.slice(start)).subarray(0, len).toString('utf8');
    buf = Buffer.from(buf.slice(start)).subarray(len).toString('utf8');
    const msg = JSON.parse(body);
    if (Array.isArray(msg) && msg[0] === 1 && waiters.has(msg[1])) { const w = waiters.get(msg[1]); waiters.delete(msg[1]); msg[2] ? w.reject(new Error(JSON.stringify(msg[2]).slice(0, 300))) : w.resolve(msg[3]); }
  }
}
const send = (cmd, params = {}) => new Promise((resolve, reject) => {
  const i = ++id; const s = JSON.stringify([0, i, cmd, params]);
  waiters.set(i, { resolve, reject }); sock.write(Buffer.byteLength(s) + ':' + s);
});
async function connect() {
  for (let n = 0; n < 60; n++) {
    try { await new Promise((res, rej) => { const s = new net.Socket(); s.once('error', rej); s.connect(2828, '127.0.0.1', () => { s.destroy(); res(); }); }); break; } catch { await new Promise(r => setTimeout(r, 1000)); }
  }
  await new Promise((res, rej) => { sock.once('error', rej); sock.connect(2828, '127.0.0.1', res); });
  sock.on('data', onData);
  await new Promise(r => setTimeout(r, 500));
}
const runScript = async (script, args = []) => (await send('WebDriver:ExecuteAsyncScript', { script, args, sandbox: 'default', newSandbox: true })).value;
(async () => {
  let ok = 0, bad = 0;
  try {
    await connect();
    await send('WebDriver:NewSession', { capabilities: {} });
    console.log('Firefox', (await runScript('arguments[arguments.length-1](navigator.userAgent)')).match(/Firefox\/[\d.]+/)?.[0]);
    for (const w of [1280, 375, 320]) {
      for (const r of ROUTES) {
        await send('WebDriver:Navigate', { url: 'http://localhost:8000/js/code-copy.js' });
        const route = r.split('/').pop() === 'form-patterns' ? 'form' : r;
        const script = `const done=arguments[arguments.length-1];
          const f=document.createElement('iframe');f.style.cssText='position:fixed;left:0;top:0;border:0;width:${w}px;height:900px';
          f.src='http://localhost:8000/drupal.html#${r}';document.body.appendChild(f);
          f.onload=()=>setTimeout(async()=>{try{const res=await f.contentWindow.eval('(${src.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')})(\\'${route}\\')');done(JSON.stringify(Array.from(res)))}catch(e){done(JSON.stringify([['error de ejecución',false,String(e).slice(0,200)]]))}},3500);`;
        const res = JSON.parse(await runScript(script));
        for (const [name, pass, detail] of res) { pass ? ok++ : bad++; if (!pass) console.log(`FALLA ${w} ${r}: ${name} ${detail}`); }
      }
    }
  } catch (e) { console.log('Error del arnés:', e.message); bad++; }
  console.log(`Firefox: ${ok} correctas, ${bad} con fallo`);
  try { await send('Marionette:Quit'); } catch {}
  ff.kill(); process.exit(bad ? 1 : 0);
})();
