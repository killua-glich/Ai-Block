import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'
import { seedRentals } from './rentals-world.js'

const seed = seedRentals

describe('006 my rentals page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('header links to /rentals', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /my rentals/i })).toHaveAttribute('href', '/rentals')
  })

  it('shows an empty state', async () => {
    seed([])
    renderAt('/rentals')
    expect(await screen.findByText('You have no rentals yet.')).toBeInTheDocument()
  })

  it('splits rentals into Active and Past with device names and totals', async () => {
    seed([
      { id: 'a', deviceId: devices[0].id, startDate: '2026-11-23', endDate: '2026-11-30', totalPrice: 111, createdAt: '' },
      { id: 'b', deviceId: devices[1].id, startDate: '2026-10-01', endDate: '2026-10-03', totalPrice: 222, createdAt: '' },
    ])
    renderAt('/rentals')
    const active = await screen.findByRole('heading', { name: 'Active' })
    const past = screen.getByRole('heading', { name: 'Past' })
    const activeBlock = active.nextElementSibling
    const pastBlock = past.nextElementSibling
    expect(activeBlock).toHaveTextContent(devices[0].name)
    expect(activeBlock).toHaveTextContent(/(?:CHF|€)\s*111/)
    expect(pastBlock).toHaveTextContent(devices[1].name)
    expect(pastBlock).toHaveTextContent(/(?:CHF|€)\s*222/)
  })

  it('shows "None." for an empty section and handles unknown devices', async () => {
    seed([{ id: 'a', deviceId: 9999, startDate: '2026-12-01', endDate: '2026-12-02', totalPrice: 5, createdAt: '' }])
    renderAt('/rentals')
    expect(await screen.findByText('Unknown device')).toBeInTheDocument()
    expect(screen.getByText('None.')).toBeInTheDocument()
  })
})
