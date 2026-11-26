"use strict";
// Progreso del jugador. Se guarda en el propio móvil (localStorage): no hay cuentas ni compras.
const Progreso = (() => {
  const CLAVE = "vortex-progreso-v1";
  const base = () => ({v: 1, polvo: 0, xp: 0, partidas: 0, mejor: 0, coleccion: {}, cofres: {}, skins: ["clasico"], skin: "clasico",
                       estela: "ninguna", control: "joystick", racha: 0, ultimoDiario: "", misiones: {dia: "", lista: []}});
  const INVITADO = "vortex-progreso-invitado";     // progreso del invitado mientras hay una cuenta abierta
  let d = base();
  try { const j = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (j && j.v === 1) d = Object.assign(base(), j); } catch (e) {}

  // ---------- cuenta: el progreso vive en el servidor y aquí se guarda una copia ----------
  let cuenta = null, version = 0, temporizador = null, enviando = null, pendiente = Promise.resolve();
  const avisar = () => { if (typeof Progreso !== "undefined" && Progreso.alCambiar) Progreso.alCambiar(); };
  const local = () => { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} };
  const guardar = () => { local(); if (cuenta) { clearTimeout(temporizador); temporizador = setTimeout(subir, 1200); } };
  async function api(ruta, metodo = "GET", cuerpo) {
    const r = await fetch("api/" + ruta, {method: metodo, credentials: "same-origin", headers: cuerpo ? {"Content-Type": "application/json"} : {},
                                           body: cuerpo ? JSON.stringify(cuerpo) : undefined});
    let j = {}; try { j = await r.json(); } catch (e) {}
    return {ok: r.ok, estado: r.status, datos: j};
  }
  // Une dos progresos sin perder lo conseguido en ninguno (para cuando se juega en dos dispositivos a la vez).
  function unir(a, b) {
    const x = Object.assign(base(), b);
    x.xp = Math.max(a.xp, b.xp); x.partidas = Math.max(a.partidas, b.partidas); x.mejor = Math.max(a.mejor, b.mejor);
    for (const [k, v] of Object.entries(a.coleccion || {})) x.coleccion[k] = Math.max(v, x.coleccion[k] || 0);
    x.skins = [...new Set([...(b.skins || []), ...(a.skins || [])])];
    return x;
  }
  async function subir() {
    if (!cuenta) return;
    if (enviando) { clearTimeout(temporizador); temporizador = setTimeout(subir, 800); return; }
    await pendiente;                              // primero que el servidor apunte la partida (suma la experiencia)
    const copia = JSON.parse(JSON.stringify(d));
    enviando = api("cuenta/progreso", "PUT", {datos: copia, version});
    try {
      const r = await enviando;
      if (r.ok) {
        version = r.datos.version;
        const s = r.datos.progreso;                // el servidor acota experiencia y polvo si no cuadran
        if (s.xp < copia.xp) d.xp = Math.max(s.xp, d.xp - (copia.xp - s.xp));
        if (s.polvo < copia.polvo) d.polvo = Math.max(0, d.polvo - (copia.polvo - s.polvo));
        local();
      } else if (r.estado === 409) {
        version = r.datos.version; d = unir(d, r.datos.progreso || base()); local(); avisar(); guardar();
      } else if (r.estado === 401) { cuenta = null; avisar(); }
    } catch (e) { clearTimeout(temporizador); temporizador = setTimeout(subir, 8000); }
    finally { enviando = null; }
  }
  function usar(perfil, traerInvitado) {
    cuenta = perfil.usuario; version = perfil.version || 0;
    if (!traerInvitado) { try { if (!localStorage.getItem(INVITADO)) localStorage.setItem(INVITADO, JSON.stringify(d)); } catch (e) {} }
    else { try { localStorage.removeItem(INVITADO); } catch (e) {} }
    d = Object.assign(base(), perfil.progreso || {});
    local(); avisar();
  }
  async function iniciarCuenta() {
    if (window.SIN_SERVIDOR) return null;
    try {
      const r = await api("cuenta");
      if (r.ok && r.datos.usuario) usar(r.datos, false);
      else if (r.ok) cuenta = null;
    } catch (e) {}                                // sin conexión: se sigue con la copia del móvil
    return cuenta;
  }
  async function registrar(nombre, clave, edad) {
    const r = await api("cuenta/registro", "POST", {nombre, clave, edad, progreso: d});
    if (!r.ok) throw new Error(r.datos.detail || "No se pudo crear la cuenta.");
    usar(r.datos, true);
    return r.datos.codigo;
  }
  async function entrar(nombre, clave) {
    const r = await api("cuenta/entrar", "POST", {nombre, clave});
    if (!r.ok) throw new Error(r.datos.detail || "No se pudo entrar.");
    usar(r.datos, false);
  }
  async function recuperar(nombre, codigo, nueva) {
    const r = await api("cuenta/recuperar", "POST", {nombre, codigo, nueva});
    if (!r.ok) throw new Error(r.datos.detail || "No se pudo cambiar la contraseña.");
    usar(r.datos, false);
    return r.datos.codigo;
  }
  function volverAInvitado() {
    cuenta = null; version = 0; clearTimeout(temporizador);
    d = base();
    try { const j = JSON.parse(localStorage.getItem(INVITADO) || "null"); if (j && j.v === 1) d = Object.assign(base(), j); localStorage.removeItem(INVITADO); } catch (e) {}
    local(); avisar();
  }
  async function salir() { await subir(); try { await api("cuenta/salir", "POST", {}); } catch (e) {} volverAInvitado(); }
  async function accion(ruta, cuerpo) {
    const r = await api(ruta, "POST", cuerpo);
    if (!r.ok) throw new Error(r.datos.detail || "No se pudo hacer.");
    return r.datos;
  }
  async function borrarCuenta(clave) { await accion("cuenta/borrar", {clave}); volverAInvitado(); }
  // La partida se apunta en el servidor antes de subir el progreso: así la experiencia cuadra.
  function apuntarPartida(promesa) { pendiente = promesa.catch(() => {}); return promesa; }

  const fecha = (x = new Date()) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  const ayer = () => { const x = new Date(); x.setDate(x.getDate() - 1); return fecha(x); };

  // nivel n pide 350·(n−1)·n de experiencia en total: 700, 2.100, 4.200, 7.000, 10.500…
  const xpPara = (n) => 350 * (n - 1) * n;
  const nivel = (xp = d.xp) => { let n = 1; while (xpPara(n + 1) <= xp) n++; return n; };
  const comboMax = (n = nivel()) => (n >= 15 ? 5 : n >= 12 ? 4 : 3);
  const habilidades = (n = nivel()) => HABILIDADES.filter((h) => h.nivel <= n).map((h) => h.id);

  const total = () => COLECCION.filter((x) => d.coleccion[x.id]).length;
  const setCompleto = (cat) => COLECCION.filter((x) => x.cat === cat).every((x) => d.coleccion[x.id]);
  function cumple(req) {
    if (!req) return true;
    if (req.t === "nivel") return nivel() >= req.n;
    if (req.t === "set") return setCompleto(req.cat);
    if (req.t === "coleccion") return total() / COLECCION.length * 100 >= req.pct;
    return false;                                   // las de compra solo valen si están en d.skins
  }
  const tieneSkin = (id) => d.skins.includes(id) || cumple(SKINS[id].req);
  const tieneEstela = (id) => cumple(ESTELAS[id].req);
  function textoReq(req) {
    if (!req) return "";
    if (req.t === "nivel") return "Nivel " + req.n;
    if (req.t === "compra") return req.precio.toLocaleString("es-ES") + " de polvo";
    if (req.t === "set") return "Completa " + CATEGORIAS.find((c) => c[0] === req.cat)[1];
    return `Colección al ${req.pct} %`;
  }

  function premiosDeNivel(n) {
    const out = [];
    for (const h of HABILIDADES) if (h.nivel === n) out.push({t: "habilidad", txt: `Habilidad nueva: ${h.nombre} ${h.icono}`, sub: h.desc});
    for (const [id, s] of Object.entries(SKINS)) if (s.req && s.req.t === "nivel" && s.req.n === n) out.push({t: "skin", id, txt: `Skin nueva: ${s.nombre}`});
    for (const [id, s] of Object.entries(ESTELAS)) if (s.req && s.req.n === n) out.push({t: "estela", id, txt: `Estela nueva: ${s.nombre}`});
    for (const e of EXTRAS_NIVEL[n] || []) {
      if (e.t === "cofre") out.push({t: "cofre", id: e.id, txt: `${COFRES[e.id].nombre} de regalo`});
      if (e.t === "combo") out.push({t: "combo", txt: `Combo máximo ×${e.n}`});
    }
    return out;
  }

  function misionesHoy() {
    if (d.misiones.dia !== fecha()) {
      const n = nivel(), ids = Object.keys(MISIONES).filter((k) => (MISIONES[k].nivel || 1) <= n);
      for (let i = ids.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
      d.misiones = {dia: fecha(), lista: ids.slice(0, 3).map((id) => ({id, prog: 0, cobrada: false}))};
      guardar();
    }
    return d.misiones.lista.map((m) => Object.assign({}, m, MISIONES[m.id]));
  }

  // Al terminar una partida: polvo y experiencia (un punto = un polvo = un punto de experiencia), misiones y subidas de nivel.
  function premiarPartida(r) {
    misionesHoy();
    const nivelAntes = nivel(), xpAntes = d.xp;
    d.polvo += r.puntos; d.xp += r.puntos; d.partidas++; d.mejor = Math.max(d.mejor, r.puntos);
    const hechas = [];
    for (const m of d.misiones.lista) {
      const def = MISIONES[m.id];
      if (!def || m.cobrada) continue;
      const v = def.medir(r);
      m.prog = def.acum ? m.prog + v : Math.max(m.prog, v);
      if (m.prog >= def.meta) { m.cobrada = true; d.polvo += def.premio; hechas.push(def); }
    }
    const subidas = [];
    for (let n = nivelAntes + 1; n <= nivel(); n++) {
      const premios = premiosDeNivel(n), polvo = 100 * n;
      d.polvo += polvo;
      for (const p of premios) if (p.t === "cofre") d.cofres[p.id] = (d.cofres[p.id] || 0) + 1;
      subidas.push({nivel: n, premios, polvo});
    }
    guardar();
    return {polvo: r.puntos, xpAntes, nivelAntes, nivelDespues: nivel(), subidas, misiones: hechas};
  }

  function tirar(prob) {
    let x = Math.random() * Object.values(prob).reduce((a, b) => a + b, 0);
    for (const [k, v] of Object.entries(prob)) { if ((x -= v) < 0) return k; }
    return Object.keys(prob)[0];
  }
  // Abre un cofre: primero gasta los que se tienen guardados; si no hay, lo paga con polvo. Devuelve null si no alcanza.
  function abrirCofre(id, gratis) {
    const c = COFRES[id];
    if (!gratis) {
      if (d.cofres[id] > 0) d.cofres[id]--;
      else if (d.polvo >= c.precio) d.polvo -= c.precio;
      else return null;
    }
    const antes = Object.keys(SKINS).filter(tieneSkin);
    const cartas = [];
    for (let i = 0; i < c.cartas; i++) {
      const rareza = tirar(c.prob), lista = COLECCION.filter((x) => x.rareza === rareza);
      const item = lista[(Math.random() * lista.length) | 0], nuevo = !d.coleccion[item.id];
      d.coleccion[item.id] = (d.coleccion[item.id] || 0) + 1;
      const polvo = nuevo ? 0 : RAREZAS[rareza].polvo;
      d.polvo += polvo;
      cartas.push({item, nuevo, polvo});
    }
    const skins = Object.keys(SKINS).filter((s) => tieneSkin(s) && !antes.includes(s));
    guardar();
    return {cofre: id, cartas, skins};
  }

  const diarioDisponible = () => d.ultimoDiario !== fecha();
  function reclamarDiario() {
    if (!diarioDisponible()) return null;
    d.racha = d.ultimoDiario === ayer() ? d.racha + 1 : 1;
    d.ultimoDiario = fecha();
    const extra = 50 * Math.min(7, d.racha);
    d.polvo += extra;
    const r = abrirCofre(d.racha % 7 === 0 ? "nebulosa" : "asteroide", true);
    r.racha = d.racha; r.extra = extra;
    return r;
  }

  function comprarSkin(id) {
    const req = SKINS[id].req;
    if (!req || req.t !== "compra" || d.skins.includes(id) || d.polvo < req.precio) return false;
    d.polvo -= req.precio; d.skins.push(id); guardar(); return true;
  }
  function poner(campo, valor) {
    if (campo === "skin" && !tieneSkin(valor)) return false;
    if (campo === "estela" && !tieneEstela(valor)) return false;
    d[campo] = valor; guardar(); return true;
  }
  function configJuego() {
    if (!tieneSkin(d.skin)) d.skin = "clasico";
    if (!tieneEstela(d.estela)) d.estela = "ninguna";
    return {habilidades: habilidades(), comboMax: comboMax(), skin: d.skin, estela: d.estela, control: d.control};
  }

  return {get datos() { return d; }, get cuenta() { return cuenta; }, alCambiar: null, guardar, iniciarCuenta, registrar, entrar, recuperar, salir,
          accion, borrarCuenta, apuntarPartida, subir, xpPara, nivel, comboMax, habilidades, total, setCompleto, tieneSkin, tieneEstela, textoReq,
          premiosDeNivel, misionesHoy, premiarPartida, abrirCofre, diarioDisponible, reclamarDiario, comprarSkin, poner, configJuego};
})();
