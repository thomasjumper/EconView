import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const WB_BASE = 'https://api.worldbank.org/v2'
const CACHE_TTL = 60 * 60 // 1 hour

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

export interface WBIndicator {
  countryCode: string
  country: string
  indicator: string
  value: number | null
  year: string
}

interface WBRawResponse {
  pages: number
}

function isAggregate(point: WBDataPoint): boolean {
  if (AGGREGATE_CODES.has(point.countryiso3code)) return true
  const raw = point as unknown as Record<string, unknown>
  if (raw.region && typeof raw.region === 'object') {
    const region = raw.region as { id?: string }
    if (region.id === 'NA') return true
  }
  return false
}

async function fetchWBIndicator(indicatorCode: string): Promise<WBIndicator[]> {
  const url = `${WB_BASE}/country/all/indicator/${indicatorCode}`
  const allData: WBDataPoint[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const { data } = await axios.get(url, {
      params: {
        format: 'json',
        date: '2020:2024',
        per_page: 300,
        page,
      },
    })

    if (!Array.isArray(data) || data.length < 2) break

    const [meta, records] = data as [WBRawResponse, WBDataPoint[]]
    totalPages = meta.pages
    if (Array.isArray(records)) {
      allData.push(...records)
    }
    page++
  }

  // Pick most recent non-null value per country
  const countryMap = new Map<string, WBIndicator>()
  for (const p of allData) {
    if (isAggregate(p)) continue
    if (!p.countryiso3code) continue

    const existing = countryMap.get(p.countryiso3code)
    if (p.value !== null) {
      if (!existing || p.date > existing.year || existing.value === null) {
        countryMap.set(p.countryiso3code, {
          countryCode: p.countryiso3code,
          country: p.country.value,
          indicator: indicatorCode,
          value: p.value,
          year: p.date,
        })
      }
    } else if (!existing) {
      countryMap.set(p.countryiso3code, {
        countryCode: p.countryiso3code,
        country: p.country.value,
        indicator: indicatorCode,
        value: null,
        year: p.date,
      })
    }
  }

  return Array.from(countryMap.values()).filter((i) => i.value !== null)
}

const INDICATORS = {
  gini: 'SI.POV.GINI',
  healthSpending: 'SH.XPD.CHEX.GD.ZS',
  educationSpending: 'SE.XPD.TOTL.GD.ZS',
  internetAccess: 'IT.NET.USER.ZS',
  literacy: 'SE.ADT.LITR.ZS',
  waterAccess: 'SH.H2O.SMDW.ZS',
  tourism: 'ST.INT.ARVL',
  rdSpending: 'GB.XPD.RSDV.GD.ZS',
} as const

export type DevelopmentIndicators = {
  [K in keyof typeof INDICATORS]: WBIndicator[]
}

export async function fetchDevelopmentIndicators(): Promise<DevelopmentIndicators> {
  return cachedFetch('econview:wb-development', CACHE_TTL, async () => {
    const keys = Object.keys(INDICATORS) as Array<keyof typeof INDICATORS>
    const codes = keys.map((k) => INDICATORS[k])

    const results = await Promise.all(codes.map((code) => fetchWBIndicator(code)))

    const output: Record<string, WBIndicator[]> = {}
    for (let i = 0; i < keys.length; i++) {
      output[keys[i]] = results[i]
    }

    const totalRecords = results.reduce((sum, r) => sum + r.length, 0)
    console.log(`[WB-Indicators] Fetched ${keys.length} development indicators (${totalRecords} data points)`)

    return output as DevelopmentIndicators
  })
}
