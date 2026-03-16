import { useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing'
import { Starfield } from './Starfield'
import { EarthGlobe } from './EarthGlobe'
import { DrillDownNodes } from './DrillDownNodes'
import { NetworkGraph } from './NetworkGraph'
import { TradeEdges } from './TradeEdges'
import { FlowParticles } from './FlowParticles'
import { ShippingLanes } from './ShippingLanes'
import { PortMarkers } from './PortMarkers'
import { ShaderModes } from './ShaderModes'
import { RiskReticles } from './RiskReticles'
import { CascadeRipple } from './CascadeRipple'
import { useForceLayout, type LayoutNode } from '../../hooks/useForceLayout'
import { useGlobeLayout } from '../../hooks/useGlobeLayout'
import { useVisualMode } from '../../hooks/useVisualMode'
import { useAppStore } from '../../store/useAppStore'
import { useGDPCountries } from '../../hooks/useGDPData'
import { useTimelineData } from '../../hooks/useHistoricalData'
import { useTimelineStore } from '../../store/useTimelineStore'
import { useZoomTransition } from '../../hooks/useZoomTransition'
import { useShippingLanes } from '../../hooks/useShippingData'
import { usePortData } from '../../hooks/usePortData'
import { getNodesForZoom, getEdgesForZoom } from '../../lib/market-data'
import { MOCK_TRADE_EDGES } from '../../lib/mock-data'

function SceneContent() {
  const showTradeArcs = useAppStore((s) => s.showTradeArcs)
  const showShippingLanes = useAppStore((s) => s.showShippingLanes)
  const showPorts = useAppStore((s) => s.showPorts)
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const zoomPath = useAppStore((s) => s.zoomPath)
  const zoomOut = useAppStore((s) => s.zoomOut)
  const visualMode = useAppStore((s) => s.visualMode)
  const debug = useAppStore((s) => s.debug)

  const activeCascade = useAppStore((s) => s.activeCascade)

  const modeOverrides = useVisualMode()

  const isReplayMode = useTimelineStore((s) => s.isReplayMode)
  const countryNodes = useGDPCountries()
  const timelineData = useTimelineData()

  // Shipping & port data
  const { data: shippingLanes } = useShippingLanes()
  const { data: portStatuses } = usePortData()

  // Get nodes appropriate for current zoom level
  // In replay mode, use timeline-driven data; otherwise use present-day data
  const currentNodes = isReplayMode
    ? timelineData.nodes
    : getNodesForZoom(zoomLevel, zoomPath, countryNodes)
  const currentEdges = isReplayMode
    ? timelineData.edges
    : getEdgesForZoom(zoomLevel, MOCK_TRADE_EDGES)

  // At global zoom level, position nodes on the globe surface using geographic coordinates.
  // At other zoom levels, use force-directed layout for floating node positioning.
  const forceLayoutNodes = useForceLayout(currentNodes, currentEdges)
  const globeLayoutNodes = useGlobeLayout(currentNodes)
  const layoutNodes = zoomLevel === 'global' ? globeLayoutNodes : forceLayoutNodes

  // Track the last clicked node position for camera animation
  const [clickedPos, setClickedPos] = useState<{ x: number; y: number; z: number } | null>(null)

  const handleNodeClick = useCallback((node: LayoutNode) => {
    setClickedPos({ x: node.x, y: node.y, z: node.z })
  }, [])

  // Camera transitions
  useZoomTransition(clickedPos)

  // ESC key to zoom out
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        zoomOut()
        setClickedPos(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomOut])

  // Determine edge visibility
  const edgesVisible =
    modeOverrides.forceShowEdges
      ? zoomLevel === 'global'
      : showTradeArcs && zoomLevel === 'global'

  // Determine flow particle visibility
  const flowParticlesVisible =
    zoomLevel === 'global' && (visualMode === 'flow' || (showTradeArcs && visualMode === 'default'))

  // Bloom values: combine debug settings with mode overrides
  const bloomIntensity = debug.bloomIntensity !== 0.8
    ? debug.bloomIntensity
    : modeOverrides.bloomIntensity
  const bloomThreshold = debug.bloomThreshold !== 0.2
    ? debug.bloomThreshold
    : modeOverrides.bloomThreshold

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
        minDistance={5}
        maxDistance={120}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
      />

      {/* Background */}
      <Starfield count={2500} />

      {/* Earth globe (visible at global zoom only) */}
      <EarthGlobe visible={zoomLevel === 'global'} />

      {/* Data nodes — DrillDownNodes handles all zoom levels */}
      <DrillDownNodes nodes={layoutNodes} onNodeClick={handleNodeClick} />

      {/* Corporate relationship network (entity zoom only) */}
      {zoomLevel === 'entity' && <NetworkGraph nodes={layoutNodes} />}

      {/* Trade edges */}
      <TradeEdges
        nodes={layoutNodes}
        edges={currentEdges}
        visible={edgesVisible}
        globeMode={zoomLevel === 'global'}
      />

      {/* Flow particles along trade edges */}
      <FlowParticles
        nodes={layoutNodes}
        edges={currentEdges}
        visible={flowParticlesVisible}
      />

      {/* Shipping lanes */}
      <ShippingLanes
        lanes={shippingLanes ?? []}
        visible={showShippingLanes && zoomLevel === 'global'}
      />

      {/* Port markers */}
      <PortMarkers
        ports={portStatuses ?? []}
        visible={showPorts && zoomLevel === 'global'}
      />

      {/* Cascade ripple visualization */}
      <CascadeRipple
        epicenter={activeCascade.epicenter}
        cascadeSteps={activeCascade.steps}
        active={activeCascade.active}
      />

      {/* Risk reticles on high-risk nodes */}
      <RiskReticles nodes={layoutNodes} />

      {/* Visual mode overlays (vignette effects etc.) */}
      <ShaderModes />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.9}
          intensity={bloomIntensity}
        />
        <FXAA />
      </EffectComposer>
    </>
  )
}

export function EconScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 60, near: 0.1, far: 500 }}
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
