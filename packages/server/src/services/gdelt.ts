import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc'
const CACHE_TTL = 15 * 60 // 15 minutes

export interface GDELTArticle {
  title: string
  url: string
  source: string
  publishDate: string
  tone: number
  country: string
}

interface GDELTRawArticle {
  title?: string
  url?: string
  domain?: string
  seendate?: string
  tone?: number
  sourcecountry?: string
}

interface GDELTResponse {
  articles?: GDELTRawArticle[]
}

function parseGDELTDate(seendate: string): string {
  // GDELT returns dates like "20260314T120000Z"
  if (seendate && seendate.length >= 8) {
    const y = seendate.slice(0, 4)
    const m = seendate.slice(4, 6)
    const d = seendate.slice(6, 8)
    return `${y}-${m}-${d}`
  }
  return seendate
}

function mapArticle(raw: GDELTRawArticle): GDELTArticle {
  return {
    title: raw.title ?? '',
    url: raw.url ?? '',
    source: raw.domain ?? '',
    publishDate: parseGDELTDate(raw.seendate ?? ''),
    tone: raw.tone ?? 0,
    country: raw.sourcecountry ?? '',
  }
}

/**
 * Search GDELT DOC 2.0 API for news articles matching a query.
 */
export async function fetchNewsSentiment(
  query: string,
  timespan: string = '2weeks',
): Promise<GDELTArticle[]> {
  const cacheKey = `econview:gdelt:${query}:${timespan}`

  return cachedFetch(cacheKey, CACHE_TTL, async () => {
    try {
      const { data } = await axios.get<GDELTResponse>(GDELT_BASE, {
        params: {
          query,
          mode: 'artlist',
          maxrecords: 75,
          format: 'json',
          timespan: timespan,
        },
        timeout: 10000,
      })

      if (!data.articles || !Array.isArray(data.articles)) {
        return []
      }

      return data.articles.map(mapArticle)
    } catch (err) {
      console.error('[GDELT] Fetch error:', (err as Error).message)
      return []
    }
  })
}

/**
 * Fetch country-specific economic news sentiment.
 */
export async function fetchCountrySentiment(
  countryName: string,
): Promise<GDELTArticle[]> {
  const query = `${countryName} economy`
  return fetchNewsSentiment(query, '2weeks')
}

/**
 * Compute average sentiment from a list of articles.
 * GDELT tone: negative values = negative sentiment, positive = positive.
 */
export function aggregateSentiment(articles: GDELTArticle[]): {
  averageTone: number
  articleCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
} {
  if (articles.length === 0) {
    return {
      averageTone: 0,
      articleCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
    }
  }

  let totalTone = 0
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  for (const article of articles) {
    totalTone += article.tone
    if (article.tone > 1) positiveCount++
    else if (article.tone < -1) negativeCount++
    else neutralCount++
  }

  return {
    averageTone: totalTone / articles.length,
    articleCount: articles.length,
    positiveCount,
    negativeCount,
    neutralCount,
  }
}
