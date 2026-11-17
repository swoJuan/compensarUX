/* Documentación del sistema de diseño para agentes de IA.
 *
 * Genera, a partir de las fuentes oficiales ya publicadas por el portal (documentación HTML
 * del sistema de diseño, tokens, SCSS de tokens, CSS compilado y manifests de los paquetes),
 * un paquete modular de archivos Markdown y JSON y una versión consolidada en un solo .md.
 *
 * Reglas:
 *  - Nada se redacta con IA ni se inventa: el texto sale de la documentación existente. Lo que
 *    no se puede extraer se declara como «Pendiente de documentación».
 *  - Es determinista: la misma entrada produce los mismos archivos (el sello de tiempo viene
 *    del contexto, no del reloj).
 *  - Se valida antes de publicar (enlaces internos, componentes, tokens vs CSS, duplicados,
 *    contenido vacío y versión). Si hay errores, el build no publica el paquete.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { htmlAMarkdown, tituloDe, seccionesH2, limpiar } from './html-md.mjs';

const RAIZ = 'compensar-design-system';
/* Secciones de una página de componente que se consideran el contenido mínimo documentable. */
const CAMPOS = [
  ['Resumen / cuándo usarlo', /resumen|cu[aá]ndo usar|¿cu[aá]l usar|prop[oó]sito/i],
  ['Variantes', /variantes|tipos|tama[nñ]os/i],
  ['Estados', /estados/i],
  ['Propiedades / API', /api|propiedades|par[aá]metros|c[oó]digo|visualizador/i],
  ['Responsive', /responsive|comportamiento/i],
  ['Accesibilidad', /accesibilidad/i],
  ['Tokens usados', /tokens/i],
];
const DESCARTAR_SECCION = /^(?:\d+\.\s*)?(?:anatom[ií]a interactiva|playground|variantes\s*\/\s*playground|visualizador|issues|soporte|modos de color|descargas?)\b/i;

const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tabla = (cab, filas) => `| ${cab.join(' | ')} |\n| ${cab.map(() => '---').join(' | ')} |\n${filas.map((f) => `| ${f.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}\n`;

/** Variables SCSS `$nombre: valor; // comentario` de un archivo de tokens. */
function variablesScss(texto) {
  const out = [];
  for (const l of (texto || '').split('\n')) {
    const m = /^\s*(\$[\w-]+)\s*:\s*([^;]+);\s*(?:\/\/\s*(.*))?$/.exec(l);
    if (m) out.push({ nombre: m[1], valor: m[2].trim(), nota: (m[3] || '').trim() });
  }
  return out;
}
/** Variables CSS `--x: valor` declaradas en el primer :root/bloque donde aparecen. */
function variablesCss(css) {
  const mapa = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;}{]+?)\s*(?=[;}])/g;
  let m;
  while ((m = re.exec(css))) if (!mapa.has(m[1])) mapa.set(m[1], m[2].trim());
  return mapa;
}

function leerDoc(dsDir, rel) {
  const f = path.join(dsDir, rel);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}

