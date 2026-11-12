# 05 — Plan de remediación

> Este plan es una **propuesta para revisión y aprobación del equipo UX/UI**. No se ha modificado código, tokens ni Figma. Las decisiones marcadas «Decisión UX/UI» deben cerrarse antes de tocar el código, para no ocultar en CSS un problema que nace en el diseño.

## Principios

1. **Figma primero cuando el origen es Figma.** DS-01, DS-07 y parte de DS-06, DS-15, DS-16 y DS-23 se corrigen en Figma y luego se propagan a los tokens.
2. **Un solo cambio por token, no por componente.** Varias fallas comparten causa: los alias de `--font-size-*` (DS-11), la falta de modo Dark para las superficies (DS-02) y el foco (DS-06/DS-21). Se corrigen en la capa de tokens.
3. **Nada se publica sin recompilar ni volver a verificar.** Toda fase termina con build, axe en los tres temas y la prueba de teclado (scripts en `evidencias/scripts/`).

## Fase 0 — Contención (antes de la próxima publicación)

| ID | Acción | Responsable | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| DS-09 | No publicar los cambios de `readonly` tal como están; reemplazar `outline:none` por un indicador visible (el mismo de `:focus` editable u otro definido por UX/UI) y recompilar `css/core.css` | Desarrollo | — | `git diff css/core.css` refleja `_inputs.scss`; un input readonly enfocado con Tab muestra un indicador ≥3:1 en los tres temas |
| — | Añadir el build (`npm run build`) y la comparación fuente-vs-compilado como paso obligatorio antes de publicar | Desarrollo | — | Recompilar no genera diferencias en un commit publicado |

## Fase 1 — Bloqueantes de accesibilidad (sprint actual)

| ID | Acción | Responsable | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| DS-01 | **Decisión UX/UI:** elegir entre (a) texto `#111` sobre `#ff6600` (6.43:1), (b) un naranja de acción ≥4.5:1 con blanco (candidatos medidos: `#c25100` 4.70, `#bf4f00` 4.85, `#b84c00` 5.16) o (c) documentar una excepción de marca, que dejaría de cumplir AA. Descartar `#e63f0c` (4.13) y `#cc5200` (4.40). Crear en Figma `use/text/link` y `use/primary/*` accesibles y luego propagarlos | UX/UI → Desarrollo | Aprobación de marca | Ninguna combinación texto/fondo de botón, tab, paginación, chip, avatar, enlace o skip-link queda por debajo de 4.5:1 en Light (axe `color-contrast` = 0 en nodos `mp-*` por esta causa) |
| DS-32 | Subrayar los enlaces en contenido (o añadir otro indicador no cromático) | UX/UI + Desarrollo | DS-01 | Los enlaces de texto se distinguen sin depender del color (1.4.1) |
| DS-02 | Definir en Figma y `_theme.scss` el modo Dark de `use/surface/*` usado por badges/chips/tags; añadir bloque Dark a tabs (texto oscuro sobre `#ff9d5c`), checkbox (check oscuro), avatar brand y user-chip hover; recalibrar warning (`#967229`) y success (`#0b853d`) en Dark para ≥4.5:1 | UX/UI (paleta) + Desarrollo | DS-22 (eliminar hex locales) | axe `color-contrast` en Dark = 0 para nodos `mp-*` en `#badges`, `#tabs`, `#toast`, `#alertas`, `#avatar`, `#seleccion` |
| DS-03 | Reimplementar el dropdown con el patrón APG *Select-only combobox* (o `<select>` nativo estilizado): `role="combobox"` en el trigger, `aria-expanded` sincronizado, `aria-activedescendant`, flechas, Home/End, Enter/Espacio, Escape y escritura para buscar; publicar el JS de referencia | Desarrollo | — | Una persona solo con teclado abre, navega, selecciona y cierra; axe sin `aria-allowed-attr` ni `aria-input-field-name`; la opción activa tiene un indicador visible |
| DS-04 | Tabs según el patrón APG: `role="tablist"` en todos los ejemplos, roving tabindex (solo la pestaña activa con 0), flechas izquierda/derecha, Home/End y `aria-controls` hacia paneles existentes | Desarrollo | — | ArrowRight mueve el foco y la selección; axe sin `aria-required-parent` ni `aria-valid-attr-value` |
| DS-05 | Arreglar la especificidad en `_inputs.scss` y `_dropdown.scss` para que `.error` (borde y helper) gane en Dark y HC; en HC añadir una señal no cromática (icono, borde más grueso o patrón) | Desarrollo (+UX/UI define la señal HC) | — | En los tres temas, un campo con error se distingue de uno normal sin leer el texto; el helper de error mantiene ≥4.5:1 |
| DS-08 | Añadir estilos `@media (forced-colors: active)` para switch, checkbox y radio (bordes `CanvasText`, estado marcado con `Highlight`) | Desarrollo | — | Con colores forzados emulados, el switch es visible y se distingue on/off |

