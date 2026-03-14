export const COLORS = {
  bg: '#050810',
  bgLight: '#0A0F1E',
  blue: '#00D4FF',
  green: '#00FF9F',
  red: '#FF4545',
  amber: '#F59E0B',
  neutral: '#94A3B8',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
} as const

export const FINNHUB_WS_MAX_SYMBOLS = 50
export const COINGECKO_POLL_MS = 5 * 60 * 1000
export const FRED_POLL_MS = 5 * 60 * 1000
export const FOREX_POLL_MS = 5 * 60 * 1000
export const COMMODITIES_POLL_MS = 5 * 60 * 1000
export const INDICATORS_POLL_MS = 15 * 60 * 1000

// Data source configuration
export const DATA_SOURCES = {
  worldBank: { name: 'World Bank', url: 'https://api.worldbank.org', free: true },
  fred: { name: 'FRED (Federal Reserve)', url: 'https://api.stlouisfed.org', free: true, keyRequired: true },
  finnhub: { name: 'Finnhub', url: 'wss://ws.finnhub.io', free: true, keyRequired: true },
  coinGecko: { name: 'CoinGecko', url: 'https://api.coingecko.com', free: true },
  secEdgar: { name: 'SEC EDGAR', url: 'https://data.sec.gov', free: true },
  gdelt: { name: 'GDELT Project', url: 'https://api.gdeltproject.org', free: true },
  exchangeRate: { name: 'ExchangeRate.host', url: 'https://api.exchangerate.host', free: true },
  metalsDev: { name: 'Metals.dev', url: 'https://api.metals.dev', free: true },
  imf: { name: 'IMF Data', url: 'https://www.imf.org/external/datamapper/api', free: true },
  ecb: { name: 'ECB Statistical Data Warehouse', url: 'https://sdw-wsrest.ecb.europa.eu', free: true },
  bis: { name: 'Bank for International Settlements', url: 'https://stats.bis.org', free: true },
  oecd: { name: 'OECD Data', url: 'https://stats.oecd.org', free: true },
  eurostat: { name: 'Eurostat', url: 'https://ec.europa.eu/eurostat', free: true },
  unComtrade: { name: 'UN Comtrade', url: 'https://comtradeapi.un.org', free: true },
} as const
