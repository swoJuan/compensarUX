# 06 — Comparación con auditorías anteriores

**Referencias:** `09.09-Auditoria-UX.md` (agosto 2026, 16 hallazgos) y `09.10-Diagnostico-Fidelidad-Figma.md` (noviembre 2026, 8 hallazgos). Ambas están en `Documentacion/09-UX-UI/` (sin commit).

**Estados:** Confirmado · Nuevo · Corregido · Falso positivo · Pendiente. También se usa «Parcialmente corregido» y «Confirmado con corrección» cuando el problema existe pero la conclusión o la recomendación previa no se sostiene.

> **Nota de método:** la instrucción era hacer la Etapa A antes de leer las auditorías previas. En esta sesión los dos archivos venían adjuntos y estaban en contexto desde el inicio, así que no se puede garantizar una independencia total. Para compensarlo, cada conclusión previa se volvió a verificar con evidencia propia (código, render, teclado, axe y Figma por MCP), y varias resultaron incorrectas.

## 1. Auditoría 09.09 (UX y accesibilidad)

| ID previo | Hallazgo previo | Estado | Evidencia actual | ID actual |
|---|---|---|---|---|
| A11Y-01 | Contraste del botón primario | **Confirmado con corrección** | Blanco/`#ff6600` 2.94 · blanco/`#e63f0c` **4.13** (no 4.6). La «opción A» recomendada (gradiente `#e63f0c`→`#cc5200`) **no cumple** 4.5:1; `#111`/`#ff6600` da 6.43 (no 4.8) | DS-01 |
| A11Y-02 | Enlaces `#ff6600` | **Confirmado con corrección** | 2.94:1. Las alternativas `#e63f0c` (4.13) y `#cc5200` (4.40) no cumplen. Subrayado ausente por `a{text-decoration:none}` | DS-01, DS-32 |
| NN-04-H4 (NN-01) | Doble API `mp-*` / legacy | **Confirmado** | Legacy compilada en `core.css`; usada en 1 página de la doc; choca con Bootstrap | DS-12 |
| A11Y-03 | Placeholder legacy `#a4a4a4` | **Confirmado** | 2.49:1 medido | DS-12 |
| TOK-01 | Token `--use-state-info-body` inexistente que «rompe Dark/HC» | **Falso positivo (parcial)** | Dark y HC sobrescriben `--mp-alert-body` y `--mp-toast-body` explícitamente (medido: blanco sobre `#18428f`, 9.48:1). En Light, `#0b3954` **es el valor de Figma** (literal sin variable, nodo 4585:19367). Queda solo una deuda de tokenización baja | DS-23 |
| NN-03-H3 / A11Y-06 | Focus trap / ESC / retorno en modal no implementados | **Parcialmente corregido** | El JS de la documentación lo implementa y funciona (verificado con teclado); falta una referencia reutilizable en `core/` | DS-28 |
| A11Y-05 / NN-01-H1 | `.btn-loading` oculta el texto | **Confirmado** | `color: transparent !important` sin cambios | DS-12 |
| NN-05-H4 | Radios inconsistentes | **Confirmado** | 26 literales; radio vía `--space-*` | DS-24 |
| NN-06-H4 | Foco 2 px vs 3 px | **Confirmado y ampliado** | Siete variantes de indicador; varios solo con `box-shadow` traslúcido | DS-21, DS-06 |
| NN-07-H5 | Requerido depende del asterisco | **Confirmado** | Los ejemplos no llevan `required` ni `aria-required` | DS-27 |
| NN-08-H6 | Placeholder como label | **Confirmado** | axe `label`: 5 inputs sin etiqueta en la doc | DS-27 |
| A11Y-04 | Disabled de muy bajo contraste | **Confirmado y ampliado** | La opacidad global 0.5 se acumula (1.24:1 efectivo); Figma pide texto `#f5f5f5` | DS-18 |
| A11Y-07 | Errores no anclados al campo | **Confirmado** | `aria-describedby` y `aria-invalid` usados de forma desigual en los ejemplos | DS-27 |
| NN-02-H2 | Labels en mayúsculas (legacy) | **Confirmado** | Mixin `ty-label` uppercase | DS-12 |
| NN-09-H8 | Paleta amplia sin mapa de uso | **Confirmado** | Sin cambios | DS-34 |
| H7 | Documentar el teclado por componente (cosmético) | **Confirmado y escalado a Crítico** | Tabs y dropdown **no implementan** el teclado; no es solo falta de documentación | DS-03, DS-04 |

