/**
 * Unified Signature Shell
 * Handles prototype switching and HUD updates
 */
import { loadSignature, ELEMENT_META, ELEMENT_ORDER } from './shared/signature-data.js';

const PROTOTYPES = {
    signature: {
        url: 'prototypes/signature/index.html',
        title: 'Bazodiac Signatur',
        subtitle: 'The Living Signature'
    },
    membrane: {
        url: 'prototypes/membrane/index.html',
        title: 'Gravitational Membrane',
        subtitle: 'The Fabric of Being'
    },
    sphere: {
        url: 'prototypes/sphere/index.html',
        title: 'Cymatic Sphere',
        subtitle: 'The Harmonic Core'
    },
    nebula: {
        url: 'prototypes/nebula/index.html',
        title: 'Neuro Nebula',
        subtitle: 'The Living Network'
    }
};

// Archetypes have no defined math in MATHEMATICS.md — kept as illustrative copy.
const ARCHETYPES = [
    { name: 'Der Pionier', resonance: 0.85, narrative: 'Starke Expansionskraft und Vision' },
    { name: 'Der Anker', resonance: 0.45, narrative: 'Stabilität in Zeiten des Wandels' },
    { name: 'Der Weise', resonance: 0.62, narrative: 'Tiefe intuitive Einsicht' },
    { name: 'Der Schatten', resonance: 0.31, narrative: 'Unerforschte emotionale Tiefe' }
];

function colorHex(intColor) {
    return '#' + intColor.toString(16).padStart(6, '0');
}

function initHUD(signature) {
    // 1. Growth Edge (MATHEMATICS.md §6.4 — element with max West/Bazi delta)
    document.getElementById('growth-edge').innerText = `Wachstumsraum: ${signature.growthEdgeLabel}`;

    // 2. Header metrics
    document.getElementById('shell-subtitle').innerText = 'Fusion Engine Active';
    const dom = ELEMENT_META[signature.dominant];
    document.querySelector('.header .metrics').innerText =
        `SYSTEM ACTIVE | DOMINANT ${dom.label.toUpperCase()} | HARMONY ${(signature.harmony * 100).toFixed(0)}% | COSMIC STATE ${signature.cosmicState.toFixed(2)}`;

    // 3. Archetypes (illustrative, not math-driven)
    const archPanel = document.getElementById('archetypes-panel');
    ARCHETYPES.forEach(arch => {
        const card = document.createElement('div');
        card.className = 'archetype-card';
        card.innerHTML = `
            <div class="label"><span>${arch.name}</span> <span>${(arch.resonance * 100).toFixed(0)}%</span></div>
            <div class="resonance-bg"><div class="resonance-fill" style="width: ${arch.resonance * 100}%"></div></div>
            <div class="narrative">${arch.narrative}</div>
        `;
        archPanel.appendChild(card);
    });

    // 4. WuXing bars — fused strength per element (MATHEMATICS.md §3.1), from real signature
    const wuxingPanel = document.getElementById('wuxing-panel');
    ELEMENT_ORDER.forEach(id => {
        const el = signature.elements.find(e => e.id === id);
        const meta = ELEMENT_META[id];
        const row = document.createElement('div');
        row.className = 'wuxing-row';
        row.title = el.narrative;

        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.textContent = meta.symbol;

        const barBg = document.createElement('div');
        barBg.className = 'bar-bg';
        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        barFill.style.width = `${el.strength * 100}%`;
        barFill.style.background = colorHex(meta.color);
        barBg.appendChild(barFill);

        row.append(symbol, barBg);
        wuxingPanel.appendChild(row);
    });
}

function switchPrototype(id) {
    const viewport = document.getElementById('viewport');
    const currentIframe = viewport.querySelector('iframe');
    
    if (currentIframe) {
        currentIframe.style.opacity = '0';
        setTimeout(() => {
            viewport.innerHTML = `<iframe src="${PROTOTYPES[id].url}" style="opacity: 0"></iframe>`;
            const nextIframe = viewport.querySelector('iframe');
            nextIframe.onload = () => {
                nextIframe.style.opacity = '1';
            };
        }, 800);
    } else {
        viewport.innerHTML = `<iframe src="${PROTOTYPES[id].url}"></iframe>`;
    }

    // Update UI
    document.querySelectorAll('.proto-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === id);
    });
    
    document.querySelector('.brand .title').innerText = PROTOTYPES[id].title;
    document.querySelector('.brand .subtitle').innerText = PROTOTYPES[id].subtitle;
}

document.addEventListener('DOMContentLoaded', async () => {
    const signature = await loadSignature();
    initHUD(signature);

    // Init Switcher
    const switcher = document.getElementById('proto-switcher');
    Object.keys(PROTOTYPES).forEach(id => {
        const btn = document.createElement('button');
        btn.className = 'proto-btn';
        btn.dataset.id = id;
        btn.innerText = id;
        btn.onclick = () => switchPrototype(id);
        switcher.appendChild(btn);
    });

    // Start with the unified signature
    switchPrototype('signature');
});
