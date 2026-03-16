import { cachedFetch } from '../cache/redis.js'

// ── Types ────────────────────────────────────────────────────────────────

export interface CapitalFlow {
  id: string
  source: string
  target: string
  flowType: 'portfolio' | 'fdi' | 'banking' | 'central_bank' | 'remittance' | 'trade_settlement'
  dailyVolume: number // USD millions
  netDirection: 'source_to_target' | 'target_to_source'
  velocity: number // 0-1 scale
  trend: 'accelerating' | 'stable' | 'decelerating'
}

// ── Hardcoded Data ───────────────────────────────────────────────────────

const CAPITAL_FLOWS: CapitalFlow[] = [
  // US–China corridor
  {
    id: 'usa_chn_trade',
    source: 'USA',
    target: 'CHN',
    flowType: 'trade_settlement',
    dailyVolume: 1200,
    netDirection: 'target_to_source',
    velocity: 0.72,
    trend: 'stable',
  },
  {
    id: 'chn_usa_portfolio',
    source: 'CHN',
    target: 'USA',
    flowType: 'portfolio',
    dailyVolume: 800,
    netDirection: 'source_to_target',
    velocity: 0.55,
    trend: 'decelerating',
  },

  // Japan–US corridor
  {
    id: 'jpn_usa_portfolio',
    source: 'JPN',
    target: 'USA',
    flowType: 'portfolio',
    dailyVolume: 600,
    netDirection: 'source_to_target',
    velocity: 0.60,
    trend: 'stable',
  },

  // Europe–US corridor
  {
    id: 'eur_usa_banking',
    source: 'EUR',
    target: 'USA',
    flowType: 'banking',
    dailyVolume: 2500,
    netDirection: 'source_to_target',
    velocity: 0.85,
    trend: 'accelerating',
  },
  {
    id: 'usa_eur_trade',
    source: 'USA',
    target: 'EUR',
    flowType: 'trade_settlement',
    dailyVolume: 900,
    netDirection: 'source_to_target',
    velocity: 0.65,
    trend: 'stable',
  },

  // Remittances
  {
    id: 'mex_usa_remittance',
    source: 'MEX',
    target: 'USA',
    flowType: 'remittance',
    dailyVolume: 180,
    netDirection: 'target_to_source',
    velocity: 0.50,
    trend: 'stable',
  },
  {
    id: 'ind_usa_remittance',
    source: 'IND',
    target: 'USA',
    flowType: 'remittance',
    dailyVolume: 95,
    netDirection: 'target_to_source',
    velocity: 0.48,
    trend: 'accelerating',
  },

  // India–US portfolio
  {
    id: 'ind_usa_portfolio',
    source: 'IND',
    target: 'USA',
    flowType: 'portfolio',
    dailyVolume: 200,
    netDirection: 'source_to_target',
    velocity: 0.45,
    trend: 'accelerating',
  },

  // UK clearing
  {
    id: 'usa_gbr_banking',
    source: 'USA',
    target: 'GBR',
    flowType: 'banking',
    dailyVolume: 1800,
    netDirection: 'source_to_target',
    velocity: 0.90,
    trend: 'stable',
  },

  // Oil corridors
  {
    id: 'sau_chn_trade',
    source: 'SAU',
    target: 'CHN',
    flowType: 'trade_settlement',
    dailyVolume: 350,
    netDirection: 'source_to_target',
    velocity: 0.62,
    trend: 'accelerating',
  },
  {
    id: 'sau_usa_trade',
    source: 'SAU',
    target: 'USA',
    flowType: 'trade_settlement',
    dailyVolume: 280,
    netDirection: 'source_to_target',
    velocity: 0.58,
    trend: 'decelerating',
  },

  // Commodity corridors
  {
    id: 'chn_aus_trade',
    source: 'CHN',
    target: 'AUS',
    flowType: 'trade_settlement',
    dailyVolume: 250,
    netDirection: 'target_to_source',
    velocity: 0.55,
    trend: 'stable',
  },
  {
    id: 'bra_chn_trade',
    source: 'BRA',
    target: 'CHN',
    flowType: 'trade_settlement',
    dailyVolume: 320,
    netDirection: 'source_to_target',
    velocity: 0.60,
    trend: 'accelerating',
  },

  // FDI flows
  {
    id: 'usa_ind_fdi',
    source: 'USA',
    target: 'IND',
    flowType: 'fdi',
    dailyVolume: 150,
    netDirection: 'source_to_target',
    velocity: 0.35,
    trend: 'accelerating',
  },
  {
    id: 'usa_gbr_fdi',
    source: 'USA',
    target: 'GBR',
    flowType: 'fdi',
    dailyVolume: 120,
    netDirection: 'source_to_target',
    velocity: 0.30,
    trend: 'stable',
  },
  {
    id: 'eur_usa_fdi',
    source: 'EUR',
    target: 'USA',
    flowType: 'fdi',
    dailyVolume: 180,
    netDirection: 'source_to_target',
    velocity: 0.32,
    trend: 'stable',
  },

  // Central bank flows
  {
    id: 'chn_usa_central_bank',
    source: 'CHN',
    target: 'USA',
    flowType: 'central_bank',
    dailyVolume: 400,
    netDirection: 'source_to_target',
    velocity: 0.40,
    trend: 'decelerating',
  },
  {
    id: 'jpn_usa_central_bank',
    source: 'JPN',
    target: 'USA',
    flowType: 'central_bank',
    dailyVolume: 350,
    netDirection: 'source_to_target',
    velocity: 0.42,
    trend: 'stable',
  },

  // Korea–US
  {
    id: 'kor_usa_portfolio',
    source: 'KOR',
    target: 'USA',
    flowType: 'portfolio',
    dailyVolume: 220,
    netDirection: 'source_to_target',
    velocity: 0.50,
    trend: 'stable',
  },

  // Switzerland banking hub
  {
    id: 'che_usa_banking',
    source: 'CHE',
    target: 'USA',
    flowType: 'banking',
    dailyVolume: 650,
    netDirection: 'source_to_target',
    velocity: 0.75,
    trend: 'stable',
  },

  // Singapore hub
  {
    id: 'sgp_chn_banking',
    source: 'SGP',
    target: 'CHN',
    flowType: 'banking',
    dailyVolume: 420,
    netDirection: 'source_to_target',
    velocity: 0.70,
    trend: 'accelerating',
  },

  // Russia–India energy
  {
    id: 'rus_ind_trade',
    source: 'RUS',
    target: 'IND',
    flowType: 'trade_settlement',
    dailyVolume: 190,
    netDirection: 'source_to_target',
    velocity: 0.52,
    trend: 'accelerating',
  },

  // Canada–US
  {
    id: 'can_usa_trade',
    source: 'CAN',
    target: 'USA',
    flowType: 'trade_settlement',
    dailyVolume: 750,
    netDirection: 'source_to_target',
    velocity: 0.78,
    trend: 'stable',
  },
]

// ── Public API ───────────────────────────────────────────────────────────

const CACHE_TTL = 30 * 60 // 30 minutes

export async function fetchCapitalFlows(): Promise<CapitalFlow[]> {
  return cachedFetch('econview:capital-flows', CACHE_TTL, async () => {
    console.log(`[CapitalFlows] Returning ${CAPITAL_FLOWS.length} capital flow corridors`)
    return CAPITAL_FLOWS
  })
}
