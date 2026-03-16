import { Router, type Router as RouterType } from 'express'
import { fetchGDP } from '../services/worldbank.js'
import {
  fetchYieldCurve,
  fetchCreditSpreads,
  fetchYieldSpreads,
  fetchFinancialConditions,
  fetchMoneySupply,
  fetchSentiment as fetchFredSentiment,
  fetchLaborMarket,
  fetchFiscalData,
} from '../services/fred.js'
import { getCompanyFinancials } from '../services/edgar.js'
import { getHistoricalPrices, getHistoricalYields } from '../services/timescaledb.js'
import { fetchNewsSentiment, fetchCountrySentiment, aggregateSentiment } from '../services/gdelt.js'
import { computeMarketRisk, computeRecessionProbability } from '../services/risk.js'
import { getActiveAlerts } from '../services/alerts.js'
import { processQuery } from '../services/ai-query.js'
import type { MarketContext } from '../services/ai-query.js'
import { fetchCommodities, fetchCommoditiesByCategory } from '../services/commodities.js'
import { fetchForexRates } from '../services/forex.js'
import { fetchIndicators } from '../services/global-indicators.js'
import {
  fetchFullCalendar,
  fetchEarningsCalendar,
  fetchEconomicCalendar,
  fetchIPOCalendar,
} from '../services/calendar.js'
import { fetchDeFiOverview, fetchStablecoinSupply } from '../services/defi.js'
import { fetchCryptoFearGreed } from '../services/fear-greed.js'
import { fetchSupplyChainPressure } from '../services/supply-chain.js'
import { fetchPropertyPrices } from '../services/property.js'
import { fetchDevelopmentIndicators } from '../services/wb-indicators.js'
import { fetchConflictData } from '../services/conflict.js'
import { fetchVesselPositions, fetchShippingLanes } from '../services/vessel-tracking.js'
import { fetchPortStatus } from '../services/port-data.js'
import { fetchCapitalFlows } from '../services/capital-flows.js'
import { fetchDebtFlows } from '../services/debt-flows.js'
import { getRecentEvents } from '../services/event-detector.js'
import { simulateCascade } from '../services/cascade-engine.js'
import { getPresetScenarios, simulateScenario, simulateCustomScenario } from '../services/scenario-engine.js'

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
// Commodities
// ---------------------------------------------------------------------------

