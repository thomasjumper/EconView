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
import { FlowPanel } from './components/panels/FlowPanel'
import { CascadePanel } from './components/panels/CascadePanel'
import { ScenarioPanel } from './components/panels/ScenarioPanel'
import { ScanLines } from './components/ui/ScanLines'
import { useReplayAnimation } from './hooks/useReplayAnimation'
import { useAppStore } from './store/useAppStore'

export default function App() {
  // Drive the replay animation loop
  useReplayAnimation()

  const simulationMode = useAppStore((s) => s.simulationMode)

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
      <FlowPanel />

      {/* Cascade & Scenario Panels */}
      <CascadePanel />
      <ScenarioPanel />

      {/* Phase 5: Timeline / Historical Replay */}
      <TimelineScrubber />
      <CrisisPresets />

      {/* Overlays */}
      <KeyboardHelp />

      {/* Simulation mode orange border overlay */}
      {simulationMode && (
        <div className="absolute inset-0 pointer-events-none z-40 border-2 border-orange-500/50 rounded-sm">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
            SIMULATION
          </span>
        </div>
      )}

      {/* Scan lines overlay (renders on top of everything) */}
      <ScanLines />
    </div>
  )
}
