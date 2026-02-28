// =================== SLOTS.JS (ENTERO) ===================

// ========== Audio helpers ==========
function loadAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

// Reproduce sin romper si el audio falla (archivo no existe / autoplay bloqueado)
function playSafe(audioObj) {
  if (!audioObj) return;
  try {
    audioObj.pause();
    audioObj.currentTime = 0;
    audioObj.play().catch(() => {});
  } catch (e) {}
}

// ========== Sonidos ==========
const sounds = {
  // IMPORTANTE: apuesta.mp3 (con A)
  click: loadAudio("/Proyecto/Audios/Slots/apuesta.mp3"),
  spin:  loadAudio("/Proyecto/Audios/Slots/apuesta.mp3"),
  win:   loadAudio("/Proyecto/Audios/Slots/ganas.mp3"),

  // Opcionales: si no los tienes no pasa nada (no rompe)
  stop:  loadAudio("/Proyecto/Audios/Slots/stop.mp3"),
  lose:  loadAudio("/Proyecto/Audios/Slots/lose.mp3"),
};

// Música de fondo
const bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.12;
let sonidoActivo = true;
let bgMusicStarted = false;

// Botón mute
const btnMute = document.getElementById("mute");
btnMute.addEventListener("click", async () => {
  sonidoActivo = !sonidoActivo;

  if (sonidoActivo) {
    btnMute.textContent = "🔊 Sonido";
    try {
      await bgMusic.play();
      bgMusicStarted = true;
    } catch (e) {}
  } else {
    btnMute.textContent = "🔇 Silencio";
    bgMusic.pause();
  }
});

// ========== Variables principales ==========
const SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "⭐", "🍀", "7️⃣"];
const reels = [...document.querySelectorAll(".reel")];
const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet");
const messageEl = document.getElementById("message");
const btnSpin = document.getElementById("spin");
const btnAuto = document.getElementById("autoSpin");

let spinning = false;
let autoTimer = null;

// Historial
const slotHistory = document.getElementById("slotHistory");
function addSlotHistory(texto) {
  if (!slotHistory) return;
  const p = document.createElement("p");
  p.textContent = texto;
  slotHistory.appendChild(p);
  slotHistory.scrollTop = slotHistory.scrollHeight;
}

// Helpers
function randSym() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function renderReel(reel, arr) {
  reel.innerHTML = "";
  arr.forEach((s) => {
    const span = document.createElement("span");
    span.className = "symbol";
    span.textContent = s;
    reel.appendChild(span);
  });
}

function showBigWin() {
  let banner = document.getElementById("bigWinBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "bigWinBanner";
    document.body.appendChild(banner);
  }
  banner.className = "big-win-text";
  banner.textContent = "¡GANASTE!";
  setTimeout(() => {
    banner.className = "";
    banner.style.opacity = "0";
  }, 1500);
}

function explodeCoins() {
  const container = document.getElementById("coinExplosion");
  if (!container) return;

  for (let i = 0; i < 16; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2 - 100;
    coin.style.left = startX + "px";
    coin.style.top = startY + "px";

    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 180;
    const xOff = Math.cos(angle) * distance;
    const yOff = Math.sin(angle) * distance;

    coin.animate(
      [
        { transform: `translate(0,0) scale(1)`, opacity: 1 },
        { transform: `translate(${xOff}px, ${yOff}px) scale(0.3)`, opacity: 0 },
      ],
      { duration: 900, easing: "ease-out" }
    );

    container.appendChild(coin);
    setTimeout(() => coin.remove(), 900);
  }
}

// ========== CONFIG de velocidad (AJUSTA AQUÍ) ==========
const SPIN_TICK_MS = 110;       // velocidad de "parpadeo" mientras gira (más alto = más lento)
const ALL_SPIN_TIME_MS = 1100;  // tiempo total girando antes de empezar a parar
const STOP_GAP_MS = 420;        // separación entre paradas (izq -> medio -> dcha)
const AUTO_DELAY_MS = 600;      // delay entre tiradas en auto

