import * as THREE from 'https://cdn.skypack.dev/three@0.136.0'
import {Car} from './Car'
import {Truck} from './Truck'
import {renderMap} from './Map'

document.addEventListener("keydown", e=>{
    if (e.key === "Escape") history.back();
});

const scene = new THREE.Scene();

class Player {
    constructor(id, accelerateKey, decelerateKey, portalX, protectionBarrier) {
        this.id = id;
        this.car = null;
        this.otherVehicles = [];
        this.score = 0;
        this.speed = 0.0017;
        this.playerAngleMoved = 0;
        this.accelerate = false;
        this.decelerate = false;
        this.accelerateKey = accelerateKey;
        this.decelerateKey = decelerateKey;
        this.portal = null;
        this.portalX = portalX;
        this.powerUp = false;
        this.freezeRound = null;
        this.invincibility = false;
        this.isHitting = false;
        this.hittingCount = 0;
        this.protectionBarrier = protectionBarrier;
    }

    getPlayerSpeed() {
        if (localStorage.getItem("Vehicle") === "Truck"){

            if (this.accelerate) return this.speed * 3;
            if (this.decelerate) return this.speed * 0.125;
            else return this.speed * 0.5;
        }
        else{
            if (this.decelerate) return this.speed * 0.5;
            if (this.accelerate) return this.speed * 2;
        }
        return this.speed;
    }
}

const texture1 = new THREE.TextureLoader().load("assets/walter.jpg");
const protectionBarrier1 = new THREE.Mesh(
    new THREE.SphereGeometry(40, 40, 40),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: texture1, transparent: true, opacity: 0.5 })
);

const texture2 = new THREE.TextureLoader().load("assets/jesse.jpg");
const protectionBarrier2 = new THREE.Mesh(
    new THREE.SphereGeometry(40, 40, 40),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: texture2, transparent: true, opacity: 0.5 })
);

protectionBarrier1.rotation.x = 45;
protectionBarrier1.rotation.z = -30;
protectionBarrier1.position.z = 20;

protectionBarrier2.rotation.x = 45;
protectionBarrier2.rotation.z = -30;

protectionBarrier2.position.z = 20;

let player1 = new Player(1, localStorage.getItem("Accelerate1"), localStorage.getItem("Decelerate1"), -380, protectionBarrier1);
let player2 = new Player(2, localStorage.getItem("Accelerate2"), localStorage.getItem("Decelerate2"), -70, protectionBarrier2);

if (localStorage.getItem("Vehicle1") === "Truck") player1.car = Truck();
else player1.car = Car();

if (localStorage.getItem("Vehicle2") === "Truck") player2.car = Truck();
else player2.car = Car();

scene.add(player1.car);
scene.add(player2.car);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 400);
scene.add(dirLight);

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
    cameraWidth / -2, // left
    cameraWidth / 2, // right
    cameraHeight / 2, // top
    cameraHeight / -2, // bottom
    50, // near plane
    700 // far plane
);

camera.position.set(0, -210, 300);
camera.lookAt(0, 0, 0);

let ready;
const playerAngleInitial = Math.PI;
const scoreElement = document.getElementById("score");
let lastTimestamp;
const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1 / 3) * Math.PI; // 60 degrees

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX =
    (Math.cos(arcAngle1) * innerTrackRadius +
        Math.cos(arcAngle2) * outerTrackRadius) /
    2;

renderMap(cameraWidth, cameraHeight * 2, scene);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

document.body.appendChild(renderer.domElement);

reset();

function reset() {
    resetFreeze(player1, player2);
    resetFreeze(player2, player1);
    resetBarrier(player1);
    resetBarrier(player2);
    scene.remove(player2.portal);
    scene.remove(player1.portal);
    player1.powerUp = false;
    player2.powerUp = false;
    player1.playerAngleMoved = 0;
    player2.playerAngleMoved = 0;
    movePlayerCar(0, player1);
    movePlayerCar(0, player2);
    player1.score = 0;
    player2.score = 0;
    scoreElement.innerHTML ="Player 1 score: " + player1.score + "<br>Player 2 score: " + player2.score;
    document.getElementById("dead").innerText="";
    lastTimestamp = undefined;
    player1.otherVehicles.forEach((vehicle) => {
        scene.remove(vehicle.mesh);
    });
    player2.otherVehicles.forEach((vehicle) => {
        scene.remove(vehicle.mesh);
    });
    player1.otherVehicles = [];
    player2.otherVehicles = [];
    renderer.render(scene, camera);
    ready = true;
    resize(renderer,camera);
    document.getElementById("dead").src ="";
}

