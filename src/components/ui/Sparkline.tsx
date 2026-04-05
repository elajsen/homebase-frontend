interface SparklineProps {
  data: number[]
  color: string
}

export default function Sparkline({ data, color }: SparklineProps) {
  if (!data || data.length < 2) return null

  const W = 120
  const H = 24
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const toX = (i: number) => (i / (data.length - 1)) * W
  const toY = (v: number) => H - ((v - min) / range) * (H - 4) - 2

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const area = `0,${H} ${points} ${W},${H}`

  const lastX = toX(data.length - 1)
  const lastY = toY(data[data.length - 1])

  // Build a unique gradient id from color to avoid collisions
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ flex: 1 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} stroke="#131D2E" strokeWidth={1.5} />
    </svg>
  )
}
