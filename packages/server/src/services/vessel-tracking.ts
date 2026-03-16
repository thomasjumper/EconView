// ---------------------------------------------------------------------------
// Vessel Tracking Service — simulated realistic vessel data
// ---------------------------------------------------------------------------

import type { VesselPosition, ShippingLane, VesselType, CargoType } from '@econview/shared'
import { cachedFetch } from '../cache/redis.js'

// ---------------------------------------------------------------------------
// Shipping lane definitions with realistic waypoints [lon, lat]
// ---------------------------------------------------------------------------

interface LaneDef {
  id: string
  name: string
  origin: string
  destination: string
  activeVessels: number
  avgTransitDays: number
  estimatedDailyValue: number
  congestionIndex: number
  trend: 'increasing' | 'stable' | 'decreasing'
  cargoType: CargoType
  waypoints: [number, number][]
}

const LANE_DEFS: LaneDef[] = [
  {
    id: 'transpacific-east',
    name: 'Trans-Pacific Eastbound',
    origin: 'East Asia',
    destination: 'US West Coast',
    activeVessels: 85,
    avgTransitDays: 14,
    estimatedDailyValue: 2_100_000_000,
    congestionIndex: 0.62,
    trend: 'increasing',
    cargoType: 'containers',
    waypoints: [
      [121.5, 31.2],   // Shanghai
      [125.0, 33.0],   // East China Sea
      [135.0, 35.0],   // South of Japan
      [155.0, 38.0],   // North Pacific
      [180.0, 40.0],   // Mid-Pacific
      [-160.0, 40.0],  // Eastern Mid-Pacific
      [-140.0, 38.0],  // Approaching US
      [-125.0, 35.0],  // Off California
      [-118.2, 33.7],  // Los Angeles
    ],
  },
  {
    id: 'transpacific-west',
    name: 'Trans-Pacific Westbound',
    origin: 'US West Coast',
    destination: 'East Asia',
    activeVessels: 60,
    avgTransitDays: 14,
    estimatedDailyValue: 800_000_000,
    congestionIndex: 0.38,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [-118.2, 33.7],
      [-130.0, 35.0],
      [-150.0, 38.0],
      [-170.0, 40.0],
      [175.0, 38.0],
      [155.0, 35.0],
      [135.0, 33.0],
      [121.5, 31.2],
    ],
  },
  {
    id: 'asia-europe-suez',
    name: 'Asia→Europe via Suez',
    origin: 'East Asia',
    destination: 'Northern Europe',
    activeVessels: 45,
    avgTransitDays: 28,
    estimatedDailyValue: 1_800_000_000,
    congestionIndex: 0.55,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [121.5, 31.2],   // Shanghai
      [114.2, 22.3],   // Hong Kong
      [104.0, 1.3],    // Singapore Strait
      [80.0, 6.0],     // Sri Lanka
      [55.0, 12.5],    // Gulf of Aden
      [43.0, 12.5],    // Bab el-Mandeb
      [33.0, 30.0],    // Suez Canal
      [30.0, 35.0],    // Eastern Med
      [10.0, 37.0],    // Central Med
      [-5.0, 36.0],    // Gibraltar
      [-9.0, 43.0],    // Bay of Biscay
      [4.0, 51.9],     // Rotterdam
    ],
  },
  {
    id: 'europe-asia-suez',
    name: 'Europe→Asia via Suez',
    origin: 'Northern Europe',
    destination: 'East Asia',
    activeVessels: 35,
    avgTransitDays: 28,
    estimatedDailyValue: 1_200_000_000,
    congestionIndex: 0.48,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [4.0, 51.9],
      [-5.0, 36.0],
      [10.0, 37.0],
      [30.0, 35.0],
      [33.0, 30.0],
      [43.0, 12.5],
      [55.0, 12.5],
      [80.0, 6.0],
      [104.0, 1.3],
      [114.2, 22.3],
      [121.5, 31.2],
    ],
  },
  {
    id: 'transatlantic',
    name: 'Trans-Atlantic',
    origin: 'Northern Europe',
    destination: 'US East Coast',
    activeVessels: 40,
    avgTransitDays: 10,
    estimatedDailyValue: 900_000_000,
    congestionIndex: 0.35,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [4.0, 51.9],     // Rotterdam
      [-5.0, 50.0],    // English Channel
      [-15.0, 48.0],   // Bay of Biscay exit
      [-30.0, 45.0],   // Mid-Atlantic
      [-50.0, 42.0],   // Western Atlantic
      [-70.0, 40.0],   // Approaching US
      [-74.0, 40.7],   // New York
    ],
  },
  {
    id: 'persian-gulf-asia',
    name: 'Persian Gulf→Asia',
    origin: 'Persian Gulf',
    destination: 'East Asia',
    activeVessels: 30,
    avgTransitDays: 18,
    estimatedDailyValue: 3_200_000_000,
    congestionIndex: 0.45,
    trend: 'increasing',
    cargoType: 'crude_oil',
    waypoints: [
      [50.5, 26.2],    // Ras Tanura
      [56.5, 25.0],    // Strait of Hormuz
      [60.0, 22.0],    // Arabian Sea
      [73.0, 15.0],    // Indian Ocean
      [80.0, 6.0],     // Sri Lanka
      [95.0, 2.0],     // Malacca approach
      [104.0, 1.3],    // Singapore Strait
      [114.2, 22.3],   // South China Sea
      [121.5, 31.2],   // Shanghai
    ],
  },
  {
    id: 'persian-gulf-europe',
    name: 'Persian Gulf→Europe',
    origin: 'Persian Gulf',
    destination: 'Northern Europe',
    activeVessels: 25,
    avgTransitDays: 22,
    estimatedDailyValue: 2_000_000_000,
    congestionIndex: 0.42,
    trend: 'stable',
    cargoType: 'crude_oil',
    waypoints: [
      [50.5, 26.2],
      [56.5, 25.0],
      [48.0, 12.0],    // Gulf of Aden
      [43.0, 12.5],    // Bab el-Mandeb
      [33.0, 30.0],    // Suez Canal
      [15.0, 37.0],    // Central Med
      [-5.0, 36.0],    // Gibraltar
      [-9.0, 43.0],
      [4.0, 51.9],     // Rotterdam
    ],
  },
  {
    id: 'south-america-china',
    name: 'South America→China',
    origin: 'Brazil',
    destination: 'China',
    activeVessels: 20,
    avgTransitDays: 35,
    estimatedDailyValue: 600_000_000,
    congestionIndex: 0.30,
    trend: 'increasing',
    cargoType: 'iron_ore',
    waypoints: [
      [-43.2, -22.9],  // Santos / Rio
      [-30.0, -15.0],  // South Atlantic
      [-5.0, -5.0],    // Equatorial Atlantic
      [20.0, -33.0],   // Cape of Good Hope approach
      [30.0, -30.0],   // Indian Ocean west
      [60.0, -15.0],   // Central Indian Ocean
      [95.0, 2.0],     // Malacca
      [104.0, 1.3],
      [114.2, 22.3],
      [121.5, 31.2],
    ],
  },
  {
    id: 'australia-china',
    name: 'Australia→China',
    origin: 'Western Australia',
    destination: 'China',
    activeVessels: 25,
    avgTransitDays: 12,
    estimatedDailyValue: 800_000_000,
    congestionIndex: 0.35,
    trend: 'stable',
    cargoType: 'iron_ore',
    waypoints: [
      [115.7, -32.0],  // Fremantle / Port Hedland
      [115.0, -20.0],  // NW Australia
      [115.0, -10.0],  // Timor Sea
      [115.0, 0.0],    // South China Sea south
      [114.2, 10.0],   // South China Sea
      [114.2, 22.3],   // Hong Kong
      [121.5, 31.2],   // Shanghai
    ],
  },
  {
    id: 'intra-asia',
    name: 'Intra-Asia',
    origin: 'Various Asian Ports',
    destination: 'Various Asian Ports',
    activeVessels: 70,
    avgTransitDays: 5,
    estimatedDailyValue: 1_500_000_000,
    congestionIndex: 0.52,
    trend: 'increasing',
    cargoType: 'containers',
    waypoints: [
      [121.5, 31.2],   // Shanghai
      [129.0, 35.1],   // Busan
      [135.5, 34.7],   // Osaka
      [121.5, 25.0],   // Taiwan Strait
      [114.2, 22.3],   // Hong Kong
      [106.7, 10.8],   // Ho Chi Minh
      [104.0, 1.3],    // Singapore
      [100.5, 13.7],   // Laem Chabang
    ],
  },
  {
    id: 'west-africa-global',
    name: 'West Africa→Global',
    origin: 'West Africa',
    destination: 'Global',
    activeVessels: 15,
    avgTransitDays: 20,
    estimatedDailyValue: 1_100_000_000,
    congestionIndex: 0.28,
    trend: 'decreasing',
    cargoType: 'crude_oil',
    waypoints: [
      [3.4, 6.4],      // Lagos
      [0.0, 3.0],      // Gulf of Guinea
      [-10.0, 0.0],    // Equatorial Atlantic
      [-25.0, 10.0],   // Mid Atlantic
      [-40.0, 20.0],   // Western Atlantic
      [-60.0, 30.0],   // Approaching US East
      [-74.0, 40.7],   // New York
    ],
  },
  {
    id: 'panama-canal',
    name: 'Panama Canal Transit',
    origin: 'Atlantic',
    destination: 'Pacific',
    activeVessels: 35,
    avgTransitDays: 1,
    estimatedDailyValue: 1_300_000_000,
    congestionIndex: 0.72,
    trend: 'decreasing',
    cargoType: 'containers',
    waypoints: [
      [-79.9, 9.4],    // Atlantic entrance (Colon)
      [-79.7, 9.3],    // Gatun Locks
      [-79.6, 9.2],    // Gatun Lake
      [-79.6, 9.0],    // Continental Divide
      [-79.5, 8.9],    // Pedro Miguel Locks
      [-79.6, 8.95],   // Pacific entrance
    ],
  },
  {
    id: 'cape-good-hope',
    name: 'Cape of Good Hope',
    origin: 'Indian Ocean',
    destination: 'Atlantic',
    activeVessels: 20,
    avgTransitDays: 35,
    estimatedDailyValue: 900_000_000,
    congestionIndex: 0.18,
    trend: 'increasing',
    cargoType: 'crude_oil',
    waypoints: [
      [55.0, 12.5],    // Gulf of Aden
      [50.0, 0.0],     // East African coast
      [40.0, -15.0],   // Mozambique Channel
      [30.0, -30.0],   // South Africa east
      [18.4, -33.9],   // Cape Town
      [0.0, -30.0],    // South Atlantic
      [-20.0, -10.0],  // Mid Atlantic
      [-40.0, 10.0],   // Approaching Americas
    ],
  },
  {
    id: 'baltic-northern-europe',
    name: 'Baltic Sea / Northern Europe',
    origin: 'Baltic Ports',
    destination: 'North Sea Ports',
    activeVessels: 30,
    avgTransitDays: 3,
    estimatedDailyValue: 700_000_000,
    congestionIndex: 0.40,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [24.9, 59.4],    // Tallinn
      [20.0, 57.0],    // Central Baltic
      [14.0, 55.0],    // Danish Straits
      [10.0, 57.0],    // Gothenburg
      [8.0, 54.0],     // German Bight
      [4.0, 51.9],     // Rotterdam
    ],
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    origin: 'Eastern Med',
    destination: 'Western Med',
    activeVessels: 25,
    avgTransitDays: 5,
    estimatedDailyValue: 500_000_000,
    congestionIndex: 0.38,
    trend: 'stable',
    cargoType: 'containers',
    waypoints: [
      [35.0, 31.5],    // Haifa
      [29.9, 31.2],    // Alexandria
      [23.6, 37.9],    // Piraeus
      [16.0, 38.0],    // South Italy
      [9.0, 39.0],     // Sardinia
      [2.2, 41.4],     // Barcelona
      [-0.3, 39.5],    // Valencia
      [-5.3, 36.1],    // Gibraltar approach
    ],
  },
]

