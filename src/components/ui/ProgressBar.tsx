type ProgressStatus = 'ok' | 'warning' | 'over'

interface ProgressBarProps {
  name: string
  spent: number
  budget: number
  pct: number
  status: ProgressStatus
}

const FILL_COLOR: Record<ProgressStatus, string> = {
  ok:      'var(--blue)',
  warning: 'var(--warning)',
  over:    'var(--danger)',
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function ProgressBar({ name, spent, budget, pct, status }: ProgressBarProps) {
  const isOver = status === 'over'
  const fillWidth = Math.min(pct, 100)

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {name}
        </span>
        <span style={{
          fontSize: 12,
          color: isOver ? 'var(--danger)' : 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(spent)}{' '}
          <span style={{ opacity: 0.5 }}>/ {fmt(budget)}</span>
          {isOver && <span style={{ marginLeft: 4 }}>— over!</span>}
        </span>
      </div>
      <div style={{
        height: 5,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: 5,
          borderRadius: 3,
          width: `${fillWidth}%`,
          background: FILL_COLOR[status],
          transition: 'width 0.3s var(--ease-out)',
        }} />
      </div>
    </div>
  )
}
