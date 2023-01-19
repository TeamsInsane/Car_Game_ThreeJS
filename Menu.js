const recorder = {
    key: "",
    id: "",
    recording: false
}

document.getElementById("Accelerate1").onclick =()=>{
    recorder.recording = true;
    recorder.key = "W";
    recorder.id = "Accelerate1";
}

document.getElementById("Accelerate2").onclick =()=>{
    recorder.recording = true;
    recorder.key = "ArrowDown";
    recorder.id = "Accelerate2";
}

document.getElementById("Decelerate1").onclick =()=>{
    recorder.recording = true;
    recorder.key = "S";
    recorder.id = "Decelerate1"
}

document.getElementById("Decelerate2").onclick =()=>{
    recorder.recording = true;
    recorder.key = "ArrowUp";
    recorder.id = "Decelerate2"
}

document.getElementById("Restart1").onclick =()=>{
    recorder.recording = true;
    recorder.key = "R";
    recorder.id = "Restart1";
}

function readValues(){
    const vehicle1 = document.querySelector('input[name="Vehicle1"]:checked').value;
    localStorage.setItem("Vehicle1", vehicle1);

    const vehicle2 = document.querySelector('input[name="Vehicle2"]:checked').value;
    localStorage.setItem("Vehicle2", vehicle2);

    return false;
}

document.addEventListener("keydown", e=>{
    if (!recorder.recording ) return;
    if ((e.key >= 'a' && e.key <= 'z') || e.key === "ArrowUp" || e.key === "ArrowDown"){
        recorder.key = e.key[0].toUpperCase() + e.key.substring(1);
        localStorage.setItem(recorder.id, recorder.key);
        recorder.recording = false;

        document.getElementById(recorder.id).innerHTML = recorder.id.substring(0, recorder.id.length-1) + " Key: " + recorder.key;
    }
});

let Accelerate1Key = localStorage.getItem("Accelerate1");
if (Accelerate1Key == null) Accelerate1Key = "W";
let Accelerate2Key = localStorage.getItem("Accelerate2");
if (Accelerate2Key == null) Accelerate2Key = "ArrowUp";
let Decelerate1Key = localStorage.getItem("Decelerate1");
if (Decelerate1Key == null) Decelerate1Key = "S";
let Decelerate2Key = localStorage.getItem("Decelerate2");
if (Decelerate2Key == null) Decelerate2Key = "ArrowDown";
let resetKey = localStorage.getItem("Restart1");
if (resetKey == null) resetKey = "R";

document.getElementById("Accelerate1").innerHTML = "Accelerate Key: " + Accelerate1Key;
document.getElementById("Accelerate2").innerHTML = "Accelerate Key: " + Accelerate2Key;
document.getElementById("Decelerate1").innerHTML = "Decelerate Key: " + Decelerate1Key;
document.getElementById("Decelerate2").innerHTML = "Decelerate Key: " + Decelerate2Key;
document.getElementById("Restart1").innerHTML = "Restart Key: " + resetKey;