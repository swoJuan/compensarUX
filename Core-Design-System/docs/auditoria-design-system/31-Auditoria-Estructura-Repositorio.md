# 31 — Auditoría de la estructura del repositorio

> 11 de noviembre de 2026 · `Core-Design-System` v2.3.0 · commit `b256a39` · tag local `v2.3.0`.
> Solo análisis. No se movió, creó, eliminó ni renombró ningún archivo del repositorio (este documento es el único archivo nuevo). No contiene propuestas de estructura.
> Método: `git ls-files`, `git grep`, `md5`, grafo de imports Sass calculado con un script de solo lectura, lectura de los scripts de `scripts/`. Las cifras de «versionados» salen de `HEAD`; el árbol de trabajo difiere en los 7 cambios ajenos sin commit (`js/router.js` está versionado pero ausente en disco).
> Lo no verificado se marca como tal.

## 1. Resumen ejecutivo

- **3 621 archivos versionados, 36,1 MB** (`.git` 31 MB; `node_modules` 20 MB, ignorado). 82 % son iconos (2 954 archivos); `docs/` aporta 473, de los cuales 407 son auditoría y evidencias.
- El repositorio mezcla **cuatro productos** en una sola raíz: el Core (`core/`, `css/`), el portal de documentación (`portal/`, `docs/`, `js/`, tres HTML de entrada), el material de auditoría (`docs/auditoria-design-system/`, 15 MB) y un paquete de conocimiento para un asistente de QA (`nara/`, 4,7 MB).
- **Solo hay dos fuentes de compilación Sass reales** (`core/core.scss`, `portal/portal.scss`) más `core/themes.scss`; 107 de 110 SCSS son alcanzables desde ellas. Los CSS compilados y `js/docs-css.generated.js` están versionados junto a las fuentes.
- Los tokens existen en **cinco copias** (`tokens/compensar.tokens.json`, `js/tokens.js`, un duplicado dentro de `js/ds-bundle.js`, `core/abstracts/_tokens-*.scss` y `nara/tokens-*.json`). Dos tokens de Alto contraste **ya difieren** entre el bundle y las otras copias.
- El generador de tokens desde Figma (`scripts/generate-figma-tokens.mjs`) lee una ruta absoluta de otro equipo (`/Users/juan.soto/Downloads/Compensar MP`, inexistente). El flujo Figma → tokens → SCSS no es reproducible desde el repositorio.
- `js/ds-bundle.js` (5 627 líneas, cargado por los shells) es la unión de `tokens.js`, `app.js` y `loader.js`, que quedan sin cargarse. No existe script que genere el bundle.
- No hay pruebas automatizadas, CI ni linter. La verificación vive en 81 scripts de `evidencias/`, 26 de los cuales dependen de `/tmp/qa` (fuera del repositorio).
- No hay `AGENTS.md`, `.kiro/` ni equivalentes en el repositorio. El contexto para IA está repartido en `ia-context.md`, `docs/technical-guides/IA_Context.md` y `nara/`.

## 2. Árbol actual

Archivos versionados entre paréntesis.

