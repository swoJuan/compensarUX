# 13 — Pendientes independientes (detectados durante DEC-012 P3)

> Cada punto es **independiente** de DEC-012: ninguno se corrige dentro de P3 ni lo introdujo la opción B, salvo donde se indica. Se registran con causa y medida verificadas para que el equipo decida cuándo y bajo qué decisión se abordan.
> Medido el 5 de noviembre de 2026 en Chromium, con los archivos de `evidencias/dec012-p3-opcionB/`.

## PI-01 · Header ZT: desborde responsive, chip estirado y buscador angosto — RESUELTO (reglas A, B y C); regla A = SOLUCIÓN PROVISIONAL
- **Causas (verificadas, preexistentes):**
  1. *Escritorio:* la regla `.mp-web-header--zt .mp-web-header__main` declaraba 4 columnas (`auto auto minmax(0,1fr) auto`) para 4 hijos (`mobile-toggle, brand, search, user-chip`). En escritorio el toggle tiene `display:none`, así que los demás se corrían una columna: el buscador quedaba en una columna `auto` (208 px) y el chip en la `1fr` (435–975 px).
  2. *Móvil:* la marca tiene `min-width:max-content` y el grid móvil es `auto 1fr auto`; botón + marca + chip necesitan ~386 px (24,2em). La columna `1fr` del `<section>` crecía hasta el ancho mínimo de su contenido y el `overflow:hidden` recortaba chip y menú de módulos.
  3. P3 empeoró el caso 2 al hacer escalar el texto (ya recortaba a 150 %/320 y 200 %/375 en el original).
- **Aplicado (solo `core/components/web/_header.scss`):**
  - **Regla A (escritorio):** `.mp-web-header--zt .mp-web-header__main { grid-template-columns: auto minmax(0, 1fr) auto }` → marca de ancho natural, buscador flexible, chip de ancho natural sin estirarse. **Solución provisional: pendiente de formalizar en Figma** (no existe un componente oficial equivalente; ver nota de búsqueda más abajo). Comentario en el código.
  - **Regla B:** en `≤ 48em`, `.mp-web-header--zt { grid-template-columns: minmax(0, 1fr) }`.
  - **Regla C:** en `≤ 22em`, `.mp-web-header--zt .mp-web-header__main { display:flex; flex-wrap:wrap }` (mismo orden DOM = mismo orden visual y de teclado). 375 px a texto normal no cambia.
  - Subtítulo oculto a `≤ 16em` (regla de PI-04, aplica también al ZT).
- **Figma:** el componente oficial del Header ZT no se localizó en `1zVGMpzqBgiBUqhmfFEAoT` (páginas *SD - Corporativo*, *SD - Medicina Prepagada*, *SD - Documentacion*: solo `header`/`header mobile`/`mp-header` públicos, `Menu ZT` (`3456:17579`) y `Avatar`). `Header-ZT` solo aparece en la librería COLMÉDICA (otra marca; no se usa como referencia). **Acción pendiente:** que diseño formalice el Header ZT en Figma; si difiere de la distribución marca / buscador flexible / chip natural, se ajusta la regla A.
- **Resultado:** ver `12-Implementacion-DEC-012-P3.md` §6.1 y `evidencias/dec012-pi01/` (+ `regla-A-H03/`).
- **Hallazgos separados (no incluidos en PI-01):**
  - **H-01** (abierto) — El título `mp-h3` de `.mp-web-header__zt-content` ("Resumen de servicios") sobresale de su caja a 200 %/320 px (304 px de texto en 222 px; 34 px de desplazamiento del `<section>`) y a 375 px (304/277). Es contenido de demostración/slot; se propuso `overflow-wrap:anywhere` y se retiró a petición del equipo. Se mantiene como hallazgo separado.
  - **H-02** (**decisión funcional pendiente de UX/UI**, no implementado) — En la variante ZT el buscador está `display:none` en modo móvil (`≤ 48em`) y no existe cajón alternativo (el Header público sí lo tiene): en móvil el buscador no es accesible. Preexistente. Propuesta: botón de búsqueda accesible (`aria-expanded`, `aria-controls`, foco al campo al abrir, `Esc` cierra y devuelve el foco, objetivo táctil ≥ 44 px) que abra el buscador en móvil.
  - **H-03** (**RESUELTO**) — `aria-label="Abrir menú de usuario"` no contenía el texto visible "Ana Soto" (WCAG 2.5.3 Label in Name). Ahora el chip del Header ZT usa `aria-label="Ana Soto, abrir menú de usuario"` (comienza por el texto visible) y el avatar de iniciales, que duplica el nombre, lleva `aria-hidden="true"`. Cambio en `js/web-header-docs.js` (markup del componente; `drupal.html` con el parámetro de versión del script actualizado). Verificado en el árbol de accesibilidad de Chromium: `button "Ana Soto, abrir menú de usuario"` (antes `button "Abrir menú de usuario"`); la captura del chip es idéntica byte a byte. La elipsis visual del nombre cuando el chip no cabe ("Ana S…") se mantiene (sin cambio de diseño; el nombre completo queda en el nombre accesible).
  - **H-04** — La documentación del portal (`drupal.html#header`) no renderiza el componente en vivo (P-011-03); las pruebas inyectaron el markup real del `build()` sobre la hoja de estilos real (`core.css + portal.css + icons.css`).
  - **H-05** (nuevo, docs portal) — `portal.css` contiene `body.component-doc-full aside{display:none}`, que oculta también cualquier `<aside>` dentro de una vista previa: el menú de módulos del ZT (`<aside class="mp-web-header__zt-menu">`) no se ve en el portal con la página en modo completo. Es un efecto de la hoja del portal, no del componente (con `core.css` solo el menú sí se ve).
  - **H-06** (nuevo, observación) — El enlace de marca tiene `aria-label="Compensar home"` pero su texto visible es "Compensar Salud y bienestar": el nombre contiene "Compensar" pero no el subtítulo visible (2.5.3 estricto) y el idioma es inglés. No se tocó (fuera del alcance pedido).
