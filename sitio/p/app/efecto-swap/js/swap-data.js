/* ============================================================
 * swap-data.js — Datos FICTICIOS del flujo "Efecto Swap" (APP)
 * ------------------------------------------------------------
 * 18 solicitudes de historia clínica, más recientes primero.
 *  - Registros 1–7: tomados del Figma (8655:24380): números, estados, fechas, servicios y periodos.
 *  - Registros 8–18: [SUPUESTO] inventados para completar las 18 que indica el contador del Figma
 *    ("Mostrando 7 de 18"). Son datos ficticios, sin personas reales.
 *  - Motivo de rechazo: en Figma es el placeholder "{Motivo del rechazo}".
 *    [PENDIENTE DE COPY] el texto de MOTIVOS es ficticio hasta que negocio/contenido defina los motivos reales.
 *
 *   SwapData.list()   → arreglo de solicitudes
 *   SwapData.fmtDate(iso) / SwapData.fmtRange(desde, hasta)
 * ============================================================ */
(function (global) {
  'use strict';
  var MOTIVOS = [
    'No encontramos atenciones registradas para los servicios y el periodo seleccionados.',
    'El periodo solicitado no corresponde a atenciones en una IPS Compensar.'
  ];
  // [id, estado, radicación, servicios, desde, hasta, motivo(índice)]
  var ROWS = [
    ['123456789', 'radicado',   '2026-09-28', 'Medicina general, Dermatología, Cirugía', '2026-01-15', '2026-09-20'],
    ['987654321', 'gestionado', '2026-08-10', 'Medicina general',                         '2026-01-15', '2026-09-20'],
    ['987654322', 'rechazado',  '2026-08-10', 'Medicina especializada, Urgencias',        '2025-01-01', '2026-07-31', 0],
    ['987654323', 'gestionado', '2026-07-22', 'Pediatría',                                '2026-01-01', '2026-06-30'],
    ['123456790', 'radicado',   '2026-07-03', 'Medicina general, Dermatología, Cirugía', '2026-03-01', '2026-06-30'],
    ['987654324', 'gestionado', '2026-06-18', 'Ortopedia',                                '2026-01-01', '2026-05-31'],
    ['987654325', 'rechazado',  '2026-05-02', 'Medicina especializada, Urgencias',        '2025-01-01', '2026-04-30', 1],
    // ── [SUPUESTO] 8–18 ──
    ['987654326', 'gestionado', '2026-04-15', 'Nutrición',                                '2025-10-01', '2026-03-31'],
    ['987654327', 'gestionado', '2026-03-27', 'Odontología, Enfermería',                  '2025-09-01', '2026-02-28'],
    ['123456791', 'radicado',   '2026-03-09', 'Psicología',                               '2025-11-01', '2026-02-28'],
    ['987654328', 'rechazado',  '2026-02-20', 'Terapias',                                 '2024-01-01', '2026-01-31', 0],
    ['987654329', 'gestionado', '2026-02-04', 'Medicina general',                         '2025-07-01', '2025-12-31'],
    ['987654330', 'gestionado', '2026-01-19', 'Historia clínica completa',                '2024-01-01', '2025-12-31'],
    ['123456792', 'radicado',   '2025-12-11', 'Cirugía, Medicina especializada',          '2025-01-01', '2025-11-30'],
    ['987654331', 'gestionado', '2025-11-26', 'Pediatría, Nutrición',                     '2025-05-01', '2025-10-31'],
    ['987654332', 'rechazado',  '2025-10-30', 'Urgencias',                                '2023-01-01', '2025-09-30', 1],
    ['987654333', 'gestionado', '2025-10-08', 'Medicina general',                         '2025-03-01', '2025-09-30'],
    ['123456793', 'radicado',   '2025-09-16', 'Odontología',                              '2025-01-01', '2025-08-31']
  ];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function parts(iso) { var p = iso.split('-'); return { y: p[0], m: MESES[+p[1] - 1], d: p[2] }; }
  // "2026-09-28" → "28 sep 2026"
  function fmtDate(iso) { var p = parts(iso); return p.d + ' ' + p.m + ' ' + p.y; }
  // Misma regla del Figma: se omite el año del inicio cuando es el mismo del final → "15 ene – 20 sep 2026"
  function fmtRange(a, b) {
    var pa = parts(a), pb = parts(b);
    return pa.d + ' ' + pa.m + (pa.y === pb.y ? '' : ' ' + pa.y) + ' – ' + pb.d + ' ' + pb.m + ' ' + pb.y;
  }
  var LIST = ROWS.map(function (r) {
    return { id: r[0], estado: r[1], fecha: r[2], servicios: r[3], desde: r[4], hasta: r[5], motivo: r[6] === undefined ? null : MOTIVOS[r[6]] };
  });
  global.SwapData = {
    list: function () { return LIST.slice(); },
    fmtDate: fmtDate,
    fmtRange: fmtRange
  };
})(window);
