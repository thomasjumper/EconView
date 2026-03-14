import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const CACHE_TTL_15M = 15 * 60 // 15 minutes

// ---------------------------------------------------------------------------
// DeFi TVL Overview (DefiLlama — no API key needed)
// ---------------------------------------------------------------------------

export async function fetchDeFiOverview(): Promise<{
  totalTVL: number
  change24h: number
  topProtocols: { name: string; tvl: number; change24h: number; chain: string }[]
}> {
  return cachedFetch('defi:overview', CACHE_TTL_15M, async () => {
    const res = await axios.get('https://api.llama.fi/v2/protocols')
    const protocols = res.data as any[]

    // Sort by TVL descending and take top 20
    const sorted = protocols
      .filter((p: any) => p.tvl && p.tvl > 0)
      .sort((a: any, b: any) => b.tvl - a.tvl)

    const totalTVL = sorted.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0)

    // Compute approximate 24h change from top protocols
    const topWithChange = sorted.slice(0, 50)
    const totalPrev = topWithChange.reduce(
      (sum: number, p: any) => sum + (p.tvl || 0) / (1 + (p.change_1d || 0) / 100),
      0,
    )
    const change24h = totalPrev > 0 ? ((totalTVL - totalPrev) / totalPrev) * 100 : 0

    const topProtocols = sorted.slice(0, 20).map((p: any) => ({
      name: p.name,
      tvl: p.tvl,
      change24h: p.change_1d || 0,
      chain: p.chain || p.chains?.[0] || 'Multi',
    }))

    console.log(`[DeFi] Fetched ${sorted.length} protocols, total TVL: $${(totalTVL / 1e9).toFixed(1)}B`)
    return { totalTVL, change24h, topProtocols }
  })
}

// ---------------------------------------------------------------------------
// Stablecoin Supply (DefiLlama — no API key needed)
// ---------------------------------------------------------------------------

export async function fetchStablecoinSupply(): Promise<{
  totalSupply: number
  breakdown: { name: string; supply: number; change7d: number }[]
}> {
  return cachedFetch('defi:stablecoins', CACHE_TTL_15M, async () => {
    const res = await axios.get('https://stablecoins.llama.fi/stablecoins')
    const stablecoins = (res.data?.peggedAssets || []) as any[]

    const breakdown = stablecoins
      .filter((s: any) => s.circulating?.peggedUSD > 0)
      .sort((a: any, b: any) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0))
      .slice(0, 15)
      .map((s: any) => ({
        name: s.name,
        supply: s.circulating?.peggedUSD || 0,
        change7d: s.circulatingPrevWeek?.peggedUSD
          ? ((s.circulating.peggedUSD - s.circulatingPrevWeek.peggedUSD) /
              s.circulatingPrevWeek.peggedUSD) *
            100
          : 0,
      }))

    const totalSupply = breakdown.reduce((sum, s) => sum + s.supply, 0)

    console.log(`[DeFi] Stablecoins: $${(totalSupply / 1e9).toFixed(1)}B across ${breakdown.length} assets`)
    return { totalSupply, breakdown }
  })
}
