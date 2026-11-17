/* Conversor mínimo de HTML a Markdown, sin dependencias.
 * Pensado para las páginas de documentación del sistema de diseño (fragmentos HTML con
 * títulos, párrafos, listas, tablas y bloques de código). Descarta lo que no es
 * contenido: navegación, botones, demos interactivas, iconos y scripts.
 * No inventa nada: solo reescribe en Markdown el texto que ya está en la página. */

const VACIAS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'col', 'wbr', 'area', 'base', 'param', 'track']);
const OMITIR_ETIQUETA = new Set(['script', 'style', 'svg', 'nav', 'button', 'select', 'template', 'noscript', 'head', 'textarea', 'iframe', 'canvas', 'audio', 'video', 'label', 'option', 'form']);
const OMITIR_CLASE = /^(?:demo|preview|playground|visualizer|visualizador|control-panel|controls|code-copy|ic-code-copy|ct-downloads|visually-hidden|code-tabs|button-code-tabs|component-doc-nav|component-support__icon|material-symbols[\w-]*)$|__demo$|-demo$|-preview$/i;
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–', middot: '·', copy: '©', rarr: '→', larr: '←', times: '×', check: '✓' };

export function decodificar(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTIDADES ? ENTIDADES[n.toLowerCase()] : m));
}

function atributo(attrs, nombre) {
  const m = new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(attrs || '');
  return m ? decodificar(m[1] ?? m[2] ?? '') : '';
}

export function htmlAMarkdown(html) {
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|[^<]+|</g;
  let out = '';
  let omitir = 0;          // profundidad dentro de un elemento descartado
  let pre = 0;             // dentro de <pre>
  const listas = [];       // pila de { orden, n }
  let tabla = null;        // { filas: [[celdas]], celda: string|null, fila: [] }
  const emit = (s) => {
    if (tabla && tabla.celda !== null) tabla.celda += s;
    else out += s;
  };
  const salto = (n = 2) => { if (!(tabla && tabla.celda !== null)) { out = out.replace(/[ \t]+$/, ''); const m = /\n*$/.exec(out)[0].length; if (out.length && m < n) out += '\n'.repeat(n - m); } };
  let m;
  while ((m = re.exec(html))) {
    const token = m[0];
    if (token.startsWith('<!--')) continue;
    const nombre = m[1] ? m[1].toLowerCase() : null;
    if (!nombre) {
      if (token === '<' || omitir) continue;
      if (pre) emit(decodificar(token));
      else emit(decodificar(token).replace(/\s+/g, ' '));
      continue;
    }
    const cierre = token.startsWith('</');
    const autocierre = /\/\s*>$/.test(token) || VACIAS.has(nombre);
    const attrs = m[2] || '';

    if (omitir) {
      if (!cierre && !autocierre) omitir++;
      else if (cierre) omitir--;
      continue;
    }
    if (!cierre) {
      const clase = atributo(attrs, 'class');
      const oculto = atributo(attrs, 'aria-hidden') === 'true' || /\bhidden\b/.test(attrs.replace(/"[^"]*"/g, '')) ;
      const icono = nombre === 'i' && /\bicon\b/.test(clase);
      if (OMITIR_ETIQUETA.has(nombre) || icono || (clase && clase.split(/\s+/).some((c) => OMITIR_CLASE.test(c)) && !/^(pre|code)$/.test(nombre)) || (oculto && nombre !== 'i')) {
        if (!autocierre) omitir = 1;
        continue;
      }
    }
    if (cierre && nombre === 'pre') { pre = Math.max(0, pre - 1); if (!pre) { out = out.replace(/\n*$/, '\n'); out += '```\n\n'; } continue; }
    if (nombre === 'pre' && !cierre) { salto(2); out += '```html\n'; pre++; continue; }
    if (pre) continue;

    switch (nombre) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        if (!cierre) { salto(2); emit('#'.repeat(Number(nombre[1])) + ' '); } else salto(2);
        break;
      case 'p': case 'div': case 'section': case 'article': case 'header': case 'footer': case 'main': case 'aside': case 'figure': case 'figcaption': case 'details': case 'summary': case 'blockquote': case 'dl': case 'dt': case 'dd':
        if (nombre === 'blockquote' && !cierre) { salto(2); emit('> '); } else salto(nombre === 'div' || nombre === 'section' ? 1 : 2);
        break;
      case 'br': emit('  \n'); break;
      case 'hr': salto(2); out += '---\n\n'; break;
      case 'ul': case 'ol':
        if (!cierre) { salto(listas.length ? 1 : 2); listas.push({ orden: nombre === 'ol', n: 0 }); } else { listas.pop(); salto(listas.length ? 1 : 2); }
        break;
      case 'li':
        if (!cierre) {
          const l = listas[listas.length - 1] || { orden: false, n: 0 };
          l.n++;
          salto(1);
          emit('  '.repeat(Math.max(0, listas.length - 1)) + (l.orden ? `${l.n}. ` : '- '));
        } else salto(1);
        break;
      case 'table': if (!cierre) { salto(2); tabla = { filas: [], celda: null, fila: [] }; } else if (tabla) { volcarTabla(tabla); tabla = null; } break;
      case 'tr': if (tabla) { if (!cierre) tabla.fila = []; else if (tabla.fila.length) { tabla.filas.push(tabla.fila); tabla.fila = []; } } break;
      case 'td': case 'th':
        if (tabla) { if (!cierre) tabla.celda = ''; else if (tabla.celda !== null) { tabla.fila.push(tabla.celda.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()); tabla.celda = null; } }
        break;
      case 'strong': case 'b': emit('**'); break;
      case 'em': case 'i': emit('*'); break;
      case 'code': emit('`'); break;
      case 'a': if (cierre) emit(''); break;
      default: break;
    }
  }
  function volcarTabla(t) {
    if (!t.filas.length) return;
    const ancho = Math.max(...t.filas.map((f) => f.length));
    const fila = (f) => '| ' + Array.from({ length: ancho }, (_, i) => f[i] ?? '').join(' | ') + ' |';
    out += fila(t.filas[0]) + '\n| ' + Array(ancho).fill('---').join(' | ') + ' |\n';
    for (const f of t.filas.slice(1)) out += fila(f) + '\n';
    out += '\n';
  }
  return limpiar(out);
}

/** Limpieza fuera de los bloques de código: espacios y líneas en blanco sobrantes. */
export function limpiar(md) {
  const partes = md.split(/(```[\s\S]*?```)/g);
  return partes.map((p, i) => {
    if (i % 2) return p;
    return p
      .replace(/\*\*\s*\*\*/g, '').replace(/``/g, '')
      .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1** ').replace(/\*\*\s+([^*\n]+?)\*\*/g, ' **$1**')
      .replace(/^[ \t]+(?=[^\s-]|\d+\.)/gm, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n');
  }).join('').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** Primer h1 del HTML, como texto. */
export function tituloDe(html) {
  const m = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return m ? decodificar(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
}

/** Divide un Markdown en { titulo, cuerpo } por encabezados `## `. */
export function seccionesH2(md) {
  const out = [];
  let actual = { titulo: '', lineas: [] };
  let enCodigo = false;
  for (const linea of md.split('\n')) {
    if (linea.startsWith('```')) enCodigo = !enCodigo;
    const h = !enCodigo && /^##\s+(.*)$/.exec(linea);
    if (h) { out.push(actual); actual = { titulo: h[1].trim(), lineas: [] }; } else actual.lineas.push(linea);
  }
  out.push(actual);
  return out.map((s) => ({ titulo: s.titulo, cuerpo: s.lineas.join('\n').trim() }));
}
