/**
 * prototypes/signature/main.js — "Bazodiac Signatur"
 *
 * Show-piece scene that composes the DNA of all three earlier prototypes:
 *   1. Cymatic point-cloud core (sphere)        — 5-element standing waves, GPU vertex shader
 *   2. WuXing pentagon + cycle arcs (nebula)    — Shēng/Kè arcs with traveling pulses
 *   3. Ground echo ring-grid (membrane)         — subtle rippling disc
 * Plus: live dynamics (applyDynamics/startDynamics contract) and a Match mode
 * (partner signature + computeOverlay → Kohärenz, per-element resonance).
 *
 * Anti-Fabrication: every displayed quantity derives from loaded data
 * (user_profile.json / partner_profile.json / dynamics state) or is labeled
 * SIMULIERT / STATISCH / OFFLINE. Fail-visible on missing layers.
 */
import * as THREE from '../../lib/three/three.module.js';
import { OrbitControls } from '../../lib/three/OrbitControls.js';
import * as SIG from '../../shared/signature-data.js';
import { configureRenderer, makeStarfield, makeGlowSprite } from '../../shared/gfx.js';

const { loadSignature, computeSignature, ELEMENT_META, ELEMENT_ORDER, THEME } = SIG;

// ─── DOM (defensive: scene must render even if a control is missing) ───────
const $ = (id) => document.getElementById(id);
const metricsEl = $('metrics');
const cosmicInput = $('cosmic');
const cosmicSourceEl = $('cosmicSource');
const timelapseInput = $('timelapse');
const matchBtn = $('matchBtn');
const liveBtn = $('liveBtn');
const matchPanel = $('matchPanel');
const coherenceValueEl = $('coherenceValue');
const resonanceBarsEl = $('resonanceBars');
const matchNarrativeEl = $('matchNarrative');

// ─── Scene / camera / renderer ──────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.011);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 17);

const renderer = configureRenderer(new THREE.WebGLRenderer({ antialias: true }));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.minDistance = 6;
controls.maxDistance = 50;
// pause auto-rotation while the user interacts, resume after idle
let autoRotateResumeTimer = null;
controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (autoRotateResumeTimer) clearTimeout(autoRotateResumeTimer);
});
controls.addEventListener('end', () => {
    if (autoRotateResumeTimer) clearTimeout(autoRotateResumeTimer);
    autoRotateResumeTimer = setTimeout(() => { controls.autoRotate = true; }, 8000);
});

scene.add(makeStarfield(1600, 90));
scene.add(new THREE.AmbientLight(0x404060, 1.4));
const coreLight = new THREE.PointLight(0xd4af37, 70, 40);
scene.add(coreLight);

// ─── Shared element constants ───────────────────────────────────────────────
const TILT = (20 * Math.PI) / 180; // pentagon wave axes tilted +20° out of the XZ plane
const ELEMENT_AXES = ELEMENT_ORDER.map((id, i) => {
    const a = (i * 72 * Math.PI) / 180;
    return new THREE.Vector3(
        Math.cos(a) * Math.cos(TILT),
        Math.sin(TILT),
        Math.sin(a) * Math.cos(TILT)
    ).normalize();
});
const ELEMENT_COLORS = ELEMENT_ORDER.map(id => new THREE.Color(ELEMENT_META[id].color));
const NODE_RADIUS = 7.5;
const SHELL_RADIUS = 5;
const POINT_COUNT = 36000;

