# 14 — Pendientes para el cierre de DEC-012

> Estado: **DEC-005 cerrado. DEC-012 implementado (P1, P2, P3 + opción B, PI-04, PI-01) y pendiente únicamente de las verificaciones y la documentación de esta lista.** No se declara cerrado hasta la revisión del equipo.
> Registrado el 5 de noviembre de 2026, antes del primer commit de implementación.

## A. Verificaciones pendientes (requisito antes de publicar)

| # | Pendiente | Detalle | Responsable sugerido |
|---|---|---|---|
| V-01 | **Revisión en Firefox y Safari** | Todas las pruebas se hicieron en Chromium con tamaño de texto real del navegador. Verificar en Firefox y Safari: (1) dropdown del Header dimensionado sin JavaScript (posición estática de un elemento absoluto, *shrink-to-fit*, rejilla intrínseca); (2) media queries en `em` (el cambio a menú móvil a `48em`, el wrap del ZT a `≤ 22em` y el subtítulo oculto a `≤ 16em` dependen de que el navegador evalúe `em` contra el tamaño de texto por defecto; Safari/iOS tiene su propio escalado "Tamaño del texto"/Dynamic Type); (3) Header público y ZT con texto 100/150/200 %; (4) iconos (`CompensarIcons`) y foco visible; (5) pesos de Roboto 600/700 (DEC-005). | QA / Front |
| V-02 | Lectores de pantalla | Solo se verificó el árbol de accesibilidad de Chromium y el orden de `Tab`. Falta NVDA/JAWS/VoiceOver (H-03: nombre del chip; botón de menú; chip; orden de foco). | QA accesibilidad |
| V-03 | Revisión del equipo de los resultados finales | Informes 07, 09–13 y evidencias. | Equipo |

## B. Documentación final pendiente

| # | Pendiente | Detalle |
|---|---|---|
| D-01 | Etapa final con `_buttons-docs.scss` | Única conversión px → rem que se difirió por instrucción (archivo de documentación de botones). |
| D-02 | DEC-011 — ver `08-Pendientes-DEC-011.md` | P-011-01 imagen de Figma rota en `header.html:34`; P-011-02 los visores/descargas de 13 archivos `js/*-docs.js` embeben CSS con `px` y ninguno con `rem`; P-011-03 `header.html` no contiene el componente en vivo. |
| D-03 | Actualizar la documentación de los componentes | Reflejar en la documentación pública los cambios de P1–P3, PI-04 y PI-01 (breakpoints en `em`, wrap del ZT, `aria-label` del chip). |

## C. Formalización en Figma — Header ZT

| # | Pendiente | Detalle |
|---|---|---|
| F-01 | **Formalizar el Header ZT en Figma** | La regla A de escritorio del ZT (`.mp-web-header--zt .mp-web-header__main { grid-template-columns: auto minmax(0, 1fr) auto }`: marca de ancho natural, buscador flexible, chip de ancho natural) es una **solución provisional**. En el archivo `1zVGMpzqBgiBUqhmfFEAoT` no existe un componente oficial equivalente (solo `header`, `header mobile`, `mp-header`, `Menu ZT` y `Avatar`; `Header-ZT` aparece solo en la librería COLMÉDICA). Cuando diseño publique el componente se compara y, si difiere, se ajusta la regla A. Incluir en Figma también los estados responsive (wrap `≤ 22em`) y el chip. |

## D. Decisiones y hallazgos abiertos (no bloquean el commit)

| Id | Tipo | Resumen | Estado |
|---|---|---|---|
| H-02 | **Decisión funcional UX/UI** | En móvil (`≤ 48em`) el buscador del Header ZT está oculto y no hay alternativa. Propuesta: botón de búsqueda accesible que abra el buscador (`aria-expanded`, `aria-controls`, foco al campo, `Esc` cierra y devuelve el foco, objetivo táctil ≥ 44 px). | Pendiente de decisión; no implementado |
| H-01 | Hallazgo separado | El título `mp-h3` de la zona de contenido del ZT sobresale de su caja a 200 % en 320/375 px. | Abierto |
| H-05 | Hallazgo (portal) | `body.component-doc-full aside{display:none}` en `portal.css` oculta el menú de módulos del ZT en la vista previa. | Abierto |
| H-06 | Observación | `aria-label="Compensar home"` del enlace de marca (inglés; no incluye el subtítulo visible). | Abierto |
| PI-02, PI-03 | Independientes | Ver `13-Pendientes-Independientes.md`. | Abiertos |

## E. Resuelto en esta tanda

H-03 (nombre accesible del chip, WCAG 2.5.3) · PI-01 reglas A (provisional), B y C · PI-04 · P3 + opción B · DEC-005.
