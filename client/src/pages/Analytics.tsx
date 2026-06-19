import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Inbox } from 'lucide-react'
import { getAnalyticsSummary, getViolations } from '../lib/api'
import type { AnalyticsSummary, PaginatedViolations } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { breakdownByType, trendByWeekday, topOffenders } from '../lib/derive'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'
import AsyncBoundary from '../components/ui/AsyncBoundary'
import EmptyState from '../components/ui/EmptyState'

const PIE_COLORS = ['#F59E0B', '#F97316', '#818CF8', '#EF4444', '#6366F1', '#10B981', '#2563EB']

interface Data {
  summary: AnalyticsSummary
  violations: PaginatedViolations
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-5">{title}</h2>
      {children}
    </div>
  )
}

export default function Analytics() {
  const state = useFetch<Data>(async () => {
    const [summary, violations] = await Promise.all([
      getAnalyticsSummary(),
      getViolations(1, 500),
    ])
    return { summary, violations }
  })

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeader
          title="Analytics"
          action={
            <span className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary">
              Derived from records
            </span>
          }
        />

        <AsyncBoundary state={state} loadingMessage="Loading analytics…">
          {({ summary, violations }) => {
            const items = violations.items
            const trend = trendByWeekday(items)
            const hasTrend = trend.some(t => t.violations > 0)
            const breakdown = breakdownByType(items).map((s, i) => ({
              ...s, color: PIE_COLORS[i % PIE_COLORS.length],
            }))
            const offenders = topOffenders(items)
            const maxOffender = offenders.length ? offenders[0].count : 0

            return (
              <>
                {/* Total from backend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border shadow-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Violations</p>
                    <p className="mt-3 text-4xl font-bold text-text-primary leading-none">
                      {summary.total_violations.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-3 text-xs font-medium text-success">Live from backend</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border shadow-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Distinct Plates</p>
                    <p className="mt-3 text-4xl font-bold text-text-primary leading-none">{offenders.length}</p>
                    <p className="mt-3 text-xs font-medium text-text-muted">Derived from records</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border shadow-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Violation Types</p>
                    <p className="mt-3 text-4xl font-bold text-text-primary leading-none">{breakdown.length}</p>
                    <p className="mt-3 text-xs font-medium text-text-muted">Derived from records</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Panel title="Violation Trend">
                    {hasTrend ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} cursor={{ stroke: 'var(--border)' }} />
                          <Line type="monotone" dataKey="violations" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={Inbox} message="No violation data to chart yet." />
                    )}
                  </Panel>

                  <Panel title="Violation Breakdown">
                    {breakdown.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                            {breakdown.map(d => <Cell key={d.type} fill={d.color} stroke="var(--card)" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={Inbox} message="No violation data to break down yet." />
                    )}
                  </Panel>
                </div>

                {/* Top offenders */}
                <Panel title="Top Offenders">
                  {offenders.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                            <th className="text-left font-medium py-2">Plate Number</th>
                            <th className="text-left font-medium py-2">Violations</th>
                            <th className="text-left font-medium py-2">Last Seen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offenders.map(o => {
                            const top = o.count === maxOffender
                            return (
                              <tr key={o.plate} className="border-b border-border/60 last:border-b-0">
                                <td className={`py-3 font-mono ${top ? 'text-danger font-semibold' : 'text-text-primary'}`}>{o.plate}</td>
                                <td className={`py-3 ${top ? 'text-danger font-semibold' : 'text-text-secondary'}`}>{o.count}</td>
                                <td className="py-3 text-text-secondary">{o.last_seen}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Inbox} message="No plates recorded yet." />
                  )}
                </Panel>
              </>
            )
          }}
        </AsyncBoundary>
      </div>
    </PageTransition>
  )
}
