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
    totalPrice: row.total_cents / 100,
    createdAt: row.created_at,
    status: row.status,
    userId: row.user_id,
    cancelledAt: row.cancelled_at,
  }
}

export function listRentals(db, { userId } = {}) {
  const rows =
    userId === undefined
      ? db.prepare('SELECT * FROM rentals ORDER BY created_at, id').all()
      : db.prepare('SELECT * FROM rentals WHERE user_id = ? ORDER BY created_at, id').all(userId)
  return rows.map(toRental)
}

// Checks the request, works out the price and saves the rental.
// `today` is a parameter so tests can pick the day.
export function createRental(db, input, today = new Date().toISOString().slice(0, 10), userId = null) {
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
  const totalCents = Math.round(days * device.pricePerDay * 100)
  const rental = {
    id: randomUUID(),
    deviceId,
    startDate,
    endDate,
    totalPrice: totalCents / 100,
    createdAt: new Date().toISOString(),
    status: 'active',
    userId,
    cancelledAt: null,
  }
  db.prepare(
    'INSERT INTO rentals (id, device_id, start_date, end_date, total_cents, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(rental.id, rental.deviceId, rental.startDate, rental.endDate, totalCents, rental.createdAt, userId)
  return rental
}

// Cancels a rental that has not started yet. The owner may do it, and an admin. Anyone else gets "not found".
export function cancelRental(db, id, user, today = new Date().toISOString().slice(0, 10)) {
  const row = db.prepare('SELECT * FROM rentals WHERE id = ?').get(String(id))
  const isAllowed = row && (row.user_id === user.id || user.role === 'admin')
  if (!isAllowed) throw new RentalError(404, 'Rental not found')
  if (row.status === 'cancelled') throw new RentalError(409, 'This rental is already cancelled.')
  if (row.start_date <= today) throw new RentalError(409, 'A rental that has started cannot be cancelled.')

  db.prepare("UPDATE rentals SET status = 'cancelled', cancelled_at = ? WHERE id = ?").run(new Date().toISOString(), row.id)
  return toRental(db.prepare('SELECT * FROM rentals WHERE id = ?').get(row.id))
}
