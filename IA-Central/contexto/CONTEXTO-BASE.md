# Contexto base Compensar (histórico; requiere inspección local)

**Fuente**: documentación de trabajo compartida hasta 2026-11-09. Este archivo contiene antecedentes, NO certifica el estado de los repositorios a 2026-11-13.

## Objetivo
Diseñar y entregar interfaces consistentes de Compensar Medicina Prepagada en tres frentes: Drupal (portal público), Zona Transaccional ZT y APP (.NET MAUI). Mantener un Design System central aprobado en Figma, implementado en componentes HTML/SCSS/JS reutilizables y documentados.

## Fuentes y rutas reportadas
- Figma Design System: https://www.figma.com/design/1zVGMpzqBgiBUqhmfFEAoT/Compensar-v2---Sistema-de-dise%C3%B1o?node-id=3909-20350
- Guía Figma color: https://www.figma.com/design/1zVGMpzqBgiBUqhmfFEAoT/Compensar-v2---Sistema-de-dise%C3%B1o?node-id=5998-4381
- Portal DS Azure histórico: https://stappmedprepdeveus2.z20.web.core.windows.net/drupal.html#introduccion
- Carpeta local informada: `/Users/juan.soto/Documents/Desarrollo/Compensar/`; verifica antes de utilizarla.
- `Core-Design-System/` y `compensar/flujos/` fueron reportados como repositorios separados; el segundo tenía Git local sin remoto en el informe previo.
- El CSS de los prototipos había quedado desactualizado respecto al DS en el informe previo: debe comprobarse, no darse por resuelto ni por vigente.

## Diseño y técnicas
- Bootstrap 5 y Roboto, tokens de marca; no modificar Bootstrap ni vendors sin aprobación.
- Variables y temas Light, Dark y High Contrast.
- Revisar compatibilidad 320, 375, 768, 900, 1024 y 1440 px (según contexto), zoom 200%, teclado y AA.
- Prototipos HTML para Drupal y ZT **separados**; en el futuro Drupal puede pedir Twig y ZT componentes Angular. APP se orienta a MAUI.
- En pruebas UX se evalúan comprensión, fricción, clics erróneos, éxito de tarea, abandono y confianza; no confundir test automatizado con prueba de usuario.

## Riesgos reportados que requieren comprobación
- Decisiones DEC-001/002 protegidas con excepciones de contraste documentadas.
- Desfase posible entre Figma y HTML en DEC-004, 006 y 008.
- Duplicación de CSS/core.css entre prototipos, referencias relativas rotas y repo `flujos` sin remoto.
- Documentos internos dentro del repo DS: publicación requiere lista blanca y revisión de privacidad.
- Nara/Azure DevOps: integración futura con control de duplicados y permisos.

**Proceso obligatorio**: los agentes deben verificar el estado Git/Figma actual, fijar fechas de comprobación y actualizar `IA-Central/seguimiento/registro.json` y el historial de cambios de la tarea.
