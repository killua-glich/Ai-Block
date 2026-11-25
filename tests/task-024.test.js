// @vitest-environment node
// Database: creating and listing rentals, with every rule the form already has.
import { describe, it, expect, beforeEach } from 'vitest'
import devices from '../src/data/devices.js'
import { openDb } from '../server/db.js'
import { seedDevices } from '../server/seed.js'
import { createRental, listRentals, RentalError } from '../server/rentals.js'

const TODAY = '2026-11-24'
const camera = devices.find((d) => d.id === 3)
const unavailable = devices.find((d) => !d.available)
let db

beforeEach(() => {
  db = openDb()
  seedDevices(db, devices)
})

function failure(input) {
  try {
    createRental(db, input, TODAY)
  } catch (err) {
    return err
  }
  return null
}

describe('024 rentals in the database', () => {
  it('creates a rental with an id, the price and a time stamp', () => {
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-03' }, TODAY)
    expect(rental).toMatchObject({ deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-03', totalPrice: 3 * camera.pricePerDay })
    expect(typeof rental.id).toBe('string')
    expect(rental.id.length).toBeGreaterThan(10)
    expect(new Date(rental.createdAt).toString()).not.toBe('Invalid Date')
  })

  it('counts both the first and the last day, so one day costs one day', () => {
    const rental = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-01' }, TODAY)
    expect(rental.totalPrice).toBe(camera.pricePerDay)
  })

  it('saves the rental so that listRentals finds it', () => {
    const a = createRental(db, { deviceId: 3, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY)
    const b = createRental(db, { deviceId: 4, startDate: '2026-12-01', endDate: '2026-12-02' }, TODAY)
    expect(listRentals(db).map((r) => r.id).sort()).toEqual([a.id, b.id].sort())
    expect(listRentals(db).find((r) => r.id === a.id)).toEqual(a)
  })

  it('starts with no rentals', () => {
    expect(listRentals(db)).toEqual([])
  })

  it('refuses a device id that is not a whole number', () => {
    for (const bad of [undefined, null, 'abc', '3', 3.5]) {
      const err = failure({ deviceId: bad, startDate: '2026-12-01', endDate: '2026-12-02' })
      expect(err, String(bad)).toBeInstanceOf(RentalError)
      expect(err.status).toBe(400)
    }
    expect(failure(undefined).status).toBe(400)
  })

  it('refuses dates that are missing or written wrongly', () => {
    for (const [startDate, endDate] of [[undefined, '2026-12-02'], ['2026-12-01', undefined], ['1.12.2026', '2.12.2026'], ['2026-12-1', '2026-12-2']]) {
      expect(failure({ deviceId: 3, startDate, endDate })?.status).toBe(400)
    }
  })

  it('refuses an end date before the start date', () => {
    const err = failure({ deviceId: 3, startDate: '2026-12-05', endDate: '2026-12-01' })
    expect(err.status).toBe(400)
    expect(err.message).toBe('End date must be after start date.')
  })

  it('refuses a start date in the past, but accepts today', () => {
    const err = failure({ deviceId: 3, startDate: '2026-11-23', endDate: '2026-11-25' })
    expect(err.status).toBe(400)
    expect(err.message).toBe('Start date cannot be in the past.')
    expect(failure({ deviceId: 3, startDate: TODAY, endDate: '2026-11-25' })).toBeNull()
  })

  it('answers 404 for a device that does not exist', () => {
    const err = failure({ deviceId: 999, startDate: '2026-12-01', endDate: '2026-12-02' })
    expect(err.status).toBe(404)
    expect(err.message).toBe('Device not found')
  })

  it('answers 409 for a device that is not available', () => {
    const err = failure({ deviceId: unavailable.id, startDate: '2026-12-01', endDate: '2026-12-02' })
    expect(err.status).toBe(409)
    expect(err.message).toBe('This device is currently not available.')
  })

  it('answers 409 when the dates overlap another rental of the same device', () => {
    createRental(db, { deviceId: 3, startDate: '2026-12-10', endDate: '2026-12-14' }, TODAY)
    for (const [startDate, endDate] of [['2026-12-10', '2026-12-10'], ['2026-12-12', '2026-12-20'], ['2026-12-01', '2026-12-10'], ['2026-12-08', '2026-12-16']]) {
      const err = failure({ deviceId: 3, startDate, endDate })
      expect(err?.status, `${startDate} to ${endDate}`).toBe(409)
      expect(err.message).toBe('Those dates are already booked.')
    }
  })

  it('allows the day after, the day before and another device on the same days', () => {
    createRental(db, { deviceId: 3, startDate: '2026-12-10', endDate: '2026-12-14' }, TODAY)
    expect(failure({ deviceId: 3, startDate: '2026-12-15', endDate: '2026-12-16' })).toBeNull()
    expect(failure({ deviceId: 3, startDate: '2026-12-08', endDate: '2026-12-09' })).toBeNull()
    expect(failure({ deviceId: 4, startDate: '2026-12-10', endDate: '2026-12-14' })).toBeNull()
  })

  it('does not save a refused rental', () => {
    failure({ deviceId: 999, startDate: '2026-12-01', endDate: '2026-12-02' })
    failure({ deviceId: 3, startDate: '2026-12-05', endDate: '2026-12-01' })
    expect(listRentals(db)).toEqual([])
  })
})