```
Core-Design-System/                         (3 621)
├── index.html  drupal.html  app.html       Shells de entrada (landing, portal Web/Drupal, portal App)
├── package.json  package-lock.json  prepros.config  .htaccess  robots.txt  favicon.ico
├── README.md  ia-context.md                Documentación raíz (639 y 522 líneas)
├── .fuse_hidden0000001100000001            Copia HTML huérfana en la raíz (10,5 KB), versionada
├── .vscode/settings.json  .gitignore  .gitattributes
├── core/                                   (49)  Fuente Sass del Core
│   ├── core.scss  themes.scss  SASS-RULES.md  EXAMPLE-component.scss
│   ├── abstracts/ (9)   tokens-*, functions, mixins, variables
│   ├── base/ (5)        theme, reset, typography, icons, accessibility
│   ├── components/ (25) web/ (21 parciales)  app/ (3)
│   ├── utils/ (4)       vendors/ (2)
├── css/                                    (3)   core.css 411 KB · portal.css 304 KB · themes.css 24 KB  [compilados]
├── portal/                                 (63)  Fuente Sass del portal de documentación
│   ├── portal.scss
│   ├── base/ (4)  layout/ (3)  foundations/ (8)  components/ (8)  utilities/ (2)  sections/ (1)
│   └── pages/ (35)       Un parcial por página de documentación
├── js/                                     (34)  Scripts del portal + bundle + CSS generado
├── docs/                                   (473)
│   ├── intro.html
│   ├── app/ (6)  web/ (19)  transversales/ (20)   Páginas HTML por plataforma
│   ├── foundations/ (2)  tokens/ (6)  guidelines/ (6)  demo/ (1)  qa/ (1)
│   ├── technical-guides/ (4)                      Guías Markdown
│   └── auditoria-design-system/ (407)             Informes 00–31, decisiones y evidencias
│       └── evidencias/ (379)  14 subcarpetas + 16 archivos sueltos
├── scripts/ (5)                            Generadores `.mjs`
├── tokens/compensar.tokens.json            (1)   Export de Figma, 238 tokens
├── icons/ (2 954)                          assets/ (1 952)  svg/ (995)  fonts/ (4)  icons.css  selection.json
├── demo-icon-check/ (5)                    Demo de la fuente de iconos
├── nara/ (19)                              Paquete de conocimiento del asistente QA «Nara»
├── Documentacion/09-UX-UI/                 Carpeta vacía, no versionada (convención del agente UX)
└── node_modules/                           Ignorada (bootstrap 5.3.8, sass 1.99.0)
```

Carpetas hermanas fuera del repositorio, sin referencias desde el Core (verificado con `git grep`): `Nara/` (proyecto con su propio git, 266 archivos), `portal-ux-compensar/` (226), `compensar/` (196), `_propuestas/` (6) y `Claude outputs/` (1). `Nara/` (servicio) y `core-design-system/nara/` (paquete de QA) son cosas distintas con el mismo nombre.

## 3. Inventario y responsabilidades

### 3.1 Por tipo de archivo (versionados)

| Tipo | Archivos | Tamaño |
|---|---|---|
| svg | 2 948 | 4,0 MB |
| png | 248 | 15,1 MB |
| js | 114 | 1,1 MB |
| scss | 110 | 0,7 MB |
| html | 65 | 1,5 MB |
| md | 45 | 0,4 MB |
| json | 36 | 8,0 MB (6,9 MB es `icons/selection.json`) |
| txt / mjs / css / fuentes | 25 / 6 / 6 / 7 | — |

### 3.2 Por carpeta

| Carpeta | Archivos | Función verificada |
|---|---|---|
| `icons/` | 2 954 | Biblioteca fuente de iconos (SVG por categoría), fuente tipográfica `CompensarIcons` (otf, ttf, woff, woff2), `icons.css` (1 028 reglas `.icon-*`) y `selection.json` (proyecto IcoMoon, 1 030 glifos). |
| `docs/` | 473 | Contenido HTML del portal (66 archivos fuera de auditoría) y archivo de auditoría (407). |
| `portal/` | 63 | Sass de la presentación del portal (409 KB). |
| `core/` | 49 | Sass del sistema de diseño publicable (325 KB). |
| `js/` | 34 | 23 `*-docs.js` (lógica de cada página), 2 módulos de comportamiento del Core (`mp-dropdown.js`, `mp-tabs.js`), `component-docs.js` (1 942 líneas), bundle, tokens, 3 utilidades sin carga y un archivo generado. |
| `nara/` | 19 | 11 Markdown de conocimiento y prompts para un asistente de QA, 5 JSON de tokens, 3 medios (imágenes y un vídeo de 1,7 MB). |
| `scripts/` | 5 | Cinco generadores o validadores (§5). |
| `demo-icon-check/` | 5 | Demo independiente de la fuente de iconos con su propia copia de `icons.css` y de las fuentes. |
| `css/` | 3 | Salida de Sass. |
| `tokens/` | 1 | Export de Figma (56 KB). |

