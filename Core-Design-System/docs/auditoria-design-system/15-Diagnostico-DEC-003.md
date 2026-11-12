# 15 — Diagnóstico DEC-003: estados Error, Focus y Disabled de Inputs

> **Solo diagnóstico.** No se modificó código, no hay commits ni despliegues.
> **Base de análisis: Core Design System `v2.2.0` (`77696a7`).** Los commits `879fadb` (readonly/disabled) y `77696a7` (release) son oficiales; no se revierten ni se reaplica ningún WIP.
> Medido el 6 de noviembre de 2026 en Chromium (estados reales: hover, mousedown, foco por teclado) sobre `v2.2.0:css/core.css`, en los temas claro, oscuro y alto contraste. Evidencias en `evidencias/dec003-diagnostico/`.
> Marco: **DEC-002** protege bordes Normal/Hover/Active; **DEC-003** alinea Error/Focus/Disabled con Figma sin rediseñar; **DEC-004** define el patrón de foco transversal; Bootstrap (`core/vendors/`) no se toca.

## 1. Qué cerró v2.2.0 (`879fadb`) — ya no se analiza

| Hallazgo | Cómo se cerró | Verificado hoy en `v2.2.0` |
|---|---|---|
| **DS-09** — build desfasado y foco de readonly perdido | Se recompiló el CSS desde la fuente y el campo readonly recibe foco visible | Readonly enfocado muestra `outline: 2px solid` y **cambia píxeles** en los tres temas (claro, oscuro, HC). `css/core.css` coincide byte a byte con la fuente de `_inputs.scss` |
| **DS-19** — disabled y readonly indistinguibles en Dark/HC | Readonly y disabled tienen fondo/borde propios por tema; readonly conserva opacidad 1 | Dark: readonly `#333` texto `#a4a4a4` (5,07:1) vs disabled `#333` al 50 %. HC: readonly texto `#fff` (21:1). Se diferencian |

El árbol de trabajo de `_inputs.scss` y `css/core.css` **ya coincide con `v2.2.0`**: no hay WIP pendiente en esos archivos.

## 2. Referencia de Figma (archivo `1zVGMpzqBgiBUqhmfFEAoT`, tablero 2.2 · `4517:7746`)

Estados definidos (2.2.3 · `4527:13883`): Por defecto, Hover, Active, Focus, Error, Deshabilitado. **No existe un estado Readonly.** Los modos Dark y HC (2.2.4) muestran **solo el campo por defecto**; Error, Focus y Disabled no están definidos para esos temas (sus valores se infieren de los tokens, no de un nodo).

| Estado (nodo) | Figma | Contraste (Light) |
|---|---|---|
| Focus (`4527:13793`) | anillo 4 px `use/focus/border` `#ffe6d6` + borde 1 px `use/border/hover` `#e63f0c` | borde 4,13:1 · anillo 1,2:1 |
| Error (`4527:13796`) | borde `use/state/error/border` `#db7165`, **sin halo**; mensaje `use/state/error/text-error-field` `#9e3328` Regular + icono 16 px | borde 3,2:1 · texto 7,1:1 |
| Disabled (`4527:13799`) | fondo `use/surface/surface` `#f5f5f5`, borde `use/border/default` `#ccc`, label/placeholder/apoyo `use/text/tertiary` `#666`; **opacidad 100 %** | texto 5,27:1 · borde 1,47:1 sobre `#f5f5f5` |

## 3. Diferencias que siguen vigentes en v2.2.0

Medición de `v2.2.0:css/core.css` frente a Figma. Lo que ya coincide (Normal, Hover, Active, Readonly con foco, diferenciación de Dark/HC) **no se lista**: está cerrado por DEC-002 o por `879fadb`.

