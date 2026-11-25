// @vitest-environment node
// Server: the entry point, and the Vite proxy that lets the web site reach the API in development.
import { describe, it, expect, afterEach } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import viteConfig from '../vite.config.js'
import { startServer } from '../server/index.js'
import { authHeaders } from './server-world.js'

const running = []
const start = async (options) => {
  const s = startServer({ port: 0, ...options })
  running.push(s)
  await once(s.server, 'listening')
  return { ...s, url: `http://127.0.0.1:${s.server.address().port}` }
}
afterEach(async () => {
  while (running.length) {
    const { server, db } = running.pop()
    await new Promise((resolve) => server.close(resolve))
    db.close()
  }
})

describe('027 server entry point', () => {
  it('starts, answers the health check and has the 14 devices', async () => {
    const { url } = await start({ dbPath: ':memory:' })
    expect(await (await fetch(`${url}/api/health`)).json()).toEqual({ ok: true })
    expect(await (await fetch(`${url}/api/devices`)).json()).toHaveLength(14)
  })

  it('makes the database folder and file when they do not exist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'deeper', 'ai-block.db')
      await start({ dbPath: file })
      expect(existsSync(file)).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('a second start with the same file does not add the devices again', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ai-block-'))
    try {
      const file = join(dir, 'ai-block.db')
      const first = await start({ dbPath: file })
      const who = await authHeaders(first)
      const rental = { deviceId: 3, startDate: '2099-03-01', endDate: '2099-03-02' }
      await fetch(`${first.url}/api/rentals`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...who }, body: JSON.stringify(rental) })
      await new Promise((resolve) => first.server.close(resolve))
      first.db.close()
      running.length = 0

      const second = await start({ dbPath: file })
      expect(await (await fetch(`${second.url}/api/devices`)).json()).toHaveLength(14)
      expect(await (await fetch(`${second.url}/api/rentals`, { headers: who })).json()).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('npm run server starts this file', () => {
    expect(JSON.parse(readFileSync('package.json', 'utf8')).scripts.server).toBe('node server/index.js')
  })

  it('the Vite dev server sends /api to the API on port 3001', () => {
    expect(viteConfig.server?.proxy?.['/api']).toBe('http://127.0.0.1:3001')
  })

  it('the database file is not committed', () => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\/?data\/$/m)
  })
})
