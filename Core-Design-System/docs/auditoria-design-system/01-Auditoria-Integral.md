# 01 — Auditoría integral UX/UI del Sistema de Diseño Compensar v2.1.0

**Producto:** Compensar Design System v2.1.0 (Medicina Prepagada)
**Repositorio auditado:** `Core-Design-System` (copia local). Commit `a33a844` (4 sep 2026) más cambios sin commit en `core/components/web/_inputs.scss`, `README.md`, `ia-context.md` y documentación.
**Fuente de diseño:** Figma `1zVGMpzqBgiBUqhmfFEAoT`, página `SD - Documentacion` (3909:20350)
**Fecha:** 5 de noviembre de 2026
**Tipo:** diagnóstico. No se modificó código, Figma, tokens ni estilos. Solo se crearon estos documentos y la carpeta `evidencias/`.

---

## 1. Resumen ejecutivo

### 1.1 Estado general

El sistema tiene una **arquitectura de tokens sólida y bien alineada a Figma en su capa base**: los colores `use/*`, los radios, las sombras, el body y las medidas de los componentes `mp-*` coinciden con las variables de Figma, y los modos Dark y HC están definidos a nivel de token. Botones, checkbox, radio, switch, accordion y el modal de referencia se operan bien con teclado.

Hay **cuatro bloqueantes y tres frentes de riesgo**:

1. **Contraste de la marca naranja** (origen Figma): el componente más usado del sistema no cumple AA, y las alternativas propuestas por las auditorías anteriores **tampoco cumplen**.
2. **Componentes interactivos sin soporte de teclado** (dropdown y tabs).
3. **Temas Dark y HC incompletos a nivel de componente**: textos con contraste de 1.00:1 y errores de formulario imperceptibles. El token está bien; el componente no lo usa o lo sobrescribe.
4. **Deuda de build y arquitectura**: CSS compilado desactualizado, Bootstrap compilado sin la configuración del DS, alias tipográficos desplazados que encogen el texto de alertas y toasts a 12 px, y la API legacy aún activa.

### 1.2 Hallazgos únicos por severidad

| Severidad | Cantidad |
|---|---|
| Crítica | 4 |
| Alta | 8 |
| Media | 17 |
| Baja | 9 |
| **Total** | **38** |

Origen: 3 Figma, 27 código, 8 ambos. Frente a las auditorías previas: 25 nuevos, 8 confirmados, 1 parcialmente corregido y 4 pendientes. De los 26 hallazgos previos, 3 resultaron falsos positivos (ver documento 06).

### 1.3 Los 10 problemas más importantes

1. **DS-01** · Marca `#ff6600`: 2.94:1 como fondo de texto blanco y como texto (botones, tabs, paginación, chips, enlaces). Origen Figma.
2. **DS-03** · Dropdown no operable por teclado; `aria-expanded` no se actualiza.
3. **DS-04** · Tabs inalcanzables por teclado: sin flechas y con `tabindex=-1`.
4. **DS-02** · Dark: badge verde a 1.00:1, naranja a 1.20:1, tab activo a 2.05:1, warning y success por debajo de 4.5:1.
5. **DS-05** · El estado de error no se ve en Dark ni en HC.
6. **DS-09** · `core.css` desactualizado; el WIP de readonly deja el campo sin foco visible.
7. **DS-06** · Indicadores de foco a ≈1.2:1 o basados solo en color.
8. **DS-07** · Bordes de campo a 1.32:1 y switch apagado a 2.49:1 (1.4.11). Origen Figma.
9. **DS-11** · Cuerpo de alertas y toasts a 12 px (Figma 16) por alias de tamaño desplazados.
10. **DS-10** · Bootstrap compilado con sus valores por defecto (azul `#0d6efd`, radio 0.375rem).

### 1.4 Problemas que nacen en Figma

DS-01 (contraste de marca), DS-07 (bordes y estados por debajo de 3:1), parte de DS-06 (foco del input `#ffe6d6`), DS-16 (foco de botón con `#db3c0b` fuera de paleta, terciario de 32 px, reglas contradictorias), DS-17 (checkbox con variable `use/text/link`, switch como imagen), DS-23 (cuerpo info `#0b3954` sin variable), DS-24 (radio 12 y radios ligados a spacing) y DS-31 (componentes sin tablero). Las propias reglas de accesibilidad publicadas en los tableros de Figma («contraste mínimo 4.5:1», «área táctil 44px») contradicen algunos de sus componentes.

### 1.5 Problemas que nacen en HTML/CSS

DS-02, 03, 04, 05, 08, 09, 10, 11, 12, 13, 14, 18, 19, 20, 22, 25, 26, 27, 28, 29, 30, 32, 33, 35, 36, 37 y 38.

### 1.6 Componentes que necesitan una revisión más profunda

**Dropdown** (rediseño del patrón de interacción), **Tabs** (patrón APG), **Inputs** (estados en los tres temas y conciliación con Figma), **Badges/Chips/Tags** (modo Dark completo), **Header web y Sidebar** (sin tablero Figma localizado, foco débil, comportamiento móvil sin probar) y **Tables** (región de scroll, caption y comportamiento responsive).

### 1.7 Riesgos

