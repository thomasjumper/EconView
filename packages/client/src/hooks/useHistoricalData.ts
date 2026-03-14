import { useMemo } from 'react'
import type { EconNode, EconEdge } from '@econview/shared'
import { useTimelineStore } from '../store/useTimelineStore'
import { MOCK_COUNTRIES, MOCK_TRADE_EDGES } from '../lib/mock-data'

/**
 * Seed-based pseudo-random number generator (mulberry32).
 * Given a seed, returns a function that produces deterministic values in [0, 1).
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a GDP value for a country at a historical date by applying a
 * deterministic random walk backward from the current (present-day) value.
 *
 * The walk is seeded by the country ID so results are stable across renders.
 */
function historicalGDP(
  presentGDP: number,
  presentGrowth: number,
  countryId: string,
  currentDate: Date,
): { gdp: number; gdpGrowth: number } {
  const now = new Date()
  const yearsDiff = (now.getTime() - currentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  if (yearsDiff <= 0) {
    return { gdp: presentGDP, gdpGrowth: presentGrowth }
  }

  // Create a deterministic RNG per country
  let seed = 0
  for (let i = 0; i < countryId.length; i++) {
    seed = seed * 31 + countryId.charCodeAt(i)
  }
  const rng = mulberry32(seed)

  // Walk backward year by year
  let gdp = presentGDP
  let growth = presentGrowth
  const steps = Math.ceil(yearsDiff)

  for (let i = 0; i < steps; i++) {
    // Add some noise to growth rate
    const noise = (rng() - 0.5) * 3
    growth = presentGrowth + noise

    // Apply inverse growth (going backward)
    const annualFactor = 1 + growth / 100
    gdp = gdp / annualFactor
  }

  // Interpolate for partial years
  const partial = yearsDiff - Math.floor(yearsDiff)
  if (partial > 0) {
    const noise = (rng() - 0.5) * 2
    growth = presentGrowth + noise
  }

  return {
    gdp: Math.max(gdp * 0.5, gdp), // Don't let it go too low
    gdpGrowth: parseFloat(growth.toFixed(1)),
  }
}

/**
 * Generate synthetic trade values for a historical date.
 */
function historicalTradeValue(
  presentValue: number,
  edgeId: string,
  currentDate: Date,
): number {
  const now = new Date()
  const yearsDiff = (now.getTime() - currentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  if (yearsDiff <= 0) return presentValue

  let seed = 0
  for (let i = 0; i < edgeId.length; i++) {
    seed = seed * 31 + edgeId.charCodeAt(i)
  }
  const rng = mulberry32(seed)

  // Trade volumes generally grew over time, so historical values are lower
  const growthRate = 0.03 + rng() * 0.04 // 3-7% annual trade growth
  const factor = Math.pow(1 + growthRate, -yearsDiff)

  // Add some noise
  const noise = 1 + (rng() - 0.5) * 0.1
  return presentValue * factor * noise
}

/**
 * Hook that returns nodes and edges appropriate for the current timeline position.
 *
 * When in replay mode, it generates synthetic historical data by walking backward
 * from present-day values. When not in replay mode, it returns the current mock data.
 */
export function useTimelineData(): {
  nodes: EconNode[]
  edges: EconEdge[]
} {
  const isReplayMode = useTimelineStore((s) => s.isReplayMode)
  const currentDate = useTimelineStore((s) => s.currentDate)

  return useMemo(() => {
    if (!isReplayMode) {
      return { nodes: MOCK_COUNTRIES, edges: MOCK_TRADE_EDGES }
    }

    // Generate historical nodes
    const nodes: EconNode[] = MOCK_COUNTRIES.map((country) => {
      const { gdp, gdpGrowth } = historicalGDP(
        country.gdp ?? 1e9,
        country.gdpGrowth ?? 0,
        country.id,
        currentDate,
      )
      return {
        ...country,
        gdp,
        gdpGrowth,
      }
    })

    // Generate historical edges
    const edges: EconEdge[] = MOCK_TRADE_EDGES.map((edge) => ({
      ...edge,
      value: historicalTradeValue(edge.value ?? 0, edge.id, currentDate),
    }))

    return { nodes, edges }
  }, [isReplayMode, currentDate])
}
