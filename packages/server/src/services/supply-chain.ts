import { cachedFetch } from '../cache/redis.js'

interface SupplyChainData {
  date: string
  gscpi: number
  trend: 'improving' | 'worsening' | 'stable'
  history: { date: string; value: number }[]
}

export async function fetchSupplyChainPressure(): Promise<SupplyChainData> {
  return cachedFetch('supply-chain:gscpi', 86400, async () => {
    // NY Fed GSCPI — hardcoded recent values (updated monthly)
    // 0 = historical average, positive = above-average pressure
    const history = [
      { date: '2025-01', value: -0.15 },
      { date: '2025-02', value: -0.08 },
      { date: '2025-03', value: 0.12 },
      { date: '2025-04', value: 0.28 },
      { date: '2025-05', value: 0.35 },
      { date: '2025-06', value: 0.22 },
      { date: '2025-07', value: 0.18 },
      { date: '2025-08', value: 0.25 },
      { date: '2025-09', value: 0.30 },
      { date: '2025-10', value: 0.15 },
      { date: '2025-11', value: 0.10 },
      { date: '2025-12', value: 0.08 },
      { date: '2026-01', value: 0.45 },
      { date: '2026-02', value: 0.52 },
    ]

    const latest = history[history.length - 1]
    const prev = history[history.length - 2]

    const diff = latest.value - prev.value
    const trend: SupplyChainData['trend'] =
      diff > 0.1 ? 'worsening' : diff < -0.1 ? 'improving' : 'stable'

    console.log(`[SupplyChain] GSCPI ${latest.date}: ${latest.value} (${trend})`)

    return { date: latest.date, gscpi: latest.value, trend, history }
  })
}
