import { findSessionUser, SESSION_DAYS } from './sessions.js'

export const COOKIE = 'sid'

// The value of one cookie from the request, or null.
export function readCookie(req, name) {
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

// HttpOnly: the page's JavaScript cannot read it. SameSite=Lax: other sites cannot send it along with a form post.
export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`)
}

// Puts the logged-in user (or null) on every request as `req.user`.
export function attachUser(db) {
  return (req, res, next) => {
    req.user = findSessionUser(db, readCookie(req, COOKIE))
    next()
  }
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' })
  next()
}
