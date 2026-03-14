import { useEffect, useRef, useState } from 'react'
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceLink,
} from 'd3-force-3d'
import type { EconNode, EconEdge } from '@econview/shared'
import { useAppStore } from '../store/useAppStore'

export interface LayoutNode extends EconNode {
  x: number
  y: number
  z: number
  fx?: number | null
  fy?: number | null
  fz?: number | null
}

export function useForceLayout(
  nodes: EconNode[],
  edges: EconEdge[],
) {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null)
  const debug = useAppStore((s) => s.debug)
  const { forceChargeStrength, forceLinkDistance, nodeScaleMultiplier } = debug

  useEffect(() => {
    if (nodes.length === 0) return

    // Compute node sizes (log scale of GDP)
    const maxGdp = Math.max(...nodes.map((n) => n.gdp ?? 1))
    const simNodes: LayoutNode[] = nodes.map((n) => {
      const gdp = n.gdp ?? 1
      const logSize = Math.log10(gdp) / Math.log10(maxGdp)
      return {
        ...n,
        size: (0.3 + logSize * 1.5) * nodeScaleMultiplier,
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
      }
    })

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

    const simLinks = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        value: e.weight,
      }))

    const sim = forceSimulation(simNodes, 3)
      .force('charge', forceManyBody().strength(forceChargeStrength))
      .force('center', forceCenter())
      .force(
        'link',
        forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(forceLinkDistance)
          .strength((l: any) => l.value * 0.3),
      )
      .force(
        'collide',
        forceCollide()
          .radius((d: any) => (d.size ?? 1) * 1.8)
          .strength(0.7),
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3)

    sim.on('tick', () => {
      setLayoutNodes([...simNodes])
    })

    // Run for a fixed number of ticks then stop
    sim.stop()
    for (let i = 0; i < 200; i++) {
      sim.tick()
    }
    setLayoutNodes([...simNodes])

    simRef.current = sim

    return () => {
      sim.stop()
    }
  }, [nodes, edges, forceChargeStrength, forceLinkDistance, nodeScaleMultiplier])

  return layoutNodes
}
