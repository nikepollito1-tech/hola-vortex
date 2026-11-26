"use strict";
// Datos del metajuego: rarezas, colección, cofres, skins, estelas, habilidades, niveles y misiones.
// Los datos curiosos de la colección tienen que ser ciertos (biblia del canal): si se añade uno, se comprueba antes.

const RAREZAS = {
  comun:      {nombre: "Común",      color: "#B9B4D9", polvo: 60},
  raro:       {nombre: "Raro",       color: "#5CE1E6", polvo: 180},
  epico:      {nombre: "Épico",      color: "#B18CFF", polvo: 500},
  legendario: {nombre: "Legendario", color: "#FFC247", polvo: 1500},
  mitico:     {nombre: "Mítico",     color: "#FF7A9C", polvo: 4000},
};
const ORDEN_RAREZA = ["comun", "raro", "epico", "legendario", "mitico"];

const CATEGORIAS = [["planetas", "Planetas"], ["lunas", "Lunas"], ["estrellas", "Estrellas"], ["nebulosas", "Nebulosas"],
                    ["galaxias", "Galaxias"], ["extremos", "Lo más extremo"], ["naves", "Naves y cacharros"]];

const P = (c1, c2, mas) => Object.assign({t: "planeta", c: [c1, c2]}, mas || {});
const COLECCION = [
  // ---- planetas
  {id: "mercurio", cat: "planetas", nombre: "Mercurio", rareza: "comun", dato: "Un año aquí dura solo 88 días terrestres.", arte: P("#C9C4D6", "#6F6A84", {crateres: 1})},
  {id: "venus", cat: "planetas", nombre: "Venus", rareza: "comun", dato: "Es el planeta más caliente del sistema solar, más que Mercurio.", arte: P("#F6D99A", "#B8793A", {bandas: ["rgba(255,255,255,.25)"]})},
  {id: "tierra", cat: "planetas", nombre: "La Tierra", rareza: "raro", dato: "El único sitio conocido con vida. Y con tostadoras.", arte: P("#5CC8F0", "#1B4FA0", {manchas: "#5FBF6A"})},
  {id: "marte", cat: "planetas", nombre: "Marte", rareza: "comun", dato: "Tiene el volcán más alto conocido del sistema solar: el monte Olimpo.", arte: P("#F08A5C", "#8A2E1E", {manchas: "#B8472E"})},
  {id: "jupiter", cat: "planetas", nombre: "Júpiter", rareza: "raro", dato: "Es tan grande que dentro cabrían más de mil Tierras.", arte: P("#F2D2A2", "#A8683A", {bandas: ["#C97B4A", "#E9B987", "#B8623A"], ojo: "#D9512E"})},
  {id: "saturno", cat: "planetas", nombre: "Saturno", rareza: "epico", dato: "Sus anillos son, sobre todo, trozos de hielo.", arte: P("#F5E1A8", "#B8924A", {bandas: ["#D9B870"], anillo: "rgba(245,225,168,.8)"})},
  {id: "urano", cat: "planetas", nombre: "Urano", rareza: "raro", dato: "Gira tumbado: su eje está inclinado casi 98 grados.", arte: P("#B8F0F0", "#4FA8B8", {anillo: "rgba(244,241,255,.4)", anilloV: 1})},
  {id: "neptuno", cat: "planetas", nombre: "Neptuno", rareza: "raro", dato: "Tiene los vientos más rápidos medidos en un planeta: más de 2.000 km/h.", arte: P("#6F9BFF", "#1E2F9A", {bandas: ["rgba(255,255,255,.18)"]})},
  // ---- lunas
  {id: "luna", cat: "lunas", nombre: "La Luna", rareza: "comun", dato: "Se aleja de la Tierra unos 3,8 centímetros cada año.", arte: P("#E3E0EE", "#8E8AA6", {crateres: 1})},
  {id: "io", cat: "lunas", nombre: "Ío", rareza: "raro", dato: "Es el mundo con más actividad volcánica que se conoce.", arte: P("#F7E06A", "#C9862E", {manchas: "#C8402A"})},
  {id: "europa", cat: "lunas", nombre: "Europa", rareza: "epico", dato: "Bajo su corteza de hielo se cree que hay un océano de agua salada.", arte: P("#F2EEE2", "#A99C86", {grietas: "#9C5A3C"})},
  {id: "titan", cat: "lunas", nombre: "Titán", rareza: "epico", dato: "La única luna con atmósfera densa. Tiene lagos de metano líquido.", arte: P("#F2B866", "#A8621E", {halo: "rgba(242,184,102,.45)"})},
  {id: "encelado", cat: "lunas", nombre: "Encélado", rareza: "raro", dato: "Lanza géiseres de agua helada al espacio.", arte: P("#FFFFFF", "#B8D6E8", {grietas: "#7FB0D0"})},
  // ---- estrellas
  {id: "sol", cat: "estrellas", nombre: "El Sol", rareza: "comun", dato: "Contiene el 99,8 % de la masa de todo el sistema solar.", arte: {t: "estrella", c: "#FFC247", n: "#FFF6D8"}},
  {id: "sirio", cat: "estrellas", nombre: "Sirio", rareza: "comun", dato: "La estrella más brillante del cielo nocturno.", arte: {t: "estrella", c: "#9BD0FF", n: "#FFFFFF"}},
  {id: "proxima", cat: "estrellas", nombre: "Próxima Centauri", rareza: "raro", dato: "La estrella más cercana al Sol: está a unos 4,2 años luz.", arte: {t: "estrella", c: "#FF7A5C", n: "#FFD9C9", peq: 1}},
  {id: "betelgeuse", cat: "estrellas", nombre: "Betelgeuse", rareza: "epico", dato: "Una supergigante roja que algún día estallará como supernova.", arte: {t: "estrella", c: "#FF5A3A", n: "#FFC79A", grande: 1}},
  {id: "pulsar", cat: "estrellas", nombre: "Púlsar", rareza: "epico", dato: "Una estrella de neutrones que gira y barre el espacio como un faro.", arte: {t: "estrella", c: "#5CE1E6", n: "#FFFFFF", peq: 1, haz: "#5CE1E6"}},
  {id: "magnetar", cat: "estrellas", nombre: "Magnetar", rareza: "legendario", dato: "Tiene los campos magnéticos más intensos que se conocen en el universo.", arte: {t: "estrella", c: "#B18CFF", n: "#FFFFFF", peq: 1, haz: "#FF7A9C", lazos: 1}},
  // ---- nebulosas
  {id: "orion", cat: "nebulosas", nombre: "Nebulosa de Orión", rareza: "raro", dato: "Una guardería de estrellas que se ve a simple vista.", arte: {t: "nebulosa", c: ["#FF7A9C", "#7B5CFF", "#5CE1E6"], s: 11}},
  {id: "helice", cat: "nebulosas", nombre: "Nebulosa de la Hélice", rareza: "raro", dato: "La llaman «el Ojo de Dios»: es una estrella moribunda que suelta sus capas.", arte: {t: "nebulosa", c: ["#5CE1E6", "#FF7A5C", "#FFC247"], s: 23, ojo: 1}},
  {id: "cangrejo", cat: "nebulosas", nombre: "Nebulosa del Cangrejo", rareza: "epico", dato: "Son los restos de una supernova que se vio desde la Tierra en el año 1054.", arte: {t: "nebulosa", c: ["#FFC247", "#FF7A5C", "#9BE38D"], s: 37}},
  {id: "pilares", cat: "nebulosas", nombre: "Pilares de la Creación", rareza: "epico", dato: "Columnas de gas y polvo donde están naciendo estrellas.", arte: {t: "nebulosa", c: ["#E8B07A", "#5CE1E6", "#8A4E2B"], s: 51, pilares: 1}},
  {id: "carina", cat: "nebulosas", nombre: "Nebulosa de Carina", rareza: "legendario", dato: "Una de las nebulosas más grandes y brillantes de nuestro cielo.", arte: {t: "nebulosa", c: ["#FF7A9C", "#FFC247", "#7B5CFF"], s: 67, brillo: 1}},
  // ---- galaxias
  {id: "magallanes", cat: "galaxias", nombre: "Gran Nube de Magallanes", rareza: "comun", dato: "Una galaxia vecina que se ve a simple vista desde el hemisferio sur.", arte: {t: "galaxia", c: "#B9D6FF", forma: "irregular", s: 5}},
  {id: "vialactea", cat: "galaxias", nombre: "Vía Láctea", rareza: "raro", dato: "Tu casa. Tiene entre 100.000 y 400.000 millones de estrellas.", arte: {t: "galaxia", c: "#F4E3B8", forma: "espiral", s: 9}},
  {id: "andromeda", cat: "galaxias", nombre: "Andrómeda", rareza: "epico", dato: "Se acerca a la Vía Láctea a unos 110 kilómetros por segundo.", arte: {t: "galaxia", c: "#B18CFF", forma: "espiral", inclinada: 1, s: 13}},
  {id: "sombrero", cat: "galaxias", nombre: "Galaxia del Sombrero", rareza: "epico", dato: "Vista de canto parece un sombrero mexicano.", arte: {t: "galaxia", c: "#FFE2A8", forma: "sombrero", s: 17}},
  {id: "remolino", cat: "galaxias", nombre: "Galaxia del Remolino", rareza: "legendario", dato: "Una espiral casi perfecta que tira de una galaxia más pequeña.", arte: {t: "galaxia", c: "#7FD6FF", forma: "espiral", vecina: 1, s: 21}},
  // ---- extremos
  {id: "cuasar", cat: "extremos", nombre: "Cuásar", rareza: "epico", dato: "El núcleo de una galaxia que brilla más que todas sus estrellas juntas.", arte: {t: "agujero", c: ["#5CE1E6", "#FFFFFF"], chorro: "#9BE8FF"}},
  {id: "sagitario", cat: "extremos", nombre: "Sagitario A*", rareza: "legendario", dato: "El agujero negro del centro de nuestra galaxia: pesa unos 4 millones de soles.", arte: {t: "agujero", c: ["#FF8A3C", "#FFD98A"]}},
  {id: "m87", cat: "extremos", nombre: "M87*", rareza: "legendario", dato: "El primer agujero negro del que se obtuvo una imagen, en 2019.", arte: {t: "agujero", c: ["#FF5A2E", "#FFB347"], grueso: 1}},
  {id: "ton618", cat: "extremos", nombre: "TON 618", rareza: "mitico", dato: "Uno de los agujeros negros más grandes conocidos: unos 66.000 millones de soles.", arte: {t: "agujero", c: ["#B18CFF", "#FF7A9C"], grueso: 1, chorro: "#FF7A9C"}},
  {id: "vortex", cat: "extremos", nombre: "Vórtex", rareza: "mitico", dato: "Yo mismo. Pequeño, curioso y siempre con hambre.", arte: {t: "vortex"}},
  // ---- naves y cacharros
  {id: "meteorito", cat: "naves", nombre: "Meteorito", rareza: "comun", dato: "Una roca del espacio que sobrevive a la caída y llega al suelo.", arte: {t: "emoji", e: "☄️"}},
  {id: "sputnik", cat: "naves", nombre: "Sputnik 1", rareza: "comun", dato: "El primer satélite artificial. Se lanzó en 1957.", arte: {t: "emoji", e: "📡"}},
  {id: "iss", cat: "naves", nombre: "Estación Espacial", rareza: "comun", dato: "Da una vuelta a la Tierra cada 90 minutos, más o menos.", arte: {t: "emoji", e: "🛰️"}},
  {id: "hubble", cat: "naves", nombre: "Hubble", rareza: "comun", dato: "Este telescopio lleva en órbita desde 1990.", arte: {t: "emoji", e: "🔭"}},
  {id: "halley", cat: "naves", nombre: "Cometa Halley", rareza: "raro", dato: "Vuelve cada 76 años, más o menos. La próxima vez, en 2061.", arte: {t: "emoji", e: "💫"}},
  {id: "starship", cat: "naves", nombre: "Starship", rareza: "raro", dato: "El cohete más grande y potente construido hasta ahora.", arte: {t: "emoji", e: "🚀"}},
  {id: "apolo", cat: "naves", nombre: "Apolo 11", rareza: "epico", dato: "Llevó a los primeros humanos a la Luna, en 1969.", arte: {t: "emoji", e: "👨‍🚀"}},
  {id: "webb", cat: "naves", nombre: "James Webb", rareza: "epico", dato: "Su espejo dorado mide 6,5 metros de ancho.", arte: {t: "emoji", e: "🪞"}},
  {id: "voyager", cat: "naves", nombre: "Voyager 1", rareza: "legendario", dato: "El objeto humano más lejano. Lleva un disco de oro con sonidos de la Tierra.", arte: {t: "emoji", e: "📀"}},
  {id: "tostadora", cat: "naves", nombre: "La Tostadora", rareza: "legendario", dato: "Nadie sabe qué hace una tostadora en el espacio. Vórtex tampoco.", arte: {t: "emoji", e: "🍞"}},
];
const POR_ID = Object.fromEntries(COLECCION.map((x) => [x.id, x]));

