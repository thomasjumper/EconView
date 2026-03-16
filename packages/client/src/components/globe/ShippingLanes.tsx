import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { ShippingLane } from '@econview/shared'
import { latLonToSphere } from '../../lib/country-coords'

const LANE_RADIUS = 4.5

/** Map cargo type to display color */
function getLaneColor(cargoType: string): string {
  switch (cargoType) {
    case 'crude_oil':
    case 'refined_products':
      return '#F59E0B'
    case 'lng':
      return '#3B82F6'
    case 'containers':
      return '#06B6D4'
    case 'iron_ore':
    case 'coal':
    case 'grain':
      return '#84CC16'
    case 'vehicles':
      return '#EC4899'
    default:
      return '#94A3B8'
  }
}

/** Map estimated daily value to tube radius */
function getTubeRadius(estimatedDailyValue: number): number {
  // Normalize: assume range 0 - 5B+ daily value
  const t = Math.min(1, estimatedDailyValue / 5_000_000_000)
  return 0.02 + t * 0.06
}

function formatValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}

interface LaneRendererProps {
  lane: ShippingLane
}

function LaneRenderer({ lane }: LaneRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const isCongested = lane.congestionIndex > 0.7

  const { geometry, material, midPoint } = useMemo(() => {
    // Convert waypoints to 3D positions
    const points3d = lane.waypoints.map(([lon, lat]) => {
      const [x, y, z] = latLonToSphere(lat, lon, LANE_RADIUS)
      return new THREE.Vector3(x, y, z)
    })

    // Need at least 2 points for a curve
    if (points3d.length < 2) {
      return { geometry: null, material: null, midPoint: new THREE.Vector3() }
    }

    const curve = new THREE.CatmullRomCurve3(points3d, false, 'catmullrom', 0.5)
    const tubeRadius = getTubeRadius(lane.estimatedDailyValue)
    const geo = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, false)

    const color = isCongested ? '#FF4545' : getLaneColor(lane.cargoType)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    // Midpoint for tooltip
    const mid = curve.getPoint(0.5)

    return { geometry: geo, material: mat, midPoint: mid }
  }, [lane, isCongested])

  // Pulse congested lanes
  useFrame(({ clock }) => {
    if (!meshRef.current || !isCongested || !material) return
    const t = Math.sin(clock.elapsedTime * 3) * 0.5 + 0.5
    material.opacity = 0.25 + t * 0.35
  })

  if (!geometry || !material) return null

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      {hovered && (
        <Html position={[midPoint.x, midPoint.y, midPoint.z]} center>
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded px-3 py-2 pointer-events-none whitespace-nowrap">
            <div className="text-[10px] font-mono text-white font-semibold">{lane.name}</div>
            <div className="text-[9px] font-mono text-slate-400 mt-1 space-y-0.5">
              <div>Vessels: {lane.activeVessels}</div>
              <div>Daily Value: {formatValue(lane.estimatedDailyValue)}</div>
              <div>Transit: {lane.avgTransitDays} days</div>
              {isCongested && (
                <div className="text-red-400">Congestion: {(lane.congestionIndex * 100).toFixed(0)}%</div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface ShippingLanesProps {
  lanes: ShippingLane[]
  visible: boolean
}

export function ShippingLanes({ lanes, visible }: ShippingLanesProps) {
  if (!visible || lanes.length === 0) return null

  return (
    <group>
      {lanes.map((lane) => (
        <LaneRenderer key={lane.id} lane={lane} />
      ))}
    </group>
  )
}
