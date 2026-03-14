import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { MOCK_YIELDS } from '../../lib/mock-data'

const maturities = ['2Y', '5Y', '10Y', '30Y'] as const
const maturityYears = [2, 5, 10, 30]

export function YieldCurve() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 380
    const height = 140
    const margin = { top: 16, right: 16, bottom: 24, left: 36 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([2, 30]).range([0, innerW])
    const allYields = [
      ...Object.values(MOCK_YIELDS.current),
      ...Object.values(MOCK_YIELDS.oneYearAgo),
      ...Object.values(MOCK_YIELDS.twoYearsAgo),
    ]
    const y = d3
      .scaleLinear()
      .domain([Math.min(...allYields) - 0.2, Math.max(...allYields) + 0.2])
      .range([innerH, 0])

    // Grid lines
    g.selectAll('.grid-y')
      .data(y.ticks(4))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', 'rgba(255,255,255,0.05)')

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(maturityYears)
          .tickFormat((d) => `${d}Y`)
          .tickSize(0),
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((d) => `${d}%`)
          .tickSize(0),
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')

    const line = d3
      .line<number>()
      .x((_, i) => x(maturityYears[i]))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX)

    // Helper to draw a curve
    const drawCurve = (data: Record<string, number>, color: string, opacity: number, dashed = false) => {
      const values = maturities.map((m) => data[m])
      const path = g
        .append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', dashed ? 1 : 2)
        .attr('stroke-opacity', opacity)
        .attr('d', line)

      if (dashed) {
        path.attr('stroke-dasharray', '4,3')
      }

      // Dots
      if (!dashed) {
        values.forEach((v, i) => {
          g.append('circle')
            .attr('cx', x(maturityYears[i]))
            .attr('cy', y(v))
            .attr('r', 3)
            .attr('fill', color)
            .attr('stroke', '#050810')
            .attr('stroke-width', 1.5)
        })
      }
    }

    drawCurve(MOCK_YIELDS.twoYearsAgo, '#64748b', 0.4, true)
    drawCurve(MOCK_YIELDS.oneYearAgo, '#F59E0B', 0.5, true)
    drawCurve(MOCK_YIELDS.current, '#00D4FF', 1.0, false)

    // Inversion warning
    const spread = MOCK_YIELDS.current['10Y'] - MOCK_YIELDS.current['2Y']
    if (spread < 0) {
      g.append('text')
        .attr('x', innerW)
        .attr('y', -4)
        .attr('text-anchor', 'end')
        .attr('fill', '#FF4545')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`INVERTED (${spread.toFixed(2)}%)`)
    }
  }, [])

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          US Treasury Yield Curve
        </h3>
        <span className="text-[9px] font-mono text-slate-600">
          Fed Funds: {MOCK_YIELDS.fedFunds.toFixed(2)}%
        </span>
      </div>
      <div className="flex gap-3 mb-1">
        <span className="text-[8px] text-econ-blue font-mono">
          Current
        </span>
        <span className="text-[8px] text-econ-amber font-mono opacity-60">
          1Y ago
        </span>
        <span className="text-[8px] text-slate-500 font-mono opacity-50">
          2Y ago
        </span>
      </div>
      <svg ref={svgRef} />
    </div>
  )
}
