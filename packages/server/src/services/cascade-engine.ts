import type { EconomicEvent, CascadeStep } from './event-detector.js'

// ── AI Text Generation (optional) ────────────────────────────────────────

async function generateMechanism(context: string): Promise<string | null> {
  const ollamaUrl = process.env.OLLAMA_URL
  if (!ollamaUrl) return null

  try {
    const { default: axios } = await import('axios')
    const model = process.env.OLLAMA_MODEL || 'qwen3:14b'
    const response = await axios.post(
      `${ollamaUrl}/api/chat`,
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst. Given an economic cascade step context, write ONE concise sentence (max 25 words) describing the mechanism. No preamble, just the sentence.',
          },
          { role: 'user', content: context },
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 80 },
      },
      { timeout: 15_000 },
    )
    let text = response.data.message?.content ?? ''
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    return text || null
  } catch {
    return null
  }
}

async function mechanism(template: string, aiContext?: string): Promise<string> {
  if (aiContext) {
    const aiText = await generateMechanism(aiContext)
    if (aiText) return aiText
  }
  return template
}

// ── Cascade Templates ────────────────────────────────────────────────────

async function cascadeShippingDisruption(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  const affectedLane = event.affectedEntities?.[0] || 'GLOBAL_SHIPPING'

  return [
    {
      order: 1,
      entity: affectedLane,
      entityType: 'shipping_lane',
      impact: 'negative',
      magnitude: 0.8,
      mechanism: await mechanism(
        'Port congestion spikes as vessels queue at alternative routes, raising demurrage costs',
        `Shipping disruption: immediate impact on ${affectedLane}`,
      ),
      estimatedDelay: 'immediate',
      confidence: 0.9,
    },
    {
      order: 2,
      entity: 'CAPE_ROUTE',
      entityType: 'shipping_lane',
      impact: 'negative',
      magnitude: 0.5,
      mechanism: await mechanism(
        'Alternative routes (e.g., Cape of Good Hope) see 40-60% traffic increase, straining capacity',
        'Rerouting effect on alternative shipping lanes',
      ),
      estimatedDelay: 'hours',
      confidence: 0.85,
    },
    {
      order: 3,
      entity: 'crude_oil',
      entityType: 'commodity',
      impact: 'positive',
      magnitude: 0.35,
      mechanism: await mechanism(
        'Commodity prices for goods transiting disrupted route spike on supply uncertainty',
        'Commodity price impact from shipping disruption',
      ),
      estimatedDelay: 'days',
      confidence: 0.8,
    },
    {
      order: 4,
      entity: 'EUR',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.25,
      mechanism: await mechanism(
        'Importing countries face higher logistics costs and delayed inventory replenishment',
        'Import cost impact on European economies from shipping disruption',
      ),
      estimatedDelay: 'weeks',
      confidence: 0.7,
    },
    {
      order: 5,
      entity: 'CONSUMER_GOODS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.20,
      mechanism: await mechanism(
        'Prolonged disruption feeds into consumer prices and puts upward pressure on inflation',
        'Inflation transmission from shipping disruption after months',
      ),
      estimatedDelay: 'months',
      confidence: 0.55,
    },
  ]
}

