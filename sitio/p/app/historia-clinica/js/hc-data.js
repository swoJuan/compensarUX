/* ============================================================
 * hc-data.js — Datos simulados del flujo "Historia clínica" (APP)
 * ------------------------------------------------------------
 * Prototipo sin backend. Las solicitudes y las opciones del simulador viven en
 * sessionStorage para que Nueva solicitud → Radicada → Mis solicitudes se
 * comporten como un flujo real durante la validación.
 *
 *   HCData.SERVICIOS     catálogo del selector de servicios (Figma App 02)
 *   HCData.list()        solicitudes (más recientes primero)
 *   HCData.add(s)        agrega una solicitud "radicado" y la devuelve
 *   HCData.sim()/setSim  opciones del panel de simulación
 *   HCData.fmt(iso)      "2026-01-15" → "15 ene 2026"
 *   HCData.fmtNum(iso)   "2026-01-15" → "15/01/2026"
 * ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'app-hc-solicitudes-v2';   // v2: semilla ampliada (30 registros)
  var KEY_SIM = 'app-hc-sim';

  // Orden alfabético (es). Si se agrega un servicio, mantenerlo en su posición.
  var SERVICIOS = [
    'Cirugía', 'Enfermería', 'Historia clínica completa', 'Medicina especializada', 'Medicina general',
    'Nutrición', 'Odontología', 'Psicología', 'Terapias'
  ];

  // Semilla = estados del Figma "Mis solicitudes".
  // [SUPUESTO] El motivo de rechazo es un texto de ejemplo: en Figma es el placeholder {Motivo del rechazo}.
  var SEED = [
    { id: '123456789', estado: 'radicado', fecha: '2026-09-28',
      servicios: ['Medicina general', 'Dermatología', 'Cirugía'], desde: '2026-01-15', hasta: '2026-09-20' },
    { id: '987654321', estado: 'gestionado', fecha: '2026-08-10',
      servicios: ['Medicina general'], desde: '2026-01-15', hasta: '2026-09-20' },
    { id: '987654322', estado: 'rechazado', fecha: '2026-08-10',
      servicios: ['Medicina especializada', 'Urgencias'], desde: '2025-01-01', hasta: '2026-07-31',
      motivo: 'No encontramos atenciones registradas para los servicios seleccionados en el periodo solicitado.' }
  ];

  // Registros adicionales para probar el listado largo (carga de 7 en 7).
  // Determinista (sin Math.random) para que la lista sea la misma en cada recarga.
  // [SUPUESTO] Datos de ejemplo: no hay backend ni más registros en el Figma.
  var COMBOS = [
    ['Medicina general'], ['Odontología'], ['Medicina general', 'Enfermería'], ['Cirugía'],
    ['Nutrición', 'Psicología'], ['Medicina especializada'], ['Terapias'],
    ['Medicina general', 'Odontología', 'Nutrición'], ['Historia clínica completa'], ['Enfermería']
  ];
  var MOTIVOS = [
    'No encontramos atenciones registradas para los servicios seleccionados en el periodo solicitado.',
    'El periodo solicitado supera el máximo permitido. Solicita un rango menor.',
    'No pudimos validar la información del paciente. Comunícate con nosotros.'
  ];
  function isoFrom(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function generar(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var estado = (i % 5 === 3) ? 'rechazado' : 'gestionado';       // 4 de cada 5 gestionadas, 1 rechazada
      var fecha = new Date(2026, 7, 4 - i * 4);                      // desde el 4 ago 2026, hacia atrás cada 4 días
      var desde = new Date(2026, 0 + (i % 6), 1 + (i % 9));
      var hasta = new Date(desde.getFullYear(), desde.getMonth() + 1 + (i % 4), 10 + (i % 15));
      var rec = {
        id: String(700000000 + (i + 1) * 48271),
        estado: estado,
        fecha: isoFrom(fecha),
        servicios: COMBOS[i % COMBOS.length],
        desde: isoFrom(desde),
        hasta: isoFrom(hasta)
      };
      if (estado === 'rechazado') rec.motivo = MOTIVOS[i % MOTIVOS.length];
      out.push(rec);
    }
    return out;
  }
  SEED = SEED.concat(generar(27));   // 3 del Figma + 27 de ejemplo = 30

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function read(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; } }
  function write(key, v) { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* modo privado */ } }

  function list() {
    var d = read(KEY);
    if (!d) { d = SEED.slice(); write(KEY, d); }
    return d;
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function newId() {
    var used = list().map(function (s) { return s.id; });
    var id;
    do { id = String(Math.floor(100000000 + Math.random() * 900000000)); } while (used.indexOf(id) !== -1);
    return id;
  }

  function add(s) {
    var rec = { id: newId(), estado: 'radicado', fecha: todayIso(), servicios: s.servicios, desde: s.desde, hasta: s.hasta };
    var d = list();
    d.unshift(rec);
    write(KEY, d);
    return rec;
  }

  // Opciones del simulador: result = ok | dup | error | gestionada · lista = datos | vacio
  function sim() {
    var s = read(KEY_SIM) || {};
    return { result: s.result || 'ok', lista: s.lista || 'datos' };
  }
  function setSim(patch) {
    var s = sim();
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    write(KEY_SIM, s);
  }

  function reset() {
    try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(KEY_SIM); } catch (e) {}
  }

  function fmt(iso) {
    var p = String(iso).split('-');
    return parseInt(p[2], 10) + ' ' + MESES_CORTOS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function fmtShort(iso) {   // sin año: "15 ene"
    var p = String(iso).split('-');
    return parseInt(p[2], 10) + ' ' + MESES_CORTOS[parseInt(p[1], 10) - 1];
  }
  function fmtNum(iso) {
    var p = String(iso).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  global.HCData = {
    SERVICIOS: SERVICIOS, MESES: MESES, PACIENTE: 'Margarita López Arenas',
    list: list, add: add, sim: sim, setSim: setSim, reset: reset,
    fmt: fmt, fmtShort: fmtShort, fmtNum: fmtNum, todayIso: todayIso, pad: pad
  };
})(window);
