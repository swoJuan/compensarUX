#!/usr/bin/env node
/**
 * build.mjs — Genera el sitio estático del Portal UX en dist/.
 *
 * El portal es el repositorio CENTRALIZADOR: no contiene diseño ni flujos,
 * los lee de los otros dos repositorios (solo lectura) y los publica juntos.
 *
 * 1. Copia el sistema de diseño (lista blanca) a dist/ds/.
 * 2. Copia los flujos publicados (lista blanca + dependencias comunes) a dist/p/,
 *    con su estructura intacta. Los prototipos NO se modifican.
 * 3. Crea páginas "no publicado" para los flujos enlazados que no se publican.
 * 4. Copia la plantilla del portal resolviendo <!-- @include nombre -->.
 * 5. Genera dist/catalogo.json y dist/estado.json (repositorios, sincronización
 *    sistema de diseño → prototipos y mapa de componentes).
 * 6. Arma los paquetes de descarga en dist/ds/descargas/ (core y .NET MAUI).
 * 7. Escribe robots.txt bloqueando buscadores y rastreadores de IA.
 * 8. Falla si algún archivo publicado coincide con fuentes.json → prohibidos.
 *
 * Uso: npm run build       → dist/ (vista previa local)
 *      npm run publicar    → ../../sitio/ (el sitio que se publica, dentro del repositorio)
 *
 * La carpeta de salida se borra y se vuelve a generar en cada build: no guardes
 * nada tuyo dentro. Se puede cambiar con la variable PORTAL_DIST.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson, matcher, walk, Fuente, estadoSincronizacion, mapaComponentes } from './lib/fuentes.mjs';
import { crearZip } from './lib/zip.mjs';
import { archivosMaui } from './lib/maui.mjs';

const DIST = process.env.PORTAL_DIST ? path.resolve(process.env.PORTAL_DIST) : path.join(ROOT, 'dist');
const PORTAL = path.join(ROOT, 'portal');
const cfg = readJson('fuentes.json');
const catalogo = readJson('catalogo.json');
const depthPrefix = (relFile) => '../'.repeat(relFile.split('/').length - 1);
const t0 = Date.now();

/* ---------- 1. limpiar ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* ---------- 2. sistema de diseño ---------- */
const ds = new Fuente('designSystem', cfg.designSystem);
const prohibido = matcher(cfg.prohibidos);
const dsIncluir = matcher(cfg.designSystem.incluir);
const dsExcluir = matcher(cfg.designSystem.excluir);
const dsArchivos = ds.listar().filter((f) => dsIncluir(f) && !dsExcluir(f) && !prohibido(f));
ds.copiar(dsArchivos, path.join(DIST, cfg.designSystem.destino));

/* ---------- 3. flujos ---------- */
const fl = new Fuente('flujos', cfg.flujos);
const flujos = catalogo.flujos;
const ids = new Set();
for (const f of flujos) {
  if (ids.has(f.id)) throw new Error(`Id de flujo duplicado en catalogo.json: ${f.id}`);
  ids.add(f.id);
  if (!cfg.plataformas[f.plataforma]) throw new Error(`Plataforma desconocida en ${f.id}: ${f.plataforma}`);
}
const publicados = flujos.filter((f) => f.publicar);
const plataformasUsadas = [...new Set(publicados.map((f) => f.plataforma))];
const flIncluir = matcher([
  ...(cfg.flujos.comun || []),
  ...plataformasUsadas.flatMap((p) => cfg.plataformas[p].comun || []),
  ...publicados.flatMap((f) => f.incluir || [f.ruta.replace(/\/?$/, '/') + '**']),
]);
const flExcluir = matcher(cfg.flujos.excluir);
const flArchivos = fl.listar().filter((f) => flIncluir(f) && !flExcluir(f) && !prohibido(f));
fl.copiar(flArchivos, path.join(DIST, cfg.flujos.destino));
for (const f of publicados) {
  const entrada = path.join(DIST, cfg.flujos.destino, f.ruta, f.entrada || 'index.html');
  if (!fs.existsSync(entrada)) throw new Error(`El flujo ${f.id} no tiene su entrada en ${cfg.flujos.ref}: ${f.ruta}${f.entrada || 'index.html'}`);
}

