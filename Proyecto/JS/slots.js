/* ========= SONIDOS ========= */
function loadAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

// Efectos de sonido
const sounds = {
  click: loadAudio("/Proyecto/Audios/Slots/apuest.mp3"),
  spin:  loadAudio("/Proyecto/Audios/Slots/apuesta.mp3"),
  stop:  loadAudio("/Proyecto/Audios/Slots/stop.mp3"),
  win:   loadAudio("/Proyecto/Audios/Slots/ganas.mp3"),
  lose:  loadAudio("/Proyecto/Audios/Slots/lose.mp3"),
};

// Música de fondo
const bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.1; // 10% del volumen máximo
let sonidoActivo = true;
let bgMusicStarted = false;

// Botón de mute / sonido
const btnMute = document.getElementById("mute");
btnMute.addEventListener('click', () => {
    sonidoActivo = !sonidoActivo;

    if (sonidoActivo) {
        if (!bgMusicStarted) {
            bgMusic.play().catch(() => {});
            bgMusicStarted = true;
        } else if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
        }
        btnMute.textContent = '🔊 Sonido';
    } else {
        bgMusic.pause();
        btnMute.textContent = '🔇 Silencio';
    }
});

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

/* ========= HISTORIAL (AÑADIDO) ========= */
const slotHistory = document.getElementById("slotHistory");

function addSlotHistory(texto) {
  if (!slotHistory) return; // seguridad por si no existe
  const p = document.createElement("p");
  p.textContent = texto;
  slotHistory.appendChild(p);
  slotHistory.scrollTop = slotHistory.scrollHeight;
}

/* ========= FUNCIONES AUXILIARES ========= */
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
  for (let i = 0; i < 16; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2 - 100;
    coin.style.left = startX + "px";
    coin.style.top  = startY + "px";
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

  // Iniciar música al primer clic si aún no ha empezado
  if (!bgMusicStarted && sonidoActivo) {
      bgMusic.play().catch(() => {});
      bgMusicStarted = true;
  }

  const bet = parseInt(betInput.value);
  let balance = parseInt(balanceEl.textContent);

  if (bet <= 0) {
    messageEl.textContent = "La apuesta mínima es de 1€";
    return;
  }

  if (bet > balance) {
    messageEl.textContent = "Saldo insuficiente";
    return;
  }

  spinning = true;
  balanceEl.textContent = balance - bet;

  /* ====== HISTORIAL: inicio del giro ====== */
  addSlotHistory(`Apuesta: ${bet}€ — Girando...`);

  // Iniciar sonido de giro reseteando para evitar solapamientos
  if (sonidoActivo) {
      sounds.spin.pause();
      sounds.spin.currentTime = 0;
      sounds.spin.play();
  }

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

    // Sonido de stop al terminar cada reel
    if (sonidoActivo) {
        sounds.stop.pause();
        sounds.stop.currentTime = 0;
        sounds.stop.play();
    }
  }

  // Detener sonido de giro
  if (sonidoActivo) {
      sounds.spin.pause();
      sounds.spin.currentTime = 0;
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
    if (sonidoActivo) {
        sounds.win.pause();
        sounds.win.currentTime = 0;
        sounds.win.play();
    }
    reels.forEach(r => r.classList.add("win-flash"));
    setTimeout(() => reels.forEach(r => r.classList.remove("win-flash")), 700);
    showBigWin();
    explodeCoins();
    messageEl.textContent = `¡Ganaste ×${mult}! ${line.join(" ")}`;

    /* ====== HISTORIAL: ganaste ====== */
    addSlotHistory(`GANASTE ${prize}€ — Línea: ${line.join(" ")}`);

  } else {
    if (sonidoActivo) {
        sounds.lose.pause();
        sounds.lose.currentTime = 0;
        sounds.lose.play();
    }
    messageEl.textContent = `Sin premio: ${line.join(" ")}`;

    /* ====== HISTORIAL: perdiste ====== */
    addSlotHistory(`Perdiste ${bet}€ — Línea: ${line.join(" ")}`);
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
btnSpin.addEventListener('click', spinOnce);

btnAuto.addEventListener('click', () => {
  btnAuto.classList.toggle("active");
  if (btnAuto.classList.contains("active")) spinOnce();
});

// Ajuste de apuesta con sonido
document.getElementById("betMinus").addEventListener('click', () => {
  betInput.value = Math.max(1, betInput.value - 1);
  if (sonidoActivo) {
      sounds.click.pause();
      sounds.click.currentTime = 0;
      sounds.click.play();
  }
});

document.getElementById("betPlus").addEventListener('click', () => {
  betInput.value = Math.min(100, parseInt(betInput.value) + 1);
  if (sonidoActivo) {
      sounds.click.pause();
      sounds.click.currentTime = 0;
      sounds.click.play();
  }
});