// ---------------------------------------------------------------------------
// Vessel name pools
// ---------------------------------------------------------------------------

const VESSEL_NAMES: Record<VesselType, string[]> = {
  container: [
    'MSC Oscar', 'Ever Given', 'HMM Algeciras', 'CMA CGM Jacques Saade', 'OOCL Hong Kong',
    'Cosco Shipping Universe', 'Madrid Maersk', 'MOL Triumph', 'MSC Gulsun', 'Ever Ace',
    'Yang Ming Witness', 'ONE Columba', 'Hapag Lloyd Berlin Express', 'Evergreen Triton',
    'ZIM Antwerp', 'PIL Taurus', 'Wan Hai 613', 'Hyundai Dream', 'K-Line Cosmos',
  ],
  tanker: [
    'Seaways Mulan', 'Hafnia Pegasus', 'Eagle Stavanger', 'Front Alta', 'Nordic Breeze',
    'DHT Mustang', 'Euronav Brugge', 'VLCC Samba', 'Suezmax Stella', 'Navion Hispania',
    'Stena Bulk Inspiration', 'Teekay Phoenix', 'Tsakos Columbia', 'Overseas Mykonos',
  ],
  bulk_carrier: [
    'Mineral Yangfan', 'Cape Aspro', 'Star Bulk Oceanus', 'Golden Ocean Fortuna',
    'Pan Harmony', 'Pacific Basin Everest', 'Oldendorff Carrier', 'Berge Stahl',
    'Vale Beijing', 'Ore Sudbury', 'Newcastlemax Pioneer', 'Capesize Venture',
  ],
  lng: [
    'Mozah', 'Al Mayeda', 'Arctic Princess', 'Gaslog Salem', 'Flex Endeavour',
    'Shell LNG Carrier', 'BP Shipping Gallant', 'Teekay LNG Pioneer',
  ],
  car_carrier: [
    'Glovis Sunrise', 'Siem Confucius', 'Wallenius Sol', 'K-Line Auto Express',
  ],
  cruise: [],
  other: [],
}

