# 03 — Fidelidad Figma ↔ HTML/CSS

**Fuente de diseño:** Figma `Compensar v2 - Sistema de diseño` · fileKey `1zVGMpzqBgiBUqhmfFEAoT`
**Código:** `core/` (SCSS) y `css/core.css` compilado (15 may 2026), repositorio local `Core-Design-System`
**Método:** extracción por MCP de Figma (`get_variable_defs` por tablero y `get_design_context` por instancia y estado), comparada con la fuente SCSS y con los valores **computados** en Chromium (Playwright) en los temas Light, Dark y High Contrast.

> No se calcula un «porcentaje de fidelidad»: solo se reportan diferencias medidas. Donde una propiedad no se pudo extraer de Figma, se marca **Pendiente**.

## 1. Cómo leer las medidas de Figma (corrección importante)

El MCP devuelve `letterSpacing` de los estilos tipográficos **en porcentaje del tamaño de fuente**, no en píxeles. Hay tres pruebas:

- La anatomía del tablero 2.2 Inputs (4517:7746) dice literalmente «Letter spacing 1.2%» para Label y Placeholder, y «2%» para el asterisco.
- `get_design_context` de la instancia de botón (4504:5334) produce `tracking-[0.352px]` para `comun/Boton` (`letterSpacing: 2.2`): 2.2 % × 16 px = 0.352 px.
- La instancia de text field (4527:13660) produce `tracking-[0.192px]` para `comun/Label` (`letterSpacing: 1.2`): 1.2 % × 16 px = 0.192 px.

Por tanto, el código (`.mp-btn letter-spacing:0.022em`, `.mp-input-* 0.012em`) **coincide exactamente** con Figma. El hallazgo B-01 de 09.10 era un falso positivo (ver documento 06).

**Limitación de modos:** `get_variable_defs` devuelve el valor del modo que usa cada nodo. Algunos tableros contienen instancias en modo Dark, así que una misma variable puede aparecer con dos valores (p. ej. `use/surface/white` = `#292929`, `use/border/subtle` = `#ffffff`, `use/text/inverse` = `#111111`/`#000000`). En esos casos solo se compara el valor del nodo concreto que se inspeccionó.

## 2. Tokens fundamentales

| Token Figma | Figma | Código (`_tokens-colors.scss` / computado) | Resultado |
|---|---|---|---|
| `use/primary/default` | `#ff6600` | `#ff6600` | Fiel |
| `use/primary/hover` / `use/border/hover` | `#e63f0c` | `#e63f0c` | Fiel |
| `use/primary/default dark` | `#ff9d5c` | `#ff9d5c` | Fiel |
| `use/text/link` | `#ff6600` | `#ff6600` | Fiel (problema de contraste nacido en Figma: DS-01) |
| `use/text/primary` · `secondary` · `tertiary` | `#111` · `#333` · `#666` | idénticos | Fiel |
| `use/border/default` · `subtle` · `strong` | `#ccc` · `#e0e0e0` · `#666` | idénticos | Fiel (contraste no-texto: DS-07) |
| `use/focus/border` | `#ffe6d6` | existe como token, pero el input no lo usa (usa `color-mix` del 18 % de `#ff6600`) | **Difiere** (DS-15) |
| `use/state/*` (info, success, warning, error) | ver tablero 2.6 | idénticos | Fiel |
| `use/state/error/text-error-field` | `#9e3328` | token correcto, pero `.mp-input-helper.error` usa `use/state/error/text` `#521a14` | **Difiere** (DS-15) |
| `use/surface/theme/orange/60` | — (no consultado) | apunta a `base/orange/40` | Error de mapeo probable (DS-23) |
| Cuerpo de alerta info | **literal `#0b3954` sin variable** (4585:19367) | fallback `#0b3954` vía token inexistente `--use-state-info-body` | Valor fiel; **el origen es Figma** (color sin tokenizar) |
| `border-radius/xs · sm · md · lg` | 8 · 16 · 24 · 32 | 8 · 16 · 24 · 32 | Fiel |
| Radio 12 px (alert, toast, modal, tabs, paginación) | 12 literal o `spacing/12px` usado como radio | 12 literal o `var(--space-12)` | Fiel al Figma; fuera de escala en ambos lados (DS-24) |
| `Shadow boton Hover` / `Pressed` | `#FF9D5C 2/2/3` · inner `#00000040 0/4/4` | idénticos | Fiel |
| `shadow 1` | `#00000026 2/5/16` | `0.125rem 0.3125rem 1rem rgba(0,0,0,.15)` | Fiel |

