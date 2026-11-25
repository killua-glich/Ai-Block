// @vitest-environment node
// API: listing and creating rentals.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { listen, authHeaders } from './server-world.js'

let api
let who = {}
const unavailable = devices.find((d) => !d.available)

beforeEach(async () => {
  const db = openDb()
  seedDevices(db, devices)
  api = await listen(createApp(db))
  who = await authHeaders(api)
})
afterEach(() => api.close())

const send = async (method, path, body, raw) => {
  const res = await fetch(api.url + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...who },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
  return { status: res.status, body: await res.json() }
}
const post = (body, raw) => send('POST', '/api/rentals', body, raw)
const ok = { deviceId: 3, startDate: '2099-01-10', endDate: '2099-01-12' }

describe('026 API: rentals', () => {
  it('starts with an empty list', async () => {
    expect(await send('GET', '/api/rentals')).toEqual({ status: 200, body: [] })
  })

  it('POST creates a rental: status 201 and the saved rental', async () => {
    const res = await post(ok)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ deviceId: 3, startDate: '2099-01-10', endDate: '2099-01-12', totalPrice: 120 })
    expect(typeof res.body.id).toBe('string')
    expect(typeof res.body.createdAt).toBe('string')
  })

  it('a created rental shows up in GET /api/rentals', async () => {
    const created = await post(ok)
    const list = await send('GET', '/api/rentals')
    expect(list.status).toBe(200)
    expect(list.body).toEqual([created.body])
  })

  it('the client cannot choose the price, the id or the time stamp', async () => {
    const res = await post({ ...ok, totalPrice: 1, id: 'mine', createdAt: 'yesterday' })
    expect(res.status).toBe(201)
    expect(res.body.totalPrice).toBe(120)
    expect(res.body.id).not.toBe('mine')
    expect(res.body.createdAt).not.toBe('yesterday')
  })

  it('answers 400 for broken JSON', async () => {
    const res = await post(undefined, '{not json')
    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
  })

  it('answers 400 when the body is empty or a field is missing', async () => {
    expect((await post(undefined)).status).toBe(400)
    expect((await post({ deviceId: 3, startDate: '2099-01-10' })).status).toBe(400)
  })

  it('answers 400 for a start date in the past and for an end before the start', async () => {
    const past = await post({ ...ok, startDate: '2000-01-01', endDate: '2000-01-02' })
    expect(past).toEqual({ status: 400, body: { error: 'Start date cannot be in the past.' } })
    const backwards = await post({ ...ok, startDate: '2099-01-12', endDate: '2099-01-10' })
    expect(backwards).toEqual({ status: 400, body: { error: 'End date must be after start date.' } })
  })

  it('answers 404 for an unknown device', async () => {
    expect(await post({ ...ok, deviceId: 999 })).toEqual({ status: 404, body: { error: 'Device not found' } })
  })

  it('answers 409 for an unavailable device', async () => {
    const res = await post({ ...ok, deviceId: unavailable.id })
    expect(res).toEqual({ status: 409, body: { error: 'This device is currently not available.' } })
  })

  it('answers 409 when the dates are already booked, and does not save the second rental', async () => {
    await post(ok)
    const res = await post({ ...ok, startDate: '2099-01-11', endDate: '2099-01-20' })
    expect(res).toEqual({ status: 409, body: { error: 'Those dates are already booked.' } })
    expect((await send('GET', '/api/rentals')).body).toHaveLength(1)
  })

  it('unknown addresses still answer 404 as JSON', async () => {
    expect(await send('GET', '/api/nope')).toEqual({ status: 404, body: { error: 'Not found' } })
  })
})
