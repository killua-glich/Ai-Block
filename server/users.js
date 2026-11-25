import { hashPassword, verifyPassword } from './passwords.js'

// An error with the HTTP status the API should answer with.
export class UserError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Looks like the stored text of a real password, so a login with an unknown email takes as long as a real one.
const DUMMY_HASH = hashPassword('not a real password')

// The user as the rest of the app may see it: never the password.
function toUser(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role }
}

export function createUser(db, { email, name, password, role = 'user' }, now = new Date().toISOString()) {
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) throw new UserError(400, 'Please enter a valid email address.')
  const cleanName = typeof name === 'string' ? name.trim() : ''
  if (cleanName.length < 1 || cleanName.length > 80) throw new UserError(400, 'Please enter your name (up to 80 characters).')
  if (typeof password !== 'string' || password.length < 8) throw new UserError(400, 'The password must have at least 8 characters.')
  if (password.length > 200) throw new UserError(400, 'The password is too long.')
  if (role !== 'user' && role !== 'admin') throw new UserError(400, 'The role must be user or admin.')

  try {
    const result = db
      .prepare('INSERT INTO users (email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(email.trim(), cleanName, hashPassword(password), role, now)
    return getUser(db, Number(result.lastInsertRowid))
  } catch (err) {
    if (/UNIQUE/.test(err.message)) throw new UserError(409, 'That email is already registered.')
    throw err
  }
}

export function getUser(db, id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return row ? toUser(row) : null
}

export function findUserByEmail(db, email) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim())
  return row ? toUser(row) : null
}

// The user when the email and password are right, otherwise null (the same answer for both mistakes).
export function authenticate(db, email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim())
  const isRight = verifyPassword(password, row ? row.password_hash : DUMMY_HASH)
  return row && isRight ? toUser(row) : null
}
