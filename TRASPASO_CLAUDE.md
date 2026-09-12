# TRASPASO A CLAUDE — Liturgia de las Horas (PWA)

Documento de continuidad. Estado del proyecto y de todo el trabajo hecho hasta el
**10 de septiembre de 2026**. Léelo completo antes de tocar nada.

---

## 1. Resumen

PWA "Liturgia de las Horas" (rezo oficial de la Iglesia Católica) con:

- Las **7 horas** del oficio (Invitatorio, Oficio de lectura, Laudes, Tercia,
  Sexta, Nona, Vísperas, Completas), latín, rito ortodoxo, salterio en kathismas.
- Rezos ePres: **Santo del día**, **Rosario**, **Coronilla**, **Ángelus/Regina**,
  **oraciones** (todo integrado y verde en el boot-test).
- Estilo de **edición impresa**: salmos en negro, **títulos/citas en rojo**.
- **Comunidad** (presencia, intenciones, coros) con servidor — **solo presente en
  la versión "completa"**, NO en la de GitHub.
- **Dos entregables**:
  1. **Versión solo-GitHub** (ligera, sin servidor) publicada en
     `https://liturgiahoras.github.io/` — DECISIÓN DEL USUARIO: esta es la que
     se mantiene en GitHub, sin complicaciones.
  2. **Versión completa** (con comunidad) para "la app" que se hará aparte.

**Regla de oro:** la página de GitHub SOLO se publica desde el build
`dist-github/` (nunca `public/` tal cual).

---

## 2. Dónde está el proyecto y cómo arrancar

```
C:\Users\rjsfa\Dropbox\APP LITURGIA DE LAS HORAS\liturgia
```

- Node v24.19.0 (usa `node:sqlite`, requiere Node >= 22 pese al `engines` del
  package.json).
- Dependencias: `express`, `ws`, `breviarium` (el resto es JS plano, sin build).
- Ejecutar: `npm install` y `node server.js` → `http://localhost:4000`.
- El servidor sirve `public/` como estático + API `/api/*` + WebSocket `/ws`.
  Los cambios de cliente se ven recargando (el servidor no necesita reinicio).
- No hay lint ni typecheck; la validación es `node tools/boot-test.js`
  (debe terminar con `--- PRUEBA COMPLETA SIN ERRORES DE ARRANQUE ---`).

## 3. Archivos clave

| Ruta | Función |
|---|---|
| `public/index.html` | Página única, drawer, scripts, plantilla `#tpl-hour-card` |
| `public/app.js` | Toda la app cliente (rutas, vistas, comunidad, modos) |
| `public/styles.css` | Estilos (variables globales abajo) |
| `public/sw.js` | Service worker (cache `v7` actual) |
| `public/lib/*.js` | store, favs, latin, ortodoxo, salterio, **santos**, **oraciones**, liturgy, biblia, **community** (cliente) |
| `public/vendor/breviarium.umd.js` | Motor de rezo (los textos; MIT) |
| `public/vendor/leaflet/*` | Mapa (solo versión completa) |
| `server.js` | Express + monta `/api` y `/ws` |
| `community.js` | Backend de comunidad (SQLite con `node:sqlite`) |
| `tools/boot-test.js` | Test de arranque + asserts de modo GH |
| `tools/build-github.mjs` | Genera `dist-github/` (versión para Pages) |
| `tools/gen-santos.mjs`, `gen-salterio.mjs` | Generadores (santoral, salterio) |
| `render.yaml`, `Procfile`, `Dockerfile` | Despliegue de la versión completa (futuro) |
| `LICENSE`, `README.md`, `.gitignore` | Legal y documentación |

Variables CSS de la paleta: `--ink` (texto), `--ink-soft` (secundario),
`--rub` = ROJO de títulos (#b3261e claro / #ea7d70 oscuro), `--accent` (color
litúrgico del día), `--accent-ink`. **Los salmos son SIEMPRE negros y los
títulos/citas SIEMPRE rojos** (decisión del usuario, tipo edición impresa).

## 4. Funcionalidades completas (todas verificadas)

- 7 horas del oficio con auto-scroll (AJUSTE: `as.acc` acumula fracciones de px,
  no hay scroll subpíxel), antífonas, himnos, salmodia, lecturas, responsorios,
  preces, cánticos (Evangélico, Simeón, Zacarías), Gloria, Padre nuestro, final.
