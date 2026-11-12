# 12 — Implementación DEC-012 · P3 (Header, Sidebar, Avatar, Badges e Icons) — con opción B

**Decisión:** DEC-012 — Unidades relativas `rem` / `em`
**Etapa:** P3, incluida la **opción B** aprobada por UX/UI (breakpoints del Header en `em` y dimensionamiento del dropdown según el espacio disponible)
**Fecha:** Noviembre 2026
**Estado:** **Implementado y validado.** Un punto sigue **abierto para decisión** (§6, PI-04: Header a 320 px con texto ≥ 150 %). DEC-012 no se da por terminada hasta que el equipo lo resuelva.

> Alcance respetado: solo estilos propios. Bootstrap, `vendors/*`, `_bootstrap-overrides.scss`, `_google-icons.scss`, `_buttons-docs.scss`, los mixins de breakpoints compartidos y `package.json` **no se tocaron**. Sin cambios en colores, gradientes, estados, animaciones, `letter-spacing` ni funcionalidad. Sin commits ni despliegues.

---

## 1. Inventario de conversiones (corregido)

**Pregunta del equipo:** el desglose 26 + 20 + 7 + 6 + 2 suma 61, no 62. **Respuesta: no faltaba ninguna categoría; era un error de presentación mío.** La fila de Header mostraba 26 porque contaba solo llamadas `rem()`; el valor 27.º es `gap: 2px → var(--space-2)` (un **token**, no `rem()`), que figuraba en la descripción pero no en el número.

La unidad de cuenta es **valor `px` que dejó de ser crudo** (no "declaración": `minmax(rem(220px), rem(280px))` son 2 valores en 1 declaración). Verificado con dos métodos independientes que coinciden (62 = 61 + 1):

| Archivo | `px` crudos en HEAD | `px` crudos ahora | Convertidos | A `rem()` | A token | Diferencia |
|---|---|---|---|---|---|---|
| `_header.scss` | 86 | 59 | **27** | 26 | 1 | 0 |
| `_sidebar.scss` | 32 | 12 | **20** | 20 | 0 | 0 |
| `_avatar.scss` | 11 | 5 | **6** | 6 | 0 | 0 |
| `_badges.scss` | 8 | 6 | **2** | 2 | 0 | 0 |
| `_icons.scss` | 7 | 0 | **7** | 7 | 0 | 0 |
| **Total** | | | **62** | **61** | **1** | **0** |

Método: se quitan comentarios y el contenido de `rem(...)`, y se cuentan los `px` restantes en HEAD y en el archivo actual; el resultado se contrasta con la variación de llamadas `rem()` y de tokens `var(--space-N)`. (En una primera cuenta, `_icons.scss` marcaba 8 porque un comentario contenía el texto `rem()`; ya excluido.) Las 3 custom properties del Sidebar usan `#{rem(...)}` y no queda ningún `rem(` sin resolver en `css/core.css`.

## 2. Excepciones que se mantienen en `px`

Bordes (1/2/3 px), sombras e indicadores de foco (`box-shadow`, `outline`, `outline-offset`), `calc(100% + 1px)` del dropdown (compensa el borde), `calc(100vw - 48px)` y similares con viewport, ancho (4 px) y radio (2 px) del scrollbar del Sidebar, fallbacks `var(--token, Npx)`, y `letter-spacing`.

**Cambia respecto de la versión anterior de este informe:** el ancho del dropdown **ya no es una excepción** (ver §3.2) y el breakpoint del Header **ya no está en `px`** (ver §3.1).

## 3. Opción B — qué se cambió

Solo `core/components/web/_header.scss`. Comparando regla por regla el CSS compilado antes y después: **10 reglas modificadas, las 10 son de `.mp-web-header*`; 0 reglas de Bootstrap o de otros componentes** (4016 reglas antes y después).

### 3.1 Breakpoint del Header en `em`
`@media (max-width: 768px)` → `@media (max-width: 48em)`. **48em = 768 px con el tamaño de texto por defecto (16 px)**, por lo que a escala normal es idéntico. En una media query, `em` se evalúa contra el tamaño de texto **por defecto del navegador**, de modo que si el usuario lo aumenta el header pasa a modo móvil antes (hasta 1152 px con 150 %, hasta 1536 px con 200 %). Solo este componente: no se tocaron los breakpoints de Bootstrap ni los mixins globales (`md-down`, etc.).

