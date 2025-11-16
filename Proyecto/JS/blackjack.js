let baraja = [];
const tipoCarta = ["C","D","P","T"];
const especiales = [ "A","K","Q","J"];
const creaBaraja = () => {
    for(let i =2; i <=10; i++) {
        for (let tipo of tipoCarta) {
            baraja.push(i + tipo);
        }
    }

    for (let espe of especiales) {
      for (let tipo of tipoCarta) {
        baraja.push(espe + tipo);
    }
    }

    baraja = _.shuffle(baraja);
    console.log(baraja);
    return baraja;
};

crearBaraja();
