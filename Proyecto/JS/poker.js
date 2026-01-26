const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14];


const START_CHIPS = 1000;
const ANTE = 50;




let deck = [];
let playerHand = [];
let cpuHand = [];
let held = [false, false, false, false, false];
let stage = "ready";


let playerChips = START_CHIPS;
let cpuChips = START_CHIPS;
let pot = 0;




const dealBtn = document.getElementById("dealBtn");
const drawBtn = document.getElementById("drawBtn");
const newBtn = document.getElementById("newBtn");


const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");


const msg = document.getElementById("message");
const pEval = document.getElementById("playerEval");
const cEval = document.getElementById("cpuEval");


const potSpan = document.getElementById("potAmount");
const playerChipsDiv = document.getElementById("playerChips");
const cpuChipsDiv = document.getElementById("cpuChips");




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
        for (let v of VALUES) d.push({ v, s });
    }
    return shuffle(d);
}


function cardText(card) {
    const map = {11:'J',12:'Q',13:'K',14:'A'};
    return `${map[card.v] || card.v}${card.s}`;
}




function render(hand, container, interactive = false, hide = false) {
    container.innerHTML = "";


    hand.forEach((card, index) => {
        const el = document.createElement("div");
        el.className = "card";


        if (hide) {
            el.textContent = "🂠";
            el.classList.add("card-back");
        } else {
            el.textContent = cardText(card);
            el.classList.add(card.s === "♥" || card.s === "♦" ? "red" : "black");
        }


       
        if (interactive && stage === "dealt") {
            if (held[index]) el.classList.add("held");


            el.onclick = () => {
                held[index] = !held[index];
                render(playerHand, playerDiv, true);
            };
        }


        container.appendChild(el);
    });
}




function evaluate(hand) {
    const values = hand.map(c => c.v).sort((a,b)=>a-b);
    const uniqueValues = [...new Set(values)];
    const suits = hand.map(c => c.s);


    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);


    const countVals = Object.values(counts).sort((a,b)=>b-a);
    const ordered = Object.entries(counts)
        .sort((a,b)=> b[1]-a[1] || b[0]-a[0])
        .map(e=>Number(e[0]));


    const flush = suits.every(s => s === suits[0]);
    const straight =
        uniqueValues.length === 5 &&
        (uniqueValues[4] - uniqueValues[0] === 4 ||
         uniqueValues.toString() === "2,3,4,5,14");


    let rank = 1;
    let name = "Carta Alta";


    if (straight && flush && Math.max(...uniqueValues) === 14) {
        rank = 10; name = "Escalera Real";
    } else if (straight && flush) {
        rank = 9; name = "Escalera de Color";
    } else if (countVals[0] === 4) {
        rank = 8; name = "Póker";
    } else if (countVals[0] === 3 && countVals[1] === 2) {
        rank = 7; name = "Full";
    } else if (flush) {
        rank = 6; name = "Color";
    } else if (straight) {
        rank = 5; name = "Escalera";
    } else if (countVals[0] === 3) {
        rank = 4; name = "Trío";
    } else if (countVals[0] === 2 && countVals[1] === 2) {
        rank = 3; name = "Doble Pareja";
    } else if (countVals[0] === 2) {
        rank = 2; name = "Pareja";
    }


    return { rank, name, ordered };
}




function compareHands() {
    const P = evaluate(playerHand);
    const C = evaluate(cpuHand);


    if (P.rank !== C.rank) return P.rank > C.rank ? "player" : "cpu";


    for (let i = 0; i < P.ordered.length; i++) {
        if (P.ordered[i] !== C.ordered[i]) {
            return P.ordered[i] > C.ordered[i] ? "player" : "cpu";
        }
    }
    return "tie";
}




function cpuTurn() {
    const evalCpu = evaluate(cpuHand);
    const counts = {};


    cpuHand.forEach(c => counts[c.v] = (counts[c.v] || 0) + 1);


    for (let i = 0; i < 5; i++) {
        if (evalCpu.rank <= 2 && counts[cpuHand[i].v] === 1) {
            cpuHand[i] = deck.pop();
        }
    }
}




function updateUI() {
    potSpan.textContent = pot;
    playerChipsDiv.textContent = `💰 ${playerChips}`;
    cpuChipsDiv.textContent = `💰 ${cpuChips}`;
}


function reset() {
    deck = createDeck();
    playerHand = [];
    cpuHand = [];
    held = [false,false,false,false,false];
    stage = "ready";


    render([], playerDiv);
    render([], cpuDiv);


    msg.textContent = "";
    pEval.textContent = "";
    cEval.textContent = "";


    dealBtn.disabled = false;
    drawBtn.disabled = true;
    newBtn.disabled = true;


    updateUI();
}


function deal() {
    if (playerChips < ANTE || cpuChips < ANTE) {
        msg.textContent = " Sin fichas suficientes";
        return;
    }


    reset();


    playerChips -= ANTE;
    cpuChips -= ANTE;
    pot = ANTE * 2;


    for (let i = 0; i < 5; i++) {
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }


   
    stage = "dealt";


    render(playerHand, playerDiv, true);
    render(cpuHand, cpuDiv, false, true);


    dealBtn.disabled = true;
    drawBtn.disabled = false;


    updateUI();
}


function draw() {
    for (let i = 0; i < 5; i++) {
        if (!held[i]) playerHand[i] = deck.pop();
    }


    cpuTurn();


    render(playerHand, playerDiv);
    render(cpuHand, cpuDiv);


    const winner = compareHands();


    if (winner === "player") {
        msg.textContent = " Ganas el bote";
        playerChips += pot;
    } else if (winner === "cpu") {
        msg.textContent = " La CPU gana el bote";
        cpuChips += pot;
    } else {
        msg.textContent = " Empate";
        playerChips += pot / 2;
        cpuChips += pot / 2;
    }


    pot = 0;


    pEval.textContent = evaluate(playerHand).name;
    cEval.textContent = evaluate(cpuHand).name;


    stage = "done";
    drawBtn.disabled = true;
    newBtn.disabled = false;


    updateUI();
}




dealBtn.onclick = deal;
drawBtn.onclick = draw;
newBtn.onclick = reset;




reset();
