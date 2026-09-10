# Liturgia de las Horas

PWA "la oración oficial de la Iglesia en tu dispositivo": las siete horas de la
Liturgia de las Horas (Invitatorio, Oficio de lectura, Laudes, Tercia, Sexta,
Nona, Vísperas y Completas) con fidelidad al breviario, junto con otros rezos y
herramientas de oración.

## Funcionalidades

- **Siete horas** de la Liturgia de las Horas, calculadas para cualquier fecha
  (años litúrgicos completos), con lecturas, salmodia, responsorios, preces,
  cánticos evangélicos y antífonas.
- **Estilo de edición impresa**: salmos en negro y títulos/citas en rojo.
- **Auto-scroll** de lectura regulable (Lento · Suave · Normal · Rápido).
- **Paleta del color litúrgico** del día y tema claro/oscuro.
- **Salterio en kathismas** (rito ortodoxo): los 150 salmos según la numeración
  LXX del salterio litúrgico, en las 20 kathismas del Oficio Divino.
- **La Liturgia Ortodoxa**: Horologion, servicios del día y letanías.
- **Rezo en latín**: Padrenuestro, Avemaría y oraciones con texto bilingüe.
- **Santo del día** (calendario romano en España, 2024–2030), **Santo Rosario**
  (misterios, cuentas), **Coronilla de la Divina Misericordia**, **Ángelus /
  Regina Caeli** y una colección de **oraciones**.
- **Mis salmos y rezos**: guarda tus salmos favoritos y compón rezos
  personalizados.
- **Biblia**: 73 libros (con tu propio archivo JSON importado) y lecturas del
  día y de la Misa.
- **Comunidad de rezo**: presencia anónima ("rezamos juntos ahora"), coros con
  amigos e intenciones de oración (requiere el servidor).
- **PWA instalable y offline**.

## Tecnologías

- Cliente: HTML/CSS/JS plano (sin frameworks), service worker, IndexedDB vía
  `localStorage`.
- Textos litúrgicos: [`breviarium`](https://github.com/gregordavijevic/breviarium) (MIT).
- Santoral: [`romcal`](https://roman-calendar.com) y `@romcal/calendar.spain` (MIT).
- Servidor: Node.js, Express, `ws` (WebSockets) y SQLite.

## Ejecutar

```bash
npm install
node server.js
```

Abre <http://localhost:4000>. El servidor se regenera con su propia base de
datos (`data/liturgia.db`); la librería de rezo (`breviarium`) se ejecuta en el
cliente, por lo que las horas funcionan sin conexión una vez instalada la PWA.

## Estructura

```
public/          cliente (index.html, styles.css, app.js, lib/, vendor/)
tools/           generadores (gen-salterio.mjs, gen-santos.mjs)
server.js        express + ws + SQLite (presencia, comunidad, intenciones)
community.js     lógica de comunidad en el cliente
```

## Privacidad

La presencia en la comunidad es anónima y opcional: solo cuentas agregadas y,
si lo permites, tu posición aproximada sin nombre en el mapa. No hay rankings
ni perfiles públicos.

## Atribuciones y licencia

Código MIT (ver `LICENSE`). Los textos litúrgicos en español pertenecen a la
**Conferencia Episcopal Española**; `breviarium` es MIT. Este proyecto no está
afiliado ni avalado por la CEE ni por el Vaticano.