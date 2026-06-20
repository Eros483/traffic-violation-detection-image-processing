import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Inbox } from 'lucide-react'
import { getViolations } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'
import ViolationCard from '../components/ui/ViolationCard'
import EmptyState from '../components/ui/EmptyState'
import AsyncBoundary from '../components/ui/AsyncBoundary'

type Filter = 'all' | string

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'helmet',        label: 'No Helmet' },
  { key: 'triple_riding', label: 'Triple Riding' },
  { key: 'mobile_phone',  label: 'Mobile Phone' },
  { key: 'red_light',     label: 'Red Light' },
]

export default function ViolationsList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const state = useFetch(() => getViolations(1, 200))
  const allItems = state.data?.items ?? []

  const items = useMemo(() => {
    return allItems.filter(v => {
      const matchType = filter === 'all' || v.violations.some(x => x.type === filter)
      const matchQuery =
        !query || (v.plate_number ?? '').toLowerCase().includes(query.toLowerCase())
      return matchType && matchQuery
    })
  }, [allItems, filter, query])

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeader
          title="Violations"
          subtitle={state.data ? `${state.data.total} record${state.data.total === 1 ? '' : 's'}` : undefined}
          action={
            <div className="flex items-center gap-2 w-56 rounded-lg bg-card border border-border px-3 py-2 focus-within:border-primary">
              <Search className="w-4 h-4 shrink-0 text-text-muted" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search plate..."
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          }
        />

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap border-b border-border pb-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <AsyncBoundary state={state} loadingMessage="Loading violations…">
          {() =>
            items.length === 0 ? (
              <EmptyState
                icon={Inbox}
                message={
                  allItems.length === 0
                    ? 'No violations recorded yet. Run the backend pipeline to populate records.'
                    : 'No violations match your filter.'
                }
              />
            ) : (
              <div className="space-y-6">
                {items.map(record => (
                  <ViolationCard
                    key={record.violation_id}
                    record={record}
                    onClick={() => navigate(`/violations/${record.violation_id}`)}
                  />
                ))}
              </div>
            )
          }
        </AsyncBoundary>
      </div>
    </PageTransition>
  )
}