// Cofres: se pagan con polvo estelar (los puntos de las partidas). No hay compras con dinero.
const COFRES = {
  asteroide: {nombre: "Cofre Asteroide", precio: 500,  cartas: 1, color: "#B9B4D9", prob: {comun: 72, raro: 23, epico: 4.4, legendario: 0.6}},
  nebulosa:  {nombre: "Cofre Nebulosa",  precio: 1500, cartas: 2, color: "#B18CFF", prob: {comun: 38, raro: 42, epico: 16, legendario: 3.6, mitico: 0.4}},
  supernova: {nombre: "Cofre Supernova", precio: 4000, cartas: 3, color: "#FFC247", prob: {raro: 46, epico: 38, legendario: 13.5, mitico: 2.5}},
};

// Skins: cambian los colores del anillo de Vórtex. req: null (de serie), nivel, compra, set (categoría completa) o colección (%).
const SKINS = {
  clasico:   {nombre: "Clásico",   req: null},
  hielo:     {nombre: "Hielo",     req: {t: "nivel", n: 3},  anillo: ["#5CE1E6", "#9BE8FF", "#F4F1FF"], brillo: "#5CE1E6", luz: "#E8FBFF"},
  chicle:    {nombre: "Chicle",    req: {t: "compra", precio: 2500}, anillo: ["#FF5C9C", "#FF9EC4", "#FFD6E8"], brillo: "#FF7AB0", luz: "#FFE8F2"},
  esmeralda: {nombre: "Esmeralda", req: {t: "nivel", n: 7},  anillo: ["#2E9D5F", "#9BE38D", "#E2FFD9"], brillo: "#6FD98A", luz: "#EFFFE8"},
  magma:     {nombre: "Magma",     req: {t: "nivel", n: 10}, anillo: ["#8A1020", "#FF4B3A", "#FFB347"], brillo: "#FF4B3A", luz: "#FFD9A8"},
  nebulosa:  {nombre: "Nebulosa",  req: {t: "set", cat: "nebulosas"}, anillo: ["#7B5CFF", "#FF7A9C", "#5CE1E6"], brillo: "#B18CFF", luz: "#F4E8FF"},
  galactico: {nombre: "Galáctico", req: {t: "set", cat: "galaxias"}, anillo: ["#3A2A99", "#7B5CFF", "#F4F1FF"], brillo: "#7B5CFF", luz: "#E8E4FF", cuerpo: ["#2B1A6B", "#0A0530"]},
  vacio:     {nombre: "Vacío",     req: {t: "nivel", n: 15}, anillo: ["#FFFFFF", "#B9B4D9", "#F4F1FF"], brillo: "#F4F1FF", luz: "#FFFFFF", cuerpo: ["#161616", "#000000"]},
  arcoiris:  {nombre: "Arcoíris",  req: {t: "coleccion", pct: 50}, anillo: ["#FF7A9C", "#FFC247", "#9BE38D", "#5CE1E6", "#7B5CFF"], brillo: "#FFC247", luz: "#FFFFFF"},
  oro:       {nombre: "Oro puro",  req: {t: "nivel", n: 20}, anillo: ["#B8860B", "#FFD700", "#FFF8C9"], brillo: "#FFD700", luz: "#FFFBE0"},
};

