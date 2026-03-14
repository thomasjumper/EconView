import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const WB_BASE = 'https://api.worldbank.org/v2'
const CACHE_TTL = 30 * 60 // 30 minutes

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
  indicator: { id: string; value: string }
}

interface CountryGDPData {
  code: string
  name: string
  gdp: number | null
  gdpPerCapita: number | null
  population: number | null
  year: string
}

async function fetchIndicator(indicator: string): Promise<WBDataPoint[]> {
  const url = `${WB_BASE}/country/all/indicator/${indicator}`
  const allData: WBDataPoint[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const { data } = await axios.get(url, {
      params: {
        format: 'json',
        date: '2023:2024',
        per_page: 300,
        page,
      },
    })

    if (!Array.isArray(data) || data.length < 2) break

    const [meta, records] = data
    totalPages = meta.pages
    if (Array.isArray(records)) {
      allData.push(...records)
    }
    page++
  }

  return allData
}

function isAggregate(point: WBDataPoint): boolean {
  if (AGGREGATE_CODES.has(point.countryiso3code)) return true
  // World Bank aggregates have region.id = "NA"
  const raw = point as unknown as Record<string, unknown>
  if (raw.region && typeof raw.region === 'object') {
    const region = raw.region as { id?: string }
    if (region.id === 'NA') return true
  }
  return false
}

function pickMostRecent(
  points: WBDataPoint[],
): Map<string, { value: number | null; year: string }> {
  const map = new Map<string, { value: number | null; year: string }>()

  for (const p of points) {
    if (isAggregate(p)) continue
    const code = p.countryiso3code
    if (!code) continue

    const existing = map.get(code)
    if (!existing || p.date > existing.year) {
      if (p.value !== null) {
        map.set(code, { value: p.value, year: p.date })
      } else if (!existing) {
        map.set(code, { value: null, year: p.date })
      }
    }
  }

  return map
}

export async function fetchGDP(): Promise<CountryGDPData[]> {
  return cachedFetch('econview:gdp', CACHE_TTL, async () => {
    const [gdpRaw, gdpPcRaw, popRaw] = await Promise.all([
      fetchIndicator('NY.GDP.MKTP.CD'),       // GDP current USD
      fetchIndicator('NY.GDP.PCAP.CD'),        // GDP per capita current USD
      fetchIndicator('SP.POP.TOTL'),           // Population
    ])

    const gdpMap = pickMostRecent(gdpRaw)
    const gdpPcMap = pickMostRecent(gdpPcRaw)
    const popMap = pickMostRecent(popRaw)

    // Build country name lookup from GDP data (most complete)
    const nameMap = new Map<string, string>()
    for (const p of gdpRaw) {
      if (!isAggregate(p) && p.countryiso3code) {
        nameMap.set(p.countryiso3code, p.country.value)
      }
    }

    // Merge all codes
    const allCodes = new Set([...gdpMap.keys(), ...gdpPcMap.keys(), ...popMap.keys()])

    const result: CountryGDPData[] = []
    for (const code of allCodes) {
      const gdp = gdpMap.get(code)
      const gdpPc = gdpPcMap.get(code)
      const pop = popMap.get(code)
      const year = gdp?.year || gdpPc?.year || pop?.year || '2023'

      result.push({
        code,
        name: nameMap.get(code) || code,
        gdp: gdp?.value ?? null,
        gdpPerCapita: gdpPc?.value ?? null,
        population: pop?.value ?? null,
        year,
      })
    }

    // Sort by GDP descending, nulls last
    result.sort((a, b) => {
      if (a.gdp === null && b.gdp === null) return 0
      if (a.gdp === null) return 1
      if (b.gdp === null) return -1
      return b.gdp - a.gdp
    })

    console.log(`[WorldBank] Fetched GDP data for ${result.length} countries`)
    return result
  })
}
