import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const WB_BASE = 'https://api.worldbank.org/v2'
const CACHE_TTL = 86400 // 24 hours
const CACHE_KEY = 'econview:tourism'

interface WBDataPoint {
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
}

interface WBRawResponse {
  pages: number
}

interface TourismCountry {
  code: string
  name: string
  arrivals: number
  receipts: number
  departures: number
  expenditure: number
}

interface TourismData {
  countries: TourismCountry[]
  lastUpdated: string
}

// Known aggregate/region codes to exclude
const AGGREGATE_CODES = new Set([
  'AFE', 'AFW', 'ARB', 'CEB', 'CSS', 'EAP', 'EAR', 'EAS', 'ECA', 'ECS',
  'EMU', 'EUU', 'FCS', 'HIC', 'HPC', 'IBD', 'IBT', 'IDA', 'IDB', 'IDX',
  'INX', 'LAC', 'LCN', 'LDC', 'LIC', 'LMC', 'LMY', 'LTE', 'MEA', 'MIC',
  'MNA', 'NAC', 'OED', 'OSS', 'PRE', 'PSS', 'PST', 'SAS', 'SSA', 'SSF',
  'SST', 'TEA', 'TEC', 'TLA', 'TMN', 'TSA', 'TSS', 'UMC', 'WLD',
])

const INDICATORS = {
  arrivals: 'ST.INT.ARVL',
  receipts: 'ST.INT.RCPT.CD',
  departures: 'ST.INT.DPRT',
  expenditure: 'ST.INT.XPND.CD',
} as const

type IndicatorKey = keyof typeof INDICATORS

async function fetchIndicator(indicatorCode: string): Promise<Map<string, { value: number; name: string }>> {
  const url = `${WB_BASE}/country/all/indicator/${indicatorCode}`
  const allData: WBDataPoint[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    try {
      const { data } = await axios.get(url, {
        params: { format: 'json', date: '2020:2024', per_page: 300, page },
        timeout: 15000,
      })

      if (!Array.isArray(data) || data.length < 2) break
      const [meta, records] = data as [WBRawResponse, WBDataPoint[]]
      totalPages = meta.pages
      if (Array.isArray(records)) allData.push(...records)
    } catch {
      break
    }
    page++
  }

  const result = new Map<string, { value: number; name: string }>()
  for (const p of allData) {
    if (AGGREGATE_CODES.has(p.countryiso3code)) continue
    if (!p.countryiso3code || p.value === null) continue

    if (!result.has(p.countryiso3code)) {
      result.set(p.countryiso3code, { value: p.value, name: p.country.value })
    }
  }

  return result
}

export async function fetchTourism(): Promise<TourismData> {
  return cachedFetch(CACHE_KEY, CACHE_TTL, async () => {
    const keys = Object.keys(INDICATORS) as IndicatorKey[]
    const codes = keys.map((k) => INDICATORS[k])

    const results = await Promise.all(codes.map((code) => fetchIndicator(code)))

    const countryCodes = new Set<string>()
    for (const indicatorMap of results) {
      for (const code of indicatorMap.keys()) {
        countryCodes.add(code)
      }
    }

    const countries: TourismCountry[] = []
    for (const code of countryCodes) {
      const hasData = results.some((m) => m.has(code))
      if (!hasData) continue

      const getName = (): string => {
        for (const m of results) {
          const entry = m.get(code)
          if (entry) return entry.name
        }
        return code
      }

      const getValue = (idx: number): number => {
        const entry = results[idx]?.get(code)
        return entry?.value ?? 0
      }

      countries.push({
        code,
        name: getName(),
        arrivals: getValue(0),
        receipts: getValue(1),
        departures: getValue(2),
        expenditure: getValue(3),
      })
    }

    // Sort by arrivals descending
    countries.sort((a, b) => b.arrivals - a.arrivals)

    console.log(`[Tourism] Fetched ${keys.length} indicators for ${countries.length} countries`)
    return { countries, lastUpdated: new Date().toISOString() }
  })
}
