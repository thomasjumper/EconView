import { cachedFetch } from '../cache/redis.js'
import type { EconomicIndicator } from '@econview/shared'

const CACHE_TTL = 30 * 60 // 30 minutes

// ---------------------------------------------------------------------------
// Static indicators — realistic March 2026 values
// Some of these (VIX via VIXCLS, DXY via DTWEXBGS) are already fetched by
// the FRED service; we include static fallbacks here for the unified endpoint.
// ---------------------------------------------------------------------------

const STATIC_INDICATORS: EconomicIndicator[] = [
  // Manufacturing PMIs
  { id: 'us_mfg_pmi', name: 'US Manufacturing PMI', category: 'manufacturing', value: 50.3, previousValue: 49.8, unit: 'index', country: 'USA', lastUpdated: '2026-03-01' },
  { id: 'us_svc_pmi', name: 'US Services PMI', category: 'manufacturing', value: 52.6, previousValue: 52.0, unit: 'index', country: 'USA', lastUpdated: '2026-03-01' },
  { id: 'eu_mfg_pmi', name: 'Eurozone Manufacturing PMI', category: 'manufacturing', value: 47.0, previousValue: 46.6, unit: 'index', country: 'EUR', lastUpdated: '2026-03-01' },
  { id: 'eu_svc_pmi', name: 'Eurozone Services PMI', category: 'manufacturing', value: 50.2, previousValue: 50.7, unit: 'index', country: 'EUR', lastUpdated: '2026-03-01' },
  { id: 'cn_mfg_pmi', name: 'China Manufacturing PMI (Caixin)', category: 'manufacturing', value: 50.8, previousValue: 50.5, unit: 'index', country: 'CHN', lastUpdated: '2026-03-01' },
  { id: 'jp_mfg_pmi', name: 'Japan Manufacturing PMI', category: 'manufacturing', value: 48.2, previousValue: 48.0, unit: 'index', country: 'JPN', lastUpdated: '2026-03-01' },
  { id: 'de_mfg_pmi', name: 'Germany Manufacturing PMI', category: 'manufacturing', value: 45.5, previousValue: 45.2, unit: 'index', country: 'DEU', lastUpdated: '2026-03-01' },
  { id: 'gb_mfg_pmi', name: 'UK Manufacturing PMI', category: 'manufacturing', value: 47.5, previousValue: 47.0, unit: 'index', country: 'GBR', lastUpdated: '2026-03-01' },
  { id: 'in_mfg_pmi', name: 'India Manufacturing PMI', category: 'manufacturing', value: 56.5, previousValue: 56.9, unit: 'index', country: 'IND', lastUpdated: '2026-03-01' },

  // Inflation (CPI YoY)
  { id: 'us_cpi', name: 'US CPI YoY', category: 'inflation', value: 3.1, previousValue: 3.2, unit: '%', country: 'USA', lastUpdated: '2026-02-13' },
  { id: 'us_core_cpi', name: 'US Core CPI YoY', category: 'inflation', value: 3.8, previousValue: 3.9, unit: '%', country: 'USA', lastUpdated: '2026-02-13' },
  { id: 'us_pce', name: 'US PCE Price Index YoY', category: 'inflation', value: 2.8, previousValue: 2.6, unit: '%', country: 'USA', lastUpdated: '2026-02-28' },
  { id: 'eu_cpi', name: 'Eurozone HICP YoY', category: 'inflation', value: 2.6, previousValue: 2.8, unit: '%', country: 'EUR', lastUpdated: '2026-03-01' },
  { id: 'gb_cpi', name: 'UK CPI YoY', category: 'inflation', value: 4.0, previousValue: 4.2, unit: '%', country: 'GBR', lastUpdated: '2026-02-14' },
  { id: 'jp_cpi', name: 'Japan CPI YoY', category: 'inflation', value: 2.2, previousValue: 2.6, unit: '%', country: 'JPN', lastUpdated: '2026-02-21' },
  { id: 'cn_cpi', name: 'China CPI YoY', category: 'inflation', value: 0.7, previousValue: -0.8, unit: '%', country: 'CHN', lastUpdated: '2026-03-09' },

  // Employment
  { id: 'us_nfp', name: 'US Nonfarm Payrolls', category: 'employment', value: 225, previousValue: 216, unit: 'K jobs', country: 'USA', lastUpdated: '2026-03-07' },
  { id: 'us_unemployment', name: 'US Unemployment Rate', category: 'employment', value: 3.7, previousValue: 3.7, unit: '%', country: 'USA', lastUpdated: '2026-03-07' },
  { id: 'us_initial_claims', name: 'US Initial Jobless Claims', category: 'employment', value: 215, previousValue: 212, unit: 'K', country: 'USA', lastUpdated: '2026-03-13' },
  { id: 'eu_unemployment', name: 'Eurozone Unemployment Rate', category: 'employment', value: 6.4, previousValue: 6.4, unit: '%', country: 'EUR', lastUpdated: '2026-02-01' },

  // Trade
  { id: 'us_trade_balance', name: 'US Trade Balance', category: 'trade', value: -68.3, previousValue: -64.2, unit: '$B', country: 'USA', lastUpdated: '2026-03-06' },
  { id: 'cn_trade_balance', name: 'China Trade Balance', category: 'trade', value: 72.4, previousValue: 75.3, unit: '$B', country: 'CHN', lastUpdated: '2026-03-07' },
  { id: 'de_trade_balance', name: 'Germany Trade Balance', category: 'trade', value: 20.4, previousValue: 22.2, unit: 'EUR B', country: 'DEU', lastUpdated: '2026-03-07' },

  // Consumer
  { id: 'us_consumer_conf', name: 'US Consumer Confidence (CB)', category: 'consumer', value: 106.7, previousValue: 110.7, unit: 'index', country: 'USA', lastUpdated: '2026-02-27' },
  { id: 'us_michigan', name: 'Michigan Consumer Sentiment', category: 'consumer', value: 76.9, previousValue: 79.0, unit: 'index', country: 'USA', lastUpdated: '2026-03-14' },
  { id: 'us_retail_sales', name: 'US Retail Sales MoM', category: 'consumer', value: 0.6, previousValue: -0.8, unit: '%', country: 'USA', lastUpdated: '2026-03-14' },

  // Housing
  { id: 'us_housing_starts', name: 'US Housing Starts', category: 'housing', value: 1.46, previousValue: 1.36, unit: 'M SAAR', country: 'USA', lastUpdated: '2026-02-20' },
  { id: 'us_existing_home', name: 'US Existing Home Sales', category: 'housing', value: 4.00, previousValue: 3.96, unit: 'M SAAR', country: 'USA', lastUpdated: '2026-02-21' },
  { id: 'us_case_shiller', name: 'S&P/Case-Shiller Home Price YoY', category: 'housing', value: 5.5, previousValue: 5.4, unit: '%', country: 'USA', lastUpdated: '2026-02-25' },

  // Shipping
  { id: 'baltic_dry', name: 'Baltic Dry Index', category: 'shipping', value: 1685, previousValue: 1720, unit: 'index', lastUpdated: '2026-03-13' },
  { id: 'harpex', name: 'Harpex Container Index', category: 'shipping', value: 1150, previousValue: 1125, unit: 'index', lastUpdated: '2026-03-13' },
  { id: 'shanghai_cfci', name: 'Shanghai Containerized Freight Index', category: 'shipping', value: 1020, previousValue: 1045, unit: 'index', country: 'CHN', lastUpdated: '2026-03-08' },

  // Volatility
  { id: 'vix', name: 'CBOE VIX', category: 'volatility', value: 14.85, previousValue: 13.90, unit: 'index', country: 'USA', lastUpdated: '2026-03-13' },
  { id: 'move', name: 'ICE BofA MOVE Index', category: 'volatility', value: 98.5, previousValue: 102.3, unit: 'index', country: 'USA', lastUpdated: '2026-03-13' },
  { id: 'dxy', name: 'US Dollar Index (DXY)', category: 'volatility', value: 104.25, previousValue: 103.80, unit: 'index', country: 'USA', lastUpdated: '2026-03-13' },
  { id: 'gfsi', name: 'Global Financial Stress Index', category: 'volatility', value: -0.35, previousValue: -0.42, unit: 'index', lastUpdated: '2026-03-07' },
]