## Fase 2 — Foco, contraste no textual y fundamentos de tokens (siguiente sprint)

| ID | Acción | Responsable | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| DS-06 / DS-21 | **Decisión UX/UI:** un único patrón de foco para todo el sistema (p. ej. outline de 3 px ≥3:1 con offset de 2 px), definido en Figma y en un token (`--focus-ring-width`, `--focus-ring-color`, `--focus-ring-offset`). Eliminar los indicadores basados solo en `box-shadow` traslúcido, en un borde de 1 px o en un cambio de color (header, breadcrumb, bottom-sheet, buscador del dropdown). Unificar el reset, el mixin y los componentes | UX/UI → Desarrollo | DS-01 (color) | Todos los controles enfocables muestran el mismo indicador con ≥3:1 contra el fondo adyacente; `grep "outline: *none"` solo aparece donde haya un reemplazo |
| DS-07 | **Decisión UX/UI:** bordes de campo ≥3:1 (p. ej. `use/border/strong` `#666` o un nuevo `use/border/input`), track del switch apagado ≥3:1, relleno del checkbox según DS-01 y barra pendiente del stepper ≥3:1 | UX/UI → Desarrollo | DS-01 | Medición 1.4.11 ≥3:1 en los tres temas |
| DS-10 | Configurar Bootstrap con `@use '…/bootstrap' with (…)` (o `@import` controlado) para que reciba las variables del DS; o bien retirar Bootstrap completo y conservar solo grid/reboot | Desarrollo | DS-12 | `css/core.css` sin `#0d6efd` ni `.375rem` por defecto; `.btn:focus-visible` sin borde azul |
| DS-11 | Renombrar o corregir los alias `--font-size-*` (o apuntar los componentes a los tokens Figma `--body---l`, `--comun---boton`) y ajustar alert/toast a 16/16, tabs a 16 y paginación a 16 | Desarrollo | — | Medidas computadas iguales a Figma (alert título 16/700, cuerpo 16/400; tab 16/600; paginación 16/700) |
| DS-13 / DS-14 | Alinear `--mp-*-weight` y los mixins con Figma (H4–H6 700, Display L/M 700, Eyebrow 400/0.8 % sin mayúsculas, botón 700, label 400); cargar Roboto 600 o reemplazar 600/800 por pesos cargados | Desarrollo (+UX/UI confirma 600 en tabs) | — | Pesos computados = Figma; ningún peso sintetizado |
| DS-18 / DS-19 / DS-20 | Eliminar `opacity` y `pointer-events` globales de `[disabled]` y `[aria-disabled]`; un token de estado disabled con tema; estilos de disabled/readonly que ganen sobre los bloques de tema; corregir el check en HC, el placeholder HC del dropdown y el hover HC del user-chip | Desarrollo (+UX/UI define disabled según Figma: texto `#f5f5f5` o un valor legible) | DS-07 | Disabled y readonly distinguibles en los tres temas; ningún texto en hover por debajo de 4.5:1 |
| DS-12 | Marcar la API legacy como *deprecated* (comentario y aviso en la doc), publicar la tabla de migración `.btn-primary` → `.mp-btn--primario`, etc.; mientras conviva, darle tema o excluirla del build por defecto. Fecha de retiro propuesta: v3.0.0 | Desarrollo + UX/UI | DS-10 | La API legacy no aparece en `core.css` por defecto o cumple contraste en los tres temas |
| DS-15 / DS-16 / DS-17 | Taller de conciliación con diseño: foco y error de input, helper `#111` frente a `#666`, orden del asterisco, foco y disabled de botón, alto del terciario, label del checkbox a 16, radio de paginación 12, tokenizar el switch en Figma | UX/UI + Desarrollo | DS-06, DS-07 | Cada diferencia de la sección 4 del documento 03 queda cerrada como «fiel» o como «desviación aprobada» con justificación |
| DS-25 / DS-26 / DS-27 / DS-28 | Tabla: `tabindex="0"`, `role="region"` y `aria-label` en el contenedor con scroll, más `caption`. Stepper: diferenciar el paso actual y dar nombre al progressbar. Formularios: `label`, `required`, `aria-describedby` y `aria-invalid` en todos los ejemplos. Modal: mover el JS de referencia (trampa, ESC, retorno) a una capa reutilizable | Desarrollo | — | axe sin `scrollable-region-focusable`, `aria-progressbar-name` ni `label`; checklist QA actualizado |
| DS-22 / DS-23 | Sustituir hex locales de Dark/HC por tokens; corregir `orange/60`, overlays con alfa, la clave `(Negro)` y el token fantasma `info-body` (crear `use/state/info/body` en Figma o usar `info/text`) | Desarrollo + UX/UI (Figma) | DS-02 | 0 hex fuera de `abstracts/` salvo fallbacks documentados; tokens Figma = SCSS |
| DS-30 | Portal: layout responsive (sidebar colapsable, reflow a 320 px); code-tabs con `role="tablist"/"tab"` o sin `aria-selected`; superficies Do/Don't con tokens; reescribir el checklist QA con criterios verificables | Desarrollo + UX/UI | — | El portal hace reflow a 320 px sin pérdida de contenido; axe sin `aria-allowed-attr` |