- **Accesibilidad:** el botón primario, los enlaces y los estados de error son los riesgos de más impacto en un producto de salud. Dropdown y tabs bloquean a quien navega solo con teclado. Ninguno de los modos Dark y HC es seguro hoy para texto en badges y estados.
- **Mantenimiento:** 312 hex dentro de los componentes, dos APIs activas, Bootstrap sin configurar (411 KB de `core.css`), alias de tokens con nombres engañosos y un build manual que ya se desincronizó.

### 1.8 Recomendaciones por prioridad

- **P0:** contener el WIP de readonly y recompilar (DS-09); decidir el color de acción accesible (DS-01); reparar dropdown y tabs (DS-03, DS-04); completar Dark en badges, tabs y estados (DS-02); hacer visible el error en Dark/HC (DS-05).
- **P1:** foco único accesible (DS-06/21); bordes ≥3:1 (DS-07); colores forzados (DS-08); configurar Bootstrap (DS-10); corregir los alias de tamaño (DS-11); plan de retiro de legacy (DS-12); subrayar enlaces (DS-32).
- **P2–P3:** conciliación de fidelidad, tokens y portal (ver `05-Plan-Remediacion.md`).

### 1.9 Limitaciones (resumen; detalle en §8)

Sin lectores de pantalla, solo Chromium, Figma consultado por MCP (no se pudieron descargar los PNG de algunos nodos, aunque sí se generaron capturas de los tableros 2.1 y 2.2), y la Etapa A no fue completamente ciega a las auditorías previas porque estaban adjuntas desde el inicio.

---

## 2. Metodología

### 2.1 Etapas

- **Etapa A (independiente):** lectura de los 47 archivos SCSS de `core/` (≈9 000 líneas); recompilación de la fuente en un directorio temporal y comparación con `css/core.css`; extracción de Figma por MCP (variables de 12 tableros y `get_design_context` de 13 instancias o estados); render en Chromium del CSS publicado (harness propio con 60+ elementos marcados y las 20 páginas de componentes del portal); medición de estilos computados y contraste en los tres temas; pruebas de teclado con Playwright; axe-core en 20 páginas × 3 temas usando el selector de tema real del portal; emulación de `forced-colors`, `prefers-reduced-motion` y viewport de 320 px.
- **Etapa B:** contraste con 09.09 y 09.10 (documento 06).

### 2.2 Niveles de verificación

| Marca | Significado |
|---|---|
| `C` | Verificado en código (lectura de SCSS/JS o CSS compilado) |
| `V` | Verificado visualmente (captura renderizada) |
| `F` | Verificado funcionalmente (teclado, ARIA en tiempo de ejecución, axe) |
| `Fg` | Verificado en Figma vía MCP |
| `P` | Pendiente de comprobar |

### 2.3 Criterios

10 heurísticas de Nielsen, WCAG 2.2 AA (POUR), consistencia del sistema, fidelidad Figma↔código, arquitectura de tokens, mantenibilidad y calidad del HTML semántico.

**Regla aplicada:** cuando el problema nace en Figma, se marca como decisión pendiente de UX/UI y no se recomienda ocultarlo solo en CSS.

### 2.4 Entorno de prueba

Chromium (Playwright) a 1440×900 y 320×800, con Roboto 100/300/400/500/700/900 servida localmente para replicar el import de producción (Google Fonts no era accesible desde el entorno). Los scripts están en `evidencias/scripts/` y el harness en `evidencias/audit-harness.html`.

---

## 3. Alcance

| Área | Cobertura |
|---|---|
| Tokens (color, tipografía, spacing, radius, sombras) | Completa (C, Fg) |
| Temas Light / Dark / High Contrast | Completa (C, V, F) |
| Buttons · Inputs/Select/Textarea · Checkbox/Radio/Switch | Completa (C, V, F, Fg) |
| Alerts · Toast · Modal | Completa (C, V, F, Fg); medidas de modal en Figma parcialmente |
| Dropdown · Tabs · Accordion · Pagination | Completa (C, V, F); Figma en tabs y paginación |
| Cards · Tables · Stepper · Loading · Empty state | C, V, F; Figma por variables de tablero |
| Header · Sidebar · Breadcrumb · Badges · Avatar | C, V, F; sin tablero Figma para Header, Sidebar y Avatar |
| App: Bottom-sheet, Dropdown app | Solo código (C) |
| Portal de documentación | V, F (axe y reflow) |
| Lectores de pantalla, Safari, Firefox, zoom real al 200 % | **Pendiente** |

---

## 4. Arquitectura del sistema (verificado en código)

