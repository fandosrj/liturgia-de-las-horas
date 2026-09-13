/* ============================================================
   Oficios personalizados (Niveles 2 y 3)
   Plantilla libre para construir una hora entera desde cero
   (antífonas, salmos, lecturas, responsorios, preces, oración...)
   y, opcionalmente, vincularla a una hora canónica: siempre, en
   una fecha fija cada año, o cuando la festividad del día coincida
   con un texto (p.ej. "Asunción"). Todo se guarda en el dispositivo.
   ============================================================ */
window.CustomOffice = (() => {
  const KEY = 'liturgia.customoffice.v1';

  const PIEZA_TIPOS = [
    { id: 'antifona', label: 'Antífona' },
    { id: 'salmo', label: 'Salmo o cántico' },
    { id: 'lectura', label: 'Lectura breve' },
    { id: 'responsorio', label: 'Responsorio' },
    { id: 'preces', label: 'Preces / intercesiones' },
    { id: 'oracion', label: 'Oración' },
    { id: 'texto', label: 'Texto libre' }
  ];

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

  /* ¿Qué oficio propio sustituye a esta hora canónica hoy? Prioridad:
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

  return { PIEZA_TIPOS, list, get, save, remove, forHour };
})();
