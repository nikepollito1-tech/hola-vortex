"use strict";
// Las piezas en 3D (renderizadas en Blender, blender/escenas/juego3d.py). Cada función devuelve true si ha pintado
// su imagen; si todavía no ha cargado (o falla), el juego pinta su dibujo de siempre y lo rehace al terminar la carga.
window.TresD = (() => {
  const VERSION = "11261411", IMG = {};
  const NOMBRES = ["j-meteorito0", "j-meteorito1", "j-meteorito2", "j-satelite0", "j-astronauta0", "j-tostadora0", "j-luna0", "j-planeta0", "j-planeta1", "j-planeta2", "j-planeta3", "j-planeta4", "j-gigante0", "j-gigante1", "j-estrella0", "j-galaxia0", "c-mercurio", "c-venus", "c-tierra", "c-marte", "c-jupiter", "c-saturno", "c-urano", "c-neptuno", "c-luna", "c-io", "c-europa", "c-titan", "c-encelado", "c-sol", "c-sirio", "c-proxima", "c-betelgeuse", "c-pulsar", "c-magnetar", "c-orion", "c-helice", "c-cangrejo", "c-pilares", "c-carina", "c-magallanes", "c-vialactea", "c-andromeda", "c-sombrero", "c-remolino", "c-cuasar", "c-sagitario", "c-m87", "c-ton618", "c-meteorito", "c-sputnik", "c-iss", "c-hubble", "c-halley", "c-starship", "c-apolo", "c-webb", "c-voyager", "c-tostadora", "k-asteroide0", "k-asteroide1", "k-asteroide2", "k-asteroide3", "k-nebulosa0", "k-nebulosa1", "k-nebulosa2", "k-nebulosa3", "k-supernova0", "k-supernova1", "k-supernova2", "k-supernova3", "h-iman", "h-escudo", "h-frenesi", "h-reloj", "h-supernova", "c-vortex"];
  const api = {completo: false};
  let faltan = NOMBRES.length;
  const fin = () => {
    if (--faltan) return;
    api.completo = true;
    if (typeof SPR !== "undefined") for (const k of Object.keys(SPR)) delete SPR[k];
    const cofre = document.getElementById("ic-cofre");
    if (cofre) cofre.removeAttribute("src");
    if (typeof Progreso !== "undefined" && Progreso.alCambiar) Progreso.alCambiar();
  };
  for (const n of NOMBRES) { const i = new Image(); i.onload = fin; i.onerror = fin; i.src = `img3d/${n}.webp?v=${VERSION}`; IMG[n] = i; }
  const lista = (n) => (IMG[n] && IMG[n].complete && IMG[n].naturalWidth ? IMG[n] : null);

  api.objeto = (g, tipo, s, va) => {                       // lo que flota en la partida
    const i = lista(`j-${tipo}${va || 0}`);
    if (i) g.drawImage(i, -1.75 * s, -1.75 * s, 3.5 * s, 3.5 * s);
    return !!i;
  };
  let porArte = null;
  api.carta = (g, a, T) => {                               // cartas de la colección
    if (!porArte) porArte = new Map(COLECCION.map((x) => [x.arte, x.id]));
    const id = porArte.get(a), i = lista(`c-${id}`) || (id === "vortex" ? lista("c-vortex") : null);
    if (i) g.drawImage(i, -0.05 * T, -0.05 * T, 1.1 * T, 1.1 * T);
    return !!i;
  };
  api.cofre = (g, tipo, cx, cy, s, o) => {
    const abrir = o.abrir || 0, paso = Math.min(3, Math.ceil(abrir * 3 - 0.15));
    const i = lista(`k-${tipo}${Math.max(0, paso)}`);
    if (!i) return false;
    const lado = s * 1.86;
    g.drawImage(i, cx - lado / 2, cy - lado / 2 - s * 0.06, lado, lado);
    const a = Math.max(o.luz || 0, abrir);
    if (a > 0) {
      g.save(); g.globalCompositeOperation = "lighter";
      const y = cy - s * 0.06, r = s * (0.35 + a * 0.45), gl = g.createRadialGradient(cx, y, 0, cx, y, r);
      gl.addColorStop(0, `rgba(255,255,255,${0.6 * a})`); gl.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gl; g.beginPath(); g.arc(cx, y, r, 0, Math.PI * 2); g.fill(); g.restore();
    }
    return true;
  };
  api.mejora = (g, id, r) => api.objetoSuelto(g, `h-${id}`, r);
  api.objetoSuelto = (g, n, r) => {
    const i = lista(n);
    if (i) g.drawImage(i, -1.75 * r, -1.75 * r, 3.5 * r, 3.5 * r);
    return !!i;
  };
  // ---------- Vórtex vivo ----------
  // Hojas de 6x5 fotogramas (3 s a 10 por segundo) por cara y boca. Encima, movimientos calculados a cada fotograma:
  // se inclina y se estira al correr, da un bocado al comer, tiembla al chocar y palpita al crecer.
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CARAS = ["curioso", "sorprendido", "picaro", "hambriento"], LADO = 256;
  let piel = null, hojas = {};
  api.animar = (skin) => {                    // solo se guardan en memoria las hojas de la skin puesta
    if (quieto || skin === piel) return;
    piel = skin; hojas = {};
    for (const c of CARAS) for (const b of [0, 1]) {
      const i = new Image(); i.src = `img3d/anim/${skin}-${c}-${b}.webp?v=${VERSION}`; hojas[c + b] = i;
    }
  };
  const cargada = (i) => i && i.complete && i.naturalWidth;
  const limite = (x, m) => Math.max(-m, Math.min(m, x));
  api.vortex = (g, p, t, skin) => {
    if (quieto) return false;
    api.animar(skin);
    const ahora = performance.now() / 1000, mordisco = ahora - (p.mordisco || -9);
    let hoja = hojas[p.cara + (mordisco < 0.3 ? 1 : 0)];
    if (!cargada(hoja)) hoja = hojas[p.cara + "0"];
    if (!cargada(hoja)) return false;
    const f = Math.floor(ahora * 10) % 30;
    const vx = p.vx || 0, vy = p.vy || 0, rapidez = Math.hypot(vx, vy), k = Math.min(1, rapidez / (p.r * 9 + 1));
    let giro = limite(vx / (p.r * 45 + 1), 0.22), escala = 1;
    const golpe = ahora - (p.golpeado || -9), crece = ahora - (p.crecio || -9);
    if (golpe < 0.6) giro += Math.sin(golpe * 38) * 0.35 * (1 - golpe / 0.6);
    if (mordisco < 0.3) escala += 0.13 * Math.sin(Math.PI * mordisco / 0.3);
    if (crece < 0.6) escala += 0.22 * Math.sin(Math.PI * crece / 0.6) * (1 - crece / 1.2);
    g.save();
    g.translate(p.x, p.y);
    if (k > 0.02) {                            // estirado en la dirección en la que va
      const a = Math.atan2(vy, vx), e = 0.1 * k;
      g.rotate(a); g.scale(1 + e, 1 - e * 0.8); g.rotate(-a);
    }
    g.rotate(giro);
    const lado = t * escala;
    g.drawImage(hoja, (f % 6) * LADO, Math.floor(f / 6) * LADO, LADO, LADO, -lado / 2, -lado / 2, lado, lado);
    g.restore();
    return true;
  };
  return api;
})();
