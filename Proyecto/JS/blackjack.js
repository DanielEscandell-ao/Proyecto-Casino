//VARIABLES Y ELEMENTOS 

let baraja = [];
const tipoCarta = ["C","D","P","T"]; // Corazones, Diamantes, Picas, Tréboles
const especiales = ["A","K","Q","J"];

let puntosJugador = 0;
let puntosBanca = 0;

// Referencias al HTML
const btnNuevo = document.querySelector(".boton1");
const btnPedir = document.querySelector(".boton2");
const btnPasar = document.querySelector(".boton3");

const divJugadorCartas = document.querySelector("#jugador-cartas");
const divBancaCartas = document.querySelector("#banca-cartas");

const marcadorJugador = document.querySelector("div.row.container h1 small");
const marcadorBanca = document.querySelectorAll("div.row.container h1 small")[1];

const textoGanador = document.querySelector("#ganador");

//CREAR BARAJA        

const crearBaraja = () => {
    baraja = [];

    // Cartas numéricas
    for (let i = 2; i <= 10; i++) {
        for (let tipo of tipoCarta) {
            baraja.push(i + tipo);
        }
    }

    // Cartas especiales
    for (let esp of especiales) {
        for (let tipo of tipoCarta) {
            baraja.push(esp + tipo);
        }
    }

    // Mezclamos con underscore.js
    baraja = _.shuffle(baraja);
    return baraja;
};

//PEDIR CARTA 

const pedirCarta = () => {
    if (baraja.length === 0) {
        throw "No hay más cartas en la baraja";
    }
    return baraja.pop();  
};

//VALOR CARTA           

const valorCarta = (carta) => {
    let puntos = carta.slice(0, -1);

    return isNaN(puntos)
        ? (puntos === "A" ? 11 : 10)
        : puntos * 1;
};

//AGREGAR CARTA VISUAL

const mostrarCarta = (carta, elementoHTML) => {
    const img = document.createElement("img");
    img.src = `Imagenes/cartas/${carta}.png`;  // <-- Ajusta si tu carpeta tiene otra estructura
    img.classList.add("carta");
    elementoHTML.append(img);
};

//LÓGICA DEL JUEGO      

const turnoBanca = () => {

    while (puntosBanca < puntosJugador && puntosJugador <= 21) {
        const carta = pedirCarta();
        puntosBanca += valorCarta(carta);
        marcadorBanca.textContent = puntosBanca;
        mostrarCarta(carta, divBancaCartas);
    }

    setTimeout(() => {
        if (puntosJugador > 21) {
            textoGanador.textContent = "La banca gana";
        } else if (puntosBanca > 21) {
            textoGanador.textContent = "¡Tú ganas!";
        } else if (puntosBanca === puntosJugador) {
            textoGanador.textContent = "Empate";
        } else {
            textoGanador.textContent = "La banca gana";
        }
    }, 800);
};

//EVENTOS BOTONES      

// NUEVO JUEGO 
btnNuevo.addEventListener("click", () => {
    crearBaraja();

    puntosJugador = 0;
    puntosBanca = 0;

    marcadorJugador.textContent = 0;
    marcadorBanca.textContent = 0;

    divJugadorCartas.innerHTML = "";
    divBancaCartas.innerHTML = "";

    textoGanador.textContent = "";

    btnPedir.disabled = false;
    btnPasar.disabled = false;
});


//PEDIR CARTA 
btnPedir.addEventListener("click", () => {
    const carta = pedirCarta();
    puntosJugador += valorCarta(carta);
    marcadorJugador.textContent = puntosJugador;

    mostrarCarta(carta, divJugadorCartas);

    if (puntosJugador > 21) {
        textoGanador.textContent = "Te pasaste, gana la banca";
        btnPedir.disabled = true;
        btnPasar.disabled = true;
        turnoBanca();
    }

    if (puntosJugador === 21) {
        textoGanador.textContent = "¡21! Turno de la banca";
        btnPedir.disabled = true;
        btnPasar.disabled = true;
        turnoBanca();
    }
});


//PASAR 
btnPasar.addEventListener("click", () => {
    btnPedir.disabled = true;
    btnPasar.disabled = true;
    turnoBanca();
});

//INICIO AUTOMÁTICO     

crearBaraja();
