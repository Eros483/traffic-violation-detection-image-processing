export default function ConfidenceMeter({
  value,
  className = '',
}: {
  value: number // 0–1
  className?: string
}) {
  const pct = Math.round(value * 100)
  // High confidence reads as success, mid as warning, low as danger.
  const color = pct >= 85 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-danger'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-text-secondary tabular-nums">{pct}%</span>
    </div>
  )
}