// ─── 1) CYMATIC CORE — custom shader point shell ────────────────────────────
const VERT = /* glsl */`
    uniform float uPhase;
    uniform float uTime;
    uniform float uHarmony;
    uniform float uStrength[5];
    uniform float uDelta[5];
    uniform vec3 uAxes[5];
    uniform vec3 uColors[5];
    uniform vec3 uTint;
    uniform float uPointSize;
    attribute float aSeed;
    varying vec3 vColor;
    varying float vAlpha;
    const float PI = 3.14159265359;
    void main() {
        vec3 n = normalize(position);
        float disp = 0.0;
        float wSum = 0.0;
        vec3 col = vec3(0.0);
        // low harmony → per-element phases drift apart; high harmony → one coherent field
        float drift = (1.0 - uHarmony) * 1.6;
        for (int e = 0; e < 5; e++) {
            float d = dot(n, uAxes[e]);
            float freq = 3.0 + 2.0 * float(e);                      // f_e = 3 + 2·index
            float phase = uPhase + drift * float(e) * (0.9 + 0.25 * sin(uTime * 0.13 + float(e) * 1.7));
            float wave = sin(d * freq * PI + phase);                // standing wave along element axis
            // delta = West/Bazi friction → high-frequency jitter riding on that wave
            float jitter = uDelta[e] * sin(d * freq * 6.5 * PI + uTime * 4.3 + aSeed * 6.2831) * 0.35;
            float contrib = uStrength[e] * (wave + jitter);
            float w = abs(contrib);
            disp += contrib;
            wSum += w;
            col += uColors[e] * (w + 0.015);
        }
        disp *= 0.8;
        col /= max(wSum + 0.075, 0.001);
        float glow = clamp(abs(disp) * 1.0, 0.0, 1.0);
        // gold/silver tint where displacement peaks
        vColor = mix(col, uTint, smoothstep(0.4, 1.0, glow)) * (0.68 + glow * 1.05);
        vAlpha = 0.5 + glow * 0.5;
        vec4 mvPosition = modelViewMatrix * vec4(position + n * disp, 1.0);
        gl_PointSize = uPointSize * (160.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
const FRAG = /* glsl */`
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.06, d);
        gl_FragColor = vec4(vColor, a * vAlpha);
    }
