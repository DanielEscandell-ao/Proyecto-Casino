const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const botonGirar = document.getElementById("girar");
const resultado = document.getElementById("resultado");
const balanceEl = document.getElementById("balance");
const fichas = document.querySelectorAll(".fichas button");
const tapete = document.getElementById("tapete");

let balance = 1000;
let apuestaActual = 10;
let apuestas = [];

// Orden de números de ruleta europea
const numeros = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Colores correctos
const colores = {
  0: "green",
  32: "red", 15: "black", 19: "red", 4: "black", 21: "red",
  2: "black", 25: "red", 17: "black", 34: "red", 6: "black",
  27: "red", 13: "black", 36: "red", 11: "black", 30: "red",
  8: "black", 23: "red", 10: "black", 5: "red", 24: "black",
  16: "red", 33: "black", 1: "red", 20: "black", 14: "red",
  31: "black", 9: "red", 22: "black", 18: "red", 29: "black",
  7: "red", 28: "black", 12: "red", 35: "black", 3: "red", 26: "black"
};

const total = numeros.length;
const angulo = (2 * Math.PI) / total;

function dibujarRuleta(rot = 0) {
  const r = 190;
  ctx.clearRect(0, 0, 400, 400);
  numeros.forEach((n, i) => {
    const start = i * angulo + rot;
    const end = start + angulo;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colores[n];
    ctx.fill();
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Número
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(start + angulo / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(n, 165, 4);
    ctx.restore();
  });

  // Círculo central
  ctx.beginPath();
  ctx.arc(200, 200, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.strokeStyle = "gold";
  ctx.lineWidth = 3;
  ctx.stroke();
}

dibujarRuleta();

// Tapete uniforme
function crearTapete() {
  tapete.innerHTML = "";
  for (let i = 0; i <= 36; i++) {
    const div = document.createElement("div");
    div.textContent = i;
    div.className = `casilla ${colores[i] === "red" ? "rojo" : colores[i] === "black" ? "negro" : "verde"}`;
    div.dataset.tipo = "numero";
    div.dataset.valor = i;
    tapete.appendChild(div);
  }

  const extras = [
    { texto: "ROJO", tipo: "color", valor: "red" },
    { texto: "NEGRO", tipo: "color", valor: "black" },
    { texto: "PAR", tipo: "paridad", valor: "par" },
    { texto: "IMPAR", tipo: "paridad", valor: "impar" },
    { texto: "1-18", tipo: "rango", valor: "1-18" },
    { texto: "19-36", tipo: "rango", valor: "19-36" },
    { texto: "1ª12", tipo: "docena", valor: "1" },
    { texto: "2ª12", tipo: "docena", valor: "2" },
    { texto: "3ª12", tipo: "docena", valor: "3" }
  ];
  extras.forEach(a => {
    const div = document.createElement("div");
    div.textContent = a.texto;
    div.className = "casilla";
    div.dataset.tipo = a.tipo;
    div.dataset.valor = a.valor;
    tapete.appendChild(div);
  });
}
crearTapete();

// Apostar
tapete.addEventListener("click", e => {
  if (!e.target.classList.contains("casilla")) return;
  const tipo = e.target.dataset.tipo;
  const valor = e.target.dataset.valor;
  if (balance < apuestaActual) return alert("Saldo insuficiente");

  balance -= apuestaActual;
  balanceEl.textContent = `💰 Balance: $${balance}`;
  apuestas.push({ tipo, valor, cantidad: apuestaActual });

  // Añadir ficha visual
  const ficha = document.createElement("div");
  ficha.textContent = apuestaActual;
  ficha.className = "ficha-apuesta";
  ficha.style.position = "absolute";
  ficha.style.background = "gold";
  ficha.style.color = "black";
  ficha.style.fontSize = "10px";
  ficha.style.borderRadius = "50%";
  ficha.style.padding = "5px";
  ficha.style.top = `${e.target.offsetTop + 10}px`;
  ficha.style.left = `${e.target.offsetLeft + 10}px`;
  ficha.style.pointerEvents = "none";
  tapete.appendChild(ficha);
});

fichas.forEach(f => {
  f.addEventListener("click", () => {
    apuestaActual = parseInt(f.dataset.value);
    fichas.forEach(fi => (fi.style.outline = ""));
    f.style.outline = "3px solid gold";
  });
});

// Girar ruleta
botonGirar.addEventListener("click", () => {
  if (apuestas.length === 0) return alert("Haz una apuesta primero");
  botonGirar.disabled = true;
  resultado.textContent = "Girando...";

  const indiceGanador = Math.floor(Math.random() * total);
  const numeroGanador = numeros[indiceGanador];
  const colorGanador = colores[numeroGanador];

  const rotFinal = (2 * Math.PI) - (indiceGanador * angulo) + Math.PI / 2;
  let rot = 0;
  let vueltas = 10;

  function animar() {
    rot += 0.25;
    dibujarRuleta(rot);
    if (rot < (vueltas * 2 * Math.PI) + rotFinal) {
      requestAnimationFrame(animar);
    } else {
      dibujarRuleta(rotFinal);
      calcularGanancias(numeroGanador, colorGanador);
      botonGirar.disabled = false;
    }
  }
  animar();
});

function calcularGanancias(num, color) {
  let ganancia = 0;
  apuestas.forEach(a => {
    switch (a.tipo) {
      case "numero":
        if (parseInt(a.valor) === num) ganancia += a.cantidad * 36;
        break;
      case "color":
        if (a.valor === color) ganancia += a.cantidad * 2;
        break;
      case "paridad":
        if (num !== 0) {
          if (a.valor === "par" && num % 2 === 0) ganancia += a.cantidad * 2;
          if (a.valor === "impar" && num % 2 === 1) ganancia += a.cantidad * 2;
        }
        break;
      case "rango":
        if (a.valor === "1-18" && num >= 1 && num <= 18) ganancia += a.cantidad * 2;
        if (a.valor === "19-36" && num >= 19 && num <= 36) ganancia += a.cantidad * 2;
        break;
      case "docena":
        if (a.valor === "1" && num >= 1 && num <= 12) ganancia += a.cantidad * 3;
        if (a.valor === "2" && num >= 13 && num <= 24) ganancia += a.cantidad * 3;
        if (a.valor === "3" && num >= 25 && num <= 36) ganancia += a.cantidad * 3;
        break;
    }
  });

  balance += ganancia;
  balanceEl.textContent = `💰 Balance: $${balance}`;
  resultado.innerHTML = `
    Ha caído en <b style="color:${color}">${num}</b> (${color})<br>
    ${ganancia > 0 ? `Ganaste $${ganancia}!` : "No ganaste esta vez."}
  `;
  apuestas = [];
  const fichas = document.querySelectorAll(".ficha-apuesta");
  fichas.forEach(f => f.remove());
}
