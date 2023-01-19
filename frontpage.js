import * as THREE from 'https://cdn.skypack.dev/three@0.136.0'
import {Car} from './Car'
import {renderMap} from './Map'

const scene = new THREE.Scene();

const playerCar = Car();
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

let playerAngleMoved;
const playerAngleInitial = Math.PI;
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

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);

const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);

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
  movePlayerCar(0);
  lastTimestamp = undefined;
  renderer.render(scene, camera);

  resize(renderer,camera);
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

function movePlayerCar(timeDelta) {
  const playerSpeed = 0.0017;
  playerAngleMoved -= playerSpeed * timeDelta;
  const totalPlayerAngle = playerAngleInitial + playerAngleMoved;
  const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * trackRadius;
  playerCar.position.x = playerX;
  playerCar.position.y = playerY;
  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;

}

function animation(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }
  const timeDelta = timestamp - lastTimestamp;
  movePlayerCar(timeDelta);
  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));


  renderer.render(scene, camera);
  lastTimestamp=timestamp;
}

renderer.setAnimationLoop(animation);