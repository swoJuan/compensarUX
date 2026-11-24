# Divergencias y pendientes · Efecto Swap (MAUI)

Paquete v0.2.0. Estado: relectura de Figma de solo lectura el 2026-11-24 (`8655:24380`, `8908:24622`, `8923:25318`, nodos `8908:24762`, `8923:25690`, y los frames nuevos de vacío `8954:26680` y skeleton `8954:26839`). Una divergencia se marca «Resuelta» solo si el repositorio registra la aprobación; la fuente se indica en cada caso. Los hechos verificados se separan de las propuestas. HU-303 «Implementar paginación infinita» es referencia: sus criterios de aceptación no se cargaron ni se inventaron.

## Divergencias entre Figma, prototipo y este código

| # | Tema | Figma | Prototipo | Este paquete | Estado |
|---|---|---|---|---|---|
| 1 | Fondo de página | variable `use/surface/surface` (#F5F5F5) en los frames | `use-surface-theme-gray-5` (#F8F7F7) | `UseSurfaceSurface` (Figma) | Por confirmar con UX cuál es la correcta. Es una diferencia de un escalón de gris. |
| 2 | **Estado final** (`8908:24622`) — **RESUELTA** | Contradictorio: spinner + «Cargando más solicitudes…» + «No hay mas solicitudes para mostrar» (sin tilde), sin botón | Aprobado (DS): sin spinner, «No hay más solicitudes para mostrar», «Mostrando 18 de 18 solicitudes», botón oculto | Igual que el prototipo | **Resuelta** según `Core-Design-System/docs/app/components/carga-infinita.html` (commits `217701d`, `861c664`, `b4c8923`): «Se oculta el botón y se muestra el texto de fin, sin spinner. Decisión aprobada sobre el Figma 8908:24622.» Pendiente de higiene, no de diseño: `IA-Central/seguimiento/registro.json` (PI-SWAP-03) sigue en «propuesta»; alinearlo es tarea del orquestador. El aprobador concreto no consta en el repositorio. |
| 3 | Botón durante la carga | Visible (8657:139) | Visible e inactivo | `CanExecute=false`, mismo aspecto | **Resuelta** según `carga-infinita.html` («Durante la carga se ve inactivo y no actúa»). PI-SWAP-04 sigue «propuesta» en el registro; el ancho 189 px (divergencia 4) sigue abierto. |
| 4 | Ancho del botón terciario | ~189 px | Padding horizontal 8 (el DS trae 32) | `WidthRequest=189`, `Padding=8,0` | Confirmar si es override local o variante del DS (PI-SWAP-04) |
| 5 | Gesto «swipe hacia arriba al final» | Indicador y texto «Desliza hacia arriba para cargar más» | Detecta arrastre/rueda más allá del final | `RemainingItemsThreshold` dispara al llegar a la última tarjeta | **Diferencia de comportamiento.** MAUI no expone el arrastre sobre el final de la lista. Confirmar con UX y con Desarrollo; el texto del pie quizá deba cambiar. |
| 6 | Error: reintento por gesto | Solo alerta + botón | El swipe no reintenta | El umbral no reintenta | **Resuelta** según `carga-infinita.html` («Error: … El gesto queda deshabilitado; el usuario reintenta con el botón»). PI-SWAP-05 sigue «propuesta» en el registro. |
| 7 | Contador en error | Omitido | Omitido | Omitido | Por confirmar (PI-SWAP-05) |
| 8 | Spinner | Gris #D9D9D9, bajo contraste | `mp-loading` del DS | `ActivityIndicator` en `UsePrimaryDefault` | Divergencia deliberada |
| 9 | Chip Rechazado | Texto #BB4945 (~3,9:1 sobre #F7EEED) | #9E3328 (6,22:1) | `UseTextBadgeError` (#9E3328) | Aprobada (DEC-006) |
| 10 | Peso del número de radicado | SemiBold 600 | Se renderiza en 700 | `RobotoBold` | Roboto estático no trae 600. Confirmar si el proyecto incluirá el peso 600. |
| 11 | Título de alerta | Figma Bold 700; el DS web usa 600 | 700 | `RobotoBold` | Igual que Figma |
| 12 | Datos de ejemplo | 7 tarjetas, `{Motivo del rechazo}` | Registros 8–18 ficticios; motivos ficticios | Los mismos datos ficticios | **Pendiente de copy real** de «Motivo del rechazo» |
| 13 | Listas de 14 y 18 | No hay diseño; se repite el patrón | Igual | Igual | Sin diseño propio |

## Pendientes de producto o de diseño

- Criterios de aceptación de HU-303: no cargados. Ver `Flujos/portal/catalogo.json` para el enlace a la búsqueda en Azure DevOps.
- Destino de las notificaciones (campana): no definido en Figma ni en la HU. El prototipo incluye «¿Necesitas ayuda? Más información» con destino pendiente; los cuatro frames de Figma leídos no lo muestran en «Contenido», por eso esta referencia **no lo implementa**.
- ~~Carga inicial y lista vacía~~ **Resueltas en v0.2.0**: Figma diseña el skeleton de primera carga (`8954:26839`) y el vacío (`8954:26680`); el DS los marca «Estable» y «aprobados con Figma» (commits `861c664`, `b4c8923`); el prototipo los implementa (commit `c857a5d`) y el paquete los incluye en `CargaInfinitaView`.
- **Sigue pendiente:** error de la PRIMERA carga. Figma y el DS no lo diseñan. El ViewModel pasa a `Error` y el control reutiliza la alerta del pie con el botón de reintento (que repite la primera carga); es un supuesto técnico, no una decisión de UX.
- Skeleton: Figma muestra 3 tarjetas fijas (`CantidadSkeleton = 3`) y no define el pulso; el pulso (opacidad 1 → 0,45 en 1,4 s) viene del prototipo (`sw-pulse`) y no consta en Figma. Confirmar con UX que es el comportamiento nativo deseado.
- Texto y icono del vacío: «Aún no tienes solicitudes» / «Cuando radiques una solicitud de historia clínica la verás aquí.» salen de Figma `8954:26680`; el icono `ic_empty_solicitudes.svg` (96 px, `#FF6600` al 12 % de fondo) es un añadido de v0.2.0 y no está en el DS como icono de estado vacío: confirmar si el DS tendrá un asset propio.
- Contrato real del servicio (paginación, tamaño de tanda, total): no definido. `ISolicitudesService` es una propuesta mínima.
- Safe area y barra de estado: el cabezote naranja debe extenderse bajo la barra del sistema. No resuelto aquí; Agendamiento tampoco lo resuelve.
- Contraste del naranja `#FF6600` en texto (botón terciario, pestaña activa): 2,94:1 sobre blanco. DEC-001 protege el botón corporativo; riesgo documentado, no corregido (`WCAG-app-efecto-swap`).
- Modo oscuro y alto contraste: no verificados en el prototipo. MAUI solo distingue claro y oscuro.
- SVG exportados de Figma con colores fijos: `ic_info` (`#2D4A67`), `ic_x_circle` (`#D14434`, igual a `UseStateErrorIcon` claro pero el token oscuro es `#F5F5F5`), `ic_empty_solicitudes` (`#FF6600`), `ic_arrow_left` e `ic_bell` (blanco). No cambian con el modo oscuro; si se requiere, tintar con `TintColor` desde un token (`Behaviors`/`IconTintColorBehavior` del CommunityToolkit, no incluido ni verificado). Además traen `preserveAspectRatio="none"`: validar el render en dispositivo.
- `IPreferenciasMovimiento` por defecto no detecta «reducir movimiento»: falta la implementación por plataforma.
- Anuncios y foco con lectores de pantalla, skeleton y vacío incluidos: sin probar en dispositivo (ver `ACCESIBILIDAD.md`).

## Limitaciones de este paquete

- **No compilado.** El entorno donde se generó no tiene `dotnet`. Lo único verificado: los XAML son XML bien formado y cada `{StaticResource}` existe en `Compensar.Colors.xaml`, `Compensar.Sizes.xaml` o `EfectoSwap.Styles.xaml` (`tools/verificar-claves.mjs`). Pueden existir errores de compilación o de binding.
- Por verificar al compilar: `Footer="{Binding .}"` con `FooterTemplate`; el binding con `RelativeSource AncestorType` hacia el ViewModel dentro del `ItemTemplate` (si no resuelve, usar `x:Reference` a la página o un comando en el modelo de la tarjeta); `SemanticScreenReader.Default.Announce`.
- Sin pruebas unitarias del ViewModel.
- No incluye las fuentes Roboto (Regular, Medium, Bold). Los SVG y las copias de `Compensar.Colors.xaml` / `Compensar.Sizes.xaml` v2.4.0 sí van desde v0.2.0.
- Por verificar al compilar el control: `BindableLayout.ItemTemplate="{Binding SkeletonTemplate}"` (plantilla recibida como propiedad enlazable), `Footer="{Binding .}"` con `FooterTemplate` dentro de un `ContentView`, `RemainingItemsThresholdReached` y el pulso con `Animation.Commit` sobre un `VerticalStackLayout`.
