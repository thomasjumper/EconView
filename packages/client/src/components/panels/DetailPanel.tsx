import { useAppStore } from '../../store/useAppStore'
import { MOCK_TRADE_EDGES } from '../../lib/mock-data'
import { SECTORS, COMPANIES, US_MARKETS } from '../../lib/market-data'

function formatGDP(gdp: number): string {
  if (gdp >= 1e12) return `$${(gdp / 1e12).toFixed(2)}T`
  if (gdp >= 1e9) return `$${(gdp / 1e9).toFixed(0)}B`
  return `$${(gdp / 1e6).toFixed(0)}M`
}

function formatValue(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`
  return `$${(v / 1e6).toFixed(0)}M`
}

// ── Country detail (global zoom) ────────────────────────────────────────

function CountryDetail() {
  const selectedNode = useAppStore((s) => s.selectedNode)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)

  if (!selectedNode) return null

  const tradePartners = MOCK_TRADE_EDGES.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id,
  )
    .map((e) => ({
      partner: e.source === selectedNode.id ? e.target : e.source,
      value: e.value ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="absolute top-14 left-4 w-72 bg-black/70 backdrop-blur-xl border border-white/5 rounded-lg p-4 pointer-events-auto">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white text-base font-medium">{selectedNode.label}</h2>
          <span className="text-[10px] font-mono text-slate-500">{selectedNode.countryCode}</span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-slate-500 hover:text-white text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">GDP</span>
          <span className="font-mono text-econ-blue">{formatGDP(selectedNode.gdp ?? 0)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">GDP Growth</span>
          <span
            className={`font-mono ${
              (selectedNode.gdpGrowth ?? 0) >= 0 ? 'text-econ-green' : 'text-econ-red'
            }`}
          >
            {(selectedNode.gdpGrowth ?? 0) > 0 ? '+' : ''}
            {(selectedNode.gdpGrowth ?? 0).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Population</span>
          <span className="font-mono text-slate-300">
            {((selectedNode.population ?? 0) / 1e6).toFixed(1)}M
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">GDP/Capita</span>
          <span className="font-mono text-slate-300">
            ${(
              (selectedNode.gdp ?? 0) / (selectedNode.population ?? 1)
            ).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {tradePartners.length > 0 && (
        <>
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
            Top Trade Partners
          </h3>
          <div className="space-y-1">
            {tradePartners.map((tp) => (
              <div key={tp.partner} className="flex justify-between text-xs">
                <span className="text-slate-300">{tp.partner}</span>
                <span className="font-mono text-slate-400">{formatValue(tp.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Market detail ───────────────────────────────────────────────────────

function MarketDetail() {
  const zoomPath = useAppStore((s) => s.zoomPath)

  const countryId = zoomPath[0]
  if (countryId !== 'USA') return null

  return (
    <div className="absolute top-14 left-4 w-72 bg-black/70 backdrop-blur-xl border border-white/5 rounded-lg p-4 pointer-events-auto">
      <h2 className="text-white text-base font-medium mb-3">US Markets</h2>
      <div className="space-y-2">
        {US_MARKETS.map((m) => (
          <div key={m.id} className="flex justify-between text-xs">
            <span className="text-slate-300">{m.label}</span>
            <span className="font-mono text-econ-blue">{formatValue(m.marketCap)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px] text-slate-600 font-mono">
        Click a market node to view sectors
      </div>
    </div>
  )
}

// ── Sector detail ───────────────────────────────────────────────────────

function SectorDetail() {
  const zoomPath = useAppStore((s) => s.zoomPath)

  const marketId = zoomPath[1]
  const market = US_MARKETS.find((m) => m.id === marketId)

  return (
    <div className="absolute top-14 left-4 w-72 bg-black/70 backdrop-blur-xl border border-white/5 rounded-lg p-4 pointer-events-auto">
      <h2 className="text-white text-base font-medium mb-1">
        {market?.label ?? 'Market'} Sectors
      </h2>
      <p className="text-[10px] font-mono text-slate-500 mb-3">GICS Classification</p>
      <div className="space-y-1">
        {SECTORS.map((s) => (
          <div key={s.id} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-300">{s.label}</span>
            </div>
            <span className="font-mono text-slate-400">{formatValue(s.marketCap)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px] text-slate-600 font-mono">
        Click a sector to view top companies
      </div>
    </div>
  )
}

// ── Entity detail ───────────────────────────────────────────────────────

function EntityDetail() {
  const selectedNode = useAppStore((s) => s.selectedNode)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)
  const zoomPath = useAppStore((s) => s.zoomPath)

  const sectorId = zoomPath[2]
  const sector = SECTORS.find((s) => s.id === sectorId)
  const companies = COMPANIES[sectorId] ?? []

  if (selectedNode) {
    // Show selected company detail
    return (
      <div className="absolute top-14 left-4 w-72 bg-black/70 backdrop-blur-xl border border-white/5 rounded-lg p-4 pointer-events-auto">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-white text-base font-medium">{selectedNode.label}</h2>
            <span className="text-[10px] font-mono text-slate-500">{selectedNode.ticker}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-slate-500 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Market Cap</span>
            <span className="font-mono text-econ-blue">{formatValue(selectedNode.marketCap ?? 0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Sector</span>
            <span className="font-mono text-slate-300" style={{ color: sector?.color }}>
              {sector?.label ?? selectedNode.sectorCode}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Show sector company list
  return (
    <div className="absolute top-14 left-4 w-72 bg-black/70 backdrop-blur-xl border border-white/5 rounded-lg p-4 pointer-events-auto">
      <h2 className="text-white text-base font-medium mb-1" style={{ color: sector?.color }}>
        {sector?.label ?? 'Sector'}
      </h2>
      <p className="text-[10px] font-mono text-slate-500 mb-3">Top Companies by Market Cap</p>
      <div className="space-y-1">
        {companies.map((c) => (
          <div key={c.id} className="flex justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 w-12">{c.ticker}</span>
              <span className="text-slate-300">{c.label}</span>
            </div>
            <span className="font-mono text-slate-400">{formatValue(c.marketCap)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main DetailPanel ────────────────────────────────────────────────────

export function DetailPanel() {
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const selectedNode = useAppStore((s) => s.selectedNode)

  switch (zoomLevel) {
    case 'global':
      if (!selectedNode) return null
      return <CountryDetail />
    case 'market':
      return <MarketDetail />
    case 'sector':
      return <SectorDetail />
    case 'entity':
      return <EntityDetail />
    default:
      return null
  }
}
