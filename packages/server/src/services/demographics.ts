import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const WB_BASE = 'https://api.worldbank.org/v2'
const CACHE_TTL = 86400 // 24 hours

// Known aggregate/region codes to exclude
const AGGREGATE_CODES = new Set([
  'AFE', 'AFW', 'ARB', 'CEB', 'CSS', 'EAP', 'EAR', 'EAS', 'ECA', 'ECS',
  'EMU', 'EUU', 'FCS', 'HIC', 'HPC', 'IBD', 'IBT', 'IDA', 'IDB', 'IDX',
  'INX', 'LAC', 'LCN', 'LDC', 'LIC', 'LMC', 'LMY', 'LTE', 'MEA', 'MIC',
  'MNA', 'NAC', 'OED', 'OSS', 'PRE', 'PSS', 'PST', 'SAS', 'SSA', 'SSF',
  'SST', 'TEA', 'TEC', 'TLA', 'TMN', 'TSA', 'TSS', 'UMC', 'WLD',
])

interface WBDataPoint {
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
}

interface WBRawResponse {
  pages: number
}

interface DemographicsCountry {
  code: string
  name: string
  population: number
  growthRate: number
  lifeExpectancy: number
  urbanPct: number
  elderly65Pct: number
  netMigration: number
  fertilityRate: number
}

interface DemographicsData {
  countries: DemographicsCountry[]
  lastUpdated: string
}

const INDICATORS = {
  population: 'SP.POP.TOTL',
  growthRate: 'SP.POP.GROW',
  lifeExpectancy: 'SP.DYN.LE00.IN',
  urbanPct: 'SP.URB.TOTL.IN.ZS',
  elderly65Pct: 'SP.POP.65UP.TO.ZS',
  netMigration: 'SM.POP.NETM',
  fertilityRate: 'SP.DYN.TFRT.IN',
} as const

type IndicatorKey = keyof typeof INDICATORS

async function fetchIndicator(indicatorCode: string): Promise<Map<string, { value: number; name: string }>> {
  const url = `${WB_BASE}/country/all/indicator/${indicatorCode}`
  const countryMap = new Map<string, { value: number; name: string; year: string }>()

  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const { data } = await axios.get(url, {
      params: { format: 'json', date: '2020:2024', per_page: 300, page },
    })

    if (!Array.isArray(data) || data.length < 2) break

    const [meta, records] = data as [WBRawResponse, WBDataPoint[]]
    totalPages = meta.pages

    if (Array.isArray(records)) {
      for (const p of records) {
        if (!p.countryiso3code || AGGREGATE_CODES.has(p.countryiso3code)) continue
        if (p.value === null) continue

        const existing = countryMap.get(p.countryiso3code)
        if (!existing || p.date > existing.year) {
          countryMap.set(p.countryiso3code, {
            value: p.value,
            name: p.country.value,
            year: p.date,
          })
        }
      }
    }
    page++
  }

  const result = new Map<string, { value: number; name: string }>()
  for (const [code, entry] of countryMap) {
    result.set(code, { value: entry.value, name: entry.name })
  }
  return result
}

export async function fetchDemographics(): Promise<DemographicsData> {
  return cachedFetch('econview:demographics', CACHE_TTL, async () => {
    const keys = Object.keys(INDICATORS) as IndicatorKey[]
    const codes = keys.map((k) => INDICATORS[k])

    const results = await Promise.all(codes.map((code) => fetchIndicator(code)))

    // Merge all indicators by country code
    const allCodes = new Set<string>()
    for (const map of results) {
      for (const code of map.keys()) allCodes.add(code)
    }

    const countries: DemographicsCountry[] = []
    for (const code of allCodes) {
      const popEntry = results[0].get(code)
      if (!popEntry) continue // skip countries without population data

      const val = (idx: number): number => results[idx].get(code)?.value ?? 0

      countries.push({
        code,
        name: popEntry.name,
        population: val(0),
        growthRate: val(1),
        lifeExpectancy: val(2),
        urbanPct: val(3),
        elderly65Pct: val(4),
        netMigration: val(5),
        fertilityRate: val(6),
      })
    }

    console.log(`[Demographics] Fetched demographics for ${countries.length} countries`)
    return { countries, lastUpdated: new Date().toISOString() }
  })
}
