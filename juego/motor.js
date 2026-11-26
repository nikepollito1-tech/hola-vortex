"use strict";
// Motor del juego. Pensado para móviles: todo lo caro (degradados, SVG de Vórtex, estrellas, galaxias) se pinta UNA vez
// en lienzos auxiliares y en cada fotograma solo se copian imágenes. Si el móvil no llega a 50 fps, baja la resolución sola.
const C = {void: "#0A0A1F", indigo: "#1B1747", violet: "#7B5CFF", amber: "#FFC247", cyan: "#5CE1E6", moon: "#F4F1FF", coral: "#FF7A9C", tinta: "#08071A"};
const qs = new URLSearchParams(location.search);
const DEMO = qs.has("demo"), GRABAR = qs.has("grabar"), CLAVE = qs.get("clave") || "";
if (DEMO) document.body.classList.add("demo");
const $ = (id) => document.getElementById(id);
const HABS = typeof HABILIDADES !== "undefined" ? HABILIDADES : [], PIELES = typeof SKINS !== "undefined" ? SKINS : {};
const cv = $("lienzo"), ctx = cv.getContext("2d", {alpha: false});
if (!CanvasRenderingContext2D.prototype.roundRect) {          // Safari antiguo
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
  };
}

let W = 0, H = 0, DPR = 1, MIN = 0, dprMax = Math.min(2, window.devicePixelRatio || 1);
let fondoCv = null, capas = [], pendiente = true;
const lienzoAux = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

// ---------- utilidades ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (l) => l[(Math.random() * l.length) | 0];
const fmt = (n) => Math.round(n).toLocaleString("es-ES");
const suave = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const TAU = 6.2832;

function ajustar() {
  if (DEMO) { W = 1080; H = 1920; DPR = 1; }
  else { DPR = dprMax; W = innerWidth; H = innerHeight; }
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  MIN = Math.min(W, H);
  prepararFondo(); pendiente = true;
}
function prepararFondo() {
  const w = cv.width, h = cv.height;
  fondoCv = lienzoAux(w, h);
  const g = fondoCv.getContext("2d"), gr = g.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.hypot(w, h) * 0.65);
  gr.addColorStop(0, C.indigo); gr.addColorStop(1, C.void); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  capas = [0.07, 0.2].map((z, i) => {
    const c = lienzoAux(w, h), x = c.getContext("2d");
    x.fillStyle = C.moon;
    for (let k = 0; k < 75; k++) {
      x.globalAlpha = rnd(0.3, 1);
      x.beginPath(); x.arc(Math.random() * w, Math.random() * h, rnd(0.4, i ? 1.9 : 1.2) * (DEMO ? 1.6 : 1) * DPR, 0, TAU); x.fill();
    }
    return {cv: c, z};
  });
}
addEventListener("resize", ajustar);

// ---------- sonido (sonido.js) ----------
function icono() {
  $("sonido").innerHTML = Sonido.activo
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="#F4F1FF" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="#F4F1FF" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
}
icono();
$("sonido").addEventListener("click", () => {
  const encender = !Sonido.activo;
  Sonido.poner("efectos", encender); Sonido.poner("musica", encender); icono();
});
function sonar(tipo, tam = 1) { if (!DEMO) Sonido.efecto(tipo, tam); }

// ---------- cosas que flotan por el espacio ----------
const TIPOS = {
  meteorito:  {puntos: 1,  uno: "un meteorito",       varios: "meteoritos"},
  satelite:   {puntos: 2,  uno: "un satélite",        varios: "satélites"},
  astronauta: {puntos: 3,  uno: "un astronauta",      varios: "astronautas"},
  tostadora:  {puntos: 4,  uno: "una tostadora",      varios: "tostadoras"},
  luna:       {puntos: 6,  uno: "una luna",           varios: "lunas"},
  planeta:    {puntos: 10, uno: "un planeta",         varios: "planetas"},
  gigante:    {puntos: 20, uno: "un gigante gaseoso", varios: "gigantes gaseosos"},
  estrella:   {puntos: 40, uno: "una estrella",       varios: "estrellas"},
  galaxia:    {puntos: 80, uno: "una galaxia entera", varios: "galaxias"},
};
const ORDEN = Object.keys(TIPOS);
const FRASES = {
  satelite: "¡Ñam, wifi gratis!", astronauta: "Perdón, señor astronauta", tostadora: "¿Una tostadora? Pues vale",
  luna: "¡Una luna de postre!", planeta: "¡Un planeta entero!", gigante: "Esto llena…", estrella: "¡Picante!",
  galaxia: "¡UNA GALAXIA!",
};
function tipoPara(s) {
  if (s < 8) return "meteorito";
  if (s < 16) return elegir(["satelite", "astronauta", "tostadora", "meteorito", "satelite"]);
  if (s < 32) return "luna";
  if (s < 65) return "planeta";
  if (s < 130) return "gigante";
  if (s < 260) return "estrella";
  return "galaxia";
}
const COLORES_PLANETA = [["#FF7A9C", "#8F3B66"], ["#5CE1E6", "#1F6E86"], ["#7B5CFF", "#3A2A99"], ["#9BE38D", "#2E7D4F"], ["#E8B07A", "#8A4E2B"]];
const VARIANTES = {meteorito: 3, planeta: 5, gigante: 2};

