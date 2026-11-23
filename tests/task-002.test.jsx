import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import devices from '../src/data/devices.js'
import Catalog from '../src/pages/Catalog.jsx'
import { renderAt, shownPrices } from './helpers.jsx'

const originalOrder = devices.map((d) => d.id)
const sortSelect = () => screen.getAllByRole('combobox')[1]

describe('002 price sort', () => {
  it('has a second select with default, asc and desc', () => {
    renderAt('/', <Catalog />)
    const values = [...sortSelect().querySelectorAll('option')].map((o) => o.value)
    expect(values).toEqual(['default', 'asc', 'desc'])
  })

  it('sorts low to high and high to low', () => {
    renderAt('/', <Catalog />)
    fireEvent.change(sortSelect(), { target: { value: 'asc' } })
    const asc = shownPrices(screen)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    fireEvent.change(sortSelect(), { target: { value: 'desc' } })
    const desc = shownPrices(screen)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
  })

  it('default keeps the data order', () => {
    renderAt('/', <Catalog />)
    fireEvent.change(sortSelect(), { target: { value: 'desc' } })
    fireEvent.change(sortSelect(), { target: { value: 'default' } })
    expect(shownPrices(screen)).toEqual(devices.map((d) => d.pricePerDay))
  })

  it('works together with the category filter', () => {
    renderAt('/', <Catalog />)
    const category = devices[0].category
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: category } })
    fireEvent.change(sortSelect(), { target: { value: 'asc' } })
    const want = devices.filter((d) => d.category === category).map((d) => d.pricePerDay).sort((a, b) => a - b)
    expect(shownPrices(screen)).toEqual(want)
  })

  it('does not mutate the devices array', () => {
    renderAt('/', <Catalog />)
    fireEvent.change(sortSelect(), { target: { value: 'desc' } })
    expect(devices.map((d) => d.id)).toEqual(originalOrder)
  })
})
