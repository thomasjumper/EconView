import type { TimelineEvent } from '../store/useTimelineStore'

export const HISTORICAL_EVENTS: TimelineEvent[] = [
  // ── 2020 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2020-02-20'),
    title: 'COVID Market Crash Begins',
    category: 'crisis',
    description: 'Global equity markets begin steep selloff as COVID-19 fears mount.',
    severity: 3,
  },
  {
    date: new Date('2020-03-15'),
    title: 'Fed Emergency Rate Cut to 0%',
    category: 'policy',
    description: 'Federal Reserve slashes rates to 0-0.25% in emergency Sunday meeting.',
    severity: 3,
  },
  {
    date: new Date('2020-03-23'),
    title: 'Market Bottom - S&P 2237',
    category: 'crisis',
    description: 'S&P 500 hits pandemic low of 2,237, down 34% from February highs.',
    severity: 2,
  },
  {
    date: new Date('2020-04-09'),
    title: 'Fed Announces Unlimited QE',
    category: 'policy',
    description: 'Fed commits to unlimited bond purchases and launches multiple lending facilities.',
    severity: 3,
  },

  // ── 2021 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2021-01-27'),
    title: 'GameStop Short Squeeze',
    category: 'crisis',
    description: 'Retail traders on Reddit drive GameStop up 1,700% in weeks, shaking Wall Street.',
    severity: 2,
  },
  {
    date: new Date('2021-11-10'),
    title: 'CPI Hits 6.2% - Inflation Shock',
    category: 'policy',
    description: 'US CPI reaches 6.2% year-over-year, highest in 31 years, sparking inflation fears.',
    severity: 2,
  },

  // ── 2022 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2022-01-03'),
    title: 'S&P All-Time High Before Selloff',
    category: 'crisis',
    description: 'S&P 500 peaks at 4,796 before beginning a prolonged bear market.',
    severity: 2,
  },
  {
    date: new Date('2022-02-24'),
    title: 'Russia Invades Ukraine',
    category: 'geopolitical',
    description: 'Russia launches full-scale invasion of Ukraine, sending energy prices soaring.',
    severity: 3,
  },
  {
    date: new Date('2022-03-16'),
    title: 'Fed Begins Rate Hikes',
    category: 'policy',
    description: 'Federal Reserve raises rates by 25bps, beginning the most aggressive tightening cycle in decades.',
    severity: 3,
  },
  {
    date: new Date('2022-05-09'),
    title: 'Terra/Luna Collapse',
    category: 'crisis',
    description: 'TerraUSD algorithmic stablecoin depegs, wiping out $40B in value.',
    severity: 2,
  },
  {
    date: new Date('2022-06-13'),
    title: 'Crypto Winter - BTC Below $25K',
    category: 'crisis',
    description: 'Bitcoin falls below $25,000 as crypto contagion spreads across the ecosystem.',
    severity: 2,
  },
  {
    date: new Date('2022-09-26'),
    title: 'UK Gilt Crisis - Truss Budget',
    category: 'crisis',
    description: 'UK bond market collapses after PM Truss announces unfunded tax cuts, forcing BoE intervention.',
    severity: 2,
  },
  {
    date: new Date('2022-11-11'),
    title: 'FTX Collapse',
    category: 'crisis',
    description: 'FTX exchange files for bankruptcy, revealing massive fraud and misuse of customer funds.',
    severity: 2,
  },

  // ── 2023 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2023-03-10'),
    title: 'Silicon Valley Bank Collapse',
    category: 'crisis',
    description: 'SVB fails after a bank run triggered by unrealized losses on Treasury holdings.',
    severity: 3,
  },
  {
    date: new Date('2023-03-12'),
    title: 'Signature Bank Fails',
    category: 'crisis',
    description: 'Signature Bank is seized by regulators amid contagion fears from SVB collapse.',
    severity: 2,
  },
  {
    date: new Date('2023-03-19'),
    title: 'Credit Suisse Emergency Merger',
    category: 'crisis',
    description: 'UBS acquires Credit Suisse in emergency $3.2B deal brokered by Swiss government.',
    severity: 2,
  },
  {
    date: new Date('2023-07-26'),
    title: 'Fed Raises to 5.25-5.50%',
    category: 'policy',
    description: 'Federal Reserve raises rates to 5.25-5.50%, the highest level in 22 years.',
    severity: 2,
  },
  {
    date: new Date('2023-10-07'),
    title: 'Israel-Hamas War Begins',
    category: 'geopolitical',
    description: 'Hamas attacks Israel, triggering a major military conflict and Middle East instability.',
    severity: 3,
  },

  // ── 2024 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2024-03-11'),
    title: 'Bitcoin All-Time High $73K',
    category: 'crisis',
    description: 'Bitcoin reaches new all-time high of $73,000 driven by spot ETF inflows.',
    severity: 1,
  },
  {
    date: new Date('2024-09-18'),
    title: 'Fed Begins Rate Cuts',
    category: 'policy',
    description: 'Federal Reserve cuts rates by 50bps, beginning easing cycle after holding at peak.',
    severity: 3,
  },
  {
    date: new Date('2024-11-05'),
    title: 'US Presidential Election',
    category: 'election',
    description: 'US Presidential Election results drive significant market volatility.',
    severity: 3,
  },

  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2025-01-20'),
    title: 'Presidential Inauguration',
    category: 'election',
    description: 'New US President inaugurated, markets react to policy expectations.',
    severity: 2,
  },
  {
    date: new Date('2025-04-02'),
    title: 'Liberation Day Tariffs',
    category: 'geopolitical',
    description: 'Sweeping new tariffs announced on "Liberation Day", rattling global trade.',
    severity: 3,
  },

  // ── 2026 ──────────────────────────────────────────────────────────────
  {
    date: new Date('2026-01-15'),
    title: 'Q4 2025 Earnings Season',
    category: 'earnings',
    description: 'Major tech companies report Q4 2025 earnings amid AI spending scrutiny.',
    severity: 1,
  },
  {
    date: new Date('2026-03-01'),
    title: 'Trade War Escalation',
    category: 'geopolitical',
    description: 'New round of retaliatory tariffs between major economies.',
    severity: 2,
  },
]