const ESTELAS = {
  ninguna:  {nombre: "Sin estela", req: null},
  polvo:    {nombre: "Polvo estelar", req: {t: "nivel", n: 5}},
  cometa:   {nombre: "Cometa", req: {t: "nivel", n: 14}},
  arcoiris: {nombre: "Arcoíris", req: {t: "nivel", n: 18}},
};

// Habilidades: aparecen flotando en la partida cuando ya se han desbloqueado por nivel.
const HABILIDADES = [
  {id: "iman",      nivel: 2,  nombre: "Imán",      icono: "🧲", color: "#FF7A9C", desc: "Atrae todo lo pequeño durante 6 segundos."},
  {id: "escudo",    nivel: 4,  nombre: "Escudo",    icono: "🛡️", color: "#5CE1E6", desc: "Aguanta un golpe sin encoger."},
  {id: "frenesi",   nivel: 6,  nombre: "Frenesí",   icono: "⚡", color: "#FFC247", desc: "Puntos ×2 durante 6 segundos."},
  {id: "reloj",     nivel: 8,  nombre: "Reloj",     icono: "⏳", color: "#9BE38D", desc: "Suma 5 segundos a la partida."},
  {id: "supernova", nivel: 10, nombre: "Supernova", icono: "💥", color: "#B18CFF", desc: "Se traga de golpe todo lo pequeño que haya a la vista."},
];