const FLAGS = ['PA', 'LR', 'MH', 'HK', 'SG', 'BS', 'MT', 'GR', 'CY', 'NO', 'GB', 'JP', 'KR', 'CN', 'US']

// ---------------------------------------------------------------------------
// Helper: interpolate position along waypoints
// ---------------------------------------------------------------------------

function interpolatePosition(
  waypoints: [number, number][],
  t: number,
): { lon: number; lat: number; heading: number } {
  const totalSegments = waypoints.length - 1
  const segFloat = t * totalSegments
  const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1)
  const segT = segFloat - segIdx

  const [lon1, lat1] = waypoints[segIdx]
  const [lon2, lat2] = waypoints[Math.min(segIdx + 1, waypoints.length - 1)]

  const lon = lon1 + (lon2 - lon1) * segT
  const lat = lat1 + (lat2 - lat1) * segT

  // Calculate heading (bearing) in degrees
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon)
  let heading = (Math.atan2(y, x) * 180) / Math.PI
  heading = (heading + 360) % 360

  return { lon, lat, heading }
}

// ---------------------------------------------------------------------------
// Seeded random for deterministic-ish simulation
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ---------------------------------------------------------------------------
// Vessel type and speed by cargo
// ---------------------------------------------------------------------------

function vesselTypeForCargo(cargo: CargoType): VesselType {
  switch (cargo) {
    case 'crude_oil':
    case 'refined_products':
    case 'chemicals':
      return 'tanker'
    case 'lng':
      return 'lng'
    case 'iron_ore':
    case 'coal':
    case 'grain':
      return 'bulk_carrier'
    case 'vehicles':
      return 'car_carrier'
    case 'containers':
    default:
      return 'container'
  }
}

