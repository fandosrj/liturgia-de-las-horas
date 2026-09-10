/* ============================================================
   Comunidad · Cliente (presencia en vivo, intenciones, coros)
   Requiere el servidor (no funciona en modo 100% offline).
   Sin conexión: falla con gracia y la app de rezo sigue viva.
   ============================================================ */

(() => {
  'use strict';

  const Li = window.Community = {};

  /* --------------------------- Identidad --------------------------- */
  function deviceId() {
    let id = localStorage.getItem('liturgia.device.v1');
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem('liturgia.device.v1', id);
    }
    return id;
  }

  const DEVICE = deviceId();
  const TZ = () => -new Date().getTimezoneOffset();
  const TZNAME = () => {
    try { return (Intl && Intl.DateTimeFormat) ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : ''; }
    catch (e) { return ''; }
  };

  /* ----------------------------- Red ----------------------------- */
  async function api(path, opts) {
    opts = opts || {};
    let res;
    try {
      res = await fetch(path, Object.assign({
        headers: { 'Content-Type': 'application/json' },
        method: opts.body ? 'POST' : 'GET'
      }, opts.body ? { body: JSON.stringify(opts.body) } : {}));
    } catch (e) {
      throw new Error('Sin conexión con el servidor de comunidad.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { }
    if (!res.ok) throw new Error(data.error || 'Error del servidor (' + res.status + ')');
    return data;
  }

  /* ----------------------- Presencia geográfica ----------------------- */
  const GEO_KEY = 'liturgia.loc.v1';

  function locate() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      if (localStorage.getItem(GEO_KEY) !== 'y') return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000 }
      );
    });
  }

  let current = null;
  let heartbeat = null;

  async function joinHour(hourId) {
    try {
      const loc = await locate();
      const tzName = TZNAME();
      const body = { deviceId: DEVICE, hourId, tz: TZ(), tzName, lat: null, lng: null };
      if (loc) { body.lat = loc.lat; body.lng = loc.lng; }
      current = hourId;
      Li.currentHour = hourId;
      Li.status = await api('/api/presence/join', { body });
      clearInterval(heartbeat);
      heartbeat = setInterval(() => {
        if (!current) return;
        api('/api/presence/join', { body: { deviceId: DEVICE, hourId: current, tz: TZ(), tzName, lat: body.lat, lng: body.lng } })
          .then((s) => { Li.status = s; })
          .catch(() => {});
      }, 25 * 1000);
    } catch (e) { Li.status = null; }
  }

  async function leaveHour() {
    current = null;
    Li.currentHour = null;
    clearInterval(heartbeat);
    try { Li.status = await api('/api/presence/leave', { body: { deviceId: DEVICE } }); }
    catch (e) { Li.status = null; }
  }

  async function presence() {
    try { return await api('/api/presence'); }
    catch (e) { return { total: 0, hours: {}, countries: [], withGps: [], ttl_ms: 90000 }; }
  }

  /* ---------------------------- Intenciones ---------------------------- */
  const intentions = {
    open: () => api('/api/intentions?deviceId=' + encodeURIComponent(DEVICE)),
    add: (text) => api('/api/intentions', { body: { deviceId: DEVICE, text } }),
    pray: (id) => api('/api/intentions/' + id + '/pray', { body: { deviceId: DEVICE } }),
    report: (id) => api('/api/intentions/' + id + '/report', { body: { deviceId: DEVICE } }),
    news: () => api('/api/intentions/news?deviceId=' + encodeURIComponent(DEVICE)),
    mine: () => api('/api/intentions/list/mine?deviceId=' + encodeURIComponent(DEVICE))
  };

  /* ------------------------------- Coros ------------------------------- */
  const choirs = {
    mine: () => api('/api/choirs/mine?deviceId=' + encodeURIComponent(DEVICE)),
    create: (nick, name) => api('/api/choirs', { body: { deviceId: DEVICE, nick, name } }),
    join: (nick, code) => api('/api/choirs/join', { body: { deviceId: DEVICE, nick, code } }),
    leave: (code) => api('/api/choirs/' + code + '/leave', { body: { deviceId: DEVICE } }),
    prayed: (code, date, hour) => api('/api/choirs/' + code + '/pray', { body: { deviceId: DEVICE, date, hour, tz: TZ() } }),
    presence: (code, date) => api('/api/choirs/' + code + '/presence?deviceId=' + encodeURIComponent(DEVICE) + '&date=' + encodeURIComponent(date))
  };

  /* --------------------------- Socket en vivo --------------------------- */
  let socket = null;
  let reconnectTimer = null;
  const listeners = {};

  /* Suscripción a eventos por WebSocket: Li.on('presence' | 'chorevt', fn) -> fn(payload) */
  Li.on = (topic, fn) => {
    (listeners[topic] = listeners[topic] || new Set()).add(fn);
    return () => { const s = listeners[topic]; if (s) s.delete(fn); };
  };
  Li.off = (topic, fn) => { const s = listeners[topic]; if (s) s.delete(fn); };
  Li.onPresence = null;   // fn(payload) cuando llega presencia (legacy, sigue funcionando)

  function ensureSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    try {
      socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    } catch (e) { return; }
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.id === 'presence' && Li.onPresence) Li.onPresence(msg.payload);
        const set = listeners[msg.id];
        if (set) set.forEach((fn) => { try { fn(msg.payload); } catch (e) {} });
      } catch (e) { }
    };
    socket.onclose = () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => { socket = null; ensureSocket(); }, 5000);
    };
  }

  Li.deviceId = DEVICE;
  Li.api = api;
  Li.joinHour = joinHour;
  Li.leaveHour = leaveHour;
  Li.presence = presence;
  Li.locate = locate;
  Li.GEO_KEY = GEO_KEY;
  Li.ensureSocket = ensureSocket;
  Li.intentions = intentions;
  Li.choirs = choirs;
})();