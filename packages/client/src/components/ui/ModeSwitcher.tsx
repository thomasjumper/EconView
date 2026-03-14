import { useState, useEffect, useRef } from 'react'
import { useAppStore, type VisualMode } from '../../store/useAppStore'

interface ModeOption {
  mode: VisualMode
  label: string
  icon: string
}

const MODES: ModeOption[] = [
  { mode: 'default', label: 'DEFAULT', icon: 'D' },
  { mode: 'heat', label: 'HEAT', icon: 'H' },
  { mode: 'flow', label: 'FLOW', icon: 'F' },
  { mode: 'risk', label: 'RISK', icon: 'R' },
  { mode: 'sentiment', label: 'SENT', icon: 'S' },
  { mode: 'xray', label: 'X-RAY', icon: 'X' },
]

export function ModeSwitcher() {
  const visualMode = useAppStore((s) => s.visualMode)
  const setVisualMode = useAppStore((s) => s.setVisualMode)
  const [flashLabel, setFlashLabel] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSetMode = (mode: VisualMode, label: string) => {
    setVisualMode(mode)

    // Show mode name briefly
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setFlashLabel(label)
    flashTimerRef.current = setTimeout(() => {
      setFlashLabel(null)
    }, 1500)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  return (
    <>
      {/* Vertical mode toolbar */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-auto z-10">
        {MODES.map(({ mode, label, icon }) => {
          const isActive = visualMode === mode
          return (
            <button
              key={mode}
              onClick={() => handleSetMode(mode, label)}
              className={`
                w-10 h-10 rounded-lg border font-mono text-[11px] font-bold
                flex items-center justify-center transition-all duration-200
                ${isActive
                  ? 'border-econ-blue bg-econ-blue/15 text-econ-blue shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                  : 'border-white/5 bg-black/50 text-slate-500 hover:text-slate-300 hover:border-white/10 hover:bg-black/70'
                }
              `}
              title={label}
            >
              {icon}
            </button>
          )
        })}
      </div>

      {/* Mode name flash overlay */}
      {flashLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          key={flashLabel}
        >
          <div className="animate-mode-flash text-white/80 text-5xl font-mono font-bold tracking-[0.3em] select-none">
            {flashLabel}
          </div>
        </div>
      )}
    </>
  )
}
