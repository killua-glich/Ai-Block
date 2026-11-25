// Web site: the rental form saves through the API.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RentalForm from '../src/components/RentalForm.jsx'
import { fakeApi, savedRentals } from './rentals-world.js'

const device = { id: 3, name: 'Test', category: 'Camera', pricePerDay: 40, description: '', specs: ['a', 'b', 'c'], available: true }
const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })

function fill(start = '2026-12-01', end = '2026-12-02') {
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: start } })
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: end } })
}
const rent = () => fireEvent.click(screen.getByRole('button', { name: /rent/i }))

describe('030 rental form and the API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('sends the device and the two dates to POST /api/rentals, and nothing else', async () => {
    fakeApi()
    render(<RentalForm device={device} />)
    fill()
    rent()
    await screen.findByText('Rental confirmed!')
    const [url, options] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/rentals')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' })
    expect(savedRentals()[0].totalPrice).toBe(80)
  })

  it('confirms and empties the dates once the server has saved the rental', async () => {
    fakeApi()
    render(<RentalForm device={device} />)
    fill()
    rent()
    expect(await screen.findByText('Rental confirmed!')).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toHaveValue('')
    expect(screen.getByLabelText(/end date/i)).toHaveValue('')
  })

  it('shows the message of the server when it refuses, and keeps the dates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply(409, { error: 'Those dates are already booked.' })))
    render(<RentalForm device={device} />)
    fill()
    rent()
    expect(await screen.findByText('Those dates are already booked.')).toHaveClass('error')
    expect(screen.queryByText('Rental confirmed!')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toHaveValue('2026-12-01')
    expect(screen.getByRole('button', { name: /rent/i })).toBeEnabled()
  })

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    render(<RentalForm device={device} />)
    fill()
    rent()
    expect(await screen.findByText('Could not reach the server.')).toHaveClass('error')
    expect(screen.queryByText('Rental confirmed!')).not.toBeInTheDocument()
  })

  it('the Rent button is switched off while the rental is being saved', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<RentalForm device={device} />)
    fill()
    rent()
    expect(screen.getByRole('button', { name: /rent/i })).toBeDisabled()
  })

  it('a refusal is forgotten when the next try works', async () => {
    const answers = [reply(409, { error: 'Those dates are already booked.' }), reply(201, { id: 'x' })]
    vi.stubGlobal('fetch', vi.fn(async () => answers.shift()))
    render(<RentalForm device={device} />)
    fill()
    rent()
    await screen.findByText('Those dates are already booked.')
    rent()
    expect(await screen.findByText('Rental confirmed!')).toBeInTheDocument()
    expect(screen.queryByText('Those dates are already booked.')).not.toBeInTheDocument()
  })

  it('the checks in the form itself still work and send nothing', () => {
    fakeApi()
    render(<RentalForm device={device} />)
    fill('2026-12-05', '2026-12-01')
    expect(screen.getByText('End date must be after start date.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rent/i })).toBeDisabled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
