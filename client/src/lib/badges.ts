import type { ViolationType, Severity } from '../types'

export const BADGE_CLASSES: Record<ViolationType, string> = {
  helmet:        'bg-amber-100 text-amber-700',
  triple_riding: 'bg-orange-100 text-orange-700',
  mobile_phone:  'bg-indigo-100 text-indigo-700',
  red_light:     'bg-red-100 text-red-700',
  wrong_side:    'bg-red-100 text-red-700',
  parking:       'bg-purple-100 text-purple-700',
  seatbelt:      'bg-blue-100 text-blue-700',
}

// Robust against violation types the backend may emit without UI config.
export function badgeClass(type: string): string {
  return BADGE_CLASSES[type as ViolationType] ?? 'bg-slate-100 text-slate-700'
}

export const SEVERITY_BORDER: Record<Severity, string> = {
  high:     'border-l-4 border-l-red-500',
  standard: 'border-l-4 border-l-amber-500',
}

export const SEVERITY_DOT: Record<Severity, string> = {
  high:     'bg-red-500',
  standard: 'bg-amber-500',
}
