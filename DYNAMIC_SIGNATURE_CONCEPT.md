# Dynamische Bazodiac-Signatur — Architektur-Konzept

> Wie aus der statischen, geburtschart-basierten Signatur (MATHEMATICS.md) eine **lebende,
> zeitveränderliche Signatur** wird — jede Veränderung plausibel und auditierbar aus Rohdaten
> ableitbar, nichts erfunden.
>
> Quellenbasis: MATHEMATICS.md + shared/signature-data.js (dieses Repo), SemanticMind-Vault
> Seiten `astro-noctum` und `fufire` (Stand 29.06.2026). Als `[unverifiziert]` markierte
> Punkte wurden nicht live geprüft.

---

## 1. Grundprinzip: Statischer Kern, geschichtete Modulation

Die Astro-Noctum-Architektur beschreibt bereits ein dreischichtiges autopoietisches Modell
(„Obsidian Core / Neural Myzel / Bioluminescent Membrane"): deterministischer Kern,
modulierende Ereignisse, adaptive Oberfläche. Das Konzept hier operationalisiert genau das:

```
Signatur(t) = Fusion( W(t), B(t) )        ← Fusionsformel bleibt UNVERÄNDERT (§3.1)

W(t) = clamp01( W₀ + ΔW_transit(t) + ΔW_quiz(t) + ΔW_agent(t) )
B(t) = clamp01( B₀ + ΔB_quiz(t) + ΔB_agent(t) )
cosmicState(t) = normiertes Live-Space-Weather                  (§6.2, war bisher statisch)
```

**Kerninvariante (Anti-Fabrication):** Moduliert werden ausschließlich die *Eingangsvektoren*
W (westlich) und B (Bazi/Quiz), niemals das Fusionsergebnis direkt. Dadurch bleiben alle
abgeleiteten Größen (strength, delta, harmony, growthEdge, Kanten, 3D-Layout) automatisch
konsistent zur kanonischen Mathematik — und jede Veränderung ist bis zum Rohdatum rückverfolgbar.

**Beschränktheit:** Jeder Modulator ist hart begrenzt (`|Δ| ≤ α_i`), Summe aller α ≤ 0.35.
Der Natal-Kern dominiert immer — die Signatur „atmet", sie mutiert nicht.

| Layer | Quelle (Rohdaten) | Kadenz | Bound α | Halbwertszeit |
|---|---|---|---|---|
| 0 Natal-Kern | Geburtsdaten → FuFirE `/v1/calculate/fusion` | einmalig | — | ∞ (immutable) |
| 1 Transite | FuFirE `/v1/transit/state`, `/v1/experience/signature-delta` | täglich | 0.10 | — (stichtagsbezogen) |
| 2 Cosmic Weather | NOAA SWPC / NASA DONKI / GFZ Kp (via Astro-Noctum `GET /api/space-weather`) | Minuten–Stunden | 0.05 auf W, primär → cosmicState | — (Momentwert) |
| 3 Quiz | ContributionEvents + AFFINITY_MAP (Astro-Noctum, Supabase `contribution_events`) | pro Quiz-Event | 0.10 | ∞ (kumulativ, sättigend) |
| 4 Agent-Gespräche | Supabase `agent_conversations` → Marker-Extraktion | pro Session | 0.10 | ~7 Tage (exponentieller Decay) |
| 5 Die 7 Hypothesen (Eve & Levi) | **NICHT GEFUNDEN — siehe §7** | — | — | — |

---

## 2. Die Layer im Detail

### Layer 0 — Natal-Kern (deterministisch, für immer cachebar)

Exakt der heutige Stand: FuFirE berechnet aus Geburtszeit/-ort BaZi-Säulen + westliches Chart,
projiziert beide in den WuXing-Raum (`wu_xing_vectors.western_planets`, `bazi_pillars`) und
liefert `harmony_index` + `contribution_ledger`. `shared/signature-data.js` konsumiert das 1:1.
Nichts ändert sich — W₀, B₀ und der 13D-Basisvektor (7 Planeten + 6 Quiz-Dimensionen) sind der Anker.

### Layer 1 — Transite (die Planeten von HEUTE gegen das Natal-Chart)

FuFirE hat bereits `/v1/transit/now`, `/v1/transit/state`, `/v1/transit/timeline` und
`/v1/experience/signature-delta`. Die heutigen Planetenpositionen werden durch **dieselbe**
Planet→Element-Tabelle (MATHEMATICS.md §2.1) projiziert wie die natalen:

```
ΔW_transit[e] = α_T × ( transit_element[e] − natal_western[e] ) × aspekt_gewicht
```

`aspekt_gewicht` ∈ [0,1] aus der Aspektstärke Transit↔Natal (FuFirE berechnet Aspekte bereits).
Das ist MATHEMATICS.md §9.2 („Temporal Evolution") in konkret.

### Layer 2 — Cosmic Weather (NASA/NOAA live)

Der Astro-Noctum-Express-Server hat dokumentierte Endpunkte: `GET /api/space-weather`,
`/extended`, `/timeline`, `/aurora` — gespeist aus NASA APOD/DONKI, NOAA SWPC, GFZ Kp,
JPL Horizons, astronomy-engine. Die Prototypen sollten **diesen Gateway** nutzen (CORS,
Caching, Key-Handling liegen dort), nicht NASA direkt.

Normalisierung zu einem Skalar (Vorschlag, kalibrierbar):

```
cosmicState(t) = clamp01( 0.5 × Kp/9  +  0.3 × norm(solar_wind_speed)  +  0.2 × flare_activity )
```

Wirkung wie in §6.2/§7 spezifiziert: Animationsintensität, Oszillation, Puls-Rate — plus
optional ein kleiner globaler Gain auf W (α_C ≤ 0.05), damit „Sturm" auch strukturell spürbar ist.
Live-Status der konkreten Feeds: `[unverifiziert]` — Endpunkte sind in der Astro-Noctum-Doku
belegt, wurden hier aber nicht abgerufen.

### Layer 3 — Quiz-Ergebnisse

Astro-Noctum modelliert Quizantworten bereits als `ContributionEvent` mit Markern
(z. B. `marker.love.physical_touch`) und verteilt sie über `AFFINITY_MAP` auf Sektoren.
Für die 5D-Signatur: Marker → Quiz-Dimensionen 8–13 des 13D-Vektors → Elementbeiträge
(MATHEMATICS.md §2.2). Analog zur Fusion-Ring-Logik (T-Gewicht springt von 0 auf 0.2, sobald
Tests abgeschlossen sind) wird der Quiz-Layer erst mit abgeschlossenen Modulen aktiv:

```
ΔB_quiz[e] = α_Q × completed_ratio × ( quiz_element[e] − B₀[e] )
```

Kumulativ und sättigend — mehr beantwortete Module = schärferes, nicht wilderes Bild.

### Layer 4 — Agent-Gespräche

Supabase-Tabelle `agent_conversations` (Gesprächszusammenfassungen der Voice-Agenten) existiert;
Astro-Noctum hat `POST /api/analyze/conversation` (Dialogmarker-Analyse). Extrahierte Marker
laufen durch dieselbe AFFINITY_MAP wie Quiz-Marker, aber mit **Decay**:

```
ΔW/B_agent[e](t) = α_A × Σᵢ markerᵢ[e] × 2^(−(t−tᵢ)/7d)
```

Ein intensives Gespräch färbt die Signatur eine Woche, dann kehrt sie zum Anker zurück.
„Lebendig, aber verankert."

### Layer 5 — Die 7 Hypothesen als interpretive Linsen

Konzeptioneller Platzhalter: Hypothesen wirken nicht als Vektormodulation, sondern als
**Prioren für die Narrativ-Erzeugung** (§8) — welche Deutung aus denselben Zahlen erzählt wird.
Inhalt: siehe §7 (offen).

---

## 3. Auditierbarkeit: Der Dynamik-Ledger

FuFirE liefert bereits einen `contribution_ledger` für den Natal-Kern. Jeder Modulator schreibt
analog einen Eintrag — **keine Zahl ohne Herkunft** (Anti-Fabrication-Prinzip aus dem
DYAI-Konzeptgraph):

```json
{ "source": "noaa_swpc_kp", "raw": 5.33, "mapped_delta": { "cosmicState": 0.59 },
  "timestamp": "2026-07-02T02:00:00Z", "rule": "kp/9*0.5+..." }
```

---

## 4. JSON-Envelope (Erweiterung von `data/user_profile.json`)

Abwärtskompatibel: bestehende Felder unverändert, neues `dynamics`-Objekt:

```json
{
  "wu_xing_vectors": { "western_planets": {...}, "bazi_pillars": {...} },
  "harmony_index": { "harmony_index": 0.62 },
  "cosmic_state": 0.5,
  "contribution_ledger": { "western": [...] },

  "dynamics": {
    "as_of": "2026-07-02T02:00:00Z",
    "cosmic_weather": { "kp": 3.2, "normalized": 0.36, "source": "astro-noctum:/api/space-weather" },
    "transit_deltas":  { "western": { "feuer": +0.04, "wasser": -0.02 } },
    "quiz_deltas":     { "bazi": { "metall": +0.06 }, "completed_ratio": 0.5 },
    "agent_deltas":    { "western": { "holz": +0.03 }, "half_life_days": 7 },
    "ledger": [ ... ]
  }
}
```

`shared/signature-data.js` bekommt eine Funktion `applyDynamics(base, dynamics)` →
addiert die Deltas gebounded auf W₀/B₀, ruft dann die unveränderte `computeSignature`-Pipeline.
Fehlt `dynamics` (offline / heutige Daten), rendert alles wie bisher. **Fail-visible:** wenn ein
Layer nicht ladbar ist, zeigt die HUD „Layer X: offline" statt stillem Fallback.

## 5. Prototyp-Integration: Slider werden Live-Anzeigen mit Override

Heute sind die Regler (Cosmic Weather / Harmony / Friction / …) reine Handeingaben. Neu:

1. **Live-Modus (Default):** Slider zeigen den berechneten Ist-Wert (cosmicState(t), harmony(t), mean-delta(t)) und wandern selbst.
2. **Override:** Nutzer zieht den Slider → Layer pausiert, manueller Wert gilt (heutiges Verhalten), Reset-Knopf kehrt zu Live zurück.
3. Polling: Gateway-Endpoint alle 5 min (Space Weather), Transite 1×/Tag, Quiz/Agent event-getrieben (oder Supabase Realtime).

## 6. Service-Landkarte (was existiert, was fehlt)

| Baustein | Status | Quelle |
|---|---|---|
| Deterministische Chart-/Fusionsrechnung | ✅ FuFirE (`/v1/calculate/fusion`), RC1 | Vault `fufire` |
| Transit-Engine | ✅ FuFirE `/v1/transit/*`, `/v1/experience/signature-delta` | Vault `fufire` |
| Space-Weather-Gateway | ✅ dokumentiert in Astro-Noctum `server.mjs` | Vault `astro-noctum` |
| Quiz→Marker→Sektor-Pipeline | ✅ ContributionEvents + AFFINITY_MAP + `/api/contribute` | Vault `astro-noctum` |
| Agent-Gesprächs-Summaries | ✅ `agent_conversations` + `/api/analyze/conversation` | Vault `astro-noctum` |
| Live-Verfügbarkeit aller Dienste | `[unverifiziert]` — nicht abgerufen | — |
| `applyDynamics` in signature-data.js + vector-mapper.ts | ❌ zu bauen (klein) | dieses Repo |
| Dynamics-Aggregator (baut das `dynamics`-Objekt) | ❌ zu bauen — logischer Ort: Astro-Noctum-Gateway oder FuFirE `/v1/experience/*` | — |
| Slider-Live-Modus in den 3 Prototypen | ❌ zu bauen (klein) | dieses Repo |

## 7. Offene Punkte

1. **Die 7 Hypothesen von Eve & Levi wurden nirgends gefunden** — nicht im SemanticMind-Vault,
   nicht in `~/Bazodiac-signatur_5D`, nicht per Volltext in den Projekt-Wikis; gbrain war wegen
   ungültigem Token nicht abfragbar (gleicher Dokumentenbestand wie der Vault). Sie werden hier
   bewusst **nicht erfunden**. → Benjamin: Quelle nennen (Notion? Agent-Chat-Log? gbrain-Seite
   von Hermes?), dann werden sie als Layer-5-Linsen formalisiert.
2. gbrain-MCP-Token ist abgelaufen/rotiert (401) — betrifft vermutlich auch Hermes' Memory-Hooks.
3. Kalibrierung der α-Bounds und der cosmicState-Formel braucht echte Feed-Daten (erst Live-Smoke,
   dann Tuning — „nothing is true until it runs").
4. FuFirE-Live-Deployment (api.fufire.space vs. Railway vs. Cloud Run) laut Vault widersprüchlich
   dokumentiert → vor Integration klären.
