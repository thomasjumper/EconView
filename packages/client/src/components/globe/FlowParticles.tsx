import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { LayoutNode } from '../../hooks/useForceLayout'
import type { EconEdge } from '@econview/shared'

const PARTICLES_PER_EDGE = 4
const PARTICLE_SIZE = 0.15

interface FlowParticlesProps {
  nodes: LayoutNode[]
  edges: EconEdge[]
  visible: boolean
}

interface EdgeCurve {
  curve: THREE.QuadraticBezierCurve3
  speed: number // 0..1 based on trade weight
}

export function FlowParticles({ nodes, edges, visible }: FlowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef<Float32Array | null>(null)

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  )

  // Build edge curves
  const edgeCurves = useMemo(() => {
    if (!visible || nodes.length === 0) return []

    const curves: EdgeCurve[] = []

    for (const edge of edges) {
      const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id
      const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id
      const src = nodeMap.get(srcId)
      const tgt = nodeMap.get(tgtId)
      if (!src || !tgt) continue

      const start = new THREE.Vector3(src.x, src.y, src.z)
      const end = new THREE.Vector3(tgt.x, tgt.y, tgt.z)
      const mid = start.clone().add(end).multiplyScalar(0.5)
      mid.y += start.distanceTo(end) * 0.15

      curves.push({
        curve: new THREE.QuadraticBezierCurve3(start, mid, end),
        speed: 0.3 + edge.weight * 0.7, // Higher trade volume = faster
      })
    }

    return curves
  }, [edges, nodeMap, nodes, visible])

  // Total particle count
  const particleCount = edgeCurves.length * PARTICLES_PER_EDGE

  // Initialize progress offsets
  useMemo(() => {
    if (particleCount === 0) {
      progressRef.current = null
      return
    }
    const prog = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      prog[i] = Math.random() // Random start offset 0..1
    }
    progressRef.current = prog
  }, [particleCount])

  // Create initial positions buffer
  const positions = useMemo(() => {
    return new Float32Array(Math.max(particleCount * 3, 3))
  }, [particleCount])

  // Animate particle positions along curves
  useFrame((_, delta) => {
    if (!pointsRef.current || !progressRef.current || edgeCurves.length === 0) return

    const prog = progressRef.current
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute

    for (let e = 0; e < edgeCurves.length; e++) {
      const { curve, speed } = edgeCurves[e]

      for (let p = 0; p < PARTICLES_PER_EDGE; p++) {
        const idx = e * PARTICLES_PER_EDGE + p

        // Advance progress
        prog[idx] = (prog[idx] + delta * speed * 0.5) % 1.0

        // Get position on curve
        const point = curve.getPoint(prog[idx])
        posAttr.setXYZ(idx, point.x, point.y, point.z)
      }
    }

    posAttr.needsUpdate = true
  })

  if (!visible || particleCount === 0) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00D4FF"
        size={PARTICLE_SIZE}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
