import WebSocket from 'ws'
import axios from 'axios'
import type { Server as SocketIOServer } from 'socket.io'

const MAX_SYMBOLS = 50
const MAX_RECONNECTS = 3
const RECONNECT_DELAY_MS = 3000
const REST_POLL_INTERVAL_MS = 15_000 // 15 seconds for REST fallback

interface FinnhubTrade {
  s: string  // symbol
  p: number  // price
  v: number  // volume
  t: number  // timestamp (ms)
  c: string[] // trade conditions
}

interface TradeUpdate {
  symbol: string
  price: number
  volume: number
  timestamp: number
}

export function connectFinnhubWS(io: SocketIOServer, symbols: string[]): void {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.error('[Finnhub] FINNHUB_API_KEY not set — skipping WebSocket relay')
    return
  }

  const activeSymbols = symbols.slice(0, MAX_SYMBOLS)
  let reconnectCount = 0
  let ws: WebSocket | null = null
  let pollInterval: ReturnType<typeof setInterval> | null = null

  function connect() {
    if (reconnectCount >= MAX_RECONNECTS) {
      console.warn('[Finnhub] Max reconnects reached — falling back to REST polling')
      startRESTPolling()
      return
    }

    const url = `wss://ws.finnhub.io?token=${apiKey}`
    ws = new WebSocket(url)

    ws.on('open', () => {
      console.log(`[Finnhub] WebSocket connected, subscribing to ${activeSymbols.length} symbols`)
      reconnectCount = 0 // reset on successful connection

      for (const symbol of activeSymbols) {
        ws!.send(JSON.stringify({ type: 'subscribe', symbol }))
      }
    })

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          const trades: TradeUpdate[] = (msg.data as FinnhubTrade[]).map((t) => ({
            symbol: t.s,
            price: t.p,
            volume: t.v,
            timestamp: t.t,
          }))
          io.emit('trades', trades)
        }
      } catch {
        // ignore malformed messages
      }
    })

    ws.on('error', (err) => {
      console.error('[Finnhub] WebSocket error:', err.message)
    })

    ws.on('close', (code, reason) => {
      console.warn(`[Finnhub] WebSocket closed (code=${code}, reason=${reason.toString()})`)
      ws = null
      reconnectCount++

      if (reconnectCount < MAX_RECONNECTS) {
        console.log(`[Finnhub] Reconnecting in ${RECONNECT_DELAY_MS}ms (attempt ${reconnectCount}/${MAX_RECONNECTS})`)
        setTimeout(connect, RECONNECT_DELAY_MS)
      } else {
        console.warn('[Finnhub] Max reconnects reached — falling back to REST polling')
        startRESTPolling()
      }
    })
  }

  function startRESTPolling() {
    if (pollInterval) return
    console.log('[Finnhub] Starting REST poll fallback')

    async function poll() {
      const trades: TradeUpdate[] = []

      for (const symbol of activeSymbols) {
        try {
          const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
            params: { symbol, token: apiKey },
          })
          if (data && data.c) {
            trades.push({
              symbol,
              price: data.c,  // current price
              volume: data.v || 0,
              timestamp: Date.now(),
            })
          }
        } catch {
          // skip failed quote
        }
      }

      if (trades.length > 0) {
        io.emit('trades', trades)
      }
    }

    poll() // immediate first poll
    pollInterval = setInterval(poll, REST_POLL_INTERVAL_MS)
  }

  connect()
}
