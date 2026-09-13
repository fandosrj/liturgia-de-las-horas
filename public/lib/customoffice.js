/* ============================================================
   Oficios personalizados — programa aparte y autónomo
   No sustituye nunca el rezo oficial diario: vive en su propia
   sección ("Mis oficios personalizados"), con su propia pantalla
   de rezo. El vínculo con el calendario es solo un AVISO ("hoy
   te toca este oficio"), nunca una sustitución silenciosa del
   oficio oficial.
   ============================================================ */
window.CustomOffice = (() => {
  const KEY = 'liturgia.customoffice.v1';

  /* Catálogo de piezas: calcado de la estructura real de cada hora
     (ver public/lib/liturgy.js) para que el editor pueda ofrecer
     exactamente esos huecos, en el orden real, con el contenido en
     blanco listo para rellenar. */
  const PIEZA_TIPOS = [
    { id: 'invitatorio', label: 'Invitatorio (verso inicial)' },
    { id: 'apertura', label: 'Verso de apertura' },
    { id: 'himno', label: 'Himno' },
    { id: 'antifona', label: 'Antífona' },
    { id: 'salmo', label: 'Salmo o cántico (contenido)', needsRef: true },
    { id: 'gloria', label: 'Gloria al Padre' },
    { id: 'lectura_breve', label: 'Lectura breve', needsRef: true },
    { id: 'lectura_larga', label: 'Lectura larga', needsRef: true },
    { id: 'responsorio', label: 'Responsorio' },
    { id: 'preces', label: 'Preces / intercesiones' },
    { id: 'padrenuestro', label: 'Padre nuestro' },
    { id: 'oracion', label: 'Oración' },
    { id: 'bendicion', label: 'Bendición final' },
    { id: 'antifona_mariana', label: 'Antífona mariana final' },
    { id: 'cierre', label: 'Verso de cierre' },
    { id: 'texto', label: 'Texto libre' }
  ];

  function midday() {
    return [
      { tipo: 'apertura' }, { tipo: 'himno' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 1' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 2' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 3' },
      { tipo: 'lectura_breve' }, { tipo: 'responsorio' },
      { tipo: 'oracion' }, { tipo: 'cierre' }
    ];
  }

  /* Plantillas por hora: el orden real de piezas, con el texto en
     blanco. Sirven solo para arrancar el editor ya montado; después
     se puede añadir, quitar, duplicar (p.ej. repetir la antífona) y
     reordenar libremente. */
  const HOUR_TEMPLATES = {
    oficio: [
      { tipo: 'invitatorio' }, { tipo: 'apertura' }, { tipo: 'himno' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 1' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 2' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 3' },
      { tipo: 'lectura_larga', ref: 'Primera lectura (bíblica)' }, { tipo: 'responsorio' },
      { tipo: 'lectura_larga', ref: 'Segunda lectura (Padres de la Iglesia)' }, { tipo: 'responsorio' },
      { tipo: 'oracion' }, { tipo: 'cierre' }
    ],
    laudes: [
      { tipo: 'apertura' }, { tipo: 'himno' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 1' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Cántico del Antiguo Testamento' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 2' },
      { tipo: 'lectura_breve' }, { tipo: 'responsorio' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Cántico de Zacarías (Benedictus)' },
      { tipo: 'preces' }, { tipo: 'padrenuestro' }, { tipo: 'oracion' },
      { tipo: 'bendicion' }, { tipo: 'cierre' }
    ],
    tercia: midday(),
    sexta: midday(),
    nona: midday(),
    visperas: [
      { tipo: 'apertura' }, { tipo: 'himno' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 1' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 2' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Cántico del Nuevo Testamento' },
      { tipo: 'lectura_breve' }, { tipo: 'responsorio' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Cántico de María (Magníficat)' },
      { tipo: 'preces' }, { tipo: 'padrenuestro' }, { tipo: 'oracion' },
      { tipo: 'cierre' }
    ],
    completas: [
      { tipo: 'apertura' }, { tipo: 'himno' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 1' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Salmo 2' },
      { tipo: 'lectura_breve' }, { tipo: 'responsorio' },
      { tipo: 'antifona' }, { tipo: 'salmo', ref: 'Cántico de Simeón (Nunc dimittis)' },
      { tipo: 'oracion' }, { tipo: 'antifona_mariana' }, { tipo: 'cierre' }
    ]
  };

  function templateFor(hourId) {
    const t = HOUR_TEMPLATES[hourId];
    return t ? t.map((p) => Object.assign({ texto: '' }, p)) : [];
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeAll(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) { /* se omite */ }
  }

  function list() {
    return readAll().sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
  }
  function get(id) {
    return readAll().find((o) => o.id === id) || null;
  }
  function save(office) {
    const all = readAll();
    if (!office.id) office.id = 'co_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (!office.creado) office.creado = new Date().toISOString();
    if (!Array.isArray(office.piezas)) office.piezas = [];
    const idx = all.findIndex((o) => o.id === office.id);
    if (idx >= 0) all[idx] = office; else all.push(office);
    writeAll(all);
    return office;
  }
  function remove(id) {
    writeAll(readAll().filter((o) => o.id !== id));
  }

  /* Aviso de "hoy toca este oficio" -nunca sustituye nada-. Prioridad:
     festividad > fecha fija > "siempre". */
  function forHour(hourId, date, info) {
    const all = readAll().filter((o) => o.vinculo && o.vinculo.activo && o.vinculo.horaId === hourId);
    if (!all.length) return null;
    const celebration = ((info && info.celebration) || '').toLowerCase();
    const mes = date.getMonth() + 1, dia = date.getDate();

    const porFestividad = all.find((o) => o.vinculo.modo === 'festividad' &&
      o.vinculo.patron && celebration.indexOf(String(o.vinculo.patron).toLowerCase()) !== -1);
    if (porFestividad) return porFestividad;

    const porFecha = all.find((o) => o.vinculo.modo === 'fecha' &&
      Number(o.vinculo.mes) === mes && Number(o.vinculo.dia) === dia);
    if (porFecha) return porFecha;

    const siempre = all.find((o) => o.vinculo.modo === 'siempre');
    if (siempre) return siempre;

    return null;
  }

  /* Igual que forHour, pero mirando las siete horas: para el aviso
     resumen "hoy toca..." en la portada de Mis oficios. */
  function forAnyToday(hourIds, date, info) {
    const out = [];
    for (const hourId of hourIds) {
      const o = forHour(hourId, date, info);
      if (o) out.push({ hourId, office: o });
    }
    return out;
  }

  /* Mezclar horas oficiales y personalizadas: asignación explícita y
     visible, hora por hora ("en Oficio de lectura usa este mío, en
     Laudes el oficial"). Nunca automática ni por calendario -eso es el
     aviso de arriba-, así el usuario decide y no hay sorpresas. */
  const ASSIGN_KEY = 'liturgia.customoffice.assign.v1';
  function readAssignments() {
    try {
      const raw = localStorage.getItem(ASSIGN_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) { return {}; }
  }
  function getAssignment(hourId) {
    const a = readAssignments()[hourId];
    return a ? get(a) : null;
  }
  function setAssignment(hourId, officeId) {
    const all = readAssignments();
    if (officeId) all[hourId] = officeId; else delete all[hourId];
    try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(all)); } catch (e) { /* se omite */ }
  }
  function assignedHourFor(officeId) {
    const all = readAssignments();
    for (const hourId in all) if (all[hourId] === officeId) return hourId;
    return null;
  }

  return {
    PIEZA_TIPOS, HOUR_TEMPLATES, templateFor, list, get, save, remove, forHour, forAnyToday,
    getAssignment, setAssignment, assignedHourFor
  };
})();
