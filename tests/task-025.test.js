// @vitest-environment node
// API: health check and the device routes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { listen } from './server-world.js'

let api

beforeAll(async () => {
  const db = openDb()
  seedDevices(db, devices)
  api = await listen(createApp(db))
})
afterAll(() => api.close())

const get = async (path) => {
  const res = await fetch(api.url + path)
  return { status: res.status, type: res.headers.get('content-type'), body: await res.json() }
}

describe('025 API: devices', () => {
  it('answers the health check', async () => {
    const res = await get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(res.type).toContain('application/json')
  })

  it('GET /api/devices lists all 14 devices, the same as the web site', async () => {
    const res = await get('/api/devices')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(14)
    expect(res.body).toEqual(devices)
  })

  it('GET /api/devices/3 gives one device', async () => {
    const res = await get('/api/devices/3')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(devices.find((d) => d.id === 3))
  })

  it('GET /api/devices/999 answers 404 with a JSON error', async () => {
    const res = await get('/api/devices/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Device not found' })
  })

  it('a device id that is not a number also answers 404', async () => {
    const res = await get('/api/devices/abc')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Device not found' })
  })

  it('an unknown address under /api answers 404 as JSON, not as a web page', async () => {
    const res = await get('/api/nothing-here')
    expect(res.status).toBe(404)
    expect(res.type).toContain('application/json')
    expect(res.body).toEqual({ error: 'Not found' })
  })
})
