/* ============================================================
   Liturgia de las Horas · Servidor (Node.js + Express)
   - Sirve la app estática (PWA). El rezo se calcula en el
     navegador con la librería breviarium (MIT).
   - API de comunidad (/api/*) y WebSocket (/ws) para presencia
     en vivo, intenciones anónimas y coros pequeños.
   ============================================================ */

const express = require('express');
const path = require('path');
const http = require('http');
const { createCommunityServer } = require('./community');

const app = express();
const PORT = process.env.PORT || 4000;
const PUBLIC = path.join(__dirname, 'public');
// Permite servir la app completa bajo una subruta, p. ej. ramonfandos.es/liturgiahoras
// (BASE_PATH=/liturgiahoras). En la raíz ('' ) funciona igual que siempre.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');

const pushTargets = new Set();
const engine = {
  push(topic, payload) {
    for (const cb of pushTargets) { try { cb(topic, payload); } catch (e) { /* socket caído */ } }
  },
  onPush(send) { pushTargets.add(send); },
  offPush(send) { pushTargets.delete(send); }
};

const community = createCommunityServer(engine, BASE);

app.use(BASE + '/', express.static(PUBLIC, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('breviarium.umd.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

app.use(BASE + '/api', (req, res) => {
  community.handle(req, res).catch((e) => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Error interno del servicio de comunidad' }));
    } else {
      res.end();
    }
    console.error('API error:', e);
  });
});

if (BASE) app.get('/', (req, res) => res.redirect(BASE + '/'));

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

const server = http.createServer(app);
const wss = community.ws(server, BASE);

server.listen(PORT, () => {
  console.log('Liturgia de las Horas corriendo en http://localhost:' + PORT + (BASE ? BASE : ''));
  console.log('Comunidad activa · presence / intenciones / coros en ' + (BASE || '') + '/api y ' + (BASE || '') + '/ws');
});