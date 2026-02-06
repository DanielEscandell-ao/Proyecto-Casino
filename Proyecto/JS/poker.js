/* ============================
   VARIABLES Y ELEMENTOS
============================ */

const palos = ["C", "D", "H", "S"]; // Tréboles, Diamantes, Corazones, Picas
const valores = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

let mazo = [];
let manoJugador = [];
let manoCrupier = [];
let saldoJugador = 1000;
let bote = 0;
let fase = "inicio";
let apuestaActual = 50;

const cartasJugadorDiv = document.getElementById("cartasJugador");
const cartasCrupierDiv = document.getElementById("cartasCrupier");
const saldoJugadorSpan = document.getElementById("saldoJugador");
const boteActualSpan = document.getElementById("boteActual");
const mensajeDiv = document.getElementById("mensaje");
const historialDiv = document.getElementById("historial");

const btnNuevaMano = document.getElementById("btnNuevaMano");
const btnApostar = document.getElementById("btnApostar");
const btnCambiar = document.getElementById("btnCambiarCartas");
const btnRetirarse = document.getElementById("btnRetirarse");

const betInput = document.getElementById("apuestaInicial");
const betMinus = document.getElementById("betMinus");
const betPlus = document.getElementById("betPlus");

/* ============================
   CREAR MAZO
============================ */

function crearMazo() {
    mazo = [];
    for (let p of palos) {
        for (let v of valores) {
            mazo.push({
                valor: v,
                palo: p,
                img: `/Proyecto/Imagenes/cartas/${v}${p}.png`
            });
        }
    }
}

function barajar() {
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
}

function robarCarta() {
    return mazo.pop();
}

/* ============================
   REPARTIR MANOS
============================ */

function repartirManos() {
    manoJugador = [];
    manoCrupier = [];
    for (let i = 0; i < 5; i++) {
        manoJugador.push(robarCarta());
        manoCrupier.push(robarCarta());
    }
}

/* ============================
   PINTAR CARTAS CON IMÁGENES
============================ */

function pintarCartas() {
    cartasJugadorDiv.innerHTML = "";
    cartasCrupierDiv.innerHTML = "";

    manoJugador.forEach((carta, index) => {
        const img = document.createElement("img");
        img.src = carta.img;
        img.classList.add("carta");
        img.dataset.index = index;

        if (fase === "cambio") {
            img.addEventListener("click", () => {
                img.classList.toggle("seleccionada");
            });
        }

        cartasJugadorDiv.appendChild(img);
    });

    manoCrupier.forEach((carta) => {
        const img = document.createElement("img");
        img.classList.add("carta");

        if (fase !== "showdown") {
            img.src = "/Proyecto/Imagenes/cartas/back.png";
        } else {
            img.src = carta.img;
        }

        cartasCrupierDiv.appendChild(img);
    });
}

/* ============================
   EVALUAR MANOS
============================ */

function valorNumerico(v) {
    return valores.indexOf(v);
}

function evaluarMano(mano) {
    const ordenada = [...mano].sort((a,b) => valorNumerico(a.valor) - valorNumerico(b.valor));
    const valoresSolo = ordenada.map(c => c.valor);
    const palosSolo = ordenada.map(c => c.palo);

    const conteo = {};
    valoresSolo.forEach(v => conteo[v] = (conteo[v] || 0) + 1);

    const esColor = palosSolo.every(p => p === palosSolo[0]);

    let esEscalera = true;
    for (let i = 1; i < valoresSolo.length; i++) {
        if (valorNumerico(valoresSolo[i]) !== valorNumerico(valoresSolo[i-1]) + 1) {
            esEscalera = false;
            break;
        }
    }

    let escaleraBaja = false;
    if (!esEscalera) {
        escaleraBaja = valoresSolo.join(",") === "A,2,3,4,5";
    }

    const grupos = Object.values(conteo).sort((a,b) => b - a);

    let rango = 1;
    let nombre = "Carta alta";

    if (esEscalera && esColor) rango = 9, nombre = "Escalera de color";
    else if (grupos[0] === 4) rango = 8, nombre = "Póker";
    else if (grupos[0] === 3 && grupos[1] === 2) rango = 7, nombre = "Full";
    else if (esColor) rango = 6, nombre = "Color";
    else if (esEscalera) rango = 5, nombre = "Escalera";
    else if (grupos[0] === 3) rango = 4, nombre = "Trío";
    else if (grupos[0] === 2 && grupos[1] === 2) rango = 3, nombre = "Dobles parejas";
    else if (grupos[0] === 2) rango = 2, nombre = "Pareja";

    return { rango, nombre };
}

