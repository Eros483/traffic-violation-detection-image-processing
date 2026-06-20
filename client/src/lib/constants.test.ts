import { describe, it, expect } from 'vitest'
import { violationLabel, VIOLATION_META, LEGAL_SECTION } from './constants'

describe('constants', () => {
  it('violationLabel returns the configured label for known types', () => {
    expect(violationLabel('helmet')).toBe(VIOLATION_META.helmet.label)
  })

  it('violationLabel humanizes unknown backend types (e.g. wrong_side_driving)', () => {
    expect(violationLabel('wrong_side_driving')).toBe('Wrong Side Driving')
  })

  it('every known violation type has a legal section', () => {
    for (const type of Object.keys(VIOLATION_META)) {
      expect(LEGAL_SECTION[type as keyof typeof LEGAL_SECTION]).toBeTruthy()
    }
  })
})
