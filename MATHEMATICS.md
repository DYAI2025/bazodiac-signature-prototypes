# Bazodiac Signature — Mathematical Foundation

> Complete documentation of the fusion mathematics powering the 5D WuXing Signature System.

---

## 1. Input Space: The 13D Vector

The signature originates from a **13-dimensional vector** representing the complete astrological-psychological profile:

| Dimension | Source | Range | Meaning |
|-----------|--------|-------|---------|
| 1–7 | **Natal (Western)** | 0–1 | Planetary weights: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn |
| 8–13 | **Quiz (Adaptive)** | 0–1 | Psychological dimensions: Expression, Structure, Intuition, Grounding, Flow, Will |

**Normalization**: All inputs normalized to `[0, 1]` via min-max scaling against population distributions.

---

## 2. WuXing Projection: 13D → 5D

The 13 dimensions project onto the **Five Elements (WuXing)** through two parallel systems:

### 2.1 Western Planetary → WuXing Mapping

| Planet | Primary Element | Secondary | Weight |
|--------|----------------|-----------|--------|
| Sun | Feuer (Fire) | — | 1.0 |
| Moon | Wasser (Water) | — | 1.0 |
| Mercury | Metall (Metal) | Holz (Wood) | 0.7 / 0.3 |
| Venus | Erde (Earth) | Metall (Metal) | 0.6 / 0.4 |
| Mars | Feuer (Fire) | Metall (Metal) | 0.8 / 0.2 |
| Jupiter | Holz (Wood) | Feuer (Fire) | 0.7 / 0.3 |
| Saturn | Erde (Earth) | Metall (Metal) | 0.6 / 0.4 |

**Formula (per element):**
```
western[el] = Σ (planet_weight × mapping_coefficient) / Σ mapping_coefficient
```

### 2.2 Quiz Dimensions → WuXing Mapping

| Quiz Dimension | WuXing Element | Coefficient |
|----------------|----------------|-------------|
| Expression | Feuer | 1.0 |
| Structure | Metall | 1.0 |
| Intuition | Wasser | 1.0 |
| Grounding | Erde | 1.0 |
| Flow | Holz | 1.0 |
| Will | (distributed) | 0.2 each |

**Formula:**
```
bazi[el] = quiz_dimension_value (direct 1:1 mapping for 5 dims)
```

---

## 3. Fusion Mathematics: West × Bazi → Unified Strength

The core innovation: **fusion of two independent astrological systems** into a single 5D strength profile.

### 3.1 Fusion Formula

For each element `e ∈ {Holz, Feuer, Erde, Metall, Wasser}`:

```
strength[e] = √(western[e] × bazi[e]) + 0.3 × max(western[e], bazi[e])
```

### 3.2 Design Rationale

| Term | Purpose | Effect |
|------|---------|--------|
| `√(w × b)` | Geometric mean | Requires **both** systems to agree for high values. If one is 0, result is 0. |
| `0.3 × max(w, b)` | Dominance bonus | A single strong system can still produce moderate strength (up to 0.3). |

**Properties:**
- Range: `[0, 1]` (clamped)
- Symmetric: `fuse(w, b) = fuse(b, w)`
- Monotonic in both arguments
- Maximum `1.0` only when `w = b = 1.0`

### 3.3 Delta (Tension / Growth Potential)

```
delta[e] = |western[e] - bazi[e]|
```

**Interpretation:**
- `delta ≈ 0`: West and Bazi **converge** → stable, integrated expression
- `delta > 0.4`: **High tension** → "Wachstumsraum" (growth space), internal conflict as creative fuel
- `delta > 0.7`: **Fundamental divergence** → shadow integration work needed

---

## 4. WuXing Topology: Cycles as Graph Edges

The five elements form a **pentagon topology** with two orthogonal cycle systems.

### 4.1 Generation Cycle (Shēng  生) — Green Edges

```
Holz → Feuer → Erde → Metall → Wasser → Holz
```

**Flow strength** between adjacent elements:
```
flow(a → b) = min(strength[a], strength[b])
```
*Energy flows where both giver and receiver have capacity.*

### 4.2 Control Cycle (Kè  克) — Orange Edges

```
Holz → Erde → Wasser → Feuer → Metall → Holz
```

**Control strength:**
```
control(a → b) = strength[a] × 0.7
```
*The controller modulates the controlled; 0.7 factor prevents total suppression.*

### 4.3 Friction Edges (Internal) — Red Edges

For each element where `delta > 0.3`:
```
friction[e] = delta[e]
```
*Visualizes the West/Bazi split as internal tension within the element.*

---

## 5. 3D Spatial Layout

### 5.1 Pentagon Positions (X/Z Plane)

```
angle[e] = index(e) × 72°  (0°, 72°, 144°, 216°, 288°)
radius = 4.0

x = cos(angle) × radius
z = sin(angle) × radius
```

