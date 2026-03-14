import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

// ---------------------------------------------------------------------------
// Crypto Fear & Greed Index (alternative.me — no API key needed)
// ---------------------------------------------------------------------------

export async function fetchCryptoFearGreed(): Promise<{
  value: number
  classification: string
  timestamp: string
}> {
  return cachedFetch('defi:fear-greed', 3600, async () => {
    const res = await axios.get('https://api.alternative.me/fng/')
    const entry = res.data?.data?.[0]

    if (!entry) {
      return { value: 50, classification: 'Neutral', timestamp: new Date().toISOString() }
    }

    console.log(`[FearGreed] Crypto Fear & Greed: ${entry.value} (${entry.value_classification})`)

    return {
      value: parseInt(entry.value, 10),
      classification: entry.value_classification,
      timestamp: new Date(parseInt(entry.timestamp, 10) * 1000).toISOString(),
    }
  })
}
