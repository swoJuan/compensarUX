# Integraciones (estado inicial: no validadas en el Mac)

- **Figma:** configurar MCP de Figma según los accesos corporativos. Solo agentes de Diseño/Arquitectura DS pueden escribir y únicamente en áreas autorizadas. Intérprete Figma: lectura; no usar screenshot como sustituto de valores de token si existe API.
- **Git/GitHub:** inspección local en lectura para empezar; verificar origen de cada repo. No configurar push automático. El repositorio DS estaba bajo `swoJuan/Compensar` en un informe histórico; requiere revisar propiedad y permisos.
- **Portal/hosting:** existe una propuesta previa de catálogo y entregables protegidos. No se presume que Vercel o GitHub Releases estén implementados ni autorizados. Publicar con aprobación.
- **Nara/Azure DevOps:** potencial integración de QA/historias de usuario. No habilitar creación de Tasks automáticamente; exigir consentimiento, dry-run y control de duplicados.
- **Claude Code/Kiro:** no incluir credenciales, tokens OAuth, PAT, `.env` ni llaves en el repositorio ni en el ZIP.

**Verificar antes de conectar**: disponibilidad del MCP en la herramienta, autorización corporativa, permisos de lectura/escritura, límites de datos y muestra de lectura de un nodo real. Registrar resultado en seguimiento.
