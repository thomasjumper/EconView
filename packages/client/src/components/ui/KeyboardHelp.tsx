import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

const SHORTCUTS = [
  { key: 'ESC', description: 'Zoom out' },
  { key: 'T', description: 'Crisis presets' },
  { key: 'R', description: 'Risk dashboard' },
  { key: 'P', description: 'Performance dashboard' },
  { key: '/', description: 'Search' },
  { key: 'V', description: 'Toggle voice narration' },
  { key: '`', description: 'Debug panel' },
  { key: '?', description: 'This help' },
]

export function KeyboardHelp() {
  const isOpen = useAppStore((s) => s.showKeyboardHelp)
  const toggle = useAppStore((s) => s.toggleKeyboardHelp)
  const toggleVoice = useAppStore((s) => s.toggleVoice)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === '?') {
        e.preventDefault()
        toggle()
      }

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        toggleVoice()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, toggleVoice])

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/10 rounded-lg p-5 w-64 animate-in fade-in duration-200"
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-white text-sm leading-none"
            title="Close (?)"
          >
            &times;
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{shortcut.description}</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 min-w-[28px] text-center">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
