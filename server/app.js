import express from 'express'
import { listDevices, getDevice } from './devices.js'

export function createApp(db) {
  const app = express()
  app.use(express.json())

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

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