## PI-02 · `.mp-chip--lg` / `.mp-tag--lg` tienen el mismo `font-size` que el chip base

- **Medido (1280 px):** `.mp-chip--sm`, `.mp-chip` y `.mp-chip--lg` calculan **14 px** de `font-size` (alturas mínimas 25 / 29 / 34 px).
- **Causa:** `_badges.scss` usa `font-size: var(--font-size-md, 16px)` en `--lg`. El alias `--font-size-md` está definido como `0.875rem` (14 px; es el desfase de alias del hallazgo DS-11), así que el fallback de `16px` nunca se aplica.
- **Figma:** **no verificado.** El tablero 2.13 (`4610:73562`) usa `body/M` (14 px) y `body/L` (16 px) y la variable `Sizing/md = 16`, sin que se pueda saber a qué variante corresponde cada una. La intención del código (fallback de 16 px) sugiere que `--lg` debería ser mayor, pero requiere confirmación de diseño.
- **Pendiente de:** confirmar en Figma el tamaño del chip grande y, si procede, corregir el alias (DS-11) con el mismo criterio de DEC-005. Fuera de DEC-012.

## PI-03 · Header móvil: el botón de menú se estira como una barra

- **Síntoma:** en modo móvil el botón hamburguesa ocupa todo el ancho sobrante (p. ej. 543 px a 768 px).
- **Causa:** en `@media … { .mp-web-header__main { grid-template-columns: auto 1fr auto } }`, al quedar ocultos el buscador y el CTA, el botón cae en la columna `1fr` y se estira (`justify-self` por defecto).
- **Preexistente:** idéntico en el CSS original anterior a P3 (543 px a 768 px, 95 px a 320 px).
- **Lo que cambia con la opción B:** como el modo móvil ahora llega hasta `48em` del tamaño de texto del navegador (hasta 1152 px con texto 150 %, hasta 1536 px con 200 %), este aspecto se ve en más anchos.
- **Pendiente de:** decisión de diseño sobre la alineación del botón (p. ej. al extremo derecho). Fuera de DEC-012.

## PI-04 · Header a 320 px con texto ampliado ≥ 150 %: desborde horizontal  *(introducido por P3; RESUELTO, ver más abajo y 12 §6)*

Este punto **sí** se origina en DEC-012 P3 y está desarrollado en `12-Implementacion-DEC-012-P3.md` §6; se lista aquí para que el índice de pendientes esté completo.

- **Medido:** a 320 px, texto 150 % → desborde de 57 px; texto 200 % → 182 px. En el CSS original anterior a P3 solo desbordaba la variante ZT.
- **Causa:** el nombre y el subtítulo de la marca, el logo y el botón ahora escalan con el texto, y `.mp-web-header__brand` tiene `min-width: max-content`.
- **No lo resuelve la opción B** (ocurre en modo móvil y a 320 px).

## PI-04 - RESUELTO (subtítulo oculto a 16em + opción C, ver 12 §6)

Estado: **resuelto**. Las pruebas siguientes corresponden a la fase previa a la decisión. Evidencia en `evidencias/dec012-pi04/` (`pi04-output.txt`).

Candidato probado por inyección: `@media (max-width:16em){.mp-web-header__brand-service{display:none}}`.

- Texto normal: 18/18 casos idénticos al estado actual (P3+B) y al original. Sin diferencia visual.
- 150 %: 375 px OK; 320 px falla solo sin buscador (+20,9 px).
- 200 %: 320 px +134,3 px y 375 px +79,3 px. **Insuficiente.**
- Ancho mínimo en que cabe: 14,2 em con subtítulo oculto frente a 14,75 em con él. Ocultarlo gana ~1,5 em.
- Teclado: 32/36 OK; los 4 fallos son el botón de menú fuera de vista a 200 % en 320/375 px.

Alternativas inyectadas (ninguna aplicada): A compactar espacios, C botón de menú en 2.ª fila, D elipsis en nombre, E tope `min(2.75rem,12vw)` en logo/botón, F = A+E. Ver la tabla en `pi04-output.txt`.
