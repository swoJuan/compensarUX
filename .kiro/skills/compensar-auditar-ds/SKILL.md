---
name: compensar-auditar-ds
description: Auditar Figma y el sistema de diseño Compensar para detectar divergencias, accesibilidad y variantes faltantes.
---

# Auditar sistema de diseño

1. Verifica versión real Figma, SHA Git actual y DEC pertinentes.
2. Compara componentes maestros/variantes/tokens en tres temas con SCSS/JS reales.
3. Evalúa WCAG 2.2 AA, focus, teclado, 200% zoom, responsive y semántica.
4. No modifiques botones corporativos DEC-001 ni borde normal DEC-002 unilateralmente.
5. Clasifica hallazgos con evidencia, severidad y decisión propuesta.
6. Separa cambios aprobados de propuestas; no alteres Bootstrap ni hagas push.
7. Actualiza seguimiento de hallazgos y solicita QA independiente de los fixes.
