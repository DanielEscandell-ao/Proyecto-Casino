/***********************
 *  RUTAS (TU PROYECTO)
 ***********************/
const RUTA_CARTAS = "Imagenes/cartas_svg_mejoradas/";
const RUTA_BACK = "Imagenes/back.svg"; // tu back.svg

/***********************
 *  MAZO (LETRAS)
 *  Por tus archivos:
 *  C = Corazones (♥)   (rojo)
 *  D = Diamantes (♦)   (rojo)
 *  P = Picas (♠)       (negro)
 *  T = Tréboles (♣)    (negro)
 ***********************/
const PALOS = [
  { key: "C", symbol: "♥", color: "red"   },
  { key: "D", symbol: "♦", color: "red"   },
  { key: "P", symbol: "♠", color: "black" },
  { key: "T", symbol: "♣", color: "black" }
];
const VALORES = [
  { v: 2,  t: "2"  },
  { v: 3,  t: "3"  },
  { v: 4,  t: "4"  },
  { v: 5,  t: "5"  },
  { v: 6,  t: "6"  },
  { v: 7,  t: "7"  },
  { v: 8,  t: "8"  },
  { v: 9,  t: "9"  },
  { v: 10, t: "10" },
  { v: 11, t: "J"  },
  { v: 12, t: "Q"  },
  { v: 13, t: "K"  },
  { v: 14, t: "A"  }
];

/***********************
 *  ESTADO
 ***********************/
let mazo = [];
let manoJugador = [];
let manoMaquina = [];
let mesa = []; // community cards
let bote = 0;

let saldo = 1000;
let apuestaActual = 0; // “to call”
let apuestaJugadorEnRonda = 0;
let apuestaMaquinaEnRonda = 0;

let etapa = 0; // 0 preflop, 1 flop, 2 turn, 3 river, 4 showdown
let enMano = false;

/***********************
 *  DOM
 ***********************/
const cartasJugadorDiv = document.getElementById("cartasJugador");
const cartasMaquinaDiv = document.getElementById("cartasMaquina");
const cartasMesaDiv = document.getElementById("cartasMesa");
const saldoSpan = document.getElementById("saldoJugador");
const boteSpan = document.getElementById("boteActual");
const mensajeEl = document.getElementById("mensaje");

const historialLista = document.getElementById("historialLista");

const btnCall = document.getElementById("btnCall");
const btnRaise = document.getElementById("btnRaise");
const btnFold = document.getElementById("btnFold");
const btnNueva = document.getElementById("btnNueva");

const inputRaise = document.getElementById("apuestaRaise");
const betPlus = document.getElementById("betPlus");
const betMinus = document.getElementById("betMinus");

const btnSound = document.getElementById("btnSound");
const bgMusic = document.getElementById("bgMusic");

/***********************
 *  AUDIO (MUSICA + SFX sin archivos)
 ***********************/
let audioCtx = null;
let sfxEnabled = true;
let musicEnabled = true;
let musicReady = false;

function ensureAudio(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Chrome: si está “suspended”, hay que reanudar por gesto
  if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
}

function sfxTone(freq=440, ms=120, type="sine", vol=0.18){
  if (!sfxEnabled) return;
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;

  // SFX más altos que la música
  g.gain.value = vol;

  o.connect(g);
  g.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + ms/1000);
  o.stop(now + ms/1000 + 0.02);
}

function sfxClick(){ sfxTone(520, 70, "square", 0.12); }
function sfxCard(){ sfxTone(240, 70, "triangle", 0.16); }
function sfxWin(){ sfxTone(660, 120, "sine", 0.22); setTimeout(()=>sfxTone(880, 140, "sine", 0.22), 110); }
function sfxLose(){ sfxTone(180, 160, "sawtooth", 0.20); setTimeout(()=>sfxTone(140, 180, "sawtooth", 0.18), 120); }
function sfxTie(){ sfxTone(420, 110, "sine", 0.18); setTimeout(()=>sfxTone(420, 110, "sine", 0.18), 140); }

function startMusicIfPossible(){
  // no forzamos autoplay: lo hacemos cuando el usuario interactúe
  if (!musicEnabled) return;

  // volumen base bajito para que los SFX destaquen
  bgMusic.volume = 0.22;

  bgMusic.play()
    .then(()=> { musicReady = true; })
    .catch(()=> { /* se activa al siguiente click */ });
}

