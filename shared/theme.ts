/**
 * theme.ts – Dark Luxury Design System für Bazodiac Signatures
 *
 * Aesthetic: Obsidian + Gold + Silber
 * "The universe is not cold – it radiates in frequencies we can feel but not name."
 */

export const PALETTE = {
  // Basics
  void:        '#050505',  // Hintergrund – das Nichts
  obsidian:    '#1a1a1a',  // Oberflächen
  obsidianLt:  '#2a2a2a',  // Hover-Oberflächen

  // Luxus-Akzente
  gold:        '#d4af37',  // Primärer Goldton
  goldBright:  '#ffdf00',  // Helles Gold – Highlights
  goldDim:     '#8b7500',  // Gedämpftes Gold
  silver:      '#c0c0c0',  // Silber – sekundär
  platinum:    '#e5e4e2',  // helles Silber

  // Zustandsfarben
  friction:    '#ff4444',  // Reibung, Spannung, Konflikt
  harmony:     '#44ff88',  // Resonanz, Fluss, Leichtigkeit
  neutral:     '#4488cc',  // Neutrate, Brücken
  mystery:     '#8b5cf6',  // Mysterium, Transzendenz

  // Text
  text:        '#e0e0e0',  // Primärtext
  textDim:     '#888888',  // Sekundärtext
  textMuted:   '#555555'   // Gedimmt
} as const;

export const GLOW = {
  gold:    '0 0 20px rgba(212, 175, 55, 0.5)',
  friction:'0 0 25px rgba(255, 68, 68, 0.6)',
  harmony: '0 0 25px rgba(68, 255, 136, 0.5)',
  mystery: '0 0 30px rgba(139, 92, 246, 0.4)'
} as const;

export const FONT = {
  display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  body:    '"Inter", "SF Pro", -apple-system, sans-serif',
  mono:    '"JetBrains Mono", "Fira Code", monospace'
} as const;

/**
 * Archetypen-Farben (konsistent mit vector-mapper.ts)
 */
export const ARCHETYPEN_COLORS: Record<string, string> = {
  stern:    '#d4af37',
  schatten: '#8b0000',
  wurzel:   '#4a6741',
  bruecke:  '#708090'
};

/**
 * Erzeugt eine CSS-Datei als String (für Offline-Nutzung).
 */
export function generateCSS(): string {
  return `
/* ═══════════════════════════════════════════════
   Bazodiac Signature – Dark Luxury Theme
   ═══════════════════════════════════════════════ */

:root {
  --void:       ${PALETTE.void};
  --obsidian:   ${PALETTE.obsidian};
  --obsidian-lt:${PALETTE.obsidianLt};
  --gold:       ${PALETTE.gold};
  --gold-bright:${PALETTE.goldBright};
  --gold-dim:   ${PALETTE.goldDim};
  --silver:     ${PALETTE.silver};
  --platinum:   ${PALETTE.platinum};
  --friction:   ${PALETTE.friction};
  --harmony:    ${PALETTE.harmony};
  --neutral:    ${PALETTE.neutral};
  --mystery:    ${PALETTE.mystery};
  --text:       ${PALETTE.text};
  --text-dim:   ${PALETTE.textDim};
  --text-muted: ${PALETTE.textMuted};
  --glow-gold:  ${GLOW.gold};
  --font-display: ${FONT.display};
  --font-body:    ${FONT.body};
  --font-mono:    ${FONT.mono};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--void);
  color: var(--text);
  font-family: var(--font-body);
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

/* Prototype Canvas */
#canvas-container {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1;
}

/* HUD Overlay */
#hud {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 10;
  pointer-events: none;
}

#hud > * { pointer-events: auto; }

/* Archetypen-Panel (links) */
#archetypes-panel {
  position: absolute;
  top: 80px;
  left: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
}

.archetype-card {
  background: rgba(26, 26, 26, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.archetype-card:hover {
  border-color: var(--gold);
  box-shadow: var(--glow-gold);
}

.archetype-card .label {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 1px;
  color: var(--gold-bright);
}

.archetype-card .resonance {
  height: 3px;
  background: var(--obsidian-lt);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.archetype-card .resonance-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s ease;
}

.archetype-card .narrative {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 6px;
  line-height: 1.4;
}

/* Coherence-Mitteilung (zentriert) */
#coherence-display {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

#coherence-display .title {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--gold);
  letter-spacing: 2px;
}

#coherence-display .metrics {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 4px;
}

/* Prototyp-Switcher (unten) */
#proto-switcher {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  padding: 6px;
  backdrop-filter: blur(10px);
}

#proto-switcher button {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: var(--font-body);
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

#proto-switcher button.active {
  background: var(--gold);
  color: var(--void);
  font-weight: 600;
}

#proto-switcher button:hover:not(.active) {
  background: var(--obsidian-lt);
  color: var(--text);
}

/* WuXing-Balken (rechts unten) */
#wuxing-panel {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.wuxing-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wuxing-row .name {
  font-size: 11px;
  width: 60px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wuxing-row .bar-bg {
  flex: 1;
  height: 4px;
  background: var(--obsidian-lt);
  border-radius: 2px;
  overflow: hidden;
}

.wuxing-row .bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* Growth Edge (unten zentiert) */
#growth-edge {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--text-dim);
  text-align: center;
  max-width: 400px;
  opacity: 0.8;
}
`;
}
