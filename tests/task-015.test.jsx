// Styling: a detail page with a big image area, a price tag, spec chips and a sticky booking card.
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { categoryIcon, categoryHue } from '../src/data/categories.js'
import { formatEuro } from '../src/data/money.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const device = devices[0]

describe('015 detail page', () => {
  it('has a coloured image area with the category icon above the title', () => {
    renderAt(`/devices/${device.id}`)
    const info = document.querySelector('.detail > .detail-info')
    const media = info.querySelector('.detail-media')
    expect(media).toHaveAttribute('aria-hidden', 'true')
    expect(media.style.getPropertyValue('--hue')).toBe(String(categoryHue(device.category)))
    expect(media.querySelector('.detail-icon')).toHaveTextContent(categoryIcon(device.category))
    expect(within(info).getByRole('heading', { level: 1, name: device.name })).toBeInTheDocument()
  })

  it('the price is a tag and the specs are a list of chips', () => {
    renderAt(`/devices/${device.id}`)
    const price = screen.getByText(`${formatEuro(device.pricePerDay)} / day`)
    expect(price).toHaveClass('price')
    expect(price).toHaveClass('price-tag')
    const specs = document.querySelector('ul.specs')
    expect([...specs.querySelectorAll('li')].map((li) => li.textContent)).toEqual(device.specs)
  })

  it('the booking card holds the rental form and a heading', () => {
    renderAt(`/devices/${device.id}`)
    const booking = document.querySelector('.detail > .detail-booking')
    expect(within(booking).getByRole('heading', { level: 2, name: 'Book this device' })).toBeInTheDocument()
    expect(within(booking).getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back/i })).toHaveClass('back-link')
  })

  it('the image area is a big gradient from the category hue', () => {
    const media = rule('.detail-media')
    expect(media?.background).toContain('hsl(var(--hue)')
    expect(media?.['aspect-ratio']).toBeTruthy()
    expect(media?.['border-radius']).toContain('var(--radius)')
    expect(rule('.detail-icon')?.['font-size']).toBeTruthy()
  })

  it('the price tag is a gradient pill', () => {
    expect(rule('.price-tag')?.background).toContain('var(--gradient-brand)')
    expect(rule('.price-tag')?.['border-radius']).toBe('999px')
  })

  it('the booking card is raised and stays in view while scrolling', () => {
    const booking = rule('.detail-booking')
    expect(booking?.position).toBe('sticky')
    expect(booking?.top).toBeTruthy()
    expect(booking?.background).toContain('var(--color-surface)')
    expect(booking?.['box-shadow']).toContain('var(--shadow)')
  })

  it('two columns on a wide screen, one column on a small one', () => {
    expect(rule('.detail')?.display).toBe('grid')
    expect(rule('.detail')?.['grid-template-columns']).toMatch(/\d+fr \d+fr/)
    expect(rule('.detail', 'max-width: 800px')?.['grid-template-columns']).toBe('1fr')
    expect(rule('.detail-booking', 'max-width: 800px')?.position).toBe('static')
    expect(rule('.rental-form')?.['max-width']).toBeUndefined()
  })

  it('spec chips are rounded and the back link reacts to hover', () => {
    expect(rule('.specs')?.['list-style']).toBe('none')
    expect(rule('.specs li')?.['border-radius']).toContain('var(--radius-sm)')
    expect(rule('.back-link:hover')).toBeDefined()
  })
})
