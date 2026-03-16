import { useEffect, useState } from 'react'
import type { EconomicEvent, CascadeStep } from '@econview/shared'
import { useAppStore } from '../../store/useAppStore'
import { useEvents, useEventCascade } from '../../hooks/useCascadeEvents'

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
        SEVERITY_COLORS[severity] ?? 'bg-slate-500'
      }`}
    />
  )
}

function CascadeTimeline({ steps }: { steps: CascadeStep[] }) {
  return (
    <div className="space-y-2 mt-2">
      {steps.map((step, i) => {
        const barColor =
          step.impact === 'negative'
            ? 'bg-red-500'
            : step.impact === 'positive'
            ? 'bg-green-500'
            : 'bg-slate-500'
        const textColor =
          step.impact === 'negative'
            ? 'text-red-400'
            : step.impact === 'positive'
            ? 'text-green-400'
            : 'text-slate-400'
        const arrow =
          step.impact === 'negative' ? '\u2193' : step.impact === 'positive' ? '\u2191' : '\u2192'

        return (
          <div key={i} className="flex items-start gap-2">
            {/* Step number */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[9px] font-mono text-slate-400 flex items-center justify-center">
                {step.order}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px h-4 bg-slate-700 mt-1" />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-200 truncate">
                  {step.entity}
                </span>
                <span className={`text-xs font-bold ${textColor}`}>{arrow}</span>
              </div>

              {/* Magnitude bar */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(100, step.magnitude * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-600">
                  {(step.magnitude * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-[9px] font-mono text-slate-500 mt-0.5 leading-tight">
                {step.mechanism}
              </p>
              <span className="text-[8px] font-mono text-slate-600">
                ~{step.estimatedDelay}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CascadePanel() {
  const isOpen = useAppStore((s) => s.showCascadePanel)
  const toggle = useAppStore((s) => s.toggleCascadePanel)
  const toggleScenarioPanel = useAppStore((s) => s.toggleScenarioPanel)
  const setActiveCascade = useAppStore((s) => s.setActiveCascade)

  const { data: events = [], isLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const { data: cascadeSteps = [] } = useEventCascade(selectedEventId)

  const selectedEvent = events.find((e: EconomicEvent) => e.id === selectedEventId) ?? null

  // Keyboard shortcut: X
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'x' || e.key === 'X') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  const handleReplay = () => {
    if (!selectedEvent) return
    setActiveCascade({
      epicenter: selectedEvent.location,
      steps: cascadeSteps.length > 0 ? cascadeSteps : selectedEvent.cascadeChain,
      active: true,
    })
  }

  const handleOpenScenario = () => {
    toggleScenarioPanel()
  }

  return (
    <div className="absolute top-28 right-4 w-80 z-20 pointer-events-auto max-h-[calc(100vh-160px)] flex flex-col">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Cascade Events
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (X)"
          >
            &times;
          </button>
        </div>

        {/* Event Feed */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
          {isLoading ? (
            <div className="text-[10px] font-mono text-slate-600 text-center py-4">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-[10px] font-mono text-slate-600 text-center py-4">
              No events detected
            </div>
          ) : (
            events.map((event: EconomicEvent) => {
              const isSelected = selectedEventId === event.id
              return (
                <div key={event.id}>
                  <button
                    onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                      isSelected
                        ? 'bg-slate-800/80 border border-slate-700'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={event.severity} />
                      <span className="text-[10px] font-mono text-slate-300 flex-1 truncate">
                        {event.title}
                      </span>
                      <span className="text-[8px] font-mono text-slate-600 flex-shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  </button>

                  {/* Expanded cascade detail */}
                  {isSelected && selectedEvent && (
                    <div className="pl-4 pr-2 pb-2 mt-1 border-l-2 border-slate-700 ml-3">
                      <p className="text-[9px] font-mono text-slate-500 mb-2 leading-relaxed">
                        {selectedEvent.description}
                      </p>

                      <CascadeTimeline
                        steps={
                          cascadeSteps.length > 0
                            ? cascadeSteps
                            : selectedEvent.cascadeChain
                        }
                      />

                      {/* Replay button */}
                      <button
                        onClick={handleReplay}
                        className="mt-3 w-full text-[10px] font-mono px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                      >
                        Replay on Globe
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Bottom link to scenarios */}
        <button
          onClick={handleOpenScenario}
          className="flex-shrink-0 mt-3 text-[10px] font-mono text-amber-400/70 hover:text-amber-400 text-center transition-colors"
        >
          Try a What-If scenario &rarr;
        </button>
      </div>
    </div>
  )
}
