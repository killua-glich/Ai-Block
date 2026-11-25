// Web site: cancel a rental on the My rentals page.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, within, waitFor } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { resetDevices } from '../src/data/useDevices.js'
import { renderAt } from './helpers.jsx'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const ada = { id: 1, email: 'ada@example.com', name: 'Ada', role: 'user' }

// A fake server. `me` is the user the cookie belongs to (null: nobody). `routes` answer other addresses.
function serve({ me = null, routes = {} } = {}) {
  const calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET'
      calls.push({ url, method, body: options.body ? JSON.parse(options.body) : undefined })
      const handler = routes[`${method} ${url}`]
      if (handler) return typeof handler === 'function' ? handler(options) : handler
      if (url === '/api/auth/me') return me ? reply(200, { user: me }) : reply(401, { error: 'Not logged in.' })
      if (url === '/api/devices') return reply(200, devices)
      if (url === '/api/rentals') return reply(200, [])
      return reply(404, { error: 'Not found' })
    }),
  )
  return calls
}

const base = { userId: 1, totalPrice: 100, createdAt: '', cancelledAt: null }
const later = { ...base, id: 'later', deviceId: 3, startDate: '2026-12-10', endDate: '2026-12-12', status: 'active' }
const running = { ...base, id: 'running', deviceId: 4, startDate: '2026-11-20', endDate: '2026-11-30', status: 'active' }
const over = { ...base, id: 'over', deviceId: 5, startDate: '2026-10-01', endDate: '2026-10-03', status: 'active' }
const dropped = { ...base, id: 'dropped', deviceId: 6, startDate: '2026-12-20', endDate: '2026-12-22', status: 'cancelled', cancelledAt: 'x' }

const rentals = (list) => ({ 'GET /api/rentals': reply(200, list) })
const section = (name) => screen.getByRole('heading', { level: 2, name }).nextElementSibling
const nameOf = (id) => devices.find((d) => d.id === id).name

describe('047 cancel a rental', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    resetDevices()
  })

  it('only a rental that has not started yet has a Cancel button', async () => {
    serve({ me: ada, routes: rentals([later, running, over, dropped]) })
    renderAt('/rentals')
    await screen.findByText(nameOf(3))
    const buttons = screen.getAllByRole('button', { name: 'Cancel' })
    expect(buttons).toHaveLength(1)
    expect(buttons[0].closest('tr')).toHaveTextContent(nameOf(3))
  })

  it('a cancelled rental is listed under Past with the chip Cancelled', async () => {
    serve({ me: ada, routes: rentals([later, dropped]) })
    renderAt('/rentals')
    await screen.findByText(nameOf(3))
    expect(section('Active')).toHaveTextContent(nameOf(3))
    expect(section('Active')).not.toHaveTextContent(nameOf(6))
    const row = within(section('Past')).getByText(nameOf(6)).closest('tr')
    expect(within(row).getByText('Cancelled')).toHaveClass('chip')
    expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  })

  it('has a column for the buttons that screen readers can name, and keeps the other five', async () => {
    serve({ me: ada, routes: rentals([later]) })
    renderAt('/rentals')
    await screen.findByText(nameOf(3))
    const heads = [...document.querySelectorAll('th')].map((th) => th.textContent)
    expect(heads.slice(0, 5)).toEqual(['Device', 'From', 'To', 'Status', 'Total'])
    expect(heads[5]).toBe('Actions')
  })

  it('cancelling asks the server, then the rental moves to Past as Cancelled and loses its button', async () => {
    const calls = serve({
      me: ada,
      routes: { ...rentals([later]), 'POST /api/rentals/later/cancel': reply(200, { ...later, status: 'cancelled', cancelledAt: 'now' }) },
    })
    renderAt('/rentals')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(within(section('Past')).getByText('Cancelled')).toBeInTheDocument())
    expect(calls.some((c) => c.method === 'POST' && c.url === '/api/rentals/later/cancel')).toBe(true)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(section('Active') === null || section('Active').textContent).toBe('None.')
  })

  it('shows the message of the server when the cancel is refused, and keeps the rental', async () => {
    serve({
      me: ada,
      routes: { ...rentals([later]), 'POST /api/rentals/later/cancel': reply(409, { error: 'A rental that has started cannot be cancelled.' }) },
    })
    renderAt('/rentals')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A rental that has started cannot be cancelled.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
