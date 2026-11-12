# 11 — Implementación DEC-012 · P2 (Componentes transversales)

**Decisión:** DEC-012 — Unidades relativas `rem` / `em`
**Etapa:** P2 — componentes transversales
**Fecha:** Noviembre 2026
**Estado:** **Implementado y validado.** Pendiente de revisión del equipo antes de P3.

> Alcance aprobado: solo estilos propios. `vendors/*`, Bootstrap, `_bootstrap-overrides.scss`, `_google-icons.scss` **excluidos**. Sin tocar `letter-spacing`, colores, tipografía (salvo unidad de font-size), estados, Figma ni decisiones previas. Sin commits ni despliegues.

---

## 1. Componentes incluidos y archivos

| Componente | Archivo | Resultado |
|---|---|---|
| Alertas | `core/components/web/_alerts.scss` | convertido |
| Toast | `core/components/web/_toasts.scss` | convertido |
| Tabs | `core/components/web/_tabs.scss` | ya en `rem()`/token tras DEC-005 — 0 cambios (solo `letter-spacing` px intacto) |
| Pagination | `core/components/web/_pagination.scss` | ya en `rem()`/token tras DEC-005 — 0 cambios |
| Inputs | `core/components/web/_inputs.scss` | convertido (API legacy: textarea, check, toggle, icono) |
| Checkbox/Radio/Switch | `core/components/web/_selection-controls.scss` | convertido |
| Modal | `core/components/web/_modals.scss` | convertido |

En `_alerts`, `_toasts`, `_selection-controls` y `_modals` se añadió `@use '../../abstracts' as *;` (mismo patrón que `_tabs`/`_inputs`) para disponer de `rem()` y tokens. No altera Bootstrap.

## 2. Conversiones realizadas

Dimensiones escalables px → `rem()` o token de spacing existente (equivalencia exacta, base 16px):

- **Alertas:** gap 8/16px → `--space-8/16`; min-height 78px → 4.875rem; icono 32px → 2rem; close −8px → −0.5rem; radius 12px → 0.75rem.
- **Toast:** ancho máx 350px → 21.875rem; min-height 78px; icono 32px; close 24px → 1.5rem; radius 12px; región 350px; salida −8px.
- **Inputs (legacy):** asterisco 2px; icono 20px → 1.25rem; textarea 120px → 7.5rem; checkbox/radio 18px; toggle 44×24, knob 18px, posición 3px, desplazamiento 20px → 1.25rem.
- **Selección:** control 24px, visual 18px, hit 44px; tilde 10/6px; radio 8px; switch 52/40/32/28/10px; posiciones track/knob 4/2px; desplazamiento 20px; iconos helper 16px; padding 8/10px → token/rem.
- **Modal:** anchos 479/300/800px → 29.9375/18.75/50rem; close top 19px/right 23px/32px; icono 64px, radius 48px; títulos 28/18px y mobile 24/16px; radius 12px.

## 3. Excepciones conservadas en `px` (reglas 4 y 5)

- **Bordes finos:** 1px/1.5px/2px (alert/toast/modal borders, check `border-left/bottom` 2px, choice 1.5px) y **5px** del borde del icono de modal.
- **Indicadores de foco:** `outline-offset: 2px`, `--color-focus-ring-width`.
- **Sombras:** `--mp-modal-shadow`, `box-shadow` del knob del switch.
- **Breakpoints:** `@media … px`.
- **Mezclas con viewport/%:** `calc(100vw - 48px)` (toast-region), `calc(100% - 32px)` (modal mobile).
- **letter-spacing:** `0.352px` de Tabs (DEC-005) — intacto.
- **SVG embebido:** atributos `width/height` del data-uri del select — no son CSS.

## 4. Incidencia encontrada y corregida durante P2

**Bug de interpolación en custom properties.** Al convertir custom properties con `--x: rem(32px)`, Sass **no evalúa** la función dentro del valor de una custom property y emitía `rem(32px)` **literal** al CSS (inválido). Lo detectó la verificación de equivalencia computada (switch track `0px`, choice control `2px`, modal width `none`).

- **Causa:** `rem()` requiere interpolación (`#{…}`) cuando se asigna a una custom property.
- **Corrección:** 11 custom properties envueltas en `#{rem(...)}` en `_selection-controls.scss` (8) y `_modals.scss` (3).
- **Verificación post-fix:** el CSS compilado ya muestra valores resueltos (`--mp-switch-track-height: 2rem`, `--mp-modal-width: 29.9375rem`, etc.) y **0 `rem()` literales** en `css/core.css`.

> Lección: en propiedades normales (`width: rem(32px)`) Sass sí evalúa; en custom properties hay que interpolar. Se aplicará el mismo criterio en P3.

## 5. Validaciones ejecutadas (obligatorias)

Verificación en navegador real (Chromium/Playwright; instalado para la prueba y **desinstalado** al terminar — `package.json` con sus dependencias originales).

| Validación | Resultado |
|---|---|
| `npm run build` | OK, sin errores |
| **Equivalencia de valores computados (px base vs rem actual)** | **IDÉNTICA** — todos los probes (iconos, anchos de modal, control de checkbox, track de switch, font-sizes) computan los mismos px que antes. Evidencia: `equiv.json` |
| 3 temas (Light/Dark/HC) × 4 secciones | sin overflow; render correcto |
| Responsive 320 / 768 / 1440 px | sin overflow horizontal (12 checks) |
| Zoom 200% | sin overflow horizontal |
| **Total checks de overflow** | **25, con 0 overflow** — evidencia `portal.json` |
| Bootstrap intacto | `node_modules/bootstrap` sin cambios; `--bs-*` no alterados; `rem()` literales en CSS = 0 |

Evidencias en `docs/auditoria-design-system/evidencias/dec012-p2/`: `equiv.json`, `portal.json`, capturas (`p-seleccion-high-contrast.png`, `p-modales-dark.png`, `p-zoom200-modales.png`).

## 6. Conclusión

- P2 convierte las dimensiones escalables de los 7 componentes transversales a `rem`/token, con **equivalencia computada exacta** (sin cambio visual) verificada en navegador real.
- Se conservan las excepciones aprobadas (bordes, foco, sombras, breakpoints, viewport/%, letter-spacing).
- Se detectó y corrigió el bug de interpolación en custom properties.
- Bootstrap y decisiones previas intactos.

**Siguiente paso (pendiente de aprobación):** P3 — `_header.scss`, `_sidebar.scss`, `_avatar.scss`, `_badges.scss`, `base/_icons.scss`. (Y, en etapa final de documentación, `_buttons-docs.scss`.)
