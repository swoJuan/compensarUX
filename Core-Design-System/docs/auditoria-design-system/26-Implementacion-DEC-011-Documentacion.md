# 26 — Implementación DEC-011: documentación sincronizada con el Core

> **Actualización (10 nov 2026):** los hallazgos **F-1** y **F-2** (sección 3) y la automatización del build (sección 1, «Pendiente de aprobación») quedaron resueltos en `27-Correcciones-F1-F2-Automatizacion-Build.md`, que prevalece sobre este informe en esos tres puntos.

> 10 de noviembre de 2026 · base `08cc680` (DEC-004/006/008). Chromium (Chrome for Testing 1254), tamaño de texto real del navegador. Sin commit, tag, push ni despliegue. Evidencias: `evidencias/dec011/`.
> **Alcance:** solo documentación y andamiaje del portal. `core/`, Bootstrap, vendors, `package*.json`, DEC-001 y DEC-002 no se tocaron. Cierra P-011-01, P-011-02 y P-011-03 del informe 08.

## 1. Solución mantenible: el CSS de la documentación se genera desde `core/`

**Problema (P-011-02).** 17 scripts `js/*-docs.js` embebían a mano el CSS de su componente para el visor y para la descarga. Nadie lo actualizaba al cambiar `core/`. Hallazgos medidos: el export de Modal mostraba `px` y un radio de 12 px, los de Alert y Toast un cuerpo de 14 px (el Core usa 16 px), el de Paginación un radio de 8 px, y el de Dropdown el foco naranja y una **tercera copia** más antigua en la descarga. Dos de esos desfases (Paginación y Dropdown) los había creado el lote anterior (DEC-004/008), lo que confirma que el proceso manual no escala.

**Qué se hizo.**
- `scripts/generate-docs-css.mjs` compila con la API de Sass el parcial real de cada componente (el mismo CSS que `css/core.css`, con `rem()` resuelto) y añade los tokens que ese CSS necesita, por tema (Light, Dark y Alto contraste) desde `core/base/_theme.scss`. La descarga sigue siendo autocontenida.
- Escribe `js/docs-css.generated.js`, que expone `mpDocsCss(clave)` y `mpDocsScss(clave)`. Los `*-docs.js` solo lo leen. Se eliminaron **1856 líneas** de CSS pegado a mano.
- `node scripts/generate-docs-css.mjs --check` sale con código 1 si el archivo está **desfasado respecto a `core/`**, o si algún `*-docs.js` **vuelve a embeber CSS**, o si un shell deja de cargar el archivo. Si no puede leer los tokens por tema, falla en voz alta en lugar de generar bloques vacíos.
- Cubre 17 componentes: alert, modal, toast, selection, badges, avatar, web-header, sidebar, stepper, loading, breadcrumb, accordion, app-bottom-sheet, pagination, dropdown, cards, tables.

**Cómo se usa.** Tras tocar cualquier `core/components/**/_*.scss`: `npm run build && node scripts/generate-docs-css.mjs`. Antes de cada release: `node scripts/generate-docs-css.mjs --check`.

**Pendiente de aprobación (no se hizo):** enganchar el generador a `npm run build` o a `docs:build` exige editar `package.json`, que está protegido en este proyecto. Hasta entonces el control es manual (`--check`).

## 2. Resto de puntos

| Punto | Resultado |
|---|---|
| Cuerpos de Alert y Toast en 14 px | Corregidos a 16 px (`--body---l`) en `alert-docs.js`, `toast-docs.js`, `alerts.html` y `toasts.html`. El visor ya mostraba 16 px por construcción. |
| Colores fijos de las demos de Alert | `portal/pages/_alerts.scss` redefinía `--mp-alert-*` y forzaba blanco con `!important` en Dark/HC, lo que contradice la regla "el portal no redefine clases del Core" y tapaba los iconos de Warning y Error. Se retiraron los tres bloques; las demos ahora muestran lo que publica el Core. |
| Imágenes caducadas del Header (P-011-01) | Las 8 URLs temporales de Figma se descargaron desde los nodos de origen (`get_screenshot`, solo lectura) a `docs/web/components/assets/header/` con `width` y `height`. |
| Header que no se renderizaba (P-011-03) | Nueva sección "Componente en vivo" con playground (variante, CTA, buscador, menú, drawer), tres variantes y dos estados, todo con el `.mp-web-header` real. |
| Defectos propios del script del Header | El snippet del drawer repetía el id del buscador (`replace` solo cambiaba la primera aparición, así que el `<label for>` apuntaba a un id inexistente, también en el HTML copiable); cada vista previa duplicaba ids; el botón de menú no hacía nada. Corregido: `replaceAll`, ids únicos por vista previa y apertura/cierre con `aria-expanded` y Escape devolviendo el foco. |
| Responsive de las páginas de documentación | `.main` tiene `overflow-x: hidden`, así que el desborde era contenido recortado. Causa común: páginas `display: grid` sin `minmax(0, 1fr)`. Se corrigió en `.component-doc-page`, listas, encabezados de sección, tablas de API/tokens y la fila de descargas. |
| Bloques de código con scroll | Al contener el ancho, los `<pre>` pasan a desplazarse dentro de su caja y el teclado no los alcanzaba (axe `scrollable-region-focusable`, 0 → 2 en Badges a 375 px). `js/docs-a11y.js` (solo documentación) les da `tabindex="0"` únicamente cuando desbordan. Badges pasó a 0 reglas peores y 3 mejores frente a HEAD. |
| Versionado de caché | `?v=` de `core.css`, `portal.css`, `ds-bundle.js` y los `*-docs.js` modificados subido a `20261110-1`. El `core.css` del commit anterior nunca había subido su versión. |

