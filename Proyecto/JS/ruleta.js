// ===============================
// ====== RULETA REALISTA ========
// ====== Tapete + Sonidos =======
// ===============================

const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");

const botonGirar = document.getElementById("girar");
const resultado = document.getElementById("resultado");
const balanceEl = document.getElementById("balance");

const tapete = document.getElementById("tapete");
const chipsBtns = document.querySelectorAll(".chip");
const chipSelEl = document.getElementById("chip-seleccionada");
const btnLimpiar = document.getElementById("btn-limpiar");

const bgMusic = document.getElementById("bgMusic");
const btnSonido = document.getElementById("btn-sonido");

// ====== DINERO ======
let balance = 1000;
let chipSeleccionada = 10;

// apuestas: Map clave -> {tipo, valor, total}
const apuestas = new Map();

// ====== RULETA EUROPEA (orden rueda) ======
const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const colors = {
  0: "green",
  1: "red", 2: "black", 3: "red", 4: "black", 5: "red", 6: "black",
  7: "red", 8: "black", 9: "red", 10: "black", 11: "black", 12: "red",
  13: "black", 14: "red", 15: "black", 16: "red", 17: "black", 18: "red",
  19: "red", 20: "black", 21: "red", 22: "black", 23: "red", 24: "black",
  25: "red", 26: "black", 27: "red", 28: "black", 29: "black", 30: "red",
  31: "black", 32: "red", 33: "black", 34: "red", 35: "black", 36: "red",
};

const total = wheelNumbers.length;
const angle = (2 * Math.PI) / total;

// ===============================
// ====== SONIDOS (WebAudio) =====
// ===============================
let audioCtx = null;
let sfxVol = 0.6;
let musicaActiva = true;

const ensureAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
};

const beep = (freq = 440, dur = 0.08, type = "sine", gain = 0.15) => {
  try {
    ensureAudio();
    const t0 = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * sfxVol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {}
};

const sfxPlace = () => beep(650, 0.06, "square", 0.12);
const sfxClear = () => beep(220, 0.10, "sawtooth", 0.10);
const sfxSpin = () => beep(180, 0.20, "triangle", 0.10);
const sfxWin = () => { beep(880, 0.09, "sine", 0.16); setTimeout(() => beep(990, 0.09, "sine", 0.16), 90); };
const sfxLose = () => beep(140, 0.16, "sine", 0.14);

// ===============================
// ====== MÚSICA AMBIENTAL ========
// ===============================
bgMusic.volume = 0.25;

const startMusic = () => {
  if (!musicaActiva) return;
  bgMusic.play().catch(() => {});
};

const toggleMusic = () => {
  musicaActiva = !musicaActiva;
  if (!musicaActiva) {
    bgMusic.pause();
    btnSonido.textContent = "🔇 Mute";
  } else {
    btnSonido.textContent = "🔊 Sonido";
    startMusic();
  }
};

// Iniciar audio tras interacción
const userTouch = () => {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  startMusic();
  window.removeEventListener("pointerdown", userTouch);
  window.removeEventListener("keydown", userTouch);
};
window.addEventListener("pointerdown", userTouch);
window.addEventListener("keydown", userTouch);

btnSonido.addEventListener("click", () => {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  toggleMusic();
});

// ===============================
// ====== UI DINERO ======
// ===============================
const renderBalance = () => {
  balanceEl.textContent = `Saldo: ${balance} fichas`;
};

// ===============================
// ====== DIBUJO RULETA PRO ======
// ===============================
function drawWheel(rot = 0) {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  // Sombra exterior
  ctx.beginPath();
  ctx.arc(cx, cy, 205, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  // Aro exterior rojo
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.fillStyle = "#3b0000";
  ctx.fill();

  // Aro metálico
  ctx.beginPath();
  ctx.arc(cx, cy, 192, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Casillas
  const rOuter = 188;
  const rInner = 120;

  for (let i = 0; i < total; i++) {
    const n = wheelNumbers[i];
    const start = i * angle + rot;
    const end = start + angle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOuter, start, end);
    ctx.closePath();

    const c = colors[n];
    ctx.fillStyle = c === "red" ? "#b30000" : (c === "black" ? "#0f0f0f" : "#006600");
    ctx.fill();

    // separadores
    ctx.strokeStyle = "rgba(255,215,0,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // texto número
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + angle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Poppins, sans-serif";
    ctx.fillText(String(n), rOuter - 10, 5);
    ctx.restore();
  }

  // Centro
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = "#111";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.fillStyle = "#1f1f1f";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,215,0,0.7)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Texto centro
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "900 18px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CASINO", cx, cy - 4);
  ctx.font = "700 12px Poppins, sans-serif";
  ctx.fillText("Montepinar", cx, cy + 16);
}

drawWheel(0);

