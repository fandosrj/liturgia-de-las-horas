/* ============================================================
   Subrayado de versos y notas personales (lectio divina)
   No altera la interfaz principal: se añade sobre el texto ya
   renderizado por el motor de rezo (breviarium).
   ============================================================ */

window.Notes = (() => {
  'use strict';

  const KEY_U = 'liturgia.underline.v1';
  const KEY_N = 'liturgia.notes.v1';

  function load(k, empty) {
    try {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : empty;
    } catch (e) { return empty; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { }
  }

  let underlined = load(KEY_U, []); // array de claves de linea (texto exacto de la linea)
  let notes = load(KEY_N, {}); // { [id]: { texto, ts } }

  function lineKey(text) {
    return String(text || '').trim().toLowerCase();
  }

  function isUnderlined(text) {
    return underlined.indexOf(lineKey(text)) !== -1;
  }

  function toggleUnderline(text) {
    const k = lineKey(text);
    if (!k) return false;
    const i = underlined.indexOf(k);
    if (i === -1) { underlined.push(k); save(KEY_U, underlined); return true; }
    underlined.splice(i, 1);
    save(KEY_U, underlined);
    return false;
  }

  function getNote(id) {
    return (notes[id] && notes[id].texto) || '';
  }

  function hasNote(id) {
    return !!(notes[id] && notes[id].texto);
  }

  function setNote(id, texto) {
    const t = String(texto || '').trim();
    if (!t) { delete notes[id]; save(KEY_N, notes); return; }
    notes[id] = { texto: t, ts: Date.now() };
    save(KEY_N, notes);
  }

  return { isUnderlined, toggleUnderline, getNote, hasNote, setNote };
})();
