import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  useElectricity,
  useDemographics,
  useFoodSecurity,
  useTourism,
} from '../../hooks/useWorldData'

type Tab = 'energy' | 'demographics' | 'food' | 'tourism'

function formatNum(n: number, decimals = 1): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(decimals)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`
  return n.toFixed(decimals)
}

function EnergyMixBar({ coal, gas, nuclear, hydro, wind, solar }: {
  coal: number; gas: number; nuclear: number; hydro: number; wind: number; solar: number
}) {
  const total = coal + gas + nuclear + hydro + wind + solar || 1
  const segments = [
    { pct: (coal / total) * 100, color: 'bg-stone-500', label: 'Coal' },
    { pct: (gas / total) * 100, color: 'bg-orange-500', label: 'Gas' },
    { pct: (nuclear / total) * 100, color: 'bg-purple-500', label: 'Nuclear' },
    { pct: (hydro / total) * 100, color: 'bg-blue-500', label: 'Hydro' },
    { pct: (wind / total) * 100, color: 'bg-cyan-400', label: 'Wind' },
    { pct: (solar / total) * 100, color: 'bg-amber-400', label: 'Solar' },
  ].filter((s) => s.pct > 0.5)

  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800 w-24">
      {segments.map((s) => (
        <div
          key={s.label}
          className={`${s.color} transition-all duration-500`}
          style={{ width: `${s.pct}%` }}
          title={`${s.label}: ${s.pct.toFixed(1)}%`}
        />
      ))}
    </div>
  )
}

function EnergyTab() {
  const { data, isLoading } = useElectricity()

  if (isLoading || data.countries.length === 0) {
    return <div className="text-[10px] font-mono text-slate-600 text-center py-4">Loading energy data...</div>
  }

  const top10 = [...data.countries].sort((a, b) => b.generation_twh - a.generation_twh).slice(0, 10)

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
        {[
          { color: 'bg-stone-500', label: 'Coal' },
          { color: 'bg-orange-500', label: 'Gas' },
          { color: 'bg-purple-500', label: 'Nuclear' },
          { color: 'bg-blue-500', label: 'Hydro' },
          { color: 'bg-cyan-400', label: 'Wind' },
          { color: 'bg-amber-400', label: 'Solar' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${s.color}`} />
            <span className="text-[8px] font-mono text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>
      {/* Country rows */}
      {top10.map((c) => (
        <div key={c.code} className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-400 w-14 truncate">{c.name}</span>
          <EnergyMixBar
            coal={c.coal_pct}
            gas={c.gas_pct}
            nuclear={c.nuclear_pct}
            hydro={c.hydro_pct}
            wind={c.wind_pct}
            solar={c.solar_pct}
          />
          <div className="text-right w-16">
            <span className="text-[10px] font-mono text-slate-300">{formatNum(c.generation_twh, 0)}</span>
            <span className="text-[8px] font-mono text-slate-600 ml-0.5">TWh</span>
          </div>
          <div className="w-12 text-right">
            <span className={`text-[9px] font-mono ${c.renewables_pct >= 50 ? 'text-green-400' : c.renewables_pct >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
              {c.renewables_pct.toFixed(0)}%
            </span>
            <span className="text-[8px] font-mono text-slate-700 ml-0.5">rnw</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function DemographicsTab() {
  const { data, isLoading } = useDemographics()

  if (isLoading || data.countries.length === 0) {
    return <div className="text-[10px] font-mono text-slate-600 text-center py-4">Loading demographics...</div>
  }

  const top10 = [...data.countries].sort((a, b) => b.population - a.population).slice(0, 10)

  return (
    <div className="space-y-2">
      {top10.map((c) => {
        const growthColor = c.growthRate > 1 ? 'text-green-400' : c.growthRate > 0 ? 'text-amber-400' : 'text-red-400'
        return (
          <div key={c.code} className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-400 w-14 truncate">{c.name}</span>
            <div className="flex-1 text-center">
              <span className="text-[10px] font-mono text-slate-300">{formatNum(c.population, 1)}</span>
            </div>
            <div className="w-12 text-right">
              <span className={`text-[9px] font-mono ${growthColor}`}>
                {c.growthRate > 0 ? '+' : ''}{c.growthRate.toFixed(2)}%
              </span>
            </div>
            <div className="w-10 text-right">
              <span className="text-[9px] font-mono text-cyan-400">
                {c.lifeExpectancy > 0 ? c.lifeExpectancy.toFixed(0) : '—'}
              </span>
              <span className="text-[8px] font-mono text-slate-700 ml-0.5">yr</span>
            </div>
            <div className="w-10 text-right">
              <span className="text-[9px] font-mono text-purple-400">{c.urbanPct > 0 ? `${c.urbanPct.toFixed(0)}%` : '—'}</span>
            </div>
          </div>
        )
      })}
      {/* Column headers */}
      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 mt-1">
        <span className="text-[8px] font-mono text-slate-700 w-14">Country</span>
        <span className="text-[8px] font-mono text-slate-700 flex-1 text-center">Pop</span>
        <span className="text-[8px] font-mono text-slate-700 w-12 text-right">Growth</span>
        <span className="text-[8px] font-mono text-slate-700 w-10 text-right">Life</span>
        <span className="text-[8px] font-mono text-slate-700 w-10 text-right">Urban</span>
      </div>
    </div>
  )
}

function FoodSecurityTab() {
  const { data, isLoading } = useFoodSecurity()

  if (isLoading || data.countries.length === 0) {
    return <div className="text-[10px] font-mono text-slate-600 text-center py-4">Loading food security data...</div>
  }

  // Sort by highest undernourishment (worst food security first)
  const worst10 = [...data.countries]
    .filter((c) => c.undernourishment > 0)
    .sort((a, b) => b.undernourishment - a.undernourishment)
    .slice(0, 10)

  return (
    <div className="space-y-2">
      <div className="text-[8px] font-mono text-slate-600 mb-1">HIGHEST UNDERNOURISHMENT</div>
      {worst10.map((c) => {
        const severity = c.undernourishment > 30 ? 'text-red-400' : c.undernourishment > 15 ? 'text-amber-400' : 'text-yellow-400'
        return (
          <div key={c.code} className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-400 w-20 truncate">{c.name}</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${c.undernourishment > 30 ? 'bg-red-500' : c.undernourishment > 15 ? 'bg-amber-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(100, c.undernourishment * 2)}%` }}
              />
            </div>
            <span className={`text-[10px] font-mono w-10 text-right ${severity}`}>
              {c.undernourishment.toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TourismTab() {
  const { data, isLoading } = useTourism()

  if (isLoading || data.countries.length === 0) {
    return <div className="text-[10px] font-mono text-slate-600 text-center py-4">Loading tourism data...</div>
  }

  const top10 = [...data.countries].sort((a, b) => b.arrivals - a.arrivals).slice(0, 10)

  return (
    <div className="space-y-2">
      {top10.map((c) => (
        <div key={c.code} className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-400 w-14 truncate">{c.name}</span>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-mono text-slate-300">{formatNum(c.arrivals, 1)}</span>
            <span className="text-[8px] font-mono text-slate-600 ml-0.5">arr</span>
          </div>
          <div className="w-14 text-right">
            <span className="text-[10px] font-mono text-green-400">${formatNum(c.receipts, 1)}</span>
          </div>
          <div className="w-14 text-right">
            <span className="text-[10px] font-mono text-amber-400">${formatNum(c.expenditure, 1)}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 mt-1">
        <span className="text-[8px] font-mono text-slate-700 w-14">Country</span>
        <span className="text-[8px] font-mono text-slate-700 flex-1 text-center">Arrivals</span>
        <span className="text-[8px] font-mono text-slate-700 w-14 text-right">Receipts</span>
        <span className="text-[8px] font-mono text-slate-700 w-14 text-right">Spent</span>
      </div>
    </div>
  )
}

export function WorldDataPanel() {
  const isOpen = useAppStore((s) => s.showWorldData)
  const toggle = useAppStore((s) => s.toggleWorldData)
  const [tab, setTab] = useState<Tab>('energy')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'w' || e.key === 'W') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'energy', label: 'ENERGY' },
    { key: 'demographics', label: 'PEOPLE' },
    { key: 'food', label: 'FOOD' },
    { key: 'tourism', label: 'TOURISM' },
  ]

  return (
    <div className="absolute top-28 right-4 w-80 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            World Data
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (W)"
          >
            &times;
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-[9px] font-mono py-1.5 rounded transition-colors ${
                tab === t.key
                  ? 'bg-white/10 text-white'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'energy' && <EnergyTab />}
        {tab === 'demographics' && <DemographicsTab />}
        {tab === 'food' && <FoodSecurityTab />}
        {tab === 'tourism' && <TourismTab />}
      </div>
    </div>
  )
}
