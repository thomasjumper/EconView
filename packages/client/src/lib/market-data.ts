import type { EconNode, EconEdge } from '@econview/shared'
import { GICS_SECTORS } from '@econview/shared'

// ── US Markets ──────────────────────────────────────────────────────────

export interface MarketDef {
  id: string
  label: string
  type: 'equity' | 'bond' | 'commodity' | 'crypto'
  marketCap: number
}

export const US_MARKETS: MarketDef[] = [
  { id: 'NYSE', label: 'New York Stock Exchange', type: 'equity', marketCap: 28.4e12 },
  { id: 'NASDAQ', label: 'NASDAQ', type: 'equity', marketCap: 25.5e12 },
  { id: 'BOND', label: 'US Bond Market', type: 'bond', marketCap: 51.3e12 },
  { id: 'CME', label: 'CME Group', type: 'commodity', marketCap: 5.8e12 },
  { id: 'CRYPTO', label: 'Crypto Markets', type: 'crypto', marketCap: 2.8e12 },
]

// ── GICS Sectors ────────────────────────────────────────────────────────

export interface SectorDef {
  id: string
  label: string
  color: string
  marketCap: number
}

export const SECTORS: SectorDef[] = [
  { id: 'information_technology', label: 'Information Technology', color: GICS_SECTORS.information_technology.color, marketCap: 16.2e12 },
  { id: 'health_care', label: 'Health Care', color: GICS_SECTORS.health_care.color, marketCap: 7.1e12 },
  { id: 'financials', label: 'Financials', color: GICS_SECTORS.financials.color, marketCap: 8.9e12 },
  { id: 'consumer_discretionary', label: 'Consumer Discretionary', color: GICS_SECTORS.consumer_discretionary.color, marketCap: 6.4e12 },
  { id: 'communication_services', label: 'Communication Services', color: GICS_SECTORS.communication_services.color, marketCap: 5.5e12 },
  { id: 'industrials', label: 'Industrials', color: GICS_SECTORS.industrials.color, marketCap: 5.8e12 },
  { id: 'consumer_staples', label: 'Consumer Staples', color: GICS_SECTORS.consumer_staples.color, marketCap: 3.9e12 },
  { id: 'energy', label: 'Energy', color: GICS_SECTORS.energy.color, marketCap: 2.7e12 },
  { id: 'utilities', label: 'Utilities', color: GICS_SECTORS.utilities.color, marketCap: 1.6e12 },
  { id: 'real_estate', label: 'Real Estate', color: GICS_SECTORS.real_estate.color, marketCap: 1.3e12 },
  { id: 'materials', label: 'Materials', color: GICS_SECTORS.materials.color, marketCap: 1.8e12 },
]

// ── Companies by Sector ─────────────────────────────────────────────────

export interface CompanyDef {
  id: string
  ticker: string
  label: string
  sector: string
  marketCap: number
  color: string
}

