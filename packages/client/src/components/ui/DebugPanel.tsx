import { useEffect } from 'react'
import { useAppStore, type DebugSettings } from '../../store/useAppStore'

interface SliderConfig {
  key: keyof DebugSettings
  label: string
  min: number
  max: number
  step: number
}

const SLIDERS: SliderConfig[] = [
  { key: 'bloomIntensity', label: 'Bloom Intensity', min: 0, max: 3, step: 0.1 },
  { key: 'bloomThreshold', label: 'Bloom Threshold', min: 0, max: 1, step: 0.05 },
  { key: 'arcOpacityMultiplier', label: 'Arc Opacity', min: 0, max: 5, step: 0.1 },
  { key: 'forceChargeStrength', label: 'Force Charge', min: -500, max: 0, step: 10 },
  { key: 'forceLinkDistance', label: 'Link Distance', min: 1, max: 30, step: 1 },
  { key: 'nodeScaleMultiplier', label: 'Node Scale', min: 0.1, max: 3, step: 0.1 },
]

export function DebugPanel() {
  const debugVisible = useAppStore((s) => s.debugVisible)
  const toggleDebug = useAppStore((s) => s.toggleDebug)
  const debug = useAppStore((s) => s.debug)
  const setDebug = useAppStore((s) => s.setDebug)

  // Toggle with backtick key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        e.preventDefault()
        toggleDebug()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleDebug])

  if (!debugVisible) return null

  return (
    <div className="absolute bottom-4 right-4 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 pointer-events-auto z-30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono text-econ-blue uppercase tracking-wider">
          Debug Controls
        </h3>
        <button
          onClick={toggleDebug}
          className="text-slate-500 hover:text-white text-xs"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3">
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <div className="flex justify-between text-[9px] font-mono mb-1">
              <span className="text-slate-400">{label}</span>
              <span className="text-econ-blue">{debug[key].toFixed(key === 'forceChargeStrength' ? 0 : 2)}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={debug[key]}
              onChange={(e) => setDebug({ [key]: parseFloat(e.target.value) })}
              className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-econ-blue
                [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,212,255,0.5)]
              "
            />
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[8px] font-mono text-slate-600">
          Press ` to toggle this panel
        </p>
      </div>
    </div>
  )
}
