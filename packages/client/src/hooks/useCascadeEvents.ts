import { useQuery } from '@tanstack/react-query'
import type { EconomicEvent, CascadeStep } from '@econview/shared'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function useEvents() {
  return useQuery<EconomicEvent[]>({
    queryKey: ['events'],
    queryFn: () =>
      fetch(`${API_BASE}/api/events`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useEventCascade(eventId: string | null) {
  return useQuery<CascadeStep[]>({
    queryKey: ['event-cascade', eventId],
    queryFn: () =>
      fetch(`${API_BASE}/api/events/${eventId}/cascade`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    enabled: !!eventId,
  })
}
