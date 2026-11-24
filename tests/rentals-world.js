// A fake rentals backend for tests, kept in step with the old localStorage store.
//
//   seedRentals(list)  the rentals that exist: in localStorage AND behind the fake /api/rentals
//   fakeApi(list)      only the fake backend (GET /api/devices, GET and POST /api/rentals)
//   savedRentals()     what the app saved: the localStorage list, or what was POSTed to the fake API
//
// Tests that use these pass both with the localStorage store and with the real API.
import { vi } from 'vitest'
import devices from '../src/data/devices.js'

const KEY = 'ai-block-rentals'
let posted = []

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })

export function fakeApi(list = []) {
  posted = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      if (url === '/api/devices') return reply(200, devices)
      if (url === '/api/rentals' && options.method === 'POST') {
        const input = JSON.parse(options.body)
        const device = devices.find((d) => d.id === input.deviceId)
        if (!device) return reply(404, { error: 'Device not found' })
        const days = Math.round((Date.parse(input.endDate) - Date.parse(input.startDate)) / 86400000) + 1
        const rental = { id: crypto.randomUUID(), ...input, totalPrice: days * device.pricePerDay, createdAt: new Date().toISOString() }
        posted.push(rental)
        return reply(201, rental)
      }
      if (url === '/api/rentals') return reply(200, [...list, ...posted])
      return reply(404, { error: 'Not found' })
    }),
  )
}

export function seedRentals(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
  fakeApi(list)
}

export function savedRentals() {
  const local = JSON.parse(localStorage.getItem(KEY) || '[]')
  return local.length > 0 ? local : posted
}