function resize(renderer, camera){
    let callback = function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspectRatio = window.innerWidth/window.innerHeight;
    }
    window.addEventListener('resize', callback, false);
    return{
        stop : function(){
            window.removeEventListener('resize', callback);
        }
    }
}

function startGame() {
    if (ready) {
        ready = false;
        renderer.setAnimationLoop(animation);
    }
}

if (player1.accelerateKey == null) player1.accelerateKey = "W";
if (player2.accelerateKey == null) player2.accelerateKey = "ArrowUp";
if (player1.decelerateKey == null) player1.decelerateKey = "S";
if (player2.decelerateKey == null) player2.decelerateKey = "ArrowDown";
let resetKey = localStorage.getItem("Restart1");
if (resetKey == null) resetKey = "R";

window.addEventListener("keydown", function (event) {
    if (event.key.toLowerCase() === player1.accelerateKey.toLowerCase()) {
        startGame();
        player1.accelerate = true;
        return;
    }
    if (event.key.toLowerCase() === player2.accelerateKey.toLowerCase()) {
        startGame();
        player2.accelerate = true;
        return;
    }
    if (event.key.toLowerCase() === player1.decelerateKey.toLowerCase()) {
        player1.decelerate = true;
        return;
    }
    if (event.key.toLowerCase() === player2.decelerateKey.toLowerCase()) {
        player2.decelerate = true;
        return;
    }
    if (event.key.toLowerCase() === resetKey.toLowerCase()) {
        reset();
    }
});

window.addEventListener("keyup", function (event) {
    if (event.key.toLowerCase() === player1.accelerateKey.toLowerCase()) {
        player1.accelerate = false;
        return;
    }
    if (event.key.toLowerCase() === player2.accelerateKey.toLowerCase()) {
        player2.accelerate = false;
        return;
    }
    if (event.key.toLowerCase() === player1.decelerateKey.toLowerCase()) {
        player1.decelerate = false;
    }
    if (event.key.toLowerCase() === player2.decelerateKey.toLowerCase()) {
        player2.decelerate = false;
    }
});

function movePlayerCar(timeDelta, player) {
    const playerSpeed = player.getPlayerSpeed();
    player.playerAngleMoved -= playerSpeed * timeDelta;
    const totalPlayerAngle = playerAngleInitial + player.playerAngleMoved;
    let playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
    if (player.id === 2) playerX = Math.cos(totalPlayerAngle) * trackRadius + arcCenterX;
    const playerY = Math.sin(totalPlayerAngle) * trackRadius;
    player.car.position.x = playerX;
    player.car.position.y = playerY;
    player.car.rotation.z = totalPlayerAngle - Math.PI / 2;
}