### «Aciertos» de 09.09 revisados

| Afirmación previa | Resultado |
|---|---|
| «Loading tiene fallback específico (ralentiza en vez de matar la animación)» | **Falso.** La regla global con `!important` lo anula: el spinner queda a 0.01 ms × 1 (DS-29) |
| «Alto Contraste robusto» | **Parcial.** Falla el check del checkbox, el error no se distingue, legacy queda en 1.07:1 y el hover del user-chip en 1.07:1 (DS-05, DS-12, DS-20) |
| «Dark mode alineado a Figma» | **Parcial.** Los tokens sí; los componentes no (badges 1.00:1, tabs 2.05:1…) (DS-02) |
| «`forced-colors` contemplado» | **Parcial.** Solo para iconos; el switch desaparece (DS-08) |
| «Áreas táctiles de 44 px» | **Confirmado** en `mp-choice`, `mp-switch`, paginación y botones `mp-*` |
| «`:focus-visible` global» | **Confirmado**, pero varios componentes lo anulan con `outline:none` (DS-06) |

## 2. Diagnóstico 09.10 (fidelidad Figma)

| ID previo | Hallazgo previo | Estado | Evidencia actual | ID actual |
|---|---|---|---|---|
| A-01 | Contraste del botón primario (origen Figma) | **Confirmado con corrección** | Origen Figma confirmado. La alternativa propuesta (`#e63f0c`) no cumple (4.13) | DS-01 |
| A-02 | Color de enlace (origen Figma) | **Confirmado con corrección** | Las alternativas propuestas (`#e63f0c`, `#cc5200`) no cumplen | DS-01 |
| B-01 | Letter-spacing UI no coincide (Figma 2.2 px / 1.2 px) | **Falso positivo** | Figma expresa el tracking en **%**: 2.2 % × 16 = 0.352 px y 1.2 % × 16 = 0.192 px (el MCP lo genera así y el tablero 2.2 dice «1.2%»). El código (0.022em, 0.012em) es exacto. El «conflicto interno de Figma» no existe | — |
| B-02 | `--use-state-info-body` con color distinto a Figma (`#2d4a67`) | **Falso positivo** | Figma usa `#0b3954` literal en el cuerpo info (4585:19367), igual que el código. El theming Dark/HC no está roto | DS-23 (deuda baja) |
| B-03 | Radio del input hardcodeado | **Confirmado** | `rem(16px)` | DS-24 |
| B-04 | Radio 12 fuera de escala | **Confirmado** | Figma también lo usa literal y vía `spacing/12px` | DS-24 |
| B-05 | Foco 2 px vs 3 px; «Figma define un ring único de 3 px» | **Confirmado con corrección** | La inconsistencia en código existe, pero Figma **no** define un ring único: botón = borde 2 px `#111`; input = anillo 4 px `#ffe6d6` | DS-21 |
| C-01 | API legacy sin equivalente Figma | **Confirmado** | — | DS-12 |

### Afirmaciones de «fidelidad» de 09.10 revisadas

