import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { getRentals, addRental } from '../src/data/rentals.js'
import RentalForm from '../src/components/RentalForm.jsx'

const KEY = 'ai-block-rentals'
const device = { id: 3, name: 'Test', category: 'Camera', pricePerDay: 40, description: '', specs: ['a', 'b', 'c'], available: true }

describe('005 rentals store', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('getRentals returns [] when empty or corrupt', () => {
    expect(getRentals()).toEqual([])
    localStorage.setItem(KEY, '{not json')
    expect(getRentals()).toEqual([])
  })

  it('addRental appends and persists under the right key', () => {
    addRental({ id: 'a' })
    addRental({ id: 'b' })
    expect(getRentals().map((r) => r.id)).toEqual(['a', 'b'])
    expect(JSON.parse(localStorage.getItem(KEY))).toHaveLength(2)
  })

  it('clicking Rent saves the rental, confirms and resets the dates', () => {
    render(<RentalForm device={device} />)
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-12-02' } })
    fireEvent.click(screen.getByRole('button', { name: /rent/i }))

    expect(screen.getByText('Rental confirmed!')).toBeInTheDocument()
    const [r] = getRentals()
    expect(r).toMatchObject({ deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02', totalPrice: 80 })
    expect(typeof r.id).toBe('string')
    expect(typeof r.createdAt).toBe('string')
    expect(screen.getByLabelText(/start date/i)).toHaveValue('')
  })
})
