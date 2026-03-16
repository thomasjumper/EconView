# EconView Phase Next: Real-Time Global Money Flow Intelligence

## Context

You are working on **EconView**, a real-time 3D global economic intelligence dashboard. The codebase is a pnpm monorepo at the root of this repository with:

- `packages/client/` — React 18 + Vite + Three.js/R3F + Zustand + TanStack Query + Tailwind
- `packages/server/` — Express 5 + Socket.io + Redis/in-memory cache + Axios
- `packages/shared/` — TypeScript types + Zod schemas + constants

The app renders a NASA Blue Marble 3D globe with country nodes, trade arcs, flow particles, and multiple data panels. It currently has 35 API endpoints, 51 countries, 47 stock exchanges, 35 commodities, 35 forex pairs, 22 sovereign bonds, 21 central banks, and panels for Calendar, Credit/Financial Conditions, DeFi, World Data (energy/demographics/food/tourism), Risk Dashboard, and Performance Dashboard.

**The existing visual infrastructure includes:**
- `TradeEdges.tsx` — Quadratic Bezier arc lines between country nodes (great-circle style on globe)
- `FlowParticles.tsx` — Animated point particles streaming along edge curves (8 particles per edge, speed proportional to trade weight)
- `EconEdge` type with: `id, source, target, type ('trade' | 'capital_flow' | 'currency_pair' | 'supply_chain' | 'ownership' | 'sector_membership' | 'remittance' | 'fdi' | 'debt'), weight, value, direction ('bidirectional' | 'source_to_target' | 'target_to_source'), metadata`
- 50 bilateral trade edges, 10 FDI corridors, 10 remittance corridors already defined in `mock-data.ts`
- 6 visual modes: Default, Heat, Flow, Risk, Sentiment, X-Ray

**Current data sources:** World Bank, FRED (20+ series), Finnhub WS, CoinGecko, SEC EDGAR, GDELT, ExchangeRate.host, Metals.dev, DefiLlama, NY Fed GSCPI, BIS, ACLED, Ember Climate

---

## THE VISION

Transform EconView from a dashboard that *displays* economic data into one that shows **how money actually flows around the world in real time** — and what happens when those flows get disrupted.

The user should be able to see, for example: a cargo ship gets rerouted from the USA to Europe. They should immediately understand the cascading financial impact — which shipping lanes change, which commodity prices move, which currencies react, which countries' trade balances shift, which supply chains get stressed, which stock sectors get hit, and which ones benefit.

This is the "Bloomberg Terminal meets Google Earth" vision — every dollar, euro, yen, and yuan flowing across the globe should be visible as glowing streams of light, and disruptions should ripple outward like shockwaves.

---

## PHASE 1: REAL-TIME SHIPPING & LOGISTICS LAYER

### 1A. AIS Vessel Tracking Integration

Create `packages/server/src/services/vessel-tracking.ts`:

- **Primary source:** MarineTraffic API or AISHub (free tier gives delayed AIS data for ~180,000 vessels)
  - Fallback: Use the free UN Global Platform AIS data, or scrape the MarineTraffic public API endpoint
  - Alternative free source: `https://aisstream.io` — free WebSocket AIS stream with API key
- **Data to collect per vessel:**
  ```ts
  interface VesselPosition {
    mmsi: string           // Maritime Mobile Service Identity (unique ship ID)
    name: string
    type: VesselType       // 'container' | 'tanker' | 'bulk_carrier' | 'lng' | 'car_carrier' | 'cruise' | 'other'
    lat: number
    lon: number
    heading: number        // degrees
    speed: number          // knots
    destination: string    // port code
    origin: string         // last port
    eta: string            // ISO date
    cargo: CargoType       // 'crude_oil' | 'refined_products' | 'lng' | 'coal' | 'iron_ore' | 'grain' | 'containers' | 'vehicles' | 'chemicals' | 'unknown'
    estimatedValue: number // USD estimate based on cargo type + vessel size
    dwt: number            // deadweight tonnage
    flag: string           // country code
    route: [number, number][] // projected waypoints [lon, lat]
  }
  
  type VesselType = 'container' | 'tanker' | 'bulk_carrier' | 'lng' | 'car_carrier' | 'cruise' | 'other'
  type CargoType = 'crude_oil' | 'refined_products' | 'lng' | 'coal' | 'iron_ore' | 'grain' | 'containers' | 'vehicles' | 'chemicals' | 'unknown'
  ```

