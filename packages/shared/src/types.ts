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
  // Extended fields for global economy
  region?: string
  currency?: string
  inflation?: number
  unemployment?: number
  debtToGdp?: number
  tradeBalance?: number
  interestRate?: number
  creditRating?: string
  hdi?: number // Human Development Index
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

export const WORLD_REGIONS: Record<WorldRegion, { label: string; color: string }> = {
  north_america: { label: 'North America', color: '#3B82F6' },
  latin_america: { label: 'Latin America', color: '#10B981' },
  western_europe: { label: 'Western Europe', color: '#8B5CF6' },
  eastern_europe: { label: 'Eastern Europe', color: '#6366F1' },
  middle_east: { label: 'Middle East', color: '#F59E0B' },
  africa: { label: 'Africa', color: '#EF4444' },
  south_asia: { label: 'South Asia', color: '#EC4899' },
  east_asia: { label: 'East Asia', color: '#06B6D4' },
  southeast_asia: { label: 'Southeast Asia', color: '#14B8A6' },
  oceania: { label: 'Oceania', color: '#84CC16' },
}
