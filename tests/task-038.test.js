// @vitest-environment node
// API: register, log in, log out, and who am I. The login is a cookie.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createApp } from '../server/app.js'
import { listen } from './server-world.js'

async function call(api, method, path, { body, cookie, raw } = {}) {
  const res = await fetch(api.url + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
  const text = await res.text()
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null }
}
const cookieOf = (res) => (res.headers.get('set-cookie') ?? '').split(';')[0]

let db
let api
const ada = { email: 'ada@example.com', name: 'Ada Lovelace', password: 'correct horse battery' }

beforeEach(async () => {
  db = openDb()
  seedDevices(db, devices)
  api = await listen(createApp(db))
})
afterEach(() => api.close())

const register = (body = ada) => call(api, 'POST', '/api/auth/register', { body })

describe('038 login with a cookie', () => {
  it('register makes the account, logs in at once and answers 201 with the user', async () => {
    const res = await register()
    expect(res.status).toBe(201)
    expect(res.body.user).toEqual({ id: expect.any(Number), email: 'ada@example.com', name: 'Ada Lovelace', role: 'user' })
  })

  it('the cookie is a secret token that JavaScript cannot read, valid for 7 days', async () => {
    const res = await register()
    const header = res.headers.get('set-cookie')
    expect(header).toMatch(/^sid=[0-9a-f]{64};/)
    expect(header).toContain('HttpOnly')
    expect(header).toContain('SameSite=Lax')
    expect(header).toContain('Path=/')
    expect(header).toContain('Max-Age=604800')
  })

  it('nobody can make themselves an admin through the register form', async () => {
    const res = await register({ ...ada, role: 'admin' })
    expect(res.body.user.role).toBe('user')
  })

  it('no answer ever contains the password or its hash', async () => {
    const answers = [await register(), await call(api, 'POST', '/api/auth/login', { body: ada })]
    for (const res of answers) expect(JSON.stringify(res.body)).not.toMatch(/password|scrypt|hash/i)
  })

  it('register refuses bad input with 400 and a clear message, and a taken email with 409', async () => {
    const bad = await register({ ...ada, password: 'short' })
    expect(bad).toMatchObject({ status: 400, body: { error: 'The password must have at least 8 characters.' } })
    await register()
    const taken = await register({ ...ada, email: 'ADA@example.com' })
    expect(taken).toMatchObject({ status: 409, body: { error: 'That email is already registered.' } })
  })

  it('me gives the user for the cookie, and 401 without a cookie or with a wrong one', async () => {
    const cookie = cookieOf(await register())
    expect((await call(api, 'GET', '/api/auth/me', { cookie })).body.user.email).toBe('ada@example.com')
    expect(await call(api, 'GET', '/api/auth/me')).toMatchObject({ status: 401, body: { error: 'Not logged in.' } })
    expect((await call(api, 'GET', '/api/auth/me', { cookie: 'sid=' + 'a'.repeat(64) })).status).toBe(401)
  })

  it('finds the cookie among other cookies', async () => {
    const cookie = cookieOf(await register())
    const res = await call(api, 'GET', '/api/auth/me', { cookie: `theme=dark; ${cookie}; lang=en` })
    expect(res.status).toBe(200)
  })

  it('login with the right password gives the user and a new cookie', async () => {
    await register()
    const res = await call(api, 'POST', '/api/auth/login', { body: { email: 'ADA@example.com', password: ada.password } })
    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Ada Lovelace')
    expect(cookieOf(res)).toMatch(/^sid=[0-9a-f]{64}$/)
  })

  it('login with a wrong password or an unknown email gives the same 401', async () => {
    await register()
    const wrong = await call(api, 'POST', '/api/auth/login', { body: { email: ada.email, password: 'wrong password' } })
    const unknown = await call(api, 'POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: ada.password } })
    expect(wrong).toMatchObject({ status: 401, body: { error: 'Wrong email or password.' } })
    expect(unknown).toMatchObject({ status: 401, body: { error: 'Wrong email or password.' } })
    expect(wrong.headers.get('set-cookie')).toBeNull()
  })

  it('two logins are two sessions, and logging out ends only the one you used', async () => {
    const first = cookieOf(await register())
    const second = cookieOf(await call(api, 'POST', '/api/auth/login', { body: ada }))
    expect(second).not.toBe(first)

    const out = await call(api, 'POST', '/api/auth/logout', { cookie: first })
    expect(out.status).toBe(204)
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
    expect((await call(api, 'GET', '/api/auth/me', { cookie: first })).status).toBe(401)
    expect((await call(api, 'GET', '/api/auth/me', { cookie: second })).status).toBe(200)
  })

  it('logging out without being logged in is fine', async () => {
    expect((await call(api, 'POST', '/api/auth/logout')).status).toBe(204)
  })

  it('an expired session is no login any more', async () => {
    const cookie = cookieOf(await register())
    db.prepare("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'").run()
    expect((await call(api, 'GET', '/api/auth/me', { cookie })).status).toBe(401)
  })

  it('a deleted user is logged out everywhere', async () => {
    const cookie = cookieOf(await register())
    db.prepare('DELETE FROM users').run()
    expect((await call(api, 'GET', '/api/auth/me', { cookie })).status).toBe(401)
  })

  it('broken JSON answers 400', async () => {
    const res = await call(api, 'POST', '/api/auth/login', { raw: '{nope' })
    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
  })
})
