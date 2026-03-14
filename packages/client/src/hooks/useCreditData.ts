import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ── Credit Spreads ──────────────────────────────────────────────────────

export interface CreditSpread {
  name: string
  value: number
  change: number
  unit: string
}

export interface CreditSpreadsData {
  spreads: CreditSpread[]
  lastUpdated: string
}

async function fetchCreditSpreads(): Promise<CreditSpreadsData> {
  const res = await fetch(`${API_BASE}/api/credit-spreads`)
  if (!res.ok) throw new Error(`Credit spreads fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Credit spreads fetch failed')
  return json.data
}

const DEFAULT_CREDIT_SPREADS: CreditSpreadsData = {
  spreads: [
    { name: 'HY OAS', value: 0, change: 0, unit: 'bps' },
    { name: 'IG OAS', value: 0, change: 0, unit: 'bps' },
    { name: 'BBB OAS', value: 0, change: 0, unit: 'bps' },
  ],
  lastUpdated: new Date().toISOString(),
}

export function useCreditSpreads(): { data: CreditSpreadsData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<CreditSpreadsData>({
    queryKey: ['credit-spreads'],
    queryFn: fetchCreditSpreads,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_CREDIT_SPREADS,
  })

  return {
    data: data ?? DEFAULT_CREDIT_SPREADS,
    isLoading,
    error: error as Error | null,
  }
}

// ── Yield Spreads ───────────────────────────────────────────────────────

export interface YieldSpread {
  name: string
  value: number
  change: number
  inverted: boolean
}

export interface YieldSpreadsData {
  spreads: YieldSpread[]
  lastUpdated: string
}

async function fetchYieldSpreads(): Promise<YieldSpreadsData> {
  const res = await fetch(`${API_BASE}/api/yield-spreads`)
  if (!res.ok) throw new Error(`Yield spreads fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Yield spreads fetch failed')
  return json.data
}

const DEFAULT_YIELD_SPREADS: YieldSpreadsData = {
  spreads: [
    { name: '10Y-2Y', value: 0, change: 0, inverted: false },
    { name: '10Y-3M', value: 0, change: 0, inverted: false },
  ],
  lastUpdated: new Date().toISOString(),
}

export function useYieldSpreads(): { data: YieldSpreadsData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<YieldSpreadsData>({
    queryKey: ['yield-spreads'],
    queryFn: fetchYieldSpreads,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_YIELD_SPREADS,
  })

  return {
    data: data ?? DEFAULT_YIELD_SPREADS,
    isLoading,
    error: error as Error | null,
  }
}

// ── Financial Conditions ────────────────────────────────────────────────

export interface FinancialConditionsData {
  nfci: number
  nfciChange: number
  subIndices: {
    risk: number
    credit: number
    leverage: number
  }
  lastUpdated: string
}

async function fetchFinancialConditions(): Promise<FinancialConditionsData> {
  const res = await fetch(`${API_BASE}/api/financial-conditions`)
  if (!res.ok) throw new Error(`Financial conditions fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Financial conditions fetch failed')
  return json.data
}

const DEFAULT_FINANCIAL_CONDITIONS: FinancialConditionsData = {
  nfci: 0,
  nfciChange: 0,
  subIndices: { risk: 0, credit: 0, leverage: 0 },
  lastUpdated: new Date().toISOString(),
}

export function useFinancialConditions(): { data: FinancialConditionsData; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useQuery<FinancialConditionsData>({
    queryKey: ['financial-conditions'],
    queryFn: fetchFinancialConditions,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    placeholderData: DEFAULT_FINANCIAL_CONDITIONS,
  })

  return {
    data: data ?? DEFAULT_FINANCIAL_CONDITIONS,
    isLoading,
    error: error as Error | null,
  }
}
