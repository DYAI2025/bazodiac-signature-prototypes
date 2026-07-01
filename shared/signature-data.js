/**
 * signature-data.js — plain-JS runtime port of vector-mapper.ts
 *
 * The prototypes are loaded directly by the browser as ES modules (no build step),
 * so they cannot import the .ts file. This module re-implements the same fusion
 * math (see MATHEMATICS.md) in vanilla JS and adds a loader for data/user_profile.json,
 * so every prototype + the shell render from one shared, math-correct signature.
 */

export const ELEMENT_ORDER = ['holz', 'feuer', 'erde', 'metall', 'wasser'];

export const ELEMENT_META = {
    holz:   { label: 'Holz',   symbol: '☳', color: 0x4a7c59, desc: 'Wachstum, Expansion, Kreativität' },
    feuer:  { label: 'Feuer',  symbol: '☲', color: 0xd43d3d, desc: 'Ausdruck, Leidenschaft, Beweis' },
    erde:   { label: 'Erde',   symbol: '☶', color: 0x8b6914, desc: 'Stabilität, Grounding, Präsenz' },
    metall: { label: 'Metall', symbol: '☴', color: 0xc0c0c0, desc: 'Struktur, Präzision, Durchsetzung' },
    wasser: { label: 'Wasser', symbol: '☵', color: 0x3d6fb4, desc: 'Intuition, Tiefe, Anpassung' }
};

export const THEME = {
    bg: 0x050505, obsidian: 0x1a1a1a, gold: 0xd4af37, goldBright: 0xffdf00,
    silver: 0xc0c0c0, friction: 0xff4444, harmony: 0x44ff88, neutral: 0x4488cc,
    generate: 0x44ff88, control: 0xff8844
};

const GENERATION_CYCLE = [
    ['holz', 'feuer'], ['feuer', 'erde'], ['erde', 'metall'], ['metall', 'wasser'], ['wasser', 'holz']
];
const CONTROL_CYCLE = [
    ['holz', 'erde'], ['erde', 'wasser'], ['wasser', 'feuer'], ['feuer', 'metall'], ['metall', 'holz']
];

/** strength = sqrt(w*b) + 0.3*max(w,b)  — MATHEMATICS.md §3.1 */
export function fuseWuXing(western, bazi) {
    const result = {};
    for (const el of ELEMENT_ORDER) {
        const w = western[el] || 0;
        const b = bazi[el] || 0;
        result[el] = Math.min(1, Math.sqrt(w * b) + 0.3 * Math.max(w, b));
    }
    return result;
}

/** delta = |w - b| — MATHEMATICS.md §3.3 */
export function computeDeltas(western, bazi) {
    const deltas = {};
    for (const el of ELEMENT_ORDER) {
        deltas[el] = Math.abs((western[el] || 0) - (bazi[el] || 0));
    }
    return deltas;
}

export function buildElements(fused, western, bazi, deltas) {
    return ELEMENT_ORDER.map((el, i) => {
        const meta = ELEMENT_META[el];
        const strength = fused[el];
        const angle = i * 72;
        const intensity = strength > 0.6 ? 'stark präsent' : strength > 0.3 ? 'aktiv' : 'im Hintergrund';
        const deltaNote = deltas[el] > 0.4 ? ' (Spannung: West ≠ Bazi)' : '';
        return {
            id: el, label: meta.label, symbol: meta.symbol, color: meta.color,
            strength, western: western[el] || 0, bazi: bazi[el] || 0, delta: deltas[el], angle,
            narrative: `${meta.label} ${intensity}: ${meta.desc}${deltaNote}`
        };
    });
}

/** generation (Shēng) + control (Kè) cycles + friction edges — MATHEMATICS.md §4 */
export function buildEdges(elements) {
    const edges = [];
    const elMap = Object.fromEntries(elements.map(e => [e.id, e]));

    GENERATION_CYCLE.forEach(([from, to]) => {
        const a = elMap[from], b = elMap[to];
        edges.push({ from, to, type: 'generates', strength: Math.min(a.strength, b.strength), color: THEME.generate, label: `${a.label} speist ${b.label}` });
    });

    CONTROL_CYCLE.forEach(([from, to]) => {
        const a = elMap[from], b = elMap[to];
        edges.push({ from, to, type: 'controls', strength: a.strength * 0.7, color: THEME.control, label: `${a.label} moduliert ${b.label}` });
    });

    elements.forEach(el => {
        if (el.delta > 0.3) {
            edges.push({ from: el.id, to: el.id, type: 'friction', strength: el.delta, color: THEME.friction, label: `${el.label}: Spannung` });
        }
    });

    return edges;
}

