import { useRef, useCallback, useState, useEffect } from 'react'
import { useTimelineStore } from '../../store/useTimelineStore'
import type { TimelineEvent } from '../../store/useTimelineStore'

const SPEEDS = [1, 5, 20, 100]

const CATEGORY_COLORS: Record<TimelineEvent['category'], string> = {
  crisis: '#FF4545',
  policy: '#00D4FF',
  election: '#A855F7',
  earnings: '#F59E0B',
  geopolitical: '#FF6B35',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  })
}

export function TimelineScrubber() {
  const {
    isReplayMode,
    currentDate,
    startDate,
    endDate,
    playbackSpeed,
    isPlaying,
    events,
    play,
    pause,
    setSpeed,
    scrubTo,
    exitReplay,
    stepForward,
    stepBackward,
  } = useTimelineStore()

  const trackRef = useRef<HTMLDivElement>(null)
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  if (!isReplayMode || !startDate || !endDate) return null

  const totalMs = endDate.getTime() - startDate.getTime()
  const currentMs = currentDate.getTime() - startDate.getTime()
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, currentMs / totalMs)) : 0

  const scrubFromMouseEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !startDate || !endDate) return
      const rect = trackRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const ms = startDate.getTime() + pct * (endDate.getTime() - startDate.getTime())
      scrubTo(new Date(ms))
    },
    [startDate, endDate, scrubTo],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      scrubFromMouseEvent(e.clientX)
    },
    [scrubFromMouseEvent],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      scrubFromMouseEvent(e.clientX)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, scrubFromMouseEvent])

  // Generate date labels along the timeline
  const dateLabels: { date: Date; pct: number }[] = []
  if (totalMs > 0) {
    const labelCount = 6
    for (let i = 0; i <= labelCount; i++) {
      const pct = i / labelCount
      const ms = startDate.getTime() + pct * totalMs
      dateLabels.push({ date: new Date(ms), pct })
    }
  }

  // Filter events within the date range
  const visibleEvents = events.filter(
    (e) => e.date.getTime() >= startDate.getTime() && e.date.getTime() <= endDate.getTime(),
  )

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/5 px-4 py-3">
        {/* Top row: controls and date display */}
        <div className="flex items-center justify-between mb-2">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-2">
            {/* Step backward */}
            <button
              onClick={stepBackward}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              title="Step backward 1 day"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="0" y="1" width="2" height="8" />
                <polygon points="10,1 10,9 3,5" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={isPlaying ? pause : play}
              className="w-8 h-8 flex items-center justify-center rounded border border-econ-blue/40 text-econ-blue hover:bg-econ-blue/10 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="1" y="1" width="3.5" height="10" rx="0.5" />
                  <rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <polygon points="2,0 12,6 2,12" />
                </svg>
              )}
            </button>

            {/* Step forward */}
            <button
              onClick={stepForward}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              title="Step forward 1 day"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <polygon points="0,1 0,9 7,5" />
                <rect x="8" y="1" width="2" height="8" />
              </svg>
            </button>

            {/* Speed controls */}
            <div className="flex items-center gap-1 ml-2">
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                    playbackSpeed === speed
                      ? 'border-econ-blue/40 text-econ-blue bg-econ-blue/10'
                      : 'border-slate-700 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Center: Current date */}
          <div className="text-lg font-mono text-white tracking-wider">
            {formatDate(currentDate)}
          </div>

          {/* Right: Exit button */}
          <button
            onClick={exitReplay}
            className="text-[10px] font-mono px-3 py-1.5 rounded border border-econ-red/40 text-econ-red hover:bg-econ-red/10 transition-colors uppercase tracking-wider"
          >
            Exit Replay
          </button>
        </div>

        {/* Timeline track */}
        <div className="relative">
          {/* Track background */}
          <div
            ref={trackRef}
            className="relative h-6 bg-white/5 rounded-full cursor-pointer select-none"
            onMouseDown={handleMouseDown}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-econ-blue/30 to-econ-blue/10"
              style={{ width: `${progress * 100}%` }}
            />

            {/* Event markers */}
            {visibleEvents.map((event, i) => {
              const eventPct =
                (event.date.getTime() - startDate.getTime()) / totalMs
              const size = event.severity === 3 ? 10 : event.severity === 2 ? 7 : 5
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 rounded-full z-10 cursor-pointer transition-transform hover:scale-150"
                  style={{
                    left: `${eventPct * 100}%`,
                    width: size,
                    height: size,
                    backgroundColor: CATEGORY_COLORS[event.category],
                    marginLeft: -size / 2,
                    boxShadow: `0 0 6px ${CATEGORY_COLORS[event.category]}80`,
                  }}
                  onMouseEnter={() => setHoveredEvent(event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                />
              )
            })}

            {/* Playhead */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-econ-blue border-2 border-white shadow-lg shadow-econ-blue/40 z-20"
              style={{
                left: `${progress * 100}%`,
                marginLeft: -8,
              }}
            />
          </div>

          {/* Date labels */}
          <div className="relative h-4 mt-1">
            {dateLabels.map(({ date, pct }, i) => (
              <div
                key={i}
                className="absolute text-[9px] font-mono text-slate-600 -translate-x-1/2"
                style={{ left: `${pct * 100}%` }}
              >
                {formatDateShort(date)}
              </div>
            ))}
          </div>
        </div>

        {/* Event tooltip */}
        {hoveredEvent && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 pointer-events-none min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[hoveredEvent.category] }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: CATEGORY_COLORS[hoveredEvent.category] }}>
                {hoveredEvent.category}
              </span>
            </div>
            <div className="text-white text-sm font-medium">{hoveredEvent.title}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {formatDate(hoveredEvent.date)}
            </div>
            <div className="text-xs text-slate-400 mt-1">{hoveredEvent.description}</div>
          </div>
        )}
      </div>
    </div>
  )
}
