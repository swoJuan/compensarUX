# 10 — Implementación DEC-012 · P1 (Tokens y mixins)

**Decisión:** DEC-012 — Unidades relativas `rem` / `em`
**Etapa:** P1 — capa de tokens y mixins (`core/base/_theme.scss`, `core/abstracts/_mixins.scss`)
**Fecha:** Noviembre 2026
**Estado:** **Verificado — P1 ya cumple DEC-012; sin cambios necesarios.** Pendiente de revisión del equipo antes de P2.

> Alcance aprobado: `vendors/*`, Bootstrap, `_bootstrap-overrides.scss` y `_google-icons.scss` **excluidos**. Sin tocar `letter-spacing`, Figma ni decisiones previas. Sin commits ni despliegues.

---

## 1. Resultado de P1

Tras auditar los dos archivos de la capa de tokens/mixins, **no existen `px` convertibles dentro del alcance aprobado**: todos los `px` presentes caen en excepciones justificadas (reglas 5 y 1 de la aprobación). La capa de tokens ya expresa las dimensiones escalables en `rem` (vía la función `rem()` y los tokens de spacing/radius), por lo que P1 ya cumple DEC-012.

Esto es coherente con el diagnóstico (doc 09): los ~178 `px` directos convertibles están en los **componentes** (P2/P3), no en tokens/mixins.

## 2. Inventario por archivo y clasificación

### `core/abstracts/_mixins.scss`
| Línea | Valor px | Clasificación | Acción |
|---|---|---|---|
| 11–12 | `16px`, `14px` | comentarios de ejemplo | no aplica |
| 63 | `$min-vw: 360px`, `$max-vw: 1280px` | **viewport/breakpoints** de `ty-responsive` | conservar (regla 5) |
| 80–81 | `outline: 2px`, `outline-offset: 2px` | **indicador de foco** (`focus-ring`) | conservar (regla 5) |
| 106–107 | `1px`, `-1px` | **técnica a11y** `visually-hidden` (clip 1px) | conservar (técnico) |
| 126 | `border: 1px` | **borde fino** (`card-base`) | conservar (regla 5) |
| 132 | `$width: 6px` | ancho de scrollbar (detalle técnico) | conservar (técnico) |
| 139–148 | `@media … px` | **breakpoints** | conservar (regla 5) |

→ **0 conversiones.** Las dimensiones tipográficas del mixin (font-size, line-height) ya usan tokens Sass (`$fs-*`, `$lh-*`) en rem.

### `core/base/_theme.scss`
| Línea | Valor px | Clasificación | Acción |
|---|---|---|---|
| 96 | `--color-focus-ring-width: 3px` | **indicador de foco** | conservar (regla 5) |
| 142 | `--radius-xl: #{$border-radius-md}` | ya es variable Sass (1.5rem); `24px` solo en comentario | ya en rem |
| 144 | `--radius-pill: #{$border-radius-lg}` | ya es variable Sass (2rem) | ya en rem |
| 328, 334 | `--bs-breadcrumb-font-size: 1rem`, `--bs-nav-link-font-size: 1rem` | **variables Bootstrap `--bs-*`** | excluidas (regla 1) |
| 333 | `--bs-icon-link-transform: translate3d(0,-0.125rem,0)` | variable Bootstrap; además ya en rem | excluida (regla 1) |
| 335 | `--bs-scroll-height: 340px` | **variable Bootstrap `--bs-*`** | excluida (regla 1) |

→ **0 conversiones** dentro del alcance. Los tokens de spacing/radius ya se publican en rem.

## 3. Validaciones ejecutadas (obligatorias)

| Validación | Resultado |
|---|---|
| `npm run build` | OK, sin errores |
| Equivalencia de valores computados (antes/después) | **Idéntica**: `css/core.css` byte-idéntico tras rebuild (P1 no modificó la fuente) → imposible alteración visual |
| Tokens en rem en el CSS | Confirmado: `--space-16: 1rem`, `--border-radius-md: 1.5rem`, `--radius-xl: 1.5rem` |
| Light / Dark / High Contrast | Sin cambios (CSS idéntico) |
| Responsive 320 / 768 / 1440 + zoom 200% | Sin cambios (CSS idéntico); los breakpoints se conservan en px por diseño |
| Bootstrap intacto | `node_modules/bootstrap` sin cambios; `--bs-*` no alterados |

> Como P1 no produjo diferencias en `css/core.css`, las validaciones visuales y responsive no pueden revelar regresiones (el output es el mismo que el ya validado en DEC-005). No se generaron capturas nuevas por redundantes; si el equipo las requiere, se adjuntan.

## 4. Conclusión

- **P1 ya cumple DEC-012.** No se modificó ningún archivo en esta etapa.
- Las dimensiones escalables de tokens/mixins ya están en `rem`; los `px` restantes son excepciones justificadas o variables Bootstrap excluidas.
- La deuda de unidades se concentra en **P2 (componentes transversales)** y **P3 (header, sidebar, avatar, badges, icons)**, como anticipó el diagnóstico.

**Siguiente paso (pendiente de aprobación):** iniciar **P2 — componentes transversales** (alert, toast, tabs, pagination, inputs, selección, modal).
