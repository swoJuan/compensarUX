# Mapeo prototipo web → .NET MAUI · Efecto Swap (Mis solicitudes)

Código de referencia UX, no productivo. No compilado. Paquete v0.2.0 (actualiza la v0.1.0). Prototipo: `Flujos/prototipos/app/efecto-swap/` (último commit relevante: `c857a5d` skeleton y vacío; ver `manifest.json`). Figma: APP-Medicina-Prepagada, sección Swap `8658:24679`.

## 0. Arquitectura (v0.2.0): pantalla + control reutilizable

| Pieza | Responsabilidad |
|---|---|
| `Controls/CargaInfinitaView` | Control genérico (sin «solicitudes»): skeleton de primera carga, vacío, lista, pie (reposo, cargando, error, fin), umbral de scroll y pulso del skeleton. Se maneja solo con `Estado` (`EstadoCargaInfinita`). |
| `Views/MisSolicitudesPage` | Cabezote, pestañas y una instancia del control; aporta `ItemTemplate` (tarjeta), `SkeletonTemplate`, `CabeceraTemplate` (aviso 30 días) y los textos. |
| `ViewModels/MisSolicitudesViewModel` | Expone `Estado` con los seis valores, `Solicitudes`, `TextoContador`, `CargarMasCommand`, `ReducirMovimiento`. El control no carga datos: el ViewModel cambia el estado. |
| `Resources/Styles/CargaInfinita.Styles.xaml` | Estilos del control (pie, vacío, skeleton). Los de la tarjeta y el cabezote siguen en `EfectoSwap.Styles.xaml`. |

Propiedades del control: `Estado`, `ItemsSource`, `ItemTemplate`, `SkeletonTemplate`, `CantidadSkeleton` (3), `CabeceraTemplate`, `CargarMasCommand`, `ReducirMovimiento`, `EspacioItems` (20), textos (`TextoReposo`, `TextoCargando`, `TextoFin`, `TextoContador`, `TextoBoton`, `ErrorTitulo`, `ErrorMensaje`, `VacioTitulo`, `VacioDescripcion`, `DescripcionLista`) e imagen `VacioIcono`.

## 1. Componentes

| Prototipo (HTML/CSS/JS) | Figma | MAUI (este paquete) |
|---|---|---|
| `.app-bar` (alto 64, fondo `--app-orange`) | `8655:24382` cabezote | `Grid` fila 0, `Style=SwapBarraSuperior`, `HeightRequest=64` |
| `.app-iconbtn` 44×44, icono 24 | `ArrowLeft` / `Bell` 32 | `ImageButton` `SwapBotonIconoBarra` (44×44) |
| `.app-tabs` + `.sw-tab` (enlaces) | `8655:24387` topBar, 48 | `Grid` fila 1: `Button` `SwapPestana`/`SwapPestanaActiva` + `Border` indicador de 3 px |
| `.mp-alert--info.sw-info` | `8655:24391` Aviso 30 días | `Border` `SwapAlertaInfo` en `CollectionView.Header` |
| `.sw-list` (`ul`, gap 20) | Contenido | `CollectionView` + `LinearItemsLayout ItemSpacing=20` |
| `.sw-req` (tarjeta) | `Solicitud - …` 350 px, padding 16, radio 16 | `Border` `SwapTarjeta` en `ItemTemplate` (`x:DataType=Solicitud`) |
| `.mp-badge--warning/--green-1/--error` | `Estado` 83/96/94 × 29 | Tres `Border` `SwapChip*` con `IsVisible` por estado |
| `.sw-req__row` (dt 128 + dd) | `Detalle` | `Grid ColumnDefinitions="128,*"`, `ColumnSpacing=12`, filas con `Spacing=10` |
| `.mp-btn--secundario` «Descargar historia clínica» | `mp-button` 318×48 | `Button` `SwapBotonSecundario` (solo Gestionado) |
| `.sw-req__reason` | `Motivo` 318×41 | `Border` `SwapMotivo` (solo Rechazado) |
| `.sw-foot` (pie) | `Cargar más / …` | `FooterTemplate` del `CollectionView` interno del control (un solo estado visible) |
| `.mp-btn--terciario.sw-more` | `mp-button` ~189×48 | `Button` `CargaInfinitaBotonTerciario` (`WidthRequest=189`, `Padding=8,0`) |
| `.mp-alert--error.sw-error` (título + cuerpo, sin botón) | `8923:25690` mp alert | `Border` `CargaInfinitaAlertaError` en el pie del control |
| `.mp-loading` | Spinner-Dots 32 | `ActivityIndicator` `CargaInfinitaCargando` (dentro del control) |
| `.sw-skel` (3 tarjetas, solo primera carga) | `8954:26839` Skeleton, tarjetas `8954:26990` 350×163 | `SkeletonTemplate` de la página (barras `Border` `CargaInfinitaEsqueletoBarra`, color `UseBorderSubtle`, radio 6; chip radio 16) repetida `CantidadSkeleton` veces por el control; pulso de opacidad 1 → 0,45 cada 1,4 s |
| `.sw-empty` (`mp-empty-state`) | `8954:26680`, `Empty state` `8954:26831` 350×261 | `Border` `CargaInfinitaVacio` dentro del control: icono 96 (`ic_empty_solicitudes`), título Bold 18, descripción 14 tertiary |

