import Redis from 'ioredis'

let redis: Redis | null = null
const memoryCache = new Map<string, { value: string; expiresAt: number }>()

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('[Cache] REDIS_URL not set — using in-memory cache')
    return null
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null // stop retrying
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message)
    })

    redis.on('connect', () => {
      console.log('[Cache] Redis connected')
    })

    redis.connect().catch((err) => {
      console.warn('[Cache] Redis connection failed, falling back to in-memory:', err.message)
      redis?.disconnect()
      redis = null
    })

    return redis
  } catch (err) {
    console.warn('[Cache] Failed to create Redis client, using in-memory cache')
    return null
  }
}

/**
 * Fetch data with caching. Tries Redis first, falls back to in-memory Map.
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetchFn - Async function that produces the value to cache
 */
export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const client = getRedis()

  // Try reading from Redis
  if (client) {
    try {
      const cached = await client.get(key)
      if (cached !== null) {
        return JSON.parse(cached) as T
      }
    } catch {
      // Redis read failed, continue to fetch
    }
  } else {
    // Try in-memory cache
    const entry = memoryCache.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      return JSON.parse(entry.value) as T
    }
    if (entry) memoryCache.delete(key)
  }

  // Fetch fresh data
  const data = await fetchFn()
  const serialized = JSON.stringify(data)

  // Write to Redis
  if (client) {
    try {
      await client.setex(key, ttlSeconds, serialized)
    } catch {
      // Redis write failed, store in memory as fallback
      memoryCache.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })
    }
  } else {
    // Write to in-memory cache
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  return data
}