function animation(timestamp) {
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return;
    }
    document.getElementById("freeze").style.height = document.querySelectorAll("canvas")[0].style.height;
    document.getElementById("freeze").style.width = document.querySelectorAll("canvas")[0].style.width;
    const timeDelta = timestamp - lastTimestamp;
    movePlayerCar(timeDelta, player1);
    movePlayerCar(timeDelta, player2);
    const laps1 = Math.floor(Math.abs(player1.playerAngleMoved) / (Math.PI * 2));
    const laps2 = Math.floor(Math.abs(player2.playerAngleMoved) / (Math.PI * 2));

    if (laps1 !== player1.score){
        player1.score = laps1;
        if (player1.score % 5 === 0) addVehicle(player1);
        scoreElement.innerHTML ="Player 1 score: " + player1.score + "<br>Player 2 score: " + player2.score;
        if (player1.powerUp){
            switch (Math.floor(Math.random()*3)) {
                case 0:
                    player2.speed = 0;
                    player1.freezeRound = player1.score;
                    document.getElementById("freeze").src = "assets/freeze.png";
                    break;
                case 1:
                    if (player2.otherVehicles.length === 0) break;
                    let destroying = Math.floor(Math.random()*player2.otherVehicles.length);
                    scene.remove(player2.otherVehicles[destroying].mesh);
                    player2.otherVehicles.splice(destroying, 1);
                    break;
                case 2:
                    player1.invincibility = true;
                    player1.car.add(player1.protectionBarrier);
                    break;
            }
            player1.powerUp = false;
            scene.remove(player1.portal);
        }
        if (player1.freezeRound !== null && player1.freezeRound + 2 === player1.score) resetFreeze(player2, player1);

        if (!Math.floor(Math.random() * 4)) addPortal(player1);
    }

    if (laps2 !== player2.score){
        player2.score = laps2;
        if (player2.score % 5 === 0) addVehicle(player2);
        scoreElement.innerHTML ="Player 1 score: " + player1.score + "<br>Player 2 score: " + player2.score;
        if (player2.powerUp){
            switch (Math.floor(Math.random()*3)) {
                case 0:
                    player1.speed = 0;
                    player2.freezeRound = player2.score;
                    document.getElementById("freeze").src = "assets/freeze.png";
                    break;
                case 1:
                    if (player1.otherVehicles.length === 0) break;
                    let destroying = Math.floor(Math.random()*player1.otherVehicles.length);
                    scene.remove(player1.otherVehicles[destroying].mesh);
                    player1.otherVehicles.splice(destroying, 1);
                    break;
                case 2:
                    player2.invincibility = true;
                    player2.car.add(player2.protectionBarrier);
                    break;
            }
            player2.powerUp = false;
            scene.remove(player2.portal);
        }
        if (player2.freezeRound !== null && player2.freezeRound + 2 === player2.score) resetFreeze(player1, player2);

        if (!Math.floor(Math.random() * 4)) addPortal(player2);
    }

    moveOtherVehicles(timeDelta);
    hitDetection();

    renderer.clear();
    renderer.render(scene, camera);
    lastTimestamp=timestamp;
}

function getDistance(coordinate1, coordinate2) {
    const horizontalDistance = coordinate2.x - coordinate1.x;
    const verticalDistance = coordinate2.y - coordinate1.y;
    return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
}

function addVehicle(player){
    const speed = getVehicleSpeed();
    const clockwise = Math.random() >= 0.5;

    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    let mesh;
    if(Math.floor(Math.random() * 2) === 0) mesh = Truck();
    else mesh = Car();

    scene.add(mesh);

    player.otherVehicles.push({ mesh, speed, clockwise, angle });
}

function getVehicleSpeed() {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
}

function moveOtherVehicles(timeDelta) {
    player1.otherVehicles.forEach((vehicle) => {
        if (vehicle.clockwise) {
            vehicle.angle -= player1.speed * timeDelta * vehicle.speed;
        } else {
            vehicle.angle += player1.speed * timeDelta * vehicle.speed;
        }

        const vehicleX = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
        const vehicleY = Math.sin(vehicle.angle) * trackRadius;
        const rotation =
            vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
        vehicle.mesh.position.x = vehicleX;
        vehicle.mesh.position.y = vehicleY;
        vehicle.mesh.rotation.z = rotation;
    });

    player2.otherVehicles.forEach((vehicle) => {
        if (vehicle.clockwise) {
            vehicle.angle -= player2.speed * timeDelta * vehicle.speed;
        } else {
            vehicle.angle += player2.speed * timeDelta * vehicle.speed;
        }

        const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
        const vehicleY = Math.sin(vehicle.angle) * trackRadius;
        const rotation =
            vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
        vehicle.mesh.position.x = vehicleX;
        vehicle.mesh.position.y = vehicleY;
        vehicle.mesh.rotation.z = rotation;
    });
}