/* ---------- 4. páginas "no publicado" ---------- */
const stubs = [];
for (const f of flujos.filter((x) => !x.publicar && plataformasUsadas.includes(x.plataforma))) {
  const rel = `${cfg.flujos.destino}/${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}`;
  const destino = path.join(DIST, rel);
  if (fs.existsSync(destino)) continue;
  const pre = depthPrefix(rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, `<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="${cfg.robots.meta}">
<title>Flujo no publicado · Portal UX Compensar</title>
<link rel="stylesheet" href="${pre}ds/css/core.css">
<link rel="stylesheet" href="${pre}ds/icons/icons.css">
<link rel="stylesheet" href="${pre}css/portal-ux.css">
</head>
<body class="pux-stub">
<main class="pux-stub__box">
  <div class="mp-empty-state mp-empty-state--bordered">
    <div class="mp-empty-state__icon"><i class="icon icon-eye-slash" aria-hidden="true"></i></div>
    <h1 class="mp-h4 mp-empty-state__title">«${f.nombre}» aún no está publicado</h1>
    <p class="mp-body-m mp-empty-state__desc">Este flujo existe en el repositorio de UX, pero no forma parte de esta publicación del portal.</p>
    <div class="mp-empty-state__action">
      <a class="mp-btn mp-btn--secundario" href="javascript:history.back()">Volver</a>
      <a class="mp-btn mp-btn--primario" href="${pre}prototipos.html" target="_top">Ir al catálogo</a>
    </div>
  </div>
</main>
</body>
</html>
`);
  stubs.push(rel);
}

/* ---------- 5. plantilla del portal ---------- */
const partials = {};
const partialsDir = path.join(PORTAL, '_partials');
for (const name of fs.readdirSync(partialsDir)) {
  if (name.endsWith('.html')) partials[name.replace(/\.html$/, '')] = fs.readFileSync(path.join(partialsDir, name), 'utf8').trim();
}
for (const f of walk(PORTAL).filter((x) => !x.startsWith('_partials/') && !prohibido(x))) {
  const to = path.join(DIST, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!f.endsWith('.html')) { fs.copyFileSync(path.join(PORTAL, f), to); continue; }
  let html = fs.readFileSync(path.join(PORTAL, f), 'utf8');
  html = html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (m, name) => {
    if (!(name in partials)) throw new Error(`Parcial inexistente "${name}" en portal/${f}`);
    return partials[name];
  });
  html = html.replace(/\{\{robots\}\}/g, cfg.robots.meta);
  fs.writeFileSync(to, html);
}

/* ---------- 6. catálogo y estado ---------- */
const infoDs = ds.info();
const infoFl = fl.info();

/* ---------- 6b. paquetes de descarga ----------
   Dos .zip listos para llevarse: el core tal como se publica (CSS, iconos y JS) y
   los diccionarios de recursos de .NET MAUI, generados de los mismos tokens. Se
   arman en cada build, así que siempre corresponden a la versión publicada. */
const versionDs = infoDs.version || `commit-${String(infoDs.commit || '').slice(0, 7)}`;
const fechaDs = infoDs.fecha ? new Date(infoDs.fecha) : new Date();
const dsDir = path.join(DIST, cfg.designSystem.destino);
const esDocs = (rel) => /-docs\.js$/.test(rel) || /^js\/(docs-|code-copy\.js$)/.test(rel);
const delCore = (rel) =>
  /^css\/(core|themes)\.css$/.test(rel) ||
  rel === 'icons/icons.css' || rel.startsWith('icons/fonts/') ||
  (rel.startsWith('js/') && rel.endsWith('.js') && !esDocs(rel));

