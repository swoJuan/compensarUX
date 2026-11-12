# 07 — Implementación DEC-005 (Tipografía): resultados y evidencias

**Decisión:** DEC-005 — Tipografía (tamaños, pesos y carga de Roboto)
**Hallazgos cubiertos:** DS-11 (tamaños/aliases), DS-13 (pesos), DS-14 (pesos no cargados)
**Fase:** Fase 1 de implementación · solo estilos propios · Bootstrap intacto
**Fecha:** Noviembre 2026
**Estado:** **IMPLEMENTADO Y VALIDADO** — aprobado técnicamente por el equipo y validado visualmente en el portal real (`drupal.html`) en los tres temas.

> No se hicieron commits ni despliegues. `letter-spacing` no se modificó (equivalencias Figma/CSS ya verificadas). No se tocó Bootstrap ni sus clases/variables.

---

## 1. Cambios aplicados

### 1.1 Pesos de tokens y mixins (alineados a Figma)

| Estilo | Antes | Ahora (Figma) | Archivos |
|---|---|---|---|
| Display L / M | 900 | **700** | `core/base/_theme.scss`, `core/abstracts/_mixins.scss` |
| H4 / H5 / H6 | 500 | **700** | `_theme.scss`, `_mixins.scss` |
| `comun/Boton` (token/mixin) | 500 | **700** | `_theme.scss`, `_mixins.scss` |
| `comun/Label` (token/mixin) | 700 | **400** | `_theme.scss`, `_mixins.scss` |
| Eyebrow | 500 | **400** | `_theme.scss`, `_mixins.scss` |

En Eyebrow y Label solo se cambió el **peso**; `text-transform: uppercase` y `letter-spacing` se conservaron.

### 1.2 Tamaños a Figma (sin tocar aliases globales `--font-size-*`)

Se reapuntaron los componentes al token tipográfico correcto `--body---l` (16px), en vez de `--font-size-md` (14) / `--font-size-sm` (12):

| Componente | Selector | Antes | Ahora |
|---|---|---|---|
| Alert | `.mp-alert__title` / `__body` | 14 / 12 | **16 / 16** |
| Toast | `.mp-toast__title` / `__body` | 14 / 12 | **16 / 16** |
| Tabs | `.mp-tab` | 14 | **16** |
| Pagination | `.mp-pagination__link` | 14 | **16** |

Archivos: `_alerts.scss`, `_toasts.scss`, `_tabs.scss`, `_pagination.scss`.

### 1.3 Carga de Roboto 600 (SemiBold)

Se añadió el peso `0,600` al `@import` de `core/base/_typography.scss` y al `<link>` de `drupal.html`, `app.html`, `index.html`. Usado por tabs (SemiBold 600) y títulos de alert/toast; antes el navegador lo sintetizaba.

### 1.4 Header — peso 800 → 700 (verificado contra Figma)

Se comprobó que **Figma no define ningún estilo tipográfico con peso 800/ExtraBold** (tableros `4705:5362` Navigation patterns, `4693:4706`, y revisión de estilos de tipografía: todos usan Bold 700 / Regular 400). Los 4 selectores propios del Header que usaban 800 se ajustaron a **700** (Bold), coherente con el resto del sistema:

- `.mp-web-header__logo`
- `.mp-web-header__brand-name`
- `.mp-web-header__cta`
- `.mp-web-header__dropdown-title`

Archivo: `core/components/web/_header.scss`. El Header web no tiene tablero Figma dedicado (DS-31): el ajuste se fundamenta en que no existe el peso 800 en el sistema tipográfico y en la jerarquía Bold = 700.

---

## 2. Pruebas COMPLETADAS

Verificación en **navegador real** (Chromium vía Playwright, con `document.fonts.ready` y `document.fonts.check`). Playwright se instaló solo para esta verificación y **se desinstaló** al terminar; `package.json` quedó con sus dependencias originales (bootstrap, sass).

### 2.1 Build / compilación
- `npm run build` sin errores. `css/core.css` regenerado refleja el SCSS.
- `font-weight:800` en `css/core.css`: **0 ocurrencias**.
- Bootstrap intacto: `node_modules/bootstrap` sin cambios en git; `--bs-*` sin alteraciones.

### 2.2 Valores computados por tema (Light / Dark / High Contrast)

Idénticos en los tres temas (solo cambia el color, por tema):

| Elemento | Tamaño | Peso | Figma | OK |
|---|---|---|---|---|
| H4 / H5 / H6 | 28 / 24 / 18px | 700 | 700 | ✅ |
| Display L | 56px | 700 | 700 | ✅ |
| Eyebrow | 18px | 400 | 400 | ✅ |
| Alert título / cuerpo | 16 / 16px | 600 / 400 | 16 | ✅ |
| Toast título / cuerpo | 16 / 16px | 600 / 400 | 16 | ✅ |
| **Tab normal** | 16px | **600** | 16 / 600 | ✅ |
| **Tab is-active** | 16px | **700** | — | ✅ (estado activo) |
| Pagination link | 16px | 700 | 16 / 700 | ✅ |

### 2.3 Tabs — cascada verificada (punto 2 de la revisión)
Medición separada en navegador real con fuente 600 cargada:
- `.mp-tab` **normal = 600** (correcto).
- `.mp-tab.is-active` **= 700** (correcto; lo fija `.mp-tab.is-active{font-weight:700}`).

