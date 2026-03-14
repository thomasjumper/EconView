import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'
import type { ForexPair } from '@econview/shared'

const CACHE_TTL = 10 * 60 // 10 minutes

// ---------------------------------------------------------------------------
// Static forex dataset — realistic March 2026 rates
// ---------------------------------------------------------------------------

const STATIC_FOREX: ForexPair[] = [
  // G10 pairs (majors)
  { id: 'EUR_USD', base: 'EUR', quote: 'USD', rate: 1.0845, change24h: 0.12, category: 'g10' },
  { id: 'USD_JPY', base: 'USD', quote: 'JPY', rate: 149.85, change24h: -0.25, category: 'g10' },
  { id: 'GBP_USD', base: 'GBP', quote: 'USD', rate: 1.2680, change24h: 0.08, category: 'g10' },
  { id: 'USD_CHF', base: 'USD', quote: 'CHF', rate: 0.8825, change24h: -0.15, category: 'g10' },
  { id: 'AUD_USD', base: 'AUD', quote: 'USD', rate: 0.6540, change24h: 0.22, category: 'g10' },
  { id: 'USD_CAD', base: 'USD', quote: 'CAD', rate: 1.3580, change24h: 0.05, category: 'g10' },
  { id: 'NZD_USD', base: 'NZD', quote: 'USD', rate: 0.6120, change24h: 0.18, category: 'g10' },
  { id: 'USD_SEK', base: 'USD', quote: 'SEK', rate: 10.42, change24h: -0.10, category: 'g10' },
  { id: 'USD_NOK', base: 'USD', quote: 'NOK', rate: 10.65, change24h: -0.08, category: 'g10' },

  // Cross pairs
  { id: 'EUR_GBP', base: 'EUR', quote: 'GBP', rate: 0.8555, change24h: 0.04, category: 'cross' },
  { id: 'EUR_JPY', base: 'EUR', quote: 'JPY', rate: 162.45, change24h: -0.18, category: 'cross' },
  { id: 'GBP_JPY', base: 'GBP', quote: 'JPY', rate: 190.05, change24h: -0.32, category: 'cross' },
  { id: 'AUD_JPY', base: 'AUD', quote: 'JPY', rate: 97.95, change24h: 0.10, category: 'cross' },
  { id: 'EUR_CHF', base: 'EUR', quote: 'CHF', rate: 0.9572, change24h: -0.05, category: 'cross' },
  { id: 'AUD_NZD', base: 'AUD', quote: 'NZD', rate: 1.0685, change24h: 0.03, category: 'cross' },
  { id: 'EUR_AUD', base: 'EUR', quote: 'AUD', rate: 1.6585, change24h: -0.12, category: 'cross' },
  { id: 'GBP_AUD', base: 'GBP', quote: 'AUD', rate: 1.9390, change24h: -0.08, category: 'cross' },
  { id: 'CAD_JPY', base: 'CAD', quote: 'JPY', rate: 110.35, change24h: -0.20, category: 'cross' },

  // Emerging market pairs
  { id: 'USD_CNY', base: 'USD', quote: 'CNY', rate: 7.2350, change24h: 0.05, category: 'em' },
  { id: 'USD_INR', base: 'USD', quote: 'INR', rate: 83.25, change24h: 0.02, category: 'em' },
  { id: 'USD_BRL', base: 'USD', quote: 'BRL', rate: 4.95, change24h: -0.35, category: 'em' },
  { id: 'USD_MXN', base: 'USD', quote: 'MXN', rate: 17.15, change24h: -0.18, category: 'em' },
  { id: 'USD_ZAR', base: 'USD', quote: 'ZAR', rate: 18.85, change24h: 0.42, category: 'em' },
  { id: 'USD_TRY', base: 'USD', quote: 'TRY', rate: 32.45, change24h: 0.15, category: 'em' },
  { id: 'USD_RUB', base: 'USD', quote: 'RUB', rate: 92.50, change24h: 0.28, category: 'em' },
  { id: 'USD_KRW', base: 'USD', quote: 'KRW', rate: 1335.00, change24h: 0.12, category: 'em' },
  { id: 'USD_SGD', base: 'USD', quote: 'SGD', rate: 1.3420, change24h: -0.06, category: 'em' },
  { id: 'USD_THB', base: 'USD', quote: 'THB', rate: 35.65, change24h: 0.08, category: 'em' },
  { id: 'USD_IDR', base: 'USD', quote: 'IDR', rate: 15650.00, change24h: 0.10, category: 'em' },
  { id: 'USD_PLN', base: 'USD', quote: 'PLN', rate: 4.02, change24h: -0.15, category: 'em' },
  { id: 'USD_ARS', base: 'USD', quote: 'ARS', rate: 875.00, change24h: 0.55, category: 'em' },
  { id: 'USD_EGP', base: 'USD', quote: 'EGP', rate: 48.50, change24h: 0.08, category: 'em' },

  // Crypto-fiat
  { id: 'BTC_USD', base: 'BTC', quote: 'USD', rate: 87250.00, change24h: 2.30, category: 'crypto_fiat' },
  { id: 'ETH_USD', base: 'ETH', quote: 'USD', rate: 3420.00, change24h: -0.80, category: 'crypto_fiat' },
]

