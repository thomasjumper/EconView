export type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

export interface CountryRiskResult {
  countryCode: string
  countryName: string
  riskScore: number // 0-100
  factors: {
    gdpGrowthRisk: number
    yieldCurveRisk: number
    tradeDependencyRisk: number
  }
}

export interface MarketRiskResult {
  threatLevel: ThreatLevel
  riskScore: number // 0-100
  yieldSpread: number
  fedFundsRate: number
  factors: string[]
}

export interface RecessionProbabilityResult {
  probability: number // 0-100
  factors: {
    yieldCurveContribution: number
    gdpDecelerationContribution: number
  }
  signal: 'none' | 'watch' | 'warning' | 'alert'
}

interface YieldData {
  DGS2?: { date: string; value: number }[]
  DGS5?: { date: string; value: number }[]
  DGS10?: { date: string; value: number }[]
  DGS30?: { date: string; value: number }[]
  FEDFUNDS?: { date: string; value: number }[]
}

interface CountryData {
  code: string
  name: string
  gdp: number | null
  gdpGrowth?: number | null
  population?: number | null
  topTradePartnerShare?: number // 0-1, how much of trade goes to #1 partner
}

function getLatestValue(series?: { date: string; value: number }[]): number | null {
  if (!series || series.length === 0) return null
  return series[series.length - 1].value
}

/**
 * Compute risk score for a specific country.
 */
export function computeCountryRisk(
  countryData: CountryData,
  yields?: YieldData,
): CountryRiskResult {
  let riskScore = 30 // baseline

  // GDP growth factor: negative growth = high risk
  const gdpGrowth = countryData.gdpGrowth ?? 2.0
  let gdpGrowthRisk = 0
  if (gdpGrowth < 0) {
    gdpGrowthRisk = Math.min(40, Math.abs(gdpGrowth) * 10)
  } else if (gdpGrowth < 1) {
    gdpGrowthRisk = 20
  } else if (gdpGrowth < 2) {
    gdpGrowthRisk = 10
  }

  // Yield curve inversion factor (only applies to countries with yield data, primarily US)
  let yieldCurveRisk = 0
  if (yields) {
    const twoYear = getLatestValue(yields.DGS2)
    const tenYear = getLatestValue(yields.DGS10)
    if (twoYear !== null && tenYear !== null) {
      const spread = tenYear - twoYear
      if (spread < 0) {
        // Inverted — higher risk
        yieldCurveRisk = Math.min(30, Math.abs(spread) * 20)
      } else if (spread < 0.5) {
        yieldCurveRisk = 10
      }
    }
  }

  // Trade dependency concentration
  let tradeDependencyRisk = 0
  const tradeShare = countryData.topTradePartnerShare ?? 0.15
  if (tradeShare > 0.4) {
    tradeDependencyRisk = 25
  } else if (tradeShare > 0.3) {
    tradeDependencyRisk = 15
  } else if (tradeShare > 0.2) {
    tradeDependencyRisk = 8
  }

  riskScore = Math.min(100, Math.max(0, gdpGrowthRisk + yieldCurveRisk + tradeDependencyRisk + 10))

  return {
    countryCode: countryData.code,
    countryName: countryData.name,
    riskScore,
    factors: {
      gdpGrowthRisk,
      yieldCurveRisk,
      tradeDependencyRisk,
    },
  }
}

/**
 * Compute overall market risk from yield curve data.
 */
export function computeMarketRisk(yields: YieldData): MarketRiskResult {
  const twoYear = getLatestValue(yields.DGS2)
  const tenYear = getLatestValue(yields.DGS10)
  const fedFunds = getLatestValue(yields.FEDFUNDS)

  const yieldSpread = twoYear !== null && tenYear !== null ? tenYear - twoYear : 0
  const fedFundsRate = fedFunds ?? 0

  let riskScore = 20 // baseline
  const factors: string[] = []

  // Yield curve spread
  if (yieldSpread < -0.5) {
    riskScore += 35
    factors.push('Deep yield curve inversion')
  } else if (yieldSpread < 0) {
    riskScore += 25
    factors.push('Yield curve inverted')
  } else if (yieldSpread < 0.25) {
    riskScore += 15
    factors.push('Flat yield curve')
  }

  // Fed funds rate level
  if (fedFundsRate > 5.5) {
    riskScore += 25
    factors.push('Very restrictive monetary policy')
  } else if (fedFundsRate > 4.5) {
    riskScore += 15
    factors.push('Restrictive monetary policy')
  } else if (fedFundsRate > 3.0) {
    riskScore += 8
    factors.push('Tight monetary policy')
  }

  // 2Y level (high short rates signal stress)
  if (twoYear !== null && twoYear > 5) {
    riskScore += 10
    factors.push('Elevated short-term rates')
  }

  riskScore = Math.min(100, Math.max(0, riskScore))

  let threatLevel: ThreatLevel
  if (riskScore >= 80) threatLevel = 'critical'
  else if (riskScore >= 60) threatLevel = 'high'
  else if (riskScore >= 40) threatLevel = 'elevated'
  else if (riskScore >= 25) threatLevel = 'moderate'
  else threatLevel = 'low'

  return {
    threatLevel,
    riskScore,
    yieldSpread,
    fedFundsRate,
    factors,
  }
}

/**
 * Compute recession probability from yield curve and GDP data.
 */
export function computeRecessionProbability(
  yields: YieldData,
  gdpData?: { gdp?: number | null; gdpGrowth?: number | null }[],
): RecessionProbabilityResult {
  const twoYear = getLatestValue(yields.DGS2)
  const tenYear = getLatestValue(yields.DGS10)

  // Yield curve inversion contribution
  let yieldCurveContribution = 0
  if (twoYear !== null && tenYear !== null) {
    const spread = tenYear - twoYear
    if (spread < -1.0) {
      yieldCurveContribution = 50
    } else if (spread < -0.5) {
      yieldCurveContribution = 40
    } else if (spread < 0) {
      yieldCurveContribution = 30
    } else if (spread < 0.25) {
      yieldCurveContribution = 15
    }
  }

  // GDP growth deceleration contribution
  let gdpDecelerationContribution = 0
  if (gdpData && gdpData.length > 0) {
    const growthValues = gdpData
      .map((d) => d.gdpGrowth)
      .filter((g): g is number => g !== null && g !== undefined)

    if (growthValues.length > 0) {
      const avgGrowth = growthValues.reduce((a, b) => a + b, 0) / growthValues.length
      if (avgGrowth < 0) {
        gdpDecelerationContribution = 40
      } else if (avgGrowth < 1) {
        gdpDecelerationContribution = 25
      } else if (avgGrowth < 2) {
        gdpDecelerationContribution = 10
      }
    }
  }

  const probability = Math.min(100, Math.max(0, yieldCurveContribution + gdpDecelerationContribution))

  let signal: 'none' | 'watch' | 'warning' | 'alert'
  if (probability >= 70) signal = 'alert'
  else if (probability >= 50) signal = 'warning'
  else if (probability >= 30) signal = 'watch'
  else signal = 'none'

  return {
    probability,
    factors: {
      yieldCurveContribution,
      gdpDecelerationContribution,
    },
    signal,
  }
}
