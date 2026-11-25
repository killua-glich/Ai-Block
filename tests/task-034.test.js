// @vitest-environment node
// Database: schema version 2: rental status, device update time, unique names and better indexes.
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import devices from '../src/data/devices.js'
import { MIGRATIONS, currentVersion } from '../server/migrations.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createRental, listRentals } from '../server/rentals.js'

const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
const indexes = (db, table) => db.prepare(`PRAGMA index_list(${table})`).all().map((i) => i.name)
const TODAY = '2026-11-24'

describe('034 schema version 2', () => {
  it('is a step of its own: version 2 comes after the old schema', () => {
    const step = MIGRATIONS.find((m) => m.version === 2)
    expect(step).toBeDefined()
    expect(MIGRATIONS[0].version).toBe(1)
    expect(currentVersion(openDb())).toBeGreaterThanOrEqual(2)
  })

  it('rentals get a status and a cancel time, devices get an update time', () => {
    const db = openDb()
    expect(columns(db, 'rentals')).toEqual(expect.arrayContaining(['status', 'cancelled_at']))
    expect(columns(db, 'devices')).toContain('updated_at')
  })

  it('a rental is active unless it says otherwise, and only active or cancelled are allowed', () => {
    const db = openDb()
    seedDevices(db, devices)
    const insert = (id, status) =>
      db
        .prepare('INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at, status) VALUES (?, 3, ?, ?, 10, ?, ?)')
        .run(id, '2099-01-01', '2099-01-02', '2026-11-24T10:00:00.000Z', status)
    expect(() => insert('a', 'cancelled')).not.toThrow()
    expect(() => insert('b', 'finished')).toThrow()
    db.prepare("INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES ('c', 4, '2099-01-01', '2099-01-02', 10, 'x')").run()
    expect(db.prepare("SELECT status FROM rentals WHERE id = 'c'").get().status).toBe('active')
  })

  it('two devices cannot have the same name', () => {
    const db = openDb()
    const add = (id) => db.prepare('INSERT INTO devices (id, name, category, price_per_day) VALUES (?, ?, ?, ?)').run(id, 'Same name', 'Laptop', 5)
    add(1)
    expect(() => add(2)).toThrow()
  })

  it('has the indexes the queries need, and the old rentals index is gone', () => {
    const db = openDb()
    expect(indexes(db, 'devices')).toEqual(expect.arrayContaining(['devices_name_unique', 'devices_category_index']))
    expect(indexes(db, 'rentals')).toContain('rentals_device_status_dates')
    expect(indexes(db, 'rentals')).not.toContain('rentals_device_dates')
  })

  it('rentals show their status', () => {
    const db = openDb()
    seedDevices(db, devices)
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY)
    expect(rental.status).toBe('active')
    expect(listRentals(db)[0].status).toBe('active')
  })

  it('a cancelled rental no longer blocks its dates, an active one still does', () => {
    const db = openDb()
    seedDevices(db, devices)
    const first = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-05' }, TODAY)
    expect(() => createRental(db, { deviceId: 3, startDate: '2026-12-02', endDate: '2026-12-03' }, TODAY)).toThrow(/already booked/)
    db.prepare("UPDATE rentals SET status = 'cancelled' WHERE id = ?").run(first.id)
    expect(() => createRental(db, { deviceId: 3, startDate: '2026-12-02', endDate: '2026-12-03' }, TODAY)).not.toThrow()
  })

  it('upgrades a version 1 file and keeps its rentals, which become active', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'v1.db')
      const old = new DatabaseSync(file)
      old.exec('PRAGMA foreign_keys = ON')
      old.exec(MIGRATIONS[0].sql)
      old.exec('PRAGMA user_version = 1')
      old.prepare('INSERT INTO devices (id, name, category, price_per_day) VALUES (3, ?, ?, ?)').run('Camera', 'Camera', 40)
      old.prepare("INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES ('r1', 3, '2099-01-01', '2099-01-02', 80, 'x')").run()
      old.close()

      const db = openDb(file)
      expect(currentVersion(db)).toBeGreaterThanOrEqual(2)
      expect(db.prepare("SELECT status, total_price FROM rentals WHERE id = 'r1'").get()).toEqual({ status: 'active', total_price: 80 })
      db.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
