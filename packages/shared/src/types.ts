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
}

export interface EconEdge {
  id: string
  source: string
  target: string
  type: 'trade' | 'capital_flow' | 'currency_pair' | 'supply_chain' | 'ownership' | 'sector_membership'
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
