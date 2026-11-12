# 28 — Estabilización de v2.3.0: revisión de DEC-009 y DEC-010

> 11 de noviembre de 2026 · base `9d9adbd` (F-1/F-2 y automatización del build). Sin commit de este lote, sin tag, push ni despliegue.
> Solo defectos reproducibles con evidencia previa. No se repitieron auditorías generales.

## 1. Revisión de las decisiones

### DEC-009 (estilos propios y legacy)

| Hallazgo | Resultado | Acción |
|---|---|---|
| DS-09 | Cerrado antes (`879fadb`). Hoy `docs:check` y el build están sincronizados. | Ninguna |
| DS-12 (API legacy `.btn*`, `.input`…) | Documentado en el informe 02; no hay defecto reproducible nuevo. Renombrar o eliminar clases exige aprobación específica. | Ninguna, pendiente de migración gradual |
| DS-22 (312 literales hex) | Deuda de mantenibilidad, no bloquea funcionamiento ni accesibilidad esencial. | Ninguna, queda para la Etapa 2 |
| DS-10 | Solo diagnóstico. Bootstrap no se toca. | Ninguna |

Verificación de protegidos: las declaraciones `--bs-*` de `css/core.css` son idénticas a `HEAD` (mismo hash) y `core/vendors`, `_header.scss`, `_inputs.scss`, `_buttons.scss` y `_selection-controls.scss` no cambian.

### DEC-010 (Tables, Stepper, Modal, Accordion, Bottom Sheet)

| Hallazgo | Defecto reproducido | Corrección |
|---|---|---|
| DS-25 Tables | axe `scrollable-region-focusable`: el contenedor con scroll no recibía foco. | `role="group"`, `tabindex="0"` y `aria-label` en el contenedor (`js/tables-docs.js`, fragmentos de `tables.html`) y nota en la guía. Se usó `group` y no `region` porque `region` generó un `landmark-unique` nuevo al repetirse la etiqueta. |
| DS-26 Stepper | axe `aria-progressbar-name`: 3 barras en Stepper y 9 en Form patterns sin nombre. | `aria-label="Paso N de M"` en las 12. **No se cambió** la diferencia visual entre paso actual y completado (pendiente de Figma). |
| DS-38 Accordion | El panel abierto se recortaba a 2000 px; el panel cerrado seguía en el orden de foco. | `core/components/web/_accordion.scss`: panel cerrado con `visibility:hidden` (la transición lo oculta al terminar) y, donde existe `interpolate-size`, `max-height:max-content` en el abierto. El respaldo de 2000 px se mantiene. El visor recalcula alturas al cambiar el ancho. Sin cambio visual. |
| DS-28 Modal | El JS de la documentación ya gestiona foco, Escape y retorno. Falta un módulo reutilizable en `core/`. | Es una funcionalidad nueva, no un defecto: **no implementada**, queda para decisión. Solo se corrigió `aria-prohibited-attr` del diagrama de contexto (`role="img"`). |
| Bottom Sheet | Sin diagnóstico complementario. | No se tocó. |

## 2. Pestañas de código (`aria-allowed-attr`)

39 botones `.code-tab` en 13 páginas tenían `aria-selected` dentro de un `role="tablist"` sin `role="tab"`. Se añadió `role="tab"`. Efecto secundario verificado: `js/mp-tabs.js` (DEC-007) ahora también gestiona estas pestañas, de modo que además funcionan con las flechas y con tabulación móvil. La flecha llama al clic existente, así que la clase `active` del visor sigue sincronizada (comprobado).

Residuo: en Avatar el botón «Copiar» está dentro del `tablist`. axe no lo marca y mover el botón cambia el diseño del visor, por lo que se deja.

## 3. Responsive residual (8 páginas más Form patterns)

Medición con fuentes cargadas: 14 de 32 combinaciones (8 páginas × 1280/768/375/320) sin desborde. Ahora 32 de 32.

| Causa | Páginas | Corrección (solo documentación, `portal/`) |
|---|---|---|
| `display:flex` en `.component-list li` convierte cada tramo de texto entre `<code>`/`<kbd>` en un ítem; la suma de anchos mínimos desbordaba | Accordion, Inputs, Loading, Sidebar, Stepper | Hasta 40 em el ítem fluye en línea con el icono fijo; `code`/`kbd` en línea parten palabra |
| Pista de rejilla `1fr`/implícita sin `minmax(0,1fr)` | Cards, Empty state, Breadcrumb | `minmax(0,1fr)`, `min-width:0` y, en Cards, `@container` que apila la card horizontal como ya hace core |
| Badge «Don't» con ruta larga sin salto de línea | Breadcrumb | `white-space:normal` solo en la documentación |
| Filas de botones de descarga sin `flex-wrap` | Sidebar, Stepper, Form patterns | `flex-wrap:wrap` |
| Ítems de QA con texto suelto en `label` flex | Inputs | Texto envuelto en `<span>`; rejilla de 2/1 columnas |
| Hallazgo nuevo fuera de las 8: Form patterns (214 px a 375) | Form patterns | `flex-wrap` en dos barras de acciones, rejilla de dos campos adaptable (mismos anchos a 1280, verificado) e input `date` con `min-width:0` |

## 4. Pruebas

| Prueba | Resultado |
|---|---|
| `npm run build` (único por lote) y `npm run docs:check` | Sin errores; sincronizado (17 componentes) |
| Desborde, 8 páginas × 4 anchos (`responsive-8.js`) | **32/32** (antes 14/32) |
| axe HEAD vs actual, 14 rutas × Light 1280 / Dark 375 | 45 mejoras (`aria-allowed-attr`, `aria-required-children`, `aria-progressbar-name`, `scrollable-region-focusable`, `aria-prohibited-attr`); ninguna regla nueva |
| Chromium funcional (`functional-v230.js`), 13 rutas × 3 anchos | **168/168** |
| Firefox 121 (`firefox-v230.js`, Marionette, anchos con iframe) | **168/168** |

**Observación honesta de axe:** `color-contrast` sube en 1–3 nodos en Dark 375 de Tables, Stepper, Form patterns, Sidebar, Loading y, en Light, Inputs. Son el mismo defecto ya existente de `<code>` en rosa de Bootstrap (`#d63384`, 3,23:1 en Dark). Al pasar a flujo en línea axe ahora los evalúa. No se corrigió porque sería sobrescribir un estilo de Bootstrap.

## 5. Navegadores

- **Chromium (Chrome for Testing 1254):** completo.
- **Firefox 121.0** (instalado en el equipo, sin descargas): las mismas comprobaciones. Es una versión antigua; no soporta `interpolate-size`, así que ahí el Accordion mantiene el respaldo de 2000 px (comprobado, no es regresión).
- **Safari 26.6:** no ejecutado. `safaridriver` exige `safaridriver --enable` con autenticación de administrador.
- **Lectores de pantalla:** no ejecutados.

## 6. Pendientes

- Safari y lectores de pantalla (V-01, V-02).
- Contraste Light del CTA y del botón primario (DEC-001, protegido) y `<code>` rosa de Bootstrap.
- DS-28: módulo reutilizable de Modal (decisión).
- Bottom Sheet: diagnóstico complementario.
- Diferencia visual actual/completado del Stepper (Figma).
- Parámetros `?v=` de los shells: no se actualizaron; tras publicar conviene subirlos para invalidar caché.
