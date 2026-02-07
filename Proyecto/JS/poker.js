const PALOS = ["♠","♥","♦","♣"];
const VALORES = [
  {v:2,t:"2"},{v:3,t:"3"},{v:4,t:"4"},{v:5,t:"5"},
  {v:6,t:"6"},{v:7,t:"7"},{v:8,t:"8"},{v:9,t:"9"},
  {v:10,t:"10"},{v:11,t:"J"},{v:12,t:"Q"},{v:13,t:"K"},{v:14,t:"A"}
];

let mazo=[], manoJugador=[], manoMaquina=[], mesa=[], bote=0;
let saldo=1000, apuestaActual=0, etapa=0;
let ciegaJugador=0, ciegaMaquina=0;
let turnoJugador=true;

// DOM
const cartasJugadorDiv = document.getElementById("cartasJugador");
const cartasMaquinaDiv = document.getElementById("cartasMaquina");
const cartasMesaDiv = document.getElementById("cartasMesa");
const saldoSpan = document.getElementById("saldoJugador");
const boteSpan = document.getElementById("boteActual");
const mensaje = document.getElementById("mensaje");
const historial = document.getElementById("historial");
const btnCall = document.getElementById("btnCall");
const btnRaise = document.getElementById("btnRaise");
const btnFold = document.getElementById("btnFold");
const inputRaise = document.getElementById("apuestaRaise");
const betPlus = document.getElementById("betPlus");
const betMinus = document.getElementById("betMinus");

// ======== Funciones básicas ========
function crearMazo(){
  mazo=[];
  PALOS.forEach(p => VALORES.forEach(v => mazo.push({palo:p,valor:v.v,texto:v.t})));
  mazo.sort(()=>Math.random()-0.5);
}

function robar(n){ return mazo.splice(0,n); }

function crearCartaHTML(carta,oculta=false){
  const div = document.createElement("div");
  div.className="carta";
  if(carta.palo==="♥"||carta.palo==="♦") div.classList.add("rojo"); else div.classList.add("negro");
  if(oculta){ div.classList.add("oculta"); }
  else { div.innerHTML=`<div class="valor">${carta.texto}</div><div class="palo">${carta.palo}</div><div class="valor-inferior">${carta.texto}</div>`;}
  return div;
}

function render(){
  cartasJugadorDiv.innerHTML=""; manoJugador.forEach(c=>cartasJugadorDiv.appendChild(crearCartaHTML(c)));
  cartasMaquinaDiv.innerHTML=""; manoMaquina.forEach(c=>cartasMaquinaDiv.appendChild(crearCartaHTML(c,true)));
  cartasMesaDiv.innerHTML=""; mesa.forEach(c=>cartasMesaDiv.appendChild(crearCartaHTML(c)));
  saldoSpan.textContent = saldo;
  boteSpan.textContent = bote;
}

// ======== Nueva mano automática ========
function nuevaMano(){
  crearMazo();
  manoJugador = robar(2);
  manoMaquina = robar(2);
  mesa = [];
  etapa = 0;
  turnoJugador = true;

  // Ciegas aleatorias
  if(Math.random()<0.5){
    ciegaJugador=5; ciegaMaquina=10;
  } else {
    ciegaJugador=10; ciegaMaquina=5;
  }

  // La máquina paga automáticamente su ciega
  bote = ciegaMaquina;
  apuestaActual = ciegaMaquina;

  if(ciegaJugador===10){
    saldo -= ciegaJugador;
    bote += ciegaJugador;
    mensaje.textContent=`Te toca ciega grande (10€). Automáticamente pagada. Turno máquina...`;
    render();
    setTimeout(turnoMaquina,1000);
  } else {
    // Ciega pequeña, jugador decide
    saldo -= ciegaJugador;
    bote += ciegaJugador;
    mensaje.textContent=`Te toca ciega pequeña (${ciegaJugador}€). Tu turno para decidir.`;
    render();
    habilitarBotones();
  }
}

// ======== Habilitar/Deshabilitar botones ========
function habilitarBotones(){ btnCall.disabled=false; btnRaise.disabled=false; btnFold.disabled=false; }
function desactivarBotones(){ btnCall.disabled=true; btnRaise.disabled=true; btnFold.disabled=true; }

// ======== Acciones jugador ========
function call(){ 
  // Paga solo la diferencia si hay ciega pequeña
  let pago = Math.max(0,apuestaActual - ciegaJugador);
  pago = Math.min(pago,saldo);
  saldo -= pago;
  bote += pago;
  mensaje.textContent=`Call: pagas ${pago}€. Turno máquina...`;
  render();
  desactivarBotones();
  setTimeout(turnoMaquina,1200);
}

function raise(){
  let cantidad = Number(inputRaise.value);
  cantidad = Math.min(cantidad,saldo);
  saldo -= cantidad; 
  bote += cantidad; 
  apuestaActual = cantidad;
  mensaje.textContent=`Subes ${cantidad}€. Turno máquina...`;
  render();
  desactivarBotones();
  setTimeout(turnoMaquina,1200);
}

function fold(){ 
  mensaje.textContent="Te retiras. Gana la máquina."; 
  addHistorial("Máquina","Jugador se retiró"); 
  bote = 0; 
  desactivarBotones();
  setTimeout(nuevaMano,1500);
  render();
}

// ======== Raise +/- ========
betPlus.onclick = ()=> inputRaise.value = Number(inputRaise.value)+10;
betMinus.onclick = ()=> inputRaise.value = Math.max(10,Number(inputRaise.value)-10);
btnCall.addEventListener("click",call);
btnRaise.addEventListener("click",raise);
btnFold.addEventListener("click",fold);

