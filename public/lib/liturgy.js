/* ============================================================
   Liturgia de las Horas · Motor de rezo
   Envuelve la librería breviarium (MIT) y renderiza las siete
   horas con fidelidad al breviario.
   ============================================================ */

const Breviarium = (window.Breviarium || {}).Breviarium || (window.Breviarium || {}).default || window.Breviarium;

const HOURS = [
  { id: 'oficio',    name: 'Oficio de lectura', time: 'a cualquier hora', verse: 'V. Señor, ábreme los labios.', res: 'R. Y mi boca proclamará tu alabanza.', invite: true },
  { id: 'laudes',    name: 'Laudes',            time: 'mañana',           verse: 'V. Dios mío, ven en mi auxilio.', res: 'R. Señor, date prisa en socorrerme.', canticle: 'benedictus' },
  { id: 'tercia',    name: 'Tercia',            time: 'media mañana',     verse: 'V. Dios mío, ven en mi auxilio.', res: 'R. Señor, date prisa en socorrerme.' },
  { id: 'sexta',     name: 'Sexta',             time: 'mediodía',         verse: 'V. Dios mío, ven en mi auxilio.', res: 'R. Señor, date prisa en socorrerme.' },
  { id: 'nona',      name: 'Nona',              time: 'media tarde',      verse: 'V. Dios mío, ven en mi auxilio.', res: 'R. Señor, date prisa en socorrerme.' },
  { id: 'visperas',  name: 'Vísperas',          time: 'tarde',            verse: 'V. Dios mío, ven en mi auxilio.', res: 'R. Señor, date prisa en socorrerme.', canticle: 'magnificat' },
  { id: 'completas', name: 'Completas',         time: 'noche',            verse: 'V. Conviértenos, Dios, salvador nuestro.', res: 'R. Y aparta de nosotros tu ira.', canticle: 'nunc' }
];

const MIDDAY = ['tercia', 'sexta', 'nona'];