`;

function makeShellGeometry() {
    const positions = new Float32Array(POINT_COUNT * 3);
    const seeds = new Float32Array(POINT_COUNT);
    for (let i = 0; i < POINT_COUNT; i++) {
        // Fibonacci sphere (same distribution technique as the sphere prototype) + radial thickness
        const phi = Math.acos(-1 + (2 * i) / POINT_COUNT);
        const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi;
        const r = SHELL_RADIUS + (Math.random() - 0.5) * 0.35;
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
        positions[i * 3 + 2] = Math.cos(phi) * r;
        seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return geo;
}

function makeCymaticShell(cool) {
    const uniforms = {
        uPhase: { value: 0 },
        uTime: { value: 0 },
        uHarmony: { value: 0.6 },
        uStrength: { value: [0.5, 0.5, 0.5, 0.5, 0.5] },
        uDelta: { value: [0, 0, 0, 0, 0] },
        uAxes: { value: ELEMENT_AXES },
        uColors: { value: cool
            // partner palette: same element hues cooled toward silver-blue
            ? ELEMENT_COLORS.map(c => c.clone().lerp(new THREE.Color(0x9db8dd), 0.55))
            : ELEMENT_COLORS },
        uTint: { value: cool ? new THREE.Color(0xa8c4e8) : new THREE.Color(THEME.gold) },
        uPointSize: { value: cool ? 0.36 : 0.42 }
    };
    const material = new THREE.ShaderMaterial({
        uniforms, vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(makeShellGeometry(), material);
    return { points, uniforms, material };
}

const myShell = makeCymaticShell(false);
scene.add(myShell.points);

// ─── 2) WUXING PENTAGON — nodes + Shēng/Kè arcs + pulses + friction halos ──
function nodePosition(el, mirror, target) {
    const rad = (el.angle * Math.PI) / 180;
    return target.set(
        Math.cos(rad) * NODE_RADIUS,
        (mirror ? -1 : 1) * el.strength * 3, // MATHEMATICS.md §5.2
        Math.sin(rad) * NODE_RADIUS
    );
}

function buildPentagon(sigElements, mirror) {
    const group = new THREE.Group();
    const nodes = sigElements.map(el => {
        const pos = nodePosition(el, mirror, new THREE.Vector3());
        // unit base radius 0.33 → applyPentagon scales it to 0.18 + strength × 0.3
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.33, 24, 24),
            new THREE.MeshStandardMaterial({
                color: el.color, emissive: el.color, emissiveIntensity: 0.7,
                roughness: 0.25, metalness: 0.5
            })
        );
        mesh.scale.setScalar((0.18 + el.strength * 0.3) / 0.33);
        mesh.position.copy(pos);
        group.add(mesh);

        const glow = makeGlowSprite(el.color, 1.1 + el.strength * 2.2);
        glow.position.copy(pos);
        group.add(glow);

        // friction halo: pulsing red for elements with West/Bazi delta > 0.3 (§4.3)
        const halo = makeGlowSprite(THEME.friction, 2.2);
        halo.position.copy(pos);
        halo.material.opacity = 0;
        group.add(halo);

        return { el, pos, mesh, glow, halo, phase: Math.random() * Math.PI * 2 };
    });
    scene.add(group);
    return { group, nodes };
}

const ARC_SEGMENTS = 40;
const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const tmpVecC = new THREE.Vector3();

function makeArc(color, opacity) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    return { line, curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()) };
}

function writeArcGeometry(rec) {
    const attr = rec.line.geometry.attributes.position;
    for (let s = 0; s <= ARC_SEGMENTS; s++) {
        rec.curve.getPoint(s / ARC_SEGMENTS, tmpVecC);
        attr.setXYZ(s, tmpVecC.x, tmpVecC.y, tmpVecC.z);
    }
    attr.needsUpdate = true;
}

/** Shēng arc: control point lifted radially outward + upward; Kè arc: near-straight. */
function setCycleArcCurve(rec, a, b) {
    rec.curve.v0.copy(a);
    rec.curve.v2.copy(b);
    tmpVecA.addVectors(a, b).multiplyScalar(0.5);
    if (rec.type === 'generates') {
        rec.curve.v1.set(tmpVecA.x * 1.5, Math.max(a.y, b.y) + 1.6, tmpVecA.z * 1.5);
    } else {
        rec.curve.v1.set(tmpVecA.x * 1.08, tmpVecA.y + 0.25, tmpVecA.z * 1.08);
    }
    writeArcGeometry(rec);
}

function buildCycleArcs(sig, nodes, group) {
    const byId = Object.fromEntries(nodes.map(n => [n.el.id, n]));
    const arcs = [];
    sig.edges.forEach(edge => {
        if (edge.type === 'friction') return; // rendered as node halos
        const a = byId[edge.from], b = byId[edge.to];
        if (!a || !b) return;
        const isGen = edge.type === 'generates';
        const rec = makeArc(edge.color, isGen ? 0.25 + edge.strength * 0.45 : Math.min(1, edge.strength * 0.7));
        rec.type = edge.type;
        rec.edge = edge;
        rec.a = a; rec.b = b;
        rec.pulses = [];
        if (isGen) {
            // 3 traveling pulse sprites per generation edge, speed ∝ flow = min(sA, sB)
            for (let p = 0; p < 3; p++) {
                const sprite = makeGlowSprite(THEME.generate, 0.4);
                group.add(sprite);
                rec.pulses.push({ sprite, t: p / 3 });
            }
        }
        setCycleArcCurve(rec, a.pos, b.pos);
        group.add(rec.line);
        arcs.push(rec);
    });
    return arcs;
}

// ─── 3) GROUND ECHO — rippling ring-grid disc (membrane DNA) ────────────────
const groundGrid = new THREE.PolarGridHelper(14, 10, 6, 64, THEME.gold, THEME.obsidian);
groundGrid.position.y = -4;
groundGrid.material.transparent = true;
groundGrid.material.opacity = 0.08;
groundGrid.material.depthWrite = false;
scene.add(groundGrid);

// ─── State ──────────────────────────────────────────────────────────────────
let signature = null;          // current (possibly dynamics-modulated) signature
let rawProfile = null;         // RAW FuFirE apiOutput — needed to re-fuse with dynamics
let baseOffline = false;       // raw fetch failed → loadSignature fallback, dynamics re-fusion off
let myPentagon = null;         // { group, nodes }
let myArcs = [];
let overridden = false;        // user grabbed the cosmic slider
let cosmicCurrent = 0.5;       // drives animation speed / ripple / light
let cosmicSourceLabel = 'STATISCH';
let lastDynState = null;
let dynamicsHandle = null;
let wavePhase = 0;

// match mode
let matchMode = false;
let matchLoading = false;
let partnerSignature = null;
let partnerShell = null;       // { points, uniforms, material }
let partnerPentagon = null;    // { group, nodes }
let overlay = null;            // computeOverlay result
let overlayGroup = null;
let overlayArcs = [];

// ─── HUD / controls ─────────────────────────────────────────────────────────
function refreshCosmicSource() {
    if (cosmicSourceEl) cosmicSourceEl.textContent = cosmicSourceLabel;
}

function updateHud() {
    if (!metricsEl || !signature) return;
    const dom = ELEMENT_META[signature.dominant];
    let text =
        `Dominant ${dom.label} ${dom.symbol} | Harmony ${(signature.harmony * 100).toFixed(0)}% | ` +
        `Cosmic ${(cosmicCurrent * 100).toFixed(0)}% (${cosmicSourceLabel}) | Wachstum: ${signature.growthEdgeLabel}`;
    if (matchMode && overlay) text += ` | Kohärenz ${overlay.coherence.toFixed(2)}`;
    if (baseOffline) text += ' | Basisprofil offline';
    metricsEl.innerText = text;
}

function cssColor(c) {
    return typeof c === 'number' ? `#${c.toString(16).padStart(6, '0')}` : String(c);
}

