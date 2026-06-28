import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xd4af37, 150, 100);
pointLight.position.set(10, 20, 10);
scene.add(pointLight);

// Membrane - Now glowing gold wireframe
const size = 30;
const segments = 80;
const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
geometry.rotateX(-Math.PI / 2);

const material = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    wireframe: true,
    emissive: 0xaa8800,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.8,
    metalness: 1,
    roughness: 0.2
});

const membrane = new THREE.Mesh(geometry, material);
scene.add(membrane);

// Identity Nodes (Stronger visual presence)
const nodes = [
    { pos: new THREE.Vector3(-5, 0, -5), mass: 5.0, color: 0xd4af37 },
    { pos: new THREE.Vector3(6, 0, 4), mass: 7.0, color: 0xffdf00 },
    { pos: new THREE.Vector3(0, 0, 8), mass: 4.0, color: 0xdaa520 },
];

nodes.forEach(node => {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial({ 
            color: node.color, 
            emissive: node.color, 
            emissiveIntensity: 2 
        })
    );
    sphere.position.copy(node.pos);
    scene.add(sphere);
});

const initialPositions = geometry.attributes.position.array.slice();
const weatherInput = document.getElementById('weather');
const tensionInput = document.getElementById('tension');

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    const weather = (weatherInput.value / 100) * 5; // Amplified
    const tension = (tensionInput.value / 5) * 2;   // Amplified

    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
        let x = initialPositions[i * 3];
        let z = initialPositions[i * 3 + 2];
        let y = 0;

        nodes.forEach(node => {
            const dist = new THREE.Vector2(x - node.pos.x, z - node.pos.z).length();
            // Stronger gravitational pull
            y -= (node.mass * tension) / (dist + 1.5);
        });

        // Visible cosmic waves
        y += Math.sin(x * 0.4 + time) * weather;
        y += Math.cos(z * 0.4 + time * 0.7) * weather;

        posAttr.setY(i, y);
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
