# 08 — Pendientes registrados para DEC-011 (Documentación y responsive)

> Registro de hallazgos que pertenecen al alcance de DEC-011 y que se detectaron durante la ejecución de otras decisiones. **No se corrigen aquí**; quedan anotados para la fase de implementación de DEC-011.

## P-011-01 · Imagen de documentación con enlace temporal de Figma expirado

- **Ubicación:** `docs/web/components/header.html:34`.
- **Detalle:** la imagen de referencia del header del portal público usa
  `src="https://www.figma.com/api/mcp/asset/6343037d-e72d-4f67-ac8f-c2719b03083a"`,
  una URL **temporal de asset MCP de Figma que ya expiró**. En el portal se muestra el
  `alt` ("Vista desktop del header del portal público Compensar") con el ícono de imagen rota.
- **Impacto:** cosmético/documental. No afecta componentes productivos ni tipografía.
- **Origen de la detección:** validación visual de DEC-005 en `drupal.html` (ver `07-Implementacion-DEC-005.md`, sección 2.8).
- **Ámbito:** DEC-011 (documentación y ejemplos). **Fuera de alcance de DEC-005 y DEC-012.**
- **Acción pendiente:** reemplazar por un asset local permanente (p. ej. captura en `docs/.../assets/` o `evidencias/`) o regenerar el export desde Figma. **No reemplazar todavía** (pendiente de instrucción para DEC-011).
- **Estado:** registrado · sin corregir.

## P-011-02 · Cadenas de código embebidas (visor y descarga) desactualizadas respecto de `core/`

- **Dónde:** 13 archivos `js/*-docs.js` embeben el CSS de su componente como texto, para el visor de código y para la descarga `.css`/`.scss`. Dos mecanismos:
  - ``const exportCss = `…` `` — accordion, app-bottom-sheet, avatar, badges, breadcrumb, loading, sidebar, stepper, web-header.
  - `function buildCssExport() { … }` — alert, modal, selection, toast.
- **Estado medido (DEC-012 P3, opción B):** **ninguno de los 13 contiene una sola unidad `rem`**; todos muestran `px`. Cantidad de valores `px` en su CSS embebido: web-header 87, app-bottom-sheet 55, selection 39, sidebar 35, badges 34, avatar 31, alert 13, modal 22, toast 22, loading 19, breadcrumb 14, accordion 12, stepper 10.
- **Ejemplos verificados contra `core/`:**
  - `web-header-docs.js:23/27/43` muestra `.mp-web-header__nav-item { position:relative }`, `.mp-web-header__dropdown { …left:0; width:min(720px,calc(100vw - 48px)) … }` y `@media (max-width:768px)`. `core/components/web/_header.scss` ahora usa `position: static`, un dropdown sin `left/width` (ancho según el espacio disponible) y `@media (max-width: 48em)`.
  - `sidebar-docs.js:9` muestra `--mp-sidebar-width: 480px`; `core` usa `30rem` (`#{rem(480px)}`).
- **Impacto:** quien copie o descargue el CSS desde la documentación obtiene valores que ya no coinciden con el componente publicado. Contradice la regla de `ia-context.md` ("las descargas deben estar unidas a la definición del core") y afecta a los componentes de DEC-012 P2 y P3.
- **Ámbito:** DEC-011 (documentación). **No se corrige en P3.** Decisión pendiente: regenerar estas cadenas a partir de `core/` (p. ej. en el build) en lugar de mantenerlas a mano, o actualizarlas manualmente.
- **Estado:** registrado · sin corregir.

## P-011-03 · La página del Header no contiene el componente

- **Dónde:** `docs/web/components/header.html` es la página "3.3 Navigation patterns" (captura + texto). No tiene `#web-header-playground-preview`, anatomía ni controles `data-web-header-control`.
- **Efecto:** `js/web-header-docs.js` se carga pero no encuentra dónde pintar; **ningún `.mp-web-header` se renderiza en la documentación**. Por eso el portal no permite validar visualmente el Header; en DEC-012 P3 hubo que usar un harness que ejecuta el `build()` real del JS.
- **Relacionado:** imagen rota de la misma página (P-011-01).
- **Ámbito:** DEC-011. **Sin corregir.**
