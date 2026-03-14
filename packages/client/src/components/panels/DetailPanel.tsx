import { useAppStore } from '../../store/useAppStore'
import { MOCK_TRADE_EDGES } from '../../lib/mock-data'

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

export function DetailPanel() {
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
