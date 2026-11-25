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
import crypto from 'node:crypto';
import { ROOT, readJson, matcher, walk, Fuente, estadoSincronizacion, mapaComponentes } from './lib/fuentes.mjs';
import { crearZip } from './lib/zip.mjs';
import { generarPaqueteIA } from './lib/ia-docs.mjs';
import { archivosMaui } from './lib/maui.mjs';
import { contexto as ctxTraz, proyeccion as proyTraz, validarRegistro, validarDespliegues, desplieguesDelFlujo, commitsDelFlujo, pantallasDeVersion, enlaceCommit } from './lib/trazabilidad.mjs';
import { ALMACEN, idsAlmacen, listarVersiones, verificarAlmacen, verificarCatalogo, materializar, commitsDesde, generarSalidas } from './lib/versiones.mjs';

const DIST = process.env.PORTAL_DIST ? path.resolve(process.env.PORTAL_DIST) : path.join(ROOT, 'dist');
const PORTAL = path.join(ROOT, 'portal');
const cfg = readJson('fuentes.json');
// Solo para pruebas locales: PORTAL_DS_REF=WORKTREE lee el sistema de diseño tal cual, sin commit.
if (process.env.PORTAL_DS_REF) cfg.designSystem.ref = process.env.PORTAL_DS_REF;
const catalogo = readJson('catalogo.json');
const depthPrefix = (relFile) => '../'.repeat(relFile.split('/').length - 1);
const t0 = Date.now();

/* ---------- 0. versiones publicadas: guardia ----------
   Las versiones históricas viven en Flujos/versiones/ (fuera de la salida). El build solo las
   LEE: se niega a correr si la salida y el almacén se solapan, y se detiene ANTES de borrar
   la salida si alguna versión publicada fue alterada. */
const solapa = (a, b) => { const r = path.relative(a, b); return !r.startsWith('..') && !path.isAbsolute(r); };
if (solapa(ALMACEN, DIST) || solapa(DIST, ALMACEN)) throw new Error(`La salida (${DIST}) y el almacén de versiones (${ALMACEN}) no pueden solaparse: el build borraría versiones publicadas.`);
const problemasVersiones = [...verificarAlmacen(), ...verificarCatalogo(catalogo)];
if (problemasVersiones.length) throw new Error('Versiones publicadas con problemas (build cancelado, la salida actual no se tocó):\n  ' + problemasVersiones.join('\n  '));
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
  /* `categorias` (opcional): lista de etiquetas transversales en minúsculas, p. ej. ["swap"]. */
  if (f.categorias !== undefined) {
    if (!Array.isArray(f.categorias) || f.categorias.some((c) => typeof c !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c)) || new Set(f.categorias).size !== f.categorias.length)
      throw new Error(`categorias inválidas en ${f.id}: debe ser una lista sin repetidos de etiquetas en minúsculas (a-z, 0-9, guiones), p. ej. ["swap"]`);
  }
}
/* `entrega` (opcional): entrega a Desarrollo. { estado: 'ninguna'|'pendiente'|'entregado', fecha, por, nota }.
   Es un dato declarado por UX: no implica ZIP de handoff, publicación en el portal ni despliegue. */
const ENTREGA_ESTADOS = ['ninguna', 'pendiente', 'entregado'];
const entregaDe = (f) => {
  if (f.entrega === undefined) return { estado: 'ninguna', fecha: null, por: null, nota: null };
  const e = f.entrega;
  const mal = (m) => { throw new Error(`entrega inválida en ${f.id}: ${m}`); };
  if (!e || typeof e !== 'object' || Array.isArray(e)) mal('debe ser un objeto { estado, fecha, por, nota }');
  const extra = Object.keys(e).filter((k) => !['estado', 'fecha', 'por', 'nota'].includes(k));
  if (extra.length) mal(`campos desconocidos: ${extra.join(', ')}`);
  if (!ENTREGA_ESTADOS.includes(e.estado)) mal(`estado debe ser uno de ${ENTREGA_ESTADOS.join(', ')}`);
  if (e.fecha != null && !(/^\d{4}-\d{2}-\d{2}$/.test(e.fecha) && !isNaN(new Date(e.fecha)))) mal('fecha debe ser AAAA-MM-DD');
  for (const k of ['por', 'nota']) if (e[k] != null && (typeof e[k] !== 'string' || !e[k].trim())) mal(`${k} debe ser un texto no vacío`);
  if (e.estado === 'entregado' && (!e.fecha || !e.por)) mal("'entregado' exige fecha y por");
  return { estado: e.estado, fecha: e.fecha ?? null, por: e.por ?? null, nota: e.nota ?? null };
};
for (const f of flujos) entregaDe(f);
/* `handoffMaui` (opcional): paquete de handoff para .NET MAUI de un flujo. { carpeta, version }.
   `carpeta` es una ruta del repositorio bajo Flujos/entregables/maui-handoff/ con LEEME.txt y manifest.json.
   Si existe, la descarga del flujo es ESE paquete (no el ZIP del prototipo web). El build comprueba que cada
   archivo coincida con el SHA-256 del manifest y se detiene si no. */
