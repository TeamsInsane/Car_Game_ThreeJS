const recorder = {
    key: "",
    id: "",
    recording: false
}

document.getElementById("Accelerate").onclick =()=>{
    recorder.recording = true;
    recorder.key = "W";
    recorder.id = "Accelerate";
}

document.getElementById("Decelerate").onclick =()=>{
    recorder.recording = true;
    recorder.key = "S";
    recorder.id = "Decelerate"
}

document.getElementById("Restart").onclick =()=>{
    recorder.recording = true;
    recorder.key = "R";
    recorder.id = "Restart";
}

function readValues(){
    const vehicle = document.querySelector('input[name="Vehicle"]:checked').value;
    localStorage.setItem("Vehicle", vehicle);

    return false;
}

document.addEventListener("keydown", e=>{
    if (!recorder.recording ) return;
    if (e.key > 'z' || e.key < 'a') return;
    recorder.key = e.key.toUpperCase();
    localStorage.setItem(recorder.id, recorder.key);
    recorder.recording = false;

    document.getElementById(recorder.id).innerHTML = recorder.id + " Key: " + recorder.key;
});

let accelerateKey = localStorage.getItem("Accelerate");
if (accelerateKey == null) accelerateKey = "W";
let decelerateKey = localStorage.getItem("Decelerate");
if (decelerateKey == null) decelerateKey = "S";
let resetKey = localStorage.getItem("Restart");
if (resetKey == null) resetKey = "R";

document.getElementById("Accelerate").innerHTML = "Accelerate Key: " + accelerateKey;
document.getElementById("Decelerate").innerHTML = "Decelerate Key: " + decelerateKey;
document.getElementById("Restart").innerHTML = "Restart Key: " + resetKey;