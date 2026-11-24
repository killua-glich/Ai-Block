// Styling: cards with a coloured image area, an icon per category, hover lift and entrance animation.
import { describe, it, expect } from 'vitest'
import { within } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { categoryIcon, categoryHue } from '../src/data/categories.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const categories = [...new Set(devices.map((d) => d.category))]

describe('013 category icons and cards', () => {
  it('every category has its own icon, unknown ones get a box', () => {
    const icons = categories.map(categoryIcon)
    expect(icons.every((i) => typeof i === 'string' && i.length > 0)).toBe(true)
    expect(new Set(icons).size).toBe(categories.length)
    expect(categoryIcon('Something new')).toBe('📦')
  })

  it('every category has a stable colour (hue 0 to 359)', () => {
    for (const c of categories) {
      const hue = categoryHue(c)
      expect(Number.isInteger(hue) && hue >= 0 && hue < 360, c).toBe(true)
      expect(categoryHue(c)).toBe(hue)
    }
    expect(new Set(categories.map(categoryHue)).size).toBeGreaterThanOrEqual(5)
  })

  it('each card is an article with a media area, an icon and a body', () => {
    renderAt('/')
    const cards = [...document.querySelectorAll('article.card')]
    expect(cards).toHaveLength(devices.length)

    cards.forEach((card, i) => {
      const device = devices[i]
      const media = card.querySelector('.card-media')
      expect(media).toHaveAttribute('aria-hidden', 'true')
      expect(media.style.getPropertyValue('--hue')).toBe(String(categoryHue(device.category)))
      expect(media.querySelector('.card-icon')).toHaveTextContent(categoryIcon(device.category))

      const body = card.querySelector('.card-body')
      expect(within(body).getByText(device.category)).toHaveClass('chip')
      expect(within(body).getByRole('heading', { level: 3, name: device.name })).toBeInTheDocument()
      expect(within(body).getByText(device.available ? 'Available' : 'Not available')).toHaveClass('badge')
      expect(within(body).getByRole('link', { name: 'View details' })).toHaveAttribute('href', `/devices/${device.id}`)
    })
  })

  it('cards of devices that are not available are marked', () => {
    renderAt('/')
    expect(document.querySelectorAll('.card.card-unavailable')).toHaveLength(devices.filter((d) => !d.available).length)
  })

  it('the image area is a gradient built from the category hue', () => {
    const media = rule('.card-media')
    expect(media?.background).toContain('hsl(var(--hue)')
    expect(media?.['aspect-ratio']).toBeTruthy()
    expect(media?.display).toBe('grid')
    expect(rule('.card-icon')?.['font-size']).toBeTruthy()
  })

  it('cards lift on hover and the icon tilts', () => {
    expect(rule('.card')?.overflow).toBe('hidden')
    expect(rule('.card')?.transition).toBeTruthy()
    const hover = rule('.card:hover')
    expect(hover?.transform).toContain('translateY')
    expect(hover?.['box-shadow']).toContain('var(--shadow-lg)')
    expect(rule('.card:hover .card-icon')?.transform).toContain('rotate')
  })

  it('cards fade and slide in when the page loads', () => {
    expect(rule('.card')?.animation).toContain('rise')
    const from = rule('from', '@keyframes rise')
    const to = rule('to', '@keyframes rise')
    expect(from?.opacity).toBe('0')
    expect(to?.opacity).toBe('1')
  })

  it('has styles for the body, the chip and the link', () => {
    expect(rule('.card-body')?.['flex-direction']).toBe('column')
    expect(rule('.chip')?.['text-transform']).toBe('uppercase')
    expect(rule('.chip')?.['border-radius']).toBe('999px')
    expect(rule('.view-link')).toBeDefined()
    expect(rule('.card-unavailable')?.opacity).toBeTruthy()
  })
})
