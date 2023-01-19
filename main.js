import * as THREE from 'https://cdn.skypack.dev/three@0.136.0'
import {Car} from './Car'
import {Truck} from './Truck'
import {renderMap} from './Map'

document.addEventListener("keydown", e=>{
    if (e.key === "Escape") history.back();
});

const scene = new THREE.Scene();

let playerCar;

if (localStorage.getItem("Vehicle1") === "Truck") playerCar = Truck();
else playerCar = Car();

scene.add(playerCar);

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

let accelerate = false;
let decelerate = false;

let ready;
let playerAngleMoved;
let score;
let highScore = localStorage.getItem("HighScore");
if (highScore == null) highScore = 0;
let playerSpeed = 0.0017;
let speed = 0.0017;
const playerAngleInitial = Math.PI;
const scoreElement = document.getElementById("score");
let otherVehicles = [];
let lastTimestamp;
let portal;
const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;
let powerUp = false;
let freezeRound = null;
let invincibility = false;
let destroying = false;

const arcAngle1 = (1 / 3) * Math.PI; // 60 degrees

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX =
  (Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius) /
  2;

const texture = new THREE.TextureLoader().load("assets/walter.jpg");

const protectionBarrier = new THREE.Mesh(
    new THREE.SphereGeometry(40, 40, 40),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: texture, transparent: true, opacity: 0.5 })
);

protectionBarrier.rotation.x = 45;
protectionBarrier.rotation.z = -30;

protectionBarrier.position.z = 20;

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
  playerAngleMoved = 0;
  resetFreeze();
  resetBarrier();
  powerUp = false;
  scene.remove(portal);
  movePlayerCar(0);
  if (highScore < score){
    highScore = score;
    localStorage.setItem("HighScore", highScore);
  }
  score = 0;
  scoreElement.innerHTML ="Score: " + score + "<br> High Score: " + highScore;
  document.getElementById("dead").innerText="";
  lastTimestamp = undefined;
  otherVehicles.forEach((vehicle) => {
    scene.remove(vehicle.mesh);
  });
  otherVehicles = [];
  renderer.render(scene, camera);
  ready = true;
  resize(renderer,camera);
  document.getElementById("dead").src ="";
  addVehicle();
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

let accelerateKey = localStorage.getItem("Accelerate1");
if (accelerateKey == null) accelerateKey = "W";
let decelerateKey = localStorage.getItem("Decelerate1");
if (decelerateKey == null) decelerateKey = "S";
let resetKey = localStorage.getItem("Restart1");
if (resetKey == null) resetKey = "R";

window.addEventListener("keydown", function (event) {
  if (event.key === accelerateKey.toLowerCase()) {
    startGame();
    accelerate = true;
    return;
  }
  if (event.key === decelerateKey.toLowerCase()) {
    decelerate = true;
    return;
  }
  if (event.key === resetKey.toLowerCase()) {
    reset();
  }
});

window.addEventListener("keyup", function (event) {
  if (event.key === accelerateKey.toLowerCase()) {
    accelerate = false;
    return;
  }
  if (event.key === decelerateKey.toLowerCase()) {
    decelerate = false;
  }
});


function addPortal(){
  const texture = new THREE.TextureLoader().load("assets/powerUp.jpg");
  portal = new THREE.Mesh(
      new THREE.BoxBufferGeometry(20, 30, 20),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: texture})
  );
  portal.position.set(-380,2,0);
  scene.add(portal);
}

function movePlayerCar(timeDelta) {
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;
  const totalPlayerAngle = playerAngleInitial + playerAngleMoved;
  const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * trackRadius;
  playerCar.position.x = playerX;
  playerCar.position.y = playerY;
  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
}

function getPlayerSpeed() {
  if (localStorage.getItem("Vehicle1") === "Truck"){
    
    if (accelerate) return playerSpeed * 3;
    if (decelerate) return playerSpeed * 0.125;
    else return playerSpeed * 0.5;
  }
  else{
    if (decelerate) return playerSpeed * 0.5;
    if (accelerate) return playerSpeed * 2;
  }
  return playerSpeed;
}

