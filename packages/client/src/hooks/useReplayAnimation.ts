import { useEffect, useRef } from 'react'
import { useTimelineStore } from '../store/useTimelineStore'

/**
 * Drives the replay animation using requestAnimationFrame.
 *
 * When isPlaying is true, advances currentDate by the appropriate amount
 * each frame based on playbackSpeed:
 *   1x = 1 day/sec, 5x = 5 days/sec, 20x = 20 days/sec, 100x = 100 days/sec
 *
 * Pauses automatically when reaching endDate.
 */
export function useReplayAnimation() {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const isReplayMode = useTimelineStore((s) => s.isReplayMode)

  useEffect(() => {
    if (!isPlaying || !isReplayMode) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    lastTimeRef.current = performance.now()

    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      const state = useTimelineStore.getState()

      if (!state.isPlaying || !state.endDate || !state.startDate) {
        rafRef.current = null
        return
      }

      // Calculate how many milliseconds of "simulated time" to advance
      // speed 1 = 1 day per real second => 1 day per 1000ms
      const daysPerSecond = state.playbackSpeed
      const msAdvance = (delta / 1000) * daysPerSecond * ONE_DAY_MS

      const newTime = state.currentDate.getTime() + msAdvance

      if (newTime >= state.endDate.getTime()) {
        // Reached the end — snap to endDate and pause
        useTimelineStore.setState({
          currentDate: new Date(state.endDate),
          isPlaying: false,
        })
        rafRef.current = null
        return
      }

      useTimelineStore.setState({
        currentDate: new Date(newTime),
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, isReplayMode])
}
