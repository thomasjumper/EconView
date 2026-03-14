import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { MOCK_STOCKS, MOCK_CRYPTO } from '../lib/mock-data'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ── Types ───────────────────────────────────────────────────────────────

export interface StockPrice {
  symbol: string
  name: string
  price: number
  change: number
}

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
}

// ── Shared Socket Connection ────────────────────────────────────────────

let sharedSocket: Socket | null = null
let socketRefCount = 0

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 5000,
    })
  }
  socketRefCount++
  return sharedSocket
}

function releaseSocket() {
  socketRefCount--
  if (socketRefCount <= 0 && sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
    socketRefCount = 0
  }
}

// ── Stock Prices Hook ───────────────────────────────────────────────────

export function useStockPrices(): StockPrice[] {
  const [stocks, setStocks] = useState<Map<string, StockPrice>>(() => {
    const map = new Map<string, StockPrice>()
    for (const s of MOCK_STOCKS) {
      map.set(s.symbol, s)
    }
    return map
  })
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    const handleTrades = (data: StockPrice | StockPrice[]) => {
      setStocks((prev) => {
        const next = new Map(prev)
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          const existing = next.get(item.symbol)
          next.set(item.symbol, {
            symbol: item.symbol,
            name: item.name ?? existing?.name ?? item.symbol,
            price: item.price,
            change: item.change ?? existing?.change ?? 0,
          })
        }
        return next
      })
    }

    socket.on('trades', handleTrades)

    return () => {
      socket.off('trades', handleTrades)
      releaseSocket()
      socketRef.current = null
    }
  }, [])

  return Array.from(stocks.values())
}

// ── Crypto Prices Hook ──────────────────────────────────────────────────

export function useCryptoPrices(): CryptoPrice[] {
  const [crypto, setCrypto] = useState<Map<string, CryptoPrice>>(() => {
    const map = new Map<string, CryptoPrice>()
    for (const c of MOCK_CRYPTO) {
      map.set(c.id, c)
    }
    return map
  })
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    const handleCrypto = (data: CryptoPrice | CryptoPrice[]) => {
      setCrypto((prev) => {
        const next = new Map(prev)
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          next.set(item.id, {
            id: item.id,
            symbol: item.symbol ?? prev.get(item.id)?.symbol ?? '',
            name: item.name ?? prev.get(item.id)?.name ?? '',
            price: item.price,
            change24h: item.change24h ?? prev.get(item.id)?.change24h ?? 0,
            marketCap: item.marketCap ?? prev.get(item.id)?.marketCap ?? 0,
          })
        }
        return next
      })
    }

    socket.on('crypto', handleCrypto)

    return () => {
      socket.off('crypto', handleCrypto)
      releaseSocket()
      socketRef.current = null
    }
  }, [])

  return Array.from(crypto.values())
}