- **Shipping lane aggregation:** Group vessels into major shipping lanes and compute:
  ```ts
  interface ShippingLane {
    id: string
    name: string           // e.g. "Trans-Pacific Eastbound", "Suez Canal Northbound"
    origin: string         // region/port cluster
    destination: string    // region/port cluster
    activeVessels: number
    avgTransitDays: number
    estimatedDailyValue: number  // USD flowing through this lane per day
    congestionIndex: number      // 0-1, based on vessel density vs normal
    waypoints: [number, number][] // [lon, lat] for drawing the lane on globe
    trend: 'increasing' | 'stable' | 'decreasing'
  }
  ```

- **Major lanes to track (at minimum):**
  1. Trans-Pacific (Asia → US West Coast)
  2. Trans-Pacific (US West Coast → Asia)
  3. Asia → Europe via Suez Canal
  4. Europe → Asia via Suez Canal
  5. Trans-Atlantic (Europe ↔ US East Coast)
  6. Persian Gulf → Asia (oil/LNG)
  7. Persian Gulf → Europe (oil/LNG)
  8. South America → China (soybeans, iron ore)
  9. Australia → China (iron ore, coal, LNG)
  10. Intra-Asia (China ↔ Japan ↔ Korea ↔ SE Asia)
  11. West Africa → Global (crude oil)
  12. Panama Canal transit
  13. Cape of Good Hope route (Suez alternative)
  14. Baltic Sea / Northern Europe
  15. Mediterranean intra-trade

- Cache vessel positions for 5 minutes, lane aggregates for 15 minutes
- Emit vessel updates via Socket.io channel `vessel:positions` and `vessel:lanes`

### 1B. Port Congestion & Throughput

Create `packages/server/src/services/port-data.ts`:

- Track the world's top 50 container ports:
  ```ts
  interface PortStatus {
    id: string
    name: string
    country: string
    lat: number
    lon: number
    annualTEU: number         // twenty-foot equivalent units capacity
    currentCongestion: number // 0-1 (0 = empty, 1 = gridlocked)
    avgWaitDays: number       // average vessel wait time
    vesselsAtAnchor: number   // ships waiting to berth
    throughputTrend: 'up' | 'stable' | 'down'
    topTradePartners: string[] // country codes
  }
  ```

- **Data sources:**
  - MarineTraffic port congestion (free tier)
  - UNCTAD port performance dashboard
  - Fallback: estimate congestion from AIS vessel density within port radius

- API endpoint: `GET /api/ports`
- WebSocket: `port:congestion` updates

### 1C. Globe Visualization — Shipping Layer

In the client, create `packages/client/src/components/globe/ShippingLanes.tsx`:

- Render shipping lanes as **thick, flowing ribbon lines** on the globe (not thin lines — these should be visually distinct from trade arcs)
- Lane width proportional to `estimatedDailyValue` (busier = wider)
- Lane color encodes cargo type:
  - Crude oil / refined: `#F59E0B` (amber)
  - LNG: `#3B82F6` (blue)
  - Containers: `#06B6D4` (cyan)
  - Bulk (iron, coal, grain): `#84CC16` (lime)
  - Vehicles: `#EC4899` (pink)
- Animated dashes or particles flowing along the lane in the direction of travel
- Congested lanes pulse red
- Hover a lane → tooltip showing: name, active vessels, daily value, transit time, congestion

Create `packages/client/src/components/globe/VesselDots.tsx`:

