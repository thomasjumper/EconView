import type { Commodity, ForexPair, SovereignBond, CentralBank, EconomicIndicator } from '@econview/shared'

// ── Key Commodities ────────────────────────────────────────────────────

export const COMMODITIES: Commodity[] = [
  // Energy
  { id: 'CL', name: 'Crude Oil (WTI)', category: 'energy', unit: 'bbl', price: 73.50, change24h: -0.8, currency: 'USD' },
  { id: 'BZ', name: 'Brent Crude', category: 'energy', unit: 'bbl', price: 77.20, change24h: -0.6, currency: 'USD' },
  { id: 'NG', name: 'Natural Gas', category: 'energy', unit: 'MMBtu', price: 3.85, change24h: 1.2, currency: 'USD' },
  { id: 'HO', name: 'Heating Oil', category: 'energy', unit: 'gal', price: 2.45, change24h: -0.3, currency: 'USD' },
  { id: 'RB', name: 'Gasoline (RBOB)', category: 'energy', unit: 'gal', price: 2.18, change24h: 0.5, currency: 'USD' },
  { id: 'COAL', name: 'Coal (Newcastle)', category: 'energy', unit: 'ton', price: 135.00, change24h: -1.1, currency: 'USD' },
  { id: 'UX', name: 'Uranium', category: 'energy', unit: 'lb', price: 85.50, change24h: 0.8, currency: 'USD' },

  // Precious Metals
  { id: 'GC', name: 'Gold', category: 'metals', unit: 'oz', price: 2650.00, change24h: 0.4, currency: 'USD' },
  { id: 'SI', name: 'Silver', category: 'metals', unit: 'oz', price: 31.50, change24h: 0.9, currency: 'USD' },
  { id: 'PL', name: 'Platinum', category: 'metals', unit: 'oz', price: 985.00, change24h: -0.2, currency: 'USD' },
  { id: 'PA', name: 'Palladium', category: 'metals', unit: 'oz', price: 1020.00, change24h: -1.5, currency: 'USD' },

  // Industrial Metals
  { id: 'HG', name: 'Copper', category: 'metals', unit: 'lb', price: 4.25, change24h: 0.6, currency: 'USD' },
  { id: 'ALI', name: 'Aluminum', category: 'metals', unit: 'ton', price: 2380.00, change24h: 0.3, currency: 'USD' },
  { id: 'NICKEL', name: 'Nickel', category: 'metals', unit: 'ton', price: 16800.00, change24h: -0.7, currency: 'USD' },
  { id: 'ZINC', name: 'Zinc', category: 'metals', unit: 'ton', price: 2750.00, change24h: 0.2, currency: 'USD' },
  { id: 'TIN', name: 'Tin', category: 'metals', unit: 'ton', price: 27500.00, change24h: 1.1, currency: 'USD' },
  { id: 'IRON', name: 'Iron Ore', category: 'metals', unit: 'ton', price: 108.00, change24h: -2.1, currency: 'USD' },
  { id: 'LITHIUM', name: 'Lithium Carbonate', category: 'metals', unit: 'ton', price: 14500.00, change24h: -0.5, currency: 'USD' },
  { id: 'COBALT', name: 'Cobalt', category: 'metals', unit: 'ton', price: 28000.00, change24h: 0.1, currency: 'USD' },
  { id: 'RAREEARTH', name: 'Rare Earth (Neodymium)', category: 'metals', unit: 'kg', price: 72.00, change24h: -0.3, currency: 'USD' },

  // Agriculture
  { id: 'ZW', name: 'Wheat', category: 'agriculture', unit: 'bu', price: 5.85, change24h: -0.4, currency: 'USD' },
  { id: 'ZC', name: 'Corn', category: 'agriculture', unit: 'bu', price: 4.55, change24h: 0.2, currency: 'USD' },
  { id: 'ZS', name: 'Soybeans', category: 'agriculture', unit: 'bu', price: 12.30, change24h: -0.6, currency: 'USD' },
  { id: 'CT', name: 'Cotton', category: 'agriculture', unit: 'lb', price: 0.78, change24h: 0.3, currency: 'USD' },
  { id: 'CC', name: 'Cocoa', category: 'agriculture', unit: 'ton', price: 8200.00, change24h: 2.1, currency: 'USD' },
  { id: 'KC', name: 'Coffee', category: 'agriculture', unit: 'lb', price: 3.25, change24h: 1.5, currency: 'USD' },
  { id: 'SB', name: 'Sugar', category: 'agriculture', unit: 'lb', price: 0.215, change24h: -0.8, currency: 'USD' },
  { id: 'OJ', name: 'Orange Juice', category: 'agriculture', unit: 'lb', price: 4.50, change24h: 0.7, currency: 'USD' },
  { id: 'ZR', name: 'Rice', category: 'agriculture', unit: 'cwt', price: 17.80, change24h: -0.2, currency: 'USD' },
  { id: 'PALM', name: 'Palm Oil', category: 'agriculture', unit: 'ton', price: 3800.00, change24h: 0.4, currency: 'MYR' },
  { id: 'RUBBER', name: 'Rubber', category: 'agriculture', unit: 'kg', price: 1.72, change24h: -1.3, currency: 'USD' },
  { id: 'LUMBER', name: 'Lumber', category: 'agriculture', unit: 'MBF', price: 520.00, change24h: -0.5, currency: 'USD' },

  // Livestock
  { id: 'LE', name: 'Live Cattle', category: 'livestock', unit: 'lb', price: 1.92, change24h: 0.3, currency: 'USD' },
  { id: 'HE', name: 'Lean Hogs', category: 'livestock', unit: 'lb', price: 0.88, change24h: -0.6, currency: 'USD' },
  { id: 'GF', name: 'Feeder Cattle', category: 'livestock', unit: 'lb', price: 2.65, change24h: 0.1, currency: 'USD' },
]