export const COMPANIES: Record<string, CompanyDef[]> = {
  information_technology: [
    { id: 'AAPL', ticker: 'AAPL', label: 'Apple', sector: 'information_technology', marketCap: 3.44e12, color: GICS_SECTORS.information_technology.color },
    { id: 'MSFT', ticker: 'MSFT', label: 'Microsoft', sector: 'information_technology', marketCap: 3.12e12, color: GICS_SECTORS.information_technology.color },
    { id: 'NVDA', ticker: 'NVDA', label: 'NVIDIA', sector: 'information_technology', marketCap: 3.39e12, color: GICS_SECTORS.information_technology.color },
    { id: 'AVGO', ticker: 'AVGO', label: 'Broadcom', sector: 'information_technology', marketCap: 810e9, color: GICS_SECTORS.information_technology.color },
    { id: 'ORCL', ticker: 'ORCL', label: 'Oracle', sector: 'information_technology', marketCap: 420e9, color: GICS_SECTORS.information_technology.color },
    { id: 'CRM', ticker: 'CRM', label: 'Salesforce', sector: 'information_technology', marketCap: 285e9, color: GICS_SECTORS.information_technology.color },
    { id: 'ADBE', ticker: 'ADBE', label: 'Adobe', sector: 'information_technology', marketCap: 220e9, color: GICS_SECTORS.information_technology.color },
    { id: 'AMD', ticker: 'AMD', label: 'AMD', sector: 'information_technology', marketCap: 195e9, color: GICS_SECTORS.information_technology.color },
  ],
  health_care: [
    { id: 'LLY', ticker: 'LLY', label: 'Eli Lilly', sector: 'health_care', marketCap: 760e9, color: GICS_SECTORS.health_care.color },
    { id: 'UNH', ticker: 'UNH', label: 'UnitedHealth', sector: 'health_care', marketCap: 540e9, color: GICS_SECTORS.health_care.color },
    { id: 'JNJ', ticker: 'JNJ', label: 'Johnson & Johnson', sector: 'health_care', marketCap: 390e9, color: GICS_SECTORS.health_care.color },
    { id: 'ABBV', ticker: 'ABBV', label: 'AbbVie', sector: 'health_care', marketCap: 310e9, color: GICS_SECTORS.health_care.color },
    { id: 'MRK', ticker: 'MRK', label: 'Merck', sector: 'health_care', marketCap: 270e9, color: GICS_SECTORS.health_care.color },
    { id: 'TMO', ticker: 'TMO', label: 'Thermo Fisher', sector: 'health_care', marketCap: 210e9, color: GICS_SECTORS.health_care.color },
  ],
  financials: [
    { id: 'BRK.B', ticker: 'BRK.B', label: 'Berkshire Hathaway', sector: 'financials', marketCap: 1.08e12, color: GICS_SECTORS.financials.color },
    { id: 'JPM', ticker: 'JPM', label: 'JPMorgan Chase', sector: 'financials', marketCap: 680e9, color: GICS_SECTORS.financials.color },
    { id: 'V', ticker: 'V', label: 'Visa', sector: 'financials', marketCap: 580e9, color: GICS_SECTORS.financials.color },
    { id: 'MA', ticker: 'MA', label: 'Mastercard', sector: 'financials', marketCap: 460e9, color: GICS_SECTORS.financials.color },
    { id: 'BAC', ticker: 'BAC', label: 'Bank of America', sector: 'financials', marketCap: 340e9, color: GICS_SECTORS.financials.color },
    { id: 'GS', ticker: 'GS', label: 'Goldman Sachs', sector: 'financials', marketCap: 170e9, color: GICS_SECTORS.financials.color },
  ],
  consumer_discretionary: [
    { id: 'AMZN', ticker: 'AMZN', label: 'Amazon', sector: 'consumer_discretionary', marketCap: 2.15e12, color: GICS_SECTORS.consumer_discretionary.color },
    { id: 'TSLA', ticker: 'TSLA', label: 'Tesla', sector: 'consumer_discretionary', marketCap: 560e9, color: GICS_SECTORS.consumer_discretionary.color },
    { id: 'HD', ticker: 'HD', label: 'Home Depot', sector: 'consumer_discretionary', marketCap: 380e9, color: GICS_SECTORS.consumer_discretionary.color },
    { id: 'MCD', ticker: 'MCD', label: "McDonald's", sector: 'consumer_discretionary', marketCap: 210e9, color: GICS_SECTORS.consumer_discretionary.color },
    { id: 'NKE', ticker: 'NKE', label: 'Nike', sector: 'consumer_discretionary', marketCap: 120e9, color: GICS_SECTORS.consumer_discretionary.color },
    { id: 'SBUX', ticker: 'SBUX', label: 'Starbucks', sector: 'consumer_discretionary', marketCap: 105e9, color: GICS_SECTORS.consumer_discretionary.color },
  ],
  communication_services: [
    { id: 'META', ticker: 'META', label: 'Meta Platforms', sector: 'communication_services', marketCap: 1.58e12, color: GICS_SECTORS.communication_services.color },
    { id: 'GOOGL', ticker: 'GOOGL', label: 'Alphabet', sector: 'communication_services', marketCap: 2.16e12, color: GICS_SECTORS.communication_services.color },
    { id: 'NFLX', ticker: 'NFLX', label: 'Netflix', sector: 'communication_services', marketCap: 390e9, color: GICS_SECTORS.communication_services.color },
    { id: 'DIS', ticker: 'DIS', label: 'Walt Disney', sector: 'communication_services', marketCap: 195e9, color: GICS_SECTORS.communication_services.color },
    { id: 'CMCSA', ticker: 'CMCSA', label: 'Comcast', sector: 'communication_services', marketCap: 155e9, color: GICS_SECTORS.communication_services.color },
  ],
  industrials: [
    { id: 'GE', ticker: 'GE', label: 'GE Aerospace', sector: 'industrials', marketCap: 220e9, color: GICS_SECTORS.industrials.color },
    { id: 'CAT', ticker: 'CAT', label: 'Caterpillar', sector: 'industrials', marketCap: 180e9, color: GICS_SECTORS.industrials.color },
    { id: 'UNP', ticker: 'UNP', label: 'Union Pacific', sector: 'industrials', marketCap: 155e9, color: GICS_SECTORS.industrials.color },
    { id: 'RTX', ticker: 'RTX', label: 'RTX Corp', sector: 'industrials', marketCap: 150e9, color: GICS_SECTORS.industrials.color },
    { id: 'HON', ticker: 'HON', label: 'Honeywell', sector: 'industrials', marketCap: 140e9, color: GICS_SECTORS.industrials.color },
    { id: 'BA', ticker: 'BA', label: 'Boeing', sector: 'industrials', marketCap: 115e9, color: GICS_SECTORS.industrials.color },
  ],
  consumer_staples: [
    { id: 'WMT', ticker: 'WMT', label: 'Walmart', sector: 'consumer_staples', marketCap: 620e9, color: GICS_SECTORS.consumer_staples.color },
    { id: 'PG', ticker: 'PG', label: 'Procter & Gamble', sector: 'consumer_staples', marketCap: 390e9, color: GICS_SECTORS.consumer_staples.color },
    { id: 'COST', ticker: 'COST', label: 'Costco', sector: 'consumer_staples', marketCap: 380e9, color: GICS_SECTORS.consumer_staples.color },
    { id: 'KO', ticker: 'KO', label: 'Coca-Cola', sector: 'consumer_staples', marketCap: 270e9, color: GICS_SECTORS.consumer_staples.color },
    { id: 'PEP', ticker: 'PEP', label: 'PepsiCo', sector: 'consumer_staples', marketCap: 230e9, color: GICS_SECTORS.consumer_staples.color },
  ],
  energy: [
    { id: 'XOM', ticker: 'XOM', label: 'ExxonMobil', sector: 'energy', marketCap: 480e9, color: GICS_SECTORS.energy.color },
    { id: 'CVX', ticker: 'CVX', label: 'Chevron', sector: 'energy', marketCap: 280e9, color: GICS_SECTORS.energy.color },
    { id: 'COP', ticker: 'COP', label: 'ConocoPhillips', sector: 'energy', marketCap: 130e9, color: GICS_SECTORS.energy.color },
    { id: 'SLB', ticker: 'SLB', label: 'Schlumberger', sector: 'energy', marketCap: 65e9, color: GICS_SECTORS.energy.color },
    { id: 'EOG', ticker: 'EOG', label: 'EOG Resources', sector: 'energy', marketCap: 60e9, color: GICS_SECTORS.energy.color },
  ],
  utilities: [
    { id: 'NEE', ticker: 'NEE', label: 'NextEra Energy', sector: 'utilities', marketCap: 155e9, color: GICS_SECTORS.utilities.color },
    { id: 'SO', ticker: 'SO', label: 'Southern Co', sector: 'utilities', marketCap: 95e9, color: GICS_SECTORS.utilities.color },
    { id: 'DUK', ticker: 'DUK', label: 'Duke Energy', sector: 'utilities', marketCap: 82e9, color: GICS_SECTORS.utilities.color },
    { id: 'CEG', ticker: 'CEG', label: 'Constellation Energy', sector: 'utilities', marketCap: 72e9, color: GICS_SECTORS.utilities.color },
    { id: 'AEP', ticker: 'AEP', label: 'American Electric', sector: 'utilities', marketCap: 50e9, color: GICS_SECTORS.utilities.color },
  ],
  real_estate: [
    { id: 'PLD', ticker: 'PLD', label: 'Prologis', sector: 'real_estate', marketCap: 110e9, color: GICS_SECTORS.real_estate.color },
    { id: 'AMT', ticker: 'AMT', label: 'American Tower', sector: 'real_estate', marketCap: 95e9, color: GICS_SECTORS.real_estate.color },
    { id: 'EQIX', ticker: 'EQIX', label: 'Equinix', sector: 'real_estate', marketCap: 80e9, color: GICS_SECTORS.real_estate.color },
    { id: 'SPG', ticker: 'SPG', label: 'Simon Property', sector: 'real_estate', marketCap: 55e9, color: GICS_SECTORS.real_estate.color },
    { id: 'PSA', ticker: 'PSA', label: 'Public Storage', sector: 'real_estate', marketCap: 52e9, color: GICS_SECTORS.real_estate.color },
  ],
  materials: [
    { id: 'LIN', ticker: 'LIN', label: 'Linde', sector: 'materials', marketCap: 210e9, color: GICS_SECTORS.materials.color },
    { id: 'APD', ticker: 'APD', label: 'Air Products', sector: 'materials', marketCap: 65e9, color: GICS_SECTORS.materials.color },
    { id: 'SHW', ticker: 'SHW', label: 'Sherwin-Williams', sector: 'materials', marketCap: 85e9, color: GICS_SECTORS.materials.color },
    { id: 'FCX', ticker: 'FCX', label: 'Freeport-McMoRan', sector: 'materials', marketCap: 60e9, color: GICS_SECTORS.materials.color },
    { id: 'ECL', ticker: 'ECL', label: 'Ecolab', sector: 'materials', marketCap: 55e9, color: GICS_SECTORS.materials.color },
  ],
}