### 3.3 `core/`

- `core.scss` importa abstracts, Bootstrap (`../node_modules/bootstrap/scss/bootstrap`), base, `components/web`, `components/app`, utils y vendors. `themes.scss` solo importa `base/theme`.
- `components/web/` tiene 21 parciales (20 componentes más `_buttons-docs.scss`); `components/app/` tiene `_bottom-sheet`, `_dropdown` e `_index`. Cada carpeta tiene un `_index.scss` con `@forward`.
- Dos archivos no son alcanzables desde ningún punto de entrada: `core/components/web/_buttons-docs.scss` (292 líneas, cabecera dice `_buttons.scss`, 246 líneas distintas de `_buttons.scss`, ninguna regla suya aparece en `css/core.css`) y `core/EXAMPLE-component.scss` (plantilla).
- `SASS-RULES.md` es idéntico byte a byte a `nara/08-reglas-sass-oficiales.md`.

### 3.4 Portal de documentación

- **Shells (raíz):** `index.html` (landing, enlaza a `drupal.html` y `app.html`), `drupal.html` (26 scripts) y `app.html` (20 scripts). Ambos portales cargan el mismo `css/core.css`, `css/portal.css` e `icons/icons.css`.
- **Enrutador:** `js/ds-bundle.js` contiene dos tablas de rutas (`ROUTES` y `APP_ROUTES`, 60 entradas con rutas `docs/...html` escritas a mano) y `js/loader.js` otra (usa `fetch`). Cada página se descarga y se inyecta en el shell.
- **Páginas `docs/`:** 15 componentes compartidos en `transversales/components`, 5 fundamentos en `transversales/fundamentos`, 11 páginas en `web/components` (8 de componentes web más 3 de iconos), 4 en `app/components`, 6 en `tokens`, 6 en `guidelines`, 2 en `foundations`, `app/intro.html`, `app/fundamentos/layout.html`, `intro.html`, `demo/core.html` y `qa/checklist.html`.
- **Estilos por página:** 35 parciales en `portal/pages/`. Hay 16 sin componente homónimo en `core/` (`app-*`, `form-patterns`, `guideline-*`, `icons`, `landing`, `motion-animation`, `principles`, `responsive-breakpoints`, `web-header`, `demo-core`).
- **Lógica por página:** 23 `*-docs.js`. La nomenclatura no es uniforme: `alerts` → `alert-docs.js`, `toasts` → `toast-docs.js`, `modals` → `modal-docs.js`; `buttons`, `inputs` y las páginas de fundamentos no tienen `*-docs.js` propio (usan `component-docs.js` o código en línea).
- **Código en línea en HTML:** `icons-library.html` (1 564 líneas de script), `colors.html` (1 225), `typography.html` (897), `spacing.html` (621), `border-radius.html` (281), `shadows.html` (231). Ningún HTML de `docs/` tiene bloques `<style>`.

### 3.5 Auditorías, evidencias e históricos

