import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface AIQueryResponse {
  action: 'navigate' | 'filter' | 'highlight' | 'mode' | 'compare' | 'info' | 'none'
  target?: string
  mode?: string
  narration: string
  highlights?: string[]
}

// Map of country names to ISO3 codes for navigation
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'united states': 'USA', 'us': 'USA', 'usa': 'USA', 'america': 'USA',
  'china': 'CHN', 'japan': 'JPN', 'germany': 'DEU',
  'united kingdom': 'GBR', 'uk': 'GBR', 'france': 'FRA',
  'india': 'IND', 'brazil': 'BRA', 'canada': 'CAN',
  'south korea': 'KOR', 'australia': 'AUS', 'mexico': 'MEX',
  'italy': 'ITA', 'spain': 'ESP', 'russia': 'RUS',
}

export function useAIQuery() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<AIQueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const executeAction = useCallback((response: AIQueryResponse) => {
    const store = useAppStore.getState()

    switch (response.action) {
      case 'navigate': {
        if (response.target) {
          // Resolve target to a node ID
          const target = response.target.toUpperCase()
          const code = COUNTRY_NAME_TO_CODE[response.target.toLowerCase()] || target

          // Reset to global first
          while (store.zoomPath.length > 0) {
            store.zoomOut()
          }

          // Drill down to the target
          store.drillDown(code)
        }
        break
      }

      case 'mode': {
        if (response.mode === 'trade_flows' || response.mode === 'trade') {
          const currentState = useAppStore.getState()
          if (!currentState.showTradeArcs) {
            store.toggleTradeArcs()
          }
        }
        break
      }

      case 'highlight': {
        // Focus on the first highlighted node
        if (response.highlights && response.highlights.length > 0) {
          store.setFocusNodeId(response.highlights[0])
        }
        break
      }

      case 'compare': {
        if (response.highlights && response.highlights.length >= 2) {
          store.setCompareNodes(response.highlights)
          // Also highlight the first node
          store.setFocusNodeId(response.highlights[0])
        }
        break
      }

      case 'filter':
      case 'info':
      case 'none':
        // These actions just show the narration
        break
    }
  }, [])

  const submitQuery = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        throw new Error(`Query failed: ${res.status}`)
      }

      const json = await res.json()
      if (!json.ok) {
        throw new Error(json.error || 'Query failed')
      }

      const response = json.data as AIQueryResponse
      setLastResponse(response)

      // Execute the returned action
      executeAction(response)

      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [executeAction])

  const clearResponse = useCallback(() => {
    setLastResponse(null)
    setError(null)
  }, [])

  return {
    submitQuery,
    isLoading,
    lastResponse,
    error,
    clearResponse,
  }
}
