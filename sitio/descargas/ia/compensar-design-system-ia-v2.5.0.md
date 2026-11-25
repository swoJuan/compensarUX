# Sistema de diseño de Compensar v2.5.0 — documentación completa para IA

Generado el 2026-11-25 · commit `21fa41a`. Documento consolidado: cada sección corresponde a un archivo del paquete modular.

<!-- archivo: README.md -->
## Sistema de diseño de Compensar — documentación para IA (v2.5.0)

Generado el 2026-11-25 desde el commit `21fa41a` del sistema de diseño. Este paquete se regenera con cada publicación del portal; no se edita a mano.

### Cómo usarlo

1. Entrega a tu agente `INSTRUCCIONES-IA.md` (o pégalas como instrucciones del proyecto).
2. Adjunta esta carpeta, o el archivo único `compensar-design-system-completo.md`.
3. Para cada tarea, el agente consulta primero `components/index.md`, `tokens/` y `platforms/<plataforma>.md`.

### Contenido

- `manifest.json`: versión, fuentes, archivos con hash y pendientes.
- `tokens/`: colores, tipografía, espaciado, radios y sombras, breakpoints y `tokens.json`.
- `components/`: 30 componentes (índice en `components/index.md`).
- `foundations/`: principios, tipografía, espaciado, radios, sombras y layout.
- `patterns/`: navegación y formularios, búsqueda, responsive, movimiento, modo oscuro y alto contraste.
- `accessibility/`: criterios de accesibilidad reunidos de cada componente.
- `platforms/`: Drupal, ZT y App: paquetes, orden de carga y particularidades.
- `versions/changelog.md`: historial de versiones.

### Qué no está

- Catálogo de iconos (icons-library): se consulta en la página del sistema de diseño
- Las secciones interactivas de cada componente (anatomía, playground, visualizador de código) se generan en el navegador y no se incluyen.

---

<!-- archivo: INSTRUCCIONES-IA.md -->
## Instrucciones para agentes de IA

Eres un agente que construye interfaces para Compensar. Usa el sistema de diseño de Compensar v2.5.0 y respeta estas reglas:

1. Antes de escribir código, consulta la documentación del sistema de diseño v2.5.0 (archivo README.md y manifest.json del paquete). Si el usuario indica otra versión, pídele el paquete de esa versión.
2. Reutiliza los componentes existentes (components/index.md). Antes de crear uno nuevo, verifica que no haya uno equivalente; si no existe, propónlo en lugar de inventarlo.
3. Usa solo los tokens oficiales (tokens/). No escribas colores, espaciados, radios ni sombras con valores sueltos.
4. Mantén la accesibilidad: WCAG 2.2 AA, foco visible, navegación por teclado, contraste en modo claro, oscuro y alto contraste, zoom al 200 %.
5. Respeta los patrones de navegación y de formularios (patterns/).
6. Considera la plataforma de destino (platforms/): Drupal, Zona Transaccional (ZT) y App no cargan los recursos de la misma manera. No las mezcles.
7. No sobrescribas estilos globales ni modifiques el CSS del sistema de diseño; añade CSS propio del flujo al final.
8. Si algo no está documentado, dilo explícitamente («no está documentado en el sistema de diseño») en lugar de suponerlo.
9. Usa datos ficticios en ejemplos; nunca datos personales reales.

---

<!-- archivo: tokens/breakpoints.md -->
## Breakpoints

Fuente: `$grid-breakpoints` en `core/abstracts/_variables.scss` (iguales a Bootstrap).

| Nombre | Desde |
| --- | --- |
| `xs` | `0` |
| `sm` | `576px` |
| `md` | `768px` |
| `lg` | `992px` |
| `xl` | `1200px` |
| `xxl` | `1400px` |

Reglas de uso: ver `patterns/responsive-breakpoints.md`.

---

<!-- archivo: tokens/colors.md -->
## Colores

Fuente: `tokens/compensar.tokens.json` del sistema de diseño v2.5.0. Cada color tiene valor por modo (claro, oscuro y alto contraste). Usa siempre la variable CSS, nunca el valor.

### base/brand

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/brand/40` | `--base-brand-40` | #ffe6d6 | #ffe6d6 | #ffe6d6 |
| `base/brand/50` | `--base-brand-50` | #ffc299 | #ffc299 | #ffc299 |
| `base/brand/60` | `--base-brand-60` | #ffa366 | #ffa366 | #ffa366 |
| `base/brand/70` | `--base-brand-70` | #ff8533 | #ff8533 | #ff8533 |
| `base/brand/80` | `--base-brand-80` | #ff6600 | #ff9d5c | #ffff00 |
| `base/brand/90` | `--base-brand-90` | #e63f0c | #e65c00 | #e6e600 |
| `base/brand/100` | `--base-brand-100` | #cc5200 | #cc5200 | #cccc00 |
| `base/brand/yellow` | `--base-brand-yellow` | #ff980d | #ffe6d6 | #ffe6d6 |

### base/blue

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/blue/30` | `--base-blue-30` | #e6f1fb | #edf2fa | #edf2fa |
| `base/blue/40` | `--base-blue-40` | #d4e2fa | #d4e2fa | #d4e2fa |
| `base/blue/50` | `--base-blue-50` | #9fbef5 | #9fbef5 | #9fbef5 |
| `base/blue/60` | `--base-blue-60` | #5c91f2 | #5c91f2 | #5c91f2 |
| `base/blue/70` | `--base-blue-70` | #296ff0 | #296ff0 | #296ff0 |
| `base/blue/80` | `--base-blue-80` | #1f53b5 | #1f53b5 | #1f53b5 |
| `base/blue/90` | `--base-blue-90` | #18428f | #18428f | #18428f |
| `base/blue/100` | `--base-blue-100` | #2d4a67 | #102c5e | #102c5e |

### base/cyan blue

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/cyan blue/10` | `--base-cyan-blue-10` | #eef5fc | #eef5fc | #eef5fc |
| `base/cyan blue/20` | `--base-cyan-blue-20` | #d6e6f7 | #d6e6f7 | #d6e6f7 |
| `base/cyan blue/30` | `--base-cyan-blue-30` | #b2d0ee | #b2d0ee | #b2d0ee |
| `base/cyan blue/40` | `--base-cyan-blue-40` | #8cb8e0 | #8cb8e0 | #8cb8e0 |
| `base/cyan blue/50` | `--base-cyan-blue-50` | #6c9fd0 | #6c9fd0 | #6c9fd0 |
| `base/cyan blue/60` | `--base-cyan-blue-60` | #5286bc | #5286bc | #5286bc |
| `base/cyan blue/70` | `--base-cyan-blue-70` | #4a74a5 | #4a74a5 | #4a74a5 |
| `base/cyan blue/80` | `--base-cyan-blue-80` | #3c628c | #3c628c | #3c628c |
| `base/cyan blue/90` | `--base-cyan-blue-90` | #2d4f73 | #2d4f73 | #2d4f73 |
| `base/cyan blue/100` | `--base-cyan-blue-100` | #1f3d5a | #1f3d5a | #1f3d5a |

### base/green-1

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/green-1/30` | `--base-green-1-30` | #f7faf8 | #f7faf8 | #f7faf8 |
| `base/green-1/40` | `--base-green-1-40` | #e6f7e8 | #e6f7e8 | #cef0db |
| `base/green-1/50` | `--base-green-1-50` | #9fe0b8 | #9fe0b8 | #9fe0b8 |
| `base/green-1/60` | `--base-green-1-60` | #44bd75 | #44bd75 | #44bd75 |
| `base/green-1/70` | `--base-green-1-70` | #22a152 | #22a152 | #22a152 |
| `base/green-1/80` | `--base-green-1-80` | #0b853d | #0b853d | #0b853d |
| `base/green-1/90` | `--base-green-1-90` | #166936 | #166936 | #166936 |
| `base/green-1/100` | `--base-green-1-100` | #0d3d1f | #0d3d1f | #0d3d1f |

### base/green-2

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/green-2/10` | `--base-green-2-10` | #ecf7c9 | #ecf7c9 | #ecf7c9 |
| `base/green-2/20` | `--base-green-2-20` | #d8ee9c | #d8ee9c | #d8ee9c |
| `base/green-2/30` | `--base-green-2-30` | #c5e270 | #c5e270 | #c5e270 |
| `base/green-2/40` | `--base-green-2-40` | #b1d645 | #b1d645 | #b1d645 |
| `base/green-2/50` | `--base-green-2-50` | #9dc71e | #9dc71e | #9dc71e |
| `base/green-2/60` | `--base-green-2-60` | #95bf1b | #95bf1b | #95bf1b |
| `base/green-2/70` | `--base-green-2-70` | #84ad16 | #84ad16 | #84ad16 |
| `base/green-2/80` | `--base-green-2-80` | #6a8e11 | #6a8e11 | #6a8e11 |
| `base/green-2/90` | `--base-green-2-90` | #516d0d | #516d0d | #516d0d |
| `base/green-2/100` | `--base-green-2-100` | #3f540a | #3f540a | #3f540a |

### base/neutral

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/neutral/10` | `--base-neutral-10` | #f5f5f5 | #f5f5f5 | #f5f5f5 |
| `base/neutral/20` | `--base-neutral-20` | #e0e0e0 | #e0e0e0 | #e0e0e0 |
| `base/neutral/30` | `--base-neutral-30` | #cccccc | #cccccc | #cccccc |
| `base/neutral/40` | `--base-neutral-40` | #b8b8b8 | #b8b8b8 | #b8b8b8 |
| `base/neutral/50` | `--base-neutral-50` | #a4a4a4 | #a4a4a4 | #a4a4a4 |
| `base/neutral/60` | `--base-neutral-60` | #7f7f7f | #7f7f7f | #7f7f7f |
| `base/neutral/70` | `--base-neutral-70` | #666666 | #666666 | #666666 |
| `base/neutral/80` | `--base-neutral-80` | #333333 | #333333 | #333333 |
| `base/neutral/90` | `--base-neutral-90` | #292929 | #292929 | #292929 |
| `base/neutral/100 (Negro)` | `--base-neutral-100-negro` | #111111 | #111111 | #111111 |
| `base/neutral/white` | `--base-neutral-white` | #ffffff | #ffffff | #ffffff |
| `base/neutral/black` | `--base-neutral-black` | #000000 | #000000 | #000000 |

### base/red

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/red/30` | `--base-red-30` | #f7eeed | #f7eeed | #f7eeed |
| `base/red/40` | `--base-red-40` | #f2d8d5 | #f2d8d5 | #f2d8d5 |
| `base/red/50` | `--base-red-50` | #ebada7 | #ebada7 | #ebada7 |
| `base/red/60` | `--base-red-60` | #db7165 | #db7165 | #db7165 |
| `base/red/70` | `--base-red-70` | #d14434 | #d14434 | #d14434 |
| `base/red/75` | `--base-red-75` | #bb4945 | #bb4945 | #bb4945 |
| `base/red/80` | `--base-red-80` | #9e3328 | #9e3328 | #9e3328 |
| `base/red/90` | `--base-red-90` | #7d291f | #7d291f | #7d291f |
| `base/red/100` | `--base-red-100` | #521a14 | #521a14 | #521a14 |

### base/orange

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/orange/10` | `--base-orange-10` | #fff2e3 | #fff2e3 | #fff2e3 |
| `base/orange/20` | `--base-orange-20` | #ffe5cc | #ffe5cc | #ffe5cc |
| `base/orange/40` | `--base-orange-40` | #ffb380 | #ffb380 | #ffb380 |
| `base/orange/60` | `--base-orange-60` | #cc7a33 | #cc7a33 | #cc7a33 |
| `base/orange/100` | `--base-orange-100` | #6b4400 | #cc7a33 | #cc7a33 |

### base/yellow

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `base/yellow/30` | `--base-yellow-30` | #fff9ef | #fff9ef | #fff9ef |
| `base/yellow/40` | `--base-yellow-40` | #fff2d9 | #fff2d9 | #fff2d9 |
| `base/yellow/50` | `--base-yellow-50` | #fce1ac | #fce1ac | #fce1ac |
| `base/yellow/60` | `--base-yellow-60` | #fcce72 | #fcce72 | #fcce72 |
| `base/yellow/70` | `--base-yellow-70` | #ffc154 | #fcbf44 | #fcbf44 |
| `base/yellow/80` | `--base-yellow-80` | #bf9034 | #bf9034 | #bf9034 |
| `base/yellow/90` | `--base-yellow-90` | #967229 | #967229 | #967229 |
| `base/yellow/100` | `--base-yellow-100` | #634a1a | #634a1a | #634a1a |

### product/medicina

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `product/medicina/Cyan` | `--product-medicina-cyan` | #00e2db | #00e2db | #00e2db |
| `product/medicina/Purple` | `--product-medicina-purple` | #8268cb | #8268cb | #8268cb |
| `product/medicina/Gray` | `--product-medicina-gray` | #b3acab | #b3acab | #b3acab |

### product/accent

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `product/accent/30` | `--product-accent-30` | #f2fcff | #f2fcff | #f2fcff |
| `product/accent/40` | `--product-accent-40` | #e1f7fe | #e1f7fe | #e1f7fe |
| `product/accent/50` | `--product-accent-50` | #b3d7e0 | #b3d7e0 | #b3d7e0 |
| `product/accent/60` | `--product-accent-60` | #8fc5d0 | #8fc5d0 | #8fc5d0 |
| `product/accent/70` | `--product-accent-70` | #6bb4c0 | #6bb4c0 | #6bb4c0 |
| `product/accent/80` | `--product-accent-80` | #47a4af | #47a4af | #47a4af |
| `product/accent/90` | `--product-accent-90` | #24939d | #24939d | #24939d |
| `product/accent/100` | `--product-accent-100` | #03838a | #03838a | #03838a |

### product/gray

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `product/gray/5` | `--product-gray-5` | #f8f7f7 | #f8f7f7 | #f8f7f7 |
| `product/gray/10` | `--product-gray-10` | #eceaea | #eceaea | #eceaea |
| `product/gray/20` | `--product-gray-20` | #d9d5d5 | #d9d5d5 | #d9d5d5 |
| `product/gray/30` | `--product-gray-30` | #c6c1c0 | #c6c1c0 | #c6c1c0 |
| `product/gray/40` | `--product-gray-40` | #b3acab | #b3acab | #b3acab |
| `product/gray/50` | `--product-gray-50` | #a09796 | #a09796 | #a09796 |
| `product/gray/60` | `--product-gray-60` | #8c8280 | #8c8280 | #8c8280 |
| `product/gray/70` | `--product-gray-70` | #786e6c | #786e6c | #786e6c |
| `product/gray/80` | `--product-gray-80` | #635a59 | #635a59 | #635a59 |
| `product/gray/90` | `--product-gray-90` | #4d4746 | #4d4746 | #4d4746 |
| `product/gray/100` | `--product-gray-100` | #383333 | #383333 | #383333 |

### product/violet

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `product/violet/5` | `--product-violet-5` | #efecf9 | #efecf9 | #efecf9 |
| `product/violet/10` | `--product-violet-10` | #e0d9f3 | #e0d9f3 | #e0d9f3 |
| `product/violet/20` | `--product-violet-20` | #c1b3e7 | #c1b3e7 | #c1b3e7 |
| `product/violet/30` | `--product-violet-30` | #a28dda | #a28dda | #a28dda |
| `product/violet/40` | `--product-violet-40` | #8367ce | #8367ce | #8367ce |
| `product/violet/50` | `--product-violet-50` | #6d4cc5 | #6d4cc5 | #6d4cc5 |
| `product/violet/60` | `--product-violet-60` | #5b3ab4 | #5b3ab4 | #5b3ab4 |
| `product/violet/70` | `--product-violet-70` | #4e3199 | #4e3199 | #4e3199 |
| `product/violet/80` | `--product-violet-80` | #40297e | #40297e | #40297e |
| `product/violet/90` | `--product-violet-90` | #322064 | #322064 | #322064 |
| `product/violet/100` | `--product-violet-100` | #251749 | #251749 | #251749 |

### product/teal

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `product/teal/5` | `--product-teal-5` | #ebfffe | #ebfffe | #ebfffe |
| `product/teal/10` | `--product-teal-10` | #d0fffd | #d0fffd | #d0fffd |
| `product/teal/20` | `--product-teal-20` | #a0fffc | #a0fffc | #a0fffc |
| `product/teal/30` | `--product-teal-30` | #71fffa | #71fffa | #71fffa |
| `product/teal/40` | `--product-teal-40` | #41fff8 | #41fff8 | #41fff8 |
| `product/teal/50` | `--product-teal-50` | #12fff7 | #12fff7 | #12fff7 |
| `product/teal/60` | `--product-teal-60` | #00e1d9 | #00e1d9 | #00e1d9 |
| `product/teal/70` | `--product-teal-70` | #00c0b9 | #00c0b9 | #00c0b9 |
| `product/teal/80` | `--product-teal-80` | #009f99 | #009f99 | #009f99 |
| `product/teal/90` | `--product-teal-90` | #007d79 | #007d79 | #007d79 |
| `product/teal/100` | `--product-teal-100` | #005c59 | #005c59 | #005c59 |

### use/background

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/background/page` | `--use-background-page` | var(--base-neutral-white) | var(--base-neutral-100-negro) | var(--base-neutral-black) |

### use/primary

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/primary/default` | `--use-primary-default` | var(--base-brand-80) | var(--base-brand-80) | var(--base-brand-80) |
| `use/primary/hover` | `--use-primary-hover` | var(--base-brand-90) | var(--base-brand-90) | var(--base-brand-90) |
| `use/primary/active` | `--use-primary-active` | var(--base-brand-100) | var(--base-brand-100) | var(--base-brand-100) |
| `use/primary/default dark` | `--use-primary-default-dark` | #ff9d5c | var(--base-brand-80) | var(--base-brand-80) |

### use/border

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/border/default` | `--use-border-default` | var(--base-neutral-30) | var(--base-neutral-80) | var(--base-neutral-white) |
| `use/border/strong` | `--use-border-strong` | var(--base-neutral-70) | var(--base-neutral-20) | var(--base-neutral-white) |
| `use/border/subtle` | `--use-border-subtle` | var(--base-neutral-20) | var(--base-neutral-60) | var(--base-neutral-white) |
| `use/border/hover` | `--use-border-hover` | var(--use-primary-hover) | var(--use-primary-active) | var(--base-neutral-white) |
| `use/border/violet-dark` | `--use-border-violet-dark` | var(--product-violet-80) | var(--product-violet-10) | var(--base-neutral-white) |
| `use/border/violet` | `--use-border-violet` | var(--product-violet-10) | var(--product-violet-90) | var(--base-neutral-white) |

### use/focus

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/focus/border` | `--use-focus-border` | var(--base-brand-40) | var(--base-brand-80) | var(--base-neutral-white) |
| `use/focus/outline` | `--use-focus-outline` | var(--base-brand-80) | var(--base-brand-80) | var(--base-neutral-white) |
| `use/focus/background` | `--use-focus-background` | var(--base-brand-40) | var(--base-brand-40) | var(--base-brand-40) |

### use/text

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/text/primary` | `--use-text-primary` | var(--base-neutral-100-negro) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/text/secondary` | `--use-text-secondary` | var(--base-neutral-80) | var(--base-neutral-20) | var(--base-neutral-10) |
| `use/text/tertiary` | `--use-text-tertiary` | var(--base-neutral-70) | var(--base-neutral-50) | var(--base-neutral-20) |
| `use/text/inverse` | `--use-text-inverse` | var(--base-neutral-10) | var(--base-neutral-100-negro) | var(--base-neutral-black) |
| `use/text/link` | `--use-text-link` | var(--base-brand-80) | var(--base-brand-80) | var(--base-brand-80) |
| `use/text/theme/violet` | `--use-text-theme-violet` | var(--product-violet-70) | var(--product-violet-30) | var(--base-neutral-white) |
| `use/text/theme/yellow` | `--use-text-theme-yellow` | var(--base-yellow-70) | var(--base-yellow-30) | var(--base-neutral-white) |
| `use/text/theme/orange` | `--use-text-theme-orange` | var(--base-orange-60) | var(--base-orange-10) | var(--base-neutral-white) |
| `use/text/theme/blue` | `--use-text-theme-blue` | var(--base-blue-80) | var(--base-blue-30) | var(--base-neutral-white) |
| `use/text/theme/red` | `--use-text-theme-red` | var(--base-red-75) | var(--base-red-30) | var(--base-neutral-white) |
| `use/text/theme/green-1` | `--use-text-theme-green-1` | var(--base-green-1-80) | var(--base-green-1-30) | var(--base-neutral-white) |
| `use/text/theme/green-2` | `--use-text-theme-green-2` | var(--base-green-2-80) | var(--base-green-2-10) | var(--base-neutral-white) |
| `use/text/badge/orange` | `--use-text-badge-orange` | var(--use-text-secondary) | var(--use-text-inverse) | var(--use-text-secondary) |
| `use/text/badge/green-3` | `--use-text-badge-green-3` | var(--base-green-2-90) | var(--use-text-theme-green-2) | var(--use-text-theme-green-2) |
| `use/text/badge/error` | `--use-text-badge-error` | var(--base-red-80) | var(--use-text-theme-red) | var(--use-text-theme-red) |
| `use/text/on-dark/primary` | `--use-text-on-dark-primary` | var(--base-neutral-white) | var(--base-neutral-white) | var(--base-neutral-white) |
| `use/text/on-dark/secondary` | `--use-text-on-dark-secondary` | var(--base-neutral-10) | var(--base-neutral-20) | var(--base-neutral-50) |

### use/tables

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/tables/Head` | `--use-tables-head` | #a5d7d5 | #a5d7d5 | #a5d7d5 |
| `use/tables/Filter` | `--use-tables-filter` | #e3e7ed | #e3e7ed | #e3e7ed |
| `use/tables/Stripes` | `--use-tables-stripes` | #f5f5f7 | #f5f5f7 | #f5f5f7 |

### use/state

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/state/success/bg` | `--use-state-success-bg` | var(--base-green-1-40) | var(--base-green-1-90) | var(--base-green-1-100) |
| `use/state/success/text` | `--use-state-success-text` | var(--base-green-1-100) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/success/border` | `--use-state-success-border` | var(--base-green-1-60) | var(--base-green-1-70) | var(--base-green-1-70) |
| `use/state/success/icon` | `--use-state-success-icon` | var(--base-green-1-80) | var(--base-green-1-40) | var(--base-green-1-40) |
| `use/state/error/bg` | `--use-state-error-bg` | var(--base-red-30) | var(--base-red-90) | var(--base-red-100) |
| `use/state/error/text` | `--use-state-error-text` | var(--base-red-100) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/error/text-error-field` | `--use-state-error-text-error-field` | var(--base-red-80) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/error/icon` | `--use-state-error-icon` | var(--base-red-70) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/error/border` | `--use-state-error-border` | var(--base-red-60) | var(--base-red-70) | var(--base-red-70) |
| `use/state/error/mandatory` | `--use-state-error-mandatory` | var(--base-red-75) | var(--base-red-70) | var(--base-red-70) |
| `use/state/warning/bg` | `--use-state-warning-bg` | var(--base-yellow-40) | var(--base-yellow-100) | var(--base-yellow-100) |
| `use/state/warning/text` | `--use-state-warning-text` | var(--use-text-primary) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/warning/border` | `--use-state-warning-border` | var(--base-yellow-60) | var(--base-yellow-70) | var(--base-yellow-70) |
| `use/state/warning/icon bg` | `--use-state-warning-icon-bg` | var(--base-yellow-90) | var(--base-yellow-70) | var(--base-yellow-70) |
| `use/state/warning/icon color` | `--use-state-warning-icon-color` | var(--use-text-primary) | var(--use-text-inverse) | var(--use-text-inverse) |
| `use/state/info/bg` | `--use-state-info-bg` | var(--base-blue-30) | var(--base-blue-90) | var(--base-blue-100) |
| `use/state/info/text` | `--use-state-info-text` | var(--base-blue-100) | var(--base-neutral-10) | var(--base-neutral-white) |
| `use/state/info/border` | `--use-state-info-border` | var(--base-cyan-blue-50) | var(--base-blue-70) | var(--base-blue-70) |
| `use/state/info/icon` | `--use-state-info-icon` | var(--base-cyan-blue-60) | var(--base-blue-70) | var(--base-blue-70) |

### use/overlay

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/overlay/subtle` | `--use-overlay-subtle` | #000000 | #000000 | #000000 |
| `use/overlay/strong 2` | `--use-overlay-strong-2` | #000000 | #000000 | #000000 |
| `use/overlay/strong 3` | `--use-overlay-strong-3` | #000000 | #000000 | #000000 |

### use/surface

| Token | Variable CSS | Claro | Oscuro | Alto contraste |
| --- | --- | --- | --- | --- |
| `use/surface/surface` | `--use-surface-surface` | var(--base-neutral-10) | var(--base-neutral-70) | var(--base-neutral-black) |
| `use/surface/subtle` | `--use-surface-subtle` | var(--product-gray-20) | var(--product-gray-80) | var(--base-neutral-black) |
| `use/surface/orange` | `--use-surface-orange` | var(--base-orange-10) | var(--base-orange-60) | var(--base-neutral-black) |
| `use/surface/cyan blue` | `--use-surface-cyan-blue` | var(--base-cyan-blue-10) | var(--base-cyan-blue-80) | var(--base-neutral-black) |
| `use/surface/violet` | `--use-surface-violet` | var(--product-violet-5) | var(--product-violet-80) | var(--base-neutral-black) |
| `use/surface/white` | `--use-surface-white` | var(--base-neutral-white) | var(--base-neutral-90) | var(--base-neutral-black) |
| `use/surface/green` | `--use-surface-green` | var(--base-green-1-30) | var(--base-green-1-90) | var(--base-neutral-black) |
| `use/surface/green-2` | `--use-surface-green-2` | var(--base-green-2-10) | var(--base-green-1-90) | var(--base-neutral-black) |
| `use/surface/theme/blue-dark/30` | `--use-surface-theme-blue-dark-30` | var(--base-blue-30) | var(--base-blue-80) | var(--base-neutral-black) |
| `use/surface/theme/blue-dark/40` | `--use-surface-theme-blue-dark-40` | var(--base-blue-40) | var(--base-blue-50) | var(--base-neutral-black) |
| `use/surface/theme/blue-dark/50` | `--use-surface-theme-blue-dark-50` | var(--base-blue-50) | var(--base-blue-60) | var(--base-neutral-black) |
| `use/surface/theme/blue-dark/60` | `--use-surface-theme-blue-dark-60` | var(--base-blue-60) | var(--base-blue-60) | var(--base-neutral-black) |
| `use/surface/theme/blue-dark/90` | `--use-surface-theme-blue-dark-90` | var(--base-blue-90) | var(--base-blue-30) | var(--base-neutral-white) |
| `use/surface/theme/gray/5` | `--use-surface-theme-gray-5` | var(--product-gray-5) | var(--product-gray-90) | var(--base-neutral-black) |
| `use/surface/theme/gray/10` | `--use-surface-theme-gray-10` | var(--product-gray-10) | var(--product-gray-80) | var(--base-neutral-black) |
| `use/surface/theme/gray/20` | `--use-surface-theme-gray-20` | var(--product-gray-20) | var(--product-gray-70) | var(--base-neutral-black) |
| `use/surface/theme/green-1/30` | `--use-surface-theme-green-1-30` | var(--base-green-1-30) | var(--base-green-1-80) | var(--base-neutral-black) |
| `use/surface/theme/green-1/40` | `--use-surface-theme-green-1-40` | var(--base-green-1-40) | var(--base-green-1-50) | var(--base-neutral-black) |
| `use/surface/theme/green-1/50` | `--use-surface-theme-green-1-50` | var(--base-green-1-50) | var(--base-green-1-60) | var(--base-neutral-black) |
| `use/surface/theme/green-2/10` | `--use-surface-theme-green-2-10` | var(--base-green-2-10) | var(--base-green-2-100) | var(--base-neutral-black) |
| `use/surface/theme/green-2/20` | `--use-surface-theme-green-2-20` | var(--base-green-2-20) | var(--base-green-2-60) | var(--base-neutral-black) |
| `use/surface/theme/green-2/40` | `--use-surface-theme-green-2-40` | var(--base-green-2-40) | var(--base-green-2-60) | var(--base-neutral-black) |
| `use/surface/theme/green-2/60` | `--use-surface-theme-green-2-60` | var(--base-green-2-60) | var(--base-green-2-20) | var(--base-neutral-black) |
| `use/surface/theme/neutral/30` | `--use-surface-theme-neutral-30` | var(--base-neutral-30) | var(--base-neutral-70) | var(--base-neutral-black) |
| `use/surface/theme/orange/10` | `--use-surface-theme-orange-10` | var(--base-orange-10) | var(--base-orange-100) | var(--base-neutral-black) |
| `use/surface/theme/orange/20` | `--use-surface-theme-orange-20` | var(--base-orange-20) | var(--base-orange-40) | var(--base-neutral-black) |
| `use/surface/theme/orange/40` | `--use-surface-theme-orange-40` | var(--base-orange-40) | var(--base-orange-60) | var(--base-neutral-black) |
| `use/surface/theme/orange/60` | `--use-surface-theme-orange-60` | var(--base-orange-40) | var(--base-orange-10) | var(--base-neutral-black) |
| `use/surface/theme/red/30` | `--use-surface-theme-red-30` | var(--base-red-30) | var(--base-red-80) | var(--base-neutral-black) |
| `use/surface/theme/red/40` | `--use-surface-theme-red-40` | var(--base-red-40) | var(--base-red-50) | var(--base-neutral-black) |
| `use/surface/theme/red/50` | `--use-surface-theme-red-50` | var(--base-red-50) | var(--base-red-60) | var(--base-neutral-black) |
| `use/surface/theme/red/60` | `--use-surface-theme-red-60` | var(--base-red-60) | var(--base-red-60) | var(--base-neutral-black) |
| `use/surface/theme/violet/5` | `--use-surface-theme-violet-5` | var(--product-violet-5) | var(--product-violet-90) | var(--base-neutral-black) |
| `use/surface/theme/violet/10` | `--use-surface-theme-violet-10` | var(--product-violet-10) | var(--product-violet-80) | var(--base-neutral-black) |
| `use/surface/theme/violet/20` | `--use-surface-theme-violet-20` | var(--product-violet-20) | var(--product-violet-70) | var(--base-neutral-black) |
| `use/surface/theme/violet/60` | `--use-surface-theme-violet-60` | var(--product-violet-60) | var(--product-violet-10) | var(--base-neutral-black) |
| `use/surface/theme/violet/70` | `--use-surface-theme-violet-70` | var(--product-violet-70) | var(--product-violet-20) | var(--base-neutral-black) |
| `use/surface/theme/yellow/30` | `--use-surface-theme-yellow-30` | var(--base-yellow-30) | var(--base-yellow-90) | var(--base-neutral-black) |
| `use/surface/theme/yellow/50` | `--use-surface-theme-yellow-50` | var(--base-yellow-50) | var(--base-yellow-60) | var(--base-neutral-black) |
| `use/surface/theme/yellow/60` | `--use-surface-theme-yellow-60` | var(--base-yellow-60) | var(--base-yellow-70) | var(--base-neutral-black) |
| `use/surface/theme/yellow/70` | `--use-surface-theme-yellow-70` | var(--base-yellow-70) | var(--base-yellow-70) | var(--base-neutral-black) |

