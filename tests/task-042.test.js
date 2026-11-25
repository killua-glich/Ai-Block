// @vitest-environment node
// Admin: the first admin comes from the environment when the server starts.
import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { once } from 'node:events'
import { openDb } from '../server/db.js'
import { seedAdmin } from '../server/seed.js'
import { createUser, findUserByEmail, authenticate } from '../server/users.js'
import { startServer } from '../server/index.js'

const admin = { email: 'admin@example.com', password: 'a long admin password' }
const running = []
afterEach(async () => {
  while (running.length) {
    const { server, db } = running.pop()
    await new Promise((resolve) => server.close(resolve))
    db.close()
  }
})

describe('042 first admin', () => {
  it('seedAdmin makes an admin that can log in', () => {
    const db = openDb()
    expect(seedAdmin(db, admin)).toBe(true)
    expect(findUserByEmail(db, admin.email)).toMatchObject({ role: 'admin', name: 'Administrator' })
    expect(authenticate(db, admin.email, admin.password)).not.toBeNull()
  })

  it('seedAdmin does nothing twice, and never changes an existing user', () => {
    const db = openDb()
    createUser(db, { email: admin.email, name: 'Existing', password: 'my own password 1' })
    expect(seedAdmin(db, admin)).toBe(false)
    expect(findUserByEmail(db, admin.email)).toMatchObject({ role: 'user', name: 'Existing' })
    expect(authenticate(db, admin.email, admin.password)).toBeNull()
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(1)
  })

  it('seedAdmin does nothing when the email or the password is missing', () => {
    const db = openDb()
    expect(seedAdmin(db, {})).toBe(false)
    expect(seedAdmin(db)).toBe(false)
    expect(seedAdmin(db, { email: admin.email })).toBe(false)
    expect(seedAdmin(db, { password: admin.password })).toBe(false)
    expect(seedAdmin(db, { email: admin.email, password: '' })).toBe(false)
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
  })

  it('a password that is too short is reported, it does not make a weak admin', () => {
    const db = openDb()
    expect(() => seedAdmin(db, { email: admin.email, password: 'short' })).toThrow(/at least 8 characters/)
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
  })

  it('startServer makes the admin from its admin option, and the admin can log in and is an admin', async () => {
    const started = startServer({ port: 0, dbPath: ':memory:', admin })
    running.push(started)
    await once(started.server, 'listening')
    const url = `http://127.0.0.1:${started.server.address().port}`

    const login = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin),
    })
    expect(login.status).toBe(200)
    const cookie = login.headers.get('set-cookie').split(';')[0]
    const me = await (await fetch(`${url}/api/auth/me`, { headers: { Cookie: cookie } })).json()
    expect(me.user.role).toBe('admin')
  })

  it('without an admin option and without environment variables no admin is made', async () => {
    const started = startServer({ port: 0, dbPath: ':memory:', admin: {} })
    running.push(started)
    await once(started.server, 'listening')
    expect(started.db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
  })

  it('docker compose hands ADMIN_EMAIL and ADMIN_PASSWORD to the api service', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8')
    const apiPart = compose.slice(compose.indexOf('\n  api:'), compose.indexOf('\nvolumes:'))
    expect(apiPart).toMatch(/ADMIN_EMAIL: \$\{ADMIN_EMAIL:-\}/)
    expect(apiPart).toMatch(/ADMIN_PASSWORD: \$\{ADMIN_PASSWORD:-\}/)
    expect(apiPart).toMatch(/- db-data:\/data/)
  })
})