// Premios de nivel que no son habilidades, skins ni estelas (esos salen solos de sus tablas).
const EXTRAS_NIVEL = {
  3: [{t: "cofre", id: "asteroide"}], 5: [{t: "cofre", id: "asteroide"}], 9: [{t: "cofre", id: "nebulosa"}],
  12: [{t: "combo", n: 4}], 13: [{t: "cofre", id: "nebulosa"}], 15: [{t: "combo", n: 5}],
  17: [{t: "cofre", id: "supernova"}], 20: [{t: "cofre", id: "supernova"}],
};
const NIVEL_MAX_PREMIOS = 20;

// Misiones del día: salen 3 al azar. acum = se suma entre partidas; si no, vale la mejor partida.
const MISIONES = {
  partidas3:   {txt: "Juega 3 partidas", meta: 3, premio: 300, acum: true, medir: () => 1},
  puntos1500:  {txt: "Haz 1.500 puntos en una partida", meta: 1500, premio: 400, medir: (r) => r.puntos},
  puntos3000:  {txt: "Haz 3.000 puntos en una partida", meta: 3000, premio: 700, nivel: 4, medir: (r) => r.puntos},
  lunas10:     {txt: "Trágate 10 lunas", meta: 10, premio: 300, acum: true, medir: (r) => r.comidos.luna || 0},
  planetas8:   {txt: "Trágate 8 planetas", meta: 8, premio: 300, acum: true, medir: (r) => r.comidos.planeta || 0},
  estrellas3:  {txt: "Trágate 3 estrellas", meta: 3, premio: 400, acum: true, medir: (r) => r.comidos.estrella || 0},
  galaxia1:    {txt: "Trágate una galaxia entera", meta: 1, premio: 500, acum: true, medir: (r) => r.comidos.galaxia || 0},
  tostadoras5: {txt: "Trágate 5 tostadoras", meta: 5, premio: 300, acum: true, medir: (r) => r.comidos.tostadora || 0},
  limpio:      {txt: "Termina una partida sin recibir golpes", meta: 1, premio: 500, medir: (r) => (r.golpes === 0 && r.puntos >= 300 ? 1 : 0)},
  combos5:     {txt: "Llega 5 veces al combo máximo", meta: 5, premio: 300, acum: true, medir: (r) => r.combos || 0},
  mejoras4:    {txt: "Coge 4 habilidades", meta: 4, premio: 300, acum: true, nivel: 2, medir: (r) => r.mejoras || 0},
};

