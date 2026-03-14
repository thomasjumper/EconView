import { cachedFetch } from '../cache/redis.js'

interface PropertyPriceData {
  countryCode: string
  country: string
  indexValue: number
  yoyChange: number
  lastQuarter: string
}

export async function fetchPropertyPrices(): Promise<PropertyPriceData[]> {
  return cachedFetch('property:bis-rpp', 86400, async () => {
    // BIS Residential Property Prices — hardcoded quarterly data
    // indexValue: 100 = 2015 base year, yoyChange: % year-over-year
    const data: PropertyPriceData[] = [
      { countryCode: 'USA', country: 'United States', indexValue: 172.3, yoyChange: 4.8, lastQuarter: '2025-Q3' },
      { countryCode: 'GBR', country: 'United Kingdom', indexValue: 148.6, yoyChange: 2.1, lastQuarter: '2025-Q3' },
      { countryCode: 'DEU', country: 'Germany', indexValue: 131.2, yoyChange: -1.4, lastQuarter: '2025-Q3' },
      { countryCode: 'FRA', country: 'France', indexValue: 138.9, yoyChange: 0.3, lastQuarter: '2025-Q3' },
      { countryCode: 'CAN', country: 'Canada', indexValue: 164.7, yoyChange: 1.9, lastQuarter: '2025-Q3' },
      { countryCode: 'AUS', country: 'Australia', indexValue: 159.4, yoyChange: 3.2, lastQuarter: '2025-Q3' },
      { countryCode: 'JPN', country: 'Japan', indexValue: 118.5, yoyChange: 5.6, lastQuarter: '2025-Q3' },
      { countryCode: 'CHN', country: 'China', indexValue: 102.1, yoyChange: -4.3, lastQuarter: '2025-Q3' },
      { countryCode: 'KOR', country: 'South Korea', indexValue: 141.8, yoyChange: 1.2, lastQuarter: '2025-Q3' },
      { countryCode: 'NZL', country: 'New Zealand', indexValue: 145.2, yoyChange: -2.1, lastQuarter: '2025-Q3' },
      { countryCode: 'SWE', country: 'Sweden', indexValue: 128.7, yoyChange: -3.5, lastQuarter: '2025-Q3' },
      { countryCode: 'NOR', country: 'Norway', indexValue: 152.3, yoyChange: 1.8, lastQuarter: '2025-Q3' },
      { countryCode: 'NLD', country: 'Netherlands', indexValue: 161.5, yoyChange: 6.2, lastQuarter: '2025-Q3' },
      { countryCode: 'ESP', country: 'Spain', indexValue: 124.6, yoyChange: 3.9, lastQuarter: '2025-Q3' },
      { countryCode: 'IRL', country: 'Ireland', indexValue: 155.8, yoyChange: 4.1, lastQuarter: '2025-Q3' },
      { countryCode: 'CHE', country: 'Switzerland', indexValue: 147.9, yoyChange: 2.7, lastQuarter: '2025-Q3' },
      { countryCode: 'ITA', country: 'Italy', indexValue: 108.3, yoyChange: 0.8, lastQuarter: '2025-Q3' },
      { countryCode: 'BRA', country: 'Brazil', indexValue: 133.6, yoyChange: 5.1, lastQuarter: '2025-Q3' },
      { countryCode: 'IND', country: 'India', indexValue: 168.4, yoyChange: 7.8, lastQuarter: '2025-Q3' },
      { countryCode: 'ZAF', country: 'South Africa', indexValue: 121.9, yoyChange: 1.5, lastQuarter: '2025-Q3' },
    ]

    console.log(`[Property] Loaded BIS residential property prices for ${data.length} countries`)
    return data
  })
}
