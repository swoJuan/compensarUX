# 25 — Implementación DEC-004 · DEC-006 · DEC-008 con los valores aprobados en Figma

> 9 de noviembre de 2026 · base: árbol de trabajo posterior al informe 17 (sin commit). Chromium (Chrome for Testing 1254), tamaño de texto real del navegador. Sin commit, tag, push ni despliegue. Evidencias: `evidencias/dec004-006-008-b/`.
> Este informe **sustituye** los valores del informe 17 que Figma cambió después: radio de paginación 12 px → **16 px** (`border-radius/sm`), Switch 52×40 → **52×44** y etiquetas de Radio/Switch a **16/24**.
> Los documentos de handoff 18–24 no están en el repositorio. Los valores salen del prompt maestro y se contrastaron en solo lectura con Figma (`get_variable_defs`, archivo `1zVGMpzqBgiBUqhmfFEAoT`).

## 1. A1 · DEC-006 — colores, Badge/Chip, Alert, Toast

| Tema | Cambio |
|---|---|
| Tokens nuevos | `use/text/badge/orange`, `green-3`, `error` en `_tokens-colors.scss`, en las tres copias de datos (`tokens/compensar.tokens.json`, `js/tokens.js`, `js/ds-bundle.js`) y en sus listas de documentación. Dark/HC como alias, sin HEX. |
| Valores aprobados | `warning/bg` Dark `#634A1A`, `success/bg` Dark `#166936`, `warning/icon bg` Light `#967229`. `use/text/theme/green-2` (`#6A8E11`) y `use/text/theme/red` (`#BB4945`) **no se tocaron**. |
| Badge/Chip | Naranja, Green 3 y Error usan sus variables propias; Badge violeta y Chip normal usan `use/text/primary`; Chip activo violeta: texto `use/text/inverse` sobre `use/text/theme/violet` (excepción documentada, sin renombrar). |
| Alert/Toast | El cuerpo Info usa `use/state/info/text` (se retiró `#0b3954`). Se retiraron los hex fijos de Dark/HC (Success Dark `#0B853D`, Warning Dark `#967229`): ahora salen de los tokens de estado. Iconos Warning (`use/state/warning/icon bg`) y Error (`use/state/error/icon`) enlazados como en Figma. |
| Alert Icon (modal) | Figma lo enlaza a `use/text/theme/yellow`, no al token que cambió. El modal usa `base/yellow/70` (mismos valores que antes) y el símbolo usa `use/state/warning/icon color`. |

**Correcciones de `_theme.scss` encontradas al medir** (literales Sass que capturaban el valor Light de un token `base/*` con valor distinto por modo): `border/strong` Dark `#B8B8B8` → `#E0E0E0` (Figma; necesario para DEC-004), `warning/border` Dark/HC → `base/yellow/70` del modo, `warning/bg` HC negro → `#634A1A` (Figma), `info/bg` HC → `#102C5E`.

## 2. A2 · DEC-004 — Focus (`use/border/strong`)

| Control | Antes | Ahora |
|---|---|---|
| Checkbox, Radio | 3 px `use/focus/outline` (naranja) | 3 px `use/border/strong` |
| Switch (On/Off) | 3 px naranja | 3 px `use/border/strong`; el disabled no recibe foco |
| Opción de Dropdown | 2 px interior naranja; en HC fondo amarillo y contorno negro | 2 px interior `use/border/strong`; en HC fondo negro, texto blanco, contorno blanco (Figma `4542:40506`) |
| Tabs | 2 px naranja, offset 4 px | 3 px exterior `use/border/strong`, offset 0, alrededor de la superficie de 35 px (Figma `5990:6`) |

Buttons, Input y trigger del Dropdown quedan **idénticos** a la base (comparación de estilo computado en los tres temas).

## 3. A3 · DEC-008 — dimensiones

