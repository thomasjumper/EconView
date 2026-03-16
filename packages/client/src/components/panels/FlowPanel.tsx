import { useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useShippingLanes } from '../../hooks/useShippingData'
import { usePortData } from '../../hooks/usePortData'

function formatValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function FlowPanel() {
  const isOpen = useAppStore((s) => s.showFlowPanel)
  const toggle = useAppStore((s) => s.toggleFlowPanel)
  const { data: lanes, isLoading: lanesLoading } = useShippingLanes()
  const { data: ports, isLoading: portsLoading } = usePortData()

  const isLoading = lanesLoading || portsLoading

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'g' || e.key === 'G') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  const stats = useMemo(() => {
    const laneList = lanes ?? []
    const portList = ports ?? []

    const totalDailyTrade = laneList.reduce((sum, l) => sum + l.estimatedDailyValue, 0)
    const topLanes = [...laneList]
      .sort((a, b) => b.estimatedDailyValue - a.estimatedDailyValue)
      .slice(0, 5)
    const maxDailyValue = topLanes.length > 0 ? topLanes[0].estimatedDailyValue : 1

    // Average congestion across all lanes
    const avgCongestion =
      laneList.length > 0
        ? laneList.reduce((sum, l) => sum + l.congestionIndex, 0) / laneList.length
        : 0

    const healthStatus: { label: string; color: string } =
      avgCongestion > 0.6
        ? { label: 'DISRUPTED', color: 'text-red-400' }
        : avgCongestion > 0.35
          ? { label: 'STRESSED', color: 'text-amber-400' }
          : { label: 'NORMAL', color: 'text-green-400' }

    const congestedPorts = portList
      .filter((p) => p.currentCongestion > 0.7)
      .sort((a, b) => b.currentCongestion - a.currentCongestion)

    return { totalDailyTrade, topLanes, maxDailyValue, healthStatus, congestedPorts }
  }, [lanes, ports])

  if (!isOpen) return null

  return (
    <div className="absolute top-28 left-4 w-80 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Global Flow Summary
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (G)"
          >
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            Loading flow data...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Daily Global Trade */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-1">TOTAL DAILY GLOBAL TRADE</div>
              <span className="text-xl font-mono text-white font-bold">
                {formatValue(stats.totalDailyTrade)}
              </span>
            </div>

            {/* Flow Health */}
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono text-slate-600">FLOW HEALTH</div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                stats.healthStatus.color
              } ${
                stats.healthStatus.label === 'NORMAL'
                  ? 'border-green-500/30 bg-green-500/10'
                  : stats.healthStatus.label === 'STRESSED'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-red-500/30 bg-red-500/10'
              }`}>
                {stats.healthStatus.label}
              </span>
            </div>

            {/* Busiest Lanes */}
            {stats.topLanes.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-2">BUSIEST LANES</div>
                <div className="space-y-1.5">
                  {stats.topLanes.map((lane, i) => (
                    <div key={lane.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[9px] font-mono text-slate-600 w-3 shrink-0">{i + 1}</span>
                        <span className="text-[10px] font-mono text-slate-300 truncate">{lane.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <MiniBar value={lane.estimatedDailyValue} max={stats.maxDailyValue} />
                        <span className="text-[9px] font-mono text-slate-400 w-14 text-right">
                          {formatValue(lane.estimatedDailyValue)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600 w-6 text-right">
                          {lane.activeVessels}v
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Congestion Alerts */}
            {stats.congestedPorts.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-2">CONGESTION ALERTS</div>
                <div className="space-y-1">
                  {stats.congestedPorts.slice(0, 5).map((port) => (
                    <div key={port.id} className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-300">{port.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {(port.currentCongestion * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
