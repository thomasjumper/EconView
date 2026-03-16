// ---------------------------------------------------------------------------
// Economic Dependency Graph — hardcoded core global economic relationships
// ---------------------------------------------------------------------------

interface DependencyNode {
  id: string
  type: 'country' | 'commodity' | 'sector' | 'shipping_lane' | 'port' | 'currency' | 'company'
  label: string
}

interface DependencyEdge {
  source: string
  target: string
  relationship:
    | 'imports_from'
    | 'exports_to'
    | 'produces'
    | 'consumes'
    | 'transits_via'
    | 'denominated_in'
    | 'headquartered_in'
    | 'supplies'
    | 'holds_debt_of'
    | 'pegged_to'
  weight: number // 0-1 importance
}

// ---------------------------------------------------------------------------
// Build the graph
// ---------------------------------------------------------------------------

export function buildDependencyGraph(): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [
    // Countries
    { id: 'USA', type: 'country', label: 'United States' },
    { id: 'CHN', type: 'country', label: 'China' },
    { id: 'JPN', type: 'country', label: 'Japan' },
    { id: 'DEU', type: 'country', label: 'Germany' },
    { id: 'GBR', type: 'country', label: 'United Kingdom' },
    { id: 'FRA', type: 'country', label: 'France' },
    { id: 'IND', type: 'country', label: 'India' },
    { id: 'BRA', type: 'country', label: 'Brazil' },
    { id: 'CAN', type: 'country', label: 'Canada' },
    { id: 'AUS', type: 'country', label: 'Australia' },
    { id: 'KOR', type: 'country', label: 'South Korea' },
    { id: 'RUS', type: 'country', label: 'Russia' },
    { id: 'SAU', type: 'country', label: 'Saudi Arabia' },
    { id: 'MEX', type: 'country', label: 'Mexico' },
    { id: 'IDN', type: 'country', label: 'Indonesia' },
    { id: 'NLD', type: 'country', label: 'Netherlands' },
    { id: 'SGP', type: 'country', label: 'Singapore' },
    { id: 'ARE', type: 'country', label: 'UAE' },
    { id: 'QAT', type: 'country', label: 'Qatar' },
    { id: 'NGA', type: 'country', label: 'Nigeria' },
    { id: 'ZAF', type: 'country', label: 'South Africa' },
    { id: 'TUR', type: 'country', label: 'Turkey' },
    { id: 'TWN', type: 'country', label: 'Taiwan' },
    { id: 'VNM', type: 'country', label: 'Vietnam' },
    { id: 'THA', type: 'country', label: 'Thailand' },
    { id: 'EGY', type: 'country', label: 'Egypt' },
    { id: 'CHL', type: 'country', label: 'Chile' },
    { id: 'PAN', type: 'country', label: 'Panama' },
    { id: 'NOR', type: 'country', label: 'Norway' },
    { id: 'IRQ', type: 'country', label: 'Iraq' },

    // Commodities
    { id: 'CRUDE_OIL', type: 'commodity', label: 'Crude Oil' },
    { id: 'NATURAL_GAS', type: 'commodity', label: 'Natural Gas' },
    { id: 'LNG', type: 'commodity', label: 'Liquefied Natural Gas' },
    { id: 'IRON_ORE', type: 'commodity', label: 'Iron Ore' },
    { id: 'COPPER', type: 'commodity', label: 'Copper' },
    { id: 'GOLD', type: 'commodity', label: 'Gold' },
    { id: 'WHEAT', type: 'commodity', label: 'Wheat' },
    { id: 'SOYBEANS', type: 'commodity', label: 'Soybeans' },
    { id: 'COAL', type: 'commodity', label: 'Coal' },
    { id: 'LITHIUM', type: 'commodity', label: 'Lithium' },
    { id: 'SEMICONDUCTORS', type: 'commodity', label: 'Semiconductors' },

    // Currencies
    { id: 'USD', type: 'currency', label: 'US Dollar' },
    { id: 'EUR', type: 'currency', label: 'Euro' },
    { id: 'CNY', type: 'currency', label: 'Chinese Yuan' },
    { id: 'JPY', type: 'currency', label: 'Japanese Yen' },
    { id: 'GBP', type: 'currency', label: 'British Pound' },
    { id: 'AUD', type: 'currency', label: 'Australian Dollar' },
    { id: 'CAD', type: 'currency', label: 'Canadian Dollar' },
    { id: 'BRL', type: 'currency', label: 'Brazilian Real' },
    { id: 'INR', type: 'currency', label: 'Indian Rupee' },
    { id: 'KRW', type: 'currency', label: 'South Korean Won' },

    // GICS Sectors
    { id: 'ENERGY', type: 'sector', label: 'Energy' },
    { id: 'MATERIALS', type: 'sector', label: 'Materials' },
    { id: 'INDUSTRIALS', type: 'sector', label: 'Industrials' },
    { id: 'TECH', type: 'sector', label: 'Information Technology' },
    { id: 'FINANCIALS', type: 'sector', label: 'Financials' },
    { id: 'HEALTHCARE', type: 'sector', label: 'Health Care' },
    { id: 'CONSUMER_DISC', type: 'sector', label: 'Consumer Discretionary' },
    { id: 'CONSUMER_STAP', type: 'sector', label: 'Consumer Staples' },
    { id: 'COMM_SERVICES', type: 'sector', label: 'Communication Services' },
    { id: 'UTILITIES', type: 'sector', label: 'Utilities' },
    { id: 'REAL_ESTATE', type: 'sector', label: 'Real Estate' },

    // Shipping Lanes
    { id: 'LANE_TRANSPACIFIC_E', type: 'shipping_lane', label: 'Trans-Pacific Eastbound' },
    { id: 'LANE_TRANSPACIFIC_W', type: 'shipping_lane', label: 'Trans-Pacific Westbound' },
    { id: 'LANE_ASIA_EUR_SUEZ', type: 'shipping_lane', label: 'Asia→Europe via Suez' },
    { id: 'LANE_EUR_ASIA_SUEZ', type: 'shipping_lane', label: 'Europe→Asia via Suez' },
    { id: 'LANE_TRANSATLANTIC', type: 'shipping_lane', label: 'Trans-Atlantic' },
    { id: 'LANE_PG_ASIA', type: 'shipping_lane', label: 'Persian Gulf→Asia' },
    { id: 'LANE_PG_EUR', type: 'shipping_lane', label: 'Persian Gulf→Europe' },
    { id: 'LANE_SA_CHN', type: 'shipping_lane', label: 'South America→China' },
    { id: 'LANE_AUS_CHN', type: 'shipping_lane', label: 'Australia→China' },
    { id: 'LANE_INTRA_ASIA', type: 'shipping_lane', label: 'Intra-Asia' },
    { id: 'LANE_WAFRICA', type: 'shipping_lane', label: 'West Africa→Global' },
    { id: 'LANE_PANAMA', type: 'shipping_lane', label: 'Panama Canal Transit' },
    { id: 'LANE_CAPE', type: 'shipping_lane', label: 'Cape of Good Hope' },

    // Key Ports
    { id: 'PORT_SHANGHAI', type: 'port', label: 'Shanghai' },
    { id: 'PORT_SINGAPORE', type: 'port', label: 'Singapore' },
    { id: 'PORT_ROTTERDAM', type: 'port', label: 'Rotterdam' },
    { id: 'PORT_LA', type: 'port', label: 'Los Angeles / Long Beach' },
    { id: 'PORT_JEBEL_ALI', type: 'port', label: 'Jebel Ali (Dubai)' },
    { id: 'PORT_BUSAN', type: 'port', label: 'Busan' },

    // Top Companies
    { id: 'AAPL', type: 'company', label: 'Apple' },
    { id: 'MSFT', type: 'company', label: 'Microsoft' },
    { id: 'NVDA', type: 'company', label: 'NVIDIA' },
    { id: 'AMZN', type: 'company', label: 'Amazon' },
    { id: 'GOOGL', type: 'company', label: 'Alphabet' },
    { id: 'XOM', type: 'company', label: 'ExxonMobil' },
    { id: 'JPM', type: 'company', label: 'JPMorgan Chase' },
    { id: 'TSMC', type: 'company', label: 'TSMC' },
    { id: 'ARAMCO', type: 'company', label: 'Saudi Aramco' },
    { id: 'BHP', type: 'company', label: 'BHP Group' },
  ]

  const edges: DependencyEdge[] = [
    // === Oil trade flows ===
    { source: 'USA', target: 'SAU', relationship: 'imports_from', weight: 0.6 },
    { source: 'USA', target: 'CAN', relationship: 'imports_from', weight: 0.9 },
    { source: 'USA', target: 'MEX', relationship: 'imports_from', weight: 0.7 },
    { source: 'CHN', target: 'SAU', relationship: 'imports_from', weight: 0.8 },
    { source: 'CHN', target: 'RUS', relationship: 'imports_from', weight: 0.7 },
    { source: 'CHN', target: 'IRQ', relationship: 'imports_from', weight: 0.5 },
    { source: 'JPN', target: 'SAU', relationship: 'imports_from', weight: 0.7 },
    { source: 'IND', target: 'SAU', relationship: 'imports_from', weight: 0.6 },
    { source: 'IND', target: 'IRQ', relationship: 'imports_from', weight: 0.5 },
    { source: 'DEU', target: 'RUS', relationship: 'imports_from', weight: 0.4 },
    { source: 'DEU', target: 'NOR', relationship: 'imports_from', weight: 0.5 },

    // === Iron ore ===
    { source: 'CHN', target: 'AUS', relationship: 'imports_from', weight: 0.9 },
    { source: 'CHN', target: 'BRA', relationship: 'imports_from', weight: 0.8 },
    { source: 'JPN', target: 'AUS', relationship: 'imports_from', weight: 0.6 },
    { source: 'KOR', target: 'AUS', relationship: 'imports_from', weight: 0.5 },

    // === LNG flows ===
    { source: 'JPN', target: 'QAT', relationship: 'imports_from', weight: 0.6 },
    { source: 'JPN', target: 'AUS', relationship: 'imports_from', weight: 0.5 },
    { source: 'KOR', target: 'QAT', relationship: 'imports_from', weight: 0.5 },
    { source: 'DEU', target: 'USA', relationship: 'imports_from', weight: 0.4 },
    { source: 'DEU', target: 'QAT', relationship: 'imports_from', weight: 0.4 },

    // === Commodity producers ===
    { source: 'SAU', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.95 },
    { source: 'RUS', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.8 },
    { source: 'USA', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.85 },
    { source: 'CAN', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.6 },
    { source: 'NOR', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.5 },
    { source: 'NGA', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.5 },
    { source: 'IRQ', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.6 },
    { source: 'AUS', target: 'IRON_ORE', relationship: 'produces', weight: 0.9 },
    { source: 'BRA', target: 'IRON_ORE', relationship: 'produces', weight: 0.85 },
    { source: 'CHL', target: 'COPPER', relationship: 'produces', weight: 0.9 },
    { source: 'AUS', target: 'COAL', relationship: 'produces', weight: 0.7 },
    { source: 'IDN', target: 'COAL', relationship: 'produces', weight: 0.6 },
    { source: 'QAT', target: 'LNG', relationship: 'produces', weight: 0.9 },
    { source: 'AUS', target: 'LNG', relationship: 'produces', weight: 0.7 },
    { source: 'USA', target: 'LNG', relationship: 'produces', weight: 0.6 },
    { source: 'RUS', target: 'NATURAL_GAS', relationship: 'produces', weight: 0.85 },
    { source: 'USA', target: 'NATURAL_GAS', relationship: 'produces', weight: 0.8 },
    { source: 'USA', target: 'WHEAT', relationship: 'produces', weight: 0.6 },
    { source: 'RUS', target: 'WHEAT', relationship: 'produces', weight: 0.5 },
    { source: 'BRA', target: 'SOYBEANS', relationship: 'produces', weight: 0.8 },
    { source: 'USA', target: 'SOYBEANS', relationship: 'produces', weight: 0.7 },
    { source: 'AUS', target: 'LITHIUM', relationship: 'produces', weight: 0.7 },
    { source: 'CHL', target: 'LITHIUM', relationship: 'produces', weight: 0.6 },
    { source: 'TWN', target: 'SEMICONDUCTORS', relationship: 'produces', weight: 0.95 },
    { source: 'KOR', target: 'SEMICONDUCTORS', relationship: 'produces', weight: 0.7 },

    // === Commodity consumers ===
    { source: 'CHN', target: 'CRUDE_OIL', relationship: 'consumes', weight: 0.9 },
    { source: 'USA', target: 'CRUDE_OIL', relationship: 'consumes', weight: 0.85 },
    { source: 'IND', target: 'CRUDE_OIL', relationship: 'consumes', weight: 0.7 },
    { source: 'CHN', target: 'IRON_ORE', relationship: 'consumes', weight: 0.95 },
    { source: 'CHN', target: 'COPPER', relationship: 'consumes', weight: 0.8 },
    { source: 'CHN', target: 'SOYBEANS', relationship: 'consumes', weight: 0.8 },
    { source: 'USA', target: 'SEMICONDUCTORS', relationship: 'consumes', weight: 0.8 },
    { source: 'CHN', target: 'SEMICONDUCTORS', relationship: 'consumes', weight: 0.7 },

    // === Shipping lane transit ===
    { source: 'CHN', target: 'LANE_TRANSPACIFIC_E', relationship: 'transits_via', weight: 0.9 },
    { source: 'USA', target: 'LANE_TRANSPACIFIC_E', relationship: 'transits_via', weight: 0.9 },
    { source: 'USA', target: 'LANE_TRANSPACIFIC_W', relationship: 'transits_via', weight: 0.8 },
    { source: 'CHN', target: 'LANE_TRANSPACIFIC_W', relationship: 'transits_via', weight: 0.8 },
    { source: 'CHN', target: 'LANE_ASIA_EUR_SUEZ', relationship: 'transits_via', weight: 0.8 },
    { source: 'DEU', target: 'LANE_ASIA_EUR_SUEZ', relationship: 'transits_via', weight: 0.7 },
    { source: 'DEU', target: 'LANE_EUR_ASIA_SUEZ', relationship: 'transits_via', weight: 0.7 },
    { source: 'SAU', target: 'LANE_PG_ASIA', relationship: 'transits_via', weight: 0.9 },
    { source: 'SAU', target: 'LANE_PG_EUR', relationship: 'transits_via', weight: 0.8 },
    { source: 'BRA', target: 'LANE_SA_CHN', relationship: 'transits_via', weight: 0.8 },
    { source: 'AUS', target: 'LANE_AUS_CHN', relationship: 'transits_via', weight: 0.9 },
    { source: 'USA', target: 'LANE_TRANSATLANTIC', relationship: 'transits_via', weight: 0.7 },
    { source: 'GBR', target: 'LANE_TRANSATLANTIC', relationship: 'transits_via', weight: 0.6 },
    { source: 'NGA', target: 'LANE_WAFRICA', relationship: 'transits_via', weight: 0.7 },
    { source: 'CRUDE_OIL', target: 'LANE_PG_ASIA', relationship: 'transits_via', weight: 0.9 },
    { source: 'CRUDE_OIL', target: 'LANE_PG_EUR', relationship: 'transits_via', weight: 0.8 },
    { source: 'CRUDE_OIL', target: 'LANE_WAFRICA', relationship: 'transits_via', weight: 0.7 },
    { source: 'IRON_ORE', target: 'LANE_AUS_CHN', relationship: 'transits_via', weight: 0.9 },
    { source: 'IRON_ORE', target: 'LANE_SA_CHN', relationship: 'transits_via', weight: 0.8 },

    // === Currency denominations ===
    { source: 'USA', target: 'USD', relationship: 'denominated_in', weight: 1.0 },
    { source: 'CHN', target: 'CNY', relationship: 'denominated_in', weight: 1.0 },
    { source: 'JPN', target: 'JPY', relationship: 'denominated_in', weight: 1.0 },
    { source: 'GBR', target: 'GBP', relationship: 'denominated_in', weight: 1.0 },
    { source: 'DEU', target: 'EUR', relationship: 'denominated_in', weight: 1.0 },
    { source: 'FRA', target: 'EUR', relationship: 'denominated_in', weight: 1.0 },
    { source: 'NLD', target: 'EUR', relationship: 'denominated_in', weight: 1.0 },
    { source: 'AUS', target: 'AUD', relationship: 'denominated_in', weight: 1.0 },
    { source: 'CAN', target: 'CAD', relationship: 'denominated_in', weight: 1.0 },
    { source: 'BRA', target: 'BRL', relationship: 'denominated_in', weight: 1.0 },
    { source: 'IND', target: 'INR', relationship: 'denominated_in', weight: 1.0 },
    { source: 'KOR', target: 'KRW', relationship: 'denominated_in', weight: 1.0 },
    { source: 'CRUDE_OIL', target: 'USD', relationship: 'denominated_in', weight: 0.95 },
    { source: 'GOLD', target: 'USD', relationship: 'denominated_in', weight: 0.95 },
    { source: 'SAU', target: 'USD', relationship: 'pegged_to', weight: 0.95 },
    { source: 'ARE', target: 'USD', relationship: 'pegged_to', weight: 0.95 },

    // === Sector → commodity dependencies ===
    { source: 'ENERGY', target: 'CRUDE_OIL', relationship: 'consumes', weight: 0.95 },
    { source: 'ENERGY', target: 'NATURAL_GAS', relationship: 'consumes', weight: 0.8 },
    { source: 'MATERIALS', target: 'IRON_ORE', relationship: 'consumes', weight: 0.7 },
    { source: 'MATERIALS', target: 'COPPER', relationship: 'consumes', weight: 0.7 },
    { source: 'MATERIALS', target: 'LITHIUM', relationship: 'consumes', weight: 0.5 },
    { source: 'TECH', target: 'SEMICONDUCTORS', relationship: 'consumes', weight: 0.9 },
    { source: 'CONSUMER_STAP', target: 'WHEAT', relationship: 'consumes', weight: 0.5 },
    { source: 'CONSUMER_STAP', target: 'SOYBEANS', relationship: 'consumes', weight: 0.4 },
    { source: 'UTILITIES', target: 'NATURAL_GAS', relationship: 'consumes', weight: 0.7 },
    { source: 'UTILITIES', target: 'COAL', relationship: 'consumes', weight: 0.5 },

    // === Company → sector / country ===
    { source: 'AAPL', target: 'TECH', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'MSFT', target: 'TECH', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'NVDA', target: 'TECH', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'AMZN', target: 'CONSUMER_DISC', relationship: 'headquartered_in', weight: 0.8 },
    { source: 'GOOGL', target: 'COMM_SERVICES', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'XOM', target: 'ENERGY', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'JPM', target: 'FINANCIALS', relationship: 'headquartered_in', weight: 0.9 },
    { source: 'AAPL', target: 'USA', relationship: 'headquartered_in', weight: 1.0 },
    { source: 'TSMC', target: 'TWN', relationship: 'headquartered_in', weight: 1.0 },
    { source: 'ARAMCO', target: 'SAU', relationship: 'headquartered_in', weight: 1.0 },
    { source: 'BHP', target: 'AUS', relationship: 'headquartered_in', weight: 1.0 },
    { source: 'TSMC', target: 'SEMICONDUCTORS', relationship: 'produces', weight: 0.95 },
    { source: 'ARAMCO', target: 'CRUDE_OIL', relationship: 'produces', weight: 0.9 },
    { source: 'BHP', target: 'IRON_ORE', relationship: 'produces', weight: 0.8 },

    // === Supply chains ===
    { source: 'AAPL', target: 'TSMC', relationship: 'supplies', weight: 0.9 },
    { source: 'NVDA', target: 'TSMC', relationship: 'supplies', weight: 0.85 },
    { source: 'CHN', target: 'USA', relationship: 'exports_to', weight: 0.8 },
    { source: 'USA', target: 'CHN', relationship: 'exports_to', weight: 0.6 },
    { source: 'DEU', target: 'USA', relationship: 'exports_to', weight: 0.5 },
    { source: 'DEU', target: 'CHN', relationship: 'exports_to', weight: 0.5 },
    { source: 'JPN', target: 'USA', relationship: 'exports_to', weight: 0.5 },
    { source: 'KOR', target: 'CHN', relationship: 'exports_to', weight: 0.6 },
    { source: 'VNM', target: 'USA', relationship: 'exports_to', weight: 0.5 },
    { source: 'MEX', target: 'USA', relationship: 'exports_to', weight: 0.7 },

    // === Debt holdings ===
    { source: 'JPN', target: 'USA', relationship: 'holds_debt_of', weight: 0.8 },
    { source: 'CHN', target: 'USA', relationship: 'holds_debt_of', weight: 0.7 },
    { source: 'GBR', target: 'USA', relationship: 'holds_debt_of', weight: 0.5 },
  ]

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// BFS traversal to find affected entities from a shock source
// ---------------------------------------------------------------------------

