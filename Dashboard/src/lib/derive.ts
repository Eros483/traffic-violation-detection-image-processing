// Client-side derivations from the violations list. The backend exposes only a
// total count and the raw records, so any breakdown/trend/offender view is
// computed here from GET /api/violations.
import type { ViolationRecord } from '../types'
import { violationLabel } from './constants'

export interface Slice { name: string; type: string; value: number }
export interface TrendPoint { day: string; violations: number }
export interface Offender { plate: string; count: number; last_seen: string }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Count of each violation type across all records. */
export function breakdownByType(items: ViolationRecord[]): Slice[] {
  const counts = new Map<string, number>()
  for (const rec of items) {
    for (const v of rec.violations) {
      counts.set(v.type, (counts.get(v.type) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([type, value]) => ({ type, name: violationLabel(type), value }))
    .sort((a, b) => b.value - a.value)
}

/** Count of records per severity. */
export function breakdownBySeverity(items: ViolationRecord[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const rec of items) {
    counts[rec.severity] = (counts[rec.severity] ?? 0) + 1
  }
  return counts
}

/** Records grouped by weekday (Mon–Sun), for the trend line. */
export function trendByWeekday(items: ViolationRecord[]): TrendPoint[] {
  const counts = new Array(7).fill(0)
  for (const rec of items) {
    const d = new Date(rec.timestamp)
    if (!Number.isNaN(d.getTime())) counts[d.getDay()] += 1
  }
  // Present Mon..Sun for a conventional week ordering.
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(i => ({ day: WEEKDAYS[i], violations: counts[i] }))
}

/** Plates ranked by number of violation records, with last-seen timestamp. */
export function topOffenders(items: ViolationRecord[], limit = 10): Offender[] {
  const map = new Map<string, { count: number; last: number }>()
  for (const rec of items) {
    if (!rec.plate_number) continue
    const t = new Date(rec.timestamp).getTime()
    const cur = map.get(rec.plate_number) ?? { count: 0, last: 0 }
    cur.count += 1
    cur.last = Math.max(cur.last, Number.isNaN(t) ? 0 : t)
    map.set(rec.plate_number, cur)
  }
  return [...map.entries()]
    .map(([plate, { count, last }]) => ({
      plate,
      count,
      last_seen: last ? new Date(last).toLocaleString('en-IN') : '—',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
