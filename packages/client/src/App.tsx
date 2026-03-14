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
import { PerformanceDashboard } from './components/panels/PerformanceDashboard'
import { KeyboardHelp } from './components/ui/KeyboardHelp'
import { ComparePanel } from './components/panels/ComparePanel'
import { CalendarPanel } from './components/panels/CalendarPanel'
import { CreditPanel } from './components/panels/CreditPanel'
import { DeFiPanel } from './components/panels/DeFiPanel'
import { ScanLines } from './components/ui/ScanLines'
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
      <PerformanceDashboard />

      {/* Compare Panel */}
      <ComparePanel />

      {/* Tier 1+2 Data Panels */}
      <CalendarPanel />
      <CreditPanel />
      <DeFiPanel />

      {/* Phase 5: Timeline / Historical Replay */}
      <TimelineScrubber />
      <CrisisPresets />

      {/* Overlays */}
      <KeyboardHelp />

      {/* Scan lines overlay (renders on top of everything) */}
      <ScanLines />
    </div>
  )
}