- Misal/lecturas del día, Biblia (73 libros, importación de texto propio, local).
- Salterio en kathismas (rito ortodoxo): 150 salmos numeración LXX, 20 kathismas,
  variante España/Latinoamérica, semana desde lunes.
- Rito ortodoxo: Horologion, oficios (incl. Completas), letanías.
- Rezo en latín (bilingüe), "Mis salmos y rezos" (favoritos + personalizados).
- Rezo del día (grid en portada): Rosario, Coronilla, Ángelus, Oraciones, + línea
  de santo del día. **Rosario**: 4 series (Gozosos/Luminosos/Dolorosos/Gloriosos),
  hoy → serie del día (`serieDelDia`, jueves = luminosos), cuentas.
- Comunidad (solo versión completa): presencia (mapa Leaflet + países),
  intenciones (añañadir/rezar/denunciar/mías), coros, chat de evento.

## 5. ePrex (integrado y acabado)

- `public/lib/santos.js`: `window.Santos`, 1264 fechas (2024–2030), calendario
  romano-España (romcal), nombres localizados. **2026-09-10 = sin santo** (la
  línea se omite al generar). Acceso: `Santos.dias['YYYY-MM-DD']`.
- `public/lib/oraciones.js`: `window.Oraciones` con 16 oraciones en 3 grupos,
  `ROSARIO.MISTERIOS`, `ROSARIO.SERIE_NOMBRE`, `serieDelDia(fecha)`,
  `CORONILLA`, `ANGELUS`/`REGINA` (Regina si la temporada incluye `EASTER_TIME`,
  que se obtiene de `Liturgy.ensure().getLiturgyInformation(...).seasons`).
- Store de rezos ePrex (claves): `rosario_<serie>`, `coronilla`, `angelus`,
  `orac_<id>`.

## 6. Lecturas del día sin duplicar (BUG corregido)

`getLectures()` del motor devuelve **un set por ciclo litúrgico** (jueves →
EVEN+ODD = 2 sets; domingo → YEAR_A/B/C = 3 sets). Antes `misalView` los
imprimía todos (repeticiones). Ahora `lectionSetFor(lect, info)` (en `app.js`)
elige UNO: ciclo del año (A/B/C) si existe, si no EVEN/ODD por paridad del año
(`endOfLiturgycalSeason`, ojo con ese nombre con doble "cal"), y si no ANY/MEMORY
o el primero. El boot-test lo valida (1 "Primera lectura", 1 "Evangelio").

## 7. Modo GitHub ("GH") — cómo funciona

- En `public/app.js` hay una bandera `GH`:
  `window.LH_GH === 1 || hostname termina en .github.io`.
- Con GH activo: `presenceLive()`/`geoPrompt()`/`attachHomePresence()`/
  `attachGeoPrompt()`/`checkIntentionNews()`/`nowOthers()`/`attachNowOthers()`/…
  no arrancan nada y devuelven vacío; `Community.joinHour` y el toast del "hemos
  rezado N personas" se saltan; en `init()` no se conecta el socket.
- `#comunidad` con GH muestra `communityStaticView()` (tarjeta + botón a
  `https://ramonfandos.es/liturgiahoras`).
- **Portada con GH (y también sin él)**: reemplaza los antiguos `hour-chips` por
  un grid `hour-cards` con las 7 horas; la recomendada lleva "Hora de ahora" y la
  rezada, un ✓. Función `homeHourCards(recId)`.

## 8. Build de Pages (`tools/build-github.mjs`)

`node tools/build-github.mjs` copia `public/` → `dist-github/` y:
- borra `lib/community.js` y `vendor/leaflet/`.
- quita del índice el `li` "Comunidad de rezo" y las referencias a leaflet.
- inyecta `<script>window.LH_GH = 1;</script>` antes de `app.js`.
- escribe `.nojekyll` y ajusta el `CORE` del service worker a lo que queda.

`dist-github/` está en `.gitignore` (no se commitea).

## 9. Publicación en GitHub (estado actual)

- **Código** (fuente): `https://github.com/fandosrj/liturgia-de-las-horas`
  (rama `main`; commits hasta `7943105`). Remoto: `origin`.
- **Estática** (Pages): `https://github.com/liturgiahoras/liturgiahoras.github.io`
  (rama `main`; commits: `2be3aa5` → `9350c94` → `157572e`).
