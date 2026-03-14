import { create } from 'zustand'
import type { ZoomLevel, EconNode } from '@econview/shared'

interface AppState {
  zoomLevel: ZoomLevel
  focusNodeId: string | null
  hoveredNodeId: string | null
  selectedNode: EconNode | null
  showTradeArcs: boolean

  setZoomLevel: (level: ZoomLevel) => void
  setFocusNodeId: (id: string | null) => void
  setHoveredNodeId: (id: string | null) => void
  setSelectedNode: (node: EconNode | null) => void
  toggleTradeArcs: () => void
}

export const useAppStore = create<AppState>((set) => ({
  zoomLevel: 'global',
  focusNodeId: null,
  hoveredNodeId: null,
  selectedNode: null,
  showTradeArcs: true,

  setZoomLevel: (level) => set({ zoomLevel: level }),
  setFocusNodeId: (id) => set({ focusNodeId: id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  toggleTradeArcs: () => set((s) => ({ showTradeArcs: !s.showTradeArcs })),
}))