- `docs/auditoria-design-system/`: 27 documentos en la raíz con numeración 00–17 y 25–31 (faltan 18–24), dos series de prefijo `09` (`09-Diagnostico-DEC-012.md` frente a `09.09-…` y `09.10-…`), un PDF de 583 KB y `decisiones/Compensar_Decisiones_DEC001_DEC012_v1_2 2.md` (el « 2» final es un artefacto de copia).
- `evidencias/`: 379 archivos, 14 MB. Tipos: 238 png, 80 js, 26 json, 24 txt, 7 html. Subcarpetas (archivos): `dec012-pi01` 94, `dec012-pi04` 50, `dec012-pi01-analisis` 41, `dec012-p3` 36, `dec012-p3-opcionB` 25, `dec005` 24, `dec011` 21, `dec003-diagnostico` 18, `dec004-006-008` 17, `dec004-006-008-b` 14, `dec007` 9, `scripts` 9, `dec012-p2` 5; más 16 archivos sueltos.
- No existe carpeta de pruebas. Las comprobaciones son scripts de Playwright dentro de `evidencias/`; el entorno que necesitan (`/tmp/qa` con `playwright`, `axe-core` y `fixture.js`) solo está descrito en `evidencias/dec011/LEEME.txt`.
- `Documentacion/09-UX-UI/` existe vacía en la raíz y no está versionada; la regla del agente UX indica esa ruta para su documentación, mientras que la documentación real del proyecto está en `docs/auditoria-design-system/`.

## 4. Mapa de dependencias

```
Figma ──(export manual)──> tokens/compensar.tokens.json ──┬─> scripts/sync-theme-modes.mjs ──> core/base/_theme.scss (entre marcadores)
                                                          ├─> scripts/generate-figma-tokens.mjs (legacy) ──> core/abstracts/_tokens-*.scss
                                                          └─> js/tokens.js ─ copia en ─> js/ds-bundle.js
core/core.scss ┐
core/themes.scss ├─ sass (package.json: build) ──> css/core.css · css/themes.css
portal/portal.scss ┘   (54 imports de portal hacia core; core no importa nada de portal)       ──> css/portal.css
core/components/**/_x.scss ──(scripts/generate-docs-css.mjs, API Sass)──> js/docs-css.generated.js ──> js/*-docs.js (visores y descargas)
icons/selection.json ──(IcoMoon, manual)──> icons/fonts/* + icons/icons.css
index.html / drupal.html / app.html ──> css/*.css · icons/icons.css · js/*.js ──(ds-bundle: rutas fijas)──> docs/**/*.html
docs/foundations/colors.html · spacing.html · typography.html ──(fetch en ejecución)──> core/abstracts/*.scss, core/utils/*.scss
docs/web/components/icons-library.html ──(fetch)──> icons/selection.json (6,9 MB) · icons/fonts/*
```

### 4.1 Build

`package.json` define `sass:build`, `sass:watch`, `sass:dev`, `build` (= `sass:build` + `generate-docs-css.mjs`), `docs:build` (= `generate-color-docs.mjs` + `generate-typography-docs.mjs`, que solo validan, no escriben) y `docs:check`. Dependencias: `sass ^1.77.0` y `bootstrap ^5.3.3` (instaladas 1.99.0 y 5.3.8; lock v3). `prepros.config` (21 KB) es una configuración de la aplicación Prepros que referencia `core.scss`/`portal.scss`, alternativa paralela al build npm. `sync-theme-modes.mjs` y `generate-figma-tokens.mjs` no están en ningún script npm.

`node_modules` se usa solo al compilar: `core/core.scss` (`@use '../node_modules/bootstrap/scss/bootstrap'`), `--load-path=node_modules` en los scripts y `loadPaths` de `generate-docs-css.mjs`.

### 4.2 Rutas escritas a mano que sostienen el sistema