| Control | Resultado medido en el DOM |
|---|---|
| Botones | Ya medían 48 px (203/203 en Figma; `min-height: 48px` en código). Se aplicó icono `1.5rem` y **Terciario solo icono 48×48** (antes 56×48). |
| Paginación | Radio 16 px con `--border-radius-sm` en vínculo, activa, puntos suspensivos y deshabilitada. |
| Switch | Área 52×44, track 52×32 centrado (6 px arriba y abajo), knob 28×28; los clics en las franjas fuera del track activan el control. |
| Tabs | Área 52×44 mínima (el ancho crece con el texto), superficie visible de 35 px dibujada por `::before` con `pointer-events: none`; los clics en las franjas de 4,5 px sobre y bajo la superficie seleccionan el tab. |
| Etiquetas | Checkbox, Radio y Switch a 16 px / 24 px. |

## 4. Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `npm run build` | Sin errores ni advertencias; 2 corridas idénticas; 0 `rem(` sin resolver; `portal.css` sin cambios |
| `sync-theme-modes.mjs --check` | Sin cambios pendientes |
| DEC-006 (`dec006.js`): tokens, Badge/Chip, Alert, Toast, modal × 3 temas × con/sin inyección de tokens | **314/314**. Contraste de texto ≥ 4,5:1 y de iconos ≥ 3:1 en todas las variantes |
| DEC-004 (`dec004.js`): foco por teclado real | **105/105**. Contraste del indicador de la opción de Dropdown: 5,37 (Light), 9,18 (Dark), 21 (HC) |
| DEC-008 (`dec008.js`): 100/200 % × 1280/375/320 px × 3 temas, con eventos reales | **1083/1083**. Control negativo: contra el CSS base falla en 396 comprobaciones, en los puntos esperados |
| DEC-007 existentes: Dropdown / Tabs, 4 combinaciones texto × ancho | **117/117** y **63/63** (se actualizó un chequeo de `tabs.js` para leer el contorno de `::before`) |
| Portal real, 84 rutas × 1280/375 px, base vs nuevo | 0 errores JS nuevos, 0 desbordes nuevos, 0 peticiones fallidas nuevas |
| Portal real con inyección de tokens | Badges Light/Dark, Alert Dark/HC, Switch, paginación y Tabs coinciden con lo aprobado |
| `forced-colors` | El foco del tab, del switch y del checkbox sigue distinguiéndose |
| Reglas de `core.css` que cambian | 70, solo en alert, badge, btn (2), checkbox, chip, choice, dropdown, modal, pagination, switch, tab, toast y 3 de tokens/tema. 0 en botón primario/secundario/especial, Input, Bootstrap, vendors |

## 5. Pendientes de cierre y riesgos

**No ejecutado:** Firefox, Safari, lectores de pantalla y `forced-colors` en Windows real.

**Pendiente explícito · Checkbox indeterminado:** el SCSS no tiene estilo para `:indeterminate` ni para el estado equivalente de Figma. El foco ya aplica a ese estado (`.mp-choice__input:focus-visible + .mp-choice__control`), pero falta el trazo y el relleno propios. Se necesita el diseño aprobado en Figma antes de implementarlo.

**Hallazgo conservado · Dropdown Dark:** en Figma el hover y el foco de la opción usan `use/surface/theme/orange/20` (Dark `#FFB380`). El trazo `use/border/strong` Dark (`#E0E0E0`) sobre ese fondo da ≈1,4:1 y no cumple 1.4.11. El HTML mantiene su fondo gris y mide 9,18:1, así que el incumplimiento está en la decisión de Figma y requiere revisión de UX. El HTML tampoco reproduce el fondo naranja de hover de Figma en Light ni en Dark.

**Hallazgo conservado · Badges en High Contrast:** el HTML muestra todos los badges, chips y tags con fondo negro, texto blanco y borde blanco (21:1). Figma usa fondos de estado en algunos. No se cambió; por eso los tokens `use/text/badge/*` no llegan a verse en HC.

**Deuda documental DEC-011:** (a) el export de CSS de `js/modal-docs.js` ya divergía de `_modals.scss`; (b) `alert-docs.js` y `toast-docs.js` muestran el cuerpo en 14 px; (c) `portal/pages/_alerts.scss` fija colores de Dark/HC en las demos, que no son el componente.

**Contrastes protegidos sin cambios:** botón primario (DEC-001) y borde normal de Input (DEC-002).

**Versión:** `v2.3.0` sigue siendo una propuesta. No se creó tag ni se declara estable.
