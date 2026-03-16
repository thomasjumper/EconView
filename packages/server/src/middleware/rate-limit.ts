import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetTime < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs || 60 * 1000 // 1 minute
  const max = options.max || 100 // 100 requests per window

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs }
      store.set(key, entry)
    }

    entry.count++

    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)))

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetTime - now) / 1000)))
      res.status(429).json({ ok: false, error: 'Too many requests' })
      return
    }

    next()
  }
}