// ── Major Forex Pairs ──────────────────────────────────────────────────

export const FOREX_PAIRS: ForexPair[] = [
  // Major pairs (G10)
  { id: 'EURUSD', base: 'EUR', quote: 'USD', rate: 1.0845, change24h: -0.15 },
  { id: 'USDJPY', base: 'USD', quote: 'JPY', rate: 149.20, change24h: 0.32 },
  { id: 'GBPUSD', base: 'GBP', quote: 'USD', rate: 1.2680, change24h: -0.08 },
  { id: 'USDCHF', base: 'USD', quote: 'CHF', rate: 0.8835, change24h: 0.12 },
  { id: 'AUDUSD', base: 'AUD', quote: 'USD', rate: 0.6520, change24h: -0.25 },
  { id: 'USDCAD', base: 'USD', quote: 'CAD', rate: 1.3590, change24h: 0.05 },
  { id: 'NZDUSD', base: 'NZD', quote: 'USD', rate: 0.6080, change24h: -0.18 },
  { id: 'EURGBP', base: 'EUR', quote: 'GBP', rate: 0.8555, change24h: -0.07 },
  { id: 'EURJPY', base: 'EUR', quote: 'JPY', rate: 161.80, change24h: 0.18 },
  { id: 'GBPJPY', base: 'GBP', quote: 'JPY', rate: 189.15, change24h: 0.24 },
  { id: 'USDSEK', base: 'USD', quote: 'SEK', rate: 10.55, change24h: 0.15 },
  { id: 'USDNOK', base: 'USD', quote: 'NOK', rate: 10.72, change24h: 0.08 },

  // Emerging market pairs
  { id: 'USDCNY', base: 'USD', quote: 'CNY', rate: 7.245, change24h: 0.03 },
  { id: 'USDINR', base: 'USD', quote: 'INR', rate: 83.45, change24h: 0.02 },
  { id: 'USDBRL', base: 'USD', quote: 'BRL', rate: 4.98, change24h: 0.35 },
  { id: 'USDMXN', base: 'USD', quote: 'MXN', rate: 17.15, change24h: -0.12 },
  { id: 'USDZAR', base: 'USD', quote: 'ZAR', rate: 18.75, change24h: 0.45 },
  { id: 'USDTRY', base: 'USD', quote: 'TRY', rate: 32.50, change24h: 0.08 },
  { id: 'USDKRW', base: 'USD', quote: 'KRW', rate: 1325.00, change24h: 0.15 },
  { id: 'USDTHB', base: 'USD', quote: 'THB', rate: 35.80, change24h: -0.05 },
  { id: 'USDIDR', base: 'USD', quote: 'IDR', rate: 15620.00, change24h: 0.10 },
  { id: 'USDPHP', base: 'USD', quote: 'PHP', rate: 55.85, change24h: 0.08 },
  { id: 'USDPLN', base: 'USD', quote: 'PLN', rate: 4.02, change24h: -0.18 },
  { id: 'USDCZK', base: 'USD', quote: 'CZK', rate: 22.80, change24h: -0.10 },
  { id: 'USDSAR', base: 'USD', quote: 'SAR', rate: 3.7500, change24h: 0.00 },
  { id: 'USDAED', base: 'USD', quote: 'AED', rate: 3.6725, change24h: 0.00 },
  { id: 'USDHKD', base: 'USD', quote: 'HKD', rate: 7.8250, change24h: 0.01 },
  { id: 'USDSGD', base: 'USD', quote: 'SGD', rate: 1.3415, change24h: -0.04 },
  { id: 'USDTWD', base: 'USD', quote: 'TWD', rate: 31.85, change24h: 0.06 },
  { id: 'USDRUB', base: 'USD', quote: 'RUB', rate: 92.50, change24h: 0.25 },
  { id: 'USDARS', base: 'USD', quote: 'ARS', rate: 875.00, change24h: 0.15 },
  { id: 'USDEGP', base: 'USD', quote: 'EGP', rate: 48.50, change24h: 0.05 },
  { id: 'USDNGN', base: 'USD', quote: 'NGN', rate: 1580.00, change24h: 0.30 },
  { id: 'USDPAK', base: 'USD', quote: 'PKR', rate: 278.00, change24h: 0.02 },

  // Crypto-fiat
  { id: 'BTCUSD', base: 'BTC', quote: 'USD', rate: 87250.00, change24h: 2.3 },
  { id: 'ETHUSD', base: 'ETH', quote: 'USD', rate: 3420.00, change24h: -0.8 },
]

