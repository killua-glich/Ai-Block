import { createUser, findUserByEmail } from './users.js'

// Puts the built-in devices into an empty database. Does nothing when there are devices already.
// Returns how many devices it added.
export function seedDevices(db, devices) {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM devices').get().n
  if (existing > 0) return 0

  const insert = db.prepare(
    'INSERT INTO devices (id, name, category, price_per_day, description, specs, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  db.exec('BEGIN')
  try {
    for (const d of devices) {
      insert.run(d.id, d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  return devices.length
}

// Makes the first admin from an email and a password (they come from the environment).
// Does nothing when one of them is missing or when a user with that email exists already.
// Returns true when it made the admin.
export function seedAdmin(db, { email, password } = {}) {
  if (!email || !password) return false
  if (findUserByEmail(db, email)) return false
  createUser(db, { email, name: 'Administrator', password, role: 'admin' })
  return true
}