router.get('/api/commodities', async (_req, res) => {
  try {
    const data = await fetchCommodities()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/commodities error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/commodities/:category', async (req, res) => {
  try {
    const { category } = req.params
    const validCategories = ['energy', 'precious_metals', 'industrial_metals', 'agriculture', 'livestock']
    if (!validCategories.includes(category)) {
      res.status(400).json({ ok: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` })
      return
    }
    const data = await fetchCommoditiesByCategory(category)
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/commodities/:category error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Forex
// ---------------------------------------------------------------------------

router.get('/api/forex', async (_req, res) => {
  try {
    const data = await fetchForexRates()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/forex error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Economic Indicators
// ---------------------------------------------------------------------------

router.get('/api/indicators', async (req, res) => {
  try {
    const category = req.query.category as string | undefined
    const country = req.query.country as string | undefined
    const data = await fetchIndicators(category, country)
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/indicators error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Credit Spreads (FRED)
// ---------------------------------------------------------------------------

router.get('/api/credit-spreads', async (_req, res) => {
  try {
    const data = await fetchCreditSpreads()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/credit-spreads error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Yield Spreads (FRED)
// ---------------------------------------------------------------------------

router.get('/api/yield-spreads', async (_req, res) => {
  try {
    const data = await fetchYieldSpreads()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/yield-spreads error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Financial Conditions (FRED)
// ---------------------------------------------------------------------------

router.get('/api/financial-conditions', async (_req, res) => {
  try {
    const data = await fetchFinancialConditions()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/financial-conditions error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Money Supply (FRED)
// ---------------------------------------------------------------------------

router.get('/api/money-supply', async (_req, res) => {
  try {
    const data = await fetchMoneySupply()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/money-supply error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Consumer / Business Sentiment (FRED)
// ---------------------------------------------------------------------------

router.get('/api/consumer-sentiment', async (_req, res) => {
  try {
    const data = await fetchFredSentiment()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/consumer-sentiment error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Labor Market (FRED)
// ---------------------------------------------------------------------------

router.get('/api/labor-market', async (_req, res) => {
  try {
    const data = await fetchLaborMarket()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/labor-market error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Fiscal Data (FRED)
// ---------------------------------------------------------------------------

router.get('/api/fiscal', async (_req, res) => {
  try {
    const data = await fetchFiscalData()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/fiscal error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Calendars (Finnhub)
// ---------------------------------------------------------------------------

router.get('/api/calendar', async (_req, res) => {
  try {
    const data = await fetchFullCalendar()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/calendar error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/calendar/earnings', async (_req, res) => {
  try {
    const data = await fetchEarningsCalendar()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/calendar/earnings error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/calendar/economic', async (_req, res) => {
  try {
    const data = await fetchEconomicCalendar()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/calendar/economic error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/calendar/ipo', async (_req, res) => {
  try {
    const data = await fetchIPOCalendar()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/calendar/ipo error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// DeFi Overview (DefiLlama + Fear & Greed)
// ---------------------------------------------------------------------------

router.get('/api/defi', async (_req, res) => {
  try {
    const [overview, stablecoins, fearGreed] = await Promise.all([
      fetchDeFiOverview(),
      fetchStablecoinSupply(),
      fetchCryptoFearGreed(),
    ])
    res.json({
      ok: true,
      data: {
        ...overview,
        stablecoins,
        fearGreed,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/defi error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/fear-greed', async (_req, res) => {
  try {
    const data = await fetchCryptoFearGreed()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/fear-greed error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Supply Chain Pressure (NY Fed GSCPI)
// ---------------------------------------------------------------------------

router.get('/api/supply-chain', async (_req, res) => {
  try {
    const data = await fetchSupplyChainPressure()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/supply-chain error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Property Prices (BIS Residential)
// ---------------------------------------------------------------------------

router.get('/api/property-prices', async (_req, res) => {
  try {
    const data = await fetchPropertyPrices()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/property-prices error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Development Indicators (World Bank)
// ---------------------------------------------------------------------------

router.get('/api/development', async (_req, res) => {
  try {
    const data = await fetchDevelopmentIndicators()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/development error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Conflict Data (ACLED-style)
// ---------------------------------------------------------------------------

router.get('/api/conflict', async (_req, res) => {
  try {
    const data = await fetchConflictData()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/conflict error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Vessel Tracking
// ---------------------------------------------------------------------------

router.get('/api/vessels', async (_req, res) => {
  try {
    const data = await fetchVesselPositions()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/vessels error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/vessels/lanes', async (_req, res) => {
  try {
    const data = await fetchShippingLanes()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/vessels/lanes error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Port Status
// ---------------------------------------------------------------------------

router.get('/api/ports', async (_req, res) => {
  try {
    const data = await fetchPortStatus()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/ports error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Capital Flows
// ---------------------------------------------------------------------------

router.get('/api/flows/capital', async (_req, res) => {
  try {
    const data = await fetchCapitalFlows()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/flows/capital error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Sovereign Debt Holdings
// ---------------------------------------------------------------------------

router.get('/api/flows/debt', async (_req, res) => {
  try {
    const data = await fetchDebtFlows()
    res.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/flows/debt error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Flow Summary (aggregated)
// ---------------------------------------------------------------------------

router.get('/api/flows/summary', async (_req, res) => {
  try {
    const [capital, debt] = await Promise.all([fetchCapitalFlows(), fetchDebtFlows()])

    const totalCapitalVolume = capital.reduce((sum, f) => sum + f.dailyVolume, 0)
    const totalDebtHoldings = debt.reduce((sum, d) => sum + d.amount, 0)
    const totalDebtChange = debt.reduce((sum, d) => sum + d.change30d, 0)

    const byFlowType: Record<string, number> = {}
    for (const f of capital) {
      byFlowType[f.flowType] = (byFlowType[f.flowType] || 0) + f.dailyVolume
    }

    res.json({
      ok: true,
      data: {
        capitalFlows: {
          count: capital.length,
          totalDailyVolumeM: totalCapitalVolume,
          byFlowType,
        },
        debtHoldings: {
          count: debt.length,
          totalAmountB: totalDebtHoldings,
          totalChange30dB: totalDebtChange,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/flows/summary error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Economic Events
// ---------------------------------------------------------------------------

router.get('/api/events', (_req, res) => {
  try {
    const events = getRecentEvents()
    res.json({ ok: true, data: events })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/events error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/events/:id/cascade', async (req, res) => {
  try {
    const { id } = req.params
    const events = getRecentEvents()
    const event = events.find((e) => e.id === id)
    if (!event) {
      res.status(404).json({ ok: false, error: `Event not found: ${id}` })
      return
    }
    const cascade = await simulateCascade(event)
    res.json({ ok: true, data: { event, cascade } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/events/:id/cascade error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

// ---------------------------------------------------------------------------
// Scenario Simulation
// ---------------------------------------------------------------------------

router.post('/api/scenario/simulate', async (req, res) => {
  try {
    const { scenarioId } = req.body as { scenarioId?: string }
    if (!scenarioId || typeof scenarioId !== 'string') {
      res.status(400).json({ ok: false, error: 'scenarioId is required' })
      return
    }
    const result = await simulateScenario(scenarioId)
    res.json({ ok: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/scenario/simulate error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.post('/api/scenario/custom', async (req, res) => {
  try {
    const { description } = req.body as { description?: string }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({ ok: false, error: 'description is required' })
      return
    }
    const result = await simulateCustomScenario(description.trim())
    res.json({ ok: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/scenario/custom error:', message)
    res.status(500).json({ ok: false, error: message })
  }
})

router.get('/api/scenario/presets', (_req, res) => {
  try {
    const presets = getPresetScenarios()
    res.json({ ok: true, data: presets })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] /api/scenario/presets error:', message)
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
      commodities: 'available',
      forex: 'available',
      globalIndicators: 'available',
      defiLlama: 'available',
      fearGreed: 'available',
      supplyChain: 'available',
      propertyPrices: 'available',
      developmentIndicators: 'available',
      conflict: 'available',
      vesselTracking: 'available',
      portData: 'available',
      capitalFlows: 'available',
      debtFlows: 'available',
      eventDetector: 'available',
      cascadeEngine: 'available',
      scenarioEngine: 'available',
    },
  })
})

export default router
