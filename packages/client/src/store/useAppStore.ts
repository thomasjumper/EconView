import { create } from 'zustand'
import type { ZoomLevel, EconNode } from '@econview/shared'

export type VisualMode = 'default' | 'heat' | 'flow' | 'risk' | 'sentiment' | 'xray'

export interface DebugSettings {
  bloomIntensity: number
  bloomThreshold: number
  arcOpacityMultiplier: number
  forceChargeStrength: number
  forceLinkDistance: number
  nodeScaleMultiplier: number
}

const DEFAULT_DEBUG: DebugSettings = {
  bloomIntensity: 0.8,
  bloomThreshold: 0.2,
  arcOpacityMultiplier: 1.0,
  forceChargeStrength: -120,
  forceLinkDistance: 8,
  nodeScaleMultiplier: 1.0,
}

interface AppState {
  zoomLevel: ZoomLevel
  zoomPath: string[]
  focusNodeId: string | null
  hoveredNodeId: string | null
  selectedNode: EconNode | null
  showTradeArcs: boolean
  visualMode: VisualMode
  debugVisible: boolean
  debug: DebugSettings
  showCrisisPresets: boolean
  showPerformanceDashboard: boolean
  showKeyboardHelp: boolean

  setZoomLevel: (level: ZoomLevel) => void
  setFocusNodeId: (id: string | null) => void
  setHoveredNodeId: (id: string | null) => void
  setSelectedNode: (node: EconNode | null) => void
  toggleTradeArcs: () => void
  setVisualMode: (mode: VisualMode) => void
  toggleDebug: () => void
  setDebug: (partial: Partial<DebugSettings>) => void
  toggleCrisisPresets: () => void
  togglePerformanceDashboard: () => void
  toggleKeyboardHelp: () => void
  drillDown: (nodeId: string) => void
  zoomOut: () => void
}

const ZOOM_ORDER: ZoomLevel[] = ['global', 'market', 'sector', 'entity']

export const useAppStore = create<AppState>((set, get) => ({
  zoomLevel: 'global',
  zoomPath: [],
  focusNodeId: null,
  hoveredNodeId: null,
  selectedNode: null,
  showTradeArcs: true,
  visualMode: 'default',
  debugVisible: false,
  debug: { ...DEFAULT_DEBUG },
  showCrisisPresets: false,
  showPerformanceDashboard: false,
  showKeyboardHelp: false,

  setZoomLevel: (level) => set({ zoomLevel: level }),
  setFocusNodeId: (id) => set({ focusNodeId: id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  toggleTradeArcs: () => set((s) => ({ showTradeArcs: !s.showTradeArcs })),
  setVisualMode: (mode) => set({ visualMode: mode }),
  toggleDebug: () => set((s) => ({ debugVisible: !s.debugVisible })),
  setDebug: (partial) => set((s) => ({ debug: { ...s.debug, ...partial } })),
  toggleCrisisPresets: () => set((s) => ({ showCrisisPresets: !s.showCrisisPresets })),
  togglePerformanceDashboard: () => set((s) => ({ showPerformanceDashboard: !s.showPerformanceDashboard })),
  toggleKeyboardHelp: () => set((s) => ({ showKeyboardHelp: !s.showKeyboardHelp })),

  drillDown: (nodeId) => {
    const { zoomLevel, zoomPath } = get()
    const currentIdx = ZOOM_ORDER.indexOf(zoomLevel)
    if (currentIdx >= ZOOM_ORDER.length - 1) return

    const nextLevel = ZOOM_ORDER[currentIdx + 1]
    set({
      zoomLevel: nextLevel,
      zoomPath: [...zoomPath, nodeId],
      selectedNode: null,
      hoveredNodeId: null,
    })
  },

  zoomOut: () => {
    const { zoomLevel, zoomPath } = get()
    const currentIdx = ZOOM_ORDER.indexOf(zoomLevel)
    if (currentIdx <= 0) return

    const prevLevel = ZOOM_ORDER[currentIdx - 1]
    set({
      zoomLevel: prevLevel,
      zoomPath: zoomPath.slice(0, -1),
      selectedNode: null,
      hoveredNodeId: null,
    })
  },
}))
