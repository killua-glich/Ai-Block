// @vitest-environment node
// Database: schema version 5. Rentals store whole cents, and a cancelled rental always has its cancel time.
import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import devices from '../src/data/devices.js'
import { MIGRATIONS, migrate, currentVersion } from '../server/migrations.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createUser } from '../server/users.js'
import { createRental, cancelRental, listRentals } from '../server/rentals.js'
import { insertDevice, insertRental } from './db-helpers.js'

const TODAY = '2026-11-24'
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
let db

beforeEach(() => {
  db = openDb()
  seedDevices(db, devices)
})

describe('049 schema version 5', () => {
  it('is a step of its own, and rentals now have total_cents instead of total_price', () => {
    expect(MIGRATIONS.find((m) => m.version === 5)).toBeDefined()
    expect(currentVersion(db)).toBeGreaterThanOrEqual(5)
    expect(columns(db, 'rentals')).toEqual(
      ['id', 'device_id', 'user_id', 'start_date', 'end_date', 'total_cents', 'status', 'created_at', 'cancelled_at'],
    )
  })

  it('the total is a whole number of cents: no fractions and nothing negative', () => {
    const raw = (cents) =>
      db
        .prepare("INSERT INTO rentals (id, device_id, start_date, end_date, total_cents, created_at) VALUES ('x', 3, '2099-01-01', '2099-01-02', ?, 'x')")
        .run(cents)
    expect(() => raw(12.5)).toThrow()
    expect(() => raw(-1)).toThrow()
    expect(() => raw(1250)).not.toThrow()
  })

  it('a cancelled rental must have a cancel time, and an active one must not', () => {
    expect(() => insertRental(db, { id: 'a', deviceId: 3, status: 'cancelled' })).toThrow()
    expect(() => insertRental(db, { id: 'b', deviceId: 3, status: 'active', cancelledAt: '2026-11-24T10:00:00.000Z' })).toThrow()
    expect(() => insertRental(db, { id: 'c', deviceId: 3, status: 'cancelled', cancelledAt: '2026-11-24T10:00:00.000Z' })).not.toThrow()
    expect(() => insertRental(db, { id: 'd', deviceId: 4 })).not.toThrow()
  })

  it('the site still sees euros: createRental and listRentals give totalPrice in euros', () => {
    insertDevice(db, { id: 20, name: 'Odd price', category: 'Laptop', price: 12.34 })
    const rental = createRental(db, { deviceId: 20, startDate: '2026-12-01', endDate: '2026-12-03' }, TODAY)
    expect(rental.totalPrice).toBe(37.02)
    expect(db.prepare('SELECT total_cents FROM rentals WHERE id = ?').get(rental.id).total_cents).toBe(3702)
    expect(listRentals(db)[0].totalPrice).toBe(37.02)
  })

  it('a whole euro price still comes out as before', () => {
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY)
    expect(rental.totalPrice).toBe(80)
  })

  it('cancelling still works with the new rules', () => {
    const user = createUser(db, { email: 'ada@example.com', name: 'Ada', password: 'correct horse battery' })
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-10', endDate: '2026-12-12' }, TODAY, user.id)
    const cancelled = cancelRental(db, rental.id, user, TODAY)
    expect(cancelled.status).toBe('cancelled')
    expect(typeof cancelled.cancelledAt).toBe('string')
  })

  it('upgrades a version 4 file: cents, a repaired status, and nothing lost', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'v4.db')
      const old = new DatabaseSync(file)
      old.exec('PRAGMA foreign_keys = ON')
      migrate(old, MIGRATIONS.filter((m) => m.version <= 4))
      old.exec("INSERT INTO users (email, name, password_hash, role, created_at) VALUES ('a@b.c', 'A', 'x', 'user', 't')")
      old.exec("INSERT INTO devices (id, name, category, price_per_day) VALUES (3, 'Camera', 'Camera', 40)")
      const add = old.prepare(
        'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at, status, cancelled_at, user_id) VALUES (?, 3, ?, ?, ?, ?, ?, ?, ?)',
      )
      add.run('r1', '2099-01-01', '2099-01-02', 80, 'c1', 'active', null, 1)
      add.run('r2', '2099-02-01', '2099-02-02', 33.33, 'c2', 'active', null, null)
      add.run('r3', '2099-03-01', '2099-03-02', 10, 'c3', 'cancelled', null, null)
      add.run('r4', '2099-04-01', '2099-04-02', 10, 'c4', 'active', '2026-01-01T00:00:00.000Z', null)
      old.close()

      const db5 = openDb(file)
      expect(currentVersion(db5)).toBeGreaterThanOrEqual(5)
      const row = (id) => db5.prepare('SELECT * FROM rentals WHERE id = ?').get(id)
      expect(row('r1')).toMatchObject({ total_cents: 8000, status: 'active', cancelled_at: null, user_id: 1 })
      expect(row('r2').total_cents).toBe(3333)
      expect(row('r3')).toMatchObject({ status: 'cancelled', cancelled_at: 'c3' })
      expect(row('r4')).toMatchObject({ status: 'cancelled', cancelled_at: '2026-01-01T00:00:00.000Z' })
      expect(db5.prepare('SELECT COUNT(*) AS n FROM rentals').get().n).toBe(4)

      const indexes = db5.prepare('PRAGMA index_list(rentals)').all().map((i) => i.name)
      expect(indexes).toEqual(expect.arrayContaining(['rentals_device_status_dates', 'rentals_user_index']))
      expect(db5.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(() => insertRental(db5, { id: 'bad', deviceId: 3, userId: 999 })).toThrow()
      db5.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
