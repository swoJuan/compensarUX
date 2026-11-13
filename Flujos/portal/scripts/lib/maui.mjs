/* Traduce tokens/compensar.tokens.json a diccionarios de recursos de .NET MAUI.
 * Los tokens "use/*" son alias (var(--base-...)): XAML no tiene variables, así que
 * aquí se resuelven hasta el color literal de cada modo. */

function claveXaml(id) {
  return String(id).split(/[^a-zA-Z0-9]+/).filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

/** #ff6600 → #FF6600; #ff660080 (CSS: rgba) → #80FF6600 (XAML: alfa primero). */
function colorXaml(v) {
  const h = String(v).trim();
  if (/^#[0-9a-fA-F]{8}$/.test(h)) return ('#' + h.slice(7, 9) + h.slice(1, 7)).toUpperCase();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(h)) return ('#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]).toUpperCase();
  return null;
}

function resolver(valor, modo, porCss, visto = new Set()) {
  const v = String(valor || '').trim();
  const m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (!m) return v;
  if (visto.has(m[1])) return m[2] ? m[2].trim() : '';
  visto.add(m[1]);
  const t = porCss.get(m[1]);
  if (!t) return m[2] ? resolver(m[2].trim(), modo, porCss, visto) : '';
  return resolver(t.modes[modo] ?? t.modes.light, modo, porCss, visto);
}

function envoltura(cuerpo, titulo) {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<!-- ${titulo} -->
<?xaml-comp compile="true" ?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
                    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">

${cuerpo}
</ResourceDictionary>
`;
}

export function archivosMaui(tokens, version) {
  const entradas = Object.entries(tokens);
  const porCss = new Map(entradas.filter(([, t]) => t.css).map(([, t]) => [t.css, t]));
  const sinResolver = [];

  /* Un solo archivo de colores: la clave del modo claro y la misma clave + "_Dark".
     Es la forma en que MAUI los consume: {AppThemeBinding Light=..., Dark=...}.
     El guion bajo evita chocar con tokens que ya se llaman "… dark" (XAML no
     admite dos x:Key iguales: sería un error de compilación en el proyecto). */
  const linea = (id, color, sufijo) => `    <Color x:Key="${claveXaml(id)}${sufijo}">${color}</Color>`;
  const claras = [];
  const oscuras = [];
  let grupo = '';
  for (const [id, t] of entradas) {
    if (t.type !== 'color') continue;
    const claro = colorXaml(resolver(t.modes.light, 'light', porCss));
    const oscuro = colorXaml(resolver(t.modes.dark ?? t.modes.light, 'dark', porCss));
    if (!claro) { sinResolver.push(id); continue; }
    const familia = id.split('/').slice(0, 2).join('/');
    if (familia !== grupo) { grupo = familia; claras.push(`\n    <!-- ${familia} -->`); }
    claras.push(linea(id, claro, ''));
    oscuras.push(linea(id, oscuro || claro, '_Dark'));
  }

  /* Dos tokens distintos no pueden terminar en la misma x:Key. */
  const claves = (claras.concat(oscuras)).map((l) => (l.match(/x:Key="([^"]+)"/) || [])[1]).filter(Boolean);
  const repetidas = claves.filter((c, i) => claves.indexOf(c) !== i);
  if (repetidas.length) throw new Error('Claves XAML repetidas: ' + [...new Set(repetidas)].join(', '));

  const archivos = [{
    nombre: 'Resources/Styles/Compensar.Colors.xaml',
    datos: envoltura(
      claras.join('\n').replace(/^\n/, '') +
      '\n\n    <!-- Modo oscuro: misma clave + Dark -->\n' + oscuras.join('\n'),
      `Colores de Compensar · sistema de diseño ${version}`),
  }];

  const medidas = entradas
    .filter(([, t]) => t.type !== 'color')
    .map(([id, t]) => {
      const n = parseFloat(String(t.modes.light).replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? `    <x:Double x:Key="${claveXaml(id)}">${n}</x:Double>` : null;
    })
    .filter(Boolean);
  archivos.push({
    nombre: 'Resources/Styles/Compensar.Sizes.xaml',
    datos: envoltura(medidas.join('\n'), `Espaciados y medidas de Compensar · sistema de diseño ${version}`),
  });

  return { archivos, sinResolver };
}

export { claveXaml };
