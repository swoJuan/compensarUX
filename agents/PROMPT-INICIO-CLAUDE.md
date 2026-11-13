# Prompt para pegar en Claude Code (primer arranque)

Quiero integrar el **kit IA Compensar v0.1** que descargué y descomprimí en mi Mac. Primero localiza el kit (te indicaré la carpeta donde lo descomprimí) y la raíz existente `Compensar/`. **No quiero crear un sistema nuevo ni migrar repositorios todavía**.

Antes de tocar nada, ejecuta el instalador del kit en **simulación** (`node instalar.mjs <ruta-a-Compensar>`); muéstrame archivos nuevos y conflictos. No ejecutes `--aplicar` sin mi autorización expresa. Una vez aprobada la instalación, instala SIN sobrescribir archivos existentes, y luego continúa con el diagnóstico:

1. Abre `AGENTS.md`, `CLAUDE.md`, `IA-Central/README.md` y las definiciones de los agentes.
2. Ejecuta en lectura `node IA-Central/scripts/validar.mjs` y `node IA-Central/scripts/estado.mjs`. Si faltan archivos porque el instalador detectó conflictos, propón fusión segura en lugar de sobrescribir.
3. Audita la estructura REAL del Mac: localiza `Core-Design-System`, `flujos`, sus ramas, remotos, estados Git, builds, CSS publicados, rutas relativas y documentos existentes. Compara con el contexto histórico, sin corregir nada todavía.
4. Registra diferencias comprobadas y un plan por fases. Prioriza el orquestador + conocimiento, luego Figma/DS, después Drupal/ ZT/APP, QA y entregas.
5. Verifica cómo invocar subagentes en esta versión de Claude Code y si Kiro está actualizado al formato `.kiro/agents` usado en el kit.
6. Identifica qué conectores Figma MCP, Nara/Azure, Git y portal existen REALMENTE. No instales ni autentiques conectores sin permiso.
7. Devuelve un reporte de diagnóstico y una lista concreta de archivos propuestos para el primer cambio. **No hagas commit, push, deployment, tag, cambios de Figma ni integración remota sin mi aprobación.**

Al cerrar, actualiza el registro central solo con hechos comprobados y no borres pendientes. Mantén Drupal y ZT como agentes separados: hoy ambos generan HTML, pero ZT podrá evolucionar a Angular y Drupal a Twig.
