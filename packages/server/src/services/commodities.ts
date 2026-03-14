import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'
import type { Commodity } from '@econview/shared'

const CACHE_TTL = 15 * 60 // 15 minutes

// ---------------------------------------------------------------------------
// Static commodity dataset — realistic March 2026 prices
// ---------------------------------------------------------------------------

const STATIC_COMMODITIES: Commodity[] = [
  // Energy
  { id: 'crude_wti', name: 'Crude Oil (WTI)', category: 'energy', price: 78.45, change24h: 1.2, unit: '$/bbl', symbol: 'CL' },
  { id: 'crude_brent', name: 'Crude Oil (Brent)', category: 'energy', price: 82.10, change24h: 1.05, unit: '$/bbl', symbol: 'BZ' },
  { id: 'natural_gas', name: 'Natural Gas', category: 'energy', price: 3.85, change24h: -2.1, unit: '$/MMBtu', symbol: 'NG' },
  { id: 'gasoline', name: 'RBOB Gasoline', category: 'energy', price: 2.58, change24h: 0.8, unit: '$/gal', symbol: 'RB' },
  { id: 'heating_oil', name: 'Heating Oil', category: 'energy', price: 2.72, change24h: 0.5, unit: '$/gal', symbol: 'HO' },
  { id: 'coal', name: 'Coal (Newcastle)', category: 'energy', price: 135.20, change24h: -0.3, unit: '$/ton' },
  { id: 'uranium', name: 'Uranium (U3O8)', category: 'energy', price: 92.50, change24h: 0.7, unit: '$/lb' },

  // Precious Metals
  { id: 'gold', name: 'Gold', category: 'precious_metals', price: 2185.40, change24h: 0.45, unit: '$/oz', symbol: 'GC' },
  { id: 'silver', name: 'Silver', category: 'precious_metals', price: 24.85, change24h: 0.92, unit: '$/oz', symbol: 'SI' },
  { id: 'platinum', name: 'Platinum', category: 'precious_metals', price: 945.30, change24h: -0.35, unit: '$/oz', symbol: 'PL' },
  { id: 'palladium', name: 'Palladium', category: 'precious_metals', price: 1025.60, change24h: -1.2, unit: '$/oz', symbol: 'PA' },

  // Industrial Metals
  { id: 'copper', name: 'Copper', category: 'industrial_metals', price: 8950.00, change24h: 0.65, unit: '$/ton', symbol: 'HG' },
  { id: 'aluminum', name: 'Aluminum', category: 'industrial_metals', price: 2380.00, change24h: 0.3, unit: '$/ton' },
  { id: 'zinc', name: 'Zinc', category: 'industrial_metals', price: 2720.00, change24h: -0.45, unit: '$/ton' },
  { id: 'nickel', name: 'Nickel', category: 'industrial_metals', price: 16850.00, change24h: 1.1, unit: '$/ton' },
  { id: 'tin', name: 'Tin', category: 'industrial_metals', price: 28500.00, change24h: 0.25, unit: '$/ton' },
  { id: 'iron_ore', name: 'Iron Ore', category: 'industrial_metals', price: 118.50, change24h: -0.8, unit: '$/ton' },
  { id: 'lithium', name: 'Lithium Carbonate', category: 'industrial_metals', price: 14200.00, change24h: 2.3, unit: '$/ton' },
  { id: 'cobalt', name: 'Cobalt', category: 'industrial_metals', price: 28750.00, change24h: -0.15, unit: '$/ton' },

  // Agriculture
  { id: 'wheat', name: 'Wheat', category: 'agriculture', price: 5.82, change24h: -1.3, unit: '$/bu', symbol: 'ZW' },
  { id: 'corn', name: 'Corn', category: 'agriculture', price: 4.45, change24h: 0.35, unit: '$/bu', symbol: 'ZC' },
  { id: 'soybeans', name: 'Soybeans', category: 'agriculture', price: 11.85, change24h: 0.6, unit: '$/bu', symbol: 'ZS' },
  { id: 'rice', name: 'Rough Rice', category: 'agriculture', price: 17.25, change24h: -0.2, unit: '$/cwt', symbol: 'ZR' },
  { id: 'coffee', name: 'Coffee (Arabica)', category: 'agriculture', price: 185.40, change24h: 1.8, unit: 'c/lb', symbol: 'KC' },
  { id: 'cocoa', name: 'Cocoa', category: 'agriculture', price: 8450.00, change24h: -2.5, unit: '$/ton', symbol: 'CC' },
  { id: 'sugar', name: 'Sugar #11', category: 'agriculture', price: 21.35, change24h: 0.4, unit: 'c/lb', symbol: 'SB' },
  { id: 'cotton', name: 'Cotton', category: 'agriculture', price: 82.60, change24h: -0.7, unit: 'c/lb', symbol: 'CT' },
  { id: 'orange_juice', name: 'Orange Juice', category: 'agriculture', price: 425.50, change24h: 1.5, unit: 'c/lb', symbol: 'OJ' },
  { id: 'lumber', name: 'Lumber', category: 'agriculture', price: 565.00, change24h: 0.9, unit: '$/1000bf', symbol: 'LBS' },
  { id: 'palm_oil', name: 'Palm Oil', category: 'agriculture', price: 3850.00, change24h: 0.2, unit: 'MYR/ton' },

  // Livestock
  { id: 'live_cattle', name: 'Live Cattle', category: 'livestock', price: 192.50, change24h: 0.3, unit: 'c/lb', symbol: 'LE' },
  { id: 'feeder_cattle', name: 'Feeder Cattle', category: 'livestock', price: 258.75, change24h: 0.15, unit: 'c/lb', symbol: 'GF' },
  { id: 'lean_hogs', name: 'Lean Hogs', category: 'livestock', price: 88.40, change24h: -0.6, unit: 'c/lb', symbol: 'HE' },
  { id: 'milk', name: 'Class III Milk', category: 'livestock', price: 17.85, change24h: 0.1, unit: '$/cwt' },
]

// ---------------------------------------------------------------------------
// Optional live price fetch for gold/silver from metals.dev
// ---------------------------------------------------------------------------

async function tryLiveMetals(commodities: Commodity[]): Promise<Commodity[]> {
  const apiKey = process.env.METALS_API_KEY
  if (!apiKey) return commodities

  try {
    const { data } = await axios.get('https://api.metals.dev/v1/latest', {
      params: { api_key: apiKey, currency: 'USD' },
      timeout: 5000,
    })

    if (data?.metals) {
      const updated = [...commodities]
      const goldIdx = updated.findIndex((c) => c.id === 'gold')
      const silverIdx = updated.findIndex((c) => c.id === 'silver')

      if (goldIdx >= 0 && data.metals.gold) {
        updated[goldIdx] = { ...updated[goldIdx], price: data.metals.gold }
      }
      if (silverIdx >= 0 && data.metals.silver) {
        updated[silverIdx] = { ...updated[silverIdx], price: data.metals.silver }
      }

      console.log('[Commodities] Live metals.dev prices applied')
      return updated
    }
  } catch (err) {
    console.warn('[Commodities] metals.dev fetch failed, using static:', (err as Error).message)
  }

  return commodities
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchCommodities(): Promise<Commodity[]> {
  return cachedFetch('econview:commodities', CACHE_TTL, async () => {
    return tryLiveMetals(STATIC_COMMODITIES)
  })
}

export async function fetchCommoditiesByCategory(category: string): Promise<Commodity[]> {
  const all = await fetchCommodities()
  return all.filter((c) => c.category === category)
}
