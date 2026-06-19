import type { ViolationRecord } from '../types'

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:8000'

export interface PaginatedViolations {
  items: ViolationRecord[]
  total: number
  page: number
}

export interface AnalyticsSummary {
  total_violations: number
}

export interface HealthResponse {
  status: string
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const UNREACHABLE =
  'Cannot reach the backend. Is the API running at ' + API_BASE + '? ' +
  'Start it with `make run-api` in the backend folder.'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      headers: { Accept: 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError(UNREACHABLE, 0)
  }

  if (!res.ok) {
    throw new ApiError(
      `Backend returned ${res.status} ${res.statusText} for ${path}.`,
      res.status,
    )
  }

  try {
    return (await res.json()) as T
  } catch {
    throw new ApiError(`Backend sent an invalid response for ${path}.`, res.status)
  }
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export function getViolations(page = 1, pageSize = 50): Promise<PaginatedViolations> {
  return request<PaginatedViolations>(
    `/api/violations?page=${page}&page_size=${pageSize}`,
  )
}

export function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>('/api/analytics/summary')
}
