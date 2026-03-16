import { cachedFetch } from '../cache/redis.js'

// ── Types ────────────────────────────────────────────────────────────────

export interface DebtFlow {
  id: string
  holder: string
  issuer: string
  amount: number // billions USD
  change30d: number // billions USD
  instrumentType: 'treasury' | 'sovereign_bond' | 'corporate_bond'
}

// ── Hardcoded Data (based on US Treasury TIC data + global estimates) ────

const DEBT_FLOWS: DebtFlow[] = [
  // Top holders of US Treasuries
  {
    id: 'jpn_usa_treasury',
    holder: 'JPN',
    issuer: 'USA',
    amount: 1080,
    change30d: -12,
    instrumentType: 'treasury',
  },
  {
    id: 'chn_usa_treasury',
    holder: 'CHN',
    issuer: 'USA',
    amount: 769,
    change30d: -8,
    instrumentType: 'treasury',
  },
  {
    id: 'gbr_usa_treasury',
    holder: 'GBR',
    issuer: 'USA',
    amount: 723,
    change30d: 5,
    instrumentType: 'treasury',
  },
  {
    id: 'bel_usa_treasury',
    holder: 'BEL',
    issuer: 'USA',
    amount: 370,
    change30d: 2,
    instrumentType: 'treasury',
  },
  {
    id: 'can_usa_treasury',
    holder: 'CAN',
    issuer: 'USA',
    amount: 320,
    change30d: 1,
    instrumentType: 'treasury',
  },
  {
    id: 'irl_usa_treasury',
    holder: 'IRL',
    issuer: 'USA',
    amount: 310,
    change30d: 3,
    instrumentType: 'treasury',
  },
  {
    id: 'lux_usa_treasury',
    holder: 'LUX',
    issuer: 'USA',
    amount: 298,
    change30d: 1,
    instrumentType: 'treasury',
  },
  {
    id: 'che_usa_treasury',
    holder: 'CHE',
    issuer: 'USA',
    amount: 285,
    change30d: -2,
    instrumentType: 'treasury',
  },
  {
    id: 'cym_usa_treasury',
    holder: 'CYM',
    issuer: 'USA',
    amount: 275,
    change30d: 4,
    instrumentType: 'treasury',
  },
  {
    id: 'twn_usa_treasury',
    holder: 'TWN',
    issuer: 'USA',
    amount: 252,
    change30d: -1,
    instrumentType: 'treasury',
  },
  {
    id: 'ind_usa_treasury',
    holder: 'IND',
    issuer: 'USA',
    amount: 232,
    change30d: 6,
    instrumentType: 'treasury',
  },
  {
    id: 'bra_usa_treasury',
    holder: 'BRA',
    issuer: 'USA',
    amount: 218,
    change30d: -3,
    instrumentType: 'treasury',
  },
  {
    id: 'kor_usa_treasury',
    holder: 'KOR',
    issuer: 'USA',
    amount: 112,
    change30d: 2,
    instrumentType: 'treasury',
  },
  {
    id: 'sgp_usa_treasury',
    holder: 'SGP',
    issuer: 'USA',
    amount: 188,
    change30d: 1,
    instrumentType: 'treasury',
  },
  {
    id: 'sau_usa_treasury',
    holder: 'SAU',
    issuer: 'USA',
    amount: 135,
    change30d: -4,
    instrumentType: 'treasury',
  },
  {
    id: 'nor_usa_treasury',
    holder: 'NOR',
    issuer: 'USA',
    amount: 108,
    change30d: 2,
    instrumentType: 'treasury',
  },

  // Non-US sovereign debt holdings
  {
    id: 'deu_ita_sovereign',
    holder: 'DEU',
    issuer: 'ITA',
    amount: 85,
    change30d: -1,
    instrumentType: 'sovereign_bond',
  },
  {
    id: 'chn_emkt_sovereign',
    holder: 'CHN',
    issuer: 'EMK',
    amount: 145,
    change30d: 8,
    instrumentType: 'sovereign_bond',
  },
  {
    id: 'jpn_aus_sovereign',
    holder: 'JPN',
    issuer: 'AUS',
    amount: 62,
    change30d: 1,
    instrumentType: 'sovereign_bond',
  },
  {
    id: 'gbr_deu_sovereign',
    holder: 'GBR',
    issuer: 'DEU',
    amount: 78,
    change30d: 3,
    instrumentType: 'sovereign_bond',
  },
  {
    id: 'fra_esp_sovereign',
    holder: 'FRA',
    issuer: 'ESP',
    amount: 55,
    change30d: -2,
    instrumentType: 'sovereign_bond',
  },
]

// ── Public API ───────────────────────────────────────────────────────────

const CACHE_TTL = 60 * 60 // 1 hour

export async function fetchDebtFlows(): Promise<DebtFlow[]> {
  return cachedFetch('econview:debt-flows', CACHE_TTL, async () => {
    console.log(`[DebtFlows] Returning ${DEBT_FLOWS.length} sovereign debt holdings`)
    return DEBT_FLOWS
  })
}
