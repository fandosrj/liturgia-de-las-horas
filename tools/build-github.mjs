#!/usr/bin/env node
/* ============================================================
   Build GitHub Pages (versión estática sin servidor)
   Copia public/ -> dist-github/ y elimina lo que exige backend:
     - lib/community.js  (presencia, intenciones, coros, chat)
     - vendor/leaflet/   (mapa /api/geo)
   Inyecta window.LH_GH=1 (app.js desactiva toda la comunidad)
   y quita la entrada del drawer "Comunidad de rezo".
   ============================================================ */
import { cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public');
const out = join(root, 'dist-github');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(src, out, { recursive: true });

// --- Quitar módulos de comunidad y mapa ---------------------------------
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
  .replace('<script src="app.js"></script>', '<script>window.LH_GH = 1;</script>\n    <script src="app.js"></script>');

await writeFile(indexPath, html);

// --- Patch sw.js: cache v6 y CORE sin community/leaflet ------------------
const swPath = join(out, 'sw.js');
let sw = await readFile(swPath, 'utf8');
sw = sw
  .replace("'liturgia-horas-v6'", "'liturgia-horas-v6'")
  .replace("'./lib/community.js',\n  ", '')
  .replace("'./lib/community.js',\n", '')
  .replace("'./vendor/leaflet',", '')
  .replace("'./lib/community.js',", '');
await writeFile(swPath, sw);

// --- .nojekyll -----------------------------------------------------------
await writeFile(join(out, '.nojekyll'), '');

console.log('Build GH Pages OK ->', out);
console.log('  - lib/community.js eliminado');
console.log('  - vendor/leaflet eliminado');
console.log('  - window.LH_GH=1 inyectado en index.html');
console.log('  - drawer "Comunidad de rezo" eliminado');