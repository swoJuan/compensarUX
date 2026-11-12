/* ============================================================
 * paso-4.js — PASO 4 "Estados de salud" del Proceso de afiliación (ZT)
 * ------------------------------------------------------------
 * Declaración de asegurabilidad POR PERSONA AFILIADA (Figma 240:17234).
 *
 * Responsabilidades (prototipo, sin backend real):
 *   - CONTROL DE ACCESO por etapas: candidato viable + Pasos 1, 2 (con OTP) y 3.
 *   - Stepper transversal (8 pasos, current = 4).
 *   - Fichas de persona (contratante si es beneficiario + beneficiarios del
 *     Paso 3) con estado visible (completa / pendiente / cuántos "Sí").
 *   - Por persona:
 *       B. Antecedentes de salud — preguntas Sí/No por categoría (QUESTIONS).
 *          · RESPUESTA POR DEFECTO = "No": el asesor solo marca los "Sí".
 *          · Sub-preguntas (1.1, 2.1…) aparecen solo si la principal es "Sí"
 *            (SUBQ_DEPEND_ON_PARENT). Al volver a "No" se ocultan y se resetean.
 *          · "Sí" → fila resaltada + detalle (Especifique cuál + Hace cuánto
 *            tiempo), máximo MAX_DETAIL_ROWS respuestas por pregunta; el foco
 *            pasa a "Especifique cuál".
 *       C. Datos antropométricos — peso, estatura, IMC calculado + clasificación
 *          (solo adultos; en menores el IMC se interpreta por percentiles).
 *       D. Sección mujeres — solo sexo femenino y edad ≥ WOMEN_MIN_AGE.
 *          Pregunta 10 (ginecológica) con la misma regla. Embarazo por defecto "No".
 *   - Barra fija con la persona actual y su conteo de "Sí" mientras se hace scroll.
 *   - Estado pendiente/completo por persona. Cambiar de persona conserva datos.
 *   - Bloqueo de avance: todas las declaraciones completas; si no, alerta + salto
 *     a la primera persona pendiente y foco en el primer error.
 *   - Persistencia en un ÚNICO modelo step4 (sessionStorage) + restauración.
 *
 * ⚠️  Reglas de prototipo a validar con suscripción médica: WOMEN_MIN_AGE,
 *     SUBQ_DEPEND_ON_PARENT, MAX_DETAIL_ROWS, ADULT_AGE_IMC.
 * ⚠️  El registro de preexistencias/exclusiones y la evaluación de riesgo son
 *     responsabilidad del backend; aquí solo se capturan las respuestas.
 * ============================================================ */
