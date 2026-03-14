import axios from 'axios'
import type { Server as SocketIOServer } from 'socket.io'

const CG_BASE = 'https://api.coingecko.com/api/v3'
const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const MONTHLY_CALL_LIMIT = 9000

interface CoinMarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency: number | null
  sparkline_in_7d: { price: number[] } | null
  image: string
  last_updated: string
}

interface CryptoUpdate {
  coins: CoinMarketData[]
  lastUpdated: string
  monthlyCallsUsed: number
  monthlyCallLimit: number
}

let monthlyCallCount = 0
let monthResetDate = getMonthStart()

function getMonthStart(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function checkMonthReset(): void {
  const currentMonthStart = getMonthStart()
  if (currentMonthStart > monthResetDate) {
    monthlyCallCount = 0
    monthResetDate = currentMonthStart
    console.log('[CoinGecko] Monthly call counter reset')
  }
}

async function fetchCryptoMarkets(): Promise<CoinMarketData[]> {
  checkMonthReset()

  if (monthlyCallCount >= MONTHLY_CALL_LIMIT) {
    console.warn(`[CoinGecko] Monthly limit reached (${monthlyCallCount}/${MONTHLY_CALL_LIMIT}) — skipping`)
    return []
  }

  const { data } = await axios.get<CoinMarketData[]>(`${CG_BASE}/coins/markets`, {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 10,
      page: 1,
      sparkline: true,
      price_change_percentage: '7d',
    },
  })

  monthlyCallCount++
  return data
}

export function startCryptoPolling(io: SocketIOServer): void {
  console.log('[CoinGecko] Starting crypto polling (every 5 minutes)')

  async function poll() {
    try {
      const coins = await fetchCryptoMarkets()
      if (coins.length === 0) return

      const update: CryptoUpdate = {
        coins,
        lastUpdated: new Date().toISOString(),
        monthlyCallsUsed: monthlyCallCount,
        monthlyCallLimit: MONTHLY_CALL_LIMIT,
      }

      io.emit('crypto', update)
      console.log(`[CoinGecko] Broadcasted ${coins.length} coins (calls this month: ${monthlyCallCount})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // CoinGecko returns 429 when rate limited
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        console.warn('[CoinGecko] Rate limited (429) — will retry next interval')
      } else {
        console.error('[CoinGecko] Poll error:', message)
      }
    }
  }

  // Initial fetch after short delay to let server start
  setTimeout(poll, 5000)
  setInterval(poll, POLL_INTERVAL_MS)
}
