// Styling: My rentals with proper tables, status chips and a friendly empty state.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { categoryIcon } from '../src/data/categories.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const seed = (rentals) => localStorage.setItem('ai-block-rentals', JSON.stringify(rentals))
const active = { id: 'a', deviceId: devices[0].id, startDate: '2026-11-23', endDate: '2026-11-30', totalPrice: 111, createdAt: '' }
const past = { id: 'b', deviceId: devices[1].id, startDate: '2026-10-01', endDate: '2026-10-03', totalPrice: 222, createdAt: '' }

describe('017 My rentals page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('has a page heading and one scrollable, classed table per section', () => {
    seed([active, past])
    renderAt('/rentals')
    expect(screen.getByRole('heading', { level: 1, name: 'My rentals' })).toBeInTheDocument()
    expect(document.querySelectorAll('.table-wrap > table.table')).toHaveLength(2)
    expect([...document.querySelectorAll('th')].map((th) => th.textContent).slice(0, 5)).toEqual(['Device', 'From', 'To', 'Status', 'Total'])
  })

  it('every row has the category icon, a status chip and a right-aligned total', () => {
    seed([active, past])
    renderAt('/rentals')
    const rows = [...document.querySelectorAll('tbody tr')]
    expect(rows).toHaveLength(2)
    expect(rows[0].querySelector('.row-icon')).toHaveTextContent(categoryIcon(devices[0].category))
    expect(rows[0].querySelector('.chip.chip-active')).toHaveTextContent('Active')
    expect(rows[1].querySelector('.chip.chip-past')).toHaveTextContent('Past')
    expect([...document.querySelectorAll('td.num')].map((td) => td.textContent)).toEqual(['€111', '€222'])
  })

  it('an empty section says None. in a muted style', () => {
    seed([active])
    renderAt('/rentals')
    expect(screen.getByText('None.')).toHaveClass('muted')
  })

  it('the empty state is a card with a link to the catalog', () => {
    renderAt('/rentals')
    expect(screen.getByText('You have no rentals yet.').closest('.empty-state')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Browse devices' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { level: 1, name: 'My rentals' })).toBeInTheDocument()
  })

  it('tables sit in a raised, scrollable card', () => {
    const wrap = rule('.table-wrap')
    expect(wrap?.['overflow-x']).toBe('auto')
    expect(wrap?.background).toContain('var(--color-surface)')
    expect(wrap?.['border-radius']).toContain('var(--radius)')
    expect(rule('.table')?.['border-collapse']).toBe('collapse')
    expect(rule('.table')?.['table-layout']).toBe('fixed')
    expect(rule('.table')?.['min-width']).toBeTruthy()
  })

  it('table cells are tidy, headers are small caps, rows react to hover', () => {
    expect(rule('.table th, .table td')?.padding).toBeTruthy()
    expect(rule('.table th')?.['text-transform']).toBe('uppercase')
    expect(rule('.table .num')?.['text-align']).toBe('right')
    expect(rule('.table tbody tr:hover')?.background).toContain('var(--color-bg)')
    expect(rule('.table tbody tr:last-child td')?.['border-bottom']).toBe('none')
  })

  it('status chips use the status colours', () => {
    expect(rule('.chip-active')?.color).toContain('var(--color-success)')
    expect(rule('.chip-past')?.color).toContain('var(--color-muted)')
    expect(rule('.muted')?.color).toContain('var(--color-muted)')
  })
})
