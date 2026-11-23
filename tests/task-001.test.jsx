import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import devices from '../src/data/devices.js'
import Catalog from '../src/pages/Catalog.jsx'
import { renderAt } from './helpers.jsx'

const categories = [...new Set(devices.map((d) => d.category))]
const cards = () => screen.queryAllByRole('link', { name: /view details/i })

describe('001 category filter', () => {
  it('has a select with All plus every category from the data', () => {
    renderAt('/', <Catalog />)
    const select = screen.getAllByRole('combobox')[0]
    const options = [...select.querySelectorAll('option')].map((o) => o.textContent.trim())
    expect(options[0]).toBe('All')
    expect(options.slice(1).sort()).toEqual([...categories].sort())
  })

  it('filters by the chosen category and All shows everything', () => {
    renderAt('/', <Catalog />)
    const select = screen.getAllByRole('combobox')[0]
    for (const c of categories) {
      fireEvent.change(select, { target: { value: c } })
      expect(cards()).toHaveLength(devices.filter((d) => d.category === c).length)
    }
    fireEvent.change(select, { target: { value: 'All' } })
    expect(cards()).toHaveLength(devices.length)
  })
})