(function () {
  'use strict';

  var Z = window.ZTAfiliacion;

  /* ─────────── CONTROL DE ACCESO POR ETAPAS ─────────── */
  if (!Z || !Z.isViable()) { window.location.replace('../index.html'); return; }
  var step1 = Z.getStep1();
  if (!step1 || step1.completed !== true) { window.location.replace('../paso-1/index.html'); return; }
  var step2 = Z.getStep2();
  if (!step2 || step2.completed !== true || step2.otpVerified !== true) {
    window.location.replace('../paso-2/index.html'); return;
  }
  var step3 = Z.getStep3();
  if (!step3 || step3.completed !== true) { window.location.replace('../paso-3/index.html'); return; }

  var candidate = Z.getCandidate();

  /* ─────────── Reglas de prototipo (validar con negocio) ─────────── */
  var WOMEN_MIN_AGE = 12;             // Sección mujeres + pregunta 10: desde esta edad
  var SUBQ_DEPEND_ON_PARENT = true;   // 1.1, 2.1… solo si la principal es "Sí"
  var MAX_DETAIL_ROWS = 2;            // máximo de respuestas de detalle por pregunta
  var ADULT_AGE_IMC = 18;             // clasificación OMS del IMC solo para adultos

  /* ═══════════════ CATÁLOGO DE PREGUNTAS (texto del Figma) ═══════════════
   * `main: true` = pregunta principal numerada (cuenta para "(N preguntas)").
   * `sex: 'femenino'` = solo aplica a sexo femenino con edad ≥ WOMEN_MIN_AGE.
   * Se corrigió solo puntuación evidente del Figma ("2.1. ." y signos "?" sin cerrar). */
  var QUESTIONS = [
    { cat: 'Congénitas / enfermedades raras', items: [
      { id: 'q1',   n: '1',   main: true, text: '¿Padece de alguna enfermedad, malformación o síndrome congénito?' },
      { id: 'q1_1', n: '1.1', text: '¿Padece de alguna enfermedad huérfana, rara u olvidada?' },
      { id: 'q1_2', n: '1.2', text: '¿Utiliza algún medicamento para su enfermedad huérfana, rara u olvidada?' }
    ]},
    { cat: 'Cardiovascular', items: [
      { id: 'q2',   n: '2',   main: true, text: '¿Ha sido diagnosticado con enfermedades cardiacas y vasculares, infarto de miocardio, opresión, angina o dolores en el pecho, valvulopatías, insuficiencia de las arterias coronarias, obstrucción arterial, hipertensión arterial, trasplante cardiaco, arritmias, aneurismas, trombosis arterial o venosa, várices, fiebre reumática, síndrome de Wolff Parkinson White (WPW), trastornos eléctricos del corazón, enfermedades de las cavidades del corazón o ha sido sometido a cirugías cardiacas o vasculares?' },
      { id: 'q2_1', n: '2.1', text: '¿Toma algún medicamento para bajar la presión, regular el ritmo cardiaco, o usa anticoagulantes de forma crónica?' }
    ]},
    { cat: 'Neurológico y salud mental', items: [
      { id: 'q3',   n: '3',   main: true, text: '¿Tiene antecedentes de enfermedades neurológicas tales como parálisis, vértigo, epilepsia, enfermedades cerebrovasculares, Parkinson, retraso mental, esclerosis múltiple, Alzhéimer, parálisis cerebral, convulsiones, dolores persistentes de cabeza con inicio menor o igual a 1 año, pérdida de la memoria, meningitis, hernia discal, miastenia gravis, encefalopatías, trauma craneoencefálico severo, autismo, entre otras?' },
      { id: 'q3_1', n: '3.1', text: '¿Toma algún medicamento de tipo corticoide, para las convulsiones, mareo, sueño, depresión o ansiedad?' },
      { id: 'q3_2', n: '3.2', text: '¿Ha padecido trastornos mentales, crisis de ansiedad o depresión, enfermedad bipolar, trastorno de esquizofrenia, demencia y/o ha tenido algún intento de suicidio?' }
    ]},
    { cat: 'Respiratorio', items: [
      { id: 'q4',   n: '4',   main: true, text: '¿Ha sido diagnosticado con enfermedades broncopulmonares como enfermedad pulmonar obstructiva crónica EPOC, asma, tuberculosis, sinusitis crónica, rinitis, desviación del tabique nasal, hipertrofia de cornetes, afecciones de adenoides, síndrome de dificultad respiratoria, amigdalitis crónica, enfisema, hipertensión pulmonar, fibrosis quística, bronquitis a repetición, tos con sangre o tos crónica?' },
      { id: 'q4_1', n: '4.1', text: '¿Utiliza de forma regular o cada cierto tiempo inhaladores o medicamentos para el manejo de alergias, o depende del suministro de oxígeno?' },
      { id: 'q4_2', n: '4.2', text: '¿Ha sido diagnosticado con apnea obstructiva del sueño o usa el dispositivo CPAP o BPAP para respirar?' }
    ]},
    { cat: 'Oncológico', items: [
      { id: 'q5',   n: '5',   main: true, text: '¿Ha padecido algún tipo de cáncer, tumores o masas, pérdida inexplicable de peso, cansancio o debilidad, fiebre a repetición o sudoración nocturna, ganglios aumentados de tamaño, bultos o hinchazón en axilas, cuello o región inguinal?' },
      { id: 'q5_1', n: '5.1', text: '¿Ha recibido tratamiento con quimioterapia, braquiterapia o radioterapia en algún momento de su vida?' }
    ]},
    { cat: 'Consumo de sustancias', items: [
      { id: 'q6',   n: '6',   main: true, text: '¿Ha consumido o actualmente fuma más de 5 cigarrillos al día, o utiliza cigarrillos electrónicos o vapeadores, alguna sustancia estupefaciente o psicoactiva, narcóticos, ansiolíticos, antidepresivos?' },
      { id: 'q6_1', n: '6.1', text: '¿Ha consumido o actualmente consume alcohol o bebidas embriagantes más de una vez por semana?' }
    ]},
    { cat: 'Endocrino / metabólico', items: [
      { id: 'q7',   n: '7',   main: true, text: '¿Tiene antecedentes de sobrepeso, obesidad mórbida, anorexia y/o bulimia, trastornos de crecimiento, diabetes de cualquier tipo o hiperglicemia, dislipidemia, arterioesclerosis, hipertiroidismo, hipotiroidismo?' },
      { id: 'q7_1', n: '7.1', text: '¿Ha recibido o actualmente tiene tratamiento farmacológico para manejo del colesterol o los triglicéridos altos?' },
      { id: 'q7_2', n: '7.2', text: '¿Alguna vez ha requerido o requiere el uso permanente de insulina?' }
    ]},
    { cat: 'Gastrointestinal', items: [
      { id: 'q8',   n: '8',   main: true, text: '¿Ha padecido de úlcera gástrica o duodenal, gastritis crónica, cirrosis, hepatitis B o C, várices esofágicas, ictericia, sangrados digestivos a cualquier nivel, enfermedades o síndromes de mala absorción, reflujo gastroesofágico, cálculos o enfermedades de la vesícula o vías biliares, enfermedades pancreáticas, del duodeno, colon o recto, enfermedad diverticular, hemorroides, hernias inguinales, hernias umbilicales, hernia hiatal, enfermedad de Crohn o esófago de Barret, entre otras?' },
      { id: 'q8_1', n: '8.1', text: '¿Consume de forma regular o permanente antiácidos, derivados o similares de omeprazol, enzimas digestivas o medicamentos para el colon?' }
    ]},
    { cat: 'Genitourinario', items: [
      { id: 'q9',   n: '9',   main: true, text: '¿Ha sido diagnosticado con enfermedades genitourinarias a nivel de vejiga, riñones, próstata o uréteres? infecciones urinarias recurrentes, cálculos renales, glomerulonefritis, síndrome nefrótico o nefrítico, pielonefritis, hidronefrosis, incontinencia urinaria, varicocele, reflujo vesico ureteral, fimosis, hidrocele, vejiga caída, riñón poliquístico, papiloma o ausencia de un riñón?' },
      { id: 'q9_1', n: '9.1', text: '¿Padece de insuficiencia renal crónica en cualquier estadío o alguna vez ha requerido diálisis, hemodiálisis o hemofiltración?' },
      { id: 'q10',  n: '10',  main: true, sex: 'femenino', text: '¿Tiene antecedentes de enfermedades ginecológicas: trastornos de glándula mamaria, quistes en ovario, miomas en útero, matriz caída, endometriosis, prolapsos genitales, problemas de fertilidad, hemorragias uterinas anormales, abortadora habitual, fibroadenomas, glándula supernumeraria, hipertrofia mamaria?' }
    ]},
    { cat: 'Accidentes y consumo de riesgo', items: [
      { id: 'q11', n: '11', main: true, text: '¿Tiene antecedentes de enfermedades o accidentes causados bajo el efecto del alcohol o drogas no prescritas médicamente, prácticas en deportes extremos o de alto riesgo?' }
    ]},
    { cat: 'Hematológico', items: [
      { id: 'q12', n: '12', main: true, text: '¿Tiene antecedentes de enfermedades de la sangre: hemofilia, púrpura, anemia, trastornos de coagulación, talasemia, trombocitopenia?' }
    ]},
    { cat: 'VIH', items: [
      { id: 'q13',   n: '13',   main: true, text: '¿Tiene antecedentes de enfermedades causadas por el virus de inmunodeficiencia adquirida "VIH", o el síndrome de inmunodeficiencia adquirida "SIDA", así como las secuelas o recidivas de las mismas?' },
      { id: 'q13_1', n: '13.1', text: '¿Consume algún medicamento antirretroviral?' }
    ]},
    { cat: 'Órganos de los sentidos', items: [
      { id: 'q14', n: '14', main: true, text: '¿Tiene antecedentes de enfermedades de los órganos de los sentidos: cataratas, glaucoma, pterigión, estrabismo, afecciones de la retina, ceguera, otitis, vértigo, sordera?' }
    ]},
    { cat: 'Riesgo laboral', items: [
      { id: 'q15', n: '15', main: true, text: '¿Tiene antecedentes de enfermedades o tratamiento por accidentes de trabajo y enfermedades profesionales?' }
    ]},
    { cat: 'Procedimientos estéticos', items: [
      { id: 'q16', n: '16', main: true, text: '¿Presenta secuelas de procedimientos médicos y/o en salud, o se ha practicado cirugías estéticas, cosméticas o plásticas?' }
    ]},
    { cat: 'Osteomuscular', items: [
      { id: 'q17', n: '17', main: true, text: '¿Tiene antecedentes de enfermedades osteomusculares, de tejidos conectivos como artritis, artrosis entre otros, secuela de fracturas, golpes, caídas, dolor lumbar crónico?' }
    ]},
    { cat: 'Inmunológico / piel / linfático', items: [
      { id: 'q18', n: '18', main: true, text: '¿Padece de alguna enfermedad inmunológica, de la piel o el sistema linfático, artritis reumatoidea, lupus, espondilitis, psoriasis, entre otras?' }
    ]},
    { cat: 'Medicamentos biológicos u hormonales', items: [
      { id: 'q19', n: '19', main: true, text: '¿Le han formulado o se encuentra tomando medicamentos biológicos u hormonales?' }
    ]},
    { cat: 'Hospitalización', items: [
      { id: 'q20', n: '20', main: true, text: '¿Ha estado hospitalizado en el último año o actualmente se encuentra hospitalizado?' }
    ]},
    { cat: 'Medicamentos crónicos', items: [
      { id: 'q21', n: '21', main: true, text: '¿Le han prescrito medicamentos para una condición de salud crónica? ¿Requiere el uso de medicamentos de forma permanente?' }
    ]},
    { cat: 'Programa domiciliario EPS', items: [
      { id: 'q22', n: '22', main: true, text: '¿Pertenece al programa domiciliario dentro de su EPS?' }
    ]},
    { cat: 'Cirugías pendientes', items: [
      { id: 'q23', n: '23', main: true, text: '¿Tiene procedimientos quirúrgicos pendientes?' }
    ]},
    { cat: 'Otro', items: [
      { id: 'q24', n: '24', main: true, text: '¿Alguna otra enfermedad?' }
    ]}
  ];

  /* Unidades de "Hace cuánto tiempo" y de semanas de gestación. */
  var TIME_UNITS = [
    { value: 'dias', label: 'Días' }, { value: 'semanas', label: 'Semanas' },
    { value: 'meses', label: 'Meses' }, { value: 'anos', label: 'Años' }
  ];
  var GESTATION_UNITS = [ { value: 'semanas', label: 'Semanas' }, { value: 'meses', label: 'Meses' } ];

  /* Campos numéricos de la Sección mujeres (Figma 240:17747). Opcionales. */
  var WOMEN_FIELDS = [
    { key: 'vaginalBirths',        label: 'Número de partos vaginales' },
    { key: 'cesareanBirths',       label: 'Número de partos por cesárea' },
    { key: 'ectopicPregnancies',   label: 'Número de embarazos ectópicos' },
    { key: 'inducedAbortions',     label: 'Número de abortos provocados' },
    { key: 'spontaneousAbortions', label: 'Número de abortos espontáneos' },
    { key: 'pregnancies',          label: 'Número de embarazos' }
  ];

  var REL_LABEL = {
    conyuge: 'Cónyuge', hijo: 'Hijo(a)', padre: 'Padre',
    madre: 'Madre', hermano: 'Hermano(a)', otro: 'Otro'
  };

  /* ─────────── Referencias al DOM ─────────── */
  var candSummary = document.getElementById('pa-cand-summary');
  var stepperEl   = document.getElementById('pa-stepper');
  var personHost  = document.getElementById('p4-person');
  var declHost    = document.getElementById('p4-declaration');
  var alertEl     = document.getElementById('p4-alert');
  var backBtn     = document.getElementById('p4-back');
  var nextBtn     = document.getElementById('p4-next');

  /* ─────────── Resumen del candidato + Stepper (current = 4) ─────────── */
  ZTPersonSummary.render(candSummary, {
    eyebrow: 'Persona a afiliar',
    variant: 'compact', icon: 'icon-user-plus',
    name: candidate.name || '',
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber
  });
  ZTStepper.render(stepperEl, Z.stepperConfig(4));   // pasos completados clicables

  /* ═══════════════ HELPERS ═══════════════ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayISO() {
    var h = new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  }
  function calcularEdad(iso) {
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    var hoy = new Date();
    var edad = hoy.getFullYear() - b.getFullYear();
    var m = hoy.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < b.getDate())) edad--;
    return edad;
  }
  function nombreCompleto(b) {
    return [b.firstName, b.secondName, b.firstSurname, b.secondSurname]
      .filter(function (x) { return x && String(x).trim(); }).join(' ');
  }
  function primerNombre(p) { return String(p.name || '').split(' ')[0]; }

  /* ═══════════════ PERSONAS AFILIADAS (desde Pasos 2 y 3) ═══════════════ */
  var persons = [];
  if (step3.contractorIsBeneficiary) {
    persons.push({
      id: 'contratante', name: candidate.name || 'Contratante', role: 'Contratante',
      sex: step2.sex || '',
      age: step2.age != null ? step2.age : calcularEdad(step2.birthDate)
    });
  }
  (step3.beneficiaries || []).forEach(function (b, i) {
    persons.push({
      id: b.id, name: nombreCompleto(b) || ('Beneficiario ' + (i + 1)),
      role: REL_LABEL[b.relationship] || ('Beneficiario ' + (i + 1)),
      number: i + 1, sex: b.identificationSex || '',
      age: calcularEdad(b.birthDate) != null ? calcularEdad(b.birthDate) : b.age
    });
  });
  function findPerson(id) { return persons.filter(function (p) { return p.id === id; })[0] || null; }
  // Sección mujeres / pregunta 10: sexo femenino y edad mínima (edad desconocida → aplica).
  function appliesWomen(p) { return !!p && p.sex === 'femenino' && (p.age == null || p.age >= WOMEN_MIN_AGE); }
  function isAdult(p) { return p && p.age != null && p.age >= ADULT_AGE_IMC; }

  /* ═══════════════ CATÁLOGO APLICADO A UNA PERSONA ═══════════════ */
  function questionsFor(p) {
    return QUESTIONS.map(function (g) {
      return { cat: g.cat, items: g.items.filter(function (q) { return !q.sex || (q.sex === 'femenino' && appliesWomen(p)); }) };
    }).filter(function (g) { return g.items.length; });
  }
  function allQuestions() {
    var out = [];
    QUESTIONS.forEach(function (g) { g.items.forEach(function (q) { out.push(q); }); });
    return out;
  }
  var ALL_Q = allQuestions();
  function parentId(q) { return q.id.indexOf('_') !== -1 ? q.id.split('_')[0] : null; }
  function childrenOf(pid) { return ALL_Q.filter(function (q) { return parentId(q) === pid; }); }
  function mainCount(p) {
    var n = 0;
    questionsFor(p).forEach(function (g) { g.items.forEach(function (q) { if (q.main) n++; }); });
    return n;
  }
  // ¿La pregunta está visible para esta declaración? (sub-preguntas dependen del padre)
  function isVisible(q, decl) {
    if (!SUBQ_DEPEND_ON_PARENT) return true;
    var pid = parentId(q);
    return !pid || decl.answers[pid] === 'si';
  }
  function yesCount(p, decl) {
    var n = 0;
    questionsFor(p).forEach(function (g) {
      g.items.forEach(function (q) { if (isVisible(q, decl) && decl.answers[q.id] === 'si') n++; });
    });
    return n;
  }

  /* ═══════════════ IMC ═══════════════ */
  function imc(weight, height) {
    var w = parseFloat(String(weight).replace(',', '.'));
    var h = parseFloat(String(height).replace(',', '.')) / 100;
    if (!(w > 0) || !(h > 0)) return null;
    return w / (h * h);
  }
  function fmtImc(v) { return v == null ? '' : v.toFixed(1).replace('.', ','); }
  // Clasificación OMS (adultos). tone → color del texto de ayuda.
  function imcClass(v) {
    if (v == null) return null;
    if (v < 18.5) return { label: 'Bajo peso', tone: 'warn' };
    if (v < 25)   return { label: 'Peso normal', tone: 'ok' };
    if (v < 30)   return { label: 'Sobrepeso', tone: 'warn' };
    return { label: 'Obesidad', tone: 'alert' };
  }

  /* ═══════════════ MODELO DE ESTADO (Step 4) ═══════════════ */
  var saved = Z.getStep4() || {};
  var state = {
    // Sigue completo solo si TODAS las personas actuales tienen su declaración
    // completa (si en el Paso 3 se agregó alguien, vuelve a quedar pendiente).
    completed: saved.completed === true && persons.every(function (p) {
      return ((saved.declarations || {})[p.id] || {}).status === 'complete';
    }),
    currentPersonId: saved.currentPersonId,
    declarations: saved.declarations || {}
  };
  // Normaliza: descarta personas que ya no existen y completa por defecto "No".
  var clean = {};
  persons.forEach(function (p) {
    var d = state.declarations[p.id] || {};
    var answers = d.answers || {};
    ALL_Q.forEach(function (q) { if (answers[q.id] !== 'si' && answers[q.id] !== 'no') answers[q.id] = 'no'; });
    var women = d.women || {};
    if (women.pregnant !== 'si' && women.pregnant !== 'no') women.pregnant = 'no';
    clean[p.id] = {
      status: d.status || 'pending',
      answers: answers,
      details: d.details || {},
      otherEvents: d.otherEvents || '',
      weight: d.weight || '', height: d.height || '',
      women: women,
      collapsed: d.collapsed || {}
    };
  });
  state.declarations = clean;
  if (!findPerson(state.currentPersonId)) state.currentPersonId = persons[0] && persons[0].id;

  function persist() {
    Z.saveStep4({
      completed: state.completed,
      currentPersonId: state.currentPersonId,
      declarations: state.declarations
    });
  }

  /* ═══════════════ A11Y / MOVIMIENTO ═══════════════ */
  var liveRegion = document.createElement('div');
  liveRegion.className = 'visually-hidden';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('role', 'status');
  document.body.appendChild(liveRegion);
  function announce(msg) {
    liveRegion.textContent = '';
    window.setTimeout(function () { liveRegion.textContent = msg; }, 30);
  }
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scrollBehavior() { return prefersReducedMotion ? 'auto' : 'smooth'; }
  function focusEl(el) {
    if (!el || typeof el.focus !== 'function') return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  /* ═══════════════ PLANTILLAS HTML (componentes del DS) ═══════════════ */
  function radioHTML(name, value, label, checked) {
    return '<label class="mp-choice mp-radio">' +
      '<span class="mp-choice__field">' +
        '<input class="mp-choice__input" type="radio" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + '>' +
        '<span class="mp-choice__control"></span>' +
      '</span>' +
      '<span class="mp-choice__text"><span class="mp-choice__label">' + label + '</span></span>' +
    '</label>';
  }
  function yesNoHTML(name, value, labelId) {
    return '<div class="p4-options" role="radiogroup" aria-labelledby="' + labelId + '">' +
      radioHTML(name, 'si', 'Sí', value === 'si') +
      radioHTML(name, 'no', 'No', value !== 'si') +
    '</div>';
  }
  function optionsHTML(list, selected) {
    return '<option value="" disabled' + (selected ? '' : ' selected') + '>Seleccionar</option>' +
      list.map(function (u) {
        return '<option value="' + u.value + '"' + (u.value === selected ? ' selected' : '') + '>' + u.label + '</option>';
      }).join('');
  }
  function labelHTML(forId, text, required) {
    return '<label class="mp-input-label" for="' + forId + '">' +
      (required ? '<span class="mp-input-required" aria-hidden="true">*</span> ' : '') + text + '</label>';
  }
  function errorHTML(id, msg) {
    return '<p class="mp-input-error" id="' + id + '" role="alert" hidden>' + (msg || 'Este campo es obligatorio.') + '</p>';
  }

  /* Fila de detalle de una respuesta "Sí" (Figma: repuestaAseguriabilidad). */
  function detailRowHTML(pid, qid, idx, row, canDelete) {
    var base = 'p4-' + pid + '-' + qid + '-' + idx;
    return '<div class="p4-detail__row" data-row="' + idx + '">' +
      '<div class="mp-input-group">' +
        labelHTML(base + '-cual', 'Especifique cuál', true) +
        '<div class="mp-input-wrapper"><input class="mp-input-field" id="' + base + '-cual" data-field="cual" type="text" autocomplete="off" placeholder="Escribir" value="' + esc(row.cual) + '" aria-describedby="' + base + '-cual-error"></div>' +
        errorHTML(base + '-cual-error') +
      '</div>' +
      '<div class="mp-input-group">' +
        '<span class="mp-input-label" id="' + base + '-tiempo-label"><span class="mp-input-required" aria-hidden="true">*</span> Hace cuánto tiempo</span>' +
        '<div class="p4-qty">' +
          '<div class="mp-input-wrapper p4-qty__num"><input class="mp-input-field" id="' + base + '-cantidad" data-field="cantidad" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Cantidad" value="' + esc(row.cantidad) + '" aria-labelledby="' + base + '-tiempo-label" aria-describedby="' + base + '-tiempo-error"></div>' +
          '<div class="mp-input-wrapper p4-qty__unit"><select class="mp-input-field mp-select" id="' + base + '-unidad" data-field="unidad" data-zt-dropdown data-zt-dropdown-search="false" aria-label="Unidad de tiempo" aria-describedby="' + base + '-tiempo-error">' + optionsHTML(TIME_UNITS, row.unidad) + '</select></div>' +
        '</div>' +
        errorHTML(base + '-tiempo-error', 'Indica la cantidad y la unidad de tiempo.') +
      '</div>' +
      '<div class="p4-detail__del">' +
        (canDelete ? '<button type="button" class="p4-icon-btn" data-action="del-row" aria-label="Eliminar respuesta ' + (idx + 1) + '"><span class="icon icon-x icon-20 gs-inherit" aria-hidden="true"></span></button>' : '') +
      '</div>' +
    '</div>';
  }
  function detailHTML(pid, qid, rows) {
    var full = rows.length >= MAX_DETAIL_ROWS;
    return rows.map(function (r, i) { return detailRowHTML(pid, qid, i, r, rows.length > 1); }).join('') +
      (full
        ? '<p class="p4-detail__max"><span class="icon icon-info icon-16 gs-inherit" aria-hidden="true"></span>Máximo ' + MAX_DETAIL_ROWS + ' respuestas por pregunta.</p>'
        : '<div class="p4-add"><button type="button" class="mp-btn mp-btn--terciario p4-add__btn" data-action="add-row">+ Agregar otra respuesta</button></div>');
  }

  function questionHTML(pid, q, decl) {
    var val = decl.answers[q.id] === 'si' ? 'si' : 'no';
    var labelId = 'p4-' + pid + '-' + q.id + '-label';
    var rows = decl.details[q.id] || [];
    var visible = isVisible(q, decl);
    return '<div class="p4-q' + (q.main ? '' : ' p4-q--sub') + (val === 'si' ? ' is-yes' : '') + '" data-q="' + q.id + '"' + (visible ? '' : ' hidden') + '>' +
      '<div class="p4-q__row">' +
        '<p class="p4-q__text" id="' + labelId + '">' + q.n + '. ' + esc(q.text) + '</p>' +
        yesNoHTML('p4-' + q.id, val, labelId) +
      '</div>' +
      '<div class="p4-detail" data-detail="' + q.id + '"' + (val === 'si' ? '' : ' hidden') + '>' +
        (val === 'si' ? detailHTML(pid, q.id, rows) : '') +
      '</div>' +
    '</div>';
  }

  function sectionHTML(key, icon, title, bodyHTML, decl, hint) {
    var collapsed = !!decl.collapsed[key];
    var bodyId = 'p4-sec-' + key;
    return '<section class="p4-section" data-section="' + key + '" aria-labelledby="' + bodyId + '-title">' +
      '<div class="p4-section__head">' +
        '<span class="icon ' + icon + ' icon-24 gs-inherit" aria-hidden="true"></span>' +
        '<div class="p4-section__titles">' +
          '<h4 class="p4-section__title" id="' + bodyId + '-title">' + title + '</h4>' +
          (hint ? '<p class="p4-section__hint">' + hint + '</p>' : '') +
        '</div>' +
        '<button type="button" class="p4-toggle" data-action="toggle" aria-expanded="' + (!collapsed) + '" aria-controls="' + bodyId + '">' +
          '<span class="p4-toggle__label">' + (collapsed ? 'Abrir' : 'Cerrar') + '</span>' +
          '<span class="icon ' + (collapsed ? 'icon-caret-down' : 'icon-caret-up') + ' icon-24 gs-inherit" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
      '<div class="p4-section__body" id="' + bodyId + '"' + (collapsed ? ' hidden' : '') + '>' + bodyHTML + '</div>' +
    '</section>';
  }

  function sectionBHTML(p, decl) {
    var groups = questionsFor(p);
    var body = groups.map(function (g) {
      return '<div class="p4-group">' +
        '<p class="p4-group__title">' + esc(g.cat) + '</p>' +
        g.items.map(function (q) { return questionHTML(p.id, q, decl); }).join('') +
      '</div>';
    }).join('') +
    '<div class="mp-input-group p4-other">' +
      labelHTML('p4-other-events', 'Eventos de salud adicionales a los mencionados anteriormente', false) +
      '<div class="mp-input-wrapper"><input class="mp-input-field" id="p4-other-events" data-field="otherEvents" type="text" autocomplete="off" placeholder="Escribir (opcional)" value="' + esc(decl.otherEvents) + '"></div>' +
    '</div>';
    return sectionHTML('b', 'icon-first-aid', 'B. Antecedentes de salud (' + mainCount(p) + ' preguntas)', body, decl,
      'Todas inician en <strong>No</strong>. Marca <strong>Sí</strong> solo cuando la persona lo confirme.');
  }

  function imcHelpHTML(p, v) {
    if (v == null) return '';
    if (!isAdult(p)) return '<p class="p4-imc-help">En menores de ' + ADULT_AGE_IMC + ' años el IMC se interpreta por percentiles.</p>';
    var c = imcClass(v);
    return '<p class="p4-imc-help p4-imc-help--' + c.tone + '">' + c.label + '</p>';
  }
  function sectionCHTML(p, decl) {
    var v = imc(decl.weight, decl.height);
    var body = '<div class="p4-grid p4-grid--3">' +
      '<div class="mp-input-group">' + labelHTML('p4-weight', 'Peso (kg)', true) +
        '<div class="mp-input-wrapper"><input class="mp-input-field" id="p4-weight" data-field="weight" type="text" inputmode="decimal" maxlength="5" autocomplete="off" placeholder="Ej. 68" value="' + esc(decl.weight) + '" aria-describedby="p4-weight-error"></div>' +
        errorHTML('p4-weight-error') + '</div>' +
      '<div class="mp-input-group">' + labelHTML('p4-height', 'Estatura (cm)', true) +
        '<div class="mp-input-wrapper"><input class="mp-input-field" id="p4-height" data-field="height" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Ej. 165" value="' + esc(decl.height) + '" aria-describedby="p4-height-error"></div>' +
        errorHTML('p4-height-error') + '</div>' +
      '<div class="mp-input-group">' + labelHTML('p4-imc', 'IMC', false) +
        '<div class="mp-input-wrapper"><input class="mp-input-field pa-readonly" id="p4-imc" type="text" readonly aria-readonly="true" tabindex="-1" placeholder="Se calcula solo" value="' + fmtImc(v) + '" aria-describedby="p4-imc-help"></div>' +
        '<div id="p4-imc-help" aria-live="polite">' + imcHelpHTML(p, v) + '</div>' +
      '</div>' +
    '</div>';
    return sectionHTML('c', 'icon-barbell', 'C. Datos antropométricos', body, decl);
  }

  function sectionDHTML(decl) {
    var w = decl.women || {};
    var fields = '<div class="p4-grid">' + WOMEN_FIELDS.map(function (f) {
      var id = 'p4-w-' + f.key;
      return '<div class="mp-input-group">' + labelHTML(id, f.label, false) +
        '<div class="mp-input-wrapper"><input class="mp-input-field" id="' + id + '" data-women="' + f.key + '" type="text" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="0" value="' + esc(w[f.key]) + '"></div>' +
      '</div>';
    }).join('') + '</div>';
    var preg = '<div class="p4-q' + (w.pregnant === 'si' ? ' is-yes' : '') + '" data-pregnancy>' +
      '<div class="p4-q__row">' +
        '<p class="p4-q__text" id="p4-preg-label">¿Conoce usted si actualmente se encuentra en estado de embarazo?</p>' +
        yesNoHTML('p4-pregnant', w.pregnant, 'p4-preg-label') +
      '</div>' +
      '<div class="p4-context" data-block="pregnancy"' + (w.pregnant === 'si' ? '' : ' hidden') + '>' +
        '<div class="p4-grid">' +
          '<div class="mp-input-group">' + labelHTML('p4-fum', 'Fecha última menstruación', false) +
            '<div class="mp-input-wrapper"><input class="mp-input-field" id="p4-fum" data-women="lastPeriodDate" type="date" max="' + todayISO() + '" placeholder="dd/mm/aaaa" data-zt-datepicker value="' + esc(w.lastPeriodDate) + '"></div>' +
          '</div>' +
          '<div class="mp-input-group">' +
            '<span class="mp-input-label" id="p4-weeks-label">¿Cuántas semanas?</span>' +
            '<div class="p4-qty">' +
              '<div class="mp-input-wrapper p4-qty__num"><input class="mp-input-field" id="p4-weeks" data-women="gestationAmount" type="text" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="Cantidad" value="' + esc(w.gestationAmount) + '" aria-labelledby="p4-weeks-label"></div>' +
              '<div class="mp-input-wrapper p4-qty__unit"><select class="mp-input-field mp-select" id="p4-weeks-unit" data-women="gestationUnit" data-zt-dropdown data-zt-dropdown-search="false" aria-label="Unidad de tiempo de gestación">' + optionsHTML(GESTATION_UNITS, w.gestationUnit) + '</select></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    return sectionHTML('d', 'icon-gender-female', 'D. Sección mujeres', fields + preg, decl, 'Campos opcionales, salvo la pregunta de embarazo.');
  }

  /* ═══════════════ FICHAS DE PERSONA ═══════════════
   * Reemplazan el dropdown: estado siempre visible y cambio en un clic. */
  function completedCount() {
    return persons.filter(function (p) { return state.declarations[p.id].status === 'complete'; }).length;
  }
  function chipMeta(p) {
    var d = state.declarations[p.id];
    var yes = yesCount(p, d);
    return d.status === 'complete'
      ? (yes ? yes + (yes === 1 ? ' respuesta Sí' : ' respuestas Sí') : 'Sin novedades')
      : 'Pendiente';
  }
  function renderPersonSelector() {
    personHost.innerHTML =
      '<div class="p4-people__head">' +
        '<p class="p4-people__label" id="p4-people-label">Personas a declarar</p>' +
        '<p class="p4-people__count">' + completedCount() + ' de ' + persons.length + ' completas</p>' +
      '</div>' +
      '<div class="p4-people" role="group" aria-labelledby="p4-people-label">' +
        persons.map(function (p) {
          var d = state.declarations[p.id];
          var active = p.id === state.currentPersonId;
          var done = d.status === 'complete';
          return '<button type="button" class="p4-chip' + (active ? ' is-active' : '') + (done ? ' is-complete' : ' is-pending') + '"' +
            ' data-person="' + esc(p.id) + '" aria-pressed="' + active + '"' +
            ' aria-label="' + esc(p.name + ', ' + p.role + ', ' + chipMeta(p)) + '">' +
            '<span class="p4-chip__icon icon ' + (done ? 'icon-check-circle' : 'icon-clock') + ' icon-20 gs-inherit" aria-hidden="true"></span>' +
            '<span class="p4-chip__text">' +
              '<span class="p4-chip__name">' + esc(p.name) + '</span>' +
              '<span class="p4-chip__meta">' + esc(p.role) + ' · ' + esc(chipMeta(p)) + '</span>' +
            '</span>' +
          '</button>';
        }).join('') +
      '</div>';
  }
  personHost.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-person]');
    if (chip) switchPerson(chip.getAttribute('data-person'));
  });

  function switchPerson(id, opts) {
    if (id === state.currentPersonId && !(opts && opts.force)) return;
    updateStatus();
    state.currentPersonId = id;
    persist();
    ZTAlert.clear(alertEl);
    renderPersonSelector();
    renderDeclaration();
    var p = findPerson(id);
    announce('Declaración de ' + p.name + '.');
    var title = declHost.querySelector('.p4-person-title');
    if (title && title.scrollIntoView) title.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }

  /* ═══════════════ DECLARACIÓN DE LA PERSONA ACTUAL ═══════════════ */
  function current() { return findPerson(state.currentPersonId); }
  function currentDecl() { return state.declarations[state.currentPersonId]; }

  // Barra fija: persona + conteo de "Sí" (se actualiza sin re-render).
  function stickyMetaText(p, decl) {
    var yes = yesCount(p, decl);
    return yes ? (yes + (yes === 1 ? ' pregunta marcada en Sí' : ' preguntas marcadas en Sí')) : 'Sin respuestas en Sí';
  }
  function refreshSticky() {
    var el = declHost.querySelector('.p4-person-title__meta');
    if (el) el.textContent = stickyMetaText(current(), currentDecl());
    var yesEl = declHost.querySelector('.p4-person-title');
    if (yesEl) yesEl.classList.toggle('has-yes', yesCount(current(), currentDecl()) > 0);
  }

  function renderDeclaration() {
    var p = current(), decl = currentDecl();
    declHost.innerHTML =
      '<div class="p4-person-title" tabindex="-1">' +
        '<div class="p4-person-title__who">' +
          '<p class="p4-person-title__name">' + esc(p.name) + ' <span>(' + esc(p.role) + (p.age != null ? ' · ' + p.age + (p.age === 1 ? ' año' : ' años') : '') + ')</span></p>' +
          '<h3 class="p4-person-title__heading">Declaración de asegurabilidad</h3>' +
        '</div>' +
        '<p class="p4-person-title__meta" aria-live="polite">' + stickyMetaText(p, decl) + '</p>' +
      '</div>' +
      '<div id="p4-info"></div>' +
      sectionBHTML(p, decl) +
      sectionCHTML(p, decl) +
      (appliesWomen(p) ? sectionDHTML(decl) : '');
    refreshSticky();
    ZTAlert.render(declHost.querySelector('#p4-info'), {
      type: 'warning',
      title: 'Tener en cuenta',
      description: 'Lee cada pregunta a la persona en línea. Si responde "Sí" en alguna, el sistema la registra como preexistencia o exclusión.'
    });
    ZTDropdown.enhanceAll(declHost);
    ZTDatePicker.enhanceAll(declHost);
  }

  /* Re-pinta solo el bloque de detalle de una pregunta. */
  function renderDetail(qid) {
    var host = declHost.querySelector('[data-detail="' + qid + '"]');
    if (!host) return;
    var decl = currentDecl();
    var si = decl.answers[qid] === 'si';
    host.hidden = !si;
    host.innerHTML = si ? detailHTML(state.currentPersonId, qid, decl.details[qid] || []) : '';
    if (si) ZTDropdown.enhanceAll(host);
    var box = declHost.querySelector('[data-q="' + qid + '"]');
    if (box) box.classList.toggle('is-yes', si);
  }
  function setRadioDom(qid, value) {
    var r = declHost.querySelectorAll('input[name="p4-' + qid + '"]');
    Array.prototype.forEach.call(r, function (x) { x.checked = x.value === value; });
  }
  // Muestra/oculta las sub-preguntas de una principal. Al ocultarlas se resetean a "No".
  function applyChildren(pid) {
    if (!SUBQ_DEPEND_ON_PARENT) return;
    var decl = currentDecl();
    var show = decl.answers[pid] === 'si';
    childrenOf(pid).forEach(function (c) {
      var box = declHost.querySelector('[data-q="' + c.id + '"]');
      if (!box) return;
      box.hidden = !show;
      if (!show && decl.answers[c.id] === 'si') {
        decl.answers[c.id] = 'no';
        delete decl.details[c.id];
        setRadioDom(c.id, 'no');
        renderDetail(c.id);
      }
    });
  }

  /* ═══════════════ ERRORES INLINE (patrón Form Error) ═══════════════ */
  function setError(el, on) {
    if (!el) return;
    var host = el.closest('.zt-dropdown') || el.closest('.zt-datefield');
    (host || el).classList.toggle('error', !!on);
  }
  function showMsg(id, on) {
    var m = document.getElementById(id);
    if (m) m.hidden = !on;
  }

  /* ═══════════════ VALIDACIÓN ═══════════════
   * Sobre el MODELO (sirve para cualquier persona). Con `mark` pinta errores en la
   * persona actual y devuelve el primer elemento inválido. Las respuestas Sí/No
   * siempre tienen valor (por defecto "No"): se validan el detalle de los "Sí",
   * peso y estatura. */
  function validate(pid, mark) {
    var p = findPerson(pid), decl = state.declarations[pid];
    var ok = true, first = null;
    function fail(el) { ok = false; if (mark && !first && el) first = el; }
    var q = function (sel) { return mark ? declHost.querySelector(sel) : null; };

    questionsFor(p).forEach(function (g) {
      g.items.forEach(function (question) {
        if (!isVisible(question, decl) || decl.answers[question.id] !== 'si') return;
        (decl.details[question.id] || []).forEach(function (row, i) {
          var base = '#p4-' + pid + '-' + question.id + '-' + i;
          var cualOk = !!String(row.cual || '').trim();
          var numOk = /^\d+$/.test(String(row.cantidad || ''));
          var tiempoOk = numOk && !!row.unidad;
          if (!cualOk) fail(q(base + '-cual'));
          if (!tiempoOk) fail(q(!numOk ? base + '-cantidad' : base + '-unidad'));
          if (mark) {
            setError(q(base + '-cual'), !cualOk);
            showMsg(base.slice(1) + '-cual-error', !cualOk);
            setError(q(base + '-cantidad'), !numOk);
            setError(q(base + '-unidad'), !row.unidad);
            showMsg(base.slice(1) + '-tiempo-error', !tiempoOk);
          }
        });
      });
    });

    var w = parseFloat(String(decl.weight).replace(',', '.'));
    var h = parseFloat(String(decl.height));
    var wOk = w >= 1 && w <= 350, hOk = h >= 30 && h <= 250;
    if (!wOk) fail(q('#p4-weight'));
    if (!hOk) fail(q('#p4-height'));
    if (mark) {
      setError(q('#p4-weight'), !wOk);
      var we = document.getElementById('p4-weight-error');
      if (we) { we.textContent = decl.weight ? 'Ingresa un peso válido en kg.' : 'Este campo es obligatorio.'; we.hidden = wOk; }
      setError(q('#p4-height'), !hOk);
      var he = document.getElementById('p4-height-error');
      if (he) { he.textContent = decl.height ? 'Ingresa una estatura válida en cm.' : 'Este campo es obligatorio.'; he.hidden = hOk; }
    }
    return mark ? { ok: ok, first: first } : ok;
  }

  function updateStatus() {
    var pid = state.currentPersonId;
    if (!pid) return;
    var prev = state.declarations[pid].status;
    state.declarations[pid].status = validate(pid, false) ? 'complete' : 'pending';
    if (prev !== state.declarations[pid].status) renderPersonSelector();
  }
  function commit() { updateStatus(); persist(); }

  /* ═══════════════ EVENTOS (delegación sobre la declaración) ═══════════════ */
  declHost.addEventListener('change', function (e) {
    var t = e.target, decl = currentDecl();
    var qBox = t.closest('[data-q]');
    if (t.type === 'radio' && qBox) {
      var qid = qBox.getAttribute('data-q');
      decl.answers[qid] = t.value;
      if (t.value === 'si') {
        if (!decl.details[qid] || !decl.details[qid].length) decl.details[qid] = [{ cual: '', cantidad: '', unidad: '' }];
      } else {
        delete decl.details[qid];   // "No" descarta el detalle
      }
      renderDetail(qid);
      applyChildren(qid);
      refreshSticky();
      if (t.value === 'si') {
        var subs = SUBQ_DEPEND_ON_PARENT ? childrenOf(qid).length : 0;
        announce('Pregunta marcada en Sí.' + (subs ? ' Se habilitaron ' + subs + ' preguntas relacionadas.' : '') + ' Especifica el detalle.');
        focusEl(declHost.querySelector('[data-detail="' + qid + '"] input[data-field="cual"]'));
      }
      commit(); return;
    }
    if (t.name === 'p4-pregnant') {
      decl.women.pregnant = t.value;
      var block = declHost.querySelector('[data-block="pregnancy"]');
      if (block) block.hidden = t.value !== 'si';
      var pbox = declHost.querySelector('[data-pregnancy]');
      if (pbox) pbox.classList.toggle('is-yes', t.value === 'si');
      commit(); return;
    }
    handleFieldValue(t);
  });
  declHost.addEventListener('input', function (e) { handleFieldValue(e.target); });

  function handleFieldValue(t) {
    var decl = currentDecl();
    var row = t.closest('[data-row]');
    if (row && t.getAttribute('data-field')) {
      var qid = t.closest('[data-detail]').getAttribute('data-detail');
      var idx = +row.getAttribute('data-row');
      var f = t.getAttribute('data-field');
      if (f === 'cantidad') { var c = t.value.replace(/\D+/g, ''); if (c !== t.value) t.value = c; }
      decl.details[qid][idx][f] = t.value;
      setError(t, false);
      commit(); return;
    }
    var field = t.getAttribute('data-field');
    if (field === 'otherEvents') { decl.otherEvents = t.value; commit(); return; }
    if (field === 'weight' || field === 'height') {
      var cleanV = field === 'weight' ? t.value.replace(/[^\d,.]/g, '') : t.value.replace(/\D+/g, '');
      if (cleanV !== t.value) t.value = cleanV;
      decl[field] = t.value;
      setError(t, false); showMsg('p4-' + field + '-error', false);
      var v = imc(decl.weight, decl.height);
      var imcEl = document.getElementById('p4-imc');
      if (imcEl) imcEl.value = fmtImc(v);
      var help = document.getElementById('p4-imc-help');
      if (help) help.innerHTML = imcHelpHTML(current(), v);
      commit(); return;
    }
    var wk = t.getAttribute('data-women');
    if (wk) {
      if (t.type === 'text' && t.inputMode === 'numeric') { var n = t.value.replace(/\D+/g, ''); if (n !== t.value) t.value = n; }
      decl.women[wk] = t.value;
      commit();
    }
  }

  declHost.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var decl = currentDecl();

    if (action === 'toggle') {
      var sec = btn.closest('[data-section]');
      var key = sec.getAttribute('data-section');
      var body = sec.querySelector('.p4-section__body');
      var collapse = !body.hidden;
      body.hidden = collapse;
      decl.collapsed[key] = collapse;
      btn.setAttribute('aria-expanded', String(!collapse));
      btn.querySelector('.p4-toggle__label').textContent = collapse ? 'Abrir' : 'Cerrar';
      var ic = btn.querySelector('.icon');
      ic.classList.toggle('icon-caret-up', !collapse);
      ic.classList.toggle('icon-caret-down', collapse);
      persist(); return;
    }

    var detail = btn.closest('[data-detail]');
    if (!detail) return;
    var qid = detail.getAttribute('data-detail');
    if (action === 'add-row') {
      if (decl.details[qid].length >= MAX_DETAIL_ROWS) return;
      decl.details[qid].push({ cual: '', cantidad: '', unidad: '' });
      renderDetail(qid);
      var rows = detail.querySelectorAll('[data-row]');
      focusEl(rows[rows.length - 1].querySelector('input'));
      announce('Respuesta ' + rows.length + ' agregada.' + (rows.length >= MAX_DETAIL_ROWS ? ' Llegaste al máximo de ' + MAX_DETAIL_ROWS + '.' : ''));
      commit(); return;
    }
    if (action === 'del-row') {
      var idx = +btn.closest('[data-row]').getAttribute('data-row');
      decl.details[qid].splice(idx, 1);
      renderDetail(qid);
      var rest = detail.querySelectorAll('[data-row]');
      var target = rest[Math.min(idx, rest.length - 1)];
      focusEl(target && target.querySelector('input'));
      announce('Respuesta eliminada.');
      commit();
    }
  });

  /* Validación on-blur de peso/estatura (feedback temprano). */
  declHost.addEventListener('focusout', function (e) {
    var t = e.target, f = t.getAttribute && t.getAttribute('data-field');
    if (f !== 'weight' && f !== 'height') return;
    if (!t.value) return;
    var v = parseFloat(t.value.replace(',', '.'));
    var ok = f === 'weight' ? (v >= 1 && v <= 350) : (v >= 30 && v <= 250);
    setError(t, !ok);
    var m = document.getElementById('p4-' + f + '-error');
    if (m) { m.textContent = f === 'weight' ? 'Ingresa un peso válido en kg.' : 'Ingresa una estatura válida en cm.'; m.hidden = ok; }
  });

  /* ═══════════════ CONTINUAR ═══════════════ */
  function openAllSections() {
    declHost.querySelectorAll('.p4-section__body[hidden]').forEach(function (b) {
      var btn = b.parentNode.querySelector('[data-action="toggle"]');
      if (btn) btn.click();
    });
  }
  function focusInvalid(el) {
    if (!el) return;
    var dd = el.closest('.zt-dropdown');
    var target = (dd && dd.querySelector('.zt-dropdown__trigger')) || el;
    if (target.scrollIntoView) target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    focusEl(target);
  }

  nextBtn.addEventListener('click', function () {
    persons.forEach(function (p) {
      state.declarations[p.id].status = validate(p.id, false) ? 'complete' : 'pending';
    });
    persist();
    renderPersonSelector();

    var pendientes = persons.filter(function (p) { return state.declarations[p.id].status !== 'complete'; });
    if (!pendientes.length) {
      state.completed = true;
      persist();
      // Paso 5 (LVI) aún no está construido: destino documentado.
      window.location.href = '../paso-5/index.html';
      return;
    }
    var target = pendientes.filter(function (p) { return p.id === state.currentPersonId; })[0] || pendientes[0];
    if (target.id !== state.currentPersonId) {
      state.currentPersonId = target.id;
      persist();
      renderPersonSelector();
      renderDeclaration();
    }
    openAllSections();
    ZTAlert.render(alertEl, {
      type: 'warning',
      title: pendientes.length > 1 ? 'Hay ' + pendientes.length + ' declaraciones sin completar' : 'Hay una declaración sin completar',
      description: 'Completa la declaración de ' + pendientes.map(function (p) { return primerNombre(p); }).join(', ') + ' antes de continuar.'
    });
    var res = validate(target.id, true);
    focusInvalid(res.first);
  });

  /* ═══════════════ ATRÁS (Paso 3, sin perder datos) ═══════════════ */
  backBtn.addEventListener('click', function () {
    commit();
    window.location.href = '../paso-3/index.html';
  });

  /* ═══════════════ RENDER INICIAL ═══════════════ */
  if (!persons.length) { window.location.replace('../paso-3/index.html'); return; }
  persons.forEach(function (p) {
    state.declarations[p.id].status = validate(p.id, false) ? 'complete' : 'pending';
  });
  renderPersonSelector();
  renderDeclaration();
  persist();
})();
