import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import type { EconEdge } from '@econview/shared'

interface TradeEdgesProps {
  nodes: LayoutNode[]
  edges: EconEdge[]
  visible: boolean
}

export function TradeEdges({ nodes, edges, visible }: TradeEdgesProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  )

  const lines = useMemo(() => {
    if (!visible || nodes.length === 0) return []

    return edges
      .map((edge) => {
        const src = nodeMap.get(typeof edge.source === 'string' ? edge.source : (edge.source as any).id)
        const tgt = nodeMap.get(typeof edge.target === 'string' ? edge.target : (edge.target as any).id)
        if (!src || !tgt) return null

        const start = new THREE.Vector3(src.x, src.y, src.z)
        const end = new THREE.Vector3(tgt.x, tgt.y, tgt.z)
        const mid = start.clone().add(end).multiplyScalar(0.5)
        const lift = start.distanceTo(end) * 0.15
        mid.y += lift

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        const points = curve.getPoints(20)
        const opacity = 0.08 + edge.weight * 0.2

        return {
          points: points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
          opacity,
          id: edge.id,
        }
      })
      .filter(Boolean) as { points: [number, number, number][]; opacity: number; id: string }[]
  }, [edges, nodeMap, nodes, visible])

  if (!visible) return null

  return (
    <group>
      {lines.map(({ points, opacity, id }) => (
        <Line
          key={id}
          points={points}
          color="#00D4FF"
          lineWidth={1}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  )
}
