// ===============================
// ===== BLACKJACK REALISTA ======
// ===== APUESTAS + HISTORIAL ====
// ===== MUSICA + SFX (JS) =======
// ===============================

// ====== BARAJA ======
let baraja = [];
const tipoCarta = ["C", "D", "P", "T"]; // C trébol, D diamante, P picas, T corazones
const especiales = ["A", "K", "Q", "J"];

// ====== PUNTOS ======
let puntosJugador = 0;
let puntosBanca = 0;

// ====== SISTEMA DINERO / APUESTAS ======
let saldo = 5000;
let apuesta = 0;
let apuestaConfirmada = false;
let rondaTerminada = false;

// ====== BANCA / CARTA OCULTA ======
let cartaOculta = null; // carta real (string)
let imgCartaOculta = null; // <img> del back.svg

// ====== DELAYS (más lento como quieres) ======
const DELAY_REPARTO_MS = 780;   // antes 520
const DELAY_CARTA_MS = 650;     // antes 420
const DELAY_BANCA_MS = 1450;    // antes 1250 (banca más lenta)

// ====== HISTORIAL ======
let historial = [];

// ===============================
// ===== REFERENCIAS AL HTML =====
// ===============================
const btnNuevo = document.querySelector(".boton1");
const btnPedir = document.querySelector(".boton2");
const btnPasar = document.querySelector(".boton3");

const divJugadorCartas = document.querySelector("#jugador-cartas");
const divBancaCartas = document.querySelector("#banca-cartas");

const marcadorJugador = document.querySelector("#puntos-jugador");
const marcadorBanca = document.querySelector("#puntos-banca");

const textoGanador = document.querySelector("#ganador");

// apuestas
const elSaldo = document.querySelector("#saldo");
const elApuestaActual = document.querySelector("#apuesta-actual");
const inputApuesta = document.querySelector("#input-apuesta");
const btnApostar = document.querySelector("#btn-apostar");
const btnAllIn = document.querySelector("#btn-allin");
const btnLimpiar = document.querySelector("#btn-limpiar");
const msgApuesta = document.querySelector("#msg-apuesta");
const chips = document.querySelectorAll(".chip");

// sonido
const btnMute = document.querySelector("#btn-mute");

// historial
const historialLista = document.querySelector("#historial-lista");

// ===============================
// ===== MUSICA AMBIENTAL ========
// ===============================
const musica = new Audio("Audio/fondo.mp3");
musica.loop = true;
musica.volume = 0.18; // música bajita

let musicaIniciada = false;
let musicaMuteada = false;

const intentarIniciarMusica = async () => {
  if (musicaIniciada) return;
  musicaIniciada = true;
  try {
    await musica.play();
  } catch (e) {}
};

// ===============================
// ===== SFX (SIN ARCHIVOS) ======
// ===============================
let audioCtx = null;

const ensureAudioCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
};

const beep = (freq, durationMs, type = "sine", gain = 0.09) => {
  try {
    ensureAudioCtx();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => o.stop(), durationMs);
  } catch (e) {}
};

const sfxCarta = () => beep(620, 70, "square", 0.12);
const sfxWin = () => { beep(880, 140, "sine", 0.13); setTimeout(() => beep(1100, 160, "sine", 0.13), 160); };
const sfxLose = () => { beep(220, 190, "sawtooth", 0.12); setTimeout(() => beep(180, 210, "sawtooth", 0.11), 190); };
const sfxWarn = () => { beep(300, 110, "triangle", 0.11); setTimeout(() => beep(300, 110, "triangle", 0.11), 140); };

// ===============================
// ===== FUNCIONES AUXILIARES ====
// ===============================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const renderDinero = () => {
  elSaldo.textContent = saldo;
  elApuestaActual.textContent = apuesta;
};

const setMsg = (txt, ok = false) => {
  msgApuesta.textContent = txt;
  msgApuesta.style.color = ok ? "#00ff88" : "#ffd700";
};

const bloquearJuego = (bloquear) => {
  btnPedir.disabled = bloquear;
  btnPasar.disabled = bloquear;
};

const bloquearApuestas = (bloquear) => {
  inputApuesta.disabled = bloquear;
  btnApostar.disabled = bloquear;
  btnAllIn.disabled = bloquear;
  btnLimpiar.disabled = bloquear;
  chips.forEach((b) => (b.disabled = bloquear));
};

