/* ============================================================
   Genera public/lib/salterio.js a partir del salterio litúrgico
   en español (breviarium, MIT): los 150 salmos según la
   numeración LXX/Vulgata utilizada en los kathismata ortodoxos.
   Uso: node tools/gen-salterio.mjs
   ============================================================ */
import B from 'breviarium';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DAYS = 380; // un año litúrgico completo
const b = new B();
const start = new Date();

const textNodes = new Map(); // numeroLXX -> [{ r, t }]
const byText = new Map();    // dedupe por texto

function parseCita(cita) {
  const m = String(cita || '').match(/^Salmo\s+(\d+)(?:[.,]\s*([\d-]+))?/);
  if (!m) return null;
  let r = m[2] || '';
  const rx = String(cita || '').match(/-\s*([IVXLCDM]+)$/);
  if (rx) r = r ? r + '-' + rx[1] : rx[1];
  return { n: parseInt(m[1], 10), r };
}

async function harvest() {
  const methods = ['getOfficium', 'getLaudes', 'getTertia', 'getSexta', 'getNona', 'getVesperae', 'getCompletorium', 'getInvitatorium'];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    try { b.setDate(d); } catch { continue; }
    for (const m of methods) {
      let out;
      try { out = await b[m](); } catch { continue; }
      const arr = Array.isArray(out) ? out : (out ? [out] : []);
      for (const doc of arr) {
        if (!doc) continue;
        const claves = Object.keys(doc).filter(k => /^.*salmo.*_cita$/.test(k) && doc[k.replace('_cita', '_texto')]);
        for (const k of claves) {
          const cita = doc[k];
          const texto = String(doc[k.replace('_cita', '_texto')] || '').trim();
          if (!texto) continue;
          const p = parseCita(cita);
          if (!p) continue;
          const key = p.n + '|' + texto;
          if (byText.has(key)) continue;
          byText.set(key, true);
          if (!textNodes.has(p.n)) textNodes.set(p.n, []);
          const arr2 = textNodes.get(p.n);
          if (!arr2.some(s => s.t === texto)) arr2.push({ r: p.r, t: texto });
        }
      }
      if (m === 'getInvitatorium') {
        try {
          const ps = await b.getInvitatoriumPsalms();
          for (const p of (ps || [])) {
            const id = String(p.id || '');
            const nm = id.match(/^psalm(\d+)$/);
            if (!nm) continue;
            const n = parseInt(nm[1], 10);
            const limpo = String(p.psalm || '')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
            if (!limpo) continue;
            const key = n + '|' + limpo;
            if (byText.has(key)) continue;
            byText.set(key, true);
            if (!textNodes.has(n)) textNodes.set(n, []);
            const arr2 = textNodes.get(n);
            if (!arr2.some(s => s.t === limpo)) arr2.push({ r: '', t: limpo });
          }
        } catch { continue; }
      }
    }
  }
}

function verseCount(texto) {
  return texto.split('\n').filter(Boolean).length;
}

function maxNum() {
  let m = 0;
  for (const n of textNodes.keys()) if (n > m) m = n;
  return m;
}

async function main() {
  await harvest();
  const nums = [...textNodes.keys()].sort((a, b) => a - b);
  const missing = [];
  for (let n = 1; n <= 150; n++) if (!textNodes.has(n)) missing.push(n);
  console.log('Salmos cosechados:', nums.length, '| presentes:', nums.join(','));
  console.log('Faltantes 1..150:', missing.length ? missing.join(',') : '(ninguno)');
  let totalVersos = 0;
  for (const [n, arr] of textNodes) {
    const versos = arr.reduce((s, x) => s + verseCount(x.t), 0);
    totalVersos += versos;
  }
  console.log('Estimación total de versos:', totalVersos);

  const psalmos = {};
  for (const [n, arr] of textNodes) {
    const vistos = new Set();
    const limpio = [];
    for (const s of arr) {
      const m = s.r.match(/^(\d+)-(\d+)/);
      if (m) {
        const key = m[1] + '-' + m[2];
        if (vistos.has(key)) continue;
        vistos.add(key);
      }
      limpio.push(s);
    }
    psalmos[n] = limpio;
  }

  const out = `/* ============================================================
   Salterio · 150 salmos en español según la numeración LXX/Vulgata
   (los kathismata ortodoxos siguen este mismo orden).
   Textos del salterio litúrgico en español (breviarium, MIT),
   edición de la Liturgia de las Horas.
   Generado por tools/gen-salterio.mjs — no editar a mano.
   ============================================================ */
const Salterio = (() => {
  const PSALMOS = ${JSON.stringify(psalmos)};

  const KATHISMATA = [
    { n: 1,  rng: '1-8',     nom: 'I'   },
    { n: 2,  rng: '9-16',    nom: 'II'  },
    { n: 3,  rng: '17-23',   nom: 'III' },
    { n: 4,  rng: '24-31',   nom: 'IV'  },
    { n: 5,  rng: '32-36',   nom: 'V'   },
    { n: 6,  rng: '37-45',   nom: 'VI'  },
    { n: 7,  rng: '46-54',   nom: 'VII' },
    { n: 8,  rng: '55-63',   nom: 'VIII' },
    { n: 9,  rng: '64-69',   nom: 'IX'  },
    { n: 10, rng: '70-76',   nom: 'X'   },
    { n: 11, rng: '77-84',   nom: 'XI'  },
    { n: 12, rng: '85-90',   nom: 'XII' },
    { n: 13, rng: '91-100',  nom: 'XIII' },
    { n: 14, rng: '101-104', nom: 'XIV' },
    { n: 15, rng: '105-108', nom: 'XV'  },
    { n: 16, rng: '109-117', nom: 'XVI' },
    { n: 17, rng: '118',     nom: 'XVII' },
    { n: 18, rng: '119-133', nom: 'XVIII' },
    { n: 19, rng: '134-142', nom: 'XIX' },
    { n: 20, rng: '143-150', nom: 'XX'  }
  ];

  // Reparto semanal habitual (Typikon): Maitines 2 kathismata, Vísperas 1.
  const SEMANA = {
    0: { maitines: [2, 3] },                      // Domingo
    1: { maitines: [4, 5], visperas: [6] },       // Lunes
    2: { maitines: [7, 8], visperas: [9] },       // Martes
    3: { maitines: [10, 11], visperas: [12] },    // Miércoles
    4: { maitines: [13, 14], visperas: [15] },    // Jueves
    5: { maitines: [16, 17], visperas: [18] },    // Viernes
    6: { maitines: [19, 20] }                     // Sábado
  };

  function kathisma(n) { return KATHISMATA.find(k => k.n === n) || null; }
  function rango(n) {
    const k = kathisma(n);
    if (!k) return null;
    const [a, b] = k.rng.split('-').map(Number);
    const list = [];
    for (let i = a; i <= (b || a); i++) list.push({ lxx: i, mt: i });
    return list;
  }
  function psalmText(n) { return PSALMOS[n] || null; }

  return { PSALMOS, KATHISMATA, SEMANA, kathisma, rango, psalmText };
})();
if (typeof window !== 'undefined') window.Salterio = Salterio;
if (typeof module !== 'undefined' && module.exports) module.exports = { Salterio };
`;

  const target = resolve(dirname(fileURLToPath(import.meta.url)), '../public/lib/salterio.js');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out, 'utf8');
  console.log('Escrito:', target, '(', Buffer.byteLength(out, 'utf8'), 'bytes )');
}

main().catch(e => { console.error(e); process.exit(1); });