- Render individual vessels as tiny dots on the globe surface (only when zoomed into a region)
- Dot color = cargo type color
- Dot size proportional to DWT (bigger ship = slightly bigger dot)
- At global zoom: only show vessels on active lanes as flowing particles
- At market/region zoom: show individual vessel dots with heading indicators
- Click a vessel → show detail panel with: name, flag, cargo estimate, origin → destination, ETA

Create `packages/client/src/components/globe/PortMarkers.tsx`:

- Render ports as small pulsing circles on the globe at port coordinates
- Size proportional to annual TEU
- Color indicates congestion: green (normal) → yellow (busy) → red (gridlocked)
- Click a port → show throughput stats, top trade partners, wait times

---

## PHASE 2: FINANCIAL FLOW VISUALIZATION (THE MONEY LAYER)

### 2A. Upgrade Trade Flow Arcs to Show Direction + Volume in Real Time

Modify `FlowParticles.tsx` and `TradeEdges.tsx`:

- **Directional flow:** Currently all arcs are bidirectional static lines. Upgrade so that:
  - Each trade edge has TWO particle streams if bidirectional (one each way, different sizes based on trade deficit)
  - The THICKER stream shows the net flow direction
  - Stream color encodes flow type: trade (cyan), FDI (purple), remittance (green), debt (red), capital flight (orange)
  
- **Flow volume animation:** Particle density and speed should reflect the CURRENT value:
  - More particles = more money flowing
  - Faster particles = faster flow velocity (hot money vs. slow trade)
  - Particle SIZE varies: large glowing particles for big transactions, small ones for steady-state

- **"Pulse" effect on disruption:** When a shipping lane gets congested or rerouted:
  - The affected trade arcs should visually "stutter" (particles slow, gap, then reroute)
  - New temporary arcs should appear showing the reroute path
  - A shockwave ring expands outward from the disruption point

### 2B. Capital Flow Streams

Create `packages/server/src/services/capital-flows.ts`:

- **Real-time currency flow proxy:** Use forex volume data + central bank intervention signals:
  - Finnhub forex candles (already have via WS) — volume = flow proxy
  - FRED: TIC data (Treasury International Capital flows) — monthly but shows $T-scale flows
  - BIS triennial survey data for daily FX turnover by currency pair
  
- Compute net capital flow direction between major currency zones:
  ```ts
  interface CapitalFlow {
    id: string
    source: string        // country/region code
    target: string        // country/region code
    flowType: 'portfolio' | 'fdi' | 'banking' | 'central_bank' | 'remittance' | 'trade_settlement'
    dailyVolume: number   // estimated USD
    netDirection: 'source_to_target' | 'target_to_source'
    velocity: number      // 0-1, how "hot" the money is moving
    trend: 'accelerating' | 'stable' | 'decelerating'
  }
  ```

- **Cross-border payment corridors** (from SWIFT gpi data estimates):
  - USD clearing (CHIPS/Fedwire) — USA as hub
  - EUR clearing (TARGET2) — ECB as hub  
  - CNY clearing (CIPS) — China's growing alternative
  - GBP clearing (CHAPS) — London as hub
  - JPY clearing (BOJ-NET) — Japan

### 2C. Debt Flow Visualization

Create `packages/server/src/services/debt-flows.ts`:

- Track sovereign debt holdings and flows:
  - FRED: `FDHBFIN` (foreign holders of US Treasuries)
  - US Treasury TIC data for who holds US debt
  - BIS international debt securities outstanding
  
- Show as red-tinted arcs: Country A holds $X of Country B's debt
- Thickness = holding size, pulse = recent changes
- This makes visible things like: "China reducing US Treasury holdings" or "Japan is the largest foreign holder of US debt"

### 2D. Flow Summary Panel

Create `packages/client/src/components/panels/FlowPanel.tsx`:

