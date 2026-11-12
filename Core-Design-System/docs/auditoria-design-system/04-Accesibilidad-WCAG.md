# 04 — Accesibilidad WCAG 2.2 AA

**Alcance:** componentes de `core/` renderizados con `css/core.css` publicado (y, donde se indica, con los cambios sin commit), en Light, Dark y High Contrast, más la emulación de `forced-colors` y `prefers-reduced-motion`.
**Herramientas:** Chromium (Playwright), axe-core 4.10.2 (etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) sobre las 20 páginas de componentes del portal local, un harness propio (`evidencias/audit-harness.html`) y cálculo de contraste con la fórmula WCAG sobre los colores **computados**, con composición de opacidad y fondos.

> **No se declara conformidad WCAG.** Las pruebas automáticas y de teclado no sustituyen a lectores de pantalla reales ni a usuarios con discapacidad. Se distinguen hallazgos **verificados** de **pendientes**.

## 1. Tabla de contraste verificado (texto)

Umbral 4.5:1. El texto de botón (16 px Bold = 12 pt) **no** cuenta como texto grande.

| Elemento | Tema | Texto / fondo | Ratio | Resultado | Hallazgo |
|---|---|---|---|---|---|
| Botón primario (parte alta del gradiente) | Light | `#fff` / `#ff6600` | 2.94 | Falla | DS-01 |
| Botón primario (parte baja) | Light | `#fff` / `#e63f0c` | 4.13 | Falla | DS-01 |
| Botón secundario / terciario, enlace, paginación | Light | `#ff6600` / `#fff` | 2.94 | Falla | DS-01 |
| Tab activo | Light / Dark | `#fff` / `#ff6600` · `#fff` / `#ff9d5c` | 2.94 · 2.05 | Falla | DS-01, DS-02 |
| Chip seleccionado, avatar brand | Light | `#fff` / `#ff6600` | 2.94 | Falla | DS-01 |
| Opción seleccionada del dropdown | Light | `#ff6600` / tinte 8 % | ≤2.94 | Falla | DS-01 |
| Badge verde | Light / Dark | `#6a8e11` / `#ecf7c9` · `#ecf7c9` / `#ecf7c9` | 3.41 · **1.00** | Falla | DS-02 |
| Badge naranja | Dark | `#e0e0e0` / `#fff2e3` · `#e0e0e0` / `#cc7a33` (doc) | 1.20 · 2.48 | Falla | DS-02 |
| Badge violeta | Dark | `#a28dda` / `#efecf9` | 2.45 | Falla | DS-02 |
| Badge error | Light | `#bb4945` / `#f7eeed` | 4.43 | Falla | DS-02 (origen paleta) |
| Badge / alert / toast warning | Dark | `#f5f5f5` / `#967229` | 4.06–4.43 | Falla | DS-02 |
| Badge / toast success | Dark | `#f5f5f5` / `#0b853d` | 4.34 | Falla | DS-02 |
| Hover de user-chip | Dark / HC | `#f5f5f5` / `#f8f7f7` · `#fff` / `#f8f7f7` | 1.02 · 1.07 | Falla | DS-02, DS-20 |
| Botón legacy `.btn-primary` | Dark / HC | `#fff` / `#ff9d5c` · `#fff` / `#ffff00` | 2.05 · 1.07 | Falla | DS-12 |
| Placeholder legacy `.input` | Light | `#a4a4a4` / `#fff` | 2.49 | Falla | DS-12 |
| Placeholder del dropdown | HC | `#666` / `#000` | 3.65 | Falla | DS-20 |
| Helper de input y dropdown sobre superficie `#4d4746` | Dark | `#a4a4a4` / `#4d4746` | 3.65 | Falla | DS-05 |
| Input disabled (publicado) | Light | `#666` / `#d9d5d5` a opacidad 0.65 | 2.28 | Exento (1.4.3), barrera de uso | DS-18 |
| Botón disabled | todos | `#a4a4a4` / `#ccc` a opacidad 0.5 | 1.24 | Exento, barrera de uso | DS-18 |
| Texto de inputs, labels, helpers por defecto | Light | `#111` y `#666` / `#fff` | 18.88 · 5.74 | Cumple | — |
| Alert y toast (texto) | Light | estados sobre sus fondos | 8.02–17.04 | Cumple | — |
| Botón primario | Dark / HC | `#111` / `#ff9d5c` · `#000` / `#ff0` | 9.2 · 19.56 | Cumple | — |

