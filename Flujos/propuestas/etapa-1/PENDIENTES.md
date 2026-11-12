# Pendientes · normalización del sistema de diseño en los prototipos

## Estado al 6 nov 2026

- Sistema de diseño **v2.2.0** creado en local, sin push:
  - `879fadb` feat(inputs): estados de solo lectura y deshabilitado
  - `77696a7` chore(release): v2.2.0 · tag `v2.2.0`
- **No** se creó el tag `v2.1.0`: la versión 2.1.0 figura en `package.json` desde el commit inicial (27 abr 2026) y nunca se actualizó. `09dfa3a` es solo uno de los muchos commits posteriores que la conservaron, así que no representa esa versión.
- Prototipos y Portal UX sin cambios. No se ejecutó `ds:sincronizar`.

## Pendientes

1. **Regresión de pestañas en Historia clínica a 320 px** (detectada con `regresion.mjs`).
   Con el sistema de diseño ≥ 09dfa3a, `mp-tab` pasa de 14 a 16 px: las pestañas se ensanchan un 11 % y, a 320 px, empujan el contenido hacia abajo (diferencia del 2,9 % en `zt/historia-clinica/index.html` y del 4,4 % en `mis-solicitudes.html`).
   → Corregir durante la sincronización (por ejemplo, desplazamiento horizontal o ajuste de las pestañas en el flujo) y volver a correr la regresión a 320 px.
2. Sincronizar los prototipos con `v2.2.0` usando `ds-sync.mjs` (plan → regresión → aplicar → revisar → commit).
3. Revisar el menú desplegado de Drupal navegación (`mp-web-header__nav-item`: de `relative` a `static`) en escritorio y móvil.
4. Hacer commit de los componentes de ZT que no están en git (switch, benef-card, otp-input y file-upload) y de `app/` y `zt/historia-clinica/`.
5. Migraciones de componentes de ZT (alert → `mp-alert`; dropdown y stepper) en etapas posteriores.
6. Documentar en el sistema de diseño que `.is-readonly` debe usarse junto al atributo `readonly`.
7. Actualizar las etiquetas visibles "v2.1" (README y pie de `index.html`) cuando se confirmen los demás cambios pendientes del README.
8. Push a GitHub, pendiente de autorización.