// ========== Giro principal (EMPIEZAN A LA VEZ / PARAN EN SECUENCIA) ==========
async function spinOnce() {
  if (spinning) return;

  // Arranca música al primer giro (si está activo)
  if (!bgMusicStarted && sonidoActivo) {
    try {
      await bgMusic.play();
      bgMusicStarted = true;
    } catch (e) {}
  }

  const bet = parseInt(betInput.value);
  let balance = parseInt(balanceEl.textContent);

  if (isNaN(bet) || bet <= 0) {
    messageEl.textContent = "La apuesta mínima es de 1€";
    return;
  }
  if (bet > balance) {
    messageEl.textContent = "Saldo insuficiente";
    return;
  }

  spinning = true;
  balanceEl.textContent = balance - bet;
  addSlotHistory(`Apuesta: ${bet}€ — Girando...`);

  // Sonido giro
  if (sonidoActivo) playSafe(sounds.spin);

  // 1) EMPIEZAN LAS 3 A LA VEZ
  const intervals = [];
  reels.forEach((reel, i) => {
    reel.classList.add("spinning");
    intervals[i] = setInterval(() => {
      renderReel(reel, [randSym(), randSym(), randSym()]);
    }, SPIN_TICK_MS);
  });

  // 2) TIEMPO GIRANDO ANTES DE PARAR
  await new Promise((r) => setTimeout(r, ALL_SPIN_TIME_MS));

  // 3) PARAN EN ORDEN (IZQ -> MEDIO -> DCHA)
  const final = [];

  for (let i = 0; i < reels.length; i++) {
    clearInterval(intervals[i]);

    const res = [randSym(), randSym(), randSym()];
    final[i] = res; // guardamos en su índice
    renderReel(reels[i], res);
    reels[i].classList.remove("spinning");

    if (sonidoActivo) playSafe(sounds.stop);

    // margen entre paradas (excepto después del último)
    if (i < reels.length - 1) {
      await new Promise((r) => setTimeout(r, STOP_GAP_MS));
    }
  }

  // Para el sonido de giro (por si quedaba sonando)
  if (sonidoActivo) {
    try {
      sounds.spin.pause();
      sounds.spin.currentTime = 0;
    } catch (e) {}
  }

  // Línea del medio
  const line = final.map((col) => col[1]);
  const sym = line[0];

  // Multiplicador
  let mult = 0;
  if (line.every((s) => s === sym)) {
    if (sym === "7️⃣") mult = 100;
    else if (sym === "⭐") mult = 40;
    else if (sym === "🔔") mult = 20;
    else if (sym === "🍀") mult = 10;
    else if (["🍒", "🍋", "🍇"].includes(sym)) mult = 5;
  }

  const prize = mult * bet;
  balanceEl.textContent = parseInt(balanceEl.textContent) + prize;

  if (mult > 0) {
    if (sonidoActivo) playSafe(sounds.win);

    reels.forEach((r) => r.classList.add("win-flash"));
    setTimeout(() => reels.forEach((r) => r.classList.remove("win-flash")), 700);

    showBigWin();
    explodeCoins();
    messageEl.textContent = `¡Ganaste ×${mult}! ${line.join(" ")}`;
    addSlotHistory(`GANASTE ${prize}€ — Línea: ${line.join(" ")}`);
  } else {
    if (sonidoActivo) playSafe(sounds.lose);

    messageEl.textContent = `Sin premio: ${line.join(" ")}`;
    addSlotHistory(`Perdiste ${bet}€ — Línea: ${line.join(" ")}`);
  }

  spinning = false;

  // Auto spin
  if (btnAuto.classList.contains("active")) {
    if (parseInt(balanceEl.textContent) >= bet) {
      autoTimer = setTimeout(spinOnce, AUTO_DELAY_MS);
    } else {
      btnAuto.classList.remove("active");
      messageEl.textContent = "Auto detenido (sin saldo)";
    }
  }
}

// ========== Eventos ==========
btnSpin.addEventListener("click", spinOnce);

btnAuto.addEventListener("click", () => {
  btnAuto.classList.toggle("active");
  if (btnAuto.classList.contains("active")) spinOnce();
});

// Ajuste de apuesta
document.getElementById("betMinus").addEventListener("click", () => {
  betInput.value = Math.max(1, parseInt(betInput.value) - 1);
  if (sonidoActivo) playSafe(sounds.click);
});

document.getElementById("betPlus").addEventListener("click", () => {
  betInput.value = Math.min(100, parseInt(betInput.value) + 1);
  if (sonidoActivo) playSafe(sounds.click);
});