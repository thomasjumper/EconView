import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Line, Html } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import {
  getRelationshipsForTickers,
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
  type CompanyRelationship,
} from '../../lib/company-relationships'

interface NetworkGraphProps {
  nodes: LayoutNode[]
}

interface EdgeData {
  points: [number, number, number][]
  color: string
  opacity: number
  id: string
  relationship: CompanyRelationship
  midpoint: [number, number, number]
}

export function NetworkGraph({ nodes }: NetworkGraphProps) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.ticker ?? n.id, n])),
    [nodes],
  )

  const edges = useMemo<EdgeData[]>(() => {
    if (nodes.length === 0) return []

    const tickers = nodes.map((n) => n.ticker ?? n.id)
    const relationships = getRelationshipsForTickers(tickers)

    return relationships
      .map((rel) => {
        const src = nodeMap.get(rel.source)
        const tgt = nodeMap.get(rel.target)
        if (!src || !tgt) return null

        const start = new THREE.Vector3(src.x, src.y, src.z)
        const end = new THREE.Vector3(tgt.x, tgt.y, tgt.z)
        const mid = start.clone().add(end).multiplyScalar(0.5)

        // Lift the curve perpendicular to the line between nodes
        const lift = start.distanceTo(end) * 0.2
        mid.y += lift

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        const points = curve.getPoints(24)

        const color = RELATIONSHIP_COLORS[rel.type]
        const opacity = 0.15 + rel.strength * 0.35

        return {
          points: points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
          color,
          opacity,
          id: `${rel.source}-${rel.target}-${rel.type}`,
          relationship: rel,
          midpoint: [mid.x, mid.y, mid.z] as [number, number, number],
        }
      })
      .filter(Boolean) as EdgeData[]
  }, [nodes, nodeMap])

  if (edges.length === 0) return null

  return (
    <group>
      {edges.map((edge) => {
        const isHovered = hoveredEdge === edge.id
        return (
          <group key={edge.id}>
            {/* Visible edge line */}
            <Line
              points={edge.points}
              color={edge.color}
              lineWidth={isHovered ? 2.5 : 1.2}
              transparent
              opacity={isHovered ? Math.min(1, edge.opacity + 0.3) : edge.opacity}
            />

            {/* Invisible wider line for easier hover detection */}
            <Line
              points={edge.points}
              color={edge.color}
              lineWidth={8}
              transparent
              opacity={0}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredEdge(edge.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHoveredEdge(null)
                document.body.style.cursor = 'default'
              }}
            />

            {/* Tooltip on hover */}
            {isHovered && (
              <Html
                position={edge.midpoint}
                center
                distanceFactor={30}
                style={{ pointerEvents: 'none' }}
              >
                <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 min-w-[140px] pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: edge.color }}
                    />
                    <span className="text-white text-xs font-medium">
                      {RELATIONSHIP_LABELS[edge.relationship.type]}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {edge.relationship.source} ↔ {edge.relationship.target}
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-slate-500">Strength</span>
                    <span className="font-mono text-slate-300">
                      {(edge.relationship.strength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
