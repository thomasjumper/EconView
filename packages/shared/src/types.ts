export type ZoomLevel = 'global' | 'market' | 'sector' | 'entity'

export interface EconNode {
  id: string
  type: 'country' | 'market' | 'sector' | 'entity'
  label: string
  countryCode?: string
  gdp?: number
  gdpGrowth?: number
  population?: number
  exchangeCode?: string
  marketCap?: number
  sectorCode?: string
  ticker?: string
  price?: number
  change24h?: number
  volume?: number
  x?: number
  y?: number
  z?: number
  size?: number
  color?: string
  children?: string[]
  parent?: string
  region?: string
  currency?: string
  inflation?: number
  unemployment?: number
  debtToGdp?: number
  tradeBalance?: number
  interestRate?: number
  creditRating?: string
  hdi?: number
}

export interface EconEdge {
  id: string
  source: string
  target: string
  type: 'trade' | 'capital_flow' | 'currency_pair' | 'supply_chain' | 'ownership' | 'sector_membership' | 'remittance' | 'fdi' | 'debt'
  weight: number
  value?: number
  direction?: 'bidirectional' | 'source_to_target' | 'target_to_source'
  metadata?: Record<string, unknown>
}

export interface EconGraph {
  nodes: EconNode[]
  edges: EconEdge[]
  currentZoom: ZoomLevel
  focusNodeId?: string
}

export const GICS_SECTORS = {
  energy: { label: 'Energy', color: '#F59E0B' },
  materials: { label: 'Materials', color: '#84CC16' },
  industrials: { label: 'Industrials', color: '#6B7280' },
  consumer_discretionary: { label: 'Consumer Discretionary', color: '#EC4899' },
  consumer_staples: { label: 'Consumer Staples', color: '#10B981' },
  health_care: { label: 'Health Care', color: '#3B82F6' },
  financials: { label: 'Financials', color: '#8B5CF6' },
  information_technology: { label: 'Information Technology', color: '#06B6D4' },
  communication_services: { label: 'Communication Services', color: '#F97316' },
  utilities: { label: 'Utilities', color: '#EF4444' },
  real_estate: { label: 'Real Estate', color: '#A855F7' },
} as const

// ---------------------------------------------------------------------------
// Commodity, Forex, Bond, CentralBank, Indicator, Exchange, Region types
// ---------------------------------------------------------------------------

export interface Commodity {
  id: string
  name: string
  category: 'energy' | 'precious_metals' | 'industrial_metals' | 'agriculture' | 'livestock'
  price: number
  change24h: number
  unit: string
  symbol?: string
}

export interface ForexPair {
  id: string
  base: string
  quote: string
  rate: number
  change24h: number
  category: 'g10' | 'cross' | 'em' | 'crypto_fiat'
}

export interface SovereignBond {
  countryCode: string
  country: string
  yield2Y?: number
  yield5Y?: number
  yield10Y: number
  yield30Y?: number
  spreadVsUS?: number
}

export interface CentralBank {
  id: string
  name: string
  abbreviation: string
  countryCode: string
  policyRate: number
  lastChange: string
  inflationTarget?: number
}

export interface EconomicIndicator {
  id: string
  name: string
  category: 'manufacturing' | 'inflation' | 'employment' | 'trade' | 'consumer' | 'housing' | 'shipping' | 'volatility'
  value: number
  previousValue?: number
  unit: string
  country?: string
  lastUpdated: string
}

export interface ExchangeDef {
  id: string
  name: string
  countryCode: string
  region: string
  marketCap: number
  currency: string
  timezone: string
}

export interface WorldRegion {
  id: string
  name: string
  color: string
  countries: string[]
}

// ---------------------------------------------------------------------------
// Calendar Events (Finnhub)
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  date: string
  type: 'earnings' | 'economic' | 'ipo' | 'central_bank'
  title: string
  country?: string
  impact?: 'low' | 'medium' | 'high'
  actual?: number
  estimate?: number
  ticker?: string
}

// ---------------------------------------------------------------------------
// DeFi Overview (DefiLlama + Fear & Greed)
// ---------------------------------------------------------------------------

