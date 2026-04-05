type BadgeVariant = 'up' | 'down' | 'neutral' | 'done' | 'active' | 'upcoming' | 'current'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
}

const STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  up:       { bg: 'var(--positive-dim)',            color: 'var(--positive)' },
  down:     { bg: 'var(--negative-dim)',            color: 'var(--negative)' },
  neutral:  { bg: 'rgba(148,163,184,0.1)',          color: 'var(--text-muted)' },
  done:     { bg: 'rgba(16,185,129,0.1)',           color: 'var(--positive)' },
  active:   { bg: 'var(--blue-dim)',                color: 'var(--blue)' },
  upcoming: { bg: 'rgba(148,163,184,0.1)',          color: 'var(--text-muted)' },
  current:  { bg: 'var(--blue-dim)',                color: 'var(--blue)' },
}

export default function Badge({ variant, children }: BadgeProps) {
  const s = STYLES[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 10,
      background: s.bg,
      color: s.color,
    }}>
      {children}
    </span>
  )
}
