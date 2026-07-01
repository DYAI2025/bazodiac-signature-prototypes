/**
 * vector-mapper.ts – FuFirE WuXing 5D → Visual Signature
 *
 * Input:  FuFirE API Response (wu_xing_vectors + harmony_index + elemental_comparison)
 * Output: 5 WuXing-Knoten im Erzeugungszyklus + Dynamik-Kanten + Resonanz-Index
 *
 * Philosophie:
 * - Nicht Westlich vs. Bazi trennen, sondern die FUSION zeigen
 * - Die 5 Elemente sind KEINE Boxen, sondern ein lebendiger Kreis
 * - Größe = kombinierte Stärke (West × Bazi fusioniert)
 * - Edges = WuXing-Zyklen (Erzeugen, Kontrollieren, Harmonie)
 * - Der Nutzer sieht: "Wo fließt Energie? Wo blockiert sie? Wo wächst etwas?"
 */

// ─── TYPEN ──────────────────────────────────────────

/** Roher Output der FuFirE /calculate/fusion API */
export interface FuFirEOutput {
  wu_xing_vectors: {
    western: Record<string, number>;
    bazi: Record<string, number>;
  };
  harmony_index: {
    harmony_index: number;
    interpretation: string;
    method: string;
    western_vector: Record<string, number>;
    bazi_vector: Record<string, number>;
  };
  elemental_comparison: Record<string, { western: number; bazi: number; difference: number }>;
  cosmic_state: number;
  fusion_interpretation: string;
}

/** Das fusionierte 5D WuXing-Profil */
export interface WuXing5D {
  holz: number;   // 0-1: kombinierte Stärke
  feuer: number;
  erde: number;
  metall: number;
  wasser: number;
}

/** Ein Element-Knoten im sichtbaren Zyklus */
export interface WuXingNode {
  id: string;           // 'holz', 'feuer', etc.
  label: string;        // 'Holz', 'Feuer', etc.
  symbol: string;       // ☲ ☵ ☳ ☴ ☶
  color: string;
  strength: number;     // 0-1: Gesamtstärke (fusioniert)
  western: number;      // Anteil West
  bazi: number;         // Anteil Bazi
  delta: number;        // Differenz (Spannungspotential)
  angle: number;        // Position im Kreis (0-360°)
  narrative: string;
}

/** Kante zwischen zwei Elementen */
export interface WuXingEdge {
  from: string;
  to: string;
  type: 'generates' | 'controls' | 'harmony' | 'friction';
  strength: number;     // 0-1
  color: string;
  label: string;
}

/** Das vollständige visuelle Signatur-Objekt */
export interface WuXingSignature {
  elements: WuXingNode[];
  edges: WuXingEdge[];
  harmony: number;          // 0-1: Gesamtharmonie
  cosmicState: number;      // 0-1: kosmischer Zustand
  dominant: string;         // ID des dominanten Elements
  growthEdge: string;       // Wo liegt Wachstum?
  narrative: string;        // Human-readable Zusammenfassung
  nodes3D: Node3D[];        // 3D-Positionen für Three.js
}

export interface Node3D {
  x: number; y: number; z: number;
  weight: number;
  element: string;
}

// ─── KONSTANTEN ─────────────────────────────────────

/** WuXing Erzeugungszyklus: Holz → Feuer → Erde → Metall → Wasser → Holz */
const GENERATION_CYCLE: [string, string][] = [
  ['holz', 'feuer'],   // Holz erzeugt Feuer
  ['feuer', 'erde'],   // Feuer erzeugt Erde (Asche)
  ['erde', 'metall'],  // Erde erzeugt Metall (Erz)
  ['metall', 'wasser'],// Metall erzeugt Wasser (Kondensation)
  ['wasser', 'holz'],  // Wasser erzeugt Holz (Wachstum)
];

/** WuXing Kontrollzyklus: Holz → Erde → Wasser → Feuer → Metall → Holz */
const CONTROL_CYCLE: [string, string][] = [
  ['holz', 'erde'],    // Holz durchdringt Erde (Wurzeln)
  ['erde', 'wasser'],  // Erde staut Wasser (Damm)
  ['wasser', 'feuer'], // Wasser löscht Feuer
  ['feuer', 'metall'], // Feuer schmilzt Metall
  ['metall', 'holz'],  // Metall schneidet Holz
];

const ELEMENT_META: Record<string, { label: string; symbol: string; color: string; desc: string }> = {
  holz:   { label: 'Holz',   symbol: '☳', color: '#4a7c59', desc: 'Wachstum, Expansion, Kreativität' },
  feuer:  { label: 'Feuer',  symbol: '☲', color: '#d43d3d', desc: 'Ausdruck, Leidenschaft, Beweis' },
  erde:   { label: 'Erde',   symbol: '☶', color: '#8b6914', desc: 'Stabilität, Grounding, Präsenz' },
  metall: { label: 'Metall', symbol: '☴', color: '#c0c0c0', desc: 'Struktur, Präzision, Durchsetzung' },
  wasser: { label: 'Wasser', symbol: '☵', color: '#3d6fb4', desc: 'Intuition, Tiefe, Anpassung' }
};

