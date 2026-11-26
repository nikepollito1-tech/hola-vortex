"use strict";
// Apertura de cofres: el cofre cae, se carga de luz, estalla y suelta las cartas boca abajo una a una.
// Las cartas épicas o mejores "avisan" antes de darse la vuelta (brillan y tiemblan) y las legendarias y míticas
// revientan con rayos, confeti y vibración. Todo lo que es efecto va en un lienzo; las cartas son DOM (giro 3D por CSS).
const Cofre = (() => {
  const PAL = {
    asteroide: {a: "#625D8F", b: "#2B2752", trim: "#D9D5F2", trim2: "#8580AE", gema: "#5CE1E6", gema2: "#1E7F8C"},
    nebulosa:  {a: "#6A4AD0", b: "#25186A", trim: "#E2CCFF", trim2: "#9470E6", gema: "#FF7A9C", gema2: "#A3244A"},
    supernova: {a: "#3D2CA3", b: "#160E4A", trim: "#FFE08A", trim2: "#C98A12", gema: "#FFFFFF", gema2: "#FFC247"},
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const suave = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const rebote = (x) => {                         // easeOutBounce
    x = Math.min(1, Math.max(0, x));
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mezcla = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  // ---------- el cofre, dibujado ----------
  function estrella(g, cx, cy, r1, r2, puntas = 5) {
    g.beginPath();
    for (let i = 0; i < puntas * 2; i++) {
      const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / puntas;
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.closePath();
  }
  function pintar(g, tipo, cx, cy, s, o = {}) {
    const p = PAL[tipo] || PAL.asteroide, abrir = o.abrir || 0, luz = o.luz || 0, borde = Math.max(2, s * 0.022);
    const w = s, xb = cx - w / 2, yTapa = cy - s * 0.06, hb = s * 0.4, hl = s * 0.3;
    g.save();
    g.lineJoin = "round";
    // sombra
    g.fillStyle = "rgba(0,0,0,.38)";
    g.beginPath(); g.ellipse(cx, yTapa + hb + s * 0.035, w * 0.52, s * 0.07, 0, 0, Math.PI * 2); g.fill();
    // cuerpo
    const cuerpo = g.createLinearGradient(0, yTapa, 0, yTapa + hb);
    cuerpo.addColorStop(0, p.a); cuerpo.addColorStop(1, p.b);
    g.fillStyle = cuerpo; g.strokeStyle = "#0A0A1F"; g.lineWidth = borde;
    g.beginPath(); g.roundRect(xb, yTapa, w, hb, [s * 0.03, s * 0.03, s * 0.07, s * 0.07]); g.fill(); g.stroke();
    // tablas del cuerpo
    g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = Math.max(1, s * 0.008);
    for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(xb + w * 0.08, yTapa + hb * k / 3); g.lineTo(xb + w * 0.92, yTapa + hb * k / 3); g.stroke(); }
    // luz que sale de dentro
    if (luz > 0 || abrir > 0) {
      const a = Math.max(luz, abrir);
      const gl = g.createRadialGradient(cx, yTapa, 0, cx, yTapa, s * (0.4 + a * 0.5));
      gl.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); gl.addColorStop(0.35, mezcla(o.color || p.gema2, 0.7 * a)); gl.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gl; g.beginPath(); g.arc(cx, yTapa, s * (0.4 + a * 0.5), 0, Math.PI * 2); g.fill();
    }
    // flejes y esquinas del cuerpo
    const fleje = (x, y, ancho, alto) => {
      const gr = g.createLinearGradient(x, 0, x + ancho, 0);
      gr.addColorStop(0, p.trim2); gr.addColorStop(0.45, p.trim); gr.addColorStop(1, p.trim2);
      g.fillStyle = gr; g.strokeStyle = "#0A0A1F"; g.lineWidth = borde * 0.8;
      g.beginPath(); g.roundRect(x, y, ancho, alto, s * 0.012); g.fill(); g.stroke();
    };
    for (const fx of [0.17, 0.83]) fleje(xb + w * fx - s * 0.045, yTapa + s * 0.01, s * 0.09, hb - s * 0.02);
    fleje(xb - s * 0.01, yTapa + hb - s * 0.065, w + s * 0.02, s * 0.065);
    // tapa (gira sobre su borde trasero al abrirse)
    g.save();
    if (abrir > 0) {
      g.translate(cx, yTapa); g.translate(0, -abrir * s * 0.75); g.rotate(-abrir * 0.55); g.translate(-cx, -yTapa);
      g.globalAlpha = Math.max(0, 1 - Math.max(0, abrir - 0.55) / 0.45);
    }
    const tapa = g.createLinearGradient(0, yTapa - hl, 0, yTapa);
    tapa.addColorStop(0, p.a); tapa.addColorStop(1, p.b);
    g.fillStyle = tapa; g.strokeStyle = "#0A0A1F"; g.lineWidth = borde;
    g.beginPath();
    g.moveTo(xb, yTapa);
    g.lineTo(xb, yTapa - hl * 0.45);
    g.bezierCurveTo(xb, yTapa - hl * 1.08, xb + w, yTapa - hl * 1.08, xb + w, yTapa - hl * 0.45);
    g.lineTo(xb + w, yTapa); g.closePath(); g.fill(); g.stroke();
    // flejes curvos de la tapa
    for (const fx of [0.17, 0.83]) {
      const x = xb + w * fx;
      const gr = g.createLinearGradient(x - s * 0.045, 0, x + s * 0.045, 0);
      gr.addColorStop(0, p.trim2); gr.addColorStop(0.45, p.trim); gr.addColorStop(1, p.trim2);
      g.fillStyle = gr;
      const arriba = yTapa - hl * (fx < 0.5 ? 0.8 : 0.8);
      g.beginPath(); g.roundRect(x - s * 0.045, arriba, s * 0.09, yTapa - arriba, [s * 0.04, s * 0.04, 0, 0]); g.fill(); g.stroke();
    }
    // reborde de la tapa
    const reb = g.createLinearGradient(0, yTapa - s * 0.05, 0, yTapa + s * 0.02);
    reb.addColorStop(0, p.trim); reb.addColorStop(1, p.trim2);
    g.fillStyle = reb; g.beginPath(); g.roundRect(xb - s * 0.015, yTapa - s * 0.05, w + s * 0.03, s * 0.07, s * 0.02); g.fill(); g.stroke();
    // brillo
    g.fillStyle = "rgba(255,255,255,.16)";
    g.beginPath(); g.ellipse(xb + w * 0.32, yTapa - hl * 0.66, w * 0.16, hl * 0.13, -0.25, 0, Math.PI * 2); g.fill();
    // cerradura con gema
    const lx = cx, ly = yTapa - s * 0.01;
    const pl = g.createLinearGradient(0, ly - s * 0.11, 0, ly + s * 0.13);
    pl.addColorStop(0, p.trim); pl.addColorStop(1, p.trim2);
    g.fillStyle = pl; g.beginPath(); g.roundRect(lx - s * 0.1, ly - s * 0.1, s * 0.2, s * 0.22, s * 0.04); g.fill(); g.stroke();
    const brillo = 0.55 + 0.45 * (o.pulso || 0);
    const gm = g.createRadialGradient(lx - s * 0.02, ly - s * 0.02, 0, lx, ly, s * 0.08);
    gm.addColorStop(0, "#FFFFFF"); gm.addColorStop(0.35, p.gema); gm.addColorStop(1, p.gema2);
    g.shadowColor = p.gema; g.shadowBlur = s * 0.12 * brillo;
    g.fillStyle = gm;
    if (tipo === "supernova") estrella(g, lx, ly + s * 0.005, s * 0.075, s * 0.034);
    else if (tipo === "nebulosa") { g.beginPath(); g.moveTo(lx, ly - s * 0.07); g.lineTo(lx + s * 0.055, ly); g.lineTo(lx, ly + s * 0.08); g.lineTo(lx - s * 0.055, ly); g.closePath(); }
    else { g.beginPath(); g.arc(lx, ly, s * 0.055, 0, Math.PI * 2); }
    g.fill(); g.shadowBlur = 0; g.lineWidth = borde * 0.7; g.stroke();
    g.restore();
    g.restore();
  }
  const IMG = {};
  function imagen(tipo, tam = 220) {
    const k = tipo + tam;
    if (!IMG[k]) {
      const c = document.createElement("canvas"); c.width = c.height = tam;
      const g = c.getContext("2d");
      const gl = g.createRadialGradient(tam / 2, tam * 0.52, 0, tam / 2, tam * 0.52, tam * 0.5);
      gl.addColorStop(0, mezcla(PAL[tipo].gema2, 0.45)); gl.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gl; g.fillRect(0, 0, tam, tam);
      pintar(g, tipo, tam / 2, tam * 0.6, tam * 0.8, {pulso: 1});
      IMG[k] = c.toDataURL("image/png");
    }
    return IMG[k];
  }

  // ---------- escena ----------
  const $ = (id) => document.getElementById(id);
  let cv, g, W = 0, H = 0, DPR = 1, raf = 0, st = null;
  const parts = [], anillos = [];
  function medir() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  function chispas(n, x, y, colores, fuerza = 1, tipo = "chispa") {
    for (let i = 0; i < n && parts.length < 420; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(2, 9) * fuerza;
      parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (tipo === "confeti" ? 4 : 0), vida: 0, max: rnd(40, 90),
                  tam: tipo === "confeti" ? rnd(5, 9) : rnd(2, 5), color: colores[(Math.random() * colores.length) | 0], tipo,
                  g: tipo === "confeti" ? 0.18 : tipo === "polvo" ? 0.05 : 0.04, rot: rnd(0, 6), vr: rnd(-0.3, 0.3)});
    }
  }
  function anillo(x, y, color, ancho = 10, vel = 14) { anillos.push({x, y, r: 10, color, ancho, vel, vida: 1}); }
  const centro = () => ({x: W / 2, y: Math.min(H * 0.46, H / 2 + 40)});
  const tamCofre = () => Math.min(W * 0.62, 260);

  function dibujar(ahora) {
    raf = requestAnimationFrame(dibujar);
    if (!st) return;
    const t = (ahora - st.t0) / 1000, c = centro(), s = tamCofre();
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    // sacudida de pantalla
    st.sacudida *= 0.88;
    const sx = rnd(-1, 1) * st.sacudida, sy = rnd(-1, 1) * st.sacudida;
    g.translate(sx, sy);
    const ui = $("cofre-ui"); if (ui) ui.style.transform = st.sacudida > 0.5 ? `translate(${sx}px,${sy}px)` : "";
    // rayos giratorios del color de lo que hay dentro
    st.rayos += (st.rayosMeta - st.rayos) * 0.06;
    if (st.rayos > 0.01) {
      const n = 16, R = Math.hypot(W, H);
      g.save(); g.translate(c.x, st.rayosY ?? c.y); g.rotate(t * 0.25);
      for (let i = 0; i < n; i++) {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.7);
        gr.addColorStop(0, mezcla(st.colorRayos, 0.55 * st.rayos)); gr.addColorStop(1, mezcla(st.colorRayos, 0));
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, i * Math.PI * 2 / n, i * Math.PI * 2 / n + Math.PI / n * 0.55); g.closePath(); g.fill();
      }
      g.restore();
      const halo = g.createRadialGradient(c.x, st.rayosY ?? c.y, 0, c.x, st.rayosY ?? c.y, s * 1.1);
      halo.addColorStop(0, mezcla(st.colorRayos, 0.5 * st.rayos)); halo.addColorStop(1, mezcla(st.colorRayos, 0));
      g.fillStyle = halo; g.fillRect(0, 0, W, H);
    }
    // el cofre
    if (st.fase !== "cartas" && st.fase !== "resumen") {
      let y = c.y, esc = 1, rot = 0, abrir = 0, luz = 0;
      const te = t - st.tFase;
      if (st.fase === "entra") {
        const k = reduce ? 1 : Math.min(1, te / 0.75);
        y = -s + (c.y + s) * rebote(k);
        if (k >= 1 && !st.aterrizo) { st.aterrizo = true; st.sacudida = 7; Juego.sonar("caer"); for (const lado of [-1, 1]) chispas(9, c.x + lado * s * 0.42, c.y + s * 0.36, ["#B9B4D9", "#F4F1FF"], 0.35, "polvo"); }
        if (k >= 1 && te > 0.95) pasar("espera");
      } else if (st.fase === "espera") {
        y = c.y + Math.sin(t * 2.4) * 5;
        rot = Math.sin(t * 9) * 0.04 * Math.max(0, Math.sin(t * 1.6) - 0.6);
        if (Math.random() < 0.08) chispas(1, c.x + rnd(-s * 0.45, s * 0.45), y + rnd(-s * 0.3, s * 0.2), [st.colorCofre, "#F4F1FF"], 0.25);
      } else if (st.fase === "carga") {
        const k = Math.min(1, te / (reduce ? 0.2 : 0.95));
        rot = Math.sin(te * (30 + k * 30)) * 0.05 * k; esc = 1 + 0.06 * k + Math.sin(te * 40) * 0.015 * k;
        luz = k * 0.8; st.rayosMeta = k * 0.35;
        if (Math.random() < 0.6) {                  // la luz se cuela por la rendija
          const a = rnd(-Math.PI, 0);
          parts.push({x: c.x + Math.cos(a) * s * 0.7, y: c.y - s * 0.06 + Math.sin(a) * s * 0.5, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4,
                      vida: 0, max: 22, tam: rnd(2, 4), color: st.colorRayos, tipo: "chispa", g: 0, rot: 0, vr: 0});
        }
        if (k >= 1) estallar();
      } else if (st.fase === "estalla") {
        abrir = suave(te / 0.55); luz = 1 - suave(te / 1.2) * 0.4; esc = 1 + 0.08 * (1 - suave(te / 0.4));
        y = c.y + suave(te / 0.8) * s * 0.35;
        g.globalAlpha = Math.max(0, 1 - Math.max(0, te - 0.5) / 0.5);
        if (te > 1.0) pasar("cartas");
      }
      g.save(); g.translate(c.x, y); g.rotate(rot); g.scale(esc, esc); g.translate(-c.x, -y);
      pintar(g, st.res.cofre, c.x, y, s, {abrir, luz, pulso: 0.5 + 0.5 * Math.sin(t * 4), color: st.colorRayos});
      g.restore(); g.globalAlpha = 1;
    }
    // partículas y ondas
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vida++; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; p.rot += p.vr;
      const a = 1 - p.vida / p.max;
      if (a <= 0) { parts.splice(i, 1); continue; }
      g.globalAlpha = a; g.fillStyle = p.color;
      if (p.tipo === "confeti") { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2); g.restore(); }
      else if (p.tipo === "estrella") { estrella(g, p.x, p.y, p.tam * 1.6, p.tam * 0.6, 4); g.fill(); }
      else { if (p.tipo === "polvo") g.globalAlpha = a * 0.45; g.beginPath(); g.arc(p.x, p.y, p.tam * (p.tipo === "polvo" ? 1.4 : 1), 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
    for (let i = anillos.length - 1; i >= 0; i--) {
      const r = anillos[i];
      r.r += r.vel; r.vida -= 0.03;
      if (r.vida <= 0) { anillos.splice(i, 1); continue; }
      g.strokeStyle = mezcla(r.color, r.vida); g.lineWidth = r.ancho * r.vida;
      g.beginPath(); g.arc(r.x, r.y, r.r, 0, Math.PI * 2); g.stroke();
    }
    // destello
    if (st.flash > 0.01) { g.fillStyle = `rgba(255,255,255,${st.flash})`; g.fillRect(-20, -20, W + 40, H + 40); st.flash *= 0.86; }
    if (st.fase === "resumen" && !parts.length && !anillos.length && st.rayos < 0.02) { cancelAnimationFrame(raf); raf = 0; }
  }

  function pasar(fase) {
    st.fase = fase; st.tFase = (performance.now() - st.t0) / 1000;
    if (fase === "espera") {
      $("cofre-msg").textContent = st.nota ? st.nota + ". Toca para abrir" : "Toca para abrir";
      $("cofre-msg").classList.add("late");
    }
    if (fase === "cartas") { st.rayosY = $("cofre-zona").getBoundingClientRect().top + $("cofre-zona").offsetHeight / 2; siguienteCarta(); }
  }
  function estallar() {
    const c = centro();
    pasar("estalla");
    st.flash = 0.9; st.sacudida = 14; st.rayosMeta = 0.55;
    Juego.sonar("estalla");
    anillo(c.x, c.y - 20, "#FFFFFF", 16, 18); anillo(c.x, c.y - 20, st.colorRayos, 10, 11);
    chispas(70, c.x, c.y - 20, [st.colorRayos, "#FFFFFF", st.colorCofre], 1.3);
    chispas(24, c.x, c.y - 20, [st.colorRayos, "#FFFFFF"], 1, "estrella");
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }

  // ---------- cartas ----------
  function siguienteCarta() {
    st.i++;
    const zona = $("cofre-zona");
    const vieja = zona.querySelector(".carta3d");
    if (vieja) { vieja.classList.add("guarda"); setTimeout(() => vieja.remove(), 380); }
    if (st.i >= st.res.cartas.length) return resumen();
    const c = st.res.cartas[st.i], nivel = ORDEN_RAREZA.indexOf(c.item.rareza), color = RAREZAS[c.item.rareza].color;
    st.colorRayos = color; st.rayosMeta = 0.25 + nivel * 0.1;
    const k = document.createElement("div");
    k.className = "carta3d entra" + (nivel >= 2 ? " presagio" : "");
    k.style.setProperty("--r", color);
    const dorso = document.createElement("div"); dorso.className = "cara dorso";
    dorso.innerHTML = '<div class="dorso-marco"><img src="img/vortex_curioso.svg" alt=""><span>HOLA, VÓRTEX</span></div>';
    const frente = st.carta(c.item, {grande: true, nuevo: c.nuevo, polvo: c.polvo});
    frente.removeAttribute("id"); frente.classList.add("cara", "frente");
    k.append(dorso, frente);
    setTimeout(() => zona.append(k), vieja ? 200 : 0);
    st.volteada = false; st.bloqueo = true;
    setTimeout(() => { st.bloqueo = false; }, vieja ? 650 : 450);
    Juego.sonar("sale", nivel);
    const quedan = st.res.cartas.length - st.i;
    $("cofre-cuenta").textContent = `${st.i + 1} / ${st.res.cartas.length}`;
    $("cofre-msg").textContent = nivel >= 2 ? "¡Algo brilla mucho! Toca para darle la vuelta" : "Toca para darle la vuelta";
    if (quedan < 1) $("cofre-msg").textContent = "Toca para darle la vuelta";
  }
  function voltear() {
    const zona = $("cofre-zona"), k = zona.querySelector(".carta3d");
    if (!k) return;
    const c = st.res.cartas[st.i], nivel = ORDEN_RAREZA.indexOf(c.item.rareza), color = RAREZAS[c.item.rareza].color;
    k.classList.remove("presagio", "entra"); k.classList.add("volteada");
    st.volteada = true; st.bloqueo = true;
    Juego.sonar("voltea");
    setTimeout(() => {
      const r = k.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      Juego.sonar("revela", nivel);
      chispas(20 + nivel * 18, x, y, [color, "#FFFFFF"], 0.8 + nivel * 0.2);
      anillo(x, y, color, 8 + nivel * 3, 10 + nivel * 2);
      st.rayosMeta = 0.3 + nivel * 0.15;
      if (nivel >= 3) {
        st.flash = 0.7; st.sacudida = 10 + (nivel - 3) * 6;
        chispas(80, x, y - r.height * 0.4, nivel === 4 ? ["#FF7A9C", "#FFC247", "#9BE38D", "#5CE1E6", "#7B5CFF"] : ["#FFC247", "#FFF1B8", "#FFFFFF"], 1, "confeti");
        anillo(x, y, "#FFFFFF", 14, 20);
        try { if (navigator.vibrate) navigator.vibrate(nivel === 4 ? [60, 40, 60, 40, 200] : [40, 40, 140]); } catch (e) {}
        k.classList.add("epica");
      }
      if (c.nuevo) k.classList.add("es-nueva");
      st.pila.push(c);
      pintarPila();
    }, 260);
    setTimeout(() => { st.bloqueo = false; }, nivel >= 3 ? 900 : 550);
    const quedan = st.res.cartas.length - st.i - 1;
    $("cofre-msg").textContent = quedan ? `Toca para la siguiente (${quedan} más)` : "Toca para ver el resumen";
  }
  function pintarPila() {
    const p = $("cofre-pila"); p.textContent = "";
    for (const c of st.pila) {
      const m = document.createElement("span");
      m.style.setProperty("--r", RAREZAS[c.item.rareza].color);
      m.title = c.item.nombre;
      p.append(m);
    }
  }
  function resumen() {
    st.fase = "resumen"; st.rayosMeta = 0.18;
    $("cofre-saltar").hidden = true;
    $("cofre-zona").textContent = ""; $("cofre-cuenta").textContent = ""; $("cofre-pila").textContent = "";
    $("cofre-msg").textContent = ""; $("cofre-msg").classList.remove("late");
    st.alTerminar();
  }

  function tocar(e) {
    if (!st || e.target.closest("button") || st.bloqueo) return;
    if (st.fase === "espera") { pasar("carga"); $("cofre-msg").textContent = ""; $("cofre-msg").classList.remove("late"); Juego.sonar("carga"); return; }
    if (st.fase === "entra") return;
    if (st.fase === "cartas") { if (!st.volteada) voltear(); else siguienteCarta(); }
  }
  function saltar() {
    if (!st || st.fase === "resumen") return;
    st.pila = st.res.cartas.slice();
    resumen();
  }

  let listo = false;
  function preparar() {
    if (listo) return;
    listo = true;
    cv = $("cofre-fx"); g = cv.getContext("2d");
    medir(); addEventListener("resize", medir);
    $("cofre").addEventListener("pointerup", tocar);
    $("cofre").addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tocar(e); } });
    $("cofre-saltar").addEventListener("click", saltar);
  }

  // res = resultado de Progreso.abrirCofre; carta(item, opc) pinta una carta; alTerminar() enseña el resumen
  function abrir(res, {nota, carta, alTerminar}) {
    preparar(); medir();
    parts.length = 0; anillos.length = 0;
    const mejor = res.cartas.reduce((m, c) => Math.max(m, ORDEN_RAREZA.indexOf(c.item.rareza)), 0);
    st = {res, nota, carta, alTerminar, t0: performance.now(), tFase: 0, fase: "entra", i: -1, pila: [], sacudida: 0, flash: 0,
          rayos: 0, rayosMeta: 0, colorCofre: COFRES[res.cofre].color, colorRayos: RAREZAS[ORDEN_RAREZA[mejor]].color,
          aterrizo: false, bloqueo: false, volteada: false};
    $("cofre-nombre").textContent = COFRES[res.cofre].nombre;
    $("cofre-cuenta").textContent = ""; $("cofre-pila").textContent = ""; $("cofre-zona").textContent = "";
    $("cofre-msg").textContent = ""; $("cofre-saltar").hidden = false;
    if (!raf) raf = requestAnimationFrame(dibujar);
    $("cofre").focus({preventScroll: true});
  }
  function cerrar() { st = null; if (raf) cancelAnimationFrame(raf); raf = 0; parts.length = 0; anillos.length = 0; }

  return {abrir, cerrar, imagen, pintar};
})();