**Corrección de las auditorías previas:** `#e63f0c` da **4.13:1** y `#cc5200` **4.40:1** con texto blanco; **ninguno** cumple 4.5:1. Las recomendaciones de 09.09 (A11Y-01 «opción A», A11Y-02) y de 09.10 (A-01, A-02) que los proponían como solución accesible son incorrectas. Opciones que sí cumplen: texto `#111` sobre `#ff6600` (6.43:1), o un naranja de acción más oscuro como `#c25100` (4.70:1), `#bf4f00` (4.85:1) o `#b84c00` (5.16:1). La elección es una decisión de marca, que corresponde a UX/UI.

## 2. Contraste de componentes no textuales (1.4.11, umbral 3:1)

| Elemento | Color / fondo | Ratio | Resultado |
|---|---|---|---|
| Borde de input y trigger de dropdown (`use/border/subtle`) | `#e0e0e0` / `#fff` | 1.32 | Falla — origen Figma |
| Borde de input legacy y modal (`use/border/default`) | `#ccc` / `#fff` | 1.61 | Falla si es el único límite del control |
| Track del switch apagado | `#a4a4a4` / `#fff` | 2.49 | Falla |
| Checkbox marcado (relleno) | `#ff6600` / `#fff` | 2.94 | Falla (muy cerca del umbral) |
| Check blanco sobre relleno Dark | `#fff` / `#ff9d5c` | 2.05 | Falla |
| Barra pendiente del stepper | `#ccc` / `#fff` | 1.61 | Falla |
| Spinner de loading | `#ff6600` / `#fff` | 2.94 | Falla |
| Icono del modal success | `#fff` / `#95bf1b` | 2.15 | Falla si el icono comunica estado |
| Checkbox sin marcar (borde `#111`) | `#111` / `#fff` | 18.88 | Cumple |

## 3. Incumplimientos por criterio

| Criterio WCAG 2.2 | Nivel | Hallazgos | Evidencia | Verificación |
|---|---|---|---|---|
| 1.3.1 Información y relaciones | A | DS-04 (tabs sin `tablist` en los ejemplos), DS-27 (labels ausentes, `required` solo visual), DS-25 (tabla sin `caption`) | axe `aria-required-parent` 16 nodos, `label` 5 nodos | F |
| 1.4.1 Uso del color | A | DS-32 (enlaces solo por color), DS-26 (paso actual = completado), DS-05 (error en Dark/HC) | `_reset.scss`, `_stepper.scss`, capturas | C V |
| 1.4.3 Contraste mínimo | AA | DS-01, DS-02, DS-05, DS-12, DS-20 | §1 | C V F |
| 1.4.10 Reflow | AA | DS-30 (portal a 320 px) | `reflow-320-header.png` | V |
| 1.4.11 Contraste no textual | AA | DS-07, DS-06 (indicadores de foco) | §2 | C V |
| 2.1.1 Teclado | A | DS-03 (opciones del dropdown inalcanzables), DS-04 (tabs con `tabindex=-1` sin flechas), DS-25 (scroll de tabla) | Playwright: ArrowRight/ArrowDown/Escape sin efecto | F |
| 2.4.3 Orden del foco | A | DS-28 cumple en el JS de la documentación (trampa y retorno verificados) | Playwright `#modales` | F |
| 2.4.7 Foco visible | AA | DS-09 (readonly sin indicador en WIP), DS-06 (header CTA: foco igual a hover; links solo color; opción del bottom-sheet; buscador del dropdown) | `focus-wip-light-inp-readonly.png` | C V F |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | Cumple en los componentes medidos (cierre de toast 24×24 = mínimo exacto). Figma define el terciario a 32 px de alto (≥24 px, cumple AA pero contradice su regla interna de 44 px) | medición | C Fg |
| 3.3.1 Identificación de errores | A | DS-05 (error no perceptible visualmente en Dark/HC), DS-27 (falta `aria-describedby`/`aria-invalid` en ejemplos) | captura, axe | C V F |
| 4.1.2 Nombre, función, valor | A | DS-03 (`aria-expanded` no se actualiza; combobox inválido), DS-04 (`aria-controls` inválido), DS-26 (progressbar sin nombre), DS-12 (`.btn-loading` sin texto), DS-30 (`aria-selected` en botones sin rol) | axe `aria-allowed-attr` 24, `aria-progressbar-name` 3, `aria-valid-attr-value` 1 | F |

