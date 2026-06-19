import { useNavigate } from 'react-router-dom'
import { Inbox, ImageOff } from 'lucide-react'
import { getViolations } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'
import AsyncBoundary from '../components/ui/AsyncBoundary'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import PlateNumber from '../components/ui/PlateNumber'

export default function EvidenceGallery() {
  const navigate = useNavigate()
  const state = useFetch(() => getViolations(1, 200))

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeader
          title="Evidence Gallery"
          subtitle={state.data ? `${state.data.items.length} annotated frames` : undefined}
        />

        <AsyncBoundary state={state} loadingMessage="Loading evidence…">
          {data =>
            data.items.length === 0 ? (
              <EmptyState icon={Inbox} message="No evidence yet. Run the backend pipeline to generate records." />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.items.map(v => {
                  const time = new Date(v.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <button
                      key={v.violation_id}
                      onClick={() => navigate(`/violations/${v.violation_id}`)}
                      className="text-left bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-40" style={{ backgroundColor: '#0B1220' }}>
                        <ImageOff size={24} style={{ color: '#475569' }} />
                      </div>
                      <div className="p-4 space-y-2">
                        {v.violations[0] && <Badge type={v.violations[0].type} />}
                        <PlateNumber plate={v.plate_number} className="text-sm block" />
                        <p className="text-xs text-text-muted">{time}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          }
        </AsyncBoundary>
      </div>
    </PageTransition>
  )
}
