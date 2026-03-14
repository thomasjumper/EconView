import axios from 'axios'

// ── Types ────────────────────────────────────────────────────────────────

export interface AIQueryResponse {
  action: 'navigate' | 'filter' | 'highlight' | 'mode' | 'compare' | 'info' | 'none'
  target?: string
  mode?: string
  narration: string
  highlights?: string[]
}

export interface MarketContext {
  yieldSpread?: number
  fedFundsRate?: number
  threatLevel?: string
  recessionProbability?: number
  topCountries?: string[]
  activeAlerts?: string[]
}

// ── System Prompt ────────────────────────────────────────────────────────

function buildSystemPrompt(context: MarketContext): string {
  return `You are EconView's AI assistant, integrated into a 3D economic visualization platform. You help users navigate and understand global economic data.

## Available Data & Views

The platform shows a 3D globe with economic nodes at multiple zoom levels:
- **global**: Country nodes sized by GDP, with trade flow arcs between them
- **market**: Stock exchanges within a country (NYSE, NASDAQ, Bond Market, etc.)
- **sector**: GICS sectors (Technology, Healthcare, Financials, etc.)
- **entity**: Individual companies within a sector

## Current Market Data
${context.yieldSpread !== undefined ? `- Yield curve spread (2Y-10Y): ${context.yieldSpread.toFixed(2)}%` : '- Yield curve data: loading'}
${context.fedFundsRate !== undefined ? `- Fed Funds Rate: ${context.fedFundsRate.toFixed(2)}%` : ''}
${context.threatLevel ? `- Market risk level: ${context.threatLevel}` : ''}
${context.recessionProbability !== undefined ? `- Recession probability: ${context.recessionProbability.toFixed(0)}%` : ''}
${context.activeAlerts && context.activeAlerts.length > 0 ? `- Active alerts: ${context.activeAlerts.join(', ')}` : '- No active alerts'}

## Available Actions

You MUST respond with valid JSON matching this schema:
{
  "action": "navigate" | "filter" | "highlight" | "mode" | "compare" | "info" | "none",
  "target": "optional target ID (country code like USA, CHN, or sector like information_technology, or company ticker)",
  "mode": "optional visual mode: default, heat, flow, risk, sentiment, xray",
  "narration": "Brief, insightful explanation (1-3 sentences, like a Bloomberg terminal narrator)",
  "highlights": ["optional", "array", "of", "node IDs to highlight"]
}

### Action Types:
- **navigate**: Drill into a specific country/market/sector. Target should be a country code (USA, CHN, JPN, DEU, GBR, etc.) or sector ID.
- **filter**: Show only matching nodes. Highlights array should contain node IDs.
- **highlight**: Temporarily highlight specific nodes without navigating.
- **mode**: Change visual mode. Set mode field to one of: default, heat, flow, risk, sentiment, xray.
- **compare**: Compare two or more entities. Highlights should contain the IDs to compare.
- **info**: Just provide information/narration, no navigation needed.
- **none**: Query doesn't map to an action.

Keep narrations concise, data-driven, and insightful — like a seasoned financial analyst giving a briefing.
Respond ONLY with the JSON object, no markdown fencing, no extra text.`
}

// ── Provider: Ollama ─────────────────────────────────────────────────────

async function queryOllama(
  query: string,
  systemPrompt: string,
): Promise<string> {
  const baseUrl = process.env.OLLAMA_URL || 'http://100.67.105.27:11434'
  const model = process.env.OLLAMA_MODEL || 'qwen3:14b'

  const response = await axios.post(
    `${baseUrl}/api/chat`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 500,
      },
    },
    { timeout: 30_000 },
  )

  return response.data.message?.content ?? ''
}

// ── Provider: Anthropic (fallback) ───────────────────────────────────────

async function queryAnthropic(
  query: string,
  systemPrompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No ANTHROPIC_API_KEY set')

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30_000,
    },
  )

  const textBlock = response.data.content?.find((b: any) => b.type === 'text')
  return textBlock?.text ?? ''
}

// ── Query Processor ──────────────────────────────────────────────────────

type Provider = 'ollama' | 'anthropic' | 'none'

function detectProvider(): Provider {
  if (process.env.OLLAMA_URL || process.env.OLLAMA_MODEL) return 'ollama'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  // Default to Ollama (Mac Mini)
  return 'ollama'
}

export async function processQuery(
  query: string,
  context: MarketContext,
): Promise<AIQueryResponse> {
  const provider = detectProvider()
  const systemPrompt = buildSystemPrompt(context)

  if (provider === 'none') {
    return {
      action: 'info',
      narration:
        'AI query processing is not configured. Set OLLAMA_URL or ANTHROPIC_API_KEY to enable natural language queries.',
    }
  }

  try {
    let responseText: string

    if (provider === 'ollama') {
      console.log('[AI Query] Using Ollama on Mac Mini')
      responseText = await queryOllama(query, systemPrompt)
    } else {
      console.log('[AI Query] Using Anthropic API')
      responseText = await queryAnthropic(query, systemPrompt)
    }

    responseText = responseText.trim()

    // Strip <think>...</think> blocks (qwen3 thinking mode)
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        action: 'info',
        narration: responseText.slice(0, 300),
      }
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIQueryResponse

    const validActions = ['navigate', 'filter', 'highlight', 'mode', 'compare', 'info', 'none']
    if (!validActions.includes(parsed.action)) {
      parsed.action = 'info'
    }

    return parsed
  } catch (err) {
    const message = (err as Error).message

    // If Ollama fails, try Anthropic as fallback
    if (provider === 'ollama' && process.env.ANTHROPIC_API_KEY) {
      console.warn('[AI Query] Ollama failed, falling back to Anthropic:', message)
      try {
        const responseText = await queryAnthropic(query, systemPrompt)
        const jsonMatch = responseText.trim().match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as AIQueryResponse
        }
      } catch (fallbackErr) {
        console.error('[AI Query] Anthropic fallback also failed:', (fallbackErr as Error).message)
      }
    }

    console.error('[AI Query] Error:', message)
    return {
      action: 'none',
      narration: `Query processing failed: ${message}`,
    }
  }
}
