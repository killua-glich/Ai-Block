// Bug: prices are shown in Swiss francs (CHF). They must be euros everywhere.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import devices from '../src/data/devices.js'
import { formatEuro } from '../src/data/money.js'
import RentalForm from '../src/components/RentalForm.jsx'
import { renderAt } from './helpers.jsx'
import { seedRentals } from './rentals-world.js'

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? sourceFiles(p) : [p]
  })

describe('009 prices are in euros', () => {
  it('formatEuro: whole amounts without decimals, others with two', () => {
    expect(formatEuro(25)).toBe('€25')
    expect(formatEuro(0)).toBe('€0')
    expect(formatEuro(1234)).toBe('€1234')
    expect(formatEuro(12.5)).toBe('€12.50')
    expect(formatEuro(0.1 + 0.2)).toBe('€0.30')
  })

  it('every catalog card shows its price in euros', () => {
    renderAt('/')
    expect(document.body).not.toHaveTextContent('CHF')
    expect(screen.getAllByText(/^€\d+(\.\d{2})? \/ day$/)).toHaveLength(devices.length)
    expect(screen.getByText(`€${devices[0].pricePerDay} / day`)).toBeInTheDocument()
  })

  it('the detail page shows the price in euros', () => {
    renderAt(`/devices/${devices[0].id}`)
    expect(document.body).not.toHaveTextContent('CHF')
    expect(screen.getByText(`€${devices[0].pricePerDay} / day`)).toBeInTheDocument()
  })

  describe('rental total and rentals list', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('the total in the rental form is in euros', () => {
      const device = { ...devices[0], pricePerDay: 25, available: true }
      render(<RentalForm device={device} />)
      fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-12-01' } })
      fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-12-05' } })

      expect(screen.getByText(/total €125$/)).toBeInTheDocument()
      expect(document.body).not.toHaveTextContent('CHF')
    })

    it('My rentals shows totals in euros', async () => {
      seedRentals([{ id: 'a', deviceId: devices[0].id, startDate: '2026-11-23', endDate: '2026-11-30', totalPrice: 111, createdAt: '' }])
      renderAt('/rentals')

      expect(await screen.findByText('€111')).toBeInTheDocument()
      expect(document.body).not.toHaveTextContent('CHF')
    })
  })

  it('no CHF is left in the source or in the rules for agents', () => {
    const files = [...sourceFiles('src'), 'AGENTS.md']
    const withChf = files.filter((f) => readFileSync(f, 'utf8').includes('CHF'))
    expect(withChf).toEqual([])
    expect(readFileSync('AGENTS.md', 'utf8')).toMatch(/Prices in euros/)
  })
})
