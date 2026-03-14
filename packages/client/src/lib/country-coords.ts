/**
 * Geographic coordinates (capital city locations) for country nodes.
 * Used to position country markers on the 3D globe surface at the global zoom level.
 */

export const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  USA: { lat: 38.9, lon: -77.0 },   // Washington DC
  CHN: { lat: 39.9, lon: 116.4 },   // Beijing
  DEU: { lat: 52.5, lon: 13.4 },    // Berlin
  JPN: { lat: 35.7, lon: 139.7 },   // Tokyo
  GBR: { lat: 51.5, lon: -0.1 },    // London
  FRA: { lat: 48.9, lon: 2.3 },     // Paris
  IND: { lat: 28.6, lon: 77.2 },    // New Delhi
  BRA: { lat: -15.8, lon: -47.9 },  // Brasilia
  CAN: { lat: 45.4, lon: -75.7 },   // Ottawa
  AUS: { lat: -35.3, lon: 149.1 },  // Canberra
  KOR: { lat: 37.6, lon: 127.0 },   // Seoul
  ITA: { lat: 41.9, lon: 12.5 },    // Rome
  RUS: { lat: 55.8, lon: 37.6 },    // Moscow
  MEX: { lat: 19.4, lon: -99.1 },   // Mexico City
  ESP: { lat: 40.4, lon: -3.7 },    // Madrid
  IDN: { lat: -6.2, lon: 106.8 },   // Jakarta
  NLD: { lat: 52.4, lon: 4.9 },     // Amsterdam
  SAU: { lat: 24.7, lon: 46.7 },    // Riyadh
  TUR: { lat: 39.9, lon: 32.9 },    // Ankara
  CHE: { lat: 46.9, lon: 7.4 },     // Bern
  POL: { lat: 52.2, lon: 21.0 },    // Warsaw
  SWE: { lat: 59.3, lon: 18.1 },    // Stockholm
  BEL: { lat: 50.8, lon: 4.4 },     // Brussels
  NOR: { lat: 59.9, lon: 10.8 },    // Oslo
  AUT: { lat: 48.2, lon: 16.4 },    // Vienna
  ARE: { lat: 24.5, lon: 54.7 },    // Abu Dhabi
  ISR: { lat: 31.8, lon: 35.2 },    // Jerusalem
  NGA: { lat: 9.1, lon: 7.5 },      // Abuja
  THA: { lat: 13.8, lon: 100.5 },   // Bangkok
  SGP: { lat: 1.3, lon: 103.8 },    // Singapore
  PHL: { lat: 14.6, lon: 121.0 },   // Manila
  MYS: { lat: 3.1, lon: 101.7 },    // Kuala Lumpur
  DNK: { lat: 55.7, lon: 12.6 },    // Copenhagen
  IRL: { lat: 53.3, lon: -6.3 },    // Dublin
  HKG: { lat: 22.3, lon: 114.2 },   // Hong Kong
  COL: { lat: 4.7, lon: -74.1 },    // Bogota
  ZAF: { lat: -25.7, lon: 28.2 },   // Pretoria
  EGY: { lat: 30.0, lon: 31.2 },    // Cairo
  CHL: { lat: -33.4, lon: -70.7 },  // Santiago
  FIN: { lat: 60.2, lon: 24.9 },    // Helsinki
  VNM: { lat: 21.0, lon: 105.9 },   // Hanoi
  BGD: { lat: 23.8, lon: 90.4 },    // Dhaka
  ARG: { lat: -34.6, lon: -58.4 },  // Buenos Aires
  PRT: { lat: 38.7, lon: -9.1 },    // Lisbon
  NZL: { lat: -41.3, lon: 174.8 },  // Wellington
  CZE: { lat: 50.1, lon: 14.4 },    // Prague
  QAT: { lat: 25.3, lon: 51.5 },    // Doha
  KAZ: { lat: 51.2, lon: 71.4 },    // Astana
  PER: { lat: -12.0, lon: -77.0 },  // Lima
  PAK: { lat: 33.7, lon: 73.0 },    // Islamabad
  TWN: { lat: 25.0, lon: 121.5 },   // Taipei
}

/**
 * Convert latitude/longitude to 3D Cartesian coordinates on a sphere.
 * Returns [x, y, z] tuple.
 */
export function latLonToSphere(
  lat: number,
  lon: number,
  radius: number,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}