// ── Sovereign Bond Yields ──────────────────────────────────────────────

export const SOVEREIGN_BONDS: SovereignBond[] = [
  // US Treasuries
  { country: 'United States', countryCode: 'USA', tenor: '2Y', yield: 4.62, change: -0.02 },
  { country: 'United States', countryCode: 'USA', tenor: '5Y', yield: 4.35, change: -0.01 },
  { country: 'United States', countryCode: 'USA', tenor: '10Y', yield: 4.42, change: 0.03 },
  { country: 'United States', countryCode: 'USA', tenor: '30Y', yield: 4.58, change: 0.02 },

  // Germany (Bunds)
  { country: 'Germany', countryCode: 'DEU', tenor: '2Y', yield: 2.85, change: -0.03, spread: -177 },
  { country: 'Germany', countryCode: 'DEU', tenor: '10Y', yield: 2.48, change: 0.01, spread: -194 },

  // UK Gilts
  { country: 'United Kingdom', countryCode: 'GBR', tenor: '2Y', yield: 4.35, change: -0.01, spread: -27 },
  { country: 'United Kingdom', countryCode: 'GBR', tenor: '10Y', yield: 4.15, change: 0.02, spread: -27 },

  // Japan JGBs
  { country: 'Japan', countryCode: 'JPN', tenor: '2Y', yield: 0.35, change: 0.01, spread: -427 },
  { country: 'Japan', countryCode: 'JPN', tenor: '10Y', yield: 0.95, change: 0.02, spread: -347 },

  // France OATs
  { country: 'France', countryCode: 'FRA', tenor: '10Y', yield: 3.10, change: 0.01, spread: -132 },

  // Italy BTPs
  { country: 'Italy', countryCode: 'ITA', tenor: '10Y', yield: 3.75, change: 0.02, spread: -67 },

  // Spain
  { country: 'Spain', countryCode: 'ESP', tenor: '10Y', yield: 3.30, change: 0.01, spread: -112 },

  // Australia
  { country: 'Australia', countryCode: 'AUS', tenor: '10Y', yield: 4.35, change: 0.03, spread: -7 },

  // Canada
  { country: 'Canada', countryCode: 'CAN', tenor: '10Y', yield: 3.55, change: -0.01, spread: -87 },

  // China
  { country: 'China', countryCode: 'CHN', tenor: '10Y', yield: 2.30, change: -0.02, spread: -212 },

  // India
  { country: 'India', countryCode: 'IND', tenor: '10Y', yield: 7.15, change: 0.01, spread: 273 },

  // Brazil
  { country: 'Brazil', countryCode: 'BRA', tenor: '10Y', yield: 12.50, change: 0.05, spread: 808 },

  // South Korea
  { country: 'South Korea', countryCode: 'KOR', tenor: '10Y', yield: 3.45, change: 0.02, spread: -97 },

  // Mexico
  { country: 'Mexico', countryCode: 'MEX', tenor: '10Y', yield: 9.80, change: -0.03, spread: 538 },

  // South Africa
  { country: 'South Africa', countryCode: 'ZAF', tenor: '10Y', yield: 10.25, change: 0.04, spread: 583 },

  // Turkey
  { country: 'Turkey', countryCode: 'TUR', tenor: '10Y', yield: 28.50, change: -0.15, spread: 2408 },

  // Indonesia
  { country: 'Indonesia', countryCode: 'IDN', tenor: '10Y', yield: 6.85, change: 0.02, spread: 243 },

  // Poland
  { country: 'Poland', countryCode: 'POL', tenor: '10Y', yield: 5.65, change: -0.01, spread: 123 },
]

