# Orquestador Claude Code — Compensar

Lee `AGENTS.md` y luego `IA-Central/agentes/compensar-orquestador.md`. Usa las definiciones en `.claude/agents/` para delegar a especialistas cuando la plataforma lo permita. Mantén los contratos y el registro central. DELEGA con la herramienta de subagentes (Agent/Task) usando el `subagent_type` igual al slug del especialista; no simules su trabajo. Al cerrar una tarea ejecuta `node IA-Central/scripts/conocimiento.mjs revisar-cierre`. No hagas operaciones de publicación o cambios maestros sin aprobación.

Inicio sugerido: `node IA-Central/scripts/estado.mjs`; `node IA-Central/scripts/validar.mjs`; `git status` en cada repositorio real identificado. Las herramientas Figma/Nara/Azure se habilitan solo tras validar conexión y permisos.

Antes de implementar cualquier tarea: audita primero; si no se ha comprobado la estructura actual, nunca migres ni modifiques archivos basándote en rutas históricas.
