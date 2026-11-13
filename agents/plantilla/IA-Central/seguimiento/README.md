# Registro central de seguimiento

`registro.json` comienza **vacío intencionalmente**. No expresa que no existan pendientes; expresa que **todavía no se auditó el repositorio actual**.

No llenar el registro con supuestos de memorias. Cada entrada debe tener `id`, `estado`, `responsable`, `verificadoEn`, `fuente` o `evidencia`, y `siguientePaso`, según tipo. Estados sugeridos: `por_verificar`, `propuesta`, `aprobado`, `en_proceso`, `bloqueado`, `pendiente_qa`, `validado`, `publicado`, `cerrado`.

Comprobar el registro al inicio y cierre de cada tarea. No hay avisos en segundo plano solo por tener estos archivos. Para recordatorios automáticos, configurar una tarea programada fuera de Claude/Kiro y obtener permiso.
