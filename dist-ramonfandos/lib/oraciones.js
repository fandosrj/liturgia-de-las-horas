/* ============================================================
   Oraciones y rezos: recopilación de oraciones (Oratio),
   Rosario, Coronilla de la Divina Misericordia y Ángelus,
   en su versión litúrgica/tradicional en español.
   ============================================================ */
window.Oraciones = (() => {
  'use strict';

  const GRUPOS = [
    'Oraciones fundamentales',
    'Con la Virgen María',
    'Al Espíritu Santo y a los santos'
  ];

  const ORACIONES = [
    {
      id: 'senal', g: 0, titulo: 'Señal de la cruz',
      fuente: 'Tradicional',
      rezo: [['T', 'Por la señal de la Santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro. En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.']]
    },
    {
      id: 'padrenuestro', g: 0, titulo: 'Padre nuestro',
      fuente: 'Oración del Señor · texto litúrgico',
      rezo: [['T', 'Padre nuestro, que estás en el cielo, santificado sea tu nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.']]
    },
    {
      id: 'avemaria', g: 0, titulo: 'Avemaría',
      fuente: 'Tradicional',
      rezo: [['T', 'Dios te salve, María, llena eres de gracia; el Señor es contigo; bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.']]
    },
    {
      id: 'gloria', g: 0, titulo: 'Gloria',
      fuente: 'Doxología · texto litúrgico',
      rezo: [['T', 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.']]
    },
    {
      id: 'credo', g: 0, titulo: 'Credo de los Apóstoles',
      fuente: 'Catecismo de la Iglesia Católica',
      rezo: [['T', 'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo; nació de Santa María Virgen; padeció bajo el poder de Poncio Pilato; fue crucificado, muerto y sepultado; descendió a los infiernos; al tercer día resucitó de entre los muertos; subió a los cielos y está sentado a la derecha de Dios Padre todopoderoso, y desde allí ha de venir a juzgar a los vivos y a los muertos. Creo en el Espíritu Santo; la Santa Iglesia católica; la comunión de los santos; el perdón de los pecados; la resurrección de la carne; y la vida eterna. Amén.']]
    },
    {
      id: 'credoniceno', g: 0, titulo: 'Credo Niceno-Constantinopolitano',
      fuente: 'Símbolo de la fe · texto litúrgico',
      rezo: [['T', 'Creo en un solo Dios, Padre todopoderoso, Creador del cielo y de la tierra, de todo lo visible y lo invisible. Creo en un solo Señor, Jesucristo, Hijo único de Dios, nacido del Padre antes de todos los siglos: Dios de Dios, Luz de Luz, Dios verdadero de Dios verdadero, engendrado, no creado, de la misma naturaleza del Padre, por quien todo fue hecho; que por nosotros los hombres y por nuestra salvación bajó del cielo, y por obra del Espíritu Santo se encarnó de María, la Virgen, y se hizo hombre; y por nuestra causa fue crucificado en tiempos de Poncio Pilato: padeció y fue sepultado, y resucitó al tercer día, según las Escrituras, y subió al cielo, y está sentado a la derecha del Padre; y de nuevo vendrá con gloria para juzgar a vivos y muertos, y su reino no tendrá fin. Creo en el Espíritu Santo, Señor y dador de vida, que procede del Padre y del Hijo; que con el Padre y el Hijo recibe una misma adoración y gloria; que habló por los profetas. Creo en la Iglesia, que es una, santa, católica y apostólica. Confieso que hay un solo bautismo para el perdón de los pecados. Espero la resurrección de los muertos y la vida del mundo futuro. Amén.']]
    },
    {
      id: 'salve', g: 1, titulo: 'Salve',
      fuente: 'Antífona mariana',
      rezo: [['T', 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.']]
    },
    {
      id: 'acto', g: 0, titulo: 'Acto de contrición',
      fuente: 'Tradicional',
      rezo: [['T', 'Señor mío, Jesucristo, Dios y Hombre verdadero, Creador, Padre y Redentor mío: por ser Tú quien eres, bondad infinita, y porque te amo sobre todas las cosas, me pesa de todo corazón haberte ofendido; y propongo firmemente, con tu ayuda y tu gracia, no pecar más, apartarme de todas las ocasiones de ofenderte, confesarme y cumplir la penitencia que me fuere impuesta. Amén.']]
    },
    {
      id: 'angel', g: 0, titulo: 'Ángel de mi guarda',
      fuente: 'Tradicional',
      rezo: [['T', 'Ángel de mi guarda, mi dulce compañía, no me desampares ni de noche ni de día; no me dejes solo, que me perdería. Amén.']]
    },
    {
      id: 'acordaos', g: 1, titulo: 'Acordaos (Memorare)',
      fuente: 'San Bernardo',
      rezo: [['T', 'Acordaos, oh piadosísima Virgen María, que jamás se ha oído decir que ninguno de los que han acudido a vuestra protección, implorando vuestro auxilio, haya sido desamparado. Animados con esta confianza, a vos también acudimos, oh Madre, Virgen de las vírgenes; y aunque gemimos bajo el peso de nuestros pecados, nos postramos a vuestros pies. No despreciéis nuestras súplicas, antes bien, escuchadlas benignamente y acogedlas. Amén.']]
    },
    {
      id: 'bamparo', g: 1, titulo: 'Bajo tu amparo (Sub tuum)',
      fuente: 'Antífona mariana',
      rezo: [['T', 'Bajo tu amparo nos acogemos, Santa Madre de Dios; no deseches las súplicas que te dirigimos en nuestras necesidades; antes bien, líbranos siempre de todo peligro, ¡oh Virgen gloriosa y bendita! Amén.']]
    },
    {
      id: 'alma', g: 2, titulo: 'A Cristo crucificado (Alma de Cristo)',
      fuente: 'San Ignacio de Loyola',
      rezo: [['T', 'Alma de Cristo, santifícame. Cuerpo de Cristo, sálvame. Sangre de Cristo, embriágame. Agua del costado de Cristo, lávame. Pasión de Cristo, confórtame. ¡Oh buen Jesús!, óyeme. Dentro de tus llagas, escóndeme. No permitas que me separe de ti. Del maligno enemigo, defiéndeme. En la hora de mi muerte, llámame. Y mándame venir a ti, para que con tus santos te alabe por los siglos de los siglos. Amén.']]
    },
    {
      id: 'venir', g: 2, titulo: 'Ven, Espíritu Santo',
      fuente: 'Veni Sancte Spiritus y oración',
      rezo: [
        ['V', 'Envía, Señor, tu Espíritu, y serán creados.'],
        ['R', 'Y renovarás la faz de la tierra.'],
        ['T', 'Oh Dios, que iluminaste los corazones de tus fieles con la luz del Espíritu Santo, concédenos que, guiados por este mismo Espíritu, gustemos siempre el bien y gocemos de tu consuelo. Por Cristo nuestro Señor. Amén.'],
        ['T', 'Ven, Espíritu Santo, y envía desde el cielo un rayo de tu luz. Ven, padre de los pobres; ven, fuente de todos los dones; ven, luz de los corazones. Consolador magnífico, dulce huésped del alma, suave alivio en el dolor. Tú eres descanso en la fatiga, brisa en el calor, consuelo en el llanto. Luz de bienaventuranza, inunda el interior de nuestros corazones. Sin tu ayuda, nada hay en el hombre, nada que sea inocente. Lava nuestras manchas, riega nuestra aridez, sana nuestras heridas; doblega lo indócil, enciende lo frío, corrige nuestros extravíos. Concede a tus fieles, que en ti confían, tus santos siete dones. Da el mérito de la virtud, da el término feliz, da el gozo eterno. Amén.']
      ]
    },
    {
      id: 'sanmiguel', g: 2, titulo: 'Oración a San Miguel Arcángel',
      fuente: 'Oración de León XIII',
      rezo: [['T', 'San Miguel Arcángel, defiéndenos en la lucha; sé nuestro amparo contra la perversidad y las asechanzas del demonio. Supliquemos humildemente a Dios que lo someta; y tú, Príncipe de la milicia celestial, arroja al infierno, con el poder de Dios, a Satanás y a los demás espíritus malignos que andan dispersos por el mundo para la perdición de las almas. Amén.']]
    },
    {
      id: 'paz', g: 2, titulo: 'Oración por la paz',
      fuente: 'Atribuida a San Francisco de Asís',
      rezo: [['T', 'Señor, hazme un instrumento de tu paz. Donde haya odio, que yo lleve el amor; donde haya ofensa, que yo lleve el perdón; donde haya discordia, que yo lleve la unión; donde haya error, que yo lleve la verdad; donde haya duda, que yo lleve la fe; donde haya desesperanza, que yo lleve la esperanza; donde haya tinieblas, que yo lleve la luz; donde haya tristeza, que yo lleve la alegría. Oh Señor, haz que yo no busque tanto ser consolado como consolar, ser comprendido como comprender, ser amado como amar. Porque dando es como se recibe, perdonando es como se es perdonado, y muriendo es como se resucita a la vida eterna. Amén.']]
    },
    {
      id: 'ofrecimiento', g: 0, titulo: 'Ofrecimiento del día',
      fuente: 'Tradicional',
      rezo: [['T', 'Señor mío y Dios mío, creo firmemente en ti, espero en ti y te amo sobre todas las cosas. Me pesa de todo corazón haberte ofendido y propongo, con tu gracia, no volver a pecar. Te ofrezco en reparación de mis pecados mis oraciones, obras y sufrimientos de este día, uniéndolos a los méritos de Jesucristo y a las intenciones de la Virgen María. Amén.']]
    }
  ];

  function getOracion(id) {
    return ORACIONES.find((o) => o.id === id) || null;
  }

  /* ------------------------------- Rosario ------------------------------- */
  const MISTERIOS = {
    gozosos: [
      { n: 1, titulo: 'La Anunciación del Ángel a María', fruto: 'la humildad' },
      { n: 2, titulo: 'La Visitación de María a su prima Isabel', fruto: 'el amor al prójimo' },
      { n: 3, titulo: 'El Nacimiento de Jesús en Belén', fruto: 'el desapego de los bienes' },
      { n: 4, titulo: 'La Presentación de Jesús en el Templo', fruto: 'la obediencia' },
      { n: 5, titulo: 'El Niño Jesús perdido y hallado en el Templo', fruto: 'el recogimiento' }
    ],
    luminosos: [
      { n: 1, titulo: 'El Bautismo de Jesús en el Jordán', fruto: 'los dones del Espíritu Santo' },
      { n: 2, titulo: 'Las Bodas de Caná', fruto: 'la intercesión de María' },
      { n: 3, titulo: 'El anuncio del Reino de Dios', fruto: 'la conversión' },
      { n: 4, titulo: 'La Transfiguración de Jesús', fruto: 'el deseo de santidad' },
      { n: 5, titulo: 'La institución de la Eucaristía', fruto: 'el amor a la Eucaristía' }
    ],
    dolorosos: [
      { n: 1, titulo: 'La agonía de Jesús en el huerto de Getsemaní', fruto: 'aceptar la voluntad de Dios' },
      { n: 2, titulo: 'La flagelación de Jesús', fruto: 'la fortaleza' },
      { n: 3, titulo: 'La coronación de espinas', fruto: 'la paciencia' },
      { n: 4, titulo: 'Jesús con la cruz a cuestas', fruto: 'el amor a la cruz' },
      { n: 5, titulo: 'La crucifixión y muerte de Jesús', fruto: 'el perdón' }
    ],
    gloriosos: [
      { n: 1, titulo: 'La Resurrección de Jesús', fruto: 'la fe' },
      { n: 2, titulo: 'La Ascensión del Señor al cielo', fruto: 'la esperanza del cielo' },
      { n: 3, titulo: 'La venida del Espíritu Santo en Pentecostés', fruto: 'los frutos del Espíritu Santo' },
      { n: 4, titulo: 'La Asunción de María al cielo', fruto: 'la confianza en María' },
      { n: 5, titulo: 'La Coronación de María como Reina', fruto: 'la perseverancia final' }
    ]
  };
  const SERIE_NOMBRE = { gozosos: 'Gozosos', luminosos: 'Luminosos', dolorosos: 'Dolorosos', gloriosos: 'Gloriosos' };
  const MISTERIOS_DEL_DIA = [0, 1, 2, 3, 1, 2, 1].map((i) => i >= 0 ? ['gozosos', 'luminosos', 'dolorosos', 'gloriosos'][i] : 'gloriosos');
  const serieDelDia = (fecha) => {
    const d = fecha instanceof Date ? fecha.getDay() : (typeof fecha === 'number' ? fecha : 0);
    const map = { 0: 'gloriosos', 1: 'gozosos', 2: 'dolorosos', 3: 'gloriosos', 4: 'luminosos', 5: 'dolorosos', 6: 'gozosos' };
    return map[d] || 'gozosos';
  };

  /* ----------------------- Coronilla de la Misericordia ----------------------- */
  const CORONILLA = {
    apertura: [
      ['T', 'Señal de la cruz. Se comienza rezando, en la primera cuenta del Rosario, el Padrenuestro; en las tres siguientes, el Avemaría y el Gloria. Invocación:'],
      ['T', 'Tú, que en la hora de la agonía te ofreciste al Padre como Madre de la Divina Misericordia, y que por pura gracia para todos nosotros, el Hijo te confió: mira nuestra herida humanidad y ten piedad de ella. Danos tu amparo, Madre de la misericordia.']
    ],
    grande: 'Padre Eterno, yo te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu Amadísimo Hijo, nuestro Señor Jesucristo, en reparación de nuestros pecados y los del mundo entero.',
    pequeña: 'Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero.',
    santoDios: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten misericordia de nosotros y del mundo entero.',
    cierre: [
      ['T', 'Sangre y Agua que brotaste del Corazón de Jesús como fuente de misericordia para nosotros, en ti confío.'],
      ['T', 'Oh Dios eterno, en quien la misericordia es infinita y el tesoro de la compasión inagotable; míranos con bondad y aumenta en nosotros la misericordia, para que en los momentos difíciles no desesperemos ni nos desalienten, sino que nos sometamos con gran confianza a tu santa voluntad, que es Amor y Misericordia misma. Amén.']
    ]
  };

  /* ------------------------------- Ángelus ------------------------------- */
  const ANGELUS = {
    angelus: [
      ['V', 'El Ángel del Señor anunció a María.'],
      ['R', 'Y concibió por obra y gracia del Espíritu Santo.'],
      ['T', 'Avemaría.'],
      ['V', 'He aquí la esclava del Señor.'],
      ['R', 'Hágase en mí según tu palabra.'],
      ['T', 'Avemaría.'],
      ['V', 'Y el Verbo se hizo carne.'],
      ['R', 'Y habitó entre nosotros.'],
      ['T', 'Avemaría.'],
      ['V', 'Ruega por nosotros, Santa Madre de Dios.'],
      ['R', 'Para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo.'],
      ['T', 'Infunde, Señor, tu gracia en nuestros corazones, para que, quienes hemos conocido por el anuncio del Ángel la encarnación de tu Hijo, por su pasión y su cruz seamos llevados a la gloria de la resurrección. Por Cristo nuestro Señor. Amén.'],
      ['T', 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.']
    ],
    regina: [
      ['V', 'Reina del cielo, alégrate. Aleluya.'],
      ['R', 'Porque el que mereciste llevar en tu seno. Aleluya.'],
      ['V', 'Ha resucitado, como te dijo. Aleluya.'],
      ['R', 'Ruega por nosotros a Dios. Aleluya.'],
      ['V', 'Gózate y alégrate, Virgen María. Aleluya.'],
      ['R', 'Porque verdaderamente ha resucitado el Señor. Aleluya.'],
      ['T', 'Oh Dios, que por la resurrección de tu Hijo, nuestro Señor Jesucristo, te dignaste alegrar al mundo, concédenos que, por su Madre, la Virgen María, lleguemos al gozo de la vida eterna. Por Cristo nuestro Señor. Amén.'],
      ['T', 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.']
    ]
  };

  return { GRUPOS, ORACIONES, getOracion, ROSARIO: { MISTERIOS, SERIE_NOMBRE, serieDelDia }, CORONILLA, ANGELUS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = window.Oraciones;