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
import type { ForceWorkerOutput } from '../workers/force-worker'

export interface LayoutNode extends EconNode {
  x: number
  y: number
  z: number
  fx?: number | null
  fy?: number | null
  fz?: number | null
}

const WORKER_THRESHOLD = 100 // Use worker for >= 100 nodes

export function useForceLayout(
  nodes: EconNode[],
  edges: EconEdge[],
) {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const debug = useAppStore((s) => s.debug)
  const { forceChargeStrength, forceLinkDistance, nodeScaleMultiplier } = debug

  useEffect(() => {
    if (nodes.length === 0) return

    // Compute node sizes (log scale of GDP)
    const maxGdp = Math.max(...nodes.map((n) => n.gdp ?? 1))
    const simNodes: LayoutNode[] = nodes.map((n) => {
      const gdp = n.gdp ?? 1
      const cap = n.marketCap ?? gdp
      const maxVal = Math.max(...nodes.map((nd) => nd.marketCap ?? nd.gdp ?? 1))
      const logSize = Math.log10(cap) / Math.log10(maxVal)
      return {
        ...n,
        size: (0.3 + logSize * 1.5) * nodeScaleMultiplier,
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15,
      }
    })

    // For large graphs, offload to Web Worker
    if (nodes.length >= WORKER_THRESHOLD) {
      try {
        const worker = new Worker(
          new URL('../workers/force-worker.ts', import.meta.url),
          { type: 'module' },
        )
        workerRef.current = worker

        worker.onmessage = (e: MessageEvent<ForceWorkerOutput>) => {
          if (e.data.type === 'result') {
            const posMap = new Map(e.data.positions.map((p) => [p.id, p]))
            const result = simNodes.map((n) => {
              const pos = posMap.get(n.id)
              if (pos) {
                return { ...n, x: pos.x, y: pos.y, z: pos.z }
              }
              return n
            })
            setLayoutNodes(result)
          }
        }

        worker.onerror = () => {
          // Fallback to main-thread simulation if worker fails
          runMainThreadSimulation(simNodes, edges, forceChargeStrength, forceLinkDistance, simRef, setLayoutNodes)
        }

        // Send work to worker
        worker.postMessage({
          nodes: simNodes.map((n) => ({
            id: n.id,
            size: n.size,
            x: n.x,
            y: n.y,
            z: n.z,
          })),
          edges: edges
            .filter((e) => simNodes.some((n) => n.id === e.source) && simNodes.some((n) => n.id === e.target))
            .map((e) => ({
              source: e.source,
              target: e.target,
              weight: e.weight,
            })),
          config: {
            chargeStrength: forceChargeStrength,
            linkDistance: forceLinkDistance,
          },
        })

        return () => {
          worker.terminate()
          workerRef.current = null
        }
      } catch {
        // Worker creation failed (e.g., bundling issue) — fall through to main thread
        runMainThreadSimulation(simNodes, edges, forceChargeStrength, forceLinkDistance, simRef, setLayoutNodes)
        return () => {
          simRef.current?.stop()
        }
      }
    }

    // Main-thread simulation for small graphs (< 100 nodes)
    runMainThreadSimulation(simNodes, edges, forceChargeStrength, forceLinkDistance, simRef, setLayoutNodes)

    return () => {
      simRef.current?.stop()
    }
  }, [nodes, edges, forceChargeStrength, forceLinkDistance, nodeScaleMultiplier])

  return layoutNodes
}

function runMainThreadSimulation(
  simNodes: LayoutNode[],
  edges: EconEdge[],
  forceChargeStrength: number,
  forceLinkDistance: number,
  simRef: React.MutableRefObject<ReturnType<typeof forceSimulation> | null>,
  setLayoutNodes: (nodes: LayoutNode[]) => void,
) {
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
}
