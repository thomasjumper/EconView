import { useAppStore } from '../../store/useAppStore'

function formatNumber(n: number | undefined): string {
  if (n === undefined) return '--'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString()
}

function formatPopulation(n: number | undefined): string {
  if (n === undefined) return '--'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString()
}

function formatPercent(n: number | undefined): string {
  if (n === undefined) return '--'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function formatPrice(n: number | undefined): string {
  if (n === undefined) return '--'
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface StatRowProps {
  label: string
  values: string[]
}

function StatRow({ label, values }: StatRowProps) {
  return (
    <div className="flex items-center border-b border-white/5 last:border-b-0">
      <div className="w-28 flex-shrink-0 text-[10px] font-mono text-slate-500 uppercase tracking-wider py-2 px-3">
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 text-xs font-mono text-slate-200 py-2 px-3 text-right"
        >
          {v}
        </div>
      ))}
    </div>
  )
}

export function ComparePanel() {
  const compareNodes = useAppStore((s) => s.compareNodes)
  const setCompareNodes = useAppStore((s) => s.setCompareNodes)

  if (compareNodes.length < 2) return null

  // Get node data from the graph
  // We access the store's graph data to find the nodes
  const store = useAppStore.getState()
  const nodes = compareNodes
    .map((id) => {
      // Try to find in the existing graph nodes via the store
      // For now we just show the IDs; the actual node data comes from
      // the graph state which is managed by the scene
      return { id, label: id }
    })

  // Determine the type of comparison based on node IDs
  // Country codes are 3-letter uppercase, entities have tickers etc.
  const isCountryCompare = compareNodes.every((id) => /^[A-Z]{3}$/.test(id))

  return (
    <div className="absolute top-20 right-4 z-30 pointer-events-auto animate-in slide-in-from-right duration-300">
      <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-lg w-80 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-econ-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xs font-mono text-slate-300 uppercase tracking-wider">
              Compare
            </h3>
          </div>
          <button
            onClick={() => setCompareNodes([])}
            className="text-slate-500 hover:text-white text-sm leading-none transition-colors"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center border-b border-white/5">
          <div className="w-28 flex-shrink-0" />
          {compareNodes.map((id) => (
            <div
              key={id}
              className="flex-1 text-[10px] font-mono text-econ-blue uppercase tracking-wider py-2 px-3 text-right"
            >
              {id}
            </div>
          ))}
        </div>

        {/* Data rows -- show placeholder stats based on node type */}
        {isCountryCompare ? (
          <>
            <StatRow label="GDP" values={compareNodes.map(() => '--')} />
            <StatRow label="GDP Growth" values={compareNodes.map(() => '--')} />
            <StatRow label="Population" values={compareNodes.map(() => '--')} />
            <StatRow label="GDP/Capita" values={compareNodes.map(() => '--')} />
          </>
        ) : (
          <>
            <StatRow label="Price" values={compareNodes.map(() => '--')} />
            <StatRow label="Market Cap" values={compareNodes.map(() => '--')} />
            <StatRow label="Sector" values={compareNodes.map(() => '--')} />
            <StatRow label="Change 24h" values={compareNodes.map(() => '--')} />
          </>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/5">
          <p className="text-[9px] font-mono text-slate-600 text-center">
            Data populates when nodes are loaded in the graph
          </p>
        </div>
      </div>
    </div>
  )
}