function fillMatchPanel(ov) {
    if (!matchPanel) return;
    matchPanel.hidden = false;
    if (coherenceValueEl) coherenceValueEl.textContent = ov ? ov.coherence.toFixed(2) : 'n/v';
    if (resonanceBarsEl) {
        resonanceBarsEl.innerHTML = '';
        if (ov && Array.isArray(ov.perElement)) {
            ov.perElement.forEach(pe => {
                const meta = ELEMENT_META[pe.id] || {};
                const row = document.createElement('div');
                row.className = 'bar-row';
                const sym = document.createElement('span');
                sym.className = 'bar-sym';
                sym.style.color = cssColor(pe.color ?? meta.color ?? 0xd4af37);
                sym.textContent = meta.symbol || pe.label || pe.id;
                const track = document.createElement('div');
                track.className = 'bar-track';
                const fill = document.createElement('div');
                fill.className = 'bar-fill';
                fill.style.width = `${Math.max(0, Math.min(1, pe.resonance)) * 100}%`;
                fill.style.background = cssColor(pe.color ?? meta.color ?? 0xd4af37);
                track.appendChild(fill);
                const val = document.createElement('span');
                val.className = 'bar-val';
                val.textContent = pe.resonance.toFixed(2);
                row.append(sym, track, val);
                resonanceBarsEl.appendChild(row);
            });
        }
    }
    if (matchNarrativeEl) {
        matchNarrativeEl.textContent = ov
            ? (ov.narrative || '')
            : 'Overlay-Mathematik nicht verfügbar (computeOverlay fehlt).';
    }
}

// ─── Signature → scene ──────────────────────────────────────────────────────
function applyUniforms(sig, uniforms) {
    for (let i = 0; i < ELEMENT_ORDER.length; i++) {
        const el = sig.elements[i];
        uniforms.uStrength.value[i] = el.strength;
        uniforms.uDelta.value[i] = el.delta;
    }
    uniforms.uHarmony.value = sig.harmony;
}

function applyPentagon(sig, pentagon, mirror) {
    pentagon.nodes.forEach((node, i) => {
        const el = sig.elements[i];
        node.el = el;
        nodePosition(el, mirror, node.pos);
        node.mesh.position.copy(node.pos);
        node.glow.position.copy(node.pos);
        node.halo.position.copy(node.pos);
        node.mesh.scale.setScalar((0.18 + el.strength * 0.3) / 0.33); // relative to mid-strength base
        node.glow.scale.setScalar(1.1 + el.strength * 2.2);
    });
}

function applyArcs(sig, arcs, nodes) {
    const byId = Object.fromEntries(nodes.map(n => [n.el.id, n]));
    // refresh edge strengths from the re-fused signature
    const edgeKey = e => `${e.type}:${e.from}:${e.to}`;
    const edgeMap = {};
    sig.edges.forEach(e => { edgeMap[edgeKey(e)] = e; });
    arcs.forEach(rec => {
        const fresh = edgeMap[edgeKey(rec.edge)];
        if (fresh) {
            rec.edge = fresh;
            rec.line.material.opacity = rec.type === 'generates'
                ? 0.25 + fresh.strength * 0.45
                : Math.min(1, fresh.strength * 0.7);
        }
        const a = byId[rec.edge.from], b = byId[rec.edge.to];
        if (a && b) setCycleArcCurve(rec, a.pos, b.pos);
    });
}

