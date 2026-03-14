import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import type { EconEdge } from '@econview/shared'
import { useVisualMode } from '../../hooks/useVisualMode'
import { useAppStore } from '../../store/useAppStore'

interface TradeEdgesProps {
  nodes: LayoutNode[]
  edges: EconEdge[]
  visible: boolean
  globeMode?: boolean
}

export function TradeEdges({ nodes, edges, visible, globeMode = false }: TradeEdgesProps) {
  const modeOverrides = useVisualMode()
  const arcOpacityMultiplier = useAppStore((s) => s.debug.arcOpacityMultiplier)

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

        if (globeMode) {
          // Great-circle style arc: push midpoint outward from sphere center
          // so the arc curves above the globe surface (radius 4)
          const midLen = mid.length()
          if (midLen > 0.001) {
            const arcHeight = 6.5 + start.distanceTo(end) * 0.15
            mid.normalize().multiplyScalar(arcHeight)
          }
        } else {
          const lift = start.distanceTo(end) * 0.15
          mid.y += lift
        }

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        const points = curve.getPoints(20)
        const baseOpacity = 0.08 + edge.weight * 0.2
        const opacity = Math.min(1.0, baseOpacity * modeOverrides.edgeOpacityMultiplier * arcOpacityMultiplier)

        return {
          points: points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
          opacity,
          id: edge.id,
        }
      })
      .filter(Boolean) as { points: [number, number, number][]; opacity: number; id: string }[]
  }, [edges, nodeMap, nodes, visible, globeMode, modeOverrides.edgeOpacityMultiplier, arcOpacityMultiplier])

  if (!visible) return null

  return (
    <group>
      {lines.map(({ points, opacity, id }) => (
        <Line
          key={id}
          points={points}
          color={modeOverrides.edgeColor}
          lineWidth={1}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  )
}
