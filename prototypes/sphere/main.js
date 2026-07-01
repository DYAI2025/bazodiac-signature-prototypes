import * as THREE from '../../lib/three/three.module.js';
import { OrbitControls } from '../../lib/three/OrbitControls.js';
import { loadSignature, ELEMENT_META, ELEMENT_ORDER } from '../../shared/signature-data.js';
import { configureRenderer, makeStarfield, makeGlowSprite } from '../../shared/gfx.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 16);

const renderer = configureRenderer(new THREE.WebGLRenderer({ antialias: true }));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.minDistance = 5;
controls.maxDistance = 40;

scene.add(makeStarfield(1500, 80));
scene.add(new THREE.AmbientLight(0x404060, 1.5));
const core = new THREE.PointLight(0xd4af37, 60, 30);
scene.add(core);

// ─── Particle sphere (Fibonacci distribution) ──────────────────
const PARTICLE_COUNT = 14000;
const BASE_RADIUS = 5;
const geometry = new THREE.BufferGeometry();
const basePositions = new Float32Array(PARTICLE_COUNT * 3);
const positions = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);
const particleElementIdx = new Uint8Array(PARTICLE_COUNT);

const ELEMENT_DIRS = ELEMENT_ORDER.map((id, i) => {
    const rad = (i * 72 * Math.PI) / 180;
    return { id, dir: new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)).normalize() };
});

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
    const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;

    const x = Math.sin(phi) * Math.cos(theta) * BASE_RADIUS;
    const y = Math.sin(phi) * Math.sin(theta) * BASE_RADIUS;
    const z = Math.cos(phi) * BASE_RADIUS;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = 0.83;
    colors[i * 3 + 1] = 0.68;
    colors[i * 3 + 2] = 0.21;

    // nearest WuXing anchor direction — fixed per particle, precomputed once
    const nx = x / BASE_RADIUS, ny = y / BASE_RADIUS, nz = z / BASE_RADIUS;
    let best = 0, bestDot = -2;
    for (let e = 0; e < ELEMENT_DIRS.length; e++) {
        const d = nx * ELEMENT_DIRS[e].dir.x + ny * ELEMENT_DIRS[e].dir.y + nz * ELEMENT_DIRS[e].dir.z;
        if (d > bestDot) { bestDot = d; best = e; }
    }
    particleElementIdx[i] = best;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const points = new THREE.Points(geometry, material);
scene.add(points);

// ─── Element anchor nodes (pentagon, projected onto the sphere shell) ──
const anchors = [];
function buildAnchors(signature) {
    anchors.forEach(a => scene.remove(a.glow));
    anchors.length = 0;
    signature.elements.forEach((el, i) => {
        const dir = ELEMENT_DIRS[i].dir;
        const pos = dir.clone().multiplyScalar(BASE_RADIUS * 1.15);
        const glow = makeGlowSprite(el.color, 0.8 + el.strength * 1.6);
        glow.position.copy(pos);
        scene.add(glow);
        anchors.push({ glow, pos, el });
    });
}

const harmonyInput = document.getElementById('harmony');
const frictionInput = document.getElementById('friction');
const cosmicInput = document.getElementById('cosmic');
const metricsEl = document.getElementById('metrics');

let signature = null;
const tmpColor = new THREE.Color();
const elColors = ELEMENT_ORDER.map(id => new THREE.Color(ELEMENT_META[id].color));

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    if (signature) {
        const harmony = harmonyInput.value / 100;   // high = crystalline/symmetric
        const friction = frictionInput.value / 100; // jitter / noise
        const cosmic = cosmicInput.value / 100;      // animation speed / turbulence

        const posAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        const vec = signature.vector13D;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = i * 3;
            const x = basePositions[ix], y = basePositions[ix + 1], z = basePositions[ix + 2];
            const nx = x / BASE_RADIUS, ny = y / BASE_RADIUS, nz = z / BASE_RADIUS;

            // 13-frequency Fourier sum (MATHEMATICS.md §7.2) — scaled down by harmony (crystalline ↔ chaotic)
            let displacement = 0;
            for (let k = 0; k < vec.length; k++) {
                const freq = vec[k];
                const wave = Math.sin((nx * 2 + ny * 3 + nz * 5) * (k + 1) * (0.4 + freq) + time * (0.6 + cosmic * 1.5));
                displacement += wave * (1 - harmony) * 0.18;
            }

            // deterministic pseudo-noise (index+time hash) instead of Math.random() — avoids a
            // per-particle RNG call in the hot loop and keeps jitter temporally smooth
            const noise = Math.sin(i * 12.9898 + time * 4.0) * Math.sin(i * 78.233 - time * 2.3) * friction * 0.4;
            const newRadius = BASE_RADIUS + displacement + noise;

            posAttr.setX(i, nx * newRadius);
            posAttr.setY(i, ny * newRadius);
            posAttr.setZ(i, nz * newRadius);

            // blend gold base toward the nearest WuXing element color (precomputed index)
            tmpColor.setRGB(0.83, 0.68, 0.21).lerp(elColors[particleElementIdx[i]], 0.45 + friction * 0.3);
            colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
        }

        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;

        controls.autoRotateSpeed = 0.2 + cosmic * 0.8;
        anchors.forEach(({ glow, pos, el }) => {
            const pulse = 1 + Math.sin(time * 1.6 + el.angle) * 0.12;
            glow.scale.setScalar((0.8 + el.strength * 1.6) * pulse);
        });
        core.intensity = 40 + cosmic * 60;
    }

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loadSignature('/data/user_profile.json').then(sig => {
    signature = sig;
    buildAnchors(sig);

    harmonyInput.value = Math.round(sig.harmony * 100);
    const meanDelta = sig.elements.reduce((s, e) => s + e.delta, 0) / sig.elements.length;
    frictionInput.value = Math.round(meanDelta * 100);
    cosmicInput.value = Math.round(sig.cosmicState * 100);

    const dom = ELEMENT_META[sig.dominant];
    metricsEl.innerText =
        `13D Vector: [${sig.vector13D.map(v => v.toFixed(2)).join(' ')}] | Dominant ${dom.label} ${dom.symbol}`;
});

animate();
