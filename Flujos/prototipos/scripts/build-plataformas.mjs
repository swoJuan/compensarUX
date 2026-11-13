#!/usr/bin/env node
/* ============================================================
 * build-plataformas.mjs — Paquetes CSS/JS versionados por plataforma
 * ------------------------------------------------------------
 * Genera  dist/compensar-<plataforma>/v<version>/
 *           compensar-<plataforma>.min.css
 *           compensar-<plataforma>.min.js
 *           assets/…            (recursos referenciados con url(), si hay)
 *           manifest.json       (versión, commit, fecha, sha256 + SRI sha384)
 *
 * Uso:  node scripts/build-plataformas.mjs [zt|drupal|app|all] [--out <dir>]
 *
 * - La versión vive en <plataforma>/shared/version.json  ({ "version": "1.0.0" }).
 * - Las versiones son INMUTABLES: si dist/…/vX.Y.Z/ ya existe con contenido
 *   distinto, el build FALLA (sube la versión en version.json). Si es idéntico, no hace nada.
 * - NO incluye el Design System (core.css, icons, mp-tabs.js): ese paquete es
 *   aparte (compensar.min.css) y se carga ANTES que este.
 * - Sin dependencias: minificador conservador propio (ver abajo).
 * ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // Flujos/prototipos
const COMUN = { css: ['shared/css/compensar.css'], js: ['shared/js/compensar.js'] };

/* Orden = cascada / dependencias. Para ZT se respeta el orden real con que los
 * flujos enlazan los componentes (los CSS tienen misma especificidad); los
 * componentes que ningún flujo usa aún van al final. */
const PLATAFORMAS = {
  zt: {
    css: ['zt/shared/zt.css', ...[
      'stepper', 'radio', 'dropdown', 'datepicker', 'form-error', 'readonly-field',
      'person-summary', 'modal', 'file-upload', 'action-card', 'switch', 'status-result', 'otp-input', 'benef-card',
    ].map(c => `zt/shared/components/${c}.css`)],
    js: ['zt/shared/zt-sidebar.js', ...[
      'stepper', 'dropdown', 'datepicker', 'alert', 'person-summary', 'modal',
      'file-upload', 'action-card', 'switch', 'status-result', 'otp-input', 'benef-card',
    ].map(c => `zt/shared/components/${c}.js`)],
    // Archivos de shared/ que NO van al paquete (y por qué)
    excluir: {
      'zt/shared/afiliacion-mock.js': 'datos ficticios del flujo de afiliación, no de la plataforma',
      'zt/shared/zt.js': 'vacío (solo comentario); se incluye para que futuras reglas lleguen solas',
    },
  },
  drupal: {
    css: ['drupal/shared/drupal.css', 'drupal/shared/nav-prototype.css'],
    js: ['drupal/shared/drupal.js', 'drupal/shared/nav-data.js', 'drupal/shared/nav-shell.js', 'drupal/shared/nav-flyout.js'],
    excluir: {},
  },
  app: {
    css: ['app/shared/app.css'],
    js: ['app/shared/app-viewer.js'],
    excluir: {},
  },
};
// zt.js sí entra (vacío): se quita de "excluir" y se añade al JS tras el sidebar.
PLATAFORMAS.zt.js.splice(1, 0, 'zt/shared/zt.js');
delete PLATAFORMAS.zt.excluir['zt/shared/zt.js'];
PLATAFORMAS.zt.excluir['zt/shared/components/README.md'] = 'documentación';
PLATAFORMAS.drupal.excluir['drupal/shared/header/.gitkeep'] = 'placeholder';
PLATAFORMAS.zt.excluir['zt/shared/header/.gitkeep'] = 'placeholder';

/* ---------------- utilidades ---------------- */
const sha = (alg, buf, enc) => crypto.createHash(alg).update(buf).digest(enc);
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function git(args) {
  try { return execFileSync('git', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
}

/* ---------------- minificadores (conservadores) ---------------- */
function minCss(src, file, onUrl) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {            // comentario
      const e = src.indexOf('*/', i + 2);
      i = e === -1 ? n : e + 2;
      out += ' ';
    } else if (c === '"' || c === "'") {               // string
      let j = i + 1;
      while (j < n && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1); i = j + 1;
    } else if (src.startsWith('url(', i)) {            // url(...)
      let j = i + 4;
      while (/\s/.test(src[j])) j++;
      let q = src[j] === '"' || src[j] === "'" ? src[j] : null;
      let a = q ? j + 1 : j, b;
      if (q) { b = a; while (b < n && src[b] !== q) b += src[b] === '\\' ? 2 : 1; }
      else { b = src.indexOf(')', a); while (/\s/.test(src[b - 1])) b--; }
      const url = src.slice(a, b);
      const close = src.indexOf(')', b);
      out += 'url("' + onUrl(url.trim(), file) + '")';
      i = close + 1;
    } else if (src.startsWith('@import', i)) {
      throw new Error(`${file}: @import no soportado en el paquete (concatenar explícitamente)`);
    } else if (/\s/.test(c)) {
      while (i < n && /\s/.test(src[i])) i++;
      out += ' ';
    } else { out += c; i++; }
  }
  return out
    .replace(/ ?([{};,]) ?/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();
}

const KW_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'instanceof', 'yield', 'await']);
/* Quita comentarios y sangrías; conserva los saltos de línea (a salvo de ASI),
 * strings, templates y regex intactos. */