### 3.2 Dropdown dimensionado por el espacio real desde su ancla (solo CSS, sin JavaScript)
Antes: `left: 0; width: min(720px, calc(100vw - 48px))`. Ese `calc` ignoraba dónde empieza el dropdown, y con texto grande (o anclado a un item que no es el primero) desbordaba.

Ahora:
- `.mp-web-header__nav-item` pasa de `position: relative` a `static`; el bloque contenedor del dropdown es `.mp-web-header__nav` (que ya era `relative`).
- El dropdown **no declara `left`, `right` ni `width`**: su posición horizontal es la **estática** (borde izquierdo del item de navegación, el mismo lugar que antes) y su ancho es *shrink-to-fit*: el menor entre su ancho natural y el espacio entre ese punto y el borde derecho del `nav`.
- Su **ancho natural es exactamente 45rem (720 px a 16 px, medida de Figma)** porque cada columna de la rejilla se limita a `(45rem − 2·padding − gap − 2px) / 2` (custom properties `--mp-web-header-dropdown-max/-pad/-gap`).
- Resultado: si hay espacio mide 45rem; si no, se ajusta al espacio disponible desde **su propia ancla** (probado con el dropdown anclado al 1.er y al 3.er item).

### 3.3 Historial dentro de P3
La primera versión de P3 convirtió los 720 px a `rem` y provocó un desborde con texto grande (el `calc` de arriba). Se revirtió a `px` como medida provisional y esta opción B lo resuelve de raíz.

## 4. Método de validación (cambios importantes frente a la versión anterior)

1. **Tamaño de texto real del navegador.** El informe anterior emulaba el texto grande con `html { font-size: 150 % / 200 % }`. **Ese método no puede validar media queries en `em`**, porque no cambia el tamaño por defecto contra el que se evalúan. Ahora se usa la **preferencia real del navegador** (`webkit.webprefs.default_font_size` en el perfil, con Chromium completo; el *headless shell* la ignora). Se comprobó que `html` pasa a 24/32 px y que `(min-width: 48em)` deja de cumplirse a 1000 px mientras `(min-width: 768px)` sigue cumpliéndose.
2. **Comparación de tres vías:** *anterior a P3 (original)* → *P3 sin B* → *ahora*. El CSS "anterior a P3" se **reconstruyó desde las fuentes** (los 5 archivos de HEAD + el 800→700 de DEC-005) y su hash es **idéntico, byte a byte, al del CSS compilado registrado al iniciar P3** (`3e64781602215d198bca6efa4c0901f7`).
3. **Equivalencia por DOM completo** (336 nodos por estado: posición y tamaño renderizados y ~28 propiedades computadas). Exenciones **explícitas y acotadas**, porque no cambian lo que se ve: (a) `top/right/bottom/left` computados de `nav-item` (`relative` → `static`); (b) `width` y `gridTemplateColumns` del dropdown **oculto** (se reporta lo declarado); (c) `left/right` computados del dropdown, que ahora se resuelven contra otro bloque contenedor. **El rectángulo (posición y tamaño) se compara siempre, sin exenciones.**
4. **Zoom 200 % real:** viewport de 640 px con `deviceScaleFactor: 2`.
5. Header medido con un **harness** que ejecuta el `build()` real de `web-header-docs.js` (ver §7, P-011-03), con el header **a sangre completa** y un caso adicional con el dropdown anclado al **3.er item**.
6. Playwright se instaló **fuera del repo** (`/tmp`), así que `package.json` no se tocó.

## 5. Resultados

### 5.1 A tamaño de texto normal el resultado es idéntico al original
| Comparación | Viewport × tema (320/768/769/900/1024/1440 × 3 temas) | Zoom 200 % real × 3 temas |
|---|---|---|
| Ahora vs **P3 sin B** | **16/16 idénticos** | **3/3 idénticos** |
| Ahora vs **anterior a P3 (original)** | **16/16 idénticos** | **3/3 idénticos** |

Se conservan tamaños, espaciados y apariencia a escala normal (Figma). Modo móvil/escritorio sin cambios: 768 px móvil, 769 px escritorio.

**Única diferencia visual medida (reportada):** si el header está dentro de un contenedor con márgenes laterales (no a sangre), entre 769 y 779 px el dropdown queda hasta 9 px más angosto, porque ahora se detiene en el borde interior del header en vez de sobresalir de él (16 px de margen: 711 vs 720 px a 769 px; 717 a 775 px; idéntico desde 780 px). Con header a sangre no hay diferencia. Evidencia: `caso-header-con-margenes.txt`.

