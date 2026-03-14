import type { EconNode } from '@econview/shared'
import type { LayoutNode } from './useForceLayout'
import { COUNTRY_COORDS, latLonToSphere } from '../lib/country-coords'
import { COUNTRY_COLORS } from '../lib/country-colors'
import { useAppStore } from '../store/useAppStore'
import { useMemo } from 'react'

const GLOBE_NODE_RADIUS = 4.35 // slightly above globe surface (radius 4)

/**
 * Positions country nodes on the globe surface at their real-world geographic coordinates.
 * Used at the global zoom level instead of the force-directed layout.
 */
export function useGlobeLayout(nodes: EconNode[]): LayoutNode[] {
  const visualMode = useAppStore((s) => s.visualMode)

  return useMemo(() => {
    if (nodes.length === 0) return []

    // Compute size range: log scale of GDP, but much smaller for globe markers
    const maxGdp = Math.max(...nodes.map((n) => n.gdp ?? 1))

    // In default mode, use flag colors for country nodes
    const useFlags = visualMode === 'default'

    return nodes
      .map((node) => {
        const flagColor = useFlags ? COUNTRY_COLORS[node.id] : undefined
        const coords = COUNTRY_COORDS[node.id]
        if (!coords) {
          // Skip nodes without coordinates — they can't be placed on the globe
          // Fallback: random position on sphere (unlikely with our 50-country map)
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const [x, y, z] = [
            GLOBE_NODE_RADIUS * Math.sin(phi) * Math.cos(theta),
            GLOBE_NODE_RADIUS * Math.sin(phi) * Math.sin(theta),
            GLOBE_NODE_RADIUS * Math.cos(phi),
          ]
          const gdp = node.gdp ?? 1
          const logSize = Math.log10(gdp) / Math.log10(maxGdp)
          const size = 0.05 + logSize * 0.2
          return { ...node, x, y, z, size, ...(flagColor ? { color: flagColor } : {}) } as LayoutNode
        }

        const [x, y, z] = latLonToSphere(coords.lat, coords.lon, GLOBE_NODE_RADIUS)
        const gdp = node.gdp ?? 1
        const logSize = Math.log10(gdp) / Math.log10(maxGdp)
        // Size range: 0.05 (smallest economies) to 0.25 (USA/China)
        const size = 0.05 + logSize * 0.2

        return {
          ...node,
          x,
          y,
          z,
          size,
          ...(flagColor ? { color: flagColor } : {}),
        } as LayoutNode
      })
  }, [nodes, visualMode])
}
