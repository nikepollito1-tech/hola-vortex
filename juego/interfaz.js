"use strict";
// Pantallas del metajuego: inicio, tienda de cofres, apertura, colección, skins/habilidades y fin de partida.
(() => {
  if (DEMO) { for (const s of document.querySelectorAll(".pantalla")) s.hidden = true; return; }
  const fmtN = (n) => Math.round(n).toLocaleString("es-ES");
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const D = () => Progreso.datos;

  // ---------- navegación ----------
  let actual = "inicio", vuelta = "inicio";
  function mostrar(id) {
    if (actual === "cofre" && id !== "cofre") Cofre.cerrar();
    Sonido.atenuar(id === "cofre");
    for (const s of document.querySelectorAll(".pantalla")) s.hidden = s.id !== id;
    document.body.classList.toggle("en-menu", !!id);
    actual = id;
    if (id) { const s = $(id); s.scrollTop = 0; s.classList.remove("aparece"); void s.offsetWidth; s.classList.add("aparece"); }
    if (id === "cuenta") pintarCuenta();
    if (id === "inicio") pintarInicio();
    if (id === "tienda") pintarTienda();
    if (id === "coleccion") pintarColeccion();
    if (id === "vortex") pintarVortex();
  }
  for (const b of document.querySelectorAll("[data-ir]")) b.addEventListener("click", () => mostrar(b.dataset.ir));

  // ---------- arte de las cartas (se pinta una vez y se guarda) ----------
  const ARTE = {};
  let urlVortex = "img/vortex_curioso.svg";
  function arte(item) {
    if (item.arte.t === "vortex") return urlVortex;
    if (!ARTE[item.id] || (window.TresD && !TresD.completo)) { const c = document.createElement("canvas"); c.width = c.height = 200; pintarArte(c.getContext("2d"), item.arte, 200); ARTE[item.id] = c.toDataURL("image/png"); }
    return ARTE[item.id];
  }
  function carta(item, opc = {}) {
    const c = el("div", "carta" + (opc.grande ? " grande" : "") + (opc.falta ? " falta" : ""));
    c.style.setProperty("--r", opc.falta ? "#3A3570" : RAREZAS[item.rareza].color);
    const img = el("img"); img.alt = ""; img.loading = "lazy"; img.src = arte(item); c.append(img);
    c.append(el("div", "rz", RAREZAS[item.rareza].nombre), el("div", "nm", opc.falta ? "???" : item.nombre));
    if (opc.veces > 1) c.append(el("span", "x", "×" + opc.veces));
    if (opc.grande) {
      c.append(el("p", "dato", item.dato));
      if (opc.nuevo === true) c.append(el("span", "nuevo", "¡NUEVO!"));
      if (opc.nuevo === false) c.append(el("span", "rep", `Repetido · +${fmtN(opc.polvo)} de polvo`));
    }
    return c;
  }

  // ---------- cabecera de nivel ----------
  function barraNivel(chip, barra, txt, xp = D().xp) {
    const n = Progreso.nivel(xp), a = Progreso.xpPara(n), b = Progreso.xpPara(n + 1);
    chip.textContent = "Nv " + n;
    barra.style.width = Math.max(3, Math.min(100, (xp - a) / (b - a) * 100)) + "%";
    if (txt) txt.textContent = `${fmtN(xp - a)} / ${fmtN(b - a)}`;
  }

  // ---------- inicio ----------
  async function pintarInicio() {
    const cu = Progreso.cuenta;
    $("perfil-nombre").textContent = cu ? cu.nombre : "Invitado";
    $("perfil-sub").textContent = cu ? "Progreso guardado en tu cuenta" : "Toca para crear tu cuenta o entrar";
    $("perfil").classList.toggle("conectado", !!cu);
    $("aviso-cuenta").hidden = !!cu || D().partidas < 1;
    if (!$("ic-cofre").src) $("ic-cofre").src = Cofre.imagen("nebulosa", 96);
    barraNivel($("chip-nivel"), $("xp-barra"), $("xp-txt"));
    $("chip-polvo").textContent = fmtN(D().polvo);
    const guardados = Object.values(D().cofres).reduce((a, b) => a + b, 0), alcanza = Object.values(COFRES).some((c) => D().polvo >= c.precio);
    $("n-cofres").textContent = guardados ? `${guardados} por abrir` : alcanza ? "¡te llega para uno!" : "tienda";
    $("n-cofres").className = guardados || alcanza ? "aviso" : "";
    $("n-coleccion").textContent = `${Progreso.total()}/${COLECCION.length}`;
    const dia = $("diario");
    dia.hidden = !Progreso.diarioDisponible();
    dia.textContent = `Cofre gratis de hoy${D().racha && D().ultimoDiario ? ` · racha de ${D().racha} día${D().racha === 1 ? "" : "s"}` : ""}`;
    const ul = $("misiones"); ul.textContent = "";
    for (const m of Progreso.misionesHoy()) {
      const li = el("li", m.cobrada ? "hecha" : "");
      const barra = el("div", "barra"), i = el("i"); i.style.width = Math.min(100, m.prog / m.meta * 100) + "%"; barra.append(i);
      li.append(el("span", "", (m.cobrada ? "✓ " : "") + m.txt), el("span", "premio", m.cobrada ? "cobrada" : `+${fmtN(m.premio)} ✦`), barra);
      ul.append(li);
    }
    try {
      $("cara-inicio").src = await Juego.urlCara(D().skin, "hambriento"); urlVortex = await Juego.urlCara(D().skin, "curioso");
      $("perfil-cara").src = urlVortex; $("ic-vortex").src = urlVortex;
    } catch (e) {}
  }
  $("ir-tienda").addEventListener("click", () => { vuelta = "inicio"; mostrar("tienda"); });
  $("perfil").addEventListener("click", () => mostrar("cuenta"));
  $("aviso-cuenta").addEventListener("click", () => { pestana("registro"); mostrar("cuenta"); });
  $("ir-coleccion").addEventListener("click", () => mostrar("coleccion"));
  $("ir-vortex").addEventListener("click", () => mostrar("vortex"));
  $("diario").addEventListener("click", () => { const r = Progreso.reclamarDiario(); if (r) { vuelta = "inicio"; abrir(r, `Racha de ${r.racha} día${r.racha === 1 ? "" : "s"}: +${fmtN(r.extra)} de polvo`); } });

  // ---------- tienda ----------
  function cofreArte(id) { const i = el("img", "cofre-img"); i.alt = ""; i.src = Cofre.imagen(id, 220); return i; }
  function pintarTienda() {
    $("polvo-tienda").textContent = fmtN(D().polvo);
    const cont = $("lista-cofres"); cont.textContent = "";
    for (const [id, c] of Object.entries(COFRES)) {
      const o = el("div", "oferta"), tengo = D().cofres[id] || 0;
      o.style.setProperty("--c", c.color);
      o.append(cofreArte(id));
      const h = el("h3", "", `${c.nombre} · ${c.cartas} carta${c.cartas > 1 ? "s" : ""}`); o.append(h);
      const prob = el("div", "prob");
      const suma = Object.values(c.prob).reduce((a, b) => a + b, 0);
      for (const r of ORDEN_RAREZA) if (c.prob[r]) { const b = el("b", "", `${RAREZAS[r].nombre} ${(c.prob[r] / suma * 100).toLocaleString("es-ES", {maximumFractionDigits: 1})} %`); b.style.color = RAREZAS[r].color; prob.append(b, " · "); }
      prob.lastChild.remove(); o.append(prob);
      const b = el("button", tengo ? "tengo" : "", tengo ? `Abrir (tienes ${tengo})` : `Abrir por ${fmtN(c.precio)} ✦`);
      b.type = "button"; b.disabled = !tengo && D().polvo < c.precio;
      if (b.disabled) b.textContent = `Te faltan ${fmtN(c.precio - D().polvo)} ✦`;
      b.addEventListener("click", () => { const r = Progreso.abrirCofre(id); if (r) abrir(r); });
      o.append(b); cont.append(o);
    }
  }

  // ---------- apertura de un cofre (la animación vive en cofre.js) ----------
  let ultimoCofre = null;
  function abrir(res, nota) {
    ultimoCofre = res;
    mostrar("cofre");
    $("cofre-final").hidden = true;
    Cofre.abrir(res, {nota, carta, alTerminar: () => final(res)});
  }
  function final(res) {
    const caja = $("cofre-final"), r = $("cofre-resumen");
    r.textContent = "";
    res.cartas.forEach((c, i) => {
      const k = carta(c.item, {veces: 0});
      k.classList.add("en-resumen"); if (c.nuevo) k.classList.add("es-nueva");
      k.style.animationDelay = i * 0.12 + "s";
      if (c.nuevo) k.append(el("span", "chapa", "NUEVA"));
      r.append(k);
    });
    r.style.gridTemplateColumns = `repeat(${Math.min(3, res.cartas.length)}, minmax(0, 110px))`;
    const devuelto = res.cartas.reduce((a, c) => a + c.polvo, 0), nuevas = res.cartas.filter((c) => c.nuevo).length;
    const t = $("cofre-resumen-txt"); t.textContent = "";
    t.append(el("span", "", `${nuevas} nueva${nuevas === 1 ? "" : "s"}`));
    if (devuelto) t.append(el("span", "polvo", `+${fmtN(devuelto)} ✦ por repetidas`));
    t.append(el("span", "", `Colección ${Progreso.total()}/${COLECCION.length}`));
    for (const sk of res.skins) t.append(el("span", "skin", `¡Skin desbloqueada: ${SKINS[sk].nombre}!`));
    const puede = Object.entries(COFRES).some(([id, c]) => (D().cofres[id] || 0) > 0 || D().polvo >= c.precio);
    $("cofre-otro").disabled = !puede;
    caja.hidden = false;
  }
  $("cofre-salir").addEventListener("click", () => mostrar(vuelta));
  $("cofre-otro").addEventListener("click", () => {
    // si queda uno igual guardado o alcanza el polvo, se abre otro del mismo tipo sin pasar por la tienda
    const id = ultimoCofre && ultimoCofre.cofre;
    if (id && ((D().cofres[id] || 0) > 0 || D().polvo >= COFRES[id].precio)) { const r = Progreso.abrirCofre(id); if (r) return abrir(r); }
    mostrar("tienda");
  });

  // ---------- colección ----------
  function pintarColeccion() {
    const t = Progreso.total();
    $("total-coleccion").textContent = `${t}/${COLECCION.length}`;
    $("barra-coleccion").style.width = t / COLECCION.length * 100 + "%";
    const cont = $("rejillas"); cont.textContent = "";
    for (const [cat, nombre] of CATEGORIAS) {
      const items = COLECCION.filter((x) => x.cat === cat).sort((a, b) => ORDEN_RAREZA.indexOf(a.rareza) - ORDEN_RAREZA.indexOf(b.rareza));
      const h = el("h2", "cat"); h.append(el("span", "", nombre), el("small", "", `${items.filter((x) => D().coleccion[x.id]).length}/${items.length}`)); cont.append(h);
      const g = el("div", "rejilla");
      for (const it of items) {
        const veces = D().coleccion[it.id] || 0, c = carta(it, {falta: !veces, veces});
        if (veces) c.addEventListener("click", () => { $("carta-detalle").replaceWith(Object.assign(carta(it, {grande: true}), {id: "carta-detalle"})); $("detalle").hidden = false; });
        g.append(c);
      }
      cont.append(g);
    }
  }
  $("cerrar-detalle").addEventListener("click", () => { $("detalle").hidden = true; });

  // ---------- Vórtex: skins, estelas, habilidades, control ----------
  async function pintarVortex() {
    $("polvo-vortex").textContent = fmtN(D().polvo);
    const cont = $("lista-skins"); cont.textContent = "";
    for (const [id, s] of Object.entries(SKINS)) {
      const tiene = Progreso.tieneSkin(id), puesta = D().skin === id;
      const c = el("div", "carta" + (puesta ? " puesta" : "") + (tiene ? "" : " bloq"));
      c.style.setProperty("--r", s.anillo ? s.anillo[Math.min(1, s.anillo.length - 1)] : "#FFC247");
      const img = el("img"); img.alt = ""; c.append(img);
      Juego.urlCara(id, "curioso").then((u) => { img.src = u; }).catch(() => {});
      if (!tiene) img.style.opacity = ".45";
      c.append(el("div", "nm", s.nombre), el("div", "rz", puesta ? "Puesta" : tiene ? "Usar" : Progreso.textoReq(s.req)));
      c.addEventListener("click", () => {
        if (tiene) { Progreso.poner("skin", id); pintarVortex(); }
        else if (s.req.t === "compra" && Progreso.comprarSkin(id)) { Progreso.poner("skin", id); Juego.sonar("compra"); pintarVortex(); }
      });
      cont.append(c);
    }
    const est = $("lista-estelas"); est.textContent = "";
    for (const [id, s] of Object.entries(ESTELAS)) {
      const tiene = Progreso.tieneEstela(id), b = el("button", D().estela === id ? "puesta" : "", tiene ? s.nombre : `${s.nombre} · ${Progreso.textoReq(s.req)}`);
      b.type = "button"; b.disabled = !tiene; b.addEventListener("click", () => { Progreso.poner("estela", id); pintarVortex(); }); est.append(b);
    }
    const n = Progreso.nivel(), hab = $("lista-habilidades"); hab.textContent = "";
    for (const h of HABILIDADES) {
      const li = el("li", h.nivel > n ? "bloq" : "");
      li.append(el("span", "ic", h.icono), el("b", "", h.nombre), el("span", "nv", h.nivel > n ? "Nivel " + h.nivel : "Activa"), el("small", "", h.desc)); hab.append(li);
    }
    const pre = $("lista-premios"); pre.textContent = "";
    let puestos = 0;
    for (let k = n + 1; k <= NIVEL_MAX_PREMIOS && puestos < 4; k++) {
      const ps = Progreso.premiosDeNivel(k); if (!ps.length) continue;
      const li = el("li", "bloq"); li.append(el("span", "ic", "🎁"), el("b", "", ps.map((p) => p.txt).join(" · ")), el("span", "nv", "Nivel " + k), el("small", "", `Te faltan ${fmtN(Progreso.xpPara(k) - D().xp)} puntos`)); pre.append(li); puestos++;
    }
    if (!puestos) pre.append(el("li", "", "Has desbloqueado todo. Vórtex está orgulloso."));
    const son = $("lista-sonido"); son.textContent = "";
    for (const [campo, txt] of [["efectos", "Efectos"], ["musica", "Música"]]) {
      const on = Sonido.prefs[campo], b = el("button", on ? "puesta" : "", `${txt}: ${on ? "sí" : "no"}`); b.type = "button";
      b.addEventListener("click", () => { Sonido.poner(campo, !Sonido.prefs[campo]); pintarVortex(); }); son.append(b);
    }
    const ctl = $("lista-control"); ctl.textContent = "";
    for (const [id, txt] of [["joystick", "Arrastrar (recomendado en móvil)"], ["seguir", "Seguir al dedo"]]) {
      const b = el("button", D().control === id ? "puesta" : "", txt); b.type = "button";
      b.addEventListener("click", () => { Progreso.poner("control", id); pintarVortex(); }); ctl.append(b);
    }
  }

  // ---------- partida ----------
  let ultima = null;
  async function jugar() {
    const cfg = Progreso.configJuego();
    Juego.configurar(cfg);
    await Juego.cargarSkin(cfg.skin);
    mostrar(null);
    Juego.empezar();
  }
  $("jugar").addEventListener("click", jugar);
  $("otra").addEventListener("click", jugar);
  $("fin-inicio").addEventListener("click", () => mostrar("inicio"));
  $("fin-cofres").addEventListener("click", () => { vuelta = "fin"; mostrar("tienda"); });

  // los puntos suben de 0 al total con un tic-tic de monedas
  function contar(e, valor, alAcabar) {
    const dur = Math.min(1600, 500 + valor / 4), t0 = performance.now();
    let ultimoTic = 0;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t0) / dur), v = Math.round(valor * (1 - Math.pow(1 - k, 3)));
      e.textContent = fmtN(v);
      if (ahora - ultimoTic > 55 && k < 1) { ultimoTic = ahora; Juego.sonar("cuenta"); }
      if (k < 1) requestAnimationFrame(paso); else { e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop"); if (alAcabar) alAcabar(); }
    };
    requestAnimationFrame(paso);
  }
  function resumen(r) {
    const T = Juego.TIPOS, O = Juego.ORDEN;
    const partes = O.filter((k) => r.comidos[k]).reverse().map((k) => `${r.comidos[k]} ${r.comidos[k] === 1 ? T[k].uno.replace(/^una? /, "") : T[k].varios}`);
    const mayorTxt = r.mayor >= 0 ? `Lo más grande: ${T[O[r.mayor]].uno}.` : "No te has comido nada… Vórtex sigue con hambre.";
    return (partes.length ? "Te has comido " + partes.slice(0, 4).join(", ") + ". " : "") + mayorTxt;
  }

  window.alTerminarPartida = (r) => {
    ultima = r;
    const cu = Progreso.cuenta;
    let apunte = null;
    if (cu && Juego.token) apunte = Progreso.apuntarPartida(fetch("api/puntuacion", {method: "POST", credentials: "same-origin",
      headers: {"Content-Type": "application/json"}, body: JSON.stringify({token: Juego.token, puntos: r.puntos})}).then((x) => x.json().then((d) => ({ok: x.ok, d}))));
    const mejorAntes = D().mejor;
    const g = Progreso.premiarPartida(r);
    const record = r.puntos > mejorAntes && mejorAntes > 0;
    $("record-fin").hidden = true;
    contar($("puntos-fin"), r.puntos, () => {
      if (record) { $("record-fin").hidden = false; Juego.sonar("record"); }
      g.misiones.forEach((m, i) => setTimeout(() => Juego.sonar("mision"), 500 + i * 380));
    });
    if (!record) Juego.sonar("fin");
    $("resumen-fin").textContent = resumen(r);
    Juego.urlCara(D().skin, r.puntos > 2000 ? "picaro" : r.puntos > 300 ? "hambriento" : "sorprendido").then((u) => { $("cara-fin").src = u; }).catch(() => {});
    $("polvo-fin").textContent = "+" + fmtN(r.puntos);
    // la barra arranca donde estaba y sube hasta donde queda
    barraNivel($("nivel-fin"), $("xp-fin"), $("xp-fin-txt"), g.xpAntes);
    const ul = $("premios-fin"); ul.textContent = "";
    for (const m of g.misiones) { const li = el("li"); li.append(el("b", "", `+${fmtN(m.premio)} ✦`), el("span", "", "Misión: " + m.txt)); ul.append(li); }
    for (const s of g.subidas) {
      ul.append(el("li", "sube", `¡Nivel ${s.nivel}!`));
      const li = el("li"); li.append(el("b", "", `+${fmtN(s.polvo)} ✦`), el("span", "", "Premio por subir de nivel")); ul.append(li);
      for (const p of s.premios) { const l2 = el("li"); l2.append(el("b", "", "★"), el("span", "", p.txt + (p.sub ? " " + p.sub : ""))); ul.append(l2); }
    }
    $("msg").textContent = ""; $("msg").className = "msg";
    $("guardar").disabled = false; $("form-nombre").hidden = !!cu;
    const gc = $("guardado-cuenta"); gc.hidden = !cu;
    if (cu) {
      gc.textContent = Juego.token ? "Guardando en tu cuenta…" : "Sin conexión: esta partida no ha contado para la clasificación.";
      if (apunte) apunte.then(({ok, d}) => {
        gc.textContent = ok ? (d.mejor > r.puntos ? `Guardado como ${d.nombre}. Tu mejor marca de la semana: ${fmtN(d.mejor)} (puesto ${d.posicion}).` : `¡Puesto ${d.posicion} de la semana, ${d.nombre}!`) : (d.detail || "No se pudo guardar.");
        if (ok) pintarRanking("top-fin", d.ranking.slice(0, 10), d.nombre);
      }).catch(() => { gc.textContent = "No se pudo guardar la partida."; });
    }
    try { $("nombre").value = localStorage.getItem("vortex-nombre") || ""; } catch (e) {}
    const guardados = Object.values(D().cofres).reduce((a, b) => a + b, 0), alcanza = Object.values(COFRES).some((c) => D().polvo >= c.precio);
    $("fin-cofres").textContent = guardados ? `Abrir cofre (${guardados})` : alcanza ? "¡Abrir un cofre!" : "Cofres";
    $("fin-cofres").style.borderColor = guardados || alcanza ? "var(--amber)" : "";
    $("fin-cofres").style.color = guardados || alcanza ? "var(--amber)" : "";
    for (const s of document.querySelectorAll(".pantalla")) s.hidden = s.id !== "fin";
    document.body.classList.add("en-menu"); actual = "fin"; $("fin").scrollTop = 0;
    setTimeout(() => {
      barraNivel($("nivel-fin"), $("xp-fin"), $("xp-fin-txt"));
      for (let i = 0; i < 8; i++) setTimeout(() => Juego.sonar("xp", i / 8), i * 90);
      if (g.subidas.length) setTimeout(() => Juego.sonar("nivel"), 800);
    }, 350);
    if (!apunte) cargarRanking("top-fin", 10);
  };

  // ---------- clasificación ----------
  function pintarRanking(id, lista, yo) {
    const ol = $(id);
    if (!lista.length) { ol.innerHTML = '<li class="vacio">Aún nadie. ¡Sé el primero!</li>'; return; }
    ol.textContent = "";
    lista.forEach((f, i) => {
      const li = el("li", yo && f.nombre.toLowerCase() === yo.toLowerCase() ? "yo" : "");
      li.append(el("span", "", `${i + 1}. ${f.nombre}`), el("b", "", fmtN(f.puntos))); ol.append(li);
    });
  }
  function cargarRanking(id, n, yo) {
    if (window.SIN_SERVIDOR) return;
    fetch("api/ranking?limite=" + n).then((r) => r.json()).then((d) => pintarRanking(id, d.ranking, yo))
      .catch(() => { $(id).innerHTML = '<li class="vacio">No se pudo cargar la clasificación.</li>'; });
  }
  $("form-nombre").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = $("nombre").value.trim(), msg = $("msg"), puntos = ultima ? ultima.puntos : 0;
    if (!Juego.token) { msg.textContent = "Sin conexión con el servidor: esta partida no se puede guardar."; msg.className = "msg error"; return; }
    $("guardar").disabled = true;
    try {
      const r = await fetch("api/puntuacion", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({token: Juego.token, nombre, puntos})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "No se pudo guardar.");
      try { localStorage.setItem("vortex-nombre", nombre); } catch (err) {}
      msg.textContent = d.mejor > puntos ? `Guardado. Tu mejor marca sigue siendo ${fmtN(d.mejor)} (puesto ${d.posicion}).` : `¡Puesto ${d.posicion} de la semana!`;
      pintarRanking("top-fin", d.ranking.slice(0, 10), nombre);
    } catch (err) { msg.textContent = err.message; msg.className = "msg error"; $("guardar").disabled = false; }
  });
  $("retar").addEventListener("click", async () => {
    const txt = `He hecho ${fmtN(ultima ? ultima.puntos : 0)} puntos en «Vórtex tiene hambre» 🕳️ y llevo ${Progreso.total()} de ${COLECCION.length} en la colección. ¿Me superas?`;
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({title: "Vórtex tiene hambre", text: txt, url});
      else { await navigator.clipboard.writeText(txt + " " + url); $("retar").textContent = "¡Copiado!"; }
    } catch (e) {}
  });

  // ---------- cuenta ----------
  function pestana(cual) {
    $("tab-registro").setAttribute("aria-selected", cual === "registro");
    $("tab-entrar").setAttribute("aria-selected", cual !== "registro");
    $("f-registro").hidden = cual !== "registro"; $("f-entrar").hidden = cual !== "entrar"; $("f-recuperar").hidden = cual !== "recuperar";
    for (const m of ["r-msg", "e-msg", "c-msg"]) { $(m).textContent = ""; $(m).className = "msg"; }
  }
  $("tab-registro").addEventListener("click", () => pestana("registro"));
  $("tab-entrar").addEventListener("click", () => pestana("entrar"));
  $("ir-recuperar").addEventListener("click", () => { $("c-nombre").value = $("e-nombre").value; pestana("recuperar"); });
  $("volver-entrar").addEventListener("click", () => pestana("entrar"));
  for (const b of document.querySelectorAll("[data-ojo]")) b.addEventListener("click", () => {
    const i = $(b.dataset.ojo), ver = i.type === "password"; i.type = ver ? "text" : "password"; b.textContent = ver ? "Ocultar" : "Ver";
  });
  $("r-clave").addEventListener("input", () => {
    const v = $("r-clave").value; let f = 0;
    if (v.length >= 8) f++; if (v.length >= 12) f++; if (/[A-ZÁÉÍÓÚÑ]/.test(v) && /[a-záéíóúñ]/.test(v)) f++; if (/[0-9]/.test(v)) f++; if (/[^A-Za-z0-9]/.test(v)) f++;
    const i = $("r-fuerza"); i.style.width = Math.max(4, f * 20) + "%"; i.style.background = f <= 1 ? "var(--coral)" : f <= 3 ? "var(--amber)" : "#9BE38D";
  });
  async function enviar(form, msg, fn) {
    const b = form.querySelector("button[type=submit]"), m = $(msg);
    b.disabled = true; m.textContent = "Un momento…"; m.className = "msg";
    try { await fn(); m.textContent = ""; }
    catch (err) { m.textContent = err.message; m.className = "msg error"; }
    finally { b.disabled = false; }
  }
  function enseñaCodigo(codigo, titulo) {
    $("codigo-txt").textContent = codigo;
    $("t-codigo").textContent = titulo;
    for (const s of document.querySelectorAll(".pantalla")) s.hidden = s.id !== "codigo";
    actual = "codigo";
  }
  $("codigo-copiar").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("codigo-txt").textContent); $("codigo-copiar").textContent = "¡Copiado!"; } catch (e) {}
  });
  $("codigo-ok").addEventListener("click", () => { $("codigo-copiar").textContent = "Copiar"; mostrar("inicio"); });
  $("f-registro").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "r-msg", async () => {
    if (!$("r-edad").checked) throw new Error("Marca la casilla para continuar.");
    const codigo = await Progreso.registrar($("r-nombre").value.trim(), $("r-clave").value, true);
    e.target.reset(); enseñaCodigo(codigo, "¡Cuenta lista!"); Juego.sonar("nivel");
  }); });
  $("f-entrar").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "e-msg", async () => {
    await Progreso.entrar($("e-nombre").value.trim(), $("e-clave").value);
    e.target.reset(); mostrar("inicio");
  }); });
  $("f-recuperar").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "c-msg", async () => {
    const codigo = await Progreso.recuperar($("c-nombre").value.trim(), $("c-codigo").value, $("c-nueva").value);
    e.target.reset(); enseñaCodigo(codigo, "Contraseña cambiada");
  }); });
  $("f-clave").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "k-msg", async () => {
    await Progreso.accion("cuenta/clave", {actual: $("k-actual").value, nueva: $("k-nueva").value});
    e.target.reset();
  }).then(() => { if (!$("k-msg").classList.contains("error")) $("k-msg").textContent = "Contraseña cambiada. Se ha cerrado la sesión en los demás dispositivos."; }); });
  $("f-codigo").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "n-msg", async () => {
    const d = await Progreso.accion("cuenta/codigo", {clave: $("n-clave").value});
    e.target.reset(); enseñaCodigo(d.codigo, "Código nuevo");
  }); });
  $("salir").addEventListener("click", async () => { $("salir").disabled = true; await Progreso.salir(); $("salir").disabled = false; mostrar("inicio"); });
  $("f-borrar").addEventListener("submit", (e) => { e.preventDefault(); enviar(e.target, "b-msg", async () => {
    await Progreso.borrarCuenta($("b-clave").value);
    e.target.reset(); mostrar("inicio");
  }); });
  async function pintarCuenta() {
    const cu = Progreso.cuenta;
    $("cuenta-fuera").hidden = !!cu; $("cuenta-dentro").hidden = !cu;
    $("t-cuenta").textContent = cu ? "Tu cuenta" : "Guarda tu progreso";
    if (!cu) { if ($("f-recuperar").hidden && $("f-entrar").hidden && $("f-registro").hidden) pestana("registro"); return; }
    $("ficha-nombre").textContent = cu.nombre;
    $("ficha-desde").textContent = "Jugando desde el " + new Date(cu.desde).toLocaleDateString("es-ES", {day: "numeric", month: "long", year: "numeric"});
    $("f-nivel").textContent = Progreso.nivel(); $("f-partidas").textContent = fmtN(D().partidas);
    $("f-mejor").textContent = fmtN(D().mejor); $("f-coleccion").textContent = `${Progreso.total()}/${COLECCION.length}`;
    for (const d of document.querySelectorAll("#cuenta-dentro details")) d.open = false;
    try { $("ficha-cara").src = await Juego.urlCara(D().skin, "picaro"); } catch (e) {}
  }
  Progreso.alCambiar = () => {
    if (actual === "inicio") pintarInicio();
    else if (actual === "cuenta") pintarCuenta();
    else if (actual === "tienda") pintarTienda();
    else if (actual === "coleccion") pintarColeccion();
    else if (actual === "vortex") pintarVortex();
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && !b.disabled && b.id !== "jugar" && b.id !== "otra" && !b.closest("#cofre")) Juego.sonar("toque");
  });
  Sonido.musica("menu");

  document.body.classList.add("en-menu");
  pintarInicio();
  cargarRanking("top-inicio", 5);
  Progreso.iniciarCuenta();
})();