## 2. Tokens (prototipo → clave en `Compensar.Colors.xaml` / `Compensar.Sizes.xaml`)

Modo oscuro: misma clave + `_Dark`, vía `{AppThemeBinding Light=…, Dark=…}`. MAUI no tiene alto contraste. Las claves se verifican contra el paquete real con `tools/verificar-claves.mjs`.

| Uso | Variable CSS del prototipo | Clave XAML |
|---|---|---|
| Primario, pestaña activa, botones | `--use-primary-default` | `UsePrimaryDefault` |
| Hover/pressed del botón | `--use-primary-hover` | `UsePrimaryHover` |
| Superficie de tarjeta, pestañas | `--use-surface-white` | `UseSurfaceWhite` |
| Fondo de página | `--app-bg` = `--use-surface-theme-gray-5` (prototipo) / `use/surface/surface` (Figma) | `UseSurfaceSurface` (ver divergencia 1) |
| Texto principal / secundario / terciario | `--use-text-primary/secondary/tertiary` | `UseTextPrimary` / `UseTextSecondary` / `UseTextTertiary` |
| Texto sobre primario (cabezote) | `--use-text-on-dark-primary` | `UseTextOnDarkPrimary` |
| Separadores | `--use-border-subtle` | `UseBorderSubtle` |
| Aviso informativo | `--use-state-info-bg`, `--use-state-info-text` | `UseStateInfoBg`, `UseStateInfoText` |
| Chip Radicado | `--use-state-warning-bg`, `--use-state-warning-text` | `UseStateWarningBg`, `UseStateWarningText` |
| Chip Gestionado | `--use-state-success-bg`, `--use-state-success-text` | `UseStateSuccessBg`, `UseStateSuccessText` |
| Chip Rechazado | `--use-state-error-bg`, `--use-text-badge-error` (DEC-006) | `UseStateErrorBg`, `UseTextBadgeError` |
| Alerta de error | `--use-state-error-bg/-border/-text/-icon` | `UseStateErrorBg`, `UseStateErrorBorder`, `UseStateErrorText`, `UseStateErrorIcon` |
| Padding de tarjeta, alerta | `--space-16` | `Spacing16px` |
| Radio de tarjeta y chip (16) / botón (24) | `--radius-sm` / `--radius-md` | `BorderRadiusSm` / `BorderRadiusMd` |

Valores sin token en `Compensar.Sizes.xaml` (se dejan como números locales en `EfectoSwap.Styles.xaml` y `CargaInfinita.Styles.xaml`, con su origen Figma): margen lateral y separación entre tarjetas 20, icono del aviso 18, radio de alerta 12, radio del motivo 10, alto de chip 29, ancho del botón terciario 189.

`StrokeShape="RoundRectangle 16"` y `CornerRadius="24"` son literales porque esas propiedades no aceptan `{StaticResource}` de un `x:Double`. Su valor es el de `BorderRadiusSm` y `BorderRadiusMd`; si cambia el token, cambian aquí.

## 3. Tipografía

| Rol | Figma | MAUI |
|---|---|---|
| Título del cabezote | `body/XL` Roboto 18 / 1.3 | `RobotoRegular`, 18, `LineHeight=1.3` |
| Número de radicado | `heading/h5` SemiBold 18 / 1.2, tracking 0,8 % | `RobotoBold`, 18, `CharacterSpacing=0.144` (Roboto estático no trae 600; el prototipo web también cae a 700) |
| Detalle y pie | `body/M` Roboto 14 / 1.5 | `RobotoRegular`, 14, `LineHeight=1.5` |
| Título del vacío | Roboto Bold 18 | `RobotoBold`, 18, `LineHeight=1.3` |
| Título de la alerta de error | `Body-3 Bold` 16 / 1.3 | `RobotoBold`, 16, `LineHeight=1.3` |
| Botón | `comun/Boton` Bold 16, tracking 2,2 % | `RobotoBold`, 16, `CharacterSpacing=0.352` |
| Pestañas | `M3/title/small` Medium 14 / 20, tracking 0,1 | `RobotoMedium`, 14, `CharacterSpacing=0.1` |

## 4. Estados del control (misma tabla que `renderFoot()` del prototipo, más primera carga y vacío)

| `EstadoCargaInfinita` | PrimeraCarga | Vacio |
|---|---|---|
| Cabecera (aviso 30 días) | sí | sí |
| Skeleton (3 tarjetas, con pulso) | sí | no |
| Tarjeta de vacío | no | sí |
| Lista | no | no |
| Pie (indicador, spinner, alerta, fin, contador, botón) | no | no |