// ======== Evaluación de manos ========
function evaluarMano(cartas){
  let todas = [...cartas];
  todas.sort((a,b)=>b.valor-a.valor);
  
  let valores = todas.map(c=>c.valor);
  let palos = todas.map(c=>c.palo);
  let counts = {};
  valores.forEach(v=>counts[v]=(counts[v]||0)+1);
  let countVals = Object.values(counts).sort((a,b)=>b-a);

  const esColor = palos.every(p=>p===palos[0]);
  const esEscalera = valores.every((v,i,arr)=> i===0 || arr[i-1]-1===v);

  if(esEscalera && esColor && valores[0]===14) return {rank:10,name:"Escalera Real"};
  if(esEscalera && esColor) return {rank:9,name:"Escalera de Color"};
  if(countVals[0]===4) return {rank:8,name:"Póker"};
  if(countVals[0]===3 && countVals[1]===2) return {rank:7,name:"Full"};
  if(esColor) return {rank:6,name:"Color"};
  if(esEscalera) return {rank:5,name:"Escalera"};
  if(countVals[0]===3) return {rank:4,name:"Trío"};
  if(countVals[0]===2 && countVals[1]===2) return {rank:3,name:"Doble Pareja"};
  if(countVals[0]===2) return {rank:2,name:"Pareja"};
  return {rank:1,name:"Carta alta"};
}

function turnoMaquina(){
  const fuerza = evaluarMano([...manoMaquina,...mesa]).rank;

  // La máquina siempre paga la ciega automáticamente
  if(etapa === 0){
    // Primera ronda: no se retira nunca
    if(fuerza >= 7){
      let subida = Math.min(50, saldo);
      saldo -= subida;
      bote += subida;
      mensaje.textContent = `🤖 Máquina sube ${subida}€ (fuerte en ciega)`;
    } else if(fuerza >= 4){
      let iguala = Math.min(apuestaActual, saldo);
      saldo -= iguala;
      bote += iguala;
      mensaje.textContent = "🤖 Máquina iguala (ciega)";
    } else {
      // Mano débil pero no se retira en primera ronda
      mensaje.textContent = "🤖 Máquina pasa (ciega)";
    }
  } 
  else {
    // Segunda ronda en adelante: puede retirarse si apuesta del jugador >0 y mano débil
    if(fuerza >= 7){
      let subida = Math.min(50, saldo);
      saldo -= subida;
      bote += subida;
      mensaje.textContent = `🤖 Máquina sube ${subida}€ (fuerte)`;
    } else if(fuerza >= 4){
      if(apuestaActual <= saldo){
        let iguala = Math.min(apuestaActual, saldo);
        saldo -= iguala;
        bote += iguala;
        mensaje.textContent = "🤖 Máquina iguala";
      } else {
        mensaje.textContent = "🤖 Máquina se retira!";
        addHistorial("Jugador","Máquina se retiró");
        saldo += bote;
        bote = 0;
        render();
        setTimeout(nuevaMano,1500);
        return;
      }
    } else {
      if(apuestaActual > 0){
        mensaje.textContent = "🤖 Máquina se retira!";
        addHistorial("Jugador","Máquina se retiró");
        saldo += bote;
        bote = 0;
        render();
        setTimeout(nuevaMano,1500);
        return;
      } else {
        mensaje.textContent = "🤖 Máquina pasa";
      }
    }
  }

  render();
  setTimeout(siguienteEtapa, 1200);
}



// ======== Etapas del juego ========
function siguienteEtapa(){
  etapa++;
  apuestaActual = 0
  if(etapa===1) mesa.push(...robar(3)); // flop
  if(etapa===2) mesa.push(...robar(1)); // turn
  if(etapa===3) mesa.push(...robar(1)); // river
  render();
  if(etapa<3) habilitarBotones();
  else setTimeout(resolverMano,1000);
}

// ======== Resolver mano ========
function resolverMano(){
  // Limpiamos el contenedor solo una vez al inicio
  cartasMaquinaDiv.innerHTML="";

  // Añadimos cada carta de la máquina **una sola vez**
  manoMaquina.forEach(c=>{
    cartasMaquinaDiv.appendChild(crearCartaHTML(c,false));
  });

  const vJ = evaluarMano([...manoJugador,...mesa]);
  const vM = evaluarMano([...manoMaquina,...mesa]);

  // Mostrar ganador inmediatamente
  if(vJ.rank>vM.rank){ 
    saldo += bote; 
    mensaje.textContent=`🎉 Ganas (${vJ.name})`; 
    addHistorial("Jugador",vJ.name); 
  } else if(vJ.rank < vM.rank){ 
    mensaje.textContent=`💀 Gana máquina (${vM.name})`; 
    addHistorial("Máquina",vM.name); 
  } else {
    mensaje.textContent="🤝 Empate"; 
    addHistorial("Empate","Ninguno gana"); 
  }

  render();

  // Espera 5 segundos antes de iniciar la nueva mano automática
  setTimeout(nuevaMano,5000);
}



// ======== Historial ========
function addHistorial(ganador,motivo){
  const p = document.createElement("p");
  p.textContent = `${ganador} gana (${motivo}) — Bote: ${bote}€`;
  historial.appendChild(p);
  historial.scrollTop = historial.scrollHeight;
}

// ======== Iniciar primera mano automática ========
nuevaMano();