// ---------------------------------------------------------------------------
// DXY proxy — ICE DXY uses 6 currencies with known weights
// ---------------------------------------------------------------------------

// DXY basket: EUR 57.6%, JPY 13.6%, GBP 11.9%, CAD 9.1%, SEK 4.2%, CHF 3.6%
const DXY_WEIGHTS: Record<string, { pairId: string; weight: number; invert: boolean }> = {
  EUR: { pairId: 'EUR_USD', weight: 0.576, invert: true },
  JPY: { pairId: 'USD_JPY', weight: 0.136, invert: false },
  GBP: { pairId: 'GBP_USD', weight: 0.119, invert: true },
  CAD: { pairId: 'USD_CAD', weight: 0.091, invert: false },
  SEK: { pairId: 'USD_SEK', weight: 0.042, invert: false },
  CHF: { pairId: 'USD_CHF', weight: 0.036, invert: false },
}

// Base rates that correspond to DXY = 100
const DXY_BASE_RATES: Record<string, number> = {
  EUR_USD: 1.1600,
  USD_JPY: 120.00,
  GBP_USD: 1.3200,
  USD_CAD: 1.2800,
  USD_SEK: 8.50,
  USD_CHF: 0.9500,
}

export function computeDXY(rates: ForexPair[]): number {
  const rateMap = new Map(rates.map((r) => [r.id, r.rate]))

  let dxy = 1.0
  for (const [, { pairId, weight, invert }] of Object.entries(DXY_WEIGHTS)) {
    const currentRate = rateMap.get(pairId)
    const baseRate = DXY_BASE_RATES[pairId]
    if (!currentRate || !baseRate) continue

    // For pairs like EUR/USD where USD strength = lower pair rate, invert
    const ratio = invert ? baseRate / currentRate : currentRate / baseRate
    dxy *= Math.pow(ratio, weight)
  }

  return Math.round(dxy * 10000) / 100 // scale to ~100 base, 2 decimal places
}

// ---------------------------------------------------------------------------
// Optional live rates from exchangerate.host
// ---------------------------------------------------------------------------

async function tryLiveRates(pairs: ForexPair[]): Promise<ForexPair[]> {
  // exchangerate.host free tier — no key required
  try {
    const { data } = await axios.get('https://api.exchangerate.host/latest', {
      params: { base: 'USD' },
      timeout: 5000,
    })

    if (!data?.rates) return pairs

    const updated = pairs.map((pair) => {
      if (pair.category === 'crypto_fiat') return pair

      let liveRate: number | undefined
      if (pair.base === 'USD' && data.rates[pair.quote]) {
        liveRate = data.rates[pair.quote]
      } else if (pair.quote === 'USD' && data.rates[pair.base]) {
        liveRate = 1 / data.rates[pair.base]
      }

      if (liveRate && liveRate > 0) {
        return { ...pair, rate: Math.round(liveRate * 10000) / 10000 }
      }
      return pair
    })

    console.log('[Forex] Live exchangerate.host rates applied')
    return updated
  } catch (err) {
    console.warn('[Forex] exchangerate.host fetch failed, using static:', (err as Error).message)
  }

  return pairs
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchForexRates(): Promise<{ pairs: ForexPair[]; dxy: number }> {
  return cachedFetch('econview:forex', CACHE_TTL, async () => {
    const pairs = await tryLiveRates(STATIC_FOREX)
    const dxy = computeDXY(pairs)
    return { pairs, dxy }
  })
}