const archivosCore = walk(dsDir).filter(delCore).sort();
const leemeCore = [
  `Sistema de diseño de Compensar — core`,
  `${versionDs} · commit ${infoDs.commit} · ${String(infoDs.fecha || '').slice(0, 10)}`,
  ``,
  `Qué trae`,
  `  css/core.css     Estilos, componentes y tokens del sistema (tema claro).`,
  `  css/themes.css   Temas oscuro y de alto contraste.`,
  `  icons/icons.css  Tipografía de iconos; sus archivos van en icons/fonts/.`,
  `  js/              Comportamiento de los componentes que lo necesitan.`,
  ``,
  `Cómo usarlo`,
  `  <link rel="stylesheet" href="css/core.css">`,
  `  <link rel="stylesheet" href="css/themes.css">`,
  `  <link rel="stylesheet" href="icons/icons.css">`,
  ``,
  `  El tema se elige con data-theme en <html>: light, dark o high-contrast.`,
  `  Conserva la estructura de carpetas: icons.css busca las fuentes en icons/fonts/.`,
  ``,
  `Este paquete se genera en cada publicación del portal. No lo edites: los cambios`,
  `se hacen en el sistema de diseño y vuelven a bajar aquí en la siguiente versión.`,
  ``,
].join('\n');
const raizCore = `compensar-core-${versionDs}`;
const zipCore = crearZip([
  ...archivosCore.map((rel) => ({ nombre: `${raizCore}/${rel}`, datos: fs.readFileSync(path.join(dsDir, rel)) })),
  { nombre: `${raizCore}/LEEME.txt`, datos: leemeCore },
], fechaDs);

const tokensDs = JSON.parse(ds.leer('tokens/compensar.tokens.json') || '{}');
const maui = archivosMaui(tokensDs, versionDs);
if (maui.sinResolver.length) {
  console.warn(`  Aviso: ${maui.sinResolver.length} tokens de color sin valor literal, fuera del paquete MAUI: ${maui.sinResolver.slice(0, 5).join(', ')}`);
}
const leemeMaui = [
  `Sistema de diseño de Compensar — .NET MAUI`,
  `${versionDs} · generado de tokens/compensar.tokens.json`,
  ``,
  `Qué trae`,
  `  Resources/Styles/Compensar.Colors.xaml  Los colores del sistema.`,
  `  Resources/Styles/Compensar.Sizes.xaml   Espaciados y medidas, como x:Double.`,
  ``,
  `Cómo usarlo — en App.xaml:`,
  `  <Application.Resources>`,
  `    <ResourceDictionary>`,
  `      <ResourceDictionary.MergedDictionaries>`,
  `        <ResourceDictionary Source="Resources/Styles/Compensar.Colors.xaml" />`,
  `        <ResourceDictionary Source="Resources/Styles/Compensar.Sizes.xaml" />`,
  `      </ResourceDictionary.MergedDictionaries>`,
  `    </ResourceDictionary>`,
  `  </Application.Resources>`,
  ``,
  `Cada color va dos veces: la clave normal es el modo claro y la misma clave`,
  `terminada en _Dark es el modo oscuro, para usarlas juntas:`,
  ``,
  `  <Setter Property="BackgroundColor"`,
  `          Value="{AppThemeBinding Light={StaticResource UseBackgroundPage},`,
  `                                  Dark={StaticResource UseBackgroundPage_Dark}}" />`,
  ``,
  `El modo de alto contraste de la web no está aquí: MAUI solo distingue claro y oscuro.`,
  `Los archivos se generan en cada publicación del portal. No los edites a mano: los`,
  `cambios se hacen en los tokens del sistema de diseño.`,
  ``,
].join('\n');
const raizMaui = `compensar-maui-${versionDs}`;
const zipMaui = crearZip([
  ...maui.archivos.map((a) => ({ nombre: `${raizMaui}/${a.nombre}`, datos: a.datos })),
  { nombre: `${raizMaui}/LEEME.txt`, datos: leemeMaui },
], fechaDs);

