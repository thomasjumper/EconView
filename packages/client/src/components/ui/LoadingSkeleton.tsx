export function LoadingPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800/50 rounded ${className}`} />
  )
}

export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <LoadingPulse className="h-3 w-16" />
          <LoadingPulse className="h-2 flex-1" />
          <LoadingPulse className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function GlobeFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mx-auto mb-4" />
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Initializing Globe
        </div>
      </div>
    </div>
  )
}
