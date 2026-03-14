import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useGDPCountries } from '../../hooks/useGDPData'
import { getZoomPathLabels } from '../../lib/market-data'
import { isMarketOpen, getMarketStatus } from '../../lib/market-hours'

function MarketStatusIndicator() {
  const [, setTick] = useState(0)

  // Re-render every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const nyseOpen = isMarketOpen('NYSE')
  const status = getMarketStatus('NYSE')

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {nyseOpen && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              nyseOpen ? 'bg-green-500' : 'bg-slate-600'
            }`}
          />
        </span>
        <span
          className={`text-[10px] font-mono tracking-wide ${
            nyseOpen ? 'text-green-400' : 'text-slate-600'
          }`}
        >
          US MARKETS: {nyseOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <span className="text-[9px] font-mono text-slate-600">
        {status.nextEvent} in {status.timeUntil}
      </span>
    </div>
  )
}

export function TopBar() {
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const zoomPath = useAppStore((s) => s.zoomPath)
  const zoomOut = useAppStore((s) => s.zoomOut)
  const showTradeArcs = useAppStore((s) => s.showTradeArcs)
  const toggleTradeArcs = useAppStore((s) => s.toggleTradeArcs)

  const countryNodes = useGDPCountries()
  const pathLabels = getZoomPathLabels(zoomPath, countryNodes)

  return (
    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 pointer-events-none z-10">
      <div className="flex items-center gap-3 pointer-events-auto">
        <h1 className="text-white font-medium text-sm tracking-wide">
          <span className="text-econ-blue">Econ</span>View
        </h1>
        <span className="text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-0.5">
          {zoomLevel.toUpperCase()}
        </span>

        {/* Breadcrumb */}
        {zoomPath.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                // Reset to global
                const store = useAppStore.getState()
                while (store.zoomPath.length > 0) {
                  store.zoomOut()
                }
              }}
              className="text-[10px] font-mono text-slate-500 hover:text-econ-blue transition-colors"
            >
              GLOBAL
            </button>
            {pathLabels.map((label, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-slate-700 text-[10px]">/</span>
                <button
                  onClick={() => {
                    // Zoom out to this level
                    const store = useAppStore.getState()
                    const stepsBack = zoomPath.length - i - 1
                    for (let s = 0; s < stepsBack; s++) {
                      store.zoomOut()
                    }
                  }}
                  className={`text-[10px] font-mono transition-colors ${
                    i === pathLabels.length - 1
                      ? 'text-econ-blue'
                      : 'text-slate-500 hover:text-econ-blue'
                  }`}
                >
                  {label.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Back button */}
        {zoomPath.length > 0 && (
          <button
            onClick={zoomOut}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-colors ml-1"
            title="Zoom out (ESC)"
          >
            ESC
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <MarketStatusIndicator />
        <button
          onClick={toggleTradeArcs}
          className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
            showTradeArcs
              ? 'border-econ-blue/40 text-econ-blue bg-econ-blue/10'
              : 'border-slate-700 text-slate-500 hover:text-slate-400'
          }`}
        >
          TRADE FLOWS
        </button>
        <div className="text-[10px] font-mono text-slate-600">
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </div>
      </div>
    </div>
  )
}
