"use strict";
// Sonido del juego, todo sintetizado con WebAudio (sin archivos): efectos y una música espacial generativa.
// El truco "adictivo": al comer seguido, cada bocado suena una nota más alta de una escala pentatónica,
// así que una buena racha suena a melodía que sube. Al cortarse la racha, vuelve a empezar desde abajo.
const Sonido = (() => {
  const PREF = "vortex-audio";
  let prefs = {efectos: true, musica: true};
  try { const j = JSON.parse(localStorage.getItem(PREF) || "null"); if (j) prefs = Object.assign(prefs, j); else if (localStorage.getItem("vortex-sonido") === "no") prefs = {efectos: false, musica: false}; } catch (e) {}
  const guardar = () => { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) {} };

  let ac = null, maestro, busFx, busMus, eco, ecoVuelta, ruidoBuf = null;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function crear() {
    if (ac) return true;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    maestro = ac.createGain(); maestro.gain.value = 0.9;
    busFx = ac.createGain(); busFx.gain.value = prefs.efectos ? 1 : 0;
    busMus = ac.createGain(); busMus.gain.value = 0;
    // eco suave para la música y algunos efectos
    eco = ac.createDelay(1); eco.delayTime.value = 0.375;
    ecoVuelta = ac.createGain(); ecoVuelta.gain.value = 0.32;
    const ecoFiltro = ac.createBiquadFilter(); ecoFiltro.type = "lowpass"; ecoFiltro.frequency.value = 2200;
    eco.connect(ecoFiltro); ecoFiltro.connect(ecoVuelta); ecoVuelta.connect(eco); ecoFiltro.connect(maestro);
    busFx.connect(maestro); busMus.connect(maestro); maestro.connect(comp); comp.connect(ac.destination);
    const n = ac.sampleRate; ruidoBuf = ac.createBuffer(1, n, n);
    const x = ruidoBuf.getChannelData(0); for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    return true;
  }
  function desbloquear() {
    if (!crear()) return;
    if (ac.state === "suspended") ac.resume();
    if (modo && prefs.musica) subirMusica();
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => addEventListener(ev, desbloquear, {passive: true}));

  // ---------- instrumentos ----------
  function tono(f0, f1, t, dur, vol, forma = "sine", dest = busFx, ataque = 0.005) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = forma; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  function pluck(f, t, dur, vol, dest = busFx, conEco = false) {
    const g = tono(f, f, t, dur, vol, "triangle", dest, 0.004);
    tono(f * 2, f * 2, t, dur * 0.6, vol * 0.35, "sine", dest, 0.004);
    if (conEco) { const e = ac.createGain(); e.gain.value = 0.5; g.connect(e); e.connect(eco); }
  }
  function ruido(t, dur, vol, corte, tipo = "lowpass", dest = busFx, q = 0.8) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruidoBuf; f.type = tipo; f.frequency.value = corte; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    return f;
  }
  function barrido(t, dur, vol, desde, hasta) {          // "fiuuu" de viento que sube o baja
    const f = ruido(t, dur, vol, desde, "bandpass", busFx, 3);
    f.frequency.setValueAtTime(desde, t); f.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  }

  // ---------- efectos ----------
  const PENTA = [0, 2, 4, 7, 9];
  const escala = (i, base = 67) => midi(base + 12 * Math.floor(i / 5) + PENTA[i % 5]);
  const ultimo = {};
  function efecto(tipo, a = 1) {
    if (!prefs.efectos || !crear() || ac.state !== "running") return;
    const ahora = ac.currentTime;
    if (ultimo[tipo] && ahora - ultimo[tipo] < 0.03 && tipo !== "glup") return;     // sin amontonar el mismo sonido
    ultimo[tipo] = ahora;
    const t = ahora + 0.005;
    switch (tipo) {
      case "glup": {                                     // a = {tam, paso, grande}
        const o = typeof a === "object" ? a : {tam: a, paso: 0};
        const f = escala(Math.min(14, o.paso || 0));
        tono(f * 1.9, f * 0.7, t, 0.09, 0.16, "sine");              // "blup"
        pluck(f, t + 0.012, 0.22 + Math.min(0.2, (o.paso || 0) * 0.015), 0.11);
        if (o.grande) { [0, 4, 7, 12].forEach((s, i) => pluck(f * Math.pow(2, s / 12) * 2, t + 0.05 + i * 0.045, 0.3, 0.05, busFx, true)); ruido(t, 0.4, 0.05, 7000, "highpass"); }
        break;
      }
      case "combo": { const f = escala(5 + a * 2, 72); pluck(f, t, 0.18, 0.1); pluck(f * 1.5, t + 0.07, 0.25, 0.1, busFx, true); break; }
      case "comboMax": [0, 4, 7, 12, 16].forEach((s, i) => pluck(midi(79 + s), t + i * 0.05, 0.35, 0.09, busFx, true)); ruido(t, 0.5, 0.06, 8000, "highpass"); break;
      case "crece": barrido(t, 0.5, 0.18, 300, 2400); tono(midi(43 + a), midi(55 + a), t, 0.45, 0.22, "sine"); pluck(midi(67 + a * 2), t + 0.25, 0.4, 0.08, busFx, true); break;
      case "golpe": tono(160, 50, t, 0.32, 0.3, "sine"); tono(220, 90, t, 0.25, 0.08, "square"); ruido(t, 0.18, 0.18, 900); [64, 60, 55].forEach((n, i) => pluck(midi(n), t + 0.12 + i * 0.08, 0.2, 0.06)); break;
      case "escudoRoto": ruido(t, 0.35, 0.16, 6000, "highpass"); [88, 84, 91].forEach((n, i) => tono(midi(n), midi(n), t + i * 0.03, 0.4, 0.05, "sine")); break;
      case "iman": { const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = 330; lfo.frequency.value = 9; lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        o.connect(g); g.connect(busFx); o.start(t); lfo.start(t); o.stop(t + 0.75); lfo.stop(t + 0.75);
        pluck(midi(76), t + 0.1, 0.3, 0.06); break; }
      case "escudo": [72, 79, 84, 88].forEach((n, i) => tono(midi(n), midi(n), t + i * 0.04, 0.6, 0.05, "sine")); ruido(t, 0.5, 0.04, 9000, "highpass"); break;
      case "frenesi": for (let i = 0; i < 8; i++) pluck(midi(72 + PENTA[i % 5] + 12 * Math.floor(i / 5)), t + i * 0.035, 0.15, 0.07); tono(110, 220, t, 0.4, 0.1, "sawtooth"); break;
      case "reloj": [0, 1, 2, 3].forEach((i) => { tono(i % 2 ? 1400 : 1900, i % 2 ? 1400 : 1900, t + i * 0.09, 0.04, 0.1, "square"); }); pluck(midi(84), t + 0.38, 0.4, 0.08, busFx, true); break;
      case "supernova": tono(90, 30, t, 1.1, 0.4, "sine"); ruido(t, 1.2, 0.3, 1800); barrido(t + 0.05, 0.9, 0.12, 4000, 200); [60, 64, 67, 72, 76].forEach((n, i) => pluck(midi(n), t + 0.15 + i * 0.04, 0.6, 0.06, busFx, true)); break;
      case "mejora": pluck(midi(76), t, 0.15, 0.1); pluck(midi(83), t + 0.08, 0.25, 0.1); break;
      case "tic": { const alto = a <= 3; tono(alto ? 1500 : 1100, alto ? 1500 : 1100, t, 0.05, alto ? 0.16 : 0.1, "square"); if (alto) tono(midi(84 - a), midi(84 - a), t, 0.18, 0.06, "sine"); break; }
      case "empieza": barrido(t, 0.6, 0.12, 200, 3000); [60, 67, 72].forEach((n, i) => pluck(midi(n), t + 0.2 + i * 0.06, 0.4, 0.08, busFx, true)); break;
      case "fin": [72, 67, 64, 72].forEach((n, i) => pluck(midi(n), t + i * 0.12, i === 3 ? 0.7 : 0.2, 0.1, busFx, true)); tono(midi(48), midi(48), t + 0.36, 0.8, 0.12, "triangle"); break;
      case "record": [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => pluck(midi(n + 12), t + i * (i < 4 ? 0.09 : 0.11), i === 7 ? 0.9 : 0.22, 0.1, busFx, true)); tono(midi(48), midi(48), t, 1.2, 0.14, "triangle"); ruido(t + 0.7, 0.8, 0.06, 9000, "highpass"); break;
      case "cuenta": tono(2200 + Math.random() * 300, 2400, t, 0.04, 0.035, "sine"); break;        // contador de puntos
      case "xp": tono(400 + a * 900, 400 + a * 900, t, 0.05, 0.03, "triangle"); break;
      case "mision": [79, 84, 88].forEach((n, i) => pluck(midi(n), t + i * 0.07, 0.3, 0.08, busFx, true)); break;
      case "toque": tono(700, 520, t, 0.05, 0.05, "sine"); break;
      case "compra": [84, 88, 91, 96].forEach((n, i) => tono(midi(n), midi(n), t + i * 0.05, 0.25, 0.06, "sine")); ruido(t, 0.25, 0.05, 6000, "highpass"); break;
      case "nivel": [72, 76, 79, 84].forEach((n, i) => pluck(midi(n), t + i * 0.09, i === 3 ? 0.8 : 0.2, 0.11, busFx, true)); tono(midi(48), midi(48), t + 0.27, 0.9, 0.14, "triangle"); break;
      // ---- cofres ----
      case "cofre": tono(220, 440, t, 0.25, 0.14); break;
      case "carta": { const b = 380 + a * 110; pluck(b, t, 0.14, 0.12); pluck(b * 1.5, t + 0.1, 0.22, 0.1); break; }
      case "caer": tono(120, 45, t, 0.3, 0.32); ruido(t, 0.18, 0.12, 900); break;
      case "carga": tono(90, 520, t, 0.95, 0.05, "sawtooth"); tono(180, 1040, t, 0.95, 0.06, "triangle"); barrido(t, 0.95, 0.08, 300, 5000); break;
      case "estalla": ruido(t, 0.7, 0.35, 2400); tono(160, 40, t, 0.6, 0.35); [523, 784, 1046].forEach((f, i) => tono(f, f * 1.01, t + 0.05 + i * 0.04, 0.5, 0.08, "triangle")); break;
      case "sale": tono(300 + a * 80, 700 + a * 160, t, 0.22, 0.1); break;
      case "voltea": ruido(t, 0.12, 0.08, 4000); break;
      case "revela": {
        const acordes = [[72, 76], [74, 78, 81], [72, 76, 79, 83], [72, 76, 79, 84, 88], [69, 73, 76, 81, 85, 88]];
        acordes[a].forEach((n, i) => pluck(midi(n), t + i * (0.06 + a * 0.015), 0.5 + a * 0.15, 0.1, busFx, a >= 2));
        if (a >= 3) { ruido(t, 0.9, 0.12, 6000, "highpass"); tono(2093, 2093, t + 0.3, 1.2, 0.04); tono(midi(45), midi(45), t, 1.4, 0.16, "triangle"); }
        break;
      }
    }
  }

  // ---------- música generativa ----------
  // Cuatro acordes espaciales en bucle; en la partida se añaden bajo y percusión, y en los últimos segundos sube el ritmo.
  const ACORDES = [[48, [60, 64, 67, 71]], [45, [57, 60, 64, 67]], [41, [57, 60, 64, 65]], [43, [55, 59, 62, 67]]];
  let modo = null, siguienteT = 0, paso = 0, temporizador = null, intensidad = 0, atenuado = false;
  function subirMusica() {
    if (!ac) return;
    const meta = !prefs.musica || !modo ? 0 : atenuado ? 0.05 : modo === "partida" ? 0.22 : 0.17;
    busMus.gain.cancelScheduledValues(ac.currentTime);
    busMus.gain.setTargetAtTime(meta, ac.currentTime, 0.4);
  }
  function programar() {
    if (!ac || ac.state !== "running" || !modo || !prefs.musica) return;
    const bpm = modo === "partida" ? 100 + intensidad * 24 : 84, corchea = 60 / bpm / 2;
    if (siguienteT < ac.currentTime) siguienteT = ac.currentTime + 0.05;
    while (siguienteT < ac.currentTime + 0.25) {
      const t = siguienteT, c = ACORDES[Math.floor(paso / 16) % 4], enCompas = paso % 16;
      if (enCompas === 0) {                                   // colchón del acorde
        for (const n of c[1]) {
          const g = tono(midi(n), midi(n), t, corchea * 16, 0.035, "triangle", busMus, 0.6);
          void g;
        }
        tono(midi(c[0]), midi(c[0]), t, corchea * 16, modo === "partida" ? 0.05 : 0.07, "sine", busMus, 0.3);
      }
      // arpegio con eco: en el menú, notas sueltas; en partida, más seguidas
      const toca = modo === "partida" ? (enCompas % 2 === 0 || intensidad > 0.5) : [0, 3, 6, 10, 12].includes(enCompas);
      if (toca && Math.random() < (modo === "partida" ? 0.85 : 0.7)) {
        const n = c[1][(paso * 3 + (enCompas >> 2)) % 4] + (Math.random() < 0.3 ? 12 : 0) + 12;
        const g = tono(midi(n), midi(n), t, corchea * 2.5, 0.03, "sine", busMus, 0.01);
        const e = ac.createGain(); e.gain.value = 0.6; g.connect(e); e.connect(eco);
      }
      if (modo === "partida") {
        if (enCompas % 4 === 0) { tono(110, 40, t, 0.18, 0.16, "sine", busMus); }                              // bombo suave
        if (enCompas % 4 === 2) tono(midi(c[0] + 12), midi(c[0] + 12), t, corchea * 1.6, 0.06, "triangle", busMus);  // bajo
        if (enCompas % 2 === 1 || intensidad > 0.6) ruido(t, 0.04, 0.025 + intensidad * 0.02, 8000, "highpass", busMus);
      }
      siguienteT += corchea; paso++;
    }
  }
  function musica(m) {
    modo = m;
    if (m && !temporizador) temporizador = setInterval(programar, 60);
    if (!m && temporizador) { clearInterval(temporizador); temporizador = null; }
    if (m === "partida") { intensidad = 0; paso = 0; }
    subirMusica();
  }

  function poner(campo, valor) {
    prefs[campo] = !!valor; guardar();
    if (ac) { busFx.gain.setTargetAtTime(prefs.efectos ? 1 : 0, ac.currentTime, 0.05); subirMusica(); }
  }
  document.addEventListener("visibilitychange", () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

  return {
    efecto, musica, poner, desbloquear,
    get prefs() { return Object.assign({}, prefs); },
    get activo() { return prefs.efectos || prefs.musica; },
    get estado() { return ac ? ac.state : "sin-crear"; },
    set intensidad(x) { intensidad = Math.max(0, Math.min(1, x)); },
    atenuar(si) { atenuado = !!si; subirMusica(); },
  };
})();