## 3. Tipografía (tablero 1.3, nodo 3916:20388)

| Estilo Figma | Figma | Código (token/mixin → computado) | Resultado |
|---|---|---|---|
| Display L | Bold 700 · 56 · lh 1.1 | `--mp-display-l-weight: 900` → 900 | **Peso difiere** |
| Display M | Bold 700 · 48 · lh 1.2 | 900 | **Peso difiere** |
| Display mobile XL/L/M | Bold 700 · 40/36/32 · lh 1.1 | 700 | Fiel |
| H1 · H2 · H3 | Bold 700 · 48/40/36 · lh 1.2 | 700 | Fiel |
| H4 | Bold 700 · 28 · lh 1.2 | `--mp-h4-weight: 500` → 500 | **Peso difiere** |
| H5 | Bold 700 · 24 · lh 1.3 | 500 (también `.mp-card__title`) | **Peso difiere** |
| H6 | Bold 700 · 18 · lh 1.3 | 500 | **Peso difiere** |
| Eyebrow | Regular 400 · 18 · lh 1.3 · ls 0.8 % | 500 · ls 0.1em · `uppercase` | **Difiere** (peso, tracking, transformación) |
| Paragraph L / XL | Regular 16/18 · lh 1.5 · ls 1 % | sin letter-spacing | **Difiere** (menor) |
| Body 2XL/XL/L/M/S/XS | 24/18/16/14/12/10 · lh 1.3 (M 1.5) | idénticos | Fiel |
| `comun/Boton` | Bold 700 · 16 · lh 1 · ls 2.2 % | `.mp-btn` 700 · 0.022em. El token `--mp-btn-weight` y el mixin `ty-button` dicen **500** | Componente fiel; **token y mixin incorrectos** |
| `comun/Label` | Regular 400 · 16 · lh 1 · ls 1.2 % | `.mp-input-label` 400 · 0.012em. `--mp-label-weight` dice **700** y `ty-label` aplica bold + uppercase + 0.08em | Componente fiel; **token y mixin incorrectos** |
| `comun/Hint` | Regular 14 · lh 1 · ls 1.2 % | `.mp-input-helper` 14 · lh 1.45 · 0.012em | lh difiere (la decisión del código es más legible; conviene validarla con UX/UI) |

**Fuente cargada:** Roboto 100/300/400/500/700/900. No se cargan 600 ni 800, aunque el código los usa en tabs, títulos de alert/toast, header y botón legacy (DS-14).

## 4. Componentes

### 4.1 Buttons (2.1 · 4498:2274)

| Propiedad | Figma | Código | Resultado |
|---|---|---|---|
| Alto (con icono) | instancias de 44 px (10 + 24 + 10); la ficha dice «Hug 48px» | `min-height: 48px` | Figma inconsistente; el código sigue la ficha |
| Padding con iconos | 10 / 16 | `.mp-btn--icon-*` 10 / 16 | Fiel |
| Radio | `border-radius/md` 24 | `--radius-md` 24 | Fiel |
| Tipografía | `comun/Boton` | 16 / 700 / 0.022em / lh 1 | Fiel |
| Gradiente primario | `#ff6600` → `#e63f0c` (via) → `#e63f0c` | `linear-gradient(180deg, #ff6600 0%, #e63f0c 100%)` | Difiere levemente (Figma llega a `#e63f0c` al 50 %) |
| Focus | borde interno 2 px `#111` + gradiente `#db3c0b`→`#ff6600` + sombra hover (4514:6414) | outline 3 px `#ff6600` con offset 3 px | **Difiere** (`#db3c0b` no está en la paleta) |
| Disabled | fondo `#ccc`, texto `use/text/on-dark/secondary` `#f5f5f5` (4514:6417) | fondo `#ccc`, texto `#a4a4a4`, y además opacidad global 0.5 | **Difiere** |
| Terciario | padding 4 / 8 → 32 px de alto (4514:6567) | padding 10 / 32 · `min-height` 48 | **Difiere** (el código supera los 44 px táctiles; Figma no) |
| Tamaño de icono | regla del tablero: «16px o 20px»; instancias: 24 px | 24 px | Figma se contradice a sí mismo |
| Modos Dark/HC | primario `#ff9d5c` con texto oscuro; HC amarillo con texto negro | idéntico | Fiel |

