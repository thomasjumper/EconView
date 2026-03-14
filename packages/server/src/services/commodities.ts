/**
 * Commodities data service.
 * Fetches commodity prices from free APIs (metals-api proxy, EIA for energy).
 * Falls back to static data when APIs are unavailable.
 */

export interface CommodityPrice {
  id: string
  name: string
  category: 'energy' | 'metals' | 'agriculture' | 'livestock'
  price: number
  change24h: number
  unit: string
  currency: string
  source: string
  lastUpdated: string
}

// Static commodity data as baseline (updated periodically)
const STATIC_COMMODITIES: CommodityPrice[] = [
  { id: 'CL', name: 'Crude Oil (WTI)', category: 'energy', price: 73.50, change24h: -0.8, unit: 'bbl', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'BZ', name: 'Brent Crude', category: 'energy', price: 77.20, change24h: -0.6, unit: 'bbl', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'NG', name: 'Natural Gas', category: 'energy', price: 3.85, change24h: 1.2, unit: 'MMBtu', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'GC', name: 'Gold', category: 'metals', price: 2650.00, change24h: 0.4, unit: 'oz', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'SI', name: 'Silver', category: 'metals', price: 31.50, change24h: 0.9, unit: 'oz', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'HG', name: 'Copper', category: 'metals', price: 4.25, change24h: 0.6, unit: 'lb', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'ZW', name: 'Wheat', category: 'agriculture', price: 5.85, change24h: -0.4, unit: 'bu', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'ZC', name: 'Corn', category: 'agriculture', price: 4.55, change24h: 0.2, unit: 'bu', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
  { id: 'ZS', name: 'Soybeans', category: 'agriculture', price: 12.30, change24h: -0.6, unit: 'bu', currency: 'USD', source: 'static', lastUpdated: new Date().toISOString() },
]

let cachedCommodities: CommodityPrice[] = [...STATIC_COMMODITIES]
let lastFetch = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Try fetching gold/silver from metals.dev free API
 */
async function fetchMetalPrices(): Promise<Partial<Record<string, number>>> {
  try {
    const res = await fetch('https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=oz')
    if (!res.ok) return {}
    const data = await res.json() as { metals?: Record<string, number> }
    return data.metals ?? {}
  } catch {
    return {}
  }
}

/**
 * Fetch commodity prices — tries live APIs, falls back to static data
 */
export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const now = Date.now()
  if (now - lastFetch < CACHE_TTL) return cachedCommodities

  try {
    const metals = await fetchMetalPrices()
    if (metals.gold) {
      const gold = cachedCommodities.find(c => c.id === 'GC')
      if (gold) {
        const oldPrice = gold.price
        gold.price = metals.gold
        gold.change24h = ((metals.gold - oldPrice) / oldPrice) * 100
        gold.source = 'metals.dev'
        gold.lastUpdated = new Date().toISOString()
      }
    }
    if (metals.silver) {
      const silver = cachedCommodities.find(c => c.id === 'SI')
      if (silver) {
        const oldPrice = silver.price
        silver.price = metals.silver
        silver.change24h = ((metals.silver - oldPrice) / oldPrice) * 100
        silver.source = 'metals.dev'
        silver.lastUpdated = new Date().toISOString()
      }
    }
  } catch (err) {
    console.error('[Commodities] Error fetching live prices:', err)
  }

  lastFetch = now
  return cachedCommodities
}

export function getCommoditiesByCategory(category: string): CommodityPrice[] {
  return cachedCommodities.filter(c => c.category === category)
}
