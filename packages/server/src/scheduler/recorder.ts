import type { Server as SocketIOServer } from 'socket.io'
import { insertPriceSnapshot, insertYieldSnapshot } from '../services/timescaledb.js'
import { fetchYieldCurve } from '../services/fred.js'

// ---------------------------------------------------------------------------
// Price recording — debounced to once per minute per symbol
// ---------------------------------------------------------------------------

interface PendingPrice {
  price: number
  volume: number
  lastSeen: number
}

const pendingPrices = new Map<string, PendingPrice>()
let priceFlushInterval: ReturnType<typeof setInterval> | null = null

const PRICE_FLUSH_INTERVAL_MS = 60_000 // 1 minute
const YIELD_RECORD_INTERVAL_MS = 5 * 60_000 // 5 minutes

/**
 * Buffer an incoming trade. The latest price/volume for each symbol
 * is kept and flushed to TimescaleDB once per minute.
 */
function bufferTrade(symbol: string, price: number, volume: number): void {
  pendingPrices.set(symbol, { price, volume, lastSeen: Date.now() })
}

/**
 * Flush all buffered prices to TimescaleDB.
 */
async function flushPrices(): Promise<void> {
  if (pendingPrices.size === 0) return

  const entries = Array.from(pendingPrices.entries())
  pendingPrices.clear()

  let inserted = 0
  for (const [symbol, { price, volume }] of entries) {
    await insertPriceSnapshot(symbol, price, volume)
    inserted++
  }

  if (inserted > 0) {
    console.log(`[Recorder] Flushed ${inserted} price snapshots to TimescaleDB`)
  }
}

// ---------------------------------------------------------------------------
// Yield recording — periodically fetches FRED data and records it
// ---------------------------------------------------------------------------

let yieldInterval: ReturnType<typeof setInterval> | null = null

async function recordYields(): Promise<void> {
  try {
    const yieldData = await fetchYieldCurve()

    for (const [series, observations] of Object.entries(yieldData.series)) {
      if (observations.length > 0) {
        // Record the most recent observation
        const latest = observations[observations.length - 1]
        if (latest && !isNaN(latest.value)) {
          await insertYieldSnapshot(series, latest.value)
        }
      }
    }

    console.log('[Recorder] Recorded yield snapshots to TimescaleDB')
  } catch (err) {
    console.error('[Recorder] Failed to record yields:', (err as Error).message)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the data recorder. Listens for Finnhub trades via Socket.io
 * and periodically records FRED yield data to TimescaleDB.
 */
export function startRecording(io: SocketIOServer): void {
  console.log('[Recorder] Starting historical data recording')

  // Listen for trade events emitted by the Finnhub relay
  // The relay emits 'trades' events to all connected Socket.io clients,
  // but we hook into the server-side emitter to capture them.
  const originalEmit = io.emit.bind(io)
  io.emit = ((event: string, ...args: unknown[]) => {
    if (event === 'trades' && Array.isArray(args[0])) {
      const trades = args[0] as Array<{ symbol: string; price: number; volume: number }>
      for (const trade of trades) {
        bufferTrade(trade.symbol, trade.price, trade.volume)
      }
    }
    return originalEmit(event, ...args)
  }) as typeof io.emit

  // Flush buffered prices every minute
  priceFlushInterval = setInterval(() => {
    flushPrices().catch((err) => {
      console.error('[Recorder] Price flush error:', (err as Error).message)
    })
  }, PRICE_FLUSH_INTERVAL_MS)

  // Record yields every 5 minutes
  yieldInterval = setInterval(() => {
    recordYields().catch((err) => {
      console.error('[Recorder] Yield recording error:', (err as Error).message)
    })
  }, YIELD_RECORD_INTERVAL_MS)

  // Initial yield recording after a short delay
  setTimeout(() => {
    recordYields().catch((err) => {
      console.error('[Recorder] Initial yield recording error:', (err as Error).message)
    })
  }, 10_000)

  console.log('[Recorder] Price flush every 60s, yield recording every 5min')
}

/**
 * Stop the recorder (for graceful shutdown).
 */
export async function stopRecording(): Promise<void> {
  if (priceFlushInterval) {
    clearInterval(priceFlushInterval)
    priceFlushInterval = null
  }
  if (yieldInterval) {
    clearInterval(yieldInterval)
    yieldInterval = null
  }
  // Final flush
  await flushPrices()
  console.log('[Recorder] Stopped')
}