---

<!-- archivo: tokens/radius-shadows.md -->
## Radios y sombras

### Radios

| Token | Variable CSS | Valor |
| --- | --- | --- |
| `border-radius/xs` | `--border-radius-xs` | 8px |
| `border-radius/sm` | `--border-radius-sm` | 16px |
| `border-radius/md` | `--border-radius-md` | 24px |
| `border-radius/lg` | `--border-radius-lg` | 32px |

### Sombras

Fuente: `core/abstracts/_tokens-shadows.scss`.

| Variable SCSS | Valor | Uso |
| --- | --- | --- |
| `$shadow-1` | `0.125rem 0.3125rem 1rem rgba(0, 0, 0, 0.15)` | 2px 5px 16px · cards estaticas |
| `$shadow-2` | `0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)` | 0px 8px 24px · dropdowns, popovers |
| `$shadow-3` | `0 1rem 2.5rem rgba(0, 0, 0, 0.20)` | 0px 16px 40px · modales |
| `$shadow-4` | `0 1.25rem 3.125rem rgba(0, 0, 0, 0.20)` | 0px 20px 50px · drawers |
| `$shadow-header` | `0 0.25rem 0.25rem rgba(0, 0, 0, 0.25)` | 0px 4px 4px |
| `$shadow-btn-hover` | `0.125rem 0.125rem 0.1875rem rgba(255, 157, 92, 1)` | 2px 2px 3px |
| `$shadow-btn-especial-hover` | `0.125rem 0.125rem 0.1875rem rgba(162, 141, 218, 1)` | 2px 2px 3px |
| `$shadow-btn-pressed` | `inset 0 0.25rem 0.25rem rgba(0, 0, 0, 0.25)` | 0px 4px 4px |
| `$shadow-card` | `$shadow-1` |  |
| `$shadow-dropdown` | `$shadow-2` |  |
| `$shadow-modal` | `$shadow-3` |  |
| `$shadow-drawer` | `$shadow-4` |  |

---

<!-- archivo: tokens/spacing.md -->
## Espaciado

Variables CSS publicadas en `css/core.css` v2.5.0: `--space-N` (N en píxeles). Base de 8 px; también hay pasos de 2, 4 y 10 px.

| Variable CSS | Valor |
| --- | --- |
| `--space-0` | `0` |
| `--space-2` | `0.125rem` |
| `--space-4` | `0.25rem` |
| `--space-8` | `0.5rem` |
| `--space-10` | `0.625rem` |
| `--space-12` | `0.75rem` |
| `--space-16` | `1rem` |
| `--space-24` | `1.5rem` |
| `--space-32` | `2rem` |
| `--space-40` | `2.5rem` |
| `--space-48` | `3rem` |
| `--space-56` | `3.5rem` |
| `--space-64` | `4rem` |
| `--space-72` | `4.5rem` |
| `--space-80` | `5rem` |
| `--space-96` | `6rem` |
| `--space-128` | `8rem` |

> Nota de consistencia: `tokens/compensar.tokens.json` declara 15 tokens de espaciado como `--spacing-Npx`, pero el CSS publicado usa `--space-N`. Usa `--space-N`.

---

<!-- archivo: tokens/typography.md -->
## Tipografía

Fuente: `core/abstracts/_tokens-typography.scss` (variables SCSS). Los valores se copian tal cual; el comentario es el de la fuente.

| Variable SCSS | Valor | Nota |
| --- | --- | --- |
| `$font-heading` | `'Roboto', sans-serif` |  |
| `$font-body` | `'Roboto', sans-serif` |  |
| `$font-code` | `'Roboto Mono', monospace` |  |
| `$fs-display-l` | `3.5rem` | 56px |
| `$fs-display-m` | `3rem` | 48px |
| `$fs-display-mob-xl` | `2.5rem` | 40px |
| `$fs-display-mob-l` | `2.25rem` | 36px |
| `$fs-display-mob-m` | `2rem` | 32px |
| `$fs-h1` | `3rem` | 48px |
| `$fs-h2` | `2.5rem` | 40px |
| `$fs-h3` | `2.25rem` | 36px |
| `$fs-h4` | `1.75rem` | 28px |
| `$fs-h5` | `1.5rem` | 24px |
| `$fs-h6` | `1.125rem` | 18px |
| `$fs-eyebrow` | `1.125rem` | 18px |
| `$fs-paragraph-xl` | `1.125rem` | 18px |
| `$fs-paragraph-l` | `1rem` | 16px |
| `$fs-body-2xl` | `1.5rem` | 24px |
| `$fs-body-xl` | `1.125rem` | 18px |
| `$fs-body-l` | `1rem` | 16px — base |
| `$fs-body-m` | `0.875rem` | 14px |
| `$fs-body-s` | `0.75rem` | 12px |
| `$fs-body-xs` | `0.625rem` | 10px |
| `$fs-button` | `1rem` | 16px |
| `$fs-label` | `1rem` | 16px |
| `$fs-hint` | `0.875rem` | 14px |
| `$fs-placeholder` | `1rem` | 16px |
| `$fw-regular` | `400` |  |
| `$fw-medium` | `500` |  |
| `$fw-bold` | `700` |  |
| `$fw-black` | `900` |  |
| `$lh-display-l` | `1.1` |  |
| `$lh-display-m` | `1.2` |  |
| `$lh-display-mob` | `1.1` |  |
| `$lh-h1-h4` | `1.2` |  |
| `$lh-h5-h6` | `1.3` |  |
| `$lh-eyebrow` | `1.3` |  |
| `$lh-paragraph` | `1.5` |  |
| `$lh-body` | `1.3` |  |
| `$lh-body-m` | `1.5` |  |
| `$lh-ui` | `1.0` |  |
| `$ls-eyebrow` | `0.1em` |  |
| `$ls-label` | `0.08em` |  |
| `$ls-normal` | `normal` |  |

Clases tipográficas del sistema (`mp-h1`…`mp-h6`, `mp-body-*`): ver `foundations/typography.md`.

---

<!-- archivo: components/index.md -->
## Componentes

Componentes documentados del sistema de diseño v2.5.0: 30. Plataforma «Web y App» son componentes transversales.

| Componente | Plataforma | Resumen / cuándo usarlo | Variantes | Estados | Propiedades / API | Responsive | Accesibilidad | Tokens usados |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Accordion](transversales/accordion.md) | Web y App | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Alertas](transversales/alerts.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Avatar / User chip](transversales/avatar.md) | Web y App | sí | sí | sí | sí | pendiente | pendiente | pendiente |
| [Chips / Tags / Badges](transversales/badges.md) | Web y App | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Botón](transversales/buttons.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Cards](transversales/cards.md) | Web y App | sí | sí | sí | sí | sí | sí | pendiente |
| [Dropdown / Select](transversales/dropdown.md) | Web y App | sí | pendiente | sí | pendiente | sí | sí | sí |
| [Input / Campo de texto](transversales/inputs.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Loading](transversales/loading.md) | Web y App | sí | sí | sí | sí | sí | sí | pendiente |
| [Modal](transversales/modals.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Paginación](transversales/pagination.md) | Web y App | sí | pendiente | sí | pendiente | sí | pendiente | pendiente |
| [Checkbox / Radio / Switch](transversales/selection-controls.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Tables](transversales/tables.md) | Web y App | sí | sí | sí | sí | sí | sí | pendiente |
| [Tabs](transversales/tabs.md) | Web y App | sí | sí | sí | sí | sí | sí | pendiente |
| [Toast](transversales/toasts.md) | Web y App | sí | sí | sí | sí | sí | sí | sí |
| [Accordion](web/accordion.md) | Web | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Chips / Tags / Badges](web/badges.md) | Web | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Breadcrumb](web/breadcrumb.md) | Web | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Empty State](web/empty-state.md) | Web | sí | sí | pendiente | sí | pendiente | sí | pendiente |
| [Navigation patterns](web/header.md) | Web | pendiente | pendiente | pendiente | sí | pendiente | sí | pendiente |
| [Cómo conectarlo](web/icons-connect.md) | Web | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |
| [Sistema de iconos](web/icons-intro.md) | Web | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |
| [Loading](web/loading.md) | Web | sí | sí | sí | sí | sí | sí | pendiente |
| [Sidebar / Overlay](web/sidebar.md) | Web | sí | sí | pendiente | sí | sí | sí | pendiente |
| [Stepper](web/stepper.md) | Web | sí | sí | pendiente | pendiente | pendiente | sí | pendiente |
| [Bottom Sheet](app/bottom-sheet.md) | App | sí | sí | sí | sí | pendiente | sí | pendiente |
| [Carga infinita](app/carga-infinita.md) | App | sí | pendiente | sí | sí | sí | sí | pendiente |
| [Dropdown / Select App](app/dropdown.md) | App | sí | pendiente | sí | pendiente | sí | sí | sí |
| [Header App](app/header.md) | App | sí | sí | sí | sí | pendiente | pendiente | pendiente |
| [Tabs App](app/tabs.md) | App | sí | sí | sí | sí | pendiente | pendiente | pendiente |

«pendiente» significa que la página de origen no tiene esa información; no se completa con suposiciones.

---

<!-- archivo: components/app/bottom-sheet.md -->
## Bottom Sheet

> Fuente: `docs/app/components/bottom-sheet.html` · Plataforma: App · Sistema de diseño v2.5.0

Panel inferior móvil para listas, filtros y selecciones contextuales. Se ancla al borde inferior de la pantalla, mantiene el foco en la tarea y evita navegar a otra pantalla cuando la decisión es breve.

Estado: estable App · .NET MAUI Figma: 4489:16322 Uso: listas / filtros

### Resumen

#### Cuándo usarlo

- Para seleccionar una opción desde una lista extensa (especialidades, sedes, ciudades).
- Para filtros de citas, servicios o resultados en móvil.
- Cuando la tarea debe permanecer en el contexto actual sin cambiar de pantalla.
- Cuando se necesita búsqueda, scroll interno o acciones aplicar / limpiar.

#### Do

Handle visible, campo de búsqueda accesible y opciones táctiles de mínimo 56 px.

#### Don't

No uses el bottom sheet para flujos de varios pasos ni para acciones destructivas de alto impacto.

Si la tarea tiene más de un paso consecutivo o requiere confirmar datos críticos, usa una pantalla dedicada o un modal.

### Variantes

#### Lista con búsqueda

Campo de búsqueda + lista de opciones con scroll. Ideal para selección de especialidad, centro o ciudad.

#### Filtros

Grupos de chips de selección múltiple con acciones Aplicar / Limpiar en la zona inferior.

### Estados del ítem

#### Default

#### Hover

#### Focus

#### Seleccionado

### Modos

#### Light

#### Dark

#### Alto contraste

### Propiedades CSS

Variables personalizables del componente. Todas se declaran en el selector raíz `.mp-bottom-sheet` y pueden sobreescribirse en contexto.

