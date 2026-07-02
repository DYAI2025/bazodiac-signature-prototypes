/**
 * dynamics.js — Live-State-Engine für die dynamische Signatur
 * (DYNAMIC_SIGNATURE_CONCEPT.md, Layer 1 + 2).
 *
 * Pollt echtes Space Weather (NOAA SWPC planetarer Kp-Index) und emittiert
 * periodisch einen Zustand, der via applyDynamics() (shared/signature-data.js)
 * auf die Eingangsvektoren angewendet werden kann. Fällt der Feed aus, wird
 * NIE geworfen, sondern ein klar als 'simuliert' markierter, deterministischer
 * Fallback emittiert (Anti-Fabrication: jede Zahl trägt ihre Quelle).
 *
 * Transit-Deltas sind derzeit ein deterministischer Platzhalter (langsame
 * Sinusfunktionen über das Datum), bis FuFirE /v1/transit/state angebunden
 * ist — im State entsprechend als simuliert gekennzeichnet.
 */

import { ELEMENT_ORDER } from './signature-data.js';

const NOAA_KP_URL = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
const FETCH_TIMEOUT_MS = 8000;

const clamp01 = v => Math.min(1, Math.max(0, v));

/** Letzten Kp-Wert vom NOAA-SWPC-Feed holen; normalized = clamp01(kp/9). */
async function fetchCosmicWeather() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(NOAA_KP_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) throw new Error('Leere NOAA-Antwort');
        const kp = Number(rows[rows.length - 1].kp_index);
        if (!Number.isFinite(kp)) throw new Error('kp_index fehlt/ungültig');
        return { normalized: clamp01(kp / 9), kp, source: 'noaa' };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Deterministischer Fallback: glattes Pseudo-Rauschen aus zwei langsamen
 * Sinusfunktionen (Perioden ~10 min und ~37 min), Wertebereich 0.15..0.75.
 * Rein zeitgetrieben (Date.now()) — reproduzierbar, nie zufällig.
 */
function simulatedCosmicWeather(nowMs) {
    const t = nowMs / 1000; // Sekunden
    const s = Math.sin((2 * Math.PI * t) / 600) + Math.sin((2 * Math.PI * t) / 2220);
    // s ∈ [-2, 2] → normalized ∈ [0.15, 0.75]
    const normalized = 0.45 + (s / 2) * 0.30;
    return { normalized: clamp01(normalized), source: 'simuliert' };
}

/**
 * Simulierte Transit-Deltas: pro Element eine langsame Sinusfunktion über das
 * aktuelle Datum (Perioden im Tagesmaßstab, 9–25 Tage, Phase über den
 * Element-Index geseedet), Amplitude 0.06 (≤ 0.08, hart unter dem
 * Transit-Bound ±0.10 aus DYNAMIC_SIGNATURE_CONCEPT.md).
 *
 * Platzhalter, bis FuFirE /v1/transit/state angebunden ist.
 */
function simulatedTransitDeltas(nowMs) {
    const days = nowMs / 86400000;
    const western = {};
    ELEMENT_ORDER.forEach((el, i) => {
        const periodDays = 9 + i * 4;   // 9, 13, 17, 21, 25 Tage
        const phase = i * 1.7;          // Seed über Element-Index
        const delta = 0.06 * Math.sin((2 * Math.PI * days) / periodDays + phase);
        western[el] = Math.round(delta * 1000) / 1000;
    });
    return { western };
}

/**
 * Startet die Dynamik-Engine: emittiert sofort und dann alle intervalMs einen
 * State über onState. Wirft nie — bei Feed-Fehlern kommt der simulierte
 * Fallback (source: 'simuliert').
 *
 * State-Shape:
 *   {
 *     cosmic_weather: { normalized: 0..1, kp?: number, source: 'noaa'|'simuliert' },
 *     transit_deltas: { western: { holz: ±0.06, ... } },
 *     transit_source: 'simuliert (FuFirE-Transit-API noch nicht angebunden)',
 *     as_of: ISO-String
 *   }
 *
 * @param {{ onState: (state: object) => void, intervalMs?: number }} options
 * @returns {{ stop: () => void }}
 */
export function startDynamics({ onState, intervalMs = 5 * 60 * 1000 } = {}) {
    if (typeof onState !== 'function') {
        console.warn('[dynamics] startDynamics ohne onState-Callback — Engine läuft leer.');
        onState = () => {};
    }

    let stopped = false;

    async function tick() {
        if (stopped) return;
        const now = Date.now();

        let cosmicWeather;
        try {
            cosmicWeather = await fetchCosmicWeather();
        } catch (err) {
            console.warn('[dynamics] NOAA-Feed nicht erreichbar, simulierter Fallback:', err?.message ?? err);
            cosmicWeather = simulatedCosmicWeather(now);
        }
        if (stopped) return;

        try {
            onState({
                cosmic_weather: cosmicWeather,
                transit_deltas: simulatedTransitDeltas(now),
                transit_source: 'simuliert (FuFirE-Transit-API noch nicht angebunden)',
                as_of: new Date(now).toISOString()
            });
        } catch (err) {
            console.warn('[dynamics] onState-Callback hat geworfen:', err?.message ?? err);
        }
    }

    tick();
    const timer = setInterval(tick, intervalMs);

    return {
        stop() {
            stopped = true;
            clearInterval(timer);
        }
    };
}