- Toggle with `G` key (G for "Global flows")
- Shows real-time summary:
  - Total estimated daily global trade value flowing
  - Net capital flow direction (into/out of each major region)
  - Busiest shipping lanes ranked by value
  - Biggest flow changes in last 24h
  - "Flow health" indicator (normal / stressed / disrupted)
- Mini stacked bar chart showing flow composition: trade vs. capital vs. debt vs. remittances

---

## PHASE 3: CASCADE / IMPACT ENGINE (THE BRAIN)

This is what makes it all come together — when something changes, trace the ripple effects.

### 3A. Event Detection System

Create `packages/server/src/services/event-detector.ts`:

- Monitor all data streams for anomalies:
  ```ts
  interface EconomicEvent {
    id: string
    timestamp: string
    type: EventType
    severity: 'info' | 'warning' | 'critical'
    title: string
    description: string
    location: { lat: number; lon: number; countryCode?: string }
    affectedEntities: string[]     // country codes, tickers, commodity IDs
    estimatedImpact: number        // USD magnitude
    cascadeChain: CascadeStep[]    // predicted domino effects
  }
  
  type EventType = 
    | 'shipping_disruption'      // vessel reroute, canal blockage, port closure
    | 'trade_policy'             // tariff, sanction, embargo
    | 'commodity_shock'          // price spike/crash
    | 'currency_crisis'          // rapid depreciation, capital flight
    | 'central_bank_action'      // rate decision, QE/QT, intervention
    | 'geopolitical'             // conflict, sanctions, election
    | 'supply_chain_break'       // factory shutdown, chip shortage, logistics failure
    | 'financial_contagion'      // bank failure, credit freeze, sovereign default
    | 'natural_disaster'         // earthquake, hurricane, drought
    | 'market_crash'             // flash crash, circuit breaker
  ```

- **Detection logic:**
  - Shipping: vessel density anomaly on a lane (sudden drop = disruption), AIS signal loss in choke points
  - Commodity: price moves > 2σ from 30-day average
  - Currency: move > 1% in 24h for major pairs, > 3% for EM
  - Trade: GDELT news sentiment shift + keyword detection ("tariff", "sanction", "embargo", "blockade")
  - Supply chain: NY Fed GSCPI spike + shipping lane congestion correlation
  - Credit: HY spreads widening > 50bps/week, yield curve inversion deepening

### 3B. Cascade Simulation Engine

Create `packages/server/src/services/cascade-engine.ts`:

This is the core intelligence — given an event, trace the chain of financial consequences:

```ts
interface CascadeStep {
  order: number              // 1 = immediate, 2 = secondary, 3 = tertiary
  entity: string             // what's affected (country, commodity, sector, company)
  entityType: 'country' | 'commodity' | 'sector' | 'company' | 'currency' | 'shipping_lane'
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number          // 0-1 severity
  mechanism: string          // human-readable explanation
  estimatedDelay: string     // "immediate" | "hours" | "days" | "weeks" | "months"
  confidence: number         // 0-1, how confident we are in this prediction
}
```

**Example cascade for "Cargo ship rerouted from USA to Europe":**

```
Event: Container vessel MV Ever Forward (8,000 TEU, consumer electronics cargo worth ~$400M) 
       diverted from Port of Los Angeles to Rotterdam

Step 1 (Immediate):
  - Port of LA: throughput ↓, wait times ↓ slightly — magnitude: 0.05
  - Port of Rotterdam: throughput ↑, wait times ↑ — magnitude: 0.08
  - Trans-Pacific Eastbound lane: -1 vessel, value ↓ — magnitude: 0.02
  - Asia→Europe lane: +1 vessel, value ↑ — magnitude: 0.02

Step 2 (Hours to Days):
  - US consumer electronics supply: slight delay for some retailers — magnitude: 0.1
  - European consumer electronics supply: increased availability — magnitude: 0.08
  - EUR/USD: slight EUR strength (goods flowing to Europe) — magnitude: 0.01
  - US retail sector (XRT): minor negative sentiment — magnitude: 0.03

Step 3 (Days to Weeks):
  - If pattern repeats (systematic rerouting): 
    - US import prices ↑ (scarcity premium) — magnitude: 0.15
    - European import prices ↓ (oversupply) — magnitude: 0.10
    - US trade deficit may narrow — magnitude: 0.05
    - Shipping rates Trans-Pacific ↓, Asia-Europe ↑ — magnitude: 0.12
  - Affected companies: Apple, Samsung, Sony (supply chain adjustment) — magnitude: 0.05
  - Semiconductor supply geography: shift in chip distribution — magnitude: 0.08

Step 4 (Weeks to Months):
  - US inflation: potential upward pressure if sustained — magnitude: 0.08
  - Fed policy: may factor into rate decision if trend continues — magnitude: 0.03
  - European auto/manufacturing: benefits from redirected intermediate goods — magnitude: 0.06
```

