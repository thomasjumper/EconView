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

// ── Commodity Types ────────────────────────────────────────────────────
export interface Commodity {
  id: string
  name: string
  category: 'energy' | 'metals' | 'agriculture' | 'livestock'
  unit: string
  price: number
  change24h: number
  currency: string
}

// ── Forex Types ────────────────────────────────────────────────────────
export interface ForexPair {
  id: string
  base: string
  quote: string
  rate: number
  change24h: number
  volume24h?: number
}

// ── Bond/Sovereign Debt Types ──────────────────────────────────────────
export interface SovereignBond {
  country: string
  countryCode: string
  tenor: string  // '2Y', '5Y', '10Y', '30Y'
  yield: number
  change: number
  spread?: number  // vs US Treasury
}

// ── Central Bank Types ─────────────────────────────────────────────────
export interface CentralBank {
  id: string
  name: string
  country: string
  countryCode: string
  policyRate: number
  lastChange: number
  lastChangeDate: string
  nextMeetingDate?: string
  inflationTarget?: number
  balanceSheet?: number
}

// ── Global Economic Indicators ─────────────────────────────────────────
export interface EconomicIndicator {
  id: string
  name: string
  category: 'growth' | 'inflation' | 'employment' | 'trade' | 'monetary' | 'fiscal' | 'housing' | 'manufacturing' | 'consumer' | 'shipping'
  value: number
  previousValue?: number
  unit: string
  country?: string
  source: string
  lastUpdated: string
}

// ── International Exchange ─────────────────────────────────────────────
export interface ExchangeDef {
  id: string
  label: string
  country: string
  countryCode: string
  region: string
  type: 'equity' | 'bond' | 'commodity' | 'crypto' | 'derivatives'
  marketCap: number
  currency: string
  timezone: string
  indexTicker?: string
  indexName?: string
}

// ── Region groupings ───────────────────────────────────────────────────
export type WorldRegion = 
  | 'north_america'
  | 'latin_america'
  | 'western_europe'
  | 'eastern_europe'
  | 'middle_east'
  | 'africa'
  | 'south_asia'
  | 'east_asia'
  | 'southeast_asia'
  | 'oceania'

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
