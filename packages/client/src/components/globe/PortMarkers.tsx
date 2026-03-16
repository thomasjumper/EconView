import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { PortStatus } from '@econview/shared'
import { latLonToSphere } from '../../lib/country-coords'

const PORT_RADIUS = 4.4

/** Color by congestion level */
function getCongestionColor(congestion: number): THREE.Color {
  if (congestion <= 0.3) return new THREE.Color('#00FF9F')
  if (congestion <= 0.6) return new THREE.Color('#F59E0B')
  if (congestion <= 0.8) return new THREE.Color('#FF8800')
  return new THREE.Color('#FF4545')
}

/** Size proportional to annualTEU (log scale) */
function getPortSize(annualTEU: number): number {
  // TEU range roughly 500k to 50M+
  const logVal = Math.log10(Math.max(annualTEU, 100_000))
  // log10(100k) = 5, log10(50M) ~ 7.7
  const t = Math.min(1, Math.max(0, (logVal - 5) / 2.7))
  return 0.03 + t * 0.09
}

function getCongestionLabel(congestion: number): string {
  if (congestion <= 0.3) return 'Normal'
  if (congestion <= 0.6) return 'Busy'
  if (congestion <= 0.8) return 'Congested'
  return 'Gridlocked'
}

function getTrendArrow(trend: 'up' | 'stable' | 'down'): string {
  if (trend === 'up') return '\u2191'
  if (trend === 'down') return '\u2193'
  return '\u2192'
}

interface PortMarkerProps {
  port: PortStatus
}

function PortMarker({ port }: PortMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const shouldPulse = port.currentCongestion > 0.6

  const { position, size, color } = useMemo(() => {
    const [x, y, z] = latLonToSphere(port.lat, port.lon, PORT_RADIUS)
    return {
      position: new THREE.Vector3(x, y, z),
      size: getPortSize(port.annualTEU),
      color: getCongestionColor(port.currentCongestion),
    }
  }, [port.lat, port.lon, port.annualTEU, port.currentCongestion])

  // Orient the circle to face outward from globe center
  const quaternion = useMemo(() => {
    const up = position.clone().normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up)
    return q
  }, [position])

  // Pulse animation for congested ports
  useFrame(({ clock }) => {
    if (!meshRef.current || !shouldPulse) return
    const t = Math.sin(clock.elapsedTime * 4) * 0.5 + 0.5
    const scale = 1 + t * 0.4
    meshRef.current.scale.setScalar(scale)
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[position.x, position.y, position.z]}
        quaternion={quaternion}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer ring */}
      <mesh
        position={[position.x, position.y, position.z]}
        quaternion={quaternion}
      >
        <ringGeometry args={[size * 0.85, size * 1.1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {hovered && (
        <Html position={[position.x, position.y, position.z]} center>
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded px-3 py-2 pointer-events-none whitespace-nowrap">
            <div className="text-[10px] font-mono text-white font-semibold">{port.name}</div>
            <div className="text-[9px] font-mono text-slate-400 mt-1 space-y-0.5">
              <div>{port.country}</div>
              <div>TEU: {(port.annualTEU / 1_000_000).toFixed(1)}M</div>
              <div>
                Congestion: {(port.currentCongestion * 100).toFixed(0)}%{' '}
                <span
                  className={
                    port.currentCongestion > 0.8
                      ? 'text-red-400'
                      : port.currentCongestion > 0.6
                        ? 'text-orange-400'
                        : port.currentCongestion > 0.3
                          ? 'text-amber-400'
                          : 'text-green-400'
                  }
                >
                  ({getCongestionLabel(port.currentCongestion)})
                </span>
              </div>
              <div>Wait: {port.avgWaitDays.toFixed(1)} days</div>
              <div>Trend: {getTrendArrow(port.throughputTrend)} {port.throughputTrend}</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface PortMarkersProps {
  ports: PortStatus[]
  visible: boolean
}

export function PortMarkers({ ports, visible }: PortMarkersProps) {
  if (!visible || ports.length === 0) return null

  return (
    <group>
      {ports.map((port) => (
        <PortMarker key={port.id} port={port} />
      ))}
    </group>
  )
}
