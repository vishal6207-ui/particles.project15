// ================= BASIC THREE.JS SETUP =================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 80;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// ================= PARTICLES =================
const COUNT = 2000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);

for (let i = 0; i < COUNT; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * 60;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
}

geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.5
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// ================= HAND TRACKING =================
const video = document.getElementById("video");
const message = document.getElementById("message");

let handDetected = false;
let targetX = 0;
let targetY = 0;

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handDetected = true;
    message.innerText = "Hand detected ✋";

    const lm = results.multiHandLandmarks[0];
    const index = lm[8];

    targetX = (index.x - 0.5) * 40;
    targetY = -(index.y - 0.5) * 40;

  } else {
    handDetected = false;
    message.innerText = "Show your hand ✋";
  }
});

// ================= CAMERA START =================
const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
cam.start();

// ================= ANIMATION LOOP =================
function animate() {
  requestAnimationFrame(animate);

  // ONLY move when hand is detected
  if (handDetected) {
    particles.position.x += (targetX - particles.position.x) * 0.08;
    particles.position.y += (targetY - particles.position.y) * 0.08;
  }

  // NEVER move Z → prevents black screen
  particles.position.z = 0;

  renderer.render(scene, camera);
}

animate();

// ================= RESIZE =================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});