import type { ReactNode } from 'react'
import type { FetchState } from '../../hooks/useFetch'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'

export default function AsyncBoundary<T>({
  state,
  loadingMessage,
  children,
}: {
  state: FetchState<T>
  loadingMessage?: string
  children: (data: T) => ReactNode
}) {
  if (state.loading && state.data == null) return <LoadingState message={loadingMessage} />
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />
  if (state.data == null) return null
  return <>{children(state.data)}</>
}
