// ── Market Hours Awareness ───────────────────────────────────────────────

export interface MarketSchedule {
  exchange: string
  timezone: string
  openHour: number   // 24h format, in exchange local time
  openMinute: number
  closeHour: number
  closeMinute: number
  days: number[]     // 0=Sun, 1=Mon, ...
  lunchBreak?: { startHour: number; startMinute: number; endHour: number; endMinute: number }
}

const MARKET_SCHEDULES: Record<string, MarketSchedule> = {
  NYSE: {
    exchange: 'NYSE',
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    days: [1, 2, 3, 4, 5],
  },
  NASDAQ: {
    exchange: 'NASDAQ',
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    days: [1, 2, 3, 4, 5],
  },
  LSE: {
    exchange: 'LSE',
    timezone: 'Europe/London',
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
    days: [1, 2, 3, 4, 5],
  },
  TSE: {
    exchange: 'TSE',
    timezone: 'Asia/Tokyo',
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 0,
    days: [1, 2, 3, 4, 5],
    lunchBreak: { startHour: 11, startMinute: 30, endHour: 12, endMinute: 30 },
  },
  HKEX: {
    exchange: 'HKEX',
    timezone: 'Asia/Hong_Kong',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    days: [1, 2, 3, 4, 5],
  },
  ASX: {
    exchange: 'ASX',
    timezone: 'Australia/Sydney',
    openHour: 10,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 0,
    days: [1, 2, 3, 4, 5],
  },
}

function getTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number } {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const dayOfWeek = dayMap[weekdayStr] ?? 1

  return { hour, minute, dayOfWeek }
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

export function isMarketOpen(exchange: string): boolean {
  const schedule = MARKET_SCHEDULES[exchange]
  if (!schedule) return false

  const { hour, minute, dayOfWeek } = getTimeInTimezone(schedule.timezone)

  if (!schedule.days.includes(dayOfWeek)) return false

  const nowMins = toMinutes(hour, minute)
  const openMins = toMinutes(schedule.openHour, schedule.openMinute)
  const closeMins = toMinutes(schedule.closeHour, schedule.closeMinute)

  if (nowMins < openMins || nowMins >= closeMins) return false

  // Check lunch break (TSE)
  if (schedule.lunchBreak) {
    const lunchStart = toMinutes(schedule.lunchBreak.startHour, schedule.lunchBreak.startMinute)
    const lunchEnd = toMinutes(schedule.lunchBreak.endHour, schedule.lunchBreak.endMinute)
    if (nowMins >= lunchStart && nowMins < lunchEnd) return false
  }

  return true
}

export function getMarketStatus(exchange: string): { open: boolean; nextEvent: string; timeUntil: string } {
  const schedule = MARKET_SCHEDULES[exchange]
  if (!schedule) {
    return { open: false, nextEvent: 'Unknown', timeUntil: '--' }
  }

  const open = isMarketOpen(exchange)
  const { hour, minute, dayOfWeek } = getTimeInTimezone(schedule.timezone)
  const nowMins = toMinutes(hour, minute)

  if (open) {
    // Check if approaching lunch break
    if (schedule.lunchBreak) {
      const lunchStart = toMinutes(schedule.lunchBreak.startHour, schedule.lunchBreak.startMinute)
      if (nowMins < lunchStart) {
        const diff = lunchStart - nowMins
        return { open: true, nextEvent: 'Lunch break', timeUntil: formatMinutes(diff) }
      }
    }

    const closeMins = toMinutes(schedule.closeHour, schedule.closeMinute)
    const diff = closeMins - nowMins
    return { open: true, nextEvent: 'Closes', timeUntil: formatMinutes(diff) }
  }

  // Market is closed — figure out when it opens next
  const openMins = toMinutes(schedule.openHour, schedule.openMinute)

  // During lunch break?
  if (schedule.lunchBreak) {
    const lunchEnd = toMinutes(schedule.lunchBreak.endHour, schedule.lunchBreak.endMinute)
    if (schedule.days.includes(dayOfWeek) && nowMins < lunchEnd && nowMins >= toMinutes(schedule.lunchBreak.startHour, schedule.lunchBreak.startMinute)) {
      const diff = lunchEnd - nowMins
      return { open: false, nextEvent: 'Reopens', timeUntil: formatMinutes(diff) }
    }
  }

  // Same day, before open
  if (schedule.days.includes(dayOfWeek) && nowMins < openMins) {
    const diff = openMins - nowMins
    return { open: false, nextEvent: 'Opens', timeUntil: formatMinutes(diff) }
  }

  // Calculate days until next trading day
  let daysUntil = 1
  for (let i = 1; i <= 7; i++) {
    const nextDay = (dayOfWeek + i) % 7
    if (schedule.days.includes(nextDay)) {
      daysUntil = i
      break
    }
  }

  const minutesUntilMidnight = 24 * 60 - nowMins
  const totalMinutes = minutesUntilMidnight + (daysUntil - 1) * 24 * 60 + openMins
  return { open: false, nextEvent: 'Opens', timeUntil: formatMinutes(totalMinutes) }
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 0) return '--'
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export function getAllMarketStatuses(): Record<string, { open: boolean; label: string }> {
  const result: Record<string, { open: boolean; label: string }> = {}
  for (const key of Object.keys(MARKET_SCHEDULES)) {
    const status = getMarketStatus(key)
    result[key] = {
      open: status.open,
      label: `${status.nextEvent} in ${status.timeUntil}`,
    }
  }
  return result
}
