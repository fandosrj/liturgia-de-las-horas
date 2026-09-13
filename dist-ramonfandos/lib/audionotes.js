/* ============================================================
   Grabaciones de voz propias por salmo (o MP3 subido)
   Guardadas en IndexedDB (los audios no caben bien en localStorage).
   No altera la interfaz principal: un boton discreto por salmo.
   ============================================================ */

window.AudioNotes = (() => {
  'use strict';

  const DB_NAME = 'liturgia-audio-v1';
  const STORE = 'clips';
  let dbPromise = null;

  function supported() {
    return 'indexedDB' in window;
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!supported()) { reject(new Error('sin IndexedDB')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function save(id, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ blob, ts: Date.now(), type: blob.type || '' }, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function get(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function has(id) {
    try { return !!(await get(id)); } catch (e) { return false; }
  }

  async function remove(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { supported, save, get, has, remove };
})();
