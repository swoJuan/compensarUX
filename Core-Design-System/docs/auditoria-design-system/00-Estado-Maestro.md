# 00 — Estado maestro del Core Design System

> **Documento único de estado.** Consolida las auditorías, decisiones e implementaciones de esta carpeta y lo contrasta con el código actual. No repite auditorías: cada punto enlaza al informe que tiene la evidencia.
> **Corte:** 11 de noviembre de 2026 · **Versión:** `v2.4.0` (tabs responsive), solo en local · **Figma:** `1zVGMpzqBgiBUqhmfFEAoT`
> Las secciones 1 a 8 conservan el análisis del corte del 6 de noviembre. **Prevalece la sección 0.**
> **Alcance:** solo el Core Design System. Los prototipos (Drupal, ZT y APP), el Portal UX y Nara quedan fuera hasta cerrar las etapas 1 y 2.

## 0.1 v2.4.0 — Tabs: menú desplegable por debajo de 768 px (11 nov 2026)

Cierra un hueco entre documentación y código: la sección «6. Responsive» del componente Tabs exigía el menú desplegable
en pantallas pequeñas, sin punto de quiebre definido y sin implementación. Se fija en **768 px** (`md`), se implementa en
`_tabs.scss` y `js/mp-tabs.js` sin cambiar el marcado de las páginas, y se añade un respaldo sin JavaScript.
Verificado con 24 comprobaciones en Chromium. Detalle e incidencia pendiente: informe **32**.

Este hueco se detectó al preparar la sincronización de los prototipos con `v2.3.0`: con la pestaña a 16 px (DEC-005/DS-11)
las pestañas de Historia clínica se partían en dos líneas a 320 px.

## 0. Cierre técnico de v2.3.0 (11 nov 2026)

La etapa de estabilización del Core Design System queda **cerrada a nivel técnico**. **No es una declaración de conformidad WCAG completa:** quedan verificaciones diferidas.

| Elemento | Estado |
|---|---|
| Versión | `2.3.0` en `package.json` y `package-lock.json` (dependencias sin cambios: bootstrap 5.3.8, sass 1.99.0) |
| Commits de la etapa | `9d9adbd` F-1/F-2 y generación de CSS de documentación en el build · `aa44ad6` DEC-010 a11y y responsive residual · commit de release y tag `v2.3.0` locales |
| GitHub | Sin push ni tag remoto. `origin/main` en `8b30750`; `main` queda por delante sin ningún commit por detrás |
| Consistencia del release | `npm run build` y `npm run docs:check` |
| Informes de la etapa | 27 (F-1/F-2 y build) · 28 (DEC-009/010 y responsive) · 29 (matriz final y diferencias con `origin/main`) · 30 (checklist Safari y VoiceOver) |
| Dependencia de `node_modules` | Solo en compilación (`npm ci` basta). `origin/main` los rastrea y esta línea los deja de versionar: ver informe 29, §4 |

### Verificaciones diferidas (no ejecutadas)

| Verificación | Motivo | Cómo hacerla |
|---|---|---|
| **Safari** | `safaridriver` requiere `--enable` con autenticación de administrador | Informe 30 |
| **VoiceOver** (y NVDA/JAWS) | Su salida no puede capturarse desde el entorno automatizado | Informe 30 |
| **Revisión visual del equipo** (V-03) | Requiere decisión humana sobre los cambios visuales de DEC-003/004/006/008 y los informes 07 y 09–13 | Equipo UX/UI |

Firefox 121 y Chromium sí se ejecutaron (168/168 en la regresión focalizada, informe 28).

### Decisiones DEC-001 a DEC-012

Resumen; el detalle con excepciones aprobadas está en el informe 29, §3.

