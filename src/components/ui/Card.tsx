import React from 'react'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function Card({ children, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 24,
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export function CardHeader({ title, subtitle, right }: CardHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: subtitle ? 2 : 0,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}