// ── Hierarchy Lookup Helpers ────────────────────────────────────────────

export function getMarketsForCountry(countryId: string): EconNode[] {
  // Only US markets for now
  if (countryId !== 'USA') return []
  return US_MARKETS.map((m) => ({
    id: m.id,
    type: 'market' as const,
    label: m.label,
    exchangeCode: m.id,
    marketCap: m.marketCap,
    parent: countryId,
    children: SECTORS.map((s) => s.id),
  }))
}

export function getSectorsForMarket(_marketId: string): EconNode[] {
  return SECTORS.map((s) => ({
    id: s.id,
    type: 'sector' as const,
    label: s.label,
    sectorCode: s.id,
    marketCap: s.marketCap,
    color: s.color,
    children: (COMPANIES[s.id] ?? []).map((c) => c.id),
  }))
}

export function getCompaniesForSector(sectorId: string): EconNode[] {
  const companies = COMPANIES[sectorId] ?? []
  const sectorDef = SECTORS.find((s) => s.id === sectorId)
  return companies.map((c) => ({
    id: c.id,
    type: 'entity' as const,
    label: c.label,
    ticker: c.ticker,
    marketCap: c.marketCap,
    sectorCode: c.sector,
    color: sectorDef?.color ?? c.color,
    parent: sectorId,
  }))
}

