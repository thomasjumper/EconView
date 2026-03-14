import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing'
import { Starfield } from './Starfield'
import { CountryNodes } from './CountryNodes'
import { TradeEdges } from './TradeEdges'
import { useForceLayout } from '../../hooks/useForceLayout'
import { useAppStore } from '../../store/useAppStore'
import { MOCK_COUNTRIES, MOCK_TRADE_EDGES } from '../../lib/mock-data'

function SceneContent() {
  const showTradeArcs = useAppStore((s) => s.showTradeArcs)
  const layoutNodes = useForceLayout(MOCK_COUNTRIES, MOCK_TRADE_EDGES)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[30, 30, 30]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-20, -10, 20]} intensity={0.5} color="#00D4FF" />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={120}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
      />

      {/* Background */}
      <Starfield count={2500} />

      {/* Data nodes */}
      <CountryNodes nodes={layoutNodes} />

      {/* Trade edges */}
      <TradeEdges
        nodes={layoutNodes}
        edges={MOCK_TRADE_EDGES}
        visible={showTradeArcs}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
        />
        <FXAA />
      </EffectComposer>
    </>
  )
}

export function EconScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 45], fov: 60, near: 0.1, far: 500 }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: 'srgb',
      }}
      style={{ background: '#050810' }}
    >
      <SceneContent />
    </Canvas>
  )
}
