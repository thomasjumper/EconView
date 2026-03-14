import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

export interface MarketRisk {
  threatLevel: ThreatLevel
  riskScore: number
  yieldSpread: number
  fedFundsRate: number
  factors: string[]
}

export interface RecessionProbability {
  probability: number
  factors: {
    yieldCurveContribution: number
    gdpDecelerationContribution: number
  }
  signal: 'none' | 'watch' | 'warning' | 'alert'
}

export interface RiskData {
  market: MarketRisk
  recession: RecessionProbability
  alerts: unknown[]
  lastUpdated: string
}

async function fetchRisk(): Promise<RiskData> {
  const res = await fetch(`${API_BASE}/api/risk`)
  if (!res.ok) throw new Error(`Risk fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Risk fetch failed')
  return json.data
}

const DEFAULT_RISK: RiskData = {
  market: {
    threatLevel: 'moderate',
    riskScore: 30,
    yieldSpread: 0,
    fedFundsRate: 0,
    factors: [],
  },
  recession: {
    probability: 0,
    factors: { yieldCurveContribution: 0, gdpDecelerationContribution: 0 },
    signal: 'none',
  },
  alerts: [],
  lastUpdated: new Date().toISOString(),
}

export function useRiskData(): { data: RiskData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<RiskData>({
    queryKey: ['risk'],
    queryFn: fetchRisk,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
    retry: 1,
    placeholderData: DEFAULT_RISK,
  })

  return {
    data: data ?? DEFAULT_RISK,
    isLoading,
    error: error as Error | null,
  }
}