### 5.2 Texto ampliado (preferencia real del navegador)
Combinaciones con algún problema (desborde, solape o dropdown fuera del viewport), sobre **50** combinaciones de texto × ancho × tema:

| Referencia | Con problemas |
|---|---|
| Anterior a P3 (original) | 22 |
| P3 sin B | 25 |
| **Ahora (con B)** | **9** |

Puntos medidos del rango pedido (**768, 900 y 1024 px**, texto 150 % y 200 %, Light/Dark/HC; además 769 px a texto normal): **0 problemas ahora.** Sin B había desbordes (p. ej. 200 % a 900 px: +228 px; a 1024 px: +104 px). Las 9 restantes son todas **a 320 px** (3 tamaños de texto × 3 temas), ver §6.

| Texto | Último ancho en modo móvil **ahora** | Antes (P3 sin B y original) |
|---|---|---|
| 100 % | 768 px | 768 px (sin cambio) |
| 150 % | 1152 px (1153 px ya es escritorio) | 768 px |
| 200 % | 1536 px (1537 px ya es escritorio) | 768 px |

**Sin solapamientos** entre elementos del header en ninguna combinación (0 en las 50).

**Dropdown anclado al 3.er item** (antes desbordaba incluso en el CSS original): 100 % a 769 px → 555.5 px (borde der. 768); a 900 px → 686.5 (899); a 1024/1440 px → 720 (sin cambio). 150 % a 1153 px → 841.8 (borde 1152). 200 % a 1537 px → 1128 (1536). Con texto ampliado y espacio suficiente el panel mide 45rem (1080 px a 150 %), es decir, **escala con el texto**, según DEC-012.

### 5.3 Teclado (solo Tab)
Para cada combinación se compararon los elementos enfocables **visibles** del header con los alcanzados por Tab: mismo orden y todos dentro del header y del viewport. **32/36 correctas** (v-public y v-mobile con drawer abierto, 100/150/200 % × anchos incluyendo ambos lados del breakpoint). Las 4 excepciones son las de 320 px con texto 150 %/200 %: el botón del menú queda fuera de la pantalla (mismo origen que §6).

### 5.4 Regresión de P3 sobre el resto
La opción B solo modifica reglas del Header, que no se renderizan en el portal; por eso los resultados del portal de la versión anterior (56/56 estados idénticos, Sidebar, Avatar, Badges, Iconos, y zoom 200 % de P2 y DEC-005) no pueden verse afectados. Se apoya en la comparación de reglas compiladas (§3). **No se volvió a ejecutar** esa suite en esta pasada.

## 6. PI-04: Header a 320/375 px con texto ≥ 150 % — RESUELTO (subtítulo oculto a 16em + opción C)

**Problema (introducido por P3):** a 320 px, con texto 150 % el documento desbordaba 57 px (el botón del menú quedaba fuera de la pantalla) y con 200 %, 182 px; a 375 px y 200 %, 127 px. Causa: `brand-name`, `brand-service`, logo y botón ahora escalan con el texto y el contenedor de marca no puede encogerse.

**Decisión aprobada:** mantener la escalabilidad del texto, evitar el desborde horizontal, ocultar solo el subtítulo cuando falte espacio y pasar el botón de menú a una 2.ª fila (opción C). Las otras alternativas se descartaron con evidencia (`evidencias/dec012-pi04/pi04-output.txt`): ocultar solo el subtítulo no basta (+134 px a 320/200 %), compactar espacios no basta (+70 px), la elipsis encoge el logo a 30 px y trunca el nombre, y topar logo/botón los deja en 38 px (< 44 px).

**Implementación** (solo `core/components/web/_header.scss`, al final del archivo):

```scss
@media (max-width: 16em) {
  .mp-web-header__brand-service { display: none; }
  .mp-web-header__main { grid-template-columns: auto; justify-items: start; }
}
```

- `16em` equivale a 256 px de texto base: 320 px a escala normal son 20em, así que **a texto normal la regla nunca se activa**. Con texto 150 %/200 % se activa en 320 y 375 px (ya no en 768+).
- Logo y botón conservan su tamaño (88 px a 200 %, es decir 44 px × 2). El logo, el nombre (siempre 1 línea) y el botón de menú permanecen visibles. La altura del header crece solo cuando la regla se activa (medido con la alternativa C: 258–290 px a 320 px/200 %, frente a 138 px).
- Bootstrap, vendors y otros componentes no se tocaron. `letter-spacing`, colores y estados sin cambios.