export function getAffectedEntities(
  sourceId: string,
  depth: number = 3,
): { entity: string; magnitude: number; path: string[] }[] {
  const { edges } = buildDependencyGraph()

  // Build adjacency list (both directions since cascades propagate along edges)
  const adj = new Map<string, { target: string; weight: number }[]>()
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, [])
    if (!adj.has(edge.target)) adj.set(edge.target, [])
    adj.get(edge.source)!.push({ target: edge.target, weight: edge.weight })
    adj.get(edge.target)!.push({ target: edge.source, weight: edge.weight })
  }

  const visited = new Set<string>([sourceId])
  const results: { entity: string; magnitude: number; path: string[] }[] = []

  // BFS with decaying magnitude
  let frontier: { id: string; magnitude: number; path: string[] }[] = [
    { id: sourceId, magnitude: 1.0, path: [sourceId] },
  ]

  for (let d = 0; d < depth; d++) {
    const nextFrontier: typeof frontier = []

    for (const current of frontier) {
      const neighbors = adj.get(current.id) || []
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.target)) continue
        visited.add(neighbor.target)

        const magnitude = current.magnitude * neighbor.weight * 0.7 // decay factor
        const path = [...current.path, neighbor.target]
        results.push({ entity: neighbor.target, magnitude, path })
        nextFrontier.push({ id: neighbor.target, magnitude, path })
      }
    }

    frontier = nextFrontier
  }

  // Sort by magnitude descending
  results.sort((a, b) => b.magnitude - a.magnitude)
  return results
}
