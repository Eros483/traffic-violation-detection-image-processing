import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViolationsList from './ViolationsList'
import { ApiError } from '../lib/api'
import { makeRecord } from '../test/fixtures'

// Mock the API module so the page is tested without a live backend.
vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, getViolations: vi.fn() }
})
import { getViolations } from '../lib/api'
const mockGetViolations = vi.mocked(getViolations)

function renderPage() {
  return render(
    <MemoryRouter>
      <ViolationsList />
    </MemoryRouter>,
  )
}

describe('ViolationsList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders fetched violations', async () => {
    mockGetViolations.mockResolvedValue({
      items: [makeRecord({ plate_number: 'KA-09-XY-4242' })],
      total: 1,
      page: 1,
    })
    renderPage()
    expect(await screen.findByText('KA-09-XY-4242')).toBeInTheDocument()
    expect(screen.getByText('1 record')).toBeInTheDocument()
  })

  it('shows an empty state when there are no records', async () => {
    mockGetViolations.mockResolvedValue({ items: [], total: 0, page: 1 })
    renderPage()
    expect(await screen.findByText(/no violations recorded yet/i)).toBeInTheDocument()
  })

  it('shows the "Backend not working" error state when the API fails', async () => {
    mockGetViolations.mockRejectedValue(new ApiError('Cannot reach the backend.', 0))
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('Backend not working')).toBeInTheDocument(),
    )
    expect(screen.getByText('Cannot reach the backend.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
