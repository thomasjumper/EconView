import { useState, useEffect } from 'react'
import { useRiskData, type ThreatLevel } from '../../hooks/useRiskData'
import { useAlerts } from '../../hooks/useAlerts'

const THREAT_COLORS: Record<ThreatLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  moderate: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  elevated: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
}

function RiskGauge({ value, label }: { value: number; label: string }) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const barColor =
    clampedValue >= 70
      ? 'bg-red-500'
      : clampedValue >= 50
        ? 'bg-orange-500'
        : clampedValue >= 30
          ? 'bg-yellow-500'
          : 'bg-green-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{clampedValue.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

export function RiskDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: riskData, isLoading } = useRiskData()
  const { alerts } = useAlerts()

  // Keyboard shortcut: "R" to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 z-20 pointer-events-auto
          text-[10px] font-mono px-2.5 py-1.5 rounded-lg
          bg-black/60 backdrop-blur-xl border border-white/10
          text-slate-500 hover:text-white hover:border-white/20
          transition-all"
        title="Risk Dashboard (R)"
      >
        RISK
      </button>
    )
  }

  const threatColors = THREAT_COLORS[riskData.market.threatLevel]

  return (
    <div className="absolute bottom-4 right-4 w-72 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Risk Dashboard
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (R)"
          >
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            Loading risk data...
          </div>
        ) : (
          <div className="space-y-3">
            {/* Threat Level Badge */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Market Risk</span>
              <span
                className={`
                  text-[10px] font-mono px-2 py-0.5 rounded border
                  ${threatColors.bg} ${threatColors.text} ${threatColors.border}
                `}
              >
                {riskData.market.threatLevel.toUpperCase()}
              </span>
            </div>

            {/* Risk Score Gauge */}
            <RiskGauge value={riskData.market.riskScore} label="Risk Score" />

            {/* Recession Probability */}
            <RiskGauge value={riskData.recession.probability} label="Recession Probability" />

            {/* Yield Curve Spread */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Yield Spread (2Y-10Y)</span>
              <span
                className={`font-mono ${
                  riskData.market.yieldSpread < 0 ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {riskData.market.yieldSpread >= 0 ? '+' : ''}
                {riskData.market.yieldSpread.toFixed(2)}%
              </span>
            </div>

            {/* Fed Funds Rate */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fed Funds Rate</span>
              <span className="font-mono text-slate-300">
                {riskData.market.fedFundsRate.toFixed(2)}%
              </span>
            </div>

            {/* Risk Factors */}
            {riskData.market.factors.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-1">FACTORS</div>
                <div className="space-y-0.5">
                  {riskData.market.factors.map((factor, i) => (
                    <div key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-700 mt-0.5">-</span>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-1">
                  ACTIVE ALERTS ({alerts.length})
                </div>
                <div className="space-y-1">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`
                        text-[10px] font-mono px-2 py-1 rounded border
                        ${
                          alert.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }
                      `}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last updated */}
            <div className="text-[9px] font-mono text-slate-700 text-right">
              Updated {new Date(riskData.lastUpdated).toLocaleTimeString('en-US', {
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
