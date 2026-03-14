import { useCallback, useEffect } from 'react'
import { CRISIS_PRESETS, type CrisisPreset } from '../../lib/crisis-presets'
import { HISTORICAL_EVENTS } from '../../lib/historical-events'
import { useTimelineStore } from '../../store/useTimelineStore'
import { useAppStore } from '../../store/useAppStore'

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${fmt(start)} - ${fmt(end)}`
}

function PresetCard({ preset }: { preset: CrisisPreset }) {
  const enterReplay = useTimelineStore((s) => s.enterReplay)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const toggleCrisisPresets = useAppStore((s) => s.toggleCrisisPresets)
  const setVisualMode = useAppStore((s) => s.setVisualMode)

  const handleSelect = useCallback(() => {
    // Set timeline events
    setEvents(HISTORICAL_EVENTS)

    // Enter replay with the preset's range
    enterReplay(preset.startDate, preset.endDate)

    // Set suggested visual mode if provided
    if (preset.suggestedMode) {
      setVisualMode(preset.suggestedMode as any)
    }

    // Close the presets panel
    toggleCrisisPresets()
  }, [preset, enterReplay, setEvents, toggleCrisisPresets, setVisualMode])

  return (
    <button
      onClick={handleSelect}
      className="text-left w-full bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg p-4 hover:border-econ-blue/30 hover:bg-white/[0.06] transition-all group"
    >
      <h3 className="text-white font-medium text-sm group-hover:text-econ-blue transition-colors">
        {preset.name}
      </h3>
      <div className="text-[10px] font-mono text-slate-500 mt-1">
        {formatDateRange(preset.startDate, preset.endDate)}
      </div>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
        {preset.description}
      </p>
      {preset.focusSymbols && (
        <div className="flex gap-1.5 mt-3">
          {preset.focusSymbols.map((sym) => (
            <span
              key={sym}
              className="text-[9px] font-mono text-slate-500 border border-slate-800 rounded px-1.5 py-0.5"
            >
              {sym}
            </span>
          ))}
        </div>
      )}
      {preset.suggestedMode && (
        <div className="mt-2 text-[9px] font-mono text-econ-blue/60 uppercase tracking-wider">
          Mode: {preset.suggestedMode}
        </div>
      )}
    </button>
  )
}

export function CrisisPresets() {
  const showCrisisPresets = useAppStore((s) => s.showCrisisPresets)
  const toggleCrisisPresets = useAppStore((s) => s.toggleCrisisPresets)
  const isReplayMode = useTimelineStore((s) => s.isReplayMode)

  // Keyboard shortcut: T to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      if (e.key === 't' || e.key === 'T') {
        // Don't show preset selector while in replay mode
        if (!isReplayMode) {
          toggleCrisisPresets()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCrisisPresets, isReplayMode])

  if (!showCrisisPresets) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleCrisisPresets}
      />

      {/* Panel */}
      <div className="relative bg-black/90 backdrop-blur-xl border border-white/5 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-lg font-medium">Historical Replay</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a crisis scenario to replay market history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-0.5">
              T
            </span>
            <button
              onClick={toggleCrisisPresets}
              className="text-slate-500 hover:text-white text-lg leading-none transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CRISIS_PRESETS.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>

        <div className="mt-4 text-center text-[10px] font-mono text-slate-600">
          Press <span className="text-slate-500">T</span> to close
        </div>
      </div>
    </div>
  )
}
