/**
 * Web Worker for running d3-force-3d simulation off the main thread.
 * Used when node counts >= 100 to prevent UI jank.
 */
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceLink,
} from 'd3-force-3d'

export interface ForceWorkerInput {
  nodes: Array<{
    id: string
    size?: number
    x?: number
    y?: number
    z?: number
    [key: string]: unknown
  }>
  edges: Array<{
    source: string
    target: string
    weight: number
  }>
  config: {
    chargeStrength: number
    linkDistance: number
  }
}

export interface ForceWorkerOutput {
  type: 'result'
  positions: Array<{
    id: string
    x: number
    y: number
    z: number
  }>
}

self.onmessage = (e: MessageEvent<ForceWorkerInput>) => {
  const { nodes, edges, config } = e.data

  const simNodes = nodes.map((n) => ({ ...n }))
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

  const simLinks = edges
    .filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      value: edge.weight,
    }))

  const sim = forceSimulation(simNodes, 3)
    .force('charge', forceManyBody().strength(config.chargeStrength))
    .force('center', forceCenter())
    .force(
      'link',
      forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(config.linkDistance)
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
    .stop()

  // Run simulation synchronously in the worker
  for (let i = 0; i < 200; i++) {
    sim.tick()
  }

  // Send back computed positions
  const result: ForceWorkerOutput = {
    type: 'result',
    positions: simNodes.map((n: any) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      z: n.z,
    })),
  }

  self.postMessage(result)
}
