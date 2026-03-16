import { useMutation, useQuery } from '@tanstack/react-query'
import type { Scenario, ScenarioResult } from '@econview/shared'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function useScenarioPresets() {
  return useQuery<Scenario[]>({
    queryKey: ['scenario-presets'],
    queryFn: () =>
      fetch(`${API_BASE}/api/scenario/presets`)
        .then((r) => r.json())
        .then((d) => d.data ?? []),
    staleTime: 300_000,
  })
}

export function useSimulateScenario() {
  return useMutation<ScenarioResult, Error, string>({
    mutationFn: (scenarioId: string) =>
      fetch(`${API_BASE}/api/scenario/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      })
        .then((r) => r.json())
        .then((d) => d.data),
  })
}

export function useCustomScenario() {
  return useMutation<ScenarioResult, Error, string>({
    mutationFn: (description: string) =>
      fetch(`${API_BASE}/api/scenario/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
        .then((r) => r.json())
        .then((d) => d.data),
  })
}