// ---------- arte de la colección (se pinta una vez en un lienzo y se guarda como imagen) ----------
function azar(semilla) {      // generador con semilla, para que cada carta salga siempre igual
  let a = semilla >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pintarArte(g, a, T) {
  const R = T * 0.34;
  g.save(); g.translate(T / 2, T / 2);
  const brillo = (x, y, r, col) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r);
    g.quadraticCurveTo(x + r * 0.1, y - r * 0.1, x + r, y); g.quadraticCurveTo(x + r * 0.1, y + r * 0.1, x, y + r);
    g.quadraticCurveTo(x - r * 0.1, y + r * 0.1, x - r, y); g.quadraticCurveTo(x - r * 0.1, y - r * 0.1, x, y - r); g.fill();
  };
  const halo = (r, col) => {
    const h = g.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    h.addColorStop(0, col); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
  };
  switch (a.t) {
    case "planeta": {
      const anillo = (delante) => {
        g.strokeStyle = a.anillo; g.lineWidth = R * 0.16; g.beginPath();
        if (a.anilloV) g.ellipse(0, 0, R * 0.42, R * 1.6, 0.25, delante ? -Math.PI / 2 : Math.PI / 2, delante ? Math.PI / 2 : Math.PI * 1.5);
        else g.ellipse(0, 0, R * 1.7, R * 0.45, -0.25, delante ? 0 : Math.PI, delante ? Math.PI : 6.2832);
        g.stroke();
      };
      if (a.halo) halo(R * 1.5, a.halo);
      if (a.anillo) anillo(false);
      const gr = g.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R);
      gr.addColorStop(0, a.c[0]); gr.addColorStop(1, a.c[1]);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.fill();
      g.save(); g.clip();
      if (a.bandas) a.bandas.forEach((col, i) => { g.fillStyle = col; g.globalAlpha = 0.55; g.fillRect(-R, -R * 0.62 + i * R * 0.5, R * 2, R * 0.2); });
      g.globalAlpha = 1;
      if (a.ojo) { g.fillStyle = a.ojo; g.beginPath(); g.ellipse(R * 0.3, R * 0.3, R * 0.26, R * 0.15, 0, 0, 6.2832); g.fill(); }
      if (a.manchas) { g.fillStyle = a.manchas; g.globalAlpha = 0.8; for (const [x, y, r] of [[-0.3, -0.2, 0.34], [0.35, 0.25, 0.28], [0.1, -0.55, 0.18], [-0.45, 0.5, 0.2]]) { g.beginPath(); g.ellipse(x * R, y * R, r * R, r * R * 0.7, x, 0, 6.2832); g.fill(); } g.globalAlpha = 1; }
      if (a.crateres) { g.fillStyle = "rgba(0,0,0,.18)"; for (const [x, y, r] of [[0.3, -0.2, 0.24], [-0.35, 0.3, 0.18], [-0.2, -0.45, 0.12], [0.2, 0.5, 0.14]]) { g.beginPath(); g.arc(x * R, y * R, r * R, 0, 6.2832); g.fill(); } }
      if (a.grietas) { g.strokeStyle = a.grietas; g.lineWidth = R * 0.035; g.globalAlpha = 0.75; const z = azar(7); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo((z() * 2 - 1) * R, (z() * 2 - 1) * R); g.quadraticCurveTo((z() * 2 - 1) * R, (z() * 2 - 1) * R, (z() * 2 - 1) * R, (z() * 2 - 1) * R); g.stroke(); } g.globalAlpha = 1; }
      g.restore();
      if (a.anillo) anillo(true);
      break;
    }
    case "estrella": {
      const r = R * (a.peq ? 0.6 : a.grande ? 1.2 : 0.95);
      if (a.haz) { g.save(); g.rotate(-0.6); const h = g.createLinearGradient(-T, 0, T, 0); h.addColorStop(0, "rgba(0,0,0,0)"); h.addColorStop(0.5, a.haz); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.beginPath(); g.moveTo(-T * 0.5, -R * 0.14); g.lineTo(0, -R * 0.03); g.lineTo(T * 0.5, -R * 0.14); g.lineTo(T * 0.5, R * 0.14); g.lineTo(0, R * 0.03); g.lineTo(-T * 0.5, R * 0.14); g.closePath(); g.fill(); g.restore(); }
      if (a.lazos) { g.strokeStyle = "rgba(255,122,156,.8)"; g.lineWidth = R * 0.05; for (const k of [1, 1.5, 2]) { g.beginPath(); g.ellipse(0, 0, r * 0.7 * k, r * 1.25 * k * 0.8, 0, 0, 6.2832); g.stroke(); } }
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.7);
      gr.addColorStop(0, a.n); gr.addColorStop(0.42, a.c); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.7, 0, 6.2832); g.fill();
      brillo(0, 0, r * 1.75, "rgba(255,255,255,.75)");
      break;
    }
    case "nebulosa": {
      const z = azar(a.s);
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 9; i++) {
        const x = (z() * 2 - 1) * R * 0.8, y = (z() * 2 - 1) * R * 0.8, r = R * (0.5 + z() * 0.6), col = a.c[i % a.c.length];
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.globalAlpha = a.brillo ? 0.6 : 0.45; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      if (a.ojo) { g.strokeStyle = "rgba(255,122,92,.8)"; g.lineWidth = R * 0.22; g.beginPath(); g.ellipse(0, 0, R * 0.8, R * 0.62, 0, 0, 6.2832); g.stroke(); g.fillStyle = "rgba(10,10,31,.55)"; g.beginPath(); g.ellipse(0, 0, R * 0.42, R * 0.32, 0, 0, 6.2832); g.fill(); }
      if (a.pilares) { g.fillStyle = "rgba(60,32,18,.85)"; for (const [x, w, h] of [[-0.45, 0.24, 1.25], [0, 0.2, 0.95], [0.4, 0.17, 0.7]]) { g.beginPath(); g.moveTo((x - w) * R, R * 1.05); g.quadraticCurveTo((x - w * 0.6) * R, (1.05 - h) * R, x * R, (1.0 - h * 1.1) * R); g.quadraticCurveTo((x + w * 0.9) * R, (1.05 - h) * R, (x + w) * R, R * 1.05); g.closePath(); g.fill(); } }
      for (let i = 0; i < 14; i++) brillo((z() * 2 - 1) * R * 1.2, (z() * 2 - 1) * R * 1.2, R * (0.04 + z() * 0.07), "rgba(255,255,255,.9)");
      break;
    }
    case "galaxia": {
      const z = azar(a.s);
      if (a.forma === "sombrero") {
        halo(R * 1.1, "rgba(255,226,168,.55)");
        g.fillStyle = a.c; g.beginPath(); g.ellipse(0, 0, R * 1.45, R * 0.2, -0.12, 0, 6.2832); g.fill();
        g.fillStyle = "rgba(40,24,10,.8)"; g.beginPath(); g.ellipse(0, R * 0.04, R * 1.45, R * 0.07, -0.12, 0, 6.2832); g.fill();
        halo(R * 0.55, "#FFF6D8");
      } else if (a.forma === "irregular") {
        g.globalCompositeOperation = "lighter";
        for (let i = 0; i < 7; i++) { const x = (z() * 2 - 1) * R * 0.7, y = (z() * 2 - 1) * R * 0.4, r = R * (0.3 + z() * 0.45); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, a.c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.5; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
        for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc((z() * 2 - 1) * R, (z() * 2 - 1) * R * 0.6, R * 0.025, 0, 6.2832); g.fill(); }
      } else {
        g.save(); if (a.inclinada) { g.rotate(-0.5); g.scale(1, 0.5); }
        halo(R * 1.35, a.c + "88");
        g.fillStyle = "#FFFFFF";
        for (let k = 0; k < 90; k++) { const an = k * 0.2, rr = R * 0.075 * an; for (const sg of [0, Math.PI]) { g.globalAlpha = 0.85 - k * 0.006; g.beginPath(); g.arc(Math.cos(an + sg) * rr, Math.sin(an + sg) * rr * 0.8, R * (0.045 - k * 0.0003), 0, 6.2832); g.fill(); } }
        g.globalAlpha = 1; halo(R * 0.45, "#FFF6D8"); g.restore();
        if (a.vecina) { g.save(); g.translate(R * 0.95, -R * 0.85); halo(R * 0.34, "#FFE2A8"); g.restore(); }
      }
      break;
    }
    case "agujero": {
      if (a.chorro) { const h = g.createLinearGradient(0, -T * 0.5, 0, T * 0.5); h.addColorStop(0, "rgba(0,0,0,0)"); h.addColorStop(0.5, a.chorro); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.save(); g.rotate(0.35); g.fillRect(-R * 0.09, -T * 0.5, R * 0.18, T); g.restore(); }
      halo(R * 1.5, a.c[0] + "66");
      const gr = g.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, a.c[0]); gr.addColorStop(1, a.c[1]);
      g.strokeStyle = gr; g.lineWidth = R * (a.grueso ? 0.42 : 0.28); g.beginPath(); g.arc(0, 0, R * 0.82, 0, 6.2832); g.stroke();
      g.strokeStyle = a.c[1]; g.lineWidth = R * 0.1; g.beginPath(); g.ellipse(0, 0, R * 1.45, R * 0.3, -0.2, 0, 6.2832); g.stroke();
      g.fillStyle = "#05040F"; g.beginPath(); g.arc(0, 0, R * 0.66, 0, 6.2832); g.fill();
      break;
    }
    case "emoji": {
      halo(R * 1.3, "rgba(123,92,255,.35)");
      g.font = `${Math.round(T * 0.5)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(a.e, 0, T * 0.03);
      break;
    }
  }
  g.restore();
}
