import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type { ZoomLevel } from '@econview/shared'
import { useAppStore } from '../store/useAppStore'

// Camera distance presets for each zoom level
const ZOOM_DISTANCES: Record<ZoomLevel, number> = {
  global: 15,
  market: 30,
  sector: 25,
  entity: 18,
}

interface ClickedPosition {
  x: number
  y: number
  z: number
}

export function useZoomTransition(clickedPosition?: ClickedPosition | null) {
  const { camera } = useThree()
  const prevZoomRef = useRef<ZoomLevel>('global')
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const prevZoom = prevZoomRef.current
    if (prevZoom === zoomLevel) return
    prevZoomRef.current = zoomLevel

    // Kill any running animation
    if (tweenRef.current) {
      tweenRef.current.kill()
    }

    const targetDistance = ZOOM_DISTANCES[zoomLevel]
    const isDrillingDown =
      ['global', 'market', 'sector', 'entity'].indexOf(zoomLevel) >
      ['global', 'market', 'sector', 'entity'].indexOf(prevZoom)

    if (isDrillingDown && clickedPosition) {
      // Phase 1: fly toward the clicked node
      const midX = clickedPosition.x * 0.3
      const midY = clickedPosition.y * 0.3
      const midZ = clickedPosition.z * 0.3 + 20

      tweenRef.current = gsap.to(camera.position, {
        x: midX,
        y: midY,
        z: midZ,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          // Phase 2: reset to centered view at new distance
          tweenRef.current = gsap.to(camera.position, {
            x: 0,
            y: 0,
            z: targetDistance,
            duration: 0.4,
            ease: 'power2.out',
          })
        },
      })
    } else {
      // Zooming out: fly back to wider view
      tweenRef.current = gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: targetDistance,
        duration: 0.8,
        ease: 'power2.inOut',
      })
    }

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill()
      }
    }
  }, [zoomLevel, camera, clickedPosition])
}