| Decisión | Implementación | Pendiente |
|---|---|---|
| DEC-001 / DEC-002 | Solo documental; se conserva el diseño aprobado | Advertencias de contraste en Figma y documentación |
| DEC-003 | Implementado | Revisión visual, provisionales en Figma |
| DEC-004 | Implementado | Checkbox indeterminado, Dropdown Dark, foco de la opción del Bottom Sheet |
| DEC-005 | Cerrado | Lectores de pantalla |
| DEC-006 | Implementado | Badges en Alto contraste frente a Figma |
| DEC-007 | Implementado | Ficha de teclado en Figma, VoiceOver, Safari |
| DEC-008 | Implementado | PI-02 (`.mp-chip--lg`) |
| DEC-009 | Sin defecto bloqueante; Bootstrap intacto | Migración gradual de DS-12 y DS-22 |
| DEC-010 | Tables, Stepper, Accordion implementados; Modal verificado | **Bottom Sheet sin diagnóstico**; módulo reutilizable de Modal sin decisión; color actual/completado del Stepper (Figma) |
| DEC-011 | P-011-01, 02 y 03 cerrados; responsive 32/32 | H-05, H-06, DS-32 |
| DEC-012 | Implementado | V-01 (Safari), V-02, V-03, D-01, D-03, F-01 |

### Siguiente fase

Reorganización de carpetas (fase 2). No iniciada.

---

## 1. Estado de la versión (corte del 6 de noviembre)

| Elemento | Estado |
|---|---|
| Versión publicada en el repositorio | `v2.2.0` (tag anotado) sobre `77696a7` · `package.json` 2.2.0 |
| Commits de esta versión | `09dfa3a` DEC-005 + DEC-012 · `879fadb` readonly/disabled (DEC-003 parcial) · `77696a7` release |
| GitHub | **5 commits y el tag sin push** (`origin/main` en `8b30750`; faltan `2d6fa5b`, `a33a844`, `09dfa3a`, `879fadb` y `77696a7`) |
| Cambios sin commit (ajenos a v2.2.0) | 6 archivos: `README.md`, `ia-context.md`, `docs/technical-guides/IA_Context.md`, `docs/technical-guides/navigation-workflow.md`, `docs/web/components/icons-intro.html` (corrige un enlace a `#iconos-libreria`) y `js/router.js` **borrado** (la navegación vive ahora en `js/ds-bundle.js`; ninguna página referencia `router.js`). Pertenecen al portal de documentación, no a componentes. |
| Registro de decisiones | `decisiones/Compensar_Decisiones_DEC001_DEC012_v1_2 2.md` tiene la columna **Estado desactualizada**: DEC-003, DEC-005 y DEC-012 figuran "sin ejecutar". **Este documento prevalece** hasta que se actualice el registro. |

## 2. Decisiones DEC-001 a DEC-012

