import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import { useAppStore } from '../../store/useAppStore'

function growthToColor(growth: number): THREE.Color {
  // -5% → red, 0% → amber, +8% → green
  const t = Math.max(0, Math.min(1, (growth + 2) / 10))
  const color = new THREE.Color()
  if (t < 0.3) {
    color.lerpColors(new THREE.Color('#FF4545'), new THREE.Color('#F59E0B'), t / 0.3)
  } else {
    color.lerpColors(new THREE.Color('#F59E0B'), new THREE.Color('#00FF9F'), (t - 0.3) / 0.7)
  }
  return color
}

function formatGDP(gdp: number): string {
  if (gdp >= 1e12) return `$${(gdp / 1e12).toFixed(1)}T`
  if (gdp >= 1e9) return `$${(gdp / 1e9).toFixed(0)}B`
  return `$${(gdp / 1e6).toFixed(0)}M`
}

interface CountryNodesProps {
  nodes: LayoutNode[]
}

export function CountryNodes({ nodes }: CountryNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId)
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => new Float32Array(nodes.length * 3), [nodes.length])

  // Update instance matrices and colors
  useFrame(() => {
    if (!meshRef.current || nodes.length === 0) return

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const size = node.size ?? 1
      const isHovered = node.id === hoveredNodeId
      const scale = isHovered ? size * 1.3 : size

      dummy.position.set(node.x, node.y, node.z)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = growthToColor(node.gdpGrowth ?? 0)
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.geometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorArray, 3),
    )
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
        setSelectedNode(nodes[idx])
      }
    },
    [nodes, setSelectedNode],
  )

  const hoveredNode = useMemo(
    () => nodes.find((n) => n.id === hoveredNodeId),
    [nodes, hoveredNodeId],
  )

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
        <sphereGeometry args={[1, 16, 16]} />
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
      {hoveredNode && (
        <Html
          position={[hoveredNode.x, hoveredNode.y + (hoveredNode.size ?? 1) + 1, hoveredNode.z]}
          center
          distanceFactor={30}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/80 backdrop-blur-xl border border-econ-blue/30 rounded-lg px-3 py-2 min-w-[160px] pointer-events-none">
            <div className="text-white font-medium text-sm">{hoveredNode.label}</div>
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-slate-400">GDP</span>
              <span className="text-econ-blue font-mono">{formatGDP(hoveredNode.gdp ?? 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Growth</span>
              <span
                className={`font-mono ${
                  (hoveredNode.gdpGrowth ?? 0) >= 0 ? 'text-econ-green' : 'text-econ-red'
                }`}
              >
                {(hoveredNode.gdpGrowth ?? 0) > 0 ? '+' : ''}
                {(hoveredNode.gdpGrowth ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Pop</span>
              <span className="text-slate-300 font-mono">
                {((hoveredNode.population ?? 0) / 1e6).toFixed(0)}M
              </span>
            </div>
          </div>
        </Html>
      )}

      {/* Labels for top 15 economies */}
      {nodes
        .slice()
        .sort((a, b) => (b.gdp ?? 0) - (a.gdp ?? 0))
        .slice(0, 15)
        .map((node) => (
          <Html
            key={`label-${node.id}`}
            position={[node.x, node.y - (node.size ?? 1) - 0.6, node.z]}
            center
            distanceFactor={40}
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {node.countryCode}
            </div>
          </Html>
        ))}
    </>
  )
}