- **Capas:** `abstracts` (tokens Sass generados desde Figma, funciones, mixins) → Bootstrap 5.3.8 completo → `base` (theme con custom properties para los tres temas, reset, tipografía, iconos, accesibilidad) → `components/web` (19) y `components/app` (2) → `utils` (300 `!important`) → `vendors` (overrides de Bootstrap e iconos).
- **Temas:** `[data-theme]` en `<html>`; `theme.js` lee `localStorage` y `prefers-color-scheme`, pero no `prefers-contrast` ni `forced-colors`.
- **Puntos fuertes:** los tokens `use/*` se generan a partir de Figma; los componentes `mp-*` exponen variables locales (`--mp-btn-*`, `--mp-inp-*`), lo que facilita el theming; hay `:focus-visible` global, `.sr-only`, skip-link y áreas táctiles de 44 px.
- **Debilidades:** (a) `_variables.scss` pretende configurar Bootstrap pero, al importarlo con `@use` sin `with`, los valores no llegan (DS-10); (b) alias semánticos con nombres engañosos (`--font-size-md` = 14 px) (DS-11); (c) los bloques de tema de cada componente reintroducen hex y primitivos (DS-22); (d) convivencia con la API legacy (DS-12); (e) build manual con Prepros/sass sin verificación (DS-09); (f) la carpeta `nara/` y los prototipos conviven en el repo (fuera de alcance).

---

## 5. Revisión por componente

Para cada componente se resume qué cumple y qué hallazgos le afectan. El detalle de cada hallazgo está en §6.

| Componente | Lo que funciona | Hallazgos |
|---|---|---|
| **Buttons** (`mp-btn` + legacy) | Medidas, radio, tipografía y sombras fieles; Dark y HC correctos en `mp-*`; foco visible de 3 px; 48 px de alto | DS-01, DS-12, DS-16, DS-18, DS-21, DS-14 |
| **Inputs / Select / Textarea** | Medidas, label y placeholder fieles; `aria-invalid` y `describedby` en el playground | DS-05, DS-06, DS-07, DS-09, DS-15, DS-19, DS-24, DS-27 |
| **Checkbox / Radio / Switch** | Hit de 44, control 24, visual 18; Tab y Espacio funcionan; foco de 3 px | DS-07, DS-08, DS-17, DS-20, DS-02 (check en Dark), DS-27 (un switch sin rol) |
| **Alerts / Toast** | Estructura, iconos, `role` status/alert, contraste Light ≥8:1 | DS-11, DS-14, DS-02 (Dark), DS-22, DS-23, DS-33 |
| **Modal** | Medidas, `role="dialog"`, `aria-modal`, trampa de foco, ESC y retorno (en el JS de la doc) | DS-28, DS-36, DS-13 (H4) |
| **Dropdown** | Medidas equivalentes al input; opciones con `role="option"` | DS-03, DS-01, DS-06, DS-20, DS-36 |
| **Tabs** | Padding y radio fieles a Figma | DS-04, DS-01, DS-02, DS-11, DS-14 |
| **Accordion** | `aria-expanded` correcto, botones nativos, sin foco dentro de paneles cerrados, respeta movimiento reducido | DS-38 |
| **Cards** | Tokens de superficie, borde y sombra; Dark y HC definidos | DS-13 (título 500), DS-22 |
| **Tables** | Estilos de striped/hover/selected, `tabular-nums` | DS-25, DS-11 |
| **Pagination** | Ítems de 44×48, `aria-current`, `aria-label` por página | DS-01, DS-11, DS-17 |
| **Stepper** | Conteo textual «Paso n de m» | DS-26, DS-07 |
| **Loading** | `role="status"`, texto visible, variantes | DS-29, DS-01 (spinner a 2.94) |
| **Empty state** | Estructura clara, variantes | — (solo DS-22 menor) |
| **Header web** | Áreas táctiles de 44 px, `aria-current` | DS-06, DS-14, DS-31, DS-37 |
| **Sidebar** | `visibility:hidden` al cerrar (no deja foco oculto), ESC cierra | DS-22 (`#fff` en hover), DS-31 |
| **Breadcrumb** | Estructura `nav > ol`, actual con `aria-current` | DS-06 (foco de 1 px) |
| **Badges / Chips / Tags** | Variantes por estado; `aria-pressed` en chips | DS-02, DS-01 |
| **Avatar / User-chip** | Tamaños y variantes | DS-01, DS-02, DS-20 |
| **Bottom-sheet / Dropdown app** | Variantes por tema | DS-06, DS-22, DS-36 |
| **Portal de documentación** | Playgrounds, código copiable, selector de tema funcional | DS-30 |

---

## 6. Registro de hallazgos (fichas)

> Formato: ID · Componente · Categoría · Severidad · Problema · Evidencia · Esperado · Actual · Impacto · Solución propuesta · Responsable · Estado. La verificación se indica entre corchetes.

### DS-01 · Contraste de la marca naranja `[C V F Fg]`
- **Componente:** transversal (botón primario, secundario y terciario, tab activo, paginación, chip seleccionado, avatar brand, opción y chip del dropdown, enlaces, skip-link, spinner) · **Categoría:** Accesibilidad · **Severidad:** Crítica
- **Problema:** `use/primary/default` = `use/text/link` = `#ff6600` se usa como fondo de texto blanco y como color de texto sobre blanco.
- **Evidencia:** Figma 4498:2274 y 4541:39004 (variables); `_buttons.scss` `.mp-btn--primario/secundario/terciario`; `_tabs.scss` `[aria-selected='true']`; `_pagination.scss --mp-pagination-text`; medición: blanco/`#ff6600` 2.94, blanco/`#e63f0c` 4.13, `#ff6600`/blanco 2.94; axe `color-contrast` en nodos `mp-*` en las 20 páginas de componentes (Light).
- **Esperado:** ≥4.5:1 (16 px Bold no es texto grande).
- **Actual:** 2.94:1 en Light. Dark y HC sí cumplen en `mp-btn`.
- **Impacto:** la acción principal y los enlaces son difíciles de leer para personas con baja visión o con pantallas al sol. Es el componente más usado.
- **Solución:** decisión UX/UI en Figma: texto `#111` sobre `#ff6600` (6.43) o un naranja de acción ≥4.5:1 (`#c25100` 4.70, `#bf4f00` 4.85, `#b84c00` 5.16). `#e63f0c` y `#cc5200` **no** sirven (4.13 y 4.40). Luego propagar a los tokens.
- **Responsable:** UX/UI → Desarrollo · **Estado:** Confirmado (con corrección de la recomendación previa).

