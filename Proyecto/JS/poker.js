const SUITS = ['♠','♥','♦','♣'];
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14];

function createDeck(){
  const deck=[];
  for(let s of SUITS){
    for(let v of VALUES){
      deck.push({v,s});
    }
  }
  return deck;
}

function shuffle(arr){
  return arr.sort(()=>Math.random()-0.5);
}

function cardText(c){
  let v = c.v===14?'A':c.v===13?'K':c.v===12?'Q':c.v===11?'J':c.v;
  return v + c.s;
}

let deck=[], playerHand=[], cpuHand=[], held=[false,false,false,false,false], stage="ready";

const dealBtn = document.getElementById("dealBtn");
const drawBtn = document.getElementById("drawBtn");
const newBtn = document.getElementById("newBtn");

const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");
const msg = document.getElementById("message");
const pEval = document.getElementById("playerEval");
const cEval = document.getElementById("cpuEval");

function reset(){
  deck = shuffle(createDeck());
  playerHand = [];
  cpuHand = [];
  held = [false,false,false,false,false];
  stage="ready";
  playerDiv.innerHTML="";
  cpuDiv.innerHTML="";
  msg.textContent="";
  pEval.textContent="";
  cEval.textContent="";
  drawBtn.disabled=true;
  newBtn.disabled=true;
  dealBtn.disabled=false;
}

// Renderizado de cartas con color
function render(hand,div,interactive=false){
  div.innerHTML="";
  hand.forEach((c,i)=>{
    let el=document.createElement("div");
    el.className="card";

    // Asignar color según palo
    if(c.s === '♥' || c.s === '♦'){
      el.classList.add("red");
    } else {
      el.classList.add("black");
    }

    el.textContent = cardText(c);

    if(interactive){
      if(held[i]) el.classList.add("held");
      el.onclick=()=>{
        if(stage!=="dealt") return;
        held[i]=!held[i];
        render(playerHand,playerDiv,true);
      };
    }
    div.appendChild(el);
  });
}

function deal(){
  reset();
  for(let i=0;i<5;i++) playerHand.push(deck.pop());
  for(let i=0;i<5;i++) cpuHand.push(deck.pop());
  render(playerHand,playerDiv,true);
  cpuDiv.innerHTML="?????"; 
  stage="dealt";
  drawBtn.disabled=false;
  dealBtn.disabled=true;
}

function draw(){
  for(let i=0;i<5;i++){
    if(!held[i]) playerHand[i]=deck.pop();
  }

  cpuHand.sort(()=>Math.random()-0.5);
  for(let i=0;i<Math.floor(Math.random()*3)+1;i++) cpuHand[i]=deck.pop();

  render(playerHand,playerDiv,false);
  render(cpuHand,cpuDiv,false);

  stage="done";
  drawBtn.disabled=true;
  newBtn.disabled=false;

  pEval.textContent="Jugador: " + playerHand.map(cardText).join(" ");
  cEval.textContent="CPU: " + cpuHand.map(cardText).join(" ");
}

dealBtn.onclick=deal;
drawBtn.onclick=draw;
newBtn.onclick=reset;

reset();
