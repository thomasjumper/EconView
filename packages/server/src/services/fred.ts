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
  dollarIndex: number | null
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

    // Fetch Dollar Index (Trade Weighted U.S. Dollar Index, Broad)
    let dollarIndex: number | null = null
    try {
      const dxyObs = await fetchSeries('DTWEXBGS')
      if (dxyObs.length > 0) {
        dollarIndex = dxyObs[dxyObs.length - 1].value
      }
    } catch (err) {
      console.error('[FRED] Failed to fetch DTWEXBGS:', (err as Error).message)
    }

    console.log(
      `[FRED] Fetched yield curve: ${YIELD_SERIES.map((s) => `${s}=${series[s].length}`).join(', ')}, DXY=${dollarIndex ?? 'N/A'}`,
    )

    return {
      series,
      dollarIndex,
      lastUpdated: new Date().toISOString(),
    }
  })
}

// ---------------------------------------------------------------------------
// Series type alias used by all expansion functions
// ---------------------------------------------------------------------------

type Series = { date: string; value: number }[]

const CACHE_TTL_30M = 30 * 60 // 30 minutes

// ---------------------------------------------------------------------------
// Corporate Bond Spreads
// ---------------------------------------------------------------------------

export async function fetchCreditSpreads(): Promise<{ hy: Series; ig: Series; bbb: Series }> {
  return cachedFetch('econview:credit-spreads', CACHE_TTL, async () => {
    const [hy, ig, bbb] = await Promise.all([
      fetchSeries('BAMLH0A0HYM2').catch(() => [] as Series),
      fetchSeries('BAMLC0A0CM').catch(() => [] as Series),
      fetchSeries('BAMLC0A4CBBB').catch(() => [] as Series),
    ])
    console.log(`[FRED] Credit spreads: HY=${hy.length}, IG=${ig.length}, BBB=${bbb.length}`)
    return { hy, ig, bbb }
  })
}

// ---------------------------------------------------------------------------
// Yield Curve Shape (Spreads)
// ---------------------------------------------------------------------------

export async function fetchYieldSpreads(): Promise<{ t10y2y: Series; t10y3m: Series }> {
  return cachedFetch('econview:yield-spreads', CACHE_TTL, async () => {
    const [t10y2y, t10y3m] = await Promise.all([
      fetchSeries('T10Y2Y').catch(() => [] as Series),
      fetchSeries('T10Y3M').catch(() => [] as Series),
    ])
    console.log(`[FRED] Yield spreads: 10Y-2Y=${t10y2y.length}, 10Y-3M=${t10y3m.length}`)
    return { t10y2y, t10y3m }
  })
}

// ---------------------------------------------------------------------------
// Financial Conditions
// ---------------------------------------------------------------------------

export async function fetchFinancialConditions(): Promise<{ nfci: Series; anfci: Series }> {
  return cachedFetch('econview:financial-conditions', CACHE_TTL, async () => {
    const [nfci, anfci] = await Promise.all([
      fetchSeries('NFCI').catch(() => [] as Series),
      fetchSeries('ANFCI').catch(() => [] as Series),
    ])
    console.log(`[FRED] Financial conditions: NFCI=${nfci.length}, ANFCI=${anfci.length}`)
    return { nfci, anfci }
  })
}

// ---------------------------------------------------------------------------
// Money Supply
// ---------------------------------------------------------------------------

export async function fetchMoneySupply(): Promise<{ m2: Series; m2v: Series }> {
  return cachedFetch('econview:money-supply', CACHE_TTL_30M, async () => {
    const [m2, m2v] = await Promise.all([
      fetchSeries('M2SL').catch(() => [] as Series),
      fetchSeries('M2V').catch(() => [] as Series),
    ])
    console.log(`[FRED] Money supply: M2=${m2.length}, M2V=${m2v.length}`)
    return { m2, m2v }
  })
}

// ---------------------------------------------------------------------------
// Consumer / Business Sentiment
// ---------------------------------------------------------------------------

export async function fetchSentiment(): Promise<{
  michigan: Series
  consumerConf: Series
  businessConf: Series
}> {
  return cachedFetch('econview:sentiment', CACHE_TTL_30M, async () => {
    const [michigan, consumerConf, businessConf] = await Promise.all([
      fetchSeries('UMCSENT').catch(() => [] as Series),
      fetchSeries('CSCICP03USM665S').catch(() => [] as Series),
      fetchSeries('BSCICP03USM665S').catch(() => [] as Series),
    ])
    console.log(
      `[FRED] Sentiment: Michigan=${michigan.length}, ConsumerConf=${consumerConf.length}, BusinessConf=${businessConf.length}`,
    )
    return { michigan, consumerConf, businessConf }
  })
}

// ---------------------------------------------------------------------------
// Labor Market
// ---------------------------------------------------------------------------

export async function fetchLaborMarket(): Promise<{
  jolts: Series
  wages: Series
  participation: Series
  quits: Series
}> {
  return cachedFetch('econview:labor-market', CACHE_TTL_30M, async () => {
    const [jolts, wages, participation, quits] = await Promise.all([
      fetchSeries('JTSJOL').catch(() => [] as Series),
      fetchSeries('CES0500000003').catch(() => [] as Series),
      fetchSeries('CIVPART').catch(() => [] as Series),
      fetchSeries('JTSQUR').catch(() => [] as Series),
    ])
    console.log(
      `[FRED] Labor market: JOLTS=${jolts.length}, Wages=${wages.length}, Participation=${participation.length}, Quits=${quits.length}`,
    )
    return { jolts, wages, participation, quits }
  })
}

// ---------------------------------------------------------------------------
// Government Fiscal
// ---------------------------------------------------------------------------

export async function fetchFiscalData(): Promise<{ deficit: Series; taxReceipts: Series }> {
  return cachedFetch('econview:fiscal', CACHE_TTL_30M, async () => {
    const [deficit, taxReceipts] = await Promise.all([
      fetchSeries('FYFSD').catch(() => [] as Series),
      fetchSeries('FGRECPT').catch(() => [] as Series),
    ])
    console.log(`[FRED] Fiscal: Deficit=${deficit.length}, TaxReceipts=${taxReceipts.length}`)
    return { deficit, taxReceipts }
  })
}
