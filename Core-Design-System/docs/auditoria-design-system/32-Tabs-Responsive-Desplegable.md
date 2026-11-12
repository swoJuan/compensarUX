# 32 — Tabs: menú desplegable por debajo de 768 px (v2.4.0)

**Fecha:** 11 de noviembre de 2026 · **Versión:** `v2.4.0` · **Componente:** `mp-tabs` / `mp-tab` (transversal)

## 1. Hallazgo

La documentación del componente (`docs/transversales/components/tabs.html`, «6. Responsive») exigía desde su
publicación que en pantallas pequeñas los tabs se **transformaran en menú desplegable**, pero:

- No fijaba un punto de quiebre.
- El ejemplo era un `<select>` estático, sin relación con el componente.
- **El código no lo implementaba.** `core/components/web/_tabs.scss` solo tenía `flex-wrap: wrap`, y `js/mp-tabs.js`
  resolvía teclado y ARIA (DEC-007) pero no cambiaba la presentación.

La consecuencia se detectó al comparar los prototipos con `v2.3.0`: con el tamaño de pestaña corregido en DEC-005/DS-11
(14 → 16 px), las dos pestañas de Historia clínica dejan de caber a 320 px, se parten en dos líneas y empujan el
contenido 48 px hacia abajo (2,9 % de diferencia en `zt/historia-clinica/index.html` y 4,4 % en `mis-solicitudes.html`).
No era un defecto del prototipo: era este hueco entre documentación y código.

## 2. Decisión

| Punto | Decisión |
|---|---|
| Punto de quiebre | **768 px** (`md`), el mismo de cards y sidebar. Se usa el mixin `md-down`, no un valor suelto |
| Control | `<select>` **nativo** con las clases del sistema (`mp-input-field mp-select`): abre el selector del sistema operativo en móvil y no agrega dependencias entre módulos |
| Marcado | **Sin cambios en las páginas.** El desplegable se construye a partir de las propias pestañas |
| Alcance | Tablists ARIA y también tiras de navegación (`<nav class="mp-tabs">` con enlaces `.mp-tab`), que son el caso de los prototipos |
| Exclusión | `data-mp-tabs-responsive="off"` para especímenes de documentación |

## 3. Implementación

- **`core/components/web/_tabs.scss`** — bloque `@include md-down`: oculta la tira marcada con `.mp-tabs--collapsed`,
  muestra `.mp-tabs__select` y, **sin JavaScript**, cambia `flex-wrap: wrap` por `nowrap` con desplazamiento horizontal,
  de modo que una página que no cargue el módulo tampoco se parte en dos líneas.
- **`js/mp-tabs.js`** — módulo responsive: crea el `<select>` junto a la tira, copia las etiquetas y el estado
  deshabilitado, conserva la selección (`aria-selected`, `aria-current="page"` o `.is-active`), y al elegir una opción
  **activa** la pestaña o **navega** si es un enlace. Al volver a ≥ 768 px retira el desplegable. Se mantiene en
  sincronía con `activate()` y con el `MutationObserver` ya existente.
- **Documentación** — la sección 6 declara el punto de quiebre, el comportamiento con y sin JavaScript y la exclusión, y
  trae un **ejemplo vivo** que se colapsa al reducir la ventana. Los especímenes de la página y los de `dark-mode.html`
  y el playground llevan `data-mp-tabs-responsive="off"` para seguir mostrando la tira a cualquier ancho.

## 4. Verificación

Chromium, con los prototipos reales y con un fixture del patrón ARIA. **24 comprobaciones, todas conformes.**

| Caso | Resultado |
|---|---|
| 320 px · se crea el desplegable, la tira se oculta y la página no desborda | ✓ |
| 320 px · refleja la pestaña activa y toma el nombre accesible del `aria-label` | ✓ |
| 320 px · elegir una opción navega (tira de enlaces) y marca la nueva activa | ✓ |
| 1440 px · tira normal, una sola fila, sin desplegable | ✓ |
| Redimensionar en vivo · aparece bajo 768 px y se retira sobre 768 px | ✓ |
| Sin JavaScript · una sola fila con desplazamiento (44 px de alto, antes 92) | ✓ |
| Patrón ARIA · copia opciones y deshabilitadas, cambia el panel sin navegar | ✓ |
| Patrón ARIA · `mpTabs.activate()` actualiza el desplegable | ✓ |
| Documentación · el ejemplo vivo se colapsa y cambia de panel; los especímenes no | ✓ |
| Documentación · volver al componente no duplica el desplegable; sin errores de JS | ✓ |

## 5. Pendiente conocido

Sin JavaScript, si el contenedor de la tira centra las pestañas con `justify-content: center` (lo hace
`zt/historia-clinica/css/custom.css`, fuera de este repositorio) y la tira desborda, los navegadores recortan unos
8 px del primer elemento y el desplazamiento no los recupera. No afecta a la ruta prevista —el desplegable—, solo a la
red de seguridad. Se corrige en la página con `justify-content: safe center`.

## 6. Verificaciones diferidas

Las mismas del informe 30: **Safari** y **VoiceOver** no se ejecutaron. En este componente importan especialmente el
selector nativo en iOS y el anuncio del `<select>` al reemplazar a la tira.
