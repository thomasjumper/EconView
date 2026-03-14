import type { Server as SocketIOServer } from 'socket.io'
import { computeMarketRisk, computeRecessionProbability } from './risk.js'
import { fetchYieldCurve } from './fred.js'
import { fetchGDP } from './worldbank.js'

// ── Types ────────────────────────────────────────────────────────────────

export type AlertType = 'yield_inversion' | 'gdp_contraction' | 'price_spike' | 'sentiment_shift'
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  condition: string // human-readable description
  threshold: number
  active: boolean
}

export interface TriggeredAlert {
  id: string
  ruleId: string
  ruleName: string
  type: AlertType
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  triggeredAt: string
}

// ── Default Rules ────────────────────────────────────────────────────────

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'rule_yield_inversion',
    name: 'Yield Curve Inversion',
    type: 'yield_inversion',
    condition: '2Y-10Y Treasury spread < 0',
    threshold: 0,
    active: true,
  },
  {
    id: 'rule_recession_watch',
    name: 'Recession Watch',
    type: 'gdp_contraction',
    condition: 'Recession probability > 60%',
    threshold: 60,
    active: true,
  },
  {
    id: 'rule_market_stress',
    name: 'Market Stress',
    type: 'price_spike',
    condition: 'Market risk level is high or critical',
    threshold: 60,
    active: true,
  },
]

// ── State ────────────────────────────────────────────────────────────────

let activeAlerts: TriggeredAlert[] = []
let alertRules: AlertRule[] = [...DEFAULT_RULES]

// ── Public API ───────────────────────────────────────────────────────────

export function getAlertRules(): AlertRule[] {
  return alertRules
}

export function getActiveAlerts(): TriggeredAlert[] {
  return activeAlerts
}

/**
 * Evaluate all active rules against current data.
 * Returns newly triggered alerts.
 */
export async function checkAlerts(): Promise<TriggeredAlert[]> {
  const triggered: TriggeredAlert[] = []

  try {
    const yieldData = await fetchYieldCurve()
    const gdpData = await fetchGDP()

    const marketRisk = computeMarketRisk(yieldData.series)
    const recessionProb = computeRecessionProbability(yieldData.series, gdpData)

    for (const rule of alertRules) {
      if (!rule.active) continue

      switch (rule.id) {
        case 'rule_yield_inversion': {
          if (marketRisk.yieldSpread < rule.threshold) {
            triggered.push({
              id: `alert_${rule.id}_${Date.now()}`,
              ruleId: rule.id,
              ruleName: rule.name,
              type: rule.type,
              severity: marketRisk.yieldSpread < -0.5 ? 'critical' : 'warning',
              message: `Yield curve inverted: 2Y-10Y spread at ${marketRisk.yieldSpread.toFixed(2)}%`,
              value: marketRisk.yieldSpread,
              threshold: rule.threshold,
              triggeredAt: new Date().toISOString(),
            })
          }
          break
        }

        case 'rule_recession_watch': {
          if (recessionProb.probability > rule.threshold) {
            triggered.push({
              id: `alert_${rule.id}_${Date.now()}`,
              ruleId: rule.id,
              ruleName: rule.name,
              type: rule.type,
              severity: recessionProb.probability > 80 ? 'critical' : 'warning',
              message: `Recession probability at ${recessionProb.probability.toFixed(0)}%`,
              value: recessionProb.probability,
              threshold: rule.threshold,
              triggeredAt: new Date().toISOString(),
            })
          }
          break
        }

        case 'rule_market_stress': {
          if (marketRisk.riskScore > rule.threshold) {
            triggered.push({
              id: `alert_${rule.id}_${Date.now()}`,
              ruleId: rule.id,
              ruleName: rule.name,
              type: rule.type,
              severity: marketRisk.threatLevel === 'critical' ? 'critical' : 'warning',
              message: `Market stress ${marketRisk.threatLevel}: risk score ${marketRisk.riskScore}/100`,
              value: marketRisk.riskScore,
              threshold: rule.threshold,
              triggeredAt: new Date().toISOString(),
            })
          }
          break
        }
      }
    }
  } catch (err) {
    console.error('[Alerts] Error checking alerts:', (err as Error).message)
  }

  activeAlerts = triggered
  return triggered
}

/**
 * Start periodic alert checking and broadcast via Socket.io.
 */
export function startAlertMonitor(io: SocketIOServer, intervalMs: number = 2 * 60 * 1000) {
  console.log(`[Alerts] Starting alert monitor (interval: ${intervalMs / 1000}s)`)

  const check = async () => {
    const alerts = await checkAlerts()
    if (alerts.length > 0) {
      console.log(`[Alerts] ${alerts.length} alert(s) triggered`)
      io.emit('alerts', alerts)
    }
  }

  // Initial check after 30s (give data services time to warm up)
  setTimeout(check, 30_000)

  // Then check on interval
  setInterval(check, intervalMs)
}
