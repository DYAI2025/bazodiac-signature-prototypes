import * as THREE from '../../lib/three/three.module.js';
import { OrbitControls } from '../../lib/three/OrbitControls.js';
import { loadSignature, ELEMENT_META, THEME } from '../../shared/signature-data.js';
import { configureRenderer, makeStarfield, makeGlowSprite } from '../../shared/gfx.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.014);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(9, 8, 9);

const renderer = configureRenderer(new THREE.WebGLRenderer({ antialias: true }));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

scene.add(makeStarfield(1200, 60));
scene.add(new THREE.AmbientLight(0x404060, 1.2));
const centerLight = new THREE.PointLight(0xd4af37, 80, 30);
scene.add(centerLight);

const SCALE = 1.6; // nodes3D pentagon radius (4) × SCALE → comfortable scene footprint

const nodes = [];      // { mesh, glow, sparks, basePos, el }
const flowEdges = [];  // generation-cycle lines with traveling pulses
const controlEdges = [];
const resonanceEdges = [];

function buildNetwork(signature) {
    const nodeById = {};

    signature.nodes3D.forEach((n3d, i) => {
        const el = signature.elements[i];
        const basePos = new THREE.Vector3(n3d.x * SCALE, (n3d.y - 1.5) * SCALE, n3d.z * SCALE);

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.22 + el.strength * 0.35, 24, 24),
            new THREE.MeshStandardMaterial({ color: el.color, emissive: el.color, emissiveIntensity: 0.7, roughness: 0.25, metalness: 0.5 })
        );
        mesh.position.copy(basePos);
        scene.add(mesh);

        const glow = makeGlowSprite(el.color, 1.2 + el.strength * 2.4);
        glow.position.copy(basePos);
        scene.add(glow);

        // friction sparks: small additive points that flicker around nodes with high West/Bazi delta
        const sparkGeo = new THREE.BufferGeometry();
        const sparkCount = 24;
        const sparkPos = new Float32Array(sparkCount * 3);
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
            color: THEME.friction, size: 0.06, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        scene.add(sparks);

        const node = { mesh, glow, sparks, sparkPos, basePos, el, phase: Math.random() * Math.PI * 2 };
        nodes.push(node);
        nodeById[el.id] = node;
    });

    const lineMatFor = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity });

    signature.edges.forEach(edge => {
        if (edge.type === 'friction') return; // rendered as node-local sparks, not a line
        const a = nodeById[edge.from], b = nodeById[edge.to];
        if (!a || !b) return;

        const geo = new THREE.BufferGeometry().setFromPoints([a.basePos, b.basePos]);
        const isGenerate = edge.type === 'generates';
        const line = new THREE.Line(geo, lineMatFor(edge.color, 0.15 + edge.strength * 0.35));
        scene.add(line);

        const record = { line, a, b, edge, pulseT: Math.random() };
        (isGenerate ? flowEdges : controlEdges).push(record);
    });

    // resonance filaments: non-cycle pairs whose combined strength > 0.4 (README: gravitational attraction)
    const ids = signature.elements.map(e => e.id);
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const a = nodeById[ids[i]], b = nodeById[ids[j]];
            const resonance = (a.el.strength + b.el.strength) / 2;
            const alreadyLinked = signature.edges.some(e =>
                e.type !== 'friction' && ((e.from === ids[i] && e.to === ids[j]) || (e.from === ids[j] && e.to === ids[i])));
            if (resonance > 0.4 && !alreadyLinked) {
                const geo = new THREE.BufferGeometry().setFromPoints([a.basePos, b.basePos]);
                const line = new THREE.Line(geo, lineMatFor(THEME.neutral, 0.1 + resonance * 0.25));
                scene.add(line);
                resonanceEdges.push({ line, a, b, resonance });
            }
        }
    }
}

// traveling pulse markers along the generation cycle
const pulseSprites = [];
function buildPulses() {
    flowEdges.forEach(fe => {
        const sprite = makeGlowSprite(fe.edge.color, 0.5);
        scene.add(sprite);
        pulseSprites.push({ sprite, fe });
    });
}