function speedForType(type: VesselType, rng: () => number): number {
  switch (type) {
    case 'container':
      return 18 + rng() * 4 // 18-22 knots
    case 'tanker':
      return 12 + rng() * 4 // 12-16 knots
    case 'bulk_carrier':
      return 10 + rng() * 5 // 10-15 knots
    case 'lng':
      return 16 + rng() * 3 // 16-19 knots
    case 'car_carrier':
      return 14 + rng() * 4 // 14-18 knots
    default:
      return 12 + rng() * 6
  }
}

function dwtForType(type: VesselType, rng: () => number): number {
  switch (type) {
    case 'container':
      return 80_000 + Math.floor(rng() * 120_000)
    case 'tanker':
      return 100_000 + Math.floor(rng() * 100_000)
    case 'bulk_carrier':
      return 80_000 + Math.floor(rng() * 120_000)
    case 'lng':
      return 60_000 + Math.floor(rng() * 40_000)
    case 'car_carrier':
      return 20_000 + Math.floor(rng() * 30_000)
    default:
      return 30_000 + Math.floor(rng() * 50_000)
  }
}

function estimatedValueForCargo(cargo: CargoType, dwt: number): number {
  // Rough $/tonne estimates
  const perTonne: Record<CargoType, number> = {
    crude_oil: 500,
    refined_products: 700,
    lng: 600,
    coal: 120,
    iron_ore: 110,
    grain: 300,
    containers: 2000, // per tonne of containerized goods
    vehicles: 15000,
    chemicals: 1200,
    unknown: 400,
  }
  return Math.round(dwt * (perTonne[cargo] || 400) * 0.6) // assume ~60% load factor
}

