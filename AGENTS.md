# Compensar Medicina Prepagada — Instrucciones compartidas

**Ámbito único:** Compensar Medicina Prepagada (no mezclar con otros proyectos). El usuario dirige UX/UI y aprueba decisiones y entregas. El workspace es la raíz `compensarUX/` (repositorio Git único, rama `main`).

## Fuente de verdad y orden de lectura
1. Comprueba `pwd`, árbol local y Git antes de actuar; no presupongas las rutas descritas en informes de 2026-11-09.
2. `IA-Central/contexto/CONTEXTO-BASE.md` + `IA-Central/decisiones/DECISIONES.md` son referencias iniciales **históricas**, no un inventario técnico verificado hoy.
3. Consulta Figma oficial para diseño aprobado; los componentes maestros prevalecen sobre documentación antigua. Separa propuesta de aprobación.
4. Consulta código real del Design System y sus cambios locales. No sobrescribas trabajo ajeno ni realices commits, push, deploy, tags, cambios Figma maestros o remotos sin aprobación.
5. Sigue la ficha del flujo y los criterios de aceptación actuales de la HU. No uses datos personales reales en demos.

## Arquitectura (verificada 2026-11-13)
- `Core-Design-System/`: Design System v2.4.0 (código y docs). Fuente de verdad visual; no se editan sus versiones sin aprobación.
- `Flujos/prototipos/{drupal,zt,app}/`: prototipos HTML/CSS/JS; Drupal, ZT y APP son plataformas independientes. `shared/vendor` y `shared/icons` son copia generada (`sync-flows`), no se editan a mano.
- `Flujos/portal/`: generador del portal (`catalogo.json` = 7 flujos). `Flujos/entregables/`: entregables.
- `sitio/`: portal generado; no editar manualmente.
- `Nara/`: proyecto independiente; no tocar.
- `IA-Central/`: conocimiento, agentes (fuente única), decisiones y seguimiento. `.claude/` y `.kiro/` son adaptadores generados.
- `_respaldo-repos/`: respaldos; no eliminar ni sobrescribir.
Consulta de conocimiento acotada: `node IA-Central/scripts/conocimiento.mjs consultar flujo <id>`.

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
