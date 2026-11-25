import express from 'express'
import { listDevices, getDevice } from './devices.js'
import { listRentals, createRental, RentalError } from './rentals.js'

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
