import { Loader2 } from 'lucide-react'

export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <Loader2 size={24} className="text-primary animate-spin mb-3" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}