async function cascadeCommodityShock(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  const commodity = event.affectedEntities?.[0] || 'crude_oil'

  return [
    {
      order: 1,
      entity: commodity,
      entityType: 'commodity',
      impact: 'positive',
      magnitude: 0.85,
      mechanism: await mechanism(
        'Futures contracts for the affected commodity spike on supply shock expectations',
        `Immediate commodity futures impact: ${commodity} supply shock`,
      ),
      estimatedDelay: 'immediate',
      confidence: 0.92,
    },
    {
      order: 2,
      entity: 'RUB',
      entityType: 'currency',
      impact: 'positive',
      magnitude: 0.4,
      mechanism: await mechanism(
        'Currencies of producing countries strengthen as export revenues surge',
        `Currency impact on commodity-exporting nations from ${commodity} shock`,
      ),
      estimatedDelay: 'hours',
      confidence: 0.75,
    },
    {
      order: 3,
      entity: 'ENERGY',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.5,
      mechanism: await mechanism(
        'Energy and materials sectors repriced as input costs surge across the value chain',
        `Sector repricing from ${commodity} shock`,
      ),
      estimatedDelay: 'days',
      confidence: 0.8,
    },
    {
      order: 4,
      entity: 'INDUSTRIALS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.35,
      mechanism: await mechanism(
        'Downstream sectors (transport, manufacturing) face margin compression from higher input costs',
        `Downstream industrial impact from ${commodity} shock after weeks`,
      ),
      estimatedDelay: 'weeks',
      confidence: 0.7,
    },
    {
      order: 5,
      entity: 'USA',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.25,
      mechanism: await mechanism(
        'Consumer prices rise, central banks face pressure to maintain tighter policy for longer',
        `Macro inflation impact from ${commodity} shock after months`,
      ),
      estimatedDelay: 'months',
      confidence: 0.55,
    },
  ]
}

async function cascadeCurrencyCrisis(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  const affectedCountry = event.affectedEntities?.[0] || 'EMK'
  const currency = event.affectedEntities?.[1] || 'EM_FX'

  return [
    {
      order: 1,
      entity: affectedCountry,
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.8,
      mechanism: await mechanism(
        'Capital flight accelerates as investors liquidate local-currency assets and repatriate to safe havens',
        `Capital flight from ${affectedCountry} during currency crisis`,
      ),
      estimatedDelay: 'immediate',
      confidence: 0.9,
    },
    {
      order: 2,
      entity: currency,
      entityType: 'currency',
      impact: 'negative',
      magnitude: 0.6,
      mechanism: await mechanism(
        'Contagion spreads to neighboring emerging-market currencies through risk-off sentiment',
        `EM contagion from ${affectedCountry} currency crisis`,
      ),
      estimatedDelay: 'hours',
      confidence: 0.8,
    },
    {
      order: 3,
      entity: affectedCountry,
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.55,
      mechanism: await mechanism(
        'Imported inflation spikes as weaker currency raises cost of foreign goods and energy',
        `Imported inflation in ${affectedCountry} from currency devaluation`,
      ),
      estimatedDelay: 'days',
      confidence: 0.85,
    },
    {
      order: 4,
      entity: `${affectedCountry}_CB`,
      entityType: 'country',
      impact: 'neutral',
      magnitude: 0.7,
      mechanism: await mechanism(
        'Central bank implements emergency rate hike and deploys FX reserves to stabilize the currency',
        `Central bank emergency response in ${affectedCountry}`,
      ),
      estimatedDelay: 'weeks',
      confidence: 0.75,
    },
    {
      order: 5,
      entity: affectedCountry,
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.3,
      mechanism: await mechanism(
        'Trade balance adjusts over time; IMF intervention becomes possible if reserves deplete',
        `Long-term adjustment in ${affectedCountry} after currency crisis`,
      ),
      estimatedDelay: 'months',
      confidence: 0.5,
    },
  ]
}