### 4.2 Inputs (2.2 · 4517:7746)

| Estado / propiedad | Figma | Código (computado Light) | Resultado |
|---|---|---|---|
| Contenedor | 320 · min-h 56 · p 16 · radio 16 · borde 1 `use/border/subtle` · gap 10 | 56 · padding 0 16 · radio `rem(16px)` · borde 1 `#e0e0e0` | Fiel (radio no tokenizado) |
| Label | Regular 16 `#111`, asterisco `#bb4945` **antes** del texto | Regular 16 `#111`, asterisco **después** en los ejemplos | **Difiere** (orden) |
| Placeholder | `#666` | `#666` | Fiel |
| Texto de apoyo | 14 · lh 1 · **`#111`** · padding 4 | 14 · lh 1.45 · **`#666`** · sin padding | **Difiere** |
| Hover | borde `use/border/hover` | `#e63f0c` | Fiel |
| Active | borde `use/border/strong` | `#666` | Fiel |
| Focus (4527:13793) | anillo exterior 4 px `use/focus/border` `#ffe6d6` + borde 1 px `use/border/hover` `#e63f0c`; texto `#111` | borde 1 px `#ff6600` + `box-shadow` 3 px al 18 % de `#ff6600` | **Difiere** (color y grosor) |
| Error (4527:13796) | borde `use/state/error/border` `#db7165`, sin halo; mensaje `#9e3328` Regular con icono 16 | borde `#d14434` + halo 3 px al 15 %; mensaje `#521a14` peso 500, sin icono en CSS | **Difiere** |
| Disabled (4527:13799) | fondo `#f5f5f5`, borde `#ccc`, label, placeholder y apoyo en `#666` | publicado: fondo `#d9d5d5` + opacidad 0.65; WIP: `#f5f5f5` / `#ccc`; label sin cambio | **Difiere** (publicado); WIP se acerca |
| Modos | Light / Dark / HC mostrados en 2.2.4 | presentes | Ver DS-05 y DS-19 (estados en Dark/HC) |

### 4.3 Checkbox / Radio / Switch (2.5 · 4540:38053)

| Propiedad | Figma | Código | Resultado |
|---|---|---|---|
| Área táctil / control / visual | 44 / 24 / 18 (state-layer p 11) | 44 / 24 / 18 | Fiel |
| Relleno marcado | variable **`use/text/link`** `#ff6600` | `--use-primary-default` `#ff6600` | Valor fiel; en Figma la variable es semánticamente incorrecta |
| Label | Regular **16** · lh 1.5 · ls 1 % · `#000` | **14** (`--body---m`) · lh 1.5 · 0.01em · `#111` | **Difiere** (tamaño) |
| Switch | instancia exportada como **imagen SVG** (4541:39635), sin variables | 52×40 · track 32 · knob 28 | No verificable por token (origen Figma) |

### 4.4 Alerts y Toast (2.6 · 4574:1918, 4590:22197)

| Propiedad | Figma (4585:19367) | Código (computado) | Resultado |
|---|---|---|---|
| Contenedor | p 16 · gap 8 (info) · radio 12 · borde 1 | idéntico | Fiel |
| Icono | 32 | 32 | Fiel |
| Título | **Bold 700 · 16** · lh 1.3 · `use/state/info/text` | **600 · 14 px** (`--font-size-md`) · lh 1.3 | **Difiere** (DS-11, DS-14) |
| Cuerpo | **Regular · 16** (body/L) · lh 1.3 · `#0b3954` literal | **12 px** (`--font-size-sm`) · lh 1.5 · `#0b3954` | **Difiere** (tamaño) |
| Toast | max 350 · icono 32 · cierre 24 | idéntico | Fiel en medidas; la tipografía hereda la diferencia anterior |