const ELEMENT_ORDER = ['holz', 'feuer', 'erde', 'metall', 'wasser'];

export const THEME = {
  bg: '#050505', obsidian: '#1a1a1a', gold: '#d4af37',
  goldBright: '#ffdf00', silver: '#c0c0c0',
  friction: '#ff4444', harmony: '#44ff88', neutral: '#4488cc',
  generate: '#44ff88', control: '#ff8844'
};

// ─── FUSION LOGIK ──────────────────────────────────

/**
 * Fused zwei WuXing-Vektoren (westlich + bazi) zu einem Profil.
 *
 * Fusion-Formel:
 *   strength = sqrt(west * bazi) + 0.3 * max(west, bazi)
 *   → beide Systeme müssen vorhanden sein für hohe Stärke
 *   → aber ein dominantes System kann allein schon Stärke zeigen
 *
 *   delta = |west - bazi| → Spannungspotential
 */
export function fuseWuXing(
  western: Record<string, number>,
  bazi: Record<string, number>
): WuXing5D {
  const result: Partial<WuXing5D> = {};

  for (const el of ELEMENT_ORDER) {
    const w = western[el] || 0;
    const b = bazi[el] || 0;
    // Geometrisches Mittel + Bonus für Dominanz
    const fused = Math.sqrt(w * b) + 0.3 * Math.max(w, b);
    result[el as keyof WuXing5D] = Math.min(1, fused);
  }

  return result as WuXing5D;
}

/**
 * Berechnet Delta (Spannung) pro Element.
 * Hohes Delta = West und Bazi sagen unterschiedliches Element.
 * Das ist nicht "schlecht" – das ist der Wachstumsraum.
 */
export function computeDeltas(
  western: Record<string, number>,
  bazi: Record<string, number>
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const el of ELEMENT_ORDER) {
    deltas[el] = Math.abs((western[el] || 0) - (bazi[el] || 0));
  }
  return deltas;
}

// ─── ELEMENT-KNOTEN ─────────────────────────────────

/**
 * Erzeugt die 5 WuXing-Knoten mit Position im Erzeugungszyklus.
 * Layout: Pentagon (5 Punkte im Kreis), Winkel = 72° pro Element.
 */
export function buildElements(
  fused: WuXing5D,
  western: Record<string, number>,
  bazi: Record<string, number>,
  deltas: Record<string, number>
): WuXingNode[] {
  return ELEMENT_ORDER.map((el, i) => {
    const meta = ELEMENT_META[el];
    const strength = fused[el as keyof WuXing5D];
    const angle = i * 72; // Pentagon

    const intensity = strength > 0.6 ? 'stark praesent' : strength > 0.3 ? 'aktiv' : 'im Hintergrund';
    const deltaNote = deltas[el] > 0.4 ? ' (Spannung: West !== Bazi)' : '';

    return {
      id: el,
      label: meta.label,
      symbol: meta.symbol,
      color: meta.color,
      strength,
      western: western[el] || 0,
      bazi: bazi[el] || 0,
      delta: deltas[el],
      angle,
      narrative: `${meta.label} ${intensity}: ${meta.desc}${deltaNote}`
    };
  });
}

// ─── KANTEN (WuXing-Zyklen) ────────────────────────

/**
 * Erzeugt Kanten basierend auf:
 * 1. Erzeugungszyklus (grün): Energie fließt von A nach B
 * 2. Kontrollzyklus (orange): A moduliert/bremst B
 * 3. Harmonie/Friction: Basierend auf Delta zwischen West/Bazi
 */
export function buildEdges(elements: WuXingNode[]): WuXingEdge[] {
  const edges: WuXingEdge[] = [];
  const elMap = Object.fromEntries(elements.map(e => [e.id, e]));

  // Erzeugungszyklus
  GENERATION_CYCLE.forEach(([from, to]) => {
    const fromEl = elMap[from];
    const toEl = elMap[to];
    if (!fromEl || !toEl) return;
    // Stärke des Erzeugungsflusses = Minimum beider Elemente
    const flow = Math.min(fromEl.strength, toEl.strength);
    edges.push({
      from, to,
      type: 'generates',
      strength: flow,
      color: THEME.generate,
      label: `${fromEl.label} speist ${toEl.label}`
    });
  });

  // Kontrollzyklus
  CONTROL_CYCLE.forEach(([from, to]) => {
    const fromEl = elMap[from];
    const toEl = elMap[to];
    if (!fromEl || !toEl) return;
    // Kontrolle ist stark wenn Controller stark ist
    const control = fromEl.strength * 0.7;
    edges.push({
      from, to,
      type: 'controls',
      strength: control,
      color: THEME.control,
      label: `${fromEl.label} moduliert ${toEl.label}`
    });
  });

  // Harmonie/Friction Kanten (basierend auf Delta)
  elements.forEach(el => {
    if (el.delta > 0.3) {
      // Hohe Differenz = Spannung zwischen West und Bazi für dieses Element
      edges.push({
        from: `${el.id}_west`,
        to: `${el.id}_bazi`,
        type: 'friction',
        strength: el.delta,
        color: THEME.friction,
        label: `${el.label}: West(${el.western.toFixed(2)}) vs Bazi(${el.bazi.toFixed(2)})`
      });
    }
  });

  return edges;
}