| Decisión | Tema | Estado real | Evidencia | Lo que falta para cerrarla |
|---|---|---|---|---|
| DEC-001 | Botón primario: conservar y advertir contraste (DS-01) | Pendiente · solo documental | 01, 04 | Redactar la advertencia en Figma y en la documentación |
| DEC-002 | Bordes de inputs: conservar y documentar (DS-07) | Pendiente · solo documental | 01, 04 | Documentar la recomendación de contraste |
| **DEC-003** | Inputs: Error, Focus y Disabled conforme a Figma | **Implementado y revisado, candidato a `v2.2.1`, pendiente de aprobación** (sin commit) | 01, 03 §4.2, `15-Diagnostico-DEC-003.md` §8–§9 | **Resuelto en el árbol de trabajo:** DS-18 (input a opacidad 1), DS-05 (error visible y con borde rojo en Dark/HC, también combinado con foco), DS-15 (foco Figma, error, apoyo `#111`, label disabled, asterisco, error accesible con `aria-describedby`). **Antes:** DS-09, DS-19. Revisión final: §9 (comparación con Figma Light, combinados en 3 temas, patrón de error reutilizable). **Publicado en local como `v2.2.1`** (`17a01db` + `19f23ff`). **Después de v2.2.1:** ajuste de reflow del mensaje de apoyo (`overflow-wrap:anywhere`, 320 px × 200 %: 15/18 → 18/18; informe 15 §10), incluido en el commit local del lote DEC-007; la versión (`v2.2.2` o `v2.3.0`) está por decidir. **Pendiente:** revisión visual del equipo, Firefox/Safari, formalizar provisionales en Figma |
| DEC-004 | Foco transversal (DS-06, DS-21) | **Implementado en código** (`25-Implementacion-DEC-004-006-008-Figma-aprobado.md`) | 01, 04, 17, 25 | **Hecho:** Checkbox, Radio y Switch con contorno de 3 px, opción de Dropdown de 2 px interior y Tabs de 3 px exterior, todos con `use/border/strong`; Buttons, Input y trigger sin cambios. **Pendiente:** estilo del estado indeterminado del Checkbox; Dropdown Dark (fondo `#FFB380` de Figma vs trazo `#E0E0E0` ≈1,4:1) requiere decisión de UX; Firefox/Safari/lectores de pantalla |
| **DEC-005** | Tipografía (DS-11, DS-13, DS-14) | **Cerrado** (`09dfa3a`) | `07-Implementacion-DEC-005.md` | No bloqueante: prueba con lectores de pantalla |
| DEC-006 | Dark y High Contrast (DS-02, DS-08, DS-20, DS-22) | **Implementado en código** (17, 25) | 01, 04, 17, 25 | **Hecho:** tokens `use/text/badge/*`, Dark de `warning/bg` y `success/bg`, icono Warning Light, Badge/Chip/Alert/Toast desde tokens de estado (sin hex fijos), cuerpo Info con `use/state/info/text`; tokens Dark/HC sincronizados en `core.css`. **Pendiente:** Badges en High Contrast (el HTML usa negro/blanco con borde; Figma usa fondos de estado en algunos), deuda documental DEC-011 |
| **DEC-007** | Dropdown y Tabs: teclado y ARIA (DS-03, DS-04) | **Implementado en código, sin commit de release** (ver `16-Implementacion-DEC-007.md`) | 01, 04 §4, **16** | **Cerrado en código:** DS-03 (Dropdown) y DS-04 (Tabs) con módulos reutilizables `js/mp-dropdown.js` y `js/mp-tabs.js` (117/117 y 63/63 aislados; portal Web y App sin fallos en Light/Dark/HC, 320 px y texto 200 %; 84 rutas sin regresiones). **Aprobado técnicamente (6 nov):** los chips del multi-select son informativos (se quita desde el Dropdown); el foco de la opción y de las pestañas ya sigue DEC-004 (informe 25); versión propuesta `v2.3.0` (sin tag ni publicación). **Pendiente:** ficha de teclado en Figma, lectores de pantalla y Firefox/Safari |
| DEC-008 | Tokens, radios, iconos, dimensiones (DS-16, DS-17, DS-23, DS-24) | **Implementado en código** (17, 25) | 01, 03, 17, 25 | **Hecho:** paginación 16 px con `border-radius/sm`, Switch 52×44 (track 52×32, knob 28×28), Tabs 52×44 con superficie de 35 px, Terciario solo icono 48×48, etiquetas de Checkbox/Radio/Switch 16/24, `--base-neutral-100-(negro)` inválido. Botones ya medían 48 px. **Pendiente:** `use-state-info-body` ya no aplica (Alert Info usa `use/state/info/text`) |
| DEC-009 | Estilos propios y legacy (DS-09, DS-12, DS-22; DS-10 diagnóstico) | Pendiente · DS-09 cerrado | 01 | DS-12 y DS-22. DS-10 sigue igual (`@use` de Bootstrap sin `with`) |
| DEC-010 | Tables, Stepper, Modal, Accordion, Bottom Sheet (DS-25, DS-26, DS-28, DS-38) | Pendiente | 01, 04 | Falta la auditoría complementaria del Bottom Sheet |
| DEC-011 | Documentación y responsive (DS-27, DS-30, DS-31, DS-32) | Pendiente | `08-Pendientes-DEC-011.md` | P-011-01, P-011-02, P-011-03, H-05, DS-32 (`a{text-decoration:none}` sigue en `_reset.scss`) |
| **DEC-012** | Unidades `rem`/`em` | **Implementado, pendiente de cierre** (`09dfa3a`) | `09`–`12`, `13`, `14` | Ver §4 |

## 3. Hallazgos DS-01 a DS-38

### Cerrados

| Hallazgo | Cómo se cerró |
|---|---|
| DS-09 | Build actualizado y foco visible en readonly · `879fadb` |
| DS-11, DS-13, DS-14 | DEC-005 · `09dfa3a` (`07`) |
| DS-19 | Disabled/readonly diferenciados en Dark y HC · `879fadb` |
| DS-03, DS-04 | Dropdown y Tabs operables por teclado con ARIA correcto · DEC-007, módulos `js/mp-dropdown.js` y `js/mp-tabs.js` (`16-Implementacion-DEC-007.md`) |

