import type { ChallanStatus } from '../../types'

const STYLES: Record<ChallanStatus, { cls: string; label: string }> = {
  pending:  { cls: 'bg-warning/10 text-warning border-warning/30', label: 'Pending Payment' },
  approved: { cls: 'bg-primary/10 text-primary border-primary/30', label: 'Approved' },
  paid:     { cls: 'bg-success/10 text-success border-success/30', label: 'Paid' },
  rejected: { cls: 'bg-danger/10 text-danger border-danger/30',    label: 'Rejected' },
}

export default function StatusBadge({ status }: { status: ChallanStatus }) {
  const { cls, label } = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {label}
    </span>
  )
}
