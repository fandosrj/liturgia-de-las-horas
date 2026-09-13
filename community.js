/* ============================================================
   Community · Presencia en vivo, intenciones y coros pequeños.
   Backend Node: WebSockets (ws) + SQLite (node:sqlite).
   Principio de diseño: comunidad sin toxicidad.
   - Sin rankings, sin puntos, sin rachas públicas ni presión.
   - Presencia anónima y efímera (no se guarda GPS).
   - Intenciones anónimas (hash del dispositivo como autor).
   - Coros privados con presencia, no con clasificaciones.
   ============================================================ */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const SALT = 'liturgia-intencion-v1';
const PRESENCE_TTL_MS = 90 * 1000;
const PING_MS = 25 * 1000;

/* Zona IANA → país (código ISO). Permite mostrar países sin GPS. */
const ZONES = {
  'Europe/Madrid': 'ES', 'Africa/Ceuta': 'ES', 'Atlantic/Canary': 'ES', 'Atlantic/Madeira': 'PT', 'Europe/Lisbon': 'PT', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Rome': 'IT', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Luxembourg': 'LU', 'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL', 'Europe/Copenhagen': 'DK', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Helsinki': 'FI', 'Europe/Reykjavik': 'IS', 'Europe/Athens': 'GR', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Bratislava': 'SK', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Zagreb': 'HR', 'Europe/Belgrade': 'RS', 'Europe/Ljubljana': 'SI', 'Europe/Sarajevo': 'BA', 'Europe/Skopje': 'MK', 'Europe/Tirane': 'AL', 'Europe/Podgorica': 'ME', 'Europe/Vatican': 'VA', 'Europe/San_Marino': 'SM', 'Europe/Monaco': 'MC', 'Europe/Andorra': 'AD', 'Europe/Valletta': 'MT', 'Europe/Nicosia': 'CY', 'Europe/Tallinn': 'EE', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Kyiv': 'UA', 'Europe/Chisinau': 'MD', 'Europe/Minsk': 'BY', 'Europe/Moscow': 'RU', 'Europe/Kaliningrad': 'RU', 'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR', 'Europe/Chisinau_Moldova': 'MD',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX', 'America/Mazatlan': 'MX', 'America/Hermosillo': 'MX', 'America/Cancun': 'MX', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'America/Phoenix': 'US', 'Pacific/Honolulu': 'US', 'America/Detroit': 'US', 'America/Boston': 'US', 'America/Miami': 'US', 'America/Atlanta': 'US', 'America/Halifax': 'CA', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Regina': 'CA', 'America/St_Johns': 'CA', 'America/Winnipeg': 'CA', 'America/Montreal': 'CA', 'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR', 'America/Bahia': 'BR', 'America/Recife': 'BR', 'America/Buenos_Aires': 'AR', 'America/Cordoba': 'AR', 'America/Santiago': 'CL', 'America/Lima': 'PE', 'America/Bogota': 'CO', 'America/Caracas': 'VE', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Montevideo': 'UY', 'America/Guayaquil': 'EC', 'America/Panama': 'PA', 'America/Costa_Rica': 'CR', 'America/Guatemala': 'GT', 'America/Managua': 'NI', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN', 'America/Santo_Domingo': 'DO', 'America/Havana': 'CU', 'America/Jamaica': 'JM', 'America/Port-au-Prince': 'HT', 'America/Puerto_Rico': 'PR',
  'Europe/Madrid/UTC_math': 'ES',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Pyongyang': 'KP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Kolkata': 'IN', 'Asia/New_Delhi': 'IN', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kabul': 'AF', 'Asia/Tehran': 'IR', 'Asia/Baghdad': 'IQ', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Jerusalem': 'IL', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY', 'Asia/Doha': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM', 'Asia/Almaty': 'KZ', 'Asia/Tashkent': 'UZ', 'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Kathmandu': 'NP', 'Asia/Yangon': 'MM', 'Asia/Phnom_Penh': 'KH', 'Asia/Vientiane': 'LA', 'Asia/Ulaanbaatar': 'MN', 'Asia/Yekaterinburg': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Vladivostok': 'RU', 'Asia/Tokyo_UTC': 'JP',
  'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE', 'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ', 'Africa/Tripoli': 'LY', 'Africa/Khartoum': 'SD', 'Africa/Addis_Ababa': 'ET', 'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Lusaka': 'ZM', 'Africa/Harare': 'ZW', 'Africa/Maputo': 'MZ', 'Africa/Luanda': 'AO', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Kinshasa': 'CD', 'Africa/Douala': 'CM', 'Africa/Niamey': 'NE', 'Africa/Bamako': 'ML', 'Africa/Ouagadougou': 'BF', 'Africa/Conakry': 'GN', 'Africa/Freetown': 'SL', 'Africa/Monrovia': 'LR', 'Africa/Port-Louis': 'MU', 'Africa/Antananarivo': 'MG', 'Africa/Kigali': 'RW', 'Africa/Bujumbura': 'BI',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Darwin': 'AU', 'Australia/Hobart': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Fiji': 'FJ', 'Pacific/Tongatapu': 'TO', 'Pacific/Port_Moresby': 'PG', 'Pacific/Guam': 'GU',
  'UTC': null
};
const CC_NAMES = {
  ES: 'España', PT: 'Portugal', GB: 'Reino Unido', IE: 'Irlanda', IT: 'Italia', FR: 'Francia', DE: 'Alemania', AT: 'Austria', CH: 'Suiza', LU: 'Luxemburgo', BE: 'Bélgica', NL: 'Países Bajos', DK: 'Dinamarca', SE: 'Suecia', NO: 'Noruega', FI: 'Finlandia', IS: 'Islandia', GR: 'Grecia', PL: 'Polonia', CZ: 'Chequia', SK: 'Eslovaquia', HU: 'Hungría', RO: 'Rumanía', BG: 'Bulgaria', HR: 'Croacia', RS: 'Serbia', SI: 'Eslovenia', BA: 'Bosnia', MK: 'Macedonia del N.', AL: 'Albania', ME: 'Montenegro', VA: 'Ciudad del Vaticano', SM: 'San Marino', MC: 'Mónaco', AD: 'Andorra', MT: 'Malta', CY: 'Chipre', EE: 'Estonia', LV: 'Letonia', LT: 'Lituania', UA: 'Ucrania', MD: 'Moldavia', BY: 'Bielorrusia', RU: 'Rusia', TR: 'Turquía',
  MX: 'México', US: 'Estados Unidos', CA: 'Canadá', BR: 'Brasil', AR: 'Argentina', CL: 'Chile', PE: 'Perú', CO: 'Colombia', VE: 'Venezuela', BO: 'Bolivia', PY: 'Paraguay', UY: 'Uruguay', EC: 'Ecuador', PA: 'Panamá', CR: 'Costa Rica', GT: 'Guatemala', NI: 'Nicaragua', SV: 'El Salvador', HN: 'Honduras', DO: 'Rep. Dominicana', CU: 'Cuba', JM: 'Jamaica', HT: 'Haití', PR: 'Puerto Rico',
  JP: 'Japón', KR: 'Corea del S.', KP: 'Corea del N.', CN: 'China', HK: 'Hong Kong', TW: 'Taiwán', SG: 'Singapur', TH: 'Tailandia', VN: 'Vietnam', ID: 'Indonesia', PH: 'Filipinas', MY: 'Malasia', IN: 'India', PK: 'Pakistán', BD: 'Bangladés', LK: 'Sri Lanka', AF: 'Afganistán', IR: 'Irán', IQ: 'Irak', SA: 'Arabia Saudí', AE: 'Emiratos', IL: 'Israel', JO: 'Jordania', LB: 'Líbano', SY: 'Siria', QA: 'Catar', KW: 'Kuwait', BH: 'Baréin', OM: 'Omán', KZ: 'Kazajistán', UZ: 'Uzbekistán', AZ: 'Azerbaiyán', GE: 'Georgia', AM: 'Armenia', NP: 'Nepal', MM: 'Birmania', KH: 'Camboya', LA: 'Laos', MN: 'Mongolia',
  EG: 'Egipto', ZA: 'Sudáfrica', KE: 'Kenia', NG: 'Nigeria', GH: 'Ghana', MA: 'Marruecos', TN: 'Túnez', DZ: 'Argelia', LY: 'Libia', SD: 'Sudán', ET: 'Etiopía', TZ: 'Tanzania', UG: 'Uganda', ZM: 'Zambia', ZW: 'Zimbabue', MZ: 'Mozambique', AO: 'Angola', SN: 'Senegal', CI: 'Costa de Marfil', CD: 'Congo', CM: 'Camerún', NE: 'Níger', ML: 'Malí', BF: 'Burkina Faso', GN: 'Guinea', SL: 'Sierra Leona', LR: 'Liberia', MU: 'Mauricio', MG: 'Madagascar', RW: 'Ruanda', BI: 'Burundi',
  AU: 'Australia', NZ: 'Nueva Zelanda', FJ: 'Fiyi', TO: 'Tonga', PG: 'Papúa N. Guinea', GU: 'Guam'
};
function ccOf(zone) { return (zone && ZONES[zone]) || null; }
function countryName(cc) { return CC_NAMES[cc] || null; }
function flagOf(cc) {
  if (!cc || cc.length !== 2) return '&#127760;';
  const a = 0x1f1e6 + cc.charCodeAt(0) - 65, b = 0x1f1e6 + cc.charCodeAt(1) - 65;
  return String.fromCodePoint(a, b);
}