### DS-02 · Dark mode con texto ilegible en componentes `[C V F]`
- **Componente:** badges, chips, tags, tabs, checkbox, avatar brand, alert y toast (warning y success), user-chip, helpers · **Categoría:** Accesibilidad · **Severidad:** Crítica
- **Problema:** los tokens de superficie `use/surface/*` no cambian en Dark, pero el texto temático sí; varios componentes no tienen bloque Dark.
- **Evidencia:** badge `--green` `#ecf7c9`/`#ecf7c9` **1.00**; `--orange` 1.20 (harness) y 2.48 (doc); `--violet` 2.45; `--warning` 4.06; `--success` 4.34; tab activo blanco/`#ff9d5c` 2.05; alert warning 4.43; toast warning 4.07; hover del user-chip 1.02; helper `#a4a4a4`/`#4d4746` 3.65. Captura `docs-badges-dark.png`.
- **Esperado:** ≥4.5:1 en todo el texto en Dark.
- **Actual:** texto invisible o casi invisible en varias variantes.
- **Impacto:** el estado de una solicitud o una etiqueta no se puede leer en Dark.
- **Solución:** modo Dark para `use/surface/*` en Figma y `_theme.scss`; bloque Dark en tabs, avatar, checkbox y user-chip; recalibrar warning y success en Dark.
- **Responsable:** UX/UI (paleta) + Desarrollo · **Estado:** Nuevo.

### DS-03 · Dropdown no operable por teclado `[C F]`
- **Componente:** Dropdown/Select · **Categoría:** Accesibilidad / Código · **Severidad:** Crítica
- **Problema:** el JS de referencia solo escucha `click`; `role="combobox"` está en el `div` contenedor y `aria-expanded` en el wrapper (atributo no permitido ahí).
- **Evidencia:** `dropdown-docs.js` (sin `keydown`); Playwright: Enter abre el panel pero el trigger sigue con `aria-expanded="false"`, ArrowDown deja el foco en el trigger, Escape no cierra; axe `aria-allowed-attr`, `aria-input-field-name`, `scrollable-region-focusable`.
- **Esperado:** patrón APG *combobox/listbox*: flechas, Enter/Espacio, Escape, Home/End, `aria-activedescendant` y estado expuesto.
- **Actual:** con teclado no se puede elegir una opción.
- **Impacto:** formularios con selects (ciudad, plan, documento) quedan bloqueados para usuarios de teclado y lector de pantalla.
- **Solución:** reimplementar con el patrón APG o con un `<select>` nativo estilizado; añadir estado visual de opción activa.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-04 · Tabs sin soporte de teclado `[C F]`
- **Componente:** Tabs · **Categoría:** Accesibilidad / Código · **Severidad:** Crítica
- **Problema:** roving tabindex sin flechas: las pestañas inactivas tienen `tabindex="-1"` y no hay manejador de teclas. En los ejemplos estáticos falta `role="tablist"` y `aria-controls` apunta a ids inexistentes.
- **Evidencia:** `tabs-docs.js:266-292`; Playwright: ArrowRight no cambia ni el foco ni la selección; axe `aria-required-parent` (16), `aria-valid-attr-value` (1).
- **Esperado:** patrón APG Tabs.
- **Actual:** solo se puede llegar con teclado a la pestaña activa.
- **Impacto:** el contenido de las demás pestañas es inaccesible sin ratón.
- **Solución:** flechas, Home/End, `tablist` y paneles con id.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-05 · Error de formulario no perceptible en Dark y HC `[C V]`
- **Componente:** Inputs, Dropdown · **Categoría:** Accesibilidad · **Severidad:** Alta
- **Problema:** `[data-theme='dark'] .mp-input-field{--mp-inp-border…}` y `.mp-input-helper{color}` tienen la misma especificidad que `.error` y van después; en HC el `error-icon` es blanco.
- **Evidencia:** `_inputs.scss` (bloques de tema); medición Dark: helper de error `#a4a4a4`, borde `#666`; HC: borde y texto blancos; `harness-3temas.png`.
- **Esperado:** el error se distingue sin leer el texto (borde y mensaje de error con contraste suficiente).
- **Actual:** el campo con error es idéntico a uno normal.
- **Impacto:** el usuario no ubica qué campo corregir (3.3.1, 1.4.1).
- **Solución:** subir la especificidad de `.error` o mover sus reglas al final de los bloques de tema; en HC, una señal no cromática.
- **Responsable:** Desarrollo (+UX/UI para la señal HC) · **Estado:** Nuevo.

