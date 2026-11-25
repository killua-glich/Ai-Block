import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { openDb } from './db.js'
import { seedDevices } from './seed.js'
import { createApp } from './app.js'
import devices from '../src/data/devices.js'

// Opens the database, puts the devices in when it is empty, and starts listening.
export function startServer({ port = 3001, dbPath = 'data/ai-block.db' } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = openDb(dbPath)
  seedDevices(db, devices)
  const server = createApp(db).listen(port)
  return { server, db }
}

// `npm run server` runs this file directly.
if (import.meta.filename === process.argv[1]) {
  const port = Number(process.env.PORT) || 3001
  startServer({ port, dbPath: process.env.DB_PATH || 'data/ai-block.db' })
  console.log(`API on http://localhost:${port}`)
}
