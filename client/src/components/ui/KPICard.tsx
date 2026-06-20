import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string // e.g. 'text-warning'
  iconBg: string    // e.g. 'bg-warning/10'
  trend?: string
  trendUp?: boolean
}

export default function KPICard({
  title, value, icon: Icon, iconColor, iconBg, trend, trendUp,
}: KPICardProps) {
  const TrendIcon = trendUp ? TrendingUp : TrendingDown
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            <TrendIcon size={13} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-text-primary mt-3">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{title}</p>
    </div>
  )
}