**Implementation approach:**
- Build a **dependency graph** of economic relationships:
  - Country → imports/exports → trading partners
  - Shipping lane → connects → ports → serves → countries
  - Commodity → produced by → countries, consumed by → countries
  - Currency pair → reflects → trade balance between countries
  - Sector → depends on → commodities, supplies → other sectors
  - Company → headquarters → country, supply chain → countries
  
- When an event fires, traverse the dependency graph using BFS with decay:
  - Each hop reduces magnitude by 30-50%
  - Each hop increases delay estimate
  - Confidence decreases with each hop
  - Stop when magnitude < 0.01 or depth > 5

- **Use the AI query service** (`packages/server/src/services/ai-query.ts`) to generate human-readable `mechanism` text for each cascade step

### 3C. Cascade Visualization on Globe

Create `packages/client/src/components/globe/CascadeRipple.tsx`:

- When a cascade event fires, render a **visual shockwave** on the globe:
  1. **Epicenter pulse:** A bright expanding ring at the event location (like a sonar ping)
  2. **Ripple lines:** Glowing arcs shoot outward from the epicenter to each affected entity
  3. **Color coding:** Green ripples for positive impacts, red for negative, amber for mixed
  4. **Sequential timing:** Step 1 effects appear immediately, Step 2 effects appear 2 seconds later, etc.
  5. **Affected nodes glow:** Country nodes that are impacted pulse with the impact color

- The cascade should be **replayable** — the user can trigger it from the event panel and watch it unfold in slow motion

### 3D. Event & Cascade Panel

Create `packages/client/src/components/panels/CascadePanel.tsx`:

- Toggle with `X` key
- Shows:
  - Live event feed (detected disruptions, anomalies, shocks)
  - Click an event → expands to show full cascade chain
  - Each cascade step shows: entity, impact direction, magnitude bar, mechanism text, delay estimate
  - "Simulate" button: lets user manually input a hypothetical event and see predicted cascade
  - Historical events: replay past disruptions and their actual vs. predicted impact

---

## PHASE 4: SCENARIO SIMULATOR ("WHAT IF" ENGINE)

### 4A. Scenario Input System

Create `packages/client/src/components/panels/ScenarioPanel.tsx`:

- Toggle with `S` key
- The user can construct "what if" scenarios:
  - "What if the Suez Canal closes for 2 weeks?"
  - "What if China devalues the yuan by 10%?"
  - "What if oil hits $120/barrel?"
  - "What if the US imposes 25% tariffs on all EU goods?"
  - "What if a category 5 hurricane hits Houston refineries?"

- Preset scenario templates:
  ```ts
  const SCENARIOS = [
    { id: 'suez_closure', label: 'Suez Canal Closure (2 weeks)', params: { ... } },
    { id: 'oil_spike', label: 'Oil Price Spike to $120', params: { ... } },
    { id: 'china_deval', label: 'Yuan Devaluation 10%', params: { ... } },
    { id: 'us_eu_tariff', label: 'US-EU Tariff War (25%)', params: { ... } },
    { id: 'taiwan_crisis', label: 'Taiwan Strait Crisis', params: { ... } },
    { id: 'fed_emergency_cut', label: 'Fed Emergency Rate Cut 100bps', params: { ... } },
    { id: 'russian_gas_cutoff', label: 'Russia Cuts All Gas to Europe', params: { ... } },
    { id: 'houston_hurricane', label: 'Cat 5 Hurricane Hits Houston', params: { ... } },
  ]
  ```

