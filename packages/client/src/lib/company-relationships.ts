export interface CompanyRelationship {
  source: string // ticker
  target: string // ticker
  type: 'competitor' | 'supplier' | 'partner' | 'subsidiary'
  strength: number // 0-1
}

export const COMPANY_RELATIONSHIPS: CompanyRelationship[] = [
  // Tech competitors
  { source: 'AAPL', target: 'MSFT', type: 'competitor', strength: 0.7 },
  { source: 'NVDA', target: 'AMD', type: 'competitor', strength: 0.9 },
  { source: 'GOOGL', target: 'META', type: 'competitor', strength: 0.8 },
  { source: 'META', target: 'AAPL', type: 'competitor', strength: 0.5 },
  { source: 'CRM', target: 'MSFT', type: 'competitor', strength: 0.6 },
  { source: 'CRM', target: 'ORCL', type: 'competitor', strength: 0.7 },
  { source: 'ADBE', target: 'CRM', type: 'competitor', strength: 0.4 },

  // Supply chain
  { source: 'AAPL', target: 'NVDA', type: 'supplier', strength: 0.6 },
  { source: 'TSLA', target: 'NVDA', type: 'supplier', strength: 0.5 },
  { source: 'AAPL', target: 'AVGO', type: 'supplier', strength: 0.7 },
  { source: 'MSFT', target: 'NVDA', type: 'supplier', strength: 0.6 },

  // Cloud competitors
  { source: 'AMZN', target: 'MSFT', type: 'competitor', strength: 0.7 },
  { source: 'AMZN', target: 'GOOGL', type: 'partner', strength: 0.4 },

  // Finance
  { source: 'JPM', target: 'BAC', type: 'competitor', strength: 0.8 },
  { source: 'JPM', target: 'GS', type: 'competitor', strength: 0.7 },
  { source: 'JPM', target: 'V', type: 'partner', strength: 0.6 },
  { source: 'V', target: 'MA', type: 'competitor', strength: 0.9 },
  { source: 'BAC', target: 'GS', type: 'competitor', strength: 0.6 },

  // Health care
  { source: 'JNJ', target: 'UNH', type: 'partner', strength: 0.5 },
  { source: 'LLY', target: 'MRK', type: 'competitor', strength: 0.7 },
  { source: 'LLY', target: 'ABBV', type: 'competitor', strength: 0.6 },
  { source: 'JNJ', target: 'MRK', type: 'competitor', strength: 0.5 },
  { source: 'ABBV', target: 'MRK', type: 'competitor', strength: 0.6 },

  // Consumer staples
  { source: 'PG', target: 'KO', type: 'partner', strength: 0.4 },
  { source: 'KO', target: 'PEP', type: 'competitor', strength: 0.9 },
  { source: 'WMT', target: 'COST', type: 'competitor', strength: 0.8 },
  { source: 'PG', target: 'WMT', type: 'partner', strength: 0.5 },

  // Energy
  { source: 'XOM', target: 'CVX', type: 'competitor', strength: 0.8 },
  { source: 'XOM', target: 'COP', type: 'competitor', strength: 0.6 },
  { source: 'CVX', target: 'COP', type: 'competitor', strength: 0.5 },
  { source: 'SLB', target: 'XOM', type: 'supplier', strength: 0.5 },

  // Media / streaming
  { source: 'NFLX', target: 'DIS', type: 'competitor', strength: 0.7 },
  { source: 'GOOGL', target: 'NFLX', type: 'competitor', strength: 0.4 },

  // Industrial
  { source: 'BA', target: 'RTX', type: 'competitor', strength: 0.6 },
  { source: 'CAT', target: 'HON', type: 'competitor', strength: 0.4 },
  { source: 'GE', target: 'RTX', type: 'competitor', strength: 0.5 },
]

/** Get all relationships involving any of the given tickers */
export function getRelationshipsForTickers(tickers: string[]): CompanyRelationship[] {
  const tickerSet = new Set(tickers)
  return COMPANY_RELATIONSHIPS.filter(
    (r) => tickerSet.has(r.source) && tickerSet.has(r.target),
  )
}

/** Color for each relationship type */
export const RELATIONSHIP_COLORS: Record<CompanyRelationship['type'], string> = {
  competitor: '#FF4545',
  supplier: '#00D4FF',
  partner: '#00FF9F',
  subsidiary: '#A855F7',
}

/** Label for each relationship type */
export const RELATIONSHIP_LABELS: Record<CompanyRelationship['type'], string> = {
  competitor: 'Competitor',
  supplier: 'Supplier',
  partner: 'Partner',
  subsidiary: 'Subsidiary',
}
