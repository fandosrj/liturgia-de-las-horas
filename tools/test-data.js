const Breviarium = require('./breviarium.umd.cjs').default;

async function main() {
  const date = new Date(2026, 8, 9); // 9 sept 2026 (miércoles)
  const b = new Breviarium(date);

  try {
    const info = await b.getLiturgyInformation(date);
    console.log('=== INFORMACIÓN LITÚRGICA ===');
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.log('ERR info:', e.message);
  }

  try {
    const invit = await b.getInvitatorium(date);
    console.log('\n=== INVITATORIO (primeros 500 chars) ===');
    console.log(invit ? JSON.stringify(invit).slice(0, 500) : 'undefined');
  } catch (e) {
    console.log('ERR invit:', e.message);
  }

  try {
    const laudes = await b.getLaudes(date);
    console.log('\n=== LAUDES (string length) ===', laudes ? JSON.stringify(laudes).length : 'undefined');
    if (laudes && laudes[0]) {
      const l = laudes[0];
      console.log('ID:', l.id, '| ciclo:', l.cycle);
      console.log('Himno:', String(l.himno || '').slice(0, 120));
      console.log('Salmo1:', l.primer_salmo_cita, '| Ant:', String(l.primer_salmo_antifona || '').slice(0, 80));
      console.log('Lectura:', l.lectura_biblica_cita);
      console.log('Oración final:', String(l.oracion_final || '').slice(0, 120));
    }
  } catch (e) {
    console.log('ERR laudes:', e.message);
  }

  try {
    const vesp = await b.getVesperae(date);
    console.log('\n=== VÍSPERAS ===');
    if (vesp && vesp[0]) {
      const v = vesp[0];
      console.log('ID:', v.id, '| PrVísperas:', v.primeras_visperas);
      console.log('Himno:', String(v.himno || '').slice(0, 120));
      console.log('Salmo1:', v.primer_salmo_cita, '| Ant:', String(v.primer_salmo_antifona || '').slice(0, 80));
      console.log('Oración final:', String(v.oracion_final || '').slice(0, 120));
    } else {
      console.log('N/A:', JSON.stringify(vesp).slice(0, 300));
    }
  } catch (e) {
    console.log('ERR vesp:', e.message);
  }

  try {
    const of = await b.getOfficium(date);
    console.log('\n=== OFICIO DE LECTURA ===');
    if (of) {
      console.log('ID:', of.id, '| Himno:', String(of.himno || '').slice(0, 100));
      console.log('Lectura bíblica:', String(of.lectura_biblica_titulo_a || of.lectura_biblica_cita_a || '').slice(0, 100));
      console.log('Texto patrística (len):', String(of.lectura_patristica_texto_a || '').length);
    } else {
      console.log('undefined');
    }
  } catch (e) {
    console.log('ERR officium:', e.message);
  }

  try {
    const comp = await b.getCompletorium(date);
    console.log('\n=== COMPLETAS ===');
    if (comp) {
      console.log('Himno:', String(comp.himno || '').slice(0, 100));
      console.log('Salmo1:', comp.primer_salmo_cita, '| Oración:', String(comp.final || '').slice(0, 120));
    } else {
      console.log('undefined');
    }
  } catch (e) {
    console.log('ERR completas:', e.message);
  }

  try {
    const lect = await b.getLectures(date);
    console.log('\n=== LECTURAS DE MISA ===');
    if (lect && lect[0]) {
      lect[0].lecturas.forEach((r) => {
        console.log('-', r.type, '|', r.ref, '|', String(r.texto || '').slice(0, 60).replace(/\n/g, ' '));
      });
    } else {
      console.log('undefined', JSON.stringify(lect).slice(0, 200));
    }
  } catch (e) {
    console.log('ERR lecturas:', e.message);
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});