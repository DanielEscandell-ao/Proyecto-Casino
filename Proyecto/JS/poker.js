const SUITS = ['♠','♥','♦','♣'];
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14]; // 11=J,12=Q,13=K,14=A

let deck=[], playerHand=[], cpuHand=[], held=[false,false,false,false,false], stage="ready";

const dealBtn = document.getElementById("dealBtn");
const drawBtn = document.getElementById("drawBtn");
const newBtn = document.getElementById("newBtn");

const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");
const msg = document.getElementById("message");
const pEval = document.getElementById("playerEval");
const cEval = document.getElementById("cpuEval");

// Crear y barajar mazo
function createDeck(){
  const deck=[];
  for(let s of SUITS){
    for(let v of VALUES){
      deck.push({v,s});
    }
  }
  return deck.sort(()=>Math.random()-0.5);
}

// Texto de la carta
function cardText(c){
  let v = c.v===14?'A':c.v===13?'K':c.v===12?'Q':c.v===11?'J':c.v;
  return v + c.s;
}

// Renderizar mano
function render(hand,div,interactive=false, hide=false){
  div.innerHTML="";
  hand.forEach((c,i)=>{
    let el=document.createElement("div");
    el.className="card";
    if(!hide){
      el.textContent = cardText(c);
      if(c.s==='♥'||c.s==='♦') el.classList.add("red");
      else el.classList.add("black");
    } else {
      el.textContent = "??";
    }

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

// Reset de juego
function reset(){
  deck = createDeck();
  playerHand=[];
  cpuHand=[];
  held=[false,false,false,false,false];
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

// Repartir cartas
function deal(){
  reset();
  for(let i=0;i<5;i++) playerHand.push(deck.pop());
  for(let i=0;i<5;i++) cpuHand.push(deck.pop());
  render(playerHand,playerDiv,true);
  render(cpuHand,cpuDiv,false,true); // cartas ocultas CPU
  stage="dealt";
  drawBtn.disabled=false;
  dealBtn.disabled=true;
}

// Evaluar manos
function evaluate(hand){
  const values = hand.map(c=>c.v).sort((a,b)=>a-b);
  const suits = hand.map(c=>c.s);
  const counts = {};
  values.forEach(v=>counts[v] = (counts[v]||0)+1);

  const isFlush = suits.every(s=>s===suits[0]);
  const isStraight = values.every((v,i)=>i===0||v===values[i-1]+1) ||
                     (values.toString() === "2,3,4,5,14"); // A-2-3-4-5

  const countValues = Object.values(counts).sort((a,b)=>b-a);

  let rank=0, name="";
  if(isStraight && isFlush && Math.max(...values)===14){rank=10;name="Escalera Real";}
  else if(isStraight && isFlush){rank=9;name="Escalera de Color";}
  else if(countValues[0]===4){rank=8;name="Póker";}
  else if(countValues[0]===3 && countValues[1]===2){rank=7;name="Full";}
  else if(isFlush){rank=6;name="Color";}
  else if(isStraight){rank=5;name="Escalera";}
  else if(countValues[0]===3){rank=4;name="Trío";}
  else if(countValues[0]===2 && countValues[1]===2){rank=3;name="Doble Pareja";}
  else if(countValues[0]===2){rank=2;name="Pareja";}
  else{rank=1;name="Carta Alta";}

  // Carta más alta para desempate
  const highCards = Object.entries(counts)
                      .sort((a,b)=>b[1]-a[1] || b[0]-a[0])
                      .map(e=>parseInt(e[0]));

  return {rank,name,highCards};
}

// Comparar manos
function compareHands(pHand,cHand){
  const p = evaluate(pHand);
  const c = evaluate(cHand);

  if(p.rank>c.rank) return "Jugador gana con " + p.name;
  if(c.rank>p.rank) return "CPU gana con " + c.name;

  // desempate por cartas más altas
  for(let i=0;i<5;i++){
    if(p.highCards[i] > c.highCards[i]) return "Jugador gana con " + p.name;
    if(c.highCards[i] > p.highCards[i]) return "CPU gana con " + c.name;
  }

  return "Empate";
}

// CPU decide qué cartas mantener
function cpuTurn(){
  const counts = {};
  cpuHand.forEach(c=>counts[c.v]=(counts[c.v]||0)+1);

  for(let i=0;i<5;i++){
    if(counts[cpuHand[i].v]===1){
      cpuHand[i]=deck.pop(); // cambia cartas no útiles
    }
  }
}

// Cambiar cartas
function draw(){
  for(let i=0;i<5;i++){
    if(!held[i]) playerHand[i]=deck.pop();
  }

  cpuTurn();

  render(playerHand,playerDiv,false);
  render(cpuHand,cpuDiv,false,false);

  stage="done";
  drawBtn.disabled=true;
  newBtn.disabled=false;

  pEval.textContent="Jugador: " + evaluate(playerHand).name;
  cEval.textContent="CPU: " + evaluate(cpuHand).name;
  msg.textContent=compareHands(playerHand,cpuHand);
}

dealBtn.onclick=deal;
drawBtn.onclick=draw;
newBtn.onclick=reset;

reset();
