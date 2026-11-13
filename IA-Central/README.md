# IA-Central — gobierno operativo Compensar

- `agentes/*.md`: fuentes de verdad de los prompts. `manifest.json`: rol/nombre/descripción.
- `scripts/generar-adaptadores.mjs`: deriva `.claude/agents/*.md` y `.kiro/agents/*.json` a partir de las fuentes centrales; por defecto solo compara, con `--aplicar` regenera (no usar sin revisar `git diff`).
- `scripts/validar.mjs`: comprobación sintáctica, adaptadores y salud básica del registro; lectura solamente.
- `scripts/estado.mjs`: consulta pendientes y fichas actuales; lectura solamente.
- `contexto/`: antecedentes / integraciones / plataformas. Siempre verificar estado real.
- `decisiones/`: decisiones aprobadas según antecedentes, a reconciliar con la fuente real.
- `seguimiento/registro.json`: fuente actual de estado una vez auditada; arranca vacío para no inventar hechos.
- `plantillas/`: contrato y handoffs exigidos a todos los agentes.

**NOTA:** no existen conectores MCP configurados aquí. No hay orquestación independiente de Claude/Kiro ni monitorización permanente por instalar esta carpeta. Las herramientas requieren configuración y permisos reales.
