# Accesibilidad · Efecto Swap (MAUI)

Código de referencia UX, no productivo. Nada de esto se probó en un dispositivo ni con TalkBack o VoiceOver: es el criterio a implementar y verificar. No se declara conformidad WCAG.

## Lo que ya trae el código de referencia

| Tema | Implementación | Archivo |
|---|---|---|
| Encabezado | `SemanticProperties.HeadingLevel="Level1"` en «Solicita tu historia clínica» | `Views/MisSolicitudesPage.xaml` |
| Botones de icono | `SemanticProperties.Description` («Volver al inicio», «Notificaciones») y zona táctil 44×44 (`SwapZonaTactil`) | página y `EfectoSwap.Styles.xaml` |
| Estado no solo por color | Cada chip lleva texto («Radicado», «Gestionado», «Rechazado») y `SemanticProperties.Description` = «Estado: …» | `Models/Solicitud.cs` (`EstadoDescripcion`) |
| Botón «Descargar historia clínica» | `SemanticProperties.Hint` = «Solicitud <radicado>» para distinguirlos entre tarjetas | `Solicitud.DescargaAyuda` |
| Anuncio de carga | `IAnuncios.Anunciar` → `SemanticScreenReader.Default.Announce` al iniciar la carga, al terminar (con «Mostrando N de 18») y al fallar. Primera carga: «Cargando solicitudes…» al abrir y «Se cargaron 7 solicitudes. Mostrando 7 de 18 solicitudes.» al terminar | `ViewModels/MisSolicitudesViewModel.cs` |
| Textos de los anuncios | Idénticos a los de `#sw-live` del prototipo (incluye «Cargando solicitudes…» y «Aún no tienes solicitudes.», commit `c857a5d`) | ViewModel |
| Skeleton | Oculto a los lectores (`AutomationProperties.IsInAccessibleTree="False"`, `InputTransparent`): el prototipo usa `aria-hidden` + `aria-busy`. MAUI no tiene `aria-busy`; el anuncio «Cargando solicitudes…» cubre ese papel | `Controls/CargaInfinitaView.xaml` |
| Vacío | Título con `HeadingLevel="Level2"` y descripción como texto normal; el icono decorativo está oculto a los lectores. Se anuncia «Aún no tienes solicitudes.» al llegar al estado | control y ViewModel |
| Alternativa al gesto | El botón «Cargar más solicitudes» hace lo mismo que el umbral de scroll y es el reintento tras error | página, `CargarMasCommand` |
| Botón inactivo | Mientras carga, `CanExecute=false` deja el botón no disponible para el lector; se ve igual que en reposo (Figma 8657:139) | `SwapBotonTerciario` (estado `Disabled`) |
| Pestaña activa | `SemanticProperties.Description` = «Mis solicitudes, pestaña seleccionada» (MAUI no tiene estado «seleccionado» nativo) | página |
| Alerta de error | Título y cuerpo como `Label` independientes; el anuncio sale por `IAnuncios`, no por una región en vivo | página |

## Tamaño táctil

- Botones: alto 48 (`SwapAltoBoton`). El terciario mide ~189×48.
- Iconos de la barra: glifo 32, zona 44×44 (`SwapZonaTactil`). Es el mínimo que se pide para el prototipo (44 px).
- Pestañas: alto 48.

## Movimiento reducido

El prototipo anula con `prefers-reduced-motion` la animación de entrada de tarjetas (280 ms), el balanceo del indicador de swipe y, desde `c857a5d`, el pulso del skeleton (`sw-pulse`, opacidad 1 → 0,45, 1,4 s). En esta referencia:

- **Pulso del skeleton (shimmer):** lo anima `CargaInfinitaView` (`Animation` sobre la opacidad del contenedor, en bucle) solo en `PrimeraCarga`. Con `ReducirMovimiento = true` no se anima y las barras quedan fijas. El ViewModel lo toma de `IPreferenciasMovimiento`; la implementación por defecto devuelve `false` (no detecta nada): **debe implementarse por plataforma** (ver abajo) o el pulso se verá aunque la persona haya pedido menos movimiento.
- La animación se detiene al salir de `PrimeraCarga` y al descargarse el control.
- No hay animación de entrada de tarjetas ni balanceo del indicador de swipe.
- El `ActivityIndicator` del pie se mantiene: es retroalimentación funcional.

MAUI no ofrece una propiedad multiplataforma para leer la preferencia. Para implementar `IPreferenciasMovimiento` (y para cualquier animación futura), consultar la plataforma:

- iOS: `UIKit.UIAccessibility.IsReduceMotionEnabled`.
- Android: `Settings.Global.GetFloat(ContentResolver, Settings.Global.AnimatorDurationScale, 1f) == 0f` (el usuario desactivó las animaciones).

Exponerlo detrás de una interfaz inyectable y, con la preferencia activa, mostrar las tarjetas sin animar.

## Por verificar en dispositivo (no asumir)

1. Agrupación de la tarjeta: el prototipo anuncia cada tarjeta como «Solicitud 123456789, Radicado». Aquí no se puso `SemanticProperties.Description` en el `Border` de la tarjeta, porque en iOS un contenedor con descripción puede ocultar a sus hijos (incluido el botón de descarga). Probar con VoiceOver y TalkBack si conviene agrupar.
2. Foco tras cargar: el prototipo mueve el foco a la primera tarjeta nueva cuando se cargó con el botón. No hay API verificada en este paquete para hacerlo en MAUI; el anuncio cubre la información. Evaluar `ScrollTo` y el orden de foco en dispositivo.
3. Disparo por umbral: con TalkBack/VoiceOver, llegar al final de la lista dispara la carga sin que la persona la pida. Confirmar que el anuncio «Cargando más solicitudes…» es suficiente o que debe usarse solo el botón con esos lectores.
4. Escala de fuente grande del sistema: columnas 128/* de la tarjeta, etiqueta «N.º DE RADICADO» y chip. No medido.
5. Pulso del skeleton y movimiento reducido: probar en iOS con «Reducir movimiento» y en Android con la escala de animación en 0 (`AnimatorDurationScale`). No verificado.
6. Tarjeta de vacío y skeleton con TalkBack/VoiceOver: confirmar que el skeleton queda realmente fuera del árbol de accesibilidad y que el anuncio llega.
7. Modo oscuro: se usan las claves `_Dark` del sistema; el prototipo tampoco lo verificó. El cabezote usa texto blanco sobre `UsePrimaryDefault_Dark` (#FF9D5C), que tiene poco contraste.

## Contraste (valores medidos en el registro del flujo, `WCAG-app-efecto-swap`)

| Elemento | Contraste | Resultado |
|---|---|---|
| Chip Radicado | 17,04:1 | cumple AA |
| Chip Gestionado | 11,05:1 | cumple AA |
| Chip Rechazado (`UseTextBadgeError` #9E3328) | 6,22:1 | cumple AA |
| Pestaña activa en naranja `#FF6600` sobre blanco | 2,94:1 | **no cumple AA** (texto normal exige 4,5:1) |
| Naranja `#FF6600` sobre el gris de página (el botón terciario va sobre este fondo; valor medido para «Más información» y la pestaña, aplicable por igualdad de colores, sin medición propia del botón) | 2,69:1 | **no cumple AA** |

El naranja de botones corporativos está protegido por DEC-001: no se modifica ni se declara conforme. La decisión sobre pestaña activa y enlaces en naranja sigue abierta (`WCAG-app-efecto-swap`).
