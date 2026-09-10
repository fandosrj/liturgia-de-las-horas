/* Arranque de app.js con DOM simulado: verifica que init() no lanza y que
   homeView, hourView, lecturasView y bibliaView produzcan HTML. */
const vm = require('vm');
const fs = require('fs');

function mkEl(tag, attrs) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [],
    dataset: attrs || {},
    style: {},
    _html: '',
    _text: '',
    classList: {
      _s: new Set(),
      add: function () { for (const a of arguments) this._s.add(a); },
      remove: function () { for (const a of arguments) this._s.delete(a); },
      toggle: function (a, f) { if (f === undefined ? !this._s.has(a) : f) this._s.add(a); else this._s.delete(a); },
      contains: function (a) { return this._s.has(a); }
    },
    setAttribute: function (k, v) { this[k] = v; },
    getAttribute: function (k) { return this[k] || null; },
    addEventListener: function () {},
    appendChild: function (c) { this.children.push(c); return c; },
    remove: function () { return this; },
    insertAdjacentHTML: function (pos, v) { this._html += v; return this; },
    querySelector: function () { return mkEl(); },
    querySelectorAll: function () { return []; },
    cloneNode: function () { return mkEl(); }
  };
  Object.defineProperty(el, 'innerHTML', {
    get: function () { return this._html; },
    set: function (v) { this._html = v; }
  });
  Object.defineProperty(el, 'textContent', {
    get: function () { return this._text; },
    set: function (v) { this._text = v; }
  });
  return el;
}

const els = { documentElement: mkEl('html') };
const elCache = {};
const doc = {
  documentElement: els.documentElement,
  querySelector: (sel) => {
    if (!elCache[sel]) elCache[sel] = mkEl('div', sel.includes('[data-') ? { tab: sel } : {});
    return elCache[sel];
  },
  querySelectorAll: (sel) => { const r = doc.querySelector(sel); r.all = []; return r.all; },
  createElement: (t) => mkEl(t),
  addEventListener: () => {},
  readyState: 'complete'
};

const sandbox = {
  console,
  document: doc,
  location: { hash: '#hoy', addEventListener: () => {}, host: 'localhost:4000', protocol: 'http:' },
  navigator: { serviceWorker: { register: () => Promise.resolve() }, geolocation: null },
  matchMedia: () => ({ matches: false }),
  fetch: async (path) => {
    const responses = {
      '/api/presence': { total: 3, hours: { laudes: 2, visperas: 1 }, countries: [{ cc: 'ES', name: 'España', flag: '🇪🇸', count: 2 }, { cc: 'MX', name: 'México', flag: '🇲🇽', count: 1 }], withGps: [{ lat: 40.4, lng: -3.7 }], ttl_ms: 90000 },
      '/api/presence/join': { total: 3, hours: { laudes: 2, visperas: 1 }, countries: [{ cc: 'ES', name: 'España', flag: '🇪🇸', count: 2 }], withGps: [{ lat: 40.4, lng: -3.7 }] },
      '/api/presence/leave': { total: 0, hours: {}, countries: [], withGps: [] },
      '/api/intentions?deviceId=': { intentions: [{ id: 1, text: 'Por los enfermos', prayed: 2, mine: false }] },
      '/api/intentions/list/mine?deviceId=': { mine: [{ id: 9, text: 'Mi petición', created_at: Date.now() - 5000, closed_at: Date.now() + 1000, prayed: 4 }] },
      '/api/intentions/news?deviceId=': { news: [{ text: 'Por mi madre', created_at: Date.now(), prayed: 5 }] },
      '/api/choirs/mine?deviceId=': { choirs: [{ code: '2KCNEK', name: 'La familia', nick: 'María' }] },
      '/api/choirs/2KCNEK/presence?deviceId=': { name: 'La familia', code: '2KCNEK', date: '2026-09-09', members: [{ nick: 'María', hours: { laudes: 1 }, now: null }] }
    };
    for (const k of Object.keys(responses)) {
      if (path.startsWith(k)) return { ok: true, json: async () => responses[k] };
    }
    return { ok: true, json: async () => ({}) };
  },
  confirm: () => true,
  FormData: function () {},
  WebSocket: undefined,
  localStorage: {
    _d: {},
    getItem: (k) => sandbox.localStorage._d[k] || null,
    setItem: (k, v) => { sandbox.localStorage._d[k] = String(v); },
    removeItem: (k) => { delete sandbox.localStorage._d[k]; },
    key: (i) => Object.keys(sandbox.localStorage._d)[i] || null,
    get length() { return Object.keys(sandbox.localStorage._d).length; }
  },
  Intl, Date, Promise, Math, JSON, Array, String, Object, RegExp, decodeURIComponent,
  setTimeout, clearTimeout, setInterval, clearInterval, window: null
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = () => {};
vm.createContext(sandbox);

function run(file) { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); }

