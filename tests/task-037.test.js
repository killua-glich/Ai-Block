// @vitest-environment node
// Accounts: sessions, the memory behind the login cookie.
import { describe, it, expect, beforeEach } from 'vitest'
import { openDb } from '../server/db.js'
import { MIGRATIONS } from '../server/migrations.js'
import { createUser } from '../server/users.js'
import { createSession, findSessionUser, deleteSession, deleteExpiredSessions, SESSION_DAYS } from '../server/sessions.js'

const DAY = 86400000
const NOW = Date.parse('2026-11-24T10:00:00.000Z')
let db
let user

beforeEach(() => {
  db = openDb()
  user = createUser(db, { email: 'ada@example.com', name: 'Ada', password: 'correct horse battery' })
})

const count = () => db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n

describe('037 sessions', () => {
  it('is migration step 4 with a sessions table', () => {
    expect(MIGRATIONS.find((m) => m.version === 4)).toBeDefined()
    const columns = db.prepare('PRAGMA table_info(sessions)').all().map((c) => c.name)
    expect(columns).toEqual(['token_hash', 'user_id', 'created_at', 'expires_at'])
  })

  it('a session lasts 7 days', () => {
    expect(SESSION_DAYS).toBe(7)
  })

  it('createSession gives a long secret token and stores only its hash', () => {
    const token = createSession(db, user.id, NOW)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    const row = db.prepare('SELECT * FROM sessions').get()
    expect(row.token_hash).not.toBe(token)
    expect(JSON.stringify(row)).not.toContain(token)
    expect(row.expires_at).toBe(new Date(NOW + 7 * DAY).toISOString())
  })

  it('every session gets its own token', () => {
    expect(createSession(db, user.id, NOW)).not.toBe(createSession(db, user.id, NOW))
    expect(count()).toBe(2)
  })

  it('findSessionUser gives the user for a valid token', () => {
    const token = createSession(db, user.id, NOW)
    expect(findSessionUser(db, token, NOW + DAY)).toEqual(user)
  })

  it('gives null for an unknown token, an empty one, or one that is not text', () => {
    createSession(db, user.id, NOW)
    for (const token of ['nope', '', undefined, null, 42]) {
      expect(findSessionUser(db, token, NOW), String(token)).toBeNull()
    }
  })

  it('gives null for an expired session and deletes it', () => {
    const token = createSession(db, user.id, NOW)
    expect(findSessionUser(db, token, NOW + 7 * DAY - 1000)).toEqual(user)
    expect(findSessionUser(db, token, NOW + 7 * DAY)).toBeNull()
    expect(count()).toBe(0)
  })

  it('deleteSession ends only that session', () => {
    const a = createSession(db, user.id, NOW)
    const b = createSession(db, user.id, NOW)
    deleteSession(db, a)
    expect(findSessionUser(db, a, NOW)).toBeNull()
    expect(findSessionUser(db, b, NOW)).toEqual(user)
  })

  it('deleteExpiredSessions clears the old ones and keeps the rest', () => {
    createSession(db, user.id, NOW - 10 * DAY)
    const fresh = createSession(db, user.id, NOW)
    deleteExpiredSessions(db, NOW)
    expect(count()).toBe(1)
    expect(findSessionUser(db, fresh, NOW)).toEqual(user)
  })

  it('deleting a user ends all their sessions', () => {
    const token = createSession(db, user.id, NOW)
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
    expect(count()).toBe(0)
    expect(findSessionUser(db, token, NOW)).toBeNull()
  })

  it('a session of one user never gives another user', () => {
    const other = createUser(db, { email: 'bob@example.com', name: 'Bob', password: 'another long password' })
    const token = createSession(db, other.id, NOW)
    expect(findSessionUser(db, token, NOW)).toEqual(other)
  })
})
