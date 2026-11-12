# Demo de agendamiento Compensar

Archivos incluidos:

1. `demo-agenda.json`
   - JSON maestro para cargar sedes, especialidades, médicos, contexto del usuario y resultados de agenda.
   - Fechas del demo: 5 y 6 de junio de 2026.
   - Horario de agenda: 7:00 a. m. a 6:00 p. m.
   - Especialidades: Dermatología, Medicina general, Pediatría, Oftalmología y Endocrinología.
   - Endocrinología no tiene disponibilidad para validar estados vacíos.

2. `demo-agendamiento-helper.js`
   - Funciones listas para cargar el JSON, filtrar resultados y etiquetar el médico tratante.

## Ejemplo rápido

```js
import { loadDemoData, searchAppointments } from './demo-agendamiento-helper.js';

const data = await loadDemoData();

const resultados = searchAppointments(data, {
  specialtyId: 'dermatologia',
  centerIds: ['av68', 'sanroque', 'calle94'],
  date: '2026-06-05',
  modality: 'Presencial'
});

console.log(resultados);
```

## Médico tratante

La relación del médico tratante se guarda en:

```json
userContext.appointmentHistory
```

Así, cuando el usuario selecciona una especialidad, el sistema puede identificar quién fue el último médico que lo atendió para esa especialidad y mostrar el badge `Médico tratante`.
