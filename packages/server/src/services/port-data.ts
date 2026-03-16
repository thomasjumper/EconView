// ---------------------------------------------------------------------------
// Port Data Service — top 50 global ports with realistic static data
// ---------------------------------------------------------------------------

import type { PortStatus } from '@econview/shared'
import { cachedFetch } from '../cache/redis.js'

// ---------------------------------------------------------------------------
// Port definitions
// ---------------------------------------------------------------------------

interface PortDef {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  annualTEU: number
  baseCongestion: number
  avgWaitDays: number
  baseVesselsAtAnchor: number
  throughputTrend: 'up' | 'stable' | 'down'
  topTradePartners: string[]
}

const PORTS: PortDef[] = [
  { id: 'shanghai', name: 'Shanghai', country: 'CN', lat: 31.23, lon: 121.47, annualTEU: 49_000_000, baseCongestion: 0.55, avgWaitDays: 1.5, baseVesselsAtAnchor: 45, throughputTrend: 'up', topTradePartners: ['US', 'JP', 'KR', 'DE', 'AU'] },
  { id: 'singapore', name: 'Singapore', country: 'SG', lat: 1.26, lon: 103.84, annualTEU: 39_000_000, baseCongestion: 0.50, avgWaitDays: 1.2, baseVesselsAtAnchor: 60, throughputTrend: 'up', topTradePartners: ['CN', 'MY', 'US', 'JP', 'KR'] },
  { id: 'shenzhen', name: 'Shenzhen', country: 'CN', lat: 22.54, lon: 114.05, annualTEU: 30_000_000, baseCongestion: 0.52, avgWaitDays: 1.3, baseVesselsAtAnchor: 30, throughputTrend: 'up', topTradePartners: ['US', 'JP', 'KR', 'TW', 'VN'] },
  { id: 'ningbo', name: 'Ningbo-Zhoushan', country: 'CN', lat: 29.87, lon: 121.55, annualTEU: 35_000_000, baseCongestion: 0.58, avgWaitDays: 1.6, baseVesselsAtAnchor: 38, throughputTrend: 'up', topTradePartners: ['US', 'JP', 'KR', 'DE', 'AU'] },
  { id: 'guangzhou', name: 'Guangzhou', country: 'CN', lat: 23.08, lon: 113.58, annualTEU: 24_000_000, baseCongestion: 0.48, avgWaitDays: 1.1, baseVesselsAtAnchor: 25, throughputTrend: 'stable', topTradePartners: ['US', 'JP', 'VN', 'MY', 'TH'] },
  { id: 'busan', name: 'Busan', country: 'KR', lat: 35.10, lon: 129.03, annualTEU: 23_000_000, baseCongestion: 0.42, avgWaitDays: 0.8, baseVesselsAtAnchor: 20, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'JP', 'VN', 'TW'] },
  { id: 'qingdao', name: 'Qingdao', country: 'CN', lat: 36.07, lon: 120.38, annualTEU: 25_000_000, baseCongestion: 0.50, avgWaitDays: 1.2, baseVesselsAtAnchor: 28, throughputTrend: 'up', topTradePartners: ['JP', 'KR', 'US', 'AU', 'BR'] },
  { id: 'hongkong', name: 'Hong Kong', country: 'HK', lat: 22.28, lon: 114.17, annualTEU: 16_000_000, baseCongestion: 0.38, avgWaitDays: 0.7, baseVesselsAtAnchor: 15, throughputTrend: 'down', topTradePartners: ['CN', 'US', 'JP', 'TW', 'SG'] },
  { id: 'tianjin', name: 'Tianjin', country: 'CN', lat: 38.99, lon: 117.73, annualTEU: 22_000_000, baseCongestion: 0.55, avgWaitDays: 1.5, baseVesselsAtAnchor: 32, throughputTrend: 'stable', topTradePartners: ['JP', 'KR', 'US', 'AU', 'BR'] },
  { id: 'rotterdam', name: 'Rotterdam', country: 'NL', lat: 51.90, lon: 4.50, annualTEU: 15_000_000, baseCongestion: 0.45, avgWaitDays: 0.9, baseVesselsAtAnchor: 18, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'GB', 'DE', 'RU'] },
  { id: 'jeddah', name: 'Jeddah', country: 'SA', lat: 21.49, lon: 39.19, annualTEU: 7_500_000, baseCongestion: 0.40, avgWaitDays: 0.8, baseVesselsAtAnchor: 12, throughputTrend: 'up', topTradePartners: ['CN', 'IN', 'EG', 'US', 'AE'] },
  { id: 'jebel-ali', name: 'Jebel Ali (Dubai)', country: 'AE', lat: 25.00, lon: 55.06, annualTEU: 14_000_000, baseCongestion: 0.48, avgWaitDays: 1.0, baseVesselsAtAnchor: 22, throughputTrend: 'up', topTradePartners: ['CN', 'IN', 'SA', 'US', 'DE'] },
  { id: 'port-klang', name: 'Port Klang', country: 'MY', lat: 2.99, lon: 101.39, annualTEU: 14_500_000, baseCongestion: 0.44, avgWaitDays: 0.9, baseVesselsAtAnchor: 16, throughputTrend: 'up', topTradePartners: ['CN', 'SG', 'JP', 'US', 'TH'] },
  { id: 'antwerp', name: 'Antwerp', country: 'BE', lat: 51.22, lon: 4.40, annualTEU: 14_000_000, baseCongestion: 0.50, avgWaitDays: 1.1, baseVesselsAtAnchor: 16, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'GB', 'DE', 'FR'] },
  { id: 'kaohsiung', name: 'Kaohsiung', country: 'TW', lat: 22.62, lon: 120.30, annualTEU: 10_000_000, baseCongestion: 0.38, avgWaitDays: 0.6, baseVesselsAtAnchor: 12, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'JP', 'VN', 'TH'] },
  { id: 'xiamen', name: 'Xiamen', country: 'CN', lat: 24.48, lon: 118.09, annualTEU: 12_000_000, baseCongestion: 0.42, avgWaitDays: 0.8, baseVesselsAtAnchor: 14, throughputTrend: 'up', topTradePartners: ['US', 'JP', 'TW', 'KR', 'PH'] },
  { id: 'hamburg', name: 'Hamburg', country: 'DE', lat: 53.55, lon: 9.99, annualTEU: 8_500_000, baseCongestion: 0.43, avgWaitDays: 0.8, baseVesselsAtAnchor: 10, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'GB', 'PL', 'SE'] },
  { id: 'la-longbeach', name: 'Los Angeles / Long Beach', country: 'US', lat: 33.74, lon: -118.27, annualTEU: 20_000_000, baseCongestion: 0.72, avgWaitDays: 2.5, baseVesselsAtAnchor: 40, throughputTrend: 'stable', topTradePartners: ['CN', 'JP', 'KR', 'TW', 'VN'] },
  { id: 'tanjung-pelepas', name: 'Tanjung Pelepas', country: 'MY', lat: 1.36, lon: 103.55, annualTEU: 11_000_000, baseCongestion: 0.35, avgWaitDays: 0.5, baseVesselsAtAnchor: 8, throughputTrend: 'up', topTradePartners: ['CN', 'SG', 'JP', 'US', 'IN'] },
  { id: 'laem-chabang', name: 'Laem Chabang', country: 'TH', lat: 13.08, lon: 100.88, annualTEU: 9_000_000, baseCongestion: 0.40, avgWaitDays: 0.7, baseVesselsAtAnchor: 11, throughputTrend: 'up', topTradePartners: ['CN', 'JP', 'US', 'VN', 'AU'] },
  { id: 'hochiminh', name: 'Ho Chi Minh City', country: 'VN', lat: 10.77, lon: 106.70, annualTEU: 8_500_000, baseCongestion: 0.55, avgWaitDays: 1.3, baseVesselsAtAnchor: 18, throughputTrend: 'up', topTradePartners: ['CN', 'US', 'JP', 'KR', 'TH'] },
  { id: 'colombo', name: 'Colombo', country: 'LK', lat: 6.93, lon: 79.84, annualTEU: 7_200_000, baseCongestion: 0.45, avgWaitDays: 0.9, baseVesselsAtAnchor: 14, throughputTrend: 'up', topTradePartners: ['CN', 'IN', 'SG', 'AE', 'US'] },
  { id: 'piraeus', name: 'Piraeus', country: 'GR', lat: 37.94, lon: 23.64, annualTEU: 6_000_000, baseCongestion: 0.42, avgWaitDays: 0.7, baseVesselsAtAnchor: 10, throughputTrend: 'up', topTradePartners: ['CN', 'TR', 'IT', 'EG', 'US'] },
  { id: 'valencia', name: 'Valencia', country: 'ES', lat: 39.46, lon: -0.33, annualTEU: 5_600_000, baseCongestion: 0.38, avgWaitDays: 0.6, baseVesselsAtAnchor: 8, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'IT', 'FR', 'TR'] },
  { id: 'felixstowe', name: 'Felixstowe', country: 'GB', lat: 51.96, lon: 1.35, annualTEU: 3_800_000, baseCongestion: 0.50, avgWaitDays: 1.0, baseVesselsAtAnchor: 8, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'NL', 'DE', 'BE'] },
  { id: 'savannah', name: 'Savannah', country: 'US', lat: 32.08, lon: -81.09, annualTEU: 6_000_000, baseCongestion: 0.55, avgWaitDays: 1.2, baseVesselsAtAnchor: 12, throughputTrend: 'up', topTradePartners: ['CN', 'DE', 'IN', 'JP', 'KR'] },
  { id: 'ny-nj', name: 'New York / New Jersey', country: 'US', lat: 40.67, lon: -74.04, annualTEU: 9_500_000, baseCongestion: 0.60, avgWaitDays: 1.8, baseVesselsAtAnchor: 22, throughputTrend: 'stable', topTradePartners: ['CN', 'DE', 'IT', 'IN', 'FR'] },
  { id: 'tokyo', name: 'Tokyo', country: 'JP', lat: 35.65, lon: 139.77, annualTEU: 4_500_000, baseCongestion: 0.35, avgWaitDays: 0.5, baseVesselsAtAnchor: 6, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'KR', 'TW', 'TH'] },
  { id: 'yokohama', name: 'Yokohama', country: 'JP', lat: 35.44, lon: 139.64, annualTEU: 3_000_000, baseCongestion: 0.33, avgWaitDays: 0.5, baseVesselsAtAnchor: 5, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'KR', 'TW', 'AU'] },
  { id: 'osaka', name: 'Osaka', country: 'JP', lat: 34.65, lon: 135.43, annualTEU: 2_400_000, baseCongestion: 0.30, avgWaitDays: 0.4, baseVesselsAtAnchor: 4, throughputTrend: 'stable', topTradePartners: ['CN', 'KR', 'US', 'TW', 'VN'] },
  { id: 'jnpt', name: 'Mumbai (JNPT)', country: 'IN', lat: 18.95, lon: 72.95, annualTEU: 6_000_000, baseCongestion: 0.65, avgWaitDays: 2.0, baseVesselsAtAnchor: 25, throughputTrend: 'up', topTradePartners: ['CN', 'AE', 'US', 'SA', 'SG'] },
  { id: 'chennai', name: 'Chennai', country: 'IN', lat: 13.10, lon: 80.29, annualTEU: 1_800_000, baseCongestion: 0.52, avgWaitDays: 1.4, baseVesselsAtAnchor: 12, throughputTrend: 'up', topTradePartners: ['CN', 'SG', 'MY', 'AE', 'US'] },
  { id: 'santos', name: 'Santos', country: 'BR', lat: -23.95, lon: -46.30, annualTEU: 5_000_000, baseCongestion: 0.58, avgWaitDays: 1.5, baseVesselsAtAnchor: 18, throughputTrend: 'up', topTradePartners: ['CN', 'US', 'AR', 'DE', 'NL'] },
  { id: 'durban', name: 'Durban', country: 'ZA', lat: -29.87, lon: 31.03, annualTEU: 2_800_000, baseCongestion: 0.70, avgWaitDays: 3.0, baseVesselsAtAnchor: 30, throughputTrend: 'down', topTradePartners: ['CN', 'IN', 'US', 'DE', 'JP'] },
  { id: 'mombasa', name: 'Mombasa', country: 'KE', lat: -4.04, lon: 39.67, annualTEU: 1_500_000, baseCongestion: 0.55, avgWaitDays: 2.0, baseVesselsAtAnchor: 10, throughputTrend: 'up', topTradePartners: ['CN', 'IN', 'AE', 'SA', 'JP'] },
  { id: 'lagos', name: 'Lagos (Apapa)', country: 'NG', lat: 6.43, lon: 3.38, annualTEU: 1_200_000, baseCongestion: 0.80, avgWaitDays: 5.0, baseVesselsAtAnchor: 35, throughputTrend: 'stable', topTradePartners: ['CN', 'IN', 'US', 'NL', 'BE'] },
  { id: 'alexandria', name: 'Alexandria', country: 'EG', lat: 31.20, lon: 29.92, annualTEU: 1_800_000, baseCongestion: 0.48, avgWaitDays: 1.2, baseVesselsAtAnchor: 12, throughputTrend: 'stable', topTradePartners: ['CN', 'TR', 'IT', 'SA', 'US'] },
  { id: 'haifa', name: 'Haifa', country: 'IL', lat: 32.82, lon: 34.99, annualTEU: 1_600_000, baseCongestion: 0.40, avgWaitDays: 0.6, baseVesselsAtAnchor: 6, throughputTrend: 'stable', topTradePartners: ['CN', 'TR', 'IT', 'US', 'DE'] },
  { id: 'gdansk', name: 'Gdansk', country: 'PL', lat: 54.35, lon: 18.65, annualTEU: 3_000_000, baseCongestion: 0.42, avgWaitDays: 0.7, baseVesselsAtAnchor: 8, throughputTrend: 'up', topTradePartners: ['CN', 'DE', 'SE', 'GB', 'US'] },
  { id: 'gothenburg', name: 'Gothenburg', country: 'SE', lat: 57.70, lon: 11.97, annualTEU: 800_000, baseCongestion: 0.30, avgWaitDays: 0.3, baseVesselsAtAnchor: 3, throughputTrend: 'stable', topTradePartners: ['DE', 'NL', 'GB', 'CN', 'US'] },
  { id: 'algeciras', name: 'Algeciras', country: 'ES', lat: 36.13, lon: -5.45, annualTEU: 5_100_000, baseCongestion: 0.38, avgWaitDays: 0.5, baseVesselsAtAnchor: 10, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'MA', 'BR', 'TR'] },
  { id: 'barcelona', name: 'Barcelona', country: 'ES', lat: 41.35, lon: 2.17, annualTEU: 3_500_000, baseCongestion: 0.36, avgWaitDays: 0.5, baseVesselsAtAnchor: 7, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'IT', 'FR', 'TR'] },
  { id: 'le-havre', name: 'Le Havre', country: 'FR', lat: 49.49, lon: 0.11, annualTEU: 3_000_000, baseCongestion: 0.40, avgWaitDays: 0.6, baseVesselsAtAnchor: 6, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'GB', 'DE', 'BR'] },
  { id: 'genoa', name: 'Genoa', country: 'IT', lat: 44.41, lon: 8.93, annualTEU: 2_600_000, baseCongestion: 0.44, avgWaitDays: 0.8, baseVesselsAtAnchor: 8, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'TR', 'FR', 'ES'] },
  { id: 'dalian', name: 'Dalian', country: 'CN', lat: 38.92, lon: 121.64, annualTEU: 9_000_000, baseCongestion: 0.48, avgWaitDays: 1.0, baseVesselsAtAnchor: 18, throughputTrend: 'stable', topTradePartners: ['JP', 'KR', 'US', 'AU', 'BR'] },
  { id: 'incheon', name: 'Incheon', country: 'KR', lat: 37.46, lon: 126.62, annualTEU: 3_400_000, baseCongestion: 0.38, avgWaitDays: 0.5, baseVesselsAtAnchor: 8, throughputTrend: 'stable', topTradePartners: ['CN', 'US', 'JP', 'VN', 'TW'] },
  { id: 'tanjung-priok', name: 'Tanjung Priok (Jakarta)', country: 'ID', lat: -6.10, lon: 106.88, annualTEU: 8_000_000, baseCongestion: 0.58, avgWaitDays: 1.5, baseVesselsAtAnchor: 20, throughputTrend: 'up', topTradePartners: ['CN', 'JP', 'SG', 'US', 'KR'] },
  { id: 'manila', name: 'Manila', country: 'PH', lat: 14.58, lon: 120.97, annualTEU: 5_500_000, baseCongestion: 0.62, avgWaitDays: 2.0, baseVesselsAtAnchor: 18, throughputTrend: 'up', topTradePartners: ['CN', 'JP', 'US', 'KR', 'SG'] },
  { id: 'chittagong', name: 'Chittagong', country: 'BD', lat: 22.33, lon: 91.80, annualTEU: 3_200_000, baseCongestion: 0.75, avgWaitDays: 4.0, baseVesselsAtAnchor: 28, throughputTrend: 'up', topTradePartners: ['CN', 'IN', 'SG', 'US', 'JP'] },
]

// ---------------------------------------------------------------------------
// Seeded random for slight variation
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchPortStatus(): Promise<PortStatus[]> {
  return cachedFetch('ports:status', 900, async () => {
    const minuteSeed = Math.floor(Date.now() / 60000)
    const rng = seededRandom(minuteSeed + 77777)

    return PORTS.map((p) => {
      const congestionJitter = (rng() - 0.5) * 0.1
      const anchorJitter = Math.round((rng() - 0.5) * 6)
      const waitJitter = (rng() - 0.5) * 0.4

      return {
        id: p.id,
        name: p.name,
        country: p.country,
        lat: p.lat,
        lon: p.lon,
        annualTEU: p.annualTEU,
        currentCongestion: Math.max(0, Math.min(1, +(p.baseCongestion + congestionJitter).toFixed(2))),
        avgWaitDays: Math.max(0, +(p.avgWaitDays + waitJitter).toFixed(1)),
        vesselsAtAnchor: Math.max(0, p.baseVesselsAtAnchor + anchorJitter),
        throughputTrend: p.throughputTrend,
        topTradePartners: p.topTradePartners,
      }
    })
  })
}
