// Web site: the catalog and the detail page read the devices from the API.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { resetDevices } from '../src/data/useDevices.js'
import { renderAt } from './helpers.jsx'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const serve = (list) => vi.stubGlobal('fetch', vi.fn(async (url) => (url === '/api/devices' ? reply(200, list) : reply(404, { error: 'Not found' }))))
const never = () => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

const fromDatabase = [
  { ...devices[2], name: 'Renamed Camera' },
  { id: 50, name: 'Brand New Gadget', category: 'Laptop', pricePerDay: 99, description: 'Only in the database.', specs: ['a', 'b', 'c'], available: true },
]

afterEach(resetDevices)

describe('029 devices from the API', () => {
  it('shows the built-in devices at once, before the server has answered', () => {
    never()
    renderAt('/')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(devices.length)
    expect(screen.getByText(devices[0].name)).toBeInTheDocument()
  })

  it('swaps in the devices of the database when they arrive', async () => {
    serve(fromDatabase)
    renderAt('/')
    expect(await screen.findByText('Brand New Gadget')).toBeInTheDocument()
    expect(screen.getByText('Renamed Camera')).toBeInTheDocument()
    expect(screen.queryByText(devices[0].name)).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('keeps the built-in devices when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    renderAt('/')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(devices.length)
    expect(document.body).not.toHaveTextContent(/could not/i)
  })

  it('the detail page uses the device from the database', async () => {
    serve(fromDatabase)
    renderAt('/devices/3')
    expect(await screen.findByRole('heading', { level: 1, name: 'Renamed Camera' })).toBeInTheDocument()
  })

  it('the detail page finds a device that exists only in the database', async () => {
    serve(fromDatabase)
    renderAt('/devices/50')
    expect(await screen.findByRole('heading', { level: 1, name: 'Brand New Gadget' })).toBeInTheDocument()
  })

  it('remembers the list: a page opened later shows it at once', async () => {
    serve(fromDatabase)
    renderAt('/')
    await screen.findByText('Brand New Gadget')
    cleanup()

    never()
    renderAt('/')
    expect(screen.getByText('Brand New Gadget')).toBeInTheDocument()
  })

  it('resetDevices brings the built-in list back', async () => {
    serve(fromDatabase)
    renderAt('/')
    await screen.findByText('Brand New Gadget')
    cleanup()

    resetDevices()
    never()
    renderAt('/')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(devices.length)
  })
})