function destello(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r);
  g.quadraticCurveTo(x + r * 0.1, y - r * 0.1, x + r, y); g.quadraticCurveTo(x + r * 0.1, y + r * 0.1, x, y + r);
  g.quadraticCurveTo(x - r * 0.1, y + r * 0.1, x - r, y); g.quadraticCurveTo(x - r * 0.1, y - r * 0.1, x, y - r); g.fill();
}
// Pinta un objeto de radio s centrado en el origen. Solo se llama al crear cada imagen, nunca en cada fotograma.
function pintarTipo(g, tipo, s, va) {
  if (window.TresD && TresD.objeto(g, tipo, s, va)) return;
  switch (tipo) {
    case "meteorito": {
      const semilla = va * 37.3 + 1;
      g.fillStyle = "#8C87A8"; g.beginPath();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = s * (0.72 + 0.28 * Math.abs(Math.sin(semilla + k * 1.7))); k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.fillStyle = "#615C80";
      g.beginPath(); g.arc(s * 0.2, -s * 0.15, s * 0.22, 0, TAU); g.arc(-s * 0.3, s * 0.25, s * 0.14, 0, TAU); g.fill(); break;
    }
    case "satelite": {
      g.fillStyle = "#5B45E0"; g.fillRect(-s * 1.15, -s * 0.28, s * 0.62, s * 0.56); g.fillRect(s * 0.53, -s * 0.28, s * 0.62, s * 0.56);
      g.strokeStyle = "#9A88FF"; g.lineWidth = s * 0.06; g.strokeRect(-s * 1.15, -s * 0.28, s * 0.62, s * 0.56); g.strokeRect(s * 0.53, -s * 0.28, s * 0.62, s * 0.56);
      g.fillStyle = "#E8E4FA"; g.fillRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
      g.fillStyle = C.amber; g.beginPath(); g.arc(0, -s * 0.62, s * 0.14, 0, TAU); g.fill(); break;
    }
    case "astronauta": {
      g.fillStyle = "#F4F1FF"; g.beginPath(); g.roundRect(-s * 0.45, -s * 0.1, s * 0.9, s * 0.95, s * 0.25); g.fill();
      g.beginPath(); g.roundRect(-s * 0.85, 0, s * 0.42, s * 0.22, s * 0.11); g.roundRect(s * 0.43, 0, s * 0.42, s * 0.22, s * 0.11); g.fill();
      g.beginPath(); g.arc(0, -s * 0.45, s * 0.5, 0, TAU); g.fill();
      g.fillStyle = C.tinta; g.beginPath(); g.ellipse(0, -s * 0.45, s * 0.34, s * 0.26, 0, 0, TAU); g.fill();
      g.fillStyle = C.cyan; g.beginPath(); g.ellipse(s * 0.12, -s * 0.52, s * 0.09, s * 0.05, -0.5, 0, TAU); g.fill(); break;
    }
    case "tostadora": {
      g.fillStyle = "#D8A15C"; g.beginPath(); g.roundRect(-s * 0.5, -s * 0.85, s * 0.38, s * 0.5, s * 0.08); g.roundRect(s * 0.12, -s * 0.85, s * 0.38, s * 0.5, s * 0.08); g.fill();
      g.fillStyle = "#CFC9EC"; g.beginPath(); g.roundRect(-s * 0.85, -s * 0.5, s * 1.7, s * 1.1, s * 0.3); g.fill();
      g.fillStyle = C.tinta; g.fillRect(-s * 0.5, -s * 0.5, s * 0.38, s * 0.1); g.fillRect(s * 0.12, -s * 0.5, s * 0.38, s * 0.1);
      g.fillStyle = C.coral; g.fillRect(s * 0.6, -s * 0.1, s * 0.3, s * 0.12); break;
    }
    case "luna": {
      g.fillStyle = "#CFCBE0"; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
      g.fillStyle = "#A9A4C2"; g.beginPath(); g.arc(s * 0.3, -s * 0.2, s * 0.25, 0, TAU); g.arc(-s * 0.35, s * 0.3, s * 0.18, 0, TAU); g.arc(-s * 0.2, -s * 0.45, s * 0.12, 0, TAU); g.fill(); break;
    }
    case "planeta": case "gigante": {
      const gig = tipo === "gigante", anillo = gig && va === 1;
      const [c1, c2] = gig ? [C.amber, "#B3622E"] : COLORES_PLANETA[va % COLORES_PLANETA.length];
      if (anillo) { g.strokeStyle = "rgba(244,241,255,.55)"; g.lineWidth = s * 0.12; g.beginPath(); g.ellipse(0, 0, s * 1.65, s * 0.42, 0, Math.PI, TAU); g.stroke(); }
      const gr = g.createRadialGradient(-s * 0.35, -s * 0.35, s * 0.1, 0, 0, s); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
      if (gig) {
        g.save(); g.clip(); g.fillStyle = "rgba(255,122,156,.35)";
        for (const b of [-0.5, -0.1, 0.35]) g.fillRect(-s, b * s, s * 2, s * 0.16); g.restore();
        if (anillo) { g.strokeStyle = "rgba(244,241,255,.55)"; g.lineWidth = s * 0.12; g.beginPath(); g.ellipse(0, 0, s * 1.65, s * 0.42, 0, 0, Math.PI); g.stroke(); }
      }
      break;
    }
    case "estrella": {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.5); gr.addColorStop(0, "#FFF6D8"); gr.addColorStop(0.45, C.amber); gr.addColorStop(1, "rgba(255,194,71,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s * 1.5, 0, TAU); g.fill(); destello(g, 0, 0, s * 1.6, "rgba(255,246,216,.8)"); break;
    }
    case "galaxia": {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.2); gr.addColorStop(0, "#FFF0D0"); gr.addColorStop(0.3, "rgba(123,92,255,.7)"); gr.addColorStop(1, "rgba(123,92,255,0)");
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s * 1.2, s * 0.75, 0, 0, TAU); g.fill();
      g.fillStyle = C.moon; g.globalAlpha = 0.7;
      for (let k = 0; k < 70; k++) { const a = k * 0.25, rr = s * 0.08 * a; for (const sg of [0, Math.PI]) { g.beginPath(); g.arc(Math.cos(a + sg) * rr, Math.sin(a + sg) * rr * 0.62, s * 0.025, 0, TAU); g.fill(); } }
      g.globalAlpha = 1; break;
    }
  }
}
// Imágenes ya pintadas: una por tipo y variante. EXT = cuánto sobresale el dibujo del radio (anillos, halos).
const REF = DEMO ? 210 : 88, EXT = 1.75, SPR = {};
function sprite(tipo, va) {
  const k = tipo + va;
  if (!SPR[k]) { const t = Math.ceil(REF * EXT * 2), c = lienzoAux(t, t), g = c.getContext("2d"); g.translate(t / 2, t / 2); pintarTipo(g, tipo, REF, va); SPR[k] = c; }
  return SPR[k];
}
function spriteMejora(id) {
  const k = "m:" + id;
  if (!SPR[k]) {
    const h = HABS.find((x) => x.id === id) || {color: C.amber, icono: "?"};
    const t = Math.ceil(REF * EXT * 2), c = lienzoAux(t, t), g = c.getContext("2d"); g.translate(t / 2, t / 2);
    const gr = g.createRadialGradient(0, 0, REF * 0.2, 0, 0, REF * 1.6); gr.addColorStop(0, h.color); gr.addColorStop(0.55, h.color + "55"); gr.addColorStop(1, h.color + "00");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, REF * 1.6, 0, TAU); g.fill();
    g.fillStyle = "#14113A"; g.beginPath(); g.arc(0, 0, REF, 0, TAU); g.fill();
    g.strokeStyle = h.color; g.lineWidth = REF * 0.14; g.stroke();
    if (window.TresD) TresD.mejora(g, id, REF);
    g.font = `${Math.round(REF * 1.05)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(h.icono, 0, REF * 0.06);
    SPR[k] = c;
  }
  return SPR[k];
}

// ---------- Vórtex: los SVG del canal, recoloreados según la skin y convertidos a imagen una sola vez ----------
const NOMBRES_CARA = ["curioso", "sorprendido", "picaro", "hambriento"], SVG_TXT = {}, SKIN_BMP = {};
const IMG_K = 700 / 289;      // en el SVG el anillo exterior mide 289 de radio sobre un lienzo de 700
const VT = DEMO ? 900 : 384;
function recolorear(txt, pal) {
  txt = txt.replace("<svg ", `<svg width="${VT}" height="${VT}" `);
  if (!pal || !pal.anillo) return txt;
  const paradas = (l) => l.map((col, i) => `<stop offset="${l.length > 1 ? i / (l.length - 1) : 0}" stop-color="${col}"></stop>`).join("");
  txt = txt.replace(/(<linearGradient[^>]*>)(.*?)(<\/linearGradient>)/, (m, a, b, c) => a + paradas(pal.anillo) + c);
  if (pal.cuerpo) txt = txt.replace(/(<radialGradient[^>]*>)(.*?)(<\/radialGradient>)/, (m, a, b, c) => a + paradas(pal.cuerpo) + c);
  return txt.replace(/stroke="#FFA63D"/g, `stroke="${pal.brillo}"`).replace(/stroke="#FFF3C9"/g, `stroke="${pal.luz}"`);
}
async function svgCara(cara) {
  if (!SVG_TXT[cara]) SVG_TXT[cara] = await (await fetch(`img/vortex_${cara}.svg`)).text();
  return SVG_TXT[cara];
}
async function urlCara(skin, cara) {
  if (window.SIN_SERVIDOR) return skin === "clasico" ? `img3d/${cara}.webp` : `img3d/${skin}-${cara}.webp`;
  const pal = PIELES[skin];
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(recolorear(await svgCara(cara), pal));
}
async function cargarSkin(id) {
  if (SKIN_BMP[id]) return;
  const out = {};
  await Promise.all(NOMBRES_CARA.map(async (cara) => {
    try {
      const img = new Image();
      const url = await urlCara(id, cara);
      await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = url; });
      if (img.naturalWidth) { const c = lienzoAux(VT, VT); c.getContext("2d").drawImage(img, 0, 0, VT, VT); out[cara] = c; }
    } catch (e) {}
  }));
  SKIN_BMP[id] = out; pendiente = true;
}

// ---------- configuración de la partida (la pone el metajuego: nivel, skin, estela, control) ----------
let CFG = {habilidades: [], comboMax: 3, skin: "clasico", estela: "ninguna", control: "joystick"};
function configurar(c) { CFG = Object.assign({}, CFG, c); }

// ---------- estado ----------
let p, objetos, comiendo, particulas, textos, mejoras, ondas, rastro, fx, cam, zoom, tiempo, puntos, combo, ultimoComer, comidos, mayor,
    temblor, jugando = false, token, vistos, st, proxMejora, rastroT, reloj = 0, duracion = 60, racha = 0, proxCrece = 0, crecidas = 0, ultimoTic = 0;

function reiniciar() {
  p = {x: 0, y: 0, vx: 0, vy: 0, r: 18, inv: 0, cara: "curioso", caraT: 0, escudo: false};
  objetos = []; comiendo = []; particulas = []; textos = []; mejoras = []; ondas = []; rastro = [];
  fx = {iman: 0, frenesi: 0};
  cam = {x: 0, y: 0}; zoom = zoomObjetivo();
  tiempo = 60; duracion = 60; puntos = 0; combo = 1; ultimoComer = -9; comidos = {}; mayor = -1; temblor = 0; vistos = new Set();
  st = {golpes: 0, combos: 0, mejoras: 0}; proxMejora = rnd(3.5, 6); rastroT = 0; racha = 0; crecidas = 0; ultimoTic = 0;
  for (let i = 0; i < 34; i++) crear(true);
}
function zoomObjetivo() { return (MIN * 0.075 / 18) * Math.pow(18 / p.r, 0.72); }
function radioVista() { return Math.hypot(W, H) / 2 / zoom; }

function crear(dentro) {
  const vr = radioVista(), ang = rnd(0, TAU);
  const dist = dentro ? rnd(p.r * 5, vr) : vr * rnd(1.05, 1.4);
  const s = p.r * Math.pow(10, rnd(-0.85, 0.4));
  const x = p.x + Math.cos(ang) * dist, y = p.y + Math.sin(ang) * dist;
  // la mitad viaja más o menos hacia Vórtex, para que haya encuentros
  const haciaJugador = Math.atan2(p.y - y, p.x - x) + rnd(-0.9, 0.9);
  const dir = Math.random() < (s < p.r * 0.85 ? 0.65 : 0.3) ? haciaJugador : rnd(0, TAU);
  const vel = rnd(0.025, 0.075) * MIN / zoom, tipo = tipoPara(s);
  objetos.push({x, y, s, tipo, va: (Math.random() * (VARIANTES[tipo] || 1)) | 0, vx: Math.cos(dir) * vel, vy: Math.sin(dir) * vel, rot: rnd(0, TAU), vr: rnd(-1, 1)});
}

// ---------- control ----------
// En móvil, «joystick»: se arrastra desde donde se apoye el dedo, así el dedo no tapa a Vórtex. Con ratón, Vórtex sigue al cursor.
let dedo = null, joy = null;
function aPantalla(ev) {
  if (!DEMO) return {x: ev.clientX, y: ev.clientY};
  const r = cv.getBoundingClientRect();
  return {x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height)};
}
cv.addEventListener("pointerdown", (e) => { dedo = aPantalla(e); if (e.pointerType !== "mouse") joy = {ox: dedo.x, oy: dedo.y, x: dedo.x, y: dedo.y}; }, {passive: true});
cv.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" && !dedo) return;
  dedo = aPantalla(e); if (joy) { joy.x = dedo.x; joy.y = dedo.y; }
}, {passive: true});
addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") { dedo = null; joy = null; } }, {passive: true});
addEventListener("pointercancel", () => { dedo = null; joy = null; }, {passive: true});

// ---------- piloto automático (solo para grabar vídeos de demostración) ----------
let rumbo = 0;
function piloto() {
  let mejor = null, mejorV = 0, hx = 0, hy = 0;
  for (const o of objetos) {
    const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (o.s < p.r * 0.8) { const v = o.s * o.s / d; if (v > mejorV) { mejorV = v; mejor = o; } }
    else { const peligro = p.r * 1.4 + o.s * 1.1 - d; if (peligro > 0) { hx -= dx / d * peligro; hy -= dy / d * peligro; } }
  }
  for (const m of mejoras) { const d = Math.hypot(m.x - p.x, m.y - p.y) || 1, v = p.r * p.r * 3 / d; if (v > mejorV) { mejorV = v; mejor = m; } }
  let ox, oy;
  if (mejor) { const d = Math.hypot(mejor.x - p.x, mejor.y - p.y) || 1; ox = (mejor.x - p.x) / d; oy = (mejor.y - p.y) / d; }
  else { rumbo += 0.02; ox = Math.cos(rumbo); oy = Math.sin(rumbo); }
  const h = Math.hypot(hx, hy);
  if (h > 0) { ox += hx / h * Math.min(3, h / p.r); oy += hy / h * Math.min(3, h / p.r); }
  const n = Math.hypot(ox, oy) || 1;
  return {x: W / 2 + ox / n * MIN * 0.35, y: H / 2 + oy / n * MIN * 0.35};
}

// ---------- lógica ----------
function chispas(n, cols) {
  for (let i = 0; i < n && particulas.length < 60; i++) {
    const a = rnd(0, TAU), sp = rnd(0.1, 0.4) * MIN / zoom;
    particulas.push({x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vida: rnd(0.4, 0.8), col: elegir(cols), t: rnd(2, 5) / zoom});
  }
}
function golpe(o) {
  const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1, v = 0.5 * MIN / zoom;
  p.vx = dx / d * v; p.vy = dy / d * v;
  if (p.escudo) {
    p.escudo = false; p.inv = 1; temblor = 0.18;
    chispas(12, [C.cyan, C.moon]); texto(p.x, p.y - p.r * 1.6, "¡Escudo!", C.cyan); sonar("escudoRoto");
    return;
  }
  st.golpes++;
  p.r = Math.max(14, p.r * 0.85); p.inv = 1.5; temblor = 0.35; combo = 1; racha = 0; proxCrece = p.r * 1.45;
  ponerCara("sorprendido", 1.1);
  chispas(18, [C.amber, C.coral, C.moon]);
  texto(p.x, p.y - p.r * 1.6, "¡Ay!", C.coral);
  sonar("golpe");
  if (navigator.vibrate && !DEMO) try { navigator.vibrate(60); } catch (e) {}
}
function comer(o, ahora, callado) {
  const antes = combo;
  racha = (ahora - ultimoComer < 1.3) ? racha + 1 : 0;           // cada bocado seguido suena una nota más alta
  combo = (ahora - ultimoComer < 1.3) ? Math.min(CFG.comboMax, combo + 1) : 1;
  if (!callado && combo > antes && combo > 1) sonar(combo === CFG.comboMax ? "comboMax" : "combo", combo);
  if (combo === CFG.comboMax && antes < CFG.comboMax) st.combos++;
  ultimoComer = ahora;
  const gana = TIPOS[o.tipo].puntos * combo * (fx.frenesi > 0 ? 2 : 1);
  puntos += gana;
  p.r = Math.min(320, Math.sqrt(p.r * p.r + 0.9 * o.s * o.s));   // techo: a partir de aquí ya solo caben galaxias pequeñas
  if (!proxCrece) proxCrece = p.r * 1.45;
  if (p.r >= proxCrece) { proxCrece = p.r * 1.45; crecidas++; sonar("crece", Math.min(7, crecidas)); ponerCara("hambriento", 0.6); }
  comidos[o.tipo] = (comidos[o.tipo] || 0) + 1;
  mayor = Math.max(mayor, ORDEN.indexOf(o.tipo));
  if (comiendo.length < 40) comiendo.push({o, t: 0, x0: o.x, y0: o.y});
  if (!callado || textos.length < 6) texto(o.x, o.y, "+" + gana + (combo > 1 ? " ×" + combo : ""), combo > 1 || fx.frenesi > 0 ? C.amber : C.moon);
  if (FRASES[o.tipo] && !vistos.has(o.tipo)) { vistos.add(o.tipo); texto(p.x, p.y - p.r * 2.2, FRASES[o.tipo], C.cyan, 1.6); }
  ponerCara("picaro", 0.5);
  if (!callado) sonar("glup", {tam: o.s / 10, paso: racha, grande: o.tipo === "estrella" || o.tipo === "galaxia"});
}
function usarMejora(m, ahora) {
  st.mejoras++;
  const h = HABS.find((x) => x.id === m.tipo) || {nombre: m.tipo, color: C.amber};
  texto(p.x, p.y - p.r * 2.2, h.nombre.toUpperCase() + (m.tipo === "reloj" ? " +5 s" : ""), h.color, 1.5);
  sonar(["iman", "escudo", "frenesi", "reloj", "supernova"].includes(m.tipo) ? m.tipo : "mejora"); ponerCara("sorprendido", 0.6);
  if (m.tipo === "iman") fx.iman = 6;
  else if (m.tipo === "frenesi") fx.frenesi = 6;
  else if (m.tipo === "escudo") p.escudo = true;
  else if (m.tipo === "reloj") { tiempo += 5; duracion += 5; }
  else if (m.tipo === "supernova") {
    const vr = radioVista() * 0.95;
    ondas.push({x: p.x, y: p.y, r: p.r, max: vr, t: 0});
    temblor = 0.3;
    for (let i = objetos.length - 1; i >= 0; i--) {
      const o = objetos[i];
      if (o.s < p.r * 0.85 && Math.hypot(o.x - p.x, o.y - p.y) < vr) { objetos[i] = objetos[objetos.length - 1]; objetos.pop(); comer(o, ahora, true); }
    }
  }
}
function ponerCara(c, t) { p.cara = c; p.caraT = t; }
function texto(x, y, txt, col, vida = 0.9) { if (textos.length < 14) textos.push({x, y, txt, col, vida, total: vida}); }

const COL_ARCO = ["#FF7A9C", "#FFC247", "#9BE38D", "#5CE1E6", "#7B5CFF"];
function actualizar(dt, ahora) {
  reloj = ahora; tiempo -= dt;
  if (!DEMO) {
    const seg = Math.ceil(tiempo);
    if (seg <= 5 && seg > 0 && seg !== ultimoTic) { ultimoTic = seg; sonar("tic", seg); }
    Sonido.intensidad = tiempo < 15 ? (15 - tiempo) / 15 : 0;
  }
  // dirección y fuerza (0 a 1) del movimiento
  let dx = 0, dy = 0, d = 0, fuerza = 0;
  if (DEMO) { const o = piloto(); dx = o.x - W / 2; dy = o.y - H / 2; d = Math.hypot(dx, dy); fuerza = Math.min(1, d / (MIN * 0.22)); }
  else if (joy && CFG.control === "joystick") {
    const JR = Math.max(44, MIN * 0.12);
    dx = joy.x - joy.ox; dy = joy.y - joy.oy; d = Math.hypot(dx, dy); fuerza = Math.min(1, d / JR);
    if (d > JR * 1.4) { joy.ox = joy.x - dx / d * JR * 1.4; joy.oy = joy.y - dy / d * JR * 1.4; }     // la base sigue al dedo: girar es inmediato
  } else if (dedo) { dx = dedo.x - W / 2; dy = dedo.y - H / 2; d = Math.hypot(dx, dy); fuerza = Math.min(1, d / (MIN * 0.22)); }
  if (fuerza > 0.05 && d > 0) {
    const vel = fuerza * MIN * 0.6 / zoom, k = Math.min(1, dt * 9);
    p.vx += (dx / d * vel - p.vx) * k; p.vy += (dy / d * vel - p.vy) * k;
  } else { const f = Math.pow(0.05, dt); p.vx *= f; p.vy *= f; }
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.inv = Math.max(0, p.inv - dt); temblor = Math.max(0, temblor - dt);
  p.caraT -= dt; fx.iman = Math.max(0, fx.iman - dt); fx.frenesi = Math.max(0, fx.frenesi - dt);
  zoom += (zoomObjetivo() - zoom) * Math.min(1, dt * 2.5);
  cam.x = p.x; cam.y = p.y;

  const vr = radioVista(), lejos = vr * 1.8, iman = fx.iman > 0 ? p.r * 7 : 0, tiron = 0.55 * MIN / zoom * dt;
  let cerca = false;
  for (let i = objetos.length - 1; i >= 0; i--) {
    const o = objetos[i];
    o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
    const ex = o.x - p.x, ey = o.y - p.y, dist = Math.sqrt(ex * ex + ey * ey);
    if (dist > lejos) { objetos[i] = objetos[objetos.length - 1]; objetos.pop(); continue; }
    if (o.s < p.r * 0.85) {
      if (iman && dist < iman && dist > 1) { o.x -= ex / dist * tiron; o.y -= ey / dist * tiron; }
      if (dist < p.r * 2.2) cerca = true;
      if (dist < p.r - o.s * 0.25) { objetos[i] = objetos[objetos.length - 1]; objetos.pop(); comer(o, ahora); }
    } else if (p.inv <= 0 && dist < p.r * 0.8 + o.s * 0.75) { golpe(o); }
  }
  while (objetos.length < 48) crear(false);
  if (p.caraT <= 0) p.cara = cerca ? "hambriento" : "curioso";

  // habilidades que flotan (solo las desbloqueadas por nivel)
  proxMejora -= dt;
  if (proxMejora <= 0 && CFG.habilidades.length && mejoras.length < 2 && tiempo > 6) {
    const opciones = CFG.habilidades.filter((h) => !(h === "escudo" && p.escudo));
    if (opciones.length) { const a = rnd(0, TAU), dist = vr * rnd(0.35, 0.65); mejoras.push({x: p.x + Math.cos(a) * dist, y: p.y + Math.sin(a) * dist, tipo: elegir(opciones), vida: 11, fase: rnd(0, 6)}); }
    proxMejora = rnd(6, 9);
  }
  for (let i = mejoras.length - 1; i >= 0; i--) {
    const m = mejoras[i]; m.vida -= dt; m.fase += dt * 3;
    const dist = Math.hypot(m.x - p.x, m.y - p.y);
    if (dist < p.r * 1.55) { mejoras.splice(i, 1); usarMejora(m, ahora); }
    else if (m.vida <= 0 || dist > lejos) mejoras.splice(i, 1);
  }

  // estela (solo adorno)
  if (CFG.estela !== "ninguna") {
    rastroT += dt;
    if (rastroT > 0.04 && (p.vx * p.vx + p.vy * p.vy) > 1) {
      rastroT = 0;
      const col = CFG.estela === "arcoiris" ? COL_ARCO[(ahora * 6 | 0) % COL_ARCO.length] : CFG.estela === "cometa" ? C.cyan : elegir([C.amber, C.moon]);
      const j = CFG.estela === "polvo" ? p.r * 0.7 : 0;
      rastro.push({x: p.x + rnd(-j, j), y: p.y + rnd(-j, j), vida: 0.55, col});
      if (rastro.length > 26) rastro.shift();
    }
    for (let i = rastro.length - 1; i >= 0; i--) { rastro[i].vida -= dt; if (rastro[i].vida <= 0) rastro.splice(i, 1); }
  }

  for (let i = comiendo.length - 1; i >= 0; i--) { comiendo[i].t += dt / 0.28; if (comiendo[i].t >= 1) comiendo.splice(i, 1); }
  for (let i = ondas.length - 1; i >= 0; i--) { ondas[i].t += dt / 0.5; if (ondas[i].t >= 1) ondas.splice(i, 1); }
  for (let i = particulas.length - 1; i >= 0; i--) {
    const q = particulas[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vida -= dt; if (q.vida <= 0) { particulas[i] = particulas[particulas.length - 1]; particulas.pop(); }
  }
  for (let i = textos.length - 1; i >= 0; i--) { textos[i].vida -= dt; textos[i].y -= dt * 0.06 * MIN / zoom; if (textos[i].vida <= 0) textos.splice(i, 1); }
}

// ---------- dibujo ----------
function fondo() {
  const w = cv.width, h = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(fondoCv, 0, 0);
  for (const c of capas) {
    let ox = Math.round((-cam.x * zoom * c.z * DPR) % w), oy = Math.round((-cam.y * zoom * c.z * DPR) % h);
    if (ox < 0) ox += w; if (oy < 0) oy += h;
    ctx.drawImage(c.cv, ox - w, oy - h); ctx.drawImage(c.cv, ox, oy - h); ctx.drawImage(c.cv, ox - w, oy); ctx.drawImage(c.cv, ox, oy);
  }
}
function hud() {
  const pad = DEMO ? 60 : 16, top = DEMO ? 150 : 14;
  const f = Math.max(0, Math.min(1, tiempo / duracion));
  ctx.fillStyle = "rgba(244,241,255,.15)"; ctx.beginPath(); ctx.roundRect(pad, top, W - pad * 2, DEMO ? 18 : 8, 9); ctx.fill();
  ctx.fillStyle = tiempo < 10 ? C.coral : C.amber; ctx.beginPath(); ctx.roundRect(pad, top, (W - pad * 2) * f, DEMO ? 18 : 8, 9); ctx.fill();
  const t1 = DEMO ? 84 : Math.min(40, W * 0.09);
  ctx.font = `800 ${t1}px Unbounded, sans-serif`; ctx.textBaseline = "top"; ctx.textAlign = "left";
  ctx.lineWidth = t1 * 0.16; ctx.strokeStyle = C.tinta; ctx.strokeText(fmt(puntos), pad, top + t1 * 0.5);
  ctx.fillStyle = C.moon; ctx.fillText(fmt(puntos), pad, top + t1 * 0.5);
  ctx.textAlign = "right"; ctx.font = `700 ${t1 * 0.55}px Sora, sans-serif`;
  ctx.fillStyle = "#B9B4D9"; ctx.fillText(Math.ceil(Math.max(0, tiempo)) + " s", W - pad - (DEMO ? 0 : 56), top + t1 * 0.62);
  // efectos activos
  let y = top + t1 * 1.75; ctx.textAlign = "left"; ctx.font = `700 ${t1 * 0.42}px Sora, sans-serif`; ctx.lineWidth = t1 * 0.1;
  const efecto = (txt, col) => { ctx.strokeText(txt, pad, y); ctx.fillStyle = col; ctx.fillText(txt, pad, y); y += t1 * 0.56; };
  if (fx.frenesi > 0) efecto("FRENESÍ ×2 · " + Math.ceil(fx.frenesi), C.amber);
  if (fx.iman > 0) efecto("IMÁN · " + Math.ceil(fx.iman), C.coral);
  if (p.escudo) efecto("ESCUDO", C.cyan);
  if (combo > 1 && reloj - ultimoComer < 1.3) {
    ctx.font = `800 ${t1 * 0.8}px Unbounded, sans-serif`; ctx.fillStyle = C.amber; ctx.textAlign = "center"; ctx.lineWidth = t1 * 0.16;
    ctx.strokeText("COMBO ×" + combo, W / 2, top + t1 * 1.9); ctx.fillText("COMBO ×" + combo, W / 2, top + t1 * 1.9);
  }
  if (duracion - tiempo < 3.5 && !DEMO) {
    const aviso = CFG.control === "joystick" ? "Arrastra el dedo para moverte" : "Trágate lo pequeño · esquiva lo grande";
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, (duracion - tiempo) - 2.5));
    ctx.font = `700 ${Math.min(20, W * 0.045)}px Sora, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.lineWidth = 6; ctx.strokeText(aviso, W / 2, H - 40);
    ctx.fillStyle = C.moon; ctx.fillText(aviso, W / 2, H - 40); ctx.globalAlpha = 1;
  }
  if (joy && !DEMO && CFG.control === "joystick" && jugando) {       // la palanca, muy discreta
    const JR = Math.max(44, MIN * 0.12);
    ctx.globalAlpha = 0.22; ctx.strokeStyle = C.moon; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, JR, 0, TAU); ctx.stroke();
    ctx.fillStyle = C.moon; ctx.beginPath(); ctx.arc(joy.x, joy.y, JR * 0.36, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  if (DEMO && !jugando && tiempo <= 0) {
    ctx.fillStyle = "rgba(10,10,31,.6)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 16; ctx.strokeStyle = C.tinta;
    ctx.font = "800 150px Unbounded, sans-serif"; ctx.strokeText(fmt(puntos), W / 2, H * 0.42); ctx.fillStyle = C.amber; ctx.fillText(fmt(puntos), W / 2, H * 0.42);
    ctx.font = "800 60px Unbounded, sans-serif"; ctx.strokeText("puntos", W / 2, H * 0.42 + 120); ctx.fillStyle = C.moon; ctx.fillText("puntos", W / 2, H * 0.42 + 120);
  }
  if (DEMO) {
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "800 64px Unbounded, sans-serif"; ctx.lineWidth = 12; ctx.strokeStyle = C.tinta;
    ctx.strokeText("¿Superas a Vórtex?", W / 2, H - 230); ctx.fillStyle = C.amber; ctx.fillText("¿Superas a Vórtex?", W / 2, H - 230);
    ctx.font = "700 40px Sora, sans-serif"; ctx.strokeText("Juega gratis · enlace en el perfil", W / 2, H - 160);
    ctx.fillStyle = C.moon; ctx.fillText("Juega gratis · enlace en el perfil", W / 2, H - 160);
  }
}
function dibujar() {
  fondo();
  const tx = temblor > 0 ? rnd(-1, 1) * temblor * 30 : 0, ty = temblor > 0 ? rnd(-1, 1) * temblor * 30 : 0;
  const z = DPR * zoom, ox = DPR * (W / 2 - cam.x * zoom + tx), oy = DPR * (H / 2 - cam.y * zoom + ty), cw = cv.width, ch = cv.height;
  // copia una imagen ya pintada, girada y a escala, sin save/restore
  const pegar = (img, x, y, medio, rot) => {
    const sx = x * z + ox, sy = y * z + oy, m = medio * z;
    if (sx < -m || sx > cw + m || sy < -m || sy > ch + m) return;
    const c = Math.cos(rot) * z, s = Math.sin(rot) * z;
    ctx.setTransform(c, s, -s, c, sx, sy); ctx.drawImage(img, -medio, -medio, medio * 2, medio * 2);
  };
  for (const o of objetos) pegar(sprite(o.tipo, o.va), o.x, o.y, o.s * EXT, o.rot);
  for (const c of comiendo) {   // lo que se traga gira y se encoge hacia el centro
    const k = suave(c.t), o = c.o;
    pegar(sprite(o.tipo, o.va), c.x0 + (p.x - c.x0) * k, c.y0 + (p.y - c.y0) * k, o.s * (1 - k) * EXT, o.rot + k * 9);
  }
  for (const m of mejoras) {
    const r = p.r * 0.72 * (1 + 0.08 * Math.sin(m.fase));
    ctx.globalAlpha = m.vida < 2 ? 0.35 + 0.65 * Math.abs(Math.sin(m.vida * 8)) : 1;
    pegar(spriteMejora(m.tipo), m.x, m.y, r * EXT, 0);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(z, 0, 0, z, ox, oy);
  for (const q of rastro) { ctx.globalAlpha = q.vida * 1.3; ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x, q.y, p.r * (CFG.estela === "polvo" ? 0.13 : 0.5) * (q.vida / 0.55), 0, TAU); ctx.fill(); }
  for (const w of ondas) { ctx.globalAlpha = 1 - w.t; ctx.strokeStyle = "#B18CFF"; ctx.lineWidth = p.r * 0.35; ctx.beginPath(); ctx.arc(w.x, w.y, w.r + (w.max - w.r) * suave(w.t), 0, TAU); ctx.stroke(); }
  for (const q of particulas) { ctx.globalAlpha = Math.min(1, q.vida * 2); ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x, q.y, q.t, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  // Vórtex
  if (fx.iman > 0) { ctx.globalAlpha = 0.16; ctx.strokeStyle = C.coral; ctx.lineWidth = p.r * 0.12; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2.5 + (reloj * 2 % 1) * 4), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  const img = (SKIN_BMP[CFG.skin] || SKIN_BMP.clasico || {})[p.cara], t = p.r * IMG_K;
  if (img) ctx.drawImage(img, p.x - t / 2, p.y - t / 2, t, t);
  else { ctx.fillStyle = "#07061A"; ctx.strokeStyle = C.amber; ctx.lineWidth = p.r * 0.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.globalAlpha = 1;
  if (p.escudo) { ctx.strokeStyle = C.cyan; ctx.globalAlpha = 0.75; ctx.lineWidth = p.r * 0.1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.32, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (fx.frenesi > 0) { ctx.strokeStyle = C.amber; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(reloj * 14); ctx.lineWidth = p.r * 0.09; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.5, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const tam = (DEMO ? 46 : Math.min(26, W * 0.06)) / zoom;
  ctx.font = `800 ${tam}px Unbounded, sans-serif`; ctx.lineWidth = tam * 0.18; ctx.strokeStyle = C.tinta;
  for (const tx2 of textos) {
    ctx.globalAlpha = Math.min(1, tx2.vida / tx2.total * 2);
    ctx.strokeText(tx2.txt, tx2.x, tx2.y); ctx.fillStyle = tx2.col; ctx.fillText(tx2.txt, tx2.x, tx2.y);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  hud();
}

// ---------- bucle ----------
let ultimoFrame = 0, grabadora = null, trozos = [], modoCuadros = false, mAcum = 0, mN = 0, fpsMedio = 60;
function bucle(ms) {
  const ahora = ms / 1000, real = ahora - (ultimoFrame || ahora), dt = Math.min(0.05, real);
  ultimoFrame = ahora;
  if (modoCuadros) { requestAnimationFrame(bucle); return; }   // la grabación fotograma a fotograma lleva su propio reloj
  if (jugando) {
    actualizar(dt, ahora);
    if (tiempo <= 0) terminar();
    dibujar();
    // calidad adaptable: si de media no llega a unos 46 fps, baja la resolución medio punto (hasta 1)
    if (!DEMO && real > 0 && real < 0.25) {
      mAcum += real; mN++;
      if (mN >= 90) {
        fpsMedio = mN / mAcum;
        if (fpsMedio < 46 && dprMax > 1) { dprMax = Math.max(1, dprMax - 0.5); ajustar(); }
        mAcum = 0; mN = 0;
      }
    }
  } else if (pendiente || DEMO) { dibujar(); pendiente = false; }      // con un menú delante no se gasta batería pintando
  requestAnimationFrame(bucle);
}

function empezar() {
  token = null;
  if (!DEMO && !window.SIN_SERVIDOR) fetch("api/partida", {method: "POST"}).then((r) => (r.ok ? r.json() : null)).then((d) => { token = d && d.token; }).catch(() => {});
  reiniciar(); dedo = null; joy = null; jugando = true; mAcum = 0; mN = 0; proxCrece = 0;
  if (!DEMO) { Sonido.desbloquear(); Sonido.musica("partida"); sonar("empieza"); }
}
function terminar() {
  jugando = false; pendiente = true;
  if (DEMO) { if (GRABAR) setTimeout(pararGrabacion, 2500); window.__demo = {puntos, comidos}; return; }
  Sonido.musica("menu");
  if (window.alTerminarPartida) window.alTerminarPartida({puntos, comidos, mayor, golpes: st.golpes, combos: st.combos, mejoras: st.mejoras});
}

// ---------- grabación de demostración ----------
function empezarGrabacion() {
  const tipo = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
  grabadora = new MediaRecorder(cv.captureStream(30), {mimeType: tipo, videoBitsPerSecond: 8_000_000});
  grabadora.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
  grabadora.start(1000);
}
function pararGrabacion() {
  grabadora.onstop = async () => {
    const blob = new Blob(trozos, {type: "video/webm"});
    try {
      const r = await fetch("api/grabacion?clave=" + encodeURIComponent(CLAVE), {method: "POST", body: blob});
      window.__grabacion = await r.json();
    } catch (e) { window.__grabacion = {error: String(e)}; }
  };
  grabadora.stop();
}
// Grabación fotograma a fotograma: simula a 30 fps exactos y sube cada imagen al servidor.
// No usa temporizadores, así que funciona aunque la pestaña esté oculta.
async function grabarCuadros() {
  const sesion = "demo-" + Date.now().toString(36);
  const subir = (n) => new Promise((ok) => cv.toBlob((b) => fetch(`api/grabacion/cuadro?clave=${encodeURIComponent(CLAVE)}&sesion=${sesion}&n=${n}`, {method: "POST", body: b}).then(ok, ok), "image/jpeg", 0.9));
  let t = 1000, n = 0;
  modoCuadros = true; jugando = true;
  while (jugando) { t += 1 / 30; actualizar(1 / 30, t); if (tiempo <= 0) jugando = false; dibujar(); await subir(n++); }
  for (let k = 0; k < 75; k++) { dibujar(); await subir(n++); }      // 2,5 s con la puntuación final
  window.__grabacion = {sesion, cuadros: n, puntos, comidos};
}

const Juego = {empezar, configurar, cargarSkin, urlCara, sonar, fmt, TIPOS, ORDEN,
               get token() { return token; }, get puntos() { return puntos; }, get jugando() { return jugando; },
               get info() { return {dpr: DPR, fps: Math.round(fpsMedio), objetos: objetos.length}; },
               redibujar() { pendiente = true; }};

ajustar(); reiniciar();
if (DEMO) {
  // para los vídeos de demostración: ?demo&nivel=10&skin=magma&estela=cometa enseña habilidades y skins
  const n = parseInt(qs.get("nivel") || "1", 10);
  configurar({habilidades: HABS.filter((h) => h.nivel <= n).map((h) => h.id), comboMax: n >= 15 ? 5 : n >= 12 ? 4 : 3,
              skin: qs.get("skin") || "clasico", estela: qs.get("estela") || "ninguna"});
  Promise.all([document.fonts.ready, cargarSkin(CFG.skin)]).then(() => {
    if (qs.has("cuadros")) grabarCuadros();
    else { if (GRABAR) empezarGrabacion(); jugando = true; }
  });
} else cargarSkin("clasico");
requestAnimationFrame(bucle);
