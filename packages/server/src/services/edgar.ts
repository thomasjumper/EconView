import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const CACHE_TTL = 60 * 60 // 1 hour
const MIN_REQUEST_INTERVAL_MS = 125 // 8 req/sec max

// ---------------------------------------------------------------------------
// Request queue — enforces 125ms minimum between SEC EDGAR requests
// ---------------------------------------------------------------------------

let lastRequestTime = 0
const requestQueue: Array<{
  fn: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (err: unknown) => void
}> = []
let queueProcessing = false

async function processQueue(): Promise<void> {
  if (queueProcessing) return
  queueProcessing = true

  while (requestQueue.length > 0) {
    const item = requestQueue.shift()!
    const now = Date.now()
    const elapsed = now - lastRequestTime
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - elapsed)
    }
    lastRequestTime = Date.now()
    try {
      const result = await item.fn()
      item.resolve(result)
    } catch (err) {
      item.reject(err)
    }
  }

  queueProcessing = false
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({
      fn: fn as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    })
    processQueue()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// User-Agent header (SEC requires it)
// ---------------------------------------------------------------------------

function getUserAgent(): string {
  const ua = process.env.SEC_EDGAR_USER_AGENT
  if (!ua) {
    console.warn('[EDGAR] SEC_EDGAR_USER_AGENT not set — using fallback')
    return 'EconView/1.0 (econview@example.com)'
  }
  return ua
}