/** pentagon layout, y = strength × 3 — MATHEMATICS.md §5 */
export function build3DPositions(elements, radius = 4) {
    return elements.map(el => {
        const rad = (el.angle * Math.PI) / 180;
        return { x: Math.cos(rad) * radius, y: el.strength * 3, z: Math.sin(rad) * radius, weight: el.strength, element: el.id };
    });
}

/** harmony = 1 - mean(delta) × 0.5 — MATHEMATICS.md §6.1 (cross-check against API harmony_index) */
export function computeHarmony(deltas) {
    const mean = ELEMENT_ORDER.reduce((s, el) => s + deltas[el], 0) / ELEMENT_ORDER.length;
    return Math.max(0, Math.min(1, 1 - mean * 0.5));
}

/**
 * 13D input vector reconstruction (MATHEMATICS.md §1): 7 natal planet weights
 * (real, from contribution_ledger.western) + 6 quiz-analogue dims. This dataset
 * has no quiz answers, so the 6 remaining slots are filled deterministically
 * from the fused 5-element strengths + harmony + cosmicState (never random).
 */
function build13DVector(apiOutput, fused, harmony, cosmicState) {
    const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    const ledger = apiOutput?.contribution_ledger?.western || [];
    const planetWeights = PLANETS.map(name => {
        const entry = ledger.find(e => e.planet === name);
        return entry ? Math.min(1, entry.weight / 1.3) : 0.5;
    });
    const tail = [
        fused.holz, fused.feuer, fused.erde, fused.metall, fused.wasser, (harmony + cosmicState) / 2
    ];
    return [...planetWeights, ...tail];
}

/** Full pipeline: FuFirE-shaped API output → WuXingSignature (MATHEMATICS.md §6+) */
export function computeSignature(apiOutput) {
    const rawWestern = apiOutput.wu_xing_vectors.western_planets || apiOutput.wu_xing_vectors.western || {};
    const rawBazi = apiOutput.wu_xing_vectors.bazi_pillars || apiOutput.wu_xing_vectors.bazi || {};

    const western = {}, bazi = {};
    for (const [k, v] of Object.entries(rawWestern)) western[k.toLowerCase()] = v;
    for (const [k, v] of Object.entries(rawBazi)) bazi[k.toLowerCase()] = v;

    const fused = fuseWuXing(western, bazi);
    const deltas = computeDeltas(western, bazi);
    const elements = buildElements(fused, western, bazi, deltas);
    const edges = buildEdges(elements);
    const nodes3D = build3DPositions(elements);

    const sorted = [...elements].sort((a, b) => b.strength - a.strength);
    const dominant = sorted[0];
    const maxDelta = [...elements].sort((a, b) => b.delta - a.delta)[0];

    const harmony = apiOutput.harmony_index?.harmony_index ?? computeHarmony(deltas);
    const cosmicState = apiOutput.cosmic_state ?? harmony;
    const vector13D = build13DVector(apiOutput, fused, harmony, cosmicState);

    const narrative =
        `${dominant.label} dominiert (${(dominant.strength * 100).toFixed(0)}% fusionierte Stärke). ` +
        `Harmony: ${(harmony * 100).toFixed(0)}% | Cosmic State: ${(cosmicState * 100).toFixed(0)}%. ` +
        `Wachstumsraum: ${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}%).`;

    return {
        elements, edges, nodes3D, vector13D,
        harmony, cosmicState,
        dominant: dominant.id,
        growthEdge: maxDelta.id,
        growthEdgeLabel: `${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}%)`,
        narrative
    };
}

const FALLBACK = {
    wu_xing_vectors: {
        western_planets: { Holz: 0.6, Feuer: 0.45, Erde: 0.3, Metall: 0.25, Wasser: 0.55 },
        bazi_pillars: { Holz: 0.2, Feuer: 0.3, Erde: 0.5, Metall: 0.6, Wasser: 0.4 }
    },
    harmony_index: { harmony_index: 0.62 },
    cosmic_state: 0.5
};

/** Fetches data/user_profile.json relative to the page; falls back to a static profile offline. */
export async function loadSignature(path = '/data/user_profile.json') {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const apiOutput = await res.json();
        return computeSignature(apiOutput);
    } catch (err) {
        console.warn('[signature-data] falling back to static profile:', err.message);
        return computeSignature(FALLBACK);
    }
}