const carpetaDescargas = path.join(dsDir, 'descargas');
fs.mkdirSync(carpetaDescargas, { recursive: true });
const descargas = [
  {
    id: 'core',
    nombre: 'Core del sistema de diseño',
    descripcion: 'CSS, iconos y JS tal como los usan los prototipos y el portal. Para Drupal, Angular o cualquier proyecto web.',
    archivo: `${raizCore}.zip`,
    contenido: archivosCore.length + 1,
    bytes: zipCore.length,
    datos: zipCore,
  },
  {
    id: 'maui',
    nombre: 'Recursos para .NET MAUI',
    descripcion: 'Colores y medidas como diccionarios de recursos XAML, generados de los tokens de esta misma versión.',
    archivo: `${raizMaui}.zip`,
    contenido: maui.archivos.length + 1,
    bytes: zipMaui.length,
    datos: zipMaui,
  },
].map(({ datos, ...meta }) => {
  fs.writeFileSync(path.join(carpetaDescargas, meta.archivo), datos);
  return { ...meta, version: versionDs, url: `${cfg.designSystem.destino}/descargas/${meta.archivo}` };
});

/* Versiones del sistema de diseño: los tags del repositorio, más las notas que UX
   escribe en versiones.json y la versión que hoy consumen los prototipos. */
const notasVersiones = fs.existsSync(path.join(ROOT, 'versiones.json')) ? readJson('versiones.json') : {};
let dsEnPrototipos = null;
try {
  const reg = JSON.parse(fl.leer('shared/vendor/ds-version.json'));
  dsEnPrototipos = {
    tag: reg.ds.tag || null,
    commit: String(reg.ds.commit || '').slice(0, 7),
    fecha: reg.ds.fecha || null,
    sincronizado: reg.sincronizado || null,
  };
} catch { dsEnPrototipos = null; }
const versionesDs = ds.versiones().map((v, i, todas) => ({
  ...v,
  primera: i === todas.length - 1,
  enPrototipos: !!(dsEnPrototipos && dsEnPrototipos.tag === v.tag),
  revisar: (notasVersiones[v.tag] || {}).revisar || null,
}));
/* El sistema de diseño, los prototipos y el portal viven en un solo repositorio,
   cada uno en su carpeta. Se informa el repositorio una vez y, dentro, cada carpeta
   con su último cambio. Si alguna vez volvieran a estar separados, `unico` lo dice. */
const po = new Fuente('portal', { nombre: cfg.portal.nombre, rol: cfg.portal.rol, repo: '.' });
const carpetas = [
  { id: 'designSystem', fuente: ds, nombre: cfg.designSystem.nombre, rol: cfg.designSystem.rol },
  { id: 'flujos', fuente: fl, nombre: cfg.flujos.nombre, rol: cfg.flujos.rol },
  { id: 'portal', fuente: po, nombre: cfg.portal.nombre, rol: cfg.portal.rol },
];
const repositorio = {
  unico: po.raiz === ds.raiz && po.raiz === fl.raiz,
  nombre: path.basename(po.raiz || ROOT),
  rama: po.rama(),
  remoto: po.remoto(),
  version: infoDs.version,
  commits: po.commitsRepo(),
  commitsSinSubir: po.sinSubir(),
  pendientes: po.pendientesRepo(),
  carpetas: carpetas.map((c) => {
    const u = c.fuente.ultimoCambio();
    return {
      id: c.id, nombre: c.nombre, rol: c.rol,
      carpeta: c.fuente.prefijo || '.',
      commit: u.commit, fecha: u.fecha,
      pendientes: c.fuente.pendientes(),
    };
  }),
};
const plataformas = Object.fromEntries(Object.entries(cfg.plataformas).map(([id, p]) => [id, {
  nombre: p.nombre, nombreCorto: p.nombreCorto || p.nombre, tecnologia: p.tecnologia, descripcion: p.descripcion,
}]));
const salida = {
  generado: new Date().toISOString(),
  fuentes: {
    designSystem: { ...infoDs, versiones: versionesDs, prototipos: dsEnPrototipos, descargas },
    flujos: infoFl,
  },
  plataformas,
  flujos: flujos.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    plataforma: f.plataforma,
    version: f.version,
    estado: f.estado,
    figma: f.figma || null,
    hu: f.hu || [],
    publicado: !!f.publicar,
    url: f.publicar ? `${cfg.flujos.destino}/${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}` : null,
    actualizado: fl.ultimaFecha(f.incluir || [f.ruta]),
    cambios: fl.historial(20, f.incluir || [f.ruta]),
    aprobacionUX: f.aprobacionUX || { aprobado: false, por: null, fecha: null },
  })),
};
fs.writeFileSync(path.join(DIST, 'catalogo.json'), JSON.stringify(salida, null, 2));