function animation(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }
  document.getElementById("freeze").style.height = document.querySelectorAll("canvas")[0].style.height;
  document.getElementById("freeze").style.width = document.querySelectorAll("canvas")[0].style.width;
  const timeDelta = timestamp - lastTimestamp;
  movePlayerCar(timeDelta);
  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));
  if (laps !== score) {
    score = laps;
    if(laps % 5 === 0) addVehicle();
    scoreElement.innerHTML = "Score: " + score + "<br> High Score: " + highScore;
    if (powerUp) {
      let i = Math.floor(Math.random()*3);
      console.log(i);
      switch (i) {
        case 2:
          speed = 0;
          freezeRound = score;
          document.getElementById("freeze").src = "assets/freeze.png";
          break;
        case 1:
          if (otherVehicles.length === 0) break;
          destroying = Math.floor(Math.random()*otherVehicles.length);
          break;
        case 0:
          invincibility = true;
          playerCar.add(protectionBarrier);
          break;
      }
      powerUp = false;
      scene.remove(portal);
    }

    if (freezeRound !== null && freezeRound + 2 === score) resetFreeze();

    if (!Math.floor(Math.random() * 4)) {
      addPortal();
      powerUp = true;
    }
  }

  moveOtherVehicles(timeDelta);
  if (destroying !== false) destroyCar();
  hitDetection();

  renderer.clear();
  renderer.render(scene, camera);
  lastTimestamp=timestamp;
}

function resetBarrier(){
  invincibility = false;
  playerCar.remove(protectionBarrier);
}

function resetFreeze(){
  speed = 0.0017;
  freezeRound = null;
  document.getElementById("freeze").src = "";
}

let count = 0;

function destroyCar(){
  count++;
  console.log(otherVehicles[destroying].mesh.children);
  if (count % 30 === 0) otherVehicles[destroying].mesh.children.splice(otherVehicles[destroying].mesh.children.length-1, 1);
  if (otherVehicles[destroying].mesh.children.length === 0){
    scene.remove(otherVehicles[destroying].mesh);
    otherVehicles.splice(destroying, 1);
    destroying = false;
    count = 0;
  }
}

function getDistance(coordinate1, coordinate2) {
  const horizontalDistance = coordinate2.x - coordinate1.x;
  const verticalDistance = coordinate2.y - coordinate1.y;
  return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
}

function addVehicle(){
  const speed = getVehicleSpeed();
  const clockwise = Math.random() >= 0.5;

  const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
  let mesh;
  if(Math.floor(Math.random() * 2) === 0) mesh = Truck();
  else mesh = Car();

  scene.add(mesh);

  otherVehicles.push({ mesh, speed, clockwise, angle });
}

function getVehicleSpeed() {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
}

function moveOtherVehicles(timeDelta) {
  otherVehicles.forEach((vehicle) => {
    if (vehicle.clockwise) {
      vehicle.angle -= speed * timeDelta * vehicle.speed;
    } else {
      vehicle.angle += speed * timeDelta * vehicle.speed;
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

let isHitting = false;
let hittingCount = 0;

function hitDetection() {
  const playerHitZone1 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
    true,
    15
  );

  const playerHitZone2 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
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

  const hit = otherVehicles.some((vehicle) => {
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

      let hit = false;

      // The player hits another vehicle
      if (getDistance(playerHitZone1, vehicleHitZone2) < 40) hit = true;

      // Another vehicle hits the player
      if (getDistance(playerHitZone2, vehicleHitZone1) < 40) hit = true;

      if (hit && (invincibility)) {
        isHitting = true;
        hit = false;
      }

      if (isHitting){
        hittingCount++;
        if (hittingCount === 40){
          isHitting = false;
          resetBarrier();
          hittingCount = 0;
        }
      }

      return hit;
  });

  if (hit) {
    document.getElementById("dead").src ="./assets/header.png";
    renderer.setAnimationLoop(null); // Stop animation loop
  }
}

document.getElementById("onTopLeft1").innerHTML = accelerateKey + " to Accelerate";
document.getElementById("onTopLeft2").innerHTML = decelerateKey + " to Decelerate";
document.getElementById("onTopLeft3").innerHTML = resetKey + " to Restart";