// ── Central Banks ──────────────────────────────────────────────────────

export const CENTRAL_BANKS: CentralBank[] = [
  { id: 'FED', name: 'Federal Reserve', country: 'United States', countryCode: 'USA', policyRate: 4.50, lastChange: -0.25, lastChangeDate: '2025-12-18', inflationTarget: 2.0, balanceSheet: 7.0e12 },
  { id: 'ECB', name: 'European Central Bank', country: 'Eurozone', countryCode: 'EUR', policyRate: 3.15, lastChange: -0.25, lastChangeDate: '2025-12-12', inflationTarget: 2.0, balanceSheet: 6.3e12 },
  { id: 'BOJ', name: 'Bank of Japan', country: 'Japan', countryCode: 'JPN', policyRate: 0.50, lastChange: 0.25, lastChangeDate: '2025-07-31', inflationTarget: 2.0, balanceSheet: 5.5e12 },
  { id: 'BOE', name: 'Bank of England', country: 'United Kingdom', countryCode: 'GBR', policyRate: 4.50, lastChange: -0.25, lastChangeDate: '2025-11-07', inflationTarget: 2.0, balanceSheet: 0.75e12 },
  { id: 'PBOC', name: "People's Bank of China", country: 'China', countryCode: 'CHN', policyRate: 3.10, lastChange: -0.25, lastChangeDate: '2025-10-21', balanceSheet: 5.8e12 },
  { id: 'SNB', name: 'Swiss National Bank', country: 'Switzerland', countryCode: 'CHE', policyRate: 1.00, lastChange: -0.25, lastChangeDate: '2025-09-26', inflationTarget: 2.0, balanceSheet: 0.8e12 },
  { id: 'RBA', name: 'Reserve Bank of Australia', country: 'Australia', countryCode: 'AUS', policyRate: 4.10, lastChange: -0.25, lastChangeDate: '2025-11-05', inflationTarget: 2.5 },
  { id: 'BOC', name: 'Bank of Canada', country: 'Canada', countryCode: 'CAN', policyRate: 3.75, lastChange: -0.50, lastChangeDate: '2025-10-23', inflationTarget: 2.0 },
  { id: 'RBNZ', name: 'Reserve Bank of New Zealand', country: 'New Zealand', countryCode: 'NZL', policyRate: 4.75, lastChange: -0.50, lastChangeDate: '2025-10-09', inflationTarget: 2.0 },
  { id: 'RBI', name: 'Reserve Bank of India', country: 'India', countryCode: 'IND', policyRate: 6.50, lastChange: -0.25, lastChangeDate: '2025-08-09', inflationTarget: 4.0 },
  { id: 'BCB', name: 'Banco Central do Brasil', country: 'Brazil', countryCode: 'BRA', policyRate: 13.25, lastChange: 1.00, lastChangeDate: '2025-12-11' },
  { id: 'BANXICO', name: 'Banco de México', country: 'Mexico', countryCode: 'MEX', policyRate: 10.00, lastChange: -0.25, lastChangeDate: '2025-11-14', inflationTarget: 3.0 },
  { id: 'SARB', name: 'South African Reserve Bank', country: 'South Africa', countryCode: 'ZAF', policyRate: 7.75, lastChange: -0.25, lastChangeDate: '2025-09-19', inflationTarget: 4.5 },
  { id: 'CBRT', name: 'Central Bank of Turkey', country: 'Turkey', countryCode: 'TUR', policyRate: 45.00, lastChange: -2.50, lastChangeDate: '2025-12-26', inflationTarget: 5.0 },
  { id: 'BOK', name: 'Bank of Korea', country: 'South Korea', countryCode: 'KOR', policyRate: 3.00, lastChange: -0.25, lastChangeDate: '2025-10-11', inflationTarget: 2.0 },
  { id: 'BI', name: 'Bank Indonesia', country: 'Indonesia', countryCode: 'IDN', policyRate: 6.00, lastChange: -0.25, lastChangeDate: '2025-09-18' },
  { id: 'SAMA', name: 'Saudi Central Bank', country: 'Saudi Arabia', countryCode: 'SAU', policyRate: 5.00, lastChange: -0.25, lastChangeDate: '2025-11-08' },
  { id: 'RIKSBANK', name: 'Sveriges Riksbank', country: 'Sweden', countryCode: 'SWE', policyRate: 2.75, lastChange: -0.50, lastChangeDate: '2025-11-07', inflationTarget: 2.0 },
  { id: 'NBP', name: 'National Bank of Poland', country: 'Poland', countryCode: 'POL', policyRate: 5.75, lastChange: 0.00, lastChangeDate: '2024-10-04', inflationTarget: 2.5 },
  { id: 'CNB', name: 'Czech National Bank', country: 'Czechia', countryCode: 'CZE', policyRate: 4.00, lastChange: -0.25, lastChangeDate: '2025-09-25', inflationTarget: 2.0 },
  { id: 'CBR', name: 'Bank of Russia', country: 'Russia', countryCode: 'RUS', policyRate: 21.00, lastChange: 0.00, lastChangeDate: '2025-10-25' },
]

