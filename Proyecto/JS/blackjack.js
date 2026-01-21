// ===============================
// ===== VARIABLES Y ELEMENTOS ====
// ===============================

let baraja = [];
const tipoCarta = ["C","D","P","T"];
const especiales = ["A","K","Q","J"];

let puntosJugador = 0;
let puntosBanca = 0;

// ===== SISTEMA DINERO / APUESTAS =====
let saldo = 5000;
let apuesta = 0;
let apuestaConfirmada = false;
let rondaTerminada = false;

// Referencias al HTML (botones juego)
const btnNuevo = document.querySelector(".boton1");
const btnPedir = document.querySelector(".boton2");
const btnPasar = document.querySelector(".boton3");

const divJugadorCartas = document.querySelector("#jugador-cartas");
const divBancaCartas = document.querySelector("#banca-cartas");

const marcadorJugador = document.querySelectorAll("div.row.container h1 small")[0];
const marcadorBanca = document.querySelectorAll("div.row.container h1 small")[1];

const textoGanador = document.querySelector("#ganador");

// Referencias apuestas
const elSaldo = document.querySelector("#saldo");
const elApuestaActual = document.querySelector("#apuesta-actual");
const inputApuesta = document.querySelector("#input-apuesta");
const btnApostar = document.querySelector("#btn-apostar");
const btnAllIn = document.querySelector("#btn-allin");
const btnLimpiar = document.querySelector("#btn-limpiar");
const msgApuesta = document.querySelector("#msg-apuesta");
const chips = document.querySelectorAll(".chip");

// ===============================
// ===== UTILIDADES APUESTAS =====
// ===============================

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
  chips.forEach(b => b.disabled = bloquear);
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
  let puntos = carta.slice(0, -1);
  return isNaN(puntos) ? (puntos === "A" ? 11 : 10) : puntos * 1;
};

// ===============================
// ===== MOSTRAR CARTA ===========
/* =============================== */

const mostrarCarta = (carta, elementoHTML) => {
  const img = document.createElement("img");
  img.src = `Imagenes/cartas/${carta}.png`;
  img.classList.add("carta");
  elementoHTML.append(img);
};

// ===============================
// ===== CONTROL DE RONDA ========
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

// Gana/pierde/empata y paga
const pagarResultado = (resultado) => {
  if (apuestaConfirmada === false) return;

  // resultado: "gana", "pierde", "empate"
  if (resultado === "gana") {
    saldo += apuesta;
    setMsg(`Has ganado +${apuesta} fichas`, true);
  } else if (resultado === "pierde") {
    saldo -= apuesta;
    setMsg(`Has perdido -${apuesta} fichas`);
  } else {
    setMsg(`Empate: recuperas tu apuesta`, true);
  }

  // Reset apuesta para siguiente ronda
  apuesta = 0;
  apuestaConfirmada = false;

  renderDinero();

  // Si te quedas sin saldo, bloquea apuestas/juego
  if (saldo <= 0) {
    saldo = 0;
    renderDinero();
    setMsg("Te has quedado sin fichas. Reinicia para volver a 5000.");
    bloquearJuego(true);
    bloquearApuestas(true);
  } else {
    // tras acabar la ronda, se permite apostar de nuevo
    bloquearApuestas(false);
    bloquearJuego(true); // hasta que confirme nueva apuesta
  }
};

const finalizarRonda = (resultadoTexto, resultadoPago) => {
  textoGanador.textContent = resultadoTexto;
  rondaTerminada = true;
  bloquearJuego(true);
  pagarResultado(resultadoPago);
};

// ===============================
// ===== TURNO BANCA =============
// ===============================

const turnoBanca = () => {
  while (puntosBanca < puntosJugador && puntosJugador <= 21) {
    const carta = pedirCarta();
    puntosBanca += valorCarta(carta);
    marcadorBanca.textContent = puntosBanca;
    mostrarCarta(carta, divBancaCartas);
  }

  setTimeout(() => {
    if (puntosJugador > 21) {
      finalizarRonda("Te pasaste, gana la banca", "pierde");
    } else if (puntosBanca > 21) {
      finalizarRonda("¡Tú ganas! La banca se pasó", "gana");
    } else if (puntosBanca === puntosJugador) {
      finalizarRonda("Empate", "empate");
    } else {
      finalizarRonda("La banca gana", "pierde");
    }
  }, 500);
};

// ===============================
// ===== EVENTOS APUESTAS ========
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
  // opcional: apostar de 10 en 10
  if (num % 10 !== 0) {
    setMsg("La apuesta debe ser múltiplo de 10");
    return;
  }

  apuesta = num;
  apuestaConfirmada = true;
  renderDinero();

  setMsg(`Apuesta confirmada: ${apuesta} fichas`, true);

  // al confirmar apuesta, desbloquea juego y bloquea apuestas
  bloquearApuestas(true);
  bloquearJuego(false);

  // preparamos nueva ronda (sin tocar saldo)
  crearBaraja();
  resetMesa();
};

chips.forEach(b => {
  b.addEventListener("click", () => {
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
  apuesta = 0;
  apuestaConfirmada = false;
  renderDinero();
  setMsg("Apuesta limpiada", true);
});

btnAllIn.addEventListener("click", () => {
  apuesta = saldo;
  renderDinero();
  setMsg("All-in seleccionado. Confirma la apuesta.", true);
});

btnApostar.addEventListener("click", () => {
  // Si hay número escrito, usa eso; si no, usa la suma de chips
  const escrito = inputApuesta.value.trim();
  if (escrito !== "") {
    intentarConfirmarApuesta(escrito);
  } else {
    intentarConfirmarApuesta(apuesta);
  }
});

// Enter para confirmar
inputApuesta.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnApostar.click();
});

// ===============================
// ===== EVENTOS JUEGO ===========
// ===============================

// Nuevo juego: reinicia SOLO LA MESA (y pide nueva apuesta)
btnNuevo.addEventListener("click", () => {
  // Si la ronda estaba a medias, no pagamos nada: simplemente empezamos otra
  resetMesa();
  crearBaraja();

  // obliga a apostar de nuevo para jugar
  apuestaConfirmada = false;
  apuesta = 0;
  renderDinero();

  setMsg("Elige tu apuesta para empezar", true);

  bloquearJuego(true);
  bloquearApuestas(false);
});

// Pedir carta
btnPedir.addEventListener("click", () => {
  if (!apuestaConfirmada || rondaTerminada) return;

  const carta = pedirCarta();
  puntosJugador += valorCarta(carta);
  marcadorJugador.textContent = puntosJugador;
  mostrarCarta(carta, divJugadorCartas);

  if (puntosJugador > 21) {
    turnoBanca(); // acabará pagando como pierde
  } else if (puntosJugador === 21) {
    turnoBanca();
  }
});

// Plantarse
btnPasar.addEventListener("click", () => {
  if (!apuestaConfirmada || rondaTerminada) return;
  turnoBanca();
});

// ===============================
// ===== INICIO ==================
// ===============================

crearBaraja();
renderDinero();
setMsg("Elige tu apuesta para empezar", true);
bloquearJuego(true);       // no jugar sin apuesta
bloquearApuestas(false);   // sí permitir apostar