| Origen | Depende de |
|---|---|
| Shells | `css/core.css`, `css/portal.css`, `icons/icons.css`, `js/*.js` (raíz del sitio) |
| `css/core.css` | `../icons/fonts/compensar-icons.*` (relativo a `css/`) |
| `icons/icons.css` | `fonts/compensar-icons.*` (relativo a `icons/`) |
| `js/ds-bundle.js`, `js/loader.js` | Rutas `docs/<carpeta>/<archivo>.html` (60 + 1 entradas); además `docs/tokens/*` desde 12 puntos del JS |
| `scripts/generate-docs-css.mjs` | Salida `js/docs-css.generated.js`; parciales `core/components/**`; nombres de `js/<componente>-docs.js`; exige que `drupal.html` y `app.html` carguen el generado |
| `scripts/sync-theme-modes.mjs` | `tokens/compensar.tokens.json`, `core/base/_theme.scss` |
| `docs/foundations/colors.html` | `core/abstracts/_tokens-colors.scss`, `core/utils/_colors.scss` (fetch en ejecución) |
| `icons-library.html` | `icons/selection.json`, `icons/fonts/*` |
| `portal/*` | 54 `@use` relativos hacia `core/` (las muestras apuntan a `core/abstracts/_index.scss`); ninguno de `core/` hacia `portal/` |
| `core/base/_theme.scss`, `_tokens-colors.scss` | Comentarios que citan `tokens/compensar.tokens.json` |

### 4.3 Instrucciones y configuraciones para IA

| Archivo | Contenido |
|---|---|
| `ia-context.md` (522 líneas) | Contexto de documentación de componentes; el componente Botón como referencia base. |
| `docs/technical-guides/IA_Context.md` (676 líneas) | Contexto funcional y técnico del portal y de los tokens. 1 031 de sus líneas difieren del anterior: son documentos distintos con tema solapado. |
| `docs/technical-guides/` (otros 3) | `README.md` (17 líneas), `color-workflow.md`, `navigation-workflow.md`. |
| `nara/00`–`10` | Prompts y reglas de un asistente de QA visual (para Copilot); referencian `core/abstracts/*` y `docs/qa/checklist.html`. |
| `README.md` (639 líneas) | Declara **Version 2.1.0**, abril de 2026, aunque `package.json` es 2.3.0. |
| `.vscode/settings.json` | Autoaprobación de `mv` en el terminal del chat; validación CSS desactivada. |

No existen `AGENTS.md`, `CLAUDE.md`, `.kiro/` ni `.github/` en el repositorio ni en la carpeta de trabajo superior. Las reglas del agente UX (`Documentacion/09-UX-UI/`) viven en la configuración del usuario, fuera del repositorio.

## 5. Archivos generados y fuentes originales

| Archivo | Tipo | Cómo se produce | ¿Hay script en el repo? |
|---|---|---|---|
| `css/core.css`, `css/themes.css`, `css/portal.css` | Generado (Sass comprimido, sin source map) | `npm run build` | Sí |
| `js/docs-css.generated.js` (139 KB) | Generado | `generate-docs-css.mjs` (`--check` en `docs:check`) | Sí |
| `core/base/_theme.scss` líneas 415–462 y 543–593 | Mixto: bloques generados entre marcadores dentro de un archivo editado a mano | `sync-theme-modes.mjs` | Sí, fuera de npm |
| `core/abstracts/_tokens-colors.scss`, `_tokens-radius.scss` | Cabecera «Generated from Figma token exports. Do not edit by hand» | `generate-figma-tokens.mjs` | Sí, pero lee una ruta absoluta inexistente |
| `core/abstracts/_tokens-spacing.scss`, `_tokens-typography.scss`, `_tokens-shadows.scss` | Cabeceras ambiguas o sin marca | Sin determinar | `generate-figma-tokens.mjs` escribe colors, spacing y radius; typography y shadows: no determinado |
| `tokens/compensar.tokens.json` | Export de Figma | Manual | No |
| `js/tokens.js` (4 886 líneas) | «Generated from Figma token exports» | Sin determinar | No |
| `js/ds-bundle.js` (5 627 líneas) | Bundle «Combina tokens.js + app.js + loader.js» | Sin determinar | No |
| `icons/fonts/*`, `icons/icons.css` | Export de IcoMoon | Manual | No |
| `nara/tokens-*.json` | Derivados de los tokens | Sin determinar | No |
| `docs/foundations`, `tokens/*` HTML | Fuentes escritas a mano que **leen** `core/` en ejecución | n/a | n/a |

