import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Load .env from monorepo root (two levels up from packages/server/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import apiRouter from './routes/api.js'
import { connectFinnhubWS } from './websocket/finnhub-relay.js'
import { startCryptoPolling } from './services/coingecko.js'
import { initializeSchema } from './services/timescaledb.js'
import { startRecording } from './scheduler/recorder.js'
import { startAlertMonitor } from './services/alerts.js'
import { rateLimit } from './middleware/rate-limit.js'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

const PORT = parseInt(process.env.PORT || '3001', 10)

// CORS middleware
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  if (_req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

app.use(express.json())

// Rate limiting on API routes
app.use('/api', rateLimit({ windowMs: 60000, max: 120 }))

// API routes
app.use(apiRouter)

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`)
  })
})

// Default symbols for Finnhub relay
const DEFAULT_SYMBOLS = [
  'SPY', 'QQQ', 'DIA', 'IWM', 'GLD',
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN',
  'META', 'TSLA', 'JPM', 'V', 'JNJ',
  'UNH', 'XOM', 'PG', 'HD', 'MA',
  'BAC', 'ABBV', 'KO', 'PEP', 'COST',
  'MRK', 'LLY', 'AVGO', 'TMO', 'WMT',
]

// Start services
connectFinnhubWS(io, DEFAULT_SYMBOLS)
startCryptoPolling(io)

// Initialize TimescaleDB schema (async — don't block server start)
initializeSchema()
  .then(() => {
    // Start recording only after schema is ready
    startRecording(io)
  })
  .catch((err) => {
    console.error('[EconView] TimescaleDB init failed (non-fatal):', (err as Error).message)
    // Still start recording — it will gracefully no-op if DB is unavailable
    startRecording(io)
  })

// Start alert monitoring (every 2 minutes)
startAlertMonitor(io, 2 * 60 * 1000)

httpServer.listen(PORT, () => {
  console.log(`[EconView] Server running on port ${PORT}`)
})