// ─── 3D POSITIONIERUNG ─────────────────────────────

/**
 * Pentagon-Layout im 3D-Raum.
 * - 5 Elemente auf einem Kreis in der XZ-Ebene
 * - Y-Achse = Stärke (höher = stärker)
 * - Z-Achse leicht variiert für visuelle Tiefe
 */
export function build3DPositions(elements: WuXingNode[]): Node3D[] {
  const radius = 4;
  return elements.map(el => {
    const rad = (el.angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: el.strength * 3, // Höhe = Stärke
      z: Math.sin(rad) * radius,
      weight: el.strength,
      element: el.id
    };
  });
}

// ─── GESAMTPIPELINE ────────────────────────────────

/**
 * Hauptfunktion: Wandelt FuFirE API Output in visuelle Signatur um.
 *
 * @param apiOutput – Response von POST /calculate/fusion
 * @returns WuXingSignature für die 3D-Engine
 */
export function mapFuFirEToSignature(apiOutput: FuFirEOutput): WuXingSignature {
  const western = apiOutput.wu_xing_vectors.western;
  const bazi = apiOutput.wu_xing_vectors.bazi;

  // 1. Fusion
  const fused = fuseWuXing(western, bazi);

  // 2. Deltas
  const deltas = computeDeltas(western, bazi);

  // 3. Element-Knoten
  const elements = buildElements(fused, western, bazi, deltas);

  // 4. Kanten
  const edges = buildEdges(elements);

  // 5. 3D
  const nodes3D = build3DPositions(elements);

  // 6. Dominant + Growth Edge
  const sorted = [...elements].sort((a, b) => b.strength - a.strength);
  const dominant = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Growth = Element mit höchstem Delta (größter Unterschied West/Bazi)
  const maxDelta = [...elements].sort((a, b) => b.delta - a.delta)[0];

  const harmony = apiOutput.harmony_index.harmony_index;
  const cosmicState = apiOutput.cosmic_state;

  const narrative =
    `${dominant.label} dominiert (${(dominant.strength * 100).toFixed(0)}% fusionierte Staerke). ` +
    `Harmony: ${(harmony * 100).toFixed(0)}% | Cosmic State: ${(cosmicState * 100).toFixed(0)}%. ` +
    `Wachstumsraum: ${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}% - West und Bazi divergieren hier).`;

  return {
    elements,
    edges,
    harmony,
    cosmicState,
    dominant: dominant.id,
    growthEdge: `${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}%)`,
    narrative,
    nodes3D
  };
}

/**
 * Convenience: Mappt direkt aus user_profile.json Format
 * (das die gleiche Struktur wie /calculate/fusion hat)
 */
export function mapFromUserProfile(profile: {
  wu_xing_vectors: { western_planets: Record<string, number>; bazi_pillars: Record<string, number> };
  harmony_index: { harmony_index: number; interpretation: string };
  cosmic_state: number;
}): WuXingSignature {
  // Normalize keys to lowercase
  const western: Record<string, number> = {};
  const bazi: Record<string, number> = {};

  for (const [k, v] of Object.entries(profile.wu_xing_vectors.western_planets)) {
    western[k.toLowerCase()] = v;
  }
  for (const [k, v] of Object.entries(profile.wu_xing_vectors.bazi_pillars)) {
    bazi[k.toLowerCase()] = v;
  }

  const fused = fuseWuXing(western, bazi);
  const deltas = computeDeltas(western, bazi);
  const elements = buildElements(fused, western, bazi, deltas);
  const edges = buildEdges(elements);
  const nodes3D = build3DPositions(elements);

  const sorted = [...elements].sort((a, b) => b.strength - a.strength);
  const dominant = sorted[0];
  const maxDelta = [...elements].sort((a, b) => b.delta - a.delta)[0];

  return {
    elements,
    edges,
    harmony: profile.harmony_index.harmony_index,
    cosmicState: profile.cosmic_state,
    dominant: dominant.id,
    growthEdge: `${maxDelta.label} (Δ${(maxDelta.delta * 100).toFixed(0)}%)`,
    narrative: `${dominant.label} dominant. Harmony ${(profile.harmony_index.harmony_index * 100).toFixed(0)}%. Wachstumsraum: ${maxDelta.label}.`,
    nodes3D
  };
}
