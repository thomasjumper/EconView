import { useState } from 'react'
import { useAlerts, type TriggeredAlert } from '../../hooks/useAlerts'

function AlertBadge({ alert, onClick }: { alert: TriggeredAlert; onClick: () => void }) {
  const colorClass =
    alert.severity === 'critical'
      ? 'bg-red-500/20 border-red-500/40 text-red-400'
      : alert.severity === 'warning'
        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
        : 'bg-blue-500/20 border-blue-500/40 text-blue-400'

  const dotColor =
    alert.severity === 'critical'
      ? 'bg-red-500'
      : alert.severity === 'warning'
        ? 'bg-yellow-500'
        : 'bg-blue-500'

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5
        px-2 py-1 rounded border
        text-[10px] font-mono
        transition-all hover:scale-105
        ${colorClass}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      {alert.ruleName}
    </button>
  )
}

export function AlertIndicators() {
  const { alerts } = useAlerts()
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)

  if (alerts.length === 0) return null

  return (
    <div className="absolute top-2 right-4 z-20 pointer-events-auto">
      {/* Alert badges */}
      <div className="flex flex-col gap-1 items-end">
        {alerts.map((alert) => (
          <div key={alert.id} className="relative">
            <AlertBadge
              alert={alert}
              onClick={() =>
                setExpandedAlert(expandedAlert === alert.id ? null : alert.id)
              }
            />

            {/* Expanded detail */}
            {expandedAlert === alert.id && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 z-30">
                <div className="text-xs text-white font-medium mb-1">
                  {alert.ruleName}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  {alert.message}
                </p>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500">
                    Value: {alert.value.toFixed(2)}
                  </span>
                  <span className="text-slate-600">
                    {new Date(alert.triggeredAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