### DS-06 · Indicadores de foco de bajo contraste o solo cromáticos `[C V F Fg]`
- **Componente:** Inputs, Dropdown (trigger y buscador), User-chip, Chips, Header (links y CTA), Breadcrumb, Bottom-sheet · **Categoría:** Accesibilidad · **Severidad:** Alta
- **Problema:** foco con `box-shadow` al 18–28 % de opacidad (≈1.2:1 sobre blanco) y borde de 1 px `#ff6600` (2.94:1); header: cambio de color con `outline:none`; CTA del header: mismo estilo que hover; breadcrumb: borde de 1 px; opción del bottom-sheet: fondo `#f8f7f7`; buscador del dropdown: `outline:none` sin reemplazo. En Figma, el foco del input usa `#ffe6d6` (1.2:1).
- **Evidencia:** `focus-light-inp-field.png`, `focus-light-bc-link.png`; `_header.scss`, `_bottom-sheet.scss:126-130`, `_dropdown.scss .mp-dropdown__search-input`; Figma 4527:13793.
- **Esperado:** indicador visible, ≥3:1 contra el fondo adyacente.
- **Actual:** foco difícil de ver o indistinguible del hover.
- **Impacto:** quien navega con teclado pierde la posición.
- **Solución:** patrón de foco único definido en Figma y en un token (ver DS-21).
- **Responsable:** UX/UI + Desarrollo · **Estado:** Nuevo.

### DS-07 · Contraste no textual < 3:1 `[C V Fg]`
- **Componente:** Inputs, Dropdown, Switch, Checkbox, Stepper · **Categoría:** Accesibilidad · **Severidad:** Alta
- **Problema:** los límites y estados de los controles usan grises claros y la marca.
- **Evidencia:** borde `#e0e0e0`/blanco 1.32 (Figma 4527:13660 `use/border/subtle`); switch apagado `#a4a4a4` 2.49; checkbox marcado `#ff6600` 2.94; barra pendiente del stepper `#ccc` 1.61.
- **Esperado:** ≥3:1 (1.4.11).
- **Actual:** por debajo del umbral.
- **Impacto:** con baja visión no se identifica dónde está el campo ni en qué estado está un control.
- **Solución:** decisión UX/UI de tokens de borde de control y de estado.
- **Responsable:** UX/UI → Desarrollo · **Estado:** Nuevo.

### DS-08 · Switch invisible en colores forzados `[V F]`
- **Componente:** Switch (también afecta al relleno de checkbox y radio) · **Categoría:** Accesibilidad · **Severidad:** Alta
- **Evidencia:** emulación `forcedColors:'active'`: track encendido y apagado `rgb(0,0,0)`, knob `rgb(0,0,0)`; `forced-colors.png`.
- **Esperado:** el control y su estado son visibles en Windows Alto Contraste.
- **Actual:** el switch desaparece.
- **Impacto:** las personas que usan colores forzados no pueden operar los switches.
- **Solución:** `@media (forced-colors: active)` con bordes `CanvasText` y estado `Highlight`.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-09 · Build desactualizado y regresión de foco en readonly (WIP) `[C V F]`
- **Componente:** Inputs / proceso de build · **Categoría:** Código / Accesibilidad · **Severidad:** Alta
- **Evidencia:** `git status` → `M core/components/web/_inputs.scss`; recompilar la fuente cambia 7 reglas `.mp-input-field` frente a `css/core.css` (15 may); con esas reglas, un campo readonly enfocado en Light no muestra outline, sombra ni cambio de borde (`focus-wip-light-inp-readonly.png`).
- **Esperado:** el CSS publicado refleja la fuente aprobada, y todo elemento enfocable muestra el foco.
- **Actual:** la publicación queda desfasada; si se compila tal cual, se introduce una falla de 2.4.7.
- **Impacto:** hay riesgo de publicar una regresión y de que QA revise algo distinto de lo publicado.
- **Solución:** sustituir `outline:none` por un indicador; build y diff como paso obligatorio de publicación.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-10 · Bootstrap compilado sin la configuración del DS `[C V]`
- **Componente:** arquitectura · **Categoría:** Código / Tokens · **Severidad:** Alta
- **Evidencia:** `core.scss` `@use '../node_modules/bootstrap/scss/bootstrap'` sin `with`; `css/core.css` contiene `--bs-primary:#0d6efd`, `--bs-border-radius:.375rem` y `--bs-link-color:#0d6efd` (luego parcheados con variables en `_bootstrap-overrides.scss`); el `.btn-primary` legacy muestra un borde `#0a58ca` al recibir foco (`focus-light-legacy-btn-primary.png`).
- **Esperado:** Bootstrap genera su CSS con los tokens del DS o se retira.
- **Actual:** dos sistemas de valores en conflicto; `core.css` pesa 411 KB.
- **Impacto:** fugas de azul de Bootstrap en clases no parcheadas; mayor peso y más especificidad.
- **Solución:** configurar Bootstrap con `with(...)` o reducirlo a grid/reboot.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-11 · Alias `--font-size-*` desplazados `[C V Fg]`
- **Componente:** Alerts, Toast, Tabs, Pagination, Tables, Badges · **Categoría:** Tokens / Fidelidad · **Severidad:** Alta
- **Evidencia:** `_theme.scss`: `--font-size-sm: $fs-body-s` (12) y `--font-size-md: $fs-body-m` (14). Los componentes usan `var(--font-size-md, 16px)` y `var(--font-size-sm, 14px)`. Computado: título de alerta 14 px/600, cuerpo 12 px; tab 14; paginación 14. Figma: alerta 16 Bold / 16 Regular (4585:19367), tab 16 SemiBold (4610:39457), paginación 16 Bold (4610:72479).
- **Esperado:** tamaños de Figma.
- **Actual:** texto uno o dos pasos más pequeño (cuerpo de alertas a 12 px).
- **Impacto:** legibilidad de mensajes críticos y pérdida de fidelidad visual.
- **Solución:** corregir los alias o usar los tokens Figma directamente.
- **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-12 · API legacy activa, divergente y sin tema `[C V]`
- **Componente:** `.btn*`, `.input/.select/.textarea`, `.field*`, `.check-wrap`, `.toggle`, `.btn-loading` · **Categoría:** Consistencia / Accesibilidad · **Severidad:** Alta
- **Evidencia:** `_buttons.scss:205-330`, `_inputs.scss:22-175`; `.btn-primary` blanco/`#ff9d5c` 2.05 (Dark) y blanco/`#ffff00` 1.07 (HC); peso 600; radio 8; placeholder 2.49; label en mayúsculas, bold y 0.08em; `.btn-loading{color:transparent}`; uso en la doc: 1 archivo (`border-radius.html`).
- **Esperado:** una sola API derivada de Figma.
- **Actual:** dos APIs con comportamiento distinto, y la legacy no tiene tema.
- **Impacto:** quien consume el sistema puede elegir la API incorrecta; problemas de contraste en Dark y HC.
- **Solución:** deprecación formal, tabla de migración, exclusión del build por defecto y retiro en v3.0.0.
- **Responsable:** Desarrollo + UX/UI · **Estado:** Confirmado.