| Afirmación previa | Resultado |
|---|---|
| «Alertas: gap, icono y radio idénticos» | Medidas ✔; **tipografía no** (cuerpo a 12 px frente a 16 px; título 14/600 frente a 16/700) (DS-11) |
| «Input: height 56 · radius 16 · padding 50 · icono 24 idénticos» | Medidas ✔; **estados no** (foco, error, helper, disabled) (DS-15) |
| «Checkbox/Radio: hit 44 · control 24 · visual 18» | ✔; label 14 frente a 16 (DS-17) |
| «Modal y Toast: medidas idénticas» | Toast ✔ en medidas. Modal: no se re-midió cada medida en Figma (**Pendiente** detallado) |
| «Shadows, radius md, colores de marca y estado» | ✔ Confirmado |
| «Tipografía body coincide» | ✔ body; **headings H4–H6, Display y Eyebrow no** (DS-13) |

## 3. Hallazgos nuevos (no estaban en ninguna auditoría previa)

| ID | Sev. | Resumen |
|---|---|---|
| DS-02 | Crítica | Modo Dark con textos ilegibles (badges, tabs, warning y success, user-chip) |
| DS-03 | Crítica | Dropdown no operable por teclado y con ARIA inválido |
| DS-04 | Crítica | Tabs inalcanzables por teclado (sin flechas, `tabindex=-1`) |
| DS-05 | Alta | Error de formulario no perceptible en Dark y HC |
| DS-06 | Alta | Indicadores de foco de bajo contraste o solo cromáticos |
| DS-07 | Alta | Contraste no textual < 3:1 en bordes, switch, checkbox y stepper (origen Figma) |
| DS-08 | Alta | Switch invisible en colores forzados |
| DS-09 | Alta | Build desactualizado; WIP de readonly sin foco visible |
| DS-10 | Alta | Bootstrap compilado sin las variables del DS |
| DS-11 | Alta | Alias `--font-size-*` desplazados (alert/toast a 12 px, tabs y paginación a 14 px) |
| DS-13, DS-14 | Media | Pesos tipográficos distintos de Figma; pesos 600/800 no cargados |
| DS-15, DS-16, DS-17 | Media | Diferencias de estados en input, botón, checkbox y paginación |
| DS-19, DS-20 | Media | Disabled/readonly indistinguibles en Dark/HC; defectos HC (check, placeholder, hover) |
| DS-22, DS-23 | Media | 312 hex en componentes; errores de mapeo de tokens |
| DS-25, DS-26 | Media | Tabla con scroll no enfocable; stepper con paso actual indistinguible |
| DS-29 | Baja | Movimiento reducido anula el fallback de Loading |
| DS-30 | Media | Portal: reflow 320 px, ARIA de code-tabs, checklist QA genérico |
| DS-31, DS-33, DS-35–DS-38 | Baja | Tableros Figma faltantes, z-index, listas, duplicados, header móvil, accordion |

## 4. Corregidos

Ningún hallazgo previo está **totalmente** corregido en el commit auditado. NN-03/A11Y-06 (modal) está **parcialmente** corregido en el JS de la documentación. Los cambios sin commit en `_inputs.scss` acercan el disabled a Figma, pero no están compilados e introducen una regresión de foco (DS-09).

## 5. Balance

Se cuentan 26 identificadores previos: 18 de 09.09 (A11Y-01 a 07, NN-01 a 09, TOK-01 y la observación H7) y 8 de 09.10.

| Estado | Cantidad (de 26 identificadores previos) |
|---|---|
| Confirmado (incluye «con corrección» y «ampliado») | 21 |
| Parcialmente corregido | 2 (NN-03-H3 y A11Y-06, el mismo problema del modal) |
| Falso positivo | 3 (B-01, B-02 y TOK-01 en su parte Dark/HC) |
| Corregido | 0 |
| Pendiente | 0 |

Además, 2 «aciertos» de 09.09 resultaron falsos o parciales en lo esencial (Loading con movimiento reducido; Alto Contraste robusto), y las recomendaciones de color de ambas auditorías para DS-01 no cumplen AA.
