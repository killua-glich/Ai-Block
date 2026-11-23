import { describe, it, expect } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'

describe('003 device data', () => {
  it('has at least 10 devices in at least 5 categories', () => {
    expect(devices.length).toBeGreaterThanOrEqual(10)
    expect(new Set(devices.map((d) => d.category)).size).toBeGreaterThanOrEqual(5)
  })

  it('every device has exactly the required fields and types', () => {
    const keys = ['available', 'category', 'description', 'id', 'name', 'pricePerDay', 'specs']
    for (const d of devices) {
      expect(Object.keys(d).sort()).toEqual(keys)
      expect(typeof d.id).toBe('number')
      expect(typeof d.name).toBe('string')
      expect(typeof d.pricePerDay).toBe('number')
      expect(typeof d.available).toBe('boolean')
      expect(d.specs.length).toBeGreaterThanOrEqual(3)
      expect(d.specs.length).toBeLessThanOrEqual(5)
    }
  })

  it('ids are 1..n without gaps and the first 4 devices are kept', () => {
    expect(devices.map((d) => d.id)).toEqual(devices.map((_, i) => i + 1))
    expect(devices.slice(0, 4).map((d) => d.name)).toEqual(['MacBook Pro 14"', 'iPad Air', 'Sony Alpha 7 IV', 'Google Pixel 9'])
  })

  it('at least 2 devices are not available', () => {
    expect(devices.filter((d) => !d.available).length).toBeGreaterThanOrEqual(2)
  })

  it('detail page lists specs and an availability badge', () => {
    for (const d of [devices.find((x) => x.available), devices.find((x) => !x.available)]) {
      renderAt(`/devices/${d.id}`)
      const items = screen.getAllByRole('listitem').map((li) => li.textContent)
      expect(items).toEqual(expect.arrayContaining(d.specs))
      expect(screen.getByText(d.available ? 'Available' : 'Not available')).toHaveClass('badge')
      cleanup()
    }
  })
})
