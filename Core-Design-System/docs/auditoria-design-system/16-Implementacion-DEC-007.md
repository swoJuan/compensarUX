# 16 — Implementación DEC-007: navegación accesible de Dropdown y Tabs

> 6 de noviembre de 2026 · base `v2.2.1` · Chromium, tamaño de texto real del navegador. Resuelve **DS-03** y **DS-04** en código; la parte de Figma de DEC-007 sigue pendiente. Evidencias: `evidencias/dec007/`. Sin push ni despliegues.

## 1. Dónde estaba el defecto

El repositorio **no tenía JS reutilizable** de Dropdown ni de Tabs: solo SCSS y, en los `*-docs.js`, comportamiento de la documentación que respondía únicamente al clic. Defectos medidos en `v2.2.1`:

| Defecto | Dónde | Efecto |
|---|---|---|
| Sin teclado en Dropdown (abrir, mover, elegir, cerrar) | docs | No operable sin ratón |
| Sin flechas en Tabs; en 50 listas de pestañas, ninguna o todas eran tabulables | docs + marcado | No operable / orden de foco roto |
| `role="combobox"` en un `<div>` que contiene un `<button>` y un listbox | fragmentos copiables | Enseña un patrón ARIA incorrecto |
| `aria-expanded` en el contenedor `<div>` (la visibilidad del panel dependía de él) | SCSS + docs | Atributo inválido en un `div` |
| `role="listbox"` sobre un panel con campo de búsqueda | fragmentos | `listbox` con hijos no permitidos |
| `aria-controls="pg-panel-N"` a paneles que no existían | playground de Tabs | Referencia rota |

## 2. Qué se hizo (componente reutilizable frente a documentación)

**Componente reutilizable (nuevo, sin dependencias, delegado en `document`):**
- `js/mp-dropdown.js`: patrón WAI-ARIA APG *Collapsible Dropdown Listbox* (botón que despliega un listbox; no se impone `combobox` al botón). Completa `aria-haspopup`, `aria-controls`, ids, `aria-selected` y el nombre accesible; gestiona foco con `aria-activedescendant`; selección única y múltiple; búsqueda con filtro; evento `mp-dropdown:change`.
- `js/mp-tabs.js`: patrón APG *Tabs* con **activación automática** (los paneles son contenido inmediato), tabindex móvil, `aria-selected`/`is-active`/paneles sincronizados, flechas/Inicio/Fin con vuelta circular, omite pestañas deshabilitadas, `aria-orientation="vertical"`. Funciona con `.mp-tab` y `.app-tab`.
- `core/components/web/_dropdown.scss`: el panel se muestra con `trigger[aria-expanded=true] ~ panel` (el selector antiguo sobre el contenedor se conserva por compatibilidad); `--active` (opción activa, mismo fondo que hover + contorno con el token de foco); `[hidden]` gana a `display:flex`; en Dark y High Contrast la opción activa replica el hover del tema.

**Documentación (solo la consume):** `dropdown-docs.js` pierde su lógica de clic y su marcado/fragmentos pasan al contrato correcto; `tabs-docs.js` delega en el módulo y corrige el `aria-controls` roto; `drupal.html` y `app.html` cargan los módulos. Los diagramas de anatomía llevan `data-mp-static` (no interactivos).

**Teclado** — Dropdown: Enter/Espacio/↓/↑ abren con la opción seleccionada (o la 1.ª) activa · ↑↓/Inicio/Fin mueven · Enter/Espacio seleccionan y devuelven el foco al botón (múltiple: alterna y sigue abierto) · Escape cierra y devuelve el foco · Tab cierra y sigue el orden natural · letras: salto por prefijo. Tabs: →/← (vertical ↓/↑), Inicio/Fin; Tab entra por la pestaña seleccionada.

## 3. Resultados

| Prueba | Línea base `v2.2.1` | Árbol nuevo |
|---|---|---|
| Dropdown reutilizable aislado (ARIA, teclado, múltiple, búsqueda, ratón, axe) × 3 temas × 100/200 % × 1280/320 px | — | **117/117** en las 4 combinaciones |
| Tabs reutilizable aislado (tabindex móvil, flechas, deshabilitada, vertical, paneles, axe) × 3 temas × 100/200 % × 1280/320 px | — | **63/63** en las 4 combinaciones |
| Portal real Web y App (playground, regenerar, múltiple, búsqueda, tarjetas de estado, tabs estáticos y playground, App) en Light / Dark / HC | falla toda la interacción por teclado (11 fallos) | **0 fallos** en los 3 temas |
| Portal real a 320 px y texto 200 % | teclado inoperante; con 200 % el panel se sale del viewport | teclado OK, panel dentro del viewport, 0 desborde |
| Barrido de 84 rutas (Web y App) | 50 listas de pestañas sin una única parada de Tab | **0**; sin errores JS ni desbordes nuevos |
| Sin cambios visuales en reposo (seis tarjetas de estado, playground, tabs; pixel a pixel) | — | **idéntico** en Light, Dark y HC |
| axe (sin contraste) en las páginas de Dropdown y Tabs | `aria-input-field-name`, `button-name`, `aria-valid-attr-value` + los de abajo | mejora: quedan solo los 3 preexistentes de la documentación (tablist de código con botón «Copiar», muestras `role="tab"` sin `tablist`, región de scroll del diagrama) |
| Reglas de CSS que cambian | — | 14, todas `.mp-dropdown*` o `.mp-input-helper` (DEC-003); **0 ajenas**; `letter-spacing` sin tocar |
| Build | — | sin errores ni advertencias, reproducible, 0 `rem(` sin resolver |

Dos aclaraciones de método: (1) una comparación inicial de tarjetas mostró píxeles distintos; se debía a que el contenido de arriba creció 41,6 px (más líneas en los fragmentos) y movió las tarjetas a un desplazamiento fraccionario; anclándolas a la misma posición son idénticas. (2) Las pruebas se hicieron con el tamaño de texto real del navegador, no con zoom CSS.

## 4. Decisiones del equipo y pendientes

**Decisiones aprobadas (6 nov 2026, tras la revisión técnica):**
1. Se **conservan** los módulos reutilizables `js/mp-dropdown.js` y `js/mp-tabs.js`.
2. Los **chips del multi-select son informativos**; la eliminación de una selección se hace **desde el Dropdown** (alternando la opción en el listbox). No se añade botón de quitar al trigger.
3. El contorno de la opción activa por teclado **sigue provisional** hasta implementar DEC-004.
4. Versión propuesta: **`v2.3.0`** (minor: dos archivos JS nuevos). No se ha creado tag ni se ha publicado.
5. Siguen registrados: lectores de pantalla, Firefox/Safari y la ficha de teclado en Figma.

**Pendientes reales:**
- **Naranja de marca sobre lo seleccionado** (≈2,7–2,9:1): DS-01/DEC-001, protegido y anterior a este cambio.
- **Figma:** ficha de interacción de teclado para Dropdown y Tabs (parte de DEC-007).
- **Verificación pendiente:** NVDA/JAWS/VoiceOver y Firefox/Safari (V-01 y V-02).
- **Encabezados de grupo y «Sin resultados»** dentro del listbox llevan `role="presentation"`; anunciar los grupos con `role="group"` es mejora futura.
- **Select personalizado (`.mp-select`)** es un `<select>` nativo: teclado del navegador, sin cambios.
- **Documentación pública:** los visores de CSS embebido conservan su deuda DEC-011 P-011-02.
