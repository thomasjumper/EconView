/**
 * Forex / Currency data service.
 * Uses exchangerate.host (free, no key required) for live rates.
 * Falls back to static rates when API is unavailable.
 */

export interface ForexRate {
  pair: string
  base: string
  quote: string
  rate: number
  change24h: number
  source: string
  lastUpdated: string
}

// Major forex pairs with static fallback rates
const STATIC_RATES: ForexRate[] = [
  { pair: 'EURUSD', base: 'EUR', quote: 'USD', rate: 1.0845, change24h: -0.15, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDJPY', base: 'USD', quote: 'JPY', rate: 149.20, change24h: 0.32, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'GBPUSD', base: 'GBP', quote: 'USD', rate: 1.2680, change24h: -0.08, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDCHF', base: 'USD', quote: 'CHF', rate: 0.8835, change24h: 0.12, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'AUDUSD', base: 'AUD', quote: 'USD', rate: 0.6520, change24h: -0.25, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDCAD', base: 'USD', quote: 'CAD', rate: 1.3590, change24h: 0.05, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'NZDUSD', base: 'NZD', quote: 'USD', rate: 0.6080, change24h: -0.18, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDCNY', base: 'USD', quote: 'CNY', rate: 7.245, change24h: 0.03, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDINR', base: 'USD', quote: 'INR', rate: 83.45, change24h: 0.02, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDBRL', base: 'USD', quote: 'BRL', rate: 4.98, change24h: 0.35, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDMXN', base: 'USD', quote: 'MXN', rate: 17.15, change24h: -0.12, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDKRW', base: 'USD', quote: 'KRW', rate: 1325.00, change24h: 0.15, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDZAR', base: 'USD', quote: 'ZAR', rate: 18.75, change24h: 0.45, source: 'static', lastUpdated: new Date().toISOString() },
  { pair: 'USDTRY', base: 'USD', quote: 'TRY', rate: 32.50, change24h: 0.08, source: 'static', lastUpdated: new Date().toISOString() },
]

let cachedRates: ForexRate[] = [...STATIC_RATES]
let lastFetch = 0
const CACHE_TTL = 5 * 60 * 1000

const QUOTE_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY', 'INR', 'BRL', 'MXN', 'KRW', 'ZAR', 'TRY']

/**
 * Fetch latest forex rates from exchangerate.host
 */
export async function fetchForexRates(): Promise<ForexRate[]> {
  const now = Date.now()
  if (now - lastFetch < CACHE_TTL) return cachedRates

  try {
    const symbols = QUOTE_CURRENCIES.join(',')
    const res = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`)
    if (!res.ok) {
      console.warn('[Forex] API returned', res.status)
      return cachedRates
    }

    const data = await res.json() as { rates?: Record<string, number> }
    if (data.rates) {
      const ts = new Date().toISOString()
      for (const rate of cachedRates) {
        if (rate.base === 'USD' && data.rates[rate.quote]) {
          const newRate = data.rates[rate.quote]
          rate.change24h = ((newRate - rate.rate) / rate.rate) * 100
          rate.rate = newRate
          rate.source = 'exchangerate.host'
          rate.lastUpdated = ts
        } else if (rate.quote === 'USD' && data.rates[rate.base]) {
          const newRate = 1 / data.rates[rate.base]
          rate.change24h = ((newRate - rate.rate) / rate.rate) * 100
          rate.rate = newRate
          rate.source = 'exchangerate.host'
          rate.lastUpdated = ts
        }
      }
    }
  } catch (err) {
    console.error('[Forex] Error fetching rates:', err)
  }

  lastFetch = now
  return cachedRates
}

/**
 * Get a specific forex pair rate
 */
export function getForexPair(pair: string): ForexRate | undefined {
  return cachedRates.find(r => r.pair === pair)
}

/**
 * Get Dollar Index proxy (weighted basket)
 */
export function getDollarStrength(): number {
  const eur = cachedRates.find(r => r.pair === 'EURUSD')
  const jpy = cachedRates.find(r => r.pair === 'USDJPY')
  const gbp = cachedRates.find(r => r.pair === 'GBPUSD')
  if (!eur || !jpy || !gbp) return 104.2 // fallback DXY

  // Simplified DXY proxy
  return 50.14348112 * Math.pow(1 / eur.rate, 0.576) * Math.pow(jpy.rate, 0.136) * Math.pow(1 / gbp.rate, 0.119)
}
