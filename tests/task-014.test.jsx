// Styling and feature: a toolbar with labelled filters, a result count and a reset button.
import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const reset = () => screen.queryByRole('button', { name: /reset filters/i })

describe('014 catalog toolbar', () => {
  it('the two selects have visible labels and sit in a toolbar', () => {
    renderAt('/')
    const category = screen.getByLabelText(/category/i)
    const sort = screen.getByLabelText(/sort by/i)
    expect(category.tagName).toBe('SELECT')
    expect(sort.tagName).toBe('SELECT')
    expect(category.closest('.toolbar')).toBeTruthy()
    expect([...sort.querySelectorAll('option')].map((o) => o.value)).toEqual(['default', 'asc', 'desc'])
  })

  it('shows how many devices match and follows the filter', () => {
    renderAt('/')
    expect(screen.getByText(`${devices.length} devices`)).toHaveClass('result-count')

    const category = devices[0].category
    const matching = devices.filter((d) => d.category === category).length
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: category } })
    expect(screen.getByText(matching === 1 ? '1 device' : `${matching} devices`)).toHaveClass('result-count')
  })

  it('a Reset filters button appears only while a filter is on, and clears all of them', () => {
    renderAt('/')
    expect(reset()).toBeNull()

    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: devices[0].category } })
    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'desc' } })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
    expect(reset()).toBeTruthy()

    fireEvent.click(reset())
    expect(screen.getByLabelText(/category/i)).toHaveValue('All')
    expect(screen.getByLabelText(/sort by/i)).toHaveValue('default')
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByText(`${devices.length} devices`)).toBeInTheDocument()
    expect(reset()).toBeNull()
  })

  it('the empty result is a dashed card', () => {
    renderAt('/')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } })
    expect(screen.getByText('No devices found.').closest('.empty-state')).toBeTruthy()
    expect(rule('.empty-state')?.border).toContain('dashed')
    expect(rule('.empty-state')?.['text-align']).toBe('center')
  })

  it('the toolbar is a raised card with the filters on the left and the count on the right', () => {
    const toolbar = rule('.toolbar')
    expect(toolbar?.display).toBe('flex')
    expect(toolbar?.['justify-content']).toBe('space-between')
    expect(toolbar?.background).toContain('var(--color-surface)')
    expect(toolbar?.['border-radius']).toContain('var(--radius)')
    expect(rule('.toolbar-end')?.display).toBe('flex')
    expect(rule('.filters')?.['flex-wrap']).toBe('wrap')
  })

  it('labels are small caps, selects look like the rest of the page', () => {
    expect(rule('.filters label')?.['text-transform']).toBe('uppercase')
    const select = rule('select')
    expect(select?.border).toContain('var(--color-border)')
    expect(select?.['border-radius']).toContain('var(--radius-sm)')
    expect(select?.padding).toBeTruthy()
    expect(rule('.result-count')?.color).toContain('var(--color-muted)')
  })

  it('the reset button is a quiet outline button', () => {
    const ghost = rule('.button-ghost')
    expect(ghost?.background).toBe('transparent')
    expect(ghost?.color).toContain('var(--color-primary)')
    expect(rule('.button-ghost:hover:not(:disabled)')).toBeDefined()
  })

  it('on a phone the toolbar and the filters stack', () => {
    expect(rule('.container', 'max-width: 600px')?.padding).toBeTruthy()
    expect(rule('.toolbar', 'max-width: 600px')?.['flex-direction']).toBe('column')
    expect(rule('.filters', 'max-width: 600px')?.['flex-direction']).toBe('column')
  })
})
