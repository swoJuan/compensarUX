/* ============================================================
 * hc-mock.js — Datos simulados y helpers del flujo "Historia clínica" (ZT)
 * ------------------------------------------------------------
 * Prototipo: no hay backend. Las solicitudes viven en sessionStorage para que
 * Nueva solicitud → Solicitud radicada → Mis solicitudes se comporten como un
 * flujo real durante la validación.
 *
 *   HC.SERVICIOS            catálogo de servicios (Figma "Panel selector - Servicios")
 *   HC.PACIENTE             persona titular de la sesión
 *   HC.list()               solicitudes (más recientes primero)
 *   HC.add(solicitud)       agrega una solicitud "Radicado" y devuelve el registro
 *   HC.last()               última solicitud radicada (para la pantalla de éxito)
 *   HC.reset()              vuelve a los datos semilla
 *   HC.sim() / HC.setSim()  escenario del simulador flotante: result (ok|dup|error|gestionada)
 *                           y lista (datos|vacio). Lo usan el envío y "Mis solicitudes".
 *   HC.fmt(iso)             "2026-01-15" → "15 ene 2026"
 *
 * Estado vacío de "Mis solicitudes": abrir mis-solicitudes.html?vacio=1
 * ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'zt-hc-solicitudes';
  var KEY_LAST = 'zt-hc-ultima';
  var KEY_SIM = 'zt-hc-sim';

  // Orden alfabético (es). Si se agrega un servicio, mantenerlo en su posición.
  var SERVICIOS = [
    'Cirugía',
    'Enfermería',
    'Historia Clínica Completa',
    'Medicina Especializada',
    'Medicina General',
    'Nutrición',
    'Odontología',
    'Psicología',
    'Terapias'
  ];

  // Semilla = estados del Figma "04A — Mis solicitudes / En proceso".
  // [SUPUESTO] El motivo de rechazo es texto de ejemplo: en Figma es el placeholder {Motivo del rechazo}.
  var SEED = [
    { id: '123456789', estado: 'radicado',  fecha: '2026-09-28',
      servicios: ['Medicina general', 'Dermatología', 'Cirugía'],
      desde: '2026-01-15', hasta: '2026-09-20' },
    { id: '987654321', estado: 'gestionado', fecha: '2026-08-10',
      servicios: ['Medicina general'],
      desde: '2026-01-15', hasta: '2026-09-20' },
    { id: '987654322', estado: 'rechazado', fecha: '2026-08-10',
      servicios: ['Medicina especializada', 'Urgencias'],
      desde: '2025-01-01', hasta: '2026-07-31',
      motivo: 'No encontramos atenciones registradas para los servicios seleccionados en el periodo solicitado.' }
  ];

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function read(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; }
  }
  function write(key, val) {
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* modo privado: se ignora */ }
  }

  function list() {
    var data = read(KEY);
    if (!data) { data = SEED.slice(); write(KEY, data); }
    return data;
  }

  function newId() {
    // 9 dígitos, sin ceros a la izquierda; evita colisiones con lo existente
    var existing = list().map(function (s) { return s.id; });
    var id;
    do { id = String(Math.floor(100000000 + Math.random() * 900000000)); } while (existing.indexOf(id) !== -1);
    return id;
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function add(s) {
    var rec = {
      id: newId(),
      estado: 'radicado',
      fecha: todayIso(),
      servicios: s.servicios,
      desde: s.desde,
      hasta: s.hasta
    };
    var data = list();
    data.unshift(rec);
    write(KEY, data);
    write(KEY_LAST, rec);
    return rec;
  }

  function last() { return read(KEY_LAST); }

  // Escenario del simulador flotante (solo para validar el prototipo)
  function sim() {
    var s = read(KEY_SIM) || {};
    return { result: s.result || 'ok', lista: s.lista || 'datos' };
  }
  function setSim(patch) {
    var s = sim();
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    write(KEY_SIM, s);
    document.dispatchEvent(new CustomEvent('hc:sim-change', { detail: s }));
  }

  function reset() {
    try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(KEY_LAST); sessionStorage.removeItem(KEY_SIM); } catch (e) {}
  }

  // "2026-01-15" → "15 ene 2026" (sin depender de Date para evitar desfases de zona horaria)
  function fmt(iso) {
    var p = String(iso).split('-');
    return parseInt(p[2], 10) + ' ' + MESES[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  global.HC = {
    SERVICIOS: SERVICIOS,
    PACIENTE: 'Margarita López Arenas',
    list: list,
    add: add,
    last: last,
    reset: reset,
    sim: sim,
    setSim: setSim,
    fmt: fmt,
    todayIso: todayIso
  };
})(window);
