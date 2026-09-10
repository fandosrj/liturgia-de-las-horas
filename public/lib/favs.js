/* ============================================================
   Mis salmos y rezos personalizados
   Favoritos (★) sobre el salterio del día y combinaciones de
   rezo propias: salmos guardados + oraciones en latín.
   ============================================================ */

window.Favs = (() => {
  'use strict';

  const KEY_F = 'liturgia.favs.v1';
  const KEY_C = 'liturgia.custom.v1';

  function load(k, empty) {
    try {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : empty;
    } catch (e) { return empty; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { }
  }

  let favs = load(KEY_F, []);
  let customs = load(KEY_C, []);

  /* id estable desde la referencia del salmo: "Salmo 62, 2-9" -> "salmo-62-2-9" */
  function idFor(ref) {
    return String(ref || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'salmo';
  }

  /* ---------------------------- Favoritos ---------------------------- */
  function list() { return favs.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)); }
  function has(id) { return favs.some((f) => f.id === id); }
  function get(id) { return favs.find((f) => f.id === id) || null; }

  function remove(id) {
    favs = favs.filter((f) => f.id !== id);
    save(KEY_F, favs);
  }

  /* Devuelve true si quedó guardado, false si se quitó */
  function toggle(ref, data, hourId) {
    const id = idFor(ref);
    if (has(id)) { remove(id); return false; }
    favs.push({
      id,
      ref: String(ref || ''),
      ant: (data && data.ant) || '',
      texto: (data && data.texto) || '',
      hora: hourId || '',
      ts: Date.now()
    });
    save(KEY_F, favs);
    return true;
  }

  /* ------------------------ Rezos personalizados ------------------------ */
  function customsList() { return customs.slice().sort((a, b) => (a.creado || 0) - (b.creado || 0)); }
  function getCustom(id) { return customs.find((c) => c.id === id) || null; }

  /* items: [{ tipo: 'fav'|'latin', id }] */
  function saveCustom(nombre, items) {
    const id = 'rz' + Date.now().toString(36);
    customs.push({
      id,
      titulo: String(nombre || 'Rezo personalizado').trim() || 'Rezo personalizado',
      items: items || [],
      creado: Date.now()
    });
    save(KEY_C, customs);
    return id;
  }

  function deleteCustom(id) {
    customs = customs.filter((c) => c.id !== id);
    save(KEY_C, customs);
  }

  return { idFor, list, has, get, remove, toggle, customsList, getCustom, saveCustom, deleteCustom };
})();