// The database is built by numbered steps. `PRAGMA user_version` remembers how many have run,
// so an old database file is upgraded step by step and keeps its data.
//
// To change the schema: add a NEW step at the end of this list. Never edit a step that has shipped.
export const MIGRATIONS = [
  {
    version: 1,
    name: 'devices and rentals',
    sql: `
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_day REAL NOT NULL CHECK (price_per_day >= 0),
  description TEXT NOT NULL DEFAULT '',
  specs TEXT NOT NULL DEFAULT '[]',
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
);

CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices (id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_price REAL NOT NULL CHECK (total_price >= 0),
  created_at TEXT NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS rentals_device_dates ON rentals (device_id, start_date, end_date);
`,
  },
  {
    version: 2,
    name: 'rental status, device update time, indexes',
    sql: `
ALTER TABLE devices ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE rentals ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
ALTER TABLE rentals ADD COLUMN cancelled_at TEXT;
CREATE UNIQUE INDEX devices_name_unique ON devices (name);
CREATE INDEX devices_category_index ON devices (category);
DROP INDEX rentals_device_dates;
CREATE INDEX rentals_device_status_dates ON rentals (device_id, status, start_date, end_date);
`,
  },
]

export function currentVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version
}

// Runs the steps that have not run yet, each one in its own transaction. Returns the new version.
export function migrate(db, migrations = MIGRATIONS) {
  const pending = migrations.filter((m) => m.version > currentVersion(db)).sort((a, b) => a.version - b.version)
  for (const step of pending) {
    db.exec('BEGIN')
    try {
      db.exec(step.sql)
      db.exec(`PRAGMA user_version = ${step.version}`)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw new Error(`Migration ${step.version} (${step.name}) failed: ${err.message}`, { cause: err })
    }
  }
  return currentVersion(db)
}
