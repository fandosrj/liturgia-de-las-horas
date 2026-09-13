/* ============================================================
   Personalizar piezas sueltas del oficio oficial (Nivel 1)
   Guarda un texto propio para una antífona, las preces o la
   oración final, indexado por el texto original (no por fecha):
   así, si esa misma pieza vuelve a aparecer otro día, se sirve
   automáticamente el texto personalizado.
   ============================================================ */
window.CustomText = (() => {
  function hash(s) {
    s = String(s || '');
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function key(original) { return 'liturgia.customtext.v1.' + hash(original); }

  function get(original) {
    try { return localStorage.getItem(key(original)) || ''; } catch (e) { return ''; }
  }
  function has(original) { return !!get(original); }
  function set(original, nuevoTexto) {
    try {
      const k = key(original);
      const v = String(nuevoTexto == null ? '' : nuevoTexto).trim();
      if (v && v !== String(original || '').trim()) localStorage.setItem(k, nuevoTexto);
      else localStorage.removeItem(k);
    } catch (e) { /* localStorage no disponible: se omite */ }
  }
  function clear(original) {
    try { localStorage.removeItem(key(original)); } catch (e) { }
  }

  return { get, has, set, clear };
})();
