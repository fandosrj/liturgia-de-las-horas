/* ============================================================
   Rito Ortodoxo · Oficio Divino (partes fijas del Horologion)
   Traducciones propias al español de los textos antiguos
   (Constantinopla, dominio público). Las piezas variables del
   día —troparia, kathismata, cánones, prokímena, lecciones—
   se rezan según el Octoecos, el Mineo y el Triodion.
   ============================================================ */

window.Ortodoxo = (() => {
  'use strict';

  const GL = 'Gloria al Padre, y al Hijo, y al Espíritu Santo, ahora y siempre y por los siglos de los siglos. Amén.';

  const inicialesBlock = [
    { t: 't', txt: 'Gloria a Ti, Dios nuestro, gloria a Ti.' },
    { t: 't', txt: 'Rey celestial, Consolador, Espíritu de verdad, que estás en todas partes y todo lo llenas, tesoro de bienes y dador de vida: ven y habita en nosotros, y límpianos de toda mancha, y salva, oh Bueno, nuestras almas.' },
    { t: 't', txt: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten misericordia de nosotros. (tres veces)' },
    { t: 'gl' },
    { t: 't', txt: 'Santísima Trinidad, ten misericordia de nosotros. Señor, perdona nuestros pecados. Maestro, absuelve nuestras iniquidades. Santo, visita y sana nuestras debilidades, por amor de tu Nombre.' },
    { t: 't', txt: 'Señor, ten piedad. Señor, ten piedad. Señor, ten piedad.' },
    { t: 'gl' },
    { t: 't', txt: 'Padre nuestro, que estás en los cielos, santificado sea tu Nombre; venga tu Reino; hágase tu voluntad, así en la tierra como en el cielo. El pan nuestro de cada día dánosle hoy; y perdónanos nuestras deudas, así como nosotros perdonamos a nuestros deudores; y no nos dejes caer en la tentación, mas líbranos del mal.' },
    { t: 'vr', v: 'Porque tuyo es el Reino, el poder y la gloria, del Padre, y del Hijo, y del Espíritu Santo, ahora y siempre y por los siglos de los siglos.', r: 'Amén.' },
    { t: 't', txt: 'Venid, adoremos y postrémonos ante el Rey, nuestro Dios. Venid, adoremos y postrémonos ante Cristo, Rey y Dios nuestro. Venid, adoremos y postrémonos ante el mismo Cristo, Rey y Dios nuestro.' }
  ];

  const oficioSalmo50 = {
    t: 'p',
    ref: 'Salmo 50 (Miserere)',
    txt: 'Ten piedad de mí, oh Dios, según tu gran misericordia, y según la multitud de tus compasiones borra mi iniquidad. Lávame más y más de mi maldad, y límpiame de mi pecado. Porque reconozco mis transgresiones, y mi pecado está siempre delante de mí. Contra Ti, sólo contra Ti he pecado, y he hecho lo malo delante de tus ojos; para que seas reconocido justo en tu sentencia, y sin tacha en tu juicio. He aquí que en iniquidad fui formado, y en pecado me concibió mi madre. He aquí que Tú amas la verdad en lo íntimo, y en lo secreto me haces conocer la sabiduría. Purifícame con hisopo, y seré limpio; lávame, y seré más blanco que la nieve. Hazme oír gozo y alegría, y se regocijarán los huesos que has quebrantado. Aparta tu rostro de mis pecados, y borra todas mis iniquidades. Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto dentro de mí. No me eches de delante de tu rostro, y no quites de mí tu santo Espíritu. Devuélveme el gozo de tu salvación, y sostenme con un espíritu generoso. Enseñaré a los transgresores tus caminos, y los pecadores se volverán a Ti. Líbrame de sangre, oh Dios, Dios de mi salvación, y cantará mi lengua tu justicia. Señor, abre mis labios, y mi boca proclamará tu alabanza. Porque no te agrada el sacrificio; de lo contrario te lo ofrecería; ni hallas complacencia en el holocausto. El sacrificio de Dios es el espíritu contrito; al corazón contrito y humillado, oh Dios, no despreciarás. Haz bien con tu beneplácito a Sión; edifica los muros de Jerusalén. Entonces te agradarán los sacrificios de justicia, el holocausto y la ofrenda entera; entonces ofrecerán sobre tu altar becerros.'
  };

  const himnoAlaben = { t: 'nt', txt: 'Dejad que toda criatura se alegre en el Señor: alabad al Señor desde los cielos — salmos 148, 149 y 150 —, mientras los coros alaban al Esposo que ha resucitado.' };

  const OFICIOS = [
    {
      id: 'iniciales',
      titulo: 'Oraciones iniciales',
      sub: 'El comienzo de todo oficio',
      secciones: [
        { r: 'Comienzo', b: inicialesBlock },
        { r: 'Salmo 50', b: [oficioSalmo50] },
        { r: 'Símbolo de la fe', b: [
          { t: 't', txt: 'Creo en un solo Dios, Padre Todopoderoso, Creador del cielo y de la tierra, de todas las cosas visibles e invisibles. Y en un solo Señor, Jesucristo, Hijo unigénito de Dios, engendrado del Padre antes de todos los siglos; luz de luz, Dios verdadero de Dios verdadero; engendrado, no creado; consubstancial al Padre, por quien todo fue hecho; que por nosotros los hombres y por nuestra salvación bajó de los cielos, y se encarnó del Espíritu Santo y de María Virgen, y se hizo hombre; y fue crucificado por nosotros bajo Poncio Pilato, padeció y fue sepultado; y resucitó al tercer día, según las Escrituras; y subió a los cielos, y está sentado a la diestra del Padre; y otra vez ha de venir con gloria para juzgar a vivos y muertos, y su Reino no tendrá fin. Y en el Espíritu Santo, Señor y dador de vida, que procede del Padre, que con el Padre y el Hijo recibe una misma adoración y gloria, y que habló por los profetas. Y en una sola Iglesia, santa, católica y apostólica. Confieso un solo bautismo para la remisión de los pecados. Espero la resurrección de los muertos, y la vida del siglo venidero. Amén.' },
          { t: 't', txt: 'Es realmente digno llamarte bienaventurada, oh Theotokos, la siempre bienaventurada y santísima y Madre de nuestro Dios. Más honorable que los querubines, e incomparablemente más gloriosa que los serafines; tú que, sin corrupción, engendraste a Dios el Verbo: verdadera Theotokos, te magnificamos.' },
          { t: 't', txt: 'Gloria a Ti, Dios nuestro, gloria a Ti. Siendo Cristo, el verdadero Dios nuestro, por las oraciones de su purísima Madre y de todos los santos, es decir, ten misericordia de nosotros y sálvanos, porque es bueno y amigo del hombre. Señor, ten piedad. Señor, ten piedad. Señor, ten piedad. Bendecid.' }
        ] }
      ]
    },
    {
      id: 'visperas',
      titulo: 'Vísperas',
      sub: 'La hora del ocaso',
      secciones: [
        { r: 'Apertura', b: [
          { t: 't', txt: 'Venid, adoremos y postrémonos ante el Rey, nuestro Dios. Venid, adoremos y postrémonos ante Cristo, Rey y Dios nuestro. Venid, adoremos y postrémonos ante el mismo Cristo, Rey y Dios nuestro. Bendice, alma mía, al Señor: Señor Dios mío, eres grande con magnificencia — salmo 103 —, tú que en el atardecer escuchas la alabanza de tus siervos y de todo el que teme tu Nombre.' },
          { t: 'vr', v: 'Señor, a Ti he clamado; escúchame.', r: 'Escucha la voz de mi plegaria, cuando a Ti clamo.' },
          { t: 'nt', txt: 'Aquí se cantan los salmos 140, 141, 129 y 116, con las estiqueras del día según el Octoecos y el Mineo.' }
        ] },
        { r: 'Luz gozosa · Hymn vespertino', b: [
          { t: 't', txt: 'Luz gozosa de la santa gloria del inmortal Padre celestial, santo, bienaventurado: Jesucristo. Habiendo llegado al ocaso del sol, viendo la luz vespertina, cantamos al Padre, al Hijo y al Espíritu Santo, Dios. Digno es en todo tiempo cantarte con voces de alabanza, oh Hijo de Dios, dador de vida; por eso el mundo te glorifica.' }
        ] },
        { r: 'Prokímenon de la tarde', b: [
          { t: 'nt', txt: 'El prokímenon vespertino, propio del día, se canta con sus estilos durante la semana.' }
        ] },
        { r: 'Súplica vespertina', b: [
          { t: 't', txt: 'Concédenos, Señor, que esta noche seamos guardados sin pecado. Bendito eres, Señor, Dios de nuestros padres, y alabado y glorificado es tu Nombre por los siglos. Amén. Sea, Señor, tu misericordia sobre nosotros, según esperamos en Ti. Bendito eres, Señor: enséñame tus ordenanzas. Bendito eres, Maestro: dame entendimiento de tus mandamientos. Bendito eres, Santo: ilumíname con tus juicios. Señor, tu misericordia es eterna; no desprecies las obras de tus manos.' },
          { t: 'vr', v: 'A Ti se debe alabanza, a Ti se debe canto, a Ti se debe gloria: al Padre, y al Hijo, y al Espíritu Santo, ahora y siempre y por los siglos de los siglos.', r: 'Amén.' }
        ] },
        { r: 'Cántico de Simeón', b: [
          { t: 't', txt: 'Ahora, Señor, despides a tu siervo en paz, según tu palabra, porque han visto mis ojos tu salvación, la que has preparado ante todos los pueblos: luz para revelación de los gentiles, y gloria de tu pueblo Israel.' }
        ] },
        { r: 'Trisagio · Apolítikion', b: [
          { t: 't', txt: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten misericordia de nosotros. (tres veces)' },
          { t: 'gl' },
          { t: 't', txt: 'Padre nuestro, que estás en los cielos, santificado sea tu Nombre; venga tu Reino; hágase tu voluntad, así en la tierra como en el cielo. El pan nuestro de cada día dánosle hoy; y perdónanos nuestras deudas, así como nosotros perdonamos a nuestros deudores; y no nos dejes caer en la tentación, mas líbranos del mal.' },
          { t: 'nt', txt: 'Se canta aquí el apolítikion del día y su theotokion correspondiente.' },
          { t: 't', txt: 'Alégrate, Theotokos Virgen, María llena de gracia: el Señor es contigo. Bendita eres entre las mujeres, y bendito es el fruto de tu vientre, porque has dado a luz al Salvador de nuestras almas.' },
          { t: 'vr', r: 'Bendice.' },
          { t: 't', txt: 'Siendo Cristo, el verdadero Dios nuestro, por las oraciones de su purísima Madre, de los santos apóstoles, de los santos del día y de todos los santos, ten misericordia de nosotros y sálvanos, porque es bueno y amigo del hombre. Amén.' }
        ] }
      ]
    },
    {
      id: 'completas',
      titulo: 'Completas menores',
      sub: 'La oración de la noche',
      secciones: [
        { r: 'Oraciones iniciales', b: inicialesBlock.filter((b) => b.t !== 'p' && b.t !== 'nt') },
        { r: 'Salmos de la noche', b: [
          oficioSalmo50,
          { t: 'p', ref: 'Salmo 69', txt: 'Dios, acude a librarme; Señor, apresúrate a ayudarme. Sean avergonzados y confusos los que buscan mi vida. Vuélvanse atrás y sean confundidos los que desean mi mal. Retrocedan por vergüenza los que me dicen: ¡Ja, ja! Alégrense y gocen en Ti todos los que te buscan, y digan siempre: ¡Engrandecido sea Dios! los que aman tu salvación. Pero yo estoy afligido y pobre; oh Dios, apresúrate a mí. Tú eres mi ayuda y mi libertador; Señor, no te detengas.' },
          { t: 'p', ref: 'Salmo 142', txt: 'Señor, escucha mi oración, inclina tu oído a mi súplica; en tu fidelidad dame respuesta, en tu justicia. No entres en juicio con tu siervo, pues ningún viviente es justo delante de Ti. Porque el enemigo persigue mi alma; ha pisoteado en tierra mi vida, me ha confinado a tinieblas, como a los que hace tiempo murieron. Por eso desfallece mi espíritu dentro de mí, mi corazón se queda desolado. Me acuerdo de los días antiguos, medito en todas tus obras, reflexiono en la obra de tus manos. Extiendo hacia Ti mis manos; mi alma te desea como tierra sedienta. Apresúrate a responderme, Señor; mi espíritu desfallece. No escondas de mí tu rostro, no sea que venga a ser como los que descienden a la fosa. Hazme oír tu favor por la mañana, porque en Ti confío; muéstrame el camino que he de andar, porque a Ti elevo mi alma. Líbrame de mis enemigos, Señor; a Ti me acojo. Enséñame a hacer tu voluntad, porque Tú eres mi Dios; tu buen espíritu me guíe por tierra llana. Por amor de tu Nombre, Señor, vivifícame; en tu justicia saca mi alma de la angustia. Y en tu misericordia extermina a mis enemigos, y destruye a todos los que afligen mi alma, pues yo soy tu siervo.' }
        ] },
        { r: 'Gran doxología', b: [
          { t: 't', txt: 'Gloria a Dios en las alturas, y en la tierra paz, a los hombres buena voluntad. Te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias por tu grande gloria. Señor, Rey celestial, Dios Padre todopoderoso; Señor, Hijo unigénito, Jesucristo, y Espíritu Santo. Señor Dios, Cordero de Dios, Hijo del Padre, que quitas el pecado del mundo, ten misericordia de nosotros. Tú que quitas los pecados del mundo, acepta nuestra súplica. Tú que estás sentado a la diestra del Padre, ten misericordia de nosotros. Porque Tú solo eres Santo, Tú solo Señor, Jesucristo, para gloria de Dios Padre. Amén.' }
        ] },
        { r: 'Símbolo de la fe', b: [
          { t: 't', txt: 'Creo en un solo Dios, Padre Todopoderoso, Creador del cielo y de la tierra, de todas las cosas visibles e invisibles. Y en un solo Señor, Jesucristo, Hijo unigénito de Dios, engendrado del Padre antes de todos los siglos; luz de luz, Dios verdadero de Dios verdadero; engendrado, no creado; consubstancial al Padre, por quien todo fue hecho; que por nosotros los hombres y por nuestra salvación bajó de los cielos, y se encarnó del Espíritu Santo y de María Virgen, y se hizo hombre; y fue crucificado por nosotros bajo Poncio Pilato, padeció y fue sepultado; y resucitó al tercer día, según las Escrituras; y subió a los cielos, y está sentado a la diestra del Padre; y otra vez ha de venir con gloria para juzgar a vivos y muertos, y su Reino no tendrá fin. Y en el Espíritu Santo, Señor y dador de vida, que procede del Padre, que con el Padre y el Hijo recibe una misma adoración y gloria, y que habló por los profetas. Y en una sola Iglesia, santa, católica y apostólica. Confieso un solo bautismo para la remisión de los pecados. Espero la resurrección de los muertos, y la vida del siglo venidero. Amén.' }
        ] },
        { r: 'Trisagio · Padre nuestro', b: [
          { t: 't', txt: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten misericordia de nosotros. (tres veces)' },
          { t: 'gl' },
          { t: 't', txt: 'Padre nuestro, que estás en los cielos, santificado sea tu Nombre; venga tu Reino; hágase tu voluntad, así en la tierra como en el cielo. El pan nuestro de cada día dánosle hoy; y perdónanos nuestras deudas, así como nosotros perdonamos a nuestros deudores; y no nos dejes caer en la tentación, mas líbranos del mal.' },
          { t: 'vr', r: 'Porque tuyo es el Reino, el poder y la gloria. Amén.' }
        ] },
        { r: 'Oraciones de la noche', b: [
          { t: 't', txt: 'Señor, ten piedad. (cuarenta veces)' },
          { t: 't', txt: 'En todo tiempo y a toda hora, adorado y glorificado en el cielo y en la tierra, Cristo Dios, que eres longánimo, grande en misericordia, que amas al justo y te compadeces del pecador, que llamas a todos a la salvación por la promesa de los bienes futuros: recibe, Señor, también en esta hora nuestras súplicas, y encamina nuestra vida hacia tus mandamientos. Santifica nuestras almas, purifica nuestros cuerpos, endereza nuestros pensamientos, limpia nuestras intenciones y líbranos de toda tribulación, dolor y mal. Amén.' },
          { t: 't', txt: 'Señor, Señor nuestro, que nos has concedido llegar a estas horas de la noche, guárdanos de todo pecado y ten misericordia de nosotros. Oh Dios, nuestro Salvador, que eres amigo del hombre, te damos gracias por cuanto nos has hecho en la vigilia, y te suplicamos que purifiques nuestras almas de toda iniquidad.' }
        ] },
        { r: 'Theotokion final', b: [
          { t: 't', txt: 'Alégrate, Theotokos Virgen, María llena de gracia: el Señor es contigo. Bendita eres entre las mujeres, y bendito es el fruto de tu vientre, porque has dado a luz al Salvador de nuestras almas.' },
          { t: 't', txt: 'Siendo Cristo, el verdadero Dios nuestro, por las oraciones de su purísima Madre y de todos los santos, ten misericordia de nosotros y sálvanos, porque es bueno y amigo del hombre. Amén.' }
        ] }
      ]
    },
    {
      id: 'medianoche',
      titulo: 'Oficio de medianoche',
      sub: 'En vela por el Esposo que viene',
      secciones: [
        { r: 'Oraciones iniciales', b: inicialesBlock.filter((b) => b.t !== 'p' && b.t !== 'nt') },
        { r: 'Salmo 50', b: [oficioSalmo50] },
        { r: 'Himno del Esposo', b: [
          { t: 't', txt: 'He aquí que el Esposo viene a la medianoche, y bienaventurado el siervo a quien encuentra velando; mas indigno el que le halla adormecido. Vela, pues, alma mía, no te dejes vencer por el sueño, no sea que seas entregada a la muerte y quedes fuera del Reino. Pero vuelve en ti y clama: Santo, santo, santo eres, Dios nuestro; por las oraciones de la Theotokos, ten misericordia de nosotros.' }
        ] },
        { r: 'Oración', b: [
          { t: 't', txt: 'Señor Todopoderoso, Dios de las virtudes, que eres desde siempre y has creado todas las cosas: recibe a esta medianoche la súplica de los que se levantan a alabarte, y líbranos de la lanza del adversario.' },
          { t: 't', txt: 'Oh Esposo amado, ven, tómanos de la mano y condúcenos por el camino de tus mandamientos; que el sueño no nos venza, sino que, velando, te recibamos a Ti, luz inextinguible, con el Padre y el Espíritu Santo.' }
        ] },
        { r: 'Dismissal', b: [
          { t: 't', txt: 'Siendo Cristo, el verdadero Dios nuestro, por las oraciones de su purísima Madre y de todos los santos, ten misericordia de nosotros y sálvanos, porque es bueno y amigo del hombre. Amén.' }
        ] }
      ]
    },
    {
      id: 'maitines',
      titulo: 'Maitines · Orthros',
      sub: 'La alabanza del amanecer',
      secciones: [
        { r: 'Oraciones iniciales', b: inicialesBlock.filter((b) => b.t !== 'p' && b.t !== 'nt') },
        { r: 'Dios es el Señor', b: [
          { t: 'vr', v: 'Dios es el Señor, y se nos ha revelado.', r: 'Bendito el que viene en el Nombre del Señor.' },
          { t: 'nt', txt: 'Se canta el troparion del día (según el tono del Octoecos y la fiesta del Mineo) y luego su theotokion.' }
        ] },
        { r: 'Kathismata', b: [
          { t: 'nt', txt: 'Durante los kathismata se lee el Salterio: los 150 salmos distribuidos por la semana, una vez por semana en Cuaresma y dos veces fuera de ella.' }
        ] },
        { r: 'Salmo 50', b: [oficioSalmo50] },
        { r: 'Cánones', b: [
          { t: 'nt', txt: 'Se cantan los cánones: el del día según el tono del Octoecos, los de la Theotokos y los del santo del día. Cada oda cierra con la katavasía correspondiente.' }
        ] },
        { r: 'Laudes', b: [
          himnoAlaben,
          { t: 't', txt: 'Gran doxología: Gloria a Dios en las alturas, y en la tierra paz, a los hombres buena voluntad. Te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias por tu grande gloria. Señor, Rey celestial, Dios Padre todopoderoso; Señor, Hijo unigénito, Jesucristo, y Espíritu Santo. Señor Dios, Cordero de Dios, Hijo del Padre, que quitas el pecado del mundo, ten misericordia de nosotros. Tú que quitas los pecados del mundo, acepta nuestra súplica. Tú que estás sentado a la diestra del Padre, ten misericordia de nosotros. Porque Tú solo eres Santo, Tú solo Señor, Jesucristo, para gloria de Dios Padre. Amén.' },
          { t: 't', txt: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten misericordia de nosotros. (tres veces)' },
          { t: 'gl' }
        ] },
        { r: 'Dismissal', b: [
          { t: 't', txt: 'Siendo Cristo, el verdadero Dios nuestro, que resucitó de entre los muertos, por las oraciones de su purísima Madre, de los santos apóstoles, de los santos del día y de todos los santos, ten misericordia de nosotros y sálvanos, porque es bueno y amigo del hombre. Amén.' }
        ] }
      ]
    },
    {
      id: 'horas',
      titulo: 'Horas Tercera, Sexta y Nona',
      sub: 'La santificación del día',
      secciones: [
        {
          r: 'Hora Tercera · media mañana',
          b: [
            { t: 't', txt: 'Venid, adoremos y postrémonos ante el Rey, nuestro Dios. Venid, adoremos y postrémonos ante Cristo, Rey y Dios nuestro. Venid, adoremos y postrémonos ante el mismo Cristo, Rey y Dios nuestro.' },
            { t: 'gl' },
            { t: 't', txt: 'Padre nuestro, que estás en los cielos, santificado sea tu Nombre; venga tu Reino; hágase tu voluntad, así en la tierra como en el cielo. El pan nuestro de cada día dánosle hoy; y perdónanos nuestras deudas, así como nosotros perdonamos a nuestros deudores; y no nos dejes caer en la tentación, mas líbranos del mal.' },
            { t: 'nt', txt: 'Troparion del día, theotokion de la Tercera Hora y prokímenon.' },
            { t: 'o', txt: 'Señor, que a la hora tercera enviaste a tus apóstoles tu Espíritu Santo: no lo apartes de nosotros, oh Bueno, sino renóvalo en nosotros que te suplicamos, para que, iluminados, te cantemos: Espíritu Santo, Dios, gloria a Ti.' }
          ]
        },
        {
          r: 'Hora Sexta · mediodía',
          b: [
            { t: 't', txt: 'Dios, acude a librarme; Señor, apresúrate a ayudarme. (Salmo 69)' },
            { t: 'gl' },
            { t: 'nt', txt: 'Troparion del día, theotokion de la Sexta Hora y prokímenon.' },
            { t: 'o', txt: 'Dios y Señor de los ejércitos, Creador de toda la creación, que por tu incomparable misericordia enviaste a tu Hijo unigénito para la destrucción del pecado: destruye en nosotros toda pasión de la carne y del espíritu, y aviva en nuestros corazones la luz de tus mandamientos, oh amigo del hombre.' }
          ]
        },
        {
          r: 'Hora Nona · media tarde',
          b: [
            { t: 't', txt: 'Bendice, alma mía, al Señor, y no olvides ninguno de sus beneficios. (Salmo 102)' },
            { t: 'gl' },
            { t: 'nt', txt: 'Troparion del día, theotokion de la Nona Hora y prokímenon.' },
            { t: 'o', txt: 'Señor Jesucristo, Dios nuestro, que a la hora novena, por amor de nuestros pecados, subiste, sin pecado, a la cruz: perdona nuestras ofensas voluntarias e involuntarias, y guíanos, que te confesamos, hacia la luz de tus mandamientos.' }
          ]
        }
      ]
    }
  ];

  function getOficio(id) { return OFICIOS.find((o) => o.id === id) || null; }

  return { OFICIOS, getOficio };
})();