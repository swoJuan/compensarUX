/**
 * lib/snapshot.mjs — Prepara (en una carpeta temporal) lo que contendría la versión de un flujo
 * congelada desde un commit. NO escribe en el almacén: lo usan version-flujo.mjs (que guarda)
 * y version-propuesta.mjs (que solo estima y compara).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson, matcher, Fuente, git } from './fuentes.mjs';
import { sha256, hashConjunto, dirRecursos } from './versiones.mjs';

export class ErrorUso extends Error {}

export function prepararSnapshot(id, ref = 'HEAD') {
  const cfg = readJson('fuentes.json');
  const cat = readJson('catalogo.json');
  const f = cat.flujos.find((x) => x.id === id);
  if (!f) throw new ErrorUso(`El flujo "${id}" no está en catalogo.json. Disponibles: ${cat.flujos.map((x) => x.id).join(', ')}`);

  let commit;
  try { commit = git(new Fuente('flujos', { ...cfg.flujos, ref: 'HEAD' }).repo, ['rev-parse', '--verify', `${ref}^{commit}`]).toString().trim(); }
  catch { throw new ErrorUso(`No existe la referencia ${ref}.`); }

  const fl = new Fuente('flujos', { ...cfg.flujos, ref: commit });
  const pendientes = fl.pendientes();
  if (pendientes) throw new ErrorUso(`Hay ${pendientes} cambios sin confirmar en Flujos/prototipos/. Confírmalos con un commit antes de publicar la versión (se congela desde el commit, no desde el disco).`);

  const prohibido = matcher(cfg.prohibidos);
  const excluir = matcher(cfg.flujos.excluir);
  const esComun = matcher([...(cfg.flujos.comun || []), ...(cfg.plataformas[f.plataforma].comun || [])]);
  const esPropio = matcher(f.incluir || [f.ruta.replace(/\/?$/, '/') + '**']);
  const todos = fl.listar().filter((x) => !excluir(x) && !prohibido(x));
  const comunes = todos.filter(esComun);
  const propios = todos.filter((x) => esPropio(x) && !esComun(x));
  const entrada = `${f.ruta.replace(/\/?$/, '/')}${f.entrada || 'index.html'}`;
  if (!propios.includes(entrada)) throw new ErrorUso(`La entrada ${entrada} no existe en el commit ${commit.slice(0, 7)}.`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'version-flujo-'));
  const liberar = () => fs.rmSync(tmp, { recursive: true, force: true });
  try {
    fl.copiar([...comunes, ...propios], tmp);
    const mapa = (lista) => Object.fromEntries(lista.sort().map((rel) => [rel, sha256(fs.readFileSync(path.join(tmp, rel)))]));
    const mapaComun = mapa(comunes);
    const mapaPropio = mapa(propios);
    const bytes = (lista) => lista.reduce((n, rel) => n + fs.statSync(path.join(tmp, rel)).size, 0);
    const hash = hashConjunto(mapaComun);
    const reutiliza = fs.existsSync(dirRecursos(hash));

    let ds = null;
    try { const r = JSON.parse(fs.readFileSync(path.join(tmp, 'shared/vendor/ds-version.json'), 'utf8')); ds = { tag: r.ds?.tag || null, commit: String(r.ds?.commit || '').slice(0, 7), fecha: r.ds?.fecha || null }; } catch { /* sin registro */ }

    const cdn = {};
    const reCdn = /\/(compensar(?:-[a-z]+)?)\/v(\d+\.\d+\.\d+)\/\1\.min\.(?:css|js)/g;
    for (const rel of propios.filter((x) => x.endsWith('.html'))) {
      const txt = fs.readFileSync(path.join(tmp, rel), 'utf8');
      for (const m of txt.matchAll(reCdn)) (cdn[m[1]] ||= new Set()).add(m[2]);
    }
    /* Enlaces hacia archivos de OTRO flujo o del nivel de plataforma: no forman parte de la
       versión (una versión es solo su flujo). Quedan registrados en el manifiesto. */
    const enSet = new Set([...comunes, ...propios]);
    const existentes = new Set(todos);
    const enlacesExternos = [];
    for (const rel of propios.filter((x) => x.endsWith('.html'))) {
      const txt = fs.readFileSync(path.join(tmp, rel), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      for (const m of txt.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
        const r = m[1].trim().split('#')[0].split('?')[0];
        if (!r || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\$|\{)/i.test(r)) continue;
        let destino = path.posix.normalize(path.posix.join(path.posix.dirname(rel), r));
        if (!existentes.has(destino) && existentes.has(path.posix.join(destino, 'index.html'))) destino = path.posix.join(destino, 'index.html');
        if (existentes.has(destino) && !enSet.has(destino)) enlacesExternos.push({ desde: rel, hacia: destino });
      }
    }
    const info = git(fl.raiz, ['log', '-1', '--format=%H%x1f%cI%x1f%s', commit]).toString().trim().split('\x1f');
    return {
      cfg, cat, f, fl, commit, tmp, liberar, entrada, comunes, propios, mapaComun, mapaPropio, hash, reutiliza,
      bytesPropios: bytes(propios), bytesComunes: bytes(comunes), ds,
      paquetesCdn: Object.fromEntries(Object.entries(cdn).map(([k, v]) => [k, [...v].sort()])),
      enlacesExternos,
      commitInfo: { completo: info[0], corto: info[0].slice(0, 7), fecha: info[1], mensaje: info[2] },
    };
  } catch (e) { liberar(); throw e; }
}
