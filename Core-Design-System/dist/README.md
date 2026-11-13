# dist/ — Paquete público del Design System

Archivos listos para enlazar desde cualquier HTML, igual que Bootstrap.
**No se editan a mano**: se generan con `node scripts/build-dist.mjs`.

## Cómo enlazarlo

```html
<!-- 1. Design System -->
<link rel="stylesheet" href="{BASE}/compensar/v2.4.0/compensar.min.css">
<!-- 2. Plataforma (ZT, Drupal o APP) — ver Flujos/prototipos/dist/README.md -->
<link rel="stylesheet" href="{BASE}/compensar-zt/v1.0.0/compensar-zt.min.css">
<!-- 3. CSS propio del flujo -->
<link rel="stylesheet" href="css/paso-1.css">

<script src="{BASE}/compensar/v2.4.0/compensar.min.js" defer></script>
```

`{BASE}` es la URL pública donde el portal publica los paquetes:
`https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn`.
Para fijar integridad (solo si el servidor envía CORS; el Azure actual no lo envía), copia `integrity` de `manifest.json`:
`<link rel="stylesheet" href="…" integrity="sha384-…" crossorigin="anonymous">`.

## Qué trae `compensar/vX.Y.Z/`

| Archivo | Contenido |
|---|---|
| `compensar.min.css` | `css/core.css` (incluye temas light/dark/high-contrast) + `icons/icons.css`, con la fuente de iconos woff2 incrustada |
| `compensar.min.js` | `js/mp-tabs.js` + `js/mp-dropdown.js` (se inicializan solos) |
| `fonts/` | `compensar-icons.woff2`, `.woff`, `.ttf` (rutas relativas desde el CSS) |
| `manifest.json` | versión, commit del DS, fecha, sha256 e `integrity` sha384 por archivo |

Fuera a propósito: `css/portal.css` y los JS del portal de documentación;
`css/themes.css` no hace falta porque sus tokens ya vienen dentro de `core.css`.

## Versiones

- Cada versión vive en su carpeta y **nunca se sobrescribe**: si `vX.Y.Z/` ya existe
  con contenido distinto, el build falla.
- Los flujos apuntan a una versión exacta. Una versión nueva se publica al lado,
  se valida por QA flujo por flujo y solo entonces se cambia su enlace.
- Para sacar versión nueva: compila (`npm run sass:build`), sube `version` en
  `package.json` y ejecuta `node scripts/build-dist.mjs`.
