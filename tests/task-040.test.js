// @vitest-environment node
// Accounts: cancelling a rental.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { createUser } from '../server/users.js'
import { createRental, cancelRental, listRentals } from '../server/rentals.js'
import { listen } from './server-world.js'

async function call(api, method, path, { body, cookie, raw } = {}) {
  const res = await fetch(api.url + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
  const text = await res.text()
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null }
}
const cookieOf = (res) => (res.headers.get('set-cookie') ?? '').split(';')[0]

const TODAY = '2026-11-24'
const stay = { deviceId: 3, startDate: '2026-12-10', endDate: '2026-12-12' }
let db
let ada
let bob
let admin

beforeEach(() => {
  db = openDb()
  seedDevices(db, devices)
  ada = createUser(db, { email: 'ada@example.com', name: 'Ada', password: 'correct horse battery' })
  bob = createUser(db, { email: 'bob@example.com', name: 'Bob', password: 'correct horse battery' })
  admin = createUser(db, { email: 'admin@example.com', name: 'Admin', password: 'correct horse battery', role: 'admin' })
})

const failure = (fn) => {
  try {
    fn()
  } catch (err) {
    return err
  }
  return null
}

describe('040 cancel a rental', () => {
  it('the owner cancels a rental that has not started: status and time change', () => {
    const rental = createRental(db, stay, TODAY, ada.id)
    const cancelled = cancelRental(db, rental.id, ada, TODAY)
    expect(cancelled).toMatchObject({ id: rental.id, status: 'cancelled', userId: ada.id })
    expect(typeof cancelled.cancelledAt).toBe('string')
    expect(listRentals(db).find((r) => r.id === rental.id).status).toBe('cancelled')
  })

  it('an active rental has no cancel time', () => {
    expect(createRental(db, stay, TODAY, ada.id).cancelledAt).toBeNull()
  })

  it('someone else gets "Rental not found", an admin may cancel anyone\'s rental', () => {
    const rental = createRental(db, stay, TODAY, ada.id)
    const err = failure(() => cancelRental(db, rental.id, bob, TODAY))
    expect(err).toMatchObject({ status: 404, message: 'Rental not found' })
    expect(listRentals(db)[0].status).toBe('active')
    expect(cancelRental(db, rental.id, admin, TODAY).status).toBe('cancelled')
  })

  it('an unknown rental is "not found" too', () => {
    expect(failure(() => cancelRental(db, 'nope', ada, TODAY))).toMatchObject({ status: 404 })
  })

  it('cancelling twice answers 409', () => {
    const rental = createRental(db, stay, TODAY, ada.id)
    cancelRental(db, rental.id, ada, TODAY)
    expect(failure(() => cancelRental(db, rental.id, ada, TODAY))).toMatchObject({ status: 409, message: 'This rental is already cancelled.' })
  })

  it('a rental that starts today or has started cannot be cancelled', () => {
    const today = createRental(db, { ...stay, startDate: TODAY, endDate: '2026-11-25' }, TODAY, ada.id)
    const err = failure(() => cancelRental(db, today.id, ada, TODAY))
    expect(err).toMatchObject({ status: 409, message: 'A rental that has started cannot be cancelled.' })
    expect(failure(() => cancelRental(db, today.id, ada, '2026-11-30'))).toMatchObject({ status: 409 })
  })

  it('after the cancel, someone else can book the same days', () => {
    const rental = createRental(db, stay, TODAY, ada.id)
    expect(failure(() => createRental(db, stay, TODAY, bob.id))).toMatchObject({ status: 409 })
    cancelRental(db, rental.id, ada, TODAY)
    expect(failure(() => createRental(db, stay, TODAY, bob.id))).toBeNull()
  })
})

describe('040 the cancel route', () => {
  let api
  const future = { deviceId: 3, startDate: '2099-04-10', endDate: '2099-04-12' }
  const signUp = async (email) => {
    const res = await call(api, 'POST', '/api/auth/register', { body: { email: `x${email}`, name: 'T', password: 'correct horse battery' } })
    return cookieOf(res)
  }

  beforeEach(async () => {
    api = await listen(createApp(db))
  })
  afterEach(() => api.close())

  it('needs a login', async () => {
    expect(await call(api, 'POST', '/api/rentals/abc/cancel')).toMatchObject({ status: 401 })
  })

  it('cancels your own rental and answers it with status cancelled', async () => {
    const cookie = await signUp('one@example.com')
    const made = await call(api, 'POST', '/api/rentals', { body: future, cookie })
    const res = await call(api, 'POST', `/api/rentals/${made.body.id}/cancel`, { cookie })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: made.body.id, status: 'cancelled' })
    expect((await call(api, 'GET', '/api/rentals', { cookie })).body[0].status).toBe('cancelled')
  })

  it('a rental of someone else answers 404', async () => {
    const owner = await signUp('owner@example.com')
    const other = await signUp('other@example.com')
    const made = await call(api, 'POST', '/api/rentals', { body: future, cookie: owner })
    expect(await call(api, 'POST', `/api/rentals/${made.body.id}/cancel`, { cookie: other })).toMatchObject({
      status: 404,
      body: { error: 'Rental not found' },
    })
  })

  it('cancelling again answers 409', async () => {
    const cookie = await signUp('twice@example.com')
    const made = await call(api, 'POST', '/api/rentals', { body: future, cookie })
    await call(api, 'POST', `/api/rentals/${made.body.id}/cancel`, { cookie })
    expect((await call(api, 'POST', `/api/rentals/${made.body.id}/cancel`, { cookie })).status).toBe(409)
  })
})