- Custom scenario builder with dropdowns:
  - Event type (trade, shipping, commodity, currency, policy, natural disaster)
  - Location/entities affected
  - Severity (mild, moderate, severe, catastrophic)
  - Duration (hours, days, weeks, months)

### 4B. Scenario Processing

Create `packages/server/src/services/scenario-engine.ts`:

- Takes a scenario definition, runs it through the cascade engine
- Returns the full cascade chain + globe visualization data
- API endpoint: `POST /api/scenario/simulate` with body `{ scenarioId: string, params?: object }`
- For custom scenarios: `POST /api/scenario/custom` with body `{ description: string }` — uses AI to parse and simulate

### 4C. Globe Scenario Mode

When a scenario is active:
- The globe enters a **"simulation" visual mode** — subtle orange border/overlay indicating "this is a simulation"
- Trade arcs/shipping lanes animate to show the predicted changes
- Affected country nodes show impact indicators (green/red arrows)
- A timeline scrubber appears at the bottom showing the cascade unfolding over time
- The user can drag the timeline to see "Day 1", "Day 7", "Day 30", "Day 90" impacts

---

## PHASE 5: DATA INFRASTRUCTURE TO SUPPORT THE ABOVE

### 5A. New Server Services Needed

| Service | File | Source | Key Data |
|---|---|---|---|
| Vessel Tracking | `vessel-tracking.ts` | AISStream.io WebSocket (free) | Live vessel positions, routes |
| Port Data | `port-data.ts` | UNCTAD + MarineTraffic free | Port congestion, throughput |
| Capital Flows | `capital-flows.ts` | FRED TIC + BIS + forex volume | Cross-border money movement |
| Debt Flows | `debt-flows.ts` | FRED FDHBFIN + Treasury TIC | Who holds whose debt |
| Event Detector | `event-detector.ts` | Aggregates all other services | Anomaly detection |
| Cascade Engine | `cascade-engine.ts` | Internal computation | Impact chain simulation |
| Scenario Engine | `scenario-engine.ts` | Cascade engine + AI | What-if simulations |
| Dependency Graph | `dependency-graph.ts` | Static + dynamic data | Economic relationship map |

### 5B. New API Endpoints

```
GET  /api/vessels              — Current vessel positions (paginated, filterable by type/region)
GET  /api/vessels/lanes        — Aggregated shipping lane data
GET  /api/ports                — Port status and congestion
GET  /api/flows/capital        — Net capital flows between regions
GET  /api/flows/debt           — Sovereign debt holding flows  
GET  /api/flows/summary        — Aggregated global flow summary
GET  /api/events               — Recent detected economic events
GET  /api/events/:id/cascade   — Cascade chain for a specific event
POST /api/scenario/simulate    — Run a preset scenario
POST /api/scenario/custom      — AI-powered custom scenario
WS   vessel:positions          — Real-time vessel position stream
WS   vessel:lanes              — Shipping lane aggregate updates
WS   port:congestion           — Port congestion updates
WS   event:detected            — New event notifications
WS   cascade:step              — Cascade step-by-step updates
```

### 5C. New Client Components