### 5.2 Vertical Dimension (Y Axis)

```
y = strength[e] × 3.0
```
*Higher = stronger. Creates a "mountain range" topography of the psyche.*

### 5.3 Node3D Output

```typescript
interface Node3D {
  x: number;    // [-4, 4]
  y: number;    // [0, 3]
  z: number;    // [-4, 4]
  weight: number;  // strength
  element: string; // element ID
}
```

---

## 6. Global Indices

### 6.1 Harmony Index

```
harmony = 1.0 - (Σ delta[e] / 5) × 0.5
```
- Mean delta across elements, scaled
- `1.0` = perfect West/Bazi alignment
- `0.5` = moderate integration
- `0.0` = complete divergence

### 6.2 Cosmic State

External modulator from NASA Space Weather / planetary transits:
```
cosmicState ∈ [0, 1]
```
- Drives animation intensity, color shifts, particle turbulence
- `0.0` = calm void
- `1.0` = solar storm / major transit

### 6.3 Dominant Element

```
dominant = argmax(strength[e])
```

### 6.4 Growth Edge

```
growthEdge = argmax(delta[e])
```
*The element with highest West/Bazi tension → primary growth vector.*

---

## 7. Visual Parameter Mapping

### 7.1 Membrane (Gravitational Fabric)

| Visual Parameter | Mathematical Driver |
|------------------|---------------------|
| Vertex height (basin depth) | `strength[e]` as mass |
| Surface oscillation | `cosmicState` × sine waves |
| Spike sharpness | `delta[e]` × `tension` control |

### 7.2 Sphere (Cymatic Resonance)

| Visual Parameter | Mathematical Driver |
|------------------|---------------------|
| Particle radial displacement | 13-frequency Fourier sum from 13D vector |
| Symmetry order | `harmony` (high = crystalline, low = chaotic) |
| Jitter/noise | `friction` control × `delta` mean |

### 7.3 Nebula (Neural Network)

| Visual Parameter | Mathematical Driver |
|------------------|---------------------|
| Node position | Base pentagon + `delta`-driven organic drift |
| Edge existence | `resonance = (strength[a] + strength[b]) / 2 > 0.4` |
| Pulse velocity | `cosmicState` × base frequency |
| Edge color | `friction > 0.6` → red shift, else neutral blue |

---

## 8. Narrative Generation

```typescript
narrative = 
  `${dominant.label} dominant (${strength×100}% fused). ` +
  `Harmony: ${harmony×100}% | Cosmic: ${cosmic×100}%. ` +
  `Wachstumsraum: ${growthEdge.label} (Delta ${delta×100}%)`
```

---

## 9. Extensibility Hooks

### 9.1 Overlay Mode (Two Signatures)

Given signature A and B:
```
delta_overlay[e] = |strength_A[e] - strength_B[e]|
resonance[e] = 1 - delta_overlay[e]
friction_overlay[e] = delta_overlay[e] × (1 - harmony_A) × (1 - harmony_B)
```
- Green edges = mutual resonance
- Red edges = friction zones
- Yellow = growth complementarity

### 9.2 Temporal Evolution

```
strength_t[e] = strength_0[e] + ∫(transit_influence[planet→e]) dt
```
*Track delta trajectories over time for "signature biography".*

### 9.3 Intent Injection

User sets focus element `f`:
```
strength'[f] = min(1.0, strength[f] + intent_boost)
delta'[f] = delta[f] × (1 - intent_alignment)
```
*Conscious intention reshapes the unconscious structure.*

---

## 10. Implementation Reference

**Core File:** `shared/vector-mapper.ts`

| Function | Purpose |
|----------|---------|
| `fuseWuXing(western, bazi)` | Core fusion (Eq 3.1) |
| `computeDeltas(western, bazi)` | Delta calculation (Eq 3.3) |
| `buildElements(fused, western, bazi, deltas)` | Node construction (Sec 4) |
| `buildEdges(elements)` | Cycle edges + friction (Sec 4) |
| `build3DPositions(elements)` | Spatial layout (Sec 5) |
| `mapFuFirEToSignature(apiOutput)` | Full pipeline (Sec 6+) |

---

## 11. Validation Tests

```javascript
// Symmetry
assert(fuse(0.5, 0.8) === fuse(0.8, 0.5))

// Boundary
assert(fuse(0, 0) === 0)
assert(fuse(1, 1) === 1)

// Dominance bonus
assert(fuse(0, 1) === 0.3)  // max bonus when one is zero
assert(fuse(0.5, 0) === 0.15)

// Monotonicity
assert(fuse(0.4, 0.6) < fuse(0.5, 0.6))
assert(fuse(0.5, 0.6) < fuse(0.5, 0.7))

// Delta
assert(computeDeltas({holz:0.8}, {holz:0.3}).holz === 0.5)
```

---

*This document is the mathematical specification. All visual prototypes derive from these formulas.*
