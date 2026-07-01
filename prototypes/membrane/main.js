import * as THREE from '../../lib/three/three.module.js';
import { OrbitControls } from '../../lib/three/OrbitControls.js';
import { loadSignature, ELEMENT_META } from '../../shared/signature-data.js';
import { configureRenderer, makeStarfield, makeGlowSprite } from '../../shared/gfx.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(13, 12, 13);

const renderer = configureRenderer(new THREE.WebGLRenderer({ antialias: true }));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 40;

scene.add(makeStarfield(1500, 70));

scene.add(new THREE.AmbientLight(0x404060, 1.2));
const keyLight = new THREE.PointLight(0xd4af37, 220, 60);
keyLight.position.set(8, 14, 8);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x4488cc, 140, 60);
rimLight.position.set(-10, 6, -10);
scene.add(rimLight);

// ─── Membrane geometry ──────────────────────────────────────────
const SIZE = 22;
const SEGMENTS = 110;
const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
geometry.rotateX(-Math.PI / 2);
geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));

const solidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1a,
    vertexColors: true,
    metalness: 0.35,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
    flatShading: false
});
const membrane = new THREE.Mesh(geometry, solidMaterial);
scene.add(membrane);

const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xd4af37, wireframe: true, transparent: true, opacity: 0.12 });
const wireMesh = new THREE.Mesh(geometry, wireMaterial);
scene.add(wireMesh);

// ─── Identity nodes (the 5 fused WuXing elements) ──────────────
const NODE_RADIUS_3D = 7.5; // matches pentagon footprint scaled onto the membrane

const nodeMeshes = [];
function buildNodes(signature) {
    nodeMeshes.forEach(n => scene.remove(n.mesh, n.glow));
    nodeMeshes.length = 0;

    signature.elements.forEach(el => {
        const rad = (el.angle * Math.PI) / 180;
        const pos = new THREE.Vector3(Math.cos(rad) * NODE_RADIUS_3D, 0, Math.sin(rad) * NODE_RADIUS_3D);

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.18 + el.strength * 0.3, 24, 24),
            new THREE.MeshStandardMaterial({ color: el.color, emissive: el.color, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 })
        );
        mesh.position.copy(pos);
        scene.add(mesh);

        const glow = makeGlowSprite(el.color, 1.2 + el.strength * 2.2);
        glow.position.copy(pos);
        scene.add(glow);

        nodeMeshes.push({ mesh, glow, pos, el });
    });
}

// ─── Math-driven deformation (MATHEMATICS.md §7.1) ─────────────
// vertex height (basin depth)  = strength[e] as mass
// surface oscillation          = cosmicState × sine waves
// spike sharpness              = delta[e] × tension control
const initialPositions = geometry.attributes.position.array.slice();
const posAttr = geometry.attributes.position;
const colorAttr = geometry.attributes.color;

const harmonyColor = new THREE.Color(0x44ff88);
const frictionColor = new THREE.Color(0xff4444);
const baseColor = new THREE.Color(0x1a1a1a);
const tmpColor = new THREE.Color();

const weatherInput = document.getElementById('weather');
const tensionInput = document.getElementById('tension');
const metricsEl = document.getElementById('metrics');

let signature = null;

function deform(time) {
    if (!signature) return;
    const weather = weatherInput.value / 100;   // cosmic weather → oscillation amplitude
    const tension = tensionInput.value / 50;    // identity tension → gravity well depth + spike sharpness

    for (let i = 0; i < posAttr.count; i++) {
        const x = initialPositions[i * 3];
        const z = initialPositions[i * 3 + 2];
        let y = 0;
        let maxFriction = 0;

        nodeMeshes.forEach(({ pos, el }) => {
            const dist = Math.hypot(x - pos.x, z - pos.z);
            // smooth basin: deep, wide gravity well from fused strength
            y -= (el.strength * 3.2 * tension) / (dist + 1);
            // sharp spike/fold: narrow gaussian scaled by West/Bazi delta (friction)
            const spike = el.delta * tension * Math.exp(-(dist * dist) / 1.4);
            y += spike * 2.5;
            maxFriction = Math.max(maxFriction, spike);
        });

        y += Math.sin(x * 0.4 + time * 0.6) * weather * 0.8;
        y += Math.cos(z * 0.4 + time * 0.5) * weather * 0.8;

        posAttr.setY(i, y);

        const t = Math.min(1, Math.abs(y) / 4);
        tmpColor.copy(baseColor).lerp(y < 0 ? harmonyColor : frictionColor, t * 0.8);
        colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    deform(time);
    keyLight.position.x = Math.sin(time * 0.15) * 10;
    keyLight.position.z = Math.cos(time * 0.15) * 10;

    nodeMeshes.forEach(({ mesh, glow, el }) => {
        const pulse = 1 + Math.sin(time * 1.5 + el.angle) * 0.08;
        mesh.scale.setScalar(pulse);
        glow.scale.setScalar((1.2 + el.strength * 2.2) * pulse);
    });

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loadSignature().then(sig => {
    signature = sig;
    buildNodes(sig);

    weatherInput.value = Math.round(sig.cosmicState * 100);
    tensionInput.value = Math.round(50 + (sig.harmony) * 30);

    const dom = ELEMENT_META[sig.dominant];
    metricsEl.innerText =
        `Dominant: ${dom.label} ${dom.symbol} | Harmony ${(sig.harmony * 100).toFixed(0)}% | ` +
        `Cosmic ${(sig.cosmicState * 100).toFixed(0)}% | Wachstum: ${sig.growthEdgeLabel}`;
});

animate();
