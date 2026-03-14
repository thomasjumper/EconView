import { EconScene } from './components/globe/EconScene'
import { TopBar } from './components/ui/TopBar'
import { BottomBar } from './components/ui/BottomBar'
import { MarketTicker } from './components/panels/MarketTicker'
import { DetailPanel } from './components/panels/DetailPanel'

export default function App() {
  return (
    <div className="w-full h-full relative">
      {/* 3D Scene (fills viewport) */}
      <div className="absolute inset-0">
        <EconScene />
      </div>

      {/* UI Overlays */}
      <TopBar />
      <MarketTicker />
      <DetailPanel />
      <BottomBar />
    </div>
  )
}
