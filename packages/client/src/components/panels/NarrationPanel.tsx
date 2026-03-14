import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useVoiceNarration } from '../../hooks/useVoiceNarration'

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

  const voiceEnabled = useAppStore((s) => s.voiceEnabled)
  const toggleVoice = useAppStore((s) => s.toggleVoice)
  const { speak, stop, isSpeaking } = useVoiceNarration()

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
      stop()
      return
    }

    // Show panel
    setIsVisible(true)
    setIsRevealing(true)
    setDisplayText('')

    // Speak if voice is enabled
    if (voiceEnabled) {
      speak(text)
    }

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
  }, [text, onDismiss, cleanup, voiceEnabled, speak, stop])

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
      stop()
      setIsVisible(false)
      setTimeout(onDismiss, 300)
    }
  }, [isRevealing, text, onDismiss, cleanup, stop])

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
        {/* AI badge + voice toggle */}
        <div className="absolute top-2 right-3 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleVoice()
              if (voiceEnabled) {
                stop()
              } else if (text) {
                speak(text)
              }
            }}
            className={`
              transition-colors
              ${voiceEnabled ? 'text-econ-blue/80 hover:text-econ-blue' : 'text-slate-600 hover:text-slate-400'}
            `}
            title={voiceEnabled ? 'Disable voice (V)' : 'Enable voice (V)'}
          >
            {voiceEnabled ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM3 9v6h4l5 5V4L7 9H3z"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </button>
          <span className="text-[8px] font-mono text-econ-blue/60 uppercase tracking-widest">
            AI
          </span>
        </div>

        {/* Narration text */}
        <p className="text-sm text-slate-200 leading-relaxed font-mono pr-12">
          {displayText}
          {isRevealing && (
            <span className="inline-block w-[2px] h-[14px] bg-econ-blue ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </div>
    </div>
  )
}
