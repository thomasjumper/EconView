import type { Server as SocketIOServer } from 'socket.io'
import { fetchCreditSpreads, fetchYieldSpreads } from './fred.js'

// ── Types ────────────────────────────────────────────────────────────────

export interface CascadeStep {
  order: number
  entity: string
  entityType: 'country' | 'commodity' | 'sector' | 'company' | 'currency' | 'shipping_lane'
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number // 0-1 scale
  mechanism: string
  estimatedDelay: string
  confidence: number // 0-1
}

export interface EconomicEvent {
  id: string
  timestamp: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  location: { lat: number; lon: number; countryCode?: string }
  affectedEntities: string[]
  estimatedImpact: number // 0-1 scale
  cascadeChain: CascadeStep[]
}

// ── State ────────────────────────────────────────────────────────────────

let recentEvents: EconomicEvent[] = []
let knownEventIds = new Set<string>()

// ── Default Events (so the panel isn't empty on startup) ─────────────────

const DEFAULT_EVENTS: EconomicEvent[] = [
  {
    id: 'evt_yield_inversion_2026q1',
    timestamp: '2026-03-10T14:30:00Z',
    type: 'yield_curve_inversion',
    severity: 'warning',
    title: 'US Yield Curve Deepening Inversion',
    description: 'The 2Y-10Y Treasury spread has widened to -0.42%, signaling persistent recession expectations despite solid labor market data.',
    location: { lat: 38.8951, lon: -77.0364, countryCode: 'USA' },
    affectedEntities: ['USA', 'USD', 'US_TREASURIES', 'FINANCIALS'],
    estimatedImpact: 0.55,
    cascadeChain: [
      { order: 1, entity: 'FINANCIALS', entityType: 'sector', impact: 'negative', magnitude: 0.4, mechanism: 'Bank net interest margins compress as short rates exceed long rates', estimatedDelay: 'immediate', confidence: 0.85 },
      { order: 2, entity: 'USD', entityType: 'currency', impact: 'positive', magnitude: 0.2, mechanism: 'Safe-haven demand pushes short-term dollar instruments higher', estimatedDelay: 'hours', confidence: 0.7 },
      { order: 3, entity: 'REAL_ESTATE', entityType: 'sector', impact: 'negative', magnitude: 0.35, mechanism: 'Inverted curve reduces lending appetite, tightening mortgage availability', estimatedDelay: 'weeks', confidence: 0.65 },
    ],
  },
  {
    id: 'evt_red_sea_tensions_2026',
    timestamp: '2026-03-12T08:15:00Z',
    type: 'shipping_disruption',
    severity: 'warning',
    title: 'Red Sea Shipping Disruptions Persist',
    description: 'Houthi attacks continue to force major carriers to reroute around the Cape of Good Hope, adding 10-14 days to Asia-Europe transit times.',
    location: { lat: 13.0, lon: 42.5, countryCode: 'YEM' },
    affectedEntities: ['SUEZ', 'ASIA_EUROPE_SUEZ', 'SHIPPING', 'EUR', 'ENERGY'],
    estimatedImpact: 0.45,
    cascadeChain: [
      { order: 1, entity: 'ASIA_EUROPE_SUEZ', entityType: 'shipping_lane', impact: 'negative', magnitude: 0.7, mechanism: 'Suez transit volume down 60% as carriers divert to Cape route', estimatedDelay: 'immediate', confidence: 0.9 },
      { order: 2, entity: 'crude_oil', entityType: 'commodity', impact: 'positive', magnitude: 0.15, mechanism: 'Longer routes increase fuel consumption and tanker demand', estimatedDelay: 'days', confidence: 0.75 },
      { order: 3, entity: 'EUR', entityType: 'country', impact: 'negative', magnitude: 0.2, mechanism: 'European importers face higher freight costs and delayed deliveries', estimatedDelay: 'weeks', confidence: 0.7 },
    ],
  },
  {
    id: 'evt_china_stimulus_2026',
    timestamp: '2026-03-14T02:00:00Z',
    type: 'central_bank_action',
    severity: 'info',
    title: 'PBOC Cuts RRR by 50bps',
    description: 'People\'s Bank of China reduces reserve requirement ratio by 50 basis points to support slowing property sector and boost credit growth.',
    location: { lat: 39.9042, lon: 116.4074, countryCode: 'CHN' },
    affectedEntities: ['CHN', 'CNY', 'PROPERTY', 'IRON_ORE', 'AUS'],
    estimatedImpact: 0.35,
    cascadeChain: [
      { order: 1, entity: 'CHN', entityType: 'country', impact: 'positive', magnitude: 0.3, mechanism: 'Lower RRR frees up ~$100B in bank lending capacity', estimatedDelay: 'immediate', confidence: 0.85 },
      { order: 2, entity: 'CNY', entityType: 'currency', impact: 'negative', magnitude: 0.15, mechanism: 'Easing widens rate differential with USD, putting depreciation pressure on yuan', estimatedDelay: 'hours', confidence: 0.7 },
      { order: 3, entity: 'iron_ore', entityType: 'commodity', impact: 'positive', magnitude: 0.2, mechanism: 'Expected boost to construction and infrastructure activity supports demand', estimatedDelay: 'days', confidence: 0.6 },
      { order: 4, entity: 'AUS', entityType: 'country', impact: 'positive', magnitude: 0.15, mechanism: 'Australia\'s iron ore exports benefit from renewed Chinese demand', estimatedDelay: 'weeks', confidence: 0.55 },
    ],
  },
]

// ── Detection Logic ──────────────────────────────────────────────────────

