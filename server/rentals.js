import { randomUUID } from 'node:crypto'
import { getDevice } from './devices.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/

// An error with the HTTP status the API should answer with.
export class RentalError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function toRental(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: row.total_price,
    createdAt: row.created_at,
    status: row.status,
  }
}

export function listRentals(db) {
  return db.prepare('SELECT * FROM rentals ORDER BY created_at, id').all().map(toRental)
}

// Checks the request, works out the price and saves the rental.
// `today` is a parameter so tests can pick the day.
export function createRental(db, input, today = new Date().toISOString().slice(0, 10)) {
  const { deviceId, startDate, endDate } = input ?? {}
  if (!Number.isInteger(deviceId)) throw new RentalError(400, 'deviceId must be a whole number')
  if (!DATE.test(startDate ?? '') || !DATE.test(endDate ?? '')) throw new RentalError(400, 'Dates must look like YYYY-MM-DD')
  if (endDate < startDate) throw new RentalError(400, 'End date must be after start date.')
  if (startDate < today) throw new RentalError(400, 'Start date cannot be in the past.')

  const device = getDevice(db, deviceId)
  if (!device) throw new RentalError(404, 'Device not found')
  if (!device.available) throw new RentalError(409, 'This device is currently not available.')

  const clash = db
    .prepare("SELECT 1 FROM rentals WHERE device_id = ? AND status = 'active' AND start_date <= ? AND end_date >= ?")
    .get(deviceId, endDate, startDate)
  if (clash) throw new RentalError(409, 'Those dates are already booked.')

  const days = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1
  const rental = {
    id: randomUUID(),
    deviceId,
    startDate,
    endDate,
    totalPrice: days * device.pricePerDay,
    createdAt: new Date().toISOString(),
    status: 'active',
  }
  db.prepare(
    'INSERT INTO rentals (id, device_id, start_date, end_date, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, rental.totalPrice, rental.createdAt)
  return rental
}
