# 29 — Cierre de v2.3.0: matriz final de decisiones y verificaciones

> 11 de noviembre de 2026 · `main` en `aa44ad6` (12 commits locales sobre `origin/main` `8b30750`). Sin push, tag ni despliegue.
> Versión `2.3.0` asignada en `package.json` y `package-lock.json` en el commit de release (local).

## 1. Verificaciones de este cierre

| Verificación | Resultado |
|---|---|
| **Safari 26.6.2** | **No ejecutada.** `safaridriver` responde que no está configurado y exige `--enable` con autenticación de administrador. `AllowRemoteAutomation` y `AllowJavaScriptFromAppleEvents` no están activados. Se descartó el AppleScript porque dispara un aviso de permisos. No se cambió ninguna configuración. |
| **VoiceOver** | **No ejecutada.** VoiceOver existe en el equipo, pero su salida hablada no puede capturarse desde este entorno sin permisos de accesibilidad ni activar VoiceOver. No se declara resultado. Procedimiento reproducible en §2. |
| **Modal (DS-28)** | **Conserva el comportamiento** (`evidencias/dec011/modal-check.js`, teclado real, Chromium): abre con Enter, `role=dialog` con `aria-modal` y `aria-labelledby`, foco inicial dentro, Tab y Shift+Tab ×12 sin salir, Escape cierra y el foco vuelve al disparador. 7/7. No se desarrolló módulo reutilizable. |
| **Bottom Sheet** | **Sin evidencia suficiente.** El diagnóstico existente solo contiene DS-06 (foco de la opción, `_bottom-sheet.scss:126-130`), DS-22 (33 literales hex) y DS-31 (sin tablero Figma). No hay auditoría funcional ni de accesibilidad. No se implementó nada. |

## 2. Procedimiento manual para Safari y VoiceOver

Requiere una persona con sesión gráfica.
1. Safari → Ajustes → Avanzado → «Mostrar funciones para desarrolladores». Para automatizar: `sudo safaridriver --enable`.
2. `python3 -m http.server 8000` en la raíz del repositorio y abrir `http://localhost:8000/drupal.html#<ruta>`.
3. Rutas y qué comprobar:
   - `accordion`: el panel cerrado no se lee ni se enfoca; el abierto muestra todo su contenido (en Safari rige el respaldo de 2000 px).
   - `tables`: Tab llega al contenedor, VoiceOver anuncia «Tabla de solicitudes (desplazable horizontalmente), grupo».
   - `stepper`: cada barra se anuncia como «Paso N de M, indicador de progreso».
   - Pestañas de código (cualquier página con visor): flechas izquierda y derecha cambian de pestaña y el código mostrado.
   - `dropdown` y `tabs` (DEC-007): abrir, navegar con flechas, Escape.
   - `modales`: abrir, Tab cíclico, Escape, retorno de foco.
4. VoiceOver: `Cmd+F5`; moverse con `Ctrl+Opt+Flechas`; Rotor `Ctrl+Opt+U` para listar encabezados, landmarks y controles. Registrar lo anunciado.
5. Anotar versión de macOS, de Safari y resultado por ruta en `evidencias/`.

## 3. Matriz final DEC-001 a DEC-012

| Decisión | Implementación | Verificaciones pendientes | Excepciones aprobadas |
|---|---|---|---|
| DEC-001 Botón primario | Solo documental | Advertencia de contraste en Figma y documentación | Se conserva el naranja de marca: 2,93:1 (botón) y 2,94:1 (CTA del Header) en Light |
| DEC-002 Bordes de inputs | Solo documental | Recomendación de contraste | Se conserva el borde actual |
| DEC-003 Inputs | Implementado (`v2.2.1` y reflow en `6ea295b`) | Revisión visual del equipo, provisionales en Figma, Safari | Borde punteado en alto contraste: pendiente de formalizar |
| DEC-004 Foco | Implementado (Checkbox, Radio, Switch, Dropdown, Tabs) | Checkbox indeterminado; Dropdown Dark (decisión UX); foco de la opción del Bottom Sheet (DS-06) | Contorno de la opción activa del Dropdown: provisional |
| DEC-005 Tipografía | Cerrado | Lectores de pantalla | — |
| DEC-006 Dark y Alto contraste | Implementado | Badges en Alto contraste frente a Figma | — |
| DEC-007 Dropdown y Tabs | Implementado (`mp-dropdown.js`, `mp-tabs.js`) | Ficha de teclado en Figma, VoiceOver, Safari | Chips del multi-select informativos; naranja de marca sobre lo seleccionado (≈2,7–2,9:1, DEC-001) |
| DEC-008 Tokens y dimensiones | Implementado | PI-02 (tamaño de `.mp-chip--lg`) | — |
| DEC-009 Estilos propios | Sin defecto bloqueante; `--bs-*` idéntico a `HEAD` | Migración gradual de DS-12 y DS-22 (deuda) | DS-10: solo diagnóstico, Bootstrap intacto |
| DEC-010 Estructurales | Tables, Stepper (nombre accesible) y Accordion implementados; Modal con comportamiento verificado | Bottom Sheet sin diagnóstico; módulo reutilizable de Modal sin decisión; Figma de interacciones; diferencia visual actual/completado del Stepper | Código `<code>` rosa de Bootstrap (3,23:1 en Dark): no se sobrescribe |
| DEC-011 Documentación y responsive | P-011-01, 02 y 03 cerrados; responsive 32/32 | H-05 (`<aside>` oculto en vista completa), H-06 (`aria-label` en inglés), DS-32 | — |
| DEC-012 Unidades `rem`/`em` | Implementado | V-01 (Safari; Firefox 121 hecho), V-02, V-03, D-01, D-03, F-01 (Header ZT en Figma) | Regla A del Header ZT provisional |

## 4. Diferencia `main` contra `origin/main` (no se modificó nada)

`origin/main` es de junio de 2026 y no se actualizó con `fetch`. 12 commits adelante, 0 atrás: se publicaría como avance directo. 1191 archivos, +85 642 / −291 557.

| Riesgo | Detalle | Recomendación |
|---|---|---|
| **`node_modules` deja de estar versionado** | `origin/main` rastrea 680 archivos de `node_modules`; el commit `a33a844` los elimina y `.gitignore` los excluye. Quien haga `pull` los pierde y debe correr `npm ci`. Cualquier despliegue que dependa de ellos fallará. | Confirmar que ningún pipeline o servidor los usa antes del push |
| **Versión** | `package.json` pasa de `2.1.0` a `2.3.0` y se crea el tag local `v2.3.0`; el remoto no tiene ningún tag | Publicar los tags `v2.2.0`, `v2.2.1` y `v2.3.0` junto con el push |
| **Cambios de comportamiento de producción** | `core/` (20 modificados), `css/*.css` compilados, módulos `mp-dropdown.js` y `mp-tabs.js` | Revisión visual del equipo antes de publicar |
| **Peso** | 402 archivos de evidencia añadidos, 15 MB (JSON de hasta 16 000 líneas) | Aceptable; valorar moverlos fuera del repositorio |
| **Eliminaciones** | Aparte de `node_modules` solo `.DS_Store` | Sin riesgo |
| **Caché** | Resuelto en el release: `?v=20261111-1` en `drupal.html` y `app.html` para los cinco recursos modificados | Ninguna |
| **Cambios ajenos sin commit** | `README.md`, `ia-context.md`, `IA_Context.md`, `navigation-workflow.md`, `icons-intro.html`, `16-Implementacion-DEC-007.md` y borrado de `js/router.js` (sin referencias en el repositorio) | Decidir su commit por separado |
