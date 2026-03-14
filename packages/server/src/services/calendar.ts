import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

export interface CalendarEvent {
  date: string
  type: 'earnings' | 'economic' | 'ipo' | 'central_bank'
  title: string
  country?: string
  impact?: 'low' | 'medium' | 'high'
  actual?: number
  estimate?: number
  ticker?: string
}

// ---------------------------------------------------------------------------
// Finnhub Economic Calendar
// ---------------------------------------------------------------------------

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return cachedFetch('calendar:economic', 3600, async () => {
    const key = process.env.FINNHUB_API_KEY
    if (!key) return []

    const now = new Date()
    const from = now.toISOString().split('T')[0]
    const to = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]

    const res = await axios.get(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${key}`,
    )

    return (res.data?.economicCalendar || []).map((e: any) => ({
      date: e.time || e.date,
      type: 'economic' as const,
      title: e.event,
      country: e.country,
      impact: e.impact === 3 ? 'high' : e.impact === 2 ? 'medium' : 'low',
      actual: e.actual,
      estimate: e.estimate,
    }))
  })
}

// ---------------------------------------------------------------------------
// Finnhub Earnings Calendar
// ---------------------------------------------------------------------------

export async function fetchEarningsCalendar(): Promise<CalendarEvent[]> {
  return cachedFetch('calendar:earnings', 3600, async () => {
    const key = process.env.FINNHUB_API_KEY
    if (!key) return []

    const now = new Date()
    const from = now.toISOString().split('T')[0]
    const to = new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0]

    const res = await axios.get(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${key}`,
    )

    return (res.data?.earningsCalendar || []).map((e: any) => ({
      date: e.date,
      type: 'earnings' as const,
      title: `${e.symbol} Earnings`,
      ticker: e.symbol,
      estimate: e.epsEstimate,
      actual: e.epsActual,
    }))
  })
}

// ---------------------------------------------------------------------------
// Finnhub IPO Calendar
// ---------------------------------------------------------------------------

export async function fetchIPOCalendar(): Promise<CalendarEvent[]> {
  return cachedFetch('calendar:ipo', 3600, async () => {
    const key = process.env.FINNHUB_API_KEY
    if (!key) return []

    const now = new Date()
    const from = now.toISOString().split('T')[0]
    const to = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]

    const res = await axios.get(
      `https://finnhub.io/api/v1/calendar/ipo?from=${from}&to=${to}&token=${key}`,
    )

    return (res.data?.ipoCalendar || []).map((e: any) => ({
      date: e.date,
      type: 'ipo' as const,
      title: `${e.name} IPO (${e.symbol})`,
      ticker: e.symbol,
    }))
  })
}

// ---------------------------------------------------------------------------
// Full merged calendar
// ---------------------------------------------------------------------------

export async function fetchFullCalendar(): Promise<CalendarEvent[]> {
  const [econ, earnings, ipo] = await Promise.all([
    fetchEconomicCalendar(),
    fetchEarningsCalendar(),
    fetchIPOCalendar(),
  ])
  return [...econ, ...earnings, ...ipo].sort((a, b) => a.date.localeCompare(b.date))
}
