import { ArrowRight } from 'lucide-react'
import type { ViolationRecord } from '../../types'
import { badgeClass } from '../../lib/badges'

const SHORT_LABEL: Record<string, string> = {
  helmet:        'HELMET',
  triple_riding: 'TRIPLE',
  mobile_phone:  'PHONE',
  red_light:     'RED LIGHT',
  wrong_side:    'WRONG SIDE',
  parking:       'PARKING',
  seatbelt:      'SEATBELT',
}

function shortLabel(type: string): string {
  return SHORT_LABEL[type] ?? type.replace(/_/g, ' ').toUpperCase()
}

function statusPill(severity: ViolationRecord['severity']) {
  return severity === 'high'
    ? { label: 'HIGH', cls: 'bg-danger/10 text-danger', dot: 'bg-danger' }
    : { label: 'OPEN', cls: 'bg-primary/10 text-primary', dot: 'bg-primary' }
}

export default function ActivityRow({
  record,
  onClick,
}: {
  record: ViolationRecord
  onClick?: () => void
}) {
  const primary = record.violations[0]?.type ?? 'helmet'
  const status = statusPill(record.severity)
  const time = new Date(record.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b last:border-b-0 cursor-pointer"
      style={{ borderColor: '#F1F5F9' }}
    >
      <div className="flex items-center gap-3">
        {/* type pill */}
        <span
          className={`inline-flex items-center px-1 py-0.5 rounded-none text-[10px] font-bold tracking-wide flex-shrink-0 ${badgeClass(primary)}`}
        >
          {shortLabel(primary)}
        </span>

        {/* plate */}
        <span className="flex items-center gap-1 font-mono font-semibold text-sm text-text-primary truncate">
          {record.plate_number ?? 'UNIDENTIFIED'}
          <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
        </span>

        {/* status pill */}
        <span
          className={`ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0 ${status.cls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{time}</p>
    </button>
  )
}