### DS-13 · Pesos tipográficos distintos de Figma `[C V Fg]`
- **Componente:** tokens `--mp-*-weight`, mixins `ty-*`, `.mp-card__title` · **Categoría:** Fidelidad · **Severidad:** Media
- **Evidencia:** Figma 3916:20388: H4/H5/H6 700, Display L/M 700, Eyebrow 400 con 0.8 %, botón 700, label 400. Código: 500, 500, 500, 900, 900, Eyebrow 500 + uppercase + 0.1em, `ty-button` 500, `--mp-label-weight` 700.
- **Solución:** alinear tokens y mixins. **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-14 · Pesos 600 y 800 no cargados `[C V]`
- **Evidencia:** el import de Google Fonts trae 100/300/400/500/700/900; el código usa 600 (tabs, títulos de alert/toast, legacy) y 800 (header). El navegador sintetiza 700 y 900.
- **Esperado:** pesos reales (Figma usa SemiBold 600 en tabs).
- **Solución:** cargar 600 o ajustar a pesos disponibles. **Responsable:** Desarrollo (+UX/UI) · **Severidad:** Media · **Estado:** Nuevo.

### DS-15 · Estados del input distintos de Figma `[C Fg]`
- **Evidencia:** Figma 4527:13660/13793/13796/13799 frente a `_inputs.scss` (detalle en el documento 03 §4.2): helper `#111`→`#666`; error `#9e3328`/400 + icono → `#521a14`/500; borde de error `#db7165` → `#d14434` + halo; foco 4 px `#ffe6d6` + `#e63f0c` → 1 px `#ff6600` + halo 18 %; label disabled `#666` sin implementar; asterisco antes del label → después.
- **Solución:** taller de conciliación; corregir según la decisión (sin trasladar a CSS el foco de 1.2:1 de Figma, ver DS-06). **Responsable:** UX/UI + Desarrollo · **Severidad:** Media · **Estado:** Nuevo.

### DS-16 · Botones: diferencias e inconsistencias de Figma `[C Fg]`
- **Evidencia:** foco en Figma (4514:6414) con borde 2 px `#111` y gradiente `#db3c0b`→`#ff6600`, frente a outline de 3 px en código; disabled (4514:6417) con texto `#f5f5f5` frente a `#a4a4a4`; terciario (4514:6567) de 32 px frente a 48 px; gradiente con *via*; Figma pide iconos de 16/20 px pero usa 24, y su ficha dice 48 px con instancias de 44.
- **Solución:** decisión UX/UI y corrección del lado que corresponda. **Responsable:** UX/UI + Desarrollo · **Severidad:** Media · **Estado:** Nuevo.

### DS-17 · Selección y paginación: diferencias de Figma `[C Fg]`
- **Evidencia:** label del checkbox 16/1.5 en Figma (4541:39004) frente a 14 en código; relleno con la variable `use/text/link`; radio de paginación 12 (4610:72479) frente a 8; switch como imagen en Figma (4541:39635).
- **Severidad:** Media · **Responsable:** UX/UI + Desarrollo · **Estado:** Nuevo.