function setOverlayArcCurve(rec, a, b) {
    rec.curve.v0.copy(a);
    rec.curve.v2.copy(b);
    tmpVecA.addVectors(a, b).multiplyScalar(0.5);
    rec.curve.v1.set(tmpVecA.x * 1.35, tmpVecA.y, tmpVecA.z * 1.35);
    writeArcGeometry(rec);
}

function refreshOverlay() {
    if (!matchMode || !partnerSignature || !signature) return;
    if (typeof SIG.computeOverlay !== 'function') {
        console.error('[signature] computeOverlay fehlt in shared/signature-data.js — Overlay deaktiviert.');
        overlay = null;
        fillMatchPanel(null);
        return;
    }
    try {
        overlay = SIG.computeOverlay(signature, partnerSignature);
    } catch (err) {
        console.error('[signature] computeOverlay fehlgeschlagen:', err);
        overlay = null;
        fillMatchPanel(null);
        return;
    }
    // per-element vertical connection arcs: my node ↔ partner node
    if (overlayGroup && overlay && Array.isArray(overlay.perElement)) {
        const greenC = new THREE.Color(THEME.harmony);
        const redC = new THREE.Color(THEME.friction);
        overlay.perElement.forEach((pe, i) => {
            // pair by element id (robust against perElement ordering), fall back to index
            const idx = ELEMENT_ORDER.indexOf(pe.id) >= 0 ? ELEMENT_ORDER.indexOf(pe.id) : i;
            const rec = overlayArcs[idx];
            const myNode = myPentagon.nodes[idx];
            const pNode = partnerPentagon.nodes[idx];
            if (!rec || !myNode || !pNode) return;
            const t = Math.max(0, Math.min(1, pe.frictionOverlay * 1.5 + (1 - pe.resonance) * 0.5));
            rec.line.material.color.copy(greenC).lerp(redC, t);
            rec.line.material.opacity = 0.12 + Math.max(0, Math.min(1, pe.resonance)) * 0.6;
            setOverlayArcCurve(rec, myNode.pos, pNode.pos);
        });
    }
    fillMatchPanel(overlay);
}

function applySignature(sig) {
    signature = sig;
    applyUniforms(sig, myShell.uniforms);
    if (myPentagon) {
        applyPentagon(sig, myPentagon, false);
        applyArcs(sig, myArcs, myPentagon.nodes);
    }
    refreshOverlay();
    updateHud();
}

// ─── Dynamics wiring (contract: shared/dynamics.js + applyDynamics) ────────
function overrideDynState(state) {
    // keep transit structure live, but let the user's slider own cosmic weather
    const cw = state && state.cosmic_weather ? state.cosmic_weather : {};
    return {
        ...(state || {}),
        cosmic_weather: { ...cw, normalized: cosmicCurrent, source: 'override' }
    };
}

function refuseSignature() {
    if (baseOffline || !rawProfile || !lastDynState) return;
    if (typeof SIG.applyDynamics !== 'function') {
        console.error('[signature] applyDynamics fehlt in shared/signature-data.js — Re-Fusion deaktiviert.');
        return;
    }
    try {
        const dyn = overridden ? overrideDynState(lastDynState) : lastDynState;
        const sig = computeSignature(SIG.applyDynamics(rawProfile, dyn));
        if (!overridden) {
            cosmicCurrent = sig.cosmicState;
            if (cosmicInput) cosmicInput.value = Math.round(cosmicCurrent * 100);
            cosmicSourceLabel = String(lastDynState?.cosmic_weather?.source || 'UNBEKANNT').toUpperCase();
            refreshCosmicSource();
        }
        applySignature(sig);
    } catch (err) {
        console.error('[signature] Dynamik-Re-Fusion fehlgeschlagen:', err);
    }
}

