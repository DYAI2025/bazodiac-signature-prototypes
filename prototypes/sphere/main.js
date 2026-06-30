import * as THREE from '../../../lib/three/three.module.js';
import { OrbitControls } from '../../../lib/three/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer);
controls.enableDamping = true;

// 13D Vector Simulation
const VECTOR_13D = Array.from({ length: 13 }, () => Math.random());
const metrics = document.getElementById('metrics');
metrics.innerText = `Frequencies: ${VECTOR_13D.map(v => v.toFixed(2)).join(' | ')}`;

// Particle System
const PARTICLE_COUNT = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
    const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
    
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * 5;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * 5;
    positions[i * 3 + 2] = Math.cos(phi) * 5;
    
    colors[i * 3] = 0.83;
    colors[i * 3 + 1] = 0.68;
    colors[i * 3 + 2] = 0.21;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const harmonyInput = document.getElementById('harmony');
const frictionInput = document.getElementById('friction');
const cosmicInput = document.getElementById('cosmic');

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    const harmony = harmonyInput.value / 100;
    const friction = frictionInput.value / 100;
    const cosmic = cosmicInput.value / 100;

    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        
        let x = positions[ix];
        let y = positions[ix + 1];
        let z = positions[ix + 2];
        
        const dist = Math.sqrt(x*x + y*y + z*z);
        const normX = x / dist;
        const normY = y / dist;
        const normZ = z / dist;

        let displacement = 0;
        VECTOR_13D.forEach((freq, idx) => {
            const wave = Math.sin(
                (normX * 2 + normY * 3 + normZ * 5) * (idx + 1) * freq * 2 + time * (1 + cosmic);
            displacement += wave * (1 - harmony) * 0.2;
        });

        const noise = (Math.random() - 0.5) * friction * 0.5;

        const newRadius = 5 + displacement + noise;
        
        posAttr.setX(i, normX * newRadius);
        posAttr.setY(i, normY * newRadius);
        posAttr.setZ(i, normZ * newRadius);
    }
    
    posAttr.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
