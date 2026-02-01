// ===============================
// ===== BLACKJACK + APUESTAS =====
// ===== BANCA + LENTA + AUDIO ====
// ===============================

// ====== BARAJA ======
let baraja = [];
const tipoCarta = ["C", "D", "P", "T"];
const especiales = ["A", "K", "Q", "J"];

// ====== PUNTOS ======
let puntosJugador = 0;
let puntosBanca = 0;

// ====== SISTEMA DINERO / APUESTAS ======
let saldo = 5000;
let apuesta = 0;
let apuestaConfirmada = false;
let rondaTerminada = false;

// ====== VELOCIDAD BANCA (más lenta) ======
const DELAY_BANCA_MS = 900; // antes 650. Sube/baja a tu gusto (850-1100 suele estar bien)

// ===============================
// ===== REFERENCIAS AL HTML =====
// ===============================

// Botones del juego
const btnNuevo = document.querySelector(".boton1");
const btnPedir = document.querySelector(".boton2");
const btnPasar = document.querySelector(".boton3");

// Divs donde se colocan las cartas
const divJugadorCartas = document.querySelector("#jugador-cartas");
const divBancaCartas = document.querySelector("#banca-cartas");

// Marcadores de puntos
const marcadorJugador = document.querySelectorAll("div.row.container h1 small")[0];
const marcadorBanca = document.querySelectorAll("div.row.container h1 small")[1];

// Texto final (ganador)
const textoGanador = document.querySelector("#ganador");

// Elementos de apuestas
const elSaldo = document.querySelector("#saldo");
const elApuestaActual = document.querySelector("#apuesta-actual");
const inputApuesta = document.querySelector("#input-apuesta");
const btnApostar = document.querySelector("#btn-apostar");
const btnAllIn = document.querySelector("#btn-allin");
const btnLimpiar = document.querySelector("#btn-limpiar");
const msgApuesta = document.querySelector("#msg-apuesta");
const chips = document.querySelectorAll(".chip");

// ===============================
// ===== AUDIO (archivos locales) =
// ===============================
// Mete los audios en /Audio/ con estos nombres:
// bg.mp3, card.wav, win.wav, lose.wav, push.wav

const audio = {
  bg: new Audio("Audio/bg.mp3"),
  card: new Audio("Audio/card.wav"),
  win: new Audio("Audio/win.wav"),
  lose: new Audio("Audio/lose.wav"),
  push: new Audio("Audio/push.wav"),
};

// Ajustes de volumen (modifica a gusto)
audio.bg.volume = 0.25;    // música bajita
audio.bg.loop = true;

audio.card.volume = 0.7;
audio.win.volume = 0.8;
audio.lose.volume = 0.8;
audio.push.volume = 0.8;

// Para que suenen repetidos rápido sin cortarse
const playSfx = (a) => {
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {
    // Si el navegador bloquea autoplay, no rompemos nada
  });
};

// Iniciar música SOLO tras una interacción del usuario (por políticas del navegador)
let musicaIniciada = false;
const intentarIniciarMusica = () => {
  if (musicaIniciada) return;
  musicaIniciada = true;
  audio.bg.play().catch(() => {});
};

// ===============================
// ===== FUNCIONES AUXILIARES ====
// ===============================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// ===============================
// ===== PEDIR / VALOR CARTA =====
// ===============================
const pedirCarta = () => {
  if (baraja.length === 0) throw "No hay más cartas";
  return baraja.pop();
};

const valorCarta = (carta) => {
  const puntos = carta.slice(0, -1);
  return isNaN(puntos) ? (puntos === "A" ? 11 : 10) : puntos * 1;
};

// ===============================
// ===== MOSTRAR CARTA EN HTML ====
// ===============================
const mostrarCarta = (carta, elementoHTML) => {
  const img = document.createElement("img");
  img.src = `Imagenes/cartas/${carta}.png`;
  img.classList.add("carta");
  elementoHTML.append(img);
};

// ===============================
// ===== RESETEAR MESA (MANO) ====
// ===============================
const resetMesa = () => {
  puntosJugador = 0;
  puntosBanca = 0;

  marcadorJugador.textContent = 0;
  marcadorBanca.textContent = 0;

  divJugadorCartas.innerHTML = "";
  divBancaCartas.innerHTML = "";

  textoGanador.textContent = "";
  rondaTerminada = false;
};