// ===============================
// ===== CREAR BARAJA ============
// ===============================
const crearBaraja = () => {
  baraja = [];

  for (let i = 2; i <= 10; i++) {
    for (let tipo of tipoCarta) baraja.push(i + tipo);
  }
  for (let esp of especiales) {
    for (let tipo of tipoCarta) baraja.push(esp + tipo);
  }

  baraja = _.shuffle(baraja);
  return baraja;
};

const pedirCarta = () => {
  if (baraja.length === 0) throw "No hay más cartas";
  return baraja.pop();
};

// ===============================
// ===== VALOR CARTA + AS REAL ====
// ===============================
const valorBase = (carta) => {
  const v = carta.slice(0, -1);
  if (!isNaN(v)) return Number(v);
  if (v === "A") return 11;
  return 10;
};

const ajustarAses = (cartas, total) => {
  let ases = cartas.filter((c) => c.startsWith("A")).length;
  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }
  return total;
};

// ===============================
// ===== MOSTRAR CARTAS ===========
// ===============================
const crearImgCarta = (src) => {
  const img = document.createElement("img");
  img.classList.add("carta");
  img.src = src;
  img.alt = "carta";
  img.loading = "eager";
  return img;
};

const mostrarCarta = (carta, contenedor) => {
  const img = crearImgCarta(`Imagenes/cartas_svg_mejoradas/${carta}.svg`);
  contenedor.append(img);
};

const mostrarCartaOcultaBanca = (contenedor) => {
  // back.svg en Proyecto/Imagenes/back.svg
  imgCartaOculta = crearImgCarta("Imagenes/back.svg");
  contenedor.append(imgCartaOculta);
};

const revelarCartaOculta = () => {
  if (!imgCartaOculta || !cartaOculta) return;
  imgCartaOculta.src = `Imagenes/cartas_svg_mejoradas/${cartaOculta}.svg`;
};

// ===============================
// ===== HISTORIAL ===============
// ===============================
const horaAhora = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `[${hh}:${mm}:${ss}]`;
};

const renderHistorial = () => {
  historialLista.innerHTML = "";
  historial.slice().reverse().forEach((linea) => {
    const div = document.createElement("div");
    div.className = "hist-item";
    div.innerHTML = linea;
    historialLista.append(div);
  });
};

const pushHistorial = (resultadoTxt) => {
  const linea = `${horaAhora()} <b>${resultadoTxt}</b> | Apuesta: ${apuesta} | Tú: ${puntosJugador} | Banca: ${puntosBanca} | Saldo: ${saldo}`;
  historial.push(linea);
  if (historial.length > 25) historial.shift();
  renderHistorial();
};

// ===============================
// ===== RESETEAR MESA ===========
// ===============================
let cartasJugador = [];
let cartasBanca = [];

const resetMesa = () => {
  puntosJugador = 0;
  puntosBanca = 0;

  cartasJugador = [];
  cartasBanca = [];

  marcadorJugador.textContent = 0;
  marcadorBanca.textContent = "?";

  divJugadorCartas.innerHTML = "";
  divBancaCartas.innerHTML = "";

  textoGanador.textContent = "";
  rondaTerminada = false;

  cartaOculta = null;
  imgCartaOculta = null;
};

// ===============================
// ===== PAGAR RESULTADO =========
// ===============================
const pagarResultado = (resultado) => {
  if (!apuestaConfirmada) return;

  if (resultado === "gana") {
    saldo += apuesta;
    setMsg(`Has ganado +${apuesta} fichas`, true);
    sfxWin();
  } else if (resultado === "pierde") {
    saldo -= apuesta;
    setMsg(`Has perdido -${apuesta} fichas`);
    sfxLose();
  } else {
    setMsg(`Empate: recuperas tu apuesta`, true);
  }

  pushHistorial(
    resultado === "gana" ? "GANAS" : resultado === "pierde" ? "PIERDES" : "Empate"
  );

  apuesta = 0;
  apuestaConfirmada = false;
  renderDinero();

  if (saldo <= 0) {
    saldo = 0;
    renderDinero();
    setMsg("Te has quedado sin fichas. Recarga la página para volver a 5000.");
    bloquearJuego(true);
    bloquearApuestas(true);
    sfxWarn();
  } else {
    bloquearApuestas(false);
    bloquearJuego(true);
  }
};

