# Compensar Medicina Prepagada — Instrucciones compartidas

**Ámbito único:** Compensar Medicina Prepagada (no mezclar con otros proyectos). El usuario dirige UX/UI y aprueba decisiones y entregas. El workspace recomendado es la carpeta `Compensar/`, no los subrepositorios por separado.

## Fuente de verdad y orden de lectura
1. Comprueba `pwd`, árbol local y Git antes de actuar; no presupongas las rutas descritas en informes de 2026-11-09.
2. `IA-Central/contexto/CONTEXTO-BASE.md` + `IA-Central/decisiones/DECISIONES.md` son referencias iniciales **históricas**, no un inventario técnico verificado hoy.
3. Consulta Figma oficial para diseño aprobado; los componentes maestros prevalecen sobre documentación antigua. Separa propuesta de aprobación.
4. Consulta código real del Design System y sus cambios locales. No sobrescribas trabajo ajeno ni realices commits, push, deploy, tags, cambios Figma maestros o remotos sin aprobación.
5. Sigue la ficha del flujo y los criterios de aceptación actuales de la HU. No uses datos personales reales en demos.

## Arquitectura
- `Core-Design-System/`: código DS compartido, no es un lugar para flujos.
- `compensar/flujos/drupal/`: portal público Drupal, actualmente HTML/CSS/JS.
- `compensar/flujos/zt/`: Zona Transaccional separada, actualmente HTML/CSS/JS; evolución tecnológica independiente (posible Angular).
- `compensar/flujos/app/`: aplicación, prototipos y especificaciones; evolución MAUI.
- `compensar/flujos/shared/`: recursos transversales aprobados; evita duplicados.
Estas rutas proceden de un informe anterior y deben verificarse antes de escribir.

## Normas innegociables
- Design System Figma visual oficial y tokens acordados; Bootstrap/vendors intocables salvo autorización explícita.
- DEC-001: no cambiar botones corporativos protegidos. DEC-002: no cambiar borde normal de inputs protegido; documentar riesgos WCAG sin declarar cumplimiento falso.
- No asumir que DEC-004/006/008 están sincronizadas entre Figma y código; verificar estados actuales.
- Light/Dark/High Contrast, WCAG 2.2 AA, móvil, zoom 200%, teclado y accesibilidad en entregas donde apliquen.
- Componente nuevo: identificar -> proponer -> aprobación -> Figma -> DS código -> QA -> catálogo -> uso en flujo.
- Toda tarea concluye con evidencia, Git, archivos, decisiones y estado documental.
- Antes de publicar: autorización explícita, QA, datos ficticios, artefacto completo e inventario central actualizado.

## Orquestación
Actúa como orquestador ante solicitudes generales. Los 11 agentes se definen en `IA-Central/agentes/manifest.json`. En Claude Code son subagentes; en Kiro, agentes personalizados. Coordina únicamente los necesarios, sin duplicar tareas.