// ---------------------------------------------------------------------------
// Generate vessels
// ---------------------------------------------------------------------------

function generateVessels(): VesselPosition[] {
  // Use minute-resolution seed so positions shift every minute
  const minuteSeed = Math.floor(Date.now() / 60000)
  const rng = seededRandom(minuteSeed)

  const vessels: VesselPosition[] = []
  let mmsiCounter = 211000000

  // Distribute ~50 vessels across lanes proportional to activeVessels
  const totalActive = LANE_DEFS.reduce((s, l) => s + l.activeVessels, 0)
  const TARGET = 50

  for (const lane of LANE_DEFS) {
    const count = Math.max(1, Math.round((lane.activeVessels / totalActive) * TARGET))
    const vType = vesselTypeForCargo(lane.cargoType)
    const namePool = VESSEL_NAMES[vType]

    for (let i = 0; i < count && vessels.length < TARGET; i++) {
      const t = rng() // position along lane 0-1
      const { lon, lat, heading } = interpolatePosition(lane.waypoints, t)

      // Add small jitter to avoid overlap
      const jitterLon = (rng() - 0.5) * 2
      const jitterLat = (rng() - 0.5) * 1

      const speed = speedForType(vType, rng)
      const dwt = dwtForType(vType, rng)
      const flag = FLAGS[Math.floor(rng() * FLAGS.length)]
      const name = namePool.length > 0
        ? namePool[Math.floor(rng() * namePool.length)]
        : `Vessel ${mmsiCounter}`

      const etaDays = Math.round((1 - t) * lane.avgTransitDays)
      const eta = new Date(Date.now() + etaDays * 86400000).toISOString()

      vessels.push({
        mmsi: String(mmsiCounter++),
        name,
        type: vType,
        lat: Math.round((lat + jitterLat) * 10000) / 10000,
        lon: Math.round((lon + jitterLon) * 10000) / 10000,
        heading: Math.round(heading * 10) / 10,
        speed: Math.round(speed * 10) / 10,
        destination: lane.destination,
        origin: lane.origin,
        eta,
        cargo: lane.cargoType,
        estimatedValue: estimatedValueForCargo(lane.cargoType, dwt),
        dwt,
        flag,
      })
    }
  }

  return vessels
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchVesselPositions(): Promise<VesselPosition[]> {
  return cachedFetch('vessels:positions', 300, async () => generateVessels())
}

export async function fetchShippingLanes(): Promise<ShippingLane[]> {
  return cachedFetch('vessels:lanes', 300, async () => {
    // Add slight per-fetch variation to congestion and vessel counts
    const minuteSeed = Math.floor(Date.now() / 60000)
    const rng = seededRandom(minuteSeed + 9999)

    return LANE_DEFS.map((lane) => {
      const vesselJitter = Math.round((rng() - 0.5) * 6)
      const congestionJitter = (rng() - 0.5) * 0.08
      return {
        id: lane.id,
        name: lane.name,
        origin: lane.origin,
        destination: lane.destination,
        activeVessels: Math.max(1, lane.activeVessels + vesselJitter),
        avgTransitDays: lane.avgTransitDays,
        estimatedDailyValue: lane.estimatedDailyValue,
        congestionIndex: Math.max(0, Math.min(1, lane.congestionIndex + congestionJitter)),
        waypoints: lane.waypoints,
        trend: lane.trend,
        cargoType: lane.cargoType,
      }
    })
  })
}