async function detectNewEvents(): Promise<EconomicEvent[]> {
  const newEvents: EconomicEvent[] = []

  try {
    // Check credit spreads for financial stress
    const creditSpreads = await fetchCreditSpreads()
    const hyLatest = creditSpreads.hy[creditSpreads.hy.length - 1]
    if (hyLatest && hyLatest.value > 500) {
      const eventId = `evt_credit_stress_${new Date().toISOString().slice(0, 10)}`
      if (!knownEventIds.has(eventId)) {
        newEvents.push({
          id: eventId,
          timestamp: new Date().toISOString(),
          type: 'financial_contagion',
          severity: hyLatest.value > 700 ? 'critical' : 'warning',
          title: 'High Yield Spreads Signal Financial Stress',
          description: `US High Yield OAS has widened to ${hyLatest.value.toFixed(0)}bps, indicating elevated credit risk and potential financial contagion.`,
          location: { lat: 40.7128, lon: -74.006, countryCode: 'USA' },
          affectedEntities: ['USA', 'FINANCIALS', 'HIGH_YIELD', 'CREDIT'],
          estimatedImpact: hyLatest.value > 700 ? 0.75 : 0.50,
          cascadeChain: [
            { order: 1, entity: 'HIGH_YIELD', entityType: 'sector', impact: 'negative', magnitude: 0.7, mechanism: 'Rising default expectations push high-yield bond prices down', estimatedDelay: 'immediate', confidence: 0.9 },
            { order: 2, entity: 'FINANCIALS', entityType: 'sector', impact: 'negative', magnitude: 0.5, mechanism: 'Banks face increased credit losses on leveraged loan portfolios', estimatedDelay: 'days', confidence: 0.75 },
            { order: 3, entity: 'TECHNOLOGY', entityType: 'sector', impact: 'negative', magnitude: 0.3, mechanism: 'Risk-off sentiment pressures growth stocks with high debt loads', estimatedDelay: 'days', confidence: 0.65 },
          ],
        })
        knownEventIds.add(eventId)
      }
    }
  } catch (err) {
    console.warn('[EventDetector] Failed to check credit spreads:', (err as Error).message)
  }

  try {
    // Check yield curve for deepening inversion
    const yieldSpreads = await fetchYieldSpreads()
    const t10y2y = yieldSpreads.t10y2y
    const latest = t10y2y[t10y2y.length - 1]
    if (latest && latest.value < -0.5) {
      const eventId = `evt_deep_inversion_${new Date().toISOString().slice(0, 10)}`
      if (!knownEventIds.has(eventId)) {
        newEvents.push({
          id: eventId,
          timestamp: new Date().toISOString(),
          type: 'yield_curve_inversion',
          severity: latest.value < -1.0 ? 'critical' : 'warning',
          title: 'Yield Curve Deep Inversion Intensifies',
          description: `The 2Y-10Y Treasury spread has reached ${latest.value.toFixed(2)}%, a deeply inverted level historically associated with imminent recession.`,
          location: { lat: 38.8951, lon: -77.0364, countryCode: 'USA' },
          affectedEntities: ['USA', 'USD', 'US_TREASURIES', 'FINANCIALS'],
          estimatedImpact: latest.value < -1.0 ? 0.70 : 0.50,
          cascadeChain: [
            { order: 1, entity: 'FINANCIALS', entityType: 'sector', impact: 'negative', magnitude: 0.5, mechanism: 'Deep inversion severely compresses bank net interest margins', estimatedDelay: 'immediate', confidence: 0.85 },
            { order: 2, entity: 'REAL_ESTATE', entityType: 'sector', impact: 'negative', magnitude: 0.4, mechanism: 'Credit tightening as banks reduce lending in recessionary environment', estimatedDelay: 'weeks', confidence: 0.7 },
            { order: 3, entity: 'USA', entityType: 'country', impact: 'negative', magnitude: 0.6, mechanism: 'Recession probability rises, Fed expected to pivot to easing', estimatedDelay: 'months', confidence: 0.6 },
          ],
        })
        knownEventIds.add(eventId)
      }
    }
  } catch (err) {
    console.warn('[EventDetector] Failed to check yield spreads:', (err as Error).message)
  }

  return newEvents
}

// ── Public API ───────────────────────────────────────────────────────────

export function getRecentEvents(): EconomicEvent[] {
  if (recentEvents.length === 0) {
    return DEFAULT_EVENTS
  }
  return recentEvents
}

export async function detectEvents(): Promise<EconomicEvent[]> {
  const newEvents = await detectNewEvents()

  if (newEvents.length > 0) {
    recentEvents = [...newEvents, ...recentEvents].slice(0, 50) // keep last 50
    console.log(`[EventDetector] ${newEvents.length} new event(s) detected`)
  }

  return newEvents
}

export function startEventDetection(io: SocketIOServer, intervalMs: number = 5 * 60 * 1000): void {
  console.log(`[EventDetector] Starting event detection (interval: ${intervalMs / 1000}s)`)

  // Seed with defaults on first run
  recentEvents = [...DEFAULT_EVENTS]
  for (const evt of DEFAULT_EVENTS) {
    knownEventIds.add(evt.id)
  }

  const check = async () => {
    try {
      const newEvents = await detectEvents()
      if (newEvents.length > 0) {
        for (const evt of newEvents) {
          io.emit('event:detected', evt)
        }
      }
    } catch (err) {
      console.error('[EventDetector] Detection cycle error:', (err as Error).message)
    }
  }

  // Initial check after 45s (let data services warm up)
  setTimeout(check, 45_000)

  // Then on interval
  setInterval(check, intervalMs)
}
