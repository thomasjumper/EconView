import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface CompanyFinancials {
  ticker: string
  revenue: number | null
  operatingIncome: number | null
  totalAssets: number | null
  totalDebt: number | null
  netIncome: number | null
  quarters: QuarterlyData[]
}

export interface QuarterlyData {
  period: string // e.g. "Q3 2025"
  revenue: number | null
  operatingIncome: number | null
  netIncome: number | null
  totalAssets: number | null
  totalDebt: number | null
}

async function fetchCompanyData(ticker: string): Promise<CompanyFinancials> {
  const res = await fetch(`${API_BASE}/api/company/${encodeURIComponent(ticker)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch financials for ${ticker}`)
  }
  return res.json()
}

export function useCompanyData(ticker: string | undefined) {
  return useQuery<CompanyFinancials>({
    queryKey: ['company-financials', ticker],
    queryFn: () => fetchCompanyData(ticker!),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
