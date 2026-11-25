// @vitest-environment node
// Admin: add, change and delete devices.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { createUser } from '../server/users.js'
import { createRental } from '../server/rentals.js'
import { listDevices, getDevice, createDevice, updateDevice, deleteDevice, DeviceError } from '../server/devices.js'
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

const NOW = '2026-11-24T10:00:00.000Z'
const good = { name: 'Insta360 X4', category: 'Camera', pricePerDay: 30, description: '360 degree camera.', specs: ['8K video', 'Waterproof'], available: true }
let db

beforeEach(() => {
  db = openDb()
  seedDevices(db, devices)
})

const failure = (fn) => {
  try {
    fn()
  } catch (err) {
    return err
  }
  return null
}

describe('041 device functions', () => {
  it('createDevice adds a device with the next id and returns it in the shape of the site', () => {
    const device = createDevice(db, good, NOW)
    expect(device).toEqual({ id: 15, ...good })
    expect(listDevices(db)).toHaveLength(15)
  })

  it('fills in the defaults: no description, no specs, available', () => {
    const device = createDevice(db, { name: 'Plain', category: 'Laptop', pricePerDay: 5 }, NOW)
    expect(device).toMatchObject({ description: '', specs: [], available: true })
  })

  it('cleans up the text it is given', () => {
    const device = createDevice(db, { ...good, name: '  Insta360 X4 ', specs: [' 8K video '] }, NOW)
    expect(device.name).toBe('Insta360 X4')
    expect(device.specs).toEqual(['8K video'])
  })

  it('refuses wrong input with 400 and a clear message', () => {
    const cases = [
      [{ ...good, name: '  ' }, 'Please enter a name (up to 120 characters).'],
      [{ ...good, name: 'x'.repeat(121) }, 'Please enter a name (up to 120 characters).'],
      [{ ...good, category: '' }, 'Please enter a category (up to 40 characters).'],
      [{ ...good, pricePerDay: '30' }, 'The price per day must be a number, zero or more.'],
      [{ ...good, pricePerDay: -1 }, 'The price per day must be a number, zero or more.'],
      [{ ...good, pricePerDay: NaN }, 'The price per day must be a number, zero or more.'],
      [{ ...good, description: 5 }, 'The description must be text of up to 1000 characters.'],
      [{ ...good, specs: 'fast' }, 'The specs must be a list of up to 20 texts.'],
      [{ ...good, specs: ['ok', ' '] }, 'The specs must be a list of up to 20 texts.'],
      [{ ...good, available: 'yes' }, 'Available must be true or false.'],
      [undefined, 'Please enter a name (up to 120 characters).'],
    ]
    for (const [input, message] of cases) {
      const err = failure(() => createDevice(db, input, NOW))
      expect(err, message).toBeInstanceOf(DeviceError)
      expect(err.status).toBe(400)
      expect(err.message).toBe(message)
    }
    expect(listDevices(db)).toHaveLength(14)
  })

  it('a name that exists already answers 409', () => {
    const err = failure(() => createDevice(db, { ...good, name: devices[0].name }, NOW))
    expect(err).toMatchObject({ status: 409, message: 'A device with that name already exists.' })
  })

  it('updateDevice changes every field and the update time', () => {
    const updated = updateDevice(db, 3, { ...good, name: 'Renamed', available: false }, NOW)
    expect(updated).toEqual({ id: 3, ...good, name: 'Renamed', available: false })
    expect(db.prepare('SELECT updated_at FROM devices WHERE id = 3').get().updated_at).toBe(NOW)
  })

  it('updateDevice keeps the own name, refuses the name of another device, and an unknown id', () => {
    expect(failure(() => updateDevice(db, 3, { ...good, name: devices[2].name }, NOW))).toBeNull()
    expect(failure(() => updateDevice(db, 3, { ...good, name: devices[0].name }, NOW))).toMatchObject({ status: 409 })
    expect(failure(() => updateDevice(db, 999, good, NOW))).toMatchObject({ status: 404, message: 'Device not found' })
  })

  it('deleteDevice removes a device that has no rentals', () => {
    deleteDevice(db, 14)
    expect(getDevice(db, 14)).toBeNull()
    expect(failure(() => deleteDevice(db, 14))).toMatchObject({ status: 404 })
  })

  it('deleteDevice refuses a device that has rentals', () => {
    createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, '2026-11-24')
    const err = failure(() => deleteDevice(db, 3))
    expect(err).toMatchObject({ status: 409 })
    expect(err.message).toMatch(/has rentals/)
    expect(getDevice(db, 3)).not.toBeNull()
  })
})

describe('041 device routes', () => {
  let api
  let adminCookie
  let userCookie

  beforeEach(async () => {
    createUser(db, { email: 'admin@example.com', name: 'Admin', password: 'correct horse battery', role: 'admin' })
    api = await listen(createApp(db))
    adminCookie = cookieOf(await call(api, 'POST', '/api/auth/login', { body: { email: 'admin@example.com', password: 'correct horse battery' } }))
    userCookie = cookieOf(await call(api, 'POST', '/api/auth/register', { body: { email: 'user@example.com', name: 'U', password: 'correct horse battery' } }))
  })
  afterEach(() => api.close())

  it('adding, changing and deleting need a login: 401 without one, 403 for a normal user', async () => {
    const attempts = [
      () => call(api, 'POST', '/api/devices', { body: good }),
      () => call(api, 'PUT', '/api/devices/3', { body: good }),
      () => call(api, 'DELETE', '/api/devices/14'),
    ]
    for (const attempt of attempts) expect((await attempt()).status).toBe(401)
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const path = method === 'POST' ? '/api/devices' : '/api/devices/14'
      const res = await call(api, method, path, { body: good, cookie: userCookie })
      expect(res, method).toMatchObject({ status: 403, body: { error: 'Admins only.' } })
    }
    expect(listDevices(db)).toHaveLength(14)
  })

  it('an admin adds a device and everybody sees it', async () => {
    const res = await call(api, 'POST', '/api/devices', { body: good, cookie: adminCookie })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 15, ...good })
    const list = await call(api, 'GET', '/api/devices')
    expect(list.body).toHaveLength(15)
  })

  it('an admin changes a device', async () => {
    const res = await call(api, 'PUT', '/api/devices/3', { body: { ...good, name: 'Renamed' }, cookie: adminCookie })
    expect(res).toMatchObject({ status: 200, body: { id: 3, name: 'Renamed' } })
    expect((await call(api, 'GET', '/api/devices/3')).body.name).toBe('Renamed')
  })

  it('an admin deletes a device: 204, and then it is gone', async () => {
    expect((await call(api, 'DELETE', '/api/devices/14', { cookie: adminCookie })).status).toBe(204)
    expect((await call(api, 'GET', '/api/devices/14')).status).toBe(404)
  })

  it('wrong input and clashes answer with the status and message of the function', async () => {
    const bad = await call(api, 'POST', '/api/devices', { body: { ...good, pricePerDay: -5 }, cookie: adminCookie })
    expect(bad).toMatchObject({ status: 400, body: { error: 'The price per day must be a number, zero or more.' } })
    const clash = await call(api, 'POST', '/api/devices', { body: { ...good, name: devices[0].name }, cookie: adminCookie })
    expect(clash.status).toBe(409)
    expect((await call(api, 'PUT', '/api/devices/999', { body: good, cookie: adminCookie })).status).toBe(404)
    expect((await call(api, 'DELETE', '/api/devices/abc', { cookie: adminCookie })).status).toBe(404)
  })
})
