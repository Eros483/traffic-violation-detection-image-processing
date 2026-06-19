import { ArrowRight } from 'lucide-react'
import type { ViolationRecord } from '../../types'
import { SEVERITY_BORDER, SEVERITY_DOT } from '../../lib/badges'
import Badge from './Badge'
import PlateNumber from './PlateNumber'

const LOCATIONS: Record<string, string> = {
  two_wheeler: 'MG Road Junction',
  four_wheeler: 'Indiranagar 100ft Rd',
}

export default function ViolationCard({
  record,
  onClick,
}: {
  record: ViolationRecord
  onClick?: () => void
}) {
  const time = new Date(record.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
  const topConf = Math.round(
    Math.max(...record.violations.map(v => v.confidence)) * 100,
  )
  const location = LOCATIONS[record.vehicle_type] ?? 'Bengaluru'

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border border-border px-6 py-5 transition-all duration-200 hover:border-primary/50 ${
        onClick ? 'cursor-pointer' : ''
      } ${SEVERITY_BORDER[record.severity]}`}
    >
      {/* severity dot + badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[record.severity]}`} />
        {record.violations.map((v, i) => (
          <Badge key={i} type={v.type} />
        ))}
      </div>

      {/* plate + time */}
      <div className="flex items-center justify-between mb-2">
        <PlateNumber plate={record.plate_number} className="text-sm" />
        <span className="text-xs text-text-muted">{time}</span>
      </div>

      {/* location + confidence + view */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{location}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">Conf: {topConf}%</span>
          {onClick && (
            <span className="flex items-center gap-1 text-xs text-primary hover:underline">
              View <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
