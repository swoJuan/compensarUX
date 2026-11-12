/**
 * ============================================================
 *  NAV-DATA.JS — Árbol de contenidos compartido
 *  Prueba: Arquitectura de navegación (menu-1 / menu-2)
 *  Compensar Design System
 *
 *  Fuente única de verdad del árbol de contenidos. Ambas variantes
 *  (menu-1 = acordeón jerárquico, menu-2 = navegación progresiva)
 *  consumen exactamente este mismo árbol — solo cambia el patrón
 *  de interacción, nunca el contenido.
 * ============================================================
 */

const NAV_TREE = [
  {
    id: 'inicio',
    label: 'Inicio',
    href: '#inicio',
    icon: 'icon-house'
  },
  {
    id: 'planes',
    label: 'Planes',
    icon: 'icon-heartbeat',
    children: [
      {
        id: 'plan-ideal',
        label: 'Plan Ideal',
        children: [
          { id: 'plan-ideal-individual', label: 'Individual', href: '#' },
          { id: 'plan-ideal-familiar', label: 'Familiar', href: '#' },
          { id: 'plan-ideal-empresarial', label: 'Empresarial', href: '#' }
        ]
      },
      {
        id: 'plan-optimo',
        label: 'Plan Óptimo',
        children: [
          { id: 'plan-optimo-individual-familiar', label: 'Individual y familiar', href: '#' },
          { id: 'plan-optimo-empresarial', label: 'Empresarial', href: '#' }
        ]
      }
    ]
  },
  {
    id: 'servicios-salud',
    label: 'Servicios de salud',
    icon: 'icon-stethoscope',
    children: [
      { id: 'autorizaciones', label: 'Autorizaciones', href: '#' },
      {
        id: 'laboratorio-clinico',
        label: 'Laboratorio Clínico',
        children: [
          { id: 'toma-muestras', label: 'Toma de muestras', href: '#' }
        ]
      },
      {
        id: 'odontologia',
        label: 'Odontología',
        children: [
          { id: 'servicios-odontologicos', label: 'Servicios odontológicos', href: '#' },
          { id: 'tips-odontologia', label: 'Tips de odontología', href: '#' }
        ]
      },
      { id: 'medicamentos', label: 'Medicamentos', href: '#' },
      { id: 'orientacion-medica', label: 'Orientación médica y servicios a domicilio', href: '#' }
    ]
  },
  {
    id: 'red-atencion',
    label: 'Red de atención',
    icon: 'icon-map-pin',
    children: [
      { id: 'centros-medicos', label: 'Centros médicos y sedes', href: '#' },
      {
        id: 'directorio-medico',
        label: 'Directorio médico',
        children: [
          { id: 'medicos-especialistas', label: 'Médicos y especialistas', href: '#' }
        ]
      },
      { id: 'instituciones-aliadas', label: 'Instituciones aliadas externas', href: '#' },
      { id: 'urgencias-domiciliaria', label: 'Urgencias y atención domiciliaria', href: '#' }
    ]
  },
  {
    id: 'canales-atencion',
    label: 'Canales de atención',
    icon: 'icon-headset',
    children: []
  },
  {
    id: 'beneficios',
    label: 'Beneficios',
    icon: 'icon-gift',
    children: [
      { id: 'seguros-asistencias', label: 'Seguros y asistencias', href: '#' },
      { id: 'aliados-especiales', label: 'Aliados especiales', href: '#' }
    ]
  },
  {
    id: 'nosotros',
    label: 'Nosotros',
    icon: 'icon-building',
    children: [
      { id: 'quienes-somos', label: 'Quiénes somos', href: '#' },
      { id: 'derechos-deberes', label: 'Derechos y deberes', href: '#' }
    ]
  }
];

// Node.js / módulos (no usado en el navegador, solo por si se requiere test)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NAV_TREE };
}
