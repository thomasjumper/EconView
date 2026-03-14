import { Router, type Router as RouterType } from 'express'
import { fetchGDP } from '../services/worldbank.js'
import { fetchYieldCurve } from '../services/fred.js'
import { getCompanyFinancials } from '../services/edgar.js'
import { getHistoricalPrices, getHistoricalYields } from '../services/timescaledb.js'
import { fetchNewsSentiment, fetchCountrySentiment, aggregateSentiment } from '../services/gdelt.js'
import { computeMarketRisk, computeRecessionProbability } from '../services/risk.js'
import { getActiveAlerts } from '../services/alerts.js'
import { processQuery } from '../services/ai-query.js'
import type { MarketContext } from '../services/ai-query.js'

const router: RouterType = Router()

router.get('/api/gdp', async (_req, res) => {
  try {
    const data = await fetchGDP()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/gdp error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/yields', async (_req, res) => {
  try {
    const data = await fetchYieldCurve()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/yields error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// SEC EDGAR — company financials
// ---------------------------------------------------------------------------

router.get('/api/company/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params
    if (!ticker || typeof ticker !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing ticker parameter' })
      return
    }

    const data = await getCompanyFinancials(ticker)
    if (!data) {
      res.status(404).json({ ok: false, error: `No data found for ticker: ${ticker}` })
      return
    }

    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/company/:ticker error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Historical price data from TimescaleDB
// ---------------------------------------------------------------------------

router.get('/api/history/prices', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string)?.toUpperCase()
    if (!symbol) {
      res.status(400).json({ ok: false, error: 'Missing symbol query parameter' })
      return
    }

    const days = parseInt((req.query.days as string) || '30', 10)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const data = await getHistoricalPrices(symbol, startDate, endDate)
    res.json({ ok: true, symbol, days, count: data.length, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/history/prices error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Historical yield data from TimescaleDB
// ---------------------------------------------------------------------------

router.get('/api/history/yields', async (req, res) => {
  try {
    const series = (req.query.series as string)?.toUpperCase()
    if (!series) {
      res.status(400).json({ ok: false, error: 'Missing series query parameter' })
      return
    }

    const days = parseInt((req.query.days as string) || '365', 10)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const data = await getHistoricalYields(series, startDate, endDate)
    res.json({ ok: true, series, days, count: data.length, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/history/yields error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// GDELT Sentiment
// ---------------------------------------------------------------------------

router.get('/api/sentiment', async (req, res) => {
  try {
    const country = (req.query.country as string) || ''
    const query = (req.query.query as string) || ''
    const timespan = (req.query.timespan as string) || '2weeks'

    let articles
    if (country) {
      articles = await fetchCountrySentiment(country)
    } else if (query) {
      articles = await fetchNewsSentiment(query, timespan)
    } else {
      articles = await fetchNewsSentiment('economy recession', timespan)
    }

    const sentiment = aggregateSentiment(articles)

    res.json({
      ok: true,
      data: {
        articles: articles.slice(0, 25),
        sentiment,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/sentiment error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Risk Scores
// ---------------------------------------------------------------------------

router.get('/api/risk', async (_req, res) => {
  try {
    const yieldData = await fetchYieldCurve()
    const gdpData = await fetchGDP()

    const marketRisk = computeMarketRisk(yieldData.series)
    const recessionProb = computeRecessionProbability(yieldData.series, gdpData)
    const alerts = getActiveAlerts()

    res.json({
      ok: true,
      data: {
        market: marketRisk,
        recession: recessionProb,
        alerts,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/risk error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Active Alerts
// ---------------------------------------------------------------------------

router.get('/api/alerts', (_req, res) => {
  try {
    const alerts = getActiveAlerts()
    res.json({ ok: true, data: alerts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/alerts error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// AI Natural Language Query
// ---------------------------------------------------------------------------

router.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body as { query?: string }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ ok: false, error: 'Query string is required' })
      return
    }

    // Build context from current data
    let context: MarketContext = {}
    try {
      const yieldData = await fetchYieldCurve()
      const gdpData = await fetchGDP()
      const marketRisk = computeMarketRisk(yieldData.series)
      const recessionProb = computeRecessionProbability(yieldData.series, gdpData)
      const alerts = getActiveAlerts()

      context = {
        yieldSpread: marketRisk.yieldSpread,
        fedFundsRate: marketRisk.fedFundsRate,
        threatLevel: marketRisk.threatLevel,
        recessionProbability: recessionProb.probability,
        topCountries: gdpData.slice(0, 10).map((c) => c.name),
        activeAlerts: alerts.map((a) => a.message),
      }
    } catch {
      // Continue with empty context if data fetch fails
    }

    const response = await processQuery(query.trim(), context)
    res.json({ ok: true, data: response })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/query error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

router.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      worldbank: 'available',
      fred: process.env.FRED_API_KEY ? 'available' : 'missing_api_key',
      finnhub: process.env.FINNHUB_API_KEY ? 'available' : 'missing_api_key',
      coingecko: 'available',
      edgar: process.env.SEC_EDGAR_USER_AGENT ? 'available' : 'missing_user_agent',
      timescaledb: process.env.TIMESCALE_URL ? 'available' : 'not_configured',
      gdelt: 'available',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'available' : 'missing_api_key',
    },
  })
})

export default router