export interface DeFiOverview {
  totalTVL: number
  change24h: number
  topProtocols: { name: string; tvl: number; change24h: number; chain: string }[]
  stablecoins: {
    totalSupply: number
    breakdown: { name: string; supply: number; change7d: number }[]
  }
  fearGreed: { value: number; classification: string }
}

// ---------------------------------------------------------------------------
// Tier 2: Supply Chain, Property, Conflict
// ---------------------------------------------------------------------------

export interface SupplyChainData {
  date: string
  gscpi: number
  trend: 'improving' | 'worsening' | 'stable'
  history: { date: string; value: number }[]
}

export interface PropertyPriceData {
  countryCode: string
  country: string
  indexValue: number
  yoyChange: number
  lastQuarter: string
}

export interface ConflictData {
  countryCode: string
  country: string
  conflictIntensity: number
  eventCount30d: number
  trend: 'escalating' | 'de-escalating' | 'stable'
  primaryType: string
}

// ---------------------------------------------------------------------------
// Vessel Tracking & Shipping
// ---------------------------------------------------------------------------

export type VesselType = 'container' | 'tanker' | 'bulk_carrier' | 'lng' | 'car_carrier' | 'cruise' | 'other'
export type CargoType = 'crude_oil' | 'refined_products' | 'lng' | 'coal' | 'iron_ore' | 'grain' | 'containers' | 'vehicles' | 'chemicals' | 'unknown'

export interface VesselPosition {
  mmsi: string
  name: string
  type: VesselType
  lat: number
  lon: number
  heading: number
  speed: number
  destination: string
  origin: string
  eta: string
  cargo: CargoType
  estimatedValue: number
  dwt: number
  flag: string
}

export interface ShippingLane {
  id: string
  name: string
  origin: string
  destination: string
  activeVessels: number
  avgTransitDays: number
  estimatedDailyValue: number
  congestionIndex: number
  waypoints: [number, number][]
  trend: 'increasing' | 'stable' | 'decreasing'
  cargoType: CargoType
}

export interface PortStatus {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  annualTEU: number
  currentCongestion: number
  avgWaitDays: number
  vesselsAtAnchor: number
  throughputTrend: 'up' | 'stable' | 'down'
  topTradePartners: string[]
}

// ---------------------------------------------------------------------------
// Capital and Debt Flows
// ---------------------------------------------------------------------------

export interface CapitalFlow {
  id: string
  source: string
  target: string
  flowType: 'portfolio' | 'fdi' | 'banking' | 'central_bank' | 'remittance' | 'trade_settlement'
  dailyVolume: number
  netDirection: 'source_to_target' | 'target_to_source'
  velocity: number
  trend: 'accelerating' | 'stable' | 'decelerating'
}

export interface DebtFlow {
  id: string
  holder: string
  issuer: string
  amount: number
  change30d: number
  instrumentType: 'treasury' | 'sovereign_bond' | 'corporate_bond'
}

// ---------------------------------------------------------------------------
// Events and Cascades
// ---------------------------------------------------------------------------

export type EventType = 'shipping_disruption' | 'trade_policy' | 'commodity_shock' | 'currency_crisis' | 'central_bank_action' | 'geopolitical' | 'supply_chain_break' | 'financial_contagion' | 'natural_disaster' | 'market_crash'

export interface CascadeStep {
  order: number
  entity: string
  entityType: 'country' | 'commodity' | 'sector' | 'company' | 'currency' | 'shipping_lane'
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number
  mechanism: string
  estimatedDelay: string
  confidence: number
}

export interface EconomicEvent {
  id: string
  timestamp: string
  type: EventType
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  location: { lat: number; lon: number; countryCode?: string }
  affectedEntities: string[]
  estimatedImpact: number
  cascadeChain: CascadeStep[]
}

export interface Scenario {
  id: string
  label: string
  description: string
  eventType: EventType
  severity: 'mild' | 'moderate' | 'severe' | 'catastrophic'
  duration: string
  params: Record<string, unknown>
}

export interface ScenarioResult {
  scenario: Scenario
  cascadeChain: CascadeStep[]
  affectedCountries: string[]
  estimatedGlobalImpact: number
  narration: string
}
