/**
 * lib/fuentes.mjs — Acceso de solo lectura a los repositorios fuente.
 * Lo usan build.mjs, watch.mjs y ds-sincronizar.mjs.
 * Ninguna función de este archivo escribe en los repositorios fuente:
 * solo usa git ls-tree / archive / log / show / grep / rev-parse y
 * `status` con --no-optional-locks (no toca el índice).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^$(){}|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}
export const matcher = (globs) => {
  const res = (globs || []).map(globToRegExp);
  return (p) => res.some((r) => r.test(p));
};

export function git(repo, args, opts = {}) {
  return execFileSync('git', ['-C', repo, '--no-optional-locks', ...args], {
    maxBuffer: 1024 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], ...opts,
  });
}
const gitTxt = (repo, args) => { try { return git(repo, args).toString('utf8').trim(); } catch { return null; } };

export function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

export class Fuente {
  constructor(id, conf) {
    this.id = id;
    this.conf = conf;
    this.repo = path.resolve(ROOT, conf.repo);
    this.ref = conf.ref || 'HEAD';
    this.worktree = this.ref === 'WORKTREE';
    if (!fs.existsSync(this.repo)) throw new Error(`[${id}] No existe la carpeta: ${this.repo}`);
    // Un solo repositorio contiene las tres fuentes, cada una en su carpeta. git responde
    // con rutas desde la raíz del repositorio, así que todo lo que va a git lleva este
    // prefijo y todo lo que vuelve lo pierde. Si la fuente fuera un repositorio propio,
    // el prefijo es vacío y nada de esto cambia.
    this.prefijo = (gitTxt(this.repo, ['rev-parse', '--show-prefix']) || '').replace(/\/?$/, '');
    this.niveles = this.prefijo ? this.prefijo.split('/').length : 0;
    this.raiz = gitTxt(this.repo, ['rev-parse', '--show-toplevel']) || this.repo;
  }
  get gitRef() { return this.worktree ? 'HEAD' : this.ref; }
  /** Ruta vista desde la raíz del repositorio. */
  ruta(archivo) { return this.prefijo ? `${this.prefijo}/${archivo}` : archivo; }
  /** Lo que limita un comando de git a esta carpeta (relativo, como espera git tras "--"). */
  get alcance() { return ['.']; }
  quitarPrefijo(p) { return this.prefijo && p.startsWith(this.prefijo + '/') ? p.slice(this.prefijo.length + 1) : p; }
  listar() {
    if (this.worktree) return walk(this.repo);
    const args = ['ls-tree', '-r', '-z', '--name-only', this.ref, '--', '.'];
    return git(this.repo, args).toString('utf8').split('\0').filter(Boolean).map((f) => this.quitarPrefijo(f));
  }
  leer(archivo) {
    if (this.worktree) { try { return fs.readFileSync(path.join(this.repo, archivo), 'utf8'); } catch { return null; } }
    try { return git(this.repo, ['show', `${this.ref}:${this.ruta(archivo)}`]).toString('utf8'); } catch { return null; }
  }
  blob(archivo, ref = this.gitRef) {
    if (this.worktree && ref === this.gitRef) {
      try { return execFileSync('git', ['hash-object', path.join(this.repo, archivo)]).toString().trim(); } catch { return null; }
    }
    return gitTxt(this.repo, ['rev-parse', `${ref}:${this.ruta(archivo)}`]);
  }
  pendientes() {
    const t = gitTxt(this.repo, ['status', '--porcelain', '--', '.']);
    return t == null ? null : t.split('\n').filter(Boolean).length;
  }
  sinSubir() {
    const t = gitTxt(this.repo, ['rev-list', '--count', '@{u}..HEAD']);
    return t == null ? null : Number(t);
  }
  remoto() { return gitTxt(this.repo, ['remote', 'get-url', 'origin']); }
  rama() { return gitTxt(this.repo, ['rev-parse', '--abbrev-ref', 'HEAD']); }
  /** Cambios sin commit en TODO el repositorio, no solo en esta carpeta. */
  pendientesRepo() {
    const t = gitTxt(this.raiz, ['status', '--porcelain']);
    return t == null ? null : t.split('\n').filter(Boolean).length;
  }
  /** Commits de todo el repositorio. */
  commitsRepo() { return Number(gitTxt(this.raiz, ['rev-list', '--count', 'HEAD']) || 0); }
  firma() {
    return [gitTxt(this.repo, ['rev-parse', 'HEAD']), gitTxt(this.repo, ['status', '--porcelain', '--', '.'])].join('|');
  }
  historial(n = 8, rutas = []) {
    const alcance = rutas.length ? rutas : this.alcance;
    const out = gitTxt(this.repo, ['log', `-n${n}`, '--format=%x1e%h%x1f%cI%x1f%s', '--shortstat', this.gitRef, '--', ...alcance]) || '';
    return out.split('\x1e').filter((b) => b.trim()).map((b) => {
      const [cabecera, ...resto] = b.split('\n');
      const [commit, fecha, mensaje] = cabecera.split('\x1f');
      const m = resto.join(' ').match(/(\d+) files? changed/);
      return { commit, fecha, mensaje, archivos: m ? Number(m[1]) : 0 };
    });
  }
  ultimaFecha(rutas) { return gitTxt(this.repo, ['log', '-1', '--format=%cI', this.gitRef, '--', ...rutas]); }
  /** Último commit que tocó esta carpeta: la "versión" de esta fuente. */
  ultimoCambio() {
    const out = gitTxt(this.repo, ['log', '-1', '--format=%h%x1f%cI', this.gitRef, '--', ...this.alcance]) || '';
    const [commit, fecha] = out.split('\x1f');
    return { commit: commit || null, fecha: fecha || null };
  }

  /* ---------- Versiones publicadas (tags) ---------- */
  /** ¿El commit forma parte de lo que publica el portal? */
  contiene(commit) {
    const r = spawnSync('git', ['-C', this.repo, '--no-optional-locks', 'merge-base', '--is-ancestor', commit, this.gitRef], { stdio: 'ignore' });
    return r.status === 0;
  }
  /** Última versión etiquetada que alcanza la ref publicada (por ejemplo "v2.4.0"). */
  versionPublicada() { return gitTxt(this.repo, ['describe', '--tags', '--abbrev=0', this.gitRef]); }
  /** Commits posteriores a una versión que TOCAN esta carpeta. Comparar el commit del
   *  tag con el último de la carpeta da falsos positivos: un commit de release puede no
   *  tocar la carpeta, y entonces parecen distintos sin que haya cambios reales. */
  cambiosDesde(ref) {
    if (!ref) return 0;
    const n = gitTxt(this.repo, ['rev-list', '--count', `${ref}..${this.gitRef}`, '--', '.']);
    return n == null ? 0 : Number(n);
  }
  /** Commits de un rango ("v2.3.0..v2.4.0" o un tag suelto), con el total aunque se recorten. */
  commitsDe(rango, n = 12) {
    const total = Number(gitTxt(this.repo, ['rev-list', '--count', rango]) || 0);
    const out = gitTxt(this.repo, ['log', `-n${n}`, '--format=%h%x1f%cI%x1f%s', rango]) || '';
    const lista = out.split('\n').filter(Boolean).map((l) => {
      const [commit, fecha, mensaje] = l.split('\x1f');
      return { commit, fecha, mensaje };
    });
    return { total, lista };
  }
  /**
   * Versiones del repositorio a partir de los tags, de la más reciente a la más antigua.
   * Cada versión trae su mensaje, si el portal la publica y los commits que incluye.
   */
  versiones(n = 20) {
    const campos = ['%(refname:short)', '%(creatordate:iso-strict)', '%(*objectname:short)', '%(objectname:short)', '%(contents:subject)', '%(contents:body)'];
    const crudo = gitTxt(this.repo, ['for-each-ref', 'refs/tags', '--sort=-creatordate', '--format=%1e' + campos.join('%1f')]) || '';
    const lista = crudo.split('\x1e').filter((b) => b.trim()).map((bloque) => {
      const [tag, fecha, commitDelTag, objeto, titulo, cuerpo] = bloque.replace(/\n$/, '').split('\x1f');
      return {
        tag,
        fecha,
        commit: commitDelTag || objeto,   // el tag anotado apunta al commit en *objectname
        titulo: (titulo || '').trim(),
        cuerpo: (cuerpo || '').trim(),
      };
    }).slice(0, n);
    for (let i = 0; i < lista.length; i++) {
      const anterior = lista[i + 1];
      const cambios = this.commitsDe(anterior ? `${anterior.tag}..${lista[i].tag}` : lista[i].tag);
      lista[i].publicada = this.contiene(lista[i].commit);
      lista[i].cambios = cambios.lista;
      lista[i].totalCambios = cambios.total;
    }
    return lista;
  }
  info() {
    const pendientes = this.pendientes();
    return {
      id: this.id,
      nombre: this.conf.nombre || this.id,
      rol: this.conf.rol || '',
      carpeta: this.conf.repo,
      repositorioPropuesto: this.conf.repositorioPropuesto || null,
      remoto: this.remoto(),
      ref: this.ref,
      commit: this.ultimoCambio().commit,
      version: this.versionPublicada(),
      cambiosDesdeVersion: this.cambiosDesde(this.versionPublicada()),
      fecha: this.ultimoCambio().fecha,
      cambiosSinCommit: this.worktree && pendientes > 0,
      pendientesSinPublicar: this.worktree ? 0 : pendientes,
      commitsSinSubir: this.sinSubir(),
      cambios: this.historial(),
    };
  }
  copiar(archivos, destino) {
    fs.mkdirSync(destino, { recursive: true });
    if (this.worktree) {
      for (const f of archivos) {
        const to = path.join(destino, f);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(path.join(this.repo, f), to);
      }
      return;
    }
    const LOTE = 150;
    const recorte = this.niveles ? [`--strip-components=${this.niveles}`] : [];
    for (let i = 0; i < archivos.length; i += LOTE) {
      const tar = git(this.raiz, ['archive', '--format=tar', this.ref, '--', ...archivos.slice(i, i + LOTE).map((f) => this.ruta(f))]);
      const r = spawnSync('tar', ['-x', '-f', '-', ...recorte, '-C', destino], { input: tar, maxBuffer: 1024 * 1024 * 1024 });
      if (r.status !== 0) throw new Error(`[${this.id}] Error al extraer: ${r.stderr}`);
    }
  }
}