Hallazgos de coherencia entre copias de tokens (medidos):
- `tokens/compensar.tokens.json` y `js/tokens.js`: 238 entradas, modos idénticos.
- `js/ds-bundle.js`: 238 entradas; **2 difieren** en `highContrast`: `base/brand/90` (`#e6e600` en json y tokens.js, `#e65c00` en el bundle) y `base/brand/100` (`#cccc00` frente a `#cc5200`). Esta auditoría no determina cuál es la correcta.
- Ambos archivos, `tokens.js` y `ds-bundle.js`, se modificaron en el mismo commit (`08cc680`). `app.js` y `loader.js` no se tocan desde el 7 de mayo de 2026, aunque el bundle sí.
- `nara/tokens-*.json`: 219 colores, 10 radios, 12 sombras, 17 espaciados, 44 tipografías. No se comparó su contenido.

## 6. Duplicaciones y problemas

### 6.1 Confirmados

| # | Problema | Evidencia |
|---|---|---|
| 1 | **Tokens en cinco ubicaciones** y divergencia ya existente en 2 valores | §5 |
| 2 | **El bundle y sus fuentes conviven**: `app.js`, `loader.js`, `tokens.js` no se cargan desde ningún HTML; solo `tokens.js` se menciona en un comentario de `colors.html`. `theme.js` y `code-copy.js` tampoco tienen referencia alguna | `git grep` sobre HTML/JS/MJS/JSON |
| 3 | **Generador legacy no ejecutable**: ruta absoluta `/Users/juan.soto/Downloads/Compensar MP`; además escribe `css/tokens.css`, que no existe y que el README e `IA_Context.md` aún citan | `scripts/generate-figma-tokens.mjs:8` |
| 4 | **Iconos duplicados**: de 2 947 SVG medidos por hash, 1 996 son únicos (951 copias); un SVG más, con nombre no ASCII, no entró en la medición. `icons/svg/` (995) repite los 950 nombres de `icons/assets/svg/`. Ninguna página ni CSS referencia `icons/svg` ni `icons/assets` | `md5`, `git grep` |
| 5 | **Fuente de iconos duplicada**: `demo-icon-check/css/fonts/*` y `icons/fonts/*` tienen hash distinto en woff2, woff y ttf; `icons.css` difiere en 120 líneas. Ningún archivo enlaza `demo-icon-check/` | `md5`, `diff`, `git grep` |
| 6 | **Páginas HTML sin ruta**: `docs/web/components/accordion.html`, `badges.html` y `loading.html` no están en el enrutador; el enrutador usa las de `transversales/`. `loading.html` es idéntico byte a byte; accordion y badges difieren (8 y 24 líneas sin espacios). `docs/qa/checklist.html` solo se cita en documentos Markdown | hash, `ds-bundle.js` |
| 7 | **Copias de documentos**: `core/SASS-RULES.md` = `nara/08-reglas-sass-oficiales.md` (idénticos) | hash |
| 8 | **Contexto IA solapado**: `ia-context.md` y `docs/technical-guides/IA_Context.md` cubren el mismo portal con texto distinto; README declara 2.1.0 | §4.3 |
| 9 | **Archivo huérfano versionado**: `.fuse_hidden0000001100000001` (HTML «App Compensar», 10,5 KB) está versionado aunque `.gitignore` lo excluye | `git ls-files -ci` |
| 10 | **SCSS inalcanzables**: `core/components/web/_buttons-docs.scss`, `core/EXAMPLE-component.scss` y `portal/sections/_index.scss` (reenvía `principles`, `buttons` y `landing`, que no existen en esa carpeta; `portal.scss` no lo importa) | grafo de imports |
| 11 | **Estilos del Stepper en otro archivo**: sus clases de documentación están en `portal/pages/_form-patterns.scss`; no hay `portal/pages/_stepper.scss` | `git grep` |
| 12 | **Rutas absolutas del equipo** en un script de generación (1) y en 21 archivos de evidencias | `git grep "/Users/"` |
| 13 | **Dependencias fuera del repo** de las pruebas: 26 scripts requieren `/tmp/qa`, 62 archivos apuntan a `localhost:800x` | `git grep` |
| 14 | **Salida generada junto a fuentes**: `css/` contiene solo salida, pero `js/` mezcla en 34 archivos fuentes, bundle, datos y un generado; `core/base/_theme.scss` mezcla texto manual y bloques generados | §5 |
| 15 | **Nombres problemáticos**: carpetas `icons/assets/Desing`, `Edication`, `Peaple` (erratas), `Math & finance` (espacio y `&`, 57 archivos), un SVG con carácter cirílico en `icons/assets/health/`, y `decisiones/…v1_2 2.md`. 60 rutas versionadas tienen espacios, `&` o caracteres no ASCII | `git ls-files` |
| 16 | **Paquete `nara/` dentro del Core**: 19 archivos, 4,7 MB (3 medios), sin relación de build con el sistema; mismo nombre que el proyecto hermano `Nara/` | §2 |
| 17 | **Numeración de informes irregular**: sin 18–24; dos series `09` | §3.5 |
| 18 | **Peso en ejecución**: `icons-library.html` descarga `icons/selection.json` (6,9 MB); `docs-css.generated.js` (139 KB) se carga en todas las páginas | `git grep`, informe 26 |
| 19 | **Convenciones de ubicación de documentación en conflicto**: la documentación vive en `docs/auditoria-design-system/` pero el agente UX espera `Documentacion/09-UX-UI/` (vacía) | §3.5 |
| 20 | **Convención de nombres de componente irregular** entre `core`, `portal/pages`, `docs` y `js` (singular/plural, prefijo `app-`/`web-`) | §3.4 |

