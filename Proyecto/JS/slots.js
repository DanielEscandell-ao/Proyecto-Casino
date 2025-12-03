/* ========= SONIDOS ========= */
function loadAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

const sounds = {
  click: loadAudio("audio/click.mp3"),
  spin:  loadAudio("audio/spin.mp3"),
  stop:  loadAudio("audio/stop.mp3"),
  win:   loadAudio("audio/win.mp3"),
  lose:  loadAudio("audio/lose.mp3"),
};


/* ========= VARIABLES ========= */
const SYMBOLS = ["🍒","🍋","🍇","🔔","⭐","🍀","7️⃣"];
const reels = [...document.querySelectorAll(".reel")];

const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet");
const messageEl = document.getElementById("message");

const btnSpin = document.getElementById("spin");
const btnAuto = document.getElementById("autoSpin");

let spinning = false;
let autoTimer = null;


/* ========= UTILIDADES ========= */
function randSym() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function renderReel(reel, arr) {
  reel.innerHTML = "";
  arr.forEach(s => {
    const span = document.createElement("span");
    span.className = "symbol";
    span.textContent = s;
    reel.appendChild(span);
  });
}


/* ========= TEXTO GIGANTE DE VICTORIA ========= */
function showBigWin() {
  let banner = document.getElementById("bigWinBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "bigWinBanner";
    document.body.appendChild(banner);
  }

  banner.className = "big-win-text";
  banner.textContent = "¡GANASTE!";

  // Quitar la animación después para permitir repetirla
  setTimeout(() => {
    banner.className = "";
    banner.style.opacity = "0";
  }, 1500);
}


/* ========= EXPLOSIÓN DE MONEDAS ========= */
function explodeCoins() {
  const container = document.getElementById("coinExplosion");

  for (let i = 0; i < 16; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";

    // Posición inicial (centro pantalla)
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2 - 100;

    coin.style.left = startX + "px";
    coin.style.top  = startY + "px";

    // Dirección aleatoria
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 180;

    const xOff = Math.cos(angle) * distance;
    const yOff = Math.sin(angle) * distance;

    coin.animate([
      { transform: `translate(0,0) scale(1)`, opacity: 1 },
      { transform: `translate(${xOff}px, ${yOff}px) scale(0.3)`, opacity: 0 }
    ], { duration: 900, easing: "ease-out" });

    container.appendChild(coin);

    setTimeout(() => coin.remove(), 900);
  }
}


/* ========= GIRO PRINCIPAL ========= */
async function spinOnce() {
  if (spinning) return;

  const bet = parseInt(betInput.value);
  let balance = parseInt(balanceEl.textContent);

  if (bet > balance) {
    messageEl.textContent = "Saldo insuficiente";
    return;
  }

  spinning = true;
  balanceEl.textContent = balance - bet;

  sounds.spin.play();

  const intervals = [];

  reels.forEach((reel, i) => {
    reel.classList.add("spinning");
    intervals[i] = setInterval(() => {
      renderReel(reel, [randSym(), randSym(), randSym()]);
    }, 70 + i * 25);
  });

  await new Promise(r => setTimeout(r, 1200));

  const final = [];
  for (let i = 0; i < reels.length; i++) {
    clearInterval(intervals[i]);
    await new Promise(r => setTimeout(r, 180));

    const res = [randSym(), randSym(), randSym()];
    final.push(res);
    renderReel(reels[i], res);
    reels[i].classList.remove("spinning");

    sounds.stop.play();
  }

  const line = final.map(col => col[1]);
  const sym = line[0];

  let mult = 0;
  if (line.every(s => s === sym)) {
    if (sym === "7️⃣") mult = 100;
    else if (sym === "⭐") mult = 40;
    else if (sym === "🔔") mult = 20;
    else if (sym === "🍀") mult = 10;
    else if (["🍒","🍋","🍇"].includes(sym)) mult = 5;
  }

  const prize = mult * bet;
  balanceEl.textContent = parseInt(balanceEl.textContent) + prize;

  if (mult > 0) {
    sounds.win.play();

    reels.forEach(r => r.classList.add("win-flash"));
    setTimeout(() => reels.forEach(r => r.classList.remove("win-flash")), 700);

    showBigWin();
    explodeCoins();

    messageEl.textContent = `¡Ganaste ×${mult}! ${line.join(" ")}`;
  } else {
    sounds.lose.play();
    messageEl.textContent = `Sin premio: ${line.join(" ")}`;
  }

  spinning = false;

  if (btnAuto.classList.contains("active")) {
    if (parseInt(balanceEl.textContent) >= bet) {
      autoTimer = setTimeout(spinOnce, 350);
    } else {
      btnAuto.classList.remove("active");
      messageEl.textContent = "Auto detenido (sin saldo)";
    }
  }
}


/* ========= EVENTOS ========= */
btnSpin.onclick = spinOnce;

btnAuto.onclick = () => {
  btnAuto.classList.toggle("active");
  if (btnAuto.classList.contains("active")) {
    spinOnce();
  }
};

document.getElementById("betMinus").onclick = () =>
  betInput.value = Math.max(1, betInput.value - 1);

document.getElementById("betPlus").onclick = () =>
  betInput.value = Math.min(100, parseInt(betInput.value) + 1);
