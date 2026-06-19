import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useFetch } from './useFetch'
import { ApiError } from '../lib/api'

describe('useFetch', () => {
  it('starts loading, then resolves with data', async () => {
    const { result } = renderHook(() => useFetch(() => Promise.resolve({ n: 1 })))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual({ n: 1 })
    expect(result.current.error).toBeNull()
  })

  it('captures an ApiError message on failure', async () => {
    const { result } = renderHook(() =>
      useFetch(() => Promise.reject(new ApiError('Backend down', 0))),
    )

    await waitFor(() => expect(result.current.error).toBe('Backend down'))
    expect(result.current.data).toBeNull()
  })

  it('reload re-runs the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useFetch(fetcher))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => result.current.reload())
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