### 6.2 Posibles mejoras (no confirmadas como defecto)

- `prepros.config` frente a `npm run build`: no se verificó si ambos producen el mismo CSS.
- `docs/transversales` combina componentes que son comunes a Web y App; si realmente son idénticos para ambas plataformas no se verificó.
- Peso de `.git` (31 MB) y de los medios de `nara/` y de `evidencias/` (15 MB): no genera fallos hoy.
- `README.md` y `IA_Context.md` en su versión de `HEAD` citan `js/router.js`, ausente en el árbol de trabajo (cambio ajeno sin commit).

## 7. Riesgos de una reorganización

Hechos que condicionan cualquier movimiento (ver §4.2):

1. **Rutas fijas hacia `docs/`**: 60 + 1 rutas en dos tablas de JS y unas 100 cadenas `docs/…` en scripts. Mover o renombrar una página rompe su carga sin error de compilación.
2. **Posición relativa `css/` ↔ `icons/`**: `core.css` apunta a `../icons/fonts/`; `icons.css` a `fonts/`. Los shells están en la raíz.
3. **`core/` ↔ `node_modules`**: `core/core.scss` usa una ruta relativa de dos niveles hacia `node_modules`; los scripts npm y `generate-docs-css.mjs` fijan `core/core.scss`, `core/themes.scss`, `portal/portal.scss` y `css/` como entradas y salidas.
4. **Acoplamiento portal → core**: 54 imports desde `portal/` hacia `core/` (las muestras revisadas apuntan a `core/abstracts`). Si cambia esa ruta fallan los dos árboles.
5. **Generadores con nombres de archivos embebidos**: `generate-docs-css.mjs` conoce los nombres `js/*-docs.js`, los parciales de componente, `drupal.html`, `app.html` y `js/docs-css.generated.js`; `sync-theme-modes.mjs` conoce `tokens/compensar.tokens.json` y `_theme.scss`.
6. **Lecturas en tiempo de ejecución** de `core/abstracts/*.scss`, `core/utils/_colors.scss` e `icons/selection.json` desde páginas de documentación.
7. **Caché**: los shells usan parámetros `?v=` por recurso; un cambio de ruta obliga a revisarlos.
8. **Casos sensibles a mayúsculas**: las rutas con espacios y `&` existen solo en `icons/assets`; no hay referencias a ellas desde código.
9. **Historial**: 13 commits locales sobre `origin/main` (1 191 archivos de diferencia medidos en `aa44ad6`); el remoto aún versiona 680 archivos de `node_modules`.
10. **Evidencias**: 81 scripts de evidencias contienen rutas relativas o absolutas hacia el repositorio y `localhost`; mover carpetas invalida su reproducibilidad (no verificado caso por caso).
11. **Cambios ajenos pendientes**: 7 archivos sin commit en el árbol de trabajo (`README.md`, `ia-context.md`, `IA_Context.md`, `navigation-workflow.md`, `icons-intro.html`, `16-Implementacion-DEC-007.md`, borrado de `js/router.js`) que cualquier movimiento tendría que respetar.
12. **Protegidos**: Bootstrap (`node_modules`), `core/vendors/`, el Header ZT y los componentes protegidos por decisión del proyecto residen en `core/`.

