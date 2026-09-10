/* ============================================================
   Almacenamiento local: ajustes, horas rezadas y Biblia importada
   ============================================================ */

const Store = (() => {
  const KEY = 'liturgia.horas.v1';
  const BIBLE_KEY = 'liturgia.biblia.v1';

  const defaults = {
    theme: 'auto',        // 'light' | 'dark' | 'auto'
    fontSize: 'M',        // 'S' | 'M' | 'L'
    showDailyReadings: true,
    prayed: {}            // { 'YYYY-MM-DD': { horaId: true, ... } }
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return { ...defaults, ...saved, prayed: saved.prayed || {} };
    } catch (e) {
      return { ...defaults };
    }
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function get() { return state; }

  function set(patch) {
    state = { ...state, ...patch };
    save();
  }

  function key(date, hourId) { return date.toISOString().slice(0, 10); }

  function togglePrayed(date, hourId) {
    const k = key(date, hourId) + '_' + hourId;
    const prayed = { ...state.prayed };
    if (prayed[k]) delete prayed[k];
    else prayed[k] = true;
    state.prayed = prayed;
    save();
    return !!prayed[k];
  }

  function isPrayed(date, hourId) {
    return !!(state.prayed[key(date, hourId) + '_' + hourId]);
  }

  function prayedCount(date) {
    let n = 0;
    for (const k in state.prayed) if (k.startsWith(date.toISOString().slice(0, 10) + '_')) n++;
    return n;
  }

  function resetPrayed(date) {
    const prefix = date.toISOString().slice(0, 10) + '_';
    const prayed = {};
    for (const k in state.prayed) if (!k.startsWith(prefix)) prayed[k] = true;
    state.prayed = prayed;
    save();
  }

  /* ------------------ Biblia importada (texto del usuario) ------------------ */
  function saveBible(payload) {
    try {
      localStorage.setItem(BIBLE_KEY, JSON.stringify(payload));
    } catch (e) {
      return { ok: false, error: 'No se pudo guardar: el archivo es demasiado grande para este dispositivo.' };
    }
    return { ok: true };
  }

  function getBible() {
    try {
      const raw = localStorage.getItem(BIBLE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function removeBible() { localStorage.removeItem(BIBLE_KEY); }

  return {
    get, set, togglePrayed, isPrayed, prayedCount, resetPrayed,
    saveBible, getBible, removeBible
  };
})();

window.Store = Store;