**Validación `pi04.js --live`** (CSS reconstruido con `npm run build`; 320/375/768/900/1024/1440 px × texto 100/150/200 % × Light/Dark/High Contrast × 6 casos del Header):

| Verificación | Resultado |
|---|---|
| Texto 100 %: DOM completo vs. estado previo a PI-04 y vs. original anterior a P3 | **18/18 idénticos** (ambas comparaciones) |
| Aceptación (sin overflow, sin solapes, logo + nombre visibles, nombre en 1 línea, botón de menú en vista) | **18/18 combinaciones ancho × texto, 3/3 temas** (sin casos fallidos) |
| Teclado (Tab: mismos enfocables y mismo orden, todos en vista) | **36/36** |
| Subtítulo visible | Sí a texto normal en todos los anchos; oculto solo a 320/375 px con 150 %/200 % |

Nota: el original ya desbordaba a 900 px (+32/+84/+136 px con 100/150/200 %) y a 1024 px/200 % (+12,5 px); P3+B y esta corrección lo resuelven.

**Fuera del alcance de PI-04 (preexistente, PI-01):** la variante ZT del Header (`mp-web-header--zt`) desborda a 320 px incluso en el original (24,5 px a texto normal). Con texto ampliado, original/P3+B/PI-04: 150 % → 98 / 195,3 / 159,4 px; 200 % → 173,5 / 368,1 / 320,3 px. P3 empeoró esa variante respecto al original (PI-04 recupera parte). Sigue registrada en `13-Pendientes-Independientes.md` (PI-01) y no se corrigió porque su causa (el toggle oculto desplaza las columnas del grid) pertenece a otra regla.

### 6.1 PI-01 — Header ZT (reglas A, B y C + H-03)

Cambios: `core/components/web/_header.scss` — (A, **provisional pendiente de Figma**) `.mp-web-header--zt .mp-web-header__main { grid-template-columns: auto minmax(0, 1fr) auto }` (marca natural, buscador flexible, chip natural); (B) `.mp-web-header--zt { grid-template-columns: minmax(0, 1fr) }` en `≤ 48em`; (C) en `≤ 22em`, `.mp-web-header--zt .mp-web-header__main { display:flex; flex-wrap:wrap }`; el subtítulo ya se oculta a `≤ 16em` (PI-04). `js/web-header-docs.js` — (H-03) chip con `aria-label="Ana Soto, abrir menú de usuario"` y avatar `aria-hidden="true"`. Sin tocar Bootstrap ni otros componentes; `rem`/`em` intactos; orden del DOM sin cambios. H-02 (buscador móvil) queda como decisión funcional de UX/UI, no implementada.

| Verificación (Chromium, tamaño de texto real, 3 temas, 6 anchos × 100/150/200 %) | Resultado |
|---|---|
| Header público, 6 casos (`pi04-publico.js --live`): equivalencia a texto normal frente al estado previo y al original anterior a P3 | **18/18** (ambas) |
| Header público: aceptación (sin overflow, sin solapes, logo + nombre, botón de menú a la vista) | **18/18** combinaciones × 3 temas |
| Header público: teclado | **36/36** |
| Header ZT frente al estado previo a la regla A | Idéntico en todos los casos de móvil y en los de escritorio de ≤ 1024 px con 150 %/200 %; cambia **solo** el escritorio: 900/1024/1440 px a texto normal y 1440 px a 150 % |
| Distribución en escritorio (texto normal) | 900 px: marca 158,5 / buscador 541,5 / chip 118 (antes 208 / 435,5); 1024 px: 665,5 / 118 (antes 208 / 559,5); 1440 px: 1081,5 / 118 (antes 208 / 975,5); a 150 %/1440 px: 237,8 / 904,2 / 176 (antes 309 / 747,2). Alturas sin cambio (69 y 103 px); el chip queda pegado al borde derecho |
| Header ZT: controles sin recortes ni fuera de pantalla | **51/54** (original: 39/54). Las 3 restantes son H-01 (título del contenido de demostración, 200 %/320 px) |
| Header ZT: teclado (orden y foco a la vista) | **54/54** |
| Portal real (`drupal.html`: `core.css + portal.css + icons.css`, 3 temas del portal, 320/375/1440 px × 100/150/200 %), Header público y ZT con el markup real | **54/54** sin overflow, controles dentro de pantalla y mismo orden de Tab; 0 iconos defectuosos (fuente `CompensarIcons`); glifo del botón de menú pintado |
| H-03, árbol de accesibilidad de Chromium (CDP) | `button "Ana Soto, abrir menú de usuario"`: **contiene y empieza por el texto visible "Ana Soto"** (WCAG 2.5.3 cumplido; antes `"Abrir menú de usuario"` no lo contenía) |
| H-03, sin cambio visual | Captura del chip idéntica byte a byte entre el markup anterior y el nuevo |

