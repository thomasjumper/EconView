import { useEffect, useState } from 'react'
import type { Scenario, ScenarioResult, CascadeStep, EventType } from '@econview/shared'
import { useAppStore } from '../../store/useAppStore'
import { useScenarioPresets, useSimulateScenario, useCustomScenario } from '../../hooks/useScenario'

const EVENT_ICONS: Partial<Record<EventType, string>> = {
  shipping_disruption: '\u26F5',
  trade_policy: '\uD83D\uDCDC',
  commodity_shock: '\u26A1',
  currency_crisis: '\uD83D\uDCB1',
  central_bank_action: '\uD83C\uDFE6',
  geopolitical: '\uD83C\uDF0D',
  supply_chain_break: '\uD83D\uDD17',
  financial_contagion: '\uD83D\uDCC9',
  natural_disaster: '\uD83C\uDF0A',
  market_crash: '\uD83D\uDCC8',
}

function CascadeTimeline({ steps }: { steps: CascadeStep[] }) {
  return (
    <div className="space-y-1.5 mt-2">
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
            <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[8px] font-mono text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              {step.order}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-slate-200 truncate">
                  {step.entity}
                </span>
                <span className={`text-xs font-bold ${textColor}`}>{arrow}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(100, step.magnitude * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-600">
                  {step.mechanism}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatUSD(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

export function ScenarioPanel() {
  const isOpen = useAppStore((s) => s.showScenarioPanel)
  const toggle = useAppStore((s) => s.toggleScenarioPanel)
  const setActiveCascade = useAppStore((s) => s.setActiveCascade)
  const setSimulationMode = useAppStore((s) => s.setSimulationMode)

  const { data: presets = [], isLoading: presetsLoading } = useScenarioPresets()
  const simulateMutation = useSimulateScenario()
  const customMutation = useCustomScenario()

  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState<ScenarioResult | null>(null)

  // Keyboard shortcut: S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 's' || e.key === 'S') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  // Clear simulation mode when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSimulationMode(false)
    }
  }, [isOpen, setSimulationMode])

  if (!isOpen) return null

  const isLoading = simulateMutation.isPending || customMutation.isPending

  const handlePresetClick = async (scenario: Scenario) => {
    setResult(null)
    const data = await simulateMutation.mutateAsync(scenario.id)
    if (data) {
      setResult(data)
      setSimulationMode(true)
    }
  }

  const handleCustomSubmit = async () => {
    if (!customInput.trim()) return
    setResult(null)
    const data = await customMutation.mutateAsync(customInput.trim())
    if (data) {
      setResult(data)
      setSimulationMode(true)
    }
  }

  const handleVisualize = () => {
    if (!result) return
    // Use the first affected country's location as epicenter if available
    const epicenter = result.scenario.params?.location as { lat: number; lon: number } | undefined
    setActiveCascade({
      epicenter: epicenter ?? null,
      steps: result.cascadeChain,
      active: true,
    })
  }

  const handleClear = () => {
    setResult(null)
    setSimulationMode(false)
    setActiveCascade({ epicenter: null, steps: [], active: false })
  }

  return (
    <div className="absolute top-28 right-4 w-80 z-20 pointer-events-auto max-h-[calc(100vh-160px)] flex flex-col">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Scenario Builder
            </h3>
            {result && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SIMULATION
              </span>
            )}
          </div>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (S)"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Results section (shown when simulation completes) */}
          {result && (
            <div className="space-y-3">
              {/* Narration */}
              <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
                {result.narration}
              </p>

              {/* Cascade chain */}
              <div>
                <div className="text-[9px] font-mono text-slate-600 mb-1">CASCADE CHAIN</div>
                <CascadeTimeline steps={result.cascadeChain} />
              </div>

              {/* Affected countries */}
              {result.affectedCountries.length > 0 && (
                <div>
                  <div className="text-[9px] font-mono text-slate-600 mb-1">AFFECTED COUNTRIES</div>
                  <div className="flex flex-wrap gap-1">
                    {result.affectedCountries.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Global impact */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-600">EST. GLOBAL IMPACT</span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    result.estimatedGlobalImpact < 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {result.estimatedGlobalImpact < 0 ? '' : '+'}
                  {formatUSD(result.estimatedGlobalImpact)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleVisualize}
                  className="flex-1 text-[10px] font-mono px-3 py-1.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors"
                >
                  Visualize on Globe
                </button>
                <button
                  onClick={handleClear}
                  className="text-[10px] font-mono px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-6 gap-2">
              <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-[10px] font-mono text-slate-500">
                Simulating cascade...
              </span>
            </div>
          )}

          {/* Preset scenarios (hidden when result is showing) */}
          {!result && !isLoading && (
            <>
              <div>
                <div className="text-[9px] font-mono text-slate-600 mb-2">PRESET SCENARIOS</div>
                {presetsLoading ? (
                  <div className="text-[10px] font-mono text-slate-600 text-center py-3">
                    Loading presets...
                  </div>
                ) : presets.length === 0 ? (
                  <div className="text-[10px] font-mono text-slate-600 text-center py-3">
                    No presets available
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset: Scenario) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        className="text-left p-2 rounded bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm mb-0.5">
                          {EVENT_ICONS[preset.eventType] ?? '\u26A0\uFE0F'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 leading-tight">
                          {preset.label}
                        </div>
                        <div className="text-[8px] font-mono text-slate-600 mt-0.5 leading-tight line-clamp-2">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom scenario */}
              <div>
                <div className="text-[9px] font-mono text-slate-600 mb-2">CUSTOM SCENARIO</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomSubmit()
                    }}
                    placeholder="Describe a scenario..."
                    className="flex-1 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-300 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="text-[10px] font-mono px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Run
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
