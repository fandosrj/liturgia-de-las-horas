# Mi comunidad · backend PHP para ramonfandos.es

Puerto en PHP + SQLite de la misma funcionalidad "Mi comunidad" (espacios,
roles, oficios, versiones) que corre en Node dentro de `community.js`, para
hosting compartido normal (DonDominio) que no ejecuta Node.js.

Misma lógica y mismas rutas que el original en Node, así que el cliente
(`public/lib/community.js`) no necesita saber en cuál de los dos está
hablando. Diferencia real: **sin WebSocket**, así que no hay aviso instantáneo
cuando alguien actualiza un oficio; cada pantalla trae lo último al abrirse.

## Despliegue (por FTP, dentro de `ramonfandos.es/liturgiadelashoras/`)

- `router.php` y `.htaccess` van en `.../liturgiadelashoras/api/`.
- La base de datos SQLite se crea sola la primera vez, **fuera** de la
  carpeta pública (en `_data/comunidad.sqlite`, al nivel de la cuenta FTP,
  no dentro de `public/`), para que nadie pueda descargarla por URL.
- No hace falta MySQL ni credenciales: PHP ya trae SQLite3/PDO integrado.

## Cómo se activa en el cliente

`tools/build-ramonfandos.mjs` inyecta antes de cargar ningún script:

```html
<script>window.LH_GH = 1; window.LH_SPACES = 1; window.LH_BASE = "/liturgiadelashoras";</script>
```

- `LH_GH` desactiva presencia en vivo / intenciones / coros (necesitan Node).
- `LH_SPACES` activa la sección "Mi comunidad" (antes solo se activaba con
  `!GH`, es decir, solo en Render).
- `LH_BASE` hace que `public/lib/community.js` construya sus peticiones como
  `/liturgiadelashoras/api/...` en vez de relativas a la raíz del dominio.

**Importante**: estas globales tienen que cargarse ANTES que
`lib/community.js` (que lee `window.LH_BASE` nada más arrancar), no justo
delante de `app.js` -eso fue un bug real ya corregido: `BASE` se quedaba
vacío y las peticiones iban a `/api/...` en la raíz del dominio, dando 404-.
