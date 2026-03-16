import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { CascadeStep } from '@econview/shared'
import { latLonToSphere, COUNTRY_COORDS } from '../../lib/country-coords'
import { useAppStore } from '../../store/useAppStore'

interface CascadeRippleProps {
  epicenter: { lat: number; lon: number } | null
  cascadeSteps: CascadeStep[]
  active: boolean
}

const GLOBE_RADIUS = 5.02 // slightly above globe surface
const MAX_ARCS = 20
const RING_DURATION = 2.0 // seconds
const STEP_DELAY = 1.0 // seconds between cascade steps

/**
 * Build a quadratic bezier arc from point A to point B on the globe surface,
 * lifted above the surface by a midpoint offset.
 */
function buildArcCurve(
  from: [number, number, number],
  to: [number, number, number],
): THREE.QuadraticBezierCurve3 {
  const mid = new THREE.Vector3(
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  )
  // Lift the midpoint outward from the globe center
  mid.normalize().multiplyScalar(GLOBE_RADIUS * 1.35)

  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...from),
    mid,
    new THREE.Vector3(...to),
  )
}

/**
 * Resolve a cascade entity name to lat/lon.
 * Tries matching against COUNTRY_COORDS keys first.
 */
function resolveEntityPosition(entity: string): [number, number, number] | null {
  const code = entity.toUpperCase().slice(0, 3)
  const coords = COUNTRY_COORDS[code]
  if (coords) return latLonToSphere(coords.lat, coords.lon, GLOBE_RADIUS)
  // Fallback: check full match
  for (const [key, val] of Object.entries(COUNTRY_COORDS)) {
    if (key.toLowerCase() === entity.toLowerCase()) {
      return latLonToSphere(val.lat, val.lon, GLOBE_RADIUS)
    }
  }
  return null
}

/** Expanding ring at the epicenter */
function EpicenterRing({
  position,
  startTime,
}: {
  position: [number, number, number]
  startTime: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Orient the ring to face outward from globe center
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(...position).normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    return q
  }, [position])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() - startTime
    if (elapsed < 0) return

    const t = Math.min(1, elapsed / RING_DURATION)
    const scale = t * 2.0 // ring expands from 0 to 2 radius
    const opacity = 1 - t

    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale)
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacity
    }
  })

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <ringGeometry args={[0.4, 0.5, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#00E5FF"
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/** A single glowing arc from epicenter to target */
function ImpactArc({
  from,
  to,
  color,
  startTime,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  startTime: number
}) {
  const lineObj = useMemo(() => {
    const curve = buildArcCurve(from, to)
    const points = curve.getPoints(32)
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [from, to, color])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() - startTime
    const mat = lineObj.material as THREE.LineBasicMaterial
    if (elapsed < 0) {
      mat.opacity = 0
      return
    }
    const t = Math.min(1, Math.max(0, elapsed / 1.0))
    mat.opacity = t * 0.8
    // Draw range: only show the portion of the arc that has been "traced"
    const drawRange = Math.floor(t * 33)
    lineObj.geometry.setDrawRange(0, drawRange)
  })

  return <primitive object={lineObj} />
}

export function CascadeRipple({ epicenter, cascadeSteps, active }: CascadeRippleProps) {
  const setCascadeHighlights = useAppStore((s) => s.setCascadeHighlights)
  const startTimeRef = useRef(0)
  const hasStarted = useRef(false)

  // Record start time when cascade becomes active
  useFrame(({ clock }) => {
    if (active && !hasStarted.current) {
      startTimeRef.current = clock.getElapsedTime()
      hasStarted.current = true
    }
    if (!active) {
      hasStarted.current = false
    }
  })

  // Emit cascade highlights for DrillDownNodes
  useEffect(() => {
    if (active && cascadeSteps.length > 0) {
      const entities = cascadeSteps.map((s) => s.entity)
      setCascadeHighlights(entities)
    } else {
      setCascadeHighlights([])
    }
    return () => setCascadeHighlights([])
  }, [active, cascadeSteps, setCascadeHighlights])

  // Compute epicenter position
  const epicenterPos = useMemo<[number, number, number] | null>(() => {
    if (!epicenter) return null
    return latLonToSphere(epicenter.lat, epicenter.lon, GLOBE_RADIUS)
  }, [epicenter])

  // Build arcs from epicenter to each affected entity, capped at MAX_ARCS
  const arcs = useMemo(() => {
    if (!epicenterPos || cascadeSteps.length === 0) return []

    const result: {
      from: [number, number, number]
      to: [number, number, number]
      color: string
      stepOrder: number
    }[] = []

    for (const step of cascadeSteps.slice(0, MAX_ARCS)) {
      const targetPos = resolveEntityPosition(step.entity)
      if (!targetPos) continue

      result.push({
        from: epicenterPos,
        to: targetPos,
        color: step.impact === 'negative' ? '#FF3B30' : step.impact === 'positive' ? '#30D158' : '#8E8E93',
        stepOrder: step.order,
      })
    }

    return result
  }, [epicenterPos, cascadeSteps])

  if (!active || !epicenterPos) return null

  return (
    <group>
      {/* Epicenter expanding ring */}
      <EpicenterRing position={epicenterPos} startTime={startTimeRef.current} />

      {/* Impact arcs — sequenced by step order */}
      {arcs.map((arc, i) => (
        <ImpactArc
          key={i}
          from={arc.from}
          to={arc.to}
          color={arc.color}
          startTime={startTimeRef.current + RING_DURATION * 0.5 + (arc.stepOrder - 1) * STEP_DELAY}
        />
      ))}
    </group>
  )
}
