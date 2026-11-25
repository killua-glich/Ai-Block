// @vitest-environment node
// Database: numbered migrations instead of one fixed schema.
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MIGRATIONS, currentVersion, migrate } from '../server/migrations.js'
import { openDb } from '../server/db.js'

const tables = (db) =>
  db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name)

describe('033 migrations', () => {
  it('the steps are numbered 1, 2, 3 ... without gaps, and each has a name and some SQL', () => {
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(1)
    MIGRATIONS.forEach((m, i) => {
      expect(m.version).toBe(i + 1)
      expect(typeof m.name).toBe('string')
      expect(m.sql.trim().length).toBeGreaterThan(10)
    })
  })

  it('openDb brings a new database to the latest version', () => {
    const db = openDb()
    expect(currentVersion(db)).toBe(MIGRATIONS[MIGRATIONS.length - 1].version)
    expect(tables(db)).toEqual(expect.arrayContaining(['devices', 'rentals']))
  })

  it('migrate on an up-to-date database changes nothing', () => {
    const db = openDb()
    const before = currentVersion(db)
    expect(migrate(db)).toBe(before)
    expect(currentVersion(db)).toBe(before)
  })

  it('upgrades a database file made before migrations existed, and keeps its data', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'old.db')
      const old = new DatabaseSync(file)
      old.exec(MIGRATIONS[0].sql)
      old.prepare('INSERT INTO devices (id, name, category, price_per_day) VALUES (1, ?, ?, ?)').run('Old camera', 'Camera', 10)
      expect(currentVersion(old)).toBe(0)
      old.close()

      const upgraded = openDb(file)
      expect(currentVersion(upgraded)).toBe(MIGRATIONS[MIGRATIONS.length - 1].version)
      expect(upgraded.prepare('SELECT name FROM devices WHERE id = 1').get().name).toBe('Old camera')
      upgraded.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('runs only the steps that are still missing', () => {
    const db = new DatabaseSync(':memory:')
    const one = { version: 1, name: 'one', sql: 'CREATE TABLE log (note TEXT); INSERT INTO log VALUES (\'one\');' }
    const two = { version: 2, name: 'two', sql: 'INSERT INTO log VALUES (\'two\');' }
    expect(migrate(db, [one])).toBe(1)
    expect(migrate(db, [one, two])).toBe(2)
    expect(db.prepare('SELECT note FROM log ORDER BY rowid').all().map((r) => r.note)).toEqual(['one', 'two'])
  })

  it('runs the steps in order, even when they are listed out of order', () => {
    const db = new DatabaseSync(':memory:')
    const one = { version: 1, name: 'one', sql: 'CREATE TABLE log (note TEXT); INSERT INTO log VALUES (\'one\');' }
    const two = { version: 2, name: 'two', sql: 'INSERT INTO log VALUES (\'two\');' }
    expect(migrate(db, [two, one])).toBe(2)
    expect(db.prepare('SELECT note FROM log ORDER BY rowid').all().map((r) => r.note)).toEqual(['one', 'two'])
  })

  it('a step that fails is undone completely and the version stays', () => {
    const db = new DatabaseSync(':memory:')
    const good = { version: 1, name: 'good', sql: 'CREATE TABLE a (x)' }
    const bad = { version: 2, name: 'bad', sql: 'CREATE TABLE b (x); THIS IS NOT SQL' }
    expect(() => migrate(db, [good, bad])).toThrow(/Migration 2 \(bad\) failed/)
    expect(currentVersion(db)).toBe(1)
    expect(tables(db)).toEqual(['a'])
  })
})
