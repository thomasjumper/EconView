import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface TriggeredAlert {
  id: string
  ruleId: string
  ruleName: string
  type: string
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  triggeredAt: string
}

let alertSocket: Socket | null = null

export function useAlerts() {
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch current alerts via REST
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`)
      if (!res.ok) return
      const json = await res.json()
      if (json.ok && Array.isArray(json.data)) {
        setAlerts(json.data)
      }
    } catch {
      // Server unreachable — leave alerts empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()

    // Listen for real-time alert updates via Socket.io
    if (!alertSocket) {
      alertSocket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
      })
    }

    const handleAlerts = (data: TriggeredAlert | TriggeredAlert[]) => {
      const items = Array.isArray(data) ? data : [data]
      setAlerts(items)
    }

    alertSocket.on('alerts', handleAlerts)

    return () => {
      alertSocket?.off('alerts', handleAlerts)
    }
  }, [fetchAlerts])

  return { alerts, loading, refetch: fetchAlerts }
}