function edgarHeaders() {
  return {
    'User-Agent': getUserAgent(),
    Accept: 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Top 50 US stocks ticker-to-CIK map (avoids lookup calls)
// ---------------------------------------------------------------------------

const TICKER_TO_CIK: Record<string, string> = {
  AAPL: '0000320193',
  MSFT: '0000789019',
  NVDA: '0001045810',
  GOOGL: '0001652044',
  GOOG: '0001652044',
  AMZN: '0001018724',
  META: '0001326801',
  TSLA: '0001318605',
  BRK_B: '0001067983',
  JPM: '0000019617',
  V: '0001403161',
  JNJ: '0000200406',
  UNH: '0000731766',
  XOM: '0000034088',
  PG: '0000080424',
  HD: '0000354950',
  MA: '0001141391',
  BAC: '0000070858',
  ABBV: '0001551152',
  KO: '0000021344',
  PEP: '0000077476',
  COST: '0000909832',
  MRK: '0000310158',
  LLY: '0000059478',
  AVGO: '0001649338',
  TMO: '0000097745',
  WMT: '0000104169',
  CSCO: '0000858877',
  DIS: '0001744489',
  ACN: '0001281761',
  CRM: '0001108524',
  ADBE: '0000796343',
  NFLX: '0001065280',
  AMD: '0000002488',
  INTC: '0000050863',
  CMCSA: '0000902739',
  NKE: '0000320187',
  TXN: '0000097476',
  PM: '0001413329',
  DHR: '0000313616',
  ORCL: '0001341439',
  ABT: '0000001800',
  NEE: '0000753308',
  LIN: '0001707925',
  BMY: '0000014272',
  QCOM: '0000804328',
  COP: '0001163165',
  RTX: '0000101829',
  GS: '0000886982',
  LOW: '0000060667',
  SPY: '0000884394',
  QQQ: '0001067839',
  DIA: '0001159795',
  IWM: '0000714310',
  GLD: '0001222333',
}

// ---------------------------------------------------------------------------
// CIK padding helper
// ---------------------------------------------------------------------------

function padCik(cik: string): string {
  const digits = cik.replace(/^0+/, '')
  return digits.padStart(10, '0')
}

// ---------------------------------------------------------------------------
// Core fetch functions
// ---------------------------------------------------------------------------

/**
 * Fetch all XBRL company facts for a given CIK.
 */
export async function fetchCompanyFacts(cik: string): Promise<unknown> {
  const paddedCik = padCik(cik)
  const cacheKey = `edgar:facts:${paddedCik}`

  return cachedFetch(cacheKey, CACHE_TTL, () =>
    enqueue(async () => {
      const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`
      const { data } = await axios.get(url, { headers: edgarHeaders() })
      return data
    }),
  )
}

/**
 * Fetch a specific XBRL concept for a company (e.g., Revenues over time).
 */
export async function fetchCompanyConcept(
  cik: string,
  concept: string,
  taxonomy = 'us-gaap',
): Promise<unknown> {
  const paddedCik = padCik(cik)
  const cacheKey = `edgar:concept:${paddedCik}:${taxonomy}:${concept}`

  return cachedFetch(cacheKey, CACHE_TTL, () =>
    enqueue(async () => {
      const url = `https://data.sec.gov/api/xbrl/companyconcept/CIK${paddedCik}/${taxonomy}/${concept}.json`
      const { data } = await axios.get(url, { headers: edgarHeaders() })
      return data
    }),
  )
}

/**
 * Search for a company's CIK using its ticker symbol.
 * First checks the hardcoded map, then falls back to SEC submissions endpoint.
 */
export async function searchCompanyByCik(ticker: string): Promise<string | null> {
  const upper = ticker.toUpperCase()

  // Check hardcoded map first
  if (TICKER_TO_CIK[upper]) {
    return TICKER_TO_CIK[upper]
  }

  const cacheKey = `edgar:cik:${upper}`

  return cachedFetch(cacheKey, CACHE_TTL, () =>
    enqueue(async () => {
      try {
        // Use the SEC EDGAR full-text search to find the ticker
        const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(upper)}%22&forms=10-K`
        const { data } = await axios.get(url, { headers: edgarHeaders() })

        if (data?.hits?.hits && data.hits.hits.length > 0) {
          const hit = data.hits.hits[0]
          const entityCik = hit._source?.entity_id || hit._source?.cik
          if (entityCik) {
            return padCik(String(entityCik))
          }
        }

        // Fallback: try the tickers.json endpoint
        const tickersUrl = 'https://www.sec.gov/files/company_tickers.json'
        const tickersResp = await axios.get(tickersUrl, { headers: edgarHeaders() })
        const tickers = tickersResp.data as Record<
          string,
          { cik_str: number; ticker: string; title: string }
        >

        for (const entry of Object.values(tickers)) {
          if (entry.ticker.toUpperCase() === upper) {
            return padCik(String(entry.cik_str))
          }
        }

        return null
      } catch (err) {
        console.error(`[EDGAR] CIK lookup failed for ${upper}:`, (err as Error).message)
        return null
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// Financial data extraction helpers
// ---------------------------------------------------------------------------

interface QuarterlyValue {
  period: string
  value: number
  filed: string
  form: string
}

function extractQuarterlyValues(
  factsData: Record<string, unknown>,
  taxonomy: string,
  conceptName: string,
  limit = 4,
): QuarterlyValue[] {
  try {
    const facts = factsData as {
      facts?: Record<string, Record<string, { units?: Record<string, Array<{
        val: number
        end: string
        filed: string
        form: string
        fp: string
      }>> }>>
    }

    const concept = facts?.facts?.[taxonomy]?.[conceptName]
    if (!concept?.units) return []

    // Prefer USD units, fall back to first available
    const unitKey = concept.units['USD'] ? 'USD' : Object.keys(concept.units)[0]
    if (!unitKey) return []

    const entries = concept.units[unitKey]
    if (!Array.isArray(entries)) return []

    // Filter to 10-Q and 10-K filings, sort by filed date descending
    const quarterly = entries
      .filter((e) => e.form === '10-Q' || e.form === '10-K')
      .sort((a, b) => b.end.localeCompare(a.end))
      .slice(0, limit)

    return quarterly.map((e) => ({
      period: e.end,
      value: e.val,
      filed: e.filed,
      form: e.form,
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// High-level financials function
// ---------------------------------------------------------------------------

export interface CompanyFinancials {
  ticker: string
  cik: string
  revenue: QuarterlyValue[]
  operatingIncome: QuarterlyValue[]
  totalAssets: QuarterlyValue[]
  totalDebt: QuarterlyValue[]
  netIncome: QuarterlyValue[]
  lastUpdated: string
}

/**
 * Get key financials for a company: revenue, operating income, total assets,
 * total debt, and net income for the last 4 quarters.
 */
export async function getCompanyFinancials(ticker: string): Promise<CompanyFinancials | null> {
  const cacheKey = `edgar:financials:${ticker.toUpperCase()}`

  return cachedFetch(cacheKey, CACHE_TTL, async () => {
    const cik = await searchCompanyByCik(ticker)
    if (!cik) {
      console.warn(`[EDGAR] Could not resolve CIK for ticker: ${ticker}`)
      return null
    }

    try {
      const facts = (await fetchCompanyFacts(cik)) as Record<string, unknown>

      const revenue = extractQuarterlyValues(facts, 'us-gaap', 'Revenues')
        .length > 0
        ? extractQuarterlyValues(facts, 'us-gaap', 'Revenues')
        : extractQuarterlyValues(facts, 'us-gaap', 'RevenueFromContractWithCustomerExcludingAssessedTax')

      const operatingIncome = extractQuarterlyValues(facts, 'us-gaap', 'OperatingIncomeLoss')
      const totalAssets = extractQuarterlyValues(facts, 'us-gaap', 'Assets')

      const totalDebt = extractQuarterlyValues(facts, 'us-gaap', 'LongTermDebt')
        .length > 0
        ? extractQuarterlyValues(facts, 'us-gaap', 'LongTermDebt')
        : extractQuarterlyValues(facts, 'us-gaap', 'LongTermDebtNoncurrent')

      const netIncome = extractQuarterlyValues(facts, 'us-gaap', 'NetIncomeLoss')

      return {
        ticker: ticker.toUpperCase(),
        cik,
        revenue,
        operatingIncome,
        totalAssets,
        totalDebt,
        netIncome,
        lastUpdated: new Date().toISOString(),
      }
    } catch (err) {
      console.error(`[EDGAR] Failed to fetch financials for ${ticker}:`, (err as Error).message)
      return null
    }
  })
}
