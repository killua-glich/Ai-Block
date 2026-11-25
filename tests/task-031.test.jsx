// Web site: My rentals reads the rentals from the API.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { resetDevices } from '../src/data/useDevices.js'
import { renderAt } from './helpers.jsx'
import { fakeApi, seedRentals } from './rentals-world.js'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const rental = { id: 'a', deviceId: 3, startDate: '2026-11-23', endDate: '2026-11-30', totalPrice: 320, createdAt: '' }

describe('031 My rentals and the API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    resetDevices()
  })

  it('shows a loading message while the rentals are on their way', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderAt('/rentals')
    expect(screen.getByText(/Loading your rentals/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'My rentals' })).toBeInTheDocument()
    expect(screen.queryByText('You have no rentals yet.')).not.toBeInTheDocument()
  })

  it('asks /api/rentals and shows what the server sends', async () => {
    seedRentals([rental])
    renderAt('/rentals')
    expect(await screen.findByText(devices.find((d) => d.id === 3).name)).toBeInTheDocument()
    expect(screen.getByText('€320')).toBeInTheDocument()
    expect(globalThis.fetch.mock.calls.some(([url]) => url === '/api/rentals')).toBe(true)
  })

  it('shows the empty state when the server has no rentals', async () => {
    fakeApi([])
    renderAt('/rentals')
    expect(await screen.findByText('You have no rentals yet.')).toBeInTheDocument()
    expect(screen.queryByText(/Loading your rentals/)).not.toBeInTheDocument()
  })

  it('no longer reads the rentals saved in the browser', async () => {
    localStorage.setItem('ai-block-rentals', JSON.stringify([rental]))
    fakeApi([])
    renderAt('/rentals')
    expect(await screen.findByText('You have no rentals yet.')).toBeInTheDocument()
  })

  it('says so when the rentals cannot be loaded, instead of claiming there are none', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply(500, { error: 'Something went wrong' })))
    renderAt('/rentals')
    expect(await screen.findByText(/Could not load your rentals/)).toHaveClass('error')
    expect(screen.queryByText('You have no rentals yet.')).not.toBeInTheDocument()
  })

  it('also says so when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    renderAt('/rentals')
    expect(await screen.findByText(/Could not load your rentals/)).toBeInTheDocument()
  })

  it('takes the device names from the devices of the database', async () => {
    const renamed = devices.map((d) => (d.id === 3 ? { ...d, name: 'Renamed Camera' } : d))
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url === '/api/devices') return reply(200, renamed)
        if (url === '/api/rentals') return reply(200, [rental])
        return reply(404, { error: 'Not found' })
      }),
    )
    renderAt('/rentals')
    expect(await screen.findByText('Renamed Camera')).toBeInTheDocument()
  })
})