async function initDynamics() {
    if (baseOffline) {
        console.error('[signature] Basisprofil offline — Dynamik-Re-Fusion deaktiviert.');
        return;
    }
    try {
        const mod = await import('../../shared/dynamics.js');
        if (typeof mod.startDynamics !== 'function') throw new Error('startDynamics nicht exportiert');
        dynamicsHandle = mod.startDynamics({
            intervalMs: 60000,
            onState: (state) => {
                lastDynState = state;
                refuseSignature();
            }
        });
    } catch (err) {
        console.error('[signature] Dynamik-Layer nicht verfügbar:', err);
        cosmicSourceLabel = 'DYNAMIK OFFLINE';
        refreshCosmicSource();
        updateHud();
    }
}

// ─── Match mode ─────────────────────────────────────────────────────────────
function disposeObject3D(root) {
    root.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        mats.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
        });
    });
}

async function enableMatch() {
    matchLoading = true;
    if (matchBtn) { matchBtn.textContent = 'Lädt…'; matchBtn.disabled = true; }
    try {
        // fetch directly instead of loadSignature(): its silent FALLBACK profile
        // would present fabricated data as the partner (anti-fabrication rule).
        const partnerUrl = new URL('../../data/partner_profile.json', import.meta.url).href;
        const res = await fetch(partnerUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        partnerSignature = computeSignature(await res.json());
    } catch (err) {
        console.error('[signature] Partnerprofil nicht ladbar:', err);
        partnerSignature = null;
    }
    matchLoading = false;
    if (matchBtn) { matchBtn.disabled = false; }
    if (!partnerSignature) {
        if (matchBtn) matchBtn.textContent = 'Match-Modus';
        if (matchNarrativeEl && matchPanel) {
            matchPanel.hidden = false;
            matchNarrativeEl.textContent = 'Partnerprofil nicht ladbar.';
        }
        return;
    }
    matchMode = true;
    if (matchBtn) { matchBtn.textContent = 'Match beenden'; matchBtn.classList.add('active'); }

    // counter-rotating partner shell, silver-blue palette, rotated 180°
    partnerShell = makeCymaticShell(true);
    partnerShell.points.rotation.y = Math.PI;
    applyUniforms(partnerSignature, partnerShell.uniforms);
    scene.add(partnerShell.points);

    // partner pentagon mirrored downward (y = -strength × 3)
    partnerPentagon = buildPentagon(partnerSignature.elements, true);
    applyPentagon(partnerSignature, partnerPentagon, true);

    // overlay connection arcs (one per element)
    overlayGroup = new THREE.Group();
    overlayArcs = ELEMENT_ORDER.map(() => {
        const rec = makeArc(THEME.harmony, 0.4);
        overlayGroup.add(rec.line);
        return rec;
    });
    scene.add(overlayGroup);

    refreshOverlay();
    updateHud();
}

function disableMatch() {
    matchMode = false;
    overlay = null;
    if (matchBtn) { matchBtn.textContent = 'Match-Modus'; matchBtn.classList.remove('active'); }
    if (partnerShell) {
        scene.remove(partnerShell.points);
        partnerShell.points.geometry.dispose();
        partnerShell.material.dispose();
        partnerShell = null;
    }
    if (partnerPentagon) {
        scene.remove(partnerPentagon.group);
        disposeObject3D(partnerPentagon.group);
        partnerPentagon = null;
    }
    if (overlayGroup) {
        scene.remove(overlayGroup);
        disposeObject3D(overlayGroup);
        overlayGroup = null;
        overlayArcs = [];
    }
    partnerSignature = null;
    if (matchPanel) matchPanel.hidden = true;
    updateHud();
}

// ─── Control listeners ──────────────────────────────────────────────────────
if (cosmicInput) {
    cosmicInput.addEventListener('input', () => {
        overridden = true;
        cosmicCurrent = cosmicInput.value / 100;
        cosmicSourceLabel = 'OVERRIDE';
        refreshCosmicSource();
        refuseSignature();
        updateHud();
    });
}
if (liveBtn) {
    liveBtn.addEventListener('click', () => {
        overridden = false;
        if (lastDynState) {
            refuseSignature();
        } else {
            // no dynamics tick yet → back to the loaded base profile value
            if (signature) {
                cosmicCurrent = signature.cosmicState;
                if (cosmicInput) cosmicInput.value = Math.round(cosmicCurrent * 100);
            }
            cosmicSourceLabel = dynamicsHandle ? 'WARTE AUF LIVE…' : 'STATISCH';
            refreshCosmicSource();
        }
        updateHud();
    });
}
if (matchBtn) {
    matchBtn.addEventListener('click', () => {
        if (matchLoading) return;
        if (matchMode) disableMatch();
        else enableMatch();
    });
}

// ─── Animation loop (no per-frame allocations) ──────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;

    // Zeitraffer: 0..100 → 1×..12× wave-phase evolution (accumulated → no jumps)
    const timelapse = timelapseInput ? 1 + (timelapseInput.value / 100) * 11 : 1;
    wavePhase += dt * (0.3 + cosmicCurrent * 1.2) * timelapse;

    myShell.uniforms.uPhase.value = wavePhase;
    myShell.uniforms.uTime.value = time;
    myShell.points.rotation.y += dt * 0.04;

    if (partnerShell) {
        partnerShell.uniforms.uPhase.value = wavePhase;
        partnerShell.uniforms.uTime.value = time;
        partnerShell.points.rotation.y -= dt * 0.04; // counter-rotating
    }

    if (myPentagon) {
        myPentagon.nodes.forEach(node => {
            const pulse = 1 + Math.sin(time * 1.6 + node.phase) * 0.1;
            node.glow.scale.setScalar((1.1 + node.el.strength * 2.2) * pulse);
            // friction halo: pulsing red where delta > 0.3
            node.halo.material.opacity = node.el.delta > 0.3
                ? node.el.delta * (0.25 + 0.35 * Math.abs(Math.sin(time * 2.2 + node.phase)))
                : 0;
        });
        myArcs.forEach(rec => {
            for (let p = 0; p < rec.pulses.length; p++) {
                const pulse = rec.pulses[p];
                pulse.t += dt * (0.06 + rec.edge.strength * 0.3) * (0.5 + cosmicCurrent);
                if (pulse.t > 1) pulse.t -= 1;
                rec.curve.getPoint(pulse.t, tmpVecC);
                pulse.sprite.position.copy(tmpVecC);
                pulse.sprite.material.opacity = 0.35 + Math.sin(pulse.t * Math.PI) * 0.55;
            }
        });
    }

    if (partnerPentagon) {
        partnerPentagon.nodes.forEach(node => {
            const pulse = 1 + Math.sin(time * 1.6 + node.phase) * 0.1;
            node.glow.scale.setScalar((1.1 + node.el.strength * 2.2) * pulse);
            node.halo.material.opacity = node.el.delta > 0.3
                ? node.el.delta * (0.25 + 0.35 * Math.abs(Math.sin(time * 2.2 + node.phase)))
                : 0;
        });
    }

    // ground echo: gentle scale/opacity ripple driven by cosmicState
    const ripple = Math.sin(time * 0.6);
    groundGrid.material.opacity = 0.05 + 0.05 * cosmicCurrent * (0.5 + 0.5 * ripple);
    const gScale = 1 + 0.02 * cosmicCurrent * ripple;
    groundGrid.scale.set(gScale, 1, gScale);

    coreLight.intensity = 45 + cosmicCurrent * 55;

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Boot ───────────────────────────────────────────────────────────────────
async function loadBaseProfile() {
    const url = new URL('../../data/user_profile.json', import.meta.url).href;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawProfile = await res.json();
        return computeSignature(rawProfile);
    } catch (err) {
        console.error('[signature] Basisprofil (raw) nicht ladbar — nutze loadSignature-Fallback, Dynamik-Re-Fusion aus:', err);
        baseOffline = true;
        return loadSignature(); // has its own offline fallback
    }
}

async function init() {
    const sig = await loadBaseProfile();

    myPentagon = buildPentagon(sig.elements, false);
    myArcs = buildCycleArcs(sig, myPentagon.nodes, myPentagon.group);

    cosmicCurrent = sig.cosmicState;
    if (cosmicInput) cosmicInput.value = Math.round(cosmicCurrent * 100);
    refreshCosmicSource();

    applySignature(sig);
    initDynamics();
}

init().catch(err => {
    console.error('[signature] Initialisierung fehlgeschlagen:', err);
    if (metricsEl) metricsEl.innerText = `Fehler: ${err.message}`;
});

animate();
