import { useMemo, useEffect } from 'react'
import { Html } from '@react-three/drei'
import type { LayoutNode } from '../../hooks/useForceLayout'
import { useAppStore } from '../../store/useAppStore'

// Inject reticle keyframes into document head once (NOT inside Canvas)
let styleInjected = false
function injectReticleStyle() {
  if (styleInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `
    @keyframes reticle-spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
  styleInjected = true
}

interface RiskReticlesProps {
  nodes: LayoutNode[]
}

export function RiskReticles({ nodes }: RiskReticlesProps) {
  const visualMode = useAppStore((s) => s.visualMode)

  useEffect(() => {
    injectReticleStyle()
  }, [])

  // Top 5 highest-risk nodes (lowest/most negative gdpGrowth)
  const riskNodes = useMemo(() => {
    if (visualMode !== 'risk' || nodes.length === 0) return []
    return [...nodes]
      .sort((a, b) => (a.gdpGrowth ?? 0) - (b.gdpGrowth ?? 0))
      .slice(0, 5)
  }, [nodes, visualMode])

  if (visualMode !== 'risk' || riskNodes.length === 0) return null

  return (
    <>
      {riskNodes.map((node) => {
        const riskLevel = Math.abs(node.gdpGrowth ?? 0)
        const size = Math.max(40, Math.min(80, 40 + riskLevel * 8))
        return (
          <Html
            key={`reticle-${node.id}`}
            position={[node.x, node.y, node.z]}
            center
            distanceFactor={30}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  border: '1px solid #FF4545',
                  borderRadius: '50%',
                  borderStyle: 'dashed',
                  animation: 'reticle-spin 4s linear infinite',
                  position: 'relative',
                }}
              >
                {/* Horizontal crosshair */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '1px',
                    top: '50%',
                    left: 0,
                    background: '#FF4545',
                    opacity: 0.6,
                  }}
                />
                {/* Vertical crosshair */}
                <div
                  style={{
                    position: 'absolute',
                    width: '1px',
                    height: '100%',
                    left: '50%',
                    top: 0,
                    background: '#FF4545',
                    opacity: 0.6,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  color: '#FF4545',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                }}
              >
                RISK: HIGH
              </div>
            </div>
          </Html>
        )
      })}
    </>
  )
}