export function getNodesForZoom(
  zoomLevel: 'global' | 'market' | 'sector' | 'entity',
  zoomPath: string[],
  countryNodes: EconNode[],
): EconNode[] {
  switch (zoomLevel) {
    case 'global':
      return countryNodes
    case 'market':
      return getMarketsForCountry(zoomPath[0] ?? '')
    case 'sector':
      return getSectorsForMarket(zoomPath[1] ?? '')
    case 'entity':
      return getCompaniesForSector(zoomPath[2] ?? '')
    default:
      return countryNodes
  }
}

export function getEdgesForZoom(
  zoomLevel: 'global' | 'market' | 'sector' | 'entity',
  tradeEdges: EconEdge[],
): EconEdge[] {
  // Only show trade edges at global level
  if (zoomLevel === 'global') return tradeEdges
  return []
}

// Label for zoom path breadcrumbs
export function getZoomPathLabels(zoomPath: string[], countryNodes: EconNode[]): string[] {
  return zoomPath.map((id, i) => {
    if (i === 0) {
      const country = countryNodes.find((c) => c.id === id)
      return country?.label ?? id
    }
    if (i === 1) {
      const market = US_MARKETS.find((m) => m.id === id)
      return market?.label ?? id
    }
    if (i === 2) {
      const sector = SECTORS.find((s) => s.id === id)
      return sector?.label ?? id
    }
    return id
  })
}
