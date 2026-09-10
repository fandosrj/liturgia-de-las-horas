/* ============================================================
   Genera public/lib/santos.js: el santoral del día (calendario
   romano en España) con nombres localizados, años 2024-2030.
   Fuente: romcal + @romcal/calendar.spain (MIT).
   Uso: node tools/gen-santos.mjs
   ============================================================ */
import { Romcal } from 'romcal';
import { Spain_Es } from '@romcal/calendar.spain';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const names = (Spain_Es.i18n && Spain_Es.i18n.names) || {};

async function main() {
  const dias = {};
  for (const year of YEARS) {
    const cal = new Romcal({ year, calendarName: 'spain', locale: 'es' });
    const all = await cal.generateCalendar(year);
    for (const fecha of Object.keys(all)) {
      const list = (all[fecha] || [])
        .map((d) => names[d.id])
        .filter((n) => n);
      if (list.length) dias[fecha] = list;
    }
    console.log('  año', year, '->', Object.keys(dias).filter((k) => k.startsWith(String(year))).length, 'fechas con santoral');
  }

  const out = `/* ============================================================
   Santoral del día (calendario romano en España).
   Generado por tools/gen-santos.mjs a partir de romcal · MIT.
   Mapa: "AAAA-MM-DD" -> nombres de las celebraciones con santo.
   ============================================================ */
window.Santos = ${JSON.stringify({ version: 'es', source: 'romcal·spain', anos: YEARS, dias })};
`;

  const dest = resolve(dirname(fileURLToPath(import.meta.url)), '../public/lib/santos.js');
  writeFileSync(dest, out, 'utf8');
  console.log('Escrito', dest, '·', (out.length / 1024).toFixed(0), 'KB');
}

main().catch((e) => { console.error(e); process.exit(1); });