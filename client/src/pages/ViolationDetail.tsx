import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, FileText, ImageOff, SearchX } from 'lucide-react'
import { getViolations } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { LEGAL_SECTION } from '../lib/constants'
import type { ViolationType } from '../types'
import PageTransition from '../components/ui/PageTransition'
import AsyncBoundary from '../components/ui/AsyncBoundary'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import PlateNumber from '../components/ui/PlateNumber'
import ConfidenceMeter from '../components/ui/ConfidenceMeter'

const VEHICLE_LABEL: Record<string, string> = {
  two_wheeler: 'Two-Wheeler',
  four_wheeler: 'Four-Wheeler',
  vehicle: 'Vehicle',
  unknown: 'Unknown',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{children}</span>
    </div>
  )
}

export default function ViolationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useFetch(() => getViolations(1, 500))
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)

  return (
    <PageTransition>
      <div className="space-y-8 max-w-4xl">
        <button
          onClick={() => navigate('/violations')}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Back to Violations
        </button>

        <AsyncBoundary state={state} loadingMessage="Loading violation…">
          {data => {
            const record = data.items.find(v => v.violation_id === id)
            if (!record) {
              return (
                <EmptyState
                  icon={SearchX}
                  message={`No violation found with id "${id}".`}
                />
              )
            }

            const time = new Date(record.timestamp).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            const topConf = record.violations.length
              ? Math.max(...record.violations.map(v => v.confidence))
              : 0

            return (
              <>
                {/* Evidence image — backend serves no image URL, only a path. */}
                <div className="rounded-2xl overflow-hidden border border-border bg-card">
                  <div className="flex flex-col items-center justify-center text-center py-16" style={{ backgroundColor: '#0B1220' }}>
                    <ImageOff size={28} className="mb-3" style={{ color: '#475569' }} />
                    <p className="text-sm" style={{ color: '#64748B' }}>Evidence image not available via API</p>
                    <p className="font-mono text-xs mt-1" style={{ color: '#475569' }}>{record.image_path}</p>
                  </div>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Violation Info</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {record.violations.map((v, i) => <Badge key={i} type={v.type} />)}
                    </div>
                    <Field label="Confidence"><ConfidenceMeter value={topConf} /></Field>
                    <Field label="Legal">
                      {record.legal_sections.join(', ') ||
                        LEGAL_SECTION[record.violations[0]?.type as ViolationType] ||
                        '—'}
                    </Field>
                    <Field label="Severity">
                      <span className={record.severity === 'high' ? 'text-danger' : 'text-warning'}>
                        {record.severity === 'high' ? 'High' : 'Standard'}
                      </span>
                    </Field>
                    <Field label="Time">{time}</Field>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Vehicle Info</h2>
                    <Field label="Plate"><PlateNumber plate={record.plate_number} className="text-sm" /></Field>
                    <Field label="Type">{VEHICLE_LABEL[record.vehicle_type] ?? record.vehicle_type}</Field>
                    <Field label="Evidence Hash">
                      <span className="font-mono text-xs text-text-muted">{record.image_hash.slice(0, 12)}…</span>
                    </Field>
                  </div>
                </div>

                {/* Actions */}
                {decision ? (
                  <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                    decision === 'approved'
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-danger/10 text-danger border-danger/30'
                  }`}>
                    Violation {decision === 'approved' ? 'approved' : 'rejected'}.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setDecision('approved')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors font-medium"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => setDecision('rejected')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors font-medium"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      onClick={() =>
                        navigate('/challans/new', {
                          state: {
                            plate_number: record.plate_number,
                            vehicle_type: VEHICLE_LABEL[record.vehicle_type] ?? 'Vehicle',
                            location: '—',
                            image_hash: record.image_hash,
                            violations: record.violations.map(v => ({ type: v.type, confidence: v.confidence })),
                          },
                        })
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                    >
                      <FileText size={16} /> Generate Challan
                    </button>
                  </div>
                )}
              </>
            )
          }}
        </AsyncBoundary>
      </div>
    </PageTransition>
  )
}