Se descartó el "artefacto": el 700 previo provenía de medir con `--dump-dom` sin esperar la carga de la variante 600. Con la fuente cargada, la cascada es correcta: el estado activo sube a 700 a propósito, el normal es 600.

### 2.4 Carga real de Roboto (punto 4)
`document.fonts.check()` tras `fonts.ready`:
- `400 Roboto` → **loaded**
- `600 Roboto` → **loaded** ✅ (se descarga de verdad, no solo declarado)
- `700 Roboto` → **loaded**

(500 y 900 figuran "unloaded" porque el harness no renderiza texto en esos pesos; el navegador los descarga bajo demanda. No es un fallo.)

### 2.5 Validación visual (punto 3)
Capturas full-page en los tres temas: headings, alert, toast, tabs y pagination renderizan con los tamaños/pesos esperados y son legibles. Evidencias:
- `evidencias/dec005/theme-light.png`
- `evidencias/dec005/theme-dark.png`
- `evidencias/dec005/theme-high-contrast.png`

### 2.6 Zoom 200%
- Viewport normal (900px) + zoom 200%: **sin overflow horizontal**.
- 320px + zoom 200%: el harness de prueba desborda por sus contenedores de ancho fijo (`max-width`), **no por la tipografía**; los headings hacen wrap correctamente. Evidencia: `evidencias/dec005/zoom-200-320.png`.

---

### 2.7 Validación visual en el portal real (`drupal.html`)

Validación final navegando el portal real con el CSS compilado actualizado (Chromium vía Playwright; instalado solo para la prueba y **desinstalado** al terminar). Se recorrieron las secciones `tipografia`, `alertas`, `toast`, `tabs`, `paginacion` y `header` en Light, Dark y High Contrast (18 combinaciones), usando el switcher real de tema (`setTheme`).

| Verificación | Resultado |
|---|---|
| Desbordamiento horizontal del documento (`scrollWidth > clientWidth`) | **Ninguno** en las 18 combinaciones |
| Recortes de texto en H4/H5/H6, Display, Alert, Toast, Tabs, Pagination | **Ninguno** |
| Pesos/tamaños vs lo medido en harness | **Coinciden** (H4-H6 y Display Bold, Tab normal 600 / activo 700, Pagination 16/Bold, Alert/Toast 16) |
| Header (800→700) | Render nítido, sin diferencia negativa; "Design System", logo y títulos en Bold 700 |
| Alineación por tema | Correcta en Light, Dark y High Contrast |

Evidencias: `evidencias/dec005/portal/{seccion}-{tema}.png` (18 capturas) y `evidencias/dec005/portal/portal-report.json`.

Los elementos que el detector marcó como sobresalientes del contenedor por ~1px (`.row`, `CODE`, `.mp-breadcrumb`) son bloques de layout Bootstrap y visores de código con scroll propio, **preexistentes y ajenos a la tipografía**; no producen overflow del documento.

### 2.8 Hallazgo observado AJENO a DEC-005 (reportado, no corregido)

En `docs/web/components/header.html:34` la imagen de referencia del header apunta a una URL temporal de asset de Figma (`figma.com/api/mcp/asset/...`) que ya expiró, por lo que se muestra el alt-text con el ícono de imagen rota. **No es un problema tipográfico ni de DEC-005**; corresponde a documentación (ámbito DEC-011). Se reporta para su tratamiento en la decisión correspondiente; no se corrige aquí por estar fuera de alcance.

## 3. Pruebas PENDIENTES / fuera de alcance

- **Reflow real a 320px del portal** (sidebar, controles): corresponde a **DS-30 / DEC-011**, no a DEC-005. No evaluado aquí.
- **Lectores de pantalla (NVDA / VoiceOver):** la tipografía no altera semántica, pero no se ejecutó prueba con tecnología asistiva.
- **Validación visual componente por componente en el portal real** (no en harness): recomendable hacerla navegando `drupal.html` tras aprobación, para confirmar que ningún consumidor concreto desborda.

---

## 4. Archivos modificados (DEC-005)

```
core/base/_theme.scss
core/abstracts/_mixins.scss
core/base/_typography.scss
core/components/web/_alerts.scss
core/components/web/_toasts.scss
core/components/web/_tabs.scss
core/components/web/_pagination.scss
core/components/web/_header.scss
drupal.html
app.html
index.html
css/core.css            (compilado)
```

Evidencias en `docs/auditoria-design-system/evidencias/dec005/`.

---

## 5. Estado de los hallazgos

| Hallazgo | Estado tras DEC-005 |
|---|---|
| DS-13 (pesos) | **Implementado y validado** en tokens y mixins; verificado en harness y portal real, 3 temas |
| DS-14 (pesos no cargados) | **Implementado y validado**: Roboto 600 cargado (comprobado con `fonts.check`); Header 800→700 (sin respaldo Figma) |
| DS-11 (tamaños) | **Implementado y validado** en Alert, Toast, Tabs, Pagination sin tocar aliases globales |

Los tres quedan **Implementados y validados** (aprobación técnica + validación visual en el portal real en los tres temas).

### Pendiente menor registrado
- Imagen de referencia rota en `header.html` (asset Figma expirado) → **ajeno a DEC-005**, trasladar a DEC-011.
- Prueba con lectores de pantalla (la tipografía no altera semántica) → opcional, no bloqueante.
