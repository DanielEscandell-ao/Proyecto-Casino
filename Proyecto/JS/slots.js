// --- Configuración básica ---
const SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "⭐", "🍀", "7️⃣"];
const FRUITS = new Set(["🍒", "🍋", "🍇"]); // para "cualquier triple de fruta"
const PAYOUTS = {
  "7️⃣": 100,
  "⭐": 40,
  "🔔": 20,
  "🍀": 10,
  // cualquier triple fruta => 5 (se calcula aparte)
};
const SPIN_MS = 1200; // duración del giro (ms)

// --- Elementos del DOM ---
const reels = Array.from(document.querySelectorAll(".reel"));
const btnSpin = document.getElementById("spin");
const btnAuto = document.getElementById("autoSpin");
const betInput = document.getElementById("bet");
const betMinus = document.getElementById("betMinus");
const betPlus = document.getElementById("betPlus");
const balanceEl = document.getElementById("balance");
const messageEl = document.getElementById("message");

let spinning = false;
let autoTimer = null;

// --- Utilidades ---
const readBalance = () => parseInt(balanceEl.textContent.trim(), 10) || 0;
const writeBalance = (v) => (balanceEl.textContent = String(v));

function randSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}
function reelResult() {
  // Devuelve 3 símbolos para un rodillo
  return [randSymbol(), randSymbol(), randSymbol()];
}
function renderReel(reelEl, symbols) {
  reelEl.innerHTML = ""; // limpia el contenido
  for (const s of symbols) {
    const span = document.createElement("span");
    span.className = "symbol";
    span.textContent = s;
    reelEl.appendChild(span);
  }
}
function setMessage(text) {
  messageEl.textContent = text;
}
function clampBet() {
  const min = parseInt(betInput.min || "1", 10);
  const max = parseInt(betInput.max || "100", 10);
  let val = parseInt(betInput.value || String(min), 10);
  if (isNaN(val)) val = min;
  val = Math.max(min, Math.min(max, val));
  betInput.value = String(val);
  return val;
}

function calcPayout([a, b, c], bet) {
  // Devuelve {mult, prize}
  if (a === b && b === c) {
    const sym = a;
    let mult = PAYOUTS[sym] || 0;
    if (!mult && FRUITS.has(sym)) mult = 5; // triple fruta
    const prize = mult * bet;
    return { mult, prize };
  }
  return { mult: 0, prize: 0 };
}

function disableControls(disabled) {
  btnSpin.disabled = disabled;
  btnAuto.disabled = disabled && !btnAuto.classList.contains("active"); // si Auto activo, no lo deshabilitamos
  betInput.disabled = disabled;
  betMinus.disabled = disabled;
  betPlus.disabled = disabled;
}

// --- Lógica principal de giro ---
async function spinOnce() {
  if (spinning) return;
  clampBet();

  const bet = parseInt(betInput.value, 10);
  let balance = readBalance();

  if (bet > balance) {
    setMessage("Saldo insuficiente. Baja la apuesta o recarga saldo.");
    return;
  }

  spinning = true;
  disableControls(true);

  // Cobrar apuesta
  balance -= bet;
  writeBalance(balance);

  // activar animación
  reels.forEach((r) => r.classList.add("spinning"));

  // Espera la duración del giro
  await new Promise((res) => setTimeout(res, SPIN_MS));

  // Generar resultados y mostrarlos
  const results = reels.map(() => reelResult().map(String));
  results.forEach((syms, idx) => renderReel(reels[idx], syms.map(String)));

  // parar animación
  reels.forEach((r) => r.classList.remove("spinning"));

  // Evaluar pago: para esta UI tomamos la fila central (símbolo 2 de cada rodillo)
  const line = results.map((col) => col[1]); // [mid1, mid2, mid3]
  const { mult, prize } = calcPayout(line, bet);

  balance += prize;
  writeBalance(balance);

  if (mult > 0) {
    setMessage(`¡Ganaste ×${mult}! Premio: ${prize} — Línea: ${line.join(" ")}`);
  } else {
    setMessage(`Sin premio. Línea: ${line.join(" ")}`);
  }

  spinning = false;
  disableControls(false);

  // cortar Auto si no hay saldo
  if (btnAuto.classList.contains("active") && bet > balance) {
    toggleAuto(false);
    setMessage("Auto detenido por saldo insuficiente.");
  }
}

// --- Auto giro ---
function toggleAuto(forceOff = null) {
  const willEnable = forceOff === null ? !btnAuto.classList.contains("active") : !forceOff;

  if (willEnable) {
    btnAuto.classList.add("active");
    btnAuto.setAttribute("aria-pressed", "true");
    btnAuto.textContent = "Auto (ON)";
    // Lanza un giro y luego intervalos encadenados
    const loop = async () => {
      if (!btnAuto.classList.contains("active")) return;
      await spinOnce();
      // espera un pequeño margen entre giros
      autoTimer = setTimeout(loop, 350);
    };
    loop();
  } else {
    btnAuto.classList.remove("active");
    btnAuto.setAttribute("aria-pressed", "false");
    btnAuto.textContent = "Automático";
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
  }
}

// --- Listeners de UI ---
btnSpin.addEventListener("click", () => {
  // si Auto está activo, un clic manual hace un solo giro adicional sin quitar el auto
  spinOnce();
});

btnAuto.addEventListener("click", () => toggleAuto());

betMinus.addEventListener("click", () => {
  betInput.value = String(Math.max(parseInt(betInput.min || "1", 10), clampBet() - 1));
});
betPlus.addEventListener("click", () => {
  betInput.value = String(Math.min(parseInt(betInput.max || "100", 10), clampBet() + 1));
});
betInput.addEventListener("input", clampBet);

// Render inicial “bonito” (rellena cada rodillo con 3 símbolos al cargar)
(function initialFill() {
  reels.forEach((reel) => renderReel(reel, reelResult()));
  setMessage("¡Bienvenido! Ajusta tu apuesta y pulsa GIRAR.");
})();

// Sonidos del Slot //
const sounds = {
  click: loadAudio("audio/click.mp3"),
  spin:  loadAudio("audio/spin.mp3"),
  stop:  loadAudio("audio/stop.mp3"),
  win:   loadAudio("audio/win.mp3"),
  lose:  loadAudio("audio/lose.mp3"),
};