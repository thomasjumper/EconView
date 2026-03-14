import { useAppStore } from '../../store/useAppStore'

export function TopBar() {
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const showTradeArcs = useAppStore((s) => s.showTradeArcs)
  const toggleTradeArcs = useAppStore((s) => s.toggleTradeArcs)

  return (
    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 pointer-events-none z-10">
      <div className="flex items-center gap-3 pointer-events-auto">
        <h1 className="text-white font-medium text-sm tracking-wide">
          <span className="text-econ-blue">Econ</span>View
        </h1>
        <span className="text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-0.5">
          {zoomLevel.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={toggleTradeArcs}
          className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
            showTradeArcs
              ? 'border-econ-blue/40 text-econ-blue bg-econ-blue/10'
              : 'border-slate-700 text-slate-500 hover:text-slate-400'
          }`}
        >
          TRADE FLOWS
        </button>
        <div className="text-[10px] font-mono text-slate-600">
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </div>
      </div>
    </div>
  )
}
