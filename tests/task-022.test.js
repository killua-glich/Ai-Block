// @vitest-environment node
// Database: the SQLite schema for devices and rentals.
import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDb } from '../server/db.js'
import { insertDevice, insertRental } from './db-helpers.js'

const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
const addDevice = (db, id = 1) => insertDevice(db, { id })
const addRental = (db, deviceId, start = '2026-12-01', end = '2026-12-02') =>
  insertRental(db, { id: 'r1', deviceId, start, end, total: 20, createdAt: '2026-11-24T10:00:00.000Z' })
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n

describe('022 database schema', () => {
  it('has a devices and a rentals table with the agreed columns', () => {
    const db = openDb()
    // Later tickets add and rename columns (status, user_id, prices in cents ...): these stay.
    expect(columns(db, 'devices')).toEqual(expect.arrayContaining(['id', 'name', 'description', 'specs', 'available']))
    expect(columns(db, 'rentals')).toEqual(expect.arrayContaining(['id', 'device_id', 'start_date', 'end_date', 'created_at']))
  })

  it('gives a new device the defaults: no description, no specs, available', () => {
    const db = openDb()
    addDevice(db)
    const device = db.prepare('SELECT * FROM devices WHERE id = 1').get()
    expect(device.description).toBe('')
    expect(device.specs).toBe('[]')
    expect(device.available).toBe(1)
  })

  it('accepts a rental for a device that exists', () => {
    const db = openDb()
    addDevice(db)
    addRental(db, 1)
    expect(count(db, 'rentals')).toBe(1)
  })

  it('refuses a rental for a device that does not exist', () => {
    const db = openDb()
    expect(() => addRental(db, 99)).toThrow()
    expect(count(db, 'rentals')).toBe(0)
  })

  it('refuses a rental that ends before it starts', () => {
    const db = openDb()
    addDevice(db)
    expect(() => addRental(db, 1, '2026-12-05', '2026-12-01')).toThrow()
  })

  it('refuses a negative price and an available flag other than 0 or 1', () => {
    const db = openDb()
    expect(() => insertDevice(db, { id: 1, name: 'A', category: 'B', price: -5 })).toThrow()
    expect(() => insertDevice(db, { id: 1, name: 'A', category: 'B', price: 5, available: 2 })).toThrow()
  })

  it('opening the same file again keeps the data', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'test.db')
      const first = openDb(file)
      addDevice(first)
      first.close()
      const second = openDb(file)
      expect(count(second, 'devices')).toBe(1)
      second.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
