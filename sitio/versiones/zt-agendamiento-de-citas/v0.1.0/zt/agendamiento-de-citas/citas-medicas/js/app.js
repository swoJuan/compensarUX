/**
 * Compensar – Citas médicas | Prototipo de usabilidad (v2.1)
 * app.js
 *
 * Módulos:
 *   STATE          → variables globales de selección
 *   MIS CITAS DATA → array de citas con estado (proxima / cancelada / pasada / reprogramada)
 *   RENDER MIS CITAS → renderMisCitas(), filtrarMisCitas()
 *   RENDER RESULTADOS → renderResultadosCitas() para pantalla de citas disponibles
 *   NAVIGATION     → goTo(), switchTab(), goToResultados(), seleccionarCita()
 *   RESPONSIVE     → checkDesktop() para médico tratante
 *   OVERLAYS       → openOverlay(), closeOverlay(), closeOut()
 *   ESPECIALIDAD   → pickEsp()
 *   MÉDICO TRATANTE → toggleMT()
 *   SEDES          → toggleSede(), actualizarBloqueoSedes(), confirmarSede()
 *   FECHA          → pickFecha(), confirmarFecha()
 *   FILTRO MÉDICO  → pickFiltro(), aplicarFiltro()
 *   INIT           → DOMContentLoaded
 */

/* global document, window */

/* ─────────── STATE ─────────── */
const FECHAS = { '5':'Lunes, 5 Enero 2026','6':'Martes, 6 Enero 2026','7':'Miércoles, 7 Enero 2026','8':'Jueves, 8 Enero 2026' };
const SEDES_LABEL = { av68:'Clínica Compensar (Av. 68)',c94:'Clínica Compensar Calle 94',c26:'Centro Médico Compensar Calle 26',suba:'Centro Médico Compensar Suba',kennedy:'Centro Médico Compensar Kennedy',bosa:'Centro Médico Compensar Bosa',sanroque:'Centro Médico San Roque (Cajicá)' };
const SEDES_RESULTADOS_LABEL = { av68:'Clínica Compensar (Av. 68)',c94:'Clínica Compensar Calle 94',c26:'Centro Médico Compensar Calle 26',suba:'Centro Médico Compensar Suba',kennedy:'Centro Médico Compensar Kennedy',bosa:'Centro Médico Compensar Bosa',sanroque:'San Roque' };
const CENTER_ID_ALIASES = { c94: 'calle94', suba: 'suba139' };
const DEMO_RULES = {
  maxSpecialties: 5,
  minSlotsPerCenterPerDay: 2,
  targetSpecialties: ['medicina_general', 'dermatologia'],
};
let demoData = null;
let medicalCentersDb = {};
let medicalCentersDbPromise = null;

function normalizeCenterId(id) {
  return CENTER_ID_ALIASES[id] || id;
}

function ruleTimeToMinutes(timeStr) {
  const [hh, mm] = String(timeStr || '00:00').split(':').map(Number);
  return (hh * 60) + mm;
}