## 3. Hallazgos del Core (no se tocó el Core; requieren aprobación)

Aparecieron al dejar de tapar las demos y al renderizar el Header por primera vez.

- **F-1 · `.icon-info` gana a `--mp-alert-icon` y `--mp-toast-icon`.** El sistema de iconos define `.icon-info { color: … !important }` y la clase del glifo "info" se llama igual. En Dark y Alto contraste el icono de la alerta Info queda azul `#296FF0` sobre azul: **2,09:1 y 3,00:1** (falla 1.4.11). Lo sufriría cualquier consumidor que copie el snippet. Se dejó una regla **solo de documentación**, marcada como temporal, en `portal/pages/_alerts.scss` y `_toasts.scss`. **Arreglo propuesto en el Core:** `.mp-alert__icon .icon, .mp-toast__icon .icon { color: currentColor !important }`, el patrón que ya usa `_modals.scss`.
- **F-2 · `.mp-web-header__cta` fija el texto en `--use-text-on-dark-primary` (blanco) sobre `--use-primary-default`.** En Alto contraste el fondo es amarillo y el contraste es **1,07:1**; en Dark es **2,05:1** (1.4.3). Los botones `.mp-btn` ya usan `use/text/inverse` para esto. En Light es 2,93:1 por el naranja corporativo (DEC-001, protegido). Cambiarlo es una decisión de Core y de UX.

## 4. Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `npm run build` | Sin errores ni advertencias |
| `generate-docs-css.mjs --check` | Sincronizado (17 componentes) |
| Control negativo del `--check` | Detecta un cambio en `core/` (exit 1) y detecta CSS pegado a mano en un `*-docs.js` (exit 1). Archivos restaurados. |
| Visores y descargas reales (`exports-check.js`) | **149/149** en 17 páginas: pestañas CSS y Sass y archivos descargados idénticos al generado, sin errores JS |
| Equivalencia del CSS descargable frente a `core.css` (`export-equiv.js`) | 15 páginas × 3 temas, **61 975 valores comparados, 209 distintos**. Los 209 son entorno de la prueba (color `body` heredado, `box-sizing` del reboot) o clases de Bootstrap que el export no incluye por diseño; ninguno es un valor definido por un componente. Alert, Toast, Badges, Avatar, Paginación, Tables, Loading y Breadcrumb dan **0 diferencias**. |
| Alert y Toast en el portal real, 3 temas | Título y cuerpo ≥ 4,5:1, iconos ≥ 3:1, cuerpo a 16 px (`dec011-pages.js`: **136/136**) |
| Header en el portal real | 8/8 imágenes locales, 6 componentes, 0 ids duplicados, 0 `label for` huérfanos, playground, apertura del drawer a 375 px, Escape con retorno de foco, sin desborde |
| Desborde horizontal del contenido, 1280/375/320 px | De **18 a 8** páginas de componente con recorte. Alert, Toast, Modal, Header, Selection, Badges, Botones, Tabs, Tables, Dropdown y Cards a 320 y 375 quedan sin desborde. |
| axe, Alert/Toast/Modal frente a HEAD | Sin reglas peores en las combinaciones tema × ancho. |
| axe, Header | Ya no hay `label-content-name-mismatch`, `landmark-unique` ni `scrollable-region-focusable`. Quedan los 3 de HEAD que son patrón compartido y F-2/DEC-001. |

## 5. Pendientes y riesgos

- **Aprobación para el Core:** F-1 (iconos) y F-2 (CTA del Header). Mientras tanto la documentación oculta F-1 con una regla temporal.
- **Aprobación para `package.json`:** enganchar el generador al build.
- **Responsive residual (sin tocar, fuera del lote):** Accordion, Breadcrumb, Cards (1280), Empty state, Inputs, Loading, Sidebar y Stepper siguen recortando contenido a 320 px (entre 34 y 235 px). Medido en `main-overflow-despues4.json`. Causas distintas por página (anchos fijos en demos).
- **`aria-allowed-attr` en las pestañas de código** (`.code-tabs` con `role` inexistente y `aria-selected` en botones): patrón compartido por todas las páginas con visor, ya presente en HEAD.
- **Export de Modal y Header en estados no capturados:** el visor muestra el CSS del Core; los estados que el Core no define (por ejemplo, ZT colapsado) siguen como imágenes de referencia en el Header, sin componente equivalente.
- **Peso:** `js/docs-css.generated.js` pesa 138 KB y se carga en todas las páginas del portal. Si molesta, se puede cargar bajo demanda por página.
- **No ejecutado:** Firefox, Safari y lectores de pantalla.
