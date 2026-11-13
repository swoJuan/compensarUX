# dist — Paquetes CSS/JS versionados por plataforma

Generados por `npm run build:plataformas` (`scripts/build-plataformas.mjs`).
Estructura: `dist/compensar-<plataforma>/v<X.Y.Z>/` con `compensar-<plataforma>.min.css`,
`compensar-<plataforma>.min.js`, `assets/` (solo si el CSS referencia archivos con `url()`) y `manifest.json`.

- Plataformas: `zt`, `drupal`, `app`. La versión de cada una vive en `<plataforma>/shared/version.json`.
- **Las versiones son inmutables.** Si cambias algo en `<plataforma>/shared/`, sube la versión en
  `version.json`; el build falla si `vX.Y.Z` ya existe con contenido distinto.
- No incluyen el Design System (`core.css`, iconos, fuentes de iconos, `mp-tabs.js`): eso es el paquete
  `compensar.min.css` / `compensar.min.js` del DS, que se carga antes.
- No incluyen datos de un flujo (p. ej. `zt/shared/afiliacion-mock.js`); cada flujo los enlaza aparte.

## Cómo enlazar (orden obligatorio)

```html
<head>
  <!-- 1. Design System -->
  <link rel="stylesheet" href="{BASE}/compensar/vX.Y.Z/compensar.min.css">
  <!-- 2. Capa de la plataforma -->
  <link rel="stylesheet" href="{BASE}/compensar-zt/v1.0.0/compensar-zt.min.css">
  <!-- 3. CSS propio del flujo -->
  <link rel="stylesheet" href="css/paso-1.css">
</head>
<body>
  …
  <!-- JS al final del body: el sidebar necesita que <nav class="sidebar"> ya exista -->
  <script src="{BASE}/compensar/vX.Y.Z/compensar.min.js"></script>   <!-- DS, si el flujo lo usa -->
  <script src="{BASE}/compensar-zt/v1.0.0/compensar-zt.min.js"></script>
  <script src="js/paso-1.js"></script>                                <!-- JS del flujo -->
</body>
```

`{BASE}` es la URL pública (aún por definir). Para uso con integridad (SRI) copia el campo
`integrity` de cada archivo en `manifest.json`:

```html
<link rel="stylesheet" href="…/compensar-zt.min.css" integrity="sha384-…" crossorigin="anonymous">
```

### Particularidades por plataforma

- **ZT — ruta a la raíz `zt/`:** `zt-sidebar.js` armaba los enlaces del menú deduciendo la ruta desde su
  propio `<script src>`. Empaquetado ya no puede, así que cada pantalla declara la ruta a `zt/`:
  `<nav class="sidebar" data-active="ventas" data-zt-root="../../../"></nav>` (o `window.ZT_ROOT = '../../../'`
  antes del script). Sin esto los enlaces del menú quedan relativos a la propia pantalla.
- **ZT — datos del flujo:** `afiliacion-mock.js` sigue enlazándose desde el flujo, antes de los scripts propios.
- **ZT — logos** (`shared/assets/logo*.svg`) se usan como `<img src>` en HTML, no por `url()` de CSS, por lo que
  no forman parte del paquete CSS (viven con el DS / el flujo).
- **Drupal:** incluye `nav-prototype.css` y `nav-data/nav-shell/nav-flyout.js` en ese orden.
- **APP:** incluye `app.css` y `app-viewer.js`.

## Verificación local

```
cd Flujos/prototipos
npm run build:plataformas          # todas
node scripts/build-plataformas.mjs zt --out /tmp/prueba   # a otra carpeta
```
