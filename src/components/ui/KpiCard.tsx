import React from 'react'

type Variant = 'green' | 'red' | 'blue' | 'amber'
type DeltaDir = 'up' | 'down' | 'neutral'

interface KpiCardProps {
  label: string
  value: string
  valueColor?: string
  delta?: string
  deltaDir?: DeltaDir
  variant?: Variant
  children?: React.ReactNode
}

const ACCENT: Record<Variant, string> = {
  green: 'var(--positive)',
  red:   'var(--negative)',
  blue:  'var(--blue)',
  amber: 'var(--warning)',
}

const DELTA_STYLE: Record<DeltaDir, { bg: string; color: string }> = {
  up:      { bg: 'var(--positive-dim)', color: 'var(--positive)' },
  down:    { bg: 'var(--negative-dim)', color: 'var(--negative)' },
  neutral: { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)' },
}

export default function KpiCard({
  label,
  value,
  valueColor,
  delta,
  deltaDir = 'neutral',
  variant = 'blue',
  children,
}: KpiCardProps) {
  const accentColor = ACCENT[variant]
  const ds = DELTA_STYLE[deltaDir]

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Colored top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
      }} />

      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 8,
        color: valueColor ?? accentColor,
      }}>
        {value}
      </div>

      {delta && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 20,
          background: ds.bg,
          color: ds.color,
        }}>
          {delta}
        </div>
      )}

      {children}
    </div>
  )
}