// ===============================
// ====== TAPETE REALISTA ========
// ===============================
// Distribución tipo casino (como tu imagen):
// 3 filas x 12 cols (de izquierda a derecha):
// fila 1: 3 6 9 ... 36
// fila 2: 2 5 8 ... 35
// fila 3: 1 4 7 ... 34
const filaTop =  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
const filaMid =  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const filaBot =  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

function makeCell({ text, tipo, valor, cls = "", style = "", grid = "" }) {
  const d = document.createElement("div");
  d.className = `celda ${cls}`.trim();
  d.textContent = text;
  d.dataset.tipo = tipo;
  d.dataset.valor = valor;
  if (style) d.style.cssText += style;
  if (grid) d.style.cssText += grid;
  return d;
}

function buildTapete() {
  tapete.innerHTML = "";

  // 0 (ocupa 3 filas)
  tapete.appendChild(
    makeCell({
      text: "0",
      tipo: "numero",
      valor: "0",
      cls: "zero verde"
    })
  );

  // 3 filas de números (cada fila: 12 números)
  const filas = [filaTop, filaMid, filaBot];

  filas.forEach((arr, rowIndex) => {
    arr.forEach((n) => {
      const c = colors[n];
      const cls = c === "red" ? "rojo" : "negro";
      tapete.appendChild(
        makeCell({
          text: String(n),
          tipo: "numero",
          valor: String(n),
          cls
        })
      );
    });

    // Columna derecha: 2 to 1 (apuesta a columna)
    tapete.appendChild(
      makeCell({
        text: "2 to 1",
        tipo: "columna",
        valor: String(rowIndex + 1), // 1=top,2=mid,3=bot
        cls: "outside",
      })
    );
  });

  // ====== FILA OUTSIDE 1: docenas ======
  // (col 1 es el 0 ya usado, aquí hacemos un bloque que ocupe 14 columnas completas)
  const rowStart = 4; // porque grid-auto-rows, pero mejor usar grid en línea
  // Creamos una fila “virtual” usando grid-column
  tapete.appendChild(makeCell({
    text: "1st 12",
    tipo: "docena",
    valor: "1",
    cls: "outside",
    grid: "grid-column: 2 / 6; grid-row: 4 / 5;"
  }));
  tapete.appendChild(makeCell({
    text: "2nd 12",
    tipo: "docena",
    valor: "2",
    cls: "outside",
    grid: "grid-column: 6 / 10; grid-row: 4 / 5;"
  }));
  tapete.appendChild(makeCell({
    text: "3rd 12",
    tipo: "docena",
    valor: "3",
    cls: "outside",
    grid: "grid-column: 10 / 14; grid-row: 4 / 5;"
  }));

  // ====== FILA OUTSIDE 2: 1-18 / even / rojo / negro / odd / 19-36 ======
  tapete.appendChild(makeCell({
    text: "1 to 18",
    tipo: "rango",
    valor: "1-18",
    cls: "outside",
    grid: "grid-column: 2 / 4; grid-row: 5 / 6;"
  }));
  tapete.appendChild(makeCell({
    text: "EVEN",
    tipo: "paridad",
    valor: "par",
    cls: "outside",
    grid: "grid-column: 4 / 6; grid-row: 5 / 6;"
  }));

  tapete.appendChild(makeCell({
    text: "ROJO",
    tipo: "color",
    valor: "red",
    cls: "outside rojo",
    grid: "grid-column: 6 / 8; grid-row: 5 / 6;"
  }));
  tapete.appendChild(makeCell({
    text: "NEGRO",
    tipo: "color",
    valor: "black",
    cls: "outside negro",
    grid: "grid-column: 8 / 10; grid-row: 5 / 6;"
  }));

  tapete.appendChild(makeCell({
    text: "ODD",
    tipo: "paridad",
    valor: "impar",
    cls: "outside",
    grid: "grid-column: 10 / 12; grid-row: 5 / 6;"
  }));
  tapete.appendChild(makeCell({
    text: "19 to 36",
    tipo: "rango",
    valor: "19-36",
    cls: "outside",
    grid: "grid-column: 12 / 14; grid-row: 5 / 6;"
  }));
}

buildTapete();

// ===============================
// ====== APOSTAR / BADGES =======
// ===============================
function keyBet(tipo, valor) {
  return `${tipo}:${valor}`;
}

function getBadge(cell) {
  return cell.querySelector(".badge");
}

function setBadge(cell, amount) {
  let b = getBadge(cell);
  if (amount <= 0) {
    if (b) b.remove();
    return;
  }
  if (!b) {
    b = document.createElement("span");
    b.className = "badge";
    cell.appendChild(b);
  }
  b.textContent = amount;
}

function addApuesta(tipo, valor, cantidad, cell) {
  const k = keyBet(tipo, valor);
  const prev = apuestas.get(k);
  const total = (prev?.total || 0) + cantidad;
  apuestas.set(k, { tipo, valor, total });

  // badge visual
  setBadge(cell, total);
}

function refundAll() {
  let total = 0;
  apuestas.forEach((a) => (total += a.total));
  balance += total;
  apuestas.clear();

  // quitar badges
  tapete.querySelectorAll(".badge").forEach((b) => b.remove());

  renderBalance();
}