Notas: el cumplimiento de 2.5.3 se verificó por comparación del nombre accesible con la etiqueta visible; la validación completa de accesibilidad requiere pruebas manuales con lectores de pantalla. En el portal el menú de módulos del ZT no se ve por una regla de `portal.css` (H-05), no por el componente. Evidencias: `evidencias/dec012-pi01/regla-A-H03/` (scripts, salidas, JSON, capturas, LEEME) y `evidencias/dec012-pi01/`, `dec012-pi01-analisis/`.

## 7. Observaciones independientes (registradas, no corregidas)

- **DEC-011 → `08-Pendientes-DEC-011.md`**: P-011-02 — **13** archivos de la documentación embeben el CSS de su componente como texto (visor y descarga) y **ninguno contiene `rem`** (p. ej. `web-header-docs.js` aún muestra `position: relative`, `left:0`, `width:min(720px…)` y `@media (max-width:768px)`); P-011-03 — `header.html` no contiene el componente.
- **`13-Pendientes-Independientes.md`**: PI-01 (chip ZT estirado; causa verificada: el toggle oculto desplaza las columnas del grid), PI-02 (`.mp-chip--lg` mide 14 px, igual que el chip base; el fallback de 16 px nunca se usa; Figma sin confirmar), PI-03 (botón de menú móvil estirado como barra: **preexistente**, 543 px a 768 px también en el original; la opción B lo hace visible en más anchos) y PI-04 (§6, resuelto); PI-01 parcialmente resuelto (§6.1).

## 8. Limitaciones

- Solo Chromium. **El dimensionamiento del dropdown se apoya en comportamiento estándar de CSS** (posición estática de un elemento absoluto, *shrink-to-fit* y dimensionado intrínseco de rejillas), pero **no se probó en Firefox ni Safari**; se recomienda una revisión cruzada antes de publicar.
- Sin lectores de pantalla. Teclado: solo `Tab`.
- El caso del dropdown anclado al 3.er item es sintético (se mueve el dropdown existente al 3.er item); la documentación no tiene un caso así.
- El botón del menú móvil no tiene comportamiento en la documentación (no hay JS que abra/cierre el drawer); se probó el estado "drawer abierto" (`v-mobile`).
- Sidebar, Avatar, Badges e Iconos se validaron en la pasada anterior (no se repitieron).

## 9. Evidencias

`docs/auditoria-design-system/evidencias/dec012-p3-opcionB/`: `validacion-resumen.txt` / `.json` / `validacion-datos-crudos.json.gz`, `overflow-320-texto-grande.txt`, `prueba-wrap-marca-NO-aplicada.txt`, `medicion-chip-zt-y-chip-lg.txt`, `caso-header-con-margenes.txt`, `capturas/` (12) y `scripts/` (con `LEEME.txt` para reproducir, incluida la reconstrucción del CSS anterior a P3). Evidencias de la pasada anterior en `evidencias/dec012-p3/`.

Evidencias de PI-04: `evidencias/dec012-pi04/` (`pi04-live-output.txt`, `pi04-output.txt`, JSON, scripts, capturas).

## 10. Conclusión

- La opción B resuelve lo pedido: el header responde al texto ampliado con un cambio a modo móvil ordenado y sin solapamientos ni desbordes en los anchos medidos entre 768 y 1024 px, y el dropdown se dimensiona desde su ancla sin JavaScript; **a escala normal el resultado es idéntico al original (16/16 y 3/3)**.
- PI-04 quedó resuelto (§6): sin desborde en el Header público a 320/375 px con texto 150 %/200 %, idéntico a texto normal. Queda pendiente la variante ZT (PI-01, preexistente) y validar el dropdown en Firefox y Safari.
- Siguiente, cuando el equipo lo indique: etapa final de documentación con `_buttons-docs.scss`.