| # | Estado | v2.2.0 (medido) | Figma | Clasificación | Hallazgo |
|---|---|---|---|---|---|
| 1 | **Disabled — opacidad global** | Fondo `#f5f5f5`, borde `#ccc` (coinciden), **pero `opacity: 0.5`** por la regla global `[disabled]` → texto efectivo **2,05:1** (Light), **2,39:1** (Dark), **5,28:1** (HC) | Fondo/borde/texto a **opacidad 100 %** (texto 5,27:1) | Accesibilidad + fidelidad | **DS-18** |
| 2 | Focus — color y grosor | Borde `#ff6600` (**2,94:1**) + halo 3 px `#ff6600` 18 % | Borde `#e63f0c` (4,13:1) + anillo 4 px `#ffe6d6` | Fidelidad + accesibilidad | DS-15, DS-06 |
| 3 | Error — borde y mensaje | Borde `#d14434` + halo 3 px 15 %; apoyo `#521a14` peso 500 | Borde `#db7165` **sin halo**; apoyo `#9e3328` peso 400 **+ icono 16 px** | Fidelidad | DS-15 |
| 4 | Error en **Dark** | Idéntico a normal: borde `#666`, apoyo `#a4a4a4`; solo un halo amarillento al 15 % | No definido en Figma (el token de borde de error da `#d14434`) | Accesibilidad | DS-05 |
| 5 | Error en **High Contrast** | Idéntico a normal: borde blanco, texto blanco; solo el apoyo cambia a peso 500 | No definido | Accesibilidad | DS-05 |
| 6 | **Error + Focus** | El foco (halo naranja 18 %) sustituye a la señal de error | No definido | Comportamiento + accesibilidad | DS-05/DS-15 |
| 7 | Texto de apoyo (estado normal) | `#666` | `use/text/primary` `#111` | Fidelidad | DS-15 |
| 8 | Label en Disabled | `#111` (sin atenuar) | `use/text/tertiary` `#666` | Fidelidad | DS-15 |
| 9 | Orden del asterisco obligatorio | Después del texto del label (en los ejemplos) | Antes del texto | Fidelidad (markup/docs) | DS-15 |
| 10 | Readonly — comportamiento | `cursor: not-allowed` y `caret-color: transparent` | Figma no define Readonly | Comportamiento | — (decisión UX/UI) |

**Foco de readonly (no es un pendiente, es validación):** en `v2.2.0` readonly enfocado muestra `outline: 2px solid` del color de foco por tema y cambia píxeles → DS-09 cerrado.

## 4. Clasificación de los pendientes

- **Fidelidad visual (alinear con Figma):** #2 foco, #3 error, #7 apoyo `#111`, #8 label disabled, #9 asterisco.
- **Accesibilidad:** #1 disabled al 50 % (contraste 2,0:1; `pointer-events:none` impide `not-allowed` y tooltips, DS-18); #2 borde de foco 2,94:1 (< 3:1, WCAG 1.4.11); #4/#5 error indistinguible en Dark/HC (3.3.1, 1.4.1); #6 error+focus pierde la señal de error.
- **Comportamiento:** #10 `caret-color:transparent` (oculta la posición del cursor al seleccionar texto en readonly) y `cursor:not-allowed` (semánticamente discutible: el campo es seleccionable y enfocable).

### Requiere decisión de UX/UI antes de implementar (DEC-003 §4: no inventar valores)
1. **Disabled y la opacidad global (DS-18).** La regla `[disabled]{opacity:.5}` de `core/base/_accessibility.scss` afecta a **todos** los controles, no solo al input. Alcanzar la opacidad 100 % de Figma exige excluir `.mp-input-field` o cambiar la regla global (impacto en botones y otros). Decidir el alcance.
2. **Error en Dark y HC (DS-05).** Figma no los define. Los tokens dan borde de error `#d14434` (4,13:1 Dark, 4,59:1 HC). Se requiere **señal no cromática** (el icono de 16 px que Figma ya usa en el apoyo; opcionalmente peso 500). Confirmar.
3. **Error + Focus** (no definido). Propuesta interina: conservar el borde de error con el anillo de foco superpuesto.
4. **Texto de apoyo a `#111` (DS-15).** Afecta a todos los estados y a toda la documentación de formularios. Confirmar.
5. **Readonly.** Figma no lo define. Opciones: mantener el aspecto de `v2.2.0` (gris suave) o acercarlo al normal; decidir `cursor` y `caret-color`.