/** Convierte una página de documentación a Markdown y mide qué le falta. */
function documentarPagina(html, { quitar = DESCARTAR_SECCION } = {}) {
  const titulo = tituloDe(html);
  const md = htmlAMarkdown(html).replace(/```[a-z]*\n\s*```\n*/g, '');
  const partes = seccionesH2(md);
  const intro = partes[0].cuerpo.replace(/^#\s+.*\n*/, '').trim();
  const secciones = partes.slice(1).filter((s) => s.cuerpo && !quitar.test(s.titulo));
  const titulos = partes.slice(1).map((s) => s.titulo);
  const faltan = CAMPOS.filter(([, re]) => !partes.slice(1).some((s) => re.test(s.titulo) && s.cuerpo)).map(([n]) => n);
  return { titulo, intro, secciones, titulos, faltan };
}

function mdComponente(doc, meta) {
  const l = [
    `# ${doc.titulo || meta.nombre}`, '',
    `> Fuente: \`${meta.origen}\` · Plataforma: ${meta.plataforma} · Sistema de diseño v${meta.version}`, '',
  ];
  if (doc.intro) l.push(doc.intro, '');
  for (const s of doc.secciones) l.push(`## ${s.titulo.replace(/^\d+\.\s*/, '')}`, '', s.cuerpo, '');
  l.push('## Pendiente de documentación', '');
  if (doc.faltan.length) {
    l.push('La página de origen no trae contenido para: ' + doc.faltan.join(', ') + '. No se completa con suposiciones.');
  } else l.push('Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.');
  return limpiar(l.join('\n'));
}

export const INSTRUCCIONES_BASE = (v) => `Eres un agente que construye interfaces para Compensar. Usa el sistema de diseño de Compensar v${v} y respeta estas reglas:

1. Antes de escribir código, consulta la documentación del sistema de diseño v${v} (archivo README.md y manifest.json del paquete). Si el usuario indica otra versión, pídele el paquete de esa versión.
2. Reutiliza los componentes existentes (components/index.md). Antes de crear uno nuevo, verifica que no haya uno equivalente; si no existe, propónlo en lugar de inventarlo.
3. Usa solo los tokens oficiales (tokens/). No escribas colores, espaciados, radios ni sombras con valores sueltos.
4. Mantén la accesibilidad: WCAG 2.2 AA, foco visible, navegación por teclado, contraste en modo claro, oscuro y alto contraste, zoom al 200 %.
5. Respeta los patrones de navegación y de formularios (patterns/).
6. Considera la plataforma de destino (platforms/): Drupal, Zona Transaccional (ZT) y App no cargan los recursos de la misma manera. No las mezcles.
7. No sobrescribas estilos globales ni modifiques el CSS del sistema de diseño; añade CSS propio del flujo al final.
8. Si algo no está documentado, dilo explícitamente («no está documentado en el sistema de diseño») en lugar de suponerlo.
9. Usa datos ficticios en ejemplos; nunca datos personales reales.`;

/**
 * @param {object} ctx
 *  dsDir: carpeta con la documentación publicada del sistema de diseño (dist/ds)
 *  leerDs(rel): lee un archivo del repositorio del sistema de diseño (o null)
 *  version, commit, generado (ISO), cdnBase, plataformas (cfg.plataformas), paquetes (paquetesCdn),
 *  versionesDs, flujosPorPlataforma, maui ({archivos, leeme})
 */
export function generarPaqueteIA(ctx) {
  const { dsDir, leerDs, version, commit, generado, plataformas = {}, paquetes = [], versionesDs = [], flujosPorPlataforma = {} } = ctx;
  const base = ctx.cdnBase || '{BASE}';
  const archivos = new Map(); // ruta -> texto
  const errores = [];
  const avisos = [];
  const pendientes = [];
  const poner = (ruta, texto) => {
    if (archivos.has(ruta)) errores.push(`Archivo duplicado en el paquete: ${ruta}`);
    archivos.set(ruta, texto.endsWith('\n') ? texto : texto + '\n');
  };

  /* ---------- tokens ---------- */
  const tokens = JSON.parse(leerDs('tokens/compensar.tokens.json') || '{}');
  const css = (() => { const f = path.join(dsDir, 'css/core.css'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; })();
  const varsCss = variablesCss(css);
  const nombres = Object.keys(tokens);
  const colores = nombres.filter((k) => tokens[k].type === 'color');
  const otros = nombres.filter((k) => tokens[k].type !== 'color');
  const enCss = (t) => varsCss.has(t.css);
  const modos = (t) => t.modes || {};

  if (!nombres.length) errores.push('No se encontró tokens/compensar.tokens.json: no hay tokens que documentar.');

  const grupos = {};
  for (const k of colores) { const g = k.split('/').slice(0, 2).join('/'); (grupos[g] ||= []).push(k); }
  poner('tokens/colors.md', [
    '# Colores', '',
    `Fuente: \`tokens/compensar.tokens.json\` del sistema de diseño v${version}. Cada color tiene valor por modo (claro, oscuro y alto contraste). Usa siempre la variable CSS, nunca el valor.`, '',
    ...Object.entries(grupos).flatMap(([g, ks]) => [
      `## ${g}`, '',
      tabla(['Token', 'Variable CSS', 'Claro', 'Oscuro', 'Alto contraste'], ks.map((k) => [`\`${k}\``, `\`${tokens[k].css}\``, modos(tokens[k]).light, modos(tokens[k]).dark, modos(tokens[k]).highContrast])),
    ]),
  ].join('\n'));

  const tipo = variablesScss(leerDs('core/abstracts/_tokens-typography.scss'));
  poner('tokens/typography.md', [
    '# Tipografía', '',
    'Fuente: `core/abstracts/_tokens-typography.scss` (variables SCSS). Los valores se copian tal cual; el comentario es el de la fuente.', '',
    tipo.length ? tabla(['Variable SCSS', 'Valor', 'Nota'], tipo.map((t) => [`\`${t.nombre}\``, `\`${t.valor}\``, t.nota])) : 'Pendiente de documentación: no se encontró `_tokens-typography.scss`.',
    '', 'Clases tipográficas del sistema (`mp-h1`…`mp-h6`, `mp-body-*`): ver `foundations/typography.md`.',
  ].join('\n'));
  if (!tipo.length) pendientes.push('Tokens de tipografía');

  const space = [...varsCss].filter(([k]) => /^--space-\d+$/.test(k)).sort((a, b) => Number(a[0].slice(8)) - Number(b[0].slice(8)));
  const spacingJson = otros.filter((k) => k.startsWith('spacing/'));
  poner('tokens/spacing.md', [
    '# Espaciado', '',
    `Variables CSS publicadas en \`css/core.css\` v${version}: \`--space-N\` (N en píxeles). Base de 8 px; también hay pasos de 2, 4 y 10 px.`, '',
    space.length ? tabla(['Variable CSS', 'Valor'], space.map(([k, v]) => [`\`${k}\``, `\`${v}\``])) : 'Pendiente de documentación: no se encontraron variables `--space-*` en el CSS publicado.',
    '', spacingJson.length && !spacingJson.some((k) => enCss(tokens[k]))
      ? `> Nota de consistencia: \`tokens/compensar.tokens.json\` declara ${spacingJson.length} tokens de espaciado como \`--spacing-Npx\`, pero el CSS publicado usa \`--space-N\`. Usa \`--space-N\`.` : '',
  ].join('\n'));
  if (spacingJson.length && !spacingJson.some((k) => enCss(tokens[k]))) avisos.push(`tokens.json declara --spacing-Npx (${spacingJson.length}) pero core.css publica --space-N: se documenta el CSS.`);

  const radios = otros.filter((k) => k.startsWith('border-radius/'));
  const sombras = variablesScss(leerDs('core/abstracts/_tokens-shadows.scss'));
  poner('tokens/radius-shadows.md', [
    '# Radios y sombras', '',
    '## Radios', '',
    radios.length ? tabla(['Token', 'Variable CSS', 'Valor'], radios.map((k) => [`\`${k}\``, `\`${tokens[k].css}\``, modos(tokens[k]).light])) : 'Pendiente de documentación.',
    '', '## Sombras', '', 'Fuente: `core/abstracts/_tokens-shadows.scss`.', '',
    sombras.length ? tabla(['Variable SCSS', 'Valor', 'Uso'], sombras.map((t) => [`\`${t.nombre}\``, `\`${t.valor}\``, t.nota])) : 'Pendiente de documentación.',
  ].join('\n'));

  const bp = /\$grid-breakpoints:\s*\(([\s\S]*?)\)/.exec(leerDs('core/abstracts/_variables.scss') || '');
  const bps = bp ? [...bp[1].matchAll(/(\w+)\s*:\s*([\w.]+)/g)].map((m) => [m[1], m[2]]) : [];
  poner('tokens/breakpoints.md', [
    '# Breakpoints', '',
    'Fuente: `$grid-breakpoints` en `core/abstracts/_variables.scss` (iguales a Bootstrap).', '',
    bps.length ? tabla(['Nombre', 'Desde'], bps.map(([n, v]) => [`\`${n}\``, `\`${v}\``])) : 'Pendiente de documentación: no se encontró `$grid-breakpoints`.',
    '', 'Reglas de uso: ver `patterns/responsive-breakpoints.md`.',
  ].join('\n'));
  if (!bps.length) pendientes.push('Breakpoints');

  // consistencia de valores color JSON vs CSS
  let difValor = 0;
  for (const k of colores) {
    const v = varsCss.get(tokens[k].css);
    const j = String(modos(tokens[k]).light || '').toLowerCase();
    if (v && /^#/.test(v) && /^#/.test(j) && v.toLowerCase() !== j) difValor++;
  }
  const sinCss = nombres.filter((k) => !enCss(tokens[k]) && !k.startsWith('spacing/'));
  if (sinCss.length) avisos.push(`${sinCss.length} tokens de tokens.json no están como variable en core.css: ${sinCss.slice(0, 5).join(', ')}${sinCss.length > 5 ? '…' : ''}`);
  if (difValor) avisos.push(`${difValor} colores difieren entre tokens.json (modo claro) y core.css.`);

  poner('tokens/tokens.json', JSON.stringify({
    sistemaDeDiseno: version, fuente: 'tokens/compensar.tokens.json',
    total: nombres.length,
    tokens: nombres.map((k) => ({ nombre: k, css: tokens[k].css, sass: tokens[k].sass, tipo: tokens[k].type, modos: tokens[k].modes, enCssPublicado: enCss(tokens[k]) })),
    espaciadoCssPublicado: space.map(([k, v]) => ({ css: k, valor: v })),
  }, null, 2));

  /* ---------- páginas de componentes, fundamentos y patrones ---------- */
  const comps = [];
  const grupoComp = [
    ['transversales', 'docs/transversales/components', 'Web y App'],
    ['web', 'docs/web/components', 'Web'],
    ['app', 'docs/app/components', 'App'],
  ];
  const OMITIR_COMP = /^icons-library$/;
  for (const [grupo, dir, plat] of grupoComp) {
    const carpeta = path.join(dsDir, dir);
    if (!fs.existsSync(carpeta)) continue;
    for (const f of fs.readdirSync(carpeta).filter((n) => n.endsWith('.html')).sort()) {
      const id = f.replace(/\.html$/, '');
      if (OMITIR_COMP.test(id)) { pendientes.push('Catálogo de iconos (icons-library): se consulta en la página del sistema de diseño'); continue; }
      const doc = documentarPagina(leerDoc(dsDir, `${dir}/${f}`));
      const ruta = `components/${grupo}/${id}.md`;
      const meta = { id, nombre: doc.titulo || id, plataforma: plat, grupo, origen: `${dir}/${f}`, archivo: ruta, version };
      if (!doc.titulo) avisos.push(`${meta.origen}: la página no tiene título (h1).`);
      poner(ruta, mdComponente(doc, meta));
      comps.push({ ...meta, faltan: doc.faltan, tiene: CAMPOS.map(([n]) => !doc.faltan.includes(n)) });
    }
  }
  poner('components/index.md', [
    '# Componentes', '',
    `Componentes documentados del sistema de diseño v${version}: ${comps.length}. Plataforma «Web y App» son componentes transversales.`, '',
    tabla(['Componente', 'Plataforma', ...CAMPOS.map(([n]) => n)], comps.map((c) => [`[${c.nombre}](${c.archivo.replace('components/', '')})`, c.plataforma, ...c.tiene.map((t) => (t ? 'sí' : 'pendiente'))])),
    '', '«pendiente» significa que la página de origen no tiene esa información; no se completa con suposiciones.',
  ].join('\n'));

  const fund = [];
  for (const [rel, id] of [['docs/foundations/principles.html', 'principles'], ['docs/transversales/fundamentos/typography.html', 'typography'], ['docs/transversales/fundamentos/spacing.html', 'spacing'], ['docs/transversales/fundamentos/border-radius.html', 'border-radius'], ['docs/transversales/fundamentos/shadows.html', 'shadows'], ['docs/transversales/fundamentos/layout.html', 'layout'], ['docs/app/fundamentos/layout.html', 'app-layout']]) {
    const html = leerDoc(dsDir, rel);
    if (!html) continue;
    const md = htmlAMarkdown(html).replace(/```[a-z]*\n\s*```\n*/g, '');
    const ruta = `foundations/${id}.md`;
    poner(ruta, `${md.replace(/\n+$/, '')}\n\n> Fuente: \`${rel}\` · v${version}\n`);
    fund.push({ id, ruta, origen: rel, titulo: tituloDe(html) || id });
  }

  const pats = [];
  const accesibilidad = [];
  for (const id of ['form-patterns', 'search-filters', 'responsive-breakpoints', 'motion-animation', 'dark-mode', 'high-contrast']) {
    const rel = `docs/guidelines/${id}.html`;
    const html = leerDoc(dsDir, rel);
    if (!html) { pendientes.push(`Guía ${id}`); continue; }
    const doc = documentarPagina(html, { quitar: /^(?:\d+\.\s*)?(?:playground|visualizador|descargas?)\b/i });
    const ruta = `patterns/${id}.md`;
    poner(ruta, mdComponente(doc, { nombre: id, origen: rel, plataforma: 'Web y App', version }));
    pats.push({ id, ruta, titulo: doc.titulo || id, origen: rel });
  }
  poner('patterns/patterns.md', [
    '# Patrones y guías', '',
    'Patrones de navegación, formularios, búsqueda, responsive, movimiento y modos de color del sistema de diseño.', '',
    ...pats.map((p) => `- [${p.titulo}](${p.id}.md) — \`${p.origen}\``),
  ].join('\n'));

  /* accesibilidad: secciones «Accesibilidad» y «Checklist QA» de cada componente */
  const a11y = [];
  for (const c of comps) {
    const doc = documentarPagina(leerDoc(dsDir, c.origen));
    const secs = doc.secciones.filter((s) => /accesibilidad|checklist qa/i.test(s.titulo));
    if (secs.length) a11y.push(`## ${c.nombre}\n\n_Fuente: [${c.archivo}](../${c.archivo})_\n\n` + secs.map((s) => `### ${s.titulo.replace(/^\d+\.\s*/, '')}\n\n${s.cuerpo}`).join('\n\n'));
    else accesibilidad.push(c.nombre);
  }
  poner('accessibility/accessibility.md', [
    '# Accesibilidad', '',
    'Objetivo del sistema: WCAG 2.2 AA, teclado, foco visible, móvil, zoom al 200 % y los modos claro, oscuro y alto contraste. Los criterios por componente son los de su página de documentación; esto los reúne. Guías transversales: [Modo oscuro](../patterns/dark-mode.md) y [Alto contraste](../patterns/high-contrast.md).', '',
    ...a11y,
    accesibilidad.length ? `## Pendiente de documentación\n\nSin sección de accesibilidad en su página de origen: ${accesibilidad.join(', ')}.` : '',
  ].join('\n\n'));
  if (accesibilidad.length) avisos.push(`Sin sección de accesibilidad: ${accesibilidad.join(', ')}.`);

  /* ---------- plataformas ---------- */
  const flujosTxt = (id) => (flujosPorPlataforma[id] || []).map((f) => `- ${f}`).join('\n') || 'Ninguno publicado.';
  const paqDs = paquetes.find((p) => p.id === 'compensar');
  const vDs = paqDs && (paqDs.versiones.find((v) => v.version === version) || paqDs.versiones[0]);
  const urlDs = vDs ? `${base}/compensar/v${vDs.version}` : null;
  const archivosPaq = (p, v) => tabla(['Archivo', 'Tamaño (bytes)', 'integrity (SRI)'], (v.archivos || []).map((a) => [`\`${a.nombre}\``, a.bytes, `\`${a.integrity || 'no registrado'}\``]));
  for (const pid of ['drupal', 'zt', 'app']) {
    const cfgP = plataformas[pid] || {};
    const paq = paquetes.find((p) => p.id === `compensar-${pid}`);
    const l = [`# ${cfgP.nombre || pid}`, '', `${cfgP.descripcion || ''}`, '', `- Tecnología: ${cfgP.tecnologia || 'no definida'}`, `- Sistema de diseño de referencia: v${version}`, ''];
    if (paq) {
      const v = paq.versiones[0];
      l.push(`## Paquete web \`${paq.id}\``, '', `Versión publicada: v${v.version}. No incluye el sistema de diseño: cárgalo antes. Compatibilidad registrada con el sistema de diseño: no hay una matriz registrada; se publica junto a v${version}.`, '', archivosPaq(paq, v), '',
        '### Orden de carga', '', '```html', '<!-- 1. Sistema de diseño -->', urlDs ? `<link rel="stylesheet" href="${urlDs}/compensar.min.css">` : '<!-- paquete compensar no publicado -->', `<!-- 2. Paquete ${pid.toUpperCase()} -->`, `<link rel="stylesheet" href="${base}/${paq.id}/v${v.version}/${v.css ? v.css.nombre : `${paq.id}.min.css`}">`, '<!-- 3. CSS propio del flujo -->', '<link rel="stylesheet" href="css/mi-pantalla.css">',
        urlDs && vDs.js ? `<script src="${urlDs}/${vDs.js.nombre}" defer></script>` : '', v.js && v.js.bytes > 0 ? `<script src="${base}/${paq.id}/v${v.version}/${v.js.nombre}" defer></script>` : '', '```', '');
      if (pid === 'zt') l.push('El menú lateral de ZT necesita declarar la ruta a la raíz del flujo: `<nav class="sidebar" data-zt-root="../../">`.', '');
    } else l.push('Pendiente de documentación: no hay paquete web publicado para esta plataforma.', '');
    if (pid === 'app') {
      l.push('## Recursos para .NET MAUI', '', 'La aplicación móvil no consume CSS ni JavaScript. Los recursos nativos son diccionarios XAML generados de los tokens:', '', ...(ctx.maui ? ctx.maui.archivos.map((a) => `- \`${a.nombre}\``) : ['- Pendiente de documentación.']), '', ctx.maui ? '```\n' + ctx.maui.leeme.trim() + '\n```' : '', '');
    }
    l.push('## Flujos publicados', '', flujosTxt(pid), '');
    poner(`platforms/${pid}.md`, l.join('\n'));
  }

  /* ---------- versiones ---------- */
  poner('versions/changelog.md', [
    '# Historial de versiones', '',
    `Versión de este paquete: v${version}.`, '',
    ...(versionesDs.length ? versionesDs.flatMap((v) => [
      `## ${v.tag} — ${String(v.fecha || '').slice(0, 10) || 'sin fecha'}`, '', v.titulo || '', v.cuerpo ? `\n${v.cuerpo}` : '', v.revisar ? `\n**Qué revisar:** ${v.revisar}` : '', '',
    ]) : ['Pendiente de documentación: no hay versiones registradas.']),
  ].join('\n'));

  /* ---------- README, instrucciones y manifest ---------- */
  const instrucciones = INSTRUCCIONES_BASE(version);
  poner('INSTRUCCIONES-IA.md', `# Instrucciones para agentes de IA\n\n${instrucciones}\n`);
  poner('README.md', [
    `# Sistema de diseño de Compensar — documentación para IA (v${version})`, '',
    `Generado el ${String(generado).slice(0, 10)} desde el commit \`${String(commit || '').slice(0, 7)}\` del sistema de diseño. Este paquete se regenera con cada publicación del portal; no se edita a mano.`, '',
    '## Cómo usarlo', '', '1. Entrega a tu agente `INSTRUCCIONES-IA.md` (o pégalas como instrucciones del proyecto).', '2. Adjunta esta carpeta, o el archivo único `compensar-design-system-completo.md`.', '3. Para cada tarea, el agente consulta primero `components/index.md`, `tokens/` y `platforms/<plataforma>.md`.', '',
    '## Contenido', '',
    '- `manifest.json`: versión, fuentes, archivos con hash y pendientes.',
    '- `tokens/`: colores, tipografía, espaciado, radios y sombras, breakpoints y `tokens.json`.',
    `- \`components/\`: ${comps.length} componentes (índice en \`components/index.md\`).`,
    '- `foundations/`: principios, tipografía, espaciado, radios, sombras y layout.',
    '- `patterns/`: navegación y formularios, búsqueda, responsive, movimiento, modo oscuro y alto contraste.',
    '- `accessibility/`: criterios de accesibilidad reunidos de cada componente.',
    '- `platforms/`: Drupal, ZT y App: paquetes, orden de carga y particularidades.',
    '- `versions/changelog.md`: historial de versiones.', '',
    '## Qué no está', '', ...(pendientes.length ? pendientes.map((p) => `- ${p}`) : ['- Sin pendientes detectados.']),
    '- Las secciones interactivas de cada componente (anatomía, playground, visualizador de código) se generan en el navegador y no se incluyen.',
  ].join('\n'));

  /* ---------- validación ---------- */
  const rutas = new Set(archivos.keys());
  rutas.add('manifest.json');
  for (const [ruta, txt] of archivos) {
    if (!txt.trim()) errores.push(`Archivo vacío: ${ruta}`);
    if (!ruta.endsWith('.md')) continue;
    const sinCodigo = txt.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const m of sinCodigo.matchAll(/\]\(([^)\s]+)\)/g)) {
      const dest = m[1];
      if (/^(?:https?:|mailto:|#)/.test(dest)) continue;
      const res = path.posix.normalize(path.posix.join(path.posix.dirname(ruta), dest.split('#')[0]));
      if (!rutas.has(res)) errores.push(`Enlace roto en ${ruta}: ${dest}`);
    }
  }
  const ids = comps.map((c) => `${c.grupo}/${c.id}`);
  if (new Set(ids).size !== ids.length) errores.push('Componentes duplicados.');
  if (!comps.length) errores.push('No se encontró documentación de componentes.');
  for (const c of comps) if (!rutas.has(c.archivo)) errores.push(`Componente sin archivo: ${c.id}`);
  const versionPaquete = vDs && vDs.version;
  if (versionPaquete && versionPaquete !== version) avisos.push(`El paquete CDN del sistema de diseño más reciente es v${versionPaquete}, pero la versión de la documentación es v${version}.`);
  if (!/^\d+\.\d+\.\d+$/.test(version)) errores.push(`Versión inválida: ${version}`);
  const faltantes = comps.filter((c) => c.faltan.length);
  if (faltantes.length) avisos.push(`${faltantes.length} de ${comps.length} componentes tienen secciones pendientes de documentación (ver components/index.md).`);

  const lista = [...archivos.keys()].sort();
  poner('manifest.json', JSON.stringify({
    nombre: 'Sistema de diseño de Compensar — documentación para IA',
    version, generado, fuente: { repositorio: 'Core-Design-System', commit: commit || null },
    cdn: urlDs ? { core: `${urlDs}/` } : null,
    estadisticas: { archivos: lista.length + 1, componentes: comps.length, tokens: nombres.length, fundamentos: fund.length, patrones: pats.length },
    componentes: comps.map(({ id, nombre, plataforma, archivo, origen, faltan }) => ({ id, nombre, plataforma, archivo, origen, pendientes: faltan })),
    pendientes,
    archivos: lista.filter((r) => r !== 'manifest.json').map((r) => ({ ruta: r, bytes: Buffer.byteLength(archivos.get(r)), sha256: sha256(archivos.get(r)) })),
  }, null, 2));

  /* ---------- documento consolidado ---------- */
  const orden = [
    'README.md', 'INSTRUCCIONES-IA.md', ...lista.filter((r) => r.startsWith('tokens/') && r.endsWith('.md')), 'components/index.md',
    ...lista.filter((r) => r.startsWith('components/') && r !== 'components/index.md'), ...lista.filter((r) => r.startsWith('foundations/')),
    ...lista.filter((r) => r.startsWith('patterns/')), 'accessibility/accessibility.md', ...lista.filter((r) => r.startsWith('platforms/')), 'versions/changelog.md',
  ];
  const bajar = (md) => { let en = false; return md.split('\n').map((l) => { if (l.startsWith('```')) en = !en; return !en && /^#{1,5}\s/.test(l) ? '#' + l : l; }).join('\n'); };
  const completo = [
    `# Sistema de diseño de Compensar v${version} — documentación completa para IA`, '',
    `Generado el ${String(generado).slice(0, 10)} · commit \`${String(commit || '').slice(0, 7)}\`. Documento consolidado: cada sección corresponde a un archivo del paquete modular.`, '',
    ...[...new Set(orden)].filter((r) => archivos.has(r)).flatMap((r) => [`<!-- archivo: ${r} -->`, bajar(archivos.get(r).trim()), '', '---', '']),
  ].join('\n');

  return {
    raiz: RAIZ,
    archivos: new Map([...archivos].sort(([a], [b]) => a.localeCompare(b))),
    completo: limpiar(completo),
    instrucciones,
    version, componentes: comps.length, tokens: nombres.length,
    pendientes, errores, avisos,
    arbol: [...lista, 'manifest.json'].filter((v, i, a) => a.indexOf(v) === i).sort(),
  };
}
