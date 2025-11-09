let baraja = [];
const tipoCarta = ["C","D","P","T"];
const creaBaraja = () => {
    for(let i =2; i <=10; i++) {
        for (let tipo of tipoCarta) {
            baraja.push(i + tipo);
        }
        baraja.push(i +"C");
    }
    console.log(baraja);
};

crearBaraja();
