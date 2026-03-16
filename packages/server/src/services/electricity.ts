import axios from 'axios'
import { cachedFetch } from '../cache/redis.js'

const CACHE_TTL = 86400 // 24 hours
const CSV_URL =
  'https://raw.githubusercontent.com/owid/etl/master/etl/steps/data/grapher/ember/2024-11-20/yearly_electricity.csv'

interface ElectricityCountry {
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

interface ElectricityData {
  countries: ElectricityCountry[]
  lastUpdated: string
}

// Fallback data for top 20 countries if CSV fetch fails
const FALLBACK_DATA: ElectricityCountry[] = [
  { code: 'CHN', name: 'China', generation_twh: 8849, coal_pct: 61.3, gas_pct: 3.5, nuclear_pct: 4.9, hydro_pct: 14.8, wind_pct: 8.5, solar_pct: 4.8, renewables_pct: 30.2, carbon_intensity_gco2_kwh: 564 },
  { code: 'USA', name: 'United States', generation_twh: 4178, coal_pct: 19.5, gas_pct: 39.8, nuclear_pct: 18.6, hydro_pct: 6.2, wind_pct: 10.2, solar_pct: 3.9, renewables_pct: 22.4, carbon_intensity_gco2_kwh: 376 },
  { code: 'IND', name: 'India', generation_twh: 1863, coal_pct: 74.3, gas_pct: 2.8, nuclear_pct: 3.1, hydro_pct: 10.4, wind_pct: 4.8, solar_pct: 5.2, renewables_pct: 22.0, carbon_intensity_gco2_kwh: 632 },
  { code: 'RUS', name: 'Russia', generation_twh: 1166, coal_pct: 16.2, gas_pct: 46.8, nuclear_pct: 20.6, hydro_pct: 15.2, wind_pct: 0.4, solar_pct: 0.2, renewables_pct: 16.8, carbon_intensity_gco2_kwh: 340 },
  { code: 'JPN', name: 'Japan', generation_twh: 1005, coal_pct: 30.8, gas_pct: 33.5, nuclear_pct: 7.6, hydro_pct: 7.4, wind_pct: 1.0, solar_pct: 10.8, renewables_pct: 22.0, carbon_intensity_gco2_kwh: 462 },
  { code: 'BRA', name: 'Brazil', generation_twh: 688, coal_pct: 3.1, gas_pct: 8.4, nuclear_pct: 2.3, hydro_pct: 63.8, wind_pct: 12.1, solar_pct: 4.5, renewables_pct: 84.2, carbon_intensity_gco2_kwh: 75 },
  { code: 'CAN', name: 'Canada', generation_twh: 644, coal_pct: 5.8, gas_pct: 12.4, nuclear_pct: 14.6, hydro_pct: 59.8, wind_pct: 5.8, solar_pct: 0.8, renewables_pct: 68.0, carbon_intensity_gco2_kwh: 120 },
  { code: 'DEU', name: 'Germany', generation_twh: 574, coal_pct: 26.1, gas_pct: 14.8, nuclear_pct: 0.0, hydro_pct: 3.4, wind_pct: 27.0, solar_pct: 12.1, renewables_pct: 46.2, carbon_intensity_gco2_kwh: 338 },
  { code: 'KOR', name: 'South Korea', generation_twh: 594, coal_pct: 34.6, gas_pct: 29.2, nuclear_pct: 27.4, hydro_pct: 0.5, wind_pct: 0.8, solar_pct: 5.1, renewables_pct: 8.6, carbon_intensity_gco2_kwh: 415 },
  { code: 'FRA', name: 'France', generation_twh: 530, coal_pct: 0.8, gas_pct: 6.2, nuclear_pct: 64.8, hydro_pct: 11.4, wind_pct: 9.8, solar_pct: 4.5, renewables_pct: 28.0, carbon_intensity_gco2_kwh: 56 },
  { code: 'GBR', name: 'United Kingdom', generation_twh: 312, coal_pct: 1.4, gas_pct: 34.5, nuclear_pct: 14.2, hydro_pct: 1.8, wind_pct: 29.4, solar_pct: 4.3, renewables_pct: 39.8, carbon_intensity_gco2_kwh: 207 },
  { code: 'SAU', name: 'Saudi Arabia', generation_twh: 391, coal_pct: 0.0, gas_pct: 60.3, nuclear_pct: 0.0, hydro_pct: 0.0, wind_pct: 0.1, solar_pct: 1.2, renewables_pct: 1.3, carbon_intensity_gco2_kwh: 528 },
  { code: 'IDN', name: 'Indonesia', generation_twh: 324, coal_pct: 61.8, gas_pct: 18.2, nuclear_pct: 0.0, hydro_pct: 6.8, wind_pct: 0.1, solar_pct: 0.2, renewables_pct: 14.8, carbon_intensity_gco2_kwh: 618 },
  { code: 'AUS', name: 'Australia', generation_twh: 270, coal_pct: 47.2, gas_pct: 18.5, nuclear_pct: 0.0, hydro_pct: 5.8, wind_pct: 12.4, solar_pct: 14.2, renewables_pct: 35.2, carbon_intensity_gco2_kwh: 510 },
  { code: 'TUR', name: 'Turkey', generation_twh: 330, coal_pct: 35.1, gas_pct: 22.4, nuclear_pct: 0.0, hydro_pct: 19.8, wind_pct: 10.8, solar_pct: 6.2, renewables_pct: 41.4, carbon_intensity_gco2_kwh: 378 },
  { code: 'MEX', name: 'Mexico', generation_twh: 330, coal_pct: 5.8, gas_pct: 56.2, nuclear_pct: 4.2, hydro_pct: 9.1, wind_pct: 7.1, solar_pct: 5.8, renewables_pct: 25.8, carbon_intensity_gco2_kwh: 388 },
  { code: 'ZAF', name: 'South Africa', generation_twh: 250, coal_pct: 82.5, gas_pct: 0.4, nuclear_pct: 5.2, hydro_pct: 1.8, wind_pct: 6.2, solar_pct: 3.1, renewables_pct: 12.0, carbon_intensity_gco2_kwh: 750 },
  { code: 'NOR', name: 'Norway', generation_twh: 157, coal_pct: 0.0, gas_pct: 1.2, nuclear_pct: 0.0, hydro_pct: 88.2, wind_pct: 10.1, solar_pct: 0.1, renewables_pct: 98.8, carbon_intensity_gco2_kwh: 8 },
  { code: 'SWE', name: 'Sweden', generation_twh: 170, coal_pct: 0.2, gas_pct: 0.4, nuclear_pct: 29.8, hydro_pct: 44.2, wind_pct: 19.8, solar_pct: 1.2, renewables_pct: 68.0, carbon_intensity_gco2_kwh: 25 },
  { code: 'POL', name: 'Poland', generation_twh: 175, coal_pct: 62.8, gas_pct: 8.1, nuclear_pct: 0.0, hydro_pct: 1.4, wind_pct: 18.2, solar_pct: 6.8, renewables_pct: 27.2, carbon_intensity_gco2_kwh: 635 },
]

function parseCSV(csvText: string): ElectricityCountry[] {
  const lines = csvText.split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const idx = headers.indexOf(n)
      if (idx !== -1) return idx
    }
    return -1
  }

  const iCountry = colIdx(['country'])
  const iCode = colIdx(['country_code', 'iso_code', 'code'])
  const iYear = colIdx(['year'])
  const iGen = colIdx(['generation__twh', 'generation_twh', 'total_generation__twh'])
  const iCoal = colIdx(['coal__pct', 'coal_pct', 'share_of_electricity_pct__coal'])
  const iGas = colIdx(['gas__pct', 'gas_pct', 'share_of_electricity_pct__gas'])
  const iNuclear = colIdx(['nuclear__pct', 'nuclear_pct', 'share_of_electricity_pct__nuclear'])
  const iHydro = colIdx(['hydro__pct', 'hydro_pct', 'share_of_electricity_pct__hydro'])
  const iWind = colIdx(['wind__pct', 'wind_pct', 'share_of_electricity_pct__wind'])
  const iSolar = colIdx(['solar__pct', 'solar_pct', 'share_of_electricity_pct__solar'])
  const iRenewables = colIdx(['renewables__pct', 'renewables_pct', 'share_of_electricity_pct__renewables'])
  const iCarbon = colIdx([
    'emissions_intensity__gco2_per_kwh',
    'carbon_intensity_gco2_kwh',
    'co2_intensity__gco2_per_kwh',
  ])

  // Group by country, keep the most recent year
  const countryMap = new Map<string, ElectricityCountry & { year: number }>()

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 3) continue

    const code = iCode !== -1 ? cols[iCode]?.trim() : ''
    const name = iCountry !== -1 ? cols[iCountry]?.trim() : ''
    const year = iYear !== -1 ? parseInt(cols[iYear]?.trim(), 10) : 0

    if (!code || code.length !== 3 || !name || !year) continue

    const num = (idx: number) => {
      if (idx === -1) return 0
      const v = parseFloat(cols[idx]?.trim())
      return isNaN(v) ? 0 : v
    }

    const existing = countryMap.get(code)
    if (existing && existing.year >= year) continue

    countryMap.set(code, {
      code,
      name,
      year,
      generation_twh: num(iGen),
      coal_pct: num(iCoal),
      gas_pct: num(iGas),
      nuclear_pct: num(iNuclear),
      hydro_pct: num(iHydro),
      wind_pct: num(iWind),
      solar_pct: num(iSolar),
      renewables_pct: num(iRenewables),
      carbon_intensity_gco2_kwh: num(iCarbon),
    })
  }

  return Array.from(countryMap.values())
    .filter((c) => c.generation_twh > 0)
    .map(({ year: _year, ...rest }) => rest)
}

export async function fetchElectricityData(): Promise<ElectricityData> {
  return cachedFetch('econview:electricity', CACHE_TTL, async () => {
    let countries: ElectricityCountry[]

    try {
      const { data: csvText } = await axios.get<string>(CSV_URL, { timeout: 15000 })
      const parsed = parseCSV(csvText)
      countries = parsed.length > 0 ? parsed : FALLBACK_DATA
    } catch (err) {
      console.warn('[Electricity] CSV fetch failed, using fallback data:', err instanceof Error ? err.message : err)
      countries = FALLBACK_DATA
    }

    console.log(`[Electricity] Loaded electricity data for ${countries.length} countries`)
    return { countries, lastUpdated: new Date().toISOString() }
  })
}
