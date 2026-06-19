import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Landmark, FileX } from 'lucide-react'
import { VIOLATION_META, LEGAL_SECTION, violationLabel } from '../lib/constants'
import type { ChallanStatus, ViolationType } from '../types'
import PageTransition from '../components/ui/PageTransition'
import PlateNumber from '../components/ui/PlateNumber'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'

interface Line { type: ViolationType; section: string; fine: number; confidence: number }

interface NewState {
  plate_number: string | null
  vehicle_type: string
  location: string
  image_hash: string
  violations: { type: ViolationType; confidence: number }[]
}

function linesFrom(violations: { type: ViolationType; confidence: number }[]): Line[] {
  return violations.map(v => ({
    type: v.type,
    section: LEGAL_SECTION[v.type] ?? '—',
    fine: VIOLATION_META[v.type]?.fine ?? 0,
    confidence: v.confidence,
  }))
}

export default function ChallanDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const newState = location.state as NewState | null

  const view = useMemo(() => {
    if (!newState) return null
    const lines = linesFrom(newState.violations)
    return {
      challan_id: 'PREVIEW',
      issued_at: new Date().toISOString(),
      plate_number: newState.plate_number,
      vehicle_type: newState.vehicle_type,
      location: newState.location,
      image_hash: newState.image_hash,
      lines,
      fine_total: lines.reduce((a, l) => a + l.fine, 0),
    }
  }, [newState])

  const [status, setStatus] = useState<ChallanStatus>('pending')

  // No persisted challan and no backend endpoint to fetch one.
  if (!view) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <SectionHeader title="Challan" subtitle="No backend endpoint" />
          <div className="bg-card rounded-xl border border-border">
            <EmptyState
              icon={FileX}
              message="Challans are not served by the backend. Open a violation and use “Generate Challan” to preview one."
              action={
                <button
                  onClick={() => navigate('/violations')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Violations
                </button>
              }
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  const v = view
  const multi = v.lines.length > 1
  const issued = new Date(v.issued_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors text-sm"
            >
              <Download size={15} /> Download PDF
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors text-sm">
              <Share2 size={15} /> Share
            </button>
            {status !== 'paid' && (
              <button
                onClick={() => setStatus('paid')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors text-sm font-medium"
              >
                Mark Paid
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted no-print">
          Preview only — not persisted (no challans backend).
        </p>

        {/* Challan card */}
        <div className="bg-card border border-border rounded-2xl max-w-2xl mx-auto overflow-hidden">
          <div className="bg-primary px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold tracking-wide">BENGALURU TRAFFIC POLICE</p>
              <p className="text-white/80 text-xs">e-Challan / Digital Notice</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Meta label="Challan ID" value={v.challan_id} mono />
            <Meta label="Date" value={issued} />
            <Meta label="Issued by" value="TrafficVision AI" />
          </div>

          <Section title="Vehicle Details">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Registration</Label>
                {v.plate_number
                  ? <PlateNumber plate={v.plate_number} className="text-base block mt-1" />
                  : <p className="text-warning text-sm mt-1">Unidentified — Manual verification required</p>}
              </div>
              <div><Label>Type</Label><Value>{v.vehicle_type}</Value></div>
              <div><Label>Location</Label><Value>{v.location}</Value></div>
            </div>
          </Section>

          <Section title="Violation Details">
            {multi ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg text-text-secondary text-xs uppercase tracking-wider">
                      <th className="text-left font-medium px-4 py-2">Offence</th>
                      <th className="text-left font-medium px-4 py-2">Section</th>
                      <th className="text-right font-medium px-4 py-2">Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.lines.map((l, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-2 text-text-primary">{violationLabel(l.type)}</td>
                        <td className="px-4 py-2 text-text-secondary">{l.section}</td>
                        <td className="px-4 py-2 text-right text-text-primary">₹{l.fine.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-bg/40">
                      <td className="px-4 py-2 font-semibold text-text-primary">TOTAL</td>
                      <td />
                      <td className="px-4 py-2 text-right font-bold text-warning">
                        ₹{v.fine_total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Offence</Label><Value>{violationLabel(v.lines[0].type)}</Value></div>
                <div><Label>Section</Label><Value>{v.lines[0].section}</Value></div>
                <div><Label>Confidence</Label><Value>{Math.round(v.lines[0].confidence * 100)}%</Value></div>
                <div>
                  <Label>Fine Amount</Label>
                  <p className="text-2xl font-bold text-warning mt-1">₹{v.fine_total.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}
          </Section>

          <Section title="Evidence">
            <p className="font-mono text-xs text-text-muted truncate">Hash: {v.image_hash}</p>
          </Section>

          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-text-secondary">Status</span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-t border-border/50">
      <p className="text-xs uppercase tracking-widest text-text-secondary mb-3">{title}</p>
      {children}
    </div>
  )
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wider text-text-secondary">{children}</p>
}
function Value({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-text-primary mt-1">{children}</p>
}
function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className={`text-sm font-semibold text-text-primary mt-1 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