const finalizarRonda = (resultadoTexto, resultadoPago) => {
  textoGanador.textContent = resultadoTexto;
  rondaTerminada = true;
  bloquearJuego(true);
  pagarResultado(resultadoPago);
};

// ===============================
// ===== REPARTO INICIAL =========
// ===============================
const actualizarPuntosJugador = () => {
  let total = cartasJugador.reduce((acc, c) => acc + valorBase(c), 0);
  total = ajustarAses(cartasJugador, total);
  puntosJugador = total;
  marcadorJugador.textContent = puntosJugador;
};

const actualizarPuntosBanca = (mostrar = false) => {
  if (!mostrar) {
    marcadorBanca.textContent = "?";
    return;
  }
  let total = cartasBanca.reduce((acc, c) => acc + valorBase(c), 0);
  total = ajustarAses(cartasBanca, total);
  puntosBanca = total;
  marcadorBanca.textContent = puntosBanca;
};

const repartirInicial = async () => {
  // === ORDEN REALISTA (y el back.svg queda a la DERECHA) ===
  // Banca: 1 visible (izquierda) + 1 oculta (derecha)
  // Jugador: 2 visibles

  await sleep(DELAY_REPARTO_MS);

  // Jugador 1
  let c1 = pedirCarta();
  cartasJugador.push(c1);
  mostrarCarta(c1, divJugadorCartas);
  sfxCarta();
  actualizarPuntosJugador();

  await sleep(DELAY_REPARTO_MS);

  // Banca 1 (VISIBLE PRIMERO)
  let bVisible = pedirCarta();
  cartasBanca.push(bVisible);
  mostrarCarta(bVisible, divBancaCartas);
  sfxCarta();

  await sleep(DELAY_REPARTO_MS);

  // Jugador 2
  let c2 = pedirCarta();
  cartasJugador.push(c2);
  mostrarCarta(c2, divJugadorCartas);
  sfxCarta();
  actualizarPuntosJugador();

  await sleep(DELAY_REPARTO_MS);

  // Banca 2 (OCULTA A LA DERECHA)
  let bOculta = pedirCarta();
  cartasBanca.push(bOculta);
  cartaOculta = bOculta;
  mostrarCartaOcultaBanca(divBancaCartas);
  sfxCarta();

  actualizarPuntosBanca(false);

  // Blackjack natural (21)
  if (puntosJugador === 21) {
    bloquearJuego(true);
    await sleep(500);
    await turnoBanca(true);
  }
};

// ===============================
// ===== TURNO BANCA (LENTO) =====
// ===============================
const turnoBanca = async (revelarPrimero = true) => {
  // Si la ronda ya terminó, no hace nada
  if (rondaTerminada) return;

  if (revelarPrimero) {
    revelarCartaOculta();
    actualizarPuntosBanca(true);
    await sleep(700);
  }

  // Regla: banca pide hasta 17
  while (puntosBanca < 17) {
    await sleep(DELAY_BANCA_MS);

    const carta = pedirCarta();
    cartasBanca.push(carta);
    mostrarCarta(carta, divBancaCartas);
    sfxCarta();

    actualizarPuntosBanca(true);
    await sleep(DELAY_CARTA_MS);
  }

  // decidir ganador
  if (puntosBanca > 21) {
    finalizarRonda("¡Tú ganas! La banca se pasó", "gana");
  } else if (puntosBanca === puntosJugador) {
    finalizarRonda("Empate", "empate");
  } else if (puntosJugador > puntosBanca) {
    finalizarRonda("¡Tú ganas!", "gana");
  } else {
    finalizarRonda("La banca gana", "pierde");
  }
};

