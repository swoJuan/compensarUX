# Paquete inicial IA Compensar — v0.1

**Estado: kit inicial generado y validado estructuralmente. No está instalado en el Mac ni conectado a Figma, Nara, Azure o repositorios reales.**

## Qué contiene
- 11 definiciones centrales de agente y orquestador compartidos.
- 11 adaptadores Claude Code (`.claude/agents/*.md`) y 11 adaptadores Kiro (`.kiro/agents/*.json`).
- 3 Skills compartidas: crear flujo, auditar DS, cerrar tarea, duplicadas automáticamente en ambos formatos.
- Instrucciones principales `AGENTS.md`, `CLAUDE.md`, steering Kiro.
- Contexto histórico Compensar, DEC001–012, restricciones, separación Drupal/ZT/APP.
- Inventario y registro vacíos **para auditar**, sin fingir que los flujos están actualizados.
- Herramientas Node.js para comprobar adaptadores/estado, instalador con simulación y sin sobrescritura.

## Instalar en el Mac (Node.js >= 18)
1. Descomprime este ZIP. Identifica la carpeta que contiene `instalar.mjs`.
2. Ejecuta una SIMULACIÓN (no escribe nada):

```bash
node "/ruta/descargas/Compensar-IA-Kit-v0.1/instalar.mjs" "/Users/juan.soto/Documents/Desarrollo/Compensar"
```

3. Revisa archivos NUEVOS y CONFLICTOS. Si es correcto, ejecuta:

```bash
node "/ruta/descargas/Compensar-IA-Kit-v0.1/instalar.mjs" "/Users/juan.soto/Documents/Desarrollo/Compensar" --aplicar
```

No sobrescribe archivos existentes; si `AGENTS.md` o `CLAUDE.md` ya existen, Claude Code debe conciliar el contenido manualmente.

4. Abre Claude Code **en la carpeta raíz Compensar/** (no dentro de `Core-Design-System`):

```bash
cd "/Users/juan.soto/Documents/Desarrollo/Compensar"
node IA-Central/scripts/validar.mjs
node IA-Central/scripts/estado.mjs
claude
```

5. Pega el contenido de `PROMPT-INICIO-CLAUDE.md` a Claude Code (si ya instalaste el kit, indícale que omita la instalación y pase al diagnóstico). Para Kiro, abre la misma carpeta como workspace; selecciona `compensar-orquestador` si tu versión lo permite y verifica que los perfiles se carguen.

## Operación diaria
- Las fuentes de agentes están en `IA-Central/agentes/*.md` y `manifest.json`.
- Cuando se cambie una fuente, regenera adaptadores: `node IA-Central/scripts/generar-adaptadores.mjs --aplicar` y revisa `git diff`; `validar.mjs` comprueba coherencia.
- Para comprobar pendientes: `node IA-Central/scripts/estado.mjs`.
- Los cambios a prototipos, componentes y DEC deben actualizar registros y evidencias como parte del cierre de cada tarea.

## Seguridad y límites
- Este instalador NO edita ni mueve nada dentro de `Core-Design-System/` o `compensar/flujos/`, no ejecuta git y no publica.
- La estructura es una propuesta de orquestación; la integración real con MCP y la funcionalidad de subagentes debe probarse en las versiones instaladas localmente.
- En la fase inicial se limita a configurar agentes y procesos; **no hay monitoreo autónomo permanente ni recordatorios push**.
- Las reglas de consentimiento se apoyan en permisos del IDE/CLI, configuración del usuario y revisiones. No sustituyen controles corporativos de acceso.

## Referencias oficiales técnicas
- Claude Code subagentes: https://code.claude.com/docs/en/sub-agents
- Claude Code skills: https://code.claude.com/docs/en/skills
- Kiro custom agents: https://kiro.dev/docs/custom-agents/
- Kiro configuración: https://kiro.dev/docs/custom-agents/configuration-reference/
- Kiro subagentes: https://kiro.dev/docs/custom-agents/subagents/
- Kiro skills: https://kiro.dev/docs/skills/
