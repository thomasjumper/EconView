import { create } from 'zustand'

export interface TimelineEvent {
  date: Date
  title: string
  category: 'crisis' | 'policy' | 'election' | 'earnings' | 'geopolitical'
  description: string
  severity: 1 | 2 | 3
}

interface TimelineState {
  isReplayMode: boolean
  currentDate: Date
  startDate: Date | null
  endDate: Date | null
  playbackSpeed: number
  isPlaying: boolean
  events: TimelineEvent[]

  enterReplay: (start: Date, end: Date) => void
  exitReplay: () => void
  play: () => void
  pause: () => void
  setSpeed: (n: number) => void
  scrubTo: (date: Date) => void
  stepForward: () => void
  stepBackward: () => void
  setEvents: (events: TimelineEvent[]) => void
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const useTimelineStore = create<TimelineState>((set, get) => ({
  isReplayMode: false,
  currentDate: new Date(),
  startDate: null,
  endDate: null,
  playbackSpeed: 1,
  isPlaying: false,
  events: [],

  enterReplay: (start, end) =>
    set({
      isReplayMode: true,
      startDate: start,
      endDate: end,
      currentDate: new Date(start),
      isPlaying: false,
      playbackSpeed: 1,
    }),

  exitReplay: () =>
    set({
      isReplayMode: false,
      startDate: null,
      endDate: null,
      currentDate: new Date(),
      isPlaying: false,
      playbackSpeed: 1,
    }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  setSpeed: (n) => set({ playbackSpeed: n }),

  scrubTo: (date) => {
    const { startDate, endDate } = get()
    if (!startDate || !endDate) return
    const clamped = new Date(
      Math.max(startDate.getTime(), Math.min(endDate.getTime(), date.getTime())),
    )
    set({ currentDate: clamped })
  },

  stepForward: () => {
    const { currentDate, endDate } = get()
    if (!endDate) return
    const next = new Date(currentDate.getTime() + ONE_DAY_MS)
    if (next.getTime() <= endDate.getTime()) {
      set({ currentDate: next })
    }
  },

  stepBackward: () => {
    const { currentDate, startDate } = get()
    if (!startDate) return
    const prev = new Date(currentDate.getTime() - ONE_DAY_MS)
    if (prev.getTime() >= startDate.getTime()) {
      set({ currentDate: prev })
    }
  },

  setEvents: (events) => set({ events }),
}))
