import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useCreditSpreads, useYieldSpreads, useFinancialConditions } from '../../hooks/useCreditData'

function SpreadBar({ value, maxValue = 600 }: { value: number; maxValue?: number }) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / maxValue) * 100))
  return (
    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 bg-amber-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function NFCIGauge({ value }: { value: number }) {
  // NFCI: 0 = average, positive = tighter, negative = looser
  // Gauge range roughly -1.5 to +1.5
  const normalized = Math.min(1, Math.max(-1, value / 1.5))
  const angle = normalized * 90 // -90 to +90 degrees
  const gaugeColor =
    value > 0.5 ? 'text-red-400' :
    value > 0 ? 'text-amber-400' :
    value > -0.5 ? 'text-green-400' :
    'text-green-300'

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-6 overflow-hidden">
        {/* Semi-circle background */}
        <div className="absolute bottom-0 left-0 w-12 h-6 border-2 border-slate-700 rounded-t-full" />
        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-0.5 h-5 bg-white origin-bottom transition-transform duration-700"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
      </div>
      <div>
        <div className={`text-xs font-mono font-semibold ${gaugeColor}`}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}
        </div>
        <div className="text-[8px] font-mono text-slate-600">
          {value > 0 ? 'TIGHTER' : value < 0 ? 'LOOSER' : 'AVERAGE'}
        </div>
      </div>
    </div>
  )
}

export function CreditPanel() {
  const isOpen = useAppStore((s) => s.showCreditPanel)
  const toggle = useAppStore((s) => s.toggleCreditPanel)
  const { data: creditData, isLoading: creditLoading } = useCreditSpreads()
  const { data: yieldData, isLoading: yieldLoading } = useYieldSpreads()
  const { data: fciData, isLoading: fciLoading } = useFinancialConditions()

  const isLoading = creditLoading || yieldLoading || fciLoading

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'f' || e.key === 'F') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  return (
    <div className="absolute top-28 left-4 w-72 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Credit &amp; Financial Conditions
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (F)"
          >
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            Loading credit data...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Credit Spreads */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-2">CREDIT SPREADS</div>
              <div className="space-y-2">
                {creditData.spreads.map((spread) => {
                  const changeColor = spread.change > 0 ? 'text-red-400' : spread.change < 0 ? 'text-green-400' : 'text-slate-400'
                  return (
                    <div key={spread.name} className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 w-16">{spread.name}</span>
                      <SpreadBar value={spread.value} />
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-300">{spread.value.toFixed(0)}</span>
                        <span className="text-[9px] font-mono text-slate-600 ml-0.5">{spread.unit}</span>
                      </div>
                      <span className={`text-[9px] font-mono w-10 text-right ${changeColor}`}>
                        {spread.change > 0 ? '+' : ''}{spread.change.toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Yield Spreads */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-2">YIELD SPREADS</div>
              <div className="space-y-2">
                {yieldData.spreads.map((spread) => {
                  const isInverted = spread.value < 0
                  const valueColor = isInverted ? 'text-red-400' : 'text-green-400'

                  return (
                    <div key={spread.name} className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{spread.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-semibold ${valueColor}`}>
                          {spread.value >= 0 ? '+' : ''}{spread.value.toFixed(2)}%
                        </span>
                        {isInverted && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            INVERTED
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Financial Conditions */}
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-2">FINANCIAL CONDITIONS (NFCI)</div>
              <NFCIGauge value={fciData.nfci} />
            </div>

            {/* Footer */}
            <div className="text-[9px] font-mono text-slate-700 text-right">
              Updated {new Date(fciData.lastUpdated).toLocaleTimeString('en-US', {
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
