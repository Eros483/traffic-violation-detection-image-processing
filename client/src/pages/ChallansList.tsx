import { useNavigate } from 'react-router-dom'
import { FileX } from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'
import EmptyState from '../components/ui/EmptyState'

export default function ChallansList() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeader title="Challans" subtitle="No backend endpoint" />

        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={FileX}
            message="The backend does not implement a challans API. Generate a challan preview from a violation instead."
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
