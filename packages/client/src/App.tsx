import { useState, useCallback } from 'react'
import { EconScene } from './components/globe/EconScene'
import { TopBar } from './components/ui/TopBar'
import { BottomBar } from './components/ui/BottomBar'
import { MarketTicker } from './components/panels/MarketTicker'
import { DetailPanel } from './components/panels/DetailPanel'
import { ModeSwitcher } from './components/ui/ModeSwitcher'
import { DebugPanel } from './components/ui/DebugPanel'
import { TimelineScrubber } from './components/ui/TimelineScrubber'
import { CrisisPresets } from './components/ui/CrisisPresets'
import { SearchBar } from './components/ui/SearchBar'
import { NarrationPanel } from './components/panels/NarrationPanel'
import { AlertIndicators } from './components/ui/AlertIndicators'
import { RiskDashboard } from './components/panels/RiskDashboard'
import { useReplayAnimation } from './hooks/useReplayAnimation'

export default function App() {
  // Drive the replay animation loop
  useReplayAnimation()

  // AI narration state
  const [narration, setNarration] = useState<string | null>(null)
  const handleNarration = useCallback((text: string) => setNarration(text), [])
  const dismissNarration = useCallback(() => setNarration(null), [])

  return (
    <div className="w-full h-full relative">
      {/* 3D Scene (fills viewport) */}
      <div className="absolute inset-0">
        <EconScene />
      </div>

      {/* UI Overlays */}
      <TopBar />
      <AlertIndicators />
      <MarketTicker />
      <DetailPanel />
      <ModeSwitcher />
      <BottomBar />
      <DebugPanel />

      {/* Phase 4: Intelligence Layer */}
      <NarrationPanel text={narration} onDismiss={dismissNarration} />
      <SearchBar onNarration={handleNarration} />
      <RiskDashboard />

      {/* Phase 5: Timeline / Historical Replay */}
      <TimelineScrubber />
      <CrisisPresets />
    </div>
  )
}