## Fase 3 — Backlog

| ID | Acción | Responsable |
|---|---|---|
| DS-24 | Decidir si el radio 12 entra en la escala (`border-radius/12`) o los componentes migran a 16; dejar de usar spacing como radio | UX/UI → Desarrollo |
| DS-29 | Excluir `.mp-loading` de la regla global de movimiento reducido o reemplazarla por una de menor especificidad | Desarrollo |
| DS-31 | Confirmar o crear tableros Figma para Header, Sidebar, Stepper, Avatar y Bottom-sheet | UX/UI |
| DS-33 | Unificar la escala de z-index (`--z-*`) con la de Bootstrap | Desarrollo |
| DS-34 | Token audit de la paleta primitiva (uso por token semántico) | UX/UI |
| DS-35 | Mantener semántica de listas (`role="list"` donde se quite el estilo) | Desarrollo |
| DS-36 | Unificar el dropdown web/app y eliminar bloques de tema duplicados en el modal | Desarrollo |
| DS-37 / DS-38 | Validar la búsqueda y el CTA del header en móvil; `max-height` dinámico en el accordion | UX/UI + Desarrollo |

## Dependencias clave

```
DS-01 (color de marca accesible) ─┬─> DS-32 (enlaces)
                                  ├─> DS-06/21 (color de foco)
                                  └─> DS-07 (checkbox marcado)
DS-10 (Bootstrap configurado) ──────> DS-12 (retiro de legacy)
DS-22 (sin hex locales) ────────────> DS-02 (modo Dark coherente)
DS-06/07 (foco y bordes) ───────────> DS-15/16/17 (conciliación de fidelidad)
```

## Verificación de cierre (para cada fase)

1. `npm run build` y comparar fuente vs. `css/core.css`.
2. `node evidencias/scripts/axe2.js` en los tres temas: 0 violaciones `mp-*` de las reglas cerradas.
3. `node evidencias/scripts/kbd.js`: tabs, dropdown y modal pasan.
4. `node evidencias/scripts/focus.js` y `forced.js`: indicadores y colores forzados.
5. Revisión manual con NVDA y VoiceOver de los componentes tocados (pendiente de esta auditoría).