### 4.5 Tabs (2.8 · 4610:37808) y Pagination (2.10 · 4610:71122)

| Propiedad | Figma | Código | Resultado |
|---|---|---|---|
| Tab: padding / radio | 12 / `spacing/12px` | 12 / `var(--space-12)` | Fiel |
| Tab: tipografía | **SemiBold 600 · 16** · ls 0.352 px | 600 (se renderiza 700, no está cargado) · **14 px** · 0.352 px | **Difiere** |
| Paginación: ítem | 44×48 · p 16 · radio **12** · Bold **16** `#ff6600` | 44×48 · p 16 · radio **8** · Bold **14** | **Difiere** |

### 4.6 Modal, Cards, Tables, Breadcrumb, Accordion (variables de tablero)

- **Modal (4595:28317):** `shadow 1`, `use/state/warning/icon bg`, `use/surface/theme/green-2/60` (icono success) y `border-radius/md` coinciden con `_modals.scss`. El título del modal (28 px Bold) coincide con H4 Bold de Figma, aunque el token H4 del código es 500. El overlay de Figma no se pudo extraer: **Pendiente**.
- **Cards (4606:31924):** usan `border-radius/md` 24, `spacing/16/24` y `use/text/secondary`, que coinciden. El alto mínimo de 536 px del código no se encontró en las variables: **Pendiente**.
- **Tables (4610:39519):** el tablero **no usa** `use/tables/Head` (`#a5d7d5`); el encabezado blanco del código es coherente con él. El token `use/tables/Head` parece huérfano (ver DS-34).
- **Breadcrumb (4629:87274):** `use/text/theme/violet` `#4e3199` (actual) y `use/text/secondary`/`tertiary` coinciden con el código.
- **Accordion (4622:76590):** solo expone variables de texto y superficie; el radio de 24 px y el `max-height` quedan **Pendientes**.

### 4.7 Componentes sin tablero Figma localizado

Header web, Sidebar, Stepper, Avatar/User-chip, Bottom-sheet y Dropdown app existen en `core/`, pero no se encontró un tablero dedicado entre los 42 marcos de primer nivel de la página `SD - Documentacion`. Es posible que estén en «3.3 Navigation patterns» (4705:5362), sin confirmar (DS-31).

## 5. Temas Dark y High Contrast: fidelidad del mapeo

`_theme.scss` reproduce los valores de los modos Dark y HC de Figma para los tokens `use/*`. Las diferencias no están en los tokens, sino en los **componentes que no consumen esos tokens** o los sobrescriben con hex propios:

- **Badges en Dark:** el fondo de cada variante (`--use-surface-*`) no tiene modo Dark en `_theme.scss`, pero el texto sí cambia. Resultado: verde 1.00:1, naranja 1.20:1, violeta 2.45:1 (DS-02).
- **Alerts y toast en Dark/HC:** usan hex escritos a mano (`#18428f`, `#967229`, `#102c5e`, `#fcbf44`…) que no salen de las variables (DS-22).
- **Tabs:** no tienen bloque Dark; el texto blanco sobre `#ff9d5c` da 2.05:1 (DS-02).

## 6. Diferencias que nacen en Figma (resolver primero en el diseño)

1. La marca `#ff6600` se usa como texto y como fondo de texto blanco (DS-01). Las propias reglas de accesibilidad de los tableros 2.1 y 2.2 («Mantener contraste mínimo 4.5:1») lo contradicen.
2. Límites de controles por debajo de 3:1: `use/border/subtle`, switch apagado y checkbox marcado (DS-07).
3. Foco de input con `use/focus/border` `#ffe6d6` (1.2:1 sobre blanco) (DS-06).
4. Colores sin variable: `#0b3954` (cuerpo info), `#db3c0b` (foco de botón), el switch como imagen (DS-16, DS-17, DS-23).
5. Contradicciones internas: tamaño de icono 16/20 frente a 24; alto 48 frente a 44; terciario de 32 px frente a la regla «área táctil mínima 44px» (DS-16).
6. Radio 12 fuera de escala y radios ligados a variables de spacing (DS-24).
