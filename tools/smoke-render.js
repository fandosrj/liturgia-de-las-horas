/* Prueba de humo: renderiza las 7 horas en Node con datos reales. */
const fs = require('fs');
const path = require('path');

global.window = global;
global.Breviarium = require('./breviarium.umd.cjs').default;

const liturgySrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'lib', 'liturgy.js'), 'utf8');
eval(liturgySrc);

const Liturgy = global.window.Liturgy || global.Liturgy;

async function main() {
  const dates = [new Date(2026, 8, 9), new Date(2026, 11, 25), new Date(2026, 3, 5), new Date(2026, 0, 1)];
  let fails = 0;
  for (const d of dates) {
    console.log('=== Fecha:', d.toISOString().slice(0, 10), '===');
    for (const h of Liturgy.HOURS) {
      try {
        const data = await Liturgy.load(d, h.id);
        const opts = Liturgy.optionsFor(data, h.id);
        if (!opts.length) { console.log('  [sin datos]', h.id); continue; }
        for (const o of opts) {
          const html = Liturgy.render(h.id, o, null);
          if (!html || html.length < 200) {
            console.log('  [CORTO!]', h.id, o.id, html.length);
            fails++;
          } else {
            console.log('  ok', h.id.padEnd(10), o.id.padEnd(28), html.length, 'chars');
            if (o.id.split('_')[0] === 'ordinary_time_23_wednesday') {
              const first300 = html.slice(0, 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              console.log('     →', first300.slice(0, 140));
            }
          }
        }
      } catch (e) {
        console.log('  [ERROR]', h.id, e.message);
        fails++;
      }
    }
  }
  console.log(fails ? '\n' + fails + ' errores' : '\nTODO CORRECTO');
  process.exit(fails ? 1 : 0);
}

main();