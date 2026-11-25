// Web site: the small client for the API.
import { describe, it, expect, vi } from 'vitest'
import { fetchDevices, fetchDevice, fetchRentals, postRental, ApiError } from '../src/data/api.js'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const stub = (impl) => {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('028 API client', () => {
  it('fetchDevices asks /api/devices and returns the list', async () => {
    const fn = stub(async () => reply(200, [{ id: 1 }]))
    expect(await fetchDevices()).toEqual([{ id: 1 }])
    expect(fn.mock.calls[0][0]).toBe('/api/devices')
  })

  it('fetchDevice asks for one device by id', async () => {
    const fn = stub(async () => reply(200, { id: 3 }))
    expect(await fetchDevice(3)).toEqual({ id: 3 })
    expect(fn.mock.calls[0][0]).toBe('/api/devices/3')
  })

  it('fetchRentals asks /api/rentals', async () => {
    const fn = stub(async () => reply(200, []))
    expect(await fetchRentals()).toEqual([])
    expect(fn.mock.calls[0][0]).toBe('/api/rentals')
  })

  it('postRental sends JSON with only the device and the two dates', async () => {
    const fn = stub(async () => reply(201, { id: 'x' }))
    const saved = await postRental({ deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02', totalPrice: 99, id: 'mine' })
    expect(saved).toEqual({ id: 'x' })
    const [url, options] = fn.mock.calls[0]
    expect(url).toBe('/api/rentals')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' })
  })

  it('throws an ApiError with the status and the message of the server', async () => {
    stub(async () => reply(409, { error: 'Those dates are already booked.' }))
    const err = await postRental({ deviceId: 3, startDate: 'a', endDate: 'b' }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(409)
    expect(err.message).toBe('Those dates are already booked.')
  })

  it('makes up a message when the error answer is not JSON', async () => {
    stub(async () => ({ ok: false, status: 500, json: async () => { throw new Error('not json') } }))
    const err = await fetchDevices().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(500)
    expect(err.message).toBe('Request failed (500)')
  })

  it('says so when the server cannot be reached', async () => {
    stub(async () => { throw new TypeError('Failed to fetch') })
    const err = await fetchRentals().catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(ApiError)
    expect(err.message).toBe('Could not reach the server.')
  })
})
