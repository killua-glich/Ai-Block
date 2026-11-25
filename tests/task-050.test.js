// @vitest-environment node
// Database: a migration step can switch foreign keys off, to rebuild a table that other tables point to.
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { migrate, currentVersion, MIGRATIONS } from '../server/migrations.js'
import { openDb } from '../server/db.js'

const foreignKeys = (db) => db.prepare('PRAGMA foreign_keys').get().foreign_keys

// A parent table with a child that points to it, and one row in each.
const first = {
  version: 1,
  name: 'parent and child',
  sql: `
CREATE TABLE parent (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parent (id));
INSERT INTO parent VALUES (1, 'old');
INSERT INTO child VALUES (10, 1);
`,
}
const rebuild = `
CREATE TABLE parent_new (id INTEGER PRIMARY KEY, name TEXT NOT NULL, extra TEXT NOT NULL DEFAULT 'x');
INSERT INTO parent_new (id, name) SELECT id, name FROM parent;
DROP TABLE parent;
ALTER TABLE parent_new RENAME TO parent;
`

const fresh = () => {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db, [first])
  return db
}

describe('050 migrations that rebuild a table', () => {
  it('a step with foreignKeys: false can rebuild a table that another table points to', () => {
    const db = fresh()
    expect(migrate(db, [first, { version: 2, name: 'rebuild', foreignKeys: false, sql: rebuild }])).toBe(2)
    expect(db.prepare('SELECT name, extra FROM parent').all()).toEqual([{ name: 'old', extra: 'x' }])
    expect(db.prepare('SELECT parent_id FROM child').get().parent_id).toBe(1)
  })

  it('foreign keys are on again afterwards, and still protect the child table', () => {
    const db = fresh()
    migrate(db, [first, { version: 2, name: 'rebuild', foreignKeys: false, sql: rebuild }])
    expect(foreignKeys(db)).toBe(1)
    expect(() => db.prepare('INSERT INTO child VALUES (11, 999)').run()).toThrow()
  })

  it('without the flag the same rebuild fails, and nothing changes', () => {
    const db = fresh()
    expect(() => migrate(db, [first, { version: 2, name: 'rebuild', sql: rebuild }])).toThrow(/Migration 2 \(rebuild\) failed/)
    expect(currentVersion(db)).toBe(1)
    expect(db.prepare('SELECT name FROM parent').all()).toEqual([{ name: 'old' }])
  })

  it('a rebuild that leaves a row pointing nowhere is refused and undone', () => {
    const db = fresh()
    const broken = { version: 2, name: 'broken', foreignKeys: false, sql: 'DELETE FROM parent;' }
    expect(() => migrate(db, [first, broken])).toThrow(/Migration 2 \(broken\) failed/)
    expect(currentVersion(db)).toBe(1)
    expect(db.prepare('SELECT COUNT(*) AS n FROM parent').get().n).toBe(1)
    expect(foreignKeys(db)).toBe(1)
  })

  it('foreign keys come back on after a step that fails for another reason', () => {
    const db = fresh()
    const bad = { version: 2, name: 'bad', foreignKeys: false, sql: 'THIS IS NOT SQL' }
    expect(() => migrate(db, [first, bad])).toThrow(/Migration 2 \(bad\) failed/)
    expect(foreignKeys(db)).toBe(1)
  })

  it('a step without the flag leaves the setting alone', () => {
    const db = fresh()
    migrate(db, [first, { version: 2, name: 'plain', sql: 'CREATE TABLE other (x)' }])
    expect(foreignKeys(db)).toBe(1)
  })

  it('a new database still reaches the latest version, with foreign keys on', () => {
    const db = openDb()
    expect(currentVersion(db)).toBe(MIGRATIONS[MIGRATIONS.length - 1].version)
    expect(foreignKeys(db)).toBe(1)
  })
})
