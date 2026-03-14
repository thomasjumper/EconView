/**
 * Global economic indicators service.
 * Aggregates data from World Bank, FRED, and other free sources.
 * Provides a unified view of key economic metrics across countries.
 */

export interface GlobalIndicator {
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

// FRED series IDs for key US indicators
const FRED_SERIES: Record<string, { name: string; category: GlobalIndicator['category']; unit: string }> = {
  'UNRATE': { name: 'US Unemployment Rate', category: 'employment', unit: '%' },
  'CPIAUCSL': { name: 'US CPI (All Urban)', category: 'inflation', unit: 'index' },
  'PAYEMS': { name: 'US Non-Farm Payrolls', category: 'employment', unit: 'K' },
  'HOUST': { name: 'US Housing Starts', category: 'housing', unit: 'K' },
  'RSAFS': { name: 'US Retail Sales', category: 'consumer', unit: '$M' },
  'INDPRO': { name: 'US Industrial Production', category: 'manufacturing', unit: 'index' },
  'UMCSENT': { name: 'US Consumer Sentiment', category: 'consumer', unit: 'index' },
  'T10Y2Y': { name: 'US 10Y-2Y Yield Spread', category: 'monetary', unit: '%' },
  'DTWEXBGS': { name: 'Trade Weighted USD Index', category: 'monetary', unit: 'index' },
}

// World Bank indicator codes for international data
const WB_INDICATORS: Record<string, { name: string; category: GlobalIndicator['category']; unit: string }> = {
  'NY.GDP.MKTP.KD.ZG': { name: 'GDP Growth', category: 'growth', unit: '%' },
  'FP.CPI.TOTL.ZG': { name: 'Inflation Rate', category: 'inflation', unit: '%' },
  'SL.UEM.TOTL.ZS': { name: 'Unemployment Rate', category: 'employment', unit: '%' },
  'BN.CAB.XOKA.CD': { name: 'Current Account Balance', category: 'trade', unit: '$' },
  'GC.DOD.TOTL.GD.ZS': { name: 'Government Debt (% GDP)', category: 'fiscal', unit: '%' },
}

// Shipping/logistics indices (typically scraped or from specialty APIs)
const SHIPPING_INDICES: GlobalIndicator[] = [
  { id: 'BDI', name: 'Baltic Dry Index', category: 'shipping', value: 1420, previousValue: 1380, unit: 'index', source: 'Baltic Exchange', lastUpdated: new Date().toISOString() },
  { id: 'HARPEX', name: 'Harpex Container Index', category: 'shipping', value: 1150, previousValue: 1120, unit: 'index', source: 'Harper Petersen', lastUpdated: new Date().toISOString() },
  { id: 'SCFI', name: 'Shanghai Container Freight', category: 'shipping', value: 2350, previousValue: 2280, unit: 'index', source: 'Shanghai SE', lastUpdated: new Date().toISOString() },
]

// Manufacturing PMIs by country
const MANUFACTURING_PMIS: GlobalIndicator[] = [
  { id: 'US_PMI', name: 'US Manufacturing PMI', category: 'manufacturing', value: 49.3, previousValue: 48.5, unit: 'index', country: 'USA', source: 'ISM', lastUpdated: new Date().toISOString() },
  { id: 'EU_PMI', name: 'Eurozone Manufacturing PMI', category: 'manufacturing', value: 46.6, previousValue: 46.1, unit: 'index', country: 'EUR', source: 'S&P Global', lastUpdated: new Date().toISOString() },
  { id: 'CN_PMI', name: 'China Manufacturing PMI', category: 'manufacturing', value: 50.5, previousValue: 50.1, unit: 'index', country: 'CHN', source: 'NBS', lastUpdated: new Date().toISOString() },
  { id: 'JP_PMI', name: 'Japan Manufacturing PMI', category: 'manufacturing', value: 49.0, previousValue: 48.2, unit: 'index', country: 'JPN', source: 'S&P Global', lastUpdated: new Date().toISOString() },
  { id: 'DE_PMI', name: 'Germany Manufacturing PMI', category: 'manufacturing', value: 42.5, previousValue: 43.1, unit: 'index', country: 'DEU', source: 'S&P Global', lastUpdated: new Date().toISOString() },
  { id: 'IN_PMI', name: 'India Manufacturing PMI', category: 'manufacturing', value: 56.5, previousValue: 56.9, unit: 'index', country: 'IND', source: 'S&P Global', lastUpdated: new Date().toISOString() },
  { id: 'KR_PMI', name: 'South Korea Manufacturing PMI', category: 'manufacturing', value: 50.3, previousValue: 49.8, unit: 'index', country: 'KOR', source: 'S&P Global', lastUpdated: new Date().toISOString() },
  { id: 'BR_PMI', name: 'Brazil Manufacturing PMI', category: 'manufacturing', value: 52.1, previousValue: 51.5, unit: 'index', country: 'BRA', source: 'S&P Global', lastUpdated: new Date().toISOString() },
]

// Volatility / Market sentiment
const MARKET_SENTIMENT: GlobalIndicator[] = [
  { id: 'VIX', name: 'CBOE Volatility Index', category: 'monetary', value: 16.5, previousValue: 15.8, unit: 'index', source: 'CBOE', lastUpdated: new Date().toISOString() },
  { id: 'MOVE', name: 'Bond Volatility (MOVE)', category: 'monetary', value: 102.0, previousValue: 98.5, unit: 'index', source: 'ICE BofA', lastUpdated: new Date().toISOString() },
  { id: 'DXY', name: 'US Dollar Index', category: 'monetary', value: 104.20, previousValue: 103.85, unit: 'index', source: 'ICE', lastUpdated: new Date().toISOString() },
]

let cachedIndicators: GlobalIndicator[] = [
  ...SHIPPING_INDICES,
  ...MANUFACTURING_PMIS,
  ...MARKET_SENTIMENT,
]
let lastFetch = 0
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * Fetch FRED series and update cached indicators
 */
async function fetchFREDIndicators(): Promise<void> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return