/* ---------- Sincronización sistema de diseño → prototipos ---------- */
/**
 * Compara los archivos que flujos copia del sistema de diseño
 * (fuentes.json → sincronizacion.archivos) y, si no coinciden, busca en el
 * historial del sistema de diseño qué versión tienen los prototipos.
 */
export function estadoSincronizacion(ds, fl, pares) {
  const archivos = pares.map(({ ds: dsPath, flujos: flPath }) => {
    const bDs = ds.blob(dsPath);
    const bFl = fl.blob(flPath);
    if (!bDs || !bFl) return { ds: dsPath, flujos: flPath, estado: 'faltante', versionUsada: null };
    if (bDs === bFl) return { ds: dsPath, flujos: flPath, estado: 'al-dia', versionUsada: null };
    let versionUsada = null;
    const commits = (gitTxt(ds.repo, ['log', '--format=%h%x1f%cI', '-n60', ds.gitRef, '--', dsPath]) || '').split('\n').filter(Boolean);
    for (const linea of commits) {
      const [c, f] = linea.split('\x1f');
      if (ds.blob(dsPath, c) === bFl) { versionUsada = { commit: c, fecha: f }; break; }
    }
    return { ds: dsPath, flujos: flPath, estado: 'desactualizado', versionUsada };
  });
  const desact = archivos.filter((a) => a.estado !== 'al-dia');
  return {
    estado: desact.length ? 'desactualizado' : 'al-dia',
    dsCommit: ds.ultimoCambio().commit,
    archivos,
  };
}