const harmonyInput = document.getElementById('harmony'); // Coherence
const frictionInput = document.getElementById('friction'); // Instability
const cosmicInput = document.getElementById('cosmic');     // Pulse Rate
const metricsEl = document.getElementById('metrics');

let signature = null;

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    if (signature) {
        const harmony = harmonyInput.value / 100;     // high coherence → tighter, calmer network
        const friction = frictionInput.value / 100;   // instability → drift + sparks + red shift
        const cosmic = cosmicInput.value / 100;        // pulse rate → traveling light speed

        nodes.forEach(node => {
            const { basePos, phase, el, mesh, glow, sparks, sparkPos } = node;
            const jitter = (1 - harmony) * 0.5 + el.delta * friction * 0.6;
            const ox = Math.sin(time * 0.6 + phase) * jitter;
            const oy = Math.cos(time * 0.5 + phase * 1.3) * jitter;
            const oz = Math.sin(time * 0.4 + phase * 0.7) * jitter;
            mesh.position.set(basePos.x + ox, basePos.y + oy, basePos.z + oz);
            glow.position.copy(mesh.position);

            const pulse = 1 + Math.sin(time * 1.8 + phase) * 0.1;
            mesh.scale.setScalar(pulse);
            glow.scale.setScalar((1.2 + el.strength * 2.4) * pulse);

            // friction sparks visibility scales with this element's West/Bazi delta × Instability slider
            const sparkIntensity = el.delta > 0.3 ? el.delta * friction : 0;
            sparks.material.opacity = sparkIntensity * 0.9;
            if (sparkIntensity > 0.02) {
                for (let s = 0; s < 24; s++) {
                    const r = 0.3 + Math.random() * 0.6 * (0.5 + sparkIntensity);
                    const a1 = Math.random() * Math.PI * 2, a2 = Math.random() * Math.PI;
                    sparkPos[s * 3] = mesh.position.x + Math.sin(a2) * Math.cos(a1) * r;
                    sparkPos[s * 3 + 1] = mesh.position.y + Math.sin(a2) * Math.sin(a1) * r;
                    sparkPos[s * 3 + 2] = mesh.position.z + Math.cos(a2) * r;
                }
                sparks.geometry.attributes.position.needsUpdate = true;
            }
        });

        [...flowEdges, ...controlEdges, ...resonanceEdges].forEach(rec => {
            const pos = rec.line.geometry.attributes.position;
            pos.setXYZ(0, rec.a.mesh.position.x, rec.a.mesh.position.y, rec.a.mesh.position.z);
            pos.setXYZ(1, rec.b.mesh.position.x, rec.b.mesh.position.y, rec.b.mesh.position.z);
            pos.needsUpdate = true;

            const endpointTension = Math.max(rec.a.el.delta, rec.b.el.delta);
            if (friction > 0.6 && endpointTension > 0.4) {
                rec.line.material.color.set(THEME.friction);
            } else {
                rec.line.material.color.set(rec.edge ? rec.edge.color : THEME.neutral);
            }
        });

        pulseSprites.forEach(({ sprite, fe }) => {
            fe.pulseT += 0.0035 * (1 + cosmic * 4);
            if (fe.pulseT > 1) fe.pulseT -= 1;
            sprite.position.lerpVectors(fe.a.mesh.position, fe.b.mesh.position, fe.pulseT);
            sprite.material.opacity = 0.6 + Math.sin(fe.pulseT * Math.PI) * 0.4;
        });

        centerLight.intensity = 60 + cosmic * 50;
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
    buildNetwork(sig);
    buildPulses();

    harmonyInput.value = Math.round(sig.harmony * 100);
    const meanDelta = sig.elements.reduce((s, e) => s + e.delta, 0) / sig.elements.length;
    frictionInput.value = Math.round(meanDelta * 100);
    cosmicInput.value = Math.round(sig.cosmicState * 100);

    const dom = ELEMENT_META[sig.dominant];
    metricsEl.innerText =
        `Nodes: 5 WuXing | Dominant ${dom.label} ${dom.symbol} | Resonanz-Filamente: ${resonanceEdges.length} | ${sig.growthEdgeLabel}`;
});

animate();
