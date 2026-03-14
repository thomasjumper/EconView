import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '../../store/useAppStore'

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
  )
}
