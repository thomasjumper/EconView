import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import { useAppStore } from '../../store/useAppStore'
import { useVisualMode } from '../../hooks/useVisualMode'
import type { ZoomLevel } from '@econview/shared'

// ── Color helpers ───────────────────────────────────────────────────────

function growthToColor(growth: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (growth + 2) / 10))
  const color = new THREE.Color()
  if (t < 0.3) {
    color.lerpColors(new THREE.Color('#FF4545'), new THREE.Color('#F59E0B'), t / 0.3)
  } else {
    color.lerpColors(new THREE.Color('#F59E0B'), new THREE.Color('#00FF9F'), (t - 0.3) / 0.7)
  }
  return color
}

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function getNodeColor(node: LayoutNode, zoomLevel: ZoomLevel, visualMode: string): THREE.Color {
  if (zoomLevel === 'global') {
    // In default mode, use flag color if available
    if (visualMode === 'default' && node.color) {
      return hexToColor(node.color)
    }
    return growthToColor(node.gdpGrowth ?? 0)
  }
  if (node.color) {
    return hexToColor(node.color)
  }
  return new THREE.Color('#00D4FF')
}

// ── Format helpers ──────────────────────────────────────────────────────

function formatValue(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v.toLocaleString()}`
}

// ── Tooltip content by zoom level ───────────────────────────────────────

function TooltipContent({ node, zoomLevel }: { node: LayoutNode; zoomLevel: ZoomLevel }) {
  if (zoomLevel === 'global') {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-econ-blue/30 rounded-lg px-3 py-2 min-w-[160px] pointer-events-none">
        <div className="text-white font-medium text-sm">{node.label}</div>
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-slate-400">GDP</span>
          <span className="text-econ-blue font-mono">{formatValue(node.gdp ?? 0)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Growth</span>
          <span className={`font-mono ${(node.gdpGrowth ?? 0) >= 0 ? 'text-econ-green' : 'text-econ-red'}`}>
            {(node.gdpGrowth ?? 0) > 0 ? '+' : ''}{(node.gdpGrowth ?? 0).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Pop</span>
          <span className="font-mono text-slate-300">{((node.population ?? 0) / 1e6).toFixed(0)}M</span>
        </div>
      </div>
    )
  }

  if (zoomLevel === 'market') {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-econ-blue/30 rounded-lg px-3 py-2 min-w-[160px] pointer-events-none">
        <div className="text-white font-medium text-sm">{node.label}</div>
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-slate-400">Market Cap</span>
          <span className="text-econ-blue font-mono">{formatValue(node.marketCap ?? 0)}</span>
        </div>
        <div className="text-[9px] text-slate-500 mt-1">Click to view sectors</div>
      </div>
    )
  }

  if (zoomLevel === 'sector') {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-econ-blue/30 rounded-lg px-3 py-2 min-w-[160px] pointer-events-none">
        <div className="text-white font-medium text-sm">{node.label}</div>
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-slate-400">Market Cap</span>
          <span className="text-econ-blue font-mono">{formatValue(node.marketCap ?? 0)}</span>
        </div>
        <div className="text-[9px] text-slate-500 mt-1">Click to view companies</div>
      </div>
    )
  }

  // entity
  return (
    <div className="bg-black/80 backdrop-blur-xl border border-econ-blue/30 rounded-lg px-3 py-2 min-w-[160px] pointer-events-none">
      <div className="text-white font-medium text-sm">{node.label}</div>
      <div className="text-[10px] font-mono text-slate-500">{node.ticker}</div>
      <div className="flex justify-between mt-1 text-xs">
        <span className="text-slate-400">Market Cap</span>
        <span className="text-econ-blue font-mono">{formatValue(node.marketCap ?? 0)}</span>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

interface DrillDownNodesProps {
  nodes: LayoutNode[]
  onNodeClick?: (node: LayoutNode) => void
}

export function DrillDownNodes({ nodes, onNodeClick }: DrillDownNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const colorAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null)
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId)
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)
  const drillDown = useAppStore((s) => s.drillDown)
  const nodeScaleMultiplier = useAppStore((s) => s.debug.nodeScaleMultiplier)
  const visualMode = useAppStore((s) => s.visualMode)
  const modeOverrides = useVisualMode()

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => {
    colorAttrRef.current = null // Reset when node count changes
    return new Float32Array(Math.max(nodes.length, 1) * 3)
  }, [nodes.length])

  useFrame(() => {
    if (!meshRef.current || nodes.length === 0) return

    // Update material properties based on visual mode
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = modeOverrides.emissiveIntensity
    mat.roughness = modeOverrides.roughness
    mat.metalness = modeOverrides.metalness
    mat.wireframe = modeOverrides.wireframe

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const size = (node.size ?? 1) * nodeScaleMultiplier
      const isHovered = node.id === hoveredNodeId
      const scale = isHovered ? size * 1.3 : size

      dummy.position.set(node.x, node.y, node.z)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const baseColor = getNodeColor(node, zoomLevel, visualMode)
      const color = modeOverrides.getNodeColor(baseColor, node.gdpGrowth ?? 0)
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (!colorAttrRef.current) {
      colorAttrRef.current = new THREE.InstancedBufferAttribute(colorArray, 3)
      meshRef.current.geometry.setAttribute('color', colorAttrRef.current)
    } else {
      colorAttrRef.current.array = colorArray
      colorAttrRef.current.needsUpdate = true
    }
  })

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const idx = e.instanceId
      if (idx !== undefined && nodes[idx]) {
        setHoveredNodeId(nodes[idx].id)
        document.body.style.cursor = 'pointer'
      }
    },
    [nodes, setHoveredNodeId],
  )

  const handlePointerOut = useCallback(() => {
    setHoveredNodeId(null)
    document.body.style.cursor = 'default'
  }, [setHoveredNodeId])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const idx = e.instanceId
      if (idx !== undefined && nodes[idx]) {
        const node = nodes[idx]

        // At entity level, just select (no deeper drill)
        if (zoomLevel === 'entity') {
          setSelectedNode(node)
          return
        }

        // For global level, only drill into USA
        if (zoomLevel === 'global' && node.id !== 'USA') {
          setSelectedNode(node)
          return
        }

        // Drill down and notify parent for camera animation
        onNodeClick?.(node)
        drillDown(node.id)
      }
    },
    [nodes, zoomLevel, setSelectedNode, drillDown, onNodeClick],
  )

  const hoveredNode = useMemo(
    () => nodes.find((n) => n.id === hoveredNodeId),
    [nodes, hoveredNodeId],
  )

  // Determine how many labels to show
  const labelCount = zoomLevel === 'global' ? 15 : nodes.length

  if (nodes.length === 0) return null

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {zoomLevel === 'market' ? (
          <icosahedronGeometry args={[1, 0]} />
        ) : zoomLevel === 'sector' ? (
          <octahedronGeometry args={[1, 0]} />
        ) : (
          <sphereGeometry args={[1, 16, 16]} />
        )}
        <meshStandardMaterial
          vertexColors
          emissive="#ffffff"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.1}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Tooltip for hovered node */}
      {hoveredNode && (() => {
        // At global zoom, position tooltip outward from globe surface
        if (zoomLevel === 'global') {
          const len = Math.sqrt(hoveredNode.x ** 2 + hoveredNode.y ** 2 + hoveredNode.z ** 2)
          const scale = len > 0.001 ? (len + 0.8) / len : 1
          return (
            <Html
              position={[hoveredNode.x * scale, hoveredNode.y * scale, hoveredNode.z * scale]}
              center
              distanceFactor={12}
              style={{ pointerEvents: 'none' }}
            >
              <TooltipContent node={hoveredNode} zoomLevel={zoomLevel} />
            </Html>
          )
        }
        return (
          <Html
            position={[hoveredNode.x, hoveredNode.y + (hoveredNode.size ?? 1) + 1, hoveredNode.z]}
            center
            distanceFactor={30}
            style={{ pointerEvents: 'none' }}
          >
            <TooltipContent node={hoveredNode} zoomLevel={zoomLevel} />
          </Html>
        )
      })()}

      {/* Labels */}
      {nodes
        .slice()
        .sort((a, b) => (b.marketCap ?? b.gdp ?? 0) - (a.marketCap ?? a.gdp ?? 0))
        .slice(0, labelCount)
        .map((node) => {
          // At global zoom, position labels outward from globe surface
          if (zoomLevel === 'global') {
            const len = Math.sqrt(node.x ** 2 + node.y ** 2 + node.z ** 2)
            const scale = len > 0.001 ? (len + 0.4) / len : 1
            return (
              <Html
                key={`label-${node.id}`}
                position={[node.x * scale, node.y * scale, node.z * scale]}
                center
                distanceFactor={12}
                style={{ pointerEvents: 'none' }}
              >
                <div className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                  {node.countryCode ?? node.label}
                </div>
              </Html>
            )
          }
          return (
            <Html
              key={`label-${node.id}`}
              position={[node.x, node.y - (node.size ?? 1) - 0.6, node.z]}
              center
              distanceFactor={40}
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                {node.ticker ?? node.exchangeCode ?? node.countryCode ?? node.label}
              </div>
            </Html>
          )
        })}
    </>
  )
}