function db(pathname) {
  const dir = path.dirname(pathname);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const d = new DatabaseSync(pathname);
  d.exec(`
    CREATE TABLE IF NOT EXISTS intentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_hash TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      closed_at INTEGER NOT NULL,
      seen INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS intention_prayers (
      intention_id INTEGER NOT NULL,
      device_hash TEXT NOT NULL,
      PRIMARY KEY (intention_id, device_hash)
    );
    CREATE TABLE IF NOT EXISTS intention_reports (
      intention_id INTEGER NOT NULL,
      device_hash TEXT NOT NULL,
      PRIMARY KEY (intention_id, device_hash)
    );
    CREATE TABLE IF NOT EXISTS choirs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS choir_members (
      choir_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      nick TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (choir_id, device_id)
    );
    CREATE TABLE IF NOT EXISTS choir_prayers (
      choir_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      local_date TEXT NOT NULL,
      hour TEXT NOT NULL,
      ts INTEGER NOT NULL,
      PRIMARY KEY (choir_id, device_id, local_date, hour)
    );
    CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code_admin TEXT NOT NULL UNIQUE,
      code_member TEXT NOT NULL UNIQUE,
      code_guest TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS space_members (
      space_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      nick TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (space_id, device_id)
    );
    CREATE TABLE IF NOT EXISTS space_offices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      piezas TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'borrador',
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS space_office_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      office_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      piezas TEXT NOT NULL,
      version INTEGER NOT NULL,
      updated_by TEXT,
      note TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  return d;
}

function hash(key) {
  return crypto.createHash('sha256').update(SALT + ':' + key).digest('hex');
}

function clean(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function createCommunityServer(engine, base) {
  const dbFile = process.env.LITURGIA_DB || path.join(__dirname, 'data', 'liturgia.db');
  const d = db(dbFile);
  const presence = new Map();          // deviceId -> {hourId, lat, lng, tz, ts}
  const push = engine.push;            // fn(topic, payload) hacia los clientes web
  const rate = new Map();              // ip -> {count, windowStart}

  function rateOk(ip) {
    const now = Date.now();
    const cur = rate.get(ip) || { count: 0, windowStart: now };
    if (now - cur.windowStart > 60 * 1000) cur.count = 0, cur.windowStart = now;
    cur.count++;
    rate.set(ip, cur);
    return cur.count <= 60;
  }

  function purgePresence() {
    const now = Date.now();
    let changed = false;
    for (const [k, v] of presence) if (now - v.ts > PRESENCE_TTL_MS) { presence.delete(k); changed = true; }
    return changed;
  }

  function presenceSnapshot() {
    purgePresence();
    const now = Date.now();
    const hours = {};
    const byCountry = {};
    const withGps = [];
    let total = 0;
    for (const p of presence.values()) {
      if (now - p.ts > PRESENCE_TTL_MS) continue;
      total++;
      hours[p.hourId] = (hours[p.hourId] || 0) + 1;
      if (p.cn) byCountry[p.cn] = (byCountry[p.cn] || 0) + 1;
      if (p.lat != null && p.lng != null) withGps.push({ lat: p.lat, lng: p.lng });
    }
    const countries = Object.keys(byCountry).map((cc) => ({
      cc, name: countryName(cc) || cc, flag: flagOf(cc), count: byCountry[cc]
    })).sort((a, b) => b.count - a.count);
    return { total, hours, countries, withGps, ttl_ms: PRESENCE_TTL_MS };
  }

  function joinPresence(deviceId, hourId, tz, lat, lng, tzName) {
    presence.set(deviceId, {
      hourId,
      tz: tz || 0,
      cn: ccOf(tzName),
      lat: (lat == null || Number.isNaN(+lat)) ? null : +lat,
      lng: (lng == null || Number.isNaN(+lng)) ? null : +lng,
      ts: Date.now()
    });
    push('presence', presenceSnapshot());
  }

  function leavePresence(deviceId) {
    if (presence.delete(deviceId)) push('presence', presenceSnapshot());
  }

  /* ------------- Espacios: comunidades para oficios personalizados -------------
     Sin cuentas de correo: un código de acceso hace de identidad (como los
     coros). Tres códigos por espacio, uno por nivel de acceso: admin, member
     (reza y ve lo publicado) y guest (solo lectura, para invitados). El
     administrador puede además ascender a alguien a "editor" a mano. */
  function genCode(len) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length: len || 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
  function uniqueCode(len) {
    let code;
    do { code = genCode(len); }
    while (d.prepare('SELECT id FROM spaces WHERE code_admin = ? OR code_member = ? OR code_guest = ?').get(code, code, code));
    return code;
  }
  function memberRole(spaceId, deviceId) {
    const row = d.prepare('SELECT role FROM space_members WHERE space_id = ? AND device_id = ?').get(spaceId, deviceId);
    return row ? row.role : null;
  }
  function canEdit(role) { return role === 'admin' || role === 'editor'; }
  function snapshotVersion(office, note) {
    d.prepare('INSERT INTO space_office_versions (office_id, nombre, piezas, version, updated_by, note, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(office.id, office.nombre, office.piezas, office.version, office.updated_by, note || null, Date.now());
  }

  /* --------------------------- Router --------------------------- */
  function handle(req, res) {
    const url = new URL((req.originalUrl || req.url), 'http://localhost');
    let api = url.pathname;   // /api/...
    if (base) api = api.startsWith(base) ? api.slice(base.length) : api;
    const ip = req.socket.remoteAddress || '?';
    const bodyPromise = req.method === 'POST' || req.method === 'PUT'
      ? new Promise((resolve) => {
          let data = '';
          req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
          req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
        })
      : Promise.resolve({});
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

    return bodyPromise.then(async (body) => {
      try {
        /* ---------- Presencia ---------- */
        if (api === '/api/presence' && req.method === 'GET') {
          return send(200, presenceSnapshot());
        }
        if (api === '/api/presence/join' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const hourId = clean(body.hourId, 24);
          if (!deviceId || !hourId) return send(400, { error: 'Faltan datos' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          joinPresence(deviceId, hourId, body.tz, body.lat, body.lng, body.tzName);
          return send(200, presenceSnapshot());
        }
        if (api === '/api/presence/leave' && req.method === 'POST') {
          leavePresence(clean(body.deviceId, 64));
          return send(200, presenceSnapshot());
        }

        /* ---------- Intenciones ---------- */
        if (api === '/api/intentions' && req.method === 'GET') {
          const me = hash(clean(url.searchParams.get('deviceId'), 64));
          const now = Date.now();
          const rows = d.prepare(
            `SELECT i.id, i.text, COUNT(p.device_hash) AS prayed,
                    EXISTS(SELECT 1 FROM intention_prayers p2 WHERE p2.intention_id = i.id AND p2.device_hash = ?) AS mine
             FROM intentions i
             LEFT JOIN intention_prayers p ON p.intention_id = i.id
             WHERE i.closed_at > ? AND i.id NOT IN
               (SELECT r.intention_id FROM intention_reports r GROUP BY r.intention_id HAVING COUNT(*) >= 3)
             GROUP BY i.id ORDER BY i.id DESC LIMIT 60`
          ).all(me, now);
          return send(200, { intentions: rows.map((r) => ({ id: r.id, text: r.text, prayed: r.prayed, mine: !!r.mine })) });
        }
        if (api === '/api/intentions' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const text = clean(body.text, 280);
          if (!deviceId) return send(400, { error: 'Faltan datos' });
          if (text.length < 3) return send(400, { error: 'La intención es demasiado corta' });
          if (text.length > 280) return send(400, { error: 'La intención es demasiado larga (máx. 280)' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const author = hash(deviceId);
          const now = Date.now();
          const open = d.prepare('SELECT COUNT(*) c FROM intentions WHERE author_hash = ? AND closed_at > ?').get(author, now).c;
          if (open >= 2) return send(429, { error: 'Tienes ya dos intenciones en curso; espera a que terminen.' });
          const day = d.prepare('SELECT COUNT(*) c FROM intentions WHERE author_hash = ? AND created_at > ?').get(author, now - 24 * 3600 * 1000).c;
          if (day >= 10) return send(429, { error: 'Límite diario alcanzado' });
          const info = d.prepare('INSERT INTO intentions (author_hash, text, created_at, closed_at) VALUES (?,?,?,?)')
            .run(author, text, now, now + 24 * 3600 * 1000);
          push('intentions');
          return send(200, { id: Number(info.lastInsertRowid) });
        }
        if (api === '/api/intentions/news' && req.method === 'GET') {
          const author = hash(clean(url.searchParams.get('deviceId'), 64));
          const rows = d.prepare(
            `SELECT i.text, i.created_at, COUNT(p.device_hash) AS prayed
             FROM intentions i LEFT JOIN intention_prayers p ON p.intention_id = i.id
             WHERE i.author_hash = ? AND i.closed_at <= ? AND i.seen = 0
             GROUP BY i.id ORDER BY i.closed_at DESC LIMIT 5`
          ).all(author, Date.now());
          if (rows.length) d.prepare('UPDATE intentions SET seen = 1 WHERE author_hash = ? AND closed_at <= ? AND seen = 0')
            .run(author, Date.now());
          return send(200, { news: rows.map((r) => ({ text: r.text, created_at: r.created_at, prayed: r.prayed })) });
        }
        if (api === '/api/intentions/list/mine' && req.method === 'GET') {
          const author = hash(clean(url.searchParams.get('deviceId'), 64));
          const rows = d.prepare(
            `SELECT i.id, i.text, i.created_at, i.closed_at, COUNT(p.device_hash) AS prayed
             FROM intentions i LEFT JOIN intention_prayers p ON p.intention_id = i.id
             WHERE i.author_hash = ? GROUP BY i.id ORDER BY i.created_at DESC LIMIT 20`
          ).all(author);
          return send(200, { mine: rows.map((r) => ({ id: r.id, text: r.text, created_at: r.created_at, closed_at: r.closed_at, prayed: r.prayed })) });
        }
        const prayMatch = api.match(/^\/api\/intentions\/(\d+)\/pray$/);
        if (prayMatch && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          if (!deviceId) return send(400, { error: 'Faltan datos' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const id = +prayMatch[1];
          const existing = d.prepare('SELECT id FROM intentions WHERE id = ? AND closed_at > ?').get(id, Date.now());
          if (!existing) return send(404, { error: 'Esta intención ya no está activa.' });
          try {
            d.prepare('INSERT INTO intention_prayers (intention_id, device_hash) VALUES (?,?)').run(id, hash(deviceId));
          } catch {
            return send(200, { already: true, prayed: d.prepare('SELECT COUNT(*) c FROM intention_prayers WHERE intention_id = ?').get(id).c });
          }
          push('intentions');
          return send(200, { prayed: d.prepare('SELECT COUNT(*) c FROM intention_prayers WHERE intention_id = ?').get(id).c });
        }
        const reportMatch = api.match(/^\/api\/intentions\/(\d+)\/report$/);
        if (reportMatch && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          if (!deviceId) return send(400, { error: 'Faltan datos' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          try { d.prepare('INSERT INTO intention_reports (intention_id, device_hash) VALUES (?,?)').run(+reportMatch[1], hash(deviceId)); }
          catch { /* ya informó */ }
          return send(200, { ok: true });
        }

        /* ---------- Coros pequeños ---------- */
        if (api === '/api/choirs' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const nick = clean(body.nick, 20);
          const name = clean(body.name, 40);
          if (!deviceId || nick.length < 2 || !name) return send(400, { error: 'Faltan datos (nombre del coro y tu apodo).' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          let code = '';
          const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
          do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
          while (d.prepare('SELECT code FROM choirs WHERE code = ?').get(code));
          const now = Date.now();
          const info = d.prepare('INSERT INTO choirs (code, name, created_at) VALUES (?,?,?)').run(code, name, now);
          try {
            d.prepare('INSERT INTO choir_members (choir_id, device_id, nick, created_at) VALUES (?,?,?,?)').run(Number(info.lastInsertRowid), deviceId, nick, now);
          } catch { return send(409, { error: 'Ya eres miembro de otro coro creado antes.' }); }
          return send(200, { code });
        }
        if (api === '/api/choirs/join' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const nick = clean(body.nick, 20);
          const code = clean(body.code, 8).toUpperCase();
          if (!deviceId || nick.length < 2 || !code) return send(400, { error: 'Faltan datos (código y apodo).' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const choir = d.prepare('SELECT id, name FROM choirs WHERE code = ?').get(code);
          if (!choir) return send(404, { error: 'No existe ningún coro con ese código.' });
          try {
            d.prepare('INSERT INTO choir_members (choir_id, device_id, nick, created_at) VALUES (?,?,?,?)')
              .run(choir.id, deviceId, nick, Date.now());
          } catch { return send(409, { error: 'Ya perteneces a este coro.' }); }
          return send(200, { name: choir.name });
        }
        if (api === '/api/choirs/mine' && req.method === 'GET') {
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const rows = d.prepare(
            `SELECT c.code, c.name, m.nick FROM choirs c
             JOIN choir_members m ON m.choir_id = c.id
             WHERE m.device_id = ? ORDER BY c.created_at DESC`
          ).all(deviceId);
          return send(200, { choirs: rows });
        }
        const leaveMatch = api.match(/^\/api\/choirs\/([A-Za-z0-9]+)\/leave$/);
        if (leaveMatch && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const code = leaveMatch[1].toUpperCase();
          const choir = d.prepare('SELECT id FROM choirs WHERE code = ?').get(code);
          if (choir) d.prepare('DELETE FROM choir_members WHERE choir_id = ? AND device_id = ?').run(choir.id, deviceId);
          return send(200, { ok: true });
        }
        const prayChoirMatch = api.match(/^\/api\/choirs\/([A-Za-z0-9]+)\/pray$/);
        if (prayChoirMatch && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const code = prayChoirMatch[1].toUpperCase();
          const date = clean(body.date, 10);
          const hour = clean(body.hour, 24);
          const timezone = parseInt(body.tz, 10);
          if (!deviceId || !hour) return send(400, { error: 'Faltan datos' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const choir = d.prepare('SELECT id FROM choirs WHERE code = ?').get(code);
          if (!choir) return send(404, { error: 'No existe el coro.' });
          const member = d.prepare('SELECT device_id FROM choir_members WHERE choir_id = ? AND device_id = ?').get(choir.id, deviceId);
          if (!member) return send(403, { error: 'No perteneces a este coro.' });
          const localToday = new Date(Date.now() + timezone * 60000).toISOString().slice(0, 10);
          const markDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localToday;
          if (markDate !== localToday && markDate > localToday) return send(400, { error: 'Fecha inválida.' });
          d.prepare('INSERT OR REPLACE INTO choir_prayers (choir_id, device_id, local_date, hour, ts) VALUES (?,?,?,?,?)')
            .run(choir.id, deviceId, markDate, hour, Date.now());
          const n = d.prepare('SELECT COUNT(*) c FROM choir_prayers WHERE choir_id = ? AND local_date = ? AND hour = ?').get(choir.id, markDate, hour).c;
          const membersTotal = d.prepare('SELECT COUNT(*) c FROM choir_members WHERE choir_id = ?').get(choir.id).c;
          const nick = (d.prepare('SELECT nick FROM choir_members WHERE choir_id = ? AND device_id = ?').get(choir.id, deviceId) || {}).nick || null;
          push('chorevt', { code, hour, date: markDate, nick, n, members: membersTotal });
          push('choirs');
          return send(200, { ok: true });
        }
        const presenceChoirMatch = api.match(/^\/api\/choirs\/([A-Za-z0-9]+)\/presence$/);
        if (presenceChoirMatch && req.method === 'GET') {
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const date = clean(url.searchParams.get('date'), 10);
          const code = presenceChoirMatch[1].toUpperCase();
          const choir = d.prepare('SELECT id, name FROM choirs WHERE code = ?').get(code);
          if (!choir) return send(404, { error: 'No existe el coro.' });
          const member = d.prepare('SELECT device_id FROM choir_members WHERE choir_id = ? AND device_id = ?').get(choir.id, deviceId);
          if (!member) return send(403, { error: 'No perteneces a este coro.' });
          const theDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
          const rows = d.prepare(
            `SELECT m.nick, m.device_id, group_concat(p.hour || ';' || p.ts, ',') AS prayed
             FROM choir_members m
             LEFT JOIN choir_prayers p ON p.choir_id = m.choir_id AND p.device_id = m.device_id AND p.local_date = ?
             WHERE m.choir_id = ?
             GROUP BY m.device_id`
          ).all(theDate, choir.id);
          const members = rows.map((r) => {
            const hours = {};
            for (const part of String(r.prayed || '').split(',').filter(Boolean)) {
              const [h, ts] = part.split(';');
              hours[h] = +ts;
            }
            return { nick: r.nick, hours, now: presence.has(r.device_id) ? presence.get(r.device_id).hourId : null };
          });
          return send(200, { name: choir.name, code, date: theDate, members });
        }

        /* ---------- Espacios (comunidades de oficios) ---------- */
        if (api === '/api/spaces' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const nick = clean(body.nick, 20);
          const name = clean(body.name, 60);
          if (!deviceId || nick.length < 2 || !name) return send(400, { error: 'Faltan datos (nombre del espacio y tu apodo).' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const codeAdmin = uniqueCode(8), codeMember = uniqueCode(8), codeGuest = uniqueCode(8);
          const now = Date.now();
          const info = d.prepare('INSERT INTO spaces (name, code_admin, code_member, code_guest, created_at) VALUES (?,?,?,?,?)')
            .run(name, codeAdmin, codeMember, codeGuest, now);
          const spaceId = Number(info.lastInsertRowid);
          d.prepare('INSERT INTO space_members (space_id, device_id, nick, role, joined_at) VALUES (?,?,?,?,?)')
            .run(spaceId, deviceId, nick, 'admin', now);
          return send(200, { id: spaceId, name, role: 'admin', codeAdmin, codeMember, codeGuest });
        }
        if (api === '/api/spaces/join' && req.method === 'POST') {
          const deviceId = clean(body.deviceId, 64);
          const nick = clean(body.nick, 20);
          const code = clean(body.code, 12).toUpperCase();
          if (!deviceId || nick.length < 2 || !code) return send(400, { error: 'Faltan datos (código y tu apodo).' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const space = d.prepare('SELECT * FROM spaces WHERE code_admin = ? OR code_member = ? OR code_guest = ?').get(code, code, code);
          if (!space) return send(404, { error: 'No existe ningún espacio con ese código.' });
          const codeRole = code === space.code_admin ? 'admin' : (code === space.code_member ? 'member' : 'invitado');
          const rank = { invitado: 0, member: 1, editor: 2, admin: 3 };
          const existingRole = memberRole(space.id, deviceId);
          const finalRole = existingRole && rank[existingRole] >= rank[codeRole] ? existingRole : codeRole;
          if (existingRole) {
            d.prepare('UPDATE space_members SET role = ?, nick = ? WHERE space_id = ? AND device_id = ?').run(finalRole, nick, space.id, deviceId);
          } else {
            d.prepare('INSERT INTO space_members (space_id, device_id, nick, role, joined_at) VALUES (?,?,?,?,?)').run(space.id, deviceId, nick, finalRole, Date.now());
          }
          return send(200, { id: space.id, name: space.name, role: finalRole });
        }
        if (api === '/api/spaces/mine' && req.method === 'GET') {
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const rows = d.prepare(
            `SELECT s.id, s.name, m.role FROM spaces s JOIN space_members m ON m.space_id = s.id
             WHERE m.device_id = ? ORDER BY s.created_at DESC`
          ).all(deviceId);
          return send(200, { spaces: rows });
        }
        const spaceMatch = api.match(/^\/api\/spaces\/(\d+)$/);
        if (spaceMatch && req.method === 'GET') {
          const spaceId = +spaceMatch[1];
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const role = memberRole(spaceId, deviceId);
          if (!role) return send(403, { error: 'No perteneces a este espacio.' });
          const space = d.prepare('SELECT id, name FROM spaces WHERE id = ?').get(spaceId);
          if (!space) return send(404, { error: 'No existe ese espacio.' });
          const out = { id: space.id, name: space.name, role };
          if (role === 'admin') {
            const full = d.prepare('SELECT code_admin, code_member, code_guest FROM spaces WHERE id = ?').get(spaceId);
            out.codeAdmin = full.code_admin; out.codeMember = full.code_member; out.codeGuest = full.code_guest;
          }
          return send(200, out);
        }

        /* ---------- Oficios de un espacio ---------- */
        const officesMatch = api.match(/^\/api\/spaces\/(\d+)\/offices$/);
        if (officesMatch && req.method === 'GET') {
          const spaceId = +officesMatch[1];
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const role = memberRole(spaceId, deviceId);
          if (!role) return send(403, { error: 'No perteneces a este espacio.' });
          const rows = canEdit(role)
            ? d.prepare('SELECT id, nombre, estado, version, updated_at FROM space_offices WHERE space_id = ? ORDER BY updated_at DESC').all(spaceId)
            : d.prepare("SELECT id, nombre, estado, version, updated_at FROM space_offices WHERE space_id = ? AND estado = 'publicado' ORDER BY updated_at DESC").all(spaceId);
          return send(200, { offices: rows });
        }
        if (officesMatch && req.method === 'POST') {
          const spaceId = +officesMatch[1];
          const deviceId = clean(body.deviceId, 64);
          const role = memberRole(spaceId, deviceId);
          if (!canEdit(role)) return send(403, { error: 'No tienes permiso para editar oficios en este espacio.' });
          if (!rateOk(ip)) return send(429, { error: 'Demasiadas peticiones' });
          const nombre = clean(body.nombre, 80);
          if (!nombre) return send(400, { error: 'Ponle un nombre al oficio.' });
          const piezas = JSON.stringify(Array.isArray(body.piezas) ? body.piezas : []);
          const now = Date.now();
          if (body.id) {
            const existing = d.prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?').get(+body.id, spaceId);
            if (!existing) return send(404, { error: 'No existe ese oficio.' });
            const version = existing.version + 1;
            d.prepare('UPDATE space_offices SET nombre = ?, piezas = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?')
              .run(nombre, piezas, version, deviceId, now, existing.id);
            snapshotVersion({ id: existing.id, nombre, piezas, version, updated_by: deviceId }, 'edición');
            if (existing.estado === 'publicado') push('space_update', { spaceId, officeId: existing.id });
            return send(200, { id: existing.id, version, estado: existing.estado });
          }
          const info = d.prepare('INSERT INTO space_offices (space_id, nombre, piezas, estado, version, updated_by, updated_at) VALUES (?,?,?,?,?,?,?)')
            .run(spaceId, nombre, piezas, 'borrador', 1, deviceId, now);
          const officeId = Number(info.lastInsertRowid);
          snapshotVersion({ id: officeId, nombre, piezas, version: 1, updated_by: deviceId }, 'creación');
          return send(200, { id: officeId, version: 1, estado: 'borrador' });
        }
        const officeOneMatch = api.match(/^\/api\/spaces\/(\d+)\/offices\/(\d+)$/);
        if (officeOneMatch && req.method === 'GET') {
          const spaceId = +officeOneMatch[1], officeId = +officeOneMatch[2];
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const role = memberRole(spaceId, deviceId);
          if (!role) return send(403, { error: 'No perteneces a este espacio.' });
          const office = d.prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?').get(officeId, spaceId);
          if (!office) return send(404, { error: 'No existe ese oficio.' });
          if (office.estado !== 'publicado' && !canEdit(role)) return send(403, { error: 'Este oficio todavía no está publicado.' });
          return send(200, { id: office.id, nombre: office.nombre, piezas: JSON.parse(office.piezas), estado: office.estado, version: office.version, updated_at: office.updated_at });
        }
        const estadoMatch = api.match(/^\/api\/spaces\/(\d+)\/offices\/(\d+)\/estado$/);
        if (estadoMatch && req.method === 'POST') {
          const spaceId = +estadoMatch[1], officeId = +estadoMatch[2];
          const deviceId = clean(body.deviceId, 64);
          const role = memberRole(spaceId, deviceId);
          if (role !== 'admin') return send(403, { error: 'Solo un administrador puede publicar o retirar un oficio.' });
          const office = d.prepare('SELECT id FROM space_offices WHERE id = ? AND space_id = ?').get(officeId, spaceId);
          if (!office) return send(404, { error: 'No existe ese oficio.' });
          const estado = body.estado === 'publicado' ? 'publicado' : 'borrador';
          d.prepare('UPDATE space_offices SET estado = ? WHERE id = ?').run(estado, officeId);
          push('space_update', { spaceId, officeId });
          return send(200, { ok: true, estado });
        }
        const versionesMatch = api.match(/^\/api\/spaces\/(\d+)\/offices\/(\d+)\/versiones$/);
        if (versionesMatch && req.method === 'GET') {
          const spaceId = +versionesMatch[1], officeId = +versionesMatch[2];
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const role = memberRole(spaceId, deviceId);
          if (!canEdit(role)) return send(403, { error: 'No tienes permiso para ver el historial.' });
          const office = d.prepare('SELECT id FROM space_offices WHERE id = ? AND space_id = ?').get(officeId, spaceId);
          if (!office) return send(404, { error: 'No existe ese oficio.' });
          const rows = d.prepare('SELECT version, updated_by, note, created_at FROM space_office_versions WHERE office_id = ? ORDER BY version DESC').all(officeId);
          return send(200, { versiones: rows });
        }
        const restaurarMatch = api.match(/^\/api\/spaces\/(\d+)\/offices\/(\d+)\/restaurar$/);
        if (restaurarMatch && req.method === 'POST') {
          const spaceId = +restaurarMatch[1], officeId = +restaurarMatch[2];
          const deviceId = clean(body.deviceId, 64);
          const role = memberRole(spaceId, deviceId);
          if (!canEdit(role)) return send(403, { error: 'No tienes permiso para restaurar versiones.' });
          const office = d.prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?').get(officeId, spaceId);
          if (!office) return send(404, { error: 'No existe ese oficio.' });
          const old = d.prepare('SELECT * FROM space_office_versions WHERE office_id = ? AND version = ?').get(officeId, +body.version);
          if (!old) return send(404, { error: 'No existe esa versión.' });
          const newVersion = office.version + 1;
          d.prepare('UPDATE space_offices SET nombre = ?, piezas = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?')
            .run(old.nombre, old.piezas, newVersion, deviceId, Date.now(), officeId);
          snapshotVersion({ id: officeId, nombre: old.nombre, piezas: old.piezas, version: newVersion, updated_by: deviceId }, 'restaurada v' + old.version);
          if (office.estado === 'publicado') push('space_update', { spaceId, officeId });
          return send(200, { ok: true, version: newVersion });
        }

        /* ---------- Miembros y roles ---------- */
        const membersMatch = api.match(/^\/api\/spaces\/(\d+)\/members$/);
        if (membersMatch && req.method === 'GET') {
          const spaceId = +membersMatch[1];
          const deviceId = clean(url.searchParams.get('deviceId'), 64);
          const role = memberRole(spaceId, deviceId);
          if (role !== 'admin') return send(403, { error: 'Solo un administrador puede ver los miembros.' });
          const rows = d.prepare('SELECT device_id, nick, role, joined_at FROM space_members WHERE space_id = ? ORDER BY joined_at ASC').all(spaceId);
          return send(200, { members: rows });
        }
        const roleMatch = api.match(/^\/api\/spaces\/(\d+)\/members\/([^/]+)\/rol$/);
        if (roleMatch && req.method === 'POST') {
          const spaceId = +roleMatch[1], targetDevice = decodeURIComponent(roleMatch[2]);
          const deviceId = clean(body.deviceId, 64);
          const actorRole = memberRole(spaceId, deviceId);
          if (actorRole !== 'admin') return send(403, { error: 'Solo un administrador puede cambiar roles.' });
          const nuevoRol = ['admin', 'editor', 'member', 'invitado'].includes(body.rol) ? body.rol : null;
          if (!nuevoRol) return send(400, { error: 'Rol no válido.' });
          if (targetDevice === deviceId && nuevoRol !== 'admin') {
            const admins = d.prepare("SELECT COUNT(*) c FROM space_members WHERE space_id = ? AND role = 'admin'").get(spaceId).c;
            if (admins <= 1) return send(400, { error: 'Debe quedar siempre al menos un administrador: nombra a otro antes de dejar de serlo.' });
          }
          d.prepare('UPDATE space_members SET role = ? WHERE space_id = ? AND device_id = ?').run(nuevoRol, spaceId, targetDevice);
          return send(200, { ok: true });
        }

        return send(404, { error: 'No encontrado' });
      } catch (e) {
        console.error('API error:', e);
        return send(500, { error: 'Error interno' });
      }
    });
  }

  return {
    handle,
    ws: (server, base) => {
      const wss = new WebSocketServer({ server, path: (base || '') + '/ws' });
      wss.on('connection', (socket) => {
        const send = (id, payload) => { if (socket.readyState === 1) socket.send(JSON.stringify({ id, payload })); };
        send('presence', presenceSnapshot());
        const onPush = (topic, payload) => send(topic, payload);
        socket.on('message', (msg) => {
          try {
            const m = JSON.parse(msg.toString());
            if (m.id === 'ping') send('pong', Date.now());
          } catch { /* ignorar */ }
        });
        engine.onPush(onPush);
        socket.on('close', () => engine.offPush(onPush));
      });
      setInterval(() => { if (purgePresence()) push('presence', presenceSnapshot()); }, PRESENCE_TTL_MS);
      return wss;
    },
    presenceSnapshot,
    hash
  };
}

module.exports = { createCommunityServer };