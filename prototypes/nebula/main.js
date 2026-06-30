import * as THREE from '../../../lib/three/three.module.js';
import { OrbitControls } from '../../../lib/three/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer);
controls.enableDamping = true;

// 13D Vector Simulation
const VECTOR_13D = Array.from({ length: 13 }, () => Math.random());
const metrics = document.getElementById('metrics');
metrics.innerText = `Neural Nodes: ${VECTOR_13D.length} | Resonance: ${(VECTOR_13D.reduce((a,b)=>a+b,0)/13).toFixed(2)}`;

// Nodes
const nodes = [];
const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xd4af37 });

for (let i = 0; i < 13; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
    );
    node.userData = { 
        weight: VECTOR_13D[i], 
        phase: Math.random() * Math.PI * 2,
        basePos: node.position.clone()
    };
    scene.add(node);
    nodes.push(node);
}

// Filaments
const edges = [];
const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x4488cc, 
    transparent: true, 
    opacity: 0.3 
});

for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
        const resonance = (nodes[i].userData.weight + nodes[j].userData.weight) / 2;
        if (resonance > 0.4) {
            const geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = { 
                weight: resonance, 
                from: nodes[i], 
                to: nodes[j],
                pulsePos: 0 
            };
            scene.add(line);
            edges.push(line);
        }
    }
}

const harmonyInput = document.getElementById('harmony');
const frictionInput = document.getElementById('friction');
const cosmicInput = document.getElementById('cosmic');

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    const harmony = harmonyInput.value / 100;
    const friction = frictionInput.value / 100;
    const cosmic = cosmicInput.value / 100;

    // Update Nodes
    nodes.forEach(node => {
        const { basePos, phase, weight } = node.userData;
        const offset = Math.sin(time * 0.5 + phase) * (1 - harmony) * 2;
        node.position.x = basePos.x + offset;
        node.position.y = basePos.y + offset;
        node.position.z = basePos.z + offset;
        
        node.material.opacity = 0.5 + Math.sin(time * 2 + phase) * 0.3;
    });

    // Update Filaments
    edges.forEach(edge => {
        const { from, to, weight } = edge.userData;
        
        const pos = edge.geometry.attributes.position;
        pos.setXYZ(0, from.position.x, from.position.y, from.position.z);
        pos.setXYZ(1, to.position.x, to.position.y, to.position.z);
        pos.needsUpdate = true;

        edge.userData.pulsePos += 0.01 * (1 + cosmic);
        if (edge.userData.pulsePos > 1) edge.userData.pulsePos = 0;
        
        edge.material.opacity = 0.1 + weight * 0.4 + Math.sin(time * 3 + edge.userData.pulsePos * Math.PI) * 0.1;
        
        if (friction > 0.6) {
            edge.material.color.setHSL(0, 1, 0.5 * friction);
        } else {
            edge.material.color.set(0x4488cc);
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
