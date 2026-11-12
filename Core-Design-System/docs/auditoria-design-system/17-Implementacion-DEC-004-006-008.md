# 17 — Implementación del lote DEC-004 · DEC-006 · DEC-008

> **Actualización (9 nov 2026):** Figma aprobó después los valores de DEC-004/006/008. Radio de paginación (12 → 16 px), Switch 52×44, etiquetas de Radio/Switch y la parte pendiente de §5 pasan a estar tratados en `25-Implementacion-DEC-004-006-008-Figma-aprobado.md`, que prevalece sobre este informe.

> 9 de noviembre de 2026 · base `6ea295b` (v2.2.1 + DEC-007) · Chromium, tamaño de texto real del navegador. Sin commit, tag, push ni despliegue. Evidencias: `evidencias/dec004-006-008/`.
> **Criterio del lote:** se implementó solo lo que está definido y aprobado (valores que Figma ya publica, defectos objetivos de WCAG y referencias de tokens inválidas). Todo lo que exige una decisión visual nueva se registra en §5 sin improvisar.

## 1. DEC-006 — Dark y High Contrast (DS-02, DS-08, DS-20)

**Causa raíz de DS-02, encontrada y medida.** Figma define los valores Dark y High Contrast de cada token (`tokens/compensar.tokens.json`) y el portal los inyecta en ejecución (`applyThemeTokenMode`), pero `core/base/_theme.scss` solo traía el modo Light para la mayoría. Quien consume solo `css/core.css` veía Dark/HC con colores de Light. Midiendo cada token con su cadena de alias resuelta por modo:

| Modo | Tokens que difieren de Figma (de 216) — antes | después |
|---|---|---|
| Light | 0 | 0 |
| Dark | 55 | **12** |
| High Contrast | 60 | **14** |

**Qué se hizo**
- `scripts/sync-theme-modes.mjs` (nuevo, idempotente, `--check`): escribe entre marcadores los valores Dark/HC que faltan (42 y 46 tokens). No pisa lo que el SCSS ya declara.
- **Exclusiones deliberadas** (los 12 y 14 restantes): `use/border/*` (DEC-002), `use/focus/*` (DEC-004), `use/primary/*` (DEC-001), y 8 tokens que `_theme.scss` declara a propósito con otro valor (incluidos `surface/surface` y `border/*`, donde DEC-003 y DEC-002 ya fijaron el criterio).
- Texto sobre la marca: avatar de marca y pestaña activa usaban blanco sobre `#ff9d5c` (Dark, **2,05:1**) y sobre amarillo (HC, **1,07:1**). Ahora usan `use/text/inverse` (Figma: `#111` en Dark, negro en HC), el mismo token que ya aplican el botón y las pestañas en HC. Light no cambia.
- **DS-08 ampliado:** bajo `forced-colors` seis de siete pares de estado eran indistinguibles, no solo el switch. Se añadió `@media (forced-colors: active)` con colores de sistema (`Highlight`, `CanvasText`, `GrayText`) para switch, radio, chip seleccionado, paginación activa y stepper (hecho / actual / pendiente, con la forma —no solo el color— distinguiendo "actual").
- **DS-20:** el tilde del checkbox en HC se rellenaba como un bloque negro (`::after` con `background`); se quitó el fondo del checkbox y se conservó en el radio.

| Medición (arnés con solo `core.css`) | Antes | Después |
|---|---|---|
| Contraste insuficiente, Dark (nodos) | 16 | 10 |
| Contraste insuficiente, High Contrast | 5 | **0** |
| `forced-colors`: pares de estado distinguibles | 2 de 10 | **10 de 10** (3 temas) |
| axe en las 84 rutas del portal — Light / Dark / HC | 2094 / 1609 / 628 | 2088 / 1594 / 622 (**0 rutas empeoran**) |

## 2. DEC-004 — Foco transversal

No existe un patrón de foco transversal definido en Figma, y la decisión manda alinear el código con lo "finalmente documentado" allí. Se separó lo objetivo de lo que es decisión visual.
- **Objetivo, corregido (DS-06):** en el Header, el enlace utilitario, el de navegación y el del dropdown compartían regla con el hover y el foco solo cambiaba el color del texto (indicador solo cromático, 2.4.7/1.4.1). Se añadió un contorno con el token `--use-focus-outline`; el hover no cambia.
- **Medido, ya correcto:** 17 controles × 3 temas = **51 combinaciones** cambian visualmente al recibir foco por teclado (0 sin indicador).
- **Medido, depende del color de marca:** el indicador queda en **2,94:1** (bajo 3:1) en 13 de 51 combinaciones, **todas en Light y todas por el mismo `#ff6600`**; en Dark y HC cumplen. Es el naranja corporativo (DS-01/DEC-001): no se cambia sin aprobación.
- Ancho y offset del contorno del Header son **provisionales**; la unificación de anchos (2/3 px) y offsets (−2/1/2/3/4) queda a la espera del patrón de Figma.

## 3. DEC-008 — Tokens, radios, iconos y dimensiones

