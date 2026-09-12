#!/usr/bin/env node
/* ============================================================
   Build ramonfandos.es/liturgiadelashoras (versión estática,
   hosting compartido DonDominio, subida por FTP).
   Igual que build-github.mjs (sin comunidad ni mapa, porque ese
   hosting no puede correr el servidor Node/WebSocket), pero con
   las URLs propias en vez de las de liturgiahoras.github.io.
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

// --- Quitar módulos de comunidad y mapa (mismo motivo que GitHub Pages) --
await rm(join(out, 'lib', 'community.js'), { force: true });
await rm(join(out, 'vendor', 'leaflet'), { recursive: true, force: true });

// --- Patch index.html ----------------------------------------------------
const indexPath = join(out, 'index.html');
let html = await readFile(indexPath, 'utf8');

const removals = [
  '<link rel="stylesheet" href="vendor/leaflet/leaflet.min.css">',
  '<link rel="stylesheet" href="vendor/leaflet/leaflet.min.css" >',
  '<script src="vendor/leaflet/leaflet.min.js"></script>',
  '<script src="lib/community.js"></script>'
];
for (const r of removals) html = html.split(r).join('');

html = html
  .replace(/(<a[^>]*href="#comunidad"[^>]*>.*?<\/a>)/g, '')
  .replace('<script src="app.js"></script>', '<script>window.LH_GH = 1;</script>\n    <script src="app.js"></script>')
  .split(OLD_URL).join(NEW_URL)
  .split(OLD_HOST).join(NEW_HOST);

await writeFile(indexPath, html);

// --- Patch sw.js: cache propio y CORE sin community/leaflet --------------
const swPath = join(out, 'sw.js');
let sw = await readFile(swPath, 'utf8');
sw = sw
  .replace(/'liturgia-horas-v\d+'/, "'liturgia-horas-rf-v1'")
  .replace("'./lib/community.js',\n  ", '')
  .replace("'./lib/community.js',\n", '')
  .replace("'./vendor/leaflet',", '')
  .replace("'./lib/community.js',", '');
await writeFile(swPath, sw);

// --- robots.txt y sitemap.xml: los suyos, no los de github.io ------------
await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${NEW_URL}sitemap.xml\n`);
await writeFile(join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${NEW_URL}</loc></url>\n</urlset>\n`);

console.log('Build ramonfandos.es OK ->', out);
console.log('  - lib/community.js y vendor/leaflet eliminados (hosting compartido, sin Node)');
console.log('  - URLs reescritas a', NEW_URL);
