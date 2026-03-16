import { simulateCascade } from './cascade-engine.js'
import type { EconomicEvent, CascadeStep } from './event-detector.js'

// ── Types ────────────────────────────────────────────────────────────────

export interface Scenario {
  id: string
  label: string
  description: string
  eventType: string
  severity: 'moderate' | 'severe' | 'catastrophic'
  duration: string
  params: Record<string, unknown>
}

export interface ScenarioResult {
  scenario: Scenario | { id: 'custom'; label: string; description: string }
  event: EconomicEvent
  cascade: CascadeStep[]
  narration: string
  simulatedAt: string
}

// ── Event Location Lookup ────────────────────────────────────────────────

const EVENT_LOCATIONS: Record<string, { lat: number; lon: number; countryCode?: string }> = {
  suez_closure: { lat: 30.5, lon: 32.3, countryCode: 'EGY' },
  oil_spike: { lat: 25.2, lon: 55.3, countryCode: 'ARE' },
  china_deval: { lat: 39.9, lon: 116.4, countryCode: 'CHN' },
  us_eu_tariff: { lat: 38.9, lon: -77.0, countryCode: 'USA' },
  taiwan_crisis: { lat: 25.0, lon: 121.5, countryCode: 'TWN' },
  fed_emergency_cut: { lat: 38.9, lon: -77.0, countryCode: 'USA' },
  russian_gas_cutoff: { lat: 55.8, lon: 37.6, countryCode: 'RUS' },
  houston_hurricane: { lat: 29.8, lon: -95.4, countryCode: 'USA' },
}

// ── Preset Scenarios ─────────────────────────────────────────────────────