const REPO_RAIZ = path.resolve(ROOT, '..', '..');
const HANDOFF_BASE = path.join(REPO_RAIZ, 'Flujos', 'entregables', 'maui-handoff');
const handoffMauiDe = (f) => {
  if (f.handoffMaui === undefined) return null;
  const h = f.handoffMaui;
  const mal = (m) => { throw new Error(`handoffMaui inválido en ${f.id}: ${m}`); };
  if (!h || typeof h !== 'object' || Array.isArray(h)) mal('debe ser un objeto { carpeta, version }');
  const extra = Object.keys(h).filter((k) => !['carpeta', 'version'].includes(k));
  if (extra.length) mal(`campos desconocidos: ${extra.join(', ')}`);
  if (typeof h.carpeta !== 'string' || !h.carpeta.trim()) mal('carpeta debe ser un texto no vacío');
  if (!/^\d+\.\d+\.\d+$/.test(h.version || '')) mal('version debe ser x.y.z');
  const dir = path.resolve(REPO_RAIZ, h.carpeta);
  const rel = path.relative(HANDOFF_BASE, dir);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) mal('carpeta debe estar dentro de Flujos/entregables/maui-handoff/');
  for (const obligatorio of ['LEEME.txt', 'manifest.json']) if (!fs.existsSync(path.join(dir, obligatorio))) mal(`falta ${obligatorio} en ${h.carpeta}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (manifest.flujo !== f.id) mal(`el manifest es del flujo «${manifest.flujo}»`);
  if (manifest.version !== h.version) mal(`la versión del manifest (${manifest.version}) no coincide con ${h.version}`);
  const enDisco = walk(dir).filter((r) => r !== 'manifest.json' && !r.endsWith('.DS_Store')).sort();
  const enManifest = manifest.archivos.map((a) => a.ruta).sort();
  if (JSON.stringify(enDisco) !== JSON.stringify(enManifest))
    mal(`los archivos de la carpeta no coinciden con manifest.json (regenéralo con tools/generar-manifest.mjs). Disco: ${enDisco.length}, manifest: ${enManifest.length}`);
  for (const a of manifest.archivos) {
    const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, a.ruta))).digest('hex');
    if (sha !== a.sha256) mal(`SHA-256 distinto en ${a.ruta} (regenera manifest.json)`);
  }
  return { dir, archivos: [...enDisco, 'manifest.json'].sort(), version: h.version, generadoEn: manifest.generadoEn };
};
const handoffsMaui = new Map(flujos.filter((f) => f.handoffMaui !== undefined).map((f) => [f.id, handoffMauiDe(f)]));
/* Estado del flujo: solo cuatro, en este orden. «entregado» = UX terminó; exige aprobación UX o entrega registradas. */
const ESTADOS_FLUJO = ['borrador', 'construccion', 'validacion-ux', 'entregado'];
for (const f of flujos) {
  if (!ESTADOS_FLUJO.includes(f.estado)) throw new Error(`estado «${f.estado}» no válido en ${f.id}. Usa: ${ESTADOS_FLUJO.join(', ')}.`);
  if (f.estado === 'entregado' && entregaDe(f).estado !== 'entregado' && !(f.aprobacionUX && f.aprobacionUX.aprobado)) throw new Error(`${f.id} está en «entregado» pero no tiene aprobación UX (aprobacionUX.aprobado) ni entrega registrada.`);
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

/* ---------- 3b. versiones publicadas de cada flujo ----------
   Cada versión se arma con sus recursos exactos (los de su huella) y sus archivos propios,
   con la estructura original, en versiones/<flujo>/v<x.y.z>/. No toca p/ (la vigente). */
const versionesFlujo = {};
for (const f of flujos) {
  const lista = listarVersiones(f.id);
  if (!lista.length) continue;
  versionesFlujo[f.id] = lista.map((m) => {
    materializar(m, path.join(DIST, 'versiones', f.id, `v${m.version}`));
    const salidas = generarSalidas({
      dist: DIST, raizVersion: `versiones/${f.id}/v${m.version}`, plataforma: f.plataforma, flujoId: f.id,
      flujos: publicados, volverAlPortal: (cfg.versiones?.volverAlPortal || {})[f.plataforma] || [], robots: cfg.robots.meta,
    });
    return {
      salidas,
      version: m.version,
      publicadaEl: m.publicadaEl,
      commit: m.commit.corto,
      commitCompleto: m.commit.completo,
      commitEnlace: enlaceCommit(fl, m.commit.completo),
      mensajeCommit: m.commit.mensaje,
      fechaCommit: m.commit.fecha,
      artefacto: `Flujos/versiones/${f.id}/v${m.version}`,
      pantallas: pantallasDeVersion(m, f),
      notas: m.notas,
      estadoUX: m.estadoUX,
      ds: m.ds,
      paquetesCdn: m.paquetesCdn,
      recursos: m.recursos,
      url: `versiones/${f.id}/v${m.version}/${m.entrada}`,
      vigente: m.version === f.version,
      cambiosSinVersion: commitsDesde(fl, m.commit.completo, f.incluir || [f.ruta]),
    };
  });
}
for (const id of idsAlmacen()) if (!ids.has(id)) console.warn(`  Aviso: hay versiones de "${id}" en el almacén, pero el flujo ya no está en catalogo.json (no se publican).`);
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
/* Nombre de los .zip: la versión de package.json del sistema de diseño (v2.4.0), no un commit. */
const versionPkgDs = (() => { try { return 'v' + JSON.parse(ds.leer('package.json')).version; } catch { return null; } })();
const versionArchivo = infoDs.version || versionPkgDs || versionDs;
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
const raizCore = `compensar-core-${versionArchivo}`;
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
const raizMaui = `compensar-maui-${versionArchivo}`;
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
  return { ...meta, version: versionArchivo, url: `${cfg.designSystem.destino}/descargas/${meta.archivo}` };
});

/* ---------- 6c. paquete de desarrollo por flujo ----------
   Cada flujo publicado se descarga con lo mismo que se publica: su carpeta y las
   dependencias comunes (shared/ y las de su plataforma), con la misma estructura,
   para que abra igual fuera del portal. */
const carpetaFlujosZip = path.join(DIST, 'descargas', 'flujos');
const fechaFl = infoFl.fecha ? new Date(infoFl.fecha) : new Date();
const descargasFlujos = {};
for (const f of publicados) {
  if (handoffsMaui.has(f.id)) {
    /* Este flujo se descarga como paquete de handoff MAUI; no se genera el ZIP del prototipo web. */
    const hm = handoffsMaui.get(f.id);
    const raizHm = `${f.id}-maui-handoff-v${hm.version}`;
    const datosHm = crearZip(
      hm.archivos.map((rel) => ({ nombre: `${raizHm}/${rel}`, datos: fs.readFileSync(path.join(hm.dir, rel)) })),
      new Date(hm.generadoEn));
    fs.mkdirSync(carpetaFlujosZip, { recursive: true });
    fs.writeFileSync(path.join(carpetaFlujosZip, `${raizHm}.zip`), datosHm);
    descargasFlujos[f.id] = { tipo: 'maui', etiqueta: 'Descarga MAUI', version: hm.version, archivo: `${raizHm}.zip`, bytes: datosHm.length, url: `descargas/flujos/${raizHm}.zip` };
    continue;
  }
  const incluye = matcher([
    ...(cfg.flujos.comun || []),
    ...(cfg.plataformas[f.plataforma].comun || []),
    ...(f.incluir || [f.ruta.replace(/\/?$/, '/') + '**']),
  ]);
  const archivos = flArchivos.filter(incluye).sort();
  const raiz = `${f.id}-v${f.version}`;
  const entradaFl = `${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}`;
  const leeme = [
    `${f.nombre} — prototipo de referencia UX (${cfg.plataformas[f.plataforma].nombre})`,
    `Versión ${f.version} · commit ${String(infoFl.commit || '').slice(0, 7)}`,
    ``,
    `Cómo abrirlo`,
    `  Abre ${entradaFl} en el navegador. Conserva la estructura de carpetas:`,
    `  las pantallas cargan estilos, iconos y scripts desde shared/.`,
    ``,
    `Es una referencia de UX, no código productivo. No lo edites aquí: los cambios`,
    `se hacen en el prototipo y vuelven a bajar en la siguiente publicación.`,
    ``,
  ].join('\n');
  const datos = crearZip([
    ...archivos.map((rel) => ({ nombre: `${raiz}/${rel}`, datos: fs.readFileSync(path.join(DIST, cfg.flujos.destino, rel)) })),
    { nombre: `${raiz}/LEEME.txt`, datos: leeme },
  ], fechaFl);
  fs.mkdirSync(carpetaFlujosZip, { recursive: true });
  fs.writeFileSync(path.join(carpetaFlujosZip, `${raiz}.zip`), datos);
  descargasFlujos[f.id] = { archivo: `${raiz}.zip`, bytes: datos.length, url: `descargas/flujos/${raiz}.zip` };
}

/* ---------- 6d. paquetes públicos (CDN) ----------
   Los paquetes versionados estilo Bootstrap: compensar (sistema de diseño, en
   Core-Design-System/dist/) y compensar-<plataforma> (prototipos, en
   Flujos/prototipos/dist/). Cada versión es una carpeta inmutable con manifest.json.
   Se publican tal cual en cdn/<paquete>/v<x.y.z>/ y, además, como .zip para
   quien los quiera en local. Los flujos que los enlazan se detectan leyendo su HTML. */
const cdnCfg = cfg.cdn || {};
const CDN_DESTINO = cdnCfg.destino || 'cdn';
const cdnDir = path.join(DIST, CDN_DESTINO);
const RE_VERSION_DIST = /^dist\/(compensar(?:-[a-z]+)?)\/v(\d+\.\d+\.\d+)\/(.+)$/;
const semverDesc = (a, b) => b.version.split('.').map(Number).reduce((r, n, i) => r || n - a.version.split('.').map(Number)[i], 0);
function publicarPaquetes(fuente, soloDs) {
  const archivos = fuente.listar().filter((f) => {
    const m = RE_VERSION_DIST.exec(f);
    return m && (m[1] === 'compensar') === soloDs;
  });
  if (!archivos.length) return;
  const tmp = path.join(DIST, `.cdn-${fuente.id}`);
  fuente.copiar(archivos, tmp);
  for (const pkg of fs.readdirSync(path.join(tmp, 'dist'))) {
    fs.mkdirSync(path.join(cdnDir, pkg), { recursive: true });
    for (const v of fs.readdirSync(path.join(tmp, 'dist', pkg))) {
      fs.renameSync(path.join(tmp, 'dist', pkg, v), path.join(cdnDir, pkg, v));
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
publicarPaquetes(ds, true);
publicarPaquetes(fl, false);

const carpetaCdnZip = path.join(DIST, 'descargas', 'cdn');
const paquetesCdn = (fs.existsSync(cdnDir) ? fs.readdirSync(cdnDir) : []).sort().map((pkg) => {
  const plataforma = pkg === 'compensar' ? null : pkg.replace(/^compensar-/, '');
  const versiones = fs.readdirSync(path.join(cdnDir, pkg)).filter((v) => /^v\d+\.\d+\.\d+$/.test(v)).map((v) => {
    const dir = path.join(cdnDir, pkg, v);
    const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const lista = Object.entries(man.archivos || {}).map(([nombre, a]) => ({ nombre, bytes: a.bytes, integrity: a.integrity }));
    const raiz = `${pkg}-${v}`;
    const zip = crearZip([
      ...walk(dir).sort().map((rel) => ({ nombre: `${raiz}/${rel}`, datos: fs.readFileSync(path.join(dir, rel)) })),
      { nombre: `${raiz}/LEEME.txt`, datos: [
        `${pkg} ${v} — paquete compilado de Compensar`,
        ``,
        `Copia la carpeta en tu proyecto y enlaza los .min.css y .min.js.`,
        `Conserva la estructura: el CSS busca sus fuentes y recursos con rutas relativas.`,
        `manifest.json trae el hash de cada archivo (integrity) para verificarlo.`,
        `Versión inmutable: no la edites; los cambios llegan como una versión nueva.`,
        ``,
      ].join('\n') },
    ], (man.generado || man.fecha) ? new Date(man.generado || man.fecha) : new Date());
    fs.mkdirSync(carpetaCdnZip, { recursive: true });
    fs.writeFileSync(path.join(carpetaCdnZip, `${raiz}.zip`), zip);
    return {
      version: man.version || v.slice(1),
      fecha: man.generado || man.fecha || null,
      commit: String((man.ds && man.ds.commit) || man.commit || '').slice(0, 7) || null,
      ruta: `${CDN_DESTINO}/${pkg}/${v}`,
      css: lista.find((a) => a.nombre.endsWith('.min.css')) || null,
      js: lista.find((a) => a.nombre.endsWith('.min.js')) || null,
      archivos: lista,
      zip: { archivo: `${raiz}.zip`, bytes: zip.length, url: `descargas/cdn/${raiz}.zip` },
    };
  }).sort(semverDesc);
  return {
    id: pkg,
    plataforma,
    nombre: plataforma ? `Paquete ${(cfg.plataformas[plataforma] || {}).nombreCorto || (cfg.plataformas[plataforma] || {}).nombre || plataforma}` : 'Sistema de diseño',
    versiones,
  };
}).filter((p) => p.versiones.length);

/* Kits por equipo: un solo .zip con todo lo que necesita cada plataforma web
   (sistema de diseño + paquete de su plataforma), uno por versión del sistema de diseño.
   El paquete de plataforma va en su versión más reciente. */
const KITS = [
  { id: 'drupal', nombre: 'Drupal', descripcion: 'Sistema de diseño + paquete Drupal (navegación y estilos del portal web).' },
  { id: 'zt', nombre: 'Zona Transaccional', descripcion: 'Sistema de diseño + paquete ZT (modal, stepper, dropdown, alert y demás componentes de la oficina virtual).' },
];
const paqDs = paquetesCdn.find((p) => p.id === 'compensar');
const kitsCdn = paqDs ? KITS.map((k) => {
  const paqP = paquetesCdn.find((p) => p.id === `compensar-${k.id}`);
  if (!paqP) return null;
  const vP = paqP.versiones[0];
  return {
    ...k,
    versiones: paqDs.versiones.map((vD) => {
      const raiz = `compensar-para-${k.id}-v${vD.version}`;
      const dirD = path.join(cdnDir, 'compensar', `v${vD.version}`);
      const dirP = path.join(cdnDir, paqP.id, `v${vP.version}`);
      const enlaces = [
        `<link rel="stylesheet" href="compensar/v${vD.version}/compensar.min.css">`,
        `<link rel="stylesheet" href="${paqP.id}/v${vP.version}/${paqP.id}.min.css">`,
        `<link rel="stylesheet" href="css/mi-pantalla.css">   <!-- el CSS propio va al final -->`,
        ``,
        `<script src="compensar/v${vD.version}/compensar.min.js" defer></script>`,
        `<script src="${paqP.id}/v${vP.version}/${paqP.id}.min.js" defer></script>`,
      ];
      const zip = crearZip([
        ...walk(dirD).sort().map((rel) => ({ nombre: `${raiz}/compensar/v${vD.version}/${rel}`, datos: fs.readFileSync(path.join(dirD, rel)) })),
        ...walk(dirP).sort().map((rel) => ({ nombre: `${raiz}/${paqP.id}/v${vP.version}/${rel}`, datos: fs.readFileSync(path.join(dirP, rel)) })),
        { nombre: `${raiz}/LEEME.txt`, datos: [
          `Compensar para ${k.nombre} — sistema de diseño v${vD.version} + ${paqP.id} v${vP.version}`,
          ``,
          `Copia estas dos carpetas en tu proyecto y enlázalas en este orden:`,
          ``,
          ...enlaces.map((l) => `  ${l}`),
          ``,
          `Conserva la estructura de carpetas. También puedes usar el enlace público`,
          `(página Instalar del Portal UX) en lugar de los archivos locales.`,
          ...(k.id === 'zt' ? [``, `Menú lateral de ZT: declara la ruta a la raíz con data-zt-root en`, `<nav class="sidebar" data-zt-root="../../">.`] : []),
          ``,
          `Versiones inmutables: no las edites; los cambios llegan como versión nueva.`,
          ``,
        ].join('\n') },
      ], vD.fecha ? new Date(vD.fecha) : new Date());
      fs.writeFileSync(path.join(carpetaCdnZip, `${raiz}.zip`), zip);
      return { version: vD.version, plataformaVersion: vP.version, zip: { archivo: `${raiz}.zip`, bytes: zip.length, url: `descargas/cdn/${raiz}.zip` } };
    }),
  };
}).filter(Boolean) : [];

/* Qué consume cada flujo: enlaces a cdn/<paquete>/v<x>/ en su HTML, o la copia local de shared/. */
const RE_CDN_LINK = /\/(compensar(?:-[a-z]+)?)\/v(\d+\.\d+\.\d+)\/\1\.min\.(?:css|js)/g;
const todosFl = fl.listar();
function consumoFlujo(f) {
  const base = f.ruta.replace(/\/?$/, '/');
  const htmls = todosFl.filter((x) => x.startsWith(base) && x.endsWith('.html'));
  const enCdn = {};
  let locales = 0;
  for (const h of htmls) {
    const txt = fl.leer(h) || '';
    let m;
    RE_CDN_LINK.lastIndex = 0;
    while ((m = RE_CDN_LINK.exec(txt))) (enCdn[m[1]] ||= new Set()).add(m[2]);
    if (/shared\/vendor\/core\.css/.test(txt)) locales++;
  }
  const versionesDe = (pkg) => (enCdn[pkg] ? [...enCdn[pkg]].sort() : []);
  const plat = `compensar-${f.plataforma}`;
  const modo = Object.keys(enCdn).length ? (locales ? 'mixto' : 'cdn') : 'local';
  return {
    modo,
    pantallas: htmls.length,
    ds: versionesDe('compensar'),
    plataforma: versionesDe(plat),
  };
}

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
/* Respaldo: si el repositorio no tiene tags (se perdieron al unir los repos), se usa el
   historial guardado en versiones.json. Los tags reales, cuando existen, prevalecen. */
const versionesGit = ds.versiones();
const historico = Array.isArray(notasVersiones.historico) ? notasVersiones.historico : [];
const versionesBase = versionesGit.length ? versionesGit : [...historico]
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  .map((h) => ({ tag: h.tag, fecha: h.fecha, commit: h.commit, titulo: h.titulo || '', cuerpo: h.cuerpo || '', publicada: true, cambios: h.cambios || [], totalCambios: (h.cambios || []).length }));
/* Commits entre versiones del histórico: solo se pueden calcular si el commit de la versión
   existe en este repositorio. Si la versión anterior es del repositorio original, la base es
   el primer commit del monorepo (que ya contiene todo lo anterior). */
if (!versionesGit.length) {
  const raizDs = ds.commitRaiz();
  versionesBase.forEach((v, i, todas) => {
    if (v.cambios.length || !ds.existe(v.commit)) return;
    const previa = todas[i + 1];
    const base = previa && ds.existe(previa.commit) ? previa.commit : raizDs;
    if (!base || base.startsWith(v.commit) || v.commit.startsWith(base.slice(0, 7))) return;
    v.cambios = ds.detalleRango(base, v.commit);
    v.totalCambios = v.cambios.length;
  });
}
const versionesDs = versionesBase.map((v, i, todas) => ({
  ...v,
  primera: i === todas.length - 1,
  enPrototipos: !!(dsEnPrototipos && dsEnPrototipos.tag === v.tag),
  revisar: (notasVersiones[v.tag] || {}).revisar || null,
}));
/* Versión efectiva del sistema de diseño en el catálogo: el tag real o, sin tags, la más reciente del histórico. */
const versionDsCatalogo = infoDs.version || versionesDs[0]?.tag || null;
/* Control de la fuente: sin etiquetas de git, la versión sale de versiones.json (histórico manual).
   Si la del package.json del sistema de diseño no coincide, el histórico se quedó atrás: se avisa
   para que el inicio no muestre una versión desactualizada. */
if (!infoDs.version && versionPkgDs && versionDsCatalogo && versionPkgDs !== versionDsCatalogo) {
  console.warn(`  Aviso: Core-Design-System/package.json está en ${versionPkgDs}, pero la versión más reciente registrada en versiones.json (histórico) es ${versionDsCatalogo}. Actualiza el histórico o etiqueta la versión en git.`);
}
/* ---------- 6e. documentación para IA ----------
   Markdown y JSON generados de las fuentes oficiales del sistema de diseño (docs, tokens,
   SCSS de tokens y CSS publicado). Solo se publica si la validación no tiene errores. */
const versionIA = (versionPkgDs || '').replace(/^v/, '');
let iaCatalogo = null;
{
  const flujosPorPlataforma = {};
  for (const f of publicados) (flujosPorPlataforma[f.plataforma] ||= []).push(f.nombre);
  const r = generarPaqueteIA({
    dsDir, leerDs: (rel) => ds.leer(rel), version: versionIA, commit: infoDs.commit, generado: fechaDs.toISOString(),
    cdnBase: (cdnCfg.base || '').replace(/\/+$/, '') || null, plataformas: cfg.plataformas, paquetes: paquetesCdn,
    versionesDs, flujosPorPlataforma, maui: { archivos: maui.archivos, leeme: leemeMaui },
  });
  for (const a of r.avisos) console.warn(`  Aviso (docs IA): ${a}`);
  if (r.errores.length) {
    console.warn(`  Docs IA NO publicadas: ${r.errores.length} errores de validación:\n    ${r.errores.slice(0, 10).join('\n    ')}`);
  } else {
    const carpetaIA = path.join(DIST, 'descargas', 'ia');
    fs.mkdirSync(carpetaIA, { recursive: true });
    const nombreIA = `compensar-design-system-ia-v${versionIA}`;
    const zipIA = crearZip([...r.archivos].map(([ruta, texto]) => ({ nombre: `${r.raiz}/${ruta}`, datos: texto })), fechaDs);
    fs.writeFileSync(path.join(carpetaIA, `${nombreIA}.zip`), zipIA);
    fs.writeFileSync(path.join(carpetaIA, `${nombreIA}.md`), r.completo);
    iaCatalogo = {
      version: versionIA,
      generado: fechaDs.toISOString(),
      commit: String(infoDs.commit || '').slice(0, 7),
      componentes: r.componentes,
      tokens: r.tokens,
      completo: { archivo: `${nombreIA}.md`, bytes: Buffer.byteLength(r.completo), url: `descargas/ia/${nombreIA}.md` },
      paquete: { archivo: `${nombreIA}.zip`, bytes: zipIA.length, url: `descargas/ia/${nombreIA}.zip` },
      arbol: r.arbol,
      pendientes: r.pendientes,
      avisos: r.avisos,
      instrucciones: r.instrucciones,
    };
  }
}

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
  version: versionDsCatalogo,
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
/* Trazabilidad por flujo (pantallas, HU, commits, despliegues). Un registro inconsistente cancela el build. */
const trazCtx = ctxTraz();
const erroresTraz = [
  ...flujos.flatMap((f) => validarRegistro(f.id, trazCtx, catalogo)),
  ...validarDespliegues(trazCtx, fl, catalogo, listarVersiones),
];
if (erroresTraz.length) throw new Error('Trazabilidad inconsistente:\n  - ' + erroresTraz.join('\n  - '));
function trazabilidadFlujo(f) {
  const p = proyTraz(f.id, trazCtx, catalogo);
  return {
    hu: p.hu, pantallas: p.pantallas, pantallasDetectadas: p.pantallasDetectadas, relaciones: p.relaciones,
    commits: commitsDelFlujo(fl, f, trazCtx),
    despliegues: desplieguesDelFlujo(trazCtx, f.id, fl),
  };
}

const salida = {
  generado: new Date().toISOString(),
  fuentes: {
    designSystem: { ...infoDs, version: versionDsCatalogo, versionPaquete: versionPkgDs, versiones: versionesDs, prototipos: dsEnPrototipos, descargas },
    flujos: infoFl,
  },
  cdn: {
    /* URL pública de los paquetes. Vacía = el propio portal los sirve en cdn/. */
    base: (cdnCfg.base || '').replace(/\/+$/, '') || null,
    ruta: CDN_DESTINO,
    /* ¿El servidor público envía CORS? Sin él, el navegador bloquea los archivos con SRI. */
    cors: cdnCfg.cors === true,
    paquetes: paquetesCdn,
    kits: kitsCdn,
  },
  ia: iaCatalogo,
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
    categorias: f.categorias || [],
    publicado: !!f.publicar,
    entrega: entregaDe(f),
    url: f.publicar ? `${cfg.flujos.destino}/${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}` : null,
    descarga: descargasFlujos[f.id] || null,
    consumo: consumoFlujo(f),
    versiones: versionesFlujo[f.id] || [],
    ...trazabilidadFlujo(f),
    actualizado: fl.ultimaFecha(f.incluir || [f.ruta]),
    cambios: fl.historial(20, f.incluir || [f.ruta]),
    aprobacionUX: f.aprobacionUX || { aprobado: false, por: null, fecha: null },
  })),
};
fs.writeFileSync(path.join(DIST, 'catalogo.json'), JSON.stringify(salida, null, 2));

let sincronizacion;
try {
  sincronizacion = estadoSincronizacion(ds, fl, cfg.sincronizacion.archivos);
} catch (e) {
  // Si la comparación falla no se afirma nada: el portal muestra «Error de verificación».
  sincronizacion = { estado: 'error', dsCommit: null, archivos: [], mensajeError: String(e.message || e).split('\n')[0] };
  console.warn(`  Aviso: no se pudo verificar la sincronización: ${sincronizacion.mensajeError}`);
}
const componentes = mapaComponentes(ds, fl);
/* Evaluación de componentes: registro manual de UX (evaluacion-componentes.json).
   Un componente sin entrada queda «Por validar»: el equivalente que sugiere el nombre
   NO es una decisión. */
const ESTADOS_EVAL = ['por-validar', 'reutilizar', 'candidato', 'especifico'];
const evalReg = fs.existsSync(path.join(ROOT, 'evaluacion-componentes.json')) ? readJson('evaluacion-componentes.json') : {};
const evals = evalReg.evaluaciones || {};
for (const [clave, ev] of Object.entries(evals)) {
  if (!ESTADOS_EVAL.includes(ev.estado)) throw new Error(`evaluacion-componentes.json: estado «${ev.estado}» no válido en ${clave}. Usa: ${ESTADOS_EVAL.join(', ')}.`);
  if (!componentes.locales.some((l) => `${l.plataforma}/${l.nombre}` === clave)) console.warn(`  Aviso: evaluacion-componentes.json tiene «${clave}», que ya no existe en los prototipos.`);
}
componentes.locales = componentes.locales.map((l) => ({ ...l, evaluacion: evals[`${l.plataforma}/${l.nombre}`] || null }));

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
  sincronizacion: {
    ...sincronizacion,
    version: infoDs.version,
    versionPrototipos: dsEnPrototipos?.tag || null,
    verificado: salida.generado,
    comando: 'npm run ds:sincronizar',
  },
  componentes,
}, null, 2));

/* ---------- 7. bloqueo de rastreadores ---------- */
const robots = ['# Portal UX Compensar — uso interno. No indexar ni rastrear.', 'User-agent: *', 'Disallow: /', ''];
for (const bot of cfg.robots.bloquear) robots.push(`User-agent: ${bot}`, 'Disallow: /', '');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots.join('\n'));

/* ---------- 8. red de seguridad ---------- */
const todos = walk(DIST);
/* Los .md prohibidos son documentos internos; la documentación para IA es un entregable. */
const violaciones = todos.filter((f) => prohibido(f) && !/^descargas\/ia\/[^/]+\.md$/.test(f.split(path.sep).join('/')));
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
console.log(`  Versiones históricas: ${Object.entries(versionesFlujo).map(([id, v]) => `${id} ${v.map((x) => 'v' + x.version).join('/')}`).join(' · ') || 'ninguna'}`);
console.log(`  Sincronización DS → prototipos: ${sincronizacion.estado === 'al-dia' ? 'al día' : 'DESACTUALIZADA (npm run ds:estado)'}`);
if (stubs.length) console.log(`  Páginas "no publicado": ${stubs.length}`);
console.log(`  Descargas: ${descargas.map((d) => `${d.archivo} (${(d.bytes / 1024).toFixed(0)} kB)`).join(' · ')}`);
console.log(`  Paquetes CDN: ${paquetesCdn.length ? paquetesCdn.map((p) => `${p.id} ${p.versiones.map((v) => 'v' + v.version).join('/')}`).join(' · ') : 'ninguno (¿falta commit de Core-Design-System/dist/?)'}`);
const salidaRel = path.relative(ROOT, DIST) || '.';
console.log(`  Total en ${salidaRel}/: ${todos.length} archivos`);
if (process.env.PORTAL_DIST) {
  console.log(`\n  Carpeta lista para subir: ${DIST}`);
  console.log('  Contiene index.html en su raíz. Sube esta carpeta, no la carpeta del proyecto.');
}
