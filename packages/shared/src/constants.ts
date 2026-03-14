import type { WorldRegion } from './types'

export const COLORS = {
  bg: '#050810',
  bgLight: '#0A0F1E',
  blue: '#00D4FF',
  green: '#00FF9F',
  red: '#FF4545',
  amber: '#F59E0B',
  neutral: '#94A3B8',
} as const

export const FINNHUB_WS_MAX_SYMBOLS = 50
export const COINGECKO_POLL_MS = 5 * 60 * 1000
export const FRED_POLL_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// World Regions
// ---------------------------------------------------------------------------

export const WORLD_REGIONS: WorldRegion[] = [
  { id: 'north_america', name: 'North America', color: '#3B82F6', countries: ['USA', 'CAN', 'MEX'] },
  { id: 'western_europe', name: 'Western Europe', color: '#8B5CF6', countries: ['GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'NLD', 'CHE', 'BEL', 'AUT', 'SWE', 'NOR', 'DNK', 'FIN', 'IRL', 'PRT'] },
  { id: 'eastern_europe', name: 'Eastern Europe', color: '#A855F7', countries: ['POL', 'CZE', 'RUS', 'TUR', 'KAZ'] },
  { id: 'east_asia', name: 'East Asia', color: '#EF4444', countries: ['CHN', 'JPN', 'KOR', 'HKG'] },
  { id: 'south_se_asia', name: 'South & SE Asia', color: '#F97316', countries: ['IND', 'IDN', 'THA', 'SGP', 'PHL', 'MYS', 'VNM', 'BGD', 'PAK'] },
  { id: 'oceania', name: 'Oceania', color: '#06B6D4', countries: ['AUS', 'NZL'] },
  { id: 'middle_east', name: 'Middle East', color: '#F59E0B', countries: ['SAU', 'ARE', 'ISR', 'QAT', 'EGY'] },
  { id: 'latin_america', name: 'Latin America', color: '#10B981', countries: ['BRA', 'ARG', 'COL', 'CHL', 'PER', 'MEX'] },
  { id: 'africa', name: 'Africa', color: '#84CC16', countries: ['ZAF', 'NGA'] },
  { id: 'special', name: 'Special Markets', color: '#64748B', countries: [] },
]

// ---------------------------------------------------------------------------
// Data Sources Registry
// ---------------------------------------------------------------------------

export const DATA_SOURCES = {
  worldbank: { name: 'World Bank', keyRequired: false, rateLimit: 'generous' },
  fred: { name: 'FRED', keyRequired: true, rateLimit: '120/min' },
  finnhub: { name: 'Finnhub', keyRequired: true, rateLimit: '60/min REST, 50 WS symbols' },
  coingecko: { name: 'CoinGecko', keyRequired: true, rateLimit: '10K/month' },
  edgar: { name: 'SEC EDGAR', keyRequired: false, rateLimit: '10/sec' },
  gdelt: { name: 'GDELT', keyRequired: false, rateLimit: 'generous' },
  exchangerate: { name: 'ExchangeRate.host', keyRequired: false, rateLimit: '1500/month free' },
  metalsdev: { name: 'Metals.dev', keyRequired: true, rateLimit: '100/month free' },
  imf: { name: 'IMF', keyRequired: false, rateLimit: 'generous' },
  ecb: { name: 'ECB', keyRequired: false, rateLimit: 'generous' },
  bis: { name: 'BIS', keyRequired: false, rateLimit: 'generous' },
  oecd: { name: 'OECD', keyRequired: false, rateLimit: 'generous' },
  eurostat: { name: 'Eurostat', keyRequired: false, rateLimit: 'generous' },
  comtrade: { name: 'UN Comtrade', keyRequired: true, rateLimit: '500/day' },
} as const
