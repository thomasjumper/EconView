import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ── DeFi Data ───────────────────────────────────────────────────────────

export interface DeFiProtocol {
  name: string
  tvl: number
  change24h: number
  chain?: string
}

export interface StablecoinBreakdown {
  name: string
  supply: number
}

export interface DeFiData {
  totalTVL: number
  tvlChange24h: number
  topProtocols: DeFiProtocol[]
  stablecoinTotal: number
  stablecoinBreakdown: StablecoinBreakdown[]
  lastUpdated: string
}

async function fetchDeFi(): Promise<DeFiData> {
  const res = await fetch(`${API_BASE}/api/defi`)
  if (!res.ok) throw new Error(`DeFi fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'DeFi fetch failed')
  return json.data
}

const DEFAULT_DEFI: DeFiData = {
  totalTVL: 0,
  tvlChange24h: 0,
  topProtocols: [],
  stablecoinTotal: 0,
  stablecoinBreakdown: [],
  lastUpdated: new Date().toISOString(),
}

export function useDeFiData(): { data: DeFiData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<DeFiData>({
    queryKey: ['defi'],
    queryFn: fetchDeFi,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_DEFI,
  })

  return {
    data: data ?? DEFAULT_DEFI,
    isLoading,
    error: error as Error | null,
  }
}

// ── Fear & Greed Index ──────────────────────────────────────────────────

export interface FearGreedData {
  value: number
  label: string
  previousClose: number
  lastUpdated: string
}

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch(`${API_BASE}/api/fear-greed`)
  if (!res.ok) throw new Error(`Fear & Greed fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Fear & Greed fetch failed')
  return json.data
}

const DEFAULT_FEAR_GREED: FearGreedData = {
  value: 50,
  label: 'Neutral',
  previousClose: 50,
  lastUpdated: new Date().toISOString(),
}

export function useFearGreed(): { data: FearGreedData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<FearGreedData>({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_FEAR_GREED,
  })

  return {
    data: data ?? DEFAULT_FEAR_GREED,
    isLoading,
    error: error as Error | null,
  }
}
