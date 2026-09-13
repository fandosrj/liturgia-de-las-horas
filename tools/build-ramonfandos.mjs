#!/usr/bin/env node
/* ============================================================
   Build ramonfandos.es/liturgiadelashoras (versión estática,
   hosting compartido DonDominio, subida por FTP).
   Sin presencia en vivo / intenciones / coros (necesitan Node +
   WebSocket, que este hosting no tiene). "Mi comunidad" (oficios
   compartidos) SÍ funciona aquí: habla con router.php + SQLite,
   un puerto en PHP del mismo backend que ya corre en Node -sin
   avisos en vivo por WebSocket, el resto igual-.
   ============================================================ */
import { cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public');
const out = join(root, 'dist-ramonfandos');

const OLD_URL = 'https://liturgiahoras.github.io/';
const NEW_URL = 'https://ramonfandos.es/liturgiadelashoras/';
const OLD_HOST = 'https://liturgiahoras.github.io';
const NEW_HOST = 'https://ramonfandos.es/liturgiadelashoras';

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(src, out, { recursive: true });

// --- Quitar solo el mapa (presencia en vivo). community.js SÍ se queda: ---
// --- lo usa "Mi comunidad" (oficios), que aquí habla con router.php. -----
await rm(join(out, 'vendor', 'leaflet'), { recursive: true, force: true });

// --- Patch index.html ----------------------------------------------------
const indexPath = join(out, 'index.html');
let html = await readFile(indexPath, 'utf8');

const removals = [
  '<link rel="stylesheet" href="vendor/leaflet/leaflet.min.css">',
  '<link rel="stylesheet" href="vendor/leaflet/leaflet.min.css" >',
  '<script src="vendor/leaflet/leaflet.min.js"></script>'
];
for (const r of removals) html = html.split(r).join('');

html = html
  .replace(/(<a[^>]*href="#comunidad"[^>]*>.*?<\/a>)/g, '')
  // Importante: community.js lee window.LH_BASE en cuanto se carga (antes
  // que app.js), así que estas globales van ANTES del primer <script>, no
  // justo delante de app.js -eso llegaba tarde y BASE se quedaba vacío-.
  .replace('<script src="vendor/breviarium.umd.js"></script>',
    '<script>window.LH_GH = 1; window.LH_SPACES = 1; window.LH_BASE = "/liturgiadelashoras";</script>\n<script src="vendor/breviarium.umd.js"></script>')
  .split(OLD_URL).join(NEW_URL)
  .split(OLD_HOST).join(NEW_HOST);

await writeFile(indexPath, html);

// --- Patch sw.js: cache propio, sin vendor/leaflet (community.js se queda) --
const swPath = join(out, 'sw.js');
let sw = await readFile(swPath, 'utf8');
sw = sw
  .replace(/'liturgia-horas-v(\d+)'/, "'liturgia-horas-rf-v$1'")
  .replace("'./vendor/leaflet',", '');
await writeFile(swPath, sw);

// --- robots.txt y sitemap.xml: los suyos, no los de github.io ------------
await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${NEW_URL}sitemap.xml\n`);
await writeFile(join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${NEW_URL}</loc></url>\n</urlset>\n`);

console.log('Build ramonfandos.es OK ->', out);
console.log('  - vendor/leaflet eliminado (sin mapa de presencia en vivo)');
console.log('  - lib/community.js SE QUEDA: "Mi comunidad" habla con api/router.php (PHP+SQLite)');
console.log('  - URLs reescritas a', NEW_URL);
