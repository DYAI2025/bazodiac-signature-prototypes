/**
 * Unified Signature Shell
 * Handles prototype switching and HUD updates
 */

const PROTOTYPES = {
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

const MOCK_DATA = {
    harmony: 0.78,
    cosmicState: 0.42,
    dominant: 'Feuer',
    growthEdge: 'Wachstumsraum: Metall (Delta 42% - West und Bazi divergieren hier)',
    archetypes: [
        { name: 'Der Pionier', resonance: 0.85, narrative: 'Starke Expansionskraft und Vision' },
        { name: 'Der Anker', resonance: 0.45, narrative: 'Stabilität in Zeiten des Wandels' },
        { name: 'Der Weise', resonance: 0.62, narrative: 'Tiefe intuitive Einsicht' },
        { name: 'Der Schatten', resonance: 0.31, narrative: 'Unerforschte emotionale Tiefe' }
    ],
    wuxing: {
        holz: { strength: 0.7, color: '#4a7c59', symbol: '☳' },
        feuer: { strength: 0.9, color: '#d43d3d', symbol: '☲' },
        erde: { strength: 0.5, color: '#8b6914', symbol: '☶' },
        metall: { strength: 0.3, color: '#c0c0c0', symbol: '☴' },
        wasser: { strength: 0.6, color: '#3d6fb4', symbol: '☵' }
    }
};

function initHUD() {
    // 1. Set Growth Edge
    document.getElementById('growth-edge').innerText = MOCK_DATA.growthEdge;

    // 2. Build Archetypes
    const archPanel = document.getElementById('archetypes-panel');
    MOCK_DATA.archetypes.forEach(arch => {
        const card = document.createElement('div');
        card.className = 'archetype-card';
        card.innerHTML = `
            <div class="label"><span>${arch.name}</span> <span>${(arch.resonance * 100).toFixed(0)}%</span></div>
            <div class="resonance-bg"><div class="resonance-fill" style="width: ${arch.resonance * 100}%"></div></div>
            <div class="narrative">${arch.narrative}</div>
        `;
        archPanel.appendChild(card);
    });

    // 3. Build WuXing
    const wuxingPanel = document.getElementById('wuxing-panel');
    Object.entries(MOCK_DATA.wuxing).forEach(([id, data]) => {
        const row = document.createElement('div');
        row.className = 'wuxing-row';
        row.innerHTML = `
            <div class="symbol">${data.symbol}</div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${data.strength * 100}%; background: ${data.color}"></div></div>
        `;
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

document.addEventListener('DOMContentLoaded', () => {
    initHUD();
    
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

    // Start with Membrane
    switchPrototype('membrane');
});
