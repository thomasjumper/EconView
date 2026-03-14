import { z } from 'zod'

// World Bank API response
export const WBIndicatorSchema = z.object({
  indicator: z.object({ id: z.string(), value: z.string() }),
  country: z.object({ id: z.string(), value: z.string() }),
  countryiso3code: z.string(),
  date: z.string(),
  value: z.number().nullable(),
})

// FRED series observation
export const FREDObservationSchema = z.object({
  date: z.string(),
  value: z.string(), // FRED returns numbers as strings
})

// Finnhub trade
export const FinnhubTradeSchema = z.object({
  p: z.number(), // price
  s: z.string(), // symbol
  t: z.number(), // timestamp ms
  v: z.number(), // volume
})

// CoinGecko market data
export const CoinGeckoMarketSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  price_change_percentage_24h: z.number().nullable(),
})

// GDELT article
export const GDELTArticleSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  source: z.string().optional(),
  seendate: z.string().optional(),
  tone: z.number().optional(),
})

// AI Query response
export const AIQueryResponseSchema = z.object({
  action: z.enum(['navigate', 'filter', 'highlight', 'mode', 'compare', 'info', 'none']),
  target: z.string().optional(),
  mode: z.string().optional(),
  narration: z.string(),
  highlights: z.array(z.string()).optional(),
})

// EconNode and EconEdge schemas
export const EconNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['country', 'market', 'sector', 'entity']),
  label: z.string(),
  countryCode: z.string().optional(),
  gdp: z.number().optional(),
  gdpGrowth: z.number().optional(),
  population: z.number().optional(),
  exchangeCode: z.string().optional(),
  marketCap: z.number().optional(),
  sectorCode: z.string().optional(),
  ticker: z.string().optional(),
  price: z.number().optional(),
  change24h: z.number().optional(),
  volume: z.number().optional(),
  region: z.string().optional(),
  currency: z.string().optional(),
  inflation: z.number().optional(),
  unemployment: z.number().optional(),
  debtToGdp: z.number().optional(),
  tradeBalance: z.number().optional(),
  interestRate: z.number().optional(),
  creditRating: z.string().optional(),
  hdi: z.number().optional(),
})

export const EconEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['trade', 'capital_flow', 'currency_pair', 'supply_chain', 'ownership', 'sector_membership', 'remittance', 'fdi', 'debt']),
  weight: z.number(),
  value: z.number().optional(),
  direction: z.enum(['bidirectional', 'source_to_target', 'target_to_source']).optional(),
})

// ── New data source schemas ────────────────────────────────────────────

// Commodity data
export const CommoditySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['energy', 'metals', 'agriculture', 'livestock']),
  unit: z.string(),
  price: z.number(),
  change24h: z.number(),
  currency: z.string(),
})

// Forex pair
export const ForexPairSchema = z.object({
  id: z.string(),
  base: z.string(),
  quote: z.string(),
  rate: z.number(),
  change24h: z.number(),
  volume24h: z.number().optional(),
})

// Sovereign bond yield
export const SovereignBondSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  tenor: z.string(),
  yield: z.number(),
  change: z.number(),
  spread: z.number().optional(),
})

// Central bank data
export const CentralBankSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  policyRate: z.number(),
  lastChange: z.number(),
  lastChangeDate: z.string(),
  nextMeetingDate: z.string().optional(),
  inflationTarget: z.number().optional(),
  balanceSheet: z.number().optional(),
})

// Economic indicator
export const EconomicIndicatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['growth', 'inflation', 'employment', 'trade', 'monetary', 'fiscal', 'housing', 'manufacturing', 'consumer', 'shipping']),
  value: z.number(),
  previousValue: z.number().optional(),
  unit: z.string(),
  country: z.string().optional(),
  source: z.string(),
  lastUpdated: z.string(),
})

// Inferred types from schemas
export type WBIndicator = z.infer<typeof WBIndicatorSchema>
export type FREDObservation = z.infer<typeof FREDObservationSchema>
export type FinnhubTrade = z.infer<typeof FinnhubTradeSchema>
export type CoinGeckoMarket = z.infer<typeof CoinGeckoMarketSchema>
export type GDELTArticle = z.infer<typeof GDELTArticleSchema>
export type AIQueryResponse = z.infer<typeof AIQueryResponseSchema>