Aplicado donde Figma es inequívoco (nodos consultados con `get_variable_defs`):
- **Etiqueta del checkbox:** 14 → **16 px** (Paragraph L, nodo `4541:39004`), acotada a `.mp-checkbox` para no imponerla a Radio ni Switch (su etiqueta no se pudo confirmar en Figma).
- **Radio de la paginación:** 8 → **12 px** (`spacing/12px`, nodo `4610:72479`).
- **DS-23:** `--base-neutral-100-(negro)` era un identificador CSS inválido (la clave de Figma lleva paréntesis); `token-custom-property-name` ahora los omite y genera `--base-neutral-100-negro`, valor idéntico (`#111111`).

| Medición | Antes | Después |
|---|---|---|
| Checkbox (100 % / 200 % / 320 px) | 14 px · 28 px · alto 52 px | 16 px · 32 px · alto 82 px (el texto largo ocupa más líneas); **sin desborde** en ningún caso |
| Radio de la paginación | 8 px (16 px a 200 %) | 12 px (24 px a 200 %) |
| Radio y Switch | — | **sin cambios** (comprobado por CSS y por geometría) |

## 4. Pruebas de no regresión

| Prueba | Resultado |
|---|---|
| Portal pixel a pixel, 3 temas | Toda diferencia explicada por estilo computado: etiqueta del checkbox, radio de la paginación y color de la pestaña activa en Dark/HC. Dos diferencias de píxeles (stepper en Light, alertas en HC) tienen estilos computados idénticos: ruido de recorte |
| Dropdown reutilizable (DEC-007) × 3 temas × 100/200 % × 1280/320 px | **117/117** en las 4 combinaciones |
| Tabs reutilizable (DEC-007) | **63/63** en las 4 combinaciones |
| DEC-003 responsive (320/375 px × 100/150/200 % × 3 temas) | **18/18** |
| Portal real Web y App, teclado, 3 temas · 320 px y texto 200 % | **0 fallos** |
| Barrido de 84 rutas | 0 errores JS, 0 desbordes, 0 listas de pestañas sin parada de Tab |
| Build | sin errores ni advertencias, **reproducible**, 0 `rem(` sin resolver |
| Reglas de CSS que cambian | 25, solo en los componentes listados; **0 en botón primario, inputs, Bootstrap, vendors, `portal.css`**; `letter-spacing` sin tocar |

Nota de método: una medición de geometría aislada marcó una vez «Radio/Switch cambian»; se repitió 3 veces y se confirmó por diff de CSS que ninguna regla de tamaño o tipografía de Radio/Switch cambió (era variación de la medición).

## 5. Decisiones visuales pendientes (no implementadas)

| # | Tema | Por qué no se tocó | Qué se necesita |
|---|---|---|---|
| 1 | **Badges Dark** naranja (2,48:1), violeta (4,0:1), warning (4,06), success (4,34); alertas y toasts warning/success Dark (4,06–4,43) | Son los colores que **Figma mismo define** en Dark; las razones no llegan a 4,5:1 | Nuevos valores Dark en Figma (DEC-006 §1). No se eligen colores en código |
| 2 | **Patrón de foco único** (ancho, offset, color) | Figma no lo unifica; el naranja `#ff6600` da 2,94:1 en Light | Definir el patrón y, si procede, escalar el ajuste del naranja de marca (DEC-001) |
| 3 | **`radius/12`** | Hay 10 usos de 12 px en 6 componentes, coherentes con Figma (`spacing/12px`), pero crear el token modifica el sistema de tokens de Figma | Aprobación para formalizar `radius/12` en Figma y código |
| 4 | **`--use-state-info-body`** | No existe en Figma (usa el literal `#0b3954`); el fallback ya reproduce Figma | Decidir si se crea la variable |
| 5 | **Tamaño de iconos (16/20/24) y alturas de botón (32/44/48)**, terciario 32 vs 48, disabled del botón, foco del botón | Figma se contradice a sí mismo (ficha 48 vs instancias 44); además toca el botón primario protegido por DEC-001 | Decisión de UX/UI por variante, plataforma y estado |
| 6 | **Etiquetas de Radio y Switch** (¿16 px?) | El nodo oficial no se pudo confirmar | Confirmar en Figma antes de extender el 16 px |
| 7 | **`use/surface/theme/*` y `base/*` Dark/HC** sin verificación visual en vivo | Las herramientas de Figma solo devolvieron el modo del archivo (Light); el respaldo es el export, que sí coincidió en vivo en los tokens contrastables | Revisión de UX de las superficies Dark/HC sincronizadas |

Otros pendientes vigentes: lectores de pantalla, Firefox/Safari, ficha de teclado en Figma (DEC-007). Los 8 tokens declarados con otro valor y los grupos excluidos siguen sin sincronizar a propósito.

## 6. Versión
Cambios aditivos y correcciones de accesibilidad; no rompen API. Con DEC-007 (dos JS nuevos) la propuesta sigue siendo **`v2.3.0`**. Sin tag ni publicación.
