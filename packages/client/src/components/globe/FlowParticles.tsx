import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { LayoutNode } from '../../hooks/useForceLayout'
import type { EconEdge } from '@econview/shared'

const PARTICLES_PER_EDGE = 8

interface FlowParticlesProps {
  nodes: LayoutNode[]
  edges: EconEdge[]
  visible: boolean
}

interface EdgeCurve {
  curve: THREE.QuadraticBezierCurve3
  speed: number // 0..1 based on trade weight
}

const vertexShader = `
  attribute float alpha;
  varying float vAlpha;
  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 3.0 * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(0.0, 0.83, 1.0, glow * vAlpha * 0.8);
  }
`

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

  // Initialize progress offsets — stagger particles along each edge
  useMemo(() => {
    if (particleCount === 0) {
      progressRef.current = null
      return
    }
    const prog = new Float32Array(particleCount)
    for (let e = 0; e < edgeCurves.length; e++) {
      for (let p = 0; p < PARTICLES_PER_EDGE; p++) {
        const idx = e * PARTICLES_PER_EDGE + p
        // Stagger evenly along the curve so they form a stream
        prog[idx] = p / PARTICLES_PER_EDGE
      }
    }
    progressRef.current = prog
  }, [particleCount, edgeCurves.length])

  // Create initial positions and alpha buffers
  const { positions, alphas } = useMemo(() => {
    const count = Math.max(particleCount, 1)
    const pos = new Float32Array(count * 3)
    const alp = new Float32Array(count)
    // Assign staggered alpha values per edge group (front = bright, trailing = dim)
    for (let e = 0; e < edgeCurves.length; e++) {
      for (let p = 0; p < PARTICLES_PER_EDGE; p++) {
        const idx = e * PARTICLES_PER_EDGE + p
        // Front particle (highest progress) gets 1.0, trailing ones fade
        alp[idx] = 1.0 - (p / PARTICLES_PER_EDGE) * 0.75
      }
    }
    return { positions: pos, alphas: alp }
  }, [particleCount, edgeCurves.length])

  // Custom shader material
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null)

  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Animate particle positions along curves
  useFrame((_, delta) => {
    if (!pointsRef.current || !progressRef.current || edgeCurves.length === 0) return

    const prog = progressRef.current
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const alphaAttr = pointsRef.current.geometry.getAttribute('alpha') as THREE.BufferAttribute

    for (let e = 0; e < edgeCurves.length; e++) {
      const { curve, speed } = edgeCurves[e]

      for (let p = 0; p < PARTICLES_PER_EDGE; p++) {
        const idx = e * PARTICLES_PER_EDGE + p

        // Advance progress
        prog[idx] = (prog[idx] + delta * speed * 0.5) % 1.0

        // Get position on curve
        const point = curve.getPoint(prog[idx])
        posAttr.setXYZ(idx, point.x, point.y, point.z)

        // Update alpha: particles closer to "front" of stream are brighter
        // The front particle is the one with highest progress in this edge group
        // Since they're staggered, use position in stream
        alphaAttr.setX(idx, 1.0 - (p / PARTICLES_PER_EDGE) * 0.75)
      }
    }

    posAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
  })

  if (!visible || particleCount === 0) return null

  return (
    <points ref={pointsRef} material={shaderMat}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
        <bufferAttribute
          attach="attributes-alpha"
          args={[alphas, 1]}
          count={particleCount}
        />
      </bufferGeometry>
    </points>
  )
}