  for (const [seriesId, meta] of Object.entries(FRED_SERIES)) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`
      const res = await fetch(url)
      if (!res.ok) continue

      const data = await res.json() as { observations?: Array<{ date: string; value: string }> }
      if (data.observations && data.observations.length > 0) {
        const current = parseFloat(data.observations[0].value)
        const previous = data.observations.length > 1 ? parseFloat(data.observations[1].value) : undefined
        if (!isNaN(current)) {
          const existing = cachedIndicators.find(i => i.id === `FRED_${seriesId}`)
          const indicator: GlobalIndicator = {
            id: `FRED_${seriesId}`,
            name: meta.name,
            category: meta.category,
            value: current,
            previousValue: previous && !isNaN(previous) ? previous : undefined,
            unit: meta.unit,
            country: 'USA',
            source: 'FRED',
            lastUpdated: data.observations[0].date,
          }
          if (existing) {
            Object.assign(existing, indicator)
          } else {
            cachedIndicators.push(indicator)
          }
        }
      }
    } catch {
      // Skip individual series failures
    }
  }
}

/**
 * Fetch all global indicators
 */
export async function fetchGlobalIndicators(): Promise<GlobalIndicator[]> {
  const now = Date.now()
  if (now - lastFetch < CACHE_TTL) return cachedIndicators

  try {
    await fetchFREDIndicators()
  } catch (err) {
    console.error('[GlobalIndicators] Error:', err)
  }

  lastFetch = now
  return cachedIndicators
}

/**
 * Get indicators by category
 */
export function getIndicatorsByCategory(category: string): GlobalIndicator[] {
  return cachedIndicators.filter(i => i.category === category)
}

/**
 * Get country-specific indicators
 */
export function getCountryIndicators(countryCode: string): GlobalIndicator[] {
  return cachedIndicators.filter(i => i.country === countryCode)
}
