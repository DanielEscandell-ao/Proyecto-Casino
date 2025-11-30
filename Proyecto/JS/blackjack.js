// Definición de variables y objetivos
let baraja = [];
const tipoCarta = ["C","D","P","T"];
const especiales = [ "A","K","Q","J"];

// Crear baraja para comenzar a reportar cartas
const crearBaraja = () => {
    for(let i =2; i <=10; i++) {
        for (let tipo of tipoCarta) {
            baraja.push(i + tipo);
        }
    }

    for (let esp of especiales) {
        for (let tipo of tipoCarta) {
        baraja.push(esp + tipo);
    }
    }

// desordenado la baraja
    baraja = _.shuffle(baraja);
    console.log(baraja);
    return baraja;
};

//pedir una carta y retirar de la misma
const pedirCarta = ()=> {
    if (baraja.length === 0) {
        throw "No hay cartas";
    } else {
        const carta= baraja.pop(); 
    }
    return carta;
};
// Calculamos el valor de la carta
const valorCarta = (carta) => {
    let puntos =carta.substring(0, carta.length - 1)
    let valor = isNaN(puntos) ? (puntos === 'A' ? 11 :10) : puntos * 1;
    console.log(valor);
};
// Main
crearBaraja();
valorCarta(pedirCarta());
console.log(baraja);