/* ---------- Mapa de componentes ---------- */
const ALIAS = {
  alert: 'alerts', modal: 'modals', radio: 'selection-controls', switch: 'selection-controls',
  checkbox: 'selection-controls', input: 'inputs', 'form-error': 'inputs', 'readonly-field': 'inputs',
  'action-card': 'cards', 'benef-card': 'cards', button: 'buttons', toast: 'toasts', tab: 'tabs',
};
export function mapaComponentes(ds, fl) {
  const dsComp = ds.listar()
    .map((f) => f.match(/^docs\/(transversales|web|app)\/components\/([^/]+)\.html$/))
    .filter(Boolean)
    .map((m) => ({ id: m[2], ambito: m[1] }));
  const idsDs = new Set(dsComp.map((c) => c.id));

  // Uso de clases mp-* del sistema de diseño dentro de los prototipos
  const usoRaw = gitTxt(fl.repo, ['grep', '-I', '-o', '-E', 'mp-[a-z][a-z0-9]*(-[a-z0-9]+)*', fl.gitRef, '--', '*.html', '*.js', ':!shared/vendor/**']) || '';
  const uso = new Map();
  for (const linea of usoRaw.split('\n')) {
    if (!linea) continue;
    const partes = linea.split(':');
    const clase = partes.pop();
    const archivo = fl.quitarPrefijo(partes.slice(1).join(':'));
    let bloque = clase.split('--')[0];
    if (/^mp-(h[1-6]|body|caption|label|hint|overline)/.test(bloque)) bloque = 'tipografía (mp-h*, mp-body-*)';
    const flujo = archivo.split('/').slice(0, 2).join('/');
    if (!uso.has(bloque)) uso.set(bloque, { archivos: new Set(), flujos: new Set() });
    uso.get(bloque).archivos.add(archivo);
    if (/^(zt|drupal|app)\//.test(flujo) && !/\/shared$/.test(flujo)) uso.get(bloque).flujos.add(flujo);
  }
  const usoDs = [...uso].map(([bloque, v]) => ({ bloque, archivos: v.archivos.size, flujos: [...v.flujos].sort() }))
    .sort((a, b) => b.archivos - a.archivos);

  // Componentes propios de cada plataforma (zt/shared/components, etc.)
  const locales = new Map();
  for (const f of fl.listar()) {
    const m = f.match(/^(zt|drupal|app)\/shared\/components\/([^/]+)\.(js|css)$/);
    if (!m) continue;
    const key = `${m[1]}/${m[2]}`;
    if (!locales.has(key)) locales.set(key, { nombre: m[2], plataforma: m[1], archivos: [] });
    locales.get(key).archivos.push(`${m[2]}.${m[3]}`);
  }
  const refsRaw = gitTxt(fl.repo, ['grep', '-I', '-o', '-E', 'components/[a-z0-9-]+\\.(js|css)', fl.gitRef, '--', '*.html']) || '';
  const usos = new Map();
  for (const linea of refsRaw.split('\n')) {
    if (!linea) continue;
    const partes = linea.split(':');
    const ref = partes.pop();
    const archivo = fl.quitarPrefijo(partes.slice(1).join(':'));
    const nombre = ref.replace(/^components\//, '').replace(/\.(js|css)$/, '');
    if (!usos.has(nombre)) usos.set(nombre, new Set());
    usos.get(nombre).add(archivo);
  }
  const localesLista = [...locales.values()].map((l) => {
    const candidato = idsDs.has(l.nombre) ? l.nombre : (idsDs.has(l.nombre + 's') ? l.nombre + 's' : (ALIAS[l.nombre] && idsDs.has(ALIAS[l.nombre]) ? ALIAS[l.nombre] : null));
    return {
      ...l,
      equivalenteDs: candidato,
      tipo: candidato ? 'existe-en-ds' : 'candidato-transversal',
      paginas: usos.has(l.nombre) ? usos.get(l.nombre).size : 0,
    };
  }).sort((a, b) => b.paginas - a.paginas || a.nombre.localeCompare(b.nombre));

  return { ds: dsComp, usoDs, locales: localesLista };
}
