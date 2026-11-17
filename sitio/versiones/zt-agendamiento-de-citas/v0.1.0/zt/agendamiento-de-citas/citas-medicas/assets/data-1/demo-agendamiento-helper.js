// demo-agendamiento-helper.js
// Helper sencillo para cargar el JSON, filtrar resultados y etiquetar médico tratante.

export async function loadDemoData(url = './demo-agenda.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo cargar el JSON del demo');
  return response.json();
}

export function getPrimaryDoctorBySpecialty(data, specialtyId) {
  return data.userContext.appointmentHistory.find(
    item => item.specialtyId === specialtyId && item.isLastAppointment
  ) || null;
}

export function getDoctorsBySpecialty(data, specialtyId) {
  return data.doctors
    .filter(doctor => doctor.specialtyIds.includes(specialtyId))
    .map(doctor => ({
      ...doctor,
      isPrimaryForSelectedSpecialty:
        doctor.id === getPrimaryDoctorBySpecialty(data, specialtyId)?.doctorId
    }));
}

export function searchAppointments(data, filters = {}) {
  const {
    specialtyId,
    centerIds = [],
    date,
    doctorId,
    modality
  } = filters;

  const primaryDoctor = specialtyId
    ? getPrimaryDoctorBySpecialty(data, specialtyId)
    : null;

  return data.availability
    .filter(slot => !specialtyId || slot.specialtyId === specialtyId)
    .filter(slot => !date || slot.date === date)
    .filter(slot => !modality || slot.modality === modality)
    .filter(slot => !doctorId || slot.doctorId === doctorId)
    .filter(slot => centerIds.length === 0 || centerIds.includes(slot.centerId))
    .map(slot => ({
      ...slot,
      badges: [
        ...(primaryDoctor && slot.doctorId === primaryDoctor.doctorId ? ['Médico tratante'] : []),
        ...slot.tags.filter(tag => tag !== 'Médico tratante')
      ]
    }))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}

export function getAvailableDatesBySpecialty(data, specialtyId) {
  return [...new Set(
    data.availability
      .filter(slot => slot.specialtyId === specialtyId)
      .map(slot => slot.date)
  )];
}

export function getEmptyStateForSpecialty(data, specialtyId) {
  const specialty = data.specialties.find(item => item.id === specialtyId);
  return specialty?.emptyState || data.ui.emptyStates.noAvailability;
}
