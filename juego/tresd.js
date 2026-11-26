"use strict";
// Las piezas en 3D (renderizadas en Blender, blender/escenas/juego3d.py). Cada función devuelve true si ha pintado
// su imagen; si todavía no ha cargado (o falla), el juego pinta su dibujo de siempre y lo rehace al terminar la carga.
window.TresD = (() => {
  const VERSION = "11261309", IMG = {};
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
  return api;
})();
