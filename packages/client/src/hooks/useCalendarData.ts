import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface CalendarEvent {
  id: string
  date: string
  time?: string
  title: string
  type: 'earnings' | 'economic' | 'ipo' | 'central_bank'
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  country?: string
  estimate?: string | number
  actual?: string | number
  previous?: string | number
  symbol?: string
}

export interface CalendarData {
  events: CalendarEvent[]
  lastUpdated: string
}

async function fetchCalendar(): Promise<CalendarData> {
  const res = await fetch(`${API_BASE}/api/calendar`)
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Calendar fetch failed')
  return json.data
}

const DEFAULT_CALENDAR: CalendarData = {
  events: [],
  lastUpdated: new Date().toISOString(),
}

export function useCalendarData(): { data: CalendarData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<CalendarData>({
    queryKey: ['calendar'],
    queryFn: fetchCalendar,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
    placeholderData: DEFAULT_CALENDAR,
  })

  return {
    data: data ?? DEFAULT_CALENDAR,
    isLoading,
    error: error as Error | null,
  }
}
