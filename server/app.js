import express from 'express'
import { listDevices, getDevice } from './devices.js'
import { listRentals, createRental, RentalError } from './rentals.js'
import { attachUser, readCookie, setSessionCookie, clearSessionCookie, COOKIE } from './auth.js'
import { createUser, authenticate } from './users.js'
import { createSession, deleteSession } from './sessions.js'

export function createApp(db) {
  const app = express()
  app.use(express.json())
  app.use(attachUser(db))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/devices', (req, res) => {
    res.json(listDevices(db))
  })

  app.get('/api/devices/:id', (req, res) => {
    const device = getDevice(db, Number(req.params.id))
    if (!device) return res.status(404).json({ error: 'Device not found' })
    res.json(device)
  })

  app.post('/api/auth/register', (req, res) => {
    const user = createUser(db, { email: req.body?.email, name: req.body?.name, password: req.body?.password })
    setSessionCookie(res, createSession(db, user.id))
    res.status(201).json({ user })
  })

  app.post('/api/auth/login', (req, res) => {
    const user = authenticate(db, req.body?.email, req.body?.password)
    if (!user) return res.status(401).json({ error: 'Wrong email or password.' })
    setSessionCookie(res, createSession(db, user.id))
    res.json({ user })
  })

  app.post('/api/auth/logout', (req, res) => {
    const token = readCookie(req, COOKIE)
    if (token) deleteSession(db, token)
    clearSessionCookie(res)
    res.status(204).end()
  })

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not logged in.' })
    res.json({ user: req.user })
  })

  app.get('/api/rentals', (req, res) => {
    res.json(listRentals(db))
  })

  app.post('/api/rentals', (req, res) => {
    const rental = createRental(db, req.body)
    res.status(201).json(rental)
  })

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use((err, req, res, next) => {
    if (err instanceof RentalError || err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  })

  return app
}
