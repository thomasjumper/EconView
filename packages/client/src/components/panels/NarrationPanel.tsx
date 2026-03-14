import { useState, useEffect, useRef, useCallback } from 'react'

interface NarrationPanelProps {
  text: string | null
  onDismiss: () => void
}

export function NarrationPanel({ text, onDismiss }: NarrationPanelProps) {
  const [displayText, setDisplayText] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (revealRef.current) clearInterval(revealRef.current)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
  }, [])

  useEffect(() => {
    cleanup()

    if (!text) {
      setIsVisible(false)
      setDisplayText('')
      return
    }

    // Show panel
    setIsVisible(true)
    setIsRevealing(true)
    setDisplayText('')

    // Typewriter effect: reveal characters over ~2 seconds
    const totalChars = text.length
    const intervalMs = Math.max(10, Math.min(30, 2000 / totalChars))
    let charIndex = 0

    revealRef.current = setInterval(() => {
      charIndex++
      setDisplayText(text.slice(0, charIndex))

      if (charIndex >= totalChars) {
        if (revealRef.current) clearInterval(revealRef.current)
        setIsRevealing(false)

        // Auto-dismiss after 10 seconds
        dismissTimerRef.current = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onDismiss, 300) // wait for fade out animation
        }, 10000)
      }
    }, intervalMs)

    return cleanup
  }, [text, onDismiss, cleanup])

  const handleClick = useCallback(() => {
    if (isRevealing && text) {
      // Click during reveal: show full text immediately
      cleanup()
      setDisplayText(text)
      setIsRevealing(false)

      dismissTimerRef.current = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300)
      }, 10000)
    } else {
      // Click to dismiss
      cleanup()
      setIsVisible(false)
      setTimeout(onDismiss, 300)
    }
  }, [isRevealing, text, onDismiss, cleanup])

  if (!text && !isVisible) return null

  return (
    <div
      onClick={handleClick}
      className={`
        absolute bottom-20 left-1/2 -translate-x-1/2
        max-w-lg w-full
        z-30 pointer-events-auto cursor-pointer
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg px-5 py-4 relative">
        {/* AI badge */}
        <div className="absolute top-2 right-3 text-[8px] font-mono text-econ-blue/60 uppercase tracking-widest">
          AI
        </div>

        {/* Narration text */}
        <p className="text-sm text-slate-200 leading-relaxed font-mono pr-6">
          {displayText}
          {isRevealing && (
            <span className="inline-block w-[2px] h-[14px] bg-econ-blue ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </div>
    </div>
  )
}