function compararManos(manoJ, manoC) {
    const evalJ = evaluarMano(manoJ);
    const evalC = evaluarMano(manoC);

    if (evalJ.rango > evalC.rango) return { ganador: "jugador", evalJ, evalC };
    if (evalC.rango > evalJ.rango) return { ganador: "crupier", evalJ, evalC };
    return { ganador: "empate", evalJ, evalC };
}

/* ============================
   INTERFAZ
============================ */

function actualizarInfo() {
    saldoJugadorSpan.textContent = saldoJugador;
    boteActualSpan.textContent = bote;
}

function setMensaje(texto) {
    mensajeDiv.textContent = texto;
}

function addHistorial(texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    historialDiv.appendChild(p);
    historialDiv.scrollTop = historialDiv.scrollHeight;
}

function actualizarBotones() {
    btnNuevaMano.disabled = fase !== "inicio" && fase !== "showdown";
    btnApostar.disabled = fase !== "apuesta";
    btnCambiar.disabled = fase !== "cambio";
    btnRetirarse.disabled = fase === "inicio" || fase === "showdown";
}

/* ============================
   CONTROLES DE APUESTA
============================ */

betMinus.addEventListener("click", () => {
    let val = parseInt(betInput.value);
    if (val > 10) betInput.value = val - 10;
});

betPlus.addEventListener("click", () => {
    let val = parseInt(betInput.value);
    betInput.value = val + 10;
});

// Evitar que el usuario escriba menos de 10€
betInput.addEventListener("input", () => {
    if (betInput.value < 10) betInput.value = 10;
});

/* ============================
   FLUJO DEL JUEGO
============================ */

btnNuevaMano.addEventListener("click", () => {
    crearMazo();
    barajar();
    repartirManos();
    pintarCartas();

    fase = "apuesta";
    setMensaje("Haz tu apuesta inicial.");
    actualizarBotones();
});

btnApostar.addEventListener("click", () => {
    const apuesta = parseInt(betInput.value);

    if (apuesta < 10) {
        setMensaje("La apuesta mínima es de 10€.");
        return;
    }

    if (apuesta > saldoJugador) {
        setMensaje("No tienes suficiente saldo.");
        return;
    }

    saldoJugador -= apuesta;
    bote += apuesta;
    apuestaActual = apuesta;

    fase = "cambio";
    setMensaje("Selecciona las cartas que quieras cambiar.");
    actualizarInfo();
    actualizarBotones();
});

btnCambiar.addEventListener("click", () => {
    const seleccionadas = document.querySelectorAll(".carta.seleccionada");

    seleccionadas.forEach(c => {
        const index = parseInt(c.dataset.index);
        manoJugador[index] = robarCarta();
    });

    pintarCartas();

    fase = "showdown";
    setMensaje("Mostrando cartas...");
    actualizarBotones();

    setTimeout(resolverMano, 1000);
});

btnRetirarse.addEventListener("click", () => {
    setMensaje("Te has retirado. Pierdes la apuesta.");
    addHistorial("Jugador se retira y pierde " + apuestaActual + " €");
    fase = "showdown";
    actualizarBotones();
});

function resolverMano() {
    pintarCartas();

    const resultado = compararManos(manoJugador, manoCrupier);

    if (resultado.ganador === "jugador") {
        saldoJugador += bote * 2;
        setMensaje("¡Ganaste! Mano: " + resultado.evalJ.nombre);
        addHistorial("Ganaste " + bote + " € con " + resultado.evalJ.nombre);
    } else if (resultado.ganador === "crupier") {
        setMensaje("Perdiste. Mano del crupier: " + resultado.evalC.nombre);
        addHistorial("Perdiste " + bote + " € contra " + resultado.evalC.nombre);
    } else {
        saldoJugador += bote;
        setMensaje("Empate. Recuperas tu apuesta.");
        addHistorial("Empate. Se devuelve la apuesta.");
    }

    bote = 0;
    fase = "showdown";
    actualizarInfo();
    actualizarBotones();
}