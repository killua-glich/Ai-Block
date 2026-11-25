import { DatabaseSync } from 'node:sqlite'
import { migrate } from './migrations.js'

// Opens the database (an in-memory one when no path is given) and brings its tables up to date.
export function openDb(path = ':memory:') {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}
