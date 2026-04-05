'use client'

import { useState } from 'react'
import { MonthEntry } from '@/lib/api'

interface BarChartProps {
  months: MonthEntry[]
}

const SVG_W = 960
const SVG_H = 132
const LABEL_H = 20
const TOTAL_H = SVG_H + LABEL_H

const GROUP_W = 80
const BAR_W = 28

const TOOLTIP_W = 140
const TOOLTIP_H = 72

function fmtMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function BarChart({ months }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxVal = Math.max(
    ...months.filter(m => m.income != null).map(m => m.income!),
    1
  )

  const hm = hoveredIdx !== null ? months[hoveredIdx] : null
  const hmGroupX = hoveredIdx !== null ? hoveredIdx * GROUP_W : 0
  // Pin tooltip left when near right edge, above the bars
  const tooltipX = Math.min(hmGroupX + GROUP_W / 2 - TOOLTIP_W / 2, SVG_W - TOOLTIP_W - 4)
  const tooltipX2 = Math.max(tooltipX, 4)
  const tooltipY = 2

  return (
    <div style={{ position: 'relative', paddingLeft: 36 }}>
      {/* Y-axis labels */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: LABEL_H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 32,
      }}>
        {[maxVal, maxVal * 0.66, maxVal * 0.33, 0].map((v, i) => (
          <span key={i} style={{ fontSize: 9, color: 'var(--text-disabled)', textAlign: 'right' }}>
            {v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`}
          </span>
        ))}
      </div>

      <svg
        width="100%"
        height={TOTAL_H}
        viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <filter id="glow-income">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feFlood floodColor="#10B981" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feComposite in="SourceGraphic" in2="shadow" operator="over" />
          </filter>
          <filter id="glow-spend">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feFlood floodColor="#F87171" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feComposite in="SourceGraphic" in2="shadow" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1={0} y1={(SVG_H / 3) * i}
            x2={SVG_W} y2={(SVG_H / 3) * i}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {months.map((m, idx) => {
          const groupX   = idx * GROUP_W
          const isFuture  = m.status === 'future'
          const isCurrent = m.status === 'current'
          const isHovered = hoveredIdx === idx

          const incomeH = m.income   != null ? (m.income   / maxVal) * (SVG_H - 10) : 0
          const spendH  = m.spending != null ? (m.spending / maxVal) * (SVG_H - 10) : 0
          const barH    = isFuture ? 30 : 0

          const barOffsetX = groupX + (GROUP_W - BAR_W * 2 - 2) / 2

          return (
            <g
              key={m.month}
              onMouseEnter={() => !isFuture && setHoveredIdx(idx)}
              style={{ cursor: isFuture ? 'default' : 'pointer' }}
            >
              {/* Hover highlight column (transparent hit area + subtle bg) */}
              <rect
                x={groupX}
                y={0}
                width={GROUP_W}
                height={SVG_H}
                fill={isHovered && !isFuture ? 'rgba(255,255,255,0.04)' : isCurrent ? 'rgba(59,130,246,0.04)' : 'transparent'}
              />

              {/* Income bar */}
              <rect
                x={barOffsetX}
                y={SVG_H - (isFuture ? barH : incomeH)}
                width={BAR_W}
                height={isFuture ? barH : incomeH}
                rx={3}
                fill={isFuture ? '#1E2A42' : '#10B981'}
                opacity={isFuture ? 1 : isHovered ? 1 : 0.85}
                filter={(isCurrent || isHovered) && !isFuture ? 'url(#glow-income)' : undefined}
              />

              {/* Spending bar */}
              <rect
                x={barOffsetX + BAR_W + 2}
                y={SVG_H - (isFuture ? Math.round(barH * 0.8) : spendH)}
                width={BAR_W}
                height={isFuture ? Math.round(barH * 0.8) : spendH}
                rx={3}
                fill={isFuture ? '#1E2A42' : '#F87171'}
                opacity={isFuture ? 1 : isHovered ? 1 : 0.75}
                filter={(isCurrent || isHovered) && !isFuture ? 'url(#glow-spend)' : undefined}
              />

              {/* Current month indicator */}
              {isCurrent && (
                <line
                  x1={groupX + GROUP_W / 2}
                  y1={SVG_H}
                  x2={groupX + GROUP_W / 2}
                  y2={SVG_H + 4}
                  stroke="var(--blue)"
                  strokeWidth={2}
                />
              )}

              {/* Month label */}
              <text
                x={groupX + GROUP_W / 2}
                y={SVG_H + LABEL_H - 4}
                fill={isCurrent ? '#3B82F6' : isHovered ? '#CBD5E1' : '#475569'}
                fontSize={10}
                fontWeight={isCurrent || isHovered ? 600 : 400}
                textAnchor="middle"
              >
                {m.label.slice(0, 3)}{isCurrent ? ' ●' : ''}
              </text>
            </g>
          )
        })}

        {/* ── Hover tooltip ────────────────────────────── */}
        {hm && hm.status !== 'future' && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Tooltip box */}
            <rect
              x={tooltipX2}
              y={tooltipY}
              width={TOOLTIP_W}
              height={TOOLTIP_H}
              rx={7}
              fill="#1E2A42"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth={1}
            />

            {/* Month label */}
            <text
              x={tooltipX2 + 10}
              y={tooltipY + 17}
              fill="#94A3B8"
              fontSize={10}
              fontFamily="Source Sans 3, sans-serif"
            >
              {hm.label} {hm.month?.slice(0, 4)}{hm.status === 'current' ? ' · Current' : ''}
            </text>

            {/* Income */}
            <text
              x={tooltipX2 + 10}
              y={tooltipY + 34}
              fill="#10B981"
              fontSize={12}
              fontFamily="Lexend, sans-serif"
              fontWeight={600}
            >
              ↑ {hm.income != null ? fmtMoney(hm.income) : '—'}
            </text>

            {/* Spending */}
            <text
              x={tooltipX2 + 10}
              y={tooltipY + 50}
              fill="#F87171"
              fontSize={11}
              fontFamily="Source Sans 3, sans-serif"
            >
              ↓ {hm.spending != null ? fmtMoney(hm.spending) : '—'}
            </text>

            {/* Profit */}
            <text
              x={tooltipX2 + 10}
              y={tooltipY + 65}
              fill={hm.profit != null && hm.profit >= 0 ? '#3B82F6' : '#F87171'}
              fontSize={10}
              fontFamily="Source Sans 3, sans-serif"
            >
              {hm.profit != null ? `Net ${hm.profit >= 0 ? '+' : '−'}${fmtMoney(hm.profit)}` : ''}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
