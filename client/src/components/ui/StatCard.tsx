import type { ReactNode } from 'react'

interface StatCardProps {
  label: string          // uppercase stat label
  value: string          // dominant number
  unit?: string          // small muted text after the number
  /** trend / status line under the number */
  footer?: ReactNode
  footerTone?: 'success' | 'danger' | 'warning' | 'muted'
}

const TONE: Record<NonNullable<StatCardProps['footerTone']>, string> = {
  success: 'text-success',
  danger:  'text-danger',
  warning: 'text-warning',
  muted:   'text-text-muted',
}

// Microtek-style stat card — minimal, numbers dominate, no icon.
export default function StatCard({
  label, value, unit, footer, footerTone = 'muted',
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold text-text-primary leading-none">
        {value}
        {unit && <span className="ml-1.5 text-sm font-normal text-text-muted">{unit}</span>}
      </p>
      {footer && (
        <p className={`mt-3 text-xs font-medium ${TONE[footerTone]}`}>{footer}</p>
      )}
    </div>
  )
}
