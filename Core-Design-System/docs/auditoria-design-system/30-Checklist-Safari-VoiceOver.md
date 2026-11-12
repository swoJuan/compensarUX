# 30 — Checklist manual: Safari y VoiceOver (v2.3.0)

> Complementa el informe 29, §2. Tiempo estimado: 20 minutos. Registrar el resultado en la tabla final.

## Preparación

1. En la raíz del repositorio: `python3 -m http.server 8000`.
2. Safari → `http://localhost:8000/drupal.html#<ruta>`. Probar Light, Dark y Alto contraste con los botones del encabezado.
3. VoiceOver: `Cmd+F5`. Navegar con `Ctrl+Opt+Flechas`; Rotor con `Ctrl+Opt+U`.

## Safari (visual y teclado)

- [ ] `accordion`: abrir y cerrar; el panel cerrado no recibe foco con Tab; el abierto muestra todo el texto. Reducir la ventana a ~375 px: sin recorte.
- [ ] `tables`: Tab llega al contenedor de la tabla y las flechas lo desplazan.
- [ ] `stepper`, `breadcrumb`, `cards`, `empty-state`, `inputs`, `loading`, `sidebar`: a 375 px no hay scroll horizontal ni contenido cortado.
- [ ] Pestañas HTML / CSS / Sass de cualquier componente: clic y flechas izquierda y derecha cambian el código mostrado.
- [ ] `dropdown`, `tabs`, `modales`: abrir con teclado, Escape cierra y el foco vuelve al disparador.
- [ ] `header`: el CTA se lee en Dark y Alto contraste; íconos Info de `alertas` y `toast` visibles.

## VoiceOver

- [ ] `tables`: anuncia «Tabla de solicitudes (desplazable horizontalmente)», grupo.
- [ ] `stepper`: cada barra se anuncia como «Paso N de M», indicador de progreso.
- [ ] Pestañas de código: anuncia «pestaña, 1 de 3, seleccionada» y cambia con las flechas.
- [ ] `accordion`: el título anuncia expandido o contraído; el panel cerrado no se lee.
- [ ] `modales`: anuncia diálogo y su título; Tab no sale; Escape devuelve al botón.
- [ ] `dropdown`: anuncia lista de opciones y la opción seleccionada.

## Resultado

| Dato | Valor |
|---|---|
| macOS / Safari | |
| Fecha y persona | |
| Safari: ítems que fallan | |
| VoiceOver: ítems que fallan | |

Si algo falla, anotar ruta, tema, ancho y qué se esperaba frente a qué ocurrió.