### No se tocan por decisión vigente
- **DEC-002:** bordes Normal/Hover/Active no cambian (Normal sigue a 1,32:1; solo se documenta).
- **DEC-004:** el patrón de foco transversal se definirá allí. Aquí el foco de Inputs se prepara con **tokens locales** (`--mp-inp-focus-*`) para que DEC-004 solo ajuste valores, sin rediseñar.
- Borde `#666` en Dark vs `#7f7f7f` de Figma: **observación**, no se modifica por DEC-003.

## 5. Plan de implementación (base v2.2.0; a ejecutar solo con aprobación)

Alcance de archivos: **únicamente** `core/components/web/_inputs.scss` y su compilado `css/core.css`; y, para #1, una decisión sobre `core/base/_accessibility.scss` que requiere aprobación por su impacto transversal. Sin tocar Bootstrap ni otros componentes. Documentación: informe y nota en la página de Inputs.

- **P1 · Especificidad y cascada.** Mover las reglas de Error y Disabled al final de cada bloque de tema para que no las pisen; usar `:where()` donde haga falta neutralizar sin escalar especificidad. Base = `v2.2.0` (no se parte de ningún WIP).
- **P2 · Disabled (DS-18, con decisión UX/UI #1).** Llevar el campo a opacidad 100 % con los colores de Figma (`#f5f5f5`/`#ccc`/`#666`): excluir `.mp-input-field:disabled` de la opacidad global **o** ajustar la regla global según lo que decida UX. `pointer-events:auto` en el campo para que se vea `not-allowed`. Atenuar label/apoyo del grupo con `.mp-input-group:has(:disabled)` y clase de respaldo.
- **P3 · Focus (coordinado con DEC-004).** Patrón de Figma por tokens: borde `--use-border-hover` + anillo 4 px `--use-focus-border` en Light; Dark y HC con sus tokens (outline amarillo en HC). Readonly **conserva** el foco visible de `v2.2.0`. Normal/Hover/Active idénticos (DEC-002).
- **P4 · Error (con decisión UX/UI #2, #3).** Borde `--use-state-error-border` sin halo, apoyo `--use-state-error-text-error-field` peso 400 + icono; Error en Dark/HC con la señal no cromática aprobada; Error+Focus según §4.3.
- **P5 · Texto de apoyo y label (con decisión UX/UI #4).** Apoyo `#111`, label disabled `#666`, orden del asterisco en los ejemplos/markup.
- **P6 · Readonly (con decisión UX/UI #5).** Ajustar `cursor` y `caret-color` según lo acordado; sin afordancias de edición en hover/active (ya es así en `v2.2.0`).

## 6. Plan de pruebas

1. **DEC-002 intacta:** estilos computados de Normal, Hover, Active y Filled idénticos a `v2.2.0` (tres temas, campo a campo).
2. **DS-09/DS-19 no regresan:** readonly enfocado sigue mostrando foco; readonly y disabled siguen diferenciados en Dark/HC.
3. **Matriz de estados** (`inputs-states.js`): 14 estados × 3 temas contra la tabla esperada derivada de los tokens de Figma.
4. **Foco visible:** cambio de píxeles y contraste del indicador ≥ 3:1 en Focus, Error+Focus y Readonly+Focus, en Light/Dark/HC y con `forcedColors:'active'`.
5. **Teclado:** Tab y Shift+Tab por una secuencia normal/readonly/error/disabled (disabled se omite); foco visible en cada parada.
6. **Error:** distinguible del normal sin leer el texto (píxeles y borde) en los tres temas; `aria-invalid` + `aria-describedby`; icono presente.
7. **Disabled:** contraste efectivo **con la opacidad acumulada** = Figma; verificar que el cambio no altere otros controles si se toca la regla global.
8. **axe-core** en los tres temas + las pruebas propias 4–6 (axe no detecta por sí solo la pérdida de foco ni el error indistinguible).
9. **No regresión:** diff de selectores del CSS compilado (solo `.mp-input-*`), `core/vendors`, `package*.json` sin cambios; humo del portal (inputs, dropdown, formularios) y de 320 px / texto 200 %.
10. **Build:** `npm run build` reproducible y sin `rem(` sin resolver; versión candidata `v2.2.1`.

## 7. Riesgos

- Cambiar foco y error tiene impacto transversal en formularios y documentación; verificar con UX en los tres temas antes de publicar.
- Tocar la regla global de opacidad (#1) afecta a botones y demás controles deshabilitados: no hacerlo sin la decisión de alcance.
- Firefox y Safari: `:has()`, `:where()` y `color-mix()` deben verificarse (requisito V-01 de DEC-012, vigente).
- Pendiente de Figma: estados Readonly, Error+Focus y Dark/HC de Error y Disabled; más el borde punteado para campos no editables en alto contraste (decisión registrada en `00-Estado-Maestro.md` §5).

---

## 8. Implementación (candidata a v2.2.1) — resultados

> Ejecutado el 6 de noviembre de 2026 sobre v2.2.0. **No se han hecho commits, tags, pushes ni despliegues.** Archivos tocados: `core/components/web/_inputs.scss`, su compilado `css/core.css` y la documentación `docs/transversales/components/inputs.html`. Bootstrap, `_accessibility.scss`, otros componentes, Portal UX y Nara **sin cambios**. Evidencias: `evidencias/dec003-diagnostico/` (`states-cmp.json`, `shots/`, scripts `active.js`, `kbd.js`, `forced.js`, `shots.js`).

### 8.1 Qué se aplicó (según las 5 decisiones UX/UI)

| Decisión | Cambio |
|---|---|
| #1 Disabled | `.mp-input-field:disabled { opacity: 1; cursor: not-allowed }`; la regla global `[disabled]{opacity:.5}` se mantiene para el resto. Colores de Figma (`#f5f5f5`/`#ccc`/`#666`) a tono pleno |
| #2 Error Dark/HC | Borde con `--use-state-error-border` (rojo en todos los temas, antes `--use-state-error-icon` que era blanco en Dark/HC); mensaje con `--use-state-error-text-error-field` peso 400; icono de 16 px en el markup |
| #3 Error + Focus | Se conserva el borde de error y se añade el anillo de foco; tokens locales `--mp-inp-focus-border`/`-ring`/`-ring-width` para DEC-004 |
| #4 Texto de apoyo | `.mp-input-helper` normal usa `--use-text-primary` (token, cambia con el tema) |
| #5 Readonly | Mantiene el aspecto de v2.2.0 (gris, foco visible, dashed en HC); `cursor:default`; se retiró `caret-color:transparent`; el estado se comunica por el atributo HTML `readonly` |
| #8 Label disabled | `.mp-input-group:has(:disabled) .mp-input-label` → `--use-text-tertiary` (con respaldo `.is-disabled`) |
| #9 Asterisco | En `inputs.html`, `*` antes del texto del label (4 labels) |

### 8.2 Resultados de pruebas (Chromium, 3 temas)

| Prueba | Resultado |
|---|---|
| **DEC-002 intacta** | Normal, Hover y Filled idénticos a v2.2.0 (3 temas). Regla `:active` idéntica byte a byte. El único delta medido en "active" es el nuevo anillo de foco superpuesto (un input en mousedown siempre tiene `:focus`): es DEC-003 #3, no un cambio de Active |
| No regresión DS-09/DS-19 | Readonly enfocado muestra `outline: 2px solid` y cambia píxeles (3 temas); readonly y disabled siguen diferenciados |
| **Disabled (DS-18)** | Opacidad 1; texto efectivo 5,27:1 (Light), 5,07:1 (Dark), 21:1 (HC). Antes: 2,05 / 2,39 / 5,28 |
| **Error** | Borde distinguible del normal en los 3 temas: Light `#db7165` (3,2:1), Dark `#d14434` (3,18:1 sobre `#111`; 4,13:1 sobre la superficie real `#292929`), HC `#d14434` (4,59:1). Mensaje `#9e3328` (7,1:1 Light) peso 400 + icono; `aria-invalid`+`aria-describedby` |
| **Focus** | Borde `#e63f0c` (4,13:1 Light ≥ 3:1) + anillo 4 px `#ffe6d6`; Dark `#e65c00` (4,08:1); HC outline amarillo 3 px (19,6:1) |
| **Error + Focus** | Conserva borde de error y añade el anillo/outline de foco (píxeles cambian; el mensaje de error permanece) |
| **Texto de apoyo** | Light `#111` (18,9:1), Dark `#f5f5f5` (13,3:1), HC blanco (21:1) |
| **Teclado** | 12/12 focos visibles; orden a→b→c→e; disabled omitido |
| **forced-colors** | normal/error con `outline`; readonly con borde `dashed` y foco |
| **axe-core** | Sin violaciones nuevas (solo las del arnés: título/landmark/h1/region, iguales que antes) |
| **Regresión de selectores** | 34 reglas del CSS cambian, **todas `.mp-input*`**; 0 ajenas. `core/vendors`, `package*.json` sin cambios |
| **Build** | `npm run build` reproducible; `css/portal.css` sin cambios; 0 `rem(` sin resolver |

### 8.3 Pendientes para aprobación

- **Revisión visual del equipo** de los tres temas (capturas en `evidencias/dec003-diagnostico/shots/`), en especial el nuevo foco (`#e63f0c` + anillo `#ffe6d6`) y el error, por su impacto transversal en formularios.
- **Firefox y Safari:** `:has()`, `color-mix()` no se usa ya en inputs, pero el patrón de foco y `:has()` del label disabled deben verificarse (V-01 de DEC-012, vigente).
- **Figma:** formalizar Readonly, Error+Focus y los modos Dark/HC de Error y Disabled; y el borde punteado en alto contraste.
- **No incluido por alcance:** los visores de CSS embebido en `js/*-docs.js` (p. ej. `component-docs.js`) siguen con los valores viejos del helper de error; es DEC-011 P-011-02, no se tocó.
- **Commit/tag `v2.2.1`:** pendiente de tu autorización.

---

## 9. Revisión final (previa a v2.2.1)

> 6 de noviembre de 2026, Chromium. Se reutilizan las pruebas superadas de §8; aquí solo lo nuevo. Evidencias: `evidencias/dec003-diagnostico/` (`figma-focus.png`, `estados-combinados.js`, `shots/dec003-hc-errorfocus.png`).

### 9.1 Comparación visual con Figma en Light (punto 1)

| Estado | v2.2.1 (medido) | Figma | Veredicto |
|---|---|---|---|
| Focus | borde `#e63f0c` (4,13:1) + anillo 4 px `#ffe6d6`; radio 16 px | borde `use/border/hover` `#e63f0c` + anillo 4 px `use/focus/border` `#ffe6d6` (nodo 322×112 = 320 + 2·1 px de anillo) | Coincide |
| Error | borde `#db7165` (3,2:1), sin halo; mensaje `#9e3328` regular + icono 16 px | borde `use/state/error/border` `#db7165` sin halo; `use/state/error/text-error-field` `#9e3328` regular + icono | Coincide |
| Disabled | fondo `#f5f5f5`, borde `#ccc`, texto `#666`, opacidad 100 % | ídem | Coincide |

### 9.2 Estados combinados en los tres temas (punto 2)

Con **foco real** (no solo la clase demo):

| Combinado | Light | Dark | High Contrast |
|---|---|---|---|
| Error + Focus | borde error `#db7165` + anillo 4 px | borde error `#d14434` + anillo 4 px | borde error `#d14434` **+ outline amarillo 3 px** (se conservan ambas señales) |
| Readonly + Focus | borde `#ccc` + outline 2 px `#ff6600` | borde `#7f7f7f` + outline 2 px `#ff9d5c` | borde dashed blanco + outline 2 px amarillo |
| Disabled | opacidad 1, sin foco | opacidad 1 | opacidad 1, borde dashed |

**Corrección introducida en esta revisión:** la regla base de foco usa una cadena `:not()` que eleva su especificidad; al principio el error+focus en HC perdía el borde rojo (lo pisaba el borde blanco del foco base) **solo con la clase `.is-focus-demo`** (el foco real ya funcionaba). Se replicó la cadena `:not()` en las reglas `.error:focus, .error.is-focus-demo` de los tres bloques y se añadió `.is-focus-demo` para que la documentación muestre lo mismo que el foco real. Verificado: error+focus real y demo mantienen el borde de error en los tres temas (captura `dec003-hc-errorfocus.png`).

### 9.3 Patrón de error reutilizable y accesible (punto 3)

- El patrón canónico vive en la **fuente del componente** (`js/component-docs.js`, snippet "accesible"), no solo en la página: `aria-invalid="true"` + `aria-describedby` al helper con `id`, e icono de 16 px vía `iconMarkup('error', 16)`. Es el markup que un consumidor copia.
- Se corrigió la **asociación accesible en los 4 ejemplos de error de `inputs.html`** (antes tenían `aria-invalid` pero el helper no tenía `id` ni `aria-describedby`): ahora cada campo con error enlaza su mensaje (`errAssoc 4/4`), con el icono de 16 px.
- Observación (fuera de alcance, DEC-011 P-011-02): el **playground** de `component-docs.js` aún pinta `✕`/`✓` de texto en el helper en lugar del icono; es contenido generado del visor, no el patrón canónico. No se tocó.

### 9.4 Markup de los ejemplos (punto 4)

Humo del portal (`drupal.html#inputs`): 24 campos renderizan, 4 helpers de error con icono, 4 asteriscos antes del label, 4 asociaciones `aria-describedby`, sin errores de JS, sin peticiones fallidas, sin desborde. Los ejemplos siguen funcionando.

### 9.5 Alcance (punto 5)

Cambios **solo** en: `core/components/web/_inputs.scss`, `css/core.css` (recompilado), `docs/transversales/components/inputs.html`. Intactos: `css/themes.css`, `core/vendors/`, `core/base/_accessibility.scss`, `package.json`, `package-lock.json`. Regresión de selectores: 34 reglas cambian, **todas `.mp-input*`**, 0 ajenas. Build reproducible, 0 `rem(` sin resolver.

### 9.6 Variantes provisionales (sin definición en Figma)

Siguen marcadas como **provisionales, pendientes de formalizar en Figma**: Readonly (aspecto, `cursor:default`, sin `caret-color`, dashed en HC), Error + Focus (borde de error + foco superpuesto) y los modos Dark/HC de Error y Disabled.

---

## 10. Validación de responsive y zoom (320/375 px × texto 100/150/200 %)

> 6 de noviembre de 2026, sobre `v2.2.1` + un ajuste en el árbol de trabajo (**sin commit**). Script: `evidencias/dec003-diagnostico/responsive-320-zoom200.js`. Tamaño de texto real del navegador (preferencia del perfil), tres temas, campos normal/error/disabled/readonly con etiqueta y mensaje largos.

**Resultado inicial (v2.2.1): 15/18.** Fallaron las 3 combinaciones de **320 px con texto 200 %** (una por tema): 30 px de desborde horizontal y un texto recortado.

**Causa (medida):** no eran los campos (miden 288 px y caben); era el **mensaje de error** `.mp-input-helper`: "Formato inválido. Ejemplo: usuario@compensar.com" contiene un token sin puntos de corte que a 200 % (28 px) mide 335 px dentro de 288 px. **Preexistente:** en v2.2.0 desbordaba 31 px. No contradice a Figma (Figma no define el reflow).

**Ajuste aplicado** (`core/components/web/_inputs.scss`, regla `.mp-input-helper`): `overflow-wrap: anywhere` (WCAG 1.4.10, reflow). Solo actúa cuando el texto no cabe.

| Verificación | Resultado |
|---|---|
| Responsive 320/375 px × 100/150/200 % × 3 temas: sin desborde horizontal, textos sin recorte, alto del campo escala con `rem` (56 → 84 → 112 px), disabled a opacidad 1, foco visible en los 3 campos enfocables, anillo/outline dentro del viewport | **18/18** (antes 15/18) |
| Regresión de estados (14 estados × 3 temas, `inputs-states.js`) entre `v2.2.1` y el árbol actual | **42/42 idénticos** (a tamaño normal el ajuste no cambia nada) |
| Reglas de CSS que cambian frente a `v2.2.1` | **1**, `.mp-input-helper`; 0 ajenas |
| Build | `npm run build` sin errores ni advertencias; 0 `rem(` sin resolver; `portal.css` sin cambios |

**Estado de versión:** este ajuste queda **sin commit** y es posterior al tag `v2.2.1`. Requiere decidir si se publica como `v2.2.2` (patch) o se incorpora al siguiente release. No se modificó Bootstrap ni ningún otro componente.
