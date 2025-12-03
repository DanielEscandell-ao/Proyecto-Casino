/* =========================================================
   CONFIGURACIÓN BASE
   ========================================================= */

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14]; // 11=J, 12=Q, 13=K, 14=A

let deck = [];
let playerHand = [];
let cpuHand = [];
let held = [false, false, false, false, false];

let stage = "ready"; // ready → dealt → draw → done

/* DOM ELEMENTOS */
const dealBtn = document.getElementById("dealBtn");
const drawBtn = document.getElementById("drawBtn");
const newBtn = document.getElementById("newBtn");

const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");

const msg = document.getElementById("message");
const pEval = document.getElementById("playerEval");
const cEval = document.getElementById("cpuEval");



/* =========================================================
   UTILIDADES
   ========================================================= */

// Fisher–Yates shuffle (mucho más profesional que Math.random sort)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createDeck() {
    const d = [];
    for (let s of SUITS) {
        for (let v of VALUES) {
            d.push({ v, s });
        }
    }
    return shuffle(d);
}

// Representación visual de la carta
function cardText(card) {
    let v = card.v;
    if (v === 14) v = 'A';
    else if (v === 13) v = 'K';
    else if (v === 12) v = 'Q';
    else if (v === 11) v = 'J';
    return `${v}${card.s}`;
}

/* =========================================================
   RENDERIZACIÓN
   ========================================================= */

function render(hand, container, interactive = false, hide = false) {
    container.innerHTML = "";

    hand.forEach((card, index) => {
        const el = document.createElement("div");
        el.className = "card";

        if (!hide) {
            el.textContent = cardText(card);
            el.classList.add(card.s === "♥" || card.s === "♦" ? "red" : "black");
        } else {
            el.textContent = "🂠";    // carta boca abajo profesional
            el.classList.add("card-back");
        }

        if (interactive) {
            if (held[index]) el.classList.add("held");

            el.onclick = () => {
                if (stage !== "dealt") return;
                held[index] = !held[index];
                render(playerHand, playerDiv, true);
            };
        }

        container.appendChild(el);
    });
}

/* =========================================================
   RESETEAR / INICIAR JUEGO
   ========================================================= */

function reset() {
    deck = createDeck();
    playerHand = [];
    cpuHand = [];

    held = [false, false, false, false, false];
    stage = "ready";

    playerDiv.innerHTML = "";
    cpuDiv.innerHTML = "";

    msg.textContent = "";
    pEval.textContent = "";
    cEval.textContent = "";

    drawBtn.disabled = true;
    newBtn.disabled = true;
    dealBtn.disabled = false;
}

/* =========================================================
   REPARTIR
   ========================================================= */

function deal() {
    reset();

    for (let i = 0; i < 5; i++) playerHand.push(deck.pop());
    for (let i = 0; i < 5; i++) cpuHand.push(deck.pop());

    render(playerHand, playerDiv, true);
    render(cpuHand, cpuDiv, false, true);

    stage = "dealt";
    drawBtn.disabled = false;
    dealBtn.disabled = true;
}

/* =========================================================
   EVALUACIÓN DE MANO
   ========================================================= */

function evaluate(hand) {
    const values = hand.map(c => c.v).sort((a, b) => a - b);
    const suits = hand.map(c => c.s);

    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight =
        values.every((v, i) => i === 0 || v === values[i - 1] + 1) ||
        (values.toString() === "2,3,4,5,14"); // A-2-3-4-5

    const countValues = Object.values(counts).sort((a, b) => b - a);

    let rank, name;
    if (isStraight && isFlush && Math.max(...values) === 14) {
        rank = 10; name = "Escalera Real";
    } else if (isStraight && isFlush) {
        rank = 9; name = "Escalera de Color";
    } else if (countValues[0] === 4) {
        rank = 8; name = "Póker";
    } else if (countValues[0] === 3 && countValues[1] === 2) {
        rank = 7; name = "Full";
    } else if (isFlush) {
        rank = 6; name = "Color";
    } else if (isStraight) {
        rank = 5; name = "Escalera";
    } else if (countValues[0] === 3) {
        rank = 4; name = "Trío";
    } else if (countValues[0] === 2 && countValues[1] === 2) {
        rank = 3; name = "Doble Pareja";
    } else if (countValues[0] === 2) {
        rank = 2; name = "Pareja";
    } else {
        rank = 1; name = "Carta Alta";
    }

    // Orden real de comparación (primero las cartas que forman la jugada)
    const ordered = Object.entries(counts)
        .sort((a, b) =>
            b[1] - a[1] || parseInt(b[0]) - parseInt(a[0])
        )
        .map(e => parseInt(e[0]));

    return { rank, name, ordered };
}

/* =========================================================
   COMPARAR MANOS
   ========================================================= */

function compareHands(player, cpu) {
    const P = evaluate(player);
    const C = evaluate(cpu);

    if (P.rank > C.rank) return `Jugador gana con ${P.name}`;
    if (C.rank > P.rank) return `CPU gana con ${C.name}`;

    // Desempate por high cards del orden real
    for (let i = 0; i < P.ordered.length; i++) {
        if (P.ordered[i] > C.ordered[i]) return `Jugador gana con ${P.name}`;
        if (C.ordered[i] > P.ordered[i]) return `CPU gana con ${C.name}`;
    }

    return "Empate";
}

/* =========================================================
   CPU INTELIGENCIA PROFESIONAL
   ========================================================= */

function cpuTurn() {
    const handEval = evaluate(cpuHand);
    const counts = {};

    cpuHand.forEach(c => counts[c.v] = (counts[c.v] || 0) + 1);

    // CPU inteligente: mantiene parejas o mejores
    for (let i = 0; i < 5; i++) {
        const card = cpuHand[i];

        if (counts[card.v] === 1 && handEval.rank < 4) {
            cpuHand[i] = deck.pop();
        }
    }
}

/* =========================================================
   CAMBIAR CARTAS
   ========================================================= */

function draw() {
    for (let i = 0; i < 5; i++) {
        if (!held[i]) {
            playerHand[i] = deck.pop();
        }
    }

    cpuTurn();

    render(playerHand, playerDiv, false);
    render(cpuHand, cpuDiv, false, false);

    stage = "done";
    drawBtn.disabled = true;
    newBtn.disabled = false;

    pEval.textContent = `Jugador: ${evaluate(playerHand).name}`;
    cEval.textContent = `CPU: ${evaluate(cpuHand).name}`;

    msg.textContent = compareHands(playerHand, cpuHand);
}

/* =========================================================
   EVENTOS
   ========================================================= */

dealBtn.onclick = deal;
drawBtn.onclick = draw;
newBtn.onclick = reset;

reset();
