// @vitest-environment node
// Database: seeding the 14 built-in devices and reading them back.
import { describe, it, expect } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { listDevices, getDevice } from '../server/devices.js'

const count = (db) => db.prepare('SELECT COUNT(*) AS n FROM devices').get().n

describe('023 seed and read devices', () => {
  it('seeds every built-in device and says how many', () => {
    const db = openDb()
    expect(seedDevices(db, devices)).toBe(devices.length)
    expect(count(db)).toBe(14)
  })

  it('seeding twice adds nothing the second time', () => {
    const db = openDb()
    seedDevices(db, devices)
    expect(seedDevices(db, devices)).toBe(0)
    expect(count(db)).toBe(14)
  })

  it('listDevices gives back exactly the devices of the web site', () => {
    const db = openDb()
    seedDevices(db, devices)
    expect(listDevices(db)).toEqual(devices)
  })

  it('listDevices is ordered by id', () => {
    const db = openDb()
    seedDevices(db, [...devices].reverse())
    expect(listDevices(db).map((d) => d.id)).toEqual(devices.map((d) => d.id))
  })

  it('getDevice finds one device by id', () => {
    const db = openDb()
    seedDevices(db, devices)
    expect(getDevice(db, 3)).toEqual(devices.find((d) => d.id === 3))
    expect(getDevice(db, 12).available).toBe(false)
  })

  it('getDevice returns null for an unknown id', () => {
    const db = openDb()
    seedDevices(db, devices)
    expect(getDevice(db, 999)).toBeNull()
    expect(getDevice(db, Number('abc'))).toBeNull()
  })

  it('a seed that fails half way leaves nothing behind', () => {
    const db = openDb()
    expect(() => seedDevices(db, [devices[0], devices[1], devices[0]])).toThrow()
    expect(count(db)).toBe(0)
  })
})