const sincronizacion = estadoSincronizacion(ds, fl, cfg.sincronizacion.archivos);
const componentes = mapaComponentes(ds, fl);

/* Cifras del sistema de diseño: se cuentan del propio sistema en cada build, para que
   la portada no dependa de una lista escrita a mano que se desactualiza. */
const distintos = (texto, re) => { const v = new Set(); let m; while ((m = re.exec(texto || ''))) v.add(m[1]); return v.size; };
componentes.cifras = {
  iconos: distintos(ds.leer('icons/icons.css'), /\.icon-([a-z][a-z0-9-]*)/g),
  tokens: distintos(ds.leer('css/core.css'), /--(use-[a-z0-9-]+)\s*:/g),
  modos: 3,
};
fs.writeFileSync(path.join(DIST, 'estado.json'), JSON.stringify({
  generado: salida.generado,
  repositorio,
  sincronizacion: { ...sincronizacion, version: infoDs.version, comando: 'npm run ds:sincronizar' },
  componentes,
}, null, 2));

/* ---------- 7. bloqueo de rastreadores ---------- */
const robots = ['# Portal UX Compensar — uso interno. No indexar ni rastrear.', 'User-agent: *', 'Disallow: /', ''];
for (const bot of cfg.robots.bloquear) robots.push(`User-agent: ${bot}`, 'Disallow: /', '');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots.join('\n'));

/* ---------- 8. red de seguridad ---------- */
const todos = walk(DIST);
const violaciones = todos.filter(prohibido);
if (violaciones.length) {
  fs.rmSync(DIST, { recursive: true, force: true });
  throw new Error('Build cancelado: archivos prohibidos en la salida:\n  ' + violaciones.join('\n  '));
}

/* ---------- resumen ---------- */
console.log(`Portal UX — build listo en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`  ${infoDs.nombre}: ${dsArchivos.length} archivos (${infoDs.version || 'sin versión etiquetada'} · ref ${infoDs.ref} → ${infoDs.commit}, ${infoDs.fecha?.slice(0, 10)})`);
console.log(`  Versiones publicadas: ${versionesDs.length ? versionesDs.map((v) => v.tag).join(', ') : 'ninguna'}${dsEnPrototipos?.tag ? ` · prototipos en ${dsEnPrototipos.tag}` : ''}`);
console.log(`  ${infoFl.nombre}: ${flArchivos.length} archivos (ref ${infoFl.ref} → ${infoFl.commit}, ${infoFl.fecha?.slice(0, 10)})`);
console.log(`  Flujos publicados: ${publicados.map((f) => f.id).join(', ') || 'ninguno'}`);
console.log(`  Sincronización DS → prototipos: ${sincronizacion.estado === 'al-dia' ? 'al día' : 'DESACTUALIZADA (npm run ds:estado)'}`);
if (stubs.length) console.log(`  Páginas "no publicado": ${stubs.length}`);
console.log(`  Descargas: ${descargas.map((d) => `${d.archivo} (${(d.bytes / 1024).toFixed(0)} kB)`).join(' · ')}`);
const salidaRel = path.relative(ROOT, DIST) || '.';
console.log(`  Total en ${salidaRel}/: ${todos.length} archivos`);
if (process.env.PORTAL_DIST) {
  console.log(`\n  Carpeta lista para subir: ${DIST}`);
  console.log('  Contiene index.html en su raíz. Sube esta carpeta, no la carpeta del proyecto.');
}