### DS-18 · Estado disabled acumulativo e inconsistente `[C V]`
- **Evidencia:** `_accessibility.scss:63-69` `[aria-disabled='true'],[disabled]{opacity:.5;pointer-events:none}`; botón disabled efectivo 1.24:1; opacidades de .65, .6, .5, .48, .45 y .38 según el componente; `--base-neutral-30/50` sin tema.
- **Impacto:** aunque 1.4.3 exime el estado disabled, el usuario no entiende qué está bloqueado ni recibe explicación (`pointer-events:none` impide tooltips).
- **Severidad:** Media · **Responsable:** Desarrollo (+UX/UI) · **Estado:** Confirmado (amplía A11Y-04).

### DS-19 · Disabled y readonly indistinguibles en Dark y HC `[C V]`
- **Evidencia:** los bloques `[data-theme] .mp-input-field` pisan fondo, color y borde; en lo publicado solo queda la opacidad de 0.65; `harness-3temas.png`.
- **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-20 · Defectos específicos de High Contrast `[C V F]`
- **Evidencia:** checkbox marcado dibujado como un bloque negro (`hc-checkbox-zoom.png`; regla HC `::after{background:#000}`); placeholder del dropdown `#666`/negro 3.65; hover del user-chip blanco/`#f8f7f7` 1.07 (la regla HC pierde especificidad frente a `button.mp-user-chip--is-hover`).
- **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-21 · Foco inconsistente entre componentes `[C Fg]`
- **Evidencia:** `outline` de 2 px (5 usos), 3 px (≥13), además de borde o `box-shadow`; offsets de −2/1/2/3/4; `:focus-visible` duplicado en `_reset.scss` y `_accessibility.scss`; el mixin `focus-ring` usa 2 px. Figma tampoco unifica el foco.
- **Solución:** token y patrón únicos (ver DS-06). **Severidad:** Media · **Responsable:** UX/UI + Desarrollo · **Estado:** Confirmado con corrección.

### DS-22 · Colores fuera de tokens `[C]`
- **Evidencia:** 312 hex en `components/` (236 dentro de fallbacks); los que más tienen: toasts 52, badges 39, alerts 37, bottom-sheet 33, avatar 24. Fuera de paleta: `#102c5e`, `#fcbf44`, `#4d4d4d`, `#e65300`, `#dddddd`, `#444444`, `#79747e`, `#f3f0fa`, `#5d4992`, `#775ebb`, y `#fff` en el hover del sidebar.
- **Impacto:** un cambio en Figma no se propaga; los temas se desalinean (causa de DS-02).
- **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-23 · Errores en el mapa de tokens `[C Fg]`
- **Evidencia:** `use/surface/theme/orange/60: var(--base-orange-40)`; `use/overlay/*: #000000` sin alfa; la clave `base/neutral/100 (Negro)` produce `--base-neutral-100-(negro)` (declaración inválida en el CSS compilado); `--use-state-info-body` inexistente (Figma usa el literal `#0b3954`); `--color-text-disabled` sin equivalente en Figma; `brand-90` (`#e63f0c`) más rojo que `brand-100` (`#cc5200`).
- **Severidad:** Media · **Responsable:** UX/UI (Figma) + Desarrollo · **Estado:** Nuevo (reclasifica TOK-01 y B-02).

### DS-24 · Radios fuera de sistema `[C Fg]`
- **Evidencia:** 26 radios literales; 12 px en alert, toast, modal y tabs; `var(--space-*)` como radio (9 usos, igual que Figma con `spacing/12px`); `rem(16px)` en el input.
- **Severidad:** Baja · **Responsable:** UX/UI + Desarrollo · **Estado:** Confirmado.

### DS-25 · Tabla con scroll no accesible `[F]`
- **Evidencia:** axe `scrollable-region-focusable`; contenedor sin `tabindex`, `role` ni `aria-label`, y sin `caption`.
- **Solución:** `tabindex="0"`, `role="region"`, `aria-label`, `caption`. **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-26 · Stepper: paso actual indistinguible `[C F]`
- **Evidencia:** `--mp-stepper-done` y `--mp-stepper-current` son el mismo color; axe `aria-progressbar-name` (3).
- **Severidad:** Media · **Responsable:** UX/UI + Desarrollo · **Estado:** Nuevo.

### DS-27 · Semántica de formularios en los ejemplos `[F]`
- **Evidencia:** axe `label` (5 inputs sin label en `#inputs`); asterisco con `aria-hidden` sin `required`/`aria-required`; `aria-describedby` solo en el playground; un switch sin `role="switch"` en `#seleccion`.
- **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Confirmado.

### DS-28 · Modal: comportamiento solo en la documentación `[C F]`
- **Evidencia:** `modal-docs.js:195-250` (verificado: trampa 6/6, ESC, retorno); no existe un JS reutilizable en `core/`; overlay `rgba(17,17,17,.30)` hardcodeado; icono success blanco/`#95bf1b` 2.15.
- **Severidad:** Media · **Responsable:** Desarrollo · **Estado:** Parcialmente corregido.

