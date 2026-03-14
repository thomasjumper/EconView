import { cachedFetch } from '../cache/redis.js'

interface ConflictData {
  countryCode: string
  country: string
  conflictIntensity: number
  eventCount30d: number
  trend: 'escalating' | 'de-escalating' | 'stable'
  primaryType: string
}

export async function fetchConflictData(): Promise<ConflictData[]> {
  return cachedFetch('conflict:acled', 86400, async () => {
    // ACLED-style conflict intensity data — hardcoded from publicly reported summaries
    // conflictIntensity: 0-10 scale (0 = peaceful, 10 = full-scale war)
    const data: ConflictData[] = [
      { countryCode: 'UKR', country: 'Ukraine', conflictIntensity: 9.2, eventCount30d: 1840, trend: 'stable', primaryType: 'Battles' },
      { countryCode: 'SDN', country: 'Sudan', conflictIntensity: 8.8, eventCount30d: 920, trend: 'escalating', primaryType: 'Battles' },
      { countryCode: 'MMR', country: 'Myanmar', conflictIntensity: 7.9, eventCount30d: 685, trend: 'escalating', primaryType: 'Battles' },
      { countryCode: 'HTI', country: 'Haiti', conflictIntensity: 7.1, eventCount30d: 310, trend: 'stable', primaryType: 'Violence against civilians' },
      { countryCode: 'SYR', country: 'Syria', conflictIntensity: 5.4, eventCount30d: 195, trend: 'de-escalating', primaryType: 'Battles' },
      { countryCode: 'YEM', country: 'Yemen', conflictIntensity: 4.8, eventCount30d: 142, trend: 'de-escalating', primaryType: 'Battles' },
      { countryCode: 'ETH', country: 'Ethiopia', conflictIntensity: 5.1, eventCount30d: 278, trend: 'stable', primaryType: 'Violence against civilians' },
      { countryCode: 'SOM', country: 'Somalia', conflictIntensity: 6.5, eventCount30d: 345, trend: 'stable', primaryType: 'Battles' },
      { countryCode: 'COD', country: 'DR Congo', conflictIntensity: 7.3, eventCount30d: 520, trend: 'escalating', primaryType: 'Battles' },
      { countryCode: 'NGA', country: 'Nigeria', conflictIntensity: 5.8, eventCount30d: 410, trend: 'stable', primaryType: 'Violence against civilians' },
      { countryCode: 'ISR', country: 'Israel', conflictIntensity: 8.1, eventCount30d: 780, trend: 'stable', primaryType: 'Battles' },
      { countryCode: 'PSE', country: 'Palestine', conflictIntensity: 9.5, eventCount30d: 1200, trend: 'stable', primaryType: 'Violence against civilians' },
      { countryCode: 'AFG', country: 'Afghanistan', conflictIntensity: 4.2, eventCount30d: 165, trend: 'de-escalating', primaryType: 'Violence against civilians' },
      { countryCode: 'MLI', country: 'Mali', conflictIntensity: 5.6, eventCount30d: 180, trend: 'stable', primaryType: 'Battles' },
      { countryCode: 'BFA', country: 'Burkina Faso', conflictIntensity: 6.1, eventCount30d: 210, trend: 'escalating', primaryType: 'Battles' },
      // Stable countries for contrast
      { countryCode: 'USA', country: 'United States', conflictIntensity: 0.8, eventCount30d: 45, trend: 'stable', primaryType: 'Protests' },
      { countryCode: 'DEU', country: 'Germany', conflictIntensity: 0.3, eventCount30d: 12, trend: 'stable', primaryType: 'Protests' },
      { countryCode: 'JPN', country: 'Japan', conflictIntensity: 0.1, eventCount30d: 5, trend: 'stable', primaryType: 'Protests' },
      { countryCode: 'BRA', country: 'Brazil', conflictIntensity: 1.4, eventCount30d: 68, trend: 'stable', primaryType: 'Protests' },
      { countryCode: 'IND', country: 'India', conflictIntensity: 2.3, eventCount30d: 155, trend: 'stable', primaryType: 'Protests' },
    ]

    console.log(`[Conflict] Loaded conflict data for ${data.length} countries`)
    return data
  })
}
