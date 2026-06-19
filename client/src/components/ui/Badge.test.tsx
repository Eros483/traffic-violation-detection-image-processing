import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders the human label for a known type', () => {
    render(<Badge type="helmet" />)
    expect(screen.getByText('No Helmet')).toBeInTheDocument()
  })

  it('humanizes an unknown type instead of rendering blank', () => {
    render(<Badge type="wrong_side_driving" />)
    expect(screen.getByText('Wrong Side Driving')).toBeInTheDocument()
  })
})
