import { useQuery } from '@tanstack/react-query'
import type { PortStatus } from '@econview/shared'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function usePortData() {
  return useQuery<PortStatus[]>({
    queryKey: ['ports'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ports`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    staleTime: 60_000,
  })
}
