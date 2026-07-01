# Development Plan: Bazodiac Signature Prototypes

## Goal
Create three visually distinct, mathematically driven prototypes for the "Signatur" based on the FuFirE 13D vector. The goal is to translate abstract astrological/psychological data into a "visual language of resonance and friction."

## Core Mathematical Bridge (The Input)
The input is a 13D vector:
- 7 Natal Planet Weights (Core Identity)
- 6 Quiz Dimensions (Adaptive Persona)
- Modulators: Cosmic Weather (NASA API) & Personal Inputs (Semantic Brain)

## Prototype Architectures

### 1. Gravitational Membrane (The Fabric of Being)
- **Visuals:** A 3D elastic grid/mesh.
- **Logic:** Identity nodes as mass points. Mass = Weight of the dimension.
- **Harmony:** Smooth Gaussian curvature, deep basins.
- **Friction:** Sharp spikes, folding, surface tension.
- **Weather:** Sine-wave oscillations affecting the mesh height.

### 2. Cymatic Resonance Sphere (The Harmonic Core)
- **Visuals:** A sphere of 10k+ particles.
- **Logic:** Chladni-style patterns. Frequencies derived from the 13D vector.
- **Harmony:** High symmetry, crystalline structures.
- **Friction:** Asymmetry, fractal distortion, particle "jitter".
- **Weather:** Frequency shifts (e.g., a solar flare increases the "noise" in the frequency).

### 3. Bioluminescent Neuro-Nebula (The Living Network)
- **Visuals:** A graph-based network of filaments and nodes.
- **Logic:** Gravitational attraction between nodes. Weight = Filament thickness.
- **Harmony:** Stable, pulsing, coherent light-bridges.
- **Friction:** Electric sparks, repellent gaps, rapid color shifts.
- **Weather:** Light pulses traveling through the network.

## Execution Roadmap

### Phase 1: Shared Infrastructure
- [ ] Create `shared/vector-mapper.ts`: Logic to normalize 13D vector to 0-1 ranges for visual parameters.
- [ ] Create `shared/theme.ts`: Define "Dark Luxury" color palette (Obsidian, Gold, Silver).

### Phase 2: Prototype Development (Iterative Loops)
- [ ] **Membrane:** Implement Three.js PlaneGeometry with custom vertex shaders for deformation.
- [ ] **Sphere:** Implement ParticleSystem with attractor logic and frequency-based positioning.
- [ ] **Nebula:** Implement a 3D graph with Line segments and glowing nodes.

### Phase 3: Fusion & Coherence
- [ ] Implement "Overlay Mode": Load two signatures and visualize the Delta (the "Friction Field").
- [ ] Implement "Cosmic Modulation": Connect NASA-style weather parameters to visual modifiers.

### Phase 4: Final Polish & Deployment
- [ ] Create a unified `index.html` wrapper.
- [ ] Final push and verification of visual impact.
