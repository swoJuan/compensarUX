/**
 * lib/api-trazabilidad.mjs — API local de escritura para pantallas, HU y relaciones.
 *
 * Solo existe en el servidor local (npm run dev / npm run serve), escuchando en loopback.
 * El sitio publicado es estático: allí la ficha es de solo lectura y esta API no existe.
 * Toda validación (pertenencia de URLs, HU duplicadas, relaciones) se hace en trazabilidad.mjs;
 * la interfaz solo muestra su resultado.
 *
 *   GET  /api/trazabilidad/estado                      → { escritura }
 *   GET  /api/trazabilidad/<flujo>                     → proyección actual del flujo
 *   POST /api/trazabilidad/<flujo>/resolver            { url }
 *   POST /api/trazabilidad/<flujo>/pantalla            { url, nombre, descripcion? }
 *   POST /api/trazabilidad/<flujo>/pantalla-editar     { id, nombre?, descripcion?, url? }
 *   POST /api/trazabilidad/<flujo>/vincular            { pantalla:{id|url}, hu:{…}, nota?, registrarPantalla? }
 *   POST /api/trazabilidad/<flujo>/relacion-editar     { hu, pantalla, nota }
 *   POST /api/trazabilidad/<flujo>/desvincular         { hu, pantalla }
 *   POST /api/trazabilidad/<flujo>/hu-editar           { codigo, titulo?, descripcion?, url? }
 * Las escrituras exigen JSON, la cabecera X-Portal-UX y un Host/Origin de loopback.
 */
import * as T from './trazabilidad.mjs';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const hostDe = (h) => String(h || '').replace(/:\d+$/, '').toLowerCase();
const LIMITE = 64 * 1024;

function responder(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(cuerpo));
}
function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let total = 0; const trozos = [];
    req.on('data', (c) => { total += c.length; if (total > LIMITE) { reject(new T.ErrTraz('cuerpo_grande', 'La solicitud es demasiado grande.', {}, 413)); req.destroy(); } else trozos.push(c); });
    req.on('end', () => { try { resolve(trozos.length ? JSON.parse(Buffer.concat(trozos).toString('utf8')) : {}); } catch { reject(new T.ErrTraz('json_invalido', 'El cuerpo no es JSON válido.', {}, 400)); } });
    req.on('error', reject);
  });
}

export function apiHabilitada(host) {
  return process.env.PORTAL_API !== '0' && LOOPBACK.has(String(host || '').toLowerCase());
}

/** Devuelve true si la petición era de la API (y ya se respondió). */
export async function manejarApi(req, res, { host, ctx = T.contexto() } = {}) {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/trazabilidad')) return false;
  const habilitada = apiHabilitada(host);
  const partes = url.pathname.split('/').filter(Boolean).slice(2); // [estado] | [flujo] | [flujo, accion]
  try {
    if (req.method === 'GET' && partes[0] === 'estado' && partes.length === 1) { responder(res, 200, { escritura: habilitada }); return true; }
    if (!habilitada) throw new T.ErrTraz('solo_lectura', 'La edición solo está disponible en el portal local (npm run dev).', {}, 403);
    if (!LOOPBACK.has(hostDe(req.headers.host))) throw new T.ErrTraz('host_no_permitido', 'Host no permitido.', {}, 403);
    if (req.method === 'GET' && partes.length === 1) {
      responder(res, 200, T.proyeccion(partes[0], ctx)); return true;
    }
    if (req.method !== 'POST' || partes.length !== 2) throw new T.ErrTraz('no_encontrado', 'Ruta de API no válida.', {}, 404);
    if (req.headers['x-portal-ux'] !== '1' || !/^application\/json\b/i.test(req.headers['content-type'] || '')) throw new T.ErrTraz('solicitud_invalida', 'Solicitud no válida.', {}, 400);
    if (req.headers.origin && (() => { try { return hostDe(new URL(req.headers.origin).host) !== hostDe(req.headers.host); } catch { return true; } })()) throw new T.ErrTraz('origen_no_permitido', 'Origen no permitido.', {}, 403);
    const [flujo, accion] = partes; const datos = await leerCuerpo(req);
    const cat = T.leerCatalogo(ctx);
    const f = cat.flujos.find((x) => x.id === flujo);
    if (!f) throw new T.ErrTraz('flujo_inexistente', 'El flujo no existe en el catálogo.', {}, 404);
    let salida;
    switch (accion) {
      case 'resolver': {
        const r = T.resolverPantalla(datos.url, ctx, cat);
        if (r.flujoId !== f.id) throw new T.ErrTraz('otro_flujo', `Esta pantalla pertenece a otro flujo. Solo puedes vincular historias de usuario a pantallas de ${f.nombre}.`, { flujoDetectado: r.flujoId });
        const registrada = T.proyeccion(flujo, ctx, cat).pantallas.find((p) => p.ruta === r.rel) || null;
        salida = { ruta: r.rel, existe: r.existe, entorno: r.entorno, version: r.version, registrada }; break;
      }
      case 'pantalla': salida = T.registrarPantalla(flujo, datos, ctx); break;
      case 'pantalla-editar': salida = T.editarPantalla(flujo, datos, ctx); break;
      case 'vincular': salida = T.vincular(flujo, datos, ctx); break;
      case 'relacion-editar': salida = T.editarRelacion(flujo, datos, ctx); break;
      case 'desvincular': salida = T.desvincular(flujo, datos, ctx); break;
      case 'hu-editar': salida = T.editarHu(flujo, datos, ctx); break;
      default: throw new T.ErrTraz('no_encontrado', 'Acción no válida.', {}, 404);
    }
    responder(res, 200, salida); return true;
  } catch (e) {
    if (e instanceof T.ErrTraz) { responder(res, e.estado, { error: { codigo: e.codigo, mensaje: e.message, ...e.extra } }); return true; }
    console.error('API trazabilidad:', e);
    responder(res, 500, { error: { codigo: 'error_interno', mensaje: 'No se pudo completar la operación.' } }); return true;
  }
}
