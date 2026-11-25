import { createHash, randomBytes } from 'node:crypto'

export const SESSION_DAYS = 7

// Only a hash of the token is stored, so a copy of the database cannot be used to log in.
const hashToken = (token) => createHash('sha256').update(token).digest('hex')

// Makes a session for the user and returns the secret token (64 hex characters) for the cookie.
export function createSession(db, userId, now = Date.now()) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(now + SESSION_DAYS * 86400000).toISOString()
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    new Date(now).toISOString(),
    expires,
  )
  return token
}

// The user of a valid session, or null. An expired session is deleted on the spot.
export function findSessionUser(db, token, now = Date.now()) {
  if (typeof token !== 'string' || token === '') return null
  const row = db
    .prepare('SELECT s.expires_at, u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
    .get(hashToken(token))
  if (!row) return null
  if (row.expires_at <= new Date(now).toISOString()) {
    deleteSession(db, token)
    return null
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role }
}

export function deleteSession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(String(token)))
}

export function deleteExpiredSessions(db, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date(now).toISOString())
}