// ---------------------------------------------------------------------------
// Optionally overlay FRED live data for VIX and DXY
// We keep this lightweight — the main FRED service handles yield curves.
// ---------------------------------------------------------------------------

async function tryFredOverlay(indicators: EconomicIndicator[]): Promise<EconomicIndicator[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return indicators

  const fredSeries: Record<string, string> = {
    vix: 'VIXCLS',
    dxy: 'DTWEXBGS',
  }

  const updated = [...indicators]

  for (const [indicatorId, seriesId] of Object.entries(fredSeries)) {
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`,
      )
      const data = (await response.json()) as { observations?: Array<{ value: string }> }
      if (data.observations?.[0]?.value && data.observations[0].value !== '.') {
        const idx = updated.findIndex((i) => i.id === indicatorId)
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], value: parseFloat(data.observations[0].value) }
        }
      }
    } catch {
      // Silently fall through to static
    }
  }

  return updated
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchIndicators(category?: string, country?: string): Promise<EconomicIndicator[]> {
  const all = await cachedFetch('econview:indicators', CACHE_TTL, async () => {
    return tryFredOverlay(STATIC_INDICATORS)
  })

  let filtered = all
  if (category) {
    filtered = filtered.filter((i) => i.category === category)
  }
  if (country) {
    filtered = filtered.filter((i) => i.country === country)
  }

  return filtered
}
