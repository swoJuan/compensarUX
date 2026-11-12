# Handoff MAUI · Agendamiento > Nueva cita

**Figma:** APP-Medicina-Prepagada · nodo `7249:26353` ("1-medicina prepagada - home")
https://www.figma.com/design/dYhOsRYLR8KewcxNAL9Qo1/APP-Medicina-Prepagada?node-id=7249-26353

## Archivos
| Archivo | Qué es |
|---|---|
| `Resources/Styles/CompensarTokens.xaml` | Colores, tipografía, gradiente y plantillas (select, radio, tabCitas) con los nombres de las variables de Figma |
| `Views/AgendamientoPage.xaml(.cs)` | La pantalla |
| `ViewModels/AgendamientoViewModel.cs` | Estado + comandos (stubs) |

## Integración
1. `App.xaml` → `<ResourceDictionary Source="Resources/Styles/CompensarTokens.xaml" />` dentro de `MergedDictionaries`.
2. Fuentes en `MauiProgram.cs`:
   ```csharp
   fonts.AddFont("Roboto-Regular.ttf", "RobotoRegular");
   fonts.AddFont("Roboto-Medium.ttf",  "RobotoMedium");
   fonts.AddFont("Roboto-Bold.ttf",    "RobotoBold");
   ```
3. Registrar en DI: `builder.Services.AddTransient<AgendamientoViewModel>(); builder.Services.AddTransient<AgendamientoPage>();`
4. Ajustar el namespace `Compensar.MedicinaPrepagada` al del proyecto.

## Íconos a exportar desde Figma (SVG → `Resources/Images/`)
MAUI convierte los SVG a PNG; se referencian como `.png` en el XAML.
| Archivo | Nodo Figma | Tamaño |
|---|---|---|
| `ic_back.svg` | `I7249:26397;4228:27829` (icono-volver) | 38 (glifo ~24, blanco) |
| `ic_home.svg` | `I7249:26397;4228:27833` (Grupo 268) | ~20×17, blanco |
| `ic_building.svg` | `7249:26365` | 32 |
| `ic_device_mobile.svg` | `7249:26373` (Device / DeviceMobile) | 32 |

Los **radio buttons** y el **chevron (CaretDown)** están dibujados en XAML (Ellipse/Path), no necesitan asset.

## Comportamiento / supuestos (validar con diseño)
- Estado por defecto: *Centros médicos propios* y *Presencial* seleccionados.
- El select "Selecciona hasta 3 centros médicos" se muestra solo con *Centros médicos propios* (supuesto).
- Ambos selects abren selector (bottom sheet); centros es multiselección con máximo 3.
- Tabs: *Nueva cita* activo; *Mis citas* navega a la otra vista.
- Header propio (`Shell.NavBarIsVisible="False"`), fondo `#FF6600`.

## Tokens clave
- Primario `#FF6600` · Gradiente botón `#FF6600 → #E63F0C` (vertical)
- Texto `#111111 / #333333 / #666666` · Obligatorio `#BB4945`
- Borde `#E0E0E0` · Tarjeta seleccionada fondo `#FFF2E3`, borde `#FFE6D6`
- Radios: campos 16, tarjetas 8, botón 24 · Padding contenido 23 h / 32 v · Gap vertical 24
