/* ============================================================
   Rezo en latín · oraciones fijas y cánticos (Vulgata)
   Cada pieza: pares [latín, español] por versículo para
   traducción sincronizada, y lectura suave (speechSynthesis).
   ============================================================ */

window.LatinaRezado = (() => {
  'use strict';

  const REPOSO = (texto) => texto;

  const LIBRO = {
    Completas: 'Completas',
    Laudes: 'Laudes',
    Vísperas: 'Vísperas'
  };

  const oraciones = [
    {
      id: 'signo',
      titulo: 'Señal de la cruz',
      fuente: '',
      rezo: 'Completas',
      suave: 0.6,
      versos: [
        ['In nómine Patris, et Fílii, et Spíritus Sancti. Amen.', 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.']
      ]
    },
    {
      id: 'pater',
      titulo: 'Padre nuestro',
      fuente: 'Mt 6, 9-13',
      rezo: 'Laudes · Vísperas',
      suave: 0.55,
      versos: [
        ['Pater noster, qui es in cælis:', 'Padre nuestro, que estás en el cielo:'],
        ['sanctificétur nomen tuum.', 'santificado sea tu Nombre;'],
        ['Advéniat regnum tuum.', 'venga a nosotros tu Reino;'],
        ['Fiat volúntas tua, sicut in cælo et in terra.', 'hágase tu voluntad en la tierra como en el cielo.'],
        ['Panem nostrum cotidiánum da nobis hódie.', 'Danos hoy nuestro pan de cada día;'],
        ['Et dimítte nobis débita nostra, sicut et nos dimíttimus debitóribus nostris.', 'perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden;'],
        ['Et ne nos indúcas in tentatiónem.', 'no nos dejes caer en la tentación,'],
        ['Sed líbera nos a malo.', 'y líbranos del mal. Amén.']
      ]
    },
    {
      id: 'ave',
      titulo: 'Ave María',
      fuente: 'Lc 1, 28.42',
      rezo: LIBRO.Completas,
      suave: 0.55,
      versos: [
        ['Avé, María, grátia plena, Dóminus tecum;', 'Dios te salve, María, llena eres de gracia, el Señor es contigo;'],
        ['benedícta tu in muliéribus, et benedíctus fructus ventris tui, Iesus.', 'bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.'],
        ['Sancta María, Mater Dei, ora pro nobis peccatóribus, nunc et in hora mortis nostræ. Amen.', 'Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.']
      ]
    },
    {
      id: 'gloriapatri',
      titulo: 'Gloria al Padre',
      fuente: '',
      rezo: 'Todas las horas',
      suave: 0.7,
      versos: [
        ['Glória Patri, et Fílio, et Spirítui Sancto.', 'Gloria al Padre, y al Hijo, y al Espíritu Santo.'],
        ['Sicut erat in princípio, et nunc, et semper, et in sæcula sæculórum. Amen.', 'Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.']
      ]
    },
    {
      id: 'gloria',
      titulo: 'Gloria',
      fuente: '',
      rezo: 'Laudes',
      suave: 0.6,
      versos: [
        ['Glória in excélsis Deo, et in terra pax homínibus bonæ voluntátis.', 'Gloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor.'],
        ['Laudámus te. Benedícimus te. Adorámus te. Glorificámus te.', 'Por tu inmensa gloria te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias.'],
        ['Grátias ágimus tibi propter magnam glóriam tuam, Dómine Deus, Rex cæléstis, Deus Pater omnípotens.', 'Señor Dios, Rey celestial, Dios Padre todopoderoso.'],
        ['Dómine Fili unigénite, Iesu Christe, Dómine Deus, Agnus Dei, Fílius Patris, qui tollis peccáta mundi, miserére nobis;', 'Señor, Hijo único, Jesucristo. Señor Dios, Cordero de Dios, Hijo del Padre: tú que quitas el pecado del mundo, ten piedad de nosotros;'],
        ['qui tollis peccáta mundi, súscipe deprecatiónem nostram;', 'tú que quitas el pecado del mundo, acoge nuestra súplica;'],
        ['qui sedes ad déxteram Patris, miserére nobis.', 'tú que estás sentado a la derecha del Padre, ten piedad de nosotros.'],
        ['Quóniam tu solus Sanctus, tu solus Dóminus, tu solus Altíssimus, Iesu Christe, cum Sancto Spíritu in glória Dei Patris. Amen.', 'Porque sólo tú eres Santo, sólo tú Señor, sólo tú Altísimo, Jesucristo, con el Espíritu Santo en la gloria de Dios Padre. Amén.']
      ]
    },
    {
      id: 'credo',
      titulo: 'Credo · Símbolo de los Apóstoles',
      fuente: '',
      rezo: 'Laudes · Vísperas',
      suave: 0.55,
      versos: [
        ['Credo in Deum Patrem omnipoténtem, Creatórem cæli et terræ.', 'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra.'],
        ['Et in Iesum Christum, Fílium eius únicum, Dóminum nostrum,', 'Creo en Jesucristo, su único Hijo, nuestro Señor,'],
        ['qui concéptus est de Spíritu Sancto, natus ex María Vírgine,', 'que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María la Virgen;'],
        ['passus sub Póntio Piláto, crucifixus, mórtuus, et sepúltus,', 'padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado,'],
        ['descéndit ad ínferos; tértia die resurréxit a mórtuis;', 'descendió a los infiernos, y al tercer día resucitó de entre los muertos;'],
        ['ascéndit ad cælos, sedet ad déxteram Dei Patris omnipoténtis;', 'subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso;'],
        ['inde ventúrus est iudicáre vivos et mórtuos.', 'desde allí ha de venir a juzgar a vivos y muertos.'],
        ['Credo in Spíritum Sanctum, sanctam Ecclésiam cathólicam, sanctórum comuniónem, remissiónem peccatórum,', 'Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados,'],
        ['carnis resurrectiónem, et vitam ætérnam. Amen.', 'la resurrección de la carne y la vida eterna. Amén.']
      ]
    },
    {
      id: 'benedictus',
      titulo: 'Benedictus · Cántico de Zacarías',
      fuente: 'Lc 1, 68-79',
      rezo: LIBRO.Laudes,
      suave: 0.5,
      versos: [
        ['Benedíctus Dóminus, Deus Israël, quia visitávit et fecit redemptiónem plebi suæ,', 'Bendito sea el Señor, Dios de Israel, porque ha visitado y redimido a su pueblo,'],
        ['et eréxit cornu salútis nobis in domo David, púeri sui,', 'y nos ha suscitado un poderoso Salvador en la casa de David, su siervo,'],
        ['sicut locútus est per os sanctórum, qui a sæculo sunt, prophetárum eius,', 'según lo anunció desde antiguo por boca de sus santos profetas:'],
        ['salútem ex inimícis nostris, et de manu ómnium qui odérunt nos;', 'que nos salvaría de nuestros enemigos y de la mano de todos los que nos aborrecen;'],
        ['ad faciéndam misericórdiam cum pátribus nostris, et memorári testaménti sui sancti,', 'realizando la misericordia que tuvo con nuestros padres, recordando su santa alianza'],
        ['iusiurándum, quod iurávit ad Ábraham, patrem nostrum, datúrum se nobis,', 'y el juramento que hizo a nuestro padre Abrahán: concedernos'],
        ['ut sine timóre, de manu inimicórum liberáti, serviámus illi', 'que, libres de temor, arrancados de la mano de los enemigos, le sirvamos'],
        ['in sanctitáte et iustítia coram ipso ómnibus diébus nostris.', 'con santidad y justicia, en su presencia, todos nuestros días.'],
        ['Et tu, puer, Prophéta Altíssimi vocáberis: præíbis enim ante fáciem Dómini paráre vias eius,', 'Y tú, niño, serás llamado profeta del Altísimo, pues irás delante del Señor a preparar sus caminos,'],
        ['ad dandam sciéntiam salútis plebi eius in remissiónem peccatórum eórum,', 'anunciando a su pueblo la salvación, el perdón de sus pecados,'],
        ['per viscera misericórdiæ Dei nostri, in quibus visitávit nos óriens ex alto,', 'por la entrañable misericordia de nuestro Dios, que nos visita un sol que nace de lo alto,'],
        ['illumináre his qui in ténebris et in umbra mortis sedent, ad dirigéndos pedes nostros in viam pacis.', 'para iluminar a los que viven en tinieblas y en sombra de muerte, para guiar nuestros pasos por el camino de la paz.']
      ]
    },
    {
      id: 'magnificat',
      titulo: 'Magnificat · Cántico de María',
      fuente: 'Lc 1, 46-55',
      rezo: LIBRO.Vísperas,
      suave: 0.5,
      versos: [
        ['Magníficat ánima mea Dóminum,', 'Proclama mi alma la grandeza del Señor,'],
        ['et exsultávit spíritus meus in Deo salvatóre meo,', 'se alegra mi espíritu en Dios, mi salvador,'],
        ['quia respéxit humilitátem ancíllæ suæ. Ecce enim ex hoc beátam me dicent omnes generatiónes,', 'porque ha mirado la humillación de su esclava. Desde ahora me felicitarán todas las generaciones,'],
        ['quia fecit mihi magna, qui potens est, et sanctum nomen eius,', 'porque el Poderoso ha hecho obras grandes en mí; su nombre es santo,'],
        ['et misericórdia eius in progénies et progénies timéntibus eum.', 'y su misericordia llega a sus fieles de generación en generación.'],
        ['Fecit poténtiam in bráchio suo, dispérsit supérbos mente cordis sui;', 'Él hace proezas con su brazo: dispersa a los soberbios de corazón,'],
        ['depósuit poténtes de sede, et exaltávit húmiles;', 'derriba del trono a los poderosos y enaltece a los humildes,'],
        ['esuriéntes implévit bonis, et dívites dimísit inánes.', 'a los hambrientos los colma de bienes y a los ricos los despide vacíos.'],
        ['Suscépit Israël, púerum suum, recordátus misericórdiæ suæ,', 'Auxilia a Israel, su siervo, acordándose de su misericordia,'],
        ['sicut locútus est ad patres nostros, Ábraham et sémini eius in sæcula.', 'como lo había prometido a nuestros padres, en favor de Abrahán y su descendencia para siempre.']
      ]
    },
    {
      id: 'nunc',
      titulo: 'Nunc dimittis · Cántico de Simeón',
      fuente: 'Lc 2, 29-32',
      rezo: LIBRO.Completas,
      suave: 0.5,
      versos: [
        ['Nunc dimíttis servum tuum, Dómine, secúndum verbum tuum in pace,', 'Ahora, Señor, según tu promesa, puedes dejar a tu siervo irse en paz,'],
        ['quia vidérunt óculi mei salutáre tuum,', 'porque han visto mis ojos tu salvación,'],
        ['quod parásti ante fáciem ómnium populórum,', 'la que has preparado ante todos los pueblos,'],
        ['lumen ad revelatiónem géntium, et glóriam plebis tuæ Israël.', 'luz para alumbrar a las naciones, y gloria de tu pueblo Israel.']
      ]
    },
    {
      id: 'visita',
      titulo: 'Visita, Señor, esta casa',
      fuente: 'Completas',
      rezo: LIBRO.Completas,
      suave: 0.55,
      versos: [
        ['Visita, quaesumus, Dómine, habitatiónem istam, et omnes insídias inimíci ab ea longe repélle:', 'Visita, Señor, esta casa: aleja de ella las insidias del enemigo;'],
        ['Angeli tui sancti hábitent in ea, qui nos in pace custódiant, et benedíctio tua sit super nos semper.', 'que tus santos ángeles habiten en ella y nos guarden en paz, y tu bendición permanezca siempre con nosotros.'],
        ['Per Christum Dóminum nostrum. Amen.', 'Por Jesucristo, nuestro Señor. Amén.']
      ]
    },
    {
      id: 'salve',
      titulo: 'Salve Regina',
      fuente: 'Antífona final',
      rezo: LIBRO.Completas,
      suave: 0.5,
      versos: [
        ['Salve, Regína, mater misericórdiæ, vita, dulcédo, et spes nostra, salve.', 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve.'],
        ['Ad te clamámus, éxsules fílii Hevæ.', 'A ti llamamos los desterrados hijos de Eva;'],
        ['Ad te suspirámus, geméntes et flentes in hac lacrimárum valle.', 'a ti suspiramos, gimiendo y llorando en este valle de lágrimas.'],
        ['Eia ergo, advocáta nostra, illos tuos misericórdes óculos ad nos convérte.', 'Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos;'],
        ['Et Iesum, benedíctum fructum ventris tui, nobis post hoc exsílium osténde.', 'y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre.'],
        ['O clemens, o pia, o dulcis Virgo María.', 'Oh clemente, oh piadosa, oh dulce Virgen María.'],
        ['Ora pro nobis, sancta Dei Génitrix, ut digni efficiámur promissiónibus Christi. Amen.', 'Ruega por nosotros, santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.']
      ]
    },
    {
      id: 'regina',
      titulo: 'Regina Caeli',
      fuente: 'Antífona del Tiempo Pascual',
      rezo: 'Completas',
      suave: 0.55,
      versos: [
        ['Regína cæli, lætáre, allelúia,', 'Reina del cielo, alégrate, aleluya,'],
        ['quia quem meruísti portáre, allelúia,', 'porque el que mereciste llevar en tu seno, aleluya,'],
        ['resurréxit, sicut dixit, allelúia.', 'ha resucitado, según lo predijo, aleluya.'],
        ['Ora pro nobis Deum, allelúia.', 'Ruega por nosotros a Dios, aleluya.']
      ]
    },
    {
      id: 'angelus',
      titulo: 'Ángelus',
      fuente: 'Lc 1, 28.38 · Jn 1, 14',
      rezo: 'Oración de mediodía',
      suave: 0.55,
      versos: [
        ['Angelus Dómini nuntiávit Maríæ,', 'El Ángel del Señor anunció a María,'],
        ['et concépit de Spíritu Sancto.', 'y concibió por obra del Espíritu Santo.'],
        ['Ecce ancílla Dómini,', 'He aquí la esclava del Señor,'],
        ['fiat mihi secúndum verbum tuum.', 'hágase en mí según tu palabra.'],
        ['Et Verbum caro factum est,', 'Y el Verbo se hizo carne,'],
        ['et habitávit in nobis.', 'y habitó entre nosotros.']
      ]
    },
    {
      id: 'veni',
      titulo: 'Veni, Sancte Spiritus',
      fuente: 'Secuencia de Pentecostés',
      rezo: 'Laudes del Espíritu Santo',
      suave: 0.5,
      versos: [
        ['Veni, Sancte Spíritus, et emítte cælitus lucis tuæ rádium,', 'Ven, Espíritu divino, manda tu luz desde el cielo,'],
        ['Veni, pater páuperum, veni, dator múnerum, veni, lumen córdium.', 'Padre amoroso del pobre; don, en tus dones espléndido; luz que penetra las almas.'],
        ['Consolátor óptime, dulcis hospes ánimæ, dulce refrigérium,', 'Fuente del mayor consuelo, dulce huésped del alma, suave refrigerio.'],
        ['in labóre réquies, in æstu tempéries, in fletu solácium.', 'En el trabajo, descanso; en el incendio, tregua; en el llanto, consuelo.'],
        ['O lux beatíssima, reple cordis íntima tuórum fidélium.', '¡Oh luz beatísima!, inunda el interior de tus fieles.'],
        ['Sine tuo númine, nihil est in hómine, nihil est innocuum.', 'Sin tu ayuda nada hay en el hombre, nada que sea inocente.']
      ]
    }
  ];

  const REPOSA = { siglos: 'seculorum' };

  function palabraReposa(txt) {
    return txt;
  }

  function vocesLatinas() {
    if (!('speechSynthesis' in window)) return [];
    try {
      return window.speechSynthesis.getVoices().filter((v) => (v.lang || '').toLowerCase().indexOf('la') === 0 || (v.lang || '').toLowerCase().indexOf('lat') === 0);
    } catch (e) { return []; }
  }

  function vozLatin() {
    const vs = vocesLatinas();
    if (!vs.length) return null;
    const it = vs.find((v) => (v.lang || '').toLowerCase() === 'la-it');
    const va = vs.find((v) => (v.lang || '').toLowerCase() === 'la');
    return it || va || vs[0];
  }

  function leer(texto, opciones) {
    opciones = opciones || {};
    if (!('speechSynthesis' in window)) return false;
    const suave = opciones.suave !== false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'la';
      u.rate = suave ? (opciones.rate || 0.62) : 0.9;
      u.pitch = suave ? 0.9 : 1;
      u.volume = 0.9;
      const v = vozLatin();
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  function detener() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { }
    }
  }

  const ALT = {
    REPOSO: REPOSO,
    REPOSA: REPOSA,
    palabraReposa: palabraReposa
  };

  function oracionById(id) { return oraciones.find((o) => o.id === id) || null; }

  return { oraciones, oracionById, leer, detener, vocesLatinas, vozLatin, ALT };
})();