## 8. Aspectos relevantes para un futuro sistema de agentes

- **Sin punto de entrada único**: ningún `AGENTS.md`/`.kiro/` en el repositorio; el contexto existe en tres lugares con textos distintos y vigencia dispar (README 2.1.0).
- **Sin pruebas ejecutables desde el repositorio**: `package.json` no tiene script `test`; los arneses necesitan `/tmp/qa` y un servidor local manual (`python3 -m http.server`).
- **Fuentes sin propietario claro**: cinco copias de tokens; el bundle del portal puede divergir sin que ninguna comprobación lo detecte (`docs:check` solo cubre `docs-css.generated.js`).
- **Un solo archivo grande como cuello de botella**: `js/ds-bundle.js` (141 KB), `js/component-docs.js` (69 KB), `docs/foundations/colors.html` (359 KB) y `icons-library.html` (1 564 líneas de script) concentran lógica de varias páginas; dos agentes editando páginas distintas tocarían los mismos archivos.
- **Archivos compartidos de alta contención**: `css/core.css` y `css/portal.css` (salida compilada comprimida, 411 y 304 KB), `js/docs-css.generated.js` (una línea por componente), `drupal.html` y `app.html` (listas de scripts con `?v=`), `package.json` y `package-lock.json`. Cualquier cambio de fuente obliga a regenerar y versionar salidas, lo que produce conflictos de merge no resolubles a mano.
- **Informes numerados secuencialmente** en `docs/auditoria-design-system/`: dos agentes que creen informes en paralelo chocarán en el número (ya hay huecos y dos series `09`).
- **Medios y evidencias pesados en el mismo árbol** que el código (15 MB de evidencias, 4,7 MB de `nara/`, 12 MB de iconos): aumentan el coste de contexto y de búsqueda; `git grep` sobre todo el árbol devuelve ruido de `evidencias/`.
- **Límites de responsabilidad poco marcados**: `core/` (publicable) y `portal/`, `docs/`, `js/` (documentación) comparten raíz y `package.json`; `nara/` es un producto aparte; las reglas del agente UX apuntan a una carpeta (`Documentacion/09-UX-UI/`) que el proyecto no usa.
- **Reglas del Core que un agente debe conocer y no están en un solo sitio**: `core/SASS-RULES.md` (y su copia en `nara/`), restricciones de Bootstrap y de componentes protegidos, que figuran en el registro de decisiones (`docs/auditoria-design-system/decisiones/`) y en los informes.
- **Entorno**: Node ≥ 18, `npm ci` reconstruye `node_modules`; la carpeta superior contiene proyectos hermanos con su propio git (`Nara/`), de modo que las operaciones git deben ejecutarse dentro de `Core-Design-System/`.
