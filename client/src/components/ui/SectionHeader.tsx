import type { ReactNode } from 'react'

export default function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <div className="text-sm text-text-secondary mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
