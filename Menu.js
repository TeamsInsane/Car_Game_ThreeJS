function readValues(){
    const vehicle = document.querySelector('input[name="Vehicle"]:checked').value;
    localStorage.setItem("Vehicle", vehicle);
    console.log(vehicle);
}