import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'
const CACHE_TTL = 5 * 60 // 5 minutes

const YIELD_SERIES = ['DGS2', 'DGS5', 'DGS10', 'DGS30', 'FEDFUNDS'] as const
type YieldSeries = (typeof YIELD_SERIES)[number]

interface FREDObservation {
  date: string
  value: string
}

interface YieldCurveData {
  series: Record<YieldSeries, { date: string; value: number }[]>
  lastUpdated: string
}

async function fetchSeries(seriesId: string): Promise<{ date: string; value: number }[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    throw new Error('FRED_API_KEY environment variable is not set')
  }

  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)

  const { data } = await axios.get(FRED_BASE, {
    params: {
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      observation_start: oneYearAgo.toISOString().split('T')[0],
      observation_end: now.toISOString().split('T')[0],
      sort_order: 'asc',
    },
  })

  if (!data.observations) return []

  return (data.observations as FREDObservation[])
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }))
}

export async function fetchYieldCurve(): Promise<YieldCurveData> {
  return cachedFetch('econview:yields', CACHE_TTL, async () => {
    const results = await Promise.all(
      YIELD_SERIES.map(async (id) => {
        try {
          const observations = await fetchSeries(id)
          return [id, observations] as const
        } catch (err) {
          console.error(`[FRED] Failed to fetch ${id}:`, (err as Error).message)
          return [id, []] as const
        }
      }),
    )

    const series = Object.fromEntries(results) as Record<
      YieldSeries,
      { date: string; value: number }[]
    >

    console.log(
      `[FRED] Fetched yield curve: ${YIELD_SERIES.map((s) => `${s}=${series[s].length}`).join(', ')}`,
    )

    return {
      series,
      lastUpdated: new Date().toISOString(),
    }
  })
}
