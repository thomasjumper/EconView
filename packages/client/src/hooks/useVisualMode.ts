import * as THREE from 'three'
import { useAppStore, type VisualMode } from '../store/useAppStore'

export interface VisualModeOverrides {
  /** Override node color based on mode */
  getNodeColor: (baseColor: THREE.Color, gdpGrowth: number) => THREE.Color
  /** Material property overrides */
  emissiveIntensity: number
  roughness: number
  metalness: number
  wireframe: boolean
  /** Post-processing overrides */
  bloomIntensity: number
  bloomThreshold: number
  /** Edge visibility overrides */
  edgeOpacityMultiplier: number
  edgeColor: string
  forceShowEdges: boolean
  /** General tint */
  toneMapped: boolean
}

function heatColor(gdpGrowth: number): THREE.Color {
  // Map gdpGrowth from -5..+10 to 0..1
  const t = Math.max(0, Math.min(1, (gdpGrowth + 5) / 15))
  const c = new THREE.Color()
  if (t < 0.33) {
    // Blue to white
    c.lerpColors(new THREE.Color('#1E40AF'), new THREE.Color('#FFFFFF'), t / 0.33)
  } else if (t < 0.66) {
    // White to orange
    c.lerpColors(new THREE.Color('#FFFFFF'), new THREE.Color('#F97316'), (t - 0.33) / 0.33)
  } else {
    // Orange to red
    c.lerpColors(new THREE.Color('#F97316'), new THREE.Color('#DC2626'), (t - 0.66) / 0.34)
  }
  return c
}

function riskColor(gdpGrowth: number): THREE.Color {
  // Negative growth = high risk (red), positive = low risk (green)
  if (gdpGrowth < -2) return new THREE.Color('#FF0000')
  if (gdpGrowth < 0) return new THREE.Color('#FF6B35')
  if (gdpGrowth < 2) return new THREE.Color('#FFD700')
  return new THREE.Color('#00CC66')
}

function sentimentColor(gdpGrowth: number): THREE.Color {
  // Night-vision style: warm = positive, cool = negative
  const t = Math.max(0, Math.min(1, (gdpGrowth + 3) / 11))
  const c = new THREE.Color()
  c.lerpColors(new THREE.Color('#003322'), new THREE.Color('#44FF88'), t)
  return c
}

const MODE_CONFIGS: Record<VisualMode, Omit<VisualModeOverrides, 'getNodeColor'>> = {
  default: {
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.1,
    wireframe: false,
    bloomIntensity: 0.8,
    bloomThreshold: 0.2,
    edgeOpacityMultiplier: 1.0,
    edgeColor: '#00D4FF',
    forceShowEdges: false,
    toneMapped: false,
  },
  heat: {
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.0,
    wireframe: false,
    bloomIntensity: 1.5,
    bloomThreshold: 0.1,
    edgeOpacityMultiplier: 0.3,
    edgeColor: '#FF6633',
    forceShowEdges: false,
    toneMapped: false,
  },
  flow: {
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.1,
    wireframe: false,
    bloomIntensity: 1.0,
    bloomThreshold: 0.15,
    edgeOpacityMultiplier: 2.5,
    edgeColor: '#00D4FF',
    forceShowEdges: true,
    toneMapped: false,
  },
  risk: {
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.0,
    wireframe: false,
    bloomIntensity: 1.2,
    bloomThreshold: 0.15,
    edgeOpacityMultiplier: 0.5,
    edgeColor: '#FF4545',
    forceShowEdges: false,
    toneMapped: false,
  },
  sentiment: {
    emissiveIntensity: 0.5,
    roughness: 0.5,
    metalness: 0.0,
    wireframe: false,
    bloomIntensity: 0.6,
    bloomThreshold: 0.25,
    edgeOpacityMultiplier: 0.8,
    edgeColor: '#33FF99',
    forceShowEdges: false,
    toneMapped: false,
  },
  xray: {
    emissiveIntensity: 0.2,
    roughness: 0.8,
    metalness: 0.0,
    wireframe: true,
    bloomIntensity: 1.8,
    bloomThreshold: 0.05,
    edgeOpacityMultiplier: 3.0,
    edgeColor: '#3388FF',
    forceShowEdges: true,
    toneMapped: false,
  },
}

export function useVisualMode(): VisualModeOverrides {
  const visualMode = useAppStore((s) => s.visualMode)
  const config = MODE_CONFIGS[visualMode]

  const getNodeColor = (baseColor: THREE.Color, gdpGrowth: number): THREE.Color => {
    switch (visualMode) {
      case 'heat':
        return heatColor(gdpGrowth)
      case 'risk':
        return riskColor(gdpGrowth)
      case 'sentiment':
        return sentimentColor(gdpGrowth)
      case 'xray': {
        // Monochrome blue
        const lum = baseColor.getHSL({ h: 0, s: 0, l: 0 }).l
        return new THREE.Color().setHSL(0.6, 0.8, 0.2 + lum * 0.4)
      }
      case 'flow':
      case 'default':
      default:
        return baseColor.clone()
    }
  }

  return {
    ...config,
    getNodeColor,
  }
}