// ===============================
// ===== PAGAR RESULTADO =========
// ===============================
const pagarResultado = (resultado) => {
  if (!apuestaConfirmada) return;

  if (resultado === "gana") {
    saldo += apuesta;
    setMsg(`Has ganado +${apuesta} fichas`, true);
    playSfx(audio.win);
  } else if (resultado === "pierde") {
    saldo -= apuesta;
    setMsg(`Has perdido -${apuesta} fichas`);
    playSfx(audio.lose);
  } else {
    setMsg(`Empate: recuperas tu apuesta`, true);
    playSfx(audio.push);
  }

  apuesta = 0;
  apuestaConfirmada = false;
  renderDinero();

  if (saldo <= 0) {
    saldo = 0;
    renderDinero();
    setMsg("Te has quedado sin fichas. Recarga la página para volver a 5000.");
    bloquearJuego(true);
    bloquearApuestas(true);
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
// ===== TURNO BANCA (LENTO) =====
// ===============================
const turnoBanca = async () => {
  while (puntosBanca < puntosJugador && puntosJugador <= 21) {
    const carta = pedirCarta();
    puntosBanca += valorCarta(carta);
    marcadorBanca.textContent = puntosBanca;
    mostrarCarta(carta, divBancaCartas);

    playSfx(audio.card);
    await sleep(DELAY_BANCA_MS);
  }

  if (puntosJugador > 21) {
    finalizarRonda("Te pasaste, gana la banca", "pierde");
  } else if (puntosBanca > 21) {
    finalizarRonda("¡Tú ganas! La banca se pasó", "gana");
  } else if (puntosBanca === puntosJugador) {
    finalizarRonda("Empate", "empate");
  } else {
    finalizarRonda("La banca gana", "pierde");
  }
};

// ===============================
// ===== APUESTAS: CONFIRMAR =====
// ===============================
const intentarConfirmarApuesta = (cantidad) => {
  const num = Number(cantidad);

  if (!Number.isFinite(num) || num <= 0) {
    setMsg("La apuesta debe ser mayor que 0");
    return;
  }
  if (num > saldo) {
    setMsg("No puedes apostar más de tu saldo");
    return;
  }
  if (num % 10 !== 0) {
    setMsg("La apuesta debe ser múltiplo de 10");
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
};

// ===============================
// ===== EVENTOS APUESTAS ========
// ===============================
chips.forEach((b) => {
  b.addEventListener("click", () => {
    intentarIniciarMusica();

    const val = Number(b.dataset.valor);
    if (!Number.isFinite(val)) return;

    if (apuesta + val > saldo) {
      setMsg("No puedes superar tu saldo");
      return;
    }

    apuesta += val;
    renderDinero();
    setMsg("Selecciona o confirma la apuesta", true);
  });
});

btnLimpiar.addEventListener("click", () => {
  intentarIniciarMusica();

  apuesta = 0;
  apuestaConfirmada = false;
  renderDinero();
  setMsg("Apuesta limpiada", true);
});

btnAllIn.addEventListener("click", () => {
  intentarIniciarMusica();

  apuesta = saldo;
  renderDinero();
  setMsg("All-in seleccionado. Confirma la apuesta.", true);
});

btnApostar.addEventListener("click", () => {
  intentarIniciarMusica();

  const escrito = inputApuesta.value.trim();
  if (escrito !== "") {
    intentarConfirmarApuesta(escrito);
  } else {
    intentarConfirmarApuesta(apuesta);
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

  if (!apuestaConfirmada || rondaTerminada) return;

  const carta = pedirCarta();
  puntosJugador += valorCarta(carta);
  marcadorJugador.textContent = puntosJugador;
  mostrarCarta(carta, divJugadorCartas);

  playSfx(audio.card);

  if (puntosJugador > 21 || puntosJugador === 21) {
    bloquearJuego(true);
    await turnoBanca();
  }
});

// Plantarse
btnPasar.addEventListener("click", async () => {
  intentarIniciarMusica();

  if (!apuestaConfirmada || rondaTerminada) return;

  bloquearJuego(true);
  await turnoBanca();
});

// ===============================
// ===== INICIO ==================
// ===============================
crearBaraja();
renderDinero();
setMsg("Elige tu apuesta para empezar", true);

bloquearJuego(true);
bloquearApuestas(false);
