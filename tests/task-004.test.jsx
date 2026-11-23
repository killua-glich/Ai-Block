import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RentalForm from '../src/components/RentalForm.jsx'
import { renderAt } from './helpers.jsx'

const device = { id: 1, name: 'Test', category: 'Laptop', pricePerDay: 25, description: '', specs: ['a', 'b', 'c'], available: true }

function fill(start, end) {
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: start } })
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: end } })
}
const rentButton = () => screen.getByRole('button', { name: /rent/i })

describe('004 rental form', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('shows days and total price for a valid range, inclusive of both days', () => {
    render(<RentalForm device={device} />)
    fill('2026-12-01', '2026-12-05')
    expect(screen.getByText(/5 day/)).toBeInTheDocument()
    expect(screen.getByText(/CHF\s*125/)).toBeInTheDocument()
    expect(rentButton()).toBeEnabled()
  })

  it('same day counts as 1 day', () => {
    render(<RentalForm device={device} />)
    fill('2026-12-01', '2026-12-01')
    expect(screen.getByText(/CHF\s*25\b/)).toBeInTheDocument()
  })

  it('handles the daylight-saving change in March', () => {
    render(<RentalForm device={device} />)
    fill('2027-03-27', '2027-03-29')
    expect(screen.getByText(/CHF\s*75\b/)).toBeInTheDocument()
  })

  it('rejects a start date in the past', () => {
    render(<RentalForm device={device} />)
    fill('2026-11-20', '2026-11-25')
    expect(screen.getByText('Start date cannot be in the past.')).toBeInTheDocument()
    expect(rentButton()).toBeDisabled()
  })

  it('rejects an end date before the start date', () => {
    render(<RentalForm device={device} />)
    fill('2026-12-05', '2026-12-01')
    expect(screen.getByText('End date must be after start date.')).toBeInTheDocument()
    expect(rentButton()).toBeDisabled()
  })

  it('button is disabled before dates are chosen', () => {
    render(<RentalForm device={device} />)
    expect(rentButton()).toBeDisabled()
  })

  it('unavailable devices cannot be rented', () => {
    render(<RentalForm device={{ ...device, available: false }} />)
    fill('2026-12-01', '2026-12-05')
    expect(screen.getByText('This device is currently not available.')).toBeInTheDocument()
    expect(rentButton()).toBeDisabled()
  })

  it('detail page uses the form instead of the old placeholder button', () => {
    renderAt('/devices/1')
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })
})