| `EstadoCargaInfinita` | Reposo | Cargando | Error | Fin |
|---|---|---|---|---|
| Indicador + «Desliza hacia arriba para cargar más» | sí | no | no | no |
| Spinner + «Cargando más solicitudes…» | no | sí | no | no |
| Alerta de error con título | no | no | sí | no |
| «No hay más solicitudes para mostrar» | no | no | no | sí |
| Contador «Mostrando N de 18 solicitudes» | sí | sí | **no** | sí |
| Botón «Cargar más solicitudes» | sí | sí, inactivo | sí (reintento) | **no** |

Transiciones del ViewModel: `PrimeraCarga` → `Reposo` (o `Fin` si el total ya está) | `Vacio` (0 registros) | `Error` (la primera carga falló; Figma no la diseña: se reutiliza la alerta del pie y el botón repite la primera carga). Luego `Reposo` ⇄ `Cargando` → `Reposo` | `Fin` | `Error`.

## 5. Interacción

| Prototipo | MAUI | Nota |
|---|---|---|
| Swipe hacia arriba al final (táctil, arrastre con mouse, rueda) | `RemainingItemsThreshold="0"` + evento `RemainingItemsThresholdReached` dentro del control | MAUI no expone el gesto de arrastre sobre el final de la lista. El comando se dispara al llegar a la última tarjeta, sin que la persona tire más allá. Confirmar con UX que esto es aceptable (divergencia 5). |
| Tras error el swipe no reintenta | El control solo ejecuta `CargarMasCommand` por umbral si `Estado == Reposo` | PI-SWAP-05, por confirmar |
| Botón «Cargar más solicitudes» | `CargarMasCommand` (`CanExecute` solo en Reposo y Error) | Reintento tras error |
| Tandas 7 → 14 → 18, se agregan debajo | `ObservableCollection.Add`; `TamanoTanda = 7`; `Total = 18` | `ISolicitudesService.ObtenerAsync(desde, cantidad)` |
| Panel «Simulación → falla una vez» / `?error=1` | `SolicitudesFicticiasService.FallarProximaVez = true` | Solo para probar |
| `?vacio=1` / «Sin solicitudes (vacío)» | `SolicitudesFicticiasService.SinRegistros = true` | Solo para probar |
| Skeleton 900 ms al abrir | `SolicitudesFicticiasService.LatenciaPrimeraCarga` (900 ms) | |
| `prefers-reduced-motion` anula el pulso | `ReducirMovimiento` (de `IPreferenciasMovimiento`) detiene la animación | Ver `ACCESIBILIDAD.md` |
| Espera simulada 700 ms | `SolicitudesFicticiasService.Latencia` | |
| Foco a la primera tarjeta nueva tras cargar con el botón | No incluido | Sin API verificada; ver `ACCESIBILIDAD.md` |
| Animación de entrada de tarjetas (280 ms) | No incluida | Si se agrega, respetar reducción de movimiento |

## 6. Integración

1. `Resources/Styles/` ya trae `Compensar.Colors.xaml` y `Compensar.Sizes.xaml` v2.4.0 (copias tal cual del paquete `compensar-maui-v2.4.0.zip` del portal; origen y checksum en `manifest.json`). Si el proyecto ya tiene el paquete del DS, usar el suyo y quitar estas copias.
2. `App.xaml` → `MergedDictionaries`, en este orden: `Compensar.Colors.xaml`, `Compensar.Sizes.xaml`, `CargaInfinita.Styles.xaml`, `EfectoSwap.Styles.xaml`.
3. Fuentes en `MauiProgram.cs`: `Roboto-Regular.ttf` como `RobotoRegular`, `Roboto-Medium.ttf` como `RobotoMedium`, `Roboto-Bold.ttf` como `RobotoBold` (no incluidas).
4. Registrar: `AddSingleton<ISolicitudesService, SolicitudesFicticiasService>()` (reemplazar por el servicio real), `AddSingleton<IAnuncios, AnunciosSemanticScreenReader>()`, `AddSingleton<IPreferenciasMovimiento, PreferenciasMovimientoPorDefecto>()` (reemplazar por una implementación por plataforma), `AddTransient<MisSolicitudesViewModel>()`, `AddTransient<MisSolicitudesPage>()`.
5. Ajustar el namespace `Compensar.MedicinaPrepagada` al del proyecto.
6. Los SVG ya están en `Resources/Images/` (MAUI los convierte a PNG; se referencian como `.png`):

| Archivo | Nodo Figma | Tamaño | Uso |
|---|---|---|---|
| `ic_arrow_left.svg` | `8655:24383` | 32 | Cabezote, volver |
| `ic_bell.svg` | `8655:24386` | 32 | Cabezote, notificaciones |
| `ic_info.svg` | `8655:24392` | 18 | Aviso 30 días |
| `ic_x_circle.svg` | `I8923:25690;2284:4964` | 32 | Alerta de error (control) |
| `ic_empty_solicitudes.svg` | `8954:26836` | 96 | Vacío (control). Añadido en v0.2.0: no estaba en la lista original |

Los SVG son los que entrega el MCP de Figma, sin editar; traen colores fijos (blanco, `#2D4A67`, `#D14434`, `#FF6600`) y `preserveAspectRatio="none"`. No cambian con el modo oscuro (ver `DIVERGENCIAS-PENDIENTES.md`).