### DS-29 · Movimiento reducido anula el fallback de Loading `[C F]`
- **Evidencia:** emulación `reducedMotion:'reduce'` → `animation-duration: 1e-05s`, `iteration 1`. El `2.4s` del componente pierde frente al `!important` global.
- **Severidad:** Baja · **Responsable:** Desarrollo · **Estado:** Nuevo.

### DS-30 · Portal de documentación `[V F]`
- **Evidencia:** a 320 px el sidebar fijo (256 px) recorta el contenido y el selector de tema se superpone (`reflow-320-header.png`); los code-tabs llevan `aria-selected` sin `role` (axe `aria-allowed-attr`); algunos bloques Do/Don't tienen superficies fijas en Dark/HC; `docs/qa/checklist.html` es genérico y menciona variantes que no existen (ghost, danger).
- **Severidad:** Media · **Responsable:** Desarrollo + UX/UI · **Estado:** Nuevo.

### DS-31 · Componentes sin tablero Figma localizado `[Fg P]`
- Header web, Sidebar, Stepper, Avatar/User-chip, Bottom-sheet y Dropdown app. Revisar «3.3 Navigation patterns» (4705:5362). **Severidad:** Baja · **Responsable:** UX/UI · **Estado:** Pendiente.

### DS-32 · Enlaces sin indicador no cromático `[C V]`
- `_reset.scss` `a{text-decoration:none}` (solo subraya en hover). **Severidad:** Media · **Responsable:** Desarrollo + UX/UI · **Estado:** Confirmado.

### DS-33 · Escalas de z-index desconectadas `[C P]`
- `--z-toast: 600` frente a `$zindex-modal: 1050`/1055 de Bootstrap. **Severidad:** Baja · **Estado:** Nuevo (sin prueba funcional).

### DS-34 · Paleta sin mapa de uso `[C]`
- Familias teal, violet, green-2 y cyan-blue con 10–11 escalones, y `use/tables/Head` sin uso en el tablero de Tables. **Severidad:** Baja · **Estado:** Confirmado.

### DS-35 · `list-style:none` global `[C P]`
- Puede eliminar la semántica de lista en Safari y VoiceOver. **Severidad:** Baja · **Estado:** Pendiente.

### DS-36 · Duplicaciones `[C]`
- `web/_dropdown.scss` y `app/_dropdown.scss`; bloques Dark y HC del modal idénticos a Light. **Severidad:** Baja · **Estado:** Nuevo.

### DS-37 · Header móvil sin búsqueda ni CTA `[C P]`
- `display:none` por debajo de 768 px; falta verificar el drawer. **Severidad:** Baja · **Estado:** Pendiente.

### DS-38 · Accordion con `max-height` fijo `[C P]`
- `max-height: 2000px` y radio de 24 px sin contrastar con Figma. **Severidad:** Baja · **Estado:** Pendiente.

---

## 7. Evidencias

| Archivo | Contenido |
|---|---|
| `evidencias/harness-3temas.png` | Buttons, inputs, selección y alertas en Light, Dark y HC (CSS publicado) |
| `evidencias/hc-checkbox-zoom.png` | Check de HC dibujado como bloque |
| `evidencias/forced-colors.png` | Switch invisible con colores forzados |
| `evidencias/focus-*.png` | Recortes del foco por componente y tema (incluido el WIP de readonly) |
| `evidencias/docs-badges-dark.png` | Página de badges del portal en Dark |
| `evidencias/reflow-320-header.png` | Portal a 320 px |
| `evidencias/figma-2.1-buttons-4498-2274.png`, `figma-2.2-inputs-4517-7746.png` | Tableros Figma de referencia (render MCP) |
| `evidencias/medicion-computada-3-temas.json` | Estilos computados y contraste de ≈60 elementos × 3 temas |
| `evidencias/axe-resumen-por-pagina.json` | Violaciones axe por página y tema |
| `evidencias/audit-harness.html`, `evidencias/scripts/*.js` | Harness y scripts Playwright para repetir las pruebas (las rutas absolutas del entorno de auditoría deben ajustarse) |

## 8. Limitaciones

1. **Independencia de la Etapa A:** las auditorías previas venían adjuntas desde el inicio. Se mitigó volviendo a verificar cada conclusión.
2. **Sin tecnologías asistivas reales:** no se probó con NVDA, JAWS, VoiceOver ni TalkBack.
3. **Solo Chromium:** no se probó en Safari ni Firefox. Chromium vuelve enfocables los contenedores con scroll, lo que puede ocultar parte de DS-25.
4. **Fuentes:** Roboto se sirvió desde un paquete local con los mismos pesos que el import de producción; puede haber diferencias mínimas de métricas.
5. **Figma por MCP:** `get_variable_defs` es ambiguo cuando un tablero mezcla modos. El switch es una imagen. No se pudieron descargar PNG de nodos individuales; se usaron renders del MCP de los tableros 2.1 y 2.2 y el código generado por instancia.
6. **Sitio publicado:** por indicación, todo se auditó sobre la copia local; no se comparó con la versión en Azure.
7. **Cambios sin commit:** se auditó el CSS publicado y, aparte, el efecto del WIP en `_inputs.scss` (DS-09).
8. **Zoom al 200 % y text-spacing:** solo se probó reflow a 320 px.
9. **Prototipos y carpeta `nara/`:** fuera de alcance.
