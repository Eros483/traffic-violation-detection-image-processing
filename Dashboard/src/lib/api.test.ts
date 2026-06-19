import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getViolations, getAnalyticsSummary, getHealth, ApiError } from './api'

function mockFetchOnce(value: { ok: boolean; status?: number; json?: unknown; reject?: boolean }) {
  const fn = vi.fn()
  if (value.reject) {
    fn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  } else {
    fn.mockResolvedValueOnce({
      ok: value.ok,
      status: value.status ?? (value.ok ? 200 : 500),
      statusText: value.ok ? 'OK' : 'Internal Server Error',
      json: async () => value.json,
    })
  }
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('api client', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('getViolations returns parsed pagination payload', async () => {
    const payload = { items: [], total: 0, page: 1 }
    const fetchFn = mockFetchOnce({ ok: true, json: payload })

    const result = await getViolations(2, 25)

    expect(result).toEqual(payload)
    // page + page_size are forwarded as query params
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/api/violations?page=2&page_size=25'),
      expect.anything(),
    )
  })

  it('getAnalyticsSummary returns the total count', async () => {
    mockFetchOnce({ ok: true, json: { total_violations: 42 } })
    const result = await getAnalyticsSummary()
    expect(result.total_violations).toBe(42)
  })

  it('getHealth returns status', async () => {
    mockFetchOnce({ ok: true, json: { status: 'ok' } })
    expect((await getHealth()).status).toBe('ok')
  })

  it('throws ApiError with the HTTP status on a non-OK response', async () => {
    mockFetchOnce({ ok: false, status: 503 })
    await expect(getAnalyticsSummary()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
    })
  })

  it('throws ApiError with status 0 when the backend is unreachable', async () => {
    mockFetchOnce({ ok: true, reject: true })
    const err = await getViolations().catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/cannot reach the backend/i)
  })
})
