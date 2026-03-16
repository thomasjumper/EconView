import { useQuery } from '@tanstack/react-query'
import type { ShippingLane, VesselPosition } from '@econview/shared'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function useShippingLanes() {
  return useQuery<ShippingLane[]>({
    queryKey: ['shipping-lanes'],
    queryFn: () =>
      fetch(`${API_BASE}/api/vessels/lanes`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    staleTime: 60_000,
  })
}

export function useVesselPositions() {
  return useQuery<VesselPosition[]>({
    queryKey: ['vessel-positions'],
    queryFn: () =>
      fetch(`${API_BASE}/api/vessels`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    staleTime: 30_000,
  })
}