- **Web viva**: `https://liturgiahoras.github.io/`.
- Clon temporal de trabajo de Pages: `C:\Users\rjsfa\AppData\Local\Temp\opencode\pages`
  (es el repo `liturgiahoras/liturgiahoras.github.io`, no cambiar de rama).

**Cómo publicar (procedimiento manual actual):**
```
node tools/build-github.mjs
# borrar el contenido de %TEMP%\opencode\pages y copiar dist-github\* ahí
git -C "$env:TEMP\opencode\pages" add -A
git -C "$env:TEMP\opencode\pages" commit -m "…"
git -C "$env:TEMP\opencode\pages" push origin main
```
Luego GitHub Pages reconstruye solo (~1 min).

Al tocar `sw.js` hay que **subir el Nº de caché** (ahora `v7`): si no, los
clientes con SW antiguo no se actualizan.

## 10. Subruta y versión completa (futura, NO tocar para Pages)

Para poder colgar la versión completa bajo `ramonfandos.es/liturgiahoras` sin
romper nada (futuro, con app/hosting Node):

- **Servidor**: lee `BASE_PATH` (p. ej. `/liturgiahoras`); monta estático, `/api`
  y `/ws` bajo esa ruta y redirige `/` a ella. `community.js` (servidor) acepta
  ese `base` (resta el prefijo en `handle()` y en el path del WebSocket).
- **Cliente**: `public/lib/community.js` lee `window.LH_BASE` y lo antepone a
  `/api/*` y al path de WebSocket; `sw.js` excluye `BASE + '/api/'` y `BASE +
  '/ws'`.
- Ficheros listos: `render.yaml`, `Procfile`, `Dockerfile` y sección
  "Despliegue" en el README.
- Ese trabajo está commiteado y NO afecta al build de Pages (el build lo quita).

## 11. Decisiones de producto (importantes, respetar)

1. **GitHub = solo la versión ligera** (decisión del usuario el 10-sep-2026):
   no complicar Pages con backend/PHP. La versión **completa** se hará "para la
   app" aparte (Android/app), no en GitHub.
2. **Paleta impresa**: salmos negros, títulos rojos. NO usar el color litúrgico
   del día para los títulos de las horas.
3. Comunidad sin rankings/puntos/seguidores; anonimato; intenciones sin nombre.
4. En `ramonfandos.es` hay otro proyecto (Frasly Music) con comunidad **PHP +
   Apache, sin WebSocket** (todo REST). Puede ser el patrón a replicar cuando se
   haga la versión completa sin Node. NO tocar nada de Frasly Music.
5. DonDominio: hosting compartido Apache; no ejecuta Node.

## 12. Entorno y trampas conocidas

- La consola de PowerShell muestra acentos raros en algunos outputs; los archivos
  están en UTF-8 correcto. No "corregir" encodings.
- `data/liturgia.db` (SQLite) se genera sola en local; no commitearla
  (`.gitignore` la excluye).
- Al regenerar `dist-github/`, a veces falla `rmdir dist-github` por `EBUSY`
  (Windows): esperar unos segundos e reintentar. Suele deberse a un visor de
  archivos o antivirus abriendo el directorio.
- `boot-test.js` corre `app.js` en un VM; al final TESTEA el **modo GH**
  (`sandbox.LH_GH = 1`): la ruta `#comunidad` debe dar la tarjeta estática y
  `#hoy` no debe contener presencia/geo/intenciones. Si algo de eso falla, rompes
  la versión Pages sin darte cuenta.

## 13. Estado pendiente / próximos pasos (sin hacer)

- [ ] (OPCIONAL) Workflow de GitHub Actions para auto-publicar Pages desde
      `main` (build → push a `liturgiahoras/liturgiahoras.github.io`). Requiere
      un token fine-grained con `Contents: write` solo sobre el repo de Pages,
      guardado como secreto `LITURGIA_PAGES_TOKEN`. NO hecho.
- [ ] Versión "completa"/app (Android u otra) — aplazada por el usuario.
- [ ] Si se toca `sw.js`, subir el nº de caché (v8, …).

## 14. Comandos rápidos

```
node server.js                          # servir en http://localhost:4000
node tools/boot-test.js                 # validación (debe acabar en verde)
node tools/build-github.mjs             # generar dist-github/
node tools/gen-santos.mjs               # regenerar public/lib/santos.js
node tools/gen-salterio.mjs             # regenerar public/lib/salterio.js
```