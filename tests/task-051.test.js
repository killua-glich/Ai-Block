// @vitest-environment node
// Database: schema version 6. Categories get a table of their own, and device prices are whole cents.
import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import devices from '../src/data/devices.js'
import { MIGRATIONS, migrate, currentVersion } from '../server/migrations.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { listDevices, getDevice, createDevice, updateDevice } from '../server/devices.js'
import { createRental, listRentals } from '../server/rentals.js'
import { insertDevice } from './db-helpers.js'

const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n
let db

beforeEach(() => {
  db = openDb()
  seedDevices(db, devices)
})

describe('051 schema version 6', () => {
  it('is a step that rebuilds a table, with foreign keys off', () => {
    const step = MIGRATIONS.find((m) => m.version === 6)
    expect(step).toBeDefined()
    expect(step.foreignKeys).toBe(false)
    expect(currentVersion(db)).toBeGreaterThanOrEqual(6)
  })

  it('has a categories table, and devices link to it and store whole cents', () => {
    expect(columns(db, 'categories')).toEqual(['id', 'name'])
    expect(columns(db, 'devices')).toEqual(['id', 'name', 'category_id', 'price_cents', 'description', 'specs', 'available', 'updated_at'])
  })

  it('the seeded devices have 7 categories, each name once', () => {
    expect(count(db, 'categories')).toBe(7)
    const names = db.prepare('SELECT name FROM categories ORDER BY name').all().map((c) => c.name)
    expect(names).toEqual(['Audio', 'Camera', 'Drone', 'Gaming', 'Laptop', 'Phone', 'Tablet'])
  })

  it('the devices come back exactly as before: the category as text, the price in euros', () => {
    expect(listDevices(db)).toEqual(devices)
    expect(getDevice(db, 3)).toEqual(devices.find((d) => d.id === 3))
    expect(getDevice(db, 999)).toBeNull()
  })

  it('the price is a whole number of cents, nothing else is accepted', () => {
    expect(() => insertDevice(db, { id: 30, name: 'ok', category: 'Camera', price: 12.34 })).not.toThrow()
    expect(db.prepare('SELECT price_cents FROM devices WHERE id = 30').get().price_cents).toBe(1234)
    const raw = (cents) =>
      db.prepare("INSERT INTO devices (id, name, category_id, price_cents) VALUES (31, 'raw', 1, ?)").run(cents)
    expect(() => raw(12.5)).toThrow()
    expect(() => raw(-1)).toThrow()
  })

  it('a device needs a category that exists', () => {
    expect(() => db.prepare("INSERT INTO devices (id, name, category_id, price_cents) VALUES (40, 'x', 999, 100)").run()).toThrow()
  })

  it('createDevice finds the category in any letter case and makes a new one when needed', () => {
    const before = count(db, 'categories')
    const same = createDevice(db, { name: 'Another camera', category: 'camera', pricePerDay: 12.34 })
    expect(same.category).toBe('Camera')
    expect(same.pricePerDay).toBe(12.34)
    expect(count(db, 'categories')).toBe(before)

    const fresh = createDevice(db, { name: 'A scooter', category: 'Scooter', pricePerDay: 9 })
    expect(fresh.category).toBe('Scooter')
    expect(count(db, 'categories')).toBe(before + 1)
  })

  it('updateDevice can move a device to another category and change its price', () => {
    const updated = updateDevice(db, 3, { name: 'Sony Alpha 7 IV', category: 'Drone', pricePerDay: 45.5, description: 'x', specs: [], available: true })
    expect(updated).toMatchObject({ category: 'Drone', pricePerDay: 45.5 })
    expect(db.prepare('SELECT price_cents FROM devices WHERE id = 3').get().price_cents).toBe(4550)
  })

  it('rentals still work, also for a device with a price that has cents', () => {
    const device = createDevice(db, { name: 'Odd price', category: 'Laptop', pricePerDay: 12.34 })
    const rental = createRental(db, { deviceId: device.id, startDate: '2026-12-01', endDate: '2026-12-03' }, '2026-11-24')
    expect(rental.totalPrice).toBe(37.02)
    expect(listRentals(db).find((r) => r.id === rental.id).totalPrice).toBe(37.02)
  })

  it('upgrades a version 5 file: categories made, cents made, rentals still linked', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'v5.db')
      const old = new DatabaseSync(file)
      old.exec('PRAGMA foreign_keys = ON')
      migrate(old, MIGRATIONS.filter((m) => m.version <= 5))
      const add = old.prepare('INSERT INTO devices (id, name, category, price_per_day, description, specs, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      add.run(1, 'Camera one', 'Camera', 40, 'd1', '["a"]', 1, 'u1')
      add.run(2, 'Camera two', 'camera', 12.34, 'd2', '[]', 0, '')
      add.run(3, 'Laptop one', 'Laptop', 25, '', '[]', 1, '')
      old.exec("INSERT INTO rentals (id, device_id, start_date, end_date, total_cents, created_at) VALUES ('r1', 1, '2099-01-01', '2099-01-02', 8000, 'c')")
      old.close()

      const upgraded = openDb(file)
      expect(currentVersion(upgraded)).toBeGreaterThanOrEqual(6)
      expect(upgraded.prepare('SELECT LOWER(name) AS n FROM categories ORDER BY n').all().map((c) => c.n)).toEqual(['camera', 'laptop'])
      expect(getDevice(upgraded, 1)).toMatchObject({ name: 'Camera one', pricePerDay: 40, description: 'd1', specs: ['a'], available: true })
      expect(getDevice(upgraded, 2)).toMatchObject({ pricePerDay: 12.34, available: false })
      expect(getDevice(upgraded, 1).category.toLowerCase()).toBe('camera')
      expect(getDevice(upgraded, 2).category).toBe(getDevice(upgraded, 1).category)
      expect(upgraded.prepare("SELECT updated_at FROM devices WHERE id = 1").get().updated_at).toBe('u1')
      expect(upgraded.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(upgraded.prepare('PRAGMA foreign_keys').get().foreign_keys).toBe(1)
      expect(listRentals(upgraded)[0]).toMatchObject({ id: 'r1', deviceId: 1, totalPrice: 80 })
      const indexes = upgraded.prepare('PRAGMA index_list(devices)').all()
      expect(indexes.map((i) => i.name)).toEqual(expect.arrayContaining(['devices_name_unique', 'devices_category_index']))
      expect(indexes.find((i) => i.name === 'devices_name_unique').unique).toBe(1)
      upgraded.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('a file from the very first version climbs all the way up and keeps its data', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'v1.db')
      const old = new DatabaseSync(file)
      old.exec('PRAGMA foreign_keys = ON')
      old.exec(MIGRATIONS[0].sql)
      old.exec("INSERT INTO devices (id, name, category, price_per_day) VALUES (7, 'DJI', 'Drone', 35)")
      old.exec("INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES ('r1', 7, '2099-01-01', '2099-01-03', 105.5, 'c')")
      old.close()

      const upgraded = openDb(file)
      expect(currentVersion(upgraded)).toBe(MIGRATIONS[MIGRATIONS.length - 1].version)
      expect(getDevice(upgraded, 7)).toMatchObject({ name: 'DJI', category: 'Drone', pricePerDay: 35 })
      expect(listRentals(upgraded)[0]).toMatchObject({ id: 'r1', deviceId: 7, totalPrice: 105.5, status: 'active' })
      upgraded.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
