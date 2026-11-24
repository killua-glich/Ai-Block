// Styling: gradient buttons, a price summary, tidy date fields, focus rings and a success alert.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

function fill(start, end) {
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: start } })
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: end } })
}

describe('016 forms, buttons and summary', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('shows no summary until both dates are valid', () => {
    renderAt('/devices/1')
    expect(document.querySelector('.summary')).toBeNull()
    fill('2026-12-01', '2026-12-05')
    expect(document.querySelector('.summary')).toBeTruthy()
  })

  it('the summary lists the days and a big total in euros', () => {
    renderAt('/devices/1')
    fill('2026-12-01', '2026-12-05')
    expect(document.querySelector('.summary .summary-days')).toHaveTextContent('5 day(s)')
    expect(document.querySelector('.summary .summary-total')).toHaveTextContent('total €125')
  })

  it('renting shows a confirmation that screen readers announce', () => {
    renderAt('/devices/1')
    fill('2026-12-01', '2026-12-02')
    fireEvent.click(screen.getByRole('button', { name: /rent/i }))
    const ok = screen.getByText('Rental confirmed!')
    expect(ok).toHaveClass('success')
    expect(ok).toHaveAttribute('role', 'status')
  })

  it('primary buttons are gradient with a lift on hover and a press effect', () => {
    expect(rule('button')?.['background-image']).toContain('var(--gradient-brand)')
    expect(rule('button')?.font).toBe('inherit')
    expect(rule('button')?.transition).toBeTruthy()
    expect(rule('button:hover:not(:disabled)')?.transform).toContain('translateY')
    expect(rule('button:hover:not(:disabled)')?.['box-shadow']).toBeTruthy()
    expect(rule('button:active:not(:disabled)')?.transform).toContain('translateY')
    expect(rule('button:disabled')?.['background-image']).toBe('none')
  })

  it('the quiet button stays flat', () => {
    expect(rule('.button-ghost')?.['background-image']).toBe('none')
  })

  it('anything reached with the keyboard shows a soft ring', () => {
    const focus = rule(':focus-visible')
    expect(focus?.outline).toContain('var(--color-primary)')
    expect(focus?.['outline-offset']).toBeTruthy()
  })

  it('date fields look like the selects, labels are small caps', () => {
    const input = rule('input[type="date"]')
    expect(input?.border).toContain('var(--color-border)')
    expect(input?.['border-radius']).toContain('var(--radius-sm)')
    expect(input?.font).toBe('inherit')
    expect(rule('.rental-form label')?.['text-transform']).toBe('uppercase')
    expect(rule('.rental-form label')?.['flex-direction']).toBe('column')
    expect(rule('.rental-form button')?.['align-self']).toBe('stretch')
  })

  it('the summary is a dashed box with a large total', () => {
    expect(rule('.summary')?.border).toContain('dashed')
    expect(rule('.summary-total')?.['font-family']).toContain('var(--font-display)')
    expect(rule('.summary-total')?.['font-size']).toBeTruthy()
    expect(rule('.summary-days')?.color).toContain('var(--color-muted)')
  })

  it('messages are bold; the success message is a tinted alert', () => {
    expect(rule('.error')?.['font-weight']).toBe('600')
    const success = rule('.success')
    expect(success?.['font-weight']).toBe('700')
    expect(success?.background).toContain('var(--color-success)')
    expect(success?.['border-radius']).toContain('var(--radius-sm)')
  })
})
