import { useAppStore } from '../../store/useAppStore'

export function ScanLines() {
  const showScanLines = useAppStore((s) => s.showScanLines)

  if (!showScanLines) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.03) 0px,
          rgba(0, 0, 0, 0.03) 1px,
          transparent 1px,
          transparent 3px
        )`,
      }}
    />
  )
}