const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'suez_closure',
    label: 'Suez Canal Closure (2 weeks)',
    description: 'The Suez Canal is blocked by a grounded vessel, halting all transit for 14 days.',
    eventType: 'shipping_disruption',
    severity: 'severe',
    duration: '2 weeks',
    params: { affectedLane: 'asia_europe_suez', blockageDays: 14 },
  },
  {
    id: 'oil_spike',
    label: 'Oil Price Spike to $120/bbl',
    description: 'Brent crude surges to $120 due to OPEC supply cuts and geopolitical tensions.',
    eventType: 'commodity_shock',
    severity: 'severe',
    duration: 'months',
    params: { commodity: 'crude_oil', targetPrice: 120 },
  },
  {
    id: 'china_deval',
    label: 'Yuan Devaluation 10%',
    description: 'PBOC allows a managed 10% depreciation of CNY against USD.',
    eventType: 'currency_crisis',
    severity: 'severe',
    duration: 'months',
    params: { currency: 'CNY', devaluation: 0.10 },
  },
  {
    id: 'us_eu_tariff',
    label: 'US-EU Tariff War (25%)',
    description: 'US imposes 25% tariffs on all EU goods; EU retaliates symmetrically.',
    eventType: 'trade_policy',
    severity: 'severe',
    duration: 'months',
    params: { source: 'USA', target: 'EUR', rate: 0.25 },
  },
  {
    id: 'taiwan_crisis',
    label: 'Taiwan Strait Crisis',
    description: 'Military tensions close the Taiwan Strait to commercial shipping for 30 days.',
    eventType: 'geopolitical',
    severity: 'catastrophic',
    duration: 'months',
    params: { affectedLane: 'intra_asia', closureDays: 30 },
  },
  {
    id: 'fed_emergency_cut',
    label: 'Fed Emergency Rate Cut 100bps',
    description: 'Federal Reserve announces emergency 100bps rate cut due to financial stress.',
    eventType: 'central_bank_action',
    severity: 'moderate',
    duration: 'weeks',
    params: { centralBank: 'FED', cutBps: 100 },
  },
  {
    id: 'russian_gas_cutoff',
    label: 'Russia Cuts All Gas to Europe',
    description: 'Russia halts all natural gas exports to European Union immediately.',
    eventType: 'commodity_shock',
    severity: 'catastrophic',
    duration: 'months',
    params: { commodity: 'natural_gas', source: 'RUS', target: 'EUR' },
  },
  {
    id: 'houston_hurricane',
    label: 'Cat 5 Hurricane Hits Houston',
    description: 'Category 5 hurricane devastates Houston, shutting down Gulf Coast refineries for 4 weeks.',
    eventType: 'natural_disaster',
    severity: 'catastrophic',
    duration: 'weeks',
    params: { location: 'Houston', shutdownWeeks: 4 },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function scenarioToEvent(scenario: Scenario): EconomicEvent {
  const location = EVENT_LOCATIONS[scenario.id] || { lat: 0, lon: 0 }
  const severityMap: Record<string, 'info' | 'warning' | 'critical'> = {
    moderate: 'warning',
    severe: 'warning',
    catastrophic: 'critical',
  }

  const affectedEntities = buildAffectedEntities(scenario)

  return {
    id: `scenario_${scenario.id}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: scenario.eventType,
    severity: severityMap[scenario.severity] || 'warning',
    title: scenario.label,
    description: scenario.description,
    location,
    affectedEntities,
    estimatedImpact: scenario.severity === 'catastrophic' ? 0.85 : scenario.severity === 'severe' ? 0.65 : 0.40,
    cascadeChain: [], // filled by cascade engine
  }
}

function buildAffectedEntities(scenario: Scenario): string[] {
  switch (scenario.id) {
    case 'suez_closure':
      return ['ASIA_EUROPE_SUEZ', 'EUR', 'SHIPPING', 'ENERGY']
    case 'oil_spike':
      return ['crude_oil', 'ENERGY', 'USA', 'EUR', 'CHN']
    case 'china_deval':
      return ['CHN', 'CNY', 'EMERGING_MARKETS', 'TRADE']
    case 'us_eu_tariff':
      return ['USA', 'EUR', 'TRADE', 'CONSUMER_GOODS', 'INDUSTRIALS']
    case 'taiwan_crisis':
      return ['TWN', 'CHN', 'SEMICONDUCTORS', 'TECHNOLOGY', 'INTRA_ASIA']
    case 'fed_emergency_cut':
      return ['USA', 'USD', 'US_TREASURIES', 'EQUITIES', 'REAL_ESTATE']
    case 'russian_gas_cutoff':
      return ['natural_gas', 'RUS', 'EUR', 'DEU', 'ENERGY']
    case 'houston_hurricane':
      return ['USA', 'crude_oil', 'ENERGY', 'INSURANCE', 'CONSUMER_GOODS']
    default:
      return ['GLOBAL']
  }
}

function generateNarration(scenario: Scenario | { id: string; label?: string; description: string }, cascade: CascadeStep[]): string {
  const totalMagnitude = cascade.reduce((sum, s) => sum + s.magnitude, 0)
  const avgConfidence = cascade.reduce((sum, s) => sum + s.confidence, 0) / (cascade.length || 1)
  const mostImpacted = cascade
    .filter((s) => s.impact === 'negative')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 3)
    .map((s) => s.entity)

  const desc = scenario.description
  const severity = totalMagnitude > 3 ? 'severe' : totalMagnitude > 2 ? 'significant' : 'moderate'

  let narration = `SCENARIO: ${desc}\n\n`
  narration += `ASSESSMENT: This event would trigger ${severity} cascading effects across ${cascade.length} transmission channels. `
  if (mostImpacted.length > 0) {
    narration += `Most impacted: ${mostImpacted.join(', ')}. `
  }
  narration += `Average confidence in cascade projections: ${(avgConfidence * 100).toFixed(0)}%.\n\n`
  narration += 'CASCADE TIMELINE:\n'
  for (const step of cascade) {
    const arrow = step.impact === 'positive' ? '+' : step.impact === 'negative' ? '-' : '~'
    narration += `  [${step.estimatedDelay}] ${arrow} ${step.entity}: ${step.mechanism}\n`
  }

  return narration
}

// ── AI-Powered Custom Scenario Parsing ───────────────────────────────────

async function parseCustomScenario(description: string): Promise<EconomicEvent> {
  const ollamaUrl = process.env.OLLAMA_URL
  if (ollamaUrl) {
    try {
      const { default: axios } = await import('axios')
      const model = process.env.OLLAMA_MODEL || 'qwen3:14b'
      const response = await axios.post(
        `${ollamaUrl}/api/chat`,
        {
          model,
          messages: [
            {
              role: 'system',
              content: `You parse economic scenario descriptions into structured events. Respond ONLY with JSON:
{
  "type": "shipping_disruption|commodity_shock|currency_crisis|trade_policy|geopolitical|central_bank_action|natural_disaster|financial_contagion",
  "severity": "info|warning|critical",
  "title": "short title",
  "affectedEntities": ["ENTITY1", "ENTITY2"],
  "lat": 0.0,
  "lon": 0.0,
  "countryCode": "XXX",
  "estimatedImpact": 0.5
}`,
            },
            { role: 'user', content: description },
          ],
          stream: false,
          options: { temperature: 0.2, num_predict: 300 },
        },
        { timeout: 20_000 },
      )

      let text = response.data.message?.content ?? ''
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id: `custom_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: parsed.type || 'generic',
          severity: parsed.severity || 'warning',
          title: parsed.title || description.slice(0, 60),
          description,
          location: {
            lat: parsed.lat || 0,
            lon: parsed.lon || 0,
            countryCode: parsed.countryCode,
          },
          affectedEntities: parsed.affectedEntities || ['GLOBAL'],
          estimatedImpact: parsed.estimatedImpact || 0.5,
          cascadeChain: [],
        }
      }
    } catch (err) {
      console.warn('[ScenarioEngine] AI parsing failed, using fallback:', (err as Error).message)
    }
  }

  // Fallback: keyword-based parsing
  const lower = description.toLowerCase()
  let type = 'generic'
  let affectedEntities = ['GLOBAL']

  if (lower.includes('ship') || lower.includes('port') || lower.includes('canal') || lower.includes('strait')) {
    type = 'shipping_disruption'
    affectedEntities = ['SHIPPING', 'TRADE']
  } else if (lower.includes('oil') || lower.includes('gas') || lower.includes('commodity') || lower.includes('wheat')) {
    type = 'commodity_shock'
    affectedEntities = ['ENERGY', 'COMMODITIES']
  } else if (lower.includes('currency') || lower.includes('deval') || lower.includes('peso') || lower.includes('lira')) {
    type = 'currency_crisis'
    affectedEntities = ['EMERGING_MARKETS', 'FX']
  } else if (lower.includes('tariff') || lower.includes('sanction') || lower.includes('trade war')) {
    type = 'trade_policy'
    affectedEntities = ['TRADE', 'CONSUMER_GOODS']
  } else if (lower.includes('war') || lower.includes('military') || lower.includes('invasion')) {
    type = 'geopolitical'
    affectedEntities = ['GLOBAL', 'DEFENSE']
  } else if (lower.includes('rate') || lower.includes('fed') || lower.includes('central bank') || lower.includes('ecb')) {
    type = 'central_bank_action'
    affectedEntities = ['USA', 'US_TREASURIES']
  } else if (lower.includes('hurricane') || lower.includes('earthquake') || lower.includes('flood') || lower.includes('tsunami')) {
    type = 'natural_disaster'
    affectedEntities = ['INSURANCE', 'INFRASTRUCTURE']
  }

  return {
    id: `custom_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    severity: 'warning',
    title: description.slice(0, 60),
    description,
    location: { lat: 0, lon: 0 },
    affectedEntities,
    estimatedImpact: 0.5,
    cascadeChain: [],
  }
}

// ── Public API ───────────────────────────────────────────────────────────

export function getPresetScenarios(): Scenario[] {
  return PRESET_SCENARIOS
}

export async function simulateScenario(scenarioId: string): Promise<ScenarioResult> {
  const scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId)
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`)
  }

  const event = scenarioToEvent(scenario)
  const cascade = await simulateCascade(event)
  event.cascadeChain = cascade

  const narration = generateNarration(scenario, cascade)

  return {
    scenario,
    event,
    cascade,
    narration,
    simulatedAt: new Date().toISOString(),
  }
}

export async function simulateCustomScenario(description: string): Promise<ScenarioResult> {
  const event = await parseCustomScenario(description)
  const cascade = await simulateCascade(event)
  event.cascadeChain = cascade

  const customScenario: { id: 'custom'; label: string; description: string } = { id: 'custom', label: description.slice(0, 60), description }
  const narration = generateNarration(customScenario, cascade)

  return {
    scenario: customScenario,
    event,
    cascade,
    narration,
    simulatedAt: new Date().toISOString(),
  }
}
