# Decisiones y restricciones iniciales

Estas son **decisiones históricas reportadas**, sujetas a verificación contra `Core-Design-System/docs` y Figma antes de ejecutar cambios. Nunca reabrir o descartar una DEC sin motivo y aprobación.

| DEC | Antecedente/guardarraíl |
|---|---|
| 001 | Botón corporativo: degradado/colores oficiales protegidos; registrar problema conocido de contraste, no declarar WCAG conforme. |
| 002 | Input borde normal `#E0E0E0` protegido; advertencia de contraste, no alterarlo unilateralmente. |
| 003 | Estados Input Error/Focus/Disabled/Readonly reportados implementados; verificar commit y regresión. |
| 004 | Focus componentes: cambios precisos según Figma aprobado, no inventar color de contorno. |
| 005 | Tipografía y pesos alineados con Figma según informe anterior; verificar fuente real. |
| 006 | Colores/Badges/Chips/Alert: tokens locales aprobados; NO cambiar global `green-2` y `red` por errores puntuales. |
| 007 | Dropdown y Tabs teclado/ARIA reportados implementados; validar navegadores/lectores de pantalla. |
| 008 | Medidas aprobadas Figma: botones 48 px y paginación radio 16 px `border-radius/sm`; comprobar código. |
| 009 | Arquitectura estilos propios: migración gradual sin alterar Bootstrap/vendors. |
| 010 | Tablas, stepper, modal, bottom sheet, accordion: conducta y accesibilidad. |
| 011 | Completar docs Figma/HTML, responsive y recursos. |
| 012 | Uso `rem`/`em` en CSS propio: progreso histórico, verificar regresión. |

**Proceso:** para un cambio crea primero la ficha en `seguimiento/registro.json`, vincula DEC, nodo Figma y aprobador; al implementar registra evidencia en el handoff y mantén estados separados `propuesta`, `aprobado`, `implementado`, `validado`, `publicado`.