```
packages/client/src/components/globe/
  ShippingLanes.tsx      — Ribbon-style shipping lane visualization
  VesselDots.tsx         — Individual vessel dots (zoom-dependent)
  PortMarkers.tsx        — Port congestion indicators
  CascadeRipple.tsx      — Shockwave/ripple effect for cascade events

packages/client/src/components/panels/
  FlowPanel.tsx          — Global money flow summary (G key)
  CascadePanel.tsx       — Event feed + cascade visualization (X key)
  ScenarioPanel.tsx      — What-if scenario builder (S key)
  VesselDetailPanel.tsx  — Individual vessel detail on click

packages/client/src/hooks/
  useVesselData.ts       — WebSocket hook for vessel positions
  useShippingLanes.ts    — Shipping lane aggregate data
  usePortData.ts         — Port status hook
  useCapitalFlows.ts     — Capital flow data hook
  useCascadeEvents.ts    — Event detection + cascade chain
  useScenario.ts         — Scenario simulation state
```

### 5D. Shared Types to Add

Add to `packages/shared/src/types.ts`:
- `VesselPosition`, `VesselType`, `CargoType`
- `ShippingLane`, `PortStatus`
- `CapitalFlow`, `DebtFlow`
- `EconomicEvent`, `EventType`, `CascadeStep`
- `Scenario`, `ScenarioResult`

Update `packages/shared/src/schemas.ts` with Zod schemas for all new types.

---

## IMPLEMENTATION ORDER

**Do these in sequence — each builds on the previous:**

1. **Dependency Graph** (`dependency-graph.ts`) — the data backbone everything else uses
2. **Shipping Lanes** (server + client) — most visually impactful, shows physical flow of goods
3. **Port Data** (server + client) — complements shipping with port congestion
4. **Capital Flows** (server + client) — shows the money layer over the physical layer
5. **Flow Panel** (client) — summary dashboard for all flows
6. **Event Detector** (server) — monitors for anomalies
7. **Cascade Engine** (server) — traces impact chains
8. **Cascade Visualization** (client) — the shockwave effect
9. **Cascade Panel** (client) — event feed + cascade detail
10. **Scenario Engine** (server) — what-if simulations
11. **Scenario Panel** (client) — user-facing scenario builder

---

## DESIGN PRINCIPLES

- **Dark theme, always.** Background: `#050810`. All panels use `bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg`. Font: `font-mono`. Labels: `text-[10px] text-slate-500`. Values: `text-xs text-slate-300`. Positive: `text-green-400`. Negative: `text-red-400`. Warning: `text-amber-400`.

- **Performance first.** Vessels can be 10,000+ dots — use instanced rendering (`THREE.InstancedMesh`). Shipping lanes use `THREE.TubeGeometry` or thick `Line2` from three/examples. Never re-create geometries on every frame.

- **Graceful degradation.** If AIS data is unavailable, fall back to estimated shipping lane volumes from trade data. If cascade engine has low confidence, show it. Every service must handle failure with cached fallback data.

- **The globe is the centerpiece.** Every new data source must have a visual representation ON the globe, not just in side panels. Panels complement what's visible on the globe. The user should be able to understand the global economic situation just by looking at the globe for 10 seconds.

- **Existing patterns must be followed.** Server services use `cachedFetch()` from `../cache/redis.js`. Client hooks use `useQuery` from `@tanstack/react-query`. Panels use `useAppStore` for toggle state. All keyboard shortcuts registered in `KeyboardHelp.tsx`. Error boundaries wrap everything.

---

## TESTING CHECKLIST

After implementation, verify:
- [ ] `npx tsc --noEmit` passes in both `packages/server` and `packages/client` with zero errors
- [ ] All new endpoints return `{ ok: true, data: ... }` format
- [ ] Shipping lanes render on the globe with flowing animation
- [ ] Port markers visible and color-coded by congestion
- [ ] Flow panel shows aggregated global flow data
- [ ] Cascade engine produces a reasonable cascade chain for "Suez Canal closure" scenario
- [ ] Cascade ripple renders expanding rings on the globe
- [ ] Scenario panel lets user select a preset and see results
- [ ] All new panels open/close with keyboard shortcuts
- [ ] No performance regression (maintain 60fps on the globe with 50+ shipping lanes visible)
- [ ] All services gracefully degrade if external APIs are down
