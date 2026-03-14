import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null
let initialized = false

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function getPool(): pg.Pool | null {
  if (pool) return pool

  const url = process.env.TIMESCALE_URL
  if (!url) {
    console.warn('[TimescaleDB] TIMESCALE_URL not set — time-series storage disabled')
    return null
  }

  try {
    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })

    pool.on('error', (err) => {
      console.error('[TimescaleDB] Pool error:', err.message)
    })

    console.log('[TimescaleDB] Connection pool created')
    return pool
  } catch (err) {
    console.error('[TimescaleDB] Failed to create pool:', (err as Error).message)
    return null
  }
}

// ---------------------------------------------------------------------------
// Schema initialization
// ---------------------------------------------------------------------------

export async function initializeSchema(): Promise<void> {
  const db = getPool()
  if (!db) return

  try {
    // Create TimescaleDB extension if available (no-op if already exists)
    await db.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`).catch(() => {
      console.warn('[TimescaleDB] TimescaleDB extension not available — using plain PostgreSQL tables')
    })

    // price_history
    await db.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        time        TIMESTAMPTZ      NOT NULL,
        symbol      TEXT             NOT NULL,
        price       DOUBLE PRECISION NOT NULL,
        volume      BIGINT           DEFAULT 0
      );
    `)

    // yield_history
    await db.query(`
      CREATE TABLE IF NOT EXISTS yield_history (
        time        TIMESTAMPTZ      NOT NULL,
        series      TEXT             NOT NULL,
        value       DOUBLE PRECISION NOT NULL
      );
    `)

    // macro_indicators
    await db.query(`
      CREATE TABLE IF NOT EXISTS macro_indicators (
        time          TIMESTAMPTZ      NOT NULL,
        country_code  TEXT             NOT NULL,
        indicator     TEXT             NOT NULL,
        value         DOUBLE PRECISION NOT NULL
      );
    `)

    // events
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        time        TIMESTAMPTZ NOT NULL,
        title       TEXT        NOT NULL,
        category    TEXT        NOT NULL,
        description TEXT,
        severity    INT         DEFAULT 0
      );
    `)

    // Try to create hypertables (idempotent — will no-op if already exists)
    const hypertables = ['price_history', 'yield_history', 'macro_indicators', 'events']
    for (const table of hypertables) {
      try {
        await db.query(
          `SELECT create_hypertable($1, 'time', if_not_exists => TRUE);`,
          [table],
        )
      } catch {
        // TimescaleDB not available or table already a hypertable — fine
      }
    }

    // Create indexes for common queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_symbol_time ON price_history (symbol, time DESC);
    `)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_yield_history_series_time ON yield_history (series, time DESC);
    `)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_macro_indicators_country_time ON macro_indicators (country_code, indicator, time DESC);
    `)

    initialized = true
    console.log('[TimescaleDB] Schema initialized successfully')
  } catch (err) {
    console.error('[TimescaleDB] Schema initialization failed:', (err as Error).message)
  }
}

// ---------------------------------------------------------------------------
// Insert operations
// ---------------------------------------------------------------------------

export async function insertPriceSnapshot(
  symbol: string,
  price: number,
  volume: number,
): Promise<void> {
  const db = getPool()
  if (!db) return

  try {
    await db.query(
      `INSERT INTO price_history (time, symbol, price, volume) VALUES (NOW(), $1, $2, $3)`,
      [symbol, price, volume],
    )
  } catch (err) {
    console.error(`[TimescaleDB] Failed to insert price for ${symbol}:`, (err as Error).message)
  }
}

export async function insertYieldSnapshot(series: string, value: number): Promise<void> {
  const db = getPool()
  if (!db) return

  try {
    await db.query(
      `INSERT INTO yield_history (time, series, value) VALUES (NOW(), $1, $2)`,
      [series, value],
    )
  } catch (err) {
    console.error(`[TimescaleDB] Failed to insert yield for ${series}:`, (err as Error).message)
  }
}

export async function insertMacroIndicator(
  countryCode: string,
  indicator: string,
  value: number,
): Promise<void> {
  const db = getPool()
  if (!db) return

  try {
    await db.query(
      `INSERT INTO macro_indicators (time, country_code, indicator, value) VALUES (NOW(), $1, $2, $3)`,
      [countryCode, indicator, value],
    )
  } catch (err) {
    console.error(`[TimescaleDB] Failed to insert macro indicator:`, (err as Error).message)
  }
}

// ---------------------------------------------------------------------------
// Query operations
// ---------------------------------------------------------------------------

export interface PriceRecord {
  time: string
  symbol: string
  price: number
  volume: number
}

export interface YieldRecord {
  time: string
  series: string
  value: number
}

export async function getHistoricalPrices(
  symbol: string,
  startDate: Date,
  endDate: Date,
): Promise<PriceRecord[]> {
  const db = getPool()
  if (!db) return []

  try {
    const result = await db.query<PriceRecord>(
      `SELECT time, symbol, price, volume
       FROM price_history
       WHERE symbol = $1 AND time >= $2 AND time <= $3
       ORDER BY time ASC`,
      [symbol, startDate.toISOString(), endDate.toISOString()],
    )
    return result.rows
  } catch (err) {
    console.error(`[TimescaleDB] Failed to query prices for ${symbol}:`, (err as Error).message)
    return []
  }
}

export async function getHistoricalYields(
  series: string,
  startDate: Date,
  endDate: Date,
): Promise<YieldRecord[]> {
  const db = getPool()
  if (!db) return []

  try {
    const result = await db.query<YieldRecord>(
      `SELECT time, series, value
       FROM yield_history
       WHERE series = $1 AND time >= $2 AND time <= $3
       ORDER BY time ASC`,
      [series, startDate.toISOString(), endDate.toISOString()],
    )
    return result.rows
  } catch (err) {
    console.error(`[TimescaleDB] Failed to query yields for ${series}:`, (err as Error).message)
    return []
  }
}

/**
 * Gracefully shut down the pool.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    initialized = false
    console.log('[TimescaleDB] Pool closed')
  }
}
