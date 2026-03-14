import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useDeFiData, useFearGreed } from '../../hooks/useDeFiData'

function formatBillions(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  // value: 0-100
  const gaugeColor =
    value <= 20 ? 'text-red-500' :
    value <= 40 ? 'text-orange-400' :
    value <= 60 ? 'text-slate-400' :
    value <= 80 ? 'text-green-400' :
    'text-green-300'

  const bgColor =
    value <= 20 ? 'bg-red-500' :
    value <= 40 ? 'bg-orange-400' :
    value <= 60 ? 'bg-slate-500' :
    value <= 80 ? 'bg-green-400' :
    'bg-green-300'

  // Circular gauge using conic-gradient
  const angle = (value / 100) * 360

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0">
        {/* Background ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${
              value <= 20 ? '#ef4444' :
              value <= 40 ? '#fb923c' :
              value <= 60 ? '#64748b' :
              value <= 80 ? '#4ade80' :
              '#86efac'
            } ${angle}deg, #1e293b ${angle}deg)`,
          }}
        />
        {/* Inner circle */}
        <div className="absolute inset-1.5 rounded-full bg-black/90 flex items-center justify-center">
          <span className={`text-sm font-mono font-bold ${gaugeColor}`}>{value}</span>
        </div>
      </div>
      <div>
        <div className={`text-xs font-mono font-semibold ${gaugeColor}`}>{label}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${bgColor}`} />
          <span className="text-[9px] font-mono text-slate-500">Fear &amp; Greed</span>
        </div>
      </div>
    </div>
  )
}

export function DeFiPanel() {
  const isOpen = useAppStore((s) => s.showDeFiPanel)
  const toggle = useAppStore((s) => s.toggleDeFiPanel)
  const { data: defiData, isLoading: defiLoading } = useDeFiData()
  const { data: fgData, isLoading: fgLoading } = useFearGreed()

  const isLoading = defiLoading || fgLoading

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'd' || e.key === 'D') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  const tvlChangeColor = defiData.tvlChange24h >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="absolute top-28 right-4 w-80 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            DeFi Dashboard
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (D)"
          >
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            Loading DeFi data...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total TVL */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-1">TOTAL VALUE LOCKED</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono text-white font-bold">
                  {formatBillions(defiData.totalTVL)}
                </span>
                <span className={`text-xs font-mono ${tvlChangeColor}`}>
                  {defiData.tvlChange24h >= 0 ? '+' : ''}{defiData.tvlChange24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Fear & Greed Index */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-2">MARKET SENTIMENT</div>
              <FearGreedGauge value={fgData.value} label={fgData.label} />
            </div>

            {/* Top 5 Protocols */}
            {defiData.topProtocols.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-2">TOP PROTOCOLS</div>
                <div className="space-y-1.5">
                  {defiData.topProtocols.slice(0, 5).map((proto, i) => {
                    const changeColor = proto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    return (
                      <div key={proto.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-600 w-3">{i + 1}</span>
                          <span className="text-[10px] font-mono text-slate-300">{proto.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatBillions(proto.tvl)}
                          </span>
                          <span className={`text-[9px] font-mono w-12 text-right ${changeColor}`}>
                            {proto.change24h >= 0 ? '+' : ''}{proto.change24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stablecoin Supply */}
            {defiData.stablecoinTotal > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-2">STABLECOIN SUPPLY</div>
                <div className="text-sm font-mono text-white font-semibold mb-1.5">
                  {formatBillions(defiData.stablecoinTotal)}
                </div>
                {defiData.stablecoinBreakdown.length > 0 && (
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-800">
                    {defiData.stablecoinBreakdown.map((coin, i) => {
                      const pct = defiData.stablecoinTotal > 0
                        ? (coin.supply / defiData.stablecoinTotal) * 100
                        : 0
                      const colors = ['bg-blue-400', 'bg-cyan-400', 'bg-green-400', 'bg-amber-400', 'bg-purple-400']
                      return (
                        <div
                          key={coin.name}
                          className={`h-full ${colors[i % colors.length]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                          title={`${coin.name}: ${formatBillions(coin.supply)}`}
                        />
                      )
                    })}
                  </div>
                )}
                {defiData.stablecoinBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {defiData.stablecoinBreakdown.map((coin, i) => {
                      const colors = ['text-blue-400', 'text-cyan-400', 'text-green-400', 'text-amber-400', 'text-purple-400']
                      return (
                        <span key={coin.name} className={`text-[9px] font-mono ${colors[i % colors.length]}`}>
                          {coin.name} {formatBillions(coin.supply)}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-[9px] font-mono text-slate-700 text-right">
              Updated {new Date(defiData.lastUpdated).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
