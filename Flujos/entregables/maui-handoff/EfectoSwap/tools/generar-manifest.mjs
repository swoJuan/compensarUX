#!/usr/bin/env node
// Regenera manifest.json: commits reales (git log) de las fuentes, origen/checksum de las copias del DS y SHA-256 de cada archivo del paquete.
// Uso (desde cualquier carpeta del repositorio): node Flujos/entregables/maui-handoff/EfectoSwap/tools/generar-manifest.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const paquete = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const raiz = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: paquete, encoding: 'utf8' }).trim();
const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8' }).trim();
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rel = (f) => path.relative(raiz, f).split(path.sep).join('/');
const ultimo = (ruta) => {
  const [hash, corto, fecha, asunto] = git('log', '-1', '--format=%H%n%h%n%cI%n%s', '--', ruta).split('\n');
  const sinCommitar = git('status', '--porcelain', '--', ruta) !== '';
  return { commit: hash || null, corto: corto || null, fecha: fecha || null, asunto: asunto || null, sinCommitar };
};
const fuentes = [
  'Flujos/prototipos/app/efecto-swap/index.html',
  'Flujos/prototipos/app/efecto-swap/css/swap.css',
  'Flujos/prototipos/app/efecto-swap/js/swap-app.js',
  'Flujos/prototipos/app/efecto-swap/js/swap-data.js',
  'Flujos/portal/trazabilidad/app-efecto-swap.json',
  'Core-Design-System/tokens/compensar.tokens.json',
  'Core-Design-System/docs/app/components/carga-infinita.html',
  'Flujos/portal/scripts/lib/maui.mjs',
  'Flujos/portal/dist/ds/descargas/compensar-maui-v2.4.0.zip',
  'Flujos/entregables/maui-handoff/Agendamiento',
].map((ruta) => ({ ruta, sha256: fs.statSync(path.join(raiz, ruta)).isFile() ? sha(path.join(raiz, ruta)) : null, ...ultimo(ruta) }));
// Origen de las copias de Compensar.Colors.xaml / Compensar.Sizes.xaml: se leen del ZIP del DS y se comparan byte a byte.
const zipDs = path.join(raiz, 'Flujos/portal/dist/ds/descargas/compensar-maui-v2.4.0.zip');
const copiasDs = ['Compensar.Colors.xaml', 'Compensar.Sizes.xaml'].map((n) => {
  const interno = `compensar-maui-v2.4.0/Resources/Styles/${n}`;
  const local = path.join(paquete, 'Resources/Styles', n);
  let shaZip = null;
  try { shaZip = crypto.createHash('sha256').update(execFileSync('unzip', ['-p', zipDs, interno], { maxBuffer: 1 << 26 })).digest('hex'); } catch { /* sin unzip: se deja null */ }
  return { archivo: `Resources/Styles/${n}`, origen: `Flujos/portal/dist/ds/descargas/compensar-maui-v2.4.0.zip!${interno}`, sha256: sha(local), sha256EnElZip: shaZip, identicoAlZip: shaZip === null ? null : shaZip === sha(local) };
});
const archivos = [];
(function recorrer(d) {
  for (const n of fs.readdirSync(d).sort()) {
    const f = path.join(d, n);
    if (n === '.DS_Store') continue;
    if (fs.statSync(f).isDirectory()) recorrer(f);
    else if (path.relative(paquete, f) !== 'manifest.json') archivos.push({ ruta: path.relative(paquete, f).split(path.sep).join('/'), bytes: fs.statSync(f).size, sha256: sha(f) });
  }
})(paquete);
const manifest = {
  paquete: 'efecto-swap-maui-handoff',
  version: '0.2.0',
  versionAnterior: '0.1.0',
  cambiosRespectoAnterior: 'Control reutilizable Controls/CargaInfinitaView (skeleton de primera carga, vacío, cargando, error, fin); ViewModel con estado completo; SVG exportados de Figma; copias de Compensar.Colors/Sizes v2.4.0; estilos del pie movidos a CargaInfinita.Styles.xaml.',
  flujo: 'app-efecto-swap',
  flujoVersion: JSON.parse(fs.readFileSync(path.join(raiz, 'Flujos/portal/catalogo.json'), 'utf8')).flujos?.find?.((f) => f.id === 'app-efecto-swap')?.version ?? null,
  tipo: 'codigo-de-referencia-ux-no-productivo',
  compilado: false,
  nota: 'No compilado: el entorno de generación no tiene dotnet. Datos ficticios. No publicado ni desplegado.',
  generadoEn: new Date().toISOString(),
  figma: {
    archivo: 'https://www.figma.com/design/dYhOsRYLR8KewcxNAL9Qo1/APP-Medicina-Prepagada?node-id=8658-24679&m=dev',
    frames: { reposo: '8655:24380', cargando: '8657:139', fin: '8908:24622', error: '8923:25318', vacio: '8954:26680', skeleton: '8954:26839' },
    iconos: { ic_arrow_left: '8655:24383', ic_bell: '8655:24386', ic_info: '8655:24392', ic_x_circle: 'I8923:25690;2284:4964', ic_empty_solicitudes: '8954:26836' },
    iconosNota: 'SVG tal como los entrega el MCP de Figma (get_design_context); no se editaron. Traen colores fijos (blanco, #2D4A67, #D14434, #FF6600): no siguen el modo oscuro.',
    leidoEn: new Date().toISOString().slice(0, 10),
    modo: 'solo lectura',
  },
  historiaUsuario: { codigo: 'HU-303', titulo: 'Implementar paginación infinita', uso: 'referencia; sin criterios de aceptación cargados' },
  designSystem: { version: '2.4.0', paqueteMaui: 'compensar-maui-v2.4.0.zip', incluidosEnEstePaquete: true, copias: copiasDs },
  repositorio: { head: git('rev-parse', 'HEAD'), rama: git('rev-parse', '--abbrev-ref', 'HEAD') },
  commitsFuente: fuentes,
  commitDelPaquete: null,
  commitDelPaqueteNota: 'El paquete se generó sin commit: aún no existe en el historial de Git.',
  archivos,
};
fs.writeFileSync(path.join(paquete, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const c of copiasDs) if (c.identicoAlZip !== true) console.error(`AVISO: ${c.archivo} no se pudo confirmar idéntico al ZIP del DS`);
console.log(`manifest.json: ${archivos.length} archivos, ${fuentes.length} fuentes, HEAD ${manifest.repositorio.head.slice(0, 7)}`);
