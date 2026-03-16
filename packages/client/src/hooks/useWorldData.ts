import { useQuery } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ── Electricity Data ──────────────────────────────────────────────────

export interface ElectricityCountry {
  code: string
  name: string
  generation_twh: number
  coal_pct: number
  gas_pct: number
  nuclear_pct: number
  hydro_pct: number
  wind_pct: number
  solar_pct: number
  renewables_pct: number
  carbon_intensity_gco2_kwh: number
}

export interface ElectricityData {
  countries: ElectricityCountry[]
  lastUpdated: string
}

// ── Demographics Data ─────────────────────────────────────────────────

export interface DemographicsCountry {
  code: string
  name: string
  population: number
  growthRate: number
  lifeExpectancy: number
  urbanPct: number
  elderly65Pct: number
  netMigration: number
  fertilityRate: number
}

export interface DemographicsData {
  countries: DemographicsCountry[]
  lastUpdated: string
}

// ── Food Security Data ────────────────────────────────────────────────

export interface FoodSecurityCountry {
  code: string
  name: string
  undernourishment: number
  arableLand: number
  foodProductionIndex: number
  foodInflation: number
}

export interface FoodSecurityData {
  countries: FoodSecurityCountry[]
  lastUpdated: string
}

// ── Tourism Data ──────────────────────────────────────────────────────

export interface TourismCountry {
  code: string
  name: string
  arrivals: number
  receipts: number
  departures: number
  expenditure: number
}

export interface TourismData {
  countries: TourismCountry[]
  lastUpdated: string
}

// ── Fetch Functions ───────────────────────────────────────────────────

async function fetchElectricity(): Promise<ElectricityData> {
  const res = await fetch(`${API_BASE}/api/electricity`)
  if (!res.ok) throw new Error(`Electricity fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Electricity fetch failed')
  return json.data
}

async function fetchDemographics(): Promise<DemographicsData> {
  const res = await fetch(`${API_BASE}/api/demographics`)
  if (!res.ok) throw new Error(`Demographics fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Demographics fetch failed')
  return json.data
}

async function fetchFoodSecurity(): Promise<FoodSecurityData> {
  const res = await fetch(`${API_BASE}/api/food-security`)
  if (!res.ok) throw new Error(`Food security fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Food security fetch failed')
  return json.data
}

async function fetchTourism(): Promise<TourismData> {
  const res = await fetch(`${API_BASE}/api/tourism`)
  if (!res.ok) throw new Error(`Tourism fetch failed: ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Tourism fetch failed')
  return json.data
}

// ── Hooks ─────────────────────────────────────────────────────────────

const STALE_1H = 60 * 60_000

const DEFAULT_ELECTRICITY: ElectricityData = { countries: [], lastUpdated: new Date().toISOString() }
const DEFAULT_DEMOGRAPHICS: DemographicsData = { countries: [], lastUpdated: new Date().toISOString() }
const DEFAULT_FOOD: FoodSecurityData = { countries: [], lastUpdated: new Date().toISOString() }
const DEFAULT_TOURISM: TourismData = { countries: [], lastUpdated: new Date().toISOString() }

export function useElectricity() {
  const { data, isLoading, error } = useQuery<ElectricityData>({
    queryKey: ['electricity'],
    queryFn: fetchElectricity,
    staleTime: STALE_1H,
    refetchInterval: STALE_1H,
    retry: 1,
    placeholderData: DEFAULT_ELECTRICITY,
  })
  return { data: data ?? DEFAULT_ELECTRICITY, isLoading, error: error as Error | null }
}

export function useDemographics() {
  const { data, isLoading, error } = useQuery<DemographicsData>({
    queryKey: ['demographics'],
    queryFn: fetchDemographics,
    staleTime: STALE_1H,
    refetchInterval: STALE_1H,
    retry: 1,
    placeholderData: DEFAULT_DEMOGRAPHICS,
  })
  return { data: data ?? DEFAULT_DEMOGRAPHICS, isLoading, error: error as Error | null }
}

export function useFoodSecurity() {
  const { data, isLoading, error } = useQuery<FoodSecurityData>({
    queryKey: ['food-security'],
    queryFn: fetchFoodSecurity,
    staleTime: STALE_1H,
    refetchInterval: STALE_1H,
    retry: 1,
    placeholderData: DEFAULT_FOOD,
  })
  return { data: data ?? DEFAULT_FOOD, isLoading, error: error as Error | null }
}

export function useTourism() {
  const { data, isLoading, error } = useQuery<TourismData>({
    queryKey: ['tourism'],
    queryFn: fetchTourism,
    staleTime: STALE_1H,
    refetchInterval: STALE_1H,
    retry: 1,
    placeholderData: DEFAULT_TOURISM,
  })
  return { data: data ?? DEFAULT_TOURISM, isLoading, error: error as Error | null }
}