const Liturgy = (() => {
  let breviarium = null;

  function ensure() {
    if (!breviarium) breviarium = new Breviarium(new Date());
    return breviarium;
  }

  function setDate(date) {
    ensure().setDate(date);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Convierte _texto_ en énfasis (antífonas / respuestas en cursiva).
     En breviarium los subrayados marcan lo que se reza en cursiva. */
  function italic(s) {
    return esc(s).replace(/_([^_]+)_/g, '<em>$1</em>');
  }

  function text(s) {
    // El texto llega con \n para cambios de línea
    const cleaned = italic(s).replace(/\n{3,}/g, '\n\n');
    return '<div class="text">' + cleaned.replace(/\n/g, '<br>') + '</div>';
  }

  function gloria() {
    return '<div class="gloria">Gloria al Padre, y al Hijo, y al Espíritu Santo.<br>Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.</div>';
  }

  /* ---------- Responsorios: 'gV. $Texto' -> V. / R. con negrita ---------- */
  function parseRespLine(line) {
    const m = String(line || '').match(/^\$\u2023\.\s\$?(.*)$/);
    if (m) return { label: '\u2023', text: m[1] };
    const m2 = String(line || '').match(/^\$\u211F\.\s\$?(.*)$/);
    if (m2) return { label: '\u211F', text: m2[1] };
    const m3 = String(line || '').match(/^\$\u2116\.\s\$?(.*)$/);
    if (m3) return { label: '\u2116', text: m3[1] };
    const t = String(line || '').replace(/^\$/, '');
    if (/^V\./.test(t)) return { label: 'V', text: t.slice(2) };
    if (/^R\./.test(t)) return { label: 'R', text: t.slice(2) };
    return { label: '', text: t };
  }

  function renderRespList(list, opts) {
    if (!Array.isArray(list)) return '';
    let html = '';
    for (const line of list) {
      const { label, text: rest } = parseRespLine(line);
      // A veces la respuesta contiene \n (V.\ntexto): se normaliza
      const parts = String(rest).split('\n').filter(Boolean);
      if (label) html += '<p><span class="vs">' + esc(label) + '.</span>' + italic(parts.join(' ')) + '</p>';
      else html += '<p>' + italic(parts.join(' ')) + '</p>';
    }
    return '<div class="responsorios">' + html + '</div>';
  }

  /* ---------------------------- Salmodia ---------------------------- */
  function psalmBlock(cita, antifona, texto) {
    if (!cita && !texto) return '';
    let h = '<div class="psalm-block">';
    h += '<div class="psalm-ref">' + esc(cita || '') + '</div>';
    if (antifona) h += '<div class="ant">' + italic(antifona) + '</div>';
    h += text(texto || '');
    h += '</div>';
    return h;
  }

  function psalmSlot(key, d) {
    return psalmBlock(d[key + '_cita'], d[key + '_antifona'], d[key + '_texto']);
  }

  /* --------------------------- Preces ------------------------------ */
  function precesHtml(d) {
    const intro = d.preces_intro, resp = d.preces_respuesta, cont = d.preces_contenido;
    if (!cont || !cont.length) return '';
    let h = '<div class="preces">';
    if (intro) h += '<p class="peticion">' + italic(intro) + '</p>';
    for (const pet of cont) {
      const parts = String(pet).replace(/^-\s*/, '').split('_');
      let petHtml = italic(parts[0]);
      if (parts.length > 1) {
        petHtml += '<span class="res-hint">' + italic('_' + parts.slice(1).join('_')) + '</span>';
      }
      h += '<div class="peticion">' + petHtml + '</div>';
    }
    if (resp) h += '<p class="peticion"><span class="vs">R.</span>' + italic(resp) + '</p>';
    h += '</div>';
    return h;
  }

  /* ------------------------- Cánticos evangélicos -------------------------
     Textos bíblicos (Lucas 1-2) en su versión litúrgica en español, con
     ortografía modernizada. Son fijos cada día. */
  const CANTICLES = {
    benedictus: {
      cita: 'Cántico de Zacarías',
      ref: 'Lucas 1, 68-79',
      lines: [
        'Bendito el Señor, Dios de Israel, porque ha visitado y redimido a su pueblo',
        'y nos ha suscitado un Salvador poderoso en la casa de David, su siervo,',
        'según lo había anunciado desde antiguo por boca de sus santos profetas:',
        'que nos salvaría de nuestros enemigos y de la mano de todos los que nos odian;',
        'realizando la misericordia que tuvo con nuestros padres,',
        'recordando su santa alianza,',
        'y el juramento que hizo a Abraham, nuestro padre,',
        'de concedernos que, libres de temor, arrancados de la mano de los enemigos,',
        'le sirvamos con santidad y justicia, en su presencia, todos nuestros días.',
        'Y tú, niño, serás llamado profeta del Altísimo,',
        'porque irás delante del Señor a preparar sus caminos,',
        'anunciando a su pueblo la salvación, el perdón de sus pecados,',
        'por la entrañable misericordia de nuestro Dios,',
        'que nos traerá de lo alto la aurora que nos visita,',
        'para iluminar a los que habitan en tinieblas y en sombra de muerte,',
        'para guiar nuestros pasos por el camino de la paz.'
      ]
    },
    magnificat: {
      cita: 'Cántico de María',
      ref: 'Lucas 1, 46-55',
      lines: [
        'Proclama mi alma la grandeza del Señor,',
        'se alegra mi espíritu en Dios, mi salvador,',
        'porque ha mirado la humillación de su esclava.',
        'Desde ahora me felicitarán todas las generaciones,',
        'porque el Poderoso ha hecho obras grandes en mí: su nombre es santo',
        'y su misericordia llega a sus fieles de generación en generación.',
        'Él hace proezas con su brazo,',
        'dispersa a los soberbios de corazón,',
        'derriba del trono a los poderosos',
        'y enaltece a los humildes,',
        'a los hambrientos los colma de bienes',
        'y a los ricos los despide vacíos.',
        'Auxilia a Israel, su siervo,',
        'acordándose de la misericordia',
        '—como lo había prometido a nuestros padres—',
        'en favor de Abrahán y su descendencia por siempre.'
      ]
    },
    nunc: {
      cita: 'Cántico de Simeón',
      ref: 'Lucas 2, 29-32',
      lines: [
        'Ahora, Señor, según tu promesa,',
        'puedes dejar a tu siervo irse en paz,',
        'porque mis ojos han visto a tu Salvador,',
        'a quien has presentado ante todos los pueblos,',
        'luz que alumbra a las naciones',
        'y gloria de tu pueblo Israel.'
      ]
    }
  };

  function canticleHtml(key, antifona) {
    const c = CANTICLES[key];
    if (!c) return '';
    let h = '<div class="psalm-block">';
    h += '<div class="psalm-ref">' + c.cita + ' · ' + c.ref + '</div>';
    if (antifona) h += '<div class="ant">' + italic(antifona) + '</div>';
    h += '<div class="text">' + c.lines.map((l) => esc(l)).join('<br>') + '</div>';
    h += gloria() + '</div>';
    return h;
  }

  /* ------------------------- Lectura breve ------------------------- */
  function lecturaHtml(cita, texto, titulo) {
    if (!texto && !titulo) return '';
    let h = '<div class="reading-box">';
    if (titulo) h += '<div class="title">' + italic(titulo) + '</div>';
    if (cita) h += '<div class="ref">' + esc(cita) + '</div>';
    h += text(texto || '');
    h += '</div>';
    return h;
  }

  /* ----------------------- Apertura de la hora ---------------------- */
  function opening(h) {
    let hh = '<div class="opening">';
    hh += '<p><span class="vs">' + esc(h.verse.split('.')[0]) + '.</span> ' + esc(h.verse.split('. ').slice(1).join('. ')) + '</p>';
    hh += '<p><span class="vs">' + esc(h.res.split('.')[0]) + '.</span> ' + esc(h.res.split('. ').slice(1).join('. ')) + '</p>';
    hh += '<p>Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.</p>';
    hh += '</div>';
    return hh;
  }

  function closing() {
    return '<div class="closing">' +
      '<p><span class="vs">V.</span> Bendigamos al Señor.</p>' +
      '<p><span class="vs">R.</span> Demos gracias a Dios.</p></div>';
  }

  /* ------------------------- Invitatorio ---------------------------- */
  let invitatoryPsalmsCache = null;
  async function invitatoryPsalms() {
    if (!invitatoryPsalmsCache) {
      invitatoryPsalmsCache = await ensure().getInvitatoriumPsalms();
    }
    return invitatoryPsalmsCache;
  }

  /* ------------------------ Carga de la hora ------------------------ */
  async function load(date, hourId) {
    setDate(date);
    const fn = hourId === 'oficio' ? 'getOfficium'
      : hourId === 'laudes' ? 'getLaudes'
      : hourId === 'visperas' ? 'getVesperae'
      : hourId === 'completas' ? 'getCompletorium'
      : hourId === 'tercia' ? 'getTertia'
      : 'get' + hourId.charAt(0).toUpperCase() + hourId.slice(1);
    const data = await ensure()[fn](date);
    return data;
  }

  function optionsFor(data, hourId) {
    if (!data) return [];
    if (Array.isArray(data)) return data.map((d) => ({ hourId, id: d.id, data: d }));
    return [{ hourId, id: data.id || hourId, data }];
  }

  /* ------------------------- Render horas --------------------------- */
  function render(hourId, opt, info) {
    const d = opt.data;
    const h = HOURS.find((x) => x.id === hourId);

    let html = '<article class="prayer">';

    if (h.invite) html += renderInvitatorio(opt);

    html += opening(h);

    if (d.himno) {
      html += '<div class="rubric">Himno</div>' + text(d.himno);
    }

    if (hourId === 'oficio') return html + renderOficium(d) + closing() + '</article>';
    if (hourId === 'completas') return html + renderCompletas(d) + closing() + '</article>';
    if (MIDDAY.includes(hourId)) return html + renderMidday(d) + closing() + '</article>';

    // Laudes y Vísperas
    html += '<div class="rubric">Salmodia</div>';
    html += psalmSlot('primer_salmo', d);
    html += psalmSlot('segundo_salmo', d);
    html += psalmSlot('tercer_salmo', d);

    if (d.lectura_biblica) {
      html += '<div class="rubric">Lectura breve</div>';
      html += lecturaHtml(d.lectura_biblica_cita, d.lectura_biblica);
    }
    if (d.responsorios && d.responsorios.length) {
      html += '<div class="rubric">Responsorio breve</div>';
      html += renderRespList(d.responsorios);
    }
    html += '<div class="rubric">Cántico evangélico</div>';
    html += canticleHtml(h.canticle, d.cantico_evangelico_antifona);

    if (d.preces_contenido && d.preces_contenido.length) {
      html += '<div class="rubric">Preces</div>';
      html += precesHtml(d);
    }
    if (d.invitacion_padrenuestro) {
      html += '<div class="rubric">Padre nuestro</div>';
      html += '<p>' + italic(d.invitacion_padrenuestro) + '</p>';
      html += text('Padre nuestro, que estás en el cielo, santificado sea tu nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal.');
    }
    html += '<div class="rubric">Oración</div>';
    if (d.oracion_final) html += text(d.oracion_final.replace(/^Oremos:\s*/i, ''));

    // V. El Señor nos bendiga (Laudes)
    if (hourId === 'laudes') {
      html += '<div class="rubric">Conclusión</div>';
      html += text('El Señor nos bendiga, nos guarde de todo mal y nos lleve a la vida eterna. Amén.');
    }

    return html + closing() + '</article>';
  }

  function renderInvitatorio(opt) {
    return '<div class="rubric">Invitatorio</div>' +
      '<p><span class="vs">V.</span> Señor, ábreme los labios.</p>' +
      '<p><span class="vs">R.</span> Y mi boca proclamará tu alabanza.</p>';
  }

  function renderOficium(d) {
    let h = '';
    h += '<div class="rubric">Salmodia</div>';
    h += psalmSlot('primer_salmo', d);
    h += psalmSlot('segundo_salmo', d);
    h += psalmSlot('tercer_salmo', d);

    h += '<div class="rubric">Lectura bíblica</div>';
    h += lecturaHtml(d.lectura_biblica_cita_a || d.lectura_biblica_cita_i || d.lectura_biblica_cita_p,
                     d.lectura_biblica_texto_a || d.lectura_biblica_texto_i || d.lectura_biblica_texto_p,
                     d.lectura_biblica_titulo_a || d.lectura_biblica_titulo_i || d.lectura_biblica_titulo_p);

    if (d.responsorio1 && d.responsorio1.length) {
      h += '<div class="rubric">Responsorio</div>';
      h += renderRespList(d.responsorio1);
    }

    const patText = d.lectura_patristica_texto_a || d.lectura_patristica_texto_i || d.lectura_patristica_texto_p;
    const patCita = d.lectura_patristica_cita_a || d.lectura_patristica_cita_i || d.lectura_patristica_cita_p;
    const patTitulo = d.lectura_patristica_titulo_a || d.lectura_patristica_titulo_i || d.lectura_patristica_titulo_p;
    if (patText) {
      h += '<div class="rubric">Segunda lectura · Padres de la Iglesia</div>';
      h += lecturaHtml(patCita, patText, patTitulo);
      const res2 = d.responsorio2_a || d.responsorio2_i || d.responsorio2_p ||
                   d.responsorio3_a || d.responsorio3_i || d.responsorio3_p;
      if (res2 && res2.length) {
        h += '<div class="rubric">Responsorio</div>';
        h += renderRespList(res2);
      }
    }

    h += '<div class="rubric">Oración</div>';
    if (d.oracion_final) h += text(d.oracion_final.replace(/^Oremos:\s*/i, ''));
    return h;
  }

  function renderMidday(d) {
    let h = '';
    h += '<div class="rubric">Salmodia</div>';
    h += psalmSlot('primer_salmo', d);
    h += psalmSlot('segundo_salmo', d);
    h += psalmSlot('tercer_salmo', d);
    if (d.lectura_biblica) {
      h += '<div class="rubric">Lectura breve</div>';
      h += lecturaHtml(d.lectura_biblica_cita, d.lectura_biblica);
    }
    if (d.responsorios && d.responsorios.length) {
      h += '<div class="rubric">Responsorio breve</div>';
      h += renderRespList(d.responsorios);
    }
    h += '<div class="rubric">Oración</div>';
    if (d.oracion_final) h += text(d.oracion_final.replace(/^Oremos:\s*/i, ''));
    return h;
  }

  function renderCompletas(d) {
    let h = '';
    h += '<div class="rubric">Salmodia</div>';
    h += psalmSlot('primer_salmo', d);
    h += psalmSlot('segundo_salmo', d);

    if (d.lectura_biblica_texto) {
      h += '<div class="rubric">Lectura breve</div>';
      h += lecturaHtml(d.lectura_biblica_cita, d.lectura_biblica_texto);
    }
    const resCompletas = d.responsorio && d.responsorio.length ? d.responsorio : d.responsorio_pascua;
    if (resCompletas && resCompletas.length) {
      h += '<div class="rubric">Responsorio breve</div>';
      h += renderRespList(resCompletas);
    }
    h += '<div class="rubric">Cántico de Simeón</div>';
    h += canticleHtml('nunc', d.cantico_evangelico_antifona || d.antifona_triduo || d.antifona_inalbis);

    h += '<div class="rubric">Oración</div>';
    if (d.final) h += text(d.final.replace(/^Oremos:\s*/i, ''));

    // Antífona mariana al final de Completas
    h += '<div class="rubric">Antífona final de la Santísima Virgen</div>';
    h += text('Salve, Reina de los cielos y Señora de los ángeles; salve, raíz y puerta, de donde vino la luz al mundo. Alégrate, Virgen gloriosa, hermosa entre todas las mujeres; y ruega por nosotros a Cristo, Señor nuestro. (Tiempo de Pascua: Reina del cielo, alégrate, aleluya, porque el Señor, a quien mereciste llevar, ha resucitado, aleluya; ruega a Dios por nosotros, aleluya.)');
    return h;
  }

  return {
    HOURS, MIDDAY, ensure, setDate, load, optionsFor, render, esc, italic, text,
    invitatoryPsalms, opening, gloria
  };
})();

window.Liturgy = Liturgy;