// ── Global Economic Indicators ─────────────────────────────────────────

export const GLOBAL_INDICATORS: EconomicIndicator[] = [
  // Growth
  { id: 'WORLD_GDP', name: 'World GDP Growth', category: 'growth', value: 3.2, previousValue: 3.0, unit: '%', source: 'IMF', lastUpdated: '2025-10-01' },
  { id: 'US_PMI', name: 'US Manufacturing PMI', category: 'manufacturing', value: 49.3, previousValue: 48.5, unit: 'index', country: 'USA', source: 'ISM', lastUpdated: '2026-03-01' },
  { id: 'EU_PMI', name: 'Eurozone Manufacturing PMI', category: 'manufacturing', value: 46.6, previousValue: 46.1, unit: 'index', country: 'EUR', source: 'S&P Global', lastUpdated: '2026-03-01' },
  { id: 'CN_PMI', name: 'China Manufacturing PMI', category: 'manufacturing', value: 50.5, previousValue: 50.1, unit: 'index', country: 'CHN', source: 'NBS', lastUpdated: '2026-03-01' },

  // Inflation
  { id: 'US_CPI', name: 'US CPI (YoY)', category: 'inflation', value: 2.8, previousValue: 3.0, unit: '%', country: 'USA', source: 'BLS', lastUpdated: '2026-02-12' },
  { id: 'EU_CPI', name: 'Eurozone CPI (YoY)', category: 'inflation', value: 2.4, previousValue: 2.6, unit: '%', country: 'EUR', source: 'Eurostat', lastUpdated: '2026-03-01' },
  { id: 'UK_CPI', name: 'UK CPI (YoY)', category: 'inflation', value: 3.0, previousValue: 3.2, unit: '%', country: 'GBR', source: 'ONS', lastUpdated: '2026-02-19' },
  { id: 'JP_CPI', name: 'Japan CPI (YoY)', category: 'inflation', value: 2.5, previousValue: 2.8, unit: '%', country: 'JPN', source: 'MIC', lastUpdated: '2026-02-21' },
  { id: 'CN_CPI', name: 'China CPI (YoY)', category: 'inflation', value: 0.7, previousValue: 0.3, unit: '%', country: 'CHN', source: 'NBS', lastUpdated: '2026-03-09' },

  // Employment
  { id: 'US_UNEMP', name: 'US Unemployment Rate', category: 'employment', value: 4.1, previousValue: 4.0, unit: '%', country: 'USA', source: 'BLS', lastUpdated: '2026-03-07' },
  { id: 'EU_UNEMP', name: 'Eurozone Unemployment', category: 'employment', value: 6.3, previousValue: 6.4, unit: '%', country: 'EUR', source: 'Eurostat', lastUpdated: '2026-02-01' },
  { id: 'US_NFP', name: 'US Non-Farm Payrolls', category: 'employment', value: 227, previousValue: 186, unit: 'K jobs', country: 'USA', source: 'BLS', lastUpdated: '2026-03-07' },

  // Trade
  { id: 'US_TRADE', name: 'US Trade Balance', category: 'trade', value: -78.2, previousValue: -73.8, unit: '$B', country: 'USA', source: 'Census Bureau', lastUpdated: '2026-02-06' },
  { id: 'CN_TRADE', name: 'China Trade Balance', category: 'trade', value: 97.4, previousValue: 75.3, unit: '$B', country: 'CHN', source: 'GACC', lastUpdated: '2026-03-07' },
  { id: 'DE_TRADE', name: 'Germany Trade Balance', category: 'trade', value: 20.8, previousValue: 18.9, unit: '€B', country: 'DEU', source: 'Destatis', lastUpdated: '2026-02-07' },

  // Consumer
  { id: 'US_CONSUMER', name: 'US Consumer Confidence', category: 'consumer', value: 104.7, previousValue: 106.1, unit: 'index', country: 'USA', source: 'Conference Board', lastUpdated: '2026-02-25' },
  { id: 'US_RETAIL', name: 'US Retail Sales (MoM)', category: 'consumer', value: 0.6, previousValue: -0.8, unit: '%', country: 'USA', source: 'Census Bureau', lastUpdated: '2026-02-14' },

  // Housing
  { id: 'US_HOUSING', name: 'US Housing Starts', category: 'housing', value: 1366, previousValue: 1499, unit: 'K', country: 'USA', source: 'Census Bureau', lastUpdated: '2026-02-19' },
  { id: 'US_CASE_SHILLER', name: 'US Home Price Index (YoY)', category: 'housing', value: 4.5, previousValue: 4.2, unit: '%', country: 'USA', source: 'S&P CoreLogic', lastUpdated: '2026-02-25' },

  // Shipping/Logistics
  { id: 'BDI', name: 'Baltic Dry Index', category: 'shipping', value: 1420, previousValue: 1380, unit: 'index', source: 'Baltic Exchange', lastUpdated: '2026-03-14' },
  { id: 'HARPEX', name: 'Harpex Shipping Index', category: 'shipping', value: 1150, previousValue: 1120, unit: 'index', source: 'Harper Petersen', lastUpdated: '2026-03-14' },
  { id: 'SCFI', name: 'Shanghai Container Freight', category: 'shipping', value: 2350, previousValue: 2280, unit: 'index', source: 'SSE', lastUpdated: '2026-03-14' },

  // Monetary
  { id: 'DXY', name: 'US Dollar Index (DXY)', category: 'monetary', value: 104.20, previousValue: 103.85, unit: 'index', source: 'ICE', lastUpdated: '2026-03-14' },
  { id: 'VIX', name: 'CBOE Volatility Index', category: 'monetary', value: 16.5, previousValue: 15.8, unit: 'index', source: 'CBOE', lastUpdated: '2026-03-14' },
  { id: 'MOVE', name: 'Bond Market Volatility', category: 'monetary', value: 102.0, previousValue: 98.5, unit: 'index', source: 'ICE BofA', lastUpdated: '2026-03-14' },
]

// ── Helper: aggregate by category ──────────────────────────────────────

export function getIndicatorsByCategory(category: EconomicIndicator['category']): EconomicIndicator[] {
  return GLOBAL_INDICATORS.filter(i => i.category === category)
}

export function getCentralBankForCountry(countryCode: string): CentralBank | undefined {
  return CENTRAL_BANKS.find(cb => cb.countryCode === countryCode)
}

export function getBondsForCountry(countryCode: string): SovereignBond[] {
  return SOVEREIGN_BONDS.filter(b => b.countryCode === countryCode)
}

export function getCommoditiesByCategory(category: Commodity['category']): Commodity[] {
  return COMMODITIES.filter(c => c.category === category)
}
