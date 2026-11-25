// @vitest-environment node
// Accounts: a rental belongs to the user who made it, and you only see your own.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { createUser } from '../server/users.js'
import { createRental, listRentals } from '../server/rentals.js'
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

let db
let api
const TODAY = '2026-11-24'
const stay = { deviceId: 3, startDate: '2099-02-10', endDate: '2099-02-12' }

beforeEach(async () => {
  db = openDb()
  seedDevices(db, devices)
  api = await listen(createApp(db))
})
afterEach(() => api.close())

async function signUp(email) {
  const res = await call(api, 'POST', '/api/auth/register', { body: { email, name: 'Test', password: 'correct horse battery' } })
  return { cookie: cookieOf(res), id: res.body.user.id }
}

describe('039 rentals belong to users', () => {
  it('createRental saves the owner, and a rental without one has none', () => {
    const user = createUser(db, { email: 'a@example.com', name: 'A', password: 'correct horse battery' })
    const mine = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY, user.id)
    const nobody = createRental(db, { deviceId: 4, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY)
    expect(mine.userId).toBe(user.id)
    expect(nobody.userId).toBeNull()
    expect(listRentals(db).find((r) => r.id === mine.id)).toEqual(mine)
  })

  it('listRentals can show the rentals of one user only', () => {
    const a = createUser(db, { email: 'a@example.com', name: 'A', password: 'correct horse battery' })
    const b = createUser(db, { email: 'b@example.com', name: 'B', password: 'correct horse battery' })
    const one = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY, a.id)
    createRental(db, { deviceId: 4, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY, b.id)
    expect(listRentals(db, { userId: a.id })).toEqual([one])
    expect(listRentals(db, { userId: 999 })).toEqual([])
    expect(listRentals(db)).toHaveLength(2)
  })

  it('without a login, listing and renting both answer 401', async () => {
    expect(await call(api, 'GET', '/api/rentals')).toMatchObject({ status: 401, body: { error: 'Please log in.' } })
    expect(await call(api, 'POST', '/api/rentals', { body: stay })).toMatchObject({ status: 401, body: { error: 'Please log in.' } })
    expect(listRentals(db)).toEqual([])
  })

  it('a logged-in user rents a device and is the owner of the rental', async () => {
    const ada = await signUp('ada@example.com')
    const res = await call(api, 'POST', '/api/rentals', { body: stay, cookie: ada.cookie })
    expect(res.status).toBe(201)
    expect(res.body.userId).toBe(ada.id)
  })

  it('everyone sees only their own rentals', async () => {
    const ada = await signUp('ada@example.com')
    const bob = await signUp('bob@example.com')
    const adas = await call(api, 'POST', '/api/rentals', { body: stay, cookie: ada.cookie })
    const bobs = await call(api, 'POST', '/api/rentals', { body: { ...stay, deviceId: 4 }, cookie: bob.cookie })

    expect((await call(api, 'GET', '/api/rentals', { cookie: ada.cookie })).body).toEqual([adas.body])
    expect((await call(api, 'GET', '/api/rentals', { cookie: bob.cookie })).body).toEqual([bobs.body])
  })

  it('two users cannot book the same device on the same days', async () => {
    const ada = await signUp('ada@example.com')
    const bob = await signUp('bob@example.com')
    await call(api, 'POST', '/api/rentals', { body: stay, cookie: ada.cookie })
    const clash = await call(api, 'POST', '/api/rentals', { body: stay, cookie: bob.cookie })
    expect(clash).toMatchObject({ status: 409, body: { error: 'Those dates are already booked.' } })
  })

  it('the checks still answer as before for a logged-in user', async () => {
    const ada = await signUp('ada@example.com')
    const past = await call(api, 'POST', '/api/rentals', { body: { ...stay, startDate: '2000-01-01', endDate: '2000-01-02' }, cookie: ada.cookie })
    expect(past).toMatchObject({ status: 400, body: { error: 'Start date cannot be in the past.' } })
    const unknown = await call(api, 'POST', '/api/rentals', { body: { ...stay, deviceId: 999 }, cookie: ada.cookie })
    expect(unknown.status).toBe(404)
  })

  it('a deleted user leaves their rental behind, without an owner, and nobody sees it any more', async () => {
    const ada = await signUp('ada@example.com')
    const bob = await signUp('bob@example.com')
    const made = await call(api, 'POST', '/api/rentals', { body: stay, cookie: ada.cookie })
    db.prepare('DELETE FROM users WHERE id = ?').run(ada.id)
    expect(listRentals(db).find((r) => r.id === made.body.id).userId).toBeNull()
    expect((await call(api, 'GET', '/api/rentals', { cookie: bob.cookie })).body).toEqual([])
  })
})
