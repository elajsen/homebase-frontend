'use client'

import { useState, useRef, useCallback } from 'react'
import { ChartBucket } from '@/lib/api'

interface LineChartProps {
  buckets: ChartBucket[]
}

const W = 700
const H = 148
const PADDING_TOP = 14
const PADDING_BOTTOM = 18
const CHART_H = H - PADDING_TOP - PADDING_BOTTOM

const TOOLTIP_W = 134
const TOOLTIP_H = 64

function toPoints(
  buckets: ChartBucket[],
  getter: (b: ChartBucket) => number,
  maxVal: number,
): string {
  if (buckets.length === 0) return ''
  const step = W / Math.max(buckets.length - 1, 1)
  return buckets
    .map((b, i) => {
      const x = i * step
      const y = PADDING_TOP + CHART_H - (getter(b) / maxVal) * CHART_H
      return `${x},${y}`
    })
    .join(' ')
}

function toArea(points: string): string {
  if (!points) return ''
  const first = points.split(' ')[0].split(',')[0]
  const last = points.split(' ').at(-1)?.split(',')[0]
  return `${first},${H} ${points} ${last},${H}`
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function LineChart({ buckets }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || buckets.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    // Scale from rendered pixels → SVG viewBox coordinates
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const step = W / Math.max(buckets.length - 1, 1)
    const idx = Math.max(0, Math.min(buckets.length - 1, Math.round(svgX / step)))
    setHoveredIdx(idx)
  }, [buckets.length])

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), [])

  if (!buckets || buckets.length === 0) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No data</span>
      </div>
    )
  }

  const allVals = buckets.flatMap(b => [b.income, b.spending])
  const maxVal = Math.max(...allVals, 1)

  const incomePoints = toPoints(buckets, (b) => b.income,   maxVal)
  const spendPoints  = toPoints(buckets, (b) => b.spending, maxVal)
  const netPoints    = toPoints(buckets, (b) => b.net,      maxVal)

  const step = W / Math.max(buckets.length - 1, 1)

  // Tooltip for hovered bucket
  const hb = hoveredIdx !== null ? buckets[hoveredIdx] : null
  const hbX = hoveredIdx !== null ? hoveredIdx * step : 0
  // Pin tooltip to the left of the cursor when near right edge
  const tooltipX = Math.min(hbX + 10, W - TOOLTIP_W - 4)
  const tooltipY = 4
  const hbIncomeY = hb ? PADDING_TOP + CHART_H - (hb.income  / maxVal) * CHART_H : 0
  const hbSpendY  = hb ? PADDING_TOP + CHART_H - (hb.spending / maxVal) * CHART_H : 0

  return (
    <div>
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="lc-ig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lc-sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F87171" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F87171" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lc-ng" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1={0} y1={PADDING_TOP + (CHART_H / 3) * i}
            x2={W} y2={PADDING_TOP + (CHART_H / 3) * i}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Vertical bucket dividers */}
        {buckets.slice(1, -1).map((_, i) => {
          const x = (i + 1) * step
          return (
            <line
              key={i}
              x1={x} y1={PADDING_TOP}
              x2={x} y2={H - PADDING_BOTTOM}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={1}
              strokeDasharray="3,4"
            />
          )
        })}

        {/* Area fills */}
        <polygon points={toArea(incomePoints)} fill="url(#lc-ig)" />
        <polygon points={toArea(spendPoints)}  fill="url(#lc-sg)" />
        <polygon points={toArea(netPoints)}    fill="url(#lc-ng)" />

        {/* Lines */}
        <polyline
          points={incomePoints}
          fill="none"
          stroke="#10B981"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={spendPoints}
          fill="none"
          stroke="#F87171"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={netPoints}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.5}
          strokeDasharray="4,3"
          strokeLinejoin="round"
        />

        {/* Static data points — first and last */}
        {(() => {
          const first = buckets[0]
          const last  = buckets[buckets.length - 1]
          const fy  = PADDING_TOP + CHART_H - (first.income  / maxVal) * CHART_H
          const ly  = PADDING_TOP + CHART_H - (last.income   / maxVal) * CHART_H
          const lsy = PADDING_TOP + CHART_H - (last.spending / maxVal) * CHART_H
          return (
            <>
              <circle cx={0}                          cy={fy}  r={3.5} fill="#10B981" stroke="#131D2E" strokeWidth={2} />
              <circle cx={(buckets.length - 1) * step} cy={ly}  r={3.5} fill="#10B981" stroke="#131D2E" strokeWidth={2} />
              <circle cx={(buckets.length - 1) * step} cy={lsy} r={3.5} fill="#F87171" stroke="#131D2E" strokeWidth={2} />
            </>
          )
        })()}

        {/* ── Hover state ─────────────────────────────── */}
        {hb && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Vertical hairline */}
            <line
              x1={hbX} y1={PADDING_TOP}
              x2={hbX} y2={H - PADDING_BOTTOM}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />

            {/* Hovered data-point dots */}
            <circle cx={hbX} cy={hbIncomeY} r={4} fill="#10B981" stroke="#131D2E" strokeWidth={2} />
            <circle cx={hbX} cy={hbSpendY}  r={4} fill="#F87171" stroke="#131D2E" strokeWidth={2} />

            {/* Tooltip box */}
            <rect
              x={tooltipX}
              y={tooltipY}
              width={TOOLTIP_W}
              height={TOOLTIP_H}
              rx={7}
              fill="#1E2A42"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth={1}
            />

            {/* Label line: "Wk 1 · Apr 1 – Apr 7" */}
            <text
              x={tooltipX + 10}
              y={tooltipY + 17}
              fill="#94A3B8"
              fontSize={10}
              fontFamily="Source Sans 3, sans-serif"
            >
              {hb.label}{hb.date_from ? ` · ${fmtDate(hb.date_from)}` : ''}{hb.date_to && hb.date_to !== hb.date_from ? `–${fmtDate(hb.date_to)}` : ''}
            </text>

            {/* Income line */}
            <text
              x={tooltipX + 10}
              y={tooltipY + 34}
              fill="#10B981"
              fontSize={12}
              fontFamily="Lexend, sans-serif"
              fontWeight={600}
            >
              ↑ {fmtMoney(hb.income)}
            </text>

            {/* Spending line */}
            <text
              x={tooltipX + 10}
              y={tooltipY + 52}
              fill="#F87171"
              fontSize={11}
              fontFamily="Source Sans 3, sans-serif"
            >
              ↓ {fmtMoney(hb.spending)}
            </text>
          </g>
        )}
      </svg>

      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 2px',
        marginTop: 6,
      }}>
        {buckets.map((b, i) => (
          <span
            key={b.label}
            style={{
              fontSize: 10,
              color: hoveredIdx === i ? 'var(--text-secondary)' : 'var(--text-disabled)',
              fontWeight: hoveredIdx === i ? 600 : 400,
              transition: 'color 0.1s',
            }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}