function hitDetection() {
    const player1HitZone1 = getHitZonePosition(
        player1.car.position,
        playerAngleInitial + player1.playerAngleMoved,
        true,
        15
    );

    const player1HitZone2 = getHitZonePosition(
        player1.car.position,
        playerAngleInitial + player1.playerAngleMoved,
        true,
        -15
    );

    const player2HitZone1 = getHitZonePosition(
        player2.car.position,
        playerAngleInitial + player2.playerAngleMoved,
        true,
        15
    );

    const player2HitZone2 = getHitZonePosition(
        player2.car.position,
        playerAngleInitial + player2.playerAngleMoved,
        true,
        -15
    );

    function getHitZonePosition(center, angle, clockwise, distance) {
        const directionAngle = angle + clockwise ? -Math.PI / 2 : +Math.PI / 2;
        return {
            x: center.x + Math.cos(directionAngle) * distance,
            y: center.y + Math.sin(directionAngle) * distance
        };
    }

    let player1Win = false;
    let player2Win = false;
    let scoreWin = false;

    player1.otherVehicles.some((vehicle) => {
        const vehicleHitZone1 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            15
        );

        const vehicleHitZone2 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            -15
        );

        // The player hits another vehicle
        if (getDistance(player2HitZone1, vehicleHitZone2) < 40) player1Win = true;

        // Another vehicle hits the player
        if (getDistance(player2HitZone2, vehicleHitZone1) < 40) player1Win = true;
    });

    player2.otherVehicles.some((vehicle) => {
        const vehicleHitZone1 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            15
        );

        const vehicleHitZone2 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            -15
        );

        // The player hits another vehicle
        if (getDistance(player1HitZone1, vehicleHitZone2) < 40) player2Win = true;

        // Another vehicle hits the player
        if (getDistance(player1HitZone2, vehicleHitZone1) < 40) player2Win = true;
    });

    // The player hits another vehicle
    if (getDistance(player1HitZone1, player2HitZone2) < 40) scoreWin = true;

    // Another vehicle hits the player
    if (getDistance(player1HitZone2, player2HitZone1) < 40) scoreWin = true;

    if (player1Win && (player2.invincibility)){
        player2.isHitting = true;
        player1Win = false;
    }

    if (player2Win && (player1.invincibility)){
        player1.isHitting = true;
        player2Win = false;
    }

    if (scoreWin){
        console.log("med sabo")
        if ((player1.invincibility) && (player2.invincibility)) {
            scoreWin = false;
            player2.isHitting = true;
            player1.isHitting = true;
        }
        else if (player1.invincibility) {
            player1Win = true;
            scoreWin = false;
        }
        else if (player2.invincibility) {
            player2Win = true;
            scoreWin = false;
        }
        if (scoreWin) {
            if (player1.score > player2.score) document.getElementById("dead").src = "./assets/win1Header.png";
            else if (player1.score < player2.score) document.getElementById("dead").src = "./assets/win2Header.png";
            else document.getElementById("dead").src = "./assets/drawHeader.png";
        }
    }

    if (player1Win || player2Win || scoreWin){
        document.getElementById("dead").src ="./assets/header.png";
        renderer.setAnimationLoop(null); // Stop animation loop
    }

    if (player1Win){
        document.getElementById("dead").src ="./assets/win1Header.png";
        renderer.setAnimationLoop(null); // Stop animation loop
    }
    if (player2Win){
        document.getElementById("dead").src ="./assets/win2Header.png";
        renderer.setAnimationLoop(null); // Stop animation loop
    }

    if (scoreWin){
        if (player1.score > player2.score) document.getElementById("dead").src ="./assets/win1Header.png";
        else if (player1.score < player2.score) document.getElementById("dead").src ="./assets/win2Header.png";
        else document.getElementById("dead").src ="./assets/drawHeader.png";
    }

    if (player1.isHitting){
        player1.hittingCount++;
        console.log("player1 -> " + player1.hittingCount);
        if (player1.hittingCount === 40){
            player1.isHitting = false;
            resetBarrier(player1);
            player1.hittingCount = 0;
        }
    }

    if (player2.isHitting){
        player2.hittingCount++;
        console.log("player2 -> " + player2.hittingCount);
        if (player2.hittingCount === 40){
            player2.isHitting = false;
            resetBarrier(player2);
            player2.hittingCount = 0;
        }
    }
}

function addPortal(player){
    const texture = new THREE.TextureLoader().load("assets/powerUp.jpg");
    player.portal = new THREE.Mesh(
        new THREE.BoxBufferGeometry(20, 30, 20),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: texture})
    );
    player.portal.position.set(player.portalX,2,0);
    scene.add(player.portal);
    player.powerUp = true;
}

function resetFreeze(player1, player2){
    player1.speed = 0.0017;
    player2.freezeRound = null;
    document.getElementById("freeze").src = null;
}

function resetBarrier(player){
    player.invincibility = false;
    player.car.remove(player.protectionBarrier);
}

document.getElementById("onTopLeft1").innerHTML = resetKey + " to Restart";
document.getElementById("onTopLeft2").innerHTML = player1.accelerateKey + " to Accelerate";
document.getElementById("onTopLeft3").innerHTML = player1.decelerateKey + " to Decelerate";
document.getElementById("onTopLeft4").innerHTML = player2.accelerateKey + " to Accelerate";
document.getElementById("onTopLeft5").innerHTML = player2.decelerateKey + " to Decelerate";