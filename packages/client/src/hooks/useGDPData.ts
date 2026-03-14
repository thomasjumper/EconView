import { useQuery } from '@tanstack/react-query'
import type { EconNode } from '@econview/shared'
import { MOCK_COUNTRIES } from '../lib/mock-data'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function fetchGDP(): Promise<EconNode[]> {
  const res = await fetch(`${API_BASE}/api/gdp`)
  if (!res.ok) throw new Error(`GDP fetch failed: ${res.status}`)
  const data = await res.json()
  // Server returns an array of country objects with the same shape as EconNode
  return data as EconNode[]
}

export function useGDPData() {
  return useQuery<EconNode[]>({
    queryKey: ['gdp'],
    queryFn: fetchGDP,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Fall back to mock data if server is unreachable
    placeholderData: MOCK_COUNTRIES,
    // Use initialData so the app renders immediately even before the query runs
    initialData: undefined,
  })
}

/**
 * Returns GDP country nodes — live data if available, mock data otherwise.
 */
export function useGDPCountries(): EconNode[] {
  const { data } = useGDPData()
  return data ?? MOCK_COUNTRIES
}