function ruleMinutesToTime(totalMinutes) {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getDemoDates(data) {
  const from = data?.meta?.dateRange?.from;
  const to = data?.meta?.dateRange?.to;
  return [from, to].filter(Boolean);
}

function getDayLabelForDate(data, isoDate) {
  const fromSlot = (data.availability || []).find(slot => slot.date === isoDate)?.dayLabel;
  if (fromSlot) return fromSlot;
  const d = new Date(`${isoDate}T12:00:00`);
  const weekday = d.toLocaleDateString('es-CO', { weekday: 'long' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function enforceMaxSpecialties(data) {
  if (!Array.isArray(data.specialties) || data.specialties.length <= DEMO_RULES.maxSpecialties) return;

  const countBySpec = {};
  (data.availability || []).forEach(slot => {
    if (!slot.isAvailable) return;
    countBySpec[slot.specialtyId] = (countBySpec[slot.specialtyId] || 0) + 1;
  });

  const preferred = DEMO_RULES.targetSpecialties.filter(id => data.specialties.some(spec => spec.id === id));
  const sortedRest = data.specialties
    .map(spec => spec.id)
    .filter(id => !preferred.includes(id))
    .sort((a, b) => (countBySpec[b] || 0) - (countBySpec[a] || 0));

  const allowed = new Set([...preferred, ...sortedRest].slice(0, DEMO_RULES.maxSpecialties));
  data.specialties = data.specialties.filter(spec => allowed.has(spec.id));
}

function enforceMinAgendaByCenterDay(data) {
  if (!Array.isArray(data.availability)) data.availability = [];
  const centers = data.medicalCenters || [];
  const doctors = data.doctors || [];
  const dates = getDemoDates(data);
  if (!dates.length) return;

  const centerById = new Map(centers.map(center => [center.id, center]));
  const existingIds = new Set(data.availability.map(slot => slot.id));
  const usedStartByDateCenter = new Map();

  data.availability.forEach(slot => {
    if (!slot.isAvailable) return;
    const key = `${slot.date}::${normalizeCenterId(slot.centerId)}`;
    if (!usedStartByDateCenter.has(key)) usedStartByDateCenter.set(key, new Set());
    usedStartByDateCenter.get(key).add(slot.startTime);
  });

  DEMO_RULES.targetSpecialties.forEach(specialtyId => {
    dates.forEach(isoDate => {
      centers.forEach(center => {
        const centerId = normalizeCenterId(center.id);
        const availableSlots = data.availability.filter(slot => (
          slot.isAvailable
          && slot.specialtyId === specialtyId
          && slot.date === isoDate
          && normalizeCenterId(slot.centerId) === centerId
        ));

        const deficit = DEMO_RULES.minSlotsPerCenterPerDay - availableSlots.length;
        if (deficit <= 0) return;

        const eligibleDoctors = doctors.filter(doctor => (
          (doctor.specialtyIds || []).includes(specialtyId)
          && (doctor.centerIds || []).map(normalizeCenterId).includes(centerId)
        ));
        if (!eligibleDoctors.length) return;

        const key = `${isoDate}::${centerId}`;
        const usedStarts = usedStartByDateCenter.get(key) || new Set();
        usedStartByDateCenter.set(key, usedStarts);

        const preferredStarts = ['08:20', '09:20', '10:20', '11:20', '14:20', '15:20', '16:20', '17:20'];
        let doctorIdx = 0;

        for (let i = 0; i < deficit; i += 1) {
          let chosenStart = preferredStarts.find(t => !usedStarts.has(t));
          if (!chosenStart) {
            let probe = 8 * 60;
            while (probe <= (17 * 60 + 40)) {
              const probeTime = ruleMinutesToTime(probe);
              if (!usedStarts.has(probeTime)) {
                chosenStart = probeTime;
                break;
              }
              probe += 20;
            }
          }
          if (!chosenStart) break;

          const doctor = eligibleDoctors[doctorIdx % eligibleDoctors.length];
          doctorIdx += 1;

          const startMinutes = ruleTimeToMinutes(chosenStart);
          const endTime = ruleMinutesToTime(startMinutes + 20);
          const centerInfo = centerById.get(centerId) || center;
          const doctorSlug = doctor.id.replace(/^doc-/, '');
          const slotId = `slot-rule-${isoDate.replaceAll('-', '')}-${chosenStart.replace(':', '')}-${doctorSlug}-${centerId}-${specialtyId}`;
          if (existingIds.has(slotId)) continue;

          const specialtyName = (data.specialties || []).find(spec => spec.id === specialtyId)?.name || specialtyId;
          const amount = specialtyId === 'dermatologia' ? 55000 : 45000;

          data.availability.push({
            id: slotId,
            date: isoDate,
            dayLabel: getDayLabelForDate(data, isoDate),
            startTime: chosenStart,
            endTime,
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialtyId,
            specialty: specialtyName,
            centerId,
            centerShortName: centerInfo.shortName || centerInfo.name,
            centerName: centerInfo.name,
            address: centerInfo.address,
            modality: 'Presencial',
            isAvailable: true,
            payment: {
              bonusRequired: true,
              bonusAmountCOP: amount,
              canPayOnline: true,
            },
            tags: centerInfo.isExclusive ? ['Sede exclusiva'] : [],
          });

          usedStarts.add(chosenStart);
          existingIds.add(slotId);
        }
      });
    });
  });
}

function enforceDemoRules(rawData) {
  const data = rawData || {};
  enforceMaxSpecialties(data);
  enforceMinAgendaByCenterDay(data);
  return data;
}

function buildOfflineDemoData() {
  return {
    meta: {
      project: 'Demo agendamiento offline',
      version: 'offline-1',
      dateRange: { from: '2026-06-05', to: '2026-06-06' },
    },
    ui: {
      emptyStates: {
        noAvailability: {
          title: 'No encontramos citas disponibles',
          description: 'Intenta modificar la fecha, la sede o el médico para ver nuevas opciones.',
        },
      },
    },
    userContext: {
      recentCenters: ['av68', 'calle94', 'calle26'],
      appointmentHistory: [
        {
          specialtyId: 'dermatologia',
          doctorId: 'doc-jhon-sarria',
          isLastAppointment: true,
        },
      ],
    },
    specialties: [
      { id: 'dermatologia', name: 'Dermatología', hasAvailability: true, availableDates: ['2026-06-05', '2026-06-06'] },
      { id: 'medicina_general', name: 'Medicina general', hasAvailability: true, availableDates: ['2026-06-05', '2026-06-06'] },
      { id: 'pediatria', name: 'Pediatría', hasAvailability: true, availableDates: ['2026-06-05', '2026-06-06'] },
      { id: 'oftalmologia', name: 'Oftalmología', hasAvailability: true, availableDates: ['2026-06-05', '2026-06-06'] },
      { id: 'endocrinologia', name: 'Endocrinología', hasAvailability: true, availableDates: ['2026-06-05', '2026-06-06'] },
    ],
    medicalCenters: [
      { id: 'av68', name: 'Clínica Compensar (Av. 68)', shortName: 'Av. 68', address: 'Avenida 68 # 49A-47, Bogotá D.C.' },
      { id: 'calle94', name: 'Compensar Calle 94', shortName: 'Calle 94', address: 'Calle 94 # 23-43, Bogotá D.C.' },
      { id: 'calle26', name: 'Compensar Calle 26', shortName: 'Calle 26', address: 'Avenida Calle 26 # 69-76, Bogotá D.C.' },
      { id: 'suba139', name: 'Compensar Suba Calle 139', shortName: 'Suba Calle 139', address: 'Calle 139 # 94-55, Bogotá D.C.' },
      { id: 'kennedy', name: 'Unidad de Servicios de Salud Kennedy', shortName: 'Kennedy', address: 'Transversal 78H # 41C-48 Sur, Bogotá D.C.' },
      { id: 'sanroque', name: 'Centro Médico San Roque (Cajicá)', shortName: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cajicá' },
    ],
    doctors: [
      { id: 'doc-jhon-sarria', name: 'Dr. Jhon Sarria', centerIds: ['av68', 'sanroque'], specialtyIds: ['dermatologia'], modalities: ['Presencial'] },
      { id: 'doc-vanessa-martinez', name: 'Dra. Vanessa Martínez', centerIds: ['calle94', 'sanroque'], specialtyIds: ['dermatologia'], modalities: ['Presencial'] },
      { id: 'doc-diana-cortes', name: 'Dra. Diana Cortés', centerIds: ['calle26', 'suba139'], specialtyIds: ['medicina_general'], modalities: ['Presencial'] },
      { id: 'doc-camilo-torres', name: 'Dr. Camilo Torres', centerIds: ['kennedy', 'suba139'], specialtyIds: ['pediatria'], modalities: ['Presencial'] },
      { id: 'doc-marcela-tovar', name: 'Dra. Marcela Tovar', centerIds: ['calle26', 'calle94'], specialtyIds: ['oftalmologia'], modalities: ['Presencial'] },
      { id: 'doc-natalia-gomez', name: 'Dra. Natalia Gómez', centerIds: ['calle94', 'kennedy'], specialtyIds: ['endocrinologia'], modalities: ['Presencial'] },
    ],
    availability: [
      { id: 'off-derm-1', date: '2026-06-05', dayLabel: 'Viernes', startTime: '08:00', endTime: '08:20', doctorId: 'doc-jhon-sarria', doctorName: 'Dr. Jhon Sarria', specialtyId: 'dermatologia', specialty: 'Dermatología', centerId: 'av68', centerShortName: 'Av. 68', centerName: 'Clínica Compensar (Av. 68)', address: 'Avenida 68 # 49A-47, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 50000 }, tags: ['Médico tratante'] },
      { id: 'off-derm-2', date: '2026-06-06', dayLabel: 'Sábado', startTime: '09:00', endTime: '09:20', doctorId: 'doc-vanessa-martinez', doctorName: 'Dra. Vanessa Martínez', specialtyId: 'dermatologia', specialty: 'Dermatología', centerId: 'calle94', centerShortName: 'Calle 94', centerName: 'Compensar Calle 94', address: 'Calle 94 # 23-43, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 50000 }, tags: [] },
      { id: 'off-mg-1', date: '2026-06-05', dayLabel: 'Viernes', startTime: '10:00', endTime: '10:20', doctorId: 'doc-diana-cortes', doctorName: 'Dra. Diana Cortés', specialtyId: 'medicina_general', specialty: 'Medicina general', centerId: 'calle26', centerShortName: 'Calle 26', centerName: 'Compensar Calle 26', address: 'Avenida Calle 26 # 69-76, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 35000 }, tags: [] },
      { id: 'off-mg-2', date: '2026-06-06', dayLabel: 'Sábado', startTime: '10:40', endTime: '11:00', doctorId: 'doc-diana-cortes', doctorName: 'Dra. Diana Cortés', specialtyId: 'medicina_general', specialty: 'Medicina general', centerId: 'suba139', centerShortName: 'Suba Calle 139', centerName: 'Compensar Suba Calle 139', address: 'Calle 139 # 94-55, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 35000 }, tags: [] },
      { id: 'off-ped-1', date: '2026-06-05', dayLabel: 'Viernes', startTime: '11:20', endTime: '11:40', doctorId: 'doc-camilo-torres', doctorName: 'Dr. Camilo Torres', specialtyId: 'pediatria', specialty: 'Pediatría', centerId: 'kennedy', centerShortName: 'Kennedy', centerName: 'Unidad de Servicios de Salud Kennedy', address: 'Transversal 78H # 41C-48 Sur, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 32000 }, tags: [] },
      { id: 'off-ped-2', date: '2026-06-06', dayLabel: 'Sábado', startTime: '12:00', endTime: '12:20', doctorId: 'doc-camilo-torres', doctorName: 'Dr. Camilo Torres', specialtyId: 'pediatria', specialty: 'Pediatría', centerId: 'suba139', centerShortName: 'Suba Calle 139', centerName: 'Compensar Suba Calle 139', address: 'Calle 139 # 94-55, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 32000 }, tags: [] },
      { id: 'off-ofta-1', date: '2026-06-05', dayLabel: 'Viernes', startTime: '12:40', endTime: '13:00', doctorId: 'doc-marcela-tovar', doctorName: 'Dra. Marcela Tovar', specialtyId: 'oftalmologia', specialty: 'Oftalmología', centerId: 'calle26', centerShortName: 'Calle 26', centerName: 'Compensar Calle 26', address: 'Avenida Calle 26 # 69-76, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 47000 }, tags: [] },
      { id: 'off-ofta-2', date: '2026-06-06', dayLabel: 'Sábado', startTime: '13:00', endTime: '13:20', doctorId: 'doc-marcela-tovar', doctorName: 'Dra. Marcela Tovar', specialtyId: 'oftalmologia', specialty: 'Oftalmología', centerId: 'calle94', centerShortName: 'Calle 94', centerName: 'Compensar Calle 94', address: 'Calle 94 # 23-43, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 47000 }, tags: [] },
      { id: 'off-endo-1', date: '2026-06-05', dayLabel: 'Viernes', startTime: '13:30', endTime: '13:50', doctorId: 'doc-natalia-gomez', doctorName: 'Dra. Natalia Gómez', specialtyId: 'endocrinologia', specialty: 'Endocrinología', centerId: 'calle94', centerShortName: 'Calle 94', centerName: 'Compensar Calle 94', address: 'Calle 94 # 23-43, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 60000 }, tags: ['Sede exclusiva'] },
      { id: 'off-endo-2', date: '2026-06-06', dayLabel: 'Sábado', startTime: '14:10', endTime: '14:30', doctorId: 'doc-natalia-gomez', doctorName: 'Dra. Natalia Gómez', specialtyId: 'endocrinologia', specialty: 'Endocrinología', centerId: 'kennedy', centerShortName: 'Kennedy', centerName: 'Unidad de Servicios de Salud Kennedy', address: 'Transversal 78H # 41C-48 Sur, Bogotá D.C.', modality: 'Presencial', isAvailable: true, payment: { bonusAmountCOP: 60000 }, tags: [] },
    ],
  };
}

function buildMedicalCentersDbFromDemo(data) {
  const specialtyById = new Map((data.specialties || []).map(item => [item.id, item.name]));
  const primaryDoctorIds = new Set(
    (data.userContext?.appointmentHistory || [])
      .filter(item => item.isLastAppointment)
      .map(item => item.doctorId)
  );

  return (data.medicalCenters || []).reduce((acc, center) => {
    const doctors = (data.doctors || [])
      .filter(doctor => (doctor.centerIds || []).map(normalizeCenterId).includes(center.id))
      .map(doctor => ({
        name: doctor.name,
        id: doctor.id,
        isPrimaryDoctor: primaryDoctorIds.has(doctor.id) || Boolean(doctor.isPrimaryDoctor),
        specialties: (doctor.specialtyIds || []).map(id => specialtyById.get(id) || id),
        modalities: doctor.modalities || ['Presencial'],
      }));

    acc[center.id] = {
      name: center.name,
      shortName: center.shortName,
      address: center.address,
      doctors,
    };
    return acc;
  }, {});
}

function ensureMedicalCentersDbLoaded() {
  if (demoData && Object.keys(medicalCentersDb).length) return Promise.resolve(medicalCentersDb);
  if (medicalCentersDbPromise) return medicalCentersDbPromise;

  medicalCentersDbPromise = fetch('assets/data-1/demo-agenda.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar la data del demo: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      demoData = enforceDemoRules(data);
      medicalCentersDb = buildMedicalCentersDbFromDemo(demoData);
      return medicalCentersDb;
    })
    .catch(error => {
      console.warn('Fallo carga por fetch, usando demo offline:', error);
      demoData = enforceDemoRules(buildOfflineDemoData());
      medicalCentersDb = buildMedicalCentersDbFromDemo(demoData);
      return medicalCentersDb;
    });

  return medicalCentersDbPromise;
}

function resolveAppRoute(routeKey, fallbackPath) {
  const configuredRoutes = (window.APP_ROUTES && typeof window.APP_ROUTES === 'object')
    ? window.APP_ROUTES
    : {};
  const rawPath = configuredRoutes[routeKey] || fallbackPath;
  return new URL(rawPath, window.location.href).toString();
}

function saveHomeRoute() {
  try {
    const currentPath = `${window.location.pathname}${window.location.search || ''}`;
    window.sessionStorage.setItem('compensarHomeRoute', currentPath);
  } catch (error) {
    console.warn('No se pudo persistir la ruta de regreso:', error);
  }
}

function getNormalizedSpecialtyLabel(label) {
  const cleaned = String(label || '').replace(/^consulta\s+/i, '').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getCenterIdFromLocation(loc) {
  const locationText = String(loc || '').toLowerCase();
  const centers = demoData?.medicalCenters || [];
  const matchedCenter = centers.find(center => {
    const name = String(center.name || '').toLowerCase();
    const shortName = String(center.shortName || '').toLowerCase();
    const address = String(center.address || '').toLowerCase();
    return locationText.includes(name) || locationText.includes(shortName) || locationText.includes(address);
  });
  return matchedCenter?.id || '';
}

let selectedSedes = [];
let selectedSedesMod = [];
let selectedFecha = '5';
let selectedFiltro = 'todos';
let mtChecked = false;
let mcEstado = 'proxima'; // filtro estado — default: próximas
let mcEspec  = 'todas';   // filtro especialidad
let mcSede   = 'todas';   // filtro sede
let hasBooked = false;    // true cuando el usuario confirma una cita
let bookedSpec = '';      // especialidad de la última cita agendada

/* ─────────── CITAS DATA ─────────── */
const CITAS = [
  { hora:'8:00',  doc:'Dra. Alejandra Sierra', spec:'Dermatología', loc:'San Roque', tratante:true  },
  { hora:'8:15',  doc:'Dra. Vanessa Martínez',  spec:'Dermatología', loc:'San Roque', tratante:false },
  { hora:'8:25',  doc:'Dra. Alejandra Sierra', spec:'Dermatología', loc:'San Roque', tratante:true  },
  { hora:'8:30',  doc:'Dra. Vanessa Martínez',  spec:'Dermatología', loc:'San Roque', tratante:false },
  { hora:'8:50',  doc:'Dra. Alejandra Sierra', spec:'Dermatología', loc:'San Roque', tratante:true  },
  { hora:'9:00',  doc:'Dra. Luciana Restrepo', spec:'Dermatología', loc:'San Roque', tratante:false },
  { hora:'9:15',  doc:'Dra. Luciana Restrepo', spec:'Dermatología', loc:'San Roque', tratante:false },
  { hora:'9:30',  doc:'Dr. Víctor García',      spec:'Dermatología', loc:'San Roque', tratante:false },
  { hora:'9:40',  doc:'Dr. Víctor García',      spec:'Dermatología', loc:'San Roque', tratante:false },
];
const FILTROS = {
  todos:     () => true,
  alejandra: c => c.doc.includes('Alejandra'),
  vanessa:   c => c.doc.includes('Vanessa'),
  luciana:   c => c.doc.includes('Luciana'),
  victor:    c => c.doc.includes('Víctor'),
};

/* ─────────── MIS CITAS DATA ─────────── */
const MIS_CITAS = [
  {
    fecha:'LUNES, 18 MAYO 2026', hora:'07:30', am:'a.m.',
    spec:'Consulta medicina general', doc:'Dra. Lucía Bermúdez',
    tipo:'Cita presencial', loc:'Clínica Compensar Av. 68 # 49A-47, Bogotá',
    precio:'$28.500', estado:'proxima'
  },
  {
    fecha:'JUEVES, 21 MAYO 2026', hora:'10:00', am:'a.m.',
    spec:'Consulta dermatología', doc:'Dra. Alejandra Sierra',
    tipo:'Cita presencial', loc:'Clínica Compensar Calle 94 # 15-32, Bogotá',
    precio:'$46.990', estado:'proxima'
  },
  {
    fecha:'MARTES, 26 MAYO 2026', hora:'02:15', am:'p.m.',
    spec:'Consulta cardiología', doc:'Dr. Roberto Mejía',
    tipo:'Cita presencial', loc:'Clínica Compensar Calle 94 # 23-43, Bogotá',
    precio:'$38.000', estado:'proxima'
  },
  {
    fecha:'VIERNES, 29 MAYO 2026', hora:'08:45', am:'a.m.',
    spec:'Consulta ortopedia y traumatología', doc:'Dr. Felipe Castillo',
    tipo:'Cita presencial', loc:'Centro Médico Compensar Suba Cra. 91 # 141-10, Bogotá',
    precio:'$52.400', estado:'proxima'
  },
  {
    fecha:'MARTES, 5 MAYO 2026', hora:'09:00', am:'a.m.',
    spec:'Consulta oftalmología', doc:'Dra. Sandra Patiño',
    tipo:'Cita presencial', loc:'Centro Médico Compensar Calle 26 # 69-76, Bogotá',
    precio:'$44.200', estado:'cancelada'
  },
  {
    fecha:'JUEVES, 30 ABR 2026', hora:'03:30', am:'p.m.',
    spec:'Consulta neurología', doc:'Dr. Mario Vargas',
    tipo:'Cita presencial', loc:'Clínica Compensar Calle 94 # 23-43, Bogotá',
    precio:'$41.000', estado:'cancelada'
  },
  {
    fecha:'MIÉRCOLES, 22 ABR 2026', hora:'07:00', am:'a.m.',
    spec:'Consulta medicina general', doc:'Dra. Lucía Bermúdez',
    tipo:'Cita presencial', loc:'Clínica Compensar Av. 68 # 49A-47, Bogotá',
    precio:'$28.500', estado:'pasada'
  },
  {
    fecha:'LUNES, 13 ABR 2026', hora:'11:30', am:'a.m.',
    spec:'Consulta ginecología', doc:'Dra. Paola Ríos',
    tipo:'Cita presencial', loc:'Centro Médico Compensar Kennedy Cra. 80 # 38-40, Bogotá',
    precio:'$49.800', estado:'pasada'
  },
  {
    fecha:'VIERNES, 3 ABR 2026', hora:'08:00', am:'a.m.',
    spec:'Consulta pediatría', doc:'Dr. Camilo Torres',
    tipo:'Cita presencial', loc:'Centro Médico San Roque Km 7 vía Cajicá-Chía, Cajicá',
    precio:'$32.000', estado:'pasada'
  },
  {
    fecha:'MARTES, 28 ABR 2026', hora:'10:15', am:'a.m.',
    spec:'Consulta endocrinología', doc:'Dra. Natalia Gómez',
    tipo:'Cita presencial', loc:'Clínica Compensar Calle 94 # 15-32, Bogotá',
    precio:'$53.600', estado:'reprogramada'
  },
  {
    fecha:'JUEVES, 16 ABR 2026', hora:'02:00', am:'p.m.',
    spec:'Consulta psiquiatría', doc:'Dr. Ernesto Leal',
    tipo:'Cita presencial', loc:'Clínica Compensar Calle 94 # 23-43, Bogotá',
    precio:'$58.000', estado:'reprogramada'
  },
];
const MC_BADGE = {
  proxima:      { cls:'mp-badge mp-badge--sm mp-badge--info',    label:'Próxima' },
  cancelada:    { cls:'mp-badge mp-badge--sm mp-badge--error',   label:'Cancelada' },
  pasada:       { cls:'mp-badge mp-badge--sm mp-badge--neutral', label:'Pasada' },
  reprogramada: { cls:'mp-badge mp-badge--sm mp-badge--violet',  label:'Reprogramada' },
};

/* Catálogo base de especialidades para filtros de Mis citas */
const MC_ESPECIAL_CATALOG = [
  { val:'todas',     label:'Todas las especialidades', match:null },
  { val:'medgen',    label:'Medicina general',         match:'medicina general' },
  { val:'derma',     label:'Dermatología',             match:'dermatología' },
  { val:'cardio',    label:'Cardiología',              match:'cardiología' },
  { val:'orto',      label:'Ortopedia',                match:'ortopedia' },
  { val:'oftalmo',   label:'Oftalmología',             match:'oftalmología' },
  { val:'neuro',     label:'Neurología',               match:'neurología' },
  { val:'gine',      label:'Ginecología',              match:'ginecología' },
  { val:'pedia',     label:'Pediatría',                match:'pediatría' },
  { val:'endocrino', label:'Endocrinología',           match:'endocrinología' },
  { val:'psiqui',    label:'Psiquiatría',              match:'psiquiatría' },
];

function getMcEspecialOptions() {
  const disponibles = new Set();

  MIS_CITAS.forEach(cita => {
    const spec = (cita.spec || '').toLowerCase();
    MC_ESPECIAL_CATALOG.forEach(opcion => {
      if (!opcion.match) return;
      if (spec.includes(opcion.match)) disponibles.add(opcion.val);
    });
  });

  return MC_ESPECIAL_CATALOG.filter(opcion => opcion.val === 'todas' || disponibles.has(opcion.val));
}

/* Opciones de filtro Sede */
const MC_SEDES = [
  { val:'todas',    label:'Todas las sedes',  match:null },
  { val:'av68',     label:'Av. 68',           match:'Av. 68' },
  { val:'c94',      label:'Calle 94',         match:'Calle 94' },
  { val:'c26',      label:'Calle 26',         match:'Calle 26' },
  { val:'suba',     label:'Suba',             match:'Suba' },
  { val:'kennedy',  label:'Kennedy',          match:'Kennedy' },
  { val:'sanroque', label:'San Roque',        match:'San Roque' },
];

/* ─────────── RENDER MIS CITAS ─────────── */
function renderMisCitas() {
  const lista = document.getElementById('mc-lista');
  if (!lista) return;

  const monthMap = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  function toDateValue(cita) {
    const rawDate = String(cita.fecha || '').toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const match = rawDate.match(/,\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const day = Number(match[1]);
    const month = monthMap[match[2]];
    const year = Number(match[3]);
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
      return Number.MAX_SAFE_INTEGER;
    }

    const minutes = parseToMinutes(cita.hora || '00:00', cita.am || 'a.m.');
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return new Date(year, month, day, hours, mins, 0, 0).getTime();
  }

  // Encontrar el match de especialidad y sede seleccionados
  const mcEspecial = getMcEspecialOptions();
  const especMatch = mcEspecial.find(e => e.val === mcEspec)?.match;
  const sedeMatch  = MC_SEDES.find(s => s.val === mcSede)?.match;

  const filtradas = MIS_CITAS.filter(c => {
    const okEstado = mcEstado === 'todas' || c.estado === mcEstado;
    const okEspec  = !especMatch || c.spec.toLowerCase().includes(especMatch);
    const okSede   = !sedeMatch  || c.loc.includes(sedeMatch);
    return okEstado && okEspec && okSede;
  });

  // Actualizar cabecera dinámica
  const HEADER_CONFIG = {
    proxima:      { icon:'icon-calendar-check', title:'Tus próximas citas',       subtitle:'Revisa, gestiona o consulta los detalles de tus citas agendadas.' },
    cancelada:    { icon:'icon-calendar-x',     title:'Tus citas canceladas',      subtitle:'Consulta las citas que fueron canceladas anteriormente.' },
    pasada:       { icon:'icon-calendar',       title:'Tus citas pasadas',         subtitle:'Historial de citas médicas realizadas.' },
    reprogramada: { icon:'icon-calendar-plus',  title:'Tus citas reprogramadas',   subtitle:'Citas que han sido reprogramadas para una nueva fecha.' },
    todas:        { icon:'icon-calendar',       title:'Todas tus citas',           subtitle:'Vista completa de todas tus citas médicas.' },
  };
  const cfg = HEADER_CONFIG[mcEstado] || HEADER_CONFIG.todas;
  const headIcon = document.getElementById('mc2-head-icon-el');
  const headTitle = document.getElementById('mc2-head-title');
  const headSub = document.getElementById('mc2-head-subtitle');
  if (headIcon) headIcon.className = `icon ${cfg.icon} icon-24`;
  if (headTitle) headTitle.textContent = cfg.title;
  if (headSub) headSub.textContent = cfg.subtitle;

  // Contador
  const countEl = document.getElementById('mc2-count');
  if (countEl) {
    const labelMap = { proxima:'próximas', cancelada:'canceladas', pasada:'pasadas', reprogramada:'reprogramadas', todas:'' };
    const label = labelMap[mcEstado] || '';
    countEl.textContent = label
      ? `${filtradas.length} cita${filtradas.length !== 1 ? 's' : ''} ${label}`
      : `${filtradas.length} cita${filtradas.length !== 1 ? 's' : ''}`;
  }

  if (!filtradas.length) {
    lista.innerHTML = '<div style="text-align:center;padding:48px 20px;color:#767676;font-size:14px;">No tienes citas en esta categoría.</div>';
    return;
  }

  const BADGE = {
    proxima:      { cls:'mc2-badge--proxima',      label:'Próxima' },
    cancelada:    { cls:'mc2-badge--cancelada',    label:'Cancelada' },
    pasada:       { cls:'mc2-badge--pasada',       label:'Pasada' },
    reprogramada: { cls:'mc2-badge--reprogramada', label:'Reprogramada' },
  };

  const ordenadas = filtradas.slice().sort((a, b) => toDateValue(a) - toDateValue(b));

  // Agrupar por fecha
  const grupos = {};
  ordenadas.forEach(c => {
    if (!grupos[c.fecha]) grupos[c.fecha] = [];
    grupos[c.fecha].push(c);
  });

  function formatFecha(raw) {
    return raw.replace(/\b\w/g, l => l.toUpperCase()).toLowerCase()
      .replace(/^\w/, l => l.toUpperCase());
  }

  let html = '';
  Object.entries(grupos).forEach(([fecha, citas]) => {
    html += `
      <div class="mc2-date-sep">
        <span class="icon icon-calendar icon-18" aria-hidden="true"></span>
        <div class="mc2-date-text">${formatFecha(fecha)}</div>
      </div>`;

    citas.forEach(c => {
      const inactiva = c.estado === 'cancelada' || c.estado === 'pasada';
      const cancelIdx = MIS_CITAS.indexOf(c);
      const badge = BADGE[c.estado] || { cls:'mc2-badge--pasada', label: c.estado };
      const hourColor = inactiva ? 'color:#b0b0b0' : '';

      let acciones = '';
      if (c.estado === 'proxima') {
        acciones = `
          <button class="mc2-btn-cancel disabled" type="button" data-cancel-idx="${cancelIdx}" disabled aria-disabled="true">Cancelar</button>
          <button class="mc2-btn-reprog disabled" type="button" data-reagenda-id="${c.id || ''}" disabled aria-disabled="true">Reprogramar</button>
          <button class="mc2-btn-pagar disabled" type="button" disabled aria-disabled="true">Pagar bono</button>`;
      } else if (c.estado === 'cancelada' || c.estado === 'pasada') {
        acciones = `
          <button class="mc2-btn-detalle" type="button">Ver detalle</button>
          <button class="mc2-btn-agendar" type="button">Agendar nuevamente</button>`;
      } else if (c.estado === 'reprogramada') {
        acciones = `
          <button class="mc2-btn-detalle" type="button">Ver detalle</button>
          <button class="mc2-btn-reprog disabled" type="button" data-reagenda-id="${c.id || ''}" disabled aria-disabled="true">Reprogramar</button>`;
      }

      const showBadge = c.estado !== 'proxima';
      html += `
      <div class="mc2-card">
        <div class="mc2-top-row">
          <div class="mc2-hour-box">
            <div class="mc2-hour" style="${hourColor}">${c.hora}</div>
            <div class="mc2-ampm">${c.am}</div>
          </div>
          <div class="mc2-body">
            <div class="mc2-main">
              <div class="mc2-spec-row">
                <span class="mc2-spec">${c.spec}</span>
                ${showBadge ? `<span class="mc2-badge ${badge.cls}">${badge.label}</span>` : ''}
              </div>
              <div class="mc2-info-grid">
                <div class="mc2-col">
                  <div class="mc2-item">
                    <span class="icon icon-user icon-16" aria-hidden="true"></span>
                    <span>${c.doc}</span>
                  </div>
                  <div class="mc2-item">
                    <span class="icon icon-stethoscope icon-16" aria-hidden="true"></span>
                    <span>${c.tipo}</span>
                  </div>
                </div>
                <div class="mc2-col">
                  <div class="mc2-item">
                    <span class="icon icon-map-pin icon-16" aria-hidden="true"></span>
                    <span>${c.loc}</span>
                  </div>
                  <div class="mc2-item">
                    <span class="icon icon-money icon-16" aria-hidden="true"></span>
                    <span>Valor cita: <strong class="mc2-price">${c.precio}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mc2-divider"></div>
        <div class="mc2-actions">${acciones}</div>
      </div>`;
    });
  });

  lista.innerHTML = html;
}
function filtrarMisCitas(estado) {
  mcEstado = estado;
  // Sincronizar mobile chips (DS: aria-pressed + is-selected)
  document.querySelectorAll('#mc-filters .mp-chip').forEach(chip => {
    const sel = chip.dataset.estado === estado;
    chip.setAttribute('aria-pressed', sel ? 'true' : 'false');
    chip.classList.toggle('is-selected', sel);
  });
  // Sincronizar desktop dropdown Estado: opción activa
  document.querySelectorAll('#mc2-dd-estado-menu .mc2-dd-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.estado === estado);
  });
  renderMisCitas();
}

/* ── Desktop dropdowns ── */
function toggleMcDd(wrapperId) {
  const wrap = document.getElementById(wrapperId);
  const isOpen = wrap.classList.contains('open');
  document.querySelectorAll('.mc2-dd-wrap.open').forEach(w => w.classList.remove('open'));
  if (!isOpen) wrap.classList.add('open');
}

function _selMcFilter({ wrapperId, labelId, val, label, optSel, onSet }) {
  const lbl = document.getElementById(labelId);
  if (lbl) lbl.textContent = label;
  const wrap = document.getElementById(wrapperId);
  if (wrap) wrap.classList.remove('open');
  // Marcar opción activa
  if (optSel) document.querySelectorAll(optSel).forEach(opt => {
    opt.classList.toggle('active', opt.dataset.val === val);
  });
  onSet(val);
  renderMisCitas();
}

function selMcEstado(estado, label) {
  _selMcFilter({
    wrapperId:'mc2-dd-estado', labelId:'mc2-estado-label',
    val:estado, label,
    optSel:'#mc2-dd-estado-menu .mc2-dd-opt',
    onSet: v => {
      mcEstado = v;
      // Sincronizar chips mobile
      document.querySelectorAll('#mc-filters .mp-chip').forEach(chip => {
        const sel = chip.dataset.estado === v;
        chip.setAttribute('aria-pressed', sel ? 'true' : 'false');
        chip.classList.toggle('is-selected', sel);
      });
    }
  });
}

function selMcEspec(val, label) {
  _selMcFilter({
    wrapperId:'mc2-dd-espec', labelId:'mc2-espec-label',
    val, label,
    optSel:'#mc2-dd-espec-menu .mc2-dd-opt',
    onSet: v => {
      mcEspec = v;
      const lbl = document.getElementById('mc2-espec-label');
      if (!lbl) return;
      if (v === 'todas') {
        lbl.textContent = 'Especialidad';
        lbl.classList.remove('has-chips');
      } else {
        renderChipValue(lbl, [label], 'Especialidad');
      }
    }
  });
}

function selMcSede(val, label) {
  _selMcFilter({
    wrapperId:'mc2-dd-sede', labelId:'mc2-sede-label',
    val, label,
    optSel:'#mc2-dd-sede-menu .mc2-dd-opt',
    onSet: v => {
      mcSede = v;
      const lbl = document.getElementById('mc2-sede-label');
      if (!lbl) return;
      if (v === 'todas') {
        lbl.textContent = 'Sede';
        lbl.classList.remove('has-chips');
      } else {
        renderChipValue(lbl, [label], 'Sede');
      }
    }
  });
}

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', e => {
  if (!e.target.closest('.mc2-dd-wrap')) {
    document.querySelectorAll('.mc2-dd-wrap.open').forEach(w => w.classList.remove('open'));
  }
});

// Cerrar sidebars con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    cerrarConfirmSidebar();
    closeResultadosModifyPanel();
  }
});

/* ── Generar menús de Especialidad y Sede dinámicamente ── */
function buildMcDropdownMenus() {
  const mcEspecial = getMcEspecialOptions();
  if (!mcEspecial.some(e => e.val === mcEspec)) {
    mcEspec = 'todas';
    const lbl = document.getElementById('mc2-espec-label');
    if (lbl) {
      lbl.textContent = 'Especialidad';
      lbl.classList.remove('has-chips');
    }
  }

  const especMenu = document.getElementById('mc2-dd-espec-menu');
  if (especMenu) {
    especMenu.innerHTML = mcEspecial.map(e =>
      `<button class="mc2-dd-opt${e.val === 'todas' ? ' active' : ''}" data-val="${e.val}"
        onclick="selMcEspec('${e.val}','${e.label}')">${e.label}</button>`
    ).join('');
  }
  const sedeMenu = document.getElementById('mc2-dd-sede-menu');
  if (sedeMenu) {
    sedeMenu.innerHTML = MC_SEDES.map(s =>
      `<button class="mc2-dd-opt${s.val === 'todas' ? ' active' : ''}" data-val="${s.val}"
        onclick="selMcSede('${s.val}','${s.label}')">${s.label}</button>`
    ).join('');
  }
}

function resetMisCitasFilters() {
  mcEstado = 'proxima';
  mcEspec = 'todas';
  mcSede = 'todas';

  const estadoLabel = document.getElementById('mc2-estado-label');
  if (estadoLabel) estadoLabel.textContent = 'Próximas';

  const especLabel = document.getElementById('mc2-espec-label');
  if (especLabel) {
    especLabel.textContent = 'Especialidad';
    especLabel.classList.remove('has-chips');
  }

  const sedeLabel = document.getElementById('mc2-sede-label');
  if (sedeLabel) {
    sedeLabel.textContent = 'Sede';
    sedeLabel.classList.remove('has-chips');
  }

  document.querySelectorAll('#mc-filters .mp-chip').forEach(chip => {
    const isSelected = chip.dataset.estado === 'proxima';
    chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    chip.classList.toggle('is-selected', isSelected);
  });

  document.querySelectorAll('#mc2-dd-estado-menu .mc2-dd-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.estado === 'proxima');
  });

  buildMcDropdownMenus();
  document.querySelectorAll('.mc2-dd-wrap.open').forEach(w => w.classList.remove('open'));
  renderMisCitas();
}

function resetNuevaCitaForm() {
  syncHomeFromDemoDefaults();
  closeAllPanels();
  closeResultadosModifyPanel();
  cerrarConfirmSidebar();

  const errEsp = document.getElementById('err-esp');
  const errSede = document.getElementById('err-sede');
  const alertForm = document.getElementById('alert-form');
  const btnEsp = document.getElementById('btn-esp');
  const btnSede = document.getElementById('btn-sede');

  if (errEsp) errEsp.style.display = 'none';
  if (errSede) errSede.style.display = 'none';
  if (alertForm) alertForm.style.display = 'none';
  if (btnEsp) btnEsp.classList.remove('error');
  if (btnSede) btnSede.classList.remove('error');
}

/* ─────────── RENDER CITAS ─────────── */
function renderCitas() {
  const lista = document.getElementById('lista-citas');
  if (!lista) return;
  const citas = CITAS.filter(FILTROS[selectedFiltro]);
  if (!citas.length) {
    lista.innerHTML = '<div style="text-align:center;padding:40px;color:#767676;font-size:14px;">No hay citas disponibles con el filtro seleccionado.</div>';
    return;
  }
  lista.innerHTML = citas.map((c, i) => `
    <div class="appt-item" onclick="seleccionarCita(${i})">
      <div class="appt-time">
        <div class="appt-time-hour">${c.hora}</div>
        <div class="appt-time-am">a.m.</div>
      </div>
      <div class="appt-div"></div>
      <div class="appt-body">
        <div class="appt-name">${c.doc}</div>
        <div class="appt-spec">${c.spec}</div>
        ${c.tratante ? '<div class="appt-badges"><span class="badge badge-blue"><span class="icon icon-star icon-16 gs-inherit" aria-hidden="true"></span> Médico tratante</span></div>' : ''}
        <div class="appt-loc"><span class="icon icon-map-pin icon-16 gs-muted" aria-hidden="true"></span> ${c.loc}</div>
      </div>
      <div class="appt-arrow"><span class="icon icon-caret-right icon-24 gs-muted" aria-hidden="true"></span></div>
    </div>
  `).join('') + (citas.length >= 8 ? `<div class="appt-more"><button class="btn-outline">Más horarios disponibles</button></div>` : '');
}

/* ─────────── NAVIGATION ─────────── */
function goTo(id) {
  if (id === 's-home') {
    resetMisCitasFilters();
    resetNuevaCitaForm();
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // update sidebar active
  // El estado activo del menú ZT lo define data-active en zt-sidebar.js (no se cambia por pantalla).
}
function switchTab(tab) {
  if (tab === 'nueva') goTo('s-home');
  if (tab === 'mis')   goTo('s-mis-citas');
}
async function goToResultados() {
  const espVal = document.getElementById('val-esp');
  const sinEsp = espVal.classList.contains('is-placeholder');
  const sinSede = selectedSedes.length === 0;

  const errEsp    = document.getElementById('err-esp');
  const errSede   = document.getElementById('err-sede');
  const alertForm = document.getElementById('alert-form');
  const btnEsp    = document.getElementById('btn-esp');
  const btnSede   = document.getElementById('btn-sede');

  errEsp.style.display    = 'none';
  errSede.style.display   = 'none';
  alertForm.style.display = 'none';
  btnEsp.classList.remove('error');
  btnSede.classList.remove('error');

  if (sinEsp || sinSede) {
    if (sinEsp)  { errEsp.style.display  = 'flex'; btnEsp.classList.add('error'); }
    if (sinSede) { errSede.style.display = 'flex'; btnSede.classList.add('error'); }
    alertForm.style.display = 'flex';
    alertForm.scrollIntoView({ behavior:'smooth', block:'nearest' });
    return;
  }

  selectedFiltro = 'todos';
  await ensureMedicalCentersDbLoaded();
  syncResultadosFromNuevaCita();
  renderResultadosCitas();
  goTo('s-resultados');
}
function seleccionarCita(idx) {
  // Obtener cita seleccionada
  const citas = CITAS.filter(FILTROS[selectedFiltro]);
  const c = (idx !== undefined && citas[idx]) ? citas[idx] : citas[0];

  // Poblar sidebar con datos de la cita
  const fechaLabel = getDateLabelByKey(selectedFecha);
  const espLabel   = document.getElementById('val-esp')?.textContent.trim() || c.spec;

  // Separar nombre de sede y dirección (loc contiene "Sede, Dirección")
  const locParts = c.loc.split(',');
  const locName  = locParts[0].trim();
  const locAddr  = locParts.slice(1).join(',').trim();

  document.getElementById('csb-doc-name').textContent     = c.doc;
  document.getElementById('csb-doc-spec').textContent     = c.spec;
  document.getElementById('csb-especialidad').textContent = espLabel;
  document.getElementById('csb-fecha').textContent        = `${fechaLabel} · ${c.hora} a.m.`;
  document.getElementById('csb-loc-name').textContent     = locName;
  document.getElementById('csb-loc-addr').textContent     = locAddr;

  // Guardar para uso posterior al confirmar
  window._pendingCita = { c, fechaLabel, espLabel };

  // Abrir sidebar DS
  document.getElementById('confirm-sidebar').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function cerrarConfirmSidebar() {
  document.getElementById('confirm-sidebar').classList.remove('is-open');
  document.body.style.overflow = '';
}

function confirmarCita() {
  const p    = window._pendingCita || {};
  const appt = resSelectedAppt || {};

  // Número de autorización aleatorio (8 dígitos)
  const authNum = String(Math.floor(10000000 + Math.random() * 90000000));

  // Doctor & especialidad
  const c        = p.c || {};
  const docName  = appt.doctor    || c.doc  || '—';
  const docSpec  = appt.specialty || c.spec || p.espLabel || '—';
  const docPrice = appt.price     || '$0';

  // Fecha y hora
  const fechaLabel = p.fechaLabel || '—';
  const horaLabel  = appt.time
    ? `${appt.time} ${appt.period || ''}`.trim()
    : (c.hora ? `${c.hora} a.m.` : '—');
  const fechaHora  = horaLabel !== '—' ? `${fechaLabel} · ${horaLabel}` : fechaLabel;

  // Sede / dirección
  const locName = appt.center  || (c.loc ? c.loc.split(',')[0].trim() : '—');
  const locAddr = appt.address || (c.loc ? c.loc.split(',').slice(1).join(',').trim() : '');

  // Especialidad para el grid de detalle
  const espDisplay = appt.specialty || p.espLabel || c.spec || '—';

  // Poblar campos cfm-*
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('cfm-doc-name',    docName);
  set('cfm-doc-spec',    docSpec);
  set('cfm-auth-num',    authNum);
  set('cfm-especialidad', espDisplay);
  set('cfm-fecha',       fechaHora);
  set('cfm-loc-name',    locName);
  set('cfm-loc-addr',    locAddr);
  set('cfm-price',       docPrice);

  const confirmationPayload = {
    docName,
    docSpec,
    authNum,
    espDisplay,
    fechaHora,
    locName,
    locAddr,
    docPrice,
  };

  try {
    window.sessionStorage.setItem('compensarConfirmacionCita', JSON.stringify(confirmationPayload));
  } catch (error) {
    console.warn('No se pudo persistir la confirmacion en sessionStorage:', error);
  }

  // Retrocompat
  const legacyFecha = document.getElementById('confirm-fecha');
  if (legacyFecha) legacyFecha.textContent = fechaLabel;

  // Marcar como agendado → habilita médico tratante en segunda visita
  hasBooked = true;
  bookedSpec = espDisplay;

  // Cerrar sidebar y navegar
  cerrarConfirmSidebar();
  saveHomeRoute();
  window.location.href = resolveAppRoute('finalConfirmation', 'final-1.html');
}

/* ─────────── RESPONSIVE (layout) ─────────── */
function checkDesktop() {
  // médico tratante se controla por actualizarMedicoTratante()
}
window.addEventListener('resize', checkDesktop);

/* ─────────── OVERLAYS ─────────── */
function openOverlay(id)  { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
function closeOut(e, id)  { if (e.target.id === id) closeOverlay(id); }

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderChipValue(el, labels, fallbackText) {
  if (!el) return;
  if (!labels || labels.length === 0) {
    el.textContent = fallbackText;
    el.classList.remove('has-chips');
    el.classList.add('is-placeholder');
    return;
  }

  el.innerHTML = labels
    .map(label => `<span class="ui-chip-violet">${escapeHtml(label)}</span>`)
    .join('');
  el.classList.add('has-chips');
  el.classList.remove('is-placeholder');
}

/* ─────────── DROPDOWN PANELS ─────────── */
function togglePanel(panelId, btnId) {
  const panel = document.getElementById(panelId);
  const btn   = document.getElementById(btnId);
  const isOpen = panel.classList.contains('open');
  // cerrar todos los paneles abiertos
  document.querySelectorAll('.mp-dropdown__panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.mp-dropdown__trigger[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
  if (!isOpen) {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded','true');
  }
}
function closeAllPanels() {
  document.querySelectorAll('.mp-dropdown__panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.mp-dropdown__trigger[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.mp-dropdown')) closeAllPanels();
});

/* ─────────── ESPECIALIDAD ─────────── */
function pickEsp(val) {
  const valEl = document.getElementById('val-esp');
  valEl.textContent = val;
  valEl.classList.remove('is-placeholder');
  closeAllPanels();
  actualizarMedicoTratante();
}

/* ─────────── MÉDICO TRATANTE ─────────── */
function actualizarMedicoTratante() {
  const espActual = document.getElementById('val-esp').textContent.trim();
  const mostrar = hasBooked && bookedSpec && espActual === bookedSpec;
  const mtEl = document.getElementById('mt-wrap');
  if (mostrar) {
    mtEl.style.display = 'flex';
  } else {
    mtEl.style.display = 'none';
    mtChecked = false;
    const chk = document.getElementById('mt-check');
    chk.checked = false;
  }
}

function toggleMT() {
  const chk = document.getElementById('mt-check');
  chk.checked = !chk.checked;
  mtChecked = chk.checked;
}

/* ─────────── SEDES ─────────── */
function toggleSede(id) {
  const chk = document.getElementById('chk-' + id);
  const isChecked = chk.checked;
  if (!isChecked) {
    const idx = selectedSedes.indexOf(id);
    if (idx > -1) selectedSedes.splice(idx, 1);
  } else {
    if (selectedSedes.length >= 3) {
      chk.checked = false;
      return;
    }
    if (!selectedSedes.includes(id)) selectedSedes.push(id);
  }
  actualizarBloqueoSedes();
  const valEl = document.getElementById('val-sede');
  renderChipValue(
    valEl,
    selectedSedes.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
    'Selecciona hasta 3 centros médicos'
  );
}
function actualizarBloqueoSedes() {
  const valEsp = document.getElementById('val-esp');
  const hasSpecialty = Boolean(valEsp && !valEsp.classList.contains('is-placeholder'));
  const btnSede = document.getElementById('btn-sede');
  const panelSede = document.getElementById('panel-sede');

  if (btnSede) {
    btnSede.disabled = !hasSpecialty;
    btnSede.setAttribute('aria-disabled', String(!hasSpecialty));
  }

  if (!hasSpecialty) {
    selectedSedes = [];
    if (panelSede) panelSede.classList.remove('open');
    if (btnSede) btnSede.setAttribute('aria-expanded', 'false');

    document.querySelectorAll('#panel-sede .mp-choice__input').forEach(input => {
      input.checked = false;
    });

    const valSede = document.getElementById('val-sede');
    if (valSede) {
      renderChipValue(valSede, [], 'Selecciona hasta 3 centros médicos');
    }
  }

  const maxReached = selectedSedes.length >= 3;
  document.querySelectorAll('#panel-sede .ol-choice').forEach(label => {
    const itemId = label.dataset.id;
    const isSelected = selectedSedes.includes(itemId);
    if (!hasSpecialty || (maxReached && !isSelected)) {
      label.classList.add('disabled');
      label.style.opacity = '0.38';
      label.style.pointerEvents = 'none';
    } else {
      label.classList.remove('disabled');
      label.style.opacity = '1';
      label.style.pointerEvents = 'auto';
    }
  });
}
function confirmarSede() {
  const valEl = document.getElementById('val-sede');
  renderChipValue(
    valEl,
    selectedSedes.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
    'Selecciona hasta 3 centros médicos'
  );
  closeAllPanels();
}

/* ─────────── FECHA ─────────── */
function pickFecha(key) {
  selectedFecha = key;
  ['5','6','7','8'].forEach(k => {
    const radio = document.getElementById('drad-'+k);
    const opt = document.getElementById('dopt-'+k);
    radio.checked = k === key;
    opt.classList.toggle('on', k === key);
  });
}
function confirmarFecha() {
  const fechaLabel = getDateLabelByKey(selectedFecha);
  const fechaDisplay = document.getElementById('fecha-display');
  if (fechaDisplay) fechaDisplay.textContent = fechaLabel;
  document.getElementById('confirm-fecha').textContent = fechaLabel;
  renderCitas();
  closeOverlay('o-fecha');
}

/* ─────────── FILTRO MÉDICO ─────────── */
function pickFiltro(key) {
  selectedFiltro = key;
  ['todos','alejandra','vanessa','luciana','victor'].forEach(k => {
    const radio = document.getElementById('frad-'+k);
    radio.checked = k === key;
  });
}
function aplicarFiltro() { renderCitas(); closeOverlay('o-filtros'); }

/* ─────────── RESULTADOS SCREEN ─────────── */

// Datos de citas disponibles para mostrar en resultados
const CITAS_DISPONIBLES = [
  {
    time: '08:00', period: 'a.m.',
    doctor: 'Dra. Alejandra Sierra', specialty: 'Dermatología',
    isPrimaryDoctor: true,
    center: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cundinamarca, Cajicá',
    modality: 'Presencial', price: '$46,990'
  },
  {
    time: '08:25', period: 'a.m.',
    doctor: 'Dra. Alejandra Sierra', specialty: 'Dermatología',
    isPrimaryDoctor: true,
    center: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cundinamarca, Cajicá',
    modality: 'Presencial', price: '$46,990'
  },
  {
    time: '08:50', period: 'a.m.',
    doctor: 'Dra. Alejandra Sierra', specialty: 'Dermatología',
    isPrimaryDoctor: true,
    center: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cundinamarca, Cajicá',
    modality: 'Presencial', price: '$46,990'
  },
  {
    time: '09:15', period: 'a.m.',
    doctor: 'Dra. Alejandra Sierra', specialty: 'Dermatología',
    isPrimaryDoctor: true,
    center: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cundinamarca, Cajicá',
    modality: 'Presencial', price: '$46,990'
  },
  {
    time: '09:40', period: 'a.m.',
    doctor: 'Dr. Víctor García', specialty: 'Dermatología',
    isPrimaryDoctor: false,
    center: 'San Roque', address: 'Km 7 vía Cajicá-Chía, Cundinamarca, Cajicá',
    modality: 'Presencial', price: '$48,500'
  },
];

let resSelectedAppt = null; // Cita seleccionada desde resultados
let resSelectedDoctor = 'Médico tratante';
let resSelectedModality = 'Presencial';
let resSelectedSort = 'Hora más temprana';
let resSelectedSedeId = 'sanroque';
let resVisibleCount = 7;

function formatTimeFromMinutes(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hour24 >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = hour24 % 12 || 12;
  return {
    time: `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    period,
  };
}

function parseToMinutes(timeStr, periodStr) {
  const [hh, mm] = timeStr.split(':').map(Number);
  let hour = hh % 12;
  if (periodStr === 'p.m.') hour += 12;
  return hour * 60 + mm;
}

function getSelectedSpecialty() {
  const espEl = document.getElementById('val-esp');
  return espEl && !espEl.classList.contains('is-placeholder')
    ? espEl.textContent.trim()
    : 'Dermatología';
}

function getSelectedSpecialtyId() {
  const specialtyName = getSelectedSpecialty();
  const specialty = (demoData?.specialties || []).find(item => item.name === specialtyName);
  return specialty?.id || 'dermatologia';
}

function getDateEntries() {
  const dates = demoData?.meta?.dateRange
    ? [demoData.meta.dateRange.from, demoData.meta.dateRange.to].filter(Boolean)
    : [];

  return dates.map((isoDate, index) => {
    const slot = (demoData?.availability || []).find(item => item.date === isoDate);
    const dateObj = new Date(`${isoDate}T12:00:00`);
    const day = slot?.dayLabel || dateObj.toLocaleDateString('es-CO', { weekday: 'long' });
    const label = `${day.charAt(0).toUpperCase() + day.slice(1)}, ${dateObj.getDate()} ${dateObj.toLocaleDateString('es-CO', { month: 'long' })} ${dateObj.getFullYear()}`;
    return { key: String(index + 5), isoDate, label };
  });
}

function getSelectedIsoDate() {
  const entry = getDateEntries().find(item => item.key === selectedFecha);
  return entry?.isoDate || demoData?.meta?.dateRange?.from || '2026-06-05';
}

function getDateLabelByKey(key) {
  return getDateEntries().find(item => item.key === key)?.label || FECHAS[key] || FECHAS['5'];
}

function getFirstAvailableDateKeyForSpecialty(specialtyId) {
  if (!specialtyId) return null;

  const specialty = (demoData?.specialties || []).find(item => item.id === specialtyId);
  const availableDates = specialty?.availableDates || [];
  if (!availableDates.length) return null;

  const dateEntries = getDateEntries();
  const match = dateEntries.find(entry => availableDates.includes(entry.isoDate));
  return match?.key || null;
}

function getAvailableCenterIdsForSpecialty(specialtyId, isoDate = null) {
  const allCenterIds = (demoData?.medicalCenters || []).map(center => center.id);
  if (!specialtyId) return allCenterIds;

  const available = new Set(
    (demoData?.availability || [])
      .filter(slot => slot.isAvailable)
      .filter(slot => slot.specialtyId === specialtyId)
      .filter(slot => !isoDate || slot.date === isoDate)
      .map(slot => normalizeCenterId(slot.centerId))
  );

  return allCenterIds.filter(centerId => available.has(centerId));
}

function getHomeSpecialtySelection() {
  const valEl = document.getElementById('val-esp');
  if (!valEl || valEl.classList.contains('is-placeholder')) return null;
  return getSelectedSpecialtyId();
}

function getHomeIsoDateSelection() {
  const dateEntries = getDateEntries();
  const selectedEntry = dateEntries.find(item => item.key === selectedFecha);
  return selectedEntry?.isoDate || null;
}

function getFilteredCenterIdsForHome() {
  const specialtyId = getHomeSpecialtySelection();
  const available = getAvailableCenterIdsForSpecialty(specialtyId);
  const allCenterIds = (demoData?.medicalCenters || []).map(center => center.id);
  return available.length ? available : allCenterIds;
}

function syncCenterSelectionsToAvailability(context = '') {
  const suffix = context === 'mod' ? '-mod' : '';
  const specialtyId = context === 'mod' ? getHomeSpecialtySelection() : getHomeSpecialtySelection();
  const available = getAvailableCenterIdsForSpecialty(specialtyId);
  const allowedCenterIds = available.length ? available : (demoData?.medicalCenters || []).map(center => center.id);

  if (context !== 'mod') {
    const before = [...selectedSedes];
    selectedSedes = selectedSedes.filter(id => allowedCenterIds.includes(id));
    if (before.length !== selectedSedes.length) {
      document.querySelectorAll('#panel-sede .mp-choice__input').forEach(input => {
        input.checked = selectedSedes.includes(input.id.replace('chk-', ''));
      });
    }

    const valEl = document.getElementById('val-sede');
    renderChipValue(
      valEl,
      selectedSedes.map(id => SEDES_LABEL[id] || getCenterDisplayLabel(id)),
      'Selecciona hasta 3 centros médicos'
    );
  }

  const panels = [
    document.querySelector('#panel-sede'),
    document.querySelector('#panel-sede-mod'),
  ];

  panels.forEach(panel => {
    if (!panel) return;
    panel.querySelectorAll('.ol-choice').forEach(label => {
      const itemId = label.dataset.id;
      const isAllowed = allowedCenterIds.includes(itemId);
      label.style.display = isAllowed ? '' : 'none';
      const checkbox = label.querySelector('.mp-choice__input');
      if (checkbox && !isAllowed) checkbox.checked = false;
    });
  });

  return allowedCenterIds;
}

function buildDateOptionsHtml(context = '') {
  const entries = getDateEntries();
  if (!entries.length) return '';

  const suffix = context === 'mod' ? '-mod' : context === 'res' ? '-res' : context === 'res-modal' ? '-res-modal' : '';
  const entriesByIso = new Map(entries.map(entry => [entry.isoDate, entry]));
  const monthKeys = [...new Set(entries.map(entry => entry.isoDate.slice(0, 7)).sort())];

  const WEEK_DAYS = ['S','M','T','W','T','F','S'];
  const selectedEntry = entries.find(e => String(selectedFecha) === e.key);
  const selectedColIndex = selectedEntry
    ? new Date(`${selectedEntry.isoDate}T12:00:00`).getDay()
    : -1;

  const weekdayHeaders = WEEK_DAYS.map((d, i) =>
    `<span${i === selectedColIndex ? ' class="cal-col-active"' : ''}>${d}</span>`
  ).join('');

  return monthKeys.map(monthKey => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startOffset = firstDay.getDay(); // Sunday-first

    const monthTitleRaw = new Date(year, monthIndex, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const monthTitle = monthTitleRaw.charAt(0).toUpperCase() + monthTitleRaw.slice(1);

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push('<span class="cal-day is-empty" aria-hidden="true"></span>');
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isoDate = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
      const entry = entriesByIso.get(isoDate);
      if (!entry) {
        cells.push(`<span class="cal-day is-disabled" aria-hidden="true"><span>${day}</span></span>`);
        continue;
      }
      const isActive = String(selectedFecha) === entry.key;
      const onPick = context === 'res'
        ? `pickResultadosFecha('${entry.key}')`
        : context === 'res-modal'
          ? `pickCalendarModalDate('${entry.key}')`
          : `pickFecha('${entry.key}'${context ? `, '${context}'` : ''})`;
      cells.push(`<button type="button"
        class="cal-day is-available${isActive ? ' is-selected' : ''}"
        id="dopt-${entry.key}${suffix}"
        onclick="${onPick}"
        aria-label="${entry.label}"><span>${day}</span></button>`);
    }

    const footerBtns = context === '' ? `
      <div class="cal-footer-btns">
        <button class="cal-btn-cerrar" type="button" onclick="closeOverlay('o-fecha')">Cerrar</button>
        <button class="cal-btn-buscar" type="button" onclick="confirmarFecha()">Buscar</button>
      </div>` : '';

    return `
      <div class="calendar-picker">
        <div class="cal-body">
          <div class="cal-picker-inner">
            <div class="cal-header">
              <button class="cal-nav-btn" type="button" aria-label="Mes anterior">&#8249;</button>
              <span class="cal-month-title">${monthTitle}</span>
              <button class="cal-nav-btn" type="button" aria-label="Mes siguiente">&#8250;</button>
            </div>
            <div class="cal-weekdays" aria-hidden="true">${weekdayHeaders}</div>
            <div class="cal-grid">${cells.join('')}</div>
          </div>
          <div class="cal-legend">
            <div class="cal-legend-item"><span class="cal-legend-dot cal-legend-dot--available"></span>Agendas disponibles</div>
            <div class="cal-legend-item"><span class="cal-legend-dot cal-legend-dot--selected"></span>Día seleccionado</div>
          </div>
        </div>${footerBtns}
      </div>`;
  }).join('');
}

function applyReagendaPreset(cita) {
  const specialtyLabel = getNormalizedSpecialtyLabel(cita?.spec || 'Dermatología');
  const citaCenterId = getCenterIdFromLocation(cita?.loc || '');

  const valEsp = document.getElementById('val-esp');
  if (valEsp) {
    valEsp.textContent = specialtyLabel;
    valEsp.classList.remove('is-placeholder');
  }

  selectedSedes = citaCenterId ? [citaCenterId] : [];
  renderHomeDropdownData();

  if (!selectedSedes.length) {
    const fallbackCenters = getFilteredCenterIdsForHome();
    selectedSedes = fallbackCenters.length ? [fallbackCenters[0]] : [];
    syncCenterSelectionsToAvailability();
  }

  const specialtyId = (demoData?.specialties || []).find(item => item.name === specialtyLabel)?.id || null;
  const nextDateKey = getFirstAvailableDateKeyForSpecialty(specialtyId) || '5';
  selectedFecha = nextDateKey;
  pickFecha(nextDateKey);
  updateResultadosTitle();
}

function openAgendaFromReagenda(cita) {
  applyReagendaPreset(cita || {});
  syncResultadosFromNuevaCita();
  renderResultadosCitas();
  goTo('s-resultados');
}

function reagendarCita(citaId) {
  const cita = MIS_CITAS.find(item => (item.id || '') === citaId) || MIS_CITAS.find(item => item.estado === 'proxima');
  const payload = {
    citaId: cita?.id || '',
    fallback: {
      spec: cita?.spec || '',
      loc: cita?.loc || '',
    },
  };

  try {
    window.sessionStorage.setItem('compensarReagendaPrueba1', JSON.stringify(payload));
  } catch (error) {
    console.warn('No se pudo persistir el contexto de reagendamiento para prueba-1:', error);
  }

  window.location.href = resolveAppRoute('agendaPrueba1', 'agenda-1.html');
}

function setupMisCitasActions() {
  const lista = document.getElementById('mc-lista');
  if (!lista || lista.dataset.actionsBound === 'true') return;

  lista.addEventListener('click', event => {
    // Reprogramar
    const reprogBtn = event.target.closest('.mc2-btn-reprog');
    if (reprogBtn && !reprogBtn.classList.contains('disabled')) {
      reagendarCita(reprogBtn.getAttribute('data-reagenda-id') || '');
      return;
    }
    // Cancelar
    const cancelBtn = event.target.closest('.mc2-btn-cancel');
    if (cancelBtn && !cancelBtn.classList.contains('disabled')) {
      openCancelModal(parseInt(cancelBtn.getAttribute('data-cancel-idx') || '0', 10));
    }
  });

  lista.dataset.actionsBound = 'true';
}

/* ── MODAL CANCELAR CITA ── */
function ensureCancelModal() {
  let modal = document.getElementById('cancel-cita-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'cancel-cita-modal';
  modal.className = 'mp-modal-wrap';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cancel-cita-title');
  modal.innerHTML = `
    <div class="mp-modal mp-modal--warning">
      <div class="mp-modal__content">
        <button class="mp-modal__close" type="button" id="btn-cancel-close" aria-label="Cerrar">
          <span class="icon icon-x icon-24" aria-hidden="true"></span>
        </button>
        <div class="mp-modal__icon">
          <span class="icon icon-warning icon-32" aria-hidden="true"></span>
        </div>
        <h2 class="mp-modal__title" id="cancel-cita-title">¿Quieres cancelar esta cita?</h2>
        <p class="mp-modal__body" id="cancel-cita-desc">Si cancelas tu cita, no podrás recuperarla. Si lo prefieres, puedes reprogramar tu consulta para una nueva fecha y hora.</p>
        <div class="mp-modal__actions">
          <button type="button" class="btn-outline" id="btn-cancel-volver">Volver</button>
          <button type="button" class="btn-primary" id="btn-cancel-confirm">Sí, cancelar cita</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeCancelModal(); });
  modal.querySelector('#btn-cancel-close').addEventListener('click', closeCancelModal);
  modal.querySelector('#btn-cancel-volver').addEventListener('click', closeCancelModal);
  modal.querySelector('#btn-cancel-confirm').addEventListener('click', confirmarCancelacionCita);
  return modal;
}

function openCancelModal(idx) {
  const citas = MIS_CITAS.filter(c => c.estado === 'proxima');
  const cita = citas[idx] || MIS_CITAS[idx] || null;
  if (!cita) return;
  window._pendingCancelIdx = MIS_CITAS.indexOf(cita);
  const modal = ensureCancelModal();
  const desc = modal.querySelector('#cancel-cita-desc');
  if (desc && cita.spec) {
    desc.textContent = `Si cancelas tu cita, no podrás recuperarla. Si lo prefieres, puedes reprogramar tu consulta para una nueva fecha y hora.`;
  }
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
  const modal = document.getElementById('cancel-cita-modal');
  if (modal) modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

function confirmarCancelacionCita() {
  const idx = window._pendingCancelIdx;
  if (idx !== undefined && MIS_CITAS[idx]) {
    MIS_CITAS[idx].estado = 'cancelada';
  }
  closeCancelModal();
  renderMisCitas();
}

function getCenterIdsForResultados() {
  return [...selectedSedes];
}

function getCenterDisplayLabel(id) {
  if (id === 'todos') return 'Todos';
  const center = medicalCentersDb[normalizeCenterId(id)];
  return center ? center.shortName : (SEDES_RESULTADOS_LABEL[id] || SEDES_LABEL[id] || id);
}

function getDoctorsForResultados() {
  const specialty = getSelectedSpecialty();
  const centerIds = resSelectedSedeId === 'todos'
    ? getCenterIdsForResultados()
    : [normalizeCenterId(resSelectedSedeId) || getCenterIdsForResultados()[0]];

  if (!centerIds.length) return [];

  const doctorsMap = new Map();
  centerIds.forEach(centerId => {
    const center = medicalCentersDb[centerId];
    if (!center) return;
    center.doctors
      .filter(doc => doc.specialties.includes(specialty))
      .forEach(doc => {
        if (!doctorsMap.has(doc.name)) doctorsMap.set(doc.name, doc);
      });
  });
  return [...doctorsMap.values()];
}

function reconcileResultadosSelection() {
  const specialtyId = getHomeSpecialtySelection();
  const selectedIsoDate = getSelectedIsoDate();
  const homeCenterIds = getCenterIdsForResultados();
  const availableCenterIds = homeCenterIds.filter(id => {
    const allowedCenterIds = getAvailableCenterIdsForSpecialty(specialtyId, selectedIsoDate);
    return !allowedCenterIds.length || allowedCenterIds.includes(normalizeCenterId(id));
  });

  if (resSelectedSedeId !== 'todos' && availableCenterIds.length && !availableCenterIds.includes(normalizeCenterId(resSelectedSedeId))) {
    resSelectedSedeId = availableCenterIds[0];
  }

  const doctors = getDoctorsForResultados();
  const doctorNames = doctors.map(doc => doc.name);
  const hasPrimaryDoctor = doctors.some(doc => doc.isPrimaryDoctor);
  const citasDelDia = getCitasDisponiblesDelDia();
  const availableDoctorNames = [...new Set(citasDelDia.map(cita => cita.doctor).filter(Boolean))];
  const hasPrimaryDoctorSlot = citasDelDia.some(cita => cita.isPrimaryDoctor);

  if (resSelectedDoctor === 'Médico tratante' && (!hasPrimaryDoctor || !hasPrimaryDoctorSlot)) {
    resSelectedDoctor = availableDoctorNames.length ? 'Todos' : '';
  } else if (
    resSelectedDoctor
    && resSelectedDoctor !== 'Todos'
    && resSelectedDoctor !== 'Médico tratante'
    && (!doctorNames.includes(resSelectedDoctor) || !availableDoctorNames.includes(resSelectedDoctor))
  ) {
    resSelectedDoctor = availableDoctorNames.length ? 'Todos' : '';
  }

  const modalidades = [...new Set(getCitasDisponiblesDelDia().map(item => item.modality).filter(Boolean))];
  if (modalidades.length && !modalidades.includes(resSelectedModality)) {
    resSelectedModality = modalidades.includes('Presencial') ? 'Presencial' : modalidades[0];
  }
}

function getPrimaryDoctorLabel() {
  const primaryDoctor = getDoctorsForResultados().find(doc => doc.isPrimaryDoctor);
  return primaryDoctor ? `Médico tratante · ${primaryDoctor.name}` : 'Médico tratante';
}

function getCitasDisponiblesDelDia() {
  const specialty = getSelectedSpecialty();
  const specialtyId = getSelectedSpecialtyId();
  const selectedIsoDate = getSelectedIsoDate();
  const centerIds = resSelectedSedeId === 'todos'
    ? getCenterIdsForResultados()
    : [normalizeCenterId(resSelectedSedeId) || getCenterIdsForResultados()[0]];

  if (!centerIds.length) return [];

  return (demoData?.availability || [])
    .filter(slot => slot.isAvailable)
    .filter(slot => slot.specialtyId === specialtyId)
    .filter(slot => slot.date === selectedIsoDate)
    .filter(slot => centerIds.includes(normalizeCenterId(slot.centerId)))
    .map(slot => {
      const centerId = normalizeCenterId(slot.centerId);
      const center = medicalCentersDb[centerId];
      const doctor = center?.doctors.find(item => item.id === slot.doctorId || item.name === slot.doctorName);
      const [hh, mm] = slot.startTime.split(':');
      const hour24 = Number(hh);
      const period = hour24 >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hour24 % 12 || 12;
      return {
        id: slot.id,
        time: `${String(hour12).padStart(2, '0')}:${mm}`,
        period,
        doctor: slot.doctorName,
        doctorId: slot.doctorId,
        specialty,
        specialtyId,
        isPrimaryDoctor: slot.tags.includes('Médico tratante') || Boolean(doctor?.isPrimaryDoctor),
        center: slot.centerShortName,
        centerId,
        address: slot.address,
        modality: slot.modality,
        price: slot.payment?.bonusAmountCOP ? `$${slot.payment.bonusAmountCOP.toLocaleString('es-CO')}` : '$0',
        tags: slot.tags || [],
      };
    });
}

function ensureResultadosModalidadDisponible() {
  const citas = getCitasDisponiblesDelDia();
  if (!citas.length) return;

  const modalidades = [...new Set(citas.map(item => item.modality).filter(Boolean))];
  if (!modalidades.length) return;

  if (resSelectedModality && modalidades.includes(resSelectedModality)) return;

  resSelectedModality = modalidades.includes('Presencial') ? 'Presencial' : modalidades[0];
  const modalityEl = document.getElementById('res-filter-modality');
  if (modalityEl) modalityEl.textContent = resSelectedModality;
}

function renderResultadosCitas() {
  const lista = document.getElementById('res-lista-citas');
  const empty = document.getElementById('res-empty');
  const error = document.getElementById('res-error');
  const moreWrap = document.querySelector('.resultados-more');
  
  if (!lista) return;
  
  empty.style.display = 'none';
  error.style.display = 'none';
  
  let citasFiltradas = [...getCitasDisponiblesDelDia()];

  if (resSelectedModality) {
    citasFiltradas = citasFiltradas.filter(c => c.modality === resSelectedModality);
  }

  if (resSelectedSedeId) {
    const sedeTarget = getCenterDisplayLabel(resSelectedSedeId);
    if (resSelectedSedeId !== 'todos') {
      citasFiltradas = citasFiltradas.filter(c => c.center === sedeTarget || c.center.includes(sedeTarget));
    }
  }

  if (resSelectedDoctor === 'Médico tratante') {
    citasFiltradas = citasFiltradas.filter(c => c.isPrimaryDoctor);
  } else if (resSelectedDoctor && resSelectedDoctor !== 'Todos') {
    citasFiltradas = citasFiltradas.filter(c => c.doctor === resSelectedDoctor);
  }

  if (resSelectedSort === 'Hora más temprana') {
    citasFiltradas = citasFiltradas.slice().sort((a, b) => {
      return parseToMinutes(a.time, a.period) - parseToMinutes(b.time, b.period);
    });
  } else if (resSelectedSort === 'Hora más tarde') {
    citasFiltradas = citasFiltradas.slice().sort((a, b) => {
      return parseToMinutes(b.time, b.period) - parseToMinutes(a.time, a.period);
    });
  } else if (resSelectedSort === 'Sede') {
    citasFiltradas = citasFiltradas.slice().sort((a, b) => a.center.localeCompare(b.center, 'es'));
  } else if (resSelectedSort === 'Médico') {
    citasFiltradas = citasFiltradas.slice().sort((a, b) => a.doctor.localeCompare(b.doctor, 'es'));
  }

  if (citasFiltradas.length === 0) {
    lista.style.display = 'none';
    if (moreWrap) moreWrap.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  const citasVisibles = citasFiltradas.slice(0, resVisibleCount);
  lista.style.display = 'flex';
  lista.innerHTML = citasVisibles.map((appt, idx) => `
    <div class="res-appt-card" onclick="openAppointmentModalByData(${idx})">
      <div class="res-appt-grid">
        <!-- Hora -->
        <div class="res-appt-time">
          <div class="res-appt-hour">${appt.time}</div>
          <div class="res-appt-period">${appt.period}</div>
        </div>
        
        <!-- Divisor vertical (solo en desktop) -->
        <div class="res-appt-divider"></div>
        
        <!-- Columna 1: Médico y especialidad -->
        <div class="res-appt-info">
          <div class="res-appt-doctor">
            <span class="res-appt-doctor-name">${appt.doctor}</span>
            ${appt.isPrimaryDoctor ? '<span class="badge badge-orange"><span class="icon icon-star icon-16 gs-inherit" aria-hidden="true"></span> Médico tratante</span>' : ''}
          </div>
          <div class="res-appt-specialty">${appt.specialty}</div>
        </div>

        <!-- Columna 2: Sede y dirección -->
        <div class="res-appt-location-col">
          <div class="res-appt-location">
            <span class="res-appt-location-icon icon icon-map-pin icon-16 gs-muted" aria-hidden="true"></span>
            <div>
              <div class="res-appt-center">${appt.center}</div>
              <div class="res-appt-address">${appt.address}</div>
            </div>
          </div>
        </div>
        
        <!-- Botón de acción -->
        <div class="res-appt-action">
          <button class="res-appt-btn" onclick="event.stopPropagation(); openAppointmentModalByData(${idx});" title="Seleccionar cita">
            <span class="icon icon-caret-right icon-20 gs-inherit" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (moreWrap) {
    moreWrap.style.display = citasVisibles.length < citasFiltradas.length ? 'flex' : 'none';
  }

  window.__resCitasFiltradas = citasVisibles;
}

/* ── Abre el sidebar de confirmación con datos de la cita ── */
function _abrirConfirmSidebar(appt) {
  resSelectedAppt = appt;
  const fechaLabel = getDateLabelByKey(selectedFecha);

  document.getElementById('csb-doc-name').textContent     = appt.doctor;
  document.getElementById('csb-doc-spec').textContent     = appt.specialty;
  document.getElementById('csb-especialidad').textContent = appt.specialty;
  document.getElementById('csb-fecha').textContent        = `${fechaLabel} · ${appt.time} ${appt.period}`;
  document.getElementById('csb-loc-name').textContent     = appt.center;
  document.getElementById('csb-loc-addr').textContent     = appt.address || '';

  window._pendingCita = { fechaLabel, espLabel: appt.specialty };

  document.getElementById('confirm-sidebar').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function openAppointmentModal(index) {
  _abrirConfirmSidebar(CITAS_DISPONIBLES[index]);
}

function openAppointmentModalByData(index) {
  const citas = window.__resCitasFiltradas || CITAS_DISPONIBLES;
  const cita = citas[index];
  if (!cita) return;
  _abrirConfirmSidebar(cita);
}

function closeAppointmentModal(e) {
  if (e && e.target.id === 'modal-confirm-appt') return; // legacy guard
  cerrarConfirmSidebar();
  resSelectedAppt = null;
}

function confirmarCitaDesdeResultados() {
  confirmarCita();
  resSelectedAppt = null;
}

// Filtros de resultados (inline dropdown)
function syncResultadosDropdownPanels() {
  const panelSede = document.getElementById('panel-res-sede');
  const panelDoctor = document.getElementById('panel-res-doctor');
  const panelFecha = document.getElementById('panel-res-fecha');
  if (!panelSede || !panelDoctor) return;

  if (panelFecha) {
    panelFecha.innerHTML = buildDateOptionsHtml('res');
  }

  const specialtyId = getHomeSpecialtySelection();
  const specialtyAvailable = getAvailableCenterIdsForSpecialty(specialtyId, getSelectedIsoDate());
  const sedesDisponibles = getCenterIdsForResultados().filter(id => specialtyAvailable.length ? specialtyAvailable.includes(id) : true);

  if (!sedesDisponibles.includes(resSelectedSedeId)) {
    resSelectedSedeId = sedesDisponibles[0] || '';
  }

  reconcileResultadosSelection();

  panelSede.innerHTML = [
    '<div class="ol-item" onclick="pickResultadosSede(\'todos\')">Todos</div>',
    ...sedesDisponibles.map(id => `<div class="ol-item" onclick="pickResultadosSede('${id}')">${getCenterDisplayLabel(id)}</div>`),
  ].join('');

  const doctores = getDoctorsForResultados();
  panelDoctor.innerHTML = [
    `<div class="ol-item" onclick="pickResultadosDoctor('Médico tratante')">${getPrimaryDoctorLabel()}</div>`,
    '<div class="ol-item" onclick="pickResultadosDoctor(\'Todos\')">Todos</div>',
    ...doctores.map(doc => `<div class="ol-item" onclick="pickResultadosDoctor('${doc.name}')">${doc.name}</div>`),
  ].join('');
}

function renderHomeDropdownData() {
  const panelEsp = document.getElementById('panel-esp');
  const panelEspMod = document.getElementById('panel-esp-mod');
  const panelSede = document.getElementById('panel-sede');
  const panelSedeMod = document.getElementById('panel-sede-mod');
  const dateOpts = document.getElementById('date-opts');
  if (!panelEsp || !panelSede || !demoData) return;

  const centers = demoData.medicalCenters || [];
  const validCenterIds = new Set(centers.map(item => item.id));
  const availableSpecialtyIds = new Set(
    (demoData.availability || [])
      .filter(slot => slot.isAvailable)
      .filter(slot => validCenterIds.has(normalizeCenterId(slot.centerId)))
      .map(slot => slot.specialtyId)
  );
  const specialties = (demoData.specialties || [])
    .filter(item => item.hasAvailability !== false)
    .filter(item => availableSpecialtyIds.has(item.id));
  const recentCenters = new Set(demoData.userContext?.recentCenters || []);

  const specialtiesHtml = specialties
    .map(item => `<div class="ol-item" onclick="pickEsp('${item.name}')">${item.name}</div>`)
    .join('');
  const specialtiesHtmlMod = specialties
    .map(item => `<div class="ol-item" onclick="pickEsp('${item.name}', 'mod')">${item.name}</div>`)
    .join('');

  const buildCenterChoices = ids => ids
    .map(id => {
      const center = centers.find(item => item.id === id);
      if (!center) return '';
      return `<label class="mp-choice ol-choice" data-id="${id}">
        <div class="mp-choice__field">
          <input type="checkbox" class="mp-choice__input" id="chk-${id}" onchange="toggleSede('${id}')">
          <div class="mp-choice__control"></div>
        </div>
        <span class="mp-choice__label">${center.name}</span>
      </label>`;
    })
    .join('');

  const buildCenterChoicesMod = ids => ids
    .map(id => {
      const center = centers.find(item => item.id === id);
      if (!center) return '';
      return `<label class="mp-choice ol-choice" data-id="${id}">
        <div class="mp-choice__field">
          <input type="checkbox" class="mp-choice__input" id="chk-${id}-mod" onchange="toggleSede('${id}', null, 'mod')">
          <div class="mp-choice__control"></div>
        </div>
        <span class="mp-choice__label">${center.name}</span>
      </label>`;
    })
    .join('');

  const filteredCenterIds = getFilteredCenterIdsForHome();
  const recentIds = centers.filter(item => recentCenters.has(item.id) && filteredCenterIds.includes(item.id)).map(item => item.id);
  const allIds = centers.filter(item => !recentCenters.has(item.id) && filteredCenterIds.includes(item.id)).map(item => item.id);

  const valEsp = document.getElementById('val-esp');
  if (valEsp && !valEsp.classList.contains('is-placeholder')) {
    const isCurrentSpecialtyVisible = specialties.some(item => item.name === valEsp.textContent.trim());
    if (!isCurrentSpecialtyVisible) {
      valEsp.textContent = 'Ej: Medicina general, pediatría';
      valEsp.classList.add('is-placeholder');
      selectedSedes = [];
    }
  }

  panelEsp.innerHTML = specialtiesHtml;
  if (panelEspMod) panelEspMod.innerHTML = specialtiesHtmlMod;

  panelSede.innerHTML = `${recentIds.length ? '<div class="ol-section">Centros médicos recientes</div>' : ''}${buildCenterChoices(recentIds)}${allIds.length ? '<div class="ol-section">Todos los centros</div>' : ''}${buildCenterChoices(allIds)}`;
  if (panelSedeMod) {
    panelSedeMod.innerHTML = `${recentIds.length ? '<div class="ol-section">Centros médicos recientes</div>' : ''}${buildCenterChoicesMod(recentIds)}${allIds.length ? '<div class="ol-section">Todos los centros</div>' : ''}${buildCenterChoicesMod(allIds)}`;
  }
  if (dateOpts) dateOpts.innerHTML = buildDateOptionsHtml();
  syncCenterSelectionsToAvailability();
  actualizarBloqueoSedes();
}

function syncHomeFromDemoDefaults() {
  selectedSedes = [];
  selectedFecha = '5';
  mtChecked = false;

  const valEsp = document.getElementById('val-esp');
  const valSede = document.getElementById('val-sede');
  const mtWrap = document.getElementById('mt-wrap');
  const mtCheck = document.getElementById('mt-check');

  if (valEsp) {
    valEsp.textContent = 'Ej: Medicina general, pediatría';
    valEsp.classList.add('is-placeholder');
  }

  if (valSede) {
    renderChipValue(valSede, [], 'Selecciona hasta 3 centros médicos');
  }

  if (mtWrap) mtWrap.style.display = 'none';
  if (mtCheck) mtCheck.checked = false;

  document.querySelectorAll('#panel-sede .mp-choice__input, #panel-sede-mod .mp-choice__input').forEach(input => {
    input.checked = false;
  });

  syncCenterSelectionsToAvailability();
}

function updateResultadosTitle() {
  const titleEl = document.getElementById('res-title-especialidad');
  if (!titleEl) return;

  const valEsp = document.getElementById('val-esp');
  const isPlaceholder = !valEsp || valEsp.classList.contains('is-placeholder');
  titleEl.textContent = isPlaceholder ? 'especialidad' : valEsp.textContent.trim();
}

function syncResultadosFromNuevaCita() {
  const fechaLabel = getDateLabelByKey(selectedFecha);
  const sedesDisponibles = getCenterIdsForResultados();

  resSelectedSedeId = sedesDisponibles[0] || '';
  resSelectedDoctor = mtChecked ? 'Médico tratante' : 'Todos';
  resSelectedModality = 'Presencial';
  resSelectedSort = 'Hora más temprana';
  resVisibleCount = 7;

  reconcileResultadosSelection();
  ensureResultadosModalidadDisponible();

  const sedeLabel = resSelectedSedeId
    ? (resSelectedSedeId === 'todos'
      ? 'Todos'
      : getCenterDisplayLabel(resSelectedSedeId))
    : 'Centro médico';

  document.getElementById('res-filter-fecha').textContent = fechaLabel;
  document.getElementById('res-context-fecha').textContent = fechaLabel;
  document.getElementById('res-filter-sede').textContent = sedeLabel;
  document.getElementById('res-filter-doctor').textContent = mtChecked ? getPrimaryDoctorLabel() : 'Todos';
  document.getElementById('res-filter-modality').textContent = resSelectedModality;
  document.getElementById('res-sort-label').textContent = resSelectedSort;
  updateResultadosTitle();

  syncResultadosDropdownPanels();
}

function pickResultadosFecha(key) {
  selectedFecha = key;
  const label = getDateLabelByKey(key);
  document.getElementById('res-filter-fecha').textContent = label;
  document.getElementById('res-context-fecha').textContent = label;
  resVisibleCount = 7;
  reconcileResultadosSelection();
  ensureResultadosModalidadDisponible();
  syncResultadosDropdownPanels();
  const sedeLabel = resSelectedSedeId
    ? (resSelectedSedeId === 'todos' ? 'Todos' : getCenterDisplayLabel(resSelectedSedeId))
    : 'Centro médico';
  document.getElementById('res-filter-sede').textContent = sedeLabel;
  document.getElementById('res-filter-doctor').textContent = resSelectedDoctor === 'Médico tratante'
    ? getPrimaryDoctorLabel()
    : (resSelectedDoctor || 'Todos');
  closeAllPanels();
  renderResultadosCitas();
}

/* ─────────────────────────────────────────────────────────────
   CALENDAR MODAL — abre el calendario como modal centrado
   en lugar del dropdown flotante del filtro de fecha
───────────────────────────────────────────────────────────── */
let _calModalTempSelection = null;
let _calModalContext = '';

function ensureCalendarModal() {
  let modal = document.getElementById('cal-modal-wrap');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'cal-modal-wrap';
  modal.className = 'cal-modal-wrap';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cal-modal-title');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="cal-modal" role="document">
      <div class="cal-modal__header">
        <h2 class="cal-modal__title" id="cal-modal-title">Selecciona una fecha</h2>
        <button class="cal-modal__close" type="button"
                onclick="closeCalendarModal(true)" aria-label="Cerrar">
          <span class="icon icon-x icon-20 gs-inherit" aria-hidden="true"></span>
        </button>
      </div>
      <div class="cal-modal__body" id="cal-modal-body"></div>
      <div class="cal-modal__footer">
        <button class="btn-outline cal-modal__btn-cancel" type="button"
                onclick="closeCalendarModal(true)">Cancelar</button>
        <button class="btn-primary cal-modal__btn-apply" type="button"
                onclick="applyCalendarModal()">Aplicar</button>
      </div>
    </div>`;

  /* cerrar con clic en el backdrop */
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeCalendarModal(true);
  });

  /* cerrar con Escape */
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCalendarModal(true);
  });

  document.body.appendChild(modal);
  return modal;
}

function openCalendarModal(context, btnId) {
  _calModalContext = context || 'res';
  _calModalTempSelection = selectedFecha; /* guardar selección actual para restaurar si cancela */

  const modal = ensureCalendarModal();
  const calBody = document.getElementById('cal-modal-body');
  if (calBody) {
    calBody.innerHTML = buildDateOptionsHtml('res-modal');
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  /* poner foco en el primer botón del modal */
  requestAnimationFrame(function () {
    const first = modal.querySelector('button');
    if (first) first.focus();
  });
}

function closeCalendarModal(restore) {
  if (restore && _calModalTempSelection !== null) {
    /* restaurar selección original si el usuario canceló */
    selectedFecha = _calModalTempSelection;
  }
  _calModalTempSelection = null;

  const modal = document.getElementById('cal-modal-wrap');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function applyCalendarModal() {
  /* Delegar a pickResultadosFecha — la función original que ya maneja
     correctamente labels, reconciliación, sync y render de resultados */
  if (_calModalContext === 'res') {
    pickResultadosFecha(selectedFecha);
  }
  _calModalTempSelection = null;
  closeCalendarModal(false);
}

function pickCalendarModalDate(key) {
  /* Seleccionar visualmente una fecha dentro del modal sin cerrar ni aplicar */
  selectedFecha = key;
  const calBody = document.getElementById('cal-modal-body');
  if (calBody) {
    calBody.innerHTML = buildDateOptionsHtml('res-modal');
  }
}

function pickResultadosSede(id) {
  resSelectedSedeId = id === 'todos' ? 'todos' : normalizeCenterId(id);
  const label = id === 'todos' ? 'Todos' : getCenterDisplayLabel(resSelectedSedeId);
  document.getElementById('res-filter-sede').textContent = label;
  resVisibleCount = 7;
  ensureResultadosModalidadDisponible();
  syncResultadosDropdownPanels();
  closeAllPanels();
  renderResultadosCitas();
}

function pickResultadosDoctor(label) {
  if (label === 'Médico tratante') {
    resSelectedDoctor = 'Médico tratante';
    document.getElementById('res-filter-doctor').textContent = getPrimaryDoctorLabel();
  } else {
    resSelectedDoctor = label;
    document.getElementById('res-filter-doctor').textContent = label;
  }
  resVisibleCount = 7;
  closeAllPanels();
  renderResultadosCitas();
}

function pickResultadosModalidad(label) {
  resSelectedModality = label;
  document.getElementById('res-filter-modality').textContent = label;
  resVisibleCount = 7;
  closeAllPanels();
  renderResultadosCitas();
}

function pickResultadosSort(label) {
  resSelectedSort = label;
  document.getElementById('res-sort-label').textContent = label;
  resVisibleCount = 7;
  closeAllPanels();
  renderResultadosCitas();
}

function openResultadosModifyPanel() {
  const sidebar = document.getElementById('overlay-modify-search');
  if (!sidebar) return;

  // ── Pre-cargar especialidad ──
  const espSrc = document.getElementById('val-esp');
  const espMod = document.getElementById('val-esp-mod');
  espMod.textContent = espSrc.textContent;
  espMod.classList.toggle('is-placeholder', espSrc.classList.contains('is-placeholder'));

  const errEspMod = document.getElementById('err-esp-mod');
  const errSedeMod = document.getElementById('err-sede-mod');
  const alertFormMod = document.getElementById('alert-form-mod');
  const btnEspMod = document.getElementById('btn-esp-mod');
  const btnSedeMod = document.getElementById('btn-sede-mod');
  if (errEspMod) errEspMod.style.display = 'none';
  if (errSedeMod) errSedeMod.style.display = 'none';
  if (alertFormMod) alertFormMod.style.display = 'none';
  if (btnEspMod) btnEspMod.classList.remove('error');
  if (btnSedeMod) btnSedeMod.classList.remove('error');

  // ── Pre-cargar sedes seleccionadas ──
  selectedSedesMod = [...selectedSedes];
  document.querySelectorAll('#panel-sede-mod .mp-choice__input').forEach(chk => {
    const id = chk.id.replace('chk-', '').replace('-mod', '');
    chk.checked = selectedSedesMod.includes(id);
  });
  // Actualizar label del dropdown de sede
  const valSedeMod = document.getElementById('val-sede-mod');
  renderChipValue(
    valSedeMod,
    selectedSedesMod.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
    'Selecciona hasta 3 centros médicos'
  );

  actualizarBloqueoSedesMod();

  // ── Abrir sidebar DS ──
  sidebar.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeResultadosModifyPanel() {
  const sidebar = document.getElementById('overlay-modify-search');
  if (sidebar) sidebar.classList.remove('is-open');
  document.body.style.overflow = '';
}

function applyResultadosModifyPanel() {
  const valEspMod = document.getElementById('val-esp-mod');
  const sinEsp = !valEspMod || valEspMod.classList.contains('is-placeholder');
  const sinSede = selectedSedesMod.length === 0;

  const errEspMod = document.getElementById('err-esp-mod');
  const errSedeMod = document.getElementById('err-sede-mod');
  const alertFormMod = document.getElementById('alert-form-mod');
  const btnEspMod = document.getElementById('btn-esp-mod');
  const btnSedeMod = document.getElementById('btn-sede-mod');

  if (errEspMod) errEspMod.style.display = 'none';
  if (errSedeMod) errSedeMod.style.display = 'none';
  if (alertFormMod) alertFormMod.style.display = 'none';
  if (btnEspMod) btnEspMod.classList.remove('error');
  if (btnSedeMod) btnSedeMod.classList.remove('error');

  if (sinEsp || sinSede) {
    if (sinEsp) {
      if (errEspMod) errEspMod.style.display = 'flex';
      if (btnEspMod) btnEspMod.classList.add('error');
    }
    if (sinSede) {
      if (errSedeMod) errSedeMod.style.display = 'flex';
      if (btnSedeMod) btnSedeMod.classList.add('error');
    }
    if (alertFormMod) {
      alertFormMod.style.display = 'flex';
      alertFormMod.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  const valEsp = document.getElementById('val-esp');
  if (valEsp && valEspMod) {
    valEsp.textContent = valEspMod.textContent;
    valEsp.classList.remove('is-placeholder');
  }

  selectedSedes = [...selectedSedesMod];
  document.querySelectorAll('#panel-sede .mp-choice__input').forEach(input => {
    input.checked = selectedSedes.includes(input.id.replace('chk-', ''));
  });

  const valSede = document.getElementById('val-sede');
  renderChipValue(
    valSede,
    selectedSedes.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
    'Selecciona hasta 3 centros médicos'
  );

  actualizarBloqueoSedes();
  renderHomeDropdownData();
  syncResultadosFromNuevaCita();
  closeResultadosModifyPanel();
  renderResultadosCitas();
}

function actualizarBloqueoSedesMod() {
  const valEspMod = document.getElementById('val-esp-mod');
  const hasSpecialty = Boolean(valEspMod && !valEspMod.classList.contains('is-placeholder'));
  const btnSedeMod = document.getElementById('btn-sede-mod');
  const panelSedeMod = document.getElementById('panel-sede-mod');

  if (btnSedeMod) {
    btnSedeMod.disabled = !hasSpecialty;
    btnSedeMod.setAttribute('aria-disabled', String(!hasSpecialty));
  }

  if (!hasSpecialty) {
    selectedSedesMod = [];
    if (panelSedeMod) panelSedeMod.classList.remove('open');
    if (btnSedeMod) btnSedeMod.setAttribute('aria-expanded', 'false');

    document.querySelectorAll('#panel-sede-mod .mp-choice__input').forEach(input => {
      input.checked = false;
    });

    const valSedeMod = document.getElementById('val-sede-mod');
    renderChipValue(valSedeMod, [], 'Selecciona hasta 3 centros médicos');
  }

  const maxReached = selectedSedesMod.length >= 3;
  document.querySelectorAll('#panel-sede-mod .ol-choice').forEach(label => {
    const itemId = label.dataset.id;
    const isSelected = selectedSedesMod.includes(itemId);
    if (!hasSpecialty || (maxReached && !isSelected)) {
      label.classList.add('disabled');
      label.style.opacity = '0.38';
      label.style.pointerEvents = 'none';
    } else {
      label.classList.remove('disabled');
      label.style.opacity = '1';
      label.style.pointerEvents = 'auto';
    }
  });
}

function loadMoreAppointments() {
  resVisibleCount += 7;
  renderResultadosCitas();
}

function retryLoadAppointments() {
  renderResultadosCitas();
}

function pickEsp(val, context = '') {
  const nextSpecialtyId = (demoData?.specialties || []).find(item => item.name === val)?.id || null;
  const nextDateKey = getFirstAvailableDateKeyForSpecialty(nextSpecialtyId);

  if (context === 'mod') {
    const valEl = document.getElementById('val-esp-mod');
    valEl.textContent = val;
    valEl.classList.remove('is-placeholder');
    const errEspMod = document.getElementById('err-esp-mod');
    const alertFormMod = document.getElementById('alert-form-mod');
    const btnEspMod = document.getElementById('btn-esp-mod');
    if (errEspMod) errEspMod.style.display = 'none';
    if (alertFormMod) alertFormMod.style.display = 'none';
    if (btnEspMod) btnEspMod.classList.remove('error');
    actualizarBloqueoSedesMod();
    if (nextDateKey) {
      selectedFecha = nextDateKey;
      pickFecha(nextDateKey, 'mod');
    }
    togglePanel('panel-esp-mod', 'btn-esp-mod');
  } else {
    const valEl = document.getElementById('val-esp');
    valEl.textContent = val;
    valEl.classList.remove('is-placeholder');
    if (nextDateKey) {
      selectedFecha = nextDateKey;
      pickFecha(nextDateKey);
    }
    closeAllPanels();
    actualizarMedicoTratante();
    renderHomeDropdownData();
    updateResultadosTitle();
    syncResultadosDropdownPanels();
  }
}

function toggleSede(id, el, context = '') {
  id = normalizeCenterId(id);
  const suffix = context === 'mod' ? '-mod' : '';
  const chk = document.getElementById('chk-' + id + suffix);
  if (!chk) return;
  const isChecked = chk.checked;
  const sidedArr = context === 'mod' ? selectedSedesMod : selectedSedes;
  
  if (!isChecked) {
    const idx = sidedArr.indexOf(id);
    if (idx > -1) sidedArr.splice(idx, 1);
  } else {
    if (sidedArr.length >= 3) {
      chk.checked = false;
      return;
    }
    if (!sidedArr.includes(id)) sidedArr.push(id);
  }
  
  if (context === 'mod') {
    const valEl = document.getElementById('val-sede-mod');
    renderChipValue(
      valEl,
      sidedArr.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
      'Selecciona hasta 3 centros médicos'
    );
    const errSedeMod = document.getElementById('err-sede-mod');
    const alertFormMod = document.getElementById('alert-form-mod');
    const btnSedeMod = document.getElementById('btn-sede-mod');
    if (errSedeMod) errSedeMod.style.display = 'none';
    if (btnSedeMod) btnSedeMod.classList.remove('error');
    if (alertFormMod) alertFormMod.style.display = 'none';
    actualizarBloqueoSedesMod();
  } else {
    actualizarBloqueoSedes();
    const valEl = document.getElementById('val-sede');
    renderChipValue(
      valEl,
      sidedArr.map(s => SEDES_LABEL[s] || getCenterDisplayLabel(s)),
      'Selecciona hasta 3 centros médicos'
    );
    syncCenterSelectionsToAvailability();
    syncResultadosDropdownPanels();
  }
}

function pickFecha(key, context = '') {
  const entries = getDateEntries();
  entries.forEach(entry => {
    const suffix = context === 'mod' ? '-mod' : '';
    const radio = document.getElementById(`drad-${entry.key}${suffix}`);
    const opt = document.getElementById(`dopt-${entry.key}${suffix}`);
    if (radio && opt) {
      radio.checked = entry.key === key;
      opt.classList.toggle('on', entry.key === key);
    }
  });

  if (context !== 'mod') {
    selectedFecha = key;
    renderHomeDropdownData();
    syncResultadosDropdownPanels();
  }
}

/* ─────────── INIT ─────────── */
document.addEventListener('DOMContentLoaded', async () => {
  checkDesktop();
  await ensureMedicalCentersDbLoaded();
  setupMisCitasActions();
  renderHomeDropdownData();
  syncHomeFromDemoDefaults();

  let pendingReagenda = null;
  try {
    const rawPending = window.sessionStorage.getItem('compensarReagendaPrueba1');
    if (rawPending) {
      pendingReagenda = JSON.parse(rawPending);
      window.sessionStorage.removeItem('compensarReagendaPrueba1');
    }
  } catch (error) {
    pendingReagenda = null;
  }

  // Render inicial de mis citas (default: próximas)
  buildMcDropdownMenus();
  renderMisCitas();

  if (pendingReagenda) {
    const cita = MIS_CITAS.find(item => (item.id || '') === pendingReagenda.citaId)
      || (pendingReagenda.fallback || {})
      || MIS_CITAS.find(item => item.estado === 'proxima')
      || {};
    openAgendaFromReagenda(cita);
  } else {
    // Render inicial de resultados disponibles
    renderResultadosCitas();
    syncResultadosDropdownPanels();
    updateResultadosTitle();
  }

  // Bloqueo sedes según selección inicial
  actualizarBloqueoSedes();
});
