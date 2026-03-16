const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

const retryDelays = [1000, 2000, 5000] // ms

export async function apiFetch<T>(
  path: string,
  options?: { retries?: number; signal?: AbortSignal }
): Promise<T> {
  const maxRetries = options?.retries ?? 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: options?.signal,
        headers: { 'Accept': 'application/json' },
      })

      // Rate limited — wait and retry
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10)
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryAfter * 1000))
          continue
        }
      }

      if (!res.ok) {
        throw new Error(`API ${path} returned ${res.status}`)
      }

      const json: ApiResponse<T> = await res.json()
      if (!json.ok) throw new Error(json.error || 'API error')
      return json.data as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, retryDelays[attempt] || 2000))
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${path}`)
}
