import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useCalendarData, type CalendarEvent } from '../../hooks/useCalendarData'

const TYPE_COLORS: Record<CalendarEvent['type'], { dot: string; text: string }> = {
  earnings: { dot: 'bg-cyan-400', text: 'text-cyan-400' },
  economic: { dot: 'bg-amber-400', text: 'text-amber-400' },
  ipo: { dot: 'bg-green-400', text: 'text-green-400' },
  central_bank: { dot: 'bg-purple-400', text: 'text-purple-400' },
}

const IMPACT_COLORS: Record<CalendarEvent['impact'], string> = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const dateKey = event.date.split('T')[0]
    const existing = groups.get(dateKey) ?? []
    existing.push(event)
    groups.set(dateKey, existing)
  }
  return groups
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function CalendarPanel() {
  const isOpen = useAppStore((s) => s.showCalendar)
  const toggle = useAppStore((s) => s.toggleCalendar)
  const { data, isLoading } = useCalendarData()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'c' || e.key === 'C') {
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  if (!isOpen) return null

  const upcomingEvents = data.events.slice(0, 20)
  const grouped = groupByDate(upcomingEvents)

  return (
    <div className="absolute top-28 right-4 w-80 max-h-[calc(100vh-10rem)] z-20 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Economic Calendar
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (C)"
          >
            &times;
          </button>
        </div>

        {/* Type Legend */}
        <div className="flex gap-3 mb-3 flex-wrap">
          {Object.entries(TYPE_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              <span className="text-[9px] font-mono text-slate-500 capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            Loading calendar...
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-[10px] font-mono text-slate-600 text-center py-4">
            No upcoming events
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-18rem)] pr-1 scrollbar-thin">
            {Array.from(grouped.entries()).map(([date, events]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="text-[10px] font-mono text-slate-500 mb-1.5 border-b border-white/5 pb-1">
                  {formatDate(date)}
                </div>

                {/* Events */}
                <div className="space-y-1.5">
                  {events.map((event) => {
                    const typeColor = TYPE_COLORS[event.type]
                    const impactClass = IMPACT_COLORS[event.impact]

                    return (
                      <div
                        key={event.id}
                        className="bg-white/[0.03] rounded px-2.5 py-1.5 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 min-w-0 flex-1">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${typeColor.dot}`} />
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono text-slate-300 truncate">
                                {event.title}
                              </div>
                              {event.time && (
                                <div className="text-[9px] font-mono text-slate-600">
                                  {event.time}
                                  {event.country && ` | ${event.country}`}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${impactClass}`}>
                            {event.impact}
                          </span>
                        </div>

                        {/* Estimate vs Actual */}
                        {(event.estimate !== undefined || event.actual !== undefined) && (
                          <div className="flex gap-3 mt-1 ml-3">
                            {event.estimate !== undefined && (
                              <span className="text-[9px] font-mono text-slate-500">
                                Est: <span className="text-slate-400">{event.estimate}</span>
                              </span>
                            )}
                            {event.actual !== undefined && (
                              <span className="text-[9px] font-mono text-slate-500">
                                Act: <span className="text-white">{event.actual}</span>
                              </span>
                            )}
                            {event.previous !== undefined && (
                              <span className="text-[9px] font-mono text-slate-500">
                                Prev: <span className="text-slate-400">{event.previous}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-[9px] font-mono text-slate-700 text-right mt-2">
          Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </div>
      </div>
    </div>
  )
}
