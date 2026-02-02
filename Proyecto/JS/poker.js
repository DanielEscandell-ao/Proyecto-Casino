const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14];


const START_CHIPS = 1000;
const BET = 50;


let deck = [];
let playerHand = [];
let cpuHand = [];
let communityCards = [];


let stage = "ready";


let playerChips = START_CHIPS;
let cpuChips = START_CHIPS;
let pot = 0;




const dealBtn = document.getElementById("dealBtn");
const callBtn = document.getElementById("callBtn");
const raiseBtn = document.getElementById("raiseBtn");
const foldBtn = document.getElementById("foldBtn");
const newBtn = document.getElementById("newBtn");


const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");
const communityDiv = document.getElementById("communityCards");


const potSpan = document.getElementById("potAmount");
const msg = document.getElementById("message");
const pEval = document.getElementById("playerEval");
const cEval = document.getElementById("cpuEval");
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
    for (let s of SUITS)
        for (let v of VALUES)
            d.push({ v, s });
    return shuffle(d);
}


function cardText(card) {
    const map = {11:'J',12:'Q',13:'K',14:'A'};
    return `${map[card.v] || card.v}${card.s}`;
}


function render(hand, container, hide=false) {
    container.innerHTML = "";
    hand.forEach(card => {
        const el = document.createElement("div");
        el.className = "card";
        if (hide) {
            el.textContent = "🂠";
            el.classList.add("card-back");
        } else {
            el.textContent = cardText(card);
            el.classList.add(card.s === "♥" || card.s === "♦" ? "red" : "black");
        }
        container.appendChild(el);
    });
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
    communityCards = [];
    pot = 0;
    stage = "ready";


    render([], playerDiv);
    render([], cpuDiv);
    render([], communityDiv);


    msg.textContent = "";
    pEval.textContent = "";
    cEval.textContent = "";


    dealBtn.disabled = false;
    callBtn.disabled = true;
    raiseBtn.disabled = true;
    foldBtn.disabled = true;
    newBtn.disabled = true;


    updateUI();
}


function deal() {
    reset();


    playerChips -= BET;
    cpuChips -= BET;
    pot = BET * 2;


    playerHand = [deck.pop(), deck.pop()];
    cpuHand = [deck.pop(), deck.pop()];


    render(playerHand, playerDiv);
    render(cpuHand, cpuDiv, true);


    stage = "preflop";


    dealBtn.disabled = true;
    callBtn.disabled = false;
    foldBtn.disabled = false;


    msg.textContent = "Preflop";
    updateUI();
}


function nextStage() {
    if (stage === "preflop") {
        communityCards.push(deck.pop(), deck.pop(), deck.pop());
        stage = "flop";
        msg.textContent = "Flop";
    } else if (stage === "flop") {
        communityCards.push(deck.pop());
        stage = "turn";
        msg.textContent = "Turn";
    } else if (stage === "turn") {
        communityCards.push(deck.pop());
        stage = "river";
        msg.textContent = "River";
    } else if (stage === "river") {
        showdown();
        return;
    }


    render(communityCards, communityDiv);
}


function showdown() {
    render(cpuHand, cpuDiv);


    const playerEval = evaluate([...playerHand, ...communityCards]);
    const cpuEval = evaluate([...cpuHand, ...communityCards]);


    pEval.textContent = playerEval.name;
    cEval.textContent = cpuEval.name;


    if (playerEval.rank > cpuEval.rank) {
        msg.textContent = "Ganas el bote 🏆";
        playerChips += pot;
    } else if (cpuEval.rank > playerEval.rank) {
        msg.textContent = "La CPU gana 🤖";
        cpuChips += pot;
    } else {
        msg.textContent = "Empate";
        playerChips += pot / 2;
        cpuChips += pot / 2;
    }


    pot = 0;
    stage = "done";


    callBtn.disabled = true;
    raiseBtn.disabled = true;
    foldBtn.disabled = true;
    newBtn.disabled = false;


    updateUI();
}




callBtn.onclick = () => {
    pot += BET * 2;
    playerChips -= BET;
    cpuChips -= BET;
    nextStage();
    updateUI();
};


foldBtn.onclick = () => {
    msg.textContent = "Te retiraste";
    cpuChips += pot;
    pot = 0;
    newBtn.disabled = false;
    callBtn.disabled = true;
    foldBtn.disabled = true;
    updateUI();
};


newBtn.onclick = reset;
dealBtn.onclick = deal;


reset();