Propiedad Valor por defecto
`--mp-bs-width` 390px
`--mp-bs-bg` var(--use-surface-white, #fff)
`--mp-bs-text` var(--use-text-primary, #111)
`--mp-bs-muted` var(--use-text-tertiary, #666)
`--mp-bs-border` var(--use-border-subtle, #e0e0e0)
`--mp-bs-handle` #79747e (M3 outline)
`--mp-bs-shadow` 2px 5px 16px rgba(0,0,0,.15)
`--mp-bs-chip-bg` #f3f0fa (violet-50)
`--mp-bs-chip-text` #5d4992 (violet-700)
`--mp-bs-chip-active-bg` #775ebb (violet-600)
`--mp-bs-chip-active-text` var(--base-neutral-white, #fff)

### Accesibilidad

#### Roles y atributos ARIA

- El panel raíz lleva `role="dialog"`, `aria-modal="true"` y `aria-label` o `aria-labelledby`.
- El botón handle tiene `aria-label="Arrastrar o cerrar"`.
- El campo de búsqueda usa `<label>` o `aria-label` explícito.
- Cada chip de filtro usa `aria-pressed` para reflejar el estado seleccionado.
- Los grupos de filtros usan `<section>` con `aria-labelledby` apuntando al título del grupo.

#### Checklist QA

- Handle visible en todos los modos (Light, Dark, Alto contraste).
- Panel se cierra al tocar/pulsar el handle o al presionar Esc.
- Foco queda atrapado dentro del sheet mientras está abierto.
- Ítems de lista con min-height 56 px (área táctil mínima).
- Chips de filtro responden correctamente a tap/clic y actualizan `aria-pressed`.
- Botón "Aplicar" aplica los filtros seleccionados y cierra el panel.
- Botón "Limpiar" deselecciona todos los chips del panel.
- Contraste de texto ≥ 4.5:1 en todos los modos.
- Chips de filtro activos (#775ebb/#fff): contraste verificado ≥ 4.5:1.

### Pendiente de documentación

La página de origen no trae contenido para: Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/app/carga-infinita.md -->
## Carga infinita

> Fuente: `docs/app/components/carga-infinita.html` · Plataforma: App · Sistema de diseño v2.5.0

Patrón para listados largos en móvil. Se muestra una primera tanda y el usuario carga la siguiente con el gesto de deslizar hacia arriba al llegar al final de la lista (efecto swap) o con el botón «Cargar más». Cada tanda se agrega debajo de las anteriores.

Estado: estable App · .NET MAUI Figma: 8658:24679 Flujo: Efecto swap

### Resumen

#### Cuándo usarlo

- Listados que crecen con el tiempo y se consultan en orden: solicitudes, citas, resultados, historial.
- Cuando el usuario suele revisar los primeros registros y solo a veces necesita los anteriores.
- Cuando cargar todo de una vez afecta el rendimiento de la app o el consumo de datos.

#### Disparadores de carga

- **Gesto swap:** deslizar hacia arriba (empujar) estando al final de la lista.
- **Botón «Cargar más»:** siempre disponible como alternativa sin gesto. También reintenta tras un error.

#### Do

Lotes de 7 registros, indicador del avance («Mostrando 7 de 18») y botón visible como alternativa al gesto.

#### Don't

No cargues solo al gesto, no reemplaces las tarjetas ya cargadas y no uses el patrón para listas cortas (hasta 10 registros).

Si el usuario necesita saltar a una posición concreta o buscar, usa filtros o búsqueda; la carga infinita no permite ir a «la página 5».

### Anatomía

El pie del listado muestra un solo estado a la vez. El botón terciario se mantiene debajo en reposo, cargando y error.

1. **Lista de tarjetas.** Cada tanda se agrega debajo de la anterior; las tarjetas ya cargadas no se reemplazan.
2. **Indicador del gesto.** Barra de 36 × 4 px con opacidad 40 % y el texto «Desliza hacia arriba para cargar más».
3. **Contador.** «Mostrando X de Y solicitudes». Se oculta en el estado de error.
4. **Botón «Cargar más».** `mp-btn mp-btn--terciario`, alto mínimo 48 px. Alternativa al gesto y reintento tras error. Se oculta cuando no hay más registros.

### Demo interactivo

Lista ficticia de 18 solicitudes en tandas de 7. Desliza hacia arriba al final (rueda, arrastre con mouse o táctil) o usa el botón. Datos ficticios.

### Estados

Los seis estados están aprobados y diseñados en Figma (sección Swap).

#### Reposo

Figma 8655:24380. Indicador del gesto, contador y botón.

#### Cargando

Figma 8657:139. Spinner del DS con «Cargando más solicitudes…». El botón se ve inactivo y no actúa.

#### Error con reintento

Figma 8923:25318. `mp-alert--error` con título y mensaje. El reintento es el botón «Cargar más». El gesto no reintenta.

#### Fin de lista

Figma 8908:24622. Texto «No hay más solicitudes para mostrar» y sin botón.

#### Vacío Estable

Figma 8954:26680. Primera carga sin registros. Usa `mp-empty-state` y no muestra pie de carga.

#### Ítem skeleton Estable

Figma 8954:26839. Solo para la primera carga de la pantalla. En las tandas siguientes se usa el spinner del pie.

### Reglas de comportamiento

Valores tomados del flujo «Efecto swap». Los valores de rendimiento deben validarse con datos reales.

ReglaValor
`Registros por tanda`7 (Figma, aprobado). Rango recomendado de 5 a 10; el equipo técnico lo ajusta según rendimiento.
`Gesto swap`Solo cuenta si la lista ya está al final y el arrastre hacia arriba supera 48 px.
`Rueda / trackpad`Acumula 80 px de desplazamiento tras 700 ms de haber llegado al final, para ignorar la inercia.
`Botón «Cargar más»`Siempre visible mientras haya registros. Durante la carga se ve inactivo y no actúa.
`Cargas simultáneas`Una sola. Se ignora cualquier disparador mientras carga.
`Error`Alerta de error en el pie. El gesto queda deshabilitado; el usuario reintenta con el botón.
`Fin de lista`Se oculta el botón y se muestra el texto de fin, sin spinner. Decisión aprobada sobre el Figma 8908:24622.
`Foco`Si la carga viene del botón, el foco pasa a la primera tarjeta nueva. Si falla, el foco vuelve al botón.
`Animación de entrada`Tarjetas nuevas: 280 ms, desplazamiento de 12 px. Se desactiva con `prefers-reduced-motion`.

Rendimiento: con más de 100 registros cargados, el equipo técnico debe evaluar virtualización de la lista (reciclar vistas) para no degradar la app.

### Modos

El patrón usa solo tokens semánticos del sistema; no define colores propios.

#### Light

#### Dark

#### Alto contraste

### Implementación en .NET MAUI

Este patrón no agrega componentes nuevos al core: se arma con la alerta, el loading, el botón terciario y el empty state existentes. La tabla orienta al equipo de desarrollo y debe validarse en la implementación.

NecesidadReferencia sugerida
`ListaCollectionView` con `ItemsSource` incremental.
`Carga por cercanía al finalRemainingItemsThreshold` y `RemainingItemsThresholdReachedCommand` sirven si se acepta carga automática. Este patrón carga con gesto o botón, por lo que el comando se invoca solo desde ellos.
`Gesto swapPanGestureRecognizer` o `SwipeGestureRecognizer` sobre el pie, activo solo con la lista al final. Umbral de 48 px.
`Pie de listaFooter` / `FooterTemplate` con el estado actual (reposo, cargando, error o fin).
`Anuncios accesiblesSemanticScreenReader.Announce` para carga, éxito, error y fin.

### Accesibilidad

#### Roles y atributos

- El gesto no es la única vía: el botón «Cargar más» es la alternativa para teclado, lector de pantalla y control por switch.
- Región con `role="status"` y `aria-live="polite"` que anuncia: «Cargando más solicitudes…», «Se cargaron 7 solicitudes más. Mostrando 14 de 18», el error y el fin de la lista.
- La alerta de error no usa `role="alert"`; se anuncia por la región en vivo para no duplicar el mensaje.
- La lista usa `<ul>` con `aria-label`; cada tarjeta incluye número de radicado y estado en su etiqueta.
- El indicador del gesto y el spinner son decorativos (`aria-hidden="true"`).

#### Checklist QA

- Carga con gesto y con botón; ambas agregan la misma cantidad de registros.
- Con la lista fuera del final, el gesto no dispara la carga.
- Durante la carga no se inicia otra carga.
- Tras el error, el botón reintenta y el gesto no.
- En fin de lista se oculta el botón y no hay más peticiones.
- Foco visible y orden lógico; el foco pasa a la primera tarjeta nueva al cargar con el botón.
- Contraste ≥ 4.5:1 en Light, Dark y Alto contraste.
- Zoom de texto al 200 % sin solapamientos ni texto cortado.
- Con movimiento reducido no hay animación de entrada ni rebote del indicador.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/app/dropdown.md -->
## Dropdown / Select App

> Fuente: `docs/app/components/dropdown.html` · Plataforma: App · Sistema de diseño v2.5.0

Permite seleccionar una o varias opciones dentro de una lista. En App conserva el dropdown base y suma una variante móvil tipo bottom sheet para listas largas o con búsqueda.

Estado: estable Versión 1.0 App · .NET MAUI Bottom sheet compatible Categoría: formulario Figma: 4489:16322

### Resumen

#### ¿Cuándo usar este componente?

Usa el dropdown cuando el usuario debe elegir una opción de una lista predefinida (más de 4 opciones). En móvil, usa bottom sheet cuando la lista supera 8–10 ítems o necesita búsqueda.

#### ¿Cuándo NO usarlo?

Evítalo para acciones destructivas o flujos que requieran confirmación; usa un diálogo modal en su lugar. Para pocas opciones (2–3) prefiere radio buttons visibles.

#### Variantes disponibles

- **Simple** — selección de un único ítem
- **Con búsqueda** — filtro de texto dentro del panel
- **Múltiple** — selección de varios ítems con chips
- **Con grupos** — opciones organizadas en categorías
- **Bottom sheet** — lista móvil persistente desde la parte inferior

#### Clases base

`.mp-dropdown-group · .mp-dropdown · .mp-dropdown__trigger · .mp-dropdown__panel · .mp-dropdown__option`

### Variante App: bottom sheet

Para listas largas en móvil, el select abre un panel inferior con búsqueda, scroll interno y opciones táctiles de 48 px mínimo.

#### Reglas App

- Usa bottom sheet para más de 8 opciones o listas con búsqueda.
- El panel ocupa el ancho del dispositivo y se ancla al borde inferior.
- El drag handle mantiene 32 × 4 px y radio completo.
- Las opciones usan texto mínimo de 16 px y padding horizontal de 16 px.

### Estados

Default
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Hover
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Focus
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Con valor
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Error
Bogotá D.C.
Medellín
Cali
Barranquilla
Este campo es requerido
Disabled
Campo deshabilitado

### Comportamiento

#### Apertura y cierre

El panel se abre al hacer clic en el trigger o al presionar Enter/Space. Se cierra al seleccionar una opción, al presionar Escape o al hacer clic fuera del componente. El trigger cambia `aria-expanded` a `true` y el caret rota 180°.

#### Navegación por teclado

↑↓ navega entre opciones. Enter/Space selecciona. Escape cierra sin cambio. Home/End van al primer/último ítem. Escritura de caracteres filtra en modo búsqueda.

#### Posición del panel

El panel se posiciona debajo del trigger por defecto. Si no hay espacio visible se puede invertir a la posición superior (flip). El ancho del panel iguala al del trigger.

#### Selección múltiple

Cada opción seleccionada se muestra como chip dentro del trigger. El panel permanece abierto hasta que el usuario lo cierra. Los chips muestran un botón de remoción individual.

#### Búsqueda integrada

En modo búsqueda, el campo de texto se ubica en la parte superior del panel con borde inferior separador. El filtro actúa sobre el texto de cada opción y muestra el estado vacío si no hay coincidencias.

#### Grupos de opciones

Los encabezados de grupo no son seleccionables, se muestran en mayúsculas 11 px y no reciben foco. Los grupos se separan con un divider de 1 px.

### Guías de contenido

#### Label

Siempre presente. Primera letra en mayúscula, resto en minúscula. Evitar verbos; usar sustantivos descriptivos. Ejemplo: «Ciudad de residencia», no «Selecciona tu ciudad».

#### Placeholder

«Seleccionar» por defecto cuando el campo está vacío. No uses el placeholder como sustituto del label. El placeholder desaparece al seleccionar una opción.

#### Opciones

Ordenar alfabéticamente salvo razón semántica (ej. frecuencia de uso). Máximo 40–50 caracteres por opción. Primera letra en mayúscula.

#### Texto de apoyo

Opcional. Explica qué tipo de información se espera o añade restricciones relevantes. En estado error, reemplaza el helper con el mensaje de error específico.

#### Mensaje de error

Concreto y accionable. Ejemplo: «Debes seleccionar al menos una ciudad» en lugar de «Campo requerido».

#### Grupos

Los encabezados de grupo deben ser cortos (1–2 palabras). En mayúsculas sostenidas. No deben repetir la información del label del componente.

### Accesibilidad

#### Roles ARIA obligatorios

- Wrapper: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls="[panel-id]"`
- Panel: `role="listbox"` (simple) o `role="listbox" aria-multiselectable="true"` (múltiple)
- Opción: `role="option"`, `aria-selected`
- Opción deshabilitada: `aria-disabled="true"`
- Campo requerido: `aria-required="true"`
- Estado de error: `aria-invalid="true"`, `aria-describedby`

#### Interacción por teclado

- Tab — mueve el foco al trigger
- Enter / Space — abre el panel o selecciona la opción activa
- ↑ / ↓ — navega entre opciones (mueve `aria-activedescendant`)
- Escape — cierra el panel, devuelve el foco al trigger
- Home / End — primera / última opción

#### Contraste mínimo

4.5:1 para texto de opción y label. El estado focus debe ser perceptible sin depender solo del color.

### Responsive

El trigger ocupa el 100% del ancho de su contenedor. El panel iguala ese ancho. En viewport ≤ 480 px el panel puede expandirse a pantalla completa con un overlay para mejorar la usabilidad en touch. Las opciones mantienen el mínimo de 48 px de altura táctil.

### Tokens usados

`--use-border-subtle`
Borde default del trigger
`--use-border-hover`
Borde en hover (naranja brand)
`--use-border-strong`
Borde en active / mousedown
`--use-primary-default`
Borde focus y estado open
`--use-surface-white`
Fondo del trigger y panel
`--use-text-primary`
Texto del valor seleccionado
`--use-text-tertiary`
Placeholder y caret
`--use-surface-theme-gray-5`
Fondo de opción en hover
`--use-state-error-mandatory`
Asterisco requerido
`--use-state-error-icon`
Borde en estado error
`--use-surface-subtle`
Fondo del trigger disabled
`--use-primary-default (12%)`
Fondo de chip multi-select

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Propiedades / API. No se completa con suposiciones.

---

<!-- archivo: components/app/header.md -->
## Header App

> Fuente: `docs/app/components/header.html` · Plataforma: App · Sistema de diseño v2.5.0

Barra superior móvil para pantallas App. Incluye zona segura, navegación contextual, marca o título y acciones rápidas.

Estado: estable App · .NET MAUI Figma: 4485:16287 Altura: 88 px

### Resumen

#### Cuándo usarlo

- Como cabezote principal en pantallas App.
- Para mostrar marca en home o título en vistas internas.
- Cuando se requiere acción rápida como notificaciones.
- Respeta la zona segura superior del dispositivo.

#### Do

Usa título corto o marca clara, con iconos de 32 px y contraste alto.

### Consentimiento

#### Don't

No cargues el header con textos largos ni acciones que compitan por el centro visual.

Autorizaciones y consentimientos de medicina prepagada pendientes

### Variantes

#### Home

compensarmedicina
prepagada

#### Pantalla interna

### Estados

#### Default

#### Pressed

#### Focus

#### Disabled

### Pendiente de documentación

La página de origen no trae contenido para: Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/app/tabs.md -->
## Tabs App

> Fuente: `docs/app/components/tabs.html` · Plataforma: App · Sistema de diseño v2.5.0

Navegación móvil para alternar entre vistas del mismo nivel. Basado en el componente App de Figma y orientado a implementación .NET MAUI.

Estado: estable App · .NET MAUI Figma: 4010:11030 Altura: 48 / 64 px

### Resumen

#### Cuándo usarlo

- Para cambiar entre vistas hermanas en una pantalla móvil.
- Cuando las opciones son entre 2 y 4 en tabs fijos.
- Cuando hay más opciones, usa versión scrollable con ancho de tab estable.
- Evita usarlos como navegación global principal; para eso usa Shell o bottom navigation.

#### Do

Labels cortos, jerarquía clara y un indicador visible para la pestaña activa.

#### Don't

No uses labels extensos ni demasiadas opciones en tabs fijos.

Consulta médica general Medicamentos pendientes Autorizaciones por revisar

### Variantes

#### Primary · label only

#### Primary · label & icon

#### Secondary

#### Scrollable

### Estados

#### Default

#### Active

#### Disabled

#### Focus

### Pendiente de documentación

La página de origen no trae contenido para: Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/accordion.md -->
## Accordion

> Fuente: `docs/transversales/components/accordion.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Organiza contenido en paneles colapsables para reducir carga visual y permitir que el usuario consulte detalles solo cuando los necesita.

Estado: estable Versión 1.0 Web / App Categoría: contenido Figma: 4622:76590

### Resumen

#### Cuándo usarlo

- Para preguntas frecuentes o contenido de soporte.
- Para detalles secundarios que no deben ocupar toda la página.
- Para agrupar secciones independientes de información.
- Cuando el usuario puede decidir qué bloque consultar.

#### Do

Usa títulos claros y contenido breve dentro de cada panel.

Incluye atención de urgencias según el plan contratado.

#### Don't

No escondas pasos obligatorios ni información crítica que el usuario deba ver completa.

Formulario completo oculto

### Estados

#### Default

Ítem disponible.

#### Abierto

Panel expandido.

#### Cerrado

Panel colapsado.

#### Hover

Indica interacción.

#### Focus

Visible con teclado.

### Comportamiento y reglas

- El trigger completo debe ser clicable.
- Permite múltiples paneles abiertos salvo que el flujo pida modo exclusivo.
- Usa títulos breves y descriptivos.
- No ocultes acciones críticas ni pasos obligatorios.

### Accesibilidad

- El trigger es un `button` con `aria-expanded`.
- El panel usa `role="region"` y referencia al trigger.
- Tab, Enter y Space deben funcionar nativamente.
- Focus visible en todos los modos de color.

### Checklist QA

- Trigger usa texto mínimo de 16 px y componente real `mp-accordion`.
- Chevron 24 px rota al abrir/cerrar.
- Hover y focus son evidentes en los estados interactivos.
- El panel actualiza `aria-expanded` y altura al interactuar.
- Light, Dark y High Contrast mantienen contraste correcto.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/alerts.md -->
## Alertas

> Fuente: `docs/transversales/components/alerts.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Comunican información relevante sobre el estado de una acción o del sistema. Esta página documenta la alerta contextual integrada en el contenido.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: feedback Tipo: contextual

### Contextual (Inline / Banner)

Mensaje integrado dentro de la interfaz. Se usa para validaciones en formularios, mensajes informativos y advertencias no críticas.

#### Características

- No bloquea la interacción.
- Aparece cerca del contenido relacionado.
- Puede ser persistente dentro del flujo.

#### Ubicación

- Dentro de formularios.
- Bajo o sobre el elemento afectado.
- En bloques o secciones específicas.
- Siempre visible en el flujo de lectura.

**Notification title**Notification message. **Notification title**Notification message. **Notification title**Notification message.

### Resumen

#### Cuándo usarlo

- Validaciones dentro de formularios o secciones específicas.
- Información que ayuda a completar una acción.
- Advertencias no críticas dentro del flujo.
- Feedback contextual que no debe bloquear al usuario.

#### Do

Usa el tipo correcto y ubícalo cerca del contenido relacionado.

Solicitud enviada

Recibirás la confirmación en tu correo.

#### Don’t

No dupliques mensajes ni uses alertas para decisiones que requieren confirmación.

Revisa todo

Mensaje ambiguo y poco accionable.

### Estados

Info
Success
Warning
Error

### Comportamiento

- Aparece tras una acción, evento o validación.
- No bloquea la interacción cuando es contextual.
- Puede ser persistente o temporal según el patrón que lo use.
- Si tiene cierre, el botón debe ser accesible por teclado.

### Guías de contenido

- Usa mensajes claros, visibles y accionables.
- Prioriza claridad sobre cantidad de información.
- No dupliques mensajes para la misma acción.
- Usa el tipo correcto: info, success, warning o error.

### Accesibilidad

- Contraste mínimo 4.5:1.
- No depender solo del color: incluir icono y texto.
- Usar `role="status"` para información y `role="alert"` para errores importantes.
- El cierre debe tener `aria-label` descriptivo.

### Responsive

#### Desktop

Puede ocupar el ancho de la sección o mantener ancho contextual.

#### Tablet

Mantiene padding 16 px y lectura en dos líneas cuando aplique.

#### Mobile

Debe ajustarse a una columna sin truncar texto ni icono.

### Tokens usados

`--space-16`16px · padding interno y gap success/warning.
`--space-8`8px · gap info/error observado en Figma.
`--space-4`4px · separación entre título y cuerpo.
`--use-state-info-bg`#e6f1fb · fondo info light.
`--use-state-success-bg`#e6f7e8 · fondo success light.
`--use-state-warning-bg`#fff2d9 · fondo warning light.
`--use-state-error-bg`#f7eeed · fondo error light.
`--font-size-md`16px · título Roboto SemiBold.

### Código

Descarga estilos planos del componente transversal, unidos al core y organizados por modo.

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/transversales/avatar.md -->
## Avatar / User chip

> Fuente: `docs/transversales/components/avatar.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Representa una persona mediante foto, iniciales o icono, y puede combinarse con nombre y metadata en headers, cards, listas y menús de usuario.

Estado: estable Web / App Categoría: identidad Header / cards / listas

### Resumen

#### Cuándo usarlo

- Para identificar al usuario actual en headers o menús de sesión.
- Para mostrar profesionales, asesores o pacientes en cards y listados.
- Para agrupar participantes en un contexto de equipo o atención.
- Cuando la foto no existe, usa iniciales; si no hay nombre, usa icono.

#### Do

Usa foto o iniciales con texto visible cuando el usuario necesita reconocer a la persona.

#### Don't

No uses una imagen sin alternativa visible si la identidad es crítica.

Sin nombre ni contexto

### Variantes

#### Foto

#### Iniciales

AR

#### Icono

#### User chip

### Estados

#### Default

#### Hover

#### Focus

#### Compact

### Pendiente de documentación

La página de origen no trae contenido para: Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/badges.md -->
## Chips / Tags / Badges

> Fuente: `docs/transversales/components/badges.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Familia de pastillas compactas para filtrar, categorizar o comunicar estados. Comparten estructura visual, pero cada una tiene una intención distinta.

Estado: estable Versión 1.0 Web / App Categoría: indicadores Figma: 4610:73562

### Resumen

#### Cuándo usarlo

- Chips: cuando el usuario filtra, selecciona o ejecuta una acción rápida.
- Tags: cuando necesitas clasificar contenido sin interacción.
- Badges: cuando debes comunicar estado, prioridad o conteo.
- Cuando el texto corto ayuda a escanear información en tablas, cards o filtros.

#### Do

Usa cada variante según su intención de interacción o lectura.

Afiliado   Activo

#### Don't

No uses un badge como botón ni un chip para comunicar estados estáticos.

Eliminar filtro

### ¿Cuál usar?

###### Chip

Interactivo

El usuario lo presiona, selecciona o descarta. Cambia de estado.

- Filtros activos o toggleables
- Selección múltiple
- Acciones rápidas con ícono de cierre

`<button>` · `aria-pressed`

###### Tag

No interactivo

Solo clasifica o etiqueta. Nunca responde a clics ni comunica estados de proceso.

- Categorías de contenido
- Etiquetas en tablas o cards
- Tipo de usuario o plan

`<span>` · solo lectura

###### Badge

Estado / conteo

Comunica estado, prioridad o conteo numérico. Nunca es clicable por sí solo.

- Estado de un registro (Activo, Vencido)
- Prioridad o nivel de alerta
- Contadores sobre íconos o avatares

`<span>` · `role="img"` + `aria-label`

|  | Chip | Tag | Badge |
| --- | --- | --- | --- |
| **Interactivo** | ✅ Sí | ❌ No | ❌ No |
| **Elemento HTML** | `<button>` | `<span>` | `<span>` |
| **Comunica estado** | Seleccionado / activo | Categoría / tipo | Estado / prioridad / conteo |
| **Clase base** | `.mp-chip` | `.mp-tag` | `.mp-badge` |
| **ARIA requerido** | `aria-pressed` | Ninguno adicional | `role="img"` + `aria-label` |

### Estados interactivos

#### Default

Estado base disponible.

#### Hover

Se evidencia solo en chips interactivos.

#### Focus

Anillo visible para navegación con teclado.

#### Seleccionado

Comunica filtros o selecciones activas.

#### Disabled

No permite interacción.

### Comportamiento y reglas

- Usa chips solo cuando hay interacción.
- Usa tags para clasificación no interactiva.
- Usa badges para estados y evita depender solo del color.
- Mantén textos cortos para lectura rápida.

### Accesibilidad

- Los chips deben exponer estado con `aria-pressed` cuando sean seleccionables.
- Los badges de estado deben tener texto claro o `aria-label`.
- No comuniques estados únicamente con color.
- El área clicable mínima para chips es 44 px.

### Checklist QA

- Verificar Light, Dark y High Contrast.
- Confirmar que chips muestran hover, focus, selected y disabled.
- Validar textos cortos sin desbordes.
- Probar que HTML, CSS y Sass del visualizador se copian completos.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/buttons.md -->
## Botón

> Fuente: `docs/transversales/components/buttons.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Permite ejecutar acciones principales, secundarias o de apoyo dentro de la interfaz. Guía la interacción, la toma de decisiones y la jerarquía visual de cada pantalla.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: acción

### Resumen

#### Cuándo usarlo

- Para ejecutar acciones principales del flujo.
- Para confirmar, guardar o continuar una tarea.
- Para navegar a la siguiente etapa con una acción explícita.
- Para acciones de apoyo que no compitan con la acción primaria.

#### Do

Usa jerarquía clara y etiquetas accionables.

#### Don't

No uses textos ambiguos ni jerarquías confusas.

### Estados

Default
Hover
Focus
Active
Disabled
Loading

#### Texto con enlace

Si no hay acción, usa texto plano. Si navega a otra vista o URL, usa un enlace `<a>` con los tokens existentes del sistema.

##### Enlace con tag a

Usa el color de enlace existente: `--use-text-link`, expuesto como `--color-text-link` y utilidad `.mp-text-link`.

Color `--use-text-link`
Default Ver términos y condiciones
Hover Ver términos y condiciones

### Comportamiento

#### Click

Ejecuta la acción asociada al hacer clic, Enter o Space.

#### Loading

Muestra progreso y debe evitar doble activación.

#### Error

El feedback se comunica fuera del botón con mensaje contextual.

#### Responsive

Puede ocupar el ancho disponible cuando el flujo lo requiera.

### Guías de contenido

#### Textos correctos

Usa verbos claros y directos.

Guardar Enviar Continuar

#### Textos incorrectos

Evita palabras genéricas o confusas.

Hacer Click aquí Ir

### Accesibilidad

- Navegación por teclado con Tab; activación con Enter y Space.
- Focus visible en todos los estados.
- Contraste mínimo AA 4.5:1 para texto y controles.
- Botones solo icono requieren `aria-label` descriptivo.
- No depender solo del color para comunicar estados.

### Responsive

#### Desktop

Usa ancho hug content salvo acciones principales en layouts amplios.

#### Tablet

Mantiene altura y padding; puede agruparse en filas flexibles.

#### Mobile

Puede usar full width para acciones críticas y conserva área táctil mínima.

### Tokens usados

`--base-brand-80`#FF6600 · inicio del gradiente primario
`--base-brand-90`#E63F0C · final del gradiente primario
`--radius-md`24px · border-radius/md
`--space-12`12px · padding vertical con iconos
`--space-16`16px · gap e icon padding cercano
`--space-32`32px · padding de solo texto y lado sin icono
`--font-size-btn`16px · texto del botón
`--font-weight-bold`700 · peso tipográfico

### Código

Descarga estilos planos del botón, unidos al core y listos para validar en dummy con tokens Figma.

```html
<button class="mp-btn mp-btn--primario" type="button">
  Guardar
</button>
```

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/transversales/cards.md -->
## Cards

> Fuente: `docs/transversales/components/cards.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Contenedores que agrupan información relacionada dentro de una interfaz. Organizan contenido, facilitan la lectura y permiten acciones dentro de un mismo bloque.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: contenido

### Resumen

#### Cuándo usarlo

- Para mostrar información agrupada y fácil de escanear.
- Para resultados de búsqueda, servicios, beneficios o contenido resumido.
- Para agrupar contenido con una acción principal clara.
- Para construir vistas modulares en grillas responsive.

#### Do

Usa una jerarquía simple: imagen opcional, título, texto breve y acción principal.

#### Programa bienestar

Resumen corto del beneficio principal.

#### Don't

No mezcles múltiples prioridades ni conviertas la card en una página completa.

#### Demasiada información

Texto extenso, varias acciones principales, estados mezclados y contenido sin jerarquía reducen la claridad.

### Estados

#### Default

Card disponible sin énfasis de interacción.

#### Hover

Indica que la card o su acción puede ejecutarse.

#### Focus

El foco debe ser visible cuando la card es interactiva.

#### Disabled

Reduce énfasis y bloquea interacción.

### Variantes

#### Vertical

Uso principal para contenido resumido con media opcional.

#### Horizontal

Útil cuando la imagen acompaña una pieza de contenido más breve.

#### Compacta

Para listados densos o agrupaciones con menos contenido.

#### Interactiva

Debe tener foco visible y una acción claramente definida.

### Responsive

En pantallas pequeñas, la card se ajusta al ancho disponible y la variante horizontal se apila para conservar legibilidad.

- Usa grillas Bootstrap para distribuir cards.
- Evita alturas fijas cuando el contenido sea variable.
- Mantén el orden: imagen, contenido y acciones.

### Código

```html
<article class="mp-card mp-card--raised">
  <img class="mp-card__media"
       src="https://picsum.photos/id/1011/800/450"
       alt="Persona caminando al aire libre">
  <div class="mp-card__content">
    <header class="mp-card__header">
      <div>
        <h3 class="mp-card__title">Programa bienestar</h3>
        <p class="mp-card__subtitle">Beneficio destacado</p>
      </div>
    </header>
    <p class="mp-card__body">Encuentra servicios y acompañamiento para cuidar tu bienestar.</p>
    <footer class="mp-card__footer">
      <button type="button" class="mp-btn mp-btn--primario">Conocer más</button>
    </footer>
  </div>
</article>
html
<mp-card
  variant="raised"
  imageSrc="https://picsum.photos/id/1011/800/450"
  imageAlt="Persona caminando al aire libre"
  title="Programa bienestar"
  subtitle="Beneficio destacado"
  actionLabel="Conocer más"
  (action)="openProgram()">
  Encuentra servicios y acompañamiento para cuidar tu bienestar.
</mp-card>
html
{# Variables: card #}
<article class="mp-card {{ card.variant ? 'mp-card--' ~ card.variant }}">
  {% if card.image %}
    <img class="mp-card__media" src="{{ card.image.src }}" alt="{{ card.image.alt }}">
  {% endif %}
  <div class="mp-card__content">
    <h3 class="mp-card__title">{{ card.title }}</h3>
    <p class="mp-card__body">{{ card.body }}</p>
  </div>
</article>
```

### API del componente

| Propiedad | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `variant` | `vertical \| raised \| compact \| horizontal \| interactive` | `vertical` | Define presentación y comportamiento visual. |
| `imageSrc` | `string` | - | Imagen real opcional. No recibe filtros por tema. |
| `title` | `string` | - | Título principal de la card. |
| `disabled` | `boolean` | `false` | Reduce énfasis y desactiva interacción cuando aplica. |
| `action` | `EventEmitter \| callback` | - | Evento de la acción principal o de la card interactiva. |

### Accesibilidad

Contraste
Texto, borde y acciones deben mantener contraste AA; en alto contraste el contenedor usa borde blanco sólido.
Foco visible
Si la card es interactiva, debe poder enfocarse y mostrar un indicador visible.
Texto alternativo
Las imágenes informativas requieren `alt`; las decorativas deben usar alt vacío.
Acción clara
Evita múltiples acciones principales y no dependas solo del hover para revelar interacción.

### Pendiente de documentación

La página de origen no trae contenido para: Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/dropdown.md -->
## Dropdown / Select

> Fuente: `docs/transversales/components/dropdown.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Permite seleccionar una o varias opciones dentro de una lista. Se usa cuando las opciones están predefinidas y se quiere evitar errores de entrada. Soporta selección simple, múltiple, búsqueda y grupos de opciones.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: formulario

### Resumen

#### ¿Cuándo usar este componente?

Usa el dropdown cuando el usuario debe elegir una opción de una lista predefinida (más de 4 opciones). Para 2–4 opciones considera radio buttons o chips. Usa el modo búsqueda cuando la lista supera 8–10 ítems.

#### ¿Cuándo NO usarlo?

Evítalo para acciones destructivas o flujos que requieran confirmación; usa un diálogo modal en su lugar. Para pocas opciones (2–3) prefiere radio buttons visibles.

#### Variantes disponibles

- **Simple** — selección de un único ítem
- **Con búsqueda** — filtro de texto dentro del panel
- **Múltiple** — selección de varios ítems con chips
- **Con grupos** — opciones organizadas en categorías

#### Clases base

`.mp-dropdown-group · .mp-dropdown · .mp-dropdown__trigger · .mp-dropdown__panel · .mp-dropdown__option`

### Estados

Default
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Hover
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Focus
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Con valor
Bogotá D.C.
Medellín
Cali
Barranquilla
Texto de apoyo
Error
Bogotá D.C.
Medellín
Cali
Barranquilla
Este campo es requerido
Disabled
Campo deshabilitado

### Comportamiento

#### Apertura y cierre

El panel se abre al hacer clic en el trigger o al presionar Enter/Space. Se cierra al seleccionar una opción, al presionar Escape o al hacer clic fuera del componente. El trigger cambia `aria-expanded` a `true` y el caret rota 180°.

#### Navegación por teclado

↑↓ navega entre opciones. Enter/Space selecciona. Escape cierra sin cambio. Home/End van al primer/último ítem. Escritura de caracteres filtra en modo búsqueda.

#### Posición del panel

El panel se posiciona debajo del trigger por defecto. Si no hay espacio visible se puede invertir a la posición superior (flip). El ancho del panel iguala al del trigger.

#### Selección múltiple

Cada opción seleccionada se muestra como chip dentro del trigger. El panel permanece abierto hasta que el usuario lo cierra. Los chips muestran un botón de remoción individual.

#### Búsqueda integrada

En modo búsqueda, el campo de texto se ubica en la parte superior del panel con borde inferior separador. El filtro actúa sobre el texto de cada opción y muestra el estado vacío si no hay coincidencias.

#### Grupos de opciones

Los encabezados de grupo no son seleccionables, se muestran en mayúsculas 11 px y no reciben foco. Los grupos se separan con un divider de 1 px.

### Guías de contenido

#### Label

Siempre presente. Primera letra en mayúscula, resto en minúscula. Evitar verbos; usar sustantivos descriptivos. Ejemplo: «Ciudad de residencia», no «Selecciona tu ciudad».

#### Placeholder

«Seleccionar» por defecto cuando el campo está vacío. No uses el placeholder como sustituto del label. El placeholder desaparece al seleccionar una opción.

#### Opciones

Ordenar alfabéticamente salvo razón semántica (ej. frecuencia de uso). Máximo 40–50 caracteres por opción. Primera letra en mayúscula.

#### Texto de apoyo

Opcional. Explica qué tipo de información se espera o añade restricciones relevantes. En estado error, reemplaza el helper con el mensaje de error específico.

#### Mensaje de error

Concreto y accionable. Ejemplo: «Debes seleccionar al menos una ciudad» en lugar de «Campo requerido».

#### Grupos

Los encabezados de grupo deben ser cortos (1–2 palabras). En mayúsculas sostenidas. No deben repetir la información del label del componente.

### Accesibilidad

#### Roles ARIA obligatorios

- Wrapper: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls="[panel-id]"`
- Panel: `role="listbox"` (simple) o `role="listbox" aria-multiselectable="true"` (múltiple)
- Opción: `role="option"`, `aria-selected`
- Opción deshabilitada: `aria-disabled="true"`
- Campo requerido: `aria-required="true"`
- Estado de error: `aria-invalid="true"`, `aria-describedby`

#### Interacción por teclado

- Tab — mueve el foco al trigger
- Enter / Space — abre el panel o selecciona la opción activa
- ↑ / ↓ — navega entre opciones (mueve `aria-activedescendant`)
- Escape — cierra el panel, devuelve el foco al trigger
- Home / End — primera / última opción

#### Contraste mínimo

4.5:1 para texto de opción y label. El estado focus debe ser perceptible sin depender solo del color.

#### Foco de la opción

La opción activa por teclado lleva un contorno interior de 2 px con `use/border/strong` (Light #666666 · Dark #E0E0E0 · Alto contraste #FFFFFF; en alto contraste el fondo de la opción es negro). El trigger conserva su propio foco.

### Responsive

El trigger ocupa el 100% del ancho de su contenedor. El panel iguala ese ancho. En viewport ≤ 480 px el panel puede expandirse a pantalla completa con un overlay para mejorar la usabilidad en touch. Las opciones mantienen el mínimo de 48 px de altura táctil.

### Tokens usados

`--use-border-subtle`
Borde default del trigger
`--use-border-hover`
Borde en hover (naranja brand)
`--use-border-strong`
Borde en active / mousedown
`--use-primary-default`
Borde focus y estado open
`--use-surface-white`
Fondo del trigger y panel
`--use-text-primary`
Texto del valor seleccionado
`--use-text-tertiary`
Placeholder y caret
`--use-surface-theme-gray-5`
Fondo de opción en hover
`--use-state-error-mandatory`
Asterisco requerido
`--use-state-error-icon`
Borde en estado error
`--use-surface-subtle`
Fondo del trigger disabled
`--use-primary-default (12%)`
Fondo de chip multi-select

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Propiedades / API. No se completa con suposiciones.

---

<!-- archivo: components/transversales/inputs.md -->
## Input / Campo de texto

> Fuente: `docs/transversales/components/inputs.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Captura información del usuario en formularios. Soporta texto, email, número, contraseña, teléfono, textarea y select con estados interactivos completos y soporte para íconos decorativos y accionables.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: formulario

### Resumen

#### Cuándo usarlo

- Para capturar texto libre: nombres, documentos, correos, contraseñas.
- Para seleccionar una opción de una lista corta y fija con `mp-select`.
- Para contenido de múltiples líneas con `mp-textarea`.
- Para campos de búsqueda con ícono decorativo.

#### Do

Usa siempre label visible y texto de apoyo cuando se necesite.

Como aparece en tu documento

#### Don't

No uses solo el placeholder como etiqueta del campo.

### Estados

Default
Texto de apoyo
Hover
Texto de apoyo
Focus
Texto de apoyo
Error
Mensaje de error
Success
Valor confirmado
Disabled
Campo deshabilitado

### Comportamiento

#### Foco

Al hacer clic o navegar con Tab el campo recibe foco con borde naranja y ring de 3 px.

#### Validación

El error se muestra en el helper text. No eliminar el label ni el campo al mostrar error.

#### Contraseña

El ícono derecho interactivo alterna visibilidad. Renderizado como botón con aria-label.

#### Responsive

El campo ocupa el ancho disponible del contenedor. Altura fija 56 px en todas las pantallas.

### Guías de contenido

#### Labels correctos

Concisos, descriptivos y siempre visibles.

Nombre completo Correo electrónico N.° de documento

#### Labels incorrectos

Ambiguos, redundantes o en mayúsculas.

Campo 1 Ingrese aquí NOMBRE

El placeholder es orientativo, no reemplaza la etiqueta. Los mensajes de error deben ser específicos: "Formato inválido. Ej: AF-12345" en lugar de "Campo inválido".

### Accesibilidad

- Cada campo tiene `<label for="…">` explícito. Nunca depender solo del placeholder.
- `aria-invalid="true"` + `aria-describedby` conectan el mensaje de error al campo para lectores de pantalla.
- Campos requeridos: asterisco con `aria-hidden="true"` más `required` y `aria-required="true"`.
- Íconos decorativos con `aria-hidden="true"`. Íconos accionables como `<button>` con `aria-label`.
- Focus visible en todos los estados. Contraste mínimo AA 4.5:1.
- Área táctil mínima 44 px. El campo tiene 56 px de altura.
- No depender solo del color para comunicar error o success.

### Responsive

#### Desktop

Ancho controlado por el contenedor. Recomendado máx. 480 px para campos de texto simples.

#### Tablet

Puede ocupar una o dos columnas en grids Bootstrap. Mantiene altura 56 px y padding 16 px.

#### Mobile

Full width del contenedor. Los íconos se mantienen alineados. Teclado virtual no afecta altura.

### Tokens usados

`--use-border-subtle` #e0e0e0 · borde por defecto (base-neutral-20)
`--use-border-hover` Naranja brand · borde en hover (= use-primary-hover)
`--use-border-strong` #666 · borde en active mousedown (base-neutral-70)
`--use-primary-default` #FF6600 · borde y ring en focus
`--use-state-error-icon` Rojo · borde en estado error
`--use-state-error-mandatory` #bb4945 · asterisco de campo requerido
`--radius-sm` 16 px · border-radius del campo (border-radius/sm)
`--use-surface-white` Blanco · fondo del campo (varía por tema)
`--use-text-primary` #111 · texto del campo y label
`--use-text-tertiary` #666 · placeholder e íconos decorativos
`--use-state-success-text` Verde · helper text en estado success
`--use-focus-outline` Azul · outline de focus-visible (accesibilidad)

### Código

Descarga estilos planos del input, unidos al core y listos para validar en dummy con tokens Figma.

```html
<div class="mp-input-group">
  <label class="mp-input-label" for="inp1">Nombre</label>
  <div class="mp-input-wrapper">
    <input class="mp-input-field" id="inp1" type="text" placeholder="Tu nombre">
  </div>
  <span class="mp-input-helper">Texto de apoyo</span>
</div>
```

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/transversales/loading.md -->
## Loading

> Fuente: `docs/transversales/components/loading.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Representa el estado en el que la información aún no ha cargado. Ayuda a reducir la incertidumbre del usuario y mejora la percepción de rendimiento del sistema.

Estado: estable Versión 1.0 Web Categoría: feedback Figma: 4610:73484

### Resumen

#### Cuándo usarlo

- Cuando los datos están en proceso de carga.
- Cuando hay transición entre vistas o actualización de resultados.
- Cuando se espera una respuesta breve del sistema.
- Para cargas cortas con mensaje visible de estado.

#### Do

Muestra el estado con animación y texto claro.

Estamos buscando opciones para ti...

#### Don't

No dejes una pantalla bloqueada sin mensaje ni salida esperada.

Cargando sin contexto

### Estados y variantes

#### Default

Spinner centrado con texto visible.

#### Inline

Acompaña acciones o mensajes compactos.

#### Overlay

Cubre un bloque mientras actualiza contenido.

#### Reducido

Debe conservar el texto y bajar intensidad.

### Comportamiento y reglas

- Se muestra mientras carga la información y desaparece automáticamente al terminar.
- No debe bloquear más tiempo del necesario.
- Evita tiempos largos sin feedback adicional.
- Mantén consistencia de tamaño y texto en toda la interfaz.

### Accesibilidad

- No dependas solo de la animación: conserva un texto visible.
- Usa `role="status"`, `aria-live="polite"` y `aria-busy="true"`.
- Mantén contraste adecuado en Light, Dark y High Contrast.
- Respeta usuarios con reducción de movimiento.

### Checklist QA

- Spinner mide 48 px por defecto y conserva proporciones en small/large.
- Texto visible usa 16 px y no se oculta en mobile.
- Light, Dark y High Contrast mantienen contraste correcto.
- El HTML expone `role="status"`, `aria-live` y `aria-busy`.
- Las descargas de CSS/Sass incluyen componente completo y animación separada.

### Pendiente de documentación

La página de origen no trae contenido para: Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/modals.md -->
## Modal

> Fuente: `docs/transversales/components/modals.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Componente que interrumpe el flujo para presentar información importante o solicitar una decisión del usuario.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: feedback Tipo: crítico / bloqueante

### Modal (Crítico)

Este tipo bloquea la interacción con el fondo y requiere una acción explícita antes de volver al flujo.

#### Características

- Bloquea la interacción con el fondo.
- Se muestra sobre overlay `#111` al 30%.
- Requiere acción del usuario.
- Tiene alta prioridad visual.

#### Ubicación

- Centrado en pantalla.
- Sobre fondo oscuro overlay.
- Nivel más alto de jerarquía visual.

### Resumen

#### Cuándo usarlo

- Confirmaciones importantes o irreversibles.
- Información crítica que exige lectura.
- Validaciones que detienen el flujo.
- Flujos guiados de pocos pasos.
- No usar para mensajes simples, listas largas o feedback temporal.

#### Do

Usa el modal cuando la decisión es necesaria para continuar.

#### Don’t

No lo uses para confirmaciones rápidas. Para eso usa toast.

Cambios guardados

La acción se completó.

### Tamaños ideales

**Pequeño · `.modal-sm`**

300 px. Para confirmaciones cortas y mensajes de una sola acción.

**Mediano · default**

479 px. Tamaño oficial observado en Figma y recomendado por defecto.

**Grande · `.modal-lg`**

800 px. Para contenido guiado, tablas pequeñas o formularios breves.

### Estados y tipos

**Info**

Información relevante que detiene el flujo para confirmar lectura.

**Success**

Confirmación importante después de una acción de alto impacto.

**Warning**

Advertencia previa a una decisión sensible o irreversible.

**Error**

Bloqueo del flujo por error que requiere corrección o salida.

### Comportamiento

**Apertura**

Se abre después de una acción y mueve el foco al modal.

**Bloqueo**

El overlay bloquea el contenido de fondo mientras el modal está activo.

**Teclado**

ESC cierra el modal y Tab mantiene el foco dentro del contenedor.

**Cierre**

Permite cerrar con X, acción secundaria, botón principal cuando aplique o ESC.

### Guías de contenido

#### Do

- Usa títulos directos que expliquen el problema o decisión.
- Redacta mensajes breves y accionables.
- Usa una sola acción primaria.

#### Don’t

- No incluyas textos largos o listas extensas.
- No uses etiquetas ambiguas como “Aceptar” si la acción es irreversible.
- No combines varias decisiones en el mismo modal.

### Accesibilidad

- Usar `role="dialog"` y `aria-modal="true"`.
- Conectar título con `aria-labelledby`.
- Conectar mensaje con `aria-describedby`.
- Devolver el foco al botón que abrió el modal.

- Focus visible en cierre y acciones.
- Contraste mínimo AA.
- No depender solo del color para comunicar tipo.
- No abrir múltiples modales simultáneamente.

### Responsive

**Desktop**

Centrado, con ancho máximo según tamaño y overlay completo.

**Tablet**

Mantiene el ancho máximo disponible y conserva margen lateral.

**Mobile**

Ocupa el ancho disponible con 16 px de margen lateral mínimo.

### Tokens usados

| Token / regla | Valor | Uso |
| --- | --- | --- |
| `use/surface/white` | #ffffff / modos | Fondo del modal |
| `use/border/default` | #cccccc | Borde del contenedor |
| `space/24` | 24 px | Padding interno y gap |
| `shadow/modal` | 2px 5px 16px rgba(0,0,0,.15) | Elevación Figma |
| Radio | 12 px | Radio del contenedor |
| Icono | 64 px / interno 32 px | Elemento visual de estado |
| Overlay | #111 · 30% | Bloqueo de fondo |

### Código

Ejemplos con estructura Bootstrap y clases productivas `mp-modal` del core.

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/transversales/pagination.md -->
## Paginación

> Fuente: `docs/transversales/components/pagination.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Permite navegar entre múltiples páginas de contenido cuando la información es extensa. Facilita la exploración de datos sin sobrecargar la interfaz.

Estado: estable Versión 1.0 Web Categoría: navegación Figma: 4610:71122

### Resumen

#### Cuándo usarlo

- Listados de información con muchos registros.
- Historiales de solicitudes, pagos o trámites.
- Resultados de búsqueda o filtros.
- Gestión de datos en tablas o cards.

#### Do

Muestra entre 5 y 7 páginas visibles y usa truncado cuando el total sea alto.

#### Don't

No muestres demasiados números ni dejes controles activos cuando no aplican.

### Estados especiales

#### Default

Estado base disponible.

#### Active

Página actual seleccionada.

#### Hover

Indica que el item es interactivo.

#### Focus

Visible al navegar con teclado.

#### Disabled

No permite interacción.

### Comportamiento y reglas

#### Comportamiento

- Indicar página actual con `aria-current="page"`.
- Permitir navegación directa y secuencial.
- Deshabilitar anterior o siguiente cuando no aplican.
- Mantener ubicación consistente cerca del contenido paginado.

#### Reglas de uso

- Usar en listados largos.
- No mostrar demasiados números.
- Usar truncado cuando hay muchas páginas.
- Por defecto, documentar 7 registros por página.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Propiedades / API, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/selection-controls.md -->
## Checkbox / Radio / Switch

> Fuente: `docs/transversales/components/selection-controls.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Permiten al usuario tomar decisiones dentro de la interfaz: selección múltiple, selección única y activación inmediata de opciones binarias.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: selección

### Resumen

#### Cuándo usarlo

- Checkbox: cuando se permiten varias opciones.
- Radio: cuando solo se permite una opción por grupo.
- Switch: cuando el cambio es inmediato y binario.
- Cuando la decisión necesita label visible y accesible.

#### Do

Usa el control que corresponda al tipo de decisión.

#### Don't

No uses switch para decisiones que requieren guardar o confirmar.

### Estados

Por defecto
Seleccionado
Error
Disabled

### Comportamiento

- Checkbox permite múltiples selecciones y puede marcarse o desmarcarse.
- Radio solo permite una selección activa por grupo.
- Switch alterna entre dos estados y aplica el cambio de inmediato.
- Todos deben responder a click, Enter y Space.

### Guías de contenido

- Usa labels breves, claros y accionables.
- Evita preguntas ambiguas o dobles negaciones.
- El texto de apoyo debe explicar error, requisito o consecuencia.
- En switch, el label debe describir qué se activa o desactiva.

### Accesibilidad

- Área mínima: 44 x 44 px (Checkbox y Radio). Switch: área interactiva de 52 x 44 px, con track de 52 x 32 px y knob de 28 x 28 px, centrados verticalmente.
- Label asociado al control mediante estructura de label/input.
- Focus visible obligatorio: contorno de 3 px con `use/border/strong` en Checkbox, Radio y Switch. El Switch deshabilitado no recibe foco.
- No depender solo del color para error o selección.
- Grupos radio deben usar `name` compartido.

### Responsive

#### Desktop

Se agrupan en listas o columnas según el formulario.

#### Tablet

Mantienen área táctil y separación entre opciones.

#### Mobile

Usar una opción por fila cuando haya labels largos.

### Tokens usados

`--space-8`8px · gap entre control y label.
`--use-primary-default`Color seleccionado en light y alto contraste.
`--use-primary-default-dark`#ff9d5c · color seleccionado en dark.
`--use-text-primary`Color de label y borde por defecto.
`--use-state-error-icon`Color para estado error.
`--use-border-strong`Color del contorno de focus de 3 px (Light #666666 · Dark #E0E0E0 · Alto contraste #FFFFFF).
`--body---l`16px / line-height 24px · label de Checkbox, Radio y Switch.
`--body---s`14px · texto de apoyo.

### Código

Descarga estilos planos del componente transversal, unidos al core y organizados por modo.

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/transversales/tables.md -->
## Tables

> Fuente: `docs/transversales/components/tables.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Permiten mostrar información estructurada en filas y columnas, facilitando la lectura, comparación y gestión de datos.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: datos

### Resumen

#### Cuándo usarlo

- Para listados de información.
- Para historial de registros.
- Para resultados de búsqueda.
- Para gestión y comparación de datos.

#### Tipos

- **Tabla básica:** muestra información sin interacción.
- **Tabla con acciones:** incluye acciones por fila.
- **Tabla seleccionable:** permite seleccionar una o varias filas.

### Estados especiales

#### Empty state

Cuando no hay datos disponibles.

No tienes registros generados
Cuando generes un certificado aparecerá aquí.

#### Loading

Mientras se cargan los datos.

Estamos buscando opciones para filtrar.

### Variantes

#### Básica

#### Con acciones

#### Seleccionable

#### Compacta

### Responsive

Las tablas deben envolver la grilla con `table-responsive` para permitir scroll horizontal cuando el contenido excede el ancho disponible.

- Máximo recomendado de 6 a 8 columnas visibles.
- Priorizar información relevante.
- Evitar acciones innecesarias por fila.
- El contenedor con scroll lleva `role="group"`, `tabindex="0"` y `aria-label` para que el teclado pueda desplazarlo.

### Código

```html
<div class="table-responsive mp-table-wrap" role="group" tabindex="0" aria-label="Tabla de solicitudes">
  <table class="table table-striped table-hover mp-table">
    <thead>
      <tr><th>Fecha solicitud</th><th>Estado</th><th class="mp-table__cell--center">Descargar</th></tr>
    </thead>
    <tbody>
      <tr><td>25/08/2023</td><td><span class="mp-badge mp-badge--warning">En trámite</span></td><td class="mp-table__actions">-</td></tr>
    </tbody>
  </table>
</div>
html
<mp-table [rows]="requests" [selectable]="true" [actions]="rowActions"></mp-table>
html
{# Variables: rows #}
<div class="table-responsive mp-table-wrap" role="group" tabindex="0" aria-label="Tabla de solicitudes">
  <table class="table table-hover mp-table">
    {% for row in rows %}
      <tr><td>{{ row.date }}</td><td>{{ row.status }}</td></tr>
    {% endfor %}
  </table>
</div>
```

### API del componente

| Propiedad | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `variant` | `basic \| striped \| hover \| bordered \| compact` | `basic` | Controla el estilo Bootstrap aplicado. |
| `selectable` | `boolean` | `false` | Agrega columna de selección y estado seleccionado. |
| `actions` | `boolean` | `false` | Muestra acciones por fila. |
| `responsive` | `boolean` | `true` | Envuelve la tabla con scroll horizontal. |

### Accesibilidad

Contraste
Filas, selección y hover deben mantener contraste suficiente.
Encabezados
Usa `th` y `scope` cuando aplique.
Teclado
Acciones y selección deben ser navegables por teclado.
No solo color
Estados como selección o error deben tener apoyo textual o estructural.

### Pendiente de documentación

La página de origen no trae contenido para: Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/tabs.md -->
## Tabs

> Fuente: `docs/transversales/components/tabs.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Organizan contenido relacionado en secciones de una misma vista. Permiten alternar entre paneles sin recargar la página y mantienen el contexto de la tarea. Disponible en tres formatos: Texto, Pill XL y Tarjeta con ícono.

Estado: estable Versión 1.0 · formatos XL desde DS v2.5.0 Web Bootstrap compatible Categoría: navegación

Elige el formato para ver su documentación. Pill XL y Tarjeta con ícono (v2, color Naranja o Violeta) están aprobados por UX y disponibles desde la versión 2.5.0 del sistema de diseño.

### Resumen

#### Cuándo usarlo

- Para agrupar contenido relacionado dentro de una misma vista.
- Para alternar entre paneles sin cambiar de página.
- Para mejorar el escaneo de información por categorías.
- Para mantener visible el contexto mientras cambia el contenido.

#### Do

Usa labels cortos y un máximo recomendado de 4 a 5 tabs.

#### Don't

No lo uses como navegación global ni con etiquetas largas.

### Estados

#### Default

Opción disponible no seleccionada.

#### Active

Muestra el contenido activo de la sección.

#### Hover

Indica que el tab es interactivo.

#### Disabled

Tab no disponible para interacción.

### Variantes

#### Solo texto

Uso principal cuando las categorías son claras por texto.

#### Con ícono

Úsalo solo cuando el ícono aporte claridad real al escaneo.

### Responsive

Por debajo de **768 px **(punto de quiebre `md`, el mismo de cards y sidebar) la tira de pestañas se presenta como** menú desplegable**. No hay que cambiar el marcado: lo hace `js/mp-tabs.js`, que oculta la tira y, en su lugar, inserta un `<select>` con las mismas opciones.

- Transformarse en menú desplegable.
- Mantener la selección visible.
- Facilitar la navegación en espacios reducidos.

Al elegir una opción se activa la pestaña correspondiente. Si las pestañas son enlaces (`<nav class="mp-tabs">` con `<a class="mp-tab">`), la opción **navega **a esa página. Al volver a 768 px o más, el desplegable se retira y reaparece la tira.** Sin JavaScript** la tira no se parte en dos líneas: se desplaza en horizontal. Es una red de seguridad, no el comportamiento esperado: carga siempre `js/mp-tabs.js`.

Ejemplo en vivo: reduce la ventana por debajo de 768 px y esta tira se convierte en desplegable.

Contenido de Servicios.

#### Dejar una tira fuera

Los especímenes de esta documentación conservan la tira a cualquier ancho para poder mostrarla. Para hacer lo mismo en una página, marca el contenedor con `data-mp-tabs-responsive="off"`. Úsalo solo para muestras visuales: en una pantalla real, las pestañas deben convertirse en desplegable.

### Código

```html
<div class="mp-tabs" role="tablist" aria-label="Secciones del portal">
  <button class="mp-tab is-active" role="tab" aria-selected="true"
          aria-controls="panel-servicios" id="tab-servicios">
    Servicios
  </button>
  <button class="mp-tab" role="tab" aria-selected="false"
          aria-controls="panel-beneficios" id="tab-beneficios" tabindex="-1">
    Beneficios
  </button>
</div>

<div class="mp-tab-panel" role="tabpanel" id="panel-servicios"
     aria-labelledby="tab-servicios">
  Contenido de servicios...
</div>
<div class="mp-tab-panel" role="tabpanel" id="panel-beneficios"
     aria-labelledby="tab-beneficios" hidden>
  Contenido de beneficios...
</div>
html
<mp-tabs ariaLabel="Secciones del portal" (tabChange)="onTabChange($event)">
  <mp-tab label="Servicios">
    <p>Contenido de servicios...</p>
  </mp-tab>
  <mp-tab label="Beneficios" icon="favorite">
    <p>Contenido de beneficios...</p>
  </mp-tab>
  <mp-tab label="Historial" disabled></mp-tab>
</mp-tabs>
html
{# Variables: tabs, aria_label #}
<div class="mp-tabs" role="tablist" aria-label="{{ aria_label }}">
  {% for tab in tabs %}
    <button class="mp-tab{{ loop.first ? ' is-active' }}"
            role="tab"
            aria-selected="{{ loop.first ? 'true' : 'false' }}"
            aria-controls="tab-panel-{{ loop.index }}"
            id="tab-{{ loop.index }}"
            {{ not loop.first ? 'tabindex="-1"' }}
            {{ tab.disabled ? 'disabled' }}>
      {{ tab.label }}
    </button>
  {% endfor %}
</div>
```

### API del componente

| Propiedad | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `label` | `string` | - | Texto visible del tab. Debe ser corto y claro. |
| `icon` | `string` | - | Nombre del ícono opcional. El ícono se marca con `aria-hidden="true"`. |
| `disabled` | `boolean` | `false` | Deshabilita el tab y lo elimina de la interacción por teclado. |
| `ariaLabel` | `string` | - | Etiqueta accesible para el contenedor con `role="tablist"`. |
| `data-mp-tabs-responsive` | `"off"` | - | En el contenedor: deja la tira fuera del menú desplegable de móvil (solo para muestras visuales). |
| `tabChange` | `EventEmitter<number>` | - | Emite el índice seleccionado cuando cambia el tab activo. |

### Accesibilidad

Foco visible
El foco debe ser visible en cada tab, activo o inactivo. El componente dibuja un contorno exterior de 3 px con `use/border/strong` alrededor de la superficie visual de 35 px; si lo reemplazas, no lo elimines sin una alternativa visible.
Teclado
Flechas laterales cambian el foco entre tabs; `Tab` avanza al panel activo.
ARIA
Usa `tablist`, `tab`, `tabpanel`, `aria-controls` y `aria-labelledby`.
No solo color
El activo debe diferenciarse por color, forma y peso visual; no dependas solo del color.

### Pendiente de documentación

La página de origen no trae contenido para: Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/transversales/toasts.md -->
## Toast

> Fuente: `docs/transversales/components/toasts.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Mensaje breve y flotante que aparece temporalmente para confirmar una acción o informar un estado del sistema.

Estado: estable Versión 1.0 Web Bootstrap compatible Categoría: feedback Tipo: temporal / flotante

### Toast (Temporal / Flotante)

Los toast flotan sobre la interfaz, no hacen parte del layout y desaparecen automáticamente después de 5 segundos.

#### Características

- Flotan sobre la interfaz.
- No bloquean la interacción.
- Tienen alta visibilidad y baja intrusión.
- Se cierran automáticamente en 5 segundos.

#### Ubicación

- No ocupa espacio dentro del layout.
- Posición recomendada: esquina superior derecha.
- Máximo 1 a 2 visibles simultáneamente.

Toast
Toast

### Resumen

#### Cuándo usarlo

- Confirmar acciones breves y no críticas.
- Informar estados del sistema sin interrumpir el flujo.
- Mostrar feedback que no requiere decisión del usuario.
- Dar visibilidad temporal a una acción completada.

#### Do

Usa mensajes breves y claros.

Cambios guardados

La información se actualizó correctamente.

#### Don’t

No uses toast para errores críticos, decisiones o información extensa.

Texto demasiado largo

Evita convertir el toast en una lectura extensa.

### Estados

Success
Info
Warning
Error

### Comportamiento

- Aparece tras una acción del usuario o evento del sistema.
- Se cierra automáticamente en 5 segundos.
- Permite cierre manual con botón accesible.
- Evitar acumulación: máximo 1 a 2 visibles.

### Guías de contenido

- Usa mensajes breves y directos.
- No incluyas información extensa ni instrucciones complejas.
- El título debe resumir el resultado de la acción.
- El mensaje puede ampliar el contexto en una línea corta.

### Accesibilidad

- Usar región `aria-live="polite"` para feedback no crítico.
- No desaparecer demasiado rápido: 5 segundos como regla base.
- El botón cerrar requiere `aria-label`.
- No depender solo del color: incluir icono y texto.

### Responsive

#### Desktop

Esquina superior derecha, ancho máximo 350 px.

#### Tablet

Mantiene posición flotante y ancho máximo.

#### Mobile

Ocupa el ancho disponible con margen lateral 16 px.

### Tokens usados

`--space-16`16px · padding y gap principal.
`--space-4`4px · separación entre título y mensaje.
`--use-state-success-bg`#e6f7e8 · fondo success light.
`--use-state-success-border`#44bd75 · borde success light.
`--font-size-md`16px · título Roboto SemiBold.
`--body---l`16px · título y mensaje (Roboto SemiBold / Regular).
`--z-toast`1080 · capa flotante recomendada.
`max-width`350px · regla definida para el sistema.

### Código

Descarga estilos planos del componente transversal, unidos al core y organizados por modo.

### Pendiente de documentación

Sin pendientes detectados automáticamente. Las secciones interactivas (anatomía, playground y visualizador de código) no se incluyen porque se generan en el navegador.

---

<!-- archivo: components/web/accordion.md -->
## Accordion

> Fuente: `docs/web/components/accordion.html` · Plataforma: Web · Sistema de diseño v2.5.0

Organiza contenido en paneles colapsables para reducir carga visual y permitir que el usuario consulte detalles solo cuando los necesita.

Estado: estable Versión 1.0 Web Categoría: contenido Figma: 4622:76590

### Resumen

#### Cuándo usarlo

- Para preguntas frecuentes o contenido de soporte.
- Para detalles secundarios que no deben ocupar toda la página.
- Para agrupar secciones independientes de información.
- Cuando el usuario puede decidir qué bloque consultar.

#### Do

Usa títulos claros y contenido breve dentro de cada panel.

Incluye atención de urgencias según el plan contratado.

#### Don't

No escondas pasos obligatorios ni información crítica que el usuario deba ver completa.

Formulario completo oculto

### Estados

#### Default

Ítem disponible.

#### Abierto

Panel expandido.

#### Cerrado

Panel colapsado.

#### Hover

Indica interacción.

#### Focus

Visible con teclado.

### Comportamiento y reglas

- El trigger completo debe ser clicable.
- Permite múltiples paneles abiertos salvo que el flujo pida modo exclusivo.
- Usa títulos breves y descriptivos.
- No ocultes acciones críticas ni pasos obligatorios.

### Accesibilidad

- El trigger es un `button` con `aria-expanded`.
- El panel usa `role="region"` y referencia al trigger.
- Tab, Enter y Space deben funcionar nativamente.
- Focus visible en todos los modos de color.

### Checklist QA

- Trigger usa texto mínimo de 16 px y componente real `mp-accordion`.
- Chevron 24 px rota al abrir/cerrar.
- Hover y focus son evidentes en los estados interactivos.
- El panel actualiza `aria-expanded` y altura al interactuar.
- Light, Dark y High Contrast mantienen contraste correcto.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/badges.md -->
## Chips / Tags / Badges

> Fuente: `docs/web/components/badges.html` · Plataforma: Web · Sistema de diseño v2.5.0

Familia de pastillas compactas para filtrar, categorizar o comunicar estados. Comparten estructura visual, pero cada una tiene una intención distinta.

Estado: estable Versión 1.0 Web Categoría: indicadores Figma: 4610:73562

### Resumen

#### Cuándo usarlo

- Chips: cuando el usuario filtra, selecciona o ejecuta una acción rápida.
- Tags: cuando necesitas clasificar contenido sin interacción.
- Badges: cuando debes comunicar estado, prioridad o conteo.
- Cuando el texto corto ayuda a escanear información en tablas, cards o filtros.

#### Do

Usa cada variante según su intención de interacción o lectura.

Afiliado   Activo

#### Don't

No uses un badge como botón ni un chip para comunicar estados estáticos.

Eliminar filtro

### ¿Cuál usar?

###### Chip

Interactivo

El usuario lo presiona, selecciona o descarta. Cambia de estado.

- Filtros activos o toggleables
- Selección múltiple
- Acciones rápidas con ícono de cierre

`<button>` · `aria-pressed`

###### Tag

No interactivo

Solo clasifica o etiqueta. Nunca responde a clics ni comunica estados de proceso.

- Categorías de contenido
- Etiquetas en tablas o cards
- Tipo de usuario o plan

`<span>` · solo lectura

###### Badge

Estado / conteo

Comunica estado, prioridad o conteo numérico. Nunca es clicable por sí solo.

- Estado de un registro (Activo, Vencido)
- Prioridad o nivel de alerta
- Contadores sobre íconos o avatares

`<span>` · `role="img"` + `aria-label`

|  | Chip | Tag | Badge |
| --- | --- | --- | --- |
| **Interactivo** | ✅ Sí | ❌ No | ❌ No |
| **Elemento HTML** | `<button>` | `<span>` | `<span>` |
| **Comunica estado** | Seleccionado / activo | Categoría / tipo | Estado / prioridad / conteo |
| **Clase base** | `.mp-chip` | `.mp-tag` | `.mp-badge` |
| **ARIA requerido** | `aria-pressed` | Ninguno adicional | `role="img"` + `aria-label` |

### Estados interactivos

#### Default

Estado base disponible.

#### Hover

Se evidencia solo en chips interactivos.

#### Focus

Anillo visible para navegación con teclado.

#### Seleccionado

Comunica filtros o selecciones activas.

#### Disabled

No permite interacción.

### Comportamiento y reglas

- Usa chips solo cuando hay interacción.
- Usa tags para clasificación no interactiva.
- Usa badges para estados y evita depender solo del color.
- Mantén textos cortos para lectura rápida.

### Accesibilidad

- Los chips deben exponer estado con `aria-pressed` cuando sean seleccionables.
- Los badges de estado deben tener texto claro o `aria-label`.
- No comuniques estados únicamente con color.
- El área clicable mínima para chips es 44 px.

### Checklist QA

- Verificar Light, Dark y High Contrast.
- Confirmar que chips muestran hover, focus, selected y disabled.
- Validar textos cortos sin desbordes.
- Probar que HTML, CSS y Sass del visualizador se copian completos.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/breadcrumb.md -->
## Breadcrumb

> Fuente: `docs/web/components/breadcrumb.html` · Plataforma: Web · Sistema de diseño v2.5.0

Muestra la ubicación del usuario dentro de la estructura del sitio y permite navegar fácilmente entre niveles jerárquicos.

Estado: estable Versión 1.0 Web Categoría: navegación Figma: 4629:87274

### Resumen

#### Cuándo usarlo

- Para navegación jerárquica.
- Para mostrar contexto de ubicación dentro del sitio.
- Para facilitar el regreso a niveles anteriores.
- Cuando la arquitectura tiene más de dos niveles.

#### Do

Usa niveles cortos y deja el último como página actual no interactiva.

#### Don't

No lo uses como menú principal ni con rutas largas difíciles de escanear.

Inicio / Usuarios / Cuenta / Contratos / Pagos / Detalle

### Estados

#### Default

Estado base.

#### Active

Página actual.

#### Página anterior

Enlace hacia otras páginas.

#### Focus

Navegación con teclado.

### Comportamiento y reglas

- Los niveles anteriores son clickeables.
- El último nivel no es interactivo y usa `aria-current="page"`.
- Mantén máximo 3 a 4 niveles visibles.
- Usa labels claros y cortos; no trunques el nivel actual.

### Accesibilidad

- Usa `nav` con `aria-label="Breadcrumb"`.
- Los enlaces deben ser identificables y navegables con teclado.
- Los separadores son decorativos y llevan `aria-hidden="true"`.
- Debe mantener contraste en Light, Dark y High Contrast.

### Checklist QA

- Home mide 20 px y separadores 16 px.
- Texto de breadcrumb usa 16 px y el nivel actual va en bold.
- Focus visible en enlaces anteriores.
- El último nivel no es enlace y declara `aria-current="page"`.
- Light, Dark y High Contrast mantienen contraste correcto.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/empty-state.md -->
## Empty State

> Fuente: `docs/web/components/empty-state.html` · Plataforma: Web · Sistema de diseño v2.5.0

Comunica a los usuarios que no hay contenido disponible en una sección. Orienta sobre qué ocurrió y, cuando es posible, ofrece una acción para resolverlo.

Estado: estable Versión 1.0 Web Categoría: feedback

### Resumen

#### Cuándo usarlo

- Cuando una lista, tabla o sección no tiene contenido que mostrar.
- Después de una búsqueda sin resultados.
- En estados iniciales donde el usuario aún no ha creado contenido.
- Cuando un filtro activo excluye todos los resultados.

#### Do

Usa un ícono claro, un título breve y una acción concreta cuando aplique.

###### **Sin resultados**

Intenta con otros términos de búsqueda.

#### Don't

No uses textos vagos como "Nada aquí" sin contexto ni orientación.

Nada aquí.

### Variantes

Default

Variante base sin borde. Úsala cuando el contenedor padre ya define el fondo y límites visuales.

Con borde `--bordered`

Agrega borde, radio y fondo. Úsala cuando el empty state necesita delimitarse visualmente dentro de un área sin fondo propio.

Compacto `--compact`

Reduce padding, gap e ícono. Ideal para paneles laterales, widgets o áreas con espacio limitado.

Solo texto `--text-only`

Oculta el contenedor del ícono. Úsalo cuando la ilustración es prescindible y se prioriza claridad textual.

### Con acción

Un botón primario

Cuando hay una acción principal clara que resuelve el estado vacío.

Dos acciones

Cuando existen dos caminos: resolver el problema directamente o explorar sin restricciones.

### Código

```html
<!-- Default -->
<div class="mp-empty-state">
  <div class="mp-empty-state__icon" aria-hidden="true">
    <i class="icon icon-package" aria-hidden="true"></i>
  </div>
  <h4 class="mp-h4 mp-empty-state__title">Sin elementos</h4>
  <p class="mp-body-l mp-empty-state__desc">
    No hay elementos disponibles en este momento.
  </p>
  <div class="mp-empty-state__action">
    <button type="button" class="mp-btn mp-btn--primario">Crear nuevo</button>
  </div>
</div>

<!-- Con borde -->
<div class="mp-empty-state mp-empty-state--bordered">
  <!-- mismo contenido interior -->
</div>

<!-- Compacto -->
<div class="mp-empty-state mp-empty-state--compact">
  <!-- mismo contenido interior -->
</div>

<!-- Solo texto (sin ícono) -->
<div class="mp-empty-state mp-empty-state--text-only">
  <h4 class="mp-h4 mp-empty-state__title">No hay notificaciones</h4>
  <p class="mp-body-l mp-empty-state__desc">Estás al día.</p>
</div>
html
// ── Base ──────────────────────────────────────────────────────
.mp-empty-state {
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  justify-content: center;
  gap:             var(--space-16);
  padding:         var(--space-24);
  text-align:      center;
  width:           100%;
}

// ── Ícono / ilustración ───────────────────────────────────────
.mp-empty-state__icon {
  display:         flex;
  align-items:     center;
  justify-content: center;
  width:           rem(56px);
  height:          rem(56px);
  border-radius:   var(--radius-md);
  background:      var(--use-surface-subtle);
  color:           var(--color-text-secondary);
  flex-shrink:     0;

  .icon {
    font-size:   rem(32px);
    line-height: 1;
  }
}

// ── Título — usar <h4 class="mp-h4"> en el HTML ─────────────
.mp-empty-state__title {
  color:  var(--color-text-primary);
  margin: 0;
}

// ── Descripción — usar clase mp-body-m en el HTML ────────────
.mp-empty-state__desc {
  color:     var(--color-text-secondary);
  max-width: rem(480px);
  margin:    0;
}

// ── Acción ───────────────────────────────────────────────────
.mp-empty-state__action {
  display:         flex;
  gap:             var(--space-12);
  align-items:     center;
  flex-wrap:       wrap;
  justify-content: center;
  margin-top:      var(--space-8);
}

// ── Modificadores ─────────────────────────────────────────────
.mp-empty-state--bordered {
  border:        1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background:    var(--color-surface-default);
}

.mp-empty-state--compact {
  padding: var(--space-16);
  gap:     var(--space-12);

  .mp-empty-state__icon {
    width:  rem(40px);
    height: rem(40px);

    .icon { font-size: rem(22px); }
  }
}

.mp-empty-state--text-only {
  .mp-empty-state__icon { display: none; }
}

// ── Dark mode ─────────────────────────────────────────────────
[data-theme='dark'] {
  .mp-empty-state--bordered {
    border-color: var(--use-border-default);
    background:   var(--use-surface-white);
  }
}

// ── High Contrast ─────────────────────────────────────────────
[data-theme='high-contrast'] {
  .mp-empty-state__icon {
    background: transparent;
    border:     2px solid var(--use-border-default);
    color:      var(--use-text-primary);
  }

  .mp-empty-state--bordered {
    border:     2px solid var(--use-border-default);
    background: var(--use-background-page);
  }
}
html
<mp-empty-state
  icon="package"
  title="Sin elementos"
  description="No hay elementos disponibles en este momento."
  variant="bordered">
  <ng-template mpEmptyStateAction>
    <button type="button" class="mp-btn mp-btn--primario"
            (click)="onCreate()">
      Crear nuevo
    </button>
  </ng-template>
</mp-empty-state>
```

### API del componente

| Clase / Propiedad | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `.mp-empty-state` | clase base | — | Contenedor principal. Siempre requerido. |
| `.mp-empty-state__icon` | elemento | — | Contenedor del ícono (56×56 px). Usa `aria-hidden="true"` en el ícono decorativo. |
| `.mp-empty-state__title` | elemento | — | Título del estado. Usar elemento `<h4>` con clase `.mp-h4`. Ajusta el nivel semántico según el contexto de la página. |
| `.mp-empty-state__desc` | elemento | — | Descripción de apoyo. Combinar con `.mp-body-m`. Ancho máximo 480 px. |
| `.mp-empty-state__action` | elemento | — | Contenedor opcional para uno o dos botones de acción. |
| `--bordered` | modificador | — | Agrega borde, radio y fondo de superficie al contenedor. |
| `--compact` | modificador | — | Reduce padding (16 px), gap (12 px) e ícono (40×40 px). Para espacios reducidos. |
| `--text-only` | modificador | — | Oculta el contenedor del ícono. Úsalo cuando el ícono no aporta valor semántico. |
| `icon` (Angular) | `string` | — | Nombre del ícono Material Symbols. |
| `title` (Angular) | `string` | — | Texto del título principal. |
| `description` (Angular) | `string` | — | Texto de descripción secundaria. |
| `variant` (Angular) | `'default' \| 'bordered' \| 'compact' \| 'text-only'` | `'default'` | Variante visual del componente. |

### Accesibilidad

Ícono decorativo
El ícono del contenedor debe marcarse con `aria-hidden="true"`. El significado se transmite por el título y la descripción.
Jerarquía semántica
Usa `<h4 class="mp-h4">` como elemento del título. Ajusta el nivel (`h2`, `h3`…) si el contexto lo requiere para mantener la jerarquía correcta de la página.
Acción accesible
Los botones de acción deben tener texto descriptivo. Evita etiquetas genéricas como "Aquí" o "Click". Prefiere "Crear nuevo documento" sobre "Crear".
Contraste
El título y descripción usan tokens de texto primario y secundario respectivamente, garantizando contraste 4.5:1 en todos los modos del sistema.

### Pendiente de documentación

La página de origen no trae contenido para: Estados, Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/header.md -->
## Navigation patterns

> Fuente: `docs/web/components/header.html` · Plataforma: Web · Sistema de diseño v2.5.0

3.3 — Patrones de navegación

## Navigation patterns

Define cómo se organiza y presenta la navegación según el contexto del producto. La navegación debe responder al tipo de usuario, sus objetivos y la profundidad del contenido.

Estado: estable Web / Drupal / ZT Categoría: navegación

### 4.1 — Portal público (Drupal)

Patrón orientado a exploración, descubrimiento y acceso a información general. Se utiliza en experiencias abiertas, sin autenticación, donde el usuario recorre servicios, beneficios y canales de atención.

Vista desktop

#### Objetivo

Permitir que el usuario:

- explore el sitio con facilidad
- entienda la oferta de servicios
- llegue rápidamente a contenidos clave
- acceda a acciones estratégicas del negocio

#### Estructura

Elementos principales:

- Logo
- Buscador
- CTA principal
- Navegación horizontal (nv1)
- Menú desplegable por categoría (nv2)

#### Responsive

En pantallas pequeñas, la navegación se transforma en un patrón compacto:

- Menú hamburguesa o drawer
- Priorizar accesos principales
- Mantener visibles las acciones clave del negocio
- Se despliega de izquierda a derecha
- Se cierra al presionar la X o fuera del drawer

Vista responsive

#### Comportamiento

- Navegación horizontal, visible en desktop
- Cada categoría puede desplegar subniveles
- El usuario explora sin perder contexto
- El CTA principal se mantiene siempre visible

#### Uso recomendado

Usar este patrón cuando:

- El contenido es público
- El usuario necesita explorar
- Existen múltiples categorías de información
- Se busca impulsar acciones como afiliación o contacto

#### Reglas de uso

- Priorizar categorías claras y reconocibles
- Mantener labels cortos
- Evitar sobrecargar el primer nivel
- Submenús agrupados por tema
- Protagonismo a acciones como "Afíliate"

### 4.2 — Zona transaccional (ZT)

Patrón orientado a ejecución de tareas y acceso frecuente a funcionalidades. Se utiliza en experiencias autenticadas donde el usuario necesita resolver acciones concretas de forma rápida y clara.

Vista desktop — menú sin colapsar

Vista desktop — menú colapsado

Vista desktop — colapsado + hover

#### Objetivo

Permitir que el usuario:

- acceda rápidamente a tareas frecuentes
- navegue entre módulos funcionales
- mantenga contexto dentro del sistema
- reduzca pasos innecesarios

#### Estructura

Elementos principales:

- Header superior
- Botón de menú
- Navegación lateral o drawer
- Módulos principales con subniveles
- Accesos rápidos al home o dashboard

#### Responsive

En dispositivos pequeños:

- La navegación se abre desde un botón de menú
- El contenido no depende de hover
- El drawer se puede cerrar fácilmente
- El usuario identifica claramente dónde está

Menú en móvil

Menú desplegado en móvil

#### Comportamiento

- Menú lateral con módulos expandibles
- Sección activa claramente identificada
- Versión compacta con solo iconos disponible
- En móvil, se presenta como drawer lateral

#### Uso recomendado

Usar este patrón cuando:

- El usuario está autenticado
- Existen múltiples tareas operativas
- Hay navegación frecuente entre módulos
- El sistema necesita escalar funcionalmente

#### Reglas de uso

- Priorizar tareas frecuentes al inicio
- Jerarquía clara entre niveles
- Resaltar estado activo
- Evitar menús demasiado profundos
- En versión colapsada, iconos claros y consistentes

### Accesibilidad

- Focus visible obligatorio en todos los elementos interactivos
- Navegación por teclado completa (Tab, Enter, Escape)
- Estado activo con `aria-current="page"`
- No depender solo del color para comunicar estado
- Áreas clicables mínimo 44×44 px
- En móvil, evitar patrones dependientes de hover
- Usar `aria-expanded` en submenús y drawers
- Cerrar drawer con Escape y devolver foco al botón disparador

### Componente en vivo

Lo que se ve aquí es el componente real `.mp-web-header` del Core, no una imagen. Cambia las opciones para ver cómo responde. El botón de menú aparece en pantallas menores de 768 px.

#### Variantes

##### Portal público

##### Con menú desplegado (nv2)

##### Zona transaccional (ZT)

#### Estados de navegación

##### Hover

##### Focus

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Estados, Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/icons-connect.md -->
## Cómo conectarlo

> Fuente: `docs/web/components/icons-connect.html` · Plataforma: Web · Sistema de diseño v2.5.0

1.8.2

## Cómo conectarlo

Integra la fuente de iconos del sistema con un único CSS, precarga el archivo principal y usa clases semánticas para mantener consistencia entre diseño, desarrollo y documentación.

Implementación técnica
Flujo recomendado

### Conexión en tres pasos

La implementación debe ser predecible: copiar los archivos, cargar el CSS del set y usar la clase base con el nombre del icono y su tamaño en rem.

**1. Copiar archivos**

`icons/`, `fonts/` y `selection.json`.

**2. Cargar CSS**

Usar `icons.css` y precargar `woff2`.

**3. Usar clases**

`.icon` + `.icon-name` + `.icon-24`.

Estructura de archivos

```html
icons/
├── fonts/
│   ├── compensar-icons.woff2   ← fuente principal (preferida)
│   ├── compensar-icons.woff    ← fallback
│   └── compensar-icons.ttf     ← fallback legacy
├── icons.css            ← todo en uno: @font-face + .icon + tamaños + 1001 clases
└── selection.json       ← para actualizar en IcoMoon
```

`fonts/`Archivos de la fuente de iconos (woff2, woff, ttf)
`icons.css`Archivo único — @font-face, clase base `.icon`, tamaños y 1001 clases `::before`
`selection.json`Para actualizar o ampliar el set en icomoon.io
Instalación en tu proyecto

```html
<!-- 1. Un solo archivo CSS -->
<link rel="stylesheet" href="icons/icons.css">
<link rel="preload"
      href="icons/fonts/compensar-icons.woff2"
      as="font" type="font/woff2"
      crossorigin="anonymous">

<!-- 2. Usar el icono -->
<i class="icon icon-name icon-24" aria-hidden="true"></i>
html
@font-face {
  font-family: "CompensarIcons";
  src: url("./icons/fonts/compensar-icons.woff2") format("woff2"),
       url("./icons/fonts/compensar-icons.woff")  format("woff"),
       url("./icons/fonts/compensar-icons.ttf")   format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.icon {
  font-family: "CompensarIcons" !important;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  display: inline-block;
  speak: never;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* ── Tamaños de icono ──────────────────────────────────── */
/* Base 16px: 1rem = 16px                                  */
/* Uso:            */
.icon-16 { font-size: 1rem; }    /* 16px */
.icon-20 { font-size: 1.25rem; } /* 20px */
.icon-24 { font-size: 1.5rem; }  /* 24px */
.icon-32 { font-size: 2rem; }    /* 32px */
.icon-40 { font-size: 2.5rem; }  /* 40px */
.icon-48 { font-size: 3rem; }    /* 48px */
.icon-64 { font-size: 4rem; }    /* 64px */
```

Uso en HTML

```html
<!-- Clase nombre + clase tamaño -->
<i class="icon icon-key icon-16" aria-hidden="true"></i>
<i class="icon icon-key icon-20" aria-hidden="true"></i>
<i class="icon icon-key icon-24" aria-hidden="true"></i>
<i class="icon icon-key icon-32" aria-hidden="true"></i>
<i class="icon icon-key icon-40" aria-hidden="true"></i>
<i class="icon icon-key icon-48" aria-hidden="true"></i>
html
<!-- Icono interactivo: necesita aria-label -->
<button class="mp-btn mp-btn--secundario mp-btn--icon-only" aria-label="Buscar">
  <i class="icon icon-magnifying-glass icon-24" aria-hidden="true"></i>
</button>

<!-- Área táctil mínima 2.75rem × 2.75rem (44×44px) -->
<button class="mp-btn mp-btn--secundario mp-btn--icon-only" aria-label="Abrir menú">
  <i class="icon icon-list icon-24" aria-hidden="true"></i>
</button>
html
<!-- Icono + texto: el ícono es decorativo -->
<button class="mp-btn mp-btn--primario mp-btn--icon-left">
  <i class="icon icon-key icon-20" aria-hidden="true"></i>
  Iniciar sesión
</button>

<!-- No usar ícono sin texto cuando la acción no es obvia -->
<!-- ❌ Evitar: -->
<button class="mp-btn mp-btn--secundario mp-btn--icon-only"><i class="icon icon-user icon-24"></i></button>

<!-- ✅ Correcto: -->
<button class="mp-btn mp-btn--secundario mp-btn--icon-only" aria-label="Ver perfil de usuario">
  <i class="icon icon-user icon-24" aria-hidden="true"></i>
</button>
```

Actualizar el set en IcoMoon

1. Ir a icomoon.io/app
2. Click en **"Import Icons" **o** "Load"**
3. Subir el archivo `selection.json` (incluido en el ZIP)
4. El set se restaura con todos los iconos actuales
5. Agregar o quitar iconos según necesidad
6. Exportar → descargar ZIP → reemplazar archivos en el proyecto

Nota importante

El archivo `selection.json` es la fuente de verdad del set. **Nunca modificar los archivos .woff o .ttf directamente.**

Clases de tamaño

Combina la clase base `.icon` con una clase de tamaño. Los valores se expresan en rem y muestran su equivalencia en px sobre base 16.

`icon-warning · 16`
`icon-house · 16`
`icon-user-circle · 20`
`icon-lock · 24`
`icon-heart · 32`
`icon-calendar · 40`
`icon-bell-ringing · 48`
`icon-globe · 64`
`icon-map-pin · 16`
`icon-info · 20`
`icon-key · 24`
`icon-magnifying-glass · 32`

| Clase | Tamaño | Uso recomendado |
| --- | --- | --- |
| `.icon-16` | 1rem (16px) | Texto inline, botones pequeños |
| `.icon-20` | 1.25rem (20px) | Botones estándar, inputs |
| `.icon-24` | 1.5rem (24px) | Navegación, acciones principales ✓ recomendado |
| `.icon-32` | 2rem (32px) | Encabezados de sección |
| `.icon-40` | 2.5rem (40px) | Ilustraciones de apoyo |
| `.icon-48` | 3rem (48px) | Estados vacíos, destacados |
| `.icon-64` | 4rem (64px) | Ilustraciones hero |

```html
<!-- Clase base + clase de tamaño -->
<i class="icon icon-lock icon-16" aria-hidden="true"></i>
<i class="icon icon-lock icon-24" aria-hidden="true"></i>
<i class="icon icon-lock icon-32" aria-hidden="true"></i>

<!-- En un botón -->
<button class="mp-btn mp-btn--primario">
  <i class="icon icon-lock icon-20" aria-hidden="true"></i>
  Iniciar sesión
</button>
```

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Estados, Propiedades / API, Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/icons-intro.md -->
## Sistema de iconos

> Fuente: `docs/web/components/icons-intro.html` · Plataforma: Web · Sistema de diseño v2.5.0

1.8.1

## Sistema de iconos

Una guía para elegir, usar e implementar iconos de forma consistente en las interfaces de Compensar. La iconografía debe ayudar a reconocer acciones, estados y categorías sin reemplazar el contenido principal.

Iconografía oficial

### Iconos claros, consistentes y listos para desarrollo

El sistema usa una fuente de iconos propia para mantener consistencia visual, rendimiento y facilidad de implementación. Cada icono debe conservar el mismo lenguaje outline, alinearse a la grilla y usarse solo cuando aporte comprensión.

Ver librería    Ver en Figma
`<i class="icon icon-name icon-24" aria-hidden="true"></i>`
**Primero librería oficial**

Antes de buscar alternativas, valida si el icono existe en el set Compensar.

**Tamaño base 1.5rem**

Usa 1.5rem (24px) para acciones principales; 1.25rem (20px) y 1rem (16px) solo para contextos compactos.

**Accesibilidad siempre**

Los iconos decorativos usan `aria-hidden`; los interactivos necesitan texto o `aria-label`.

Estilo base

El sistema utiliza principalmente iconos en estilo **outline**.

Este estilo se caracteriza por:

- Trazos limpios
- Formas simples
- Buena legibilidad en tamaños pequeños
- Coherencia visual con interfaces modernas

Todos los iconos del sistema **deben respetar el mismo estilo visual** para evitar inconsistencias dentro de la interfaz.

Reglas

- No usar valores arbitrarios.
- No usar decimales.
- Todo tamaño debe respetar la escala rem del sistema, equivalente a múltiplos de 8px.
- Evitar usar margin para alinear elementos internos de un componente.
- No ajustar espaciado visualmente para compensar errores de layout.
- Priorizar siempre la consistencia del sistema.

Orden de uso de iconos

Para mantener consistencia dentro del sistema, se debe seguir el siguiente orden de prioridad al seleccionar iconos.

1
Iconografía oficial del producto

La primera opción siempre debe ser la librería de iconos **proporcionada por el equipo de Compensar**. Estos iconos siguen el estilo visual oficial del sistema (outline) y representan la base de la iconografía del producto. Siempre que exista un icono dentro de esta librería, debe utilizarse antes de buscar alternativas.

Esta librería · 1025 iconos
2
Google Material Symbols

Si el icono requerido no existe en la librería principal, se puede utilizar Google Material Symbols. Estos iconos deben configurarse para mantener un estilo visual similar al del sistema.

**Configuración recomendada: **- Estilo **Outlined **- Tamaño base **1.5rem (24px)**
- Grosor de trazo consistente
- Sin rellenos sólidos

3
Font Awesome

En casos donde el icono no esté disponible ni en la librería principal ni en Google Material Icons, **se permite el uso de Font Awesome**. Debe priorizarse siempre la variante que más se acerque al estilo outline del sistema. Evitar iconos con estilos demasiado pesados o visualmente diferentes al resto del sistema.

Iconos personalizados

Algunos iconos específicos del producto han sido diseñados de forma personalizada.

Estos iconos deben:

- Seguir el mismo estilo outline del sistema
- Respetar proporciones y grosor de trazo
- Mantener consistencia con la librería base

Para facilitar su implementación en desarrollo, estos iconos deben convertirse a font icon. Esto permite:

- Mejor integración con el sistema
- Reutilización en diferentes componentes
- Control mediante CSS
- Mejor rendimiento que múltiples SVG independientes

Reglas

- Utilizar siempre iconos de la librería principal cuando existan.
- Evitar mezclar estilos diferentes dentro de una misma interfaz.
- No modificar manualmente el grosor de los iconos.
- Mantener proporciones y alineación dentro del grid del icono.
- Usar iconos solo cuando aporten valor a la comprensión de la acción.

Tamaños recomendados

#### Tamaños recomendados

| Tamaño | Uso |
| --- | --- |
| Icono estándar UI | **1.5rem (24px)** |
| Icono compacto | **1.25rem (20px)** |
| Icono pequeño | **1rem (16px)** |

Evitar tamaños intermedios que rompan la consistencia visual.

Reglas

El tamaño visual del icono puede ser 1rem (16px), 1.25rem (20px) o 1.5rem (24px).
Cuando el icono sea interactivo, el área clicable mínima debe ser 2.75rem × 2.75rem (44px × 44px).
El icono debe centrarse dentro del contenedor interactivo.
No usar iconos clicables sin área táctil suficiente.

#### Tamaño mínimo para iconos interactivos

El icono no necesita medir 2.75rem (44px). Lo importante es que el contenedor clicable sí respete esa medida mínima.

| Tamaño | Uso |
| --- | --- |
| Icono | **1.25rem – 1.5rem (20px – 24px)** |
| Área clicable | **2.75rem (44px)** |

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Estados, Propiedades / API, Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/loading.md -->
## Loading

> Fuente: `docs/web/components/loading.html` · Plataforma: Web · Sistema de diseño v2.5.0

Representa el estado en el que la información aún no ha cargado. Ayuda a reducir la incertidumbre del usuario y mejora la percepción de rendimiento del sistema.

Estado: estable Versión 1.0 Web Categoría: feedback Figma: 4610:73484

### Resumen

#### Cuándo usarlo

- Cuando los datos están en proceso de carga.
- Cuando hay transición entre vistas o actualización de resultados.
- Cuando se espera una respuesta breve del sistema.
- Para cargas cortas con mensaje visible de estado.

#### Do

Muestra el estado con animación y texto claro.

Estamos buscando opciones para ti...

#### Don't

No dejes una pantalla bloqueada sin mensaje ni salida esperada.

Cargando sin contexto

### Estados y variantes

#### Default

Spinner centrado con texto visible.

#### Inline

Acompaña acciones o mensajes compactos.

#### Overlay

Cubre un bloque mientras actualiza contenido.

#### Reducido

Debe conservar el texto y bajar intensidad.

### Comportamiento y reglas

- Se muestra mientras carga la información y desaparece automáticamente al terminar.
- No debe bloquear más tiempo del necesario.
- Evita tiempos largos sin feedback adicional.
- Mantén consistencia de tamaño y texto en toda la interfaz.

### Accesibilidad

- No dependas solo de la animación: conserva un texto visible.
- Usa `role="status"`, `aria-live="polite"` y `aria-busy="true"`.
- Mantén contraste adecuado en Light, Dark y High Contrast.
- Respeta usuarios con reducción de movimiento.

### Checklist QA

- Spinner mide 48 px por defecto y conserva proporciones en small/large.
- Texto visible usa 16 px y no se oculta en mobile.
- Light, Dark y High Contrast mantienen contraste correcto.
- El HTML expone `role="status"`, `aria-live` y `aria-busy`.
- Las descargas de CSS/Sass incluyen componente completo y animación separada.

### Pendiente de documentación

La página de origen no trae contenido para: Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/sidebar.md -->
## Sidebar / Overlay

> Fuente: `docs/web/components/sidebar.html` · Plataforma: Web · Sistema de diseño v2.5.0

Panel lateral que emerge desde la derecha de la pantalla para mostrar detalles, confirmar acciones o presentar flujos secundarios sin abandonar la página actual. En móvil se convierte en bottom sheet.

Estado: estable Versión 1.0 Web Categoría: overlay Figma: 4715:5763

### Resumen

#### Cuándo usarlo

- Para mostrar detalles de un ítem de lista (centro médico, cita, servicio) sin navegar a otra página.
- Para confirmar o revisar información antes de una acción crítica.
- Para flujos secundarios de 1-3 pasos que no justifican una página completa.
- Cuando el contexto detrás del panel debe mantenerse visible en desktop.

#### Do

Usa el sidebar para detalles contextuales que complementan la vista actual.

Detalle de centro médico Confirmar cita

#### Don't

No uses el sidebar para flujos complejos de más de 3 pasos — navega a una página dedicada.

Formulario de 5 pasos Onboarding completo

### Variantes

#### Detalle (con imagen)

Muestra información de un centro médico: foto, estado, horarios y datos de contacto.

#### Confirmación

Resumen previo a una acción crítica (confirmar cita, pago, cancelación).

### Comportamiento

Apertura `translateX(100%)` → `translateX(0)`, 280 ms, `cubic-bezier(.4,0,.2,1)`
Cierre Clic en backdrop · Clic en ✕ · Tecla Escape
Scroll Body del panel scrollable — página detrás bloqueada (`overscroll-behavior: contain`)
Clase activa Agregar `.is-open` al `.mp-sidebar` para mostrar
Ancho desktop `--mp-sidebar-width: 480px` — ajustable con custom property
Alto máx. mobile `max-height: 90dvh` — evita cubrir toda la pantalla
z-index `400` — sobre headers y tooltips, bajo modales de alerta
Responsive ≤ 768 px Bottom sheet — emerge desde abajo: `translateY(100%)` → `translateY(0)`, border-radius arriba

#### Demo responsive (bottom sheet)

En pantallas ≤ 768 px el panel cambia a bottom sheet: sale de abajo, ocupa el ancho completo y tiene borde redondeado solo arriba. El backdrop y el cierre por Escape funcionan igual.

- `border-radius: 16px 16px 0 0`
- `width: 100%`
- `max-height: 90dvh`

Calle 94
Abierto 24 horas

### Do / Don't

#### Do

- Mantén el título del panel corto (1 línea máx).
- El footer debe tener 1 acción primaria clara.
- Cierra el panel automáticamente tras completar la acción.
- Preserva el foco en el panel al abrirlo (`focus` en el botón cerrar).

#### Don't

- No apiles sidebars encima de otro sidebar.
- No uses el sidebar para contenido que el usuario necesita comparar con la página de fondo.
- No bloquees el scroll del body con `overflow: hidden` si hay campos de formulario en el panel (iOS bug).
- No olvides manejar Escape para accesibilidad de teclado.

### Accesibilidad

- `role="dialog"` + `aria-modal="true"` en `.mp-sidebar`.
- `aria-label` o `aria-labelledby` apuntando al título del panel.
- Al abrir, mover el foco al primer elemento interactivo (botón cerrar o primer campo).
- Al cerrar, restaurar el foco al elemento que lo abrió.

- Implementar **focus trap**: Tab y Shift+Tab deben circular dentro del panel.
- Escape cierra el panel siempre.
- El backdrop tiene `aria-hidden="true"` — no es interactivo para lectores de pantalla.
- Contraste mínimo 4.5:1 en todo texto sobre el fondo del panel.

### Checklist QA

- Panel entra con animación suave desde la derecha (desktop) o desde abajo (mobile).
- Backdrop oscurece el fondo y cierra el panel al hacer clic.
- Escape cierra el panel desde cualquier elemento interno.
- El body del panel scrollea independientemente de la página.
- El footer permanece visible (sticky) al hacer scroll dentro del body.
- En mobile, el panel ocupa máximo 90dvh y tiene border-radius arriba.
- Focus ring visible al navegar con teclado.
- Se ve correctamente en Light, Dark y High Contrast.

### Código

Calle 94
Abierto 24 horas

Cierra a las 7:00 pm

Ubicación y contacto

Transversal Pereira # 23-45, Piso 2

321 123 4578

Horarios de atención

Lunes a Viernes6:00 am – 10:30 pm
Sábados6:00 am – 10:30 am
Domingos y FestivosNo hay atención
Confirma tu cita

Revisa que la información sea correcta y si estás de acuerdo, presiona confirmar.

Doctor

Dra. Mariana Zapata

Medicina General

Fecha y hora

Jueves, 01 de Enero 2026 — 8:00 am

Ubicación

San Roque — Cajicá

Modalidad

Cita presencial

### Pendiente de documentación

La página de origen no trae contenido para: Estados, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: components/web/stepper.md -->
## Stepper

> Fuente: `docs/web/components/stepper.html` · Plataforma: Web · Sistema de diseño v2.5.0

Indica el progreso del usuario a través de un flujo de pasos secuenciales. Muestra cuántos pasos tiene el proceso, cuál es el actual y cuántos han sido completados.

Estado: estable Versión 1.0 Web Categoría: navegación Figma: 4693:4707

### Resumen

#### Cuándo usarlo

- Flujos de formulario con 2 o más pasos secuenciales.
- Procesos donde el usuario necesita saber cuánto falta para terminar.
- Flujos de checkout, agendamiento o registro multi-paso.
- Cuando el orden de los pasos es fijo y no se puede saltar.

#### Do

Usa el stepper al inicio de un formulario multi-paso para orientar al usuario.

Paso 2 de 3

#### Elige la fecha y hora

#### Don't

No uses el stepper en flujos de 1 solo paso — no aporta valor visual.

Formulario de contacto simple

### Variantes

#### Default — 3 pasos

Con head (contador + título) y track de barras. El paso actual tiene barra de color primario.

#### 5 pasos — Paso 3 activo

El número de barras escala con el total de pasos del flujo.

#### Compact — Solo barras

Agrega `mp-stepper--compact` para ocultar el head. Útil en headers o espacios reducidos.

#### Dark mode

#### High Contrast

### Custom properties

`--mp-stepper-done` Color de las barras completadas. Default: `var(--use-primary-default)`
`--mp-stepper-current` Color de la barra activa. Default: `var(--use-primary-default)`
`--mp-stepper-pending` Color de barras pendientes. Default: `var(--use-border-default)`
`--mp-stepper-gap` Separación entre barras. Default: `12px`
`--mp-stepper-h` Alto de cada barra. Default: `2px` (High Contrast: `3px`)

### Do / Don't

#### Do

- Usa entre 2 y 6 pasos — más de 6 fragmenta demasiado el flujo.
- El título del paso debe describir la acción principal de esa pantalla.
- Actualiza `aria-valuenow` al navegar entre pasos.
- Usa `mp-stepper--compact` dentro de un header de página.

#### Don't

- No uses el stepper para navegación no lineal donde el usuario puede saltar pasos.
- No cambies el color de las barras fuera del sistema de tokens.
- No omitas el `role="progressbar"` — es requerido para accesibilidad.
- No uses texto largo en el título del paso — máximo 4-5 palabras.

### Accesibilidad

- `role="progressbar"` en `.mp-stepper__track`.
- `aria-valuenow` = paso actual, `aria-valuemin="1"`, `aria-valuemax` = total.
- `aria-label` descriptivo: *"Paso 2 de 3"*.

- El stepper es solo informativo — no es interactivo ni recibe foco.
- El contraste de las barras cumple WCAG AA en todos los temas.
- En High Contrast, el alto de barra sube a 3 px para mayor visibilidad.

### Checklist QA

- Las barras completadas (`.is-done`) muestran color primario.
- La barra activa (`.is-current`) muestra color primario.
- Las barras pendientes muestran color de borde sutil.
- El head muestra el número y título del paso actual correctamente.
- `aria-valuenow` se actualiza al navegar entre pasos.
- La variante compact oculta el head completamente.
- Se ve correctamente en Light, Dark y High Contrast.
- Las barras son equitativas en ancho (flex: 1 cada una).

### Pendiente de documentación

La página de origen no trae contenido para: Estados, Propiedades / API, Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: foundations/app-layout.md -->
Fundamentos App

## Layout System MAUI

Guía de rejilla para .NET MAUI. En App usamos maximo 4 columnas y el contenido se redistribuye por zonas segun el ancho disponible.

.NET MAUI Grid Spacing 16dp Adaptive

### Base estructural App

4 columnas
16dp separación base
Grid layout core

- ✓ Maximo 4 columnas en todos los anchos
- ✓ Compacto: contenido en 1 columna
- ✓ Medio/expandido: 2 a 4 columnas segun prioridad

1234

### Rejillas por contexto MAUI

En App no usamos container/container-fluid. El comportamiento se define por ancho disponible y cambio de columnas del Grid.

Compacto y medio

#### 1 a 4 columnas

Pantallas de teléfono y tablet en portrait

Grid.ColumnDefinitions
1 a 2 columnas de contenido

- Forms y flujos de captura
- Listados con tarjetas
- Resumenes por bloques

→
Expandido

#### Maximo 4 columnas

Tablet landscape, escritorio o ventanas amplias

Panel + contenido + soporte
Hasta 3 zonas simultáneas

- Master-detail
- Tablas o grillas densas
- Flujos con panel lateral

En expandido conservar max-width de contenido principal para no perder legibilidad.
Login y onboarding 4 columnas
Formularios 1-4 columnas
Listado de cards 2 columnas en medium
Tablet landscape 4 columnas
Master-detail 3 zonas
Desktop MAUI 4 + zonas adaptadas

### Reglas clave de implementación

✓

Definir layout base con `Grid` (filas y columnas), no con posiciones absolutas.

✗

No fijar anchos en px para contenedores principales.

✓

Usar spacing en múltiplos de 4dp y mantener base de 16dp entre bloques.

✗

No mezclar márgenes y paddings arbitrarios por pantalla.

✓

Respetar Safe Area en iOS y separación de barras del sistema en Android.

✗

No aprobar pantallas con clipping, solapamientos o scroll horizontal.

### Rangos recomendados para App

Las revisiones se hacen por ancho lógico (dp), no solo por nombre de dispositivo.

compact < 600dp Teléfono portrait
medium 600–839dp Tablet portrait / foldable
expanded ≥ 840dp Tablet landscape / desktop
Compact 1 columna de contenido `hasta 4 columnas`
→
Medium 2 columnas de contenido `hasta 4 columnas`
→
Expanded hasta 3 zonas funcionales `hasta 4 columnas`

### QA de estilos en App

1
**Revisión por perfil de ancho** Validar compact, medium y expanded en portrait y landscape.
2
**Sin clipping ni overlap** Texto, íconos y CTAs no deben recortarse ni montarse.
3
**Consistencia de spacing** Comprobar separaciones base de 16dp y submúltiplos de 8/4dp.
4
**Tema y contraste** Probar claro, oscuro y alto contraste con foco visible.
5
**Accesibilidad tipográfica** Escalar fuente del sistema y validar reflow sin cortes.
6
**Evidencia QA** Captura por cada perfil (compact/medium/expanded) con check de estados.
Recomendado · iPhone 14 (390x844 pt)
Recomendado · Pixel 7 (412x915 dp)
Recomendado · iPad 11" portrait (834x1194)
Recomendado · iPad 11" landscape (1194x834)
Opcional desktop · Windows 1366x768+

```html
<!-- MAUI: layout base de pantalla -->
<Grid
  Padding="16"
  ColumnSpacing="16"
  RowSpacing="16"
  RowDefinitions="Auto,*"
  ColumnDefinitions="*,*">

  <Label Grid.ColumnSpan="2" Text="Resumen" />

  <Border Grid.Row="1" Grid.Column="0" />
  <Border Grid.Row="1" Grid.Column="1" />

</Grid>

<!-- Regla: en compacto usar una sola columna de contenido -->
<!-- Regla: en expanded dividir en 2 o 3 zonas segun flujo -->
html
// MAUI code-behind: cambiar columnas segun ancho disponible
protected override void OnSizeAllocated(double width, double height)
{
    base.OnSizeAllocated(width, height);

    int cols = width < 600 ? 1 : (width < 840 ? 2 : 4);

    ContentGrid.ColumnDefinitions.Clear();
    for (int i = 0; i < cols; i++)
        ContentGrid.ColumnDefinitions.Add(new ColumnDefinition(GridLength.Star));

    ContentGrid.ColumnSpacing = 16;
    ContentGrid.RowSpacing    = 16;
}

// QA: registrar capturas en compact/medium/expanded y ambos temas
```

> Fuente: `docs/app/fundamentos/layout.html` · v2.5.0

---

<!-- archivo: foundations/border-radius.md -->
Fundamentos

## Border radius

Define el nivel de redondeo aplicado a los componentes del sistema. El uso consistente del radio ayuda a mantener coherencia visual, identidad de producto y uniformidad entre superficies y componentes.

**El objetivo es:** Coherencia visual, identidad y consistencia entre superficies

### Escala recomendada

El sistema utiliza una escala simple de radios para evitar variaciones arbitrarias entre componentes.

border-radius
radius-xs
0.5rem
radius-sm
1rem
radius-md
1.5rem
radius-lg
2rem

Esta escala cubre la mayoría de los casos de uso dentro del sistema. Evitar valores intermedios fuera de esta escala.

### Uso recomendado

Cada nivel de radio corresponde a un tipo de componente específico.

#### Recomendaciones

Radio Uso
0.5rem (8px) elementos pequeños, inputs compactos
1rem (16px) botones, inputs, controles de formulario
1.5rem (24px) cards, modales, contenedores principales
2rem (32px) superficies grandes o componentes destacados

Esto mantiene coherencia entre los distintos tipos de superficies.

### Componentes comunes

Ejemplos de aplicación dentro del sistema:

Componente Radio recomendado
Inputs 1rem (16px)
Botones 1rem (16px)
Cards 1.5rem (24px)
Modales 1.5rem (24px)
Chips 2rem (32px)
Badges 2rem (32px)

Esto mantiene coherencia entre los distintos tipos de superficies.

* Label
Texto de apoyo

Reglas

- No usar valores de radio arbitrarios.
- Mantener consistencia dentro de un mismo componente.
- Evitar radios diferentes dentro de un mismo bloque visual.
- Priorizar radios moderados para interfaces transaccionales.
- Mantener consistencia entre estados (default, hover, focus).

### Accesibilidad

El radio no debe afectar la legibilidad ni la claridad visual de los componentes.

**Reglas generales:**

- Evitar radios extremos en componentes críticos.
- Mantener consistencia entre estados interactivos.
- Asegurar que el radio no interfiera con el área táctil del componente.

```html
/* Border radius tokens — Compensar */

/* Escala */
--radius-xs: 0.5rem;  /* 8px · Elementos pequeños, inputs compactos  */
--radius-sm: 1rem;    /* 16px · Botones, inputs, controles           */
--radius-md: 1.5rem;  /* 24px · Cards, modales, contenedores         */
--radius-lg: 2rem;    /* 32px · Chips, badges, superficies grandes   */

/* Uso */
.btn         { border-radius: var(--radius-sm); }  /* 1rem = 16px */
.input       { border-radius: var(--radius-sm); }  /* 1rem = 16px */
.card        { border-radius: var(--radius-md); }  /* 1.5rem = 24px */
.modal       { border-radius: var(--radius-md); }  /* 1.5rem = 24px */
.chip, .badge{ border-radius: var(--radius-lg); }  /* 2rem = 32px */
html
// Border radius — App (SCSS)
// Los tokens viven en :root como CSS custom props

.cmp-button  { border-radius: var(--radius-sm); }  // 1rem = 16px
.cmp-input   { border-radius: var(--radius-sm); }  // 1rem = 16px
.cmp-card    { border-radius: var(--radius-md); }  // 1.5rem = 24px
.cmp-modal   { border-radius: var(--radius-md); }  // 1.5rem = 24px
.cmp-chip,
.cmp-badge   { border-radius: var(--radius-lg); }  // 2rem = 32px

// Nunca usar valores arbitrarios como border-radius: 10px
```

> Fuente: `docs/transversales/fundamentos/border-radius.html` · v2.5.0

---

<!-- archivo: foundations/layout.md -->
Fundamentos

## Layout System

Estructura macro de las interfaces. Bootstrap 5 · 12 columnas · Gutter 24px · Totalmente responsive.

Bootstrap 5 12 columnas Gutter 24px Responsive

### Base estructural

12 columnas
24px gutter
B5 Bootstrap

- ✓ No modificar cantidad de columnas
- ✓ No crear grids fuera del sistema
- ✓ Siempre respetar el gutter de 24px

123456 789101112

### Container

Elige el tipo de container según el contexto de uso.

Portal · Drupal

#### .container

Ancho máximo · centrado automáticamente

container
max-width

- Landings y páginas informativas
- Contenido editorial
- Secciones de marketing

Anchos máximos
SM`540px`
MD`720px`
LG`960px`
XL`1140px`
XXL`1320px`
VS
Zona transaccional

#### .container-fluid

100% del ancho · sin límite

container-fluid
100% del ancho

- Formularios extensos
- Tablas de datos
- Paneles administrativos

En desktop mantener jerarquía visual clara y alineación a la izquierda.
Landings .container
Contenido editorial .container
Tablas de datos .container-fluid
Paneles admin .container-fluid
Formularios extensos .container-fluid
Secciones marketing .container

### Reglas clave

✓

Usar `.container` para centrar contenido con max-width

✗

No usar anchos arbitrarios (`width: 56.25rem`, etc.)

✓

Usar `.container-fluid` en interfaces operativas y dashboards

✗

No mezclar containers sin intención ni documentar el motivo

✓

Siempre usar `.row` + `.col-*` para la distribución interna

✗

No crear grids personalizados con CSS fuera del sistema Bootstrap

### Responsive — breakpoints

El layout responde por breakpoints, no por dispositivos específicos.

xs < 576px Móvil pequeño
sm ≥ 576px Móvil grande
md ≥ 768px Tablet
lg ≥ 992px Desktop sm
xl ≥ 1200px Desktop std
xxl ≥ 1400px Desktop amplio
Mobile 1 columna `col-12`
→
Tablet 2 columnas `col-md-6`
→
Desktop 3–4 columnas `col-xl-4`

### Validación rápida

1
**Revisar dispositivos clave** Mobile 375px · Tablet 820px · Desktop 1280px como base de QA.
2
**Sin scroll horizontal** En ningún breakpoint. Bloqueante para aprobación.
3
**Usar DevTools responsive** F12 → modo dispositivo → cambiar viewports manualmente
4
**Respetar grilla de 12 col** Activar grid overlay para verificar alineación
5
**Probar con contenido real** No usar Lorem ipsum. Textos largos y cortos.
6
**iOS Safari obligatorio** Inputs ≥ 16px para evitar zoom automático
Recomendado QA · iPhone SE · 375px
iPhone 14 · 393px
Recomendado tablet · iPad Air · 820px
Recomendado desktop · Laptop 1280px
Monitor 1920px

```html
<!-- Portal (Drupal) — contenido centrado -->
<div class="container">
  <div class="row">
    <div class="col-12 col-md-6 col-xl-4">
      <!-- Contenido -->
    </div>
  </div>
</div>

<!-- Zona transaccional — ancho completo -->
<div class="container-fluid">
  <div class="row">
    <div class="col-12 col-md-3"><!-- Sidebar --></div>
    <div class="col-12 col-md-9"><!-- Contenido --></div>
  </div>
</div>
html
// Angular — en el template del componente

// Landing o sección informativa
<section class="container">
  <div class="row">
    <div class="col-12 col-md-4"
         *ngFor="let item of items">
      <app-card [data]="item" />
    </div>
  </div>
</section>

// Dashboard / zona transaccional
<main class="container-fluid">
  <div class="row">
    <aside class="col-md-3"><app-sidebar /></aside>
    <div   class="col-md-9"><router-outlet /></div>
  </div>
</main>
```

> Fuente: `docs/transversales/fundamentos/layout.html` · v2.5.0

---

<!-- archivo: foundations/principles.md -->
1.1

## Principios del Sistema

Este sistema guía todas las decisiones de diseño para el Portal Público y el Portal Transaccional de Medicina Prepagada. Cada componente debe alinearse con estos principios.

01

### Claridad

La información debe presentarse de forma comprensible, directa y sin ambigüedades.

Evitar tecnicismos innecesarios y textos extensos en procesos médicos.
02

### Jerarquía funcional

Cada pantalla debe guiar al usuario hacia la acción correcta sin distracciones.

Una acción primaria clara por vista.
03

### Accesibilidad por defecto

La accesibilidad no es opcional ni posterior; es parte del diseño desde el inicio.

Todo componente debe cumplir WCAG 2.2 AA en Light, Dark y Alto Contraste.
04

### Consistencia sistemática

Los patrones deben repetirse de forma coherente para reducir carga cognitiva.

No crear variantes si ya existe un patrón aprobado.
05

### Empatía estructurada

En procesos sensibles, el sistema debe comunicar con claridad y respeto.

Los mensajes críticos deben orientar y ofrecer acción siguiente.

Estos principios son obligatorios para diseño, desarrollo y QA. Cualquier excepción **debe ser validada por UX.**

> Fuente: `docs/foundations/principles.html` · v2.5.0

---

<!-- archivo: foundations/shadows.md -->
1.4

## Sombras

Tokens de elevación e interacción. Comunican profundidad y respuesta táctil sin usar bordes. Siempre usar el token — nunca valores hardcoded.

Nunca escribir `box-shadow: 0 0.5rem 1.5rem ... /* 0px 8px 24px */` directo. Siempre `var(--shadow-2)`.   Ver en Figma
Elevación

Jerarquía de profundidad para superficies. A mayor número, mayor elevación percibida.

Tarjeta
Nivel 1
Shadow 1
Tarjetas, contenedores base
`--shadow-1`
`0.125rem 0.3125rem 1rem rgba(0,0,0,0.15) /* 2px 5px 16px */`
Modal
Nivel 2
Shadow 2
Modales, dropdowns, popovers
`--shadow-2`
`0 0.5rem 1.5rem rgba(0,0,0,0.15) /* 0px 8px 24px */`
Drawer
Nivel 3
Shadow 3
Drawers, sidebars, paneles laterales
`--shadow-3`
`0 1rem 2.5rem rgba(0,0,0,0.2) /* 0px 16px 40px */`
Overlay
Nivel 4
Shadow 4
Menús flotantes, overlays máximos
`--shadow-4`
`0 1.25rem 3.125rem rgba(0,0,0,0.2) /* 0px 20px 50px */`
Componentes UI

Sombras específicas de la shell de la aplicación.

Header
Barra de navegación fija superior
`--shadow-header`
`0 0.25rem 0.25rem rgba(0,0,0,0.25) /* 0px 4px 4px */`
Sombra 1 alias
Alias genérico — mismo valor que `--shadow-header`
`--sombra-1`
`0 0.25rem 0.25rem rgba(0,0,0,0.25) /* 0px 4px 4px */`
Interacción — Botones

Respuesta visual a estados de hover y pressed. Refuerzan el feedback táctil del componente.

Botón hover
Botón primario naranja — estado hover
`--shadow-btn-hover`
`0.125rem 0.125rem 0.1875rem rgba(255,157,92,1) /* 2px 2px 3px */`
Botón especial hover
Botón especial violeta — estado hover
`--shadow-button-special-hover`
`0.125rem 0.125rem 0.1875rem rgba(162,141,218,1) /* 2px 2px 3px */`
Botón pressed
Cualquier botón — estado activo / presionado
`--shadow-button-pressed`
`inset 0 0.25rem 0.25rem rgba(0,0,0,0.25) /* 0px 4px 4px */`
Uso en código

```html
/* Tarjeta básica */
.card {
  box-shadow: var(--shadow-1);
  transition: box-shadow 0.2s ease;
}
.card:hover {
  box-shadow: var(--shadow-2);
}

/* Modal / Diálogo */
.modal {
  box-shadow: var(--shadow-3);
}

/* Header fijo */
.site-header {
  box-shadow: var(--shadow-header);
}

/* Botones con estados */
.btn-primary:hover   { box-shadow: var(--shadow-btn-hover); }
.btn-primary:active  { box-shadow: var(--shadow-button-pressed); }
.btn-especial:hover  { box-shadow: var(--shadow-button-special-hover); }
html
// Tarjeta básica
.cmp-card {
  box-shadow: var(--shadow-1);
  transition: box-shadow 0.2s ease;

  &:hover { box-shadow: var(--shadow-2); }
}

// Modal Angular Material override
.mat-dialog-container {
  box-shadow: var(--shadow-3) !important;
}

// Botón con estados
.cmp-btn--primary {
  &:hover  { box-shadow: var(--shadow-btn-hover); }
  &:active { box-shadow: var(--shadow-button-pressed); }
}

.cmp-btn--especial {
  &:hover { box-shadow: var(--shadow-button-special-hover); }
}
```

> Fuente: `docs/transversales/fundamentos/shadows.html` · v2.5.0

---

<!-- archivo: foundations/spacing.md -->
1.4

## Espaciado

Sistema espacial transversal basado en una unidad base de **8px**. Usar siempre los tokens — nunca valores sueltos. Alineado con la grilla de 8pt de Figma y listo para implementaciones web y app.

Usar siempre `.p-16`, `.mb-24`, `var(--space-16)` — nunca valores hardcoded. Los tokens restringido requieren justificación de diseño.   Ver en Figma
8px
Unidad principal

Todo el sistema de espaciado se construye a partir de 8px. Esto asegura alineación visual entre componentes y facilita la implementación en desarrollo.

Múltiplos de **8px**: 8, 16, 24, 32, 48, 64, 96, 128 **Uso restringido:** 2px, 4px, 12px — solo cuando el diseño lo requiere explícitamente.
Nunca usar valores fuera de la escala · Nunca decimales · Siempre múltiplos de 8
Transversal para Web y App · Alineado con grilla de 8pt Figma
Tokens de espaciado

| Visual | Variable CSS | rem | Clases |  |
| --- | --- | --- | --- | --- |

Clases utilitarias
Implementación transversal
Mapa `$spacers`

```html
$space-8:   8px;
$space-16: 16px;
$space-24: 24px;
$space-32: 32px;
$space-48: 48px;
$space-64: 64px;

$spacers: (
  0: 0,
  1: $space-8,   // 8px
  2: $space-16,  // 16px
  3: $space-24,  // 24px
  4: $space-32,  // 32px
  5: $space-48,  // 48px
  6: $space-64,  // 64px
);
```

Uso en Web / App

```html
// Bootstrap utility → token CSS
// .p-3 = padding: 1rem = 16px ✗ (Bootstrap default)
// .p-3 = padding: var(--space-24) = 24px ✓ (con $spacers override)

// Angular component
.cmp-card {
  padding: var(--space-24);    // 24px
  margin-bottom: var(--space-32); // 32px
  gap: var(--space-16);        // 16px
}

.cmp-section {
  padding-block: var(--space-64); // 64px
}
```

Uso en código

```html
<!-- Padding + Margin con clases utilitarias -->
<div class="p-16 mb-24">
  contenido con padding 16px y margin-bottom 24px
</div>

<!-- Card con padding y gap -->
<div class="p-24 gap-16" style="display:flex">
  <img ...>
  <p class="mb-0">Texto de la card</p>
</div>

<!-- Sección con padding vertical grande -->
<section class="py-64 px-32">
  <h2 class="mb-16">Título</h2>
  <p class="mb-24">Descripción</p>
</section>
html
/* CSS custom properties — usar siempre var() */
.card {
  padding:       var(--space-24);  /* 24px */
  margin-bottom: var(--space-32);  /* 32px */
  gap:           var(--space-16);  /* 16px */
}

.section {
  padding-block: var(--space-64);  /* 64px */
}

.list-item {
  padding: var(--space-8) var(--space-16);  /* 8px 16px */
  gap:     var(--space-8);                  /* 8px */
}

/* Nunca: padding: 24px; ✗ */
/* Siempre: padding: var(--space-24); ✓ */
html
/* Stack: separación vertical automática entre hermanos */
.stack-8  > * + * { margin-top: var(--space-8);  }  /* 8px  */
.stack-16 > * + * { margin-top: var(--space-16); }  /* 16px */
.stack-24 > * + * { margin-top: var(--space-24); }  /* 24px */
.stack-32 > * + * { margin-top: var(--space-32); }  /* 32px */
.stack-48 > * + * { margin-top: var(--space-48); }  /* 48px */

/* Uso: */
<div class="stack-16">
  <div>Item 1</div>
  <div>Item 2</div>  <!-- margin-top: 16px automático -->
  <div>Item 3</div>
</div>
```

Accesibilidad
Reglas generales

- Mantener separación clara entre elementos interactivos.
- No compactar formularios extensos.
- No usar espaciado como único indicador de jerarquía.
- Respetar siempre múltiplos de 8px.

Elementos interactivos

- Altura mínima táctil: **44px **- Separación mínima entre botones: **8px – 16px**
- Evitar botones demasiado juntos sin separación clara.

Padding mínimo recomendado

- Componentes interactivos: mínimo **12px vertical **- Cards: mínimo **16px / 24px **- Secciones principales: **48px o superior**

Dark / High Contrast

- No reducir espaciado en modos alternativos.
- Mantener separación clara para evitar bloques densos.
- Priorizar aire visual en interfaces críticas.

> Fuente: `docs/transversales/fundamentos/spacing.html` · v2.5.0

---

<!-- archivo: foundations/typography.md -->
1.3

## Tipografía

El sistema usa exclusivamente **Roboto **en todos los contextos. Base tipográfica:** 1rem = 16px**. Cada estilo expone tres variables semánticas (`--mp-*-size`, `--mp-*-lh`, `--mp-*-weight`) y una clase CSS (`.mp-*`) lista para producción.

Nunca uses valores hardcoded. Usa `.mp-h1`, `.mp-body-l`, etc., o las variables `var(--mp-h1-size)`.   Ver en Figma

Descarga generada en vivo desde `core/abstracts/_tokens-typography.scss`, `core/base/_typography.scss` y `core/utils/_typography.scss`.

Vista previa
Mostrando tamaños desktop
Familia — Roboto
Roboto
Todas las vistas — titulares, cuerpo, labels y UI
Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz · 0 1 2 3 4 5 6 7 8 9 · ! @ # $ % & ( )
100ThinCompensar Medicina Prepagada
300LightCompensar Medicina Prepagada
400RegularCompensar Medicina Prepagada
500MediumCompensar Medicina Prepagada
700BoldCompensar Medicina Prepagada
900BlackCompensar Medicina Prepagada
Escala tipográfica · base 1rem = 16px

#### Utilidades tipográficas (qué hace cada clase)

Guía rápida y visual. Cada tarjeta te dice para qué sirve la clase y muestra una vista previa real. Fuente viva: `core/utils/_typography.scss`.

##### Alineación y formato `.u-text-left .u-fs-* .u-fw-* ...`

Ejemplo directo: `.u-text-left` alinea el texto a la izquierda.

##### Color de texto `.u-text-*`

Cada tarjeta muestra el nombre de la clase y su color aplicado en vista previa.

##### Comportamiento `.u-truncate .u-line-clamp-* ...`

Utilidades para textos largos: recorte con puntos, saltos de línea y quiebre de palabras.

##### Estandar recomendado (uso diario)

Si no sabes que clase usar, empieza con esta tabla. Estas combinaciones cubren la mayoria de pantallas sin romper consistencia.

| Caso | Clases ideales | Ejemplo rapido |
| --- | --- | --- |
| Parrafo principal | `.u-fs-md .u-lh-relaxed .u-text-primary` | `<p class="u-fs-md u-lh-relaxed u-text-primary">...</p>` |
| Texto secundario / apoyo | `.u-fs-sm .u-text-muted` | `<p class="u-fs-sm u-text-muted">...</p>` |
| Titulo de card o bloque | `.u-fw-bold .u-text-primary` | `<h3 class="u-fw-bold u-text-primary">...</h3>` |
| Label de formulario | `.u-uppercase .u-fw-bold .u-fs-sm` | `<label class="u-uppercase u-fw-bold u-fs-sm">...</label>` |
| Enlace dentro de texto | `.u-text-link` | `<a class="u-text-link" href="#">...</a>` |
| Titulo largo en listado | `.u-line-clamp-2` | `<h4 class="u-line-clamp-2">...</h4>` |
| Texto de una linea en tabla | `.u-truncate` | `<span class="u-truncate">...</span>` |
| Contenido con palabras largas | `.u-break-word` | `<p class="u-break-word">...</p>` |

/g,'>'); } function renderItem(item){ const clsId = item.cls.replace(/-/g,'_'); const cssSnippet = `.${item.cls} {\n font-size: var(--${item.cls}-size); /* ${item.desk.rem} / ${item.desk.px}px */\n font-weight: var(--${item.cls}-weight); /* ${item.w} */\n line-height: var(--${item.cls}-lh); /* ${item.lh} */\n font-family: var(--font-body);\n${item.extra ? ' '+item.extra.replace(/;(\s*)/g,';\n ').trim()+'\n' : ''} color: var(${item.color});\n}`; const clampSnippet = `.${item.cls} {\n font-size: ${item.clamp};\n font-weight: ${item.w};\n line-height: ${item.lh};\n font-family: var(--font-body);\n color: var(${item.color});\n}`; return `
${item.preview}
${item.name}
Tamaño desk ${item.desk.rem} / ${item.desk.px}px
${item.desk.rem !== item.mob.rem ? `
Tamaño app ${item.mob.rem} / ${item.mob.px}px
` : ''}
Grosor ${item.w} ${item.wn}
Line height ${item.lh}
Figma `${item.token}`
Size `--${item.cls}-size`
Weight `--${item.cls}-weight`
LH `--${item.cls}-lh`
Clase `.${item.cls}`
${item.clamp !== item.desk.rem ? `
clamp() `${item.clamp}`
` : ''}
HTML

```html
${escape(item.html)}
```

CSS vars

```html
${escape(cssSnippet)}
```

${item.desk.rem !== item.mob.rem ? `
CSS clamp()

```html
${escape(clampSnippet)}
```

` : ''}
`; } function tyToggleCode(id){ const tog = document.getElementById('code-tog-'+id); const pan = document.getElementById('code-pan-'+id); tog.classList.toggle('open'); pan.classList.toggle('open'); } window.tyToggleCode = tyToggleCode; function renderAll(){ const root = document.getElementById('ty-scale-root'); if(!root) return; let html = '
'; CATS.forEach(cat=>{ html += `
${cat.title} ${cat.desc}
`; cat.items.forEach(item=>{ html += renderItem(item); }); html += '
'; }); html += '
'; root.innerHTML = html; } renderAll(); /* ── Download helpers ────────────────────────────────── */ const TY_DIRECT_DOC = location.pathname.includes('/docs/'); const CORE_TYPO_TOKENS_URL = TY_DIRECT_DOC ? '../../../core/abstracts/_tokens-typography.scss' : 'core/abstracts/_tokens-typography.scss'; const CORE_TYPO_CLASSES_URL = TY_DIRECT_DOC ? '../../../core/base/_typography.scss' : 'core/base/_typography.scss'; const CORE_TYPO_UTILS_URL = TY_DIRECT_DOC ? '../../../core/utils/_typography.scss' : 'core/utils/_typography.scss'; const TY_SASS_SIZE_MAP = { 'mp-display-l': 'fs-display-l', 'mp-display-m': 'fs-display-m', 'mp-display-xl-mob': 'fs-display-mob-xl', 'mp-display-l-mob': 'fs-display-mob-l', 'mp-display-m-mob': 'fs-display-mob-m', 'mp-h1': 'fs-h1', 'mp-h2': 'fs-h2', 'mp-h3': 'fs-h3', 'mp-h4': 'fs-h4', 'mp-h5': 'fs-h5', 'mp-h6': 'fs-h6', 'mp-eyebrow': 'fs-eyebrow', 'mp-parrafo-xl': 'fs-paragraph-xl', 'mp-parrafo-l': 'fs-paragraph-l', 'mp-body-2xl': 'fs-body-2xl', 'mp-body-xl': 'fs-body-xl', 'mp-body-l': 'fs-body-l', 'mp-body-m': 'fs-body-m', 'mp-body-s': 'fs-body-s', 'mp-body-xs': 'fs-body-xs', 'mp-btn': 'fs-button', 'mp-label': 'fs-label', 'mp-hint': 'fs-hint', 'mp-placeholder': 'fs-placeholder' }; async function tyReadCoreSource(url){ try { const res = await fetch(url); return res.ok ? await res.text() : ''; } catch (_) { return ''; } } function tyParseSassVars(source){ const vars = {}; source.replace(/^\$([a-z0-9-]+):\s*([^;]+);/gim, (_, name, value)=>{ vars[name] = value.trim(); return ''; }); return vars; } function tyRemToPx(value){ const rem = Number.parseFloat(String(value).replace('rem','')); return Number.isFinite(rem) ? Math.round(rem * 16) : null; } async function tyGetLiveCats(){ const [tokensSource, classesSource] = await Promise.all([ tyReadCoreSource(CORE_TYPO_TOKENS_URL), tyReadCoreSource(CORE_TYPO_CLASSES_URL) ]); const sassVars = tyParseSassVars(tokensSource); const cats = CATS.map(cat => ({ ...cat, items: cat.items.map(item => { const sassName = TY_SASS_SIZE_MAP[item.cls]; const size = sassVars[sassName]; const px = size ? tyRemToPx(size) : null; return { ...item, source: { tokens: CORE_TYPO_TOKENS_URL, classes: CORE_TYPO_CLASSES_URL, live: Boolean(size && classesSource.includes(`.${item.cls}`)) }, desk: size && px ? { rem: size, px } : item.desk }; }) })); return cats; } function tyClassifyUtility(className, props, body) { const propNames = props.map(p => p.name); const hasColor = propNames.includes('color'); const hasTypo = propNames.some(name => [ 'text-align', 'text-transform', 'font-weight', 'font-size', 'line-height', 'letter-spacing', 'font-style', 'text-decoration' ].includes(name)); if (hasColor || className.startsWith('u-text-')) return 'color'; if (hasTypo) return 'type'; if (className.startsWith('u-fs-') || className.startsWith('u-fw-') || className.startsWith('u-lh-') || className.startsWith('u-ls-')) return 'type'; if (body.includes('@include')) return 'behavior'; return 'behavior'; } function tyParseUtilitiesFromScss(utilsScss) { const re = /\.([a-z0-9-]+)\s*\{([\s\S]*?)\}/gim; const out = { type: [], color: [], behavior: [] }; let match; while ((match = re.exec(utilsScss)) !== null) { const className = match[1].trim(); const body = match[2].trim(); const props = []; body.replace(/([a-z-]+)\s*:\s*([^;]+);/gim, (_, name, value) => { props.push({ name: name.trim(), value: value.trim() }); return ''; }); const tokenMatch = body.match(/var\((--[^)]+)\)/); const group = tyClassifyUtility(className, props, body); const property = props.length ? props.map(p => p.name).join(', ') : (body.includes('@include') ? 'mixin' : 'regla'); const value = props.length ? props.map(p => p.value).join(' | ') : body.replace(/\s+/g, ' ').trim(); out[group].push({ cls: `.${className}`, token: tokenMatch ? tokenMatch[1] : '—', property, value }); } Object.keys(out).forEach(key => { out[key].sort((a, b) => a.cls.localeCompare(b.cls)); }); return out; } function tyUtilityMeaning(className) { const cls = className.replace(/^\./, ''); if (cls === 'u-text-left') return `${cls} alinea el texto a la izquierda.`; if (cls === 'u-text-center') return `${cls} centra el texto.`; if (cls === 'u-text-right') return `${cls} alinea el texto a la derecha.`; if (/^u-text-(sm|md|lg)-(left|center|right)$/.test(cls)) { const parts = cls.split('-'); return `${cls} alinea el texto en breakpoint ${parts[2]} (${parts[3]}).`; } if (/^u-fs-/.test(cls)) return `${cls} define tamaño de fuente.`; if (/^u-fw-/.test(cls)) return `${cls} define peso tipográfico.`; if (/^u-lh-/.test(cls)) return `${cls} define interlineado.`; if (/^u-ls-/.test(cls)) return `${cls} define espaciado entre letras.`; if (cls === 'u-uppercase') return `${cls} convierte el texto a mayúsculas.`; if (cls === 'u-lowercase') return `${cls} convierte el texto a minúsculas.`; if (cls === 'u-capitalize') return `${cls} pone iniciales en mayúscula.`; if (cls === 'u-normal-case') return `${cls} mantiene capitalización normal.`; if (/^u-text-/.test(cls)) return `${cls} aplica color de texto semántico.`; if (cls === 'u-truncate') return `${cls} recorta texto en una línea con puntos suspensivos.`; if (/^u-line-clamp-/.test(cls)) return `${cls} limita el texto a un número de líneas.`; if (/^u-whitespace-/.test(cls)) return `${cls} controla el manejo de espacios y saltos.`; if (/^u-break-/.test(cls)) return `${cls} controla el quiebre de palabras.`; if (cls === 'u-underline') return `${cls} subraya el texto.`; if (cls === 'u-line-through') return `${cls} tacha el texto.`; if (cls === 'u-no-underline') return `${cls} quita subrayado.`; if (cls === 'u-italic') return `${cls} aplica estilo itálico.`; if (cls === 'u-not-italic') return `${cls} quita estilo itálico.`; return `${cls} aplica una utilidad tipográfica.`; } function tyUtilityPreviewText(group, cls) { if (group === 'behavior') return 'Texto de ejemplo largo para ver cómo se comporta esta utilidad en contenedores reales de interfaz.'; if (group === 'color') return 'Texto de ejemplo con color aplicado'; if (cls === '.u-uppercase') return 'Texto de ejemplo'; return 'Texto de ejemplo de tipografía'; } function tyCopyUtilityClass(cls) { navigator.clipboard.writeText(cls).then(() => { if (typeof showToast === 'function') { showToast('Clase copiada: ' + cls); } }); } function tyRenderUtilityGrid(gridId, items, emptyText, group) { const grid = document.getElementById(gridId); if (!grid) return; if (!items.length) { grid.innerHTML = `
**No hay utilidades en esta categoria**

${emptyText}

`; return; } grid.innerHTML = items.map(item => { const utilityClass = item.cls.replace(/^\./, ''); const previewText = tyUtilityPreviewText(group, item.cls); const meaning = tyUtilityMeaning(item.cls); const previewClass = group === 'color' ? ' ty-util-preview--color' : ''; return `  `; }).join(''); } async function tyRenderUtilitiesFromSource() { try { const utilsScss = await tyReadCoreSource(CORE_TYPO_UTILS_URL); const parsed = tyParseUtilitiesFromScss(utilsScss || ''); const setCount = (id, count) => { const el = document.getElementById(id); if (el) el.textContent = String(count); }; setCount('ty-util-type-count', parsed.type.length); setCount('ty-util-color-count', parsed.color.length); setCount('ty-util-behavior-count', parsed.behavior.length); tyRenderUtilityGrid('ty-util-type-grid', parsed.type, 'Define clases en core/utils/_typography.scss para verlas aqui.', 'type'); tyRenderUtilityGrid('ty-util-color-grid', parsed.color, 'Define clases de color con var(--...) en core/utils/_typography.scss.', 'color'); tyRenderUtilityGrid('ty-util-behavior-grid', parsed.behavior, 'Agrega reglas de truncado, whitespace o word-break en core/utils/_typography.scss.', 'behavior'); } catch (error) { console.warn('Typography utilities rendering skipped:', error); } } window.tyUtilTab = function(btn, panelId) { document.querySelectorAll('.ty-util-tab').forEach(b => b.classList.remove('active')); document.querySelectorAll('.ty-util-panel').forEach(p => p.classList.remove('active')); btn.classList.add('active'); const panel = document.getElementById(panelId); if (panel) panel.classList.add('active'); }; window.tyCopyUtilityClass = tyCopyUtilityClass; function tyDownloadFile(filename, content, type){ const blob = new Blob([content],{type}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); } function tyToMauiKey(cls){ return cls .replace(/^mp-/, 'Mp-') .split('-') .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '') .join(''); } async function tyDownloadMAUI(){ const cats = await tyGetLiveCats(); const d = new Date().toISOString().split('T')[0]; const lines = [ '?xml version="1.0" encoding="utf-8" ?>', '', ` `, ' ', ' Roboto', ' Roboto', '' ]; cats.forEach(cat => { lines.push(` `); cat.items.forEach(it => { const key = tyToMauiKey(it.cls); lines.push(` ${it.mob.px}`); lines.push(` ${it.lh}`); lines.push(` ${it.w}`); lines.push(` '); lines.push(''); }); }); lines.push(''); tyDownloadFile('Typography.Maui.xaml', lines.join('\n'), 'application/xml'); } function tyBuildUtilitiesCss(utilsScss){ const re = /\.([a-z0-9-]+)\s*\{([\s\S]*?)\}/gim; const lines = []; let match; while ((match = re.exec(utilsScss)) !== null) { const className = match[1].trim(); const body = match[2].trim(); const props = []; body.replace(/([a-z-]+)\s*:\s*([^;]+);/gim, (_, name, value) => { props.push({ name: name.trim(), value: value.trim() }); return ''; }); if (!props.length) continue; lines.push(`.${className} {`); props.forEach(prop => lines.push(` ${prop.name}: ${prop.value};`)); lines.push('}'); } return lines.join('\n'); } async function tyDownloadCSS(){ const [cats, utilsScss] = await Promise.all([ tyGetLiveCats(), tyReadCoreSource(CORE_TYPO_UTILS_URL) ]); const d = new Date().toISOString().split('T')[0]; let lines = [ `/* ════════════════════════════════════════════════════════════════════ TYPOGRAPHY TOKENS — Compensar Medicina Prepagada · Design System v2 ──────────────────────────────────────────────────────────────────── Fuente : Figma · Compensar v2 – Sistema de diseño Generado : ${d} Archivo : typography-tokens.css Fuente : Roboto (Google Fonts) Base rem : 1rem = 16px Core : core/abstracts/_tokens-typography.scss core/base/_typography.scss core/utils/_typography.scss CONTENIDO ───────── 1. Custom properties :root — --mp-h1-size, --mp-h1-lh, --mp-h1-weight… 2. Clases utilitarias .mp-* — .mp-h1, .mp-body-l, .mp-eyebrow… 3. Clamp responsive — font-size: clamp(min, fluid, max) 4. Utilidades .u-* — core/utils/_typography.scss 5. Fuente: @import Google Fonts REGLA DE USO ──────────── ✓

## Título

✓ font-size: var(--mp-h1-size); ✗ Nunca font-size: 32px (valor hardcoded) INSTALACIÓN ─────────── 1. Importar Roboto:  2. Importar tokens:  ════════════════════════════════════════════════════════════════════ */ /* ─── Google Fonts ──────────────────────────────────────────────────── */ @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap'); /* ───────────────────────────────────────────────────────────────────── 1. CUSTOM PROPERTIES Cada estilo expone 3 variables: -size, -lh (line-height), -weight. ──────────────────────────────────────────────────────────────────── */ :root { --font-body: 'Roboto', sans-serif; --font-code: 'Roboto Mono', monospace; `]; cats.forEach(cat=>{ lines.push(`\n /* ── ${cat.title} */`); cat.items.forEach(it=>{ lines.push(` ${it.token}: ${it.desk.rem};`); lines.push(` --${it.cls}-size: ${it.desk.rem}; /* ${it.desk.px}px */`); lines.push(` --${it.cls}-lh: ${it.lh};`); lines.push(` --${it.cls}-weight: ${it.w}; /* ${it.wn} */`); }); }); lines.push( `} /* ───────────────────────────────────────────────────────────────────── 2. CLASES .mp-* Uso:

### Encabezado

Cada clase aplica las 3 propiedades tipográficas del token. ──────────────────────────────────────────────────────────────────── */`); cats.forEach(cat=>{ lines.push(`\n/* ── ${cat.title} */`); cat.items.forEach(it=>{ const extra = it.extra ? '\n ' + it.extra.replace(/;(\s*)/g,';\n ').trim() : ''; const clamp = it.clamp ? `\n /* Responsive clamp: ${it.clamp} */\n font-size: ${it.clamp};` : ''; lines.push(`.${it.cls} {\n font-size: var(--${it.cls}-size); /* ${it.desk.px}px desktop */${clamp}\n font-weight: var(--${it.cls}-weight);\n line-height: var(--${it.cls}-lh);\n font-family: var(--font-body);${extra}\n}`); }); }); if (utilsScss) { const utilitiesCss = tyBuildUtilitiesCss(utilsScss); if (utilitiesCss) { lines.push( `\n/* ───────────────────────────────────────────────────────────────────── 3. UTILIDADES TIPOGRÁFICAS (.u-*) Generadas desde core/utils/_typography.scss Nota: reglas basadas en mixins (truncate/line-clamp responsive) se conservan en la descarga SCSS para uso completo de Sass. ──────────────────────────────────────────────────────────────────── */`); lines.push(utilitiesCss); } } lines.push('\n/* ── FIN: typography-tokens.css ─── Compensar Medicina Prepagada ── */'); tyDownloadFile('typography-tokens.css', lines.join('\n'), 'text/css'); } async function tyDownloadSCSS(){ const [cats, utilsScss] = await Promise.all([ tyGetLiveCats(), tyReadCoreSource(CORE_TYPO_UTILS_URL) ]); const d = new Date().toISOString().split('T')[0]; let lines = [ `// ════════════════════════════════════════════════════════════════════ // TYPOGRAPHY TOKENS — Compensar Medicina Prepagada · Design System v2 // ──────────────────────────────────────────────────────────────────── // Fuente : Figma · Compensar v2 – Sistema de diseño // Generado : ${d} // Archivo : _typography-tokens.scss // Fuente : Roboto (Google Fonts) // Base rem : 1rem = 16px // Core : core/abstracts/_tokens-typography.scss // core/base/_typography.scss // core/utils/_typography.scss // // CONTENIDO // ───────── // 1. Variables Sass por estilo ($mp-h1-size, $mp-h1-lh, $mp-h1-weight) // 2. Clases CSS listas (.mp-*) // 3. Utilidades .u-* (source core) // // REGLA // ───── // ✓ Usa estas clases o variables // ✗ Evita valores hardcoded // ════════════════════════════════════════════════════════════════════ $font-body: 'Roboto', sans-serif; $font-code: 'Roboto Mono', monospace; `]; lines.push('// ─────────────────────────────────────────────────────────────────────'); lines.push('// 1. VARIABLES SASS'); lines.push('// ─────────────────────────────────────────────────────────────────────'); cats.forEach(cat=>{ lines.push(`\n// ── ${cat.title}`); cat.items.forEach(it=>{ lines.push(`// Figma token: ${it.token}`); lines.push(`$${it.cls}-size: ${it.desk.rem}; // ${it.desk.px}px desktop | móvil: ${it.mob.px}px`); lines.push(`$${it.cls}-lh: ${it.lh};`); lines.push(`$${it.cls}-weight: ${it.w}; // ${it.wn}`); }); }); lines.push('\n// ─────────────────────────────────────────────────────────────────────'); lines.push('// 2. CLASES .mp-* (LISTAS PARA USAR)'); lines.push('// ─────────────────────────────────────────────────────────────────────'); cats.forEach(cat=>{ lines.push(`\n// ── ${cat.title}`); cat.items.forEach(it=>{ lines.push(`.${it.cls} {`); lines.push(` font-size: $${it.cls}-size;`); lines.push(` font-weight: $${it.cls}-weight;`); lines.push(` line-height: $${it.cls}-lh;`); lines.push(` font-family: $font-body;`); if (it.extra) { it.extra.split(';').map(v => v.trim()).filter(Boolean).forEach(rule => { lines.push(` ${rule};`); }); } lines.push(`}`); }); }); if (utilsScss) { lines.push('\n// ─────────────────────────────────────────────────────────────────────'); lines.push('// 3. UTILIDADES .u-* (SOURCE)'); lines.push('// ─────────────────────────────────────────────────────────────────────'); lines.push(utilsScss.trim()); } lines.push('\n// ── FIN: _typography-tokens.scss ─── Compensar Medicina Prepagada ──'); tyDownloadFile('_typography-tokens.scss', lines.join('\n'), 'text/plain'); } async function tyDownloadJSON(){ const [cats, utilsScss] = await Promise.all([ tyGetLiveCats(), tyReadCoreSource(CORE_TYPO_UTILS_URL) ]); const d = new Date().toISOString().split('T')[0]; const categories = {}; cats.forEach(cat=>{ categories[cat.title] = cat.items.map(it=>({ token: it.cls, cssClass: '.' + it.cls, figmaToken: it.token, desktop: { fontSize: it.desk.rem, fontSizePx: it.desk.px }, mobile: { fontSize: it.mob.rem, fontSizePx: it.mob.px }, clamp: it.clamp || null, lineHeight: it.lh, fontWeight: it.w, fontWeightName: it.wn, cssVariables: { size: '--' + it.cls + '-size', lh: '--' + it.cls + '-lh', weight: '--' + it.cls + '-weight' } })); }); const out = { metadata: { title: 'Typography Tokens — Compensar Medicina Prepagada', version: '2.0', generatedAt: d, source: 'Figma · Compensar v2 – Sistema de diseño', coreSources: [ 'core/abstracts/_tokens-typography.scss', 'core/base/_typography.scss', 'core/utils/_typography.scss' ], fontFamily: 'Roboto (Google Fonts)', baseRem: '1rem = 16px', description: 'Escala tipográfica completa del Design System. Cada token expone size, line-height y font-weight.', usage: { html: '

## Título

', css: 'font-size: var(--mp-h1-size);', sass: '@include mp-h1;', rule: 'Nunca usar valores hardcoded (font-size: 32px). Siempre token o clase .mp-*.' } }, categories, utilities: utilsScss ? tyParseUtilitiesFromScss(utilsScss) : { type: [], color: [], behavior: [] } }; tyDownloadFile('typography-tokens.json', JSON.stringify(out,null,2), 'application/json'); } window.tyDownloadCSS = tyDownloadCSS; window.tyDownloadSCSS = tyDownloadSCSS; window.tyDownloadJSON = tyDownloadJSON; window.tyDownloadMAUI = tyDownloadMAUI; if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', tyRenderUtilitiesFromSource); } else { tyRenderUtilitiesFromSource(); } })();

> Fuente: `docs/transversales/fundamentos/typography.html` · v2.5.0

---

<!-- archivo: patterns/dark-mode.md -->
## Dark Mode — Reglas de uso

> Fuente: `docs/guidelines/dark-mode.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

El modo oscuro reduce la fatiga visual, respeta la preferencia del sistema del usuario y mantiene la identidad de marca. Su implementación correcta depende exclusivamente de tokens semánticos `--use-*` — nunca de colores hardcodeados.

Estado: estable Web · ZT Drupal Tokens semánticos WCAG AA

### Principios generales

El sistema conmuta entre temas únicamente cambiando `data-theme` en el elemento raíz. Ningún componente debe tener lógica de color propia.

- Usa solo tokens `--use-*`; nunca valores raw.
- Las superficies se apilan por elevación, no por brillo arbitrario.
- El contraste texto / fondo ≥ 4.5:1 en todo momento (WCAG AA).
- El naranja de marca se aclara en dark para conservar legibilidad.

### Superficies y elevación

Las superficies definen profundidad mediante tokens, no colores arbitrarios. En dark, cada nivel es ligeramente más claro que el anterior.

- Nivel 0 — fondo de página: `--use-surface-bg`
- Nivel 1 — cards y paneles: `--use-surface-white`
- Nivel 2 — modales y popovers: `--use-surface-theme-gray-5`
- No mezclar niveles sin borde o separador visual.

### Color y tokens semánticos

Los tokens de estado mantienen su semántica en dark — solo cambia el tono para garantizar contraste.

- El primario naranja aclara a `#FF9D5C` (base/brand/80 dark).
- Badges, chips y tags adaptan su tono automáticamente.
- Los botones secundario y terciario usan bordes más visibles.
- No redefinas colores en componentes individuales.

### Alertas y feedback

Los componentes de feedback mantienen su semántica en dark — el color cambia de tono pero nunca de significado.

- No depender solo del color para comunicar el estado.
- El icono refuerza el mensaje en todos los temas.
- El texto siempre debe ser legible sobre el fondo del alert.
- Los toasts heredan los tokens de superficie nivel 2.

### Inputs y formularios

Los campos de formulario adaptan fondo, borde y texto automáticamente. El error siempre combina icono + texto.

- El borde del campo es visible en default, focus y error.
- El placeholder usa `--use-text-placeholder` (contraste suficiente).
- Labels siempre visibles — nunca desaparecen al enfocar.
- El estado de error no depende solo del color rojo.

### Navegación y estados interactivos

Todos los estados (hover, focus, active, disabled) deben ser perceptibles en dark sin ajustes manuales.

- El focus ring usa `--use-focus-ring` que cambia en dark automáticamente.
- Los botones disabled bajan opacidad sin perder legibilidad.
- El breadcrumb y tabs usan tokens de texto y borde.
- El ítem activo combina color + borde para no depender solo del tono.

### Cards y contenedores

Las cards no necesitan ajuste manual — sus tokens de superficie y borde se adaptan en dark.

- Las sombras se reducen en dark — el borde suple su función.
- Imágenes fotográficas nunca se filtran ni invierten.
- La jerarquía de contenido se mantiene sin cambios de HTML.
- Los dividers usan `--use-border-subtle` siempre.

### Sí hacer

- Usar siempre tokens `--use-*` para colores.
- Probar el flujo completo en dark antes de entregar.
- Validar contraste ≥ 4.5:1 con herramienta automática.
- Mantener la jerarquía tipográfica visible en todos los temas.
- Conservar bordes en contenedores cuando no hay sombra.

### No hacer

- Usar colores hexadecimales o RGB hardcodeados.
- Invertir imágenes fotográficas o ilustraciones con `filter: invert()`.
- Depender solo del color para comunicar un estado.
- Mezclar superficies de distinto nivel sin separación visual.
- Aplicar `filter: brightness()` a iconos SVG del sistema.

### Accesibilidad en dark mode

4.5:1

Contraste mínimo para texto normal (WCAG AA)

3:1

Contraste mínimo para texto grande (≥ 18px bold o ≥ 24px)

3:1

Contraste mínimo para componentes UI e íconos informativos

70%

Opacidad mínima de texto en estados secundarios

- El focus ring cambia automáticamente con `--use-focus-ring` en dark.
- Validar con usuarios reales que usan el modo oscuro del sistema operativo.
- Los iconos decorativos tienen `aria-hidden="true"` en todos los temas.
- Los mensajes de error incluyen texto descriptivo, no solo color.

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Propiedades / API, Responsive. No se completa con suposiciones.

---

<!-- archivo: patterns/form-patterns.md -->
## Form Patterns

> Fuente: `docs/guidelines/form-patterns.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Guía de estructura, layout y componentes para construir formularios accesibles y de alta conversión. Incluye el componente `mp-stepper` para flujos multi-paso.

Estado: estable Web · ZT Drupal Componente: mp-stepper WCAG AA

### Resumen

#### Principios

- Labels siempre visibles — nunca reemplazar con placeholder.
- Campos obligatorios marcados con `*` y leyenda al inicio.
- Agrupar campos relacionados en secciones con título en MAYÚSCULAS.
- Acción primaria (enviar) a la derecha; terciaria (cancelar) a la izquierda.
- Feedback de validación inline — no solo al hacer submit.
- Usar `mp-stepper` en flujos de más de 2 pasos o con 7+ campos.

#### Do

Label visible sobre el campo, estado de error con icono y texto.

Campo obligatorio

#### Don't

No uses placeholder como label ni indiques error solo con color.

### Stepper — Anatomía interactiva

El componente `mp-stepper` indica el avance en formularios multi-paso mediante barras de progreso proporcionales.

**Head **`.mp-stepper__head` — contenedor del count y título del paso.** Count + Title **`.mp-stepper__count` texto secundario. `.mp-stepper__title` heading semántico.** Track **`.mp-stepper__track` — fila flex de barras, `role="progressbar"` con `aria-valuenow`.** Barras **`.is-done` completado · `.is-current` activo · sin clase = pendiente.** Compact** `.mp-stepper--compact` oculta el head. Usar cuando el título del paso vive fuera del stepper.
2 px — alto barra 3 barras

### Variantes

Paso 1 de 3 — inicio

Paso 1 de 3

#### Datos personales

Paso 2 de 3 — en progreso

Paso 2 de 3

#### Elige la fecha y hora

Paso 3 de 3 — último

Paso 3 de 3

#### Confirmación y envío

5 pasos — intermedio

Paso 3 de 5

#### Información médica

Compact — solo barras

Paso 2 de 4

#### Modos de color

Light

Paso 2 de 3

#### Elige la fecha

Dark

Paso 2 de 3

#### Elige la fecha

High Contrast

Paso 2 de 3

#### Elige la fecha

```html
<!-- Stepper estándar -->
<div class="mp-stepper" role="group" aria-label="Progreso del formulario">
  <div class="mp-stepper__head">
    <span class="mp-stepper__count">Paso 2 de 3</span>
    <h2 class="mp-stepper__title">Elige la fecha y hora</h2>
  </div>
  <div class="mp-stepper__track"
       role="progressbar"
       aria-valuenow="2"
       aria-valuemin="1"
       aria-valuemax="3"
       aria-label="Paso 2 de 3">
    <div class="mp-stepper__bar is-done"></div>
    <div class="mp-stepper__bar is-current"></div>
    <div class="mp-stepper__bar"></div>
  </div>
</div>

<!-- Variante compact -->
<div class="mp-stepper mp-stepper--compact" role="group" aria-label="Paso 2 de 4">
  <div class="mp-stepper__track" role="progressbar" aria-valuenow="2" aria-valuemin="1" aria-valuemax="4" aria-label="Paso 2 de 4">
    <div class="mp-stepper__bar is-done"></div>
    <div class="mp-stepper__bar is-current"></div>
    <div class="mp-stepper__bar"></div>
    <div class="mp-stepper__bar"></div>
  </div>
</div>
```

### Estructura base de formulario

Demo interactivo: Reembolso de medicamentos. Interactúa con los campos, selects y botones.

#### Grilla de campos

- **1 col** — campos largos (nombre, descripción).
- **2 col** — campos relacionados (tipo doc / número).
- **3 col** — campos cortos en la misma fila.
- Gap entre campos: `16 px`.
- Gap entre secciones: `32 px`.

#### Orden recomendado

- Breadcrumb de contexto.
- Título + descripción del formulario.
- Alert informativo si aplica.
- Secciones con título en MAYÚSCULAS.
- Acciones al final.

#### Acciones

- Primario (enviar) a la derecha.
- Terciario (cancelar) a la izquierda.
- Máximo 3 acciones visibles.

### Reembolso de medicamentos

Diligencia el formulario para gestionar el reembolso de tus medicamentos.

Importante

Si eres usuario de programas especiales (VIH, cáncer, artritis), solicita el reembolso directamente a miprescompensar@compensarsalud.com.

### Formulario multi-paso

Patrón para flujos con más de 7 campos o con dependencias lógicas. El stepper siempre al inicio de cada paso.

#### Cuándo usar

- Más de 7–8 campos en total.
- Secciones con dependencias lógicas entre pasos.
- Flujos de agendamiento, afiliación o radicación.

#### Reglas de navegación

- Stepper siempre al inicio del paso.
- "Regresar" no borra datos ingresados.
- Validar antes de avanzar al paso siguiente.
- Ofrecer guardar borrador en flujos largos.

#### Último paso

- Mostrar resumen antes del envío final.
- Confirmar con modal si la acción es irreversible.

Paso 2 de 3

#### Elige la fecha y hora

### Comportamiento y reglas

#### Sí hacer

- Label visible sobre cada campo.
- Campos obligatorios con `*` y leyenda visible.
- Error inline con icono + texto descriptivo.
- Agrupar campos en secciones.
- Stepper en flujos de más de 2 pasos.
- Regresar sin perder datos ingresados.

#### No hacer

- Usar el placeholder como reemplazo del label.
- Pedir información innecesaria o duplicada.
- Validar solo al hacer submit.
- Ocultar el stepper en pasos intermedios.
- Más de 3 acciones en la barra de botones.
- Reiniciar el formulario al navegar entre pasos.

### Accesibilidad y checklist QA

#### Accesibilidad

- Label siempre visible — nunca reemplazar con placeholder.
- Altura mínima 44 px en campos y botones (WCAG).
- Errores: `aria-invalid="true"` + `aria-describedby` al mensaje.
- Mensaje de error = icono + texto, nunca solo color.
- `mp-stepper__track` con `role="progressbar"` y `aria-valuenow/min/max`.
- Selects: clase combinada `mp-input-field mp-select`.

#### Checklist QA

- Labels visibles y asociados con `for`/`id`.
- Campos obligatorios con `*` y leyenda al inicio.
- Errores: `aria-invalid`, icono y texto descriptivo.
- Stepper actualiza `aria-valuenow` al navegar.
- "Regresar" no borra datos ya ingresados.
- Se ve correctamente en Light, Dark y High Contrast.
- Focus ring visible con navegación por teclado.

### Pendiente de documentación

La página de origen no trae contenido para: Estados, Propiedades / API, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: patterns/high-contrast.md -->
## High Contrast — Reglas de uso

> Fuente: `docs/guidelines/high-contrast.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Modo enfocado en maximizar la legibilidad y facilitar la interacción para todos los usuarios, especialmente en condiciones de baja visión.

Estado: estable Web / ZT Drupal Accesibilidad Figma: 4727:4458

### Principios generales

- El fondo principal debe ser negro o muy oscuro.
- El texto principal debe mantener contraste máximo.
- La estructura debe seguir siendo clara sin depender solo del color.
- Los estados interactivos deben tener borde, icono o texto adicional.

### Reglas de color

- Usar tokens semánticos del sistema, no colores hardcodeados.
- Las variantes deben conservar significado y contraste.
- Evitar grises suaves cercanos al fondo.
- No usar color como único indicador de estado.

### Contenedores y superficies

- Los contenedores deben tener borde visible.
- No depender de sombras para separar elementos.
- Las cards deben conservar jerarquía en ambos modos.
- El contenido debe seguir siendo escaneable.

### Imágenes reales

- Las imágenes deben mantenerse sin filtros automáticos.
- No alterar brillo, contraste ni color de forma artificial.
- Validar que la imagen sea visible en superficies oscuras.
- No usar la imagen como único medio de comunicación.

### Estados e interacción

- Hover, focus y selected deben diferenciarse claramente.
- El focus debe ser visible con teclado.
- Los estados deben combinar color, borde, texto o icono.
- Los alertas deben conservar rol semántico.

### Inputs y formularios

- Los labels deben permanecer visibles.
- El borde del campo debe ser claro en default, focus y error.
- El error debe comunicarse con texto e icono, no solo color.
- El placeholder no debe competir con el contenido.

### Navegación y botones

- Los enlaces de navegación deben conservar foco visible.
- Los botones deben mantener contraste en todos sus estados.
- Usar componentes del sistema para evitar variaciones manuales.
- No mezclar estilos inline con componentes productivos.

### Consideraciones para HTML

- Usar siempre tokens o variables semánticas.
- Evitar estilos inline en implementación productiva.
- Validar estados hover, focus, active y disabled.
- Evitar sombras como único separador.

### Buenas prácticas

- Priorizar legibilidad sobre estética.
- Simplificar la interfaz cuando sea necesario.
- Usar componentes reales del sistema.
- Probar los flujos completos en alto contraste.

### Accesibilidad

- Mantener contraste mínimo 4.5:1 o superior.
- No depender solo del color para comunicar información.
- Asegurar navegación por teclado.
- Mantener focus visible en todos los elementos interactivos.

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Propiedades / API, Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: patterns/motion-animation.md -->
## Motion / Animación

> Fuente: `docs/guidelines/motion-animation.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Guía transversal para definir duraciones, curvas de easing y criterios de uso de animación en Web, ZT Drupal y App. La animación debe orientar, confirmar y reducir fricción, no decorar sin propósito.

Estado: estable Web / App Accesibilidad Reduced motion

### Resumen

#### Principios

- Usar motion para comunicar cambio de estado, jerarquía o navegación.
- Animar propiedades baratas: `opacity`, `transform`, `box-shadow` y color.
- Evitar animar layout: width, height, margin, top, left o contenido de texto.
- Respetar `prefers-reduced-motion` en animaciones no esenciales.
- En App, mantener transiciones cortas y vinculadas a gestos táctiles.

#### Do

Usa transiciones breves para feedback de interacción.

#### Don't

No animes elementos críticos de forma lenta, ornamental o repetitiva.

### Durations

Las duraciones deben sentirse inmediatas. Usa rangos cortos para microinteracciones y reserva duraciones mayores para superficies completas.

| Duración | Uso | Ejemplos | Regla |
| --- | --- | --- | --- |
| `100-120 ms` | Respuesta inmediata | Pressed, tap, icon feedback | No usar para entrada/salida de superficies. |
| `150-180 ms` | Microinteracciones | Hover, focus, color, border, shadow | Duración por defecto en controles. |
| `200-250 ms` | Cambio de estado visible | Acordeón, switch, tabs, stepper | Debe sentirse fluido sin bloquear. |
| `280-320 ms` | Superficies móviles | Sidebar, drawer, bottom sheet, modal | Usar con easing expresivo, no lineal. |
| `600-900 ms` | Animación continua | Loading spinner | Solo para estados de espera. |

### Easings

La curva debe acompañar el tipo de movimiento. Evita curvas dramáticas que hagan sentir pesada una interfaz transaccional.

#### Standard

`ease` o `ease-in-out` para color, borde y sombra.

#### Emphasized

`cubic-bezier(.4,0,.2,1)` para drawers, sidebars y sheets.

#### Linear

`linear` solo para loops mecánicos como loading.

### Qué animar y qué no

#### Animar

- `opacity` para aparición y salida simple.
- `transform` para desplazamientos de paneles.
- `box-shadow` para elevación o hover.
- `background-color`, `border-color` y `color` para estados.

#### Evitar

- Animar alto/ancho de contenedores grandes si causa saltos.
- Usar rebotes o overshoot en flujos médicos o transaccionales.
- Animar texto de lectura, totales, precios o mensajes de error.
- Loops decorativos permanentes fuera de loading.

### App

En App, la animación debe reforzar el gesto. El movimiento debe estar anclado al borde, dirección o elemento que activó la acción.

#### Reglas App

- Bottom sheet: entra desde abajo en 280-320 ms.
- Overlay: fade corto de 150-200 ms.
- Tap feedback: 100-150 ms.
- Evitar animaciones simultáneas que compitan con el gesto.

### Accesibilidad

Todo componente con animación debe funcionar con `prefers-reduced-motion: reduce`. En ese modo se eliminan desplazamientos y loops no esenciales, pero se conserva feedback claro mediante color, borde, texto o estado.

```html
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Estados, Propiedades / API, Responsive, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: patterns/patterns.md -->
## Patrones y guías

Patrones de navegación, formularios, búsqueda, responsive, movimiento y modos de color del sistema de diseño.

- [Form Patterns](form-patterns.md) — `docs/guidelines/form-patterns.html`
- [Search & Filters](search-filters.md) — `docs/guidelines/search-filters.html`
- [Responsive / Breakpoints](responsive-breakpoints.md) — `docs/guidelines/responsive-breakpoints.html`
- [Motion / Animación](motion-animation.md) — `docs/guidelines/motion-animation.html`
- [Dark Mode — Reglas de uso](dark-mode.md) — `docs/guidelines/dark-mode.html`
- [High Contrast — Reglas de uso](high-contrast.md) — `docs/guidelines/high-contrast.html`

---

<!-- archivo: patterns/responsive-breakpoints.md -->
## Responsive / Breakpoints

> Fuente: `docs/guidelines/responsive-breakpoints.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

Guía transversal para definir breakpoints, uso de grilla y adaptación de componentes en Web, ZT Drupal y App. El objetivo es mantener layouts consistentes sin crear reglas aisladas por página.

Estado: estable Web / App Bootstrap compatible Grid 12 columnas

### Resumen

#### Principios

- Diseñar mobile first: una columna por defecto y escalar progresivamente.
- Usar grilla de 12 columnas en Web y ZT Drupal.
- Evitar breakpoints personalizados salvo que un componente lo justifique.
- En App priorizar ancho del dispositivo, área segura y controles táctiles.
- Los tokens de espaciado deben mantenerse entre modos Light, Dark y Alto contraste.

#### Do

Define el comportamiento por columnas y deja que la grilla resuelva el ancho.

```html
<div class="row g-4">
  <div class="col-12 col-md-6 col-xl-4">...</div>
</div>
```

#### Don't

No fijes anchos rígidos que rompan en móvil o tablet.

```html
.card {
  width: 390px;
  margin-left: 80px;
}
```

### Breakpoints Web

Usa la escala Bootstrap como referencia transversal para layouts Web y portal ZT Drupal.

| Nombre | Rango | Uso principal | Grilla recomendada |
| --- | --- | --- | --- |
| `xs` | < 576 px | Móvil pequeño | `col-12`, una columna |
| `sm` | ≥ 576 px | Móvil amplio | `col-sm-*` solo cuando el contenido respira |
| `md` | ≥ 768 px | Tablet vertical | 2 columnas livianas, navegación simplificada |
| `lg` | ≥ 992 px | Tablet horizontal / laptop | 2 a 3 columnas, paneles laterales posibles |
| `xl` | ≥ 1200 px | Desktop | 3 a 4 columnas según densidad |
| `xxl` | ≥ 1400 px | Desktop amplio | Contenedor máximo; no estirar texto indefinidamente |

### Grid usage

La grilla organiza contenido, pero la jerarquía la define el flujo. En móvil, todo debe poder leerse en una sola columna.

#### Contenido editorial

Usa `col-12 col-lg-8` para texto principal y limita el ancho de lectura.

#### Cards repetidas

Usa `col-12 col-md-6 col-xl-4` para listas escaneables.

#### Formularios

Agrupa campos relacionados. En móvil, conserva una columna y labels visibles.

### App

En App no usamos la grilla desktop como base visual. La adaptación parte del ancho disponible, orientación, área segura y tamaño mínimo táctil.

#### Reglas App

- Usar una columna para flujos transaccionales y formularios.
- Respetar área segura superior e inferior del dispositivo.
- Controles táctiles mínimos de 44 px; ideal 48 px.
- Bottom sheets ocupan el ancho del dispositivo y se anclan abajo.
- En tablet se permite layout de dos paneles solo si mejora comparación o edición.

### Reglas prácticas

#### Espaciado

Usa `var(--space-*)`. Reduce de forma controlada en móvil, pero no elimines separación entre acciones.

#### Texto

No escales fuentes con viewport. Usa clases de texto configuradas para los modos.

#### Imágenes

Define `aspect-ratio` o contenedor estable para evitar saltos de layout.

#### Navegación

En móvil prioriza navegación compacta, drawers o tabs cuando el flujo lo requiera.

### Pendiente de documentación

La página de origen no trae contenido para: Variantes, Estados, Propiedades / API, Responsive, Accesibilidad, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: patterns/search-filters.md -->
## Search & Filters

> Fuente: `docs/guidelines/search-filters.html` · Plataforma: Web y App · Sistema de diseño v2.5.0

3.2 — Patrones de interacción

## Search & Filters

Permite a los usuarios encontrar información de forma rápida mediante búsqueda y filtrado. Se utiliza para reducir resultados y facilitar la toma de decisiones.

Estado: estable Web / App Lógica AND

### Demo

Buscar por nombre
Especialidad
Bogotá DC
Bogotá DC  Oftalmología  Neurología  Psiquiatra  Pediatría

Encontramos **0** opciones para ti

No encontramos resultados con los filtros seleccionados

Intenta ajustar o eliminar algunos filtros para ver más opciones

#### Estructura base

- Input de búsqueda
- Filtros (chips / dropdown / select)
- Resultados (cards o tabla)
- Paginación (opcional)
- Empty / loading

#### Tipos de filtros

- Filtros simples (una opción)
- Filtros múltiples (varias opciones)
- Filtros combinados

### Lógica de filtros

Cuando el usuario selecciona múltiples filtros, el sistema aplica una lógica de tipo: **AND (Y lógico)**

Comportamiento

Cada filtro aplicado hace la búsqueda más específica

- Agregar filtro → reduce resultados
- Quitar filtro → amplía resultados

Ejemplo

Filtros seleccionados:

- **Ciudad:** Bogota D.C
- **Especialidad:** Cardiología

Resultados

Centros en Bogota D.C **Y**
que tengan Cardiología

### Comportamiento y reglas

#### Comportamiento

- La búsqueda filtra resultados en tiempo real o al ejecutar acción
- Los filtros reducen el conjunto de resultados
- Los resultados se actualizan automáticamente al aplicar filtros

#### Reglas de uso

- Usar filtros cuando hay muchos resultados
- No usar filtros innecesarios
- Priorizar filtros relevantes
- Mantener claridad en las opciones

### Accesibilidad

- Focus visible en todos los filtros y el input de búsqueda
- Labels claros y asociados correctamente con `for` / `aria-label`
- Filtros seleccionados visibles y con estado comunicado vía `aria-pressed`
- No depender solo del color para indicar estado activo
- Anunciar cambios de resultados con `aria-live="polite"`

### Pendiente de documentación

La página de origen no trae contenido para: Resumen / cuándo usarlo, Variantes, Estados, Propiedades / API, Tokens usados. No se completa con suposiciones.

---

<!-- archivo: accessibility/accessibility.md -->
## Accesibilidad

Objetivo del sistema: WCAG 2.2 AA, teclado, foco visible, móvil, zoom al 200 % y los modos claro, oscuro y alto contraste. Los criterios por componente son los de su página de documentación; esto los reúne. Guías transversales: [Modo oscuro](../patterns/dark-mode.md) y [Alto contraste](../patterns/high-contrast.md).

### Accordion

_Fuente: [components/transversales/accordion.md](../components/transversales/accordion.md)_

#### Accesibilidad

- El trigger es un `button` con `aria-expanded`.
- El panel usa `role="region"` y referencia al trigger.
- Tab, Enter y Space deben funcionar nativamente.
- Focus visible en todos los modos de color.

#### Checklist QA

- Trigger usa texto mínimo de 16 px y componente real `mp-accordion`.
- Chevron 24 px rota al abrir/cerrar.
- Hover y focus son evidentes en los estados interactivos.
- El panel actualiza `aria-expanded` y altura al interactuar.
- Light, Dark y High Contrast mantienen contraste correcto.

### Alertas

_Fuente: [components/transversales/alerts.md](../components/transversales/alerts.md)_

#### Accesibilidad

- Contraste mínimo 4.5:1.
- No depender solo del color: incluir icono y texto.
- Usar `role="status"` para información y `role="alert"` para errores importantes.
- El cierre debe tener `aria-label` descriptivo.

### Chips / Tags / Badges

_Fuente: [components/transversales/badges.md](../components/transversales/badges.md)_

#### Accesibilidad

- Los chips deben exponer estado con `aria-pressed` cuando sean seleccionables.
- Los badges de estado deben tener texto claro o `aria-label`.
- No comuniques estados únicamente con color.
- El área clicable mínima para chips es 44 px.

#### Checklist QA

- Verificar Light, Dark y High Contrast.
- Confirmar que chips muestran hover, focus, selected y disabled.
- Validar textos cortos sin desbordes.
- Probar que HTML, CSS y Sass del visualizador se copian completos.

### Botón

_Fuente: [components/transversales/buttons.md](../components/transversales/buttons.md)_

#### Accesibilidad

- Navegación por teclado con Tab; activación con Enter y Space.
- Focus visible en todos los estados.
- Contraste mínimo AA 4.5:1 para texto y controles.
- Botones solo icono requieren `aria-label` descriptivo.
- No depender solo del color para comunicar estados.

### Cards

_Fuente: [components/transversales/cards.md](../components/transversales/cards.md)_

#### Accesibilidad

Contraste
Texto, borde y acciones deben mantener contraste AA; en alto contraste el contenedor usa borde blanco sólido.
Foco visible
Si la card es interactiva, debe poder enfocarse y mostrar un indicador visible.
Texto alternativo
Las imágenes informativas requieren `alt`; las decorativas deben usar alt vacío.
Acción clara
Evita múltiples acciones principales y no dependas solo del hover para revelar interacción.

### Dropdown / Select

_Fuente: [components/transversales/dropdown.md](../components/transversales/dropdown.md)_

#### Accesibilidad

#### Roles ARIA obligatorios

- Wrapper: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls="[panel-id]"`
- Panel: `role="listbox"` (simple) o `role="listbox" aria-multiselectable="true"` (múltiple)
- Opción: `role="option"`, `aria-selected`
- Opción deshabilitada: `aria-disabled="true"`
- Campo requerido: `aria-required="true"`
- Estado de error: `aria-invalid="true"`, `aria-describedby`

#### Interacción por teclado

- Tab — mueve el foco al trigger
- Enter / Space — abre el panel o selecciona la opción activa
- ↑ / ↓ — navega entre opciones (mueve `aria-activedescendant`)
- Escape — cierra el panel, devuelve el foco al trigger
- Home / End — primera / última opción

#### Contraste mínimo

4.5:1 para texto de opción y label. El estado focus debe ser perceptible sin depender solo del color.

#### Foco de la opción

La opción activa por teclado lleva un contorno interior de 2 px con `use/border/strong` (Light #666666 · Dark #E0E0E0 · Alto contraste #FFFFFF; en alto contraste el fondo de la opción es negro). El trigger conserva su propio foco.

### Input / Campo de texto

_Fuente: [components/transversales/inputs.md](../components/transversales/inputs.md)_

#### Accesibilidad

- Cada campo tiene `<label for="…">` explícito. Nunca depender solo del placeholder.
- `aria-invalid="true"` + `aria-describedby` conectan el mensaje de error al campo para lectores de pantalla.
- Campos requeridos: asterisco con `aria-hidden="true"` más `required` y `aria-required="true"`.
- Íconos decorativos con `aria-hidden="true"`. Íconos accionables como `<button>` con `aria-label`.
- Focus visible en todos los estados. Contraste mínimo AA 4.5:1.
- Área táctil mínima 44 px. El campo tiene 56 px de altura.
- No depender solo del color para comunicar error o success.

### Loading

_Fuente: [components/transversales/loading.md](../components/transversales/loading.md)_

#### Accesibilidad

- No dependas solo de la animación: conserva un texto visible.
- Usa `role="status"`, `aria-live="polite"` y `aria-busy="true"`.
- Mantén contraste adecuado en Light, Dark y High Contrast.
- Respeta usuarios con reducción de movimiento.

#### Checklist QA

- Spinner mide 48 px por defecto y conserva proporciones en small/large.
- Texto visible usa 16 px y no se oculta en mobile.
- Light, Dark y High Contrast mantienen contraste correcto.
- El HTML expone `role="status"`, `aria-live` y `aria-busy`.
- Las descargas de CSS/Sass incluyen componente completo y animación separada.

### Modal

_Fuente: [components/transversales/modals.md](../components/transversales/modals.md)_

#### Accesibilidad

- Usar `role="dialog"` y `aria-modal="true"`.
- Conectar título con `aria-labelledby`.
- Conectar mensaje con `aria-describedby`.
- Devolver el foco al botón que abrió el modal.

- Focus visible en cierre y acciones.
- Contraste mínimo AA.
- No depender solo del color para comunicar tipo.
- No abrir múltiples modales simultáneamente.

### Checkbox / Radio / Switch

_Fuente: [components/transversales/selection-controls.md](../components/transversales/selection-controls.md)_

#### Accesibilidad

- Área mínima: 44 x 44 px (Checkbox y Radio). Switch: área interactiva de 52 x 44 px, con track de 52 x 32 px y knob de 28 x 28 px, centrados verticalmente.
- Label asociado al control mediante estructura de label/input.
- Focus visible obligatorio: contorno de 3 px con `use/border/strong` en Checkbox, Radio y Switch. El Switch deshabilitado no recibe foco.
- No depender solo del color para error o selección.
- Grupos radio deben usar `name` compartido.

### Tables

_Fuente: [components/transversales/tables.md](../components/transversales/tables.md)_

#### Accesibilidad

Contraste
Filas, selección y hover deben mantener contraste suficiente.
Encabezados
Usa `th` y `scope` cuando aplique.
Teclado
Acciones y selección deben ser navegables por teclado.
No solo color
Estados como selección o error deben tener apoyo textual o estructural.

### Tabs

_Fuente: [components/transversales/tabs.md](../components/transversales/tabs.md)_

#### Accesibilidad

Foco visible
El foco debe ser visible en cada tab, activo o inactivo. El componente dibuja un contorno exterior de 3 px con `use/border/strong` alrededor de la superficie visual de 35 px; si lo reemplazas, no lo elimines sin una alternativa visible.
Teclado
Flechas laterales cambian el foco entre tabs; `Tab` avanza al panel activo.
ARIA
Usa `tablist`, `tab`, `tabpanel`, `aria-controls` y `aria-labelledby`.
No solo color
El activo debe diferenciarse por color, forma y peso visual; no dependas solo del color.

### Toast

_Fuente: [components/transversales/toasts.md](../components/transversales/toasts.md)_

#### Accesibilidad

- Usar región `aria-live="polite"` para feedback no crítico.
- No desaparecer demasiado rápido: 5 segundos como regla base.
- El botón cerrar requiere `aria-label`.
- No depender solo del color: incluir icono y texto.

### Accordion

_Fuente: [components/web/accordion.md](../components/web/accordion.md)_

#### Accesibilidad

- El trigger es un `button` con `aria-expanded`.
- El panel usa `role="region"` y referencia al trigger.
- Tab, Enter y Space deben funcionar nativamente.
- Focus visible en todos los modos de color.

#### Checklist QA

- Trigger usa texto mínimo de 16 px y componente real `mp-accordion`.
- Chevron 24 px rota al abrir/cerrar.
- Hover y focus son evidentes en los estados interactivos.
- El panel actualiza `aria-expanded` y altura al interactuar.
- Light, Dark y High Contrast mantienen contraste correcto.

### Chips / Tags / Badges

_Fuente: [components/web/badges.md](../components/web/badges.md)_

#### Accesibilidad

- Los chips deben exponer estado con `aria-pressed` cuando sean seleccionables.
- Los badges de estado deben tener texto claro o `aria-label`.
- No comuniques estados únicamente con color.
- El área clicable mínima para chips es 44 px.

#### Checklist QA

- Verificar Light, Dark y High Contrast.
- Confirmar que chips muestran hover, focus, selected y disabled.
- Validar textos cortos sin desbordes.
- Probar que HTML, CSS y Sass del visualizador se copian completos.

### Breadcrumb

_Fuente: [components/web/breadcrumb.md](../components/web/breadcrumb.md)_

#### Accesibilidad

- Usa `nav` con `aria-label="Breadcrumb"`.
- Los enlaces deben ser identificables y navegables con teclado.
- Los separadores son decorativos y llevan `aria-hidden="true"`.
- Debe mantener contraste en Light, Dark y High Contrast.

#### Checklist QA

- Home mide 20 px y separadores 16 px.
- Texto de breadcrumb usa 16 px y el nivel actual va en bold.
- Focus visible en enlaces anteriores.
- El último nivel no es enlace y declara `aria-current="page"`.
- Light, Dark y High Contrast mantienen contraste correcto.

### Empty State

_Fuente: [components/web/empty-state.md](../components/web/empty-state.md)_

#### Accesibilidad

Ícono decorativo
El ícono del contenedor debe marcarse con `aria-hidden="true"`. El significado se transmite por el título y la descripción.
Jerarquía semántica
Usa `<h4 class="mp-h4">` como elemento del título. Ajusta el nivel (`h2`, `h3`…) si el contexto lo requiere para mantener la jerarquía correcta de la página.
Acción accesible
Los botones de acción deben tener texto descriptivo. Evita etiquetas genéricas como "Aquí" o "Click". Prefiere "Crear nuevo documento" sobre "Crear".
Contraste
El título y descripción usan tokens de texto primario y secundario respectivamente, garantizando contraste 4.5:1 en todos los modos del sistema.

### Navigation patterns

_Fuente: [components/web/header.md](../components/web/header.md)_

#### Accesibilidad

- Focus visible obligatorio en todos los elementos interactivos
- Navegación por teclado completa (Tab, Enter, Escape)
- Estado activo con `aria-current="page"`
- No depender solo del color para comunicar estado
- Áreas clicables mínimo 44×44 px
- En móvil, evitar patrones dependientes de hover
- Usar `aria-expanded` en submenús y drawers
- Cerrar drawer con Escape y devolver foco al botón disparador

### Loading

_Fuente: [components/web/loading.md](../components/web/loading.md)_

#### Accesibilidad

- No dependas solo de la animación: conserva un texto visible.
- Usa `role="status"`, `aria-live="polite"` y `aria-busy="true"`.
- Mantén contraste adecuado en Light, Dark y High Contrast.
- Respeta usuarios con reducción de movimiento.

#### Checklist QA

- Spinner mide 48 px por defecto y conserva proporciones en small/large.
- Texto visible usa 16 px y no se oculta en mobile.
- Light, Dark y High Contrast mantienen contraste correcto.
- El HTML expone `role="status"`, `aria-live` y `aria-busy`.
- Las descargas de CSS/Sass incluyen componente completo y animación separada.

### Sidebar / Overlay

_Fuente: [components/web/sidebar.md](../components/web/sidebar.md)_

#### Accesibilidad

- `role="dialog"` + `aria-modal="true"` en `.mp-sidebar`.
- `aria-label` o `aria-labelledby` apuntando al título del panel.
- Al abrir, mover el foco al primer elemento interactivo (botón cerrar o primer campo).
- Al cerrar, restaurar el foco al elemento que lo abrió.

- Implementar **focus trap**: Tab y Shift+Tab deben circular dentro del panel.
- Escape cierra el panel siempre.
- El backdrop tiene `aria-hidden="true"` — no es interactivo para lectores de pantalla.
- Contraste mínimo 4.5:1 en todo texto sobre el fondo del panel.

#### Checklist QA

- Panel entra con animación suave desde la derecha (desktop) o desde abajo (mobile).
- Backdrop oscurece el fondo y cierra el panel al hacer clic.
- Escape cierra el panel desde cualquier elemento interno.
- El body del panel scrollea independientemente de la página.
- El footer permanece visible (sticky) al hacer scroll dentro del body.
- En mobile, el panel ocupa máximo 90dvh y tiene border-radius arriba.
- Focus ring visible al navegar con teclado.
- Se ve correctamente en Light, Dark y High Contrast.

### Stepper

_Fuente: [components/web/stepper.md](../components/web/stepper.md)_

#### Accesibilidad

- `role="progressbar"` en `.mp-stepper__track`.
- `aria-valuenow` = paso actual, `aria-valuemin="1"`, `aria-valuemax` = total.
- `aria-label` descriptivo: *"Paso 2 de 3"*.

- El stepper es solo informativo — no es interactivo ni recibe foco.
- El contraste de las barras cumple WCAG AA en todos los temas.
- En High Contrast, el alto de barra sube a 3 px para mayor visibilidad.

#### Checklist QA

- Las barras completadas (`.is-done`) muestran color primario.
- La barra activa (`.is-current`) muestra color primario.
- Las barras pendientes muestran color de borde sutil.
- El head muestra el número y título del paso actual correctamente.
- `aria-valuenow` se actualiza al navegar entre pasos.
- La variante compact oculta el head completamente.
- Se ve correctamente en Light, Dark y High Contrast.
- Las barras son equitativas en ancho (flex: 1 cada una).

### Bottom Sheet

_Fuente: [components/app/bottom-sheet.md](../components/app/bottom-sheet.md)_

#### Accesibilidad

#### Roles y atributos ARIA

- El panel raíz lleva `role="dialog"`, `aria-modal="true"` y `aria-label` o `aria-labelledby`.
- El botón handle tiene `aria-label="Arrastrar o cerrar"`.
- El campo de búsqueda usa `<label>` o `aria-label` explícito.
- Cada chip de filtro usa `aria-pressed` para reflejar el estado seleccionado.
- Los grupos de filtros usan `<section>` con `aria-labelledby` apuntando al título del grupo.

#### Checklist QA

- Handle visible en todos los modos (Light, Dark, Alto contraste).
- Panel se cierra al tocar/pulsar el handle o al presionar Esc.
- Foco queda atrapado dentro del sheet mientras está abierto.
- Ítems de lista con min-height 56 px (área táctil mínima).
- Chips de filtro responden correctamente a tap/clic y actualizan `aria-pressed`.
- Botón "Aplicar" aplica los filtros seleccionados y cierra el panel.
- Botón "Limpiar" deselecciona todos los chips del panel.
- Contraste de texto ≥ 4.5:1 en todos los modos.
- Chips de filtro activos (#775ebb/#fff): contraste verificado ≥ 4.5:1.

### Carga infinita

_Fuente: [components/app/carga-infinita.md](../components/app/carga-infinita.md)_

#### Accesibilidad

#### Roles y atributos

- El gesto no es la única vía: el botón «Cargar más» es la alternativa para teclado, lector de pantalla y control por switch.
- Región con `role="status"` y `aria-live="polite"` que anuncia: «Cargando más solicitudes…», «Se cargaron 7 solicitudes más. Mostrando 14 de 18», el error y el fin de la lista.
- La alerta de error no usa `role="alert"`; se anuncia por la región en vivo para no duplicar el mensaje.
- La lista usa `<ul>` con `aria-label`; cada tarjeta incluye número de radicado y estado en su etiqueta.
- El indicador del gesto y el spinner son decorativos (`aria-hidden="true"`).

#### Checklist QA

- Carga con gesto y con botón; ambas agregan la misma cantidad de registros.
- Con la lista fuera del final, el gesto no dispara la carga.
- Durante la carga no se inicia otra carga.
- Tras el error, el botón reintenta y el gesto no.
- En fin de lista se oculta el botón y no hay más peticiones.
- Foco visible y orden lógico; el foco pasa a la primera tarjeta nueva al cargar con el botón.
- Contraste ≥ 4.5:1 en Light, Dark y Alto contraste.
- Zoom de texto al 200 % sin solapamientos ni texto cortado.
- Con movimiento reducido no hay animación de entrada ni rebote del indicador.

### Dropdown / Select App

_Fuente: [components/app/dropdown.md](../components/app/dropdown.md)_

#### Accesibilidad

#### Roles ARIA obligatorios

- Wrapper: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls="[panel-id]"`
- Panel: `role="listbox"` (simple) o `role="listbox" aria-multiselectable="true"` (múltiple)
- Opción: `role="option"`, `aria-selected`
- Opción deshabilitada: `aria-disabled="true"`
- Campo requerido: `aria-required="true"`
- Estado de error: `aria-invalid="true"`, `aria-describedby`

#### Interacción por teclado

- Tab — mueve el foco al trigger
- Enter / Space — abre el panel o selecciona la opción activa
- ↑ / ↓ — navega entre opciones (mueve `aria-activedescendant`)
- Escape — cierra el panel, devuelve el foco al trigger
- Home / End — primera / última opción

#### Contraste mínimo

4.5:1 para texto de opción y label. El estado focus debe ser perceptible sin depender solo del color.

### Pendiente de documentación

Sin sección de accesibilidad en su página de origen: Avatar / User chip, Paginación, Cómo conectarlo, Sistema de iconos, Header App, Tabs App.

---

<!-- archivo: platforms/app.md -->
## Aplicación móvil

Representación web navegable de la aplicación móvil.

- Tecnología: Referencia para .NET MAUI
- Sistema de diseño de referencia: v2.5.0

### Paquete web `compensar-app`

Versión publicada: v1.0.0. No incluye el sistema de diseño: cárgalo antes. Compatibilidad registrada con el sistema de diseño: no hay una matriz registrada; se publica junto a v2.5.0.

| Archivo | Tamaño (bytes) | integrity (SRI) |
| --- | --- | --- |
| `compensar-app.min.css` | 14581 | `sha384-v/M6U31qjpPQeinLHcSVX2+Zkid4wMnO+AbhYem46vpzjUMTEwjv7Away9p24CZ7` |
| `compensar-app.min.js` | 481 | `sha384-YBXP3b9E4frSpmynx5cJ6/StaG9EDNTwofe5RaZnWYyv9gKeMPWAdYV6yDpRkadv` |

#### Orden de carga

```html
<!-- 1. Sistema de diseño -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.css">
<!-- 2. Paquete APP -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-app/v1.0.0/compensar-app.min.css">
<!-- 3. CSS propio del flujo -->
<link rel="stylesheet" href="css/mi-pantalla.css">
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.js" defer></script>
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-app/v1.0.0/compensar-app.min.js" defer></script>
```

### Recursos para .NET MAUI

La aplicación móvil no consume CSS ni JavaScript. Los recursos nativos son diccionarios XAML generados de los tokens:

- `Resources/Styles/Compensar.Colors.xaml`
- `Resources/Styles/Compensar.Sizes.xaml`

```
Sistema de diseño de Compensar — .NET MAUI
commit-21fa41a · generado de tokens/compensar.tokens.json

Qué trae
  Resources/Styles/Compensar.Colors.xaml  Los colores del sistema.
  Resources/Styles/Compensar.Sizes.xaml   Espaciados y medidas, como x:Double.

Cómo usarlo — en App.xaml:
  <Application.Resources>
    <ResourceDictionary>
      <ResourceDictionary.MergedDictionaries>
        <ResourceDictionary Source="Resources/Styles/Compensar.Colors.xaml" />
        <ResourceDictionary Source="Resources/Styles/Compensar.Sizes.xaml" />
      </ResourceDictionary.MergedDictionaries>
    </ResourceDictionary>
  </Application.Resources>

Cada color va dos veces: la clave normal es el modo claro y la misma clave
terminada en _Dark es el modo oscuro, para usarlas juntas:

  <Setter Property="BackgroundColor"
          Value="{AppThemeBinding Light={StaticResource UseBackgroundPage},
                                  Dark={StaticResource UseBackgroundPage_Dark}}" />

El modo de alto contraste de la web no está aquí: MAUI solo distingue claro y oscuro.
Los archivos se generan en cada publicación del portal. No los edites a mano: los
cambios se hacen en los tokens del sistema de diseño.
```

### Flujos publicados

- Inicio de la APP
- Historia clínica (APP)
- Efecto Swap (APP)

---

<!-- archivo: platforms/drupal.md -->
## Drupal

Prototipos del portal web institucional.

- Tecnología: HTML, CSS y JavaScript
- Sistema de diseño de referencia: v2.5.0

### Paquete web `compensar-drupal`

Versión publicada: v1.0.0. No incluye el sistema de diseño: cárgalo antes. Compatibilidad registrada con el sistema de diseño: no hay una matriz registrada; se publica junto a v2.5.0.

| Archivo | Tamaño (bytes) | integrity (SRI) |
| --- | --- | --- |
| `compensar-drupal.min.css` | 18505 | `sha384-O7hlw/QIirIjV7yd9kVqcX/Rx/BP24f8bEBVYfOjGQyEcyugSunkDwKTj/DUuR3l` |
| `compensar-drupal.min.js` | 12105 | `sha384-naJtPMw/AksRZcZy/ibLu/HJjrDKY3krWiBZ9l9UwsG1MMlsobtNifFo44RUKR+g` |

#### Orden de carga

```html
<!-- 1. Sistema de diseño -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.css">
<!-- 2. Paquete DRUPAL -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-drupal/v1.0.0/compensar-drupal.min.css">
<!-- 3. CSS propio del flujo -->
<link rel="stylesheet" href="css/mi-pantalla.css">
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.js" defer></script>
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-drupal/v1.0.0/compensar-drupal.min.js" defer></script>
```

### Flujos publicados

- Navegación del portal

---

<!-- archivo: platforms/zt.md -->
## Zona Transaccional

Flujos y pantallas de la oficina virtual.

- Tecnología: Referencia para Angular
- Sistema de diseño de referencia: v2.5.0

### Paquete web `compensar-zt`

Versión publicada: v1.0.0. No incluye el sistema de diseño: cárgalo antes. Compatibilidad registrada con el sistema de diseño: no hay una matriz registrada; se publica junto a v2.5.0.

| Archivo | Tamaño (bytes) | integrity (SRI) |
| --- | --- | --- |
| `compensar-zt.min.css` | 44211 | `sha384-zm+LVARNDZaP0Fqc3AZZVX2LDoG1V9mk4H19LE5NPwW9Rb5uTilHw8CuQd5i+qop` |
| `compensar-zt.min.js` | 65761 | `sha384-XQOUfsZ/RG/bm4k+bog/uBzC0cLK6g/gKOf8sywcBdAnSRudejRvBgMarmUl/50T` |

#### Orden de carga

```html
<!-- 1. Sistema de diseño -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.css">
<!-- 2. Paquete ZT -->
<link rel="stylesheet" href="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-zt/v1.0.0/compensar-zt.min.css">
<!-- 3. CSS propio del flujo -->
<link rel="stylesheet" href="css/mi-pantalla.css">
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar/v2.5.0/compensar.min.js" defer></script>
<script src="https://stappmedprepdeveus2.z20.web.core.windows.net/sitio/cdn/compensar-zt/v1.0.0/compensar-zt.min.js" defer></script>
```

El menú lateral de ZT necesita declarar la ruta a la raíz del flujo: `<nav class="sidebar" data-zt-root="../../">`.

### Flujos publicados

- Oficina virtual (inicio ZT)
- Agendamiento de citas
- Solicitud de historia clínica
- Ventas y afiliación

---

<!-- archivo: versions/changelog.md -->
## Historial de versiones

Versión de este paquete: v2.5.0.

### v2.5.0 — 2026-11-25

Core Design System v2.5.0 — Tabs v2: Pill XL y Tarjeta con ícono (mp-tab-xl, mp-tab-card), color Violeta, Light/Dark/Alto contraste

**Qué revisar:** Tabs v2 (aprobado por UX): Pill XL y Tarjeta con ícono en Naranja y Violeta, sin sombra en Active. Verificar contraste de texto de 4,5:1, foco de 3 px (4 px en Alto contraste), navegación por teclado y el desplegable por debajo de 768 px. El mp-tab base no cambia.

### v2.4.0 — 2026-11-11

Core Design System v2.4.0 — Tabs: menú desplegable por debajo de 768 px (informe 32)

### v2.3.0 — 2026-11-11

v2.3.0: cierre técnico de la estabilización. Verificaciones diferidas: Safari, VoiceOver y revisión visual del equipo.

**Qué revisar:** Cambios de color en badges e íconos de advertencia, y títulos de tarjeta en negrita. Pendientes de revisión visual del equipo, Safari y VoiceOver.

### v2.2.1 — 2026-11-06

Core Design System v2.2.1 — DEC-003 estados de Inputs (Error, Focus, Disabled, Readonly) conforme a Figma

### v2.2.0 — 2026-11-06

Design System v2.2.0 — campos de solo lectura y deshabilitados

---
