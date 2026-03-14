import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useStockPrices } from '../../hooks/useMarketData'
import { useRiskData } from '../../hooks/useRiskData'

function ChangeBar({ symbol, change }: { symbol: string; change: number }) {
  const maxWidth = 80 // percent
  const barWidth = Math.min(Math.abs(change) * 20, maxWidth) // scale: 1% change = 20% bar
  const isPositive = change >= 0

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono text-slate-300 w-10">{symbol}</span>
      <div className="flex-1 flex items-center gap-1.5">
        <div className="flex-1 h-3 bg-slate-800/60 rounded-sm overflow-hidden relative">
          <div
            className={`h-full rounded-sm transition-all duration-500 ${
              isPositive ? 'bg-green-500/60' : 'bg-red-500/60'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span
          className={`font-mono text-[10px] w-12 text-right ${
            isPositive ? 'text-econ-green' : 'text-econ-red'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export function PerformanceDashboard() {
  const isOpen = useAppStore((s) => s.showPerformanceDashboard)
  const toggle = useAppStore((s) => s.togglePerformanceDashboard)
  const stocks = useStockPrices()
  const { data: riskData } = useRiskData()

  // Keyboard shortcut: "P" to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  // Separate indices and individual stocks
  const indexSymbols = ['SPY', 'QQQ', 'DIA']
  const indices = stocks.filter((s) => indexSymbols.includes(s.symbol))
  const nonIndex = stocks.filter((s) => !indexSymbols.includes(s.symbol))

  // Sort by change for gainers/losers
  const sorted = [...nonIndex].sort((a, b) => b.change - a.change)
  const gainers = sorted.filter((s) => s.change > 0).slice(0, 5)
  const losers = sorted
    .filter((s) => s.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5)

  // Yield data from risk
  const fedFunds = riskData.market.fedFundsRate
  const yieldSpread = riskData.market.yieldSpread

  return (
    <div className="absolute bottom-4 left-4 w-80 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Performance Dashboard
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (P)"
          >
            &times;
          </button>
        </div>

        {/* Top Gainers & Losers */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Gainers */}
          <div>
            <div className="text-[9px] font-mono text-green-500/70 uppercase tracking-wider mb-1.5">
              Top Gainers
            </div>
            <div className="space-y-1">
              {gainers.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-700">No gainers</div>
              ) : (
                gainers.map((s) => (
                  <div key={s.symbol} className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-slate-300">{s.symbol}</span>
                    <span className="font-mono text-slate-500">
                      {s.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-mono text-econ-green">
                      +{s.change.toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Losers */}
          <div>
            <div className="text-[9px] font-mono text-red-500/70 uppercase tracking-wider mb-1.5">
              Top Losers
            </div>
            <div className="space-y-1">
              {losers.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-700">No losers</div>
              ) : (
                losers.map((s) => (
                  <div key={s.symbol} className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-slate-300">{s.symbol}</span>
                    <span className="font-mono text-slate-500">
                      {s.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-mono text-econ-red">
                      {s.change.toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 my-3" />

        {/* Key Rates Summary */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
            Key Rates
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Fed Funds Rate</span>
              <span className="font-mono text-slate-300">{fedFunds.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">10Y Treasury</span>
              <span className="font-mono text-slate-300">
                {(fedFunds + yieldSpread * 0.5).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">2Y-10Y Spread</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono ${
                    yieldSpread < 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {yieldSpread >= 0 ? '+' : ''}
                  {yieldSpread.toFixed(2)}%
                </span>
                {yieldSpread < 0 && (
                  <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    INVERTED
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 my-3" />

        {/* Index Performance Bars */}
        <div>
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
            Index Performance
          </div>
          <div className="space-y-1.5">
            {indices.map((idx) => (
              <ChangeBar key={idx.symbol} symbol={idx.symbol} change={idx.change} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