function minJs(src, file) {
  let out = '', i = 0, prev = '', prevWord = '';
  const n = src.length;
  const tplStack = [];                 // profundidad de llaves dentro de ${ }
  let braces = 0;
  const setPrev = ch => { prev = ch; };
  const readTemplate = () => {         // lee desde después de "`" o "}" de cierre de ${}
    let j = i;
    while (j < n) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') { out += src.slice(i, j + 1); i = j + 1; setPrev('`'); return; }
      if (src[j] === '$' && src[j + 1] === '{') {
        out += src.slice(i, j + 2); i = j + 2; tplStack.push(braces); braces++; setPrev('{'); return;
      }
      j++;
    }
    throw new Error(`${file}: template literal sin cerrar`);
  };
  let atLineStart = true;
  while (i < n) {
    const c = src[i];
    if (c === '\n') {
      if (!atLineStart) out += '\n';
      atLineStart = true; i++; continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      if (!atLineStart) { // espacio interno: colapsa
        let j = i; while (j < n && (src[j] === ' ' || src[j] === '\t' || src[j] === '\r')) j++;
        if (src[j] !== '\n' && j < n) out += ' ';
        i = j; continue;
      }
      i++; continue;
    }
    atLineStart = false;
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      const body = src.slice(i, e + 2);
      i = e + 2;
      if (/^\/\*!/.test(body)) out += body;            // conserva /*! licencias */
      else if (body.includes('\n')) { out += '\n'; atLineStart = true; }
      else out += ' ';
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, j + 1); i = j + 1; setPrev(c); prevWord = ''; continue;
    }
    if (c === '`') { out += c; i++; readTemplate(); prevWord = ''; continue; }
    if (c === '{') { braces++; }
    if (c === '}') {
      braces--;
      if (tplStack.length && tplStack[tplStack.length - 1] === braces) {
        tplStack.pop(); out += '}'; i++; readTemplate(); prevWord = ''; continue;
      }
    }
    if (c === '/') {                                   // ¿división o regex?
      const isRegex = prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || KW_REGEX.has(prevWord);
      if (isRegex) {
        let j = i + 1, inClass = false;
        while (j < n && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') inClass = true;
          else if (src[j] === ']') inClass = false;
          else if (src[j] === '/' && !inClass) break;
          j++;
        }
        if (src[j] !== '/') throw new Error(`${file}: regex sin cerrar cerca de «${src.slice(i, i + 30)}»`);
        j++; while (/[a-z]/i.test(src[j] || '')) j++;
        out += src.slice(i, j); i = j; setPrev(')'); prevWord = ''; continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[\w$]/.test(src[j])) j++;
      prevWord = src.slice(i, j); out += prevWord; i = j; setPrev('a'); continue;
    }
    out += c; i++;
    if (!/\s/.test(c)) { setPrev(c); prevWord = ''; }
  }
  return out.replace(/ +\n/g, '\n').trim();
}

/* ---------------- build ---------------- */
function leerVersion(plat) {
  const f = path.join(ROOT, plat, 'shared', 'version.json');
  if (!fs.existsSync(f)) throw new Error(`Falta ${plat}/shared/version.json ({ "version": "1.0.0" })`);
  const v = JSON.parse(fs.readFileSync(f, 'utf8')).version;
  if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error(`${plat}/shared/version.json: versión inválida «${v}» (X.Y.Z)`);
  return v;
}