(async () => {
  run('public/vendor/breviarium.umd.js');
  run('public/lib/store.js');
  run('public/lib/favs.js');
  run('public/lib/latin.js');
  run('public/lib/ortodoxo.js');
  run('public/lib/salterio.js');
  run('public/lib/santos.js');
  run('public/lib/oraciones.js');
  run('public/lib/liturgy.js');
  run('public/lib/biblia.js');
  run('public/lib/community.js');
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 2500)); // espera render asíncrono

  const view = doc.querySelector('#view').innerHTML;
  console.log('homeView HTML:', view.length, 'chars');
  console.log('  contiene "Ahora" y "REZAR":', view.includes('Ahora'), view.includes('REZAR'));
  console.log('  contiene contador:', /personas rezando ahora/.test(view));
  await new Promise((r) => setTimeout(r, 300));
  console.log('  países renderizados (España):', (doc.querySelector('#np-countries').innerHTML.includes('España')));
  console.log('  contiene chips de horas:', view.includes('hour-chip'));

  sandbox.location.hash = '#hora/oficio';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 2500));
  const v2 = doc.querySelector('#view').innerHTML;
  console.log('hourView(oficio):', v2.length, 'chars | contiene "Invitatorio":', /invitatorio|Invitatorio/i.test(v2));

  sandbox.location.hash = '#lecturas';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 2500));
  const v3 = doc.querySelector('#view').innerHTML;
  console.log('lecturasView (alias misal):', v3.length, 'chars | contiene "Evangelio":', v3.includes('Evangelio'), '| Misa del día:', v3.includes('Misa del día'));

  sandbox.location.hash = '#misal';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 2500));
  const v3b = doc.querySelector('#view').innerHTML;
  console.log('misalView:', v3b.length, 'chars | "La Misa, paso a paso":', v3b.includes('La Misa, paso a paso'));

  sandbox.location.hash = '#ortodoxa';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 1000));
  const v3c = doc.querySelector('#view').innerHTML;
  console.log('ortodoxaView:', v3c.length, 'chars | "Horologion":', v3c.includes('Horologion'), '| "Servicios del día":', v3c.includes('Servicios del día'), '| sin Wikipedia:', !v3c.includes('Wikipedia'));

  sandbox.location.hash = '#ortodoxa/oficio/completas';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3g = doc.querySelector('#view').innerHTML;
  console.log('ortodoxoOficioView(completas):', v3g.length, 'chars | "Completas":', v3g.includes('Completas menores'), '| salmo:', v3g.includes('Miserere'), '| "encamina nuestra vida":', v3g.toLowerCase().includes('encamina nuestra vida'), '| botón:', v3g.includes('Marcar como rezado'));

  const kats = sandbox.Salterio.KATHISMATA;
  let presentes = 0;
  for (let i = 1; i <= 150; i++) if (sandbox.Salterio.PSALMOS[i]) presentes++;
  console.log('Salterio:', presentes, 'salmos | kathismata:', kats.length, '| semana lun:', JSON.stringify(sandbox.Salterio.SEMANA[1]), '| 118 trozos:', sandbox.Salterio.PSALMOS[118].length);

  sandbox.location.hash = '#ortodoxa/salterio';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3h = doc.querySelector('#view').innerHTML;
  console.log('salterioView:', v3h.length, 'chars | "Salterio en kathismas":', v3h.includes('Salterio en kathismas'), '| España:', v3h.includes('España'), '| Latinoamérica:', v3h.includes('Latinoamérica'), '| Kathisma XX:', v3h.includes('Salmos 143-150'), '| variante guardada:', (sandbox.Store.get().salterio || {}).variante === undefined);

  sandbox.location.hash = '#ortodoxa/kathisma/1';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3i = doc.querySelector('#view').innerHTML;
  console.log('kathismaView(1):', v3i.length, 'chars | "Kathisma 1":', v3i.includes('Kathisma 1'), '| Salmos 1-8:', v3i.includes('Salmos 1-8'), '| "Dichoso el hombre":', v3i.includes('Dichoso el hombre'), '| Gloria:', v3i.includes('Gloria al Padre'), '| botón:', v3i.includes('Marcar como rezado'));

  sandbox.location.hash = '#ortodoxa/kathisma/8';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3j = doc.querySelector('#view').innerHTML;
  console.log('kathismaView(8):', v3j.length, 'chars | Salmo 57 aviso:', v3j.includes('no incluye este salmo'), '| Salmo 62 presente:', v3j.includes('por ti madrugo'));

  // Módulos de favoritos y latín
  const f1 = sandbox.Favs.toggle('Salmo 62, 2-9', { ant: 'Mi alma está sedienta de ti', texto: 'Oye, oh Dios, mi clamor.' });
  console.log('Favs.toggle guarda:', f1 === true);
  console.log('Favs.idFor:', sandbox.Favs.idFor('Salmo 62, 2-9') === 'salmo-62-2-9');
  console.log('Favs.list:', sandbox.Favs.list().length, '| has:', sandbox.Favs.has('salmo-62-2-9') === true);
  const f2 = sandbox.Favs.toggle('Salmo 62, 2-9', { texto: 'x' });
  console.log('Favs.toggle desmarca:', f2 === false && sandbox.Favs.list().length === 0);
  sandbox.Favs.toggle('Salmo 26', { texto: 'El Señor es mi luz y mi salvación.' });
  const cid = sandbox.Favs.saveCustom('Mi Vísperas', [{ tipo: 'fav', id: 'salmo-26' }, { tipo: 'latin', id: 'pater' }]);
  console.log('Favs.saveCustom:', sandbox.Favs.getCustom(cid).titulo === 'Mi Vísperas', 'piezas:', sandbox.Favs.getCustom(cid).items.length);
  console.log('LatinaRezado.oraciones:', sandbox.LatinaRezado.oraciones.length, '| oracionById(pater):', sandbox.LatinaRezado.oracionById('pater').titulo);

  sandbox.location.hash = '#personal';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 1000));
  const v3d = doc.querySelector('#view').innerHTML;
  console.log('personalView:', v3d.length, 'chars | "Salmos favoritos":', v3d.includes('Salmos favoritos'), '| "Rezos personalizados":', v3d.includes('Rezos personalizados'), '| Salmo guardado:', v3d.includes('Salmo 26'), '| rezo personal:', v3d.includes('Mi Vísperas'));

  sandbox.location.hash = '#latin';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3e = doc.querySelector('#view').innerHTML;
  console.log('latinView:', v3e.length, 'chars | "Rezo en latín":', v3e.includes('Rezo en latín'), '| "Padre nuestro":', v3e.includes('Padre nuestro'), '| latín/español sinc.', v3e.includes('lat-row') && v3e.includes('Pater noster') && v3e.includes('Padre nuestro, que estás'));

  sandbox.location.hash = '#personal/pray/' + encodeURIComponent(cid);
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v3f = doc.querySelector('#view').innerHTML;
  console.log('personalPrayView:', v3f.length, 'chars | título:', v3f.includes('Mi Vísperas'), '| salmo:', v3f.includes('El Señor es mi luz'), '| latín:', v3f.includes('Pater noster') && v3f.includes('lat-row'), '| botón marcar:', v3f.includes('Marcar como rezado'));

  sandbox.location.hash = '#personales/pray/' + encodeURIComponent('noop');
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 300));
  console.log('homeView tras recargar re-renderiza (Rezo del día):', doc.querySelector('#view').innerHTML.includes('Rezo del día'), '| grid:', doc.querySelector('#view').innerHTML.includes('rezo-grid'));

  // Módulos de santoral y oraciones (estilo ePrex)
  const santos = sandbox.Santos.dias;
  console.log('Santos:', Object.keys(santos).length, 'fechas | 2026-06-13:', JSON.stringify(santos['2026-06-13']), '| 2026-12-25:', JSON.stringify(santos['2026-12-25']), '| 2026-09-10 (sin santo):', (santos['2026-09-10'] || '—'));
  console.log('Oraciones:', sandbox.Oraciones.ORACIONES.length, 'ítems | grupos:', sandbox.Oraciones.GRUPOS.length, '| serie jueves(4):', sandbox.Oraciones.ROSARIO.serieDelDia(4), '| misterios luminosos:', sandbox.Oraciones.ROSARIO.MISTERIOS.luminosos.length, '| getOracion(padrenuestro):', sandbox.Oraciones.getOracion('padrenuestro') && sandbox.Oraciones.getOracion('padrenuestro').rezo.length > 0);
  console.log('Coronilla pasos:', sandbox.Oraciones.CORONILLA.grande.length > 0, '| santoDios:', sandbox.Oraciones.CORONILLA.santoDios.length > 0, '| Ángelus líneas:', sandbox.Oraciones.ANGELUS.angelus.length, '| Regina líneas:', sandbox.Oraciones.ANGELUS.regina.length);

  sandbox.location.hash = '#rosario';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const vR = doc.querySelector('#view').innerHTML;
  console.log('rosarioView:', vR.length, 'chars | "Santo Rosario":', vR.includes('Santo Rosario'), '| series 4:', ['Gozosos', 'Luminosos', 'Dolorosos', 'Gloriosos'].every((s) => vR.includes(s)), '| "Rezar los":', vR.includes('Rezar los'), '| tarjeta "hoy":', vR.includes('mystery-card hoy'));

  sandbox.location.hash = '#rosario/luminosos';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 400));
  const vR2 = doc.querySelector('#view').innerHTML;
  console.log('rosarioSerieView(luminosos):', vR2.length, 'chars | "Rosario · Luminosos":', vR2.includes('Rosario · Luminosos'), '| "Siguiente":', vR2.includes('Siguiente'), '| "Anterior":', vR2.includes('Anterior'), '| beads pavimento:', vR2.includes('ros-intro'));

  sandbox.location.hash = '#coronilla';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 400));
  const vC = doc.querySelector('#view').innerHTML;
  console.log('coronillaView:', vC.length, 'chars | "Padre Eterno":', vC.includes('Padre Eterno, yo te ofrezco'), '| "Por su dolorosa Pasión":', vC.includes('Por su dolorosa Pasión'), '| "Santo Dios":', vC.includes('Santo Dios, Santo Fuerte'), '| botón:', vC.includes('Marcar como rezada'));

  sandbox.location.hash = '#angelus';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 2500));
  const vA = doc.querySelector('#view').innerHTML;
  console.log('angelusView:', vA.length, 'chars | "Ángelus" o "Regina":', vA.includes('Ángelus') || vA.includes('Regina Caeli'), '| V/R:', vA.includes('<span class="vs">V.</span>'), '| botón:', vA.includes('Marcar como rezado'));

  sandbox.location.hash = '#oraciones';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 400));
  const vO = doc.querySelector('#view').innerHTML;
  console.log('oracionesView:', vO.length, 'chars | "Oraciones fundamentales":', vO.includes('Oraciones fundamentales'), '| "Salve":', vO.includes('Salve'), '| "Ofrecimiento del día":', vO.includes('Ofrecimiento del día'));

  sandbox.location.hash = '#oraciones/salve';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 400));
  const vO2 = doc.querySelector('#view').innerHTML;
  console.log('oracionView(salve):', vO2.length, 'chars | "Dios te salve, Reina":', vO2.includes('Dios te salve, Reina y Madre'), '| botón:', vO2.includes('Marcar como rezada'));
  const toggled = sandbox.Store.isPrayed(sandbox.currentDate || new Date(), 'orac_salve');
  console.log('Store armónico guarda oración (isPrayed orac_salve):', toggled === false);

  sandbox.location.hash = '#biblia';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 1000));
  const v4 = doc.querySelector('#view').innerHTML;
  console.log('bibliaView:', v4.length, 'chars | 73 libros:', (v4.match(/class=\"book\"/g) || []).length);

  sandbox.location.hash = '#ajustes';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 500));
  const v5 = doc.querySelector('#view').innerHTML;
  console.log('settingsView:', v5.includes('Ajustes') && v5.includes('Tema oscuro') ? 'OK' : 'FALLO');

  sandbox.location.hash = '#comunidad';
  run('public/app.js');
  await new Promise((r) => setTimeout(r, 1800));
  const v6 = doc.querySelector('#view').innerHTML;
  console.log('comunidadView:', v6.length, 'chars | Juntos ahora:', v6.includes('Juntos ahora') && v6.includes('Comunidad de rezo') ? 'OK' : 'FALLO');

  console.log('--- PRUEBA COMPLETA SIN ERRORES DE ARRANQUE ---');
  process.exit(0);
})().catch((e) => { console.error('FALLO DE ARRANQUE:', e); process.exit(1); });