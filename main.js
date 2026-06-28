import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xd4af37, 100, 50);
pointLight.position.set(5, 10, 5);
scene.add(pointLight);

// Membrane
const size = 20;
const segments = 64;
const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
geometry.rotateX(-Math.PI / 2);

const material = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
    shininess: 100,
    specular: 0xd4af37
});

const membrane = new THREE.Mesh(geometry, material);
scene.add(membrane);

// Identity Nodes (The Masses)
const nodes = [
    { pos: new THREE.Vector3(-3, 0, -2), mass: 1.5, color: 0xd4af37 },
    { pos: new THREE.Vector3(4, 0, 3), mass: 2.0, color: 0xffdf00 },
    { pos: new THREE.Vector3(0, 0, 6), mass: 1.2, color: 0xdaa520 },
];

nodes.forEach(node => {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshBasicMaterial({ color: node.color })
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
    const weather = weatherInput.value / 100;
    const tension = tensionInput.value / 5;

    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
        let x = initialPositions[i * 3];
        let z = initialPositions[i * 3 + 2];
        let y = 0;

        // Gravitational Pull from Nodes
        nodes.forEach(node => {
            const dist = new THREE.Vector2(x - node.pos.x, z - node.pos.z).length();
            y -= (node.mass * tension) / (dist + 1);
        });

        // Cosmic Weather (Waves)
        y += Math.sin(x * 0.5 + time) * weather;
        y += Math.cos(z * 0.5 + time * 0.8) * weather;

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