Criterios relacionados con modos del sistema (no son AA estrictos, pero son requisito del propio sistema):

- **Colores forzados (Windows Alto Contraste):** el switch desaparece (DS-08). El checkbox y los botones se mantienen legibles.
- **`prefers-reduced-motion`:** cumple 2.3.3 (AAA) de hecho, porque las animaciones se detienen. Pero el *fallback* propio de Loading nunca se aplica (DS-29).

## 4. Resultados de teclado (verificado funcionalmente)

| Componente | Prueba | Resultado |
|---|---|---|
| Buttons, checkbox, radio, switch, accordion, links | Tab / Shift+Tab / Space / Enter | Funcionan; indicador visible (variable según DS-21) |
| Modal (demo de la documentación) | Abrir con Enter → 6 × Tab → Escape | Foco inicial dentro, foco atrapado 6/6, Escape cierra, el foco vuelve a «Ver demo» |
| Tabs | Foco en la primera pestaña → ArrowRight | Sin cambio; las pestañas con `tabindex=-1` no se alcanzan con Tab |
| Dropdown | Enter → ArrowDown → Escape | Enter abre (el panel pasa a `display:block`) pero `aria-expanded="false"`; ArrowDown se queda en el trigger; Escape no cierra |
| Accordion | Estado de los paneles cerrados | `aria-expanded` correcto; sin elementos enfocables dentro de paneles cerrados |
| Tables | Contenedor con scroll | Sin `tabindex`, `role` ni `aria-label` (axe `scrollable-region-focusable`) |
| Inputs readonly (WIP) | Tab hacia el campo | Recibe foco sin ningún cambio visual en Light |

## 5. Resultados de axe-core (20 páginas × 3 temas, con el selector de tema real del portal)

| Regla | Nodos `mp-*` afectados (Light / Dark / HC) | Hallazgo |
|---|---|---|
| `color-contrast` | 128 / 138 / 23 (incluye algunos nodos sobre superficies del portal) | DS-01, DS-02, DS-20, DS-30 |
| `aria-allowed-attr` | 24 por tema | DS-30 (code-tabs), DS-03 (`aria-expanded` en `div`) |
| `aria-required-parent` | 16 por tema | DS-04 |
| `label` | 5 por tema | DS-27 |
| `aria-progressbar-name` | 3 por tema | DS-26 |
| `scrollable-region-focusable` | 2 por tema | DS-25, DS-03 |
| `aria-valid-attr-value`, `aria-input-field-name` | 1 por tema | DS-04, DS-03 |

Los datos completos están en `evidencias/axe-resumen-por-pagina.json`.

## 6. Verificaciones pendientes

| Pendiente | Motivo | Cómo cerrarlo |
|---|---|---|
| Lectores de pantalla (NVDA, JAWS, VoiceOver, TalkBack) | No hay tecnología asistiva disponible en el entorno | Prueba manual de tabs, dropdown, modal, toast y formularios con al menos NVDA + Chrome y VoiceOver + Safari |
| Anuncio de toast y alert (`aria-live`) | Los ejemplos usan `role="status"` sin región `aria-live`; el anuncio real depende del lector | Prueba con lector de pantalla y una región persistente |
| Zoom real al 200 % y espaciado de texto (1.4.4, 1.4.12) | Solo se probó reflow a 320 px | Prueba manual en Chrome y Safari, con bookmarklet de text-spacing |
| Navegadores Safari y Firefox | Solo se usó Chromium | Repetir las pruebas de teclado y colores forzados |
| Comportamiento de la versión publicada en Azure | Por indicación, se auditó solo la copia local | Comparar después de publicar |
| Header y sidebar en móvil (drawer) | No se ejercitó el drawer | Prueba de teclado y foco del menú móvil |
| Semántica de listas en VoiceOver (DS-35) | Requiere Safari + VoiceOver | Prueba manual |