function auditarCobertura(plat, cfg) {
  // Todo css/js de <plat>/shared debe estar incluido o excluido explícitamente.
  const conocidos = new Set([...COMUN.css, ...COMUN.js, ...cfg.css, ...cfg.js, ...Object.keys(cfg.excluir)]);
  const huerfanos = [];
  (function walk(d) {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const rel = `${d}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.(css|js)$/.test(e.name) && !conocidos.has(rel)) huerfanos.push(rel);
    }
  })(`${plat}/shared`);
  if (huerfanos.length) throw new Error(`${plat}: archivos en shared/ sin clasificar (inclúyelos o exclúyelos en PLATAFORMAS): ${huerfanos.join(', ')}`);
}

function construir(plat, outRoot) {
  const cfg = PLATAFORMAS[plat];
  const version = leerVersion(plat);
  auditarCobertura(plat, cfg);
  const nombre = `compensar-${plat}`;
  const archivos = new Map();                    // ruta relativa dentro de la versión -> Buffer
  const assets = new Map();                      // origen absoluto -> nombre destino

  const onUrl = (url, fromFile) => {
    if (/^(data:|https?:|\/\/|#)/i.test(url)) return url;
    if (url.startsWith('/')) throw new Error(`${fromFile}: url(${url}) absoluta no soportada`);
    const clean = url.split(/[?#]/)[0], suffix = url.slice(clean.length);
    const abs = path.resolve(path.dirname(path.join(ROOT, fromFile)), clean);
    if (!fs.existsSync(abs)) throw new Error(`${fromFile}: url(${url}) no existe`);
    let dest = assets.get(abs);
    if (!dest) {
      dest = path.basename(abs);
      for (const [o, d] of assets) if (d === dest && o !== abs) dest = sha('sha1', abs, 'hex').slice(0, 8) + '-' + dest;
      assets.set(abs, dest);
      archivos.set(`assets/${dest}`, fs.readFileSync(abs));
    }
    return `assets/${dest}${suffix}`;
  };

  const cssSrc = [...COMUN.css, ...cfg.css], jsSrc = [...COMUN.js, ...cfg.js];
  const banner = `/*! ${nombre} v${version} | Compensar | Generado por build-plataformas.mjs */\n`;
  const css = banner + cssSrc.map(f => minCss(rd(f), f, onUrl)).filter(Boolean).join('\n') + '\n';
  const js = banner + jsSrc.map(f => minJs(rd(f), f)).filter(Boolean).join('\n;\n') + '\n';

  new vm.Script(js, { filename: `${nombre}.min.js` });          // error de sintaxis => falla el build
  archivos.set(`${nombre}.min.css`, Buffer.from(css));
  archivos.set(`${nombre}.min.js`, Buffer.from(js));

  const dirVersion = path.join(outRoot, nombre, `v${version}`);
  // Inmutabilidad
  if (fs.existsSync(dirVersion)) {
    const existentes = [];
    (function walk(d, pre) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name), pre + e.name + '/');
        else if (pre + e.name !== 'manifest.json') existentes.push(pre + e.name);
      }
    })(dirVersion, '');
    const nuevos = [...archivos.keys()];
    const igual = existentes.length === nuevos.length && nuevos.every(k =>
      fs.existsSync(path.join(dirVersion, k)) && Buffer.compare(fs.readFileSync(path.join(dirVersion, k)), archivos.get(k)) === 0);
    if (!igual) {
      throw new Error(`${nombre} v${version} ya existe con contenido distinto. Las versiones son inmutables: sube la versión en ${plat}/shared/version.json (sin tocar dist/${nombre}/v${version}).`);
    }
    return { plat, nombre, version, estado: 'sin cambios (idéntica)', dir: dirVersion };
  }

  const commit = git(['rev-parse', 'HEAD']);
  const sucio = !!git(['status', '--porcelain', '--', plat + '/shared', 'shared/css', 'shared/js']);
  const manifest = {
    paquete: nombre, version, plataforma: plat,
    commit, commitCorto: commit && commit.slice(0, 7), arbolSucio: sucio,
    fecha: new Date().toISOString(),
    fuentes: { css: cssSrc, js: jsSrc, excluidos: cfg.excluir },
    archivos: {},
  };
  for (const [rel, buf] of [...archivos].sort(([a], [b]) => a.localeCompare(b))) {
    manifest.archivos[rel] = {
      bytes: buf.length,
      sha256: sha('sha256', buf, 'hex'),
      integrity: 'sha384-' + sha('sha384', buf, 'base64'),
    };
  }
  fs.mkdirSync(dirVersion, { recursive: true });
  for (const [rel, buf] of archivos) {
    fs.mkdirSync(path.dirname(path.join(dirVersion, rel)), { recursive: true });
    fs.writeFileSync(path.join(dirVersion, rel), buf);
  }
  fs.writeFileSync(path.join(dirVersion, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { plat, nombre, version, estado: 'creada', dir: dirVersion, manifest };
}

/* ---------------- main ---------------- */
const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const outRoot = oi !== -1 ? path.resolve(args.splice(oi, 2)[1]) : path.join(ROOT, 'dist');
const objetivo = args[0] || 'all';
const lista = objetivo === 'all' ? Object.keys(PLATAFORMAS) : [objetivo];
let fallo = false;
for (const p of lista) {
  if (!PLATAFORMAS[p]) { console.error(`Plataforma desconocida: ${p}`); process.exit(2); }
  try {
    const r = construir(p, outRoot);
    console.log(`✔ ${r.nombre} v${r.version} — ${r.estado}  → ${path.relative(ROOT, r.dir)}`);
    if (r.manifest) for (const [k, v] of Object.entries(r.manifest.archivos)) console.log(`    ${k}  ${v.bytes} B`);
  } catch (e) {
    fallo = true; console.error(`✘ ${p}: ${e.message}`);
  }
}
process.exit(fallo ? 1 : 0);
