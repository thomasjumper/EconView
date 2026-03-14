import { useState, useRef, useEffect, useCallback } from 'react'
import { useAIQuery } from '../../hooks/useAIQuery'

interface SearchBarProps {
  onNarration: (narration: string) => void
}

export function SearchBar({ onNarration }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { submitQuery, isLoading } = useAIQuery()

  // Keyboard shortcut: "/" to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        const target = e.target as HTMLElement
        // Don't capture if already typing in an input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        inputRef.current?.focus()
      }

      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur()
        setIsFocused(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    const response = await submitQuery(query.trim())
    if (response?.narration) {
      onNarration(response.narration)
    }
    setQuery('')
    inputRef.current?.blur()
  }, [query, isLoading, submitQuery, onNarration])

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            flex items-center gap-2
            bg-black/70 backdrop-blur-xl
            border rounded-lg
            px-4 py-2.5
            transition-all duration-300
            ${isFocused
              ? 'border-econ-blue/50 w-[480px] shadow-lg shadow-econ-blue/10'
              : 'border-white/10 w-[360px]'
            }
          `}
        >
          {/* Search icon or loading spinner */}
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-econ-blue/30 border-t-econ-blue rounded-full animate-spin flex-shrink-0" />
          ) : (
            <svg
              className="w-4 h-4 text-slate-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about the global economy..."
            disabled={isLoading}
            className="
              flex-1 bg-transparent
              text-sm text-white placeholder-slate-600
              outline-none font-mono
            "
          />

          {/* Keyboard hint */}
          {!isFocused && !query && (
            <span className="text-[9px] font-mono text-slate-700 border border-slate-800 rounded px-1.5 py-0.5 flex-shrink-0">
              /
            </span>
          )}

          {/* Submit hint when focused */}
          {isFocused && query.trim() && (
            <span className="text-[9px] font-mono text-slate-600 flex-shrink-0">
              ENTER
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