### Parciales

| Hallazgo | Hecho | Pendiente |
|---|---|---|
| **DS-18** | Se retiró la opacidad `.65` propia del input | **La regla global `[disabled]{opacity:.5}` de `core/base/_accessibility.scss:63-68` sigue aplicando** a los campos deshabilitados: texto efectivo **2,05:1** (Light), **2,39:1** (Dark), **5,28:1** (HC); borde ≈ 1,61:1. Figma define opacidad 100 %. También sigue `pointer-events:none` en `[aria-disabled]`. Plan y decisión de alcance: informe 15 §5 P2. |
| DS-06 | Foco visible en campos readonly | Resto de componentes (DEC-004) |
| DS-15 | — (v2.2.0 no tocó estos puntos) | Label disabled `#666`, apoyo por defecto `#111`, borde/mensaje de error (`#db7165` sin halo, `#9e3328` regular + icono), foco Figma (4 px `#ffe6d6` + 1 px `#e63f0c`; el borde actual `#ff6600` da 2,94:1 < 3:1), asterisco antes del label. Medido en v2.2.0: informe 15 §3 |
| DS-05 | — | Error indistinguible del normal en **Dark** y **HC** (borde y texto sin diferenciar); Figma no define esos modos. Requiere señal no cromática. Medido en v2.2.0: informe 15 §3 (#4–#6) |

### Abiertos por severidad

| Sev. | Hallazgos | Decisión |
|---|---|---|
| Crítica | DS-01 · DS-02 | DEC-001 · DEC-006 |
| Alta | DS-05 · DS-06 (resto) · DS-07 · DS-08 · DS-10 · DS-12 | DEC-003 · DEC-004 · DEC-002 · DEC-006 · DEC-009 |
| Media | DS-15 · DS-16 · DS-17 · DS-18 · DS-20 · DS-21 · DS-22 · DS-23 · DS-25 · DS-26 · DS-27 · DS-28 · DS-30 · DS-32 | DEC-003 · DEC-008 · DEC-006 · DEC-004 · DEC-009 · DEC-010 · DEC-011 |
| Baja | DS-24 · DS-29 · DS-31 · DS-33 · DS-34 · DS-35 · DS-36 · DS-37 · DS-38 | DEC-008 · DEC-010 · DEC-011 · sin decisión (DS-29, DS-33, DS-34, DS-36) |

Detalle y evidencia: `02-Matriz-Hallazgos.md`. Falsos positivos de auditorías previas: `06-Comparacion-Auditorias.md`.

## 4. Cierre de DEC-012 (de `14-Pendientes-Cierre-DEC-012.md`)

| Id | Pendiente | Tipo | Estado verificado hoy |
|---|---|---|---|
| V-01 | Firefox y Safari: dropdown del Header sin JS, media queries en `em`, Header 100/150/200 %, iconos y foco, Roboto 600/700 | Verificación | Pendiente · cubre también lo pendiente de DEC-005 |
| V-02 | Lectores de pantalla (NVDA/JAWS/VoiceOver): chip, botón de menú, orden de foco | Verificación | Pendiente · cubre también DEC-005 |
| V-03 | Revisión del equipo de los informes 07 y 09–13 | Revisión | Pendiente |
| D-01 | `_buttons-docs.scss` a `rem` | Implementación | Pendiente · quedan valores en `px` (22, 48, 8, 3…) |
| D-02 | DEC-011: P-011-01/02/03 | Documentación | Pendiente · **P-011-01 es mayor de lo registrado:** `header.html` tiene 8 imágenes con URL temporal de Figma (al menos 3 distintas), no 1. **P-011-02:** los 13 visores siguen casi todo en `px` (p. ej. web-header 87 px / 1 rem) |
| D-03 | Documentación pública de P1–P3, PI-04 y PI-01 | Documentación | Pendiente |
| F-01 | Formalizar el Header ZT en Figma (regla A provisional) | Diseño | Pendiente de UX/UI |

## 5. Validación de v2.2.0 (readonly y disabled)

Prueba con `css/core.css` de `v2.2.0` en Chromium, temas claro, oscuro y alto contraste: 21/21 casos de estado correctos en color, hover, foco, cursor y altura (56 px). Contraste del texto: readonly 5,27:1 (claro), 5,07:1 (oscuro) y 21:1 (alto contraste).

**Corrección:** la validación anterior midió el color, pero no aplicó la opacidad al contraste. En **disabled** la regla global de DS-18 deja el campo al 50 %; el contraste efectivo del texto baja a 2,05:1 (Light), 2,39:1 (Dark), 5,28:1 (HC). **Readonly no está afectado** (opacidad 1). No contradice WCAG, que exime a los controles deshabilitados, pero **sí contradice Figma (opacidad 100 %)** y DEC-003. Diagnóstico completo contra Figma y plan: `15-Diagnostico-DEC-003.md`.

Decisión registrada el 6 nov 2026: en alto contraste, los campos no editables usan **borde punteado**. Pendiente de formalizar en Figma.

## 6. Pendientes independientes y hallazgos sueltos

| Id | Estado | Fuente |
|---|---|---|
| PI-01 | Resuelto con reglas A, B y C · regla A provisional → F-01 | `13` |
| PI-02 | Abierto · `.mp-chip--lg` = 14 px; confirmar tamaño en Figma (DEC-008) | `13` |
| PI-03 | Abierto · botón de menú móvil estirado; decisión de diseño | `13` |
| PI-04 | Resuelto | `12` §6 |
| H-01 | Abierto · título `mp-h3` del ZT desborda a 200 % en 320/375 px | `13` |
| H-02 | **Decisión UX/UI pendiente** · buscador del Header ZT inaccesible en móvil | `13`, `14` |
| H-05 | Abierto · `portal.css` oculta `<aside>` en vista completa (verificado hoy) | `13` |
| H-06 | Abierto · `aria-label="Compensar home"` (inglés, no incluye el subtítulo) (verificado hoy) | `13` |

## 7. Evidencia vigente (no repetir)

- **Auditoría integral** (01–06): axe 20 páginas × 3 temas (`evidencias/axe-resumen-por-pagina.json`), harness `evidencias/audit-harness.html`. Se vuelve a ejecutar **solo** sobre componentes que cambien.
- **DEC-005:** `evidencias/dec005/` (portal en 3 temas, zoom 200 %/320).
- **DEC-012:** `evidencias/dec012-p2/`, `dec012-p3/` (suite, harness del header, sidebar), `dec012-p3-opcionB/` (validación con datos crudos), `dec012-pi01*/`, `dec012-pi04/`. Los scripts de `evidencias/dec012-p3/scripts/` sirven como regresión del Header.
- **v2.2.0:** prueba de estados de inputs en 3 temas (§5).
- Lo que **no** tiene evidencia: Firefox, Safari, lectores de pantalla y Bottom Sheet.

## 8. Orden recomendado para cerrar la Etapa 1

1. **DS-18 en inputs** (corrección pequeña, `v2.2.1`): excluir `.mp-input-field` de la opacidad global, o decidir si la regla global `[disabled]{opacity:.5}` se mantiene para el resto de componentes. Requiere decisión UX/UI porque afecta a botones y otros controles.
2. **Higiene del repositorio:** decidir los 6 cambios sin commit del portal de documentación (commit propio o descartar) y actualizar la columna de estado del registro de decisiones.
3. **Verificaciones V-01 (Firefox y Safari) y V-02 (lectores de pantalla):** cierran a la vez DEC-012 y los pendientes de DEC-005.
4. **D-01** (`_buttons-docs.scss`) y **D-03** (documentación pública de DEC-012).
5. **Decisiones de diseño:** F-01 (Header ZT en Figma), H-02 (buscador móvil del ZT) y borde punteado en alto contraste (Figma).
6. **V-03:** revisión del equipo y cierre formal de DEC-012 → **línea base estable** del sistema.
7. **Push** de los commits y tags (con autorización).

**Etapa 2 (componentes), en este orden:** críticos DS-02 (DEC-006) y DS-01 (DEC-001) (DS-03 y DS-04 ya cerrados con DEC-007) → resto de inputs DEC-003 (DS-15, DS-05) → foco transversal DEC-004 → DEC-002, DEC-008 y PI-02 → DEC-010 → DEC-009 → DEC-011 (incluye P-011-01/02/03, H-05 y H-06).
