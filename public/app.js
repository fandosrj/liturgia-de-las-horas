/* ============================================================
   Liturgia de las Horas · Controlador (SPA)
   Enrutado por hash, fechas, temas, vistas y service worker.
   ============================================================ */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const view = $('#view');
  const loading = $('#loading');

  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function fmtDate(d) {
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function iso(d) { return d.toISOString().slice(0, 10); }

  // Versión web estática (GitHub Pages): sin servidor -> sin comunidad/presencia.
  const GH = window.LH_GH === 1 || /^([a-z0-9-]+\.)?[a-z0-9-]+\.github\.io$/i.test(location.hostname || '');

  /* -------------------------- Temas / ajustes -------------------------- */
  function applySettings() {
    const s = Store.get();
    const theme = s.theme === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : s.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.fs = s.fontSize || 'M';
    $('#meta-theme').setAttribute('content', theme === 'dark' ? '#17151c' : '#f6f2e9');
  }

  function setAccent(hex) {
    if (!hex) return;
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-ink', shade(hex, -35));
  }

  function shade(hex, pct) {
    const n = parseInt(hex.replace('#', ''), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = pct > 0 ? 255 : 0;
    const k = Math.abs(pct) / 100;
    r = Math.round(r + (t - r) * k);
    g = Math.round(g + (t - g) * k);
    b = Math.round(b + (t - b) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ------------------------------ Rotas ------------------------------ */
  function parseHash() {
    return location.hash.replace(/^#\/?/, '');
  }

  async function route() {
    const h = parseHash();
    if (h.startsWith('hora/')) return hourView(h.split('/')[1]);
    if (h.startsWith('biblia/libro/')) return bibliaBookView(h.split('/')[2]);
    if (h.startsWith('biblia/cap/')) {
      const parts = h.split('/');
      return bibliaChapterView(parts[2], parseInt(parts[3], 10));
    }
    if (h.startsWith('personal/pray/')) return personalPrayView(h.split('personal/pray/')[1]);
    if (h === 'personal') return personalView();
    if (h === 'latin') return latinView();
    if (h.startsWith('ortodoxa/oficio/')) return ortodoxoOficioView(h.split('ortodoxa/oficio/')[1]);
    if (h.startsWith('ortodoxa/kathisma/')) return kathismaView(parseInt(h.split('ortodoxa/kathisma/')[1], 10));
    if (h === 'ortodoxa/salterio') return salterioView();
    if (h.startsWith('rosario/')) return rosarioSerieView(h.split('rosario/')[1]);
    if (h === 'rosario') return rosarioView();
    if (h === 'coronilla') return coronillaView();
    if (h === 'angelus') return angelusView();
    if (h.startsWith('oraciones/')) return oracionView(h.split('oraciones/')[1]);
    if (h === 'oraciones') return oracionesView();
    if (h === 'misal' || h === 'lecturas') return misalView();
    if (h === 'ortodoxa') return ortodoxaView();
    if (h === 'biblia') return bibliaView();
    if (GH && h === 'comunidad') return communityStaticView();
    if (h === 'comunidad') return communityView();
    if (h === 'lecturas') return lecturasView();
    if (h === 'ajustes') return settingsView();
    if (h === 'acerca') return acercaView();
    return homeView();
  }

  function showLoading(on) {
    loading.classList.toggle('hidden', !on);
  }

  /* ------------------------------- Hoy ------------------------------- */
  async function homeView() {
    showLoading(true);
    try {
      const info = await Liturgy.ensure().getLiturgyInformation(currentDate);

      const prayedCount = Liturgy.HOURS.filter((h) => Store.isPrayed(currentDate, h.id)).length;
      const recommended = recommendedHour();
      const hx = Liturgy.HOURS.find((x) => x.id === recommended) || { name: 'Rezo', time: '' };

      let html = '<section class="day-hero home-hero">';
      if (info.celebration && info.celebration !== 'Feria') html += `<div class="celebration">${Liturgy.esc(info.celebration)}</div>`;
      html += `<div class="now-label">Ahora</div>
        <h1 class="hero-hour">${Liturgy.esc(hx.name)}</h1>
        <div class="date-line">${fmtDate(currentDate)}</div>
        <a class="rezar-btn" href="#hora/${recommended}">REZAR</a>
        ${Store.isPrayed(currentDate, recommended) ? `<div class="hero-done">Ya has rezado ${Liturgy.esc(hx.name)} hoy</div>` : ''}
      </section>`;

      html += presenceLive();
      html += geoPrompt();
      html += dateNav();
      html += saintsHtml(currentDate);
      html += `<div class="section-title">${prayedCount ? `${prayedCount} de ${Liturgy.HOURS.length} horas rezadas hoy` : 'Las siete horas de hoy'}</div>`;
      html += homeHourCards(recommended);
      html += `<div class="section-title">Rezo del día</div>`;
      html += rezoDelDiaGrid(currentDate);
      html += `<div class="btn-row">
        <a class="btn" href="#lecturas">Lecturas del día</a>
        <a class="btn" href="#biblia">Biblia</a>
        <a class="btn" href="#comunidad">Comunidad</a>
      </div>`;

      view.innerHTML = html;
      attachGeoPrompt();
      attachHomePresence();
      checkIntentionNews();
    } catch (e) {
      view.innerHTML = errBox(e);
    }
    showLoading(false);
  }

  /* --------- Presencia en portada: “Ahora rezamos juntos” --------- */
  function homeHourCards(recId) {
    let h = '<div class="hour-cards">';
    for (const hx of Liturgy.HOURS) {
      const d = Store.isPrayed(currentDate, hx.id);
      const rec = hx.id === recId;
      h += `<a class="hour-card${rec ? ' recommended' : ''}${d ? ' done' : ''}" href="#hora/${hx.id}">
        <div class="hour-card-head">
          <span class="hour-name">${Liturgy.esc(hx.name)}</span>
          <span class="hour-time">${Liturgy.esc(hx.time)}</span>
          <span class="hour-check${d ? ' done' : ''}" title="${d ? 'Rezada' : ''}">${d ? '&#10003;' : ''}</span>
        </div>
        <div class="hour-card-body">${rec ? '<span class="hour-ant">Hora de ahora</span>' : '<span class="hour-ant">Elegir</span>'}</div>
      </a>`;
    }
    return h + '</div>';
  }

  function presenceLive() {
    if (GH) return '';
    return `<section class="now-praying" id="now-praying">
      <div class="np-count"><span id="np-total">0</span><span id="np-label">personas rezando ahora</span></div>
      <div class="np-countries" id="np-countries"></div>
      <div class="np-solo" id="np-solo">No estás rezando solo.</div>
    </section>`;
  }

  function setNowPraying(p) {
    const totalEl = document.querySelector('#np-total');
    if (!totalEl) return;
    const total = (p && p.total) || 0;
    totalEl.textContent = total;
    const label = document.querySelector('#np-label');
    if (label) label.textContent = total === 1 ? 'persona rezando ahora' : 'personas rezando ahora';
    const cw = document.querySelector('#np-countries');
    if (cw) {
      const list = (p && p.countries) || [];
      cw.innerHTML = list.map((c) => `<span class="np-country" title="${Liturgy.esc(c.name)}">${c.flag} ${Liturgy.esc(c.name)}${c.count > 1 ? ' · ' + c.count : ''}</span>`).join('');
    }
    const solo = document.querySelector('#np-solo');
    if (solo) solo.style.display = total > 0 ? '' : 'none';
  }

  let homePresenceUnsub = null;
  let nowInterval = null;
  function attachHomePresence() {
    if (GH) return;
    detachHomePresence();
    Community.ensureSocket();
    homePresenceUnsub = Community.on('presence', (snap) => setNowPraying(snap));
    const poll = () => Community.presence().then(setNowPraying).catch(() => {});
    poll();
    nowInterval = setInterval(poll, 20000);
  }
  function detachHomePresence() {
    if (homePresenceUnsub) homePresenceUnsub();
    homePresenceUnsub = null;
    clearInterval(nowInterval);
  }

  /* --------------------------- Avisos breves --------------------------- */
  let toastTimer = null;
  function toast(html) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 9000);
  }

  function onChorevt(ev) {
    if (!ev || ev.date !== new Date().toISOString().slice(0, 10)) return;
    const hx = Liturgy.HOURS.find((x) => x.id === ev.hour);
    const hn = hx ? hx.name : ev.hour;
    if (ev.n && ev.members && ev.n >= ev.members && ev.members >= 2) {
      toast(`&#127881; Habéis rezado <b>${Liturgy.esc(hn)}</b> juntos hoy.`);
    } else if (ev.nick) {
      toast(`&#128327; <b>${Liturgy.esc(ev.nick)}</b> ha rezado <b>${Liturgy.esc(hn)}</b>. Únete para rezar juntos.`);
    }
  }

  /* ------------- “Reza con alguien” dentro de la hora ---------------- */
  let hourOthersUnsub = null;
  function nowOthers() {
    if (GH) return '';
    return `<div class="now-others" id="now-others"></div>`;
  }
  function renderNowOthers() {
    const el = document.querySelector('#now-others');
    if (!el) return;
    const snap = Community.status || {};
    const n = (snap.hours && snap.hours[Community.currentHour]) || 0;
    const hx = Liturgy.HOURS.find((x) => x.id === Community.currentHour);
    if (!n) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = '';
    el.innerHTML = `🤝 <b>${n}</b> ${n === 1 ? 'persona está' : 'personas están'} rezando <b>${Liturgy.esc(hx ? hx.name : 'esta hora')}</b> ahora mismo. <a href="#comunidad">Ver a quién</a>`;
  }
  function attachNowOthers() {
    if (GH) return;
    detachNowOthers();
    Community.ensureSocket();
    hourOthersUnsub = Community.on('presence', renderNowOthers);
    renderNowOthers();
  }
  function detachNowOthers() {
    if (hourOthersUnsub) hourOthersUnsub();
    hourOthersUnsub = null;
  }

  function geoPrompt() {
    if (GH) return '';
    if (localStorage.getItem('liturgia.loc.v1') !== null) return '';
    return `<div class="note-box geo-note">
      <b>Rezamos juntos ahora.</b> Al rezar una hora te unes de forma anónima al “coro invisible”: cuántas personas rezan la misma hora en este momento y, si lo permites, tu posición (sin nombre) aparece en el mapa. Sin rankings ni perfiles.
      <div class="btn-row" style="margin-bottom:0">
        <button class="btn primary" data-geo="y">Compartir posición</button>
        <button class="btn" data-geo="n">Solo contar (sin mapa)</button>
      </div>
    </div>`;
  }

  function attachGeoPrompt() {
    if (GH) return;
    document.querySelectorAll('[data-geo]').forEach((b) => {
      b.addEventListener('click', () => {
        localStorage.setItem('liturgia.loc.v1', b.dataset.geo);
        const note = document.querySelector('.geo-note');
        if (note) note.remove();
      });
    });
  }

  /* -------------- Resultado de intenciones del día anterior -------------- */
  function checkIntentionNews() {
    if (GH) return;
    const last = localStorage.getItem('liturgia.news.v1');
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) return;
    Community.intentions.news().then((r) => {
      localStorage.setItem('liturgia.news.v1', today);
      const wrap = document.querySelector('.day-hero');
      if (!wrap || !r.news || !r.news.length) return;
      wrap.insertAdjacentHTML('afterend',
        r.news.map((n) =>
          `<div class="prayed-banner">&#10084;&#65039; <b>${n.prayed} ${n.prayed === 1 ? 'persona ha' : 'personas han'} rezado</b> por tu intención de ayer: “${Liturgy.esc(n.text)}”</div>`
        ).join(''));
    }).catch(() => {});
  }

  function antFor(d, hourId) {
    const cands = [
      d.primer_salmo_antifona, d.segundo_salmo_antifona, d.cantico_evangelico_antifona,
      d.lectura_biblica_cita, d.oracion_final
    ];
    for (const c of cands) if (c) return String(c).replace(/_/g, '');
    return '';
  }

  function errBox(e) {
    return `<div class="note-box">No se pudo preparar la oración: ${Liturgy.esc(e && e.message ? e.message : e)}.
      Comprueba que la librería breviarium se cargó correctamente.</div>`;
  }

  function recommendedHour() {
    const h = new Date().getHours();
    if (h >= 21 || h < 4) return 'completas';
    if (h < 7) return 'oficio';
    if (h < 10) return 'laudes';
    if (h < 12) return 'tercia';
    if (h < 15) return 'sexta';
    if (h < 18) return 'nona';
    return 'visperas';
  }

  function colorName(c) {
    const map = { GREEN: 'Verde', WHITE: 'Blanco', RED: 'Rojo', PURPLE: 'Morado', ROSE: 'Rosa', BLACK: 'Negro', VIOLET: 'Morado' };
    return map[c] || c;
  }

  function dateNav() {
    return `<div class="date-nav">
      <button data-nav="-1" aria-label="Día anterior">&#8592;</button>
      <input type="date" class="date-val" id="date-input" value="${iso(currentDate)}">
      <button data-nav="1" aria-label="Día siguiente">&#8594;</button>
      <button data-nav="today">Hoy</button>
    </div>`;
  }

  function optionSelect() {
    return `<div class="option-bar hidden" id="option-bar">
      <label for="option-select">Opción del oficio:</label>
      <select id="option-select" class="date-val"></select>
    </div>`;
  }

  /* ----------------------- Auto-scroll de lectura ----------------------- */
  const AS_SPEEDS = [
    { k: 'Lento', v: 18 },
    { k: 'Suave', v: 33 },
    { k: 'Normal', v: 56 },
    { k: 'Rápido', v: 88 }
  ];
  const as = { raf: null, speed: 1, on: false, acc: 0 };

  function asAppend() {
    const existing = document.querySelector('.autoscroll');
    if (existing) existing.remove();
    const saved = parseInt(localStorage.getItem('liturgia.as.v1') || '1', 10);
    if (saved >= 0 && saved < AS_SPEEDS.length) as.speed = saved;
    let html = `<div class="autoscroll" id="autoscroll">
      <button class="as-play" id="as-play" title="Reproducir / pausar">&#9654;</button>
      <div class="as-speeds">`;
    AS_SPEEDS.forEach((s, i) => {
      html += `<button data-as="${i}" class="as-chip${i === as.speed ? ' active' : ''}">${s.k}</button>`;
    });
    html += `</div></div>`;
    const view = document.querySelector('#view');
    if (view) view.insertAdjacentHTML('beforeend', html);
    wireAs();
  }

  function wireAs() {
    const play = document.querySelector('#as-play');
    if (play) play.addEventListener('click', () => asToggle());
    document.querySelectorAll('.as-chip').forEach((c) => {
      c.addEventListener('click', () => {
        as.speed = parseInt(c.dataset.as, 10);
        localStorage.setItem('liturgia.as.v1', String(as.speed));
        document.querySelectorAll('.as-chip').forEach((x) => x.classList.toggle('active', x === c));
        if (as.on) { asStop(); asStart(); }
      });
    });
  }

  function asStart() {
    if (as.on) return;
    as.on = true;
    as.acc = 0;
    const play = document.querySelector('#as-play');
    if (play) play.innerHTML = '&#10074;&#10074;';
    const sp = AS_SPEEDS[as.speed];
    if (typeof requestAnimationFrame === 'undefined') {
      as.timer = setInterval(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY >= max - 4) { asStop(); const p = document.querySelector('#as-play'); if (p) p.innerHTML = '&#10004;'; return; }
        window.scrollBy(0, sp.v);
      }, 700);
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      if (!as.on) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 2) { as.raf = null; asStop(); const p = document.querySelector('#as-play'); if (p) p.innerHTML = '&#10004;'; return; }
      as.acc += sp.v * dt;
      const whole = Math.floor(as.acc);
      if (whole > 0) { window.scrollBy(0, whole); as.acc -= whole; }
      as.raf = requestAnimationFrame(tick);
    };
    as.raf = requestAnimationFrame(tick);
  }

  function asStop() {
    as.on = false;
    if (as.raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(as.raf);
    as.raf = null;
    if (as.timer) { clearInterval(as.timer); as.timer = null; }
    const play = document.querySelector('#as-play');
    if (play) play.innerHTML = '&#9654;';
  }

  function asToggle() { as.on ? asStop() : asStart(); }

  /* ===================== Rezos y santos (al estilo "ePrex") ===================== */

  function topBar(title, sub) {
    return `<div class="prayer-toolbar">
      <button class="icon-btn" onclick="location.hash='#hoy'" aria-label="Volver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </button>
      <div class="tt"><h1>${title}</h1><div class="sub">${sub}</div></div>
    </div>`;
  }

  function santosDelDia(fecha) {
    if (!window.Santos || !Santos.dias) return [];
    const k = iso(fecha);
    if (Santos.dias[k] && Santos.dias[k].length) return Santos.dias[k];
    const mm = k.slice(5);
    for (const otro of Object.keys(Santos.dias)) {
      if (otro.slice(5) === mm) return Santos.dias[otro];
    }
    return [];
  }

  function saintsHtml(fecha) {
    const saints = santosDelDia(fecha);
    if (!saints.length) return '';
    return `<section class="saints-box">
      <div class="saints-line">&#10010; Santo del día: <b>${saints.map((s) => Liturgy.esc(s)).join(' · ')}</b></div>
    </section>`;
  }

  function rezoDelDiaGrid(fecha) {
    const R = Oraciones.ROSARIO;
    const serie = R.serieDelDia(fecha);
    const cards = [
      { href: '#rosario', key: 'rosario_' + serie, icon: '&#128255;', titulo: 'Rosario', sub: 'Misterios ' + R.SERIE_NOMBRE[serie] },
      { href: '#coronilla', key: 'coronilla', icon: '&#128591;', titulo: 'Coronilla de la Divina Misericordia', sub: 'La hora de la misericordia' },
      { href: '#angelus', key: 'angelus', icon: '&#128330;', titulo: 'Ángelus', sub: 'Las 12 de la mañana' },
      { href: '#oraciones', key: null, icon: '&#10024;', titulo: 'Oraciones', sub: 'La oración de cada día' }
    ];
    let html = '<div class="rezo-grid">';
    for (const c of cards) {
      const done = c.key && Store.isPrayed(fecha, c.key);
      html += `<a class="rezo-card${done ? ' done' : ''}" href="${c.href}">
        <div class="rezo-icon">${c.icon}</div>
        <div class="rezo-titulo">${c.titulo}${done ? ' &#10003;' : ''}</div>
        <div class="rezo-sub">${c.sub}</div>
      </a>`;
    }
    return html + '</div>';
  }

  function rezoHtml(lines) {
    return lines.map((line) => {
      const rol = line[0], t = line[1];
      const s = Liturgy.esc(t);
      if (rol === 'V') return `<p><span class="vs">V.</span> ${s}</p>`;
      if (rol === 'R') return `<p><span class="vs">R.</span> ${s}</p>`;
      return `<p>${s}</p>`;
    }).join('\n');
  }

  function doneBarHtml(key, labelDone, labelAction) {
    const done = Store.isPrayed(currentDate, key);
    return `<div class="done-bar">
      <button class="btn ${done ? 'marked' : 'primary'}" id="btn-done">${done ? '&#10003; ' + labelDone : labelAction}</button>
    </div>`;
  }

  function attachDone(key, labelDone, labelAction) {
    const btn = $('#btn-done');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const done = Store.togglePrayed(currentDate, key);
      btn.classList.toggle('marked', done);
      btn.classList.toggle('primary', !done);
      btn.innerHTML = done ? '&#10003; ' + labelDone : labelAction;
    });
  }

  /* ------------------------------ Oraciones ------------------------------ */
  function oracionesView() {
    let html = topBar('Oraciones', fmtDate(currentDate));
    for (let gi = 0; gi < Oraciones.GRUPOS.length; gi++) {
      const items = Oraciones.ORACIONES.filter((o) => o.g === gi);
      if (!items.length) continue;
      html += `<div class="section-title">${Liturgy.esc(Oraciones.GRUPOS[gi])}</div>`;
      html += '<div class="orac-list">';
      for (const o of items) {
        const done = Store.isPrayed(currentDate, 'orac_' + o.id);
        html += `<a class="orac-item${done ? ' done' : ''}" href="#oraciones/${o.id}">
          <div class="orac-titulo">${Liturgy.esc(o.titulo)}${done ? ' &#10003;' : ''}</div>
          <div class="orac-fuente">${Liturgy.esc(o.fuente)}</div>
        </a>`;
      }
      html += '</div>';
    }
    view.innerHTML = html;
  }

  function oracionView(id) {
    const o = Oraciones.getOracion(id);
    if (!o) return oracionesView();
    let html = topBar(o.titulo, (Oraciones.GRUPOS[o.g] || '') + ' · ' + o.fuente);
    html += '<article class="prayer">' + rezoHtml(o.rezo) + '</article>';
    html += doneBarHtml('orac_' + id, 'Rezada', 'Marcar como rezada');
    view.innerHTML = html;
    attachDone('orac_' + id, 'Rezada', 'Marcar como rezada');
  }

  /* ------------------------------ Rosario ------------------------------ */
  function rosarioView() {
    const R = Oraciones.ROSARIO;
    const hoy = R.serieDelDia(currentDate);
    let html = topBar('Santo Rosario', fmtDate(currentDate));
    html += `<div class="note-box">Hoy corresponde rezar los <b>Misterios ${R.SERIE_NOMBRE[hoy]}</b>. Meditamos la vida de Cristo mientras rezamos el Ave María en las cuentas.</div>`;
    html += '<div class="mystery-cards">';
    for (const key of Object.keys(R.MISTERIOS)) {
      const done = Store.isPrayed(currentDate, 'rosario_' + key);
      html += `<a class="mystery-card${key === hoy ? ' hoy' : ''}${done ? ' done' : ''}" href="#rosario/${key}">
        <span class="mystery-chip">${R.SERIE_NOMBRE[key]}</span>
        <ol>${R.MISTERIOS[key].map((x) => '<li>' + Liturgy.esc(x.titulo) + '</li>').join('')}</ol>
        ${done ? '<div class="mystery-done">Rezado hoy &#10003;</div>' : ''}
      </a>`;
    }
    html += '</div>';
    html += `<div class="btn-row"><a class="btn primary" href="#rosario/${hoy}">Rezar los ${R.SERIE_NOMBRE[hoy]}</a></div>`;
    view.innerHTML = html;
  }

  function buildRosFlow(serie) {
    const m = Oraciones.ROSARIO.MISTERIOS[serie];
    const f = [];
    f.push({ t: 'intro' });
    for (const id of ['senal', 'credo', 'padrenuestro', 'avemaria', 'avemaria', 'avemaria', 'gloria']) f.push({ t: 'oracion', id });
    for (const misterio of m) {
      f.push({ t: 'misterio', m: misterio });
      f.push({ t: 'oracion', id: 'padrenuestro' });
      for (let b = 0; b < 10; b++) f.push({ t: 'avemaria', m: misterio, b });
      f.push({ t: 'oracion', id: 'gloria' });
    }
    f.push({ t: 'cierre' });
    f.push({ t: 'oracion', id: 'senal' });
    f.push({ t: 'fin', serie });
    return f;
  }

  let ROS = null;

  function rosarioSerieView(serie) {
    if (!Oraciones.ROSARIO.MISTERIOS[serie]) return rosarioView();
    ROS = { serie, i: 0, flow: buildRosFlow(serie) };
    renderRosStep();
  }

  function renderRosStep() {
    const serieName = Oraciones.ROSARIO.SERIE_NOMBRE[ROS.serie];
    const step = ROS.flow[ROS.i];
    const total = ROS.flow.length;
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);

    let html = topBar('Rosario · ' + serieName, (ROS.i + 1) + ' de ' + total);
    html += '<article class="prayer rosario">';

    if (step.t === 'intro') {
      html += `<div class="ros-intro">
        <h2>Misterios ${serieName}</h2>
        <p>Nos preparamos con la señal de la cruz, el Credo y las tres primeras cuentas del Ave María.</p>
      </div>`;
    } else if (step.t === 'misterio') {
      html += `<div class="mystery-step">
        <div class="rubric">${step.m.n}º misterio ${serieName.toLowerCase()}</div>
        <h2 class="mystery-title">${Liturgy.esc(step.m.titulo)}</h2>
        <div class="mystery-fruto">Fruto del misterio: <b>${Liturgy.esc(step.m.fruto)}</b></div>
      </div>`;
    } else if (step.t === 'avemaria') {
      html += '<div class="beads">' + renderBeads(step.b) + '</div>';
      html += `<div class="rubric">Avemaría ${step.b + 1} · ${step.m.n}º misterio ${serieName.toLowerCase()}</div>`;
      html += rezoHtml(Oraciones.getOracion('avemaria').rezo);
    } else if (step.t === 'oracion') {
      html += rezoHtml(Oraciones.getOracion(step.id).rezo);
    } else if (step.t === 'cierre') {
      html += '<div class="rubric">Conclusión</div>';
      html += rezoHtml(Oraciones.getOracion('salve').rezo);
      html += '<p>' + Liturgy.esc('Oh Dios, cuyo Hijo Unigénito, con su vida, muerte y resurrección, nos procuró los premios de la salvación eterna: concédenos, te pedimos, que, meditando estos misterios del santísimo Rosario de la bienaventurada Virgen María, imitemos lo que contienen y obtengamos lo que prometen. Por Cristo nuestro Señor. Amén.') + '</p>';
    } else if (step.t === 'fin') {
      html += `<div class="ros-done">
        <h2>Rosario terminado</h2>
        <p>Misterios ${serieName} rezados. Sigue en paz.</p>
      </div>`;
    }
    html += '</article>';

    html += '<div class="btn-row ros-nav">';
    html += `<button class="btn" id="ros-prev"${ROS.i === 0 ? ' disabled' : ''}>Anterior</button>`;
    html += `<button class="btn primary" id="ros-next">${step.t === 'fin' ? 'Terminar' : 'Siguiente'}</button>`;
    html += '</div>';

    view.innerHTML = html;

    const prev = $('#ros-prev');
    if (prev) prev.addEventListener('click', () => { ROS.i = Math.max(0, ROS.i - 1); renderRosStep(); });
    const next = $('#ros-next');
    if (next) {
      next.addEventListener('click', () => {
        if (step.t === 'fin') {
          Store.togglePrayed(currentDate, 'rosario_' + ROS.serie);
          location.hash = '#rosario';
          return;
        }
        ROS.i = Math.min(total - 1, ROS.i + 1);
        renderRosStep();
      });
    }
  }

  function renderBeads(current) {
    let h = '';
    for (let i = 0; i < 10; i++) {
      h += `<span class="bead${i === current ? ' active' : (i < current ? ' done' : '')}"></span>`;
    }
    return h;
  }

  /* --------------------- Coronilla de la Divina Misericordia --------------------- */
  function coronillaView() {
    const C = Oraciones.CORONILLA;
    let html = topBar('Coronilla de la Divina Misericordia', fmtDate(currentDate));
    html += '<article class="prayer">';
    html += '<div class="rubric">Apertura</div>';
    html += rezoHtml(C.apertura);
    html += '<div class="rubric">Cuenta grande · Padre Eterno</div>';
    html += '<p>' + Liturgy.esc(C.grande) + '</p>';
    html += '<div class="rubric">Cuentas pequeñas · Por su dolorosa Pasión</div>';
    html += '<p>' + Liturgy.esc(C.pequeña) + ' <i>(repetir diez veces)</i></p>';
    html += '<div class="rubric">Conclusión · Santo Dios</div>';
    html += '<p>' + Liturgy.esc(C.santoDios) + ' <i>(repetir tres veces)</i></p>';
    html += rezoHtml(C.cierre);
    html += '</article>';
    html += doneBarHtml('coronilla', 'Coronilla rezada', 'Marcar como rezada');
    view.innerHTML = html;
    attachDone('coronilla', 'Coronilla rezada', 'Marcar como rezada');
  }

  /* ------------------------------ Ángelus ------------------------------ */
  async function angelusView() {
    showLoading(true);
    try {
      const info = await Liturgy.ensure().getLiturgyInformation(currentDate);
      const easter = (info.seasons || []).includes('EASTER_TIME');
      const key = easter ? 'regina' : 'angelus';
      const titulo = easter ? 'Regina Caeli' : 'Ángelus';
      let html = topBar(titulo, fmtDate(currentDate) + (easter ? ' · Tiempo de Pascua' : ''));
      html += '<article class="prayer">' + rezoHtml(Oraciones.ANGELUS[key]) + '</article>';
      html += doneBarHtml('angelus', titulo + ' rezado', 'Marcar como rezado');
      view.innerHTML = html;
      attachDone('angelus', titulo + ' rezado', 'Marcar como rezado');
    } catch (e) {
      view.innerHTML = errBox(e);
    }
    showLoading(false);
  }

  /* ------------------------------ Hora ------------------------------- */
  async function hourView(hourId) {
    const hx = Liturgy.HOURS.find((h) => h.id === hourId);
    if (!hx) return homeView();

    showLoading(true);
    try {
      const data = await Liturgy.load(currentDate, hourId);
      const opts = Liturgy.optionsFor(data, hourId);
      if (!opts.length) { view.innerHTML = '<div class="note-box">No hay datos para esta hora en esta fecha.</div>'; showLoading(false); return; }

      buildHourHtml(hourId, hx, opts, 0);
      if (!GH) Community.joinHour(hourId);
    } catch (e) {
      view.innerHTML = errBox(e);
    }
    showLoading(false);
  }

  function buildHourHtml(hourId, hx, opts, idx) {
    const opt = opts[Math.min(idx, opts.length - 1)];
    const done = Store.isPrayed(currentDate, hourId);
    const optsHtml = opts.length > 1
      ? `<div class="btn-row option-bar-2">
           <span>Opción:</span>
           <div class="seg">${opts.map((o, i) => `<button data-opt="${i}" class="${i === idx ? 'active' : ''}">${Liturgy.esc(o.id.split('_')[0])}</button>`).join('')}</div>
         </div>`
      : '';

    let html = `<div class="prayer-toolbar">
      <button class="icon-btn" onclick="location.hash='#hoy'" aria-label="Volver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </button>
      <div class="tt">
        <h1>${hx.name}</h1>
        <div class="sub">${fmtDate(currentDate)}</div>
      </div>
      <button class="icon-btn" onclick="location.hash='#ajustes'" aria-label="Ajustes">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.3 2.9h4l.3-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"/></svg>
      </button>
    </div>`;

    html += optsHtml;

    html += Liturgy.render(hourId, opt, null);

    html += `<div class="done-bar">
      <button class="btn ${done ? 'marked' : 'primary'}" id="btn-done">${done ? '&#10003; Hora rezada' : 'Marcar como rezada'}</button>
    </div>`;

    html += `<div id="intentions-slot"></div>`;
    if (!GH) html += nowOthers();

    view.innerHTML = html;

    asAppend();
    attachFavStars();
    if (!GH) loadIntentions(intoSlot('#intentions-slot'));
    if (!GH) attachNowOthers();

    const btnDone = $('#btn-done');
    if (btnDone) {
      btnDone.addEventListener('click', () => {
        const newState = Store.togglePrayed(currentDate, hourId);
        btnDone.classList.toggle('marked', newState);
        btnDone.classList.toggle('primary', !newState);
        btnDone.innerHTML = newState ? '&#10003; Hora rezada' : 'Marcar como rezada';
        if (newState && !GH) {
          const snap = Community.status || {};
          const n = (snap.hours && snap.hours[hourId]) || 0;
          if (n >= 2) toast(`&#127881; Hoy <b>${n}</b> personas hemos rezado <b>${hx.name}</b> juntos.`);
        }
      });
    }

    document.querySelectorAll('.option-bar-2 [data-opt]').forEach((b) => {
      b.addEventListener('click', () => buildHourHtml(hourId, hx, opts, parseInt(b.dataset.opt, 10)));
    });
  }

  /* ------------------------ Misal y Lecturas del día ------------------------ */
  function lectionSetFor(lect, info) {
    if (!lect || !lect.length) return [];
    if (lect.length === 1) return lect;
    const cyc = { A: 'YEAR_A', B: 'YEAR_B', C: 'YEAR_C' };
    if (info && info.cycle && cyc[info.cycle]) {
      const byYear = lect.find((s) => s.cycle === cyc[info.cycle]);
      if (byYear) return [byYear];
    }
    if (info && info.calendar && info.calendar.endOfLiturgycalSeason) {
      const even = Number(info.calendar.endOfLiturgycalSeason.split('-')[0]) % 2 === 0;
      const want = even ? 'EVEN' : 'ODD';
      const byPar = lect.find((s) => s.cycle === want);
      if (byPar) return [byPar];
    }
    const anyOrMem = lect.find((s) => String(s.cycle).toUpperCase() === 'ANY') ||
      lect.find((s) => String(s.cycle).toUpperCase() === 'MEMORY');
    return anyOrMem ? [anyOrMem] : [lect[0]];
  }

  async function misalView() {
    showLoading(true);
    try {
      const info = await Liturgy.ensure().getLiturgyInformation(currentDate);
      const lect = await Liturgy.ensure().getLectures(currentDate);
      const typeName = {
        FIRSTLECTURE: 'Primera lectura',
        SECONDREADING: 'Segunda lectura',
        PSALM: 'Salmo responsorial',
        GOSPEL: 'Evangelio',
        COMMENT: 'Nota'
      };
      let html = `<section class="day-hero misal-hero">
        <div class="now-label">Misa del día</div>
        <h1>${Liturgy.esc(info.celebration || 'Celebración')}</h1>
        <div class="date-line">${fmtDate(currentDate)}</div>
      </section>`;
      html += `<div class="btn-row"><a class="btn" href="#hoy">&#8592; Hoy</a></div>`;
      const sets = lectionSetFor(lect, info);
      if (!sets.length) {
        html += '<div class="note-box">No hay lecturas para esta fecha.</div>';
      } else {
        for (const set of sets) {
          if (!set || !set.lecturas) continue;
          for (const r of set.lecturas) {
            const label = typeName[r.type] || r.type;
            html += `<div class="card">
              <div class="rubric">${Liturgy.esc(label)}</div>
              <div class="ref">${Liturgy.esc(r.ref || '')}</div>
              <div class="text">${Liturgy.text(r.texto || '')}</div>
            </div>`;
          }
        }
      }
      html += `<details class="card misal-order">
        <summary>La Misa, paso a paso</summary>
        <ol class="misal-steps">
          <li><b>Ritos iniciales</b> — canto de entrada, saludo, acto penitencial, Gloria y oración colecta.</li>
          <li><b>Liturgia de la Palabra</b> — primera lectura, salmo responsorial, segunda lectura, aleluya, Evangelio y homilía.</li>
          <li><b>Liturgia Eucarística</b> — ofrendas, prefacio, Santo, plegaria eucarística, comunión.</li>
          <li><b>Rito de despedida</b> — bendición y envío.</li>
        </ol>
        <p class="comm-sub">Las oraciones propias (colecta, ofrendas y poscomunión) se recitan en la celebración; aquí se recogen las lecturas que proclama la Misa del día.</p>
      </details>`;
      view.innerHTML = html;
      asAppend();
    } catch (e) {
      view.innerHTML = errBox(e);
    }
    showLoading(false);
  }

  /* ---------------------- La Liturgia Ortodoxa (Oficio Divino) ---------------------- */
  function ortodoxoRender(o) {
    let h = '';
    for (const sec of o.secciones || []) {
      if (sec.r) h += `<div class="rubric">${Liturgy.esc(sec.r)}</div>`;
      for (const bl of sec.b || []) {
        if (!bl || !bl.t) continue;
        if (bl.t === 't') h += Liturgy.text(bl.txt || '');
        else if (bl.t === 'p') {
          let pb = `<div class="psalm-block"><div class="psalm-ref">${Liturgy.esc(bl.ref || '')}</div>`;
          pb += Liturgy.text(bl.txt || '');
          pb += '</div>';
          h += pb;
        } else if (bl.t === 'vr') {
          if (bl.v) h += `<p class="vresp"><span class="vs">V.</span> ${Liturgy.esc(bl.v)}</p>`;
          if (bl.r) h += `<p class="vresp"><span class="vs">R.</span> ${Liturgy.esc(bl.r)}</p>`;
        } else if (bl.t === 'gl') {
          h += `<div class="gloria">Gloria al Padre, y al Hijo, y al Espíritu Santo, ahora y siempre y por los siglos de los siglos. Amén.</div>`;
        } else if (bl.t === 'nt') {
          h += `<div class="note-box">${Liturgy.esc(bl.txt || '')}</div>`;
        } else if (bl.t === 'o') {
          h += `<div class="orth-oracion">${Liturgy.text(bl.txt || '')}</div>`;
        }
      }
    }
    return h;
  }

  function ortodoxaView() {
    const oficios = (window.Ortodoxo && Ortodoxo.OFICIOS) || [];
    let html = `<section class="day-hero misal-hero">
      <div class="now-label">Tercera opción</div>
      <h1>La Liturgia Ortodoxa</h1>
      <div class="date-line">el Oficio Divino · las Horas Canónicas</div>
    </section>`;
    html += `<div class="btn-row"><a class="btn" href="#hoy">&#8592; Hoy</a></div>`;
    html += `<div class="card">
      <p class="text">En la tradición bizantina, la oración de las horas se llama el <b>Oficio Divino</b> o las <b>Horas Canónicas</b> (el <b>Horologion</b>). Reza aquí los servicios fijos del día, en español; las piezas variables —troparia, kathismata, cánones, prokímena y lecturas— siguen el ciclo del Octoecos, el Mineo, el Triodion y el Pentecostario.</p>
    </div>`;
    if (oficios.length) {
      html += `<div class="section-title">Servicios del día</div>`;
      for (const o of oficios) {
        const done = Store.isPrayed(currentDate, 'ort_' + o.id);
        html += `<a class="hour-card${done ? ' recommended' : ''}" href="#ortodoxa/oficio/${encodeURIComponent(o.id)}">
          <div class="hour-card-head">
            <span class="hour-name">${Liturgy.esc(o.titulo)}</span>
            ${done ? '<span class="hour-check done">&#10003;</span>' : ''}
          </div>
          <div class="hour-card-body"><div class="hour-ant">${Liturgy.esc(o.sub)}</div></div>
        </a>`;
      }
    }
    html += `<div class="section-title">Salterio en kathismas</div>`;
    html += `<a class="hour-card recommended" href="#ortodoxa/salterio">
      <div class="hour-card-head">
        <span class="hour-name">Salterio · los 150 salmos</span>
        <span class="hour-check">&#9783;</span>
      </div>
      <div class="hour-card-body"><div class="hour-ant">Los 20 kathismata, repartidos por la semana · numeración de la Septuaginta</div></div>
    </a>`;
    html += `<details class="card">
      <summary>El ciclo y los libros</summary>
      <div class="text">
        <b>Vísperas</b> (esperino) — anochecer.<br>
        <b>Completas</b> (apódipno) — antes de dormir.<br>
        <b>Oficio de Medianoche</b> — en vela, esperando al Esposo.<br>
        <b>Maitines</b> (Orthros) — alabanza del amanecer.<br>
        <b>Horas Tercera, Sexta y Nona</b> — a lo largo del día, unidas a la memoria de la Pasión.<br><br>
        Los 150 salmos se rezan completos cada semana en <b>kathismata</b>; el día oscila entre los ocho tonos del <b>Octoecos</b>, y las fiestas siguen el <b>Mineo Festivo</b> (con el <b>Triodio</b> cuaresmal y el <b>Pentecostario</b> en sus estaciones).
      </div>
    </details>`;
    html += `<div class="card">
      <div class="rubric">Textos de la Diócesis de México (OCA)</div>
      <p class="comm-sub">Servicios litúrgicos completos, Vísperas Mayores, Mineo Festivo, Triodio, Octoecos, Pentecostario y el Libro de las Horas.</p>
      <div class="btn-row" style="margin-bottom:0">
        <a class="btn primary" href="https://ocamexico.org/liturgicos.html" target="_blank" rel="noopener">Ver textos litúrgicos</a>
      </div>
    </div>`;
    view.innerHTML = html;
  }

  function ortodoxoOficioView(rawId) {
    const id = decodeURIComponent(String(rawId || ''));
    const o = (window.Ortodoxo && Ortodoxo.getOficio(id)) || null;
    if (!o) { view.innerHTML = errBox(new Error('No se encontró ese servicio.')); return; }
    const doneId = 'ort_' + id;
    const done = Store.isPrayed(currentDate, doneId);
    let html = `<div class="prayer-toolbar">
      <button class="icon-btn" onclick="location.hash='#ortodoxa'" aria-label="Volver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </button>
      <div class="tt"><h1>${Liturgy.esc(o.titulo)}</h1><div class="sub">${fmtDate(currentDate)} · Oficio Divino</div></div>
    </div>`;
    html += ortodoxoRender(o);
    html += `<div class="done-bar">
      <button class="btn ${done ? 'marked' : 'primary'}" id="btn-done-o">${done ? '&#10003; Oficio rezado' : 'Marcar como rezado'}</button>
    </div>`;
    view.innerHTML = html;
    asAppend();
    const btn = view.querySelector('#btn-done-o');
    if (btn) btn.addEventListener('click', () => {
      const ns = Store.togglePrayed(currentDate, doneId);
      btn.classList.toggle('marked', ns);
      btn.classList.toggle('primary', !ns);
      btn.innerHTML = ns ? '&#10003; Oficio rezado' : 'Marcar como rezado';
      if (ns) toast('Oficio completado. <b>Oremus.</b>');
    });
  }

  /* ------------------ Salterio en kathismas (rito ortodoxo) ------------------ */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function varianteSalterio() {
    const s = Store.get().salterio || {};
    return s.variante === 'la' ? 'la' : 'es';
  }

  function salterioPsalmHtml(n, sh) {
    const trozos = (window.Salterio && Salterio.PSALMOS[n]) || null;
    if (!trozos) {
      return `<div class="psalm-block rub-box">
        <div class="psalm-ref">Salmo ${n}</div>
        <p class="comm-sub">El salterio litúrgico en español no incluye este salmo en su ciclo semanal. Puedes rezar el texto de tu propia edición importándolo en <a href="#biblia">#biblia</a>.</p>
      </div>`;
    }
    let h = `<div class="psalm-block psalm-k">`;
    const muchos = trozos.length > 1;
    for (const tr of trozos) {
      if (muchos && tr.r) h += `<div class="psalm-stanzer">${Liturgy.esc(sh)}, ${Liturgy.esc(tr.r)}</div>`;
      h += Liturgy.text(tr.t);
      h += '<div class="k-gloria">' + Liturgy.gloria() + '</div>';
    }
    h += '</div>';
    return h;
  }

  function kathismaView(n) {
    n = parseInt(n, 10);
    const k = (window.Salterio && Salterio.kathisma(n)) || null;
    if (!k) { view.innerHTML = errBox(new Error('No existe ese Kathisma.')); return; }
    const doneId = 'ort_kath_' + n;
    const done = Store.isPrayed(currentDate, doneId);
    const salmos = (window.Salterio && Salterio.rango(n)) || [];
    let html = `<div class="prayer-toolbar">
      <button class="icon-btn" onclick="location.hash='#ortodoxa/salterio'" aria-label="Volver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </button>
      <div class="tt"><h1>Kathisma ${k.n}</h1><div class="sub">${fmtDate(currentDate)} · Salmos ${k.rng}</div></div>
    </div>`;
    html += `<div class="card"><p class="comm-sub">El <b>kathisma</b> es la división del Salterio que se reza en el Oficio Divino. Numeración según la <b>Septuaginta</b>, la misma del salterio litúrgico en español. Tras cada salmo: <b>Gloria al Padre…</b> y tres <b>avemarías</b> según la costumbre.</p></div>`;
    for (const s of salmos) {
      html += `<div class="section-title psalm-title-h">Salmo ${s.lxx}</div>`;
      html += salterioPsalmHtml(s.lxx, 'Salmo ' + s.lxx);
    }
    html += `<div class="done-bar">
      <button class="btn ${done ? 'marked' : 'primary'}" id="btn-done-kath">${done ? '&#10003; Kathisma rezado' : 'Marcar como rezado'}</button>
    </div>`;
    view.innerHTML = html;
    asAppend();
    const btn = view.querySelector('#btn-done-kath');
    if (btn) btn.addEventListener('click', () => {
      const ns = Store.togglePrayed(currentDate, doneId);
      btn.classList.toggle('marked', ns);
      btn.classList.toggle('primary', !ns);
      btn.innerHTML = ns ? '&#10003; Kathisma rezado' : 'Marcar como rezado';
      if (ns) toast('Kathisma ${n} completado. <b>Oremus.</b>');
    });
  }

  function salterioView() {
    let html = `<section class="day-hero misal-hero">
      <div class="now-label">Oficio Divino</div>
      <h1>Salterio en kathismas</h1>
      <div class="date-line">los 150 salmos, repartidos por la semana</div>
    </section>`;
    html += `<div class="btn-row"><a class="btn" href="#ortodoxa">&#8592; Rito ortodoxo</a></div>`;
    const v = varianteSalterio();
    html += `<div class="card">
      <div class="rubric">Variante de español</div>
      <div class="btn-row seg">
        <button class="btn${v === 'es' ? ' active' : ''}" data-v="es">España</button>
        <button class="btn${v === 'la' ? ' active' : ''}" data-v="la">Latinoamérica</button>
      </div>
      <p class="comm-sub" id="variante-nota">${v === 'la' ? 'Esta edición usa los mismos textos salmodiales aprobados que en España, compartidos por la mayoría de las diócesis de Latinoamérica; puedes complementarlo con la edición de tu país importando tu Biblia.' : 'Salterio de la Liturgia de las Horas en español (edición litúrgica). Con la opción Latinoamérica se conserva la variante propia de esa región.'}</p>
    </div>`;
    const hoyJS = new Date().getDay();
    html += `<div class="section-title">Esta semana</div>`;
    html += `<div class="card">`;
    for (let d = 0; d < 7; d++) {
      const plan = Salterio.SEMANA[d] || { maitines: [], visperas: [] };
      const hoy = d === hoyJS;
      html += `<div class="kath-dia${hoy ? ' hoy' : ''}">
        <div class="kath-dia-nom">${DIAS[d]}${hoy ? ' · hoy' : ''}</div>
        <div class="kath-dia-li">
          ${plan.maitines.map(m => `<a href="#ortodoxa/kathisma/${m}">Kathisma ${m}</a>`).join('<span class="comm-sub"> · </span>')}
          ${plan.visperas && plan.visperas.length ? `<span class="comm-sub"> · vísperas: </span>` + plan.visperas.map(m => `<a href="#ortodoxa/kathisma/${m}">Kathisma ${m}</a>`).join('<span class="comm-sub"> · </span>') : ''}
        </div>
      </div>`;
    }
    html += `<p class="comm-sub">El sábado por la tarde, en la Vigilia, se reza el Kathisma I. Reparto semanal habitual según el Typikon (Maitines: dos kathismata; Vísperas: uno).</p>`;
    html += `</div>`;
    html += `<div class="section-title">Los veinte kathismas</div>`;
    html += `<div class="kath-grid">`;
    for (const k of Salterio.KATHISMATA) {
      const done = Store.isPrayed(currentDate, 'ort_kath_' + k.n);
      html += `<a class="kath-cell${done ? ' done' : ''}" href="#ortodoxa/kathisma/${k.n}">
        <div class="kath-num">${k.n}<span class="kath-rom">${k.nom}</span></div>
        <div class="kath-rng">Salmos ${k.rng}</div>
        ${done ? '<div class="kath-ok">&#10003;</div>' : ''}
      </a>`;
    }
    html += `</div>`;
    view.innerHTML = html;
    view.querySelectorAll('[data-v]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.v;
        Store.set({ salterio: { ...(Store.get().salterio || {}), variante: v } });
        salterioView();
        toast(v === 'la' ? 'Salterio en variante <b>Latinoamérica</b>.' : 'Salterio en variante <b>España</b>.');
      });
    });
  }

  /* ----------------- Mis salmos y rezos personalizados ----------------- */
  function attachFavStars() {
    try {
      const blocks = view.querySelectorAll('.psalm-block');
      if (!blocks || !blocks.length) return;
      blocks.forEach((blk) => {
        const refEl = blk.querySelector('.psalm-ref');
        if (!refEl) return;
        const ref = (refEl.textContent || '').trim();
        if (!ref) return;
        const id = Favs.idFor(ref);
        const antEl = blk.querySelector('.ant');
        const textEl = blk.querySelector('.text');
        const ant = antEl ? (antEl.textContent || '').trim() : '';
        const texto = textEl ? (textEl.textContent || '').trim() : '';
        if (!texto) return;
        const star = document.createElement('button');
        const on = Favs.has(id);
        star.className = 'fav-s' + (on ? ' on' : '');
        star.setAttribute('aria-label', on ? 'Quitar este salmo de Mis salmos' : 'Guardar este salmo en Mis salmos');
        star.innerHTML = on ? '&#9733;' : '&#9734;';
        star.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation();
          const added = Favs.toggle(ref, { ant, texto });
          star.classList.toggle('on', added);
          star.setAttribute('aria-label', added ? 'Quitar este salmo de Mis salmos' : 'Guardar este salmo en Mis salmos');
          star.innerHTML = added ? '&#9733;' : '&#9734;';
          toast(added ? 'Salmo guardado en <b>Mis salmos</b>.' : 'Salmo quitado de Mis salmos.');
        });
        refEl.appendChild(star);
      });
    } catch (e) { /* DOM muy sencillo en pruebas: los favoritos se omiten */ }
  }

  function personalView() {
    const favs = Favs.list();
    const custs = Favs.customsList();
    let html = `<section class="day-hero misal-hero">
      <div class="now-label">Tus oraciones</div>
      <h1>Mis salmos y rezos</h1>
      <div class="date-line">guarda los salmos que te acompañan y constrúyete tus propias horas</div>
    </section>`;
    html += `<div class="btn-row"><a class="btn" href="#hoy">&#8592; Hoy</a></div>`;

    html += `<div class="section-title">Salmos favoritos (${favs.length})</div>`;
    if (!favs.length) {
      html += `<div class="note-box">Todavía no tienes salmos guardados. Mientras rezas una hora, toca la estrella <span class="fav-s-inline">&#9734;</span> junto a un salmo y aparecerá aquí.</div>`;
    } else {
      for (const f of favs) {
        html += `<div class="card" id="fav-${Liturgy.esc(f.id)}">
          <div class="psalm-ref">${Liturgy.esc(f.ref)}
            <button class="fav-s on" data-fav-del="${Liturgy.esc(f.id)}" aria-label="Quitar de Mis salmos">&#9733;</button>
          </div>
          ${f.ant ? `<div class="ant">${Liturgy.esc(f.ant)}</div>` : ''}
          ${Liturgy.text(f.texto)}
        </div>`;
      }
      html += `<div class="btn-row"><button class="btn primary" id="fav-rezar">Rezar con ellos ahora</button></div>`;
    }

    html += `<div class="section-title">Rezos personalizados</div>`;
    html += `<details class="card" id="personal-builder">
      <summary>+ Crear un rezo personalizado</summary>
      <label class="field-label" for="personal-titulo">Nombre</label>
      <input id="personal-titulo" class="input" type="text" placeholder="p. ej. Mi Vísperas de los martes">
      ${pickHtml()}
      <div class="btn-row"><button class="btn primary" id="personal-guardar">Guardar rezo</button></div>
    </details>`;

    if (!custs.length) {
      html += `<div class="note-box">Tus rezos personalizados aparecerán aquí: elige salmos favoritos y oraciones para componer tu propio rezo.</div>`;
    } else {
      for (const c of custs) {
        const n = (c.items || []).length;
        html += `<div class="card">
          <div class="rubric">Rezo personalizado</div>
          <div class="personal-title">${Liturgy.esc(c.titulo)} <span class="comm-sub">· ${n} ${n === 1 ? 'pieza' : 'piezas'}</span></div>
          <div class="btn-row" style="margin-bottom:0">
            <a class="btn primary" href="#personal/pray/${encodeURIComponent(c.id)}">Rezar</a>
            <button class="btn" data-cust-del="${Liturgy.esc(c.id)}">Eliminar</button>
          </div>
        </div>`;
      }
    }

    view.innerHTML = html;
    asAppend();
    attachPersonal();
  }

  function pickHtml() {
    const favs = Favs.list();
    const lat = (window.LatinaRezado && LatinaRezado.oraciones) || [];
    let h = '<div class="section-sub">Piezas (marca las que quieras incluir)</div>';
    if (!favs.length) {
      h += `<div class="note-box">Primero guarda algún salmo como favorito para poder añadirlo aquí.</div>`;
    } else {
      h += '<div class="personal-pick-group"><div class="rubric">Salmos favoritos</div>';
      for (const f of favs) {
        h += `<label class="pick"><input type="checkbox" name="pick" value="fav:${encodeURIComponent(f.id)}" checked> ${Liturgy.esc(f.ref)}</label>`;
      }
      h += '</div>';
    }
    if (lat.length) {
      h += '<div class="personal-pick-group"><div class="rubric">Oraciones en latín (con su traducción)</div>';
      for (const o of lat) {
        h += `<label class="pick"><input type="checkbox" name="pick" value="latin:${encodeURIComponent(o.id)}"> ${Liturgy.esc(o.titulo)}</label>`;
      }
      h += '</div>';
    }
    return h;
  }

  function attachPersonal() {
    const delFav = view.querySelectorAll('[data-fav-del]');
    delFav.forEach((b) => b.addEventListener('click', () => {
      Favs.remove(b.dataset.favDel);
      const card = view.querySelector('#fav-' + b.dataset.favDel);
      if (card) card.remove();
      toast('Salmo quitado de Mis salmos.');
      personalView();
    }));

    const rezar = view.querySelector('#fav-rezar');
    if (rezar) rezar.addEventListener('click', () => {
      if (!Favs.list().length) return toast('No hay salmos guardados todavía.');
      location.hash = '#personal/pray/favoritos';
    });

    const guardar = view.querySelector('#personal-guardar');
    if (guardar) guardar.addEventListener('click', () => {
      const titulo = (view.querySelector('#personal-titulo') || {}).value || '';
      const items = Array.from(view.querySelectorAll('input[name="pick"]:checked')).map((cb) => {
        const [tipo, id] = String(cb.value || '').split(':');
        return { tipo, id: decodeURIComponent(id) };
      }).filter((it) => it.id);
      if (!items.length) return toast('Marca al menos una pieza para tu rezo.');
      const id = Favs.saveCustom(titulo, items);
      toast('Rezo personalizado creado.');
      location.hash = '#personal/pray/' + encodeURIComponent(id);
    });

    const delCust = view.querySelectorAll('[data-cust-del]');
    delCust.forEach((b) => b.addEventListener('click', () => {
      Favs.deleteCustom(b.dataset.custDel);
      toast('Rezo eliminado.');
      personalView();
    }));
  }

  function piezaHtml(it) {
    if (it.tipo === 'latin') {
      const o = ((window.LatinaRezado || {}).oracionById || (() => null)).call(window.LatinaRezado, it.id);
      if (!o) return '';
      let h = `<div class="psalm-block lat-block"><div class="psalm-ref">${Liturgy.esc(o.titulo)}${o.fuente ? ' <span class="comm-sub">· ' + Liturgy.esc(o.fuente) + '</span>' : ''}</div>`;
      for (const [la, es] of o.versos) {
        h += `<div class="lat-row"><span class="lat-la">${Liturgy.esc(la)}</span><span class="lat-es">${Liturgy.esc(es)}</span></div>`;
      }
      h += '</div>';
      return h;
    }
    const f = Favs.get(it.id);
    if (!f) return '';
    let h = `<div class="psalm-block"><div class="psalm-ref">${Liturgy.esc(f.ref)}</div>`;
    if (f.ant) h += `<div class="ant">${Liturgy.esc(f.ant)}</div>`;
    h += Liturgy.text(f.texto);
    h += '</div>';
    return h;
  }

  function personalPrayView(rawId) {
    const id = decodeURIComponent(String(rawId || ''));
    let titulo, items;
    if (id === 'favoritos') {
      titulo = 'Mis salmos';
      items = Favs.list().map((f) => ({ tipo: 'fav', id: f.id }));
    } else {
      const c = Favs.getCustom(id);
      if (!c) {
        view.innerHTML = errBox(new Error('No existe ese rezo personalizado.'));
        return;
      }
      titulo = c.titulo;
      items = c.items || [];
    }
    if (!items.length) {
      view.innerHTML = errBox(new Error('Este rezo no tiene piezas todavía.'));
      return;
    }
    const doneId = 'personal_' + id;
    const done = Store.isPrayed(currentDate, doneId);
    let html = `<div class="prayer-toolbar">
      <button class="icon-btn" onclick="location.hash='#personal'" aria-label="Volver">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </button>
      <div class="tt"><h1>${Liturgy.esc(titulo)}</h1><div class="sub">${fmtDate(currentDate)} · rezo personalizado</div></div>
    </div>`;
    html += `<div class="rubric">Salmodia</div>`;
    for (const it of items) html += piezaHtml(it);
    html += `<div class="done-bar">
      <button class="btn ${done ? 'marked' : 'primary'}" id="btn-done-p">${done ? '&#10003; Rezado' : 'Marcar como rezado'}</button>
    </div>`;
    view.innerHTML = html;
    asAppend();
    const btn = view.querySelector('#btn-done-p');
    if (btn) btn.addEventListener('click', () => {
      const ns = Store.togglePrayed(currentDate, doneId);
      btn.classList.toggle('marked', ns);
      btn.classList.toggle('primary', !ns);
      btn.innerHTML = ns ? '&#10003; Rezado' : 'Marcar como rezado';
      if (ns) toast('Rezado completado. <b>Oremus.</b>');
    });
  }

  /* ---------------------- Rezo en latín (sincronizado) ---------------------- */
  let latinPlaying = null;

  function latinView() {
    const ores = (window.LatinaRezado && LatinaRezado.oraciones) || [];
    const soft = (() => { try { return localStorage.getItem('liturgia.latin.soft') !== 'off'; } catch (e) { return true; } })();
    let html = `<section class="day-hero misal-hero">
      <div class="now-label">Tradición</div>
      <h1>Rezo en latín</h1>
      <div class="date-line">oraciones y cánticos con traducción sincronizada</div>
    </section>`;
    html += `<div class="btn-row"><a class="btn" href="#hoy">&#8592; Hoy</a></div>`;
    html += `<div class="card">
      <p class="text">Las oraciones que la Iglesia ha rezado en latín durante siglos, con el español al lado: cada línea en su idioma, sincronizadas. Puedes escuchar la lectura <b>suave</b> — lenta y pausada — con la voz en latín de tu dispositivo.</p>
      <label class="pick"><input type="checkbox" id="lat-soft" ${soft ? 'checked' : ''}> Pronunciación suave <span class="comm-sub">(lectura lenta y calmada)</span></label>
    </div>`;
    for (const o of ores) {
      html += `<div class="card">
        <div class="lat-head">
          <div class="psalm-ref">${Liturgy.esc(o.titulo)}${o.fuente ? ' <span class="comm-sub">· ' + Liturgy.esc(o.fuente) + '</span>' : ''}</div>
          <button class="lat-play" data-lat-play="${Liturgy.esc(o.id)}" aria-label="Escuchar este rezo en latín">&#9654;</button>
        </div>`;
      for (const [la, es] of o.versos) {
        html += `<div class="lat-row"><span class="lat-la">${Liturgy.esc(la)}</span><span class="lat-es">${Liturgy.esc(es)}</span></div>`;
      }
      html += '</div>';
    }
    html += `<div class="note-box" id="lat-voice-note" style="display:none"></div>`;
    view.innerHTML = html;
    asAppend();
    attachLatin();
  }

  function attachLatin() {
    const soft = view.querySelector('#lat-soft');
    if (soft) soft.addEventListener('change', () => {
      try { localStorage.setItem('liturgia.latin.soft', soft.checked ? 'on' : 'off'); } catch (e) { }
    });
    const note = view.querySelector('#lat-voice-note');
    const supported = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    if (!supported && note) note.style.display = '';
    view.querySelectorAll('[data-lat-play]').forEach((b) => {
      b.addEventListener('click', () => {
        const o = ((window.LatinaRezado || {}).oracionById || (() => null)).call(window.LatinaRezado, b.dataset.latPlay);
        if (!o) return;
        if (!supported) {
          if (note) note.textContent = 'Tu dispositivo no tiene lectura por voz (speechSynthesis).';
          return;
        }
        if (latinPlaying === b) {
          LatinaRezado.detener();
          setPlay(b, true);
          latinPlaying = null;
          return;
        }
        if (latinPlaying) {
          LatinaRezado.detener();
          setPlay(latinPlaying, true);
        }
        const suave = !soft || soft.checked;
        const ok = LatinaRezado.leer(o.versos.map((v) => v[0]).join(' '), { suave });
        if (ok) { setPlay(b, false); latinPlaying = b; }
      });
    });
  }

  function setPlay(btn, play) {
    if (!btn) return;
    btn.innerHTML = play ? '&#9654;' : '&#10074;&#10074;';
    btn.setAttribute('aria-label', play ? 'Escuchar este rezo en latín' : 'Detener la lectura de este rezo');
  }
  function bibliaView() {
    const bible = Store.getBible();
    let html = `<div class="section-title">Biblia</div>`;

    if (bible) {
      const total = bible.books.reduce((n, b) => n + b.chapters.reduce((m, c) => m + (Array.isArray(c) ? c.length : 0), 0), 0);
      html += `<div class="card"><b>${Liturgy.esc(bible.version || 'Biblia importada')}</b>
        &nbsp;·&nbsp; ${bible.books.length} libros, ${total} versículos.
        <div class="btn-row">
          <button class="btn" id="btn-remove-bible">Eliminar texto</button>
        </div></div>`;
      html += `<div class="card">
        <label for="bible-search">Buscar en la Biblia</label><br>
        <input type="search" id="bible-search" class="date-val" style="width:100%;margin-top:8px" placeholder="Escribe una palabra o frase…">
        <div id="bible-results" class="search-results"></div>
      </div>`;
    } else {
      html += `<div class="note-box">
        <b>El texto completo de la Biblia de Jerusalén y de la Biblia de la Conferencia Episcopal Española está protegido por derechos de autor.</b><br><br>
        Puedes cargar el texto de la edición que uses (si tienes el archivo digital con licencia: Biblia de Jerusalén, Sagrada Biblia de la CEE, u otra) y quedará guardado en <em>este dispositivo</em>, disponible sin conexión.<br><br>
        Mientras tanto, la app ya incluye cada día los <a href="#lecturas">salmos y lecturas de la Liturgia de las Horas y de la Misa</a> en la traducción oficial usada por el breviario.
      </div>`;
      html += `<div class="card">
        <b>Importar texto bíblico</b>
        <p style="color:var(--ink-soft);font-size:.9rem">Formato JSON: <code>{ "version": "…", "books": [ { "abbrev": "Gn", "name": "Génesis", "chapters": [ ["versículo", "…"], … ] } ] }</code></p>
        <input type="file" id="bible-file" accept=".json,application/json" style="margin:10px 0">
        <div id="bible-import-msg"></div>
      </div>`;
    }

    for (const g of Biblia.BOOKS) {
      html += `<div class="book-group-title">${g.group}</div><div class="bible-grid">`;
      for (const b of g.books) {
        html += `<a class="book" href="#biblia/libro/${b[0]}">${b[1]}<small>${b[2]} capítulos</small></a>`;
      }
      html += '</div>';
    }

    view.innerHTML = html;

    if (bible) {
      const input = $('#bible-search');
      if (input) {
        input.addEventListener('input', () => {
          const q = input.value.trim();
          const res = $('#bible-results');
          if (q.length < 3) { res.innerHTML = ''; return; }
          const hits = Biblia.search(q);
          if (!hits.length) { res.innerHTML = '<p style="color:var(--ink-faint)">Sin resultados.</p>'; return; }
          res.innerHTML = hits.map((h) =>
            `<p><a href="#biblia/cap/${h.abbrev}/${h.chapter}"><b>${Liturgy.esc(h.name)} ${h.chapter},${h.verse}</b></a> — ${Liturgy.esc(h.text).slice(0, 120)}…</p>`
          ).join('');
        });
      }
      const rm = $('#btn-remove-bible');
      if (rm) rm.addEventListener('click', () => { Store.removeBible(); bibliaView(); });
    } else {
      const file = $('#bible-file');
      if (file) file.addEventListener('change', async () => {
        const m = $('#bible-import-msg');
        if (!file.files[0]) return;
        m.textContent = 'Procesando…';
        const r = await Biblia.importFile(file.files[0]);
        m.textContent = r.ok ? `¡Importado! ${r.books} libros, ${r.verses} versículos.` : 'Error: ' + r.error;
        if (r.ok) m.innerHTML += ' <a href="#biblia">Ver la Biblia</a>';
      });
    }
  }

  function bibliaBookView(abbrev) {
    const book = Biblia.findByAbbrev(abbrev);
    if (!book) return bibliaView();
    const ch = Math.ceil(book.chapters / 3);
    let html = `<div class="section-title">${book.name}</div>`;
    html += `<div class="btn-row"><a class="btn" href="#biblia">&#8592; Libros</a></div>`;
    html += `<div class="chapters">`;
    for (let i = 1; i <= book.chapters; i++) {
      html += `<a href="#biblia/cap/${book.abbrev}/${i}">${i}</a>`;
    }
    html += `</div>`;
    view.innerHTML = html;
  }

  function bibliaChapterView(abbrev, n) {
    const book = Biblia.findByAbbrev(abbrev);
    const verses = Biblia.chapter(abbrev, n);
    if (!book) return bibliaView();

    let html = `<div class="chapter-head">
      <a class="icon-btn" href="#biblia/libro/${book.abbrev}" aria-label="Capítulos">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/></svg>
      </a>
      <h2>${book.name} ${n}</h2>
    </div>
    <div class="btn-row">
      ${n > 1 ? `<a class="btn" href="#biblia/cap/${book.abbrev}/${n - 1}">&#8592; Cap. ${n - 1}</a>` : `<a class="btn" href="#biblia/libro/${book.abbrev}">Capítulos</a>`}
      ${n < book.chapters ? `<a class="btn" href="#biblia/cap/${book.abbrev}/${n + 1}">Cap. ${n + 1} &#8594;</a>` : ''}
    </div>`;

    if (!verses) {
      const hasText = Biblia.hasText();
      if (hasText) html += '<div class="note-box">No hay texto importado para este capítulo.</div>';
      else {
        html += `<div class="bible-empty">
          No hay texto para mostrar.<br><br>
          Si tienes el texto digital de su Biblia (Jerusalén, CEE u otra, con licencia), impórtalo desde la sección <a href="#biblia">Biblia</a> y quedará disponible aquí sin conexión.
        </div>`;
      }
    } else {
      html += '<div class="card">';
      verses.forEach((v, i) => {
        html += `<div class="verse"><span class="verse-num">${i + 1}</span>${Liturgy.esc(v)}</div>`;
      });
      html += '</div>';
    }
    view.innerHTML = html;
    asAppend();
  }

  /* ------------------------------ Ajustes ------------------------------ */
  function settingsView() {
    const s = Store.get();
    const fs = { S: 'Pequeña', M: 'Normal', L: 'Grande' };
    view.innerHTML = `
      <div class="section-title">Ajustes</div>

      <div class="card">
        <div class="setting-row">
          <div><div class="lbl">Tema oscuro</div>
          <div class="desc">Modo lectura nocturna</div></div>
          <label class="switch"><input type="checkbox" id="set-theme" ${s.theme === 'dark' ? 'checked' : ''}><span class="sl"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="lbl">Según el sistema</div>
          <div class="desc">Seguir automáticamente el tema del dispositivo</div></div>
          <label class="switch"><input type="checkbox" id="set-theme-auto" ${s.theme === 'auto' ? 'checked' : ''}><span class="sl"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="lbl">Tamaño del texto</div>
          <div class="desc">Ajusta la lectura</div></div>
          <div class="seg">
            ${Object.entries(fs).map(([k, v]) => `<button data-fs="${k}" class="${s.fontSize === k ? 'active' : ''}">${v}</button>`).join('')}
          </div>
        </div>
        <div class="setting-row">
          <div><div class="lbl">Mostrar lecturas del día</div>
          <div class="desc">Enlace en la portada</div></div>
          <label class="switch"><input type="checkbox" id="set-readings" ${s.showDailyReadings ? 'checked' : ''}><span class="sl"></span></label>
        </div>
      </div>

      <div class="card">
        <div class="lbl" style="font-weight:700">Progreso de hoy</div>
        <div class="desc" style="color:var(--ink-soft);font-family:var(--sans);font-size:.85rem;margin:6px 0 10px">
          ${Store.prayedCount(currentDate)} de ${Liturgy.HOURS.length} horas rezadas hoy.
        </div>
        <div class="btn-row">
          <button class="btn" id="btn-reset-today">Reiniciar progreso de hoy</button>
        </div>
      </div>

      <div class="card">
        <div class="lbl" style="font-weight:700">Biblia</div>
        <div class="desc" style="color:var(--ink-soft);font-family:var(--sans);font-size:.85rem;margin:6px 0 0">
          ${Biblia.hasText() ? 'Texto importado actualmente.' : 'Sin texto importado.'}
          <span class="hr">· Importa desde la sección</span> <a href="#biblia">Biblia</a>.
        </div>
      </div>
    `;

    const theme = $('#set-theme'), themeAuto = $('#set-theme-auto');
    theme.addEventListener('change', () => {
      Store.set({ theme: theme.checked ? 'dark' : 'light', });
      themeAuto.checked = false;
      applySettings();
    });
    themeAuto.addEventListener('change', () => {
      Store.set({ theme: themeAuto.checked ? 'auto' : Store.get().theme });
      theme.checked = Store.get().theme === 'dark';
      applySettings();
    });
    document.querySelectorAll('[data-fs]').forEach((b) => {
      b.addEventListener('click', () => {
        Store.set({ fontSize: b.dataset.fs });
        document.querySelectorAll('[data-fs]').forEach((x) => x.classList.toggle('active', x === b));
        applySettings();
      });
    });
    const rd = $('#set-readings');
    if (rd) rd.addEventListener('change', () => Store.set({ showDailyReadings: rd.checked }));
    const rs = $('#btn-reset-today');
    if (rs) rs.addEventListener('click', () => { Store.resetPrayed(currentDate); settingsView(); });
  }

  /* ------------------------------ Acerca ------------------------------ */
  function acercaView() {
    view.innerHTML = `
      <div class="section-title">Acerca de y avisos</div>
      <div class="legal card">
        <h3>Su uso</h3>
        <p>Esta aplicación ayuda a rezar la <b>Liturgia de las Horas</b> según el Rito Romano en español: Oficio de lectura, Laudes, Tercia, Sexta, Nona, Vísperas y Completas, con salterio de cuatro semanas, antífonas, himnos, lecturas, responsorios y preces para cada día. Incluye además las lecturas de la Misa del día.</p>

        <h3>Contenido y derechos</h3>
        <ul>
          <li>El texto litúrgico proviene de la librería de código abierto <b>breviarium</b> (licencia MIT), que reproduce la edición oficial española de la Liturgia de las Horas. El uso de los textos en su forma oficial requiere, en su caso, la correspondiente autorización de los titulares (Conferencia Episcopal Española / BAC). Esta app está pensada para el rezo personal y devocional.</li>
          <li>Las citas bíblicas de los cánticos evangélicos y las oraciones tradicionales se ofrecen en su versión litúrgica en español. El Salterio (salmos del oficio y de los kathismata) usa el salterio propio de la Liturgia de las Horas en español, con la opción de variante España o Latinoamérica.</li>
          <li>La <b>Biblia de Jerusalén</b> (© Desclée de Brouwer) y la <b>Sagrada Biblia de la Conferencia Episcopal Española</b> (© BAC) no se reproducen en esta app. En la sección Biblia puedes importar el texto de la edición que tengas con licencia; queda guardado solo en tu dispositivo.</li>
        </ul>

        <h3>Privacidad y offline</h3>
        <p>El rezo, tus ajustes, progreso y textos importados funcionan sin conexión y se guardan solo en tu navegador.</p>
        <p>Las funciones de <b>comunidad</b> (presencia en vivo, intenciones, coros) requieren conexión con el servidor y están diseñadas para ser lo más anónimas posible: la presencia solo muestra una posición aproximada y expira sola; las intenciones no llevan tu nombre ni identificación; los coros usan solo apodos que eliges tú y su información se limita a quién ha rezado cada hora — nunca puntuaciones ni rachas. No se almacena tu IP asociada a estos datos.</p>

        <h3>Aviso legal y política de privacidad</h3>
        <p><b>Titular:</b> Ramón Fandos.<br>
        <b>Contacto:</b> fandosrj@gmail.com</p>
        <p>Esta versión web <b>no crea cuentas</b>, <b>no utiliza cookies en absoluto</b> (ni propias, ni de terceros, ni trazadores) y <b>no envía datos personales a ningún servidor</b>: el rezo, el progreso, los favoritos y los textos que importes se guardan únicamente en tu dispositivo. La página se aloja en <b>GitHub Pages</b>, servicio de <b>Microsoft</b>; GitHub, como cualquier proveedor de hosting, puede registrar los datos de acceso habituales (IP, fecha, navegador) para su operativa y seguridad, sin relación con el contenido que rezas.</p>
        <p><b>Estadísticas de visitas:</b> medimos cuántas personas visitan la web y qué páginas ven de forma <b>agregada y anónima</b> con <b>GoatCounter</b> (estadísticas de código abierto): no usa cookies, no guarda direcciones IP ni identificadores y no permite identificar a los usuarios. Sus datos se rigen por la política de GoatCounter (goatcounter.com).</p>

        <h3>Créditos</h3>
        <p>Motor de rezo: <code>breviarium · MIT · breviarium.es</code></p>
        <p><em>Oremus, ut mente concordi voce concordi deprecemur. — La oración de la Iglesia.</em></p>
      </div>
    `;
  }

  /* ============================ COMUNIDAD ============================ */
  function intoSlot(sel) {
    return document.querySelector(sel);
  }

  /* ------------------------ Intenciones ------------------------ */
  function loadIntentions(slot) {
    if (!slot) return;
    Community.intentions.open().then((d) => {
      slot.innerHTML = intentionsBlock(d.intentions);
      wireIntentions(slot);
    }).catch((e) => {
      slot.innerHTML = `<div class="card">
        <div class="rubric">Peticiones de los hermanos</div>
        <p class="offline-msg">${Liturgy.esc(e.message)} Las peticiones compartidas requieren conexión.</p>
      </div>`;
    });
  }

  function intentionsBlock(list) {
    let html = `<div class="card intentions">
      <div class="rubric">Peticiones de los hermanos</div>
      <p class="int-sub">Se rezan por cada petición durante 24 horas. Todo es anónimo: nadie sabe quién la dejó ni quién la reza. Sin comentarios, sin muros, sin seguidores.</p>
      <form id="int-form">
        <textarea id="int-text" maxlength="280" placeholder="Escribe una intención de oración (máx. 280 caracteres)…"></textarea>
        <button class="btn primary" type="submit">Dejar mi intención</button>
        <span class="int-hint" id="int-hint"></span>
      </form>`;
    if (!list.length) {
      html += `<p class="int-empty">Aún no hay peticiones visibles ahora mismo. Sé la primera persona en dejar una.</p>`;
    } else {
      for (const it of list) {
        html += `<div class="int-item" data-id="${it.id}">
          <p class="int-text">${Liturgy.esc(it.text)}</p>
          <div class="int-actions">
            <button class="btn small ${it.mine ? 'marked' : ''}" data-pray="${it.id}" ${it.mine ? 'disabled' : ''}>
              &nbsp;${it.mine ? 'Rezada' : 'He rezado por esta intención'}&nbsp;
            </button>
            <span class="int-count" data-count="${it.id}">${it.prayed} ${it.prayed === 1 ? 'persona la reza' : 'personas la rezan'}</span>
            <button class="int-report" data-report="${it.id}" title="Informar de contenido inapropiado">informar</button>
          </div>
        </div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  function wireIntentions(slot) {
    const form = slot.querySelector('#int-form');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ta = slot.querySelector('#int-text');
      const hint = slot.querySelector('#int-hint');
      const text = ta.value.trim();
      if (text.length < 3) { hint.textContent = 'Escribe al menos 3 caracteres.'; return; }
      Community.intentions.add(text).then(() => {
        hint.textContent = 'Gracias. Tu intención ha quedado confiada a la oración de los hermanos.';
        ta.value = '';
        loadIntentions(slot);
      }).catch((err) => { hint.textContent = err.message; });
    });
    slot.querySelectorAll('[data-pray]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.pray;
        Community.intentions.pray(id).then((r) => {
          b.disabled = true;
          b.classList.add('marked');
          b.textContent = ' Rezada ';
          const c = slot.querySelector('[data-count="' + id + '"]');
          if (c) c.textContent = r.prayed === 1 ? '1 persona la reza' : r.prayed + ' personas la rezan';
        }).catch(() => {});
      });
    });
    slot.querySelectorAll('[data-report]').forEach((b) => {
      b.addEventListener('click', () => {
        Community.intentions.report(b.dataset.report).then(() => { b.textContent = 'gracias'; b.disabled = true; }).catch(() => {});
      });
    });
  }

  /* ------------------------ Vista Comunidad ------------------------ */
  function communityStaticView() {
    let html = topBar('Comunidad de rezo', fmtDate(currentDate));
    html += `<div class="note-box">
      La <b>comunidad en vivo</b> (presencia "rezamos juntos", intenciones y coros)
      necesita un servidor y no está disponible en esta versión web estática.
    </div>`;
    html += `<div class="btn-row">
      <a class="btn primary" href="https://ramonfandos.es/liturgiahoras" target="_blank" rel="noopener">Abrir la versión completa &#8599;</a>
      <a class="btn" href="#hoy">Volver a Hoy</a>
    </div>`;
    html += `<div class="card"><p class="comm-sub">Sigue rezándolo todo: horas, salterio en kathismas,
      Rezo en latín, rito ortodoxo, santoral, Rosario, Coronilla, Ángelus y oraciones funcionan igual.</p></div>`;
    view.innerHTML = html;
  }

  async function communityView() {
    showLoading(true);
    let html = `<div class="section-title">Comunidad de rezo</div>
      <p class="comm-sub">Comunidad sin comparación: sin rankings, sin puntos, sin seguidores.
        Solo presencia, compañía y oración.</p>
      <div class="seg comm-tabs">
        <button data-c-tab="now" class="active">Juntos ahora</button>
        <button data-c-tab="ints">Intenciones</button>
        <button data-c-tab="choirs">Mis coros</button>
      </div>
      <div id="comm-pane"></div>`;
    view.innerHTML = html;

    const show = (t) => {
      localStorage.setItem('liturgia.comm-tab.v1', t);
      document.querySelectorAll('.comm-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.cTab === t));
      tabs[t]();
    };
    document.querySelectorAll('.comm-tabs button').forEach((b) => {
      b.addEventListener('click', () => show(b.dataset.cTab));
    });

    const tabs = {
      now: renderNow,
      ints: renderInts,
      choirs: renderChoirs
    };
    const stored = localStorage.getItem('liturgia.comm-tab.v1') || 'now';
    show(stored);
    showLoading(false);
  }

  let commMap = null;

  async function renderNow() {
    const pane = $('#comm-pane');
    if (!pane) return;
    const p = await Community.presence();
    const hourList = Liturgy.HOURS.map((h) => h.id).filter((id) => p.hours[id]);
    pane.innerHTML = `
      <div class="card chorus-card">
        <div class="chorus-big"><b>${p.total}</b> personas rezan ahora mismo</div>
        <div class="chorus-hours">${hourList.map((h) => {
          const hx = Liturgy.HOURS.find((x) => x.id === h);
          return `<span class="chip">${hx ? hx.name : h}: ${p.hours[h]}</span>`;
        }).join('') || '<span class="chip dim">Aún nadie rezando en este instante</span>'}</div>
        <p class="comm-sub">Cada punto del mapa es un hermano o hermana rezando en este momento. Sin nombre, sin perfil, sin puntuación. Solo sabes que estás acompañado.</p>
      </div>
      <div class="card"><div id="comm-map" class="comm-map"></div></div>
      <p class="comm-rt">En vivo · se actualiza solo</p>`;
    if (typeof L !== 'undefined') {
      if (commMap) { commMap.remove(); commMap = null; }
      commMap = L.map('comm-map', { zoomControl: true, attributionControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 7,
        attribution: '&copy; OpenStreetMap'
      }).addTo(commMap);
      if (p.withGps && p.withGps.length) {
        for (const pt of p.withGps) {
          L.circleMarker([pt.lat, pt.lng], {
            radius: 7, color: 'var(--accent,#8a6d2f)', weight: 2,
            fillColor: 'var(--accent,#8a6d2f)', fillOpacity: 0.7
          }).addTo(commMap);
        }
        commMap.fitBounds(p.withGps.map((g) => [g.lat, g.lng]), { maxZoom: 5 });
      } else {
        commMap.setView([20, 0], 2);
      }
    } else {
      pane.querySelector('#comm-map').textContent = 'No se pudo cargar el mapa.';
    }
    Community.ensureSocket();
    Community.onPresence = (snap) => {
      const total = document.querySelector('.chorus-big b');
      if (total) total.textContent = snap.total;
      if (commMap) {
        commMap.eachLayer((l) => { if (l instanceof L.CircleMarker) l.remove(); });
        for (const pt of snap.withGps) {
          L.circleMarker([pt.lat, pt.lng], {
            radius: 7, color: 'var(--accent,#8a6d2f)', weight: 2,
            fillColor: 'var(--accent,#8a6d2f)', fillOpacity: 0.7
          }).addTo(commMap);
        }
      }
    };
  }

  async function renderInts() {
    const pane = $('#comm-pane');
    if (!pane) return;
    let entries;
    try {
      const d = await Community.intentions.open();
      entries = d.intentions;
    } catch (e) {
      pane.innerHTML = `<div class="card"><p class="offline-msg">${Liturgy.esc(e.message)} Conecta para ver las peticiones compartidas.</p></div>`;
      return;
    }
    let html = `<div class="section-title">Intenciones compartidas</div>
      <div class="card intentions">
      <p class="int-sub">Anónimas. Se rezan durante 24 horas y después se retiran. Puedes dejar una o rezar por las que veas.</p>`;
    if (entries.length) {
      for (const it of entries) {
        html += `<div class="int-item"><p class="int-text">${Liturgy.esc(it.text)}</p>
          <div class="int-actions">
            <button class="btn small ${it.mine ? 'marked' : ''}" data-pray="${it.id}" ${it.mine ? 'disabled' : ''}>&nbsp;${it.mine ? 'Rezada' : 'He rezado por esta intención'}&nbsp;</button>
            <span class="int-count">${it.prayed} ${it.prayed === 1 ? 'persona la reza' : 'personas la rezan'}</span>
            <button class="int-report" data-report="${it.id}">informar</button>
          </div></div>`;
      }
    } else {
      html += `<p class="int-empty">Ahora no hay peticiones visibles. Deja la primera cuando vayas a rezar.</p>`;
    }
    html += `</div>`;
    Community.intentions.mine().then((m) => {
      if (m.mine && m.mine.length) {
        html += `<div class="section-title">Mis peticiones</div>`;
        for (const it of m.mine) {
          const open = it.closed_at > Date.now();
          html += `<div class="card int-mine">
            <p class="int-text">${Liturgy.esc(it.text)}</p>
            <span class="int-count">${open ? 'En curso (24 h)' : ''}</span>
            <span class="int-count"><b>${it.prayed} ${it.prayed === 1 ? 'persona' : 'personas'} rezaron por ella</b></span>
          </div>`;
        }
      }
    }).catch(() => {});
    pane.innerHTML = html;
    pane.querySelectorAll('[data-pray]').forEach((b) => {
      b.addEventListener('click', () => {
        Community.intentions.pray(b.dataset.pray).then((r) => {
          b.disabled = true; b.classList.add('marked'); b.textContent = ' Rezada ';
          const c = b.parentNode.querySelector('.int-count');
          if (c) c.textContent = r.prayed === 1 ? '1 persona la reza' : r.prayed + ' personas la rezan';
        }).catch(() => {});
      });
    });
    pane.querySelectorAll('[data-report]').forEach((b) => {
      b.addEventListener('click', () => {
        Community.intentions.report(b.dataset.report).then(() => { b.textContent = 'gracias'; b.disabled = true; }).catch(() => {});
      });
    });
  }

  async function renderChoirs() {
    const pane = $('#comm-pane');
    if (!pane) return;
    let choirs;
    try {
      choirs = (await Community.choirs.mine()).choirs;
    } catch (e) {
      pane.innerHTML = `<div class="card"><p class="offline-msg">${Liturgy.esc(e.message)}</p></div>`;
      return;
    }
    let html = `<div class="section-title">Pequeños coros</div>
      <p class="comm-sub">Un coro pequeño es tu gente: familia, amigos, parroquia. Veis quién ha rezado cada hora del día. Solo presencia, nunca puntuación.</p>`;

    for (const c of choirs) {
      html += `<div class="card choir-card" data-code="${c.code}">
        <div class="choir-head"><b>${Liturgy.esc(c.name)}</b><span class="chip">${c.code}</span></div>
        <div class="choir-members" id="choir-${c.code}">…</div>
        <button class="btn small" data-leave="${c.code}">Abandonar el coro</button>
      </div>`;
      loadChoirToday(c.code, c.name);
    }

    html += `<div class="card">
      <div class="lbl" style="font-weight:700">Crear un coro</div>
      <div class="desc" style="color:var(--ink-soft);font-family:var(--sans);font-size:.85rem;margin:6px 0 12px">Comparte el código con los tuyos.</div>
      <div class="col-form">
        <input class="date-val" id="choir-name" maxlength="40" placeholder="Nombre del coro (ej. La familia de los martes)">
        <input class="date-val" id="choir-nick" maxlength="20" placeholder="Tu apodo (ej. María)">
        <button class="btn primary" id="btn-create-choir">Crear coro</button>
      </div>
    </div>
    <div class="card">
      <div class="lbl" style="font-weight:700">Unirse a un coro</div>
      <div class="desc" style="color:var(--ink-soft);font-family:var(--sans);font-size:.85rem;margin:6px 0 12px">Te dan un código de 6 letras.</div>
      <div class="col-form">
        <input class="date-val" id="choir-code" maxlength="6" placeholder="Código (ej. 2KCNEK)">
        <input class="date-val" id="choir-join-nick" maxlength="20" placeholder="Tu apodo">
        <button class="btn primary" id="btn-join-choir">Unirme</button>
      </div>
      <div id="choir-msg"></div>
    </div>`;

    pane.innerHTML = html;

    $('#btn-create-choir').addEventListener('click', () => {
      const name = $('#choir-name').value.trim();
      const nick = $('#choir-nick').value.trim();
      Community.choirs.create(nick, name).then(() => renderChoirs()).catch((e) => msg(e.message));
    });
    $('#btn-join-choir').addEventListener('click', () => {
      const code = $('#choir-code').value.trim().toUpperCase();
      const nick = $('#choir-join-nick').value.trim();
      Community.choirs.join(nick, code).then(() => renderChoirs()).catch((e) => msg(e.message));
    });
    pane.querySelectorAll('[data-leave]').forEach((b) => {
      b.addEventListener('click', () => {
        const code = b.dataset.leave;
        if (!confirm('¿Abandonar este coro?')) return;
        Community.choirs.leave(code).then(() => renderChoirs()).catch(() => {});
      });
    });
    pane.querySelectorAll('.choir-card').forEach((card) => {
      const code = card.dataset.code;
      card.querySelectorAll('[data-mark]').forEach((m) => {
        m.addEventListener('click', () => {
          Community.choirs.prayed(code, iso(currentDate), m.dataset.mark)
            .then(() => loadChoirToday(code))
            .catch((e) => { m.textContent = 'error'; });
        });
      });
    });

    function msg(t) { const el = $('#choir-msg'); if (el) el.textContent = t; }
  }

  async function loadChoirToday(code) {
    const box = document.querySelector('#choir-' + code);
    if (!box) return;
    let data;
    try { data = await Community.choirs.presence(code, iso(currentDate)); }
    catch (e) { box.textContent = e.message; return; }
    const nowHour = recommendedHour();
    let html = '';
    for (const m of data.members) {
      const dots = Liturgy.HOURS.map((h) => {
        const done = m.hours && m.hours[h.id];
        const cls = done ? ' done' : '';
        const live = m.now === h.id ? ' now' : '';
        return `<span class="hslot${cls}${live}" title="${h.name}">${done ? '&#9679;' : '&#9675;'}</span>`;
      }).join('');
      html += `<div class="choir-member"><b>${Liturgy.esc(m.nick)}</b><span class="hstrip">${dots}</span>
        <span class="choir-now">${m.now ? 'reza ahora ' + hourName(m.now) : ''}</span></div>`;
    }
    box.innerHTML = html +
      `<div class="choir-legend">${Liturgy.HOURS.map((h) => `<span>${Liturgy.esc(h.name.slice(0, 1))}</span>`).join('')}
       <p class="comm-sub">Círculo lleno = hora rezada hoy · brillante = reza ahora · sin orden ni puntos.</p></div>`;
    if (!data.members.length) box.innerHTML = '<p class="int-empty">Aún no hay miembros.</p>';
    function hourName(id) {
      const hx = Liturgy.HOURS.find((x) => x.id === id);
      return hx ? hx.name : id;
    }
  }

  /* ------------------------ Eventos globales ------------------------ */
  function initEvents() {
    // Navegación de fecha
    document.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (!nav) return;
      const d = new Date(currentDate);
      if (nav.dataset.nav === 'today') currentDate = new Date();
      else d.setDate(d.getDate() + parseInt(nav.dataset.nav, 10));
      if (nav.dataset.nav !== 'today') currentDate = d;
      currentDate.setHours(0, 0, 0, 0);
      homeView();
    });
    document.addEventListener('change', (e) => {
      if (e.target.id === 'date-input') {
        const v = e.target.value;
        if (v) { currentDate = new Date(v + 'T00:00:00'); homeView(); }
      }
    });

    // Menú lateral
    const drawer = $('#drawer');
    $('#btn-menu').addEventListener('click', () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      $('#btn-menu').setAttribute('aria-expanded', 'true');
    });
    $('#btn-settings').addEventListener('click', () => { location.hash = '#ajustes'; });
    const closeMenu = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      $('#btn-menu').setAttribute('aria-expanded', 'false');
    };
    $('#btn-close-menu').addEventListener('click', closeMenu);
    drawer.querySelector('.drawer-backdrop').addEventListener('click', closeMenu);

    // Cerrar menú al navegar
    window.addEventListener('hashchange', () => {
      closeMenu();
      asStop();
      detachHomePresence();
      detachNowOthers();
      if (!GH && typeof Community !== 'undefined') Community.leaveHour();
      if (window.LatinaRezado && LatinaRezado.detener) LatinaRezado.detener();
      setTab();
      route();
      window.scrollTo(0, 0);
    });
  }

  function setTab() {
    const h = parseHash();
    document.querySelectorAll('.tabbar .tab').forEach((t) => {
      const tab = t.dataset.tab;
      const active = (tab === 'hoy' && (h === 'hoy' || h.startsWith('hora/'))) ||
        (tab === 'lecturas' && (h === 'lecturas' || h === 'misal')) ||
        (tab !== 'hoy' && tab !== 'lecturas' && (h === tab || h.startsWith(tab)));
      t.classList.toggle('active', active);
    });
  }

  /* ------------------------ Apply accent per day --------------------- */
  async function applyDayAccent() {
    try {
      const info = await Liturgy.ensure().getLiturgyInformation(currentDate);
      if (info && info.color_hex) setAccent(info.color_hex);
    } catch (e) { /* mantiene el oro por defecto */ }
  }

  /* ------------------------------ Init ------------------------------- */
  function showNoCookiesBanner() {
    try {
      if (!document.body) return;
      try { if (localStorage.getItem('lh.nocookies')) return; } catch (e) { return; }

      const b = document.createElement('div');
      b.className = 'no-cookies';
      b.setAttribute('role', 'dialog');
      b.setAttribute('aria-label', 'Aviso de privacidad');

      const p = document.createElement('p');
      const strong = (t) => { const s = document.createElement('b'); s.textContent = t; return s; };
      p.appendChild(strong('Sin cookies.'));
      p.appendChild(document.createTextNode(' No te rastreamos ni identificamos: solo contamos las visitas de forma anónima y agregada. Tus rezos, progreso y favoritos quedan guardados solo en tu dispositivo. La página la crea y mantiene '));
      p.appendChild(strong('Ramón Fandos'));
      p.appendChild(document.createTextNode(' y se aloja en '));
      p.appendChild(strong('GitHub Pages'));
      p.appendChild(document.createTextNode(' (servicio de '));
      p.appendChild(strong('Microsoft'));
      p.appendChild(document.createTextNode(').'));

      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'nci-link';
      infoBtn.textContent = 'Más información';

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.textContent = 'Entendido';

      b.appendChild(p);
      b.appendChild(infoBtn);
      b.appendChild(okBtn);

      const removeEl = (el) => { try { if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) {} };
      const closeModal = () => {
        const m = document.getElementById('noCookiesInfo');
        if (m) removeEl(m);
        document.removeEventListener('keydown', trapEsc);
      };
      const openModal = () => {
        if (document.getElementById('noCookiesInfo')) return;
        const m = document.createElement('div');
        m.id = 'noCookiesInfo';
        m.className = 'no-cookies-info';
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.setAttribute('aria-label', 'Aviso de privacidad');
        const card = document.createElement('div');
        card.className = 'nci-card';
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'icon-btn nci-close';
        x.setAttribute('aria-label', 'Cerrar');
        x.textContent = '\u00D7';
        const h3 = document.createElement('h3');
        h3.textContent = 'Privacidad';
        const mkP = (...parts) => {
          const el = document.createElement('p');
          for (const part of parts) el.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
          return el;
        };
        const b1 = strong('Sin cookies.');
        const mk = (t) => strong(t);
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'nci-ok';
        ok.textContent = 'Cerrar';
        card.appendChild(x);
        card.appendChild(h3);
        card.appendChild(mkP(b1, ' No te rastreamos ni identificamos: solo contamos visitas de forma anónima y agregada (GoatCounter).'));
        card.appendChild(mkP('Tus rezos, progreso y favoritos quedan guardados solo en tu dispositivo, funcionan sin conexión y ', mk('no se envían a ningún servidor'), '.'));
        card.appendChild(mkP('La página la crea y mantiene ', mk('Ramón Fandos'), ' (fandosrj@gmail.com) y se aloja en ', mk('GitHub Pages'), ', servicio de ', mk('Microsoft'), '.'));
        const more = document.createElement('p');
        more.className = 'nci-more';
        const a = document.createElement('a');
        a.href = '#acerca';
        a.textContent = 'Aviso legal completo, créditos y estadísticas en "Acerca de y avisos"';
        more.appendChild(a);
        card.appendChild(more);
        card.appendChild(ok);
        m.appendChild(card);
        document.body.appendChild(m);
        x.addEventListener('click', closeModal);
        ok.addEventListener('click', closeModal);
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
      };
      const trapEsc = (e) => { if (e.key === 'Escape') closeModal(); };
      document.addEventListener('keydown', trapEsc);

      okBtn.addEventListener('click', () => {
        try { localStorage.setItem('lh.nocookies', '1'); } catch (e) {}
        removeEl(b);
      });
      infoBtn.addEventListener('click', openModal);

      document.body.appendChild(b);
    } catch (e) {
      /* un fallo del aviso nunca debe bloquear la aplicación */
    }
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      const onLoad = () => navigator.serviceWorker.register('sw.js').catch(() => {});
      if (document.readyState === 'complete') onLoad();
      else window.addEventListener('load', onLoad);
    }
  }

  async function init() {
    applySettings();
    showNoCookiesBanner();
    initEvents();
    setTab();
    registerSW();
    if (!(window.Breviarium || {}).default && !window.Breviarium) {
      view.innerHTML = `<div class="note-box">No se pudo cargar la librería de rezo (breviarium). Recarga la página o comprueba que los archivos están completos.</div>`;
      return;
    }
    await applyDayAccent();
    if (!GH && typeof Community !== 'undefined') {
      Community.ensureSocket();
      Community.on('chorevt', onChorevt);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) asStop(); });
    route();
  }

  init();
})();