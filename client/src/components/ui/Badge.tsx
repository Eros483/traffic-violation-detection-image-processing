import { violationLabel } from '../../lib/constants'
import { badgeClass } from '../../lib/badges'

export default function Badge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass(type)}`}
    >
      {violationLabel(type)}
    </span>
  )
}