function setMusicEnabled(on){
  musicEnabled = on;
  btnSound.classList.toggle("is-muted", !on);
  btnSound.textContent = on ? "🔊 Sonido" : "🔇 Mute";

  if (!on){
    bgMusic.pause();
  } else {
    startMusicIfPossible();
  }
}

/***********************
 *  UTILS
 ***********************/
function nowHHMMSS(){
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

/***********************
 *  CREAR MAZO
 ***********************/
function crearMazo(){
  mazo = [];
  for (const p of PALOS){
    for (const v of VALORES){
      mazo.push({
        paloKey: p.key,
        paloSymbol: p.symbol,
        color: p.color,
        valor: v.v,
        texto: v.t,
        file: `${v.t}${p.key}.svg` // ej: "A" + "C" => "AC.svg", "10P.svg"
      });
    }
  }
  shuffle(mazo);
}
function robar(n){
  return mazo.splice(0, n);
}

/***********************
 *  RENDER CARTAS (IMG)
 ***********************/
function crearCartaIMG(carta, oculta=false){
  const img = document.createElement("img");
  img.className = "card-img";
  img.alt = oculta ? "Carta boca abajo" : `${carta.texto}${carta.paloSymbol}`;
  img.src = oculta ? RUTA_BACK : (RUTA_CARTAS + carta.file);
  return img;
}

function render(ocultarMaquina=true){
  cartasJugadorDiv.innerHTML = "";
  manoJugador.forEach(c => cartasJugadorDiv.appendChild(crearCartaIMG(c, false)));

  cartasMesaDiv.innerHTML = "";
  mesa.forEach(c => cartasMesaDiv.appendChild(crearCartaIMG(c, false)));

  cartasMaquinaDiv.innerHTML = "";
  manoMaquina.forEach(c => cartasMaquinaDiv.appendChild(crearCartaIMG(c, ocultarMaquina)));

  saldoSpan.textContent = saldo;
  boteSpan.textContent = bote;
}

/***********************
 *  BOTONES
 ***********************/
function habilitarAcciones(on){
  btnCall.disabled = !on;
  btnRaise.disabled = !on;
  btnFold.disabled = !on;
}
function setMensaje(txt){
  mensajeEl.textContent = txt;
}

/***********************
 *  PAGO / BOTE
 ***********************/
function meterAlBote(quien, cantidad){
  cantidad = Math.max(0, Math.floor(cantidad));
  if (cantidad <= 0) return;

  if (quien === "J"){
    const c = Math.min(cantidad, saldo);
    saldo -= c;
    bote += c;
    apuestaJugadorEnRonda += c;
  } else {
    // máquina “tiene saldo infinito” para simplificar, pero si quieres le hacemos saldo máquina
    bote += cantidad;
    apuestaMaquinaEnRonda += cantidad;
  }
}

/***********************
 *  EVALUACIÓN REAL: mejor mano 5 de 7
 ***********************/
function comb5(arr){
  // devuelve todas las combinaciones de 5 cartas (para 7 => 21 combos)
  const res = [];
  for(let a=0;a<arr.length-4;a++)
  for(let b=a+1;b<arr.length-3;b++)
  for(let c=b+1;c<arr.length-2;c++)
  for(let d=c+1;d<arr.length-1;d++)
  for(let e=d+1;e<arr.length;e++)
    res.push([arr[a],arr[b],arr[c],arr[d],arr[e]]);
  return res;
}

function eval5(hand){
  // hand: 5 cartas
  const vals = hand.map(c=>c.valor).sort((x,y)=>y-x);
  const suits = hand.map(c=>c.paloKey);

  // conteos por valor
  const count = {};
  for (const v of vals) count[v] = (count[v]||0)+1;

  // pares (valor, veces)
  const groups = Object.entries(count)
    .map(([v,n])=>({v:Number(v), n}))
    .sort((a,b)=> (b.n-a.n) || (b.v-a.v));

  const isFlush = suits.every(s=>s===suits[0]);

  // escalera (A puede ser 1)
  const uniq = [...new Set(vals)];
  let isStraight = false;
  let straightHigh = 0;
  if (uniq.length === 5){
    const max = uniq[0];
    const min = uniq[4];
    if (max - min === 4){
      isStraight = true;
      straightHigh = max;
    } else {
      // A-5: 14,5,4,3,2
      const wheel = [14,5,4,3,2];
      if (uniq.join(",") === wheel.join(",")){
        isStraight = true;
        straightHigh = 5;
      }
    }
  }

  // helpers para kickers
  const sortedByGroup = () => {
    // ordena primero por n, luego por valor; y repite valores n veces
    const out = [];
    for (const g of groups){
      for (let i=0;i<g.n;i++) out.push(g.v);
    }
    return out;
  };

  // Ranking: 10 Royal, 9 StraightFlush, 8 Quads, 7 Full, 6 Flush, 5 Straight, 4 Trips, 3 TwoPair, 2 Pair, 1 High
  if (isStraight && isFlush){
    if (straightHigh === 14) return { rank: 10, name: "Escalera Real", tb: [14] };
    return { rank: 9, name: "Escalera de Color", tb: [straightHigh] };
  }

  if (groups[0].n === 4){
    // four + kicker
    const quad = groups[0].v;
    const kicker = groups[1].v;
    return { rank: 8, name: "Póker", tb: [quad, kicker] };
  }

  if (groups[0].n === 3 && groups[1].n === 2){
    return { rank: 7, name: "Full", tb: [groups[0].v, groups[1].v] };
  }

  if (isFlush){
    return { rank: 6, name: "Color", tb: vals };
  }

  if (isStraight){
    return { rank: 5, name: "Escalera", tb: [straightHigh] };
  }

  if (groups[0].n === 3){
    // trips + 2 kickers
    const seq = sortedByGroup();
    return { rank: 4, name: "Trío", tb: seq };
  }

  if (groups[0].n === 2 && groups[1].n === 2){
    // two pair + kicker
    const highPair = Math.max(groups[0].v, groups[1].v);
    const lowPair  = Math.min(groups[0].v, groups[1].v);
    const kicker = groups[2].v;
    return { rank: 3, name: "Doble Pareja", tb: [highPair, lowPair, kicker] };
  }

  if (groups[0].n === 2){
    // pair + 3 kickers
    const seq = sortedByGroup();
    return { rank: 2, name: "Pareja", tb: seq };
  }

  return { rank: 1, name: "Carta Alta", tb: vals };
}

function compareEval(a,b){
  if (a.rank !== b.rank) return a.rank - b.rank;
  const len = Math.max(a.tb.length, b.tb.length);
  for (let i=0;i<len;i++){
    const av = a.tb[i] ?? 0;
    const bv = b.tb[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function bestOf7(cards7){
  const hands = comb5(cards7);
  let best = null;
  for (const h of hands){
    const e = eval5(h);
    if (!best || compareEval(e,best) > 0) best = e;
  }
  return best;
}

/***********************
 *  IA MÁQUINA (simple, pero coherente)
 ***********************/
function machineDecision(){
  // fuerza estimada con lo visible (mano máquina + mesa)
  const visible = [...manoMaquina, ...mesa];
  const strength = bestOf7(visible.length >= 5 ? visible : visible.concat(robar(5-visible.length))).rank;

  // si el jugador ha subido mucho, y la mano es mala: fold a veces
  const toCall = Math.max(0, apuestaJugadorEnRonda - apuestaMaquinaEnRonda);

  // rango de decisiones
  if (toCall === 0){
    // puede apostar (raise) si fuerte
    if (strength >= 6 && Math.random() < 0.55) return { type:"raise", amount: 40 };
    if (strength >= 4 && Math.random() < 0.25) return { type:"raise", amount: 20 };
    return { type:"check" };
  } else {
    // hay que pagar
    if (strength >= 6) return { type:"call" };
    if (strength >= 4 && Math.random() < 0.70) return { type:"call" };
    if (toCall <= 20 && Math.random() < 0.45) return { type:"call" };
    return { type:"fold" };
  }
}

/***********************
 *  FLUJO DEL JUEGO
 ***********************/
function resetRondaApuestas(){
  apuestaActual = 0;
  apuestaJugadorEnRonda = 0;
  apuestaMaquinaEnRonda = 0;
}

function nuevaMano(){
  ensureAudio();
  startMusicIfPossible();

  if (saldo <= 0){
    setMensaje("Te has quedado sin saldo. Recarga la página para reiniciar.");
    habilitarAcciones(false);
    return;
  }

  crearMazo();
  manoJugador = robar(2);
  manoMaquina = robar(2);
  mesa = [];
  bote = 0;
  etapa = 0;
  enMano = true;

  resetRondaApuestas();
  render(true);

  // ciegas simples (sin complicarnos)
  const smallBlind = 10;
  const bigBlind = 20;

  meterAlBote("J", smallBlind);
  meterAlBote("M", bigBlind);

  setMensaje(`Nueva mano. Pagas ciega pequeña (${smallBlind}€). La máquina pone ciega grande (${bigBlind}€). Tu turno.`);
  render(true);

  habilitarAcciones(true);
}

function repartirMesa(cuantas){
  const cartas = robar(cuantas);
  // animación “reparto”
  let i = 0;
  const t = setInterval(()=>{
    if (i >= cartas.length){
      clearInterval(t);
      return;
    }
    mesa.push(cartas[i]);
    sfxCard();
    render(true);
    i++;
  }, 320); // velocidad reparto mesa
}

function siguienteEtapa(){
  if (!enMano) return;

  // pasamos a flop/turn/river/showdown
  etapa++;

  resetRondaApuestas();

  if (etapa === 1){
    setMensaje("Flop...");
    repartirMesa(3);
    setTimeout(()=>{ setMensaje("Tu turno."); habilitarAcciones(true); }, 1100);
    return;
  }
  if (etapa === 2){
    setMensaje("Turn...");
    repartirMesa(1);
    setTimeout(()=>{ setMensaje("Tu turno."); habilitarAcciones(true); }, 700);
    return;
  }
  if (etapa === 3){
    setMensaje("River...");
    repartirMesa(1);
    setTimeout(()=>{ setMensaje("Tu turno."); habilitarAcciones(true); }, 700);
    return;
  }

  // showdown
  resolverMano();
}

function resolverMano(){
  if (!enMano) return;
  enMano = false;

  // mostrar cartas máquina
  render(false);

  const evalJ = bestOf7([...manoJugador, ...mesa]);
  const evalM = bestOf7([...manoMaquina, ...mesa]);

  const cmp = compareEval(evalJ, evalM);

  if (cmp > 0){
    saldo += bote;
    setMensaje(`🎉 Ganas: ${evalJ.name}. Te llevas el bote (${bote}€).`);
    sfxWin();
    addHistorial("win", `GANAS`, evalJ.name, evalM.name);
  } else if (cmp < 0){
    setMensaje(`💀 Pierdes: Máquina gana con ${evalM.name}. (Bote ${bote}€)`);
    sfxLose();
    addHistorial("lose", `PIERDES`, evalJ.name, evalM.name);
  } else {
    // empate: devolvemos bote al jugador para simplificar
    saldo += Math.floor(bote/2);
    setMensaje(`🤝 Empate. ${evalJ.name} vs ${evalM.name}.`);
    sfxTie();
    addHistorial("tie", `EMPATE`, evalJ.name, evalM.name);
  }

  bote = 0;
  render(false);

  // auto: prepara siguiente mano (sin obligar)
  setTimeout(()=>{
    render(true);
    setMensaje("Pulsa “Nueva mano” para seguir.");
    habilitarAcciones(false);
  }, 1200);
}

/***********************
 *  ACCIONES JUGADOR
 ***********************/
function actionCall(){
  if (!enMano) return;

  sfxClick();

  // en esta versión, “call” significa: pasar a la IA y avanzar etapa
  // si la máquina decide raise, te lo reflejamos en mensaje y se avanza igual.
  habilitarAcciones(false);

  // decisión máquina
  setTimeout(()=>{
    const dec = machineDecision();
    const toCall = Math.max(0, apuestaMaquinaEnRonda - apuestaJugadorEnRonda);

    if (dec.type === "fold"){
      // máquina se retira => jugador gana bote
      saldo += bote;
      setMensaje(`🤖 Máquina se retira. Te llevas el bote (${bote}€).`);
      sfxWin();
      addHistorial("win", `GANAS`, "Máquina se retira", "-");
      bote = 0;
      enMano = false;
      render(false);
      setTimeout(()=>{
        render(true);
        setMensaje("Pulsa “Nueva mano” para seguir.");
        habilitarAcciones(false);
      }, 1200);
      return;
    }

    if (dec.type === "raise"){
      // máquina sube
      meterAlBote("M", dec.amount);
      setMensaje(`🤖 Máquina sube ${dec.amount}€. Pasas a la siguiente carta...`);
    } else if (dec.type === "call"){
      if (toCall > 0) meterAlBote("M", toCall);
      setMensaje(`🤖 Máquina paga. Pasas a la siguiente carta...`);
    } else {
      setMensaje("🤖 Máquina pasa. Siguiente carta...");
    }

    render(true);
    setTimeout(siguienteEtapa, 650);
  }, 650);
}

function actionRaise(){
  if (!enMano) return;

  sfxClick();

  let cantidad = Number(inputRaise.value);
  cantidad = clamp(cantidad, 10, saldo);

  meterAlBote("J", cantidad);
  setMensaje(`Subes ${cantidad}€. La máquina decide...`);
  render(true);

  habilitarAcciones(false);

  setTimeout(()=>{
    const dec = machineDecision();

    if (dec.type === "fold"){
      // máquina se retira => jugador gana bote
      saldo += bote;
      setMensaje(`🤖 Máquina se retira. Te llevas el bote (${bote}€).`);
      sfxWin();
      addHistorial("win", `GANAS`, "Máquina se retira", "-");
      bote = 0;
      enMano = false;
      render(false);
      setTimeout(()=>{
        render(true);
        setMensaje("Pulsa “Nueva mano” para seguir.");
        habilitarAcciones(false);
      }, 1200);
      return;
    }

    if (dec.type === "call" || dec.type === "check"){
      // paga lo necesario
      const toCall = Math.max(0, apuestaJugadorEnRonda - apuestaMaquinaEnRonda);
      if (toCall > 0) meterAlBote("M", toCall);
      setMensaje("🤖 Máquina iguala. Siguiente carta...");
      render(true);
      setTimeout(siguienteEtapa, 650);
      return;
    }

    // si la máquina hace raise, lo reflejamos (sube poco) y seguimos
    if (dec.type === "raise"){
      meterAlBote("M", dec.amount);
      setMensaje(`🤖 Máquina resube ${dec.amount}€. Se continúa...`);
      render(true);
      setTimeout(siguienteEtapa, 650);
    }
  }, 750);
}

function actionFold(){
  if (!enMano) return;

  sfxClick();

  setMensaje("Te retiras. Gana la máquina.");
  sfxLose();
  addHistorial("lose", "PIERDES", "Te retiras", "-");

  bote = 0;
  enMano = false;

  render(false);
  habilitarAcciones(false);

  setTimeout(()=>{
    render(true);
    setMensaje("Pulsa “Nueva mano” para seguir.");
  }, 1000);
}

/***********************
 *  HISTORIAL
 ***********************/
function addHistorial(tipo, resultado, manoJ, manoM){
  const div = document.createElement("div");
  div.className = `hist-item ${tipo}`;

  div.innerHTML = `
    <div><span class="tag">[${nowHHMMSS()}] ${resultado}</span> · Bote: <b>${bote}€</b> · Saldo: <b>${saldo}€</b></div>
    <div>Jugador: ${manoJ}</div>
    <div>Máquina: ${manoM}</div>
  `;

  historialLista.prepend(div);
}

/***********************
 *  EVENTOS
 ***********************/
betPlus.onclick = () => { sfxClick(); inputRaise.value = Number(inputRaise.value) + 10; };
betMinus.onclick = () => { sfxClick(); inputRaise.value = Math.max(10, Number(inputRaise.value) - 10); };

btnCall.addEventListener("click", actionCall);
btnRaise.addEventListener("click", actionRaise);
btnFold.addEventListener("click", actionFold);

btnNueva.addEventListener("click", ()=>{
  sfxClick();
  nuevaMano();
});

btnSound.addEventListener("click", ()=>{
  // botón solo controla la música ambiente (NO los SFX)
  sfxClick();
  setMusicEnabled(!musicEnabled);
});

// primer gesto del usuario => permite audio en Chrome
window.addEventListener("pointerdown", ()=>{
  ensureAudio();
  if (musicEnabled) startMusicIfPossible();
}, { once:true });

// estado inicial
habilitarAcciones(false);
setMusicEnabled(true);
render(true);