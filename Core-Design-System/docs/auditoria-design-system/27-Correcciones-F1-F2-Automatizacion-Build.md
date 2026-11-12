# 27 — Correcciones F-1 y F-2 y automatización del build

> 10 de noviembre de 2026 · base `600ba23` (DEC-011). Chromium (Chrome for Testing 1254). Sin commit de este lote, sin tag, push ni despliegue.
> Cierra los hallazgos F-1 y F-2 del informe 26 y deja de depender de que alguien ejecute el generador a mano.

## 1. F-1 · `.icon-info` frente a `--mp-alert-icon` y `--mp-toast-icon`

**Causa.** El sistema de iconos define `.icon-info { color: var(--color-info-icon) !important }`, y el glifo "info" se llama `icon-info`. De todos los glifos que usan Alert y Toast, solo ese coincide con una clase de color semántica (`icon-success`, `icon-error` y el resto de colores no tienen glifo homónimo). El resultado era un icono Info azul sobre azul en Dark (`#296FF0` sobre `#18428F`, 2,09:1) y Alto contraste (3,00:1), y `#5286BC` en Light.

**Prueba de cascada previa (antes de elegir el arreglo).** Sobre tres estructuras de marcado, tres temas y los cuatro tipos:

| Candidato | Resultado |
|---|---|
| `.mp-alert__icon .icon { color: currentColor !important }` | Corrige Info solo si el icono va anidado. **No cubre** el marcado de la documentación y de los snippets, donde la clase está en el propio `<i class="icon icon-info mp-alert__icon">`. |
| Lo anterior más el propio elemento | **Rompe Warning y Error**: en el mismo elemento `currentColor` toma el color heredado del padre, no `--mp-alert-icon`. Warning pasaba de `#967229` a `#111`, Error de `#D14434` a `#521A14`. |
| `.mp-alert__icon.icon, .mp-alert__icon .icon { color: var(--mp-alert-icon) !important }` | Correcto en las tres estructuras, los cuatro tipos y los tres temas. |

Como indicaste que `currentColor` solo se aplicara si la cascada confirmaba el token correcto, y no lo confirmó, se usó `var(--mp-*-icon)`.

**Cambio.** `core/components/web/_alerts.scss` y `_toasts.scss`: una regla cada uno. Se retiró la regla temporal de `portal/pages/_alerts.scss` y `_toasts.scss`.

## 2. F-2 · CTA del Header

**Causa.** `.mp-web-header__cta` tenía `color: var(--use-text-on-dark-primary)` (blanco fijo) sobre `--use-primary-default`, que en Dark es `#FF9D5C` (2,05:1) y en Alto contraste `#FFFF00` (1,07:1).

**Cambio.** `core/components/web/_header.scss`: el color pasa a una variable local `--mp-web-header-cta-text`, que vale lo mismo que antes en Light (`--use-text-on-dark-primary`) y `--use-text-inverse` en Dark y Alto contraste, igual que ya hacen los `.mp-btn`. **Se aplica solo en Dark y Alto contraste** a propósito: `use/text/inverse` en Light vale `#F5F5F5` y no blanco, así que usarlo en todos los temas habría cambiado el CTA corporativo.

| Tema | Estado | Antes | Ahora |
|---|---|---|---|
| Light | normal | 2,94:1 | **2,94:1, sin cambios** (excepción DEC-001, documentada) |
| Dark | normal / hover / foco | 2,05:1 | **9,20 / 5,30 / 5,30:1** |
| Alto contraste | normal / hover / foco | 1,07:1 | **19,56 / 15,68 / 15,68:1** |

El fondo, el borde, los estados hover y foco y la ausencia de gradiente no cambian.

**Fuera del alcance aprobado, registrado:** `.mp-web-header__logo` (la "C" decorativa, `aria-hidden`) tiene el mismo patrón de texto blanco sobre el acento. No se tocó.

## 3. Automatización en `package.json`

Cambio mínimo, dos líneas en `scripts`:

```diff
-    "build":      "npm run sass:build",
+    "build":      "npm run sass:build && node scripts/generate-docs-css.mjs",
     "docs:build": "node scripts/generate-color-docs.mjs && node scripts/generate-typography-docs.mjs",
+    "docs:check": "node scripts/generate-docs-css.mjs --check",
```

- `npm run build` hace lo de antes y después regenera `js/docs-css.generated.js`. Si el Sass falla, el generador no corre.
- `npm run docs:check` verifica sin escribir: sale con 1 si el archivo está desfasado respecto a `core/`, si un `*-docs.js` volvió a embeber CSS, o si un shell carga el generado después de un `*-docs.js`. Pensado para CI y para antes del release.
- No cambian `sass:build`, `sass:watch`, `sass:dev`, `docs:build`, `dev`, `devDependencies`, `engines`, versión ni `package-lock.json`.
- Efecto observado: tras tocar `_alerts`, `_toasts` y `_header`, un solo `npm run build` actualizó exactamente esos tres componentes en el archivo generado (3 líneas). Antes de la automatización ese paso se habría olvidado.

## 4. Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `npm run build` | Sin errores; idempotente («ya estaba sincronizado») |
| `npm run docs:check` | Sincronizado (17 componentes) |
| `sync-theme-modes --check` | Sin cambios pendientes |
| F-1 + F-2 (`f1f2.js`) | **168/168**: 72 combinaciones de icono (2 componentes × 3 estructuras × 3 temas × 4 tipos) con el color correcto y ≥ 3:1; CTA en 3 temas × 3 estados |
| Alert y Toast en el portal real, sin la regla temporal (`dec011-pages.js`) | **136/136** |
| Visores y descargas (`exports-check.js`) | **149/149** en 17 páginas |
| Descargable frente a `core.css` | 61 975 valores comparados, 209 distintos, igual que antes (entorno y Bootstrap) |
| DEC-006 / DEC-004 / DEC-008 | **314/314**, **105/105**, **1083/1083** |
| DEC-007 Dropdown / Tabs | **117/117** y **63/63** (100 % y 200 %) |
| Reglas de `core.css` que cambian frente a DEC-011 | **5**: 2 nuevas de F-1, 1 nueva y 2 modificadas de F-2 |
| Protegidos | 948 declaraciones `--bs-*` idénticas; hash del gradiente de DEC-001 idéntico; hash de las reglas `.mp-input-field` (DEC-002) idéntico; `core/vendors`, `package-lock.json`, `_inputs.scss`, `_buttons.scss`, `_selection-controls.scss` sin cambios |

## 5. Pendientes

- `.mp-web-header__logo`: mismo patrón de texto blanco sobre el acento (decorativo).
- Responsive residual de Accordion, Breadcrumb, Cards (1280), Empty state, Inputs, Loading, Sidebar y Stepper (informe 26).
- `aria-allowed-attr` en las pestañas de código (patrón compartido).
- Contraste Light del CTA y del botón primario (2,93:1): DEC-001, protegido.
- No ejecutado: Firefox, Safari y lectores de pantalla.