// ===============================
// ===== APUESTAS: CONFIRMAR =====
// ===============================
const intentarConfirmarApuesta = async (cantidad) => {
  const num = Number(cantidad);

  if (!Number.isFinite(num) || num <= 0) {
    setMsg("La apuesta debe ser mayor que 0");
    sfxWarn();
    return;
  }
  if (num > saldo) {
    setMsg("No puedes apostar más de tu saldo");
    sfxWarn();
    return;
  }
  if (num % 10 !== 0) {
    setMsg("La apuesta debe ser múltiplo de 10");
    sfxWarn();
    return;
  }

  apuesta = num;
  apuestaConfirmada = true;
  renderDinero();

  setMsg(`Apuesta confirmada: ${apuesta} fichas`, true);

  bloquearApuestas(true);
  bloquearJuego(false);

  crearBaraja();
  resetMesa();

  await repartirInicial();
};

// ===============================
// ===== EVENTOS APUESTAS ========
// ===============================
chips.forEach((b) => {
  b.addEventListener("click", () => {
    intentarIniciarMusica();
    ensureAudioCtx();

    const val = Number(b.dataset.valor);
    if (!Number.isFinite(val)) return;

    if (apuesta + val > saldo) {
      setMsg("No puedes superar tu saldo");
      sfxWarn();
      return;
    }

    apuesta += val;
    renderDinero();
    setMsg("Selecciona o confirma la apuesta", true);
    beep(520, 60, "square", 0.06);
  });
});

btnLimpiar.addEventListener("click", () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  apuesta = 0;
  apuestaConfirmada = false;
  renderDinero();
  setMsg("Apuesta limpiada", true);
  beep(420, 60, "triangle", 0.06);
});

btnAllIn.addEventListener("click", () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  apuesta = saldo;
  renderDinero();
  setMsg("All-in seleccionado. Confirma la apuesta.", true);
  beep(560, 70, "square", 0.07);
});

btnApostar.addEventListener("click", async () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  const escrito = inputApuesta.value.trim();
  if (escrito !== "") {
    await intentarConfirmarApuesta(escrito);
  } else {
    await intentarConfirmarApuesta(apuesta);
  }
});

inputApuesta.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnApostar.click();
});

// ===============================
// ===== EVENTOS DEL JUEGO =======
// ===============================
btnNuevo.addEventListener("click", () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  resetMesa();
  crearBaraja();

  apuestaConfirmada = false;
  apuesta = 0;
  renderDinero();

  setMsg("Elige tu apuesta para empezar", true);

  bloquearJuego(true);
  bloquearApuestas(false);
});

// Pedir carta (jugador)
btnPedir.addEventListener("click", async () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  if (!apuestaConfirmada || rondaTerminada) return;

  await sleep(DELAY_CARTA_MS);

  const carta = pedirCarta();
  cartasJugador.push(carta);
  mostrarCarta(carta, divJugadorCartas);
  sfxCarta();

  actualizarPuntosJugador();

  // ✅ SI TE PASAS, SE ACABA YA (NO JUEGA BANCA)
  if (puntosJugador > 21) {
    finalizarRonda("Te pasaste, gana la banca", "pierde");
    return;
  }

  // si llegas a 21 exacto, entonces sí: banca revela y juega
  if (puntosJugador === 21) {
    bloquearJuego(true);
    await sleep(450);
    await turnoBanca(true);
  }
});

// Plantarse
btnPasar.addEventListener("click", async () => {
  intentarIniciarMusica();
  ensureAudioCtx();

  if (!apuestaConfirmada || rondaTerminada) return;

  bloquearJuego(true);
  await turnoBanca(true);
});

// ===============================
// ===== BOTÓN MUTE (solo música) =
// ===============================
const renderMuteBtn = () => {
  btnMute.classList.toggle("is-muted", musicaMuteada);
  btnMute.querySelector(".icono").textContent = musicaMuteada ? "🔇" : "🔊";
  btnMute.querySelector(".texto").textContent = musicaMuteada ? "Mute" : "Sonido";
};

btnMute.addEventListener("click", async () => {
  await intentarIniciarMusica();
  musicaMuteada = !musicaMuteada;
  musica.muted = musicaMuteada;

  if (!musicaMuteada) {
    try { await musica.play(); } catch (e) {}
  }
  renderMuteBtn();
});

// ===============================
// ===== INICIO ==================
// ===============================
crearBaraja();
renderDinero();
setMsg("Elige tu apuesta para empezar", true);
bloquearJuego(true);
bloquearApuestas(false);
renderHistorial();
renderMuteBtn();