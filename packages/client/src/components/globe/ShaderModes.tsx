import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useAppStore } from '../../store/useAppStore'

// ── Sentiment floating text keywords ──────────────────────────────────

const SENTIMENT_KEYWORDS = [
  'BULLISH', 'BEARISH', 'GROWTH', 'RECESSION', 'RALLY', 'SELLOFF',
  'INFLATION', 'RATE CUT', 'EARNINGS', 'RISK ON', 'RISK OFF',
  'VOLATILITY', 'BREAKOUT', 'CORRECTION', 'DIVERGENCE', 'MOMENTUM',
  'CAPITULATION', 'ACCUMULATION', 'DISTRIBUTION', 'ROTATION',
]

interface FloatingWord {
  text: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  opacity: number
}

function randomPosition(radius: number): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * radius * 2,
    (Math.random() - 0.5) * radius * 2,
    (Math.random() - 0.5) * radius * 2,
  )
}

function SentimentText() {
  const visualMode = useAppStore((s) => s.visualMode)

  const words = useMemo<FloatingWord[]>(() => {
    const arr: FloatingWord[] = []
    for (let i = 0; i < 18; i++) {
      arr.push({
        text: SENTIMENT_KEYWORDS[Math.floor(Math.random() * SENTIMENT_KEYWORDS.length)],
        position: randomPosition(25),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          0.005 + Math.random() * 0.01,
          (Math.random() - 0.5) * 0.008,
        ),
        opacity: 0.08 + Math.random() * 0.07,
      })
    }
    return arr
  }, [])

  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return

    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      w.position.add(w.velocity)

      // Reset if too far from center
      if (w.position.length() > 35) {
        w.position.copy(randomPosition(25))
        w.text = SENTIMENT_KEYWORDS[Math.floor(Math.random() * SENTIMENT_KEYWORDS.length)]
      }

      const child = groupRef.current.children[i]
      if (child) {
        child.position.copy(w.position)
      }
    }
  })

  if (visualMode !== 'sentiment') return null

  return (
    <group ref={groupRef}>
      {words.map((w, i) => (
        <Text
          key={i}
          position={[w.position.x, w.position.y, w.position.z]}
          fontSize={0.6}
          color="#00FF9F"
          anchorX="center"
          anchorY="middle"
          font={undefined}
          fillOpacity={w.opacity}
          renderOrder={500}
          material-depthWrite={false}
          material-transparent={true}
          material-blending={THREE.AdditiveBlending}
        >
          {w.text}
        </Text>
      ))}
    </group>
  )
}

// ── Main ShaderModes component ─────────────────────────────────────────

/**
 * ShaderModes applies scene-wide visual effects based on the active visual mode.
 * It renders an optional risk-mode vignette overlay and manages mode-specific scene modifications.
 */

export function ShaderModes() {
  const visualMode = useAppStore((s) => s.visualMode)
  const meshRef = useRef<THREE.Mesh>(null)

  // Pulsing red vignette for risk mode
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    if (!mat.uniforms) return

    if (visualMode === 'risk') {
      const pulse = 0.15 + Math.sin(clock.elapsedTime * 2.0) * 0.08
      mat.uniforms.uIntensity.value = pulse
      mat.uniforms.uColor.value.set(1.0, 0.1, 0.1)
      meshRef.current.visible = true
    } else if (visualMode === 'sentiment') {
      // Subtle green tint
      mat.uniforms.uIntensity.value = 0.05
      mat.uniforms.uColor.value.set(0.0, 1.0, 0.4)
      meshRef.current.visible = true
    } else {
      meshRef.current.visible = false
    }
  })

  return (
    <>
      <mesh ref={meshRef} renderOrder={999} visible={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          transparent
          depthTest={false}
          depthWrite={false}
          uniforms={{
            uIntensity: { value: 0 },
            uColor: { value: new THREE.Vector3(1, 0, 0) },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uIntensity;
            uniform vec3 uColor;
            varying vec2 vUv;

            void main() {
              vec2 center = vUv - 0.5;
              float dist = length(center) * 2.0;
              float vignette = smoothstep(0.3, 1.2, dist);
              gl_FragColor = vec4(uColor, vignette * uIntensity);
            }
          `}
        />
      </mesh>
      <SentimentText />
    </>
  )
}
