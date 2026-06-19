import { useNavigate } from 'react-router-dom'
import { ScanEye, Cpu } from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import EmptyState from '../components/ui/EmptyState'

export default function LiveDetection() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <ScanEye size={22} className="text-primary" />
          <h1 className="text-2xl font-bold text-text-primary">Live Detection</h1>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={Cpu}
            message="Live detection needs an image-processing endpoint (e.g. POST /api/violations/process), which the backend does not implement. Processed records appear under Violations once the backend pipeline has run."
            action={
              <button
                onClick={() => navigate('/violations')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                View Violations
              </button>
            }
          />
        </div>
      </div>
    </PageTransition>
  )
}