async function cascadeTradePolicy(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  const source = event.affectedEntities?.[0] || 'USA'
  const target = event.affectedEntities?.[1] || 'EUR'

  return [
    {
      order: 1,
      entity: `${source}_${target}_TRADE`,
      entityType: 'shipping_lane',
      impact: 'negative',
      magnitude: 0.6,
      mechanism: await mechanism(
        `Trade volumes between ${source} and ${target} drop sharply as tariffs make bilateral trade uneconomical`,
        `Immediate trade volume impact from ${source}-${target} tariff war`,
      ),
      estimatedDelay: 'immediate',
      confidence: 0.88,
    },
    {
      order: 2,
      entity: target,
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.45,
      mechanism: await mechanism(
        `Retaliatory tariffs trigger tit-for-tat escalation, both economies face higher import costs`,
        `Retaliation impact in ${source}-${target} trade war`,
      ),
      estimatedDelay: 'days',
      confidence: 0.82,
    },
    {
      order: 3,
      entity: 'CONSUMER_GOODS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.35,
      mechanism: await mechanism(
        'Consumer-facing sectors pass through higher costs, reducing demand and compressing margins',
        'Consumer sector impact from tariff escalation',
      ),
      estimatedDelay: 'weeks',
      confidence: 0.7,
    },
    {
      order: 4,
      entity: source,
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.25,
      mechanism: await mechanism(
        'Both economies see GDP drag as trade diversion costs exceed tariff revenue',
        `Long-term GDP impact from ${source}-${target} trade war`,
      ),
      estimatedDelay: 'months',
      confidence: 0.6,
    },
  ]
}

async function cascadeGeopolitical(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  return [
    {
      order: 1,
      entity: 'SEMICONDUCTORS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.9,
      mechanism: await mechanism(
        'Global semiconductor supply chain disrupted as TSMC production at risk',
        'Semiconductor supply disruption from Taiwan strait closure',
      ),
      estimatedDelay: 'immediate',
      confidence: 0.92,
    },
    {
      order: 2,
      entity: 'INTRA_ASIA',
      entityType: 'shipping_lane',
      impact: 'negative',
      magnitude: 0.85,
      mechanism: await mechanism(
        'Taiwan Strait closure forces massive rerouting of intra-Asian shipping, adding days to transit',
        'Shipping lane closure impact on Asian trade routes',
      ),
      estimatedDelay: 'immediate',
      confidence: 0.9,
    },
    {
      order: 3,
      entity: 'TECHNOLOGY',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.7,
      mechanism: await mechanism(
        'Tech stocks sell off globally as chip shortage fears trigger inventory hoarding',
        'Technology sector impact from semiconductor supply crisis',
      ),
      estimatedDelay: 'hours',
      confidence: 0.85,
    },
    {
      order: 4,
      entity: 'CHN',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.55,
      mechanism: await mechanism(
        'International sanctions and capital flight pressure Chinese economy and currency',
        'Chinese economic impact from Taiwan strait crisis',
      ),
      estimatedDelay: 'days',
      confidence: 0.7,
    },
    {
      order: 5,
      entity: 'USA',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.4,
      mechanism: await mechanism(
        'US faces dual shock of supply disruption and military spending surge, safe havens rally',
        'US macro impact from Taiwan strait military crisis',
      ),
      estimatedDelay: 'weeks',
      confidence: 0.6,
    },
  ]
}

async function cascadeCentralBankAction(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  return [
    {
      order: 1,
      entity: 'US_TREASURIES',
      entityType: 'sector',
      impact: 'positive',
      magnitude: 0.7,
      mechanism: await mechanism(
        'Bond prices surge as emergency rate cut signals severe economic concern',
        'Treasury market reaction to emergency Fed rate cut',
      ),
      estimatedDelay: 'immediate',
      confidence: 0.9,
    },
    {
      order: 2,
      entity: 'USD',
      entityType: 'currency',
      impact: 'negative',
      magnitude: 0.5,
      mechanism: await mechanism(
        'Dollar weakens on lower rate expectations, narrowing yield advantage over other currencies',
        'Dollar impact from Fed emergency rate cut',
      ),
      estimatedDelay: 'hours',
      confidence: 0.8,
    },
    {
      order: 3,
      entity: 'EQUITIES',
      entityType: 'sector',
      impact: 'positive',
      magnitude: 0.4,
      mechanism: await mechanism(
        'Equities rally on lower discount rates, but gains tempered by what prompted the emergency action',
        'Equity market response to emergency monetary easing',
      ),
      estimatedDelay: 'days',
      confidence: 0.65,
    },
    {
      order: 4,
      entity: 'REAL_ESTATE',
      entityType: 'sector',
      impact: 'positive',
      magnitude: 0.3,
      mechanism: await mechanism(
        'Mortgage rates decline, supporting housing activity and refinancing wave',
        'Housing market impact from emergency rate cut',
      ),
      estimatedDelay: 'weeks',
      confidence: 0.6,
    },
  ]
}

