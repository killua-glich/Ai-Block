// @vitest-environment node
// Accounts: the users table and the functions around it.
import { describe, it, expect, beforeEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { MIGRATIONS } from '../server/migrations.js'
import { createUser, getUser, findUserByEmail, authenticate, UserError } from '../server/users.js'
import { createRental } from '../server/rentals.js'

const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
const ok = { email: 'ada@example.com', name: 'Ada Lovelace', password: 'correct horse battery' }
let db

beforeEach(() => {
  db = openDb()
})

const failure = (fn) => {
  try {
    fn()
  } catch (err) {
    return err
  }
  return null
}

describe('036 users', () => {
  it('is migration step 3: a users table, and rentals can belong to a user', () => {
    expect(MIGRATIONS.find((m) => m.version === 3)).toBeDefined()
    expect(columns(db, 'users')).toEqual(['id', 'email', 'name', 'password_hash', 'role', 'created_at'])
    expect(columns(db, 'rentals')).toContain('user_id')
  })

  it('creates a user and returns it without the password', () => {
    const user = createUser(db, ok)
    expect(user).toEqual({ id: 1, email: 'ada@example.com', name: 'Ada Lovelace', role: 'user' })
    expect(JSON.stringify(user)).not.toMatch(/password|scrypt/)
  })

  it('stores a hash, not the password', () => {
    createUser(db, ok)
    const row = db.prepare('SELECT password_hash FROM users').get()
    expect(row.password_hash).toMatch(/^scrypt\$/)
    expect(row.password_hash).not.toContain('correct horse')
  })

  it('trims the name and the email, and can make an admin', () => {
    const user = createUser(db, { ...ok, email: '  ada@example.com ', name: '  Ada  ', role: 'admin' })
    expect(user).toMatchObject({ email: 'ada@example.com', name: 'Ada', role: 'admin' })
  })

  it('refuses a bad email, name, password or role with status 400 and a clear message', () => {
    const cases = [
      [{ ...ok, email: 'nope' }, 'Please enter a valid email address.'],
      [{ ...ok, email: undefined }, 'Please enter a valid email address.'],
      [{ ...ok, name: '   ' }, 'Please enter your name (up to 80 characters).'],
      [{ ...ok, name: 'x'.repeat(81) }, 'Please enter your name (up to 80 characters).'],
      [{ ...ok, password: 'short' }, 'The password must have at least 8 characters.'],
      [{ ...ok, password: 12345678 }, 'The password must have at least 8 characters.'],
      [{ ...ok, password: 'x'.repeat(201) }, 'The password is too long.'],
      [{ ...ok, role: 'owner' }, 'The role must be user or admin.'],
    ]
    for (const [input, message] of cases) {
      const err = failure(() => createUser(db, input))
      expect(err, message).toBeInstanceOf(UserError)
      expect(err.status).toBe(400)
      expect(err.message).toBe(message)
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
  })

  it('refuses an email that is taken, also in other letter case, with status 409', () => {
    createUser(db, ok)
    const err = failure(() => createUser(db, { ...ok, email: 'ADA@Example.com', name: 'Someone else' }))
    expect(err.status).toBe(409)
    expect(err.message).toBe('That email is already registered.')
  })

  it('getUser and findUserByEmail find a user, or give null', () => {
    const user = createUser(db, ok)
    expect(getUser(db, user.id)).toEqual(user)
    expect(getUser(db, 999)).toBeNull()
    expect(findUserByEmail(db, 'ADA@example.com')).toEqual(user)
    expect(findUserByEmail(db, 'nobody@example.com')).toBeNull()
  })

  it('authenticate gives the user for the right email and password', () => {
    const user = createUser(db, ok)
    expect(authenticate(db, 'ada@example.com', 'correct horse battery')).toEqual(user)
    expect(authenticate(db, 'ADA@EXAMPLE.COM', 'correct horse battery')).toEqual(user)
  })

  it('authenticate gives null for a wrong password and for an unknown email alike', () => {
    createUser(db, ok)
    expect(authenticate(db, 'ada@example.com', 'wrong password')).toBeNull()
    expect(authenticate(db, 'nobody@example.com', 'correct horse battery')).toBeNull()
    expect(authenticate(db, undefined, undefined)).toBeNull()
  })

  it('deleting a user keeps their rentals, now without an owner', () => {
    seedDevices(db, devices)
    const user = createUser(db, ok)
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, '2026-11-24')
    db.prepare('UPDATE rentals SET user_id = ? WHERE id = ?').run(user.id, rental.id)
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
    expect(db.prepare('SELECT user_id FROM rentals WHERE id = ?').get(rental.id).user_id).toBeNull()
  })
})
