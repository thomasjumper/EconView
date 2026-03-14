import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function seed() {
  console.log('[Seed] Starting data backfill...')

  // 1. Fetch and log World Bank GDP data
  const { fetchGDP } = await import('../src/services/worldbank.js')
  const gdpData = await fetchGDP()
  console.log(`[Seed] World Bank: ${gdpData.length} countries loaded`)

  // 2. Fetch and log FRED yield curve
  const { fetchYieldCurve } = await import('../src/services/fred.js')
  const yields = await fetchYieldCurve()
  const seriesCount = Object.keys(yields.series).length
  console.log(`[Seed] FRED: ${seriesCount} yield series loaded`)

  // 3. Log summary
  console.log('[Seed] Initial data seeded successfully')
  console.log('[Seed] GDP data cached for 30 minutes')
  console.log('[Seed] Yield data cached for 5 minutes')

  process.exit(0)
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err)
  process.exit(1)
})
