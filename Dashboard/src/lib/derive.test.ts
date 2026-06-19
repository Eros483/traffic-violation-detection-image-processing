import { describe, it, expect } from 'vitest'
import { breakdownByType, breakdownBySeverity, trendByWeekday, topOffenders } from './derive'
import { makeRecord } from '../test/fixtures'

describe('derive', () => {
  it('breakdownByType counts each violation type, sorted desc', () => {
    const items = [
      makeRecord({ violations: [{ type: 'helmet', confidence: 0.9 }] }),
      makeRecord({ violations: [{ type: 'helmet', confidence: 0.8 }] }),
      makeRecord({ violations: [{ type: 'red_light', confidence: 0.7 }] }),
    ]
    const result = breakdownByType(items)
    expect(result[0]).toMatchObject({ type: 'helmet', value: 2 })
    expect(result[1]).toMatchObject({ type: 'red_light', value: 1 })
  })

  it('breakdownBySeverity tallies severities', () => {
    const items = [
      makeRecord({ severity: 'high' }),
      makeRecord({ severity: 'standard' }),
      makeRecord({ severity: 'standard' }),
    ]
    expect(breakdownBySeverity(items)).toEqual({ high: 1, standard: 2 })
  })

  it('trendByWeekday buckets by weekday and returns Mon..Sun', () => {
    // 2026-06-15 is a Monday
    const items = [
      makeRecord({ timestamp: '2026-06-15T09:00:00+05:30' }),
      makeRecord({ timestamp: '2026-06-15T11:00:00+05:30' }),
    ]
    const trend = trendByWeekday(items)
    expect(trend.map(t => t.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(trend.find(t => t.day === 'Mon')!.violations).toBe(2)
    expect(trend.find(t => t.day === 'Tue')!.violations).toBe(0)
  })

  it('topOffenders groups by plate and ranks by count', () => {
    const items = [
      makeRecord({ plate_number: 'KA-01-AB-1234' }),
      makeRecord({ plate_number: 'KA-01-AB-1234' }),
      makeRecord({ plate_number: 'KA-05-MH-9988' }),
      makeRecord({ plate_number: null }), // unidentified plates are ignored
    ]
    const offenders = topOffenders(items)
    expect(offenders).toHaveLength(2)
    expect(offenders[0]).toMatchObject({ plate: 'KA-01-AB-1234', count: 2 })
  })
})
