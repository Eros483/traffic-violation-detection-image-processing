import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <AlertOctagon size={22} className="text-danger" />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">Backend not working</p>
      <p className="text-sm text-text-secondary max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  )
}