async function cascadeNaturalDisaster(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  return [
    {
      order: 1,
      entity: 'crude_oil',
      entityType: 'commodity',
      impact: 'positive',
      magnitude: 0.75,
      mechanism: await mechanism(
        'Gulf Coast refinery shutdowns remove 30% of US refining capacity, gasoline futures spike',
        'Refinery capacity loss from Houston hurricane',
      ),
      estimatedDelay: 'immediate',
      confidence: 0.9,
    },
    {
      order: 2,
      entity: 'ENERGY',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.6,
      mechanism: await mechanism(
        'Energy companies face massive property damage and production losses despite higher prices',
        'Energy sector damage from hurricane infrastructure destruction',
      ),
      estimatedDelay: 'hours',
      confidence: 0.85,
    },
    {
      order: 3,
      entity: 'INSURANCE',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.5,
      mechanism: await mechanism(
        'Insurance and reinsurance companies face billions in claims, triggering sector repricing',
        'Insurance sector impact from catastrophic hurricane',
      ),
      estimatedDelay: 'days',
      confidence: 0.8,
    },
    {
      order: 4,
      entity: 'USA',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.35,
      mechanism: await mechanism(
        'GDP takes temporary hit from lost output, partially offset by reconstruction spending',
        'Macro GDP impact from major natural disaster',
      ),
      estimatedDelay: 'weeks',
      confidence: 0.7,
    },
    {
      order: 5,
      entity: 'CONSUMER_GOODS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.2,
      mechanism: await mechanism(
        'Higher energy costs feed into transportation and consumer goods prices nationwide',
        'Downstream consumer price impact from refinery disruption',
      ),
      estimatedDelay: 'months',
      confidence: 0.55,
    },
  ]
}

// ── Default/Generic cascade ──────────────────────────────────────────────

async function cascadeGeneric(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  return [
    {
      order: 1,
      entity: event.affectedEntities?.[0] || 'GLOBAL',
      entityType: 'country',
      impact: 'negative',
      magnitude: 0.4,
      mechanism: `Initial shock impacts ${event.affectedEntities?.[0] || 'affected region'} directly`,
      estimatedDelay: 'immediate',
      confidence: 0.6,
    },
    {
      order: 2,
      entity: 'GLOBAL_MARKETS',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.25,
      mechanism: 'Risk sentiment spreads to global financial markets through correlated asset flows',
      estimatedDelay: 'hours',
      confidence: 0.5,
    },
    {
      order: 3,
      entity: 'TRADE',
      entityType: 'sector',
      impact: 'negative',
      magnitude: 0.2,
      mechanism: 'Broader economic adjustment as trade and investment flows recalibrate',
      estimatedDelay: 'weeks',
      confidence: 0.4,
    },
  ]
}

// ── Public API ───────────────────────────────────────────────────────────

export async function simulateCascade(event: Partial<EconomicEvent>): Promise<CascadeStep[]> {
  const eventType = event.type || 'generic'

  switch (eventType) {
    case 'shipping_disruption':
      return cascadeShippingDisruption(event)
    case 'commodity_shock':
      return cascadeCommodityShock(event)
    case 'currency_crisis':
      return cascadeCurrencyCrisis(event)
    case 'trade_policy':
      return cascadeTradePolicy(event)
    case 'geopolitical':
      return cascadeGeopolitical(event)
    case 'central_bank_action':
      return cascadeCentralBankAction(event)
    case 'natural_disaster':
      return cascadeNaturalDisaster(event)
    default:
      return cascadeGeneric(event)
  }
}
