# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Visual prototypes for the "Bazodiac Signature" — a 5D/13D WuXing (Western astrology × Bazi) identity vector rendered as Three.js scenes. Three competing visual metaphors for the same underlying data:

- `prototypes/signature/` — **Bazodiac Signatur (the unified show-piece)**: composes the DNA of the other three — GPU-shader cymatic point-shell core (5 element standing waves from the fused vector), WuXing pentagon with animated Shēng/Kè cycle arcs and traveling pulses, membrane-style ground echo. Adds live dynamics (`shared/dynamics.js`: NOAA SWPC Kp feed with visible SIMULIERT fallback, re-fusion via `applyDynamics`) and a Match mode (`computeOverlay` per MATHEMATICS.md §9.1 against `data/partner_profile.json`, Kohärenz = cosine similarity — no fake match scores).
- `prototypes/membrane/` — Gravitational Membrane: deformed `PlaneGeometry`, identity nodes as masses curving the mesh.
- `prototypes/sphere/` — Cymatic Resonance Sphere: particle system, frequency-driven Chladni-style patterns.
- `prototypes/nebula/` — Bioluminescent Neuro-Nebula: graph of glowing nodes/filaments.

Each prototype is a standalone, independently loadable HTML+JS app. `index.html` + `shell.js` + `shell.css` is the unified shell that iframes each prototype and renders the shared HUD (archetype panel, WuXing bars, growth-edge narrative, prototype switcher).

## Running

No build step, no package.json — plain ES modules served as static files. Use any static server, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` for the unified shell, or open a prototype directly, e.g. `http://localhost:8000/prototypes/membrane/index.html`.

`lib/three/` vendors `three.module.js` and `OrbitControls.js` directly (no npm/CDN dependency) — all prototype `main.js` files import from `../../../lib/three/...`.

## Architecture

**Data flow:** `data/user_profile.json` (FuFirE API shape: `wu_xing_vectors.western_planets` + `wu_xing_vectors.bazi_pillars` + `harmony_index` + `cosmic_state`) → `shared/signature-data.js` fuses West+Bazi per element into a signature object (5 elements, generation/control-cycle edges, 3D pentagon positions, 13D vector, dominant element, growth-edge/delta narrative) → consumed directly by all three prototype renderers and the shell HUD via `loadSignature('/data/user_profile.json')`.

`shared/vector-mapper.ts` and `shared/theme.ts` are the original TypeScript specs (kept as documentation/reference); since there's no build step, `shared/signature-data.js` is a hand-ported vanilla-JS twin of the same fusion math actually imported at runtime by `shell.js` and `prototypes/*/main.js`. Keep the two in sync if the fusion formulas change — `MATHEMATICS.md` is the canonical spec both implementations follow. `shared/gfx.js` holds shared rendering helpers (glow sprites, starfield, renderer tone-mapping setup) reused across all three prototypes.

Paths are root-relative (`/data/user_profile.json`, `../../shared/...` from `prototypes/<name>/main.js`), so prototypes must be served from the repo root — opening a prototype's `index.html` via `file://` will fail the fetch and module resolution.

**Fusion math** (`shared/vector-mapper.ts`):
- `fuseWuXing`: per-element `strength = sqrt(west * bazi) + 0.3 * max(west, bazi)` — both systems must agree for high strength, but a dominant single system still registers.
- `computeDeltas`: `|west - bazi|` per element — high delta = "growth edge" (where the two systems diverge), surfaced in the HUD narrative.
- WuXing generation cycle (Holz→Feuer→Erde→Metall→Wasser→Holz) and control cycle drive the graph edges drawn between elements.
- `build3DPositions`: pentagon layout in XZ, height (Y) = element strength.

**Theme** (`shared/theme.ts`): "Dark Luxury" palette (obsidian/gold/silver) as the canonical source; also exports `generateCSS()` to emit the same variables as a raw CSS string for non-bundled pages. `shell.css` and each prototype's inline `<style>` currently hardcode the same hex values independently — keep these in sync by hand if the palette changes.

**Shell prototype-switching** (`shell.js`): prototypes are loaded into `#viewport` via `<iframe src="...">`, swapped with a fade (innerHTML replace + opacity transition), not a SPA router. HUD data (`MOCK_DATA` in `shell.js`) is currently static/mocked, independent of each iframe's own internal mock data.

**Per-prototype controls:** sliders for "Cosmic Weather" and "Identity Tension" (or equivalent) live in each prototype's own HTML, read directly by that prototype's `main.js` `animate()` loop — they are not wired to the shell or to `vector-mapper.ts` deltas.
