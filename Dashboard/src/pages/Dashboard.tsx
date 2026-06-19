import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { getAnalyticsSummary, getViolations } from '../lib/api'
import type { AnalyticsSummary, PaginatedViolations } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { trendByWeekday } from '../lib/derive'
import PageTransition from '../components/ui/PageTransition'
import AsyncBoundary from '../components/ui/AsyncBoundary'
import StatCard from '../components/ui/StatCard'
import ActivityRow from '../components/ui/ActivityRow'
import EmptyState from '../components/ui/EmptyState'

const CAMERAS = ['CAM-01', 'CAM-02', 'CAM-03']

interface DashboardData {
  summary: AnalyticsSummary
  violations: PaginatedViolations
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeCam, setActiveCam] = useState(0)
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('en-IN'))

  const state = useFetch<DashboardData>(async () => {
    const [summary, violations] = await Promise.all([
      getAnalyticsSummary(),
      getViolations(1, 200),
    ])
    return { summary, violations }
  })

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN')), 1000)
    return () => clearInterval(t)
  }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Traffic enforcement overview — {today}
          </p>
        </div>

        <AsyncBoundary state={state} loadingMessage="Loading dashboard…">
          {({ summary, violations }) => {
            const items = violations.items
            const trend = trendByWeekday(items)
            const hasTrend = trend.some(t => t.violations > 0)
            const recent = items.slice(0, 12)

            return (
              <div className="space-y-8">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Violations"
                    value={summary.total_violations.toLocaleString('en-IN')}
                    unit="violations"
                    footer="Live from backend"
                    footerTone="success"
                  />
                  <StatCard label="Active Cameras" value="—" footer="No camera endpoint" />
                  <StatCard label="Detection Accuracy" value="—" footer="No metrics endpoint" />
                  <StatCard label="Challans Issued" value="—" footer="No challans endpoint" />
                </div>

                {/* Trend chart + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
                  <div className="bg-card rounded-xl border border-border shadow-card p-5">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h2 className="text-base font-semibold text-text-primary">Violation Trend</h2>
                      <span className="text-sm text-text-muted">By weekday</span>
                    </div>
                    {hasTrend ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--card)', border: '1px solid var(--border)',
                              borderRadius: 12, color: 'var(--text-primary)', fontSize: 13,
                            }}
                            cursor={{ stroke: 'var(--border)' }}
                          />
                          <Line type="monotone" dataKey="violations" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={Inbox} message="No violation data yet. Run the backend pipeline to populate records." />
                    )}
                  </div>

                  <div className="bg-card rounded-xl border border-border shadow-card flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                      <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
                      <button
                        onClick={() => navigate('/violations')}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View All <ArrowRight size={12} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[340px]">
                      {recent.length === 0 ? (
                        <EmptyState icon={Inbox} message="No recent violations." />
                      ) : (
                        recent.map(record => (
                          <ActivityRow
                            key={record.violation_id}
                            record={record}
                            onClick={() => navigate(`/violations/${record.violation_id}`)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Live camera feed — viewport stays dark; this is a UI placeholder,
                    the backend has no live camera stream. */}
                <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <h2 className="text-base font-semibold text-text-primary">Live Camera Feed</h2>
                    <div className="flex gap-2">
                      {CAMERAS.map((cam, i) => (
                        <button
                          key={cam}
                          onClick={() => setActiveCam(i)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                            i === activeCam
                              ? 'bg-primary-light text-primary border-primary'
                              : 'text-text-secondary border-border hover:text-text-primary'
                          }`}
                        >
                          {cam}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center h-[280px]" style={{ backgroundColor: '#0B1220' }}>
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                      }}
                    />
                    {[
                      { top: 16, left: 16, borderTop: '2px solid #2563EB', borderLeft: '2px solid #2563EB' },
                      { top: 16, right: 16, borderTop: '2px solid #2563EB', borderRight: '2px solid #2563EB' },
                      { bottom: 16, left: 16, borderBottom: '2px solid #2563EB', borderLeft: '2px solid #2563EB' },
                      { bottom: 16, right: 16, borderBottom: '2px solid #2563EB', borderRight: '2px solid #2563EB' },
                    ].map((s, i) => (
                      <div key={i} className="absolute w-7 h-7" style={s} />
                    ))}

                    <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
                      <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                        MG Road Junction
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#EF4444' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> LIVE
                      </span>
                    </div>

                    <div className="text-center relative z-10">
                      <p className="text-sm font-medium animate-pulse" style={{ color: '#6B7280' }}>
                        Acquiring signal — {CAMERAS[activeCam]}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                        Bengaluru Traffic Police
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-6 font-mono text-xs flex items-center gap-1.5 z-10" style={{ color: '#10B981' }}>
                      {clock}
                      <span className="ml-2 flex items-center gap-1" style={{ color: '#EF4444' }}>
                        REC <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse inline-block" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }}
        </AsyncBoundary>
      </div>
    </PageTransition>
  )
}