tapete.addEventListener("click", (e) => {
  const cell = e.target.closest(".celda");
  if (!cell) return;

  // arrancar audio + música si procede
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  startMusic();

  const tipo = cell.dataset.tipo;
  const valor = cell.dataset.valor;

  if (balance < chipSeleccionada) {
    resultado.textContent = "Saldo insuficiente para esa apuesta.";
    sfxLose();
    return;
  }

  balance -= chipSeleccionada;
  renderBalance();
  addApuesta(tipo, valor, chipSeleccionada, cell);
  resultado.textContent = "Apuesta registrada.";
  sfxPlace();
});

btnLimpiar.addEventListener("click", () => {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  refundAll();
  resultado.textContent = "Apuestas limpiadas.";
  sfxClear();
});

// ====== Selección de fichas ======
chipsBtns.forEach((b) => {
  b.addEventListener("click", () => {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    startMusic();

    chipsBtns.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");

    chipSeleccionada = Number(b.dataset.value);
    chipSelEl.textContent = chipSeleccionada;
    sfxPlace();
  });
});

// por defecto activa +10
chipsBtns[0].classList.add("active");
renderBalance();

// ===============================
// ====== GIRAR RULETA ===========
// ===============================
let spinning = false;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

botonGirar.addEventListener("click", () => {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  startMusic();

  if (spinning) return;
  if (apuestas.size === 0) {
    resultado.textContent = "Haz una apuesta primero.";
    sfxLose();
    return;
  }

  spinning = true;
  botonGirar.disabled = true;
  resultado.textContent = "Girando...";
  sfxSpin();

  const winnerIndex = Math.floor(Math.random() * total);
  const winnerNumber = wheelNumbers[winnerIndex];
  const winnerColor = colors[winnerNumber];

  // Queremos que el número ganador quede arriba (flecha).
  const targetRot = (2 * Math.PI) - (winnerIndex * angle) + Math.PI / 2;

  const start = performance.now();
  const duration = 4200; // más “casino”
  const spins = 10; // vueltas
  const startRot = 0;

  function animate(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = easeOutCubic(t);

    const rot = startRot + eased * (spins * 2 * Math.PI + targetRot);
    drawWheel(rot);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      drawWheel(targetRot);
      payResult(winnerNumber, winnerColor);
      spinning = false;
      botonGirar.disabled = false;
    }
  }

  requestAnimationFrame(animate);
});

// ===============================
// ====== PAGOS (payouts) ========
// ===============================
// Como tu versión anterior:
// - Número exacto: x36
// - Color / paridad / rango: x2
// - Docena / columna: x3
function payResult(num, color) {
  let ganancia = 0;

  apuestas.forEach((a) => {
    const stake = a.total;

    switch (a.tipo) {
      case "numero":
        if (Number(a.valor) === num) ganancia += stake * 36;
        break;

      case "color":
        if (num !== 0 && a.valor === color) ganancia += stake * 2;
        break;

      case "paridad":
        if (num !== 0) {
          if (a.valor === "par" && num % 2 === 0) ganancia += stake * 2;
          if (a.valor === "impar" && num % 2 === 1) ganancia += stake * 2;
        }
        break;

      case "rango":
        if (a.valor === "1-18" && num >= 1 && num <= 18) ganancia += stake * 2;
        if (a.valor === "19-36" && num >= 19 && num <= 36) ganancia += stake * 2;
        break;

      case "docena":
        if (a.valor === "1" && num >= 1 && num <= 12) ganancia += stake * 3;
        if (a.valor === "2" && num >= 13 && num <= 24) ganancia += stake * 3;
        if (a.valor === "3" && num >= 25 && num <= 36) ganancia += stake * 3;
        break;

      case "columna": {
        // columna 1 = (3,6,9...36) => num % 3 == 0
        // columna 2 = (2,5,8...35) => num % 3 == 2
        // columna 3 = (1,4,7...34) => num % 3 == 1
        if (num !== 0) {
          const col = Number(a.valor);
          const mod = num % 3;
          const win =
            (col === 1 && mod === 0) ||
            (col === 2 && mod === 2) ||
            (col === 3 && mod === 1);
          if (win) ganancia += stake * 3;
        }
        break;
      }
    }
  });

  balance += ganancia;
  renderBalance();

  const colText = color === "red" ? "ROJO" : (color === "black" ? "NEGRO" : "VERDE");
  resultado.innerHTML = `Ha salido <b style="color:${color}; text-shadow:0 0 10px rgba(0,0,0,0.6)">${num}</b> (${colText}) · ${
    ganancia > 0 ? `¡Ganaste ${ganancia} fichas!` : "No ganaste esta vez."
  }`;

  if (ganancia > 0) sfxWin();
  else sfxLose();

  // reset apuestas visuales
  apuestas.clear();
  tapete.querySelectorAll(".badge").forEach((b) => b.remove());
}