import { useQuery } from '@tanstack/react-query'
import { MOCK_YIELDS } from '../lib/mock-data'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface YieldData {
  current: Record<string, number>
  oneYearAgo: Record<string, number>
  twoYearsAgo: Record<string, number>
  fedFunds: number
  dollarIndex: number | null
}

async function fetchYields(): Promise<YieldData> {
  const res = await fetch(`${API_BASE}/api/yields`)
  if (!res.ok) throw new Error(`Yield fetch failed: ${res.status}`)
  return res.json()
}

export function useYieldData(): YieldData {
  const { data } = useQuery<YieldData>({
    queryKey: ['yields'],
    queryFn: fetchYields,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    placeholderData: MOCK_YIELDS,
  })

  return data ?? MOCK_YIELDS
}
