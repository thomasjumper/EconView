export interface CrisisPreset {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  focusSymbols?: string[]
  suggestedMode?: string
}

export const CRISIS_PRESETS: CrisisPreset[] = [
  {
    id: 'covid-crash',
    name: 'COVID Crash',
    description: 'The fastest bear market in history. S&P 500 fell 34% in 23 trading days before Fed intervention.',
    startDate: new Date('2020-02-10'),
    endDate: new Date('2020-04-30'),
    focusSymbols: ['SPY', 'QQQ', 'VIX'],
    suggestedMode: 'risk',
  },
  {
    id: 'svb-collapse',
    name: 'SVB Collapse',
    description: 'Silicon Valley Bank failed in the largest US bank failure since 2008, triggering contagion fears.',
    startDate: new Date('2023-03-01'),
    endDate: new Date('2023-04-15'),
    focusSymbols: ['KRE', 'XLF', 'JPM'],
    suggestedMode: 'risk',
  },
  {
    id: 'rate-hike-2022',
    name: '2022 Rate Hike Cycle',
    description: 'The Fed raised rates from 0% to 4.5% in a single year, the most aggressive tightening since the 1980s.',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2022-12-31'),
    focusSymbols: ['TLT', 'SPY', 'QQQ'],
    suggestedMode: 'heat',
  },
  {
    id: 'crypto-winter-2022',
    name: 'Crypto Winter 2022',
    description: 'Terra/Luna collapse triggered cascading failures across crypto — 3AC, Celsius, Voyager, and finally FTX.',
    startDate: new Date('2022-05-01'),
    endDate: new Date('2022-12-31'),
    focusSymbols: ['BTC', 'ETH', 'SOL'],
    suggestedMode: 'flow',
  },
  {
    id: 'ukraine-invasion',
    name: 'Ukraine Invasion Impact',
    description: 'Russia invades Ukraine, sending energy and grain prices surging and reshaping global trade.',
    startDate: new Date('2022-02-20'),
    endDate: new Date('2022-06-30'),
    focusSymbols: ['XLE', 'DBA', 'EWZ'],
    suggestedMode: 'risk',
  },
  {
    id: 'post-covid-recovery',
    name: 'Post-COVID Recovery',
    description: 'Massive fiscal and monetary stimulus drives the fastest market recovery in history.',
    startDate: new Date('2020-04-01'),
    endDate: new Date('2020-12-31'),
    focusSymbols: ['SPY', 'QQQ', 'IWM'],
    suggestedMode: 'flow